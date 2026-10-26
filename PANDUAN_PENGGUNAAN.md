# Panduan Penggunaan Sistem Kwitansi MCU Rumah Sakit
### Klinik Utama Dr. H. A. Rotinsulu Cianjur

Sistem web aplikasi untuk pembuatan dan pencetakan kwitansi program MCU (Medical Check Up) per paket berbasis **NestJS** (Backend) dan **Next.js** (Frontend) dengan database lokal **SQLite**. Dirancang untuk kemudahan operasional kasir dan akses multi-komputer dalam satu jaringan lokal (LAN) rumah sakit.

---

## 1. Fitur Utama

1. **Input Identitas Pasien Manual:**
   - Nomor Rekam Medis (No. RM)
   - Nama Lengkap Pasien
   - Nomor Kwitansi Otomatis (Format: `KWT-YYYYMMDDHHmmss` yang dapat disesuaikan)
   - Tanggal Transaksi & Nama Petugas Kasir

2. **Dukungan Paket MCU & Preset Cepat:**
   - Tersedia template preset bawaan:
     - **Paket MCU Standar Cianjur (19 Pemeriksaan) — Rp 1.890.000,00** (sesuai kwitansi referensi resmi)
     - **Paket MCU Dasar (7 Pemeriksaan) — Rp 445.000,00**
     - **Paket Skrining Bebas NAPZA (3 Item) — Rp 265.000,00**
   - Kemampuan membuat template paket baru sesuai kebutuhan.

3. **Penyesuaian Harga Fleksibel (*Custom Pricing*):**
   - Kasir dapat menyesuaikan / mengedit nominal harga satuan setiap pemeriksaan secara bebas langsung pada tabel.
   - Total harga paket otomatis terhitung secara *real-time*.

4. **Highlight Harga di Web App vs Format Cetak Resmi:**
   - **Di Web App:** Terdapat *financial highlight widget* yang menampilkan rincian harga per pemeriksaan dan subtotal per kelompok (Administrasi, Poliklinik, Laboratorium, Radiologi, Tindakan Medis) untuk verifikasi internal kasir.
   - **Pada Kwitansi Cetak Fisik:** Sesuai format resmi Klinik Utama Dr. H. A. Rotinsulu Cianjur (`contoh-kwitansi.jpg`), rincian nama pemeriksaan dicetak tanpa menampilkan harga satuan masing-masing. Hanya **TOTAL HARGA PAKET** yang tercetak pada kolom Harga, Jumlah, dan Total Akhir.

5. **Manajemen Master Data Tarif & Fitur Impor Excel:**
   - **Tambah & Ubah Tarif:** Petugas dapat menambah pemeriksaan baru atau mengubah nominal tarif langsung melalui menu Data Tarif.
   - **Impor & Sinkronisasi Excel (.xlsx, .xls):** Dukungan upload file Excel resmi RS dengan mode pembaruan aman (*upsert*) atau penimpaan total (*replace*).
   - **Ekspor Excel:** Kemampuan mengunduh seluruh data tarif saat ini ke format file Excel kapan saja untuk arsip atau pembaruan offline.
   - **322 Data Tarif Bawaan:** Seluruh data awal dari file Excel referensi resmi Cianjur telah terintegrasi dalam database lokal SQLite.
6. **Riwayat Kwitansi & Cetak Ulang:**
   - Pencarian berdasarkan No. RM, Nama Pasien, No. Kwitansi, atau rentang tanggal.
   - Fitur cetak ulang instan kapan saja.

---

## 2. Cara Menjalankan Aplikasi di Server Kasir RS

### Persyaratan:
- Node.js versi 22 ke atas (sudah terpasang di komputer ini).

### Cara Menjalankan (Pilih salah satu):

#### Opsi A: Klik Ganda File Batch (Paling Praktis)
Klik dua kali file:
```
jalankan-aplikasi.bat
```
Browser akan otomatis terbuka menampilkan aplikasi di alamat `http://localhost:3000`.

#### Opsi B: Melalui Terminal / Command Prompt
Buka Command Prompt atau PowerShell di folder ini (`C:\laragon\www\kwitansi-app`), lalu jalankan:
```bash
npm start
```
Atau untuk mode pengembangan:
```bash
npm run dev
```

---

## 3. Cara Mengakses dari Komputer Lain dalam Jaringan LAN RS

Aplikasi telah dikonfigurasi untuk mendengarkan koneksi pada alamat `0.0.0.0`, sehingga dapat diakses oleh komputer kasir lain, dokter, atau bagian administrasi di jaringan LAN rumah sakit yang sama:

1. Saat aplikasi dijalankan, layar terminal akan menampilkan alamat IP LAN komputer server, misalnya:
   ```
   🌐 Akses dari Komputer Lain di Jaringan LAN RS:
      👉 http://192.168.1.50:3000
   ```
2. Dari komputer kasir lain atau laptop dokter di jaringan LAN yang sama:
   - Buka browser (Google Chrome, Microsoft Edge, atau Mozilla Firefox).
   - Ketikkan alamat IP server tersebut pada address bar, contoh: `http://192.168.1.50:3000`.
3. Komputer lain dapat langsung menginput data, mencetak kwitansi, atau melihat riwayat secara bersamaan.

> **Catatan Firewall Windows:** Jika komputer lain tidak dapat mengakses alamat tersebut, pastikan Windows Defender Firewall mengizinkan akses masuk (*Inbound Rule*) untuk Port 3000 pada jaringan Private/Domain RS.

---

## 4. Alur Kerja Pembuatan Kwitansi MCU

1. Buka tab **"Buat Kwitansi"**.
2. Masukkan **No. RM** dan **Nama Lengkap Pasien**.
3. Pilih salah satu **Preset Paket MCU** (misal: *Paket MCU Standar Cianjur 19 Pemeriksaan*).
4. Daftar pemeriksaan akan langsung terisi lengkap beserta harga satuan referensinya.
5. Jika ada pemeriksaan tambahan, klik tombol **"+ Tambah Pemeriksaan"** untuk mencari dari 322 tarif referensi atau menambah item manual (seperti Audiometri).
6. Sesuaikan harga satuan jika diperlukan pada kolom *Harga Satuan*.
7. Periksa panel **Highlight Rincian Harga Paket MCU** di bawah tabel dan pratinjau kwitansi di sebelah kanan.
8. Klik tombol hijau **"Simpan & Cetak Kwitansi"**:
   - Kwitansi otomatis tersimpan ke database.
   - Dialog cetak browser akan terbuka dengan format kwitansi cetak resmi siap dicetak ke printer.
