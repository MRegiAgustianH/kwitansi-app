import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

function readCount(row: unknown): number {
  if (row && typeof row === 'object' && 'count' in row && typeof row.count === 'number') {
    return row.count;
  }
  return 0;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public db!: DatabaseSync;

  onModuleInit() {
    const dataDir = path.resolve(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'hospital.db');
    this.logger.log(`Connecting to SQLite database at: ${dbPath}`);
    this.db = new DatabaseSync(dbPath);

    this.initTables();
    this.seedDefaultData();
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
      this.logger.log('SQLite database connection closed');
    }
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tarifs (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT NOT NULL,
        category TEXT,
        sub_category1 TEXT,
        sub_category2 TEXT,
        grouping TEXT,
        price INTEGER NOT NULL DEFAULT 0,
        price_executive INTEGER NOT NULL DEFAULT 0,
        price_foreigner INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tarifs_name ON tarifs(name);
      CREATE INDEX IF NOT EXISTS idx_tarifs_category ON tarifs(category);

      CREATE TABLE IF NOT EXISTS package_presets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        package_price INTEGER NOT NULL DEFAULT 0,
        items_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        receipt_no TEXT UNIQUE NOT NULL,
        medical_record_no TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        package_name TEXT NOT NULL DEFAULT 'PAKET MCU',
        package_qty TEXT NOT NULL DEFAULT '1 pkt',
        total_amount INTEGER NOT NULL DEFAULT 0,
        receipt_date TEXT NOT NULL,
        cashier_name TEXT NOT NULL,
        notes TEXT,
        items_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_receipts_no ON receipts(receipt_no);
      CREATE INDEX IF NOT EXISTS idx_receipts_rm ON receipts(medical_record_no);
      CREATE INDEX IF NOT EXISTS idx_receipts_patient ON receipts(patient_name);
      CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(receipt_date);

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        hospital_name TEXT NOT NULL,
        ministry_name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        default_cashier TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        website TEXT,
        receipt_title TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    this.logger.log('Database tables verified/created');
  }

  private seedDefaultData() {
    // 1. Seed Hospital Settings
    const settingStmt = this.db.prepare('SELECT COUNT(*) as count FROM settings');
    const settingCount = readCount(settingStmt.get());
    if (settingCount === 0) {
      const now = new Date().toISOString();
      const insertSetting = this.db.prepare(`
        INSERT INTO settings (id, hospital_name, ministry_name, address, city, default_cashier, phone, email, website, receipt_title, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertSetting.run(
        'default',
        'KLINIK UTAMA DR. H. A. ROTINSULU CIANJUR',
        'KEMENTERIAN KESEHATAN RI',
        'Jl. Siliwangi No. 19 Cianjur, Telp 0263-261851, Website : bbkpm-bandung.org/cabang/view/cianjur, Email : bkpmcianjur@yahoo.co.id',
        'Cianjur',
        'Kasir Pendaftaran',
        '0263-261851',
        'bkpmcianjur@yahoo.co.id',
        'bbkpm-bandung.org/cabang/view/cianjur',
        'BUKTI PEMBAYARAN',
        now
      );
      this.logger.log('Hospital settings seeded successfully');
    }

    // 2. Seed Reference Tarifs from tarifs.json if empty
    const tarifStmt = this.db.prepare('SELECT COUNT(*) as count FROM tarifs');
    const tarifCount = readCount(tarifStmt.get());
    if (tarifCount === 0) {
      const possibleJsonPaths = [
        path.resolve(__dirname, '..', '..', '..', 'tarifs.json'),
        path.resolve(__dirname, '..', '..', 'data', 'tarifs.json'),
        path.resolve(process.cwd(), 'tarifs.json'),
        path.resolve(process.cwd(), '..', 'tarifs.json'),
      ];

      const jsonPath = possibleJsonPaths.find((p) => fs.existsSync(p));
      if (jsonPath) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const list = JSON.parse(raw);
        const insertTarif = this.db.prepare(`
          INSERT INTO tarifs (id, code, name, category, sub_category1, sub_category2, grouping, price, price_executive, price_foreigner, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const now = new Date().toISOString();
        for (const item of list) {
          insertTarif.run(
            crypto.randomUUID(),
            item.code || '',
            item.name,
            item.category || '',
            item.subCategory1 || '',
            item.subCategory2 || '',
            item.grouping || '',
            Number(item.price) || 0,
            Number(item.priceExecutive) || 0,
            Number(item.priceForeigner) || 0,
            now,
            now
          );
        }
        this.logger.log(`Seeded ${list.length} reference tarifs into database`);
      }
    }

    // 3. Seed Preset MCU Packages
    const presetStmt = this.db.prepare('SELECT COUNT(*) as count FROM package_presets');
    const presetCount = readCount(presetStmt.get());
    if (presetCount === 0) {
      const now = new Date().toISOString();
      const insertPreset = this.db.prepare(`
        INSERT INTO package_presets (id, name, description, package_price, items_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // Default MCU Package matching the receipt example (Rp 1.890.000)
      const mcuStandardItems = [
        { name: 'ADMINISTRASI', category: 'ADMINISTRASI', price: 15000 },
        { name: 'KLINIK MCU', category: 'POLIKLINIK', price: 50000 },
        { name: 'PEMERIKSAAN VISUS MATA', category: 'TENAGA AHLI', price: 50000 },
        { name: 'TES BUTA WARNA', category: 'TENAGA AHLI', price: 50000 },
        { name: 'THORAX 1 POSISI', category: 'RADIOLOGI', price: 115000 },
        { name: 'SPIROMETRI', category: 'TINDAKAN MEDIS', price: 150000 },
        { name: 'DARAH LENGKAP', category: 'LABORATORIUM', price: 115000 },
        { name: 'URINE LENGKAP', category: 'LABORATORIUM', price: 50000 },
        { name: 'GULA DARAH PUASA', category: 'LABORATORIUM', price: 50000 },
        { name: 'KOLESTEROL TOTAL', category: 'LABORATORIUM', price: 50000 },
        { name: 'HDL, LDL', category: 'LABORATORIUM', price: 210000 },
        { name: 'TRIGLISERIDA', category: 'LABORATORIUM', price: 50000 },
        { name: 'SGOT, SGPT', category: 'LABORATORIUM', price: 100000 },
        { name: 'KREATININ', category: 'LABORATORIUM', price: 50000 },
        { name: 'UREUM (BUN)', category: 'LABORATORIUM', price: 50000 },
        { name: 'ASAM URAT', category: 'LABORATORIUM', price: 50000 },
        { name: 'HBSAG KUALITATIF', category: 'LABORATORIUM', price: 100000 },
        { name: 'TEST NAPZA (6 PARAMETER)', category: 'LABORATORIUM', price: 200000 },
        { name: 'AUDIOMETRI', category: 'PENUNJANG MEDIS', price: 385000 },
      ];

      insertPreset.run(
        crypto.randomUUID(),
        'PAKET MCU STANDAR CIANJUR (19 PEMERIKSAAN)',
        'Paket MCU Lengkap resmi Klinik Utama Dr. H. A. Rotinsulu Cianjur sesuai kwitansi referensi',
        1890000,
        JSON.stringify(mcuStandardItems),
        now,
        now
      );

      // Package 2: MCU Dasar
      const mcuBasicItems = [
        { name: 'ADMINISTRASI', category: 'ADMINISTRASI', price: 15000 },
        { name: 'KLINIK MCU', category: 'POLIKLINIK', price: 50000 },
        { name: 'PEMERIKSAAN VISUS MATA', category: 'TENAGA AHLI', price: 50000 },
        { name: 'THORAX 1 POSISI', category: 'RADIOLOGI', price: 115000 },
        { name: 'DARAH LENGKAP', category: 'LABORATORIUM', price: 115000 },
        { name: 'URINE LENGKAP', category: 'LABORATORIUM', price: 50000 },
        { name: 'GULA DARAH SEWAKTU', category: 'LABORATORIUM', price: 50000 },
      ];
      insertPreset.run(
        crypto.randomUUID(),
        'PAKET MCU DASAR (7 PEMERIKSAAN)',
        'Paket MCU Skrining Dasar fisik, rontgen thorax, darah & urine lengkap',
        445000,
        JSON.stringify(mcuBasicItems),
        now,
        now
      );

      // Package 3: MCU Narkoba / Bebas NAPZA
      const mcuNapzaItems = [
        { name: 'ADMINISTRASI', category: 'ADMINISTRASI', price: 15000 },
        { name: 'KLINIK MCU', category: 'POLIKLINIK', price: 50000 },
        { name: 'PEMERIKSAAN NARKOBA (PAKET 6 JENIS)', category: 'LABORATORIUM', price: 200000 },
      ];
      insertPreset.run(
        crypto.randomUUID(),
        'PAKET SKRINING BEBAS NAPZA (3 ITEM)',
        'Paket pemeriksaan bebas narkoba 6 parameter + surat keterangan dokter MCU',
        265000,
        JSON.stringify(mcuNapzaItems),
        now,
        now
      );

      this.logger.log('MCU package presets seeded successfully');
    }
  }
}
