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
  const hospitalName =
    settings?.hospitalName || 'KLINIK UTAMA DR. H. A. ROTINSULU CIANJUR';
  const ministryName = settings?.ministryName || 'KEMENTERIAN KESEHATAN RI';
  const address =
    settings?.address ||
    'Jl. Siliwangi No. 19 Cianjur, Telp 0263-261851, Website : bbkpm-bandung.org/cabang/view/cianjur, Email : bkpmcianjur@yahoo.co.id';
  const city = settings?.city || 'Cianjur';
  const receiptTitle = settings?.receiptTitle || 'BUKTI PEMBAYARAN';

  return (
    <div
      className="receipt-print-wrapper bg-white text-black text-[11.5px] leading-tight max-w-[760px] mx-auto p-4 sm:p-5 print:p-0 print:max-w-full print:w-full select-none"
      style={{
        fontFamily: '"Times New Roman", Times, Georgia, serif',
        color: '#000000',
      }}
    >
      {/* 1. Header Kop Surat */}
      <div className="text-center pb-1">
        <h2 className="text-[12.5px] font-normal tracking-wide uppercase">
          {ministryName}
        </h2>
        <h1 className="text-[14px] font-bold tracking-wide uppercase mt-0.5">
          {hospitalName}
        </h1>
        <p className="text-[10px] mt-0.5 text-black font-normal max-w-[690px] mx-auto leading-tight">
          {address}
        </p>
        {/* Double Underline sesuai format fisik kwitansi */}
        <div className="border-b-[3px] border-double border-black mt-1 mb-2.5"></div>
      </div>

      {/* 2. Metadata Pasien & Bukti Pembayaran */}
      <div className="flex justify-between items-start mb-2.5 text-[11.5px]">
        {/* Sisi Kiri: No. RM & Nama */}
        <div className="space-y-0.5">
          <div className="flex">
            <span className="w-16 font-normal">No. RM</span>
            <span className="mr-1.5">:</span>
            <span className="font-normal">{medicalRecordNo || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-16 font-normal">Nama</span>
            <span className="mr-1.5">:</span>
            <span className="font-normal uppercase">{patientName || '-'}</span>
          </div>
        </div>

        {/* Sisi Kanan: No Kwitansi & Kotak BUKTI PEMBAYARAN */}
        <div className="space-y-1 text-right">
          <div className="flex justify-end items-center">
            <span className="font-normal mr-1.5">No :</span>
            <span className="font-normal">{receiptNo || '-'}</span>
          </div>
          <div className="inline-block border border-black px-6 py-0.5 text-center font-bold text-[11px] tracking-wide uppercase">
            {receiptTitle}
          </div>
        </div>
      </div>

      {/* 3. Tabel Pemeriksaan Continuous Form */}
      <table className="w-full border-collapse text-[11px] mt-1">
        <thead>
          <tr className="text-left">
            <th className="py-1 w-7 text-left font-bold">No</th>
            <th className="py-1 font-bold">Nama</th>
            <th className="py-1 w-36 text-right font-bold">Harga</th>
            <th className="py-1 w-16 text-center font-bold">Qty</th>
            <th className="py-1 w-36 text-right font-bold">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {/* Baris Utama: Nama Paket & Total Harga Paket */}
          <tr className="align-top">
            <td className="py-0.5 font-normal">1</td>
            <td className="py-0.5 font-bold">{packageName.toUpperCase()}</td>
            <td className="py-0.5 text-right font-normal tabular-nums">
              {formatRupiah(totalAmount)}
            </td>
            <td className="py-0.5 text-center font-normal">{packageQty}</td>
            <td className="py-0.5 text-right font-normal tabular-nums">
              {formatRupiah(totalAmount)}
            </td>
          </tr>

          {/* Rincian Nama Pemeriksaan di bawah Nama Paket (Tanpa Harga Satuan) */}
          {items.map((item, idx) => (
            <tr key={idx} className="text-black leading-[15px]">
              <td></td>
              <td className="pl-6 py-0 text-[10.5px] uppercase">
                {item.name}
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Baris TOTAL (Rata Kanan Sejajar Kolom Jumlah) */}
      <div className="mt-4 flex justify-end items-center text-[11.5px] font-bold">
        <div className="flex items-center space-x-6">
          <span className="uppercase font-bold">TOTAL</span>
          <span className="tabular-nums text-right min-w-[130px] font-bold">
            {formatRupiah(totalAmount)}
          </span>
        </div>
      </div>

      {/* 5. Footer Continuous Form: Kompak agar tidak menggulung halaman kedua */}
      <div className="mt-8 flex justify-between items-start text-[10.5px]">
        {/* Kolom Tanggal & Waktu Cetak */}
        <div className="text-left space-y-0.5">
          <div>Tanggal Cetak :</div>
          <div>{formatPrintDateTime(printDate)}</div>
        </div>

        {/* Kolom Kasir Pendaftaran */}
        <div className="text-left min-w-[190px] space-y-0.5">
          <div>
            {city}, {formatDateIndo(receiptDate)}
          </div>
          <div>{cashierName}</div>
        </div>
      </div>
    </div>
  );
}
