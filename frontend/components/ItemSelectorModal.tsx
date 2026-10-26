'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tarif, PackageItem } from '../lib/api';
import { formatRupiahNoDecimals } from '../lib/utils';

interface ItemSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: PackageItem) => void;
  allTarifs: Tarif[];
  categories: string[];
}

export default function ItemSelectorModal({
  isOpen,
  onClose,
  onAddItem,
  allTarifs,
  categories,
}: ItemSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('PENUNJANG MEDIS');
  const [customPrice, setCustomPrice] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedCategory('');
      setCustomName('');
      setCustomPrice('');
    }
  }, [isOpen]);

  const filteredTarifs = useMemo(() => {
    return allTarifs.filter((t) => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategory || t.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [allTarifs, search, selectedCategory]);

  if (!isOpen) return null;

  const handleSelectTarif = (tarif: Tarif) => {
    onAddItem({
      name: tarif.name,
      category: tarif.category || 'PEMERIKSAAN',
      price: tarif.price,
      qty: 1,
    });
    onClose();
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onAddItem({
      name: customName.trim().toUpperCase(),
      category: customCategory || 'LAINNYA',
      price: Number(customPrice) || 0,
      qty: 1,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tambah Item Pemeriksaan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih dari 322 data tarif referensi Cianjur atau buat pemeriksaan khusus
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <span className="sr-only">Tutup</span>
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'catalog'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Katalog Tarif Referensi ({allTarifs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Item Manual / Khusus
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'catalog' ? (
          <div className="flex-1 flex flex-col min-h-0 p-6">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Ketik nama pemeriksaan (contoh: DARAH, THORAX, EKG)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  autoFocus
                />
              </div>
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Results */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 min-h-[280px]">
              {filteredTarifs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Tidak ditemukan pemeriksaan dengan kata kunci &quot;{search}&quot;.
                  <br />
                  <span className="text-xs text-slate-400 mt-1 block">
                    Gunakan tab &quot;Item Manual / Khusus&quot; jika pemeriksaan belum terdaftar di tarif.
                  </span>
                </div>
              ) : (
                filteredTarifs.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTarif(t)}
                    className="p-3 hover:bg-emerald-50/70 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-900">
                        {t.name}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {t.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {t.category}
                          </span>
                        )}
                        {t.grouping && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                            {t.grouping}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                        {formatRupiahNoDecimals(t.price)}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold group-hover:underline">
                        + Tambahkan
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 text-right text-[11px] text-slate-400">
              Menampilkan {filteredTarifs.length} dari {allTarifs.length} tarif referensi
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddCustom} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pemeriksaan / Tindakan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: AUDIOMETRI, VAKSINASI, TEST KESEHATAN JIWA"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PENUNJANG MEDIS, DOKTER SPESIALIS"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Satuan (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="Contoh: 385000"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 tabular-nums"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
              >
                Tambahkan ke Paket
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
