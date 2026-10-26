import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'node:crypto';

export interface PackageItem {
  name: string;
  category?: string;
  price: number;
}

export interface PackagePresetEntity {
  id: string;
  name: string;
  description: string;
  packagePrice: number;
  items: PackageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PackagePresetRow {
  id: string;
  name: string;
  description: string | null;
  package_price: number;
  items_json: string;
  created_at: string;
  updated_at: string;
}

function parseItems(jsonStr: string): PackageItem[] {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapPackageRow(row: PackagePresetRow): PackagePresetEntity {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    packagePrice: row.package_price,
    items: parseItems(row.items_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PackagesService {
  constructor(private readonly database: DatabaseService) {}

  findAll(): PackagePresetEntity[] {
    const stmt = this.database.db.prepare(`
      SELECT id, name, description, package_price, items_json, created_at, updated_at
      FROM package_presets
      ORDER BY package_price DESC, name ASC
    `);
    const rows = stmt.all() as unknown as PackagePresetRow[];
    return rows.map(mapPackageRow);
  }

  findById(id: string): PackagePresetEntity {
    const stmt = this.database.db.prepare(`
      SELECT id, name, description, package_price, items_json, created_at, updated_at
      FROM package_presets
      WHERE id = ?
    `);
    const row = stmt.get(id) as unknown as PackagePresetRow | undefined;
    if (!row) {
      throw new NotFoundException(`Preset paket dengan ID ${id} tidak ditemukan`);
    }
    return mapPackageRow(row);
  }

  create(dto: { name: string; description?: string; packagePrice?: number; items: PackageItem[] }): PackagePresetEntity {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const calculatedPrice = dto.packagePrice !== undefined
      ? Number(dto.packagePrice)
      : dto.items.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

    const stmt = this.database.db.prepare(`
      INSERT INTO package_presets (id, name, description, package_price, items_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      dto.name,
      dto.description ?? '',
      calculatedPrice,
      JSON.stringify(dto.items || []),
      now,
      now
    );

    return this.findById(id);
  }

  update(
    id: string,
    dto: { name?: string; description?: string; packagePrice?: number; items?: PackageItem[] }
  ): PackagePresetEntity {
    const existing = this.findById(id);
    const now = new Date().toISOString();

    const items = dto.items !== undefined ? dto.items : existing.items;
    const price = dto.packagePrice !== undefined
      ? Number(dto.packagePrice)
      : dto.items !== undefined
        ? dto.items.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0)
        : existing.packagePrice;

    const stmt = this.database.db.prepare(`
      UPDATE package_presets
      SET name = ?, description = ?, package_price = ?, items_json = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      dto.name !== undefined ? dto.name : existing.name,
      dto.description !== undefined ? dto.description : existing.description,
      price,
      JSON.stringify(items),
      now,
      id
    );

    return this.findById(id);
  }

  remove(id: string) {
    this.findById(id);
    const stmt = this.database.db.prepare('DELETE FROM package_presets WHERE id = ?');
    stmt.run(id);
    return { success: true, message: `Preset paket ${id} berhasil dihapus` };
  }
}
