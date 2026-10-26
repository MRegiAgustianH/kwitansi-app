'use client';

import React, { useState } from 'react';
import { PackagePreset, Tarif, createPackage, deletePackage } from '../lib/api';
import { formatRupiah, formatRupiahNoDecimals } from '../lib/utils';
import ItemSelectorModal from './ItemSelectorModal';

interface PackagePresetManagerProps {
  presets: PackagePreset[];
  allTarifs: Tarif[];
  categories: string[];
  onRefreshPresets: () => void;
}

export default function PackagePresetManager({
  presets,
  allTarifs,
  categories,
  onRefreshPresets,
}: PackagePresetManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<{ name: string; category?: string; price: number }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalCalculated = items.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (items.length === 0) {
      alert('Pilih minimal 1 pemeriksaan untuk paket ini');
      return;
    }

    setSubmitting(true);
    try {
      await createPackage({
        name: name.trim().toUpperCase(),
        description: description.trim(),
        packagePrice: totalCalculated,
        items,
      });
      setName('');
      setDescription('');
      setItems([]);
      setIsCreating(false);
      onRefreshPresets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan preset';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, presetName: string) => {
    if (confirm(`Hapus preset "${presetName}"?`)) {
      try {
        await deletePackage(id);
        onRefreshPresets();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menghapus preset';
        alert(msg);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Kelola Preset Paket MCU
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar template paket pemeriksaan MCU agar kasir dapat memilih paket secara instan
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-xs"
        >
          {isCreating ? 'Tutup Form' : '+ Buat Preset Baru'}
        </button>
      </div>

      {/* Form Buat Preset Baru */}
      {isCreating && (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-xs border border-emerald-300 p-6 space-y-4">
          <h3 className="text-sm font-bold text-emerald-900 border-b border-emerald-100 pb-2">
            Form Tambah Preset Paket MCU
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Preset Paket *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PAKET MCU EKSEKUTIF LENGKAP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan / Deskripsi
              </label>
              <input
                type="text"
                placeholder="Contoh: Paket MCU untuk calon karyawan & skrining tahunan"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Items in Preset */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">
                Item Pemeriksaan dalam Paket ({items.length} item)
              </label>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
              >
                + Tambah Item dari Katalog Tarif
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
              {items.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  Belum ada pemeriksaan ditambahkan. Klik &quot;+ Tambah Item dari Katalog Tarif&quot;.
                </div>
              ) : (
                items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-medium text-slate-800">
                      {idx + 1}. {it.name}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-slate-700 font-semibold">
                        {formatRupiahNoDecimals(it.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 font-bold hover:bg-rose-50 px-1 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 text-right text-xs font-bold text-emerald-800">
              Total Harga Paket: {formatRupiah(totalCalculated)}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Preset'}
            </button>
          </div>
        </form>
      )}

      {/* Preset List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    {preset.items.length} Pemeriksaan
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2 leading-tight">
                    {preset.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(preset.id, preset.name)}
                  className="text-slate-400 hover:text-rose-600 text-xs p-1"
                  title="Hapus Preset"
                >
                  ✕
                </button>
              </div>

              {preset.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {preset.description}
                </p>
              )}

              {/* Items Preview */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Daftar Pemeriksaan:
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs text-slate-700">
                  {preset.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="truncate pr-2">• {it.name}</span>
                      <span className="font-mono text-slate-500 shrink-0">
                        {formatRupiahNoDecimals(it.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Harga Total:</div>
                <div className="text-base font-extrabold text-emerald-800 font-mono">
                  {formatRupiah(preset.packagePrice)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ItemSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddItem={(it) => setItems((prev) => [...prev, it])}
        allTarifs={allTarifs}
        categories={categories}
      />
    </div>
  );
}
