'use client';

import React, { useState, useEffect } from 'react';
import { HospitalSettings, updateSettings } from '../lib/api';

interface HospitalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HospitalSettings | null;
  onSettingsUpdated: (updated: HospitalSettings) => void;
}

export default function HospitalSettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
}: HospitalSettingsModalProps) {
  const [hospitalName, setHospitalName] = useState('');
  const [ministryName, setMinistryName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [defaultCashier, setDefaultCashier] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [receiptTitle, setReceiptTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setHospitalName(settings.hospitalName || '');
      setMinistryName(settings.ministryName || '');
      setAddress(settings.address || '');
      setCity(settings.city || '');
      setDefaultCashier(settings.defaultCashier || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setWebsite(settings.website || '');
      setReceiptTitle(settings.receiptTitle || 'BUKTI PEMBAYARAN');
      setSavedSuccess(false);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSavedSuccess(false);

    try {
      const updated = await updateSettings({
        hospitalName: hospitalName.trim(),
        ministryName: ministryName.trim(),
        address: address.trim(),
        city: city.trim(),
        defaultCashier: defaultCashier.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        receiptTitle: receiptTitle.trim(),
      });
      onSettingsUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui pengaturan';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pengaturan Identitas Rumah Sakit & Kwitansi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Informasi ini akan dicetak pada kop surat kwitansi resmi
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60"
          >
            ✕
          </button>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-6 py-2.5 font-semibold border-b border-emerald-200">
            ✓ Pengaturan berhasil disimpan!
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instansi Pembina / Kementerian
            </label>
            <input
              type="text"
              required
              value={ministryName}
              onChange={(e) => setMinistryName(e.target.value)}
              className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Rumah Sakit / Klinik Utama *
            </label>
            <input
              type="text"
              required
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="w-full text-sm font-semibold px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Lengkap & Kontak (Kop Surat) *
            </label>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kota Kwitansi (contoh: Cianjur) *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Default Petugas Kasir
              </label>
              <input
                type="text"
                value={defaultCashier}
                onChange={(e) => setDefaultCashier(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Dokumen Kwitansi
              </label>
              <input
                type="text"
                value={receiptTitle}
                onChange={(e) => setReceiptTitle(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Telepon
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
