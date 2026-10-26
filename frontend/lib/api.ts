export interface Tarif {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory1: string;
  subCategory2: string;
  grouping: string;
  price: number;
  priceExecutive: number;
  priceForeigner: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackageItem {
  name: string;
  category?: string;
  price: number;
  qty?: number;
}

export interface PackagePreset {
  id: string;
  name: string;
  description: string;
  packagePrice: number;
  items: PackageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  medicalRecordNo: string;
  patientName: string;
  packageName: string;
  packageQty: string;
  totalAmount: number;
  receiptDate: string;
  cashierName: string;
  notes: string;
  items: PackageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface HospitalSettings {
  id: string;
  hospitalName: string;
  ministryName: string;
  address: string;
  city: string;
  defaultCashier: string;
  phone: string;
  email: string;
  website: string;
  receiptTitle: string;
  updatedAt: string;
}

const API_BASE = '/api';

export async function fetchTarifs(params?: { search?: string; category?: string; limit?: number; page?: number }): Promise<{
  data: Tarif[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.category) query.append('category', params.category);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.page) query.append('page', String(params.page));

  const res = await fetch(`${API_BASE}/tarifs?${query.toString()}`);
  if (!res.ok) throw new Error('Gagal mengambil data tarif');
  return res.json();
}

export async function fetchTarifCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/tarifs/categories`);
  if (!res.ok) throw new Error('Gagal mengambil kategori tarif');
  return res.json();
}
export async function createTarif(data: Partial<Tarif>): Promise<Tarif> {
  const res = await fetch(`${API_BASE}/tarifs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menambahkan tarif baru');
  }
  return res.json();
}

export async function updateTarif(id: string, data: Partial<Tarif>): Promise<Tarif> {
  const res = await fetch(`${API_BASE}/tarifs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal memperbarui tarif');
  }
  return res.json();
}

export async function deleteTarif(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/tarifs/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menghapus tarif');
  }
  return res.json();
}

export async function importTarifs(data: {
  mode?: 'upsert' | 'replace';
  items: Partial<Tarif>[];
}): Promise<{ success: boolean; count: number; added: number; updated: number }> {
  const res = await fetch(`${API_BASE}/tarifs/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengimpor data tarif');
  }
  return res.json();
}


export async function fetchPackages(): Promise<PackagePreset[]> {
  const res = await fetch(`${API_BASE}/packages`);
  if (!res.ok) throw new Error('Gagal mengambil preset paket');
  return res.json();
}

export async function createPackage(data: {
  name: string;
  description?: string;
  packagePrice?: number;
  items: PackageItem[];
}): Promise<PackagePreset> {
  const res = await fetch(`${API_BASE}/packages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal menyimpan preset paket');
  return res.json();
}

export async function deletePackage(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/packages/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus preset paket');
}

export async function generateReceiptNo(): Promise<string> {
  const res = await fetch(`${API_BASE}/receipts/generate-no`);
  if (!res.ok) throw new Error('Gagal membuat nomor kwitansi');
  const data = await res.json();
  return data.receiptNo;
}

export async function fetchReceipts(params?: {
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}): Promise<{
  data: Receipt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.page) query.append('page', String(params.page));

  const res = await fetch(`${API_BASE}/receipts?${query.toString()}`);
  if (!res.ok) throw new Error('Gagal mengambil riwayat kwitansi');
  return res.json();
}

export async function createReceipt(data: {
  receiptNo?: string;
  medicalRecordNo: string;
  patientName: string;
  packageName?: string;
  packageQty?: string;
  totalAmount?: number;
  receiptDate?: string;
  cashierName?: string;
  notes?: string;
  items: PackageItem[];
}): Promise<Receipt> {
  const res = await fetch(`${API_BASE}/receipts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menyimpan kwitansi');
  }
  return res.json();
}

export async function deleteReceipt(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/receipts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus kwitansi');
}

export async function fetchSettings(): Promise<HospitalSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Gagal mengambil pengaturan klinik');
  return res.json();
}

export async function updateSettings(data: Partial<HospitalSettings>): Promise<HospitalSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal memperbarui pengaturan klinik');
  return res.json();
}
