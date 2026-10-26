import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface HospitalSettingsEntity {
  id: string;
  hospitalName: string;
  ministryName: string;
  address: string;
  city: string;
  defaultCashier: string;
  phone: string;
  email: string;
  website: string;
  receiptTitle: string;
  updatedAt: string;
}

export interface HospitalSettingsRow {
  id: string;
  hospital_name: string;
  ministry_name: string;
  address: string;
  city: string;
  default_cashier: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  receipt_title: string;
  updated_at: string;
}

function mapSettingsRow(row: HospitalSettingsRow): HospitalSettingsEntity {
  return {
    id: row.id,
    hospitalName: row.hospital_name,
    ministryName: row.ministry_name,
    address: row.address,
    city: row.city,
    defaultCashier: row.default_cashier,
    phone: row.phone ?? '',
    email: row.email ?? '',
    website: row.website ?? '',
    receiptTitle: row.receipt_title,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly database: DatabaseService) {}

  getSettings(): HospitalSettingsEntity {
    const stmt = this.database.db.prepare(`
      SELECT id, hospital_name, ministry_name, address, city, default_cashier, phone, email, website, receipt_title, updated_at
      FROM settings
      WHERE id = 'default'
    `);
    const row = stmt.get() as unknown as HospitalSettingsRow | undefined;
    if (!row) {
      const now = new Date().toISOString();
      const insert = this.database.db.prepare(`
        INSERT INTO settings (id, hospital_name, ministry_name, address, city, default_cashier, phone, email, website, receipt_title, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
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
      return this.getSettings();
    }
    return mapSettingsRow(row);
  }

  updateSettings(dto: Partial<HospitalSettingsEntity>): HospitalSettingsEntity {
    const existing = this.getSettings();
    const now = new Date().toISOString();

    const stmt = this.database.db.prepare(`
      UPDATE settings
      SET hospital_name = ?, ministry_name = ?, address = ?, city = ?, default_cashier = ?,
          phone = ?, email = ?, website = ?, receipt_title = ?, updated_at = ?
      WHERE id = 'default'
    `);

    stmt.run(
      dto.hospitalName !== undefined ? dto.hospitalName : existing.hospitalName,
      dto.ministryName !== undefined ? dto.ministryName : existing.ministryName,
      dto.address !== undefined ? dto.address : existing.address,
      dto.city !== undefined ? dto.city : existing.city,
      dto.defaultCashier !== undefined ? dto.defaultCashier : existing.defaultCashier,
      dto.phone !== undefined ? dto.phone : existing.phone,
      dto.email !== undefined ? dto.email : existing.email,
      dto.website !== undefined ? dto.website : existing.website,
      dto.receiptTitle !== undefined ? dto.receiptTitle : existing.receiptTitle,
      now
    );

    return this.getSettings();
  }
}
