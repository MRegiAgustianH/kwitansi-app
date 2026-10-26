import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'node:crypto';

export interface TarifEntity {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory1: string;
  subCategory2: string;
  grouping: string;
  price: number;
  priceExecutive: number;
  priceForeigner: number;
  createdAt: string;
  updatedAt: string;
}
export interface ImportTarifItem {
  code?: string;
  name: string;
  category?: string;
  subCategory1?: string;
  subCategory2?: string;
  grouping?: string;
  price?: number;
  priceExecutive?: number;
  priceForeigner?: number;
}

export class ImportTarifsDto {
  mode?: 'upsert' | 'replace';
  items!: ImportTarifItem[];
}

export interface TarifRow {
  id: string;
  code: string | null;
  name: string;
  category: string | null;
  sub_category1: string | null;
  sub_category2: string | null;
  grouping: string | null;
  price: number;
  price_executive: number;
  price_foreigner: number;
  created_at: string;
  updated_at: string;
}

function mapTarifRow(row: TarifRow): TarifEntity {
  return {
    id: row.id,
    code: row.code ?? '',
    name: row.name,
    category: row.category ?? '',
    subCategory1: row.sub_category1 ?? '',
    subCategory2: row.sub_category2 ?? '',
    grouping: row.grouping ?? '',
    price: row.price,
    priceExecutive: row.price_executive,
    priceForeigner: row.price_foreigner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class TarifsService {
  constructor(private readonly database: DatabaseService) {}

  findAll(query?: { search?: string; category?: string; limit?: number; page?: number }) {
    const search = query?.search?.trim() ?? '';
    const category = query?.category?.trim() ?? '';
    const limit = Math.min(Math.max(Number(query?.limit) || 50, 1), 500);
    const page = Math.max(Number(query?.page) || 1, 1);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push('(name LIKE ? OR code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countStmt = this.database.db.prepare(
      `SELECT COUNT(*) as total FROM tarifs ${whereClause}`
    );
    const countRow = countStmt.get(...params);
    const total = countRow && typeof countRow === 'object' && 'total' in countRow && typeof countRow.total === 'number'
      ? countRow.total
      : 0;

    const listStmt = this.database.db.prepare(`
      SELECT id, code, name, category, sub_category1, sub_category2, grouping, price, price_executive, price_foreigner, created_at, updated_at
      FROM tarifs
      ${whereClause}
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `);

    const rows = listStmt.all(...params, limit, offset) as unknown as TarifRow[];

    return {
      data: rows.map(mapTarifRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  getCategories(): string[] {
    const stmt = this.database.db.prepare(`
      SELECT DISTINCT category FROM tarifs WHERE category IS NOT NULL AND category != '' ORDER BY category ASC
    `);
    const rows = stmt.all() as { category: string }[];
    return rows.map((r) => r.category);
  }

  findById(id: string): TarifEntity {
    const stmt = this.database.db.prepare(`
      SELECT id, code, name, category, sub_category1, sub_category2, grouping, price, price_executive, price_foreigner, created_at, updated_at
      FROM tarifs WHERE id = ?
    `);
    const row = stmt.get(id) as unknown as TarifRow | undefined;
    if (!row) {
      throw new NotFoundException(`Tarif dengan ID ${id} tidak ditemukan`);
    }
    return mapTarifRow(row);
  }

  create(dto: Partial<TarifEntity>): TarifEntity {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const stmt = this.database.db.prepare(`
      INSERT INTO tarifs (id, code, name, category, sub_category1, sub_category2, grouping, price, price_executive, price_foreigner, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      dto.code ?? '',
      dto.name ?? 'Pemeriksaan Baru',
      dto.category ?? '',
      dto.subCategory1 ?? '',
      dto.subCategory2 ?? '',
      dto.grouping ?? '',
      Number(dto.price) || 0,
      Number(dto.priceExecutive) || 0,
      Number(dto.priceForeigner) || 0,
      now,
      now
    );

    return this.findById(id);
  }

  update(id: string, dto: Partial<TarifEntity>): TarifEntity {
    const existing = this.findById(id);
    const now = new Date().toISOString();
    const stmt = this.database.db.prepare(`
      UPDATE tarifs
      SET code = ?, name = ?, category = ?, sub_category1 = ?, sub_category2 = ?, grouping = ?, price = ?, price_executive = ?, price_foreigner = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      dto.code !== undefined ? dto.code : existing.code,
      dto.name !== undefined ? dto.name : existing.name,
      dto.category !== undefined ? dto.category : existing.category,
      dto.subCategory1 !== undefined ? dto.subCategory1 : existing.subCategory1,
      dto.subCategory2 !== undefined ? dto.subCategory2 : existing.subCategory2,
      dto.grouping !== undefined ? dto.grouping : existing.grouping,
      dto.price !== undefined ? Number(dto.price) : existing.price,
      dto.priceExecutive !== undefined ? Number(dto.priceExecutive) : existing.priceExecutive,
      dto.priceForeigner !== undefined ? Number(dto.priceForeigner) : existing.priceForeigner,
      now,
      id
    );

    return this.findById(id);
  }

  remove(id: string) {
    this.findById(id);
    const stmt = this.database.db.prepare('DELETE FROM tarifs WHERE id = ?');
    stmt.run(id);
    return { success: true, message: `Tarif ${id} berhasil dihapus` };
  }
  importTarifs(dto: ImportTarifsDto) {
    const mode = dto.mode === 'replace' ? 'replace' : 'upsert';
    const items = Array.isArray(dto.items) ? dto.items : [];
    if (items.length === 0) {
      return { success: true, count: 0, added: 0, updated: 0 };
    }

    const now = new Date().toISOString();
    let added = 0;
    let updated = 0;

    this.database.db.exec('BEGIN TRANSACTION');
    try {
      if (mode === 'replace') {
        this.database.db.exec('DELETE FROM tarifs');
        const insertStmt = this.database.db.prepare(`
          INSERT INTO tarifs (id, code, name, category, sub_category1, sub_category2, grouping, price, price_executive, price_foreigner, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
          if (!item.name || !item.name.trim()) continue;
          insertStmt.run(
            crypto.randomUUID(),
            item.code ? String(item.code).trim() : '',
            item.name.trim(),
            item.category ? String(item.category).trim() : '',
            item.subCategory1 ? String(item.subCategory1).trim() : '',
            item.subCategory2 ? String(item.subCategory2).trim() : '',
            item.grouping ? String(item.grouping).trim() : '',
            Number(item.price) || 0,
            Number(item.priceExecutive) || 0,
            Number(item.priceForeigner) || 0,
            now,
            now
          );
          added++;
        }
      } else {
        const findByCodeStmt = this.database.db.prepare("SELECT id FROM tarifs WHERE code = ? AND code != '' LIMIT 1");
        const findByNameStmt = this.database.db.prepare('SELECT id FROM tarifs WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1');
        const updateStmt = this.database.db.prepare(`
          UPDATE tarifs
          SET code = COALESCE(NULLIF(?, ''), code),
              name = ?,
              category = CASE WHEN ? != '' THEN ? ELSE category END,
              sub_category1 = CASE WHEN ? != '' THEN ? ELSE sub_category1 END,
              sub_category2 = CASE WHEN ? != '' THEN ? ELSE sub_category2 END,
              grouping = CASE WHEN ? != '' THEN ? ELSE grouping END,
              price = ?,
              price_executive = ?,
              price_foreigner = ?,
              updated_at = ?
          WHERE id = ?
        `);
        const insertStmt = this.database.db.prepare(`
          INSERT INTO tarifs (id, code, name, category, sub_category1, sub_category2, grouping, price, price_executive, price_foreigner, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
          if (!item.name || !item.name.trim()) continue;
          const cleanName = item.name.trim();
          const cleanCode = item.code ? String(item.code).trim() : '';
          const cleanCat = item.category ? String(item.category).trim() : '';
          const cleanSub1 = item.subCategory1 ? String(item.subCategory1).trim() : '';
          const cleanSub2 = item.subCategory2 ? String(item.subCategory2).trim() : '';
          const cleanGroup = item.grouping ? String(item.grouping).trim() : '';
          const price = Number(item.price) || 0;
          const priceExec = Number(item.priceExecutive) || 0;
          const priceForeign = Number(item.priceForeigner) || 0;

          let existingId: string | null = null;
          if (cleanCode) {
            const row = findByCodeStmt.get(cleanCode) as { id: string } | undefined;
            if (row?.id) existingId = row.id;
          }
          if (!existingId) {
            const row = findByNameStmt.get(cleanName) as { id: string } | undefined;
            if (row?.id) existingId = row.id;
          }

          if (existingId) {
            updateStmt.run(
              cleanCode,
              cleanName,
              cleanCat,
              cleanCat,
              cleanSub1,
              cleanSub1,
              cleanSub2,
              cleanSub2,
              cleanGroup,
              cleanGroup,
              price,
              priceExec,
              priceForeign,
              now,
              existingId
            );
            updated++;
          } else {
            insertStmt.run(
              crypto.randomUUID(),
              cleanCode,
              cleanName,
              cleanCat,
              cleanSub1,
              cleanSub2,
              cleanGroup,
              price,
              priceExec,
              priceForeign,
              now,
              now
            );
            added++;
          }
        }
      }

      this.database.db.exec('COMMIT');
      return { success: true, count: added + updated, added, updated };
    } catch (error) {
      this.database.db.exec('ROLLBACK');
      throw error;
    }
  }
}
