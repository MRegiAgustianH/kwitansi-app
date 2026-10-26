'use client';

import React, { useState, useEffect } from 'react';
import { Tarif, createTarif, updateTarif } from '../lib/api';

interface TarifModalProps {
  isOpen: boolean;
  onClose: () => void;
  tarif: Tarif | null;
  categories: string[];
  onSaved: (saved: Tarif) => void;
}

const COMMON_GROUPINGS = [
  'ADMINISTRASI',
  'POLIKLINIK',
  'LABORATORIUM',
  'RADIOLOGI',
  'TINDAKAN MEDIS',
  'KONSULTASI',
  'LAIN-LAIN',
];

export default function TarifModal({
  isOpen,
  onClose,
  tarif,
  categories,
  onSaved,
}: TarifModalProps) {
  const isEditing = Boolean(tarif);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [grouping, setGrouping] = useState('');
  const [customGrouping, setCustomGrouping] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [priceExecutive, setPriceExecutive] = useState<number>(0);
  const [priceForeigner, setPriceForeigner] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (tarif) {
      setName(tarif.name || '');
      setCode(tarif.code || '');
      setPrice(tarif.price || 0);
      setPriceExecutive(tarif.priceExecutive || 0);
      setPriceForeigner(tarif.priceForeigner || 0);

      if (categories.includes(tarif.category)) {
        setCategory(tarif.category);
        setCustomCategory('');
      } else if (tarif.category) {
        setCategory('CUSTOM');
        setCustomCategory(tarif.category);
      } else {
        setCategory('');
        setCustomCategory('');
      }

      if (COMMON_GROUPINGS.includes(tarif.grouping)) {
        setGrouping(tarif.grouping);
        setCustomGrouping('');
      } else if (tarif.grouping) {
        setGrouping('CUSTOM');
        setCustomGrouping(tarif.grouping);
      } else {
        setGrouping('');
        setCustomGrouping('');
      }
    } else {
      setName('');
      setCode('');
      setCategory(categories[0] || '');
      setCustomCategory('');
      setGrouping(COMMON_GROUPINGS[0]);
      setCustomGrouping('');
      setPrice(0);
      setPriceExecutive(0);
      setPriceForeigner(0);
    }
    setErrorMsg('');
  }, [tarif, categories, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama tindakan atau pemeriksaan wajib diisi.');
      return;
    }

    const finalCategory =
      category === 'CUSTOM' ? customCategory.trim() : category;
    const finalGrouping =
      grouping === 'CUSTOM' ? customGrouping.trim() : grouping;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload: Partial<Tarif> = {
        name: name.trim(),
        code: code.trim(),
        category: finalCategory,
        grouping: finalGrouping,
        price: Number(price) || 0,
        priceExecutive: Number(priceExecutive) || 0,
        priceForeigner: Number(priceForeigner) || 0,
      };

      let result: Tarif;
      if (isEditing && tarif) {
        result = await updateTarif(tarif.id, payload);
      } else {
        result = await createTarif(payload);
      }

      onSaved(result);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan tarif';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tarif-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2
              id="tarif-modal-title"
              className="text-base font-bold text-slate-900"
            >
              {isEditing ? 'Ubah Data Tarif Master' : 'Tambah Tarif Master Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Perbarui informasi dan harga acuan tindakan pemeriksaan.'
                : 'Data tarif baru akan otomatis tersimpan permanen ke database lokal.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Tutup dialog"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Nama & Kode */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Nama Pemeriksaan / Tindakan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: RONTGEN THORAX PA, DARAH LENGKAP"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-medium"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kode Tarif (Opsional)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Contoh: 101, LAB-01"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              {/* Grouping */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kelompok / Grouping
                </label>
                <select
                  value={grouping}
                  onChange={(e) => setGrouping(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-white"
                >
                  {COMMON_GROUPINGS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Tulis Kelompok Baru...</option>
                </select>
                {grouping === 'CUSTOM' && (
                  <input
                    type="text"
                    value={customGrouping}
                    onChange={(e) => setCustomGrouping(e.target.value)}
                    placeholder="Nama kelompok baru"
                    className="w-full mt-1.5 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                  />
                )}
              </div>
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Kategori Layanan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-white"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="CUSTOM">+ Tulis Kategori Baru...</option>
              </select>
              {category === 'CUSTOM' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Nama kategori baru"
                  className="w-full mt-1.5 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
              )}
            </div>

            {/* Pricing Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Penetapan Tarif (Rupiah)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Tarif Reguler <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-semibold text-slate-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-8 pr-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Tarif Eksekutif
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={priceExecutive || ''}
                      onChange={(e) =>
                        setPriceExecutive(Number(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-2.5 py-1.5 text-sm font-mono text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Tarif WNA
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={priceForeigner || ''}
                      onChange={(e) =>
                        setPriceForeigner(Number(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-2.5 py-1.5 text-sm font-mono text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 border border-slate-300 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Tarif'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
