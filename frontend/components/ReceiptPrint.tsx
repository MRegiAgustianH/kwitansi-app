'use client';

import React from 'react';
import { HospitalSettings, PackageItem } from '../lib/api';
import { formatRupiah, formatDateIndo, formatPrintDateTime } from '../lib/utils';

interface ReceiptPrintProps {
  settings?: HospitalSettings | null;
  receiptNo: string;
  medicalRecordNo: string;
  patientName: string;
  packageName?: string;
  packageQty?: string;
  totalAmount: number;
  receiptDate?: string;
  cashierName?: string;
  items: PackageItem[];
  printDate?: Date;
}

export default function ReceiptPrint({
  settings,
  receiptNo,
  medicalRecordNo,
  patientName,
  packageName = 'PAKET MCU',
  packageQty = '1 pkt',
  totalAmount,
  receiptDate = new Date().toISOString().split('T')[0],
  cashierName = 'Kasir Pendaftaran',
  items = [],
  printDate = new Date(),
}: ReceiptPrintProps) {
  const hospitalName = settings?.hospitalName || 'KLINIK UTAMA DR. H. A. ROTINSULU CIANJUR';
  const ministryName = settings?.ministryName || 'KEMENTERIAN KESEHATAN RI';
  const address = settings?.address || 'Jl. Siliwangi No. 19 Cianjur, Telp 0263-261851, Website : bbkpm-bandung.org/cabang/view/cianjur, Email : bkpmcianjur@yahoo.co.id';
  const city = settings?.city || 'Cianjur';
  const receiptTitle = settings?.receiptTitle || 'BUKTI PEMBAYARAN';

  return (
    <div className="receipt-print-wrapper bg-white text-black text-[12px] font-sans leading-tight max-w-[760px] mx-auto p-4 sm:p-6 print:p-0 print:max-w-full">
      {/* Header Kop Surat */}
      <div className="text-center pb-2">
        <h2 className="text-[13px] font-bold tracking-wide uppercase">{ministryName}</h2>
        <h1 className="text-[15px] font-bold tracking-wide uppercase mt-0.5">{hospitalName}</h1>
        <p className="text-[10px] mt-1 text-black font-normal max-w-[680px] mx-auto leading-tight">
          {address}
        </p>
        <div className="border-b-[2px] border-black mt-2 mb-3"></div>
      </div>

      {/* Meta Pasien & Nomor Kwitansi */}
      <div className="flex justify-between items-start mb-3 text-[12px]">
        {/* Kolom Kiri: Identitas Pasien */}
        <div className="space-y-1">
          <div className="flex">
            <span className="w-20 font-medium">No. RM</span>
            <span className="mr-2">:</span>
            <span className="font-semibold tracking-wide">{medicalRecordNo || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-20 font-medium">Nama</span>
            <span className="mr-2">:</span>
            <span className="font-bold uppercase tracking-wide">{patientName || '-'}</span>
          </div>
        </div>

        {/* Kolom Kanan: Nomor Kwitansi & Badge */}
        <div className="space-y-1.5 text-right">
          <div className="flex justify-end items-center">
            <span className="font-medium mr-1.5">No :</span>
            <span className="font-semibold tracking-wider">{receiptNo || '-'}</span>
          </div>
          <div className="inline-block border border-black px-4 py-0.5 text-center font-bold text-[11px] tracking-wider uppercase">
            {receiptTitle}
          </div>
        </div>
      </div>

      {/* Tabel Kwitansi */}
      <table className="w-full border-collapse text-[11.5px] mt-2">
        <thead>
          <tr className="border-b border-transparent text-left">
            <th className="py-1 w-8 text-left font-bold">No</th>
            <th className="py-1 font-bold">Nama</th>
            <th className="py-1 w-36 text-right font-bold">Harga</th>
            <th className="py-1 w-16 text-center font-bold">Qty</th>
            <th className="py-1 w-36 text-right font-bold">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {/* Baris Utama Paket */}
          <tr className="align-top">
            <td className="py-1 font-normal">1</td>
            <td className="py-1 font-bold tracking-wide">{packageName.toUpperCase()}</td>
            <td className="py-1 text-right tabular-nums">{formatRupiah(totalAmount)}</td>
            <td className="py-1 text-center">{packageQty}</td>
            <td className="py-1 text-right tabular-nums">{formatRupiah(totalAmount)}</td>
          </tr>

          {/* Sub-item Pemeriksaan: DICETAK TANPA HARGA SATUAN SESUAI KEBUTUHAN RS */}
          {items.map((item, idx) => (
            <tr key={idx} className="text-black">
              <td></td>
              <td className="pl-4 py-0.5 text-[11px] tracking-tight uppercase">
                {item.name}
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Baris Total Akhir */}
      <div className="border-t border-transparent mt-4 pt-3 flex justify-end items-center">
        <div className="flex items-center space-x-6 text-[12.5px] font-bold">
          <span className="tracking-wider uppercase">TOTAL</span>
          <span className="tabular-nums text-right min-w-[140px]">{formatRupiah(totalAmount)}</span>
        </div>
      </div>

      {/* Footer Kwitansi */}
      <div className="mt-10 flex justify-between items-end text-[11px]">
        {/* Kolom Tanggal Cetak */}
        <div className="text-left space-y-0.5">
          <div>Tanggal Cetak :</div>
          <div className="font-mono text-[10.5px]">{formatPrintDateTime(printDate)}</div>
        </div>

        {/* Kolom Tanda Tangan Kasir */}
        <div className="text-center min-w-[190px] space-y-12">
          <div>
            {city}, {formatDateIndo(receiptDate)}
          </div>
          <div>
            <div className="border-b border-transparent pb-0.5 font-medium">{cashierName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
