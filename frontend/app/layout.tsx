import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistem Kwitansi MCU - Klinik Utama Dr. H. A. Rotinsulu Cianjur',
  description: 'Aplikasi Kasir Pembuatan & Cetak Kwitansi Program MCU Rumah Sakit per Paket',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
