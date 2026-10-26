import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'node:crypto';

export interface ReceiptItem {
  name: string;
  category?: string;
  price: number;
  qty?: number;
}

export interface ReceiptEntity {
  id: string;
  receiptNo: string;
  medicalRecordNo: string;
  patientName: string;
  packageName: string;
  packageQty: string;
  totalAmount: number;
  receiptDate: string;
  cashierName: string;
  notes: string;
  items: ReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptRow {
  id: string;
  receipt_no: string;
  medical_record_no: string;
  patient_name: string;
  package_name: string;
  package_qty: string;
  total_amount: number;
  receipt_date: string;
  cashier_name: string;
  notes: string | null;
  items_json: string;
  created_at: string;
  updated_at: string;
}

function parseItems(jsonStr: string): ReceiptItem[] {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapReceiptRow(row: ReceiptRow): ReceiptEntity {
  return {
    id: row.id,
    receiptNo: row.receipt_no,
    medicalRecordNo: row.medical_record_no,
    patientName: row.patient_name,
    packageName: row.package_name,
    packageQty: row.package_qty,
    totalAmount: row.total_amount,
    receiptDate: row.receipt_date,
    cashierName: row.cashier_name,
    notes: row.notes ?? '',
    items: parseItems(row.items_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class ReceiptsService {
  constructor(private readonly database: DatabaseService) {}

  generateReceiptNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(10 + Math.random() * 90);
    // Format: KWT-YYYYMMDDHHmmss (matches KWT- 20261023001301 style)
    return `KWT-${year}${month}${day}${hours}${mins}${secs}${random}`;
  }

  findAll(query?: { search?: string; startDate?: string; endDate?: string; limit?: number; page?: number }) {
    const search = query?.search?.trim() ?? '';
    const startDate = query?.startDate?.trim() ?? '';
    const endDate = query?.endDate?.trim() ?? '';
    const limit = Math.min(Math.max(Number(query?.limit) || 20, 1), 100);
    const page = Math.max(Number(query?.page) || 1, 1);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push('(receipt_no LIKE ? OR medical_record_no LIKE ? OR patient_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (startDate) {
      conditions.push('receipt_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('receipt_date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countStmt = this.database.db.prepare(
      `SELECT COUNT(*) as total FROM receipts ${whereClause}`
    );
    const countRow = countStmt.get(...params);
    const total = countRow && typeof countRow === 'object' && 'total' in countRow && typeof countRow.total === 'number'
      ? countRow.total
      : 0;

    const listStmt = this.database.db.prepare(`
      SELECT id, receipt_no, medical_record_no, patient_name, package_name, package_qty, total_amount, receipt_date, cashier_name, notes, items_json, created_at, updated_at
      FROM receipts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const rows = listStmt.all(...params, limit, offset) as unknown as ReceiptRow[];

    return {
      data: rows.map(mapReceiptRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findById(id: string): ReceiptEntity {
    const stmt = this.database.db.prepare(`
      SELECT id, receipt_no, medical_record_no, patient_name, package_name, package_qty, total_amount, receipt_date, cashier_name, notes, items_json, created_at, updated_at
      FROM receipts
      WHERE id = ?
    `);
    const row = stmt.get(id) as unknown as ReceiptRow | undefined;
    if (!row) {
      throw new NotFoundException(`Kwitansi dengan ID ${id} tidak ditemukan`);
    }
    return mapReceiptRow(row);
  }

  findByReceiptNo(receiptNo: string): ReceiptEntity {
    const stmt = this.database.db.prepare(`
      SELECT id, receipt_no, medical_record_no, patient_name, package_name, package_qty, total_amount, receipt_date, cashier_name, notes, items_json, created_at, updated_at
      FROM receipts
      WHERE receipt_no = ?
    `);
    const row = stmt.get(receiptNo) as unknown as ReceiptRow | undefined;
    if (!row) {
      throw new NotFoundException(`Kwitansi dengan nomor ${receiptNo} tidak ditemukan`);
    }
    return mapReceiptRow(row);
  }

  create(dto: {
    receiptNo?: string;
    medicalRecordNo: string;
    patientName: string;
    packageName?: string;
    packageQty?: string;
    totalAmount?: number;
    receiptDate?: string;
    cashierName?: string;
    notes?: string;
    items: ReceiptItem[];
  }): ReceiptEntity {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const receiptNo = dto.receiptNo?.trim() || this.generateReceiptNo();
    const receiptDate = dto.receiptDate || now.split('T')[0];

    // Check duplicate receipt_no
    const checkStmt = this.database.db.prepare('SELECT id FROM receipts WHERE receipt_no = ?');
    const existing = checkStmt.get(receiptNo);
    if (existing) {
      throw new ConflictException(`Nomor kwitansi ${receiptNo} sudah digunakan`);
    }

    const calculatedTotal = dto.totalAmount !== undefined
      ? Number(dto.totalAmount)
      : dto.items.reduce((acc, curr) => acc + (Number(curr.price) || 0) * (Number(curr.qty) || 1), 0);

    const stmt = this.database.db.prepare(`
      INSERT INTO receipts (
        id, receipt_no, medical_record_no, patient_name, package_name, package_qty,
        total_amount, receipt_date, cashier_name, notes, items_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      receiptNo,
      dto.medicalRecordNo,
      dto.patientName.toUpperCase(),
      dto.packageName || 'PAKET MCU',
      dto.packageQty || '1 pkt',
      calculatedTotal,
      receiptDate,
      dto.cashierName || 'Kasir Pendaftaran',
      dto.notes || '',
      JSON.stringify(dto.items || []),
      now,
      now
    );

    return this.findById(id);
  }

  update(
    id: string,
    dto: {
      receiptNo?: string;
      medicalRecordNo?: string;
      patientName?: string;
      packageName?: string;
      packageQty?: string;
      totalAmount?: number;
      receiptDate?: string;
      cashierName?: string;
      notes?: string;
      items?: ReceiptItem[];
    }
  ): ReceiptEntity {
    const existing = this.findById(id);
    const now = new Date().toISOString();

    const items = dto.items !== undefined ? dto.items : existing.items;
    const totalAmount = dto.totalAmount !== undefined
      ? Number(dto.totalAmount)
      : dto.items !== undefined
        ? dto.items.reduce((acc, curr) => acc + (Number(curr.price) || 0) * (Number(curr.qty) || 1), 0)
        : existing.totalAmount;

    const stmt = this.database.db.prepare(`
      UPDATE receipts
      SET receipt_no = ?, medical_record_no = ?, patient_name = ?, package_name = ?, package_qty = ?,
          total_amount = ?, receipt_date = ?, cashier_name = ?, notes = ?, items_json = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      dto.receiptNo !== undefined ? dto.receiptNo : existing.receiptNo,
      dto.medicalRecordNo !== undefined ? dto.medicalRecordNo : existing.medicalRecordNo,
      dto.patientName !== undefined ? dto.patientName.toUpperCase() : existing.patientName,
      dto.packageName !== undefined ? dto.packageName : existing.packageName,
      dto.packageQty !== undefined ? dto.packageQty : existing.packageQty,
      totalAmount,
      dto.receiptDate !== undefined ? dto.receiptDate : existing.receiptDate,
      dto.cashierName !== undefined ? dto.cashierName : existing.cashierName,
      dto.notes !== undefined ? dto.notes : existing.notes,
      JSON.stringify(items),
      now,
      id
    );

    return this.findById(id);
  }

  remove(id: string) {
    this.findById(id);
    const stmt = this.database.db.prepare('DELETE FROM receipts WHERE id = ?');
    stmt.run(id);
    return { success: true, message: `Kwitansi ${id} berhasil dihapus` };
  }
}
