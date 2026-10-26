'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, HospitalSettings, fetchReceipts, deleteReceipt } from '../lib/api';
import { formatRupiah, formatDateIndo } from '../lib/utils';
import ReceiptPrint from './ReceiptPrint';

interface ReceiptHistoryProps {
  settings: HospitalSettings | null;
}

export default function ReceiptHistory({ settings }: ReceiptHistoryProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchReceipts({ search, page, limit: 15 });
      setReceipts(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = (r: Receipt) => {
    setSelectedReceipt(r);
    setIsPrintModalOpen(true);
  };

  const handleDelete = async (id: string, no: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kwitansi ${no}?`)) {
      try {
        await deleteReceipt(id);
        loadData();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menghapus kwitansi';
        alert(msg);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Riwayat Kwitansi MCU
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar kwitansi pembayaran MCU yang telah tersimpan di sistem
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Cari No. RM, Nama, atau No. Kwitansi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm px-3.5 py-2 border border-slate-300 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Segarkan
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold text-xs uppercase tracking-wide">
              <tr>
                <th className="py-3 px-4">No. Kwitansi</th>
                <th className="py-3 px-4">No. RM</th>
                <th className="py-3 px-4">Nama Pasien</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4 text-center">Jumlah Pemeriksaan</th>
                <th className="py-3 px-4 text-right">Total Biaya</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Memuat riwayat kwitansi...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada kwitansi yang tersimpan atau tidak cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-emerald-800">
                      {r.receiptNo}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {r.medicalRecordNo}
                    </td>
                    <td className="py-3 px-4 font-bold uppercase text-slate-900">
                      {r.patientName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDateIndo(r.receiptDate)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {r.items.length} item
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(r.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handlePrint(r)}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition-colors shadow-2xs"
                      >
                        🖨️ Cetak
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id, r.receiptNo)}
                        className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded text-xs transition-colors"
                        title="Hapus kwitansi"
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

        {/* Footer pagination info */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Total {total} kwitansi terdaftar
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Hal {page}
            </span>
            <button
              type="button"
              disabled={receipts.length < 15}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modal Cetak Ulang Kwitansi */}
      {isPrintModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="no-print px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cetak Ulang Kwitansi: {selectedReceipt.receiptNo}
                </h3>
                <p className="text-xs text-slate-500">
                  Pasien: {selectedReceipt.patientName} (RM: {selectedReceipt.medicalRecordNo})
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
                >
                  <span>🖨️</span>
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              <div className="print-area bg-white shadow-md p-6 max-w-[760px] mx-auto rounded-lg">
                <ReceiptPrint
                  settings={settings}
                  receiptNo={selectedReceipt.receiptNo}
                  medicalRecordNo={selectedReceipt.medicalRecordNo}
                  patientName={selectedReceipt.patientName}
                  packageName={selectedReceipt.packageName}
                  packageQty={selectedReceipt.packageQty}
                  totalAmount={selectedReceipt.totalAmount}
                  receiptDate={selectedReceipt.receiptDate}
                  cashierName={selectedReceipt.cashierName}
                  items={selectedReceipt.items}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
