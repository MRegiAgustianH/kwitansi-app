'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Tarif, importTarifs } from '../lib/api';
import { formatRupiahNoDecimals } from '../lib/utils';

interface TarifImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: { count: number; added: number; updated: number }) => void;
}

interface ParsedTarifRow {
  code: string;
  name: string;
  category: string;
  subCategory1: string;
  subCategory2: string;
  grouping: string;
  price: number;
  priceExecutive: number;
  priceForeigner: number;
}

function normalizeHeader(h: string): string {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/[_\-\s]+/g, ' ');
}

export default function TarifImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: TarifImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTarifRow[]>([]);
  const [sheetName, setSheetName] = useState<string>('');
  const [mode, setMode] = useState<'upsert' | 'replace'>('upsert');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setParsedRows([]);
      setSheetName('');
      setMode('upsert');
      setErrorMsg('');
      setIsProcessing(false);
      setIsParsing(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    await processFile(selected);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    await processFile(dropped);
  };

  const processFile = async (selected: File) => {
    setErrorMsg('');
    setIsParsing(true);
    setFile(selected);

    try {
      const buffer = await selected.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
      }

      setSheetName(firstSheetName);
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
      });

      if (rawRows.length === 0) {
        throw new Error('Sheet Excel kosong atau tidak memiliki baris data.');
      }

      // Detect header keys
      const sample = rawRows[0];
      const keys = Object.keys(sample);

      const findKey = (aliases: string[]) => {
        return (
          keys.find((k) => {
            const norm = normalizeHeader(k);
            return aliases.some((a) => norm === a || norm.includes(a));
          }) || ''
        );
      };

      const nameKey = findKey([
        'nama tarif',
        'nama pemeriksaan',
        'nama tindakan',
        'tindakan',
        'pemeriksaan',
        'nama',
        'item',
      ]);
      const codeKey = findKey(['no', 'kode', 'code', 'nomor']);
      const catKey = findKey(['kelompok', 'kategori', 'category']);
      const sub1Key = findKey(['kelompok 1', 'sub kategori 1', 'subkelompok 1']);
      const sub2Key = findKey(['kelompok 2', 'sub kategori 2', 'subkelompok 2']);
      const groupKey = findKey(['grouping', 'grup', 'kelompok']);
      const priceKey = findKey([
        'harga',
        'tarif',
        'tarif reguler',
        'harga reguler',
        'reguler',
      ]);
      const priceExecKey = findKey([
        'harga eksekutif',
        'tarif eksekutif',
        'eksekutif',
        'executive',
      ]);
      const priceForeignKey = findKey([
        'harga wna',
        'tarif wna',
        'wna',
        'foreigner',
      ]);

      if (!nameKey) {
        throw new Error(
          'Kolom Nama Tindakan / Pemeriksaan tidak ditemukan dalam file Excel. Pastikan terdapat kolom "NAMA TARIF" atau "NAMA PEMERIKSAAN".'
        );
      }

      const parsed: ParsedTarifRow[] = [];
      for (const row of rawRows) {
        const rawName = String(row[nameKey] ?? '').trim();
        if (!rawName) continue;

        const codeVal = codeKey ? String(row[codeKey] ?? '').trim() : '';
        const catVal = catKey ? String(row[catKey] ?? '').trim() : '';
        const sub1Val = sub1Key ? String(row[sub1Key] ?? '').trim() : '';
        const sub2Val = sub2Key ? String(row[sub2Key] ?? '').trim() : '';
        const groupVal = groupKey ? String(row[groupKey] ?? '').trim() : '';

        const parsePrice = (v: unknown) => {
          if (typeof v === 'number') return v;
          if (!v) return 0;
          const clean = String(v).replace(/[^0-9.-]/g, '');
          return Number(clean) || 0;
        };

        const priceVal = priceKey ? parsePrice(row[priceKey]) : 0;
        const priceExecVal = priceExecKey ? parsePrice(row[priceExecKey]) : 0;
        const priceForeignVal = priceForeignKey
          ? parsePrice(row[priceForeignKey])
          : 0;

        parsed.push({
          code: codeVal,
          name: rawName,
          category: catVal || groupVal,
          subCategory1: sub1Val,
          subCategory2: sub2Val,
          grouping: groupVal || catVal,
          price: priceVal,
          priceExecutive: priceExecVal,
          priceForeigner: priceForeignVal,
        });
      }

      if (parsed.length === 0) {
        throw new Error('Tidak ada baris data tarif yang valid ditemukan.');
      }

      setParsedRows(parsed);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal membaca atau memproses file Excel.';
      setErrorMsg(msg);
      setFile(null);
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        NO: 1,
        'NAMA TARIF': 'ADMINISTRASI RAWAT JALAN',
        KELOMPOK: 'ADMINISTRASI',
        'KELOMPOK 1': 'ADMINISTRASI',
        'KELOMPOK 2': '',
        GROUPING: 'ADMINISTRASI',
        HARGA: 15000,
        'HARGA EKSEKUTIF': 20000,
        'HARGA WNA': 20000,
      },
      {
        NO: 2,
        'NAMA TARIF': 'KLINIK UMUM',
        KELOMPOK: 'RAWAT JALAN',
        'KELOMPOK 1': 'POLIKLINIK',
        'KELOMPOK 2': '',
        GROUPING: 'POLIKLINIK',
        HARGA: 50000,
        'HARGA EKSEKUTIF': 65000,
        'HARGA WNA': 65000,
      },
      {
        NO: 3,
        'NAMA TARIF': 'RONTGEN THORAX PA',
        KELOMPOK: 'PENUNJANG',
        'KELOMPOK 1': 'RADIOLOGI',
        'KELOMPOK 2': '',
        GROUPING: 'RADIOLOGI',
        HARGA: 115000,
        'HARGA EKSEKUTIF': 150000,
        'HARGA WNA': 150000,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Tarif');
    XLSX.writeFile(wb, 'Template_Tarif_MCU_Klinik.xlsx');
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const payload: Partial<Tarif>[] = parsedRows.map((r) => ({
        code: r.code,
        name: r.name,
        category: r.category,
        subCategory1: r.subCategory1,
        subCategory2: r.subCategory2,
        grouping: r.grouping,
        price: r.price,
        priceExecutive: r.priceExecutive,
        priceForeigner: r.priceForeigner,
      }));

      const res = await importTarifs({
        mode,
        items: payload,
      });

      onImportComplete(res);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal mengimpor data ke database';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2
              id="import-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Impor & Sinkronisasi Tarif dari File Excel
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah file spreadsheet (.xlsx, .xls) untuk memperbarui atau menambahkan daftar tarif ke database lokal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Upload Drop Zone */}
          {!file && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6"
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
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Klik atau seret file Excel ke sini
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Format yang didukung: .xlsx, .xls, atau .csv (Mendukung format file resmi tarif RS)
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadTemplate();
                  }}
                  className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Unduh Contoh Format Excel
                </button>
              </div>
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-8 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Membaca dan memvalidasi file Excel...
              </p>
            </div>
          )}

          {/* File Selected & Preview */}
          {file && !isParsing && parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs font-mono">
                    XLS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Sheet: <span className="font-semibold text-slate-700">{sheetName}</span> •{' '}
                      <span className="font-bold text-emerald-700">
                        {parsedRows.length} data tarif
                      </span>{' '}
                      terbaca
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedRows([]);
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Ganti File
                </button>
              </div>

              {/* Import Mode Radio */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Pilih Metode Sinkronisasi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`border rounded-lg p-3 cursor-pointer transition-colors flex flex-col justify-between ${
                      mode === 'upsert'
                        ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="import-mode"
                        checked={mode === 'upsert'}
                        onChange={() => setMode('upsert')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-900">
                        Perbarui & Tambahkan (Aman)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5">
                      Memperbarui harga tarif yang cocok dan menambahkan yang belum ada. Data lain tetap aman.
                    </p>
                  </label>

                  <label
                    className={`border rounded-lg p-3 cursor-pointer transition-colors flex flex-col justify-between ${
                      mode === 'replace'
                        ? 'border-amber-500 bg-amber-50/30 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="import-mode"
                        checked={mode === 'replace'}
                        onChange={() => setMode('replace')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-900">
                        Ganti Seluruh Data (Replace)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 pl-5">
                      Menghapus seluruh daftar tarif saat ini dan menggantinya dengan isi file Excel ini.
                    </p>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Pratinjau Data (5 Baris Pertama)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Menampilkan 5 dari {parsedRows.length} baris
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">No</th>
                        <th className="py-2 px-3">Nama Tindakan</th>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3 text-right">Tarif Reguler</th>
                        <th className="py-2 px-3 text-right">Tarif Eksekutif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">
                            {r.code || i + 1}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {r.name}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {r.category || '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiahNoDecimals(r.price)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {r.priceExecutive > 0
                              ? formatRupiahNoDecimals(r.priceExecutive)
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 hover:underline"
          >
            Unduh Format Contoh
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 border border-slate-300 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={!file || parsedRows.length === 0 || isProcessing}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {isProcessing && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>
                {isProcessing
                  ? 'Menyimpan ke Database...'
                  : `Mulai Impor (${parsedRows.length} Tarif)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
