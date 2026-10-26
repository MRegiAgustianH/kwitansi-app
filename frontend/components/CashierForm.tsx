'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  HospitalSettings,
  PackagePreset,
  Tarif,
  PackageItem,
  createReceipt,
  generateReceiptNo,
} from '../lib/api';
import { formatRupiah, formatRupiahNoDecimals } from '../lib/utils';
import ReceiptPrint from './ReceiptPrint';
import ItemSelectorModal from './ItemSelectorModal';

interface CashierFormProps {
  settings: HospitalSettings | null;
  presets: PackagePreset[];
  tarifs: Tarif[];
  categories: string[];
  onReceiptSaved?: () => void;
}

export default function CashierForm({
  settings,
  presets,
  tarifs,
  categories,
  onReceiptSaved,
}: CashierFormProps) {
  // Patient Identity Form
  const [medicalRecordNo, setMedicalRecordNo] = useState('3026100346');
  const [patientName, setPatientName] = useState('REVANKA HADI PUTRA');
  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cashierName, setCashierName] = useState('Kasir Pendaftaran');
  const [packageName, setPackageName] = useState('PAKET MCU');
  const [packageQty, setPackageQty] = useState('1 pkt');
  const [notes, setNotes] = useState('');

  // Selected Items & Custom Pricing
  const [items, setItems] = useState<PackageItem[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync default cashier from settings
  useEffect(() => {
    if (settings?.defaultCashier) {
      setCashierName(settings.defaultCashier);
    }
  }, [settings]);

  // Initial load: generate receipt number & load first preset
  useEffect(() => {
    const init = async () => {
      try {
        const no = await generateReceiptNo();
        setReceiptNo(no);
      } catch {
        // Fallback
        setReceiptNo(`KWT-${Date.now()}`);
      }

      if (presets.length > 0 && items.length === 0) {
        const standard = presets.find((p) => p.name.includes('19')) || presets[0];
        setSelectedPresetId(standard.id);
        setItems(standard.items.map((it) => ({ ...it, qty: 1 })));
        setPackageName('PAKET MCU');
      }
    };
    init();
  }, [presets]);

  const handleRefreshReceiptNo = async () => {
    try {
      const no = await generateReceiptNo();
      setReceiptNo(no);
    } catch {
      setReceiptNo(`KWT-${Date.now()}`);
    }
  };

  // Load Preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setItems(preset.items.map((it) => ({ ...it, qty: 1 })));
      setPackageName('PAKET MCU');
    }
  };

  // Price adjustment handlers
  const handlePriceChange = (index: number, newPrice: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], price: Math.max(0, newPrice) };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddItem = (item: PackageItem) => {
    setItems((prev) => [...prev, item]);
  };

  // Financial summary calculations
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
  }, [items]);
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    for (const it of items) {
      const cat = it.category || 'LAINNYA';
      breakdown[cat] = (breakdown[cat] || 0) + (Number(it.price) || 0) * (Number(it.qty) || 1);
    }
    return Object.entries(breakdown).map(([category, total]) => ({ category, total }));
  }, [items]);

  // Save & Print Action
  const handleSaveAndPrint = async (triggerPrint = true) => {
    if (!medicalRecordNo.trim()) {
      setFeedback({ type: 'error', message: 'Nomor Rekam Medis (No. RM) wajib diisi' });
      return;
    }
    if (!patientName.trim()) {
      setFeedback({ type: 'error', message: 'Nama Pasien wajib diisi' });
      return;
    }
    if (items.length === 0) {
      setFeedback({ type: 'error', message: 'Pilih minimal satu item pemeriksaan untuk paket MCU' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await createReceipt({
        receiptNo,
        medicalRecordNo: medicalRecordNo.trim(),
        patientName: patientName.trim(),
        packageName,
        packageQty,
        totalAmount,
        receiptDate,
        cashierName,
        notes,
        items,
      });

      setFeedback({
        type: 'success',
        message: `Kwitansi ${receiptNo} berhasil disimpan ke sistem!`,
      });

      if (onReceiptSaved) {
        onReceiptSaved();
      }

      if (triggerPrint) {
        setTimeout(() => {
          window.print();
        }, 100);
      }

      // Generate next receipt number for next transaction
      const nextNo = await generateReceiptNo();
      setReceiptNo(nextNo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kwitansi';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh formulir?')) {
      setMedicalRecordNo('');
      setPatientName('');
      setNotes('');
      const standard = presets.find((p) => p.name.includes('19')) || presets[0];
      if (standard) {
        setSelectedPresetId(standard.id);
        setItems(standard.items.map((it) => ({ ...it, qty: 1 })));
      } else {
        setItems([]);
      }
      handleRefreshReceiptNo();
      setFeedback(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`no-print p-4 rounded-lg flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="font-bold">{feedback.type === 'success' ? '✓' : '⚠'}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid: Form Kasir (Kiri) & Live Preview (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Formulir Kasir (7 cols) */}
        <div className="no-print lg:col-span-7 space-y-6">
          {/* Card 1: Identitas Pasien */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>1. Identitas Pasien & Kwitansi</span>
              </h2>
              <span className="text-[11px] font-medium text-slate-500">
                Input Manual Petugas Kasir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Rekam Medis (No. RM) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 3026100346"
                  value={medicalRecordNo}
                  onChange={(e) => setMedicalRecordNo(e.target.value)}
                  className="w-full text-sm font-mono px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pasien *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: REVANKA HADI PUTRA"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value.toUpperCase())}
                  className="w-full text-sm font-semibold px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Kwitansi (Auto)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="flex-1 text-sm font-mono px-3.5 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    title="Buat nomor baru"
                    onClick={handleRefreshReceiptNo}
                    className="px-3 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
                  >
                    ↻ Baru
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Kwitansi
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petugas Kasir
                </label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satuan Kuantitas Paket
                </label>
                <input
                  type="text"
                  value={packageQty}
                  onChange={(e) => setPackageQty(e.target.value)}
                  placeholder="1 pkt"
                  className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Preset Paket MCU & Item Pemeriksaan */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>2. Rincian Pemeriksaan & Penyesuaian Harga</span>
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Preset:</span>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="">-- Pilih Preset Paket --</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatRupiahNoDecimals(p.packagePrice)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notification notice per user requirement */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Ketentuan Cetak Kwitansi:</span> Harga satuan di bawah dapat disesuaikan sesuka kasir. Pada kwitansi cetak fisik, harga satuan tidak akan dicetak satu per satu, melainkan langsung terakumulasi sebagai{' '}
              <span className="font-bold underline">Total Harga Paket</span> sesuai standar kwitansi RS.
            </div>

            {/* Examination Items Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="max-h-[380px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center font-bold">No</th>
                      <th className="py-2 px-3 font-bold">Pemeriksaan</th>
                      <th className="py-2 px-3 w-40 text-right font-bold">Harga Satuan (Rp)</th>
                      <th className="py-2 px-2 w-10 text-center font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Belum ada item pemeriksaan dalam paket.
                          <br />
                          Pilih preset paket di atas atau klik tombol &quot;+ Tambah Pemeriksaan&quot;.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-800">{item.name}</div>
                            {item.category && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                {item.category}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={item.price}
                              onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                              className="w-32 text-right text-xs font-mono font-bold px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              title="Hapus pemeriksaan ini"
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons to Add Items */}
              <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-600 font-medium">
                  Total {items.length} item pemeriksaan
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    + Tambah Pemeriksaan (322 Tarif)
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Highlight Breakdown (Web App Highlight) */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                <span>Highlight Rincian Harga Paket MCU</span>
                <span className="text-slate-500 font-normal">Internal Kasir</span>
              </div>

              {/* Category Breakdown Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {categoryBreakdown.map((b) => (
                  <div key={b.category} className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500 truncate font-medium">
                      {b.category}
                    </div>
                    <div className="font-mono font-bold text-slate-800 text-xs">
                      {formatRupiahNoDecimals(b.total)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total Display */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Biaya Paket:</div>
                  <div className="text-xl font-extrabold text-emerald-800 font-mono tabular-nums">
                    {formatRupiah(totalAmount)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    {items.length} Pemeriksaan Termasuk
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Reset Formulir
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveAndPrint(false)}
                  className="px-4 py-2 border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-semibold rounded-lg transition-colors"
                >
                  Simpan Saja
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveAndPrint(true)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center space-x-2"
                >
                  <span>🖨️</span>
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Cetak Kwitansi'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Live Preview Kwitansi Cetak (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="no-print flex items-center justify-between px-1">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Pratinjau Kwitansi Cetak Resmi
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
            >
              Cetak Pratinjau
            </button>
          </div>

          {/* Paper Canvas Container */}
          <div className="print-area bg-white rounded-xl shadow-md border border-slate-300 p-4 sm:p-6 overflow-hidden">
            <ReceiptPrint
              settings={settings}
              receiptNo={receiptNo}
              medicalRecordNo={medicalRecordNo}
              patientName={patientName}
              packageName={packageName}
              packageQty={packageQty}
              totalAmount={totalAmount}
              receiptDate={receiptDate}
              cashierName={cashierName}
              items={items}
            />
          </div>
        </div>
      </div>

      {/* Item Selector Modal */}
      <ItemSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddItem={handleAddItem}
        allTarifs={tarifs}
        categories={categories}
      />
    </div>
  );
}
