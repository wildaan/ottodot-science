# Trial Booking System - Next.js Base Project

Base project ini dibangun menggunakan **Next.js 14+ (App Router)**, **TypeScript**, dan **Tailwind CSS**. Project ini menyediakan arsitektur fondasi yang clean untuk integrasi database Supabase Postgres dengan contoh implementasi CRUD (Students) beserta penanganan race-conditions transaksi booking.

## Folder Structure

Struktur folder utama dirancang mengikuti standar arsitektur bersih:
- `src/app/` - Routing Next.js (Dashboard & REST API Routes).
- `src/components/ui/` - Komponen UI reusable berbasis Tailwind CSS (Button, Input, Table, Card, Badge).
- `src/config/supabase/` - Browser & Server Supabase Client. Env variables HANYA diakses di sini.
- `src/services/` - Lapisan data access logic (Supabase Queries & RPC).
- `src/validations/` - Skema validasi request & form input menggunakan Zod.
- `src/types/` - Type Definitions database (menggunakan tabel prefix).
- `src/__tests__/` - Automated test suite untuk verifikasi fungsionalitas dan race conditions.

---

## 🛠️ Cara Menjalankan Project (Fresh Clone)

1. Masuk ke direktori frontend:
   ```bash
   cd FE
   ```
2. Duplikat file `.env.example` menjadi `/env`:
   ```bash
   cp .env.example /env
   ```
3. Isi nilai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dengan kredensial project Supabase Anda yang sudah dimigrasikan menggunakan schema SQL.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Jalankan server lokal:
   ```bash
   npm run dev
   ```
6. Akses dashboard siswa aktif di: [http://localhost:3000/students](http://localhost:3000/students)

---

## 🧪 Cara Menjalankan Automated Test Suite
Kami menyediakan file pengetesan otomatis untuk memverifikasi fungsionalitas database, pembatasan kuota, deteksi duplikasi, dan race conditions secara riil menggunakan parallel request.

Jalankan command berikut di root folder `FE/`:
```bash
npx ts-node src/__tests__/concurrent.test.ts
```

---

## 📐 Arsitektur & Keputusan Desain Backend

### 1. Penanganan Last-Seat Race Condition
* **Solusi**: Menggunakan locking tingkat baris (`SELECT ... FOR UPDATE`) dalam satu database transaction atomic (PostgreSQL RPC function `book_trial_class`).
* **Alasan & Trade-off**: 
  * *Alasan*: Mencegah overbooking jika 2 request memesan slot terakhir (slot ke-4) secara bersamaan. Dengan `FOR UPDATE`, transaksi kedua akan tertunda (block) hingga transaksi pertama selesai (commit/rollback). Setelah kunci dilepas, transaksi kedua mendeteksi count sudah = 4, lalu membatalkan booking dengan exception `CLASS_FULL`.
  * *Trade-off*: Ada sedikit overhead latensi karena pemrosesan antrean kunci row, namun karena hanya mengunci row kelas spesifik tersebut (bukan seluruh tabel), throughput sistem secara keseluruhan tetap tinggi dan integritas data terjamin 100%.

### 2. State & Alur Booking
* **Status**: `pending_payment` ➡️ `confirmed` (jika pembayaran sukses) ATAU `payment_failed` (jika pembayaran gagal).
* **Payment Failure**: Jika pembayaran gagal, data booking dicatat dengan state `payment_failed`, dan entri `payment_attempts` disimpan dengan hasil `failed`. Data slot `trial_classes_confirmed_count` **TIDAK** dinaikkan dan anak **TIDAK** masuk ke dalam daftar roster kelas aktif.

### 3. Pencegahan Duplikasi Booking
* **Aplikasi**: Divalidasi di level RPC sebelum proses order dijalankan.
* **Database**: Dilindungi di tingkat basis data menggunakan **Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX ON bookings (bookings_students_uuid, bookings_trial_classes_uuid)
  WHERE bookings_state = 'confirmed';
  ```
  Ini menjamin secara mutlak bahwa satu siswa tidak dapat memiliki lebih dari satu booking berstatus `confirmed` pada kelas yang sama.

---

## ⚠️ Monitoring & Next Steps
1. **Roster Monitoring**: Perlu ditambahkan sistem alert jika total `confirmed` di tabel `bookings` tidak sinkron dengan denormalized counter `trial_classes_confirmed_count` (misalnya karena intervensi manual database).
2. **Next Steps**: Integrasi Payment Gateway webhook untuk meng-update status `pending_payment` menjadi `confirmed` secara asinkron.
