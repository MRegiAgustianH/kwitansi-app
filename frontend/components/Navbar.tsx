'use client';

import React from 'react';
import { HospitalSettings } from '../lib/api';

export type ActiveTab = 'cashier' | 'history' | 'tarifs' | 'presets' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings?: HospitalSettings | null;
}

export default function Navbar({ activeTab, setActiveTab, settings }: NavbarProps) {
  const hospitalName = settings?.hospitalName || 'KLINIK UTAMA DR. H. A. ROTINSULU CIANJUR';

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Info RS */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              RS
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-emerald-800">
                Sistem Kwitansi MCU
              </div>
              <h1 className="text-sm font-bold text-slate-800 line-clamp-1">
                {hospitalName}
              </h1>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('cashier')}
              className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'cashier'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Buat Kwitansi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Riwayat Kwitansi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tarifs')}
              className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'tarifs'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Data Tarif
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'presets'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Preset Paket
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Pengaturan RS
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
