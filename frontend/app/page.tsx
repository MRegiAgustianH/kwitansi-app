'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar, { ActiveTab } from '../components/Navbar';
import CashierForm from '../components/CashierForm';
import ReceiptHistory from '../components/ReceiptHistory';
import TarifList from '../components/TarifList';
import PackagePresetManager from '../components/PackagePresetManager';
import HospitalSettingsModal from '../components/HospitalSettingsModal';
import {
  HospitalSettings,
  PackagePreset,
  Tarif,
  fetchSettings,
  fetchPackages,
  fetchTarifs,
  fetchTarifCategories,
} from '../lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('cashier');
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [presets, setPresets] = useState<PackagePreset[]>([]);
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [hostIp, setHostIp] = useState<string>('localhost');

  const loadInitialData = useCallback(async () => {
    try {
      const [settRes, presRes, tarRes, catRes] = await Promise.all([
        fetchSettings().catch(() => null),
        fetchPackages().catch(() => []),
        fetchTarifs({ limit: 500 }).catch(() => ({ data: [] })),
        fetchTarifCategories().catch(() => []),
      ]);

      if (settRes) setSettings(settRes);
      setPresets(presRes);
      setTarifs(tarRes.data);
      setCategories(catRes);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    if (typeof window !== 'undefined') {
      setHostIp(window.location.hostname);
    }
  }, [loadInitialData]);

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'settings') {
      setIsSettingsModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleRefreshPresets = async () => {
    try {
      const updated = await fetchPackages();
      setPresets(updated);
    } catch (e) {
      console.error(e);
    }
  };
  const handleRefreshTarifs = async () => {
    try {
      const [tarRes, catRes] = await Promise.all([
        fetchTarifs({ limit: 500 }).catch(() => ({ data: [] })),
        fetchTarifCategories().catch(() => []),
      ]);
      setTarifs(tarRes.data);
      setCategories(catRes);
    } catch (e) {
      console.error('Error refreshing tarifs:', e);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="no-print flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-600">
              Menghubungkan ke database lokal & memuat tarif MCU...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'cashier' && (
              <CashierForm
                settings={settings}
                presets={presets}
                tarifs={tarifs}
                categories={categories}
              />
            )}

            {activeTab === 'history' && (
              <ReceiptHistory settings={settings} />
            )}

            {activeTab === 'tarifs' && (
              <TarifList
                tarifs={tarifs}
                categories={categories}
                onTarifsUpdated={handleRefreshTarifs}
              />
            )}

            {activeTab === 'presets' && (
              <PackagePresetManager
                presets={presets}
                allTarifs={tarifs}
                categories={categories}
                onRefreshPresets={handleRefreshPresets}
              />
            )}
          </>
        )}
      </main>

      {/* LAN Information & Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span className="font-semibold text-slate-700">Mode Jaringan Lokal (LAN RS) Aktif:</span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
              http://{hostIp}:3000
            </span>
          </div>

          <div className="text-center sm:text-right">
            Sistem Kwitansi Program MCU • Klinik Utama Dr. H. A. Rotinsulu Cianjur
          </div>
        </div>
      </footer>

      {/* Hospital Settings Modal */}
      <HospitalSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSettingsUpdated={(updated) => setSettings(updated)}
      />
    </div>
  );
}
