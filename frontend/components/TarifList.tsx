'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Tarif, deleteTarif } from '../lib/api';
import { formatRupiahNoDecimals } from '../lib/utils';
import TarifModal from './TarifModal';
import TarifImportModal from './TarifImportModal';

interface TarifListProps {
  tarifs: Tarif[];
  categories: string[];
  onTarifsUpdated?: () => void;
}

export default function TarifList({
  tarifs,
  categories,
  onTarifsUpdated,
}: TarifListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarif, setEditingTarif] = useState<Tarif | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Delete confirmation state
  const [deletingTarif, setDeletingTarif] = useState<Tarif | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback notification
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const filtered = useMemo(() => {
    return tarifs.filter((t) => {
      const matchSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || t.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [tarifs, search, selectedCategory]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const handleOpenAdd = () => {
    setEditingTarif(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Tarif) => {
    setEditingTarif(t);
    setIsModalOpen(true);
  };

  const handleSavedTarif = (saved: Tarif) => {
    setFeedback({
      type: 'success',
      message: editingTarif
        ? `Tarif "${saved.name}" berhasil diperbarui.`
        : `Tarif "${saved.name}" berhasil ditambahkan ke database.`,
    });
    onTarifsUpdated?.();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTarif) return;
    setIsDeleting(true);
    try {
      await deleteTarif(deletingTarif.id);
      setFeedback({
        type: 'success',
        message: `Tarif "${deletingTarif.name}" berhasil dihapus.`,
      });
      setDeletingTarif(null);
      onTarifsUpdated?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menghapus data tarif';
      setFeedback({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportComplete = (result: {
    count: number;
    added: number;
    updated: number;
  }) => {
    setFeedback({
      type: 'success',
      message: `Berhasil memproses ${result.count} data tarif (${result.added} tarif baru ditambahkan, ${result.updated} tarif diperbarui).`,
    });
    onTarifsUpdated?.();
  };

  const handleExportExcel = () => {
    if (tarifs.length === 0) return;

    const exportRows = (filtered.length > 0 ? filtered : tarifs).map(
      (t, idx) => ({
        NO: t.code || idx + 1,
        'NAMA TARIF': t.name,
        KELOMPOK: t.category,
        'KELOMPOK 1': t.subCategory1 || '',
        'KELOMPOK 2': t.subCategory2 || '',
        GROUPING: t.grouping || '',
        HARGA: t.price,
        'HARGA EKSEKUTIF': t.priceExecutive,
        'HARGA WNA': t.priceForeigner,
      })
    );

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Tarif');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Data_Tarif_MCU_Cianjur_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:opacity-75 ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Master Data Tarif Klinik & Rumah Sakit
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              {tarifs.length} Tarif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data acuan tindakan, laboratorium, radiologi, dan poliklinik terintegrasi dengan database lokal.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Tambah Tarif</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50/50 border border-slate-300 hover:border-emerald-300 rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span>Impor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={tarifs.length === 0}
            className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            title="Download seluruh data tarif ke format Excel (.xlsx)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari nama tindakan atau kode pemeriksaan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-white text-slate-700"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold text-xs uppercase tracking-wide">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-4">Nama Pemeriksaan</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Grouping</th>
                <th className="py-3 px-4 text-right">Tarif Reguler</th>
                <th className="py-3 px-4 text-right">Tarif Eksekutif</th>
                <th className="py-3 px-4 text-right">Tarif WNA</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada tarif yang cocok dengan kata kunci &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                paginated.map((t, idx) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{t.name}</div>
                      {t.code && (
                        <div className="text-[11px] font-mono text-slate-400">
                          Kode: {t.code}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {t.category ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                          {t.category}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {t.grouping ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                          {t.grouping}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiahNoDecimals(t.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {t.priceExecutive > 0
                        ? formatRupiahNoDecimals(t.priceExecutive)
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {t.priceForeigner > 0
                        ? formatRupiahNoDecimals(t.priceForeigner)
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Ubah tarif"
                          aria-label={`Ubah tarif ${t.name}`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingTarif(t)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Hapus tarif"
                          aria-label={`Hapus tarif ${t.name}`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, filtered.length)} dari {filtered.length} tarif
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Hal {page} dari {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <TarifModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tarif={editingTarif}
        categories={categories}
        onSaved={handleSavedTarif}
      />

      {/* Excel Import Modal */}
      <TarifImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Delete Confirmation Modal */}
      {deletingTarif && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus Tarif
              </h3>
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin menghapus data tarif{' '}
                <strong className="text-slate-900 font-semibold">
                  &quot;{deletingTarif.name}&quot;
                </strong>
                ? Tindakan ini akan menghapus tarif dari database secara permanen.
              </p>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingTarif(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 border border-slate-300 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors flex items-center space-x-1.5"
              >
                {isDeleting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Hapus Tarif</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
