# PT Begawan Deru Utama — Website Perdagangan Besar Barang Logam

Company profile + katalog produk + e-commerce sederhana untuk perusahaan
perdagangan besar barang logam untuk bahan konstruksi.

> Data perusahaan (nama, alamat, telepon, email) ada di `lib/config/site.ts`.
> Logo ada di `public/images/` (SVG hasil vektorisasi dari `logo-original.jpg`).
> Teks profil perusahaan masih placeholder.

## Tech Stack

| Bagian     | Teknologi                              |
| ---------- | -------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)     |
| Bahasa     | TypeScript (strict)                    |
| Styling    | Tailwind CSS v4                        |
| Lint       | ESLint 9 + eslint-config-next          |
| Database   | PostgreSQL + Prisma 7 (driver adapter `pg`) |
| Auth       | Auth.js v5 (next-auth 5.0.0-beta.32), sesi JWT |
| Validasi   | Zod 4                                  |
| Icons      | lucide-react                           |
| Payment    | Abstraksi `PaymentProvider` + simulasi (gateway final belum dipilih) |

## Persyaratan

- Node.js **>= 20.9** (disarankan Node 22 LTS)
- npm

## Menjalankan Project

```bash
npm install                  # juga menjalankan `prisma generate`
cp .env.example .env.local   # lalu isi DATABASE_URL & AUTH_SECRET
npm run db:migrate           # membuat tabel di database
npm run db:seed              # (opsional) isi data CONTOH
npm run admin:create -- --email admin@contoh.com --name "Nama Admin"
npm run dev                  # http://localhost:3000
```

## Database (PostgreSQL)

1. Siapkan PostgreSQL, misalnya dengan Homebrew:
   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   createdb begawan_dev
   ```
   (Alternatif: Postgres.app, Docker, atau layanan cloud seperti Neon/Supabase.)
2. Isi `DATABASE_URL` di `.env.local`, contoh:
   `postgresql://<user>@localhost:5432/begawan_dev?schema=public`
3. Jalankan `npm run db:migrate`.

Lihat isi database dengan `npm run db:studio`.
Prisma Client dibuat ke `lib/generated/prisma` (tidak di-commit).

## Scripts

| Command             | Fungsi                         |
| ------------------- | ------------------------------ |
| `npm run dev`       | Development server             |
| `npm run build`     | Production build               |
| `npm run start`     | Menjalankan hasil build        |
| `npm run lint`      | ESLint                         |
| `npm run typecheck` | Cek tipe TypeScript            |
| `npm run db:migrate`| Buat/terapkan migrasi (dev)    |
| `npm run db:deploy` | Terapkan migrasi (production)  |
| `npm run db:seed`   | Isi data contoh (demo)         |
| `npm run images:sync` | Pasang foto produk dari folder |
| `npm run admin:create` | Buat / naikkan akun ADMIN     |
| `npm run db:studio` | Lihat data di Prisma Studio    |

## Struktur Folder

```text
app/            Routes (App Router). (public), (shop), (auth) = route groups
components/     Komponen reusable: ui, layout, product, cart, checkout, auth, admin
lib/            config, db, auth, validations, payment, utils
services/       Business logic (product, order, payment, ...)
types/          Shared TypeScript types
prisma/         Schema database & migrasi
public/         Aset statis (images, icons)
```


## Data Contoh (Seed)

`npm run db:seed` mengisi 6 kategori dan 15 produk **contoh**. Nama produk hanya jenis
material umum; harga, stok, dan deskripsi adalah **dummy** dan harus diganti dengan data
asli (melalui admin di Phase 8). Seed menolak berjalan di production kecuali
`ALLOW_DEMO_SEED=true`.

## Autentikasi & Role

- **CUSTOMER**: daftar di `/register`, masuk di `/login`, halaman `/account`.
- **ADMIN**: tidak bisa didaftarkan lewat website. Buat dari terminal:
  ```bash
  npm run admin:create -- --email admin@contoh.com --name "Nama Admin"
  ```
  Password diminta secara tersembunyi (min. 12 karakter, huruf + angka).
  Perintah yang sama pada email yang sudah ada akan menaikkannya menjadi ADMIN.

Keamanan:
- Password di-hash dengan **scrypt** (bawaan Node.js), tidak pernah disimpan plain-text.
- Sesi berupa cookie JWT terenkripsi (`httpOnly`, `SameSite=Lax`, `Secure` di HTTPS), berlaku 7 hari.
- `proxy.ts` mengalihkan pengunjung yang belum login dari `/account` & `/admin` ke `/login`.
- Setiap halaman terlindungi memeriksa ulang di server (`lib/dal.ts`); role ADMIN selalu
  dibaca dari database, jadi pencabutan akses langsung berlaku. Customer yang membuka `/admin` mendapat 404.
- Maks. 10 percobaan login **gagal** per email / 15 menit.
- `AUTH_SECRET` wajib; `AUTH_URL` wajib di production (alamat lengkap website).

## Keranjang

- Wajib login; satu keranjang per akun, tersimpan di database.
- Keranjang **tidak menyimpan harga** — harga & stok selalu dibaca terbaru dari tabel Product,
  subtotal dihitung di server. Browser hanya mengirim `productId` / `itemId` + jumlah.
- Jumlah dibatasi 1 … stok. Produk nonaktif / stok habis / stok kurang ditandai dan
  memblokir checkout sampai diperbaiki.
- Ubah keranjang lewat Server Actions (`lib/actions/cart.ts`) yang memeriksa login & kepemilikan item.

## Checkout & Pesanan

- `/checkout` (wajib login): isi data pengiriman → pesanan dibuat dengan status **Menunggu Pembayaran**.
- Semua total dihitung ulang di server dalam **satu transaksi database**: validasi produk & stok,
  pengurangan stok atomik (aman bila dua pembeli berebut stok terakhir), simpan pesanan, kosongkan keranjang.
- Item pesanan menyimpan **salinan** nama, harga, dan satuan saat pesanan dibuat — perubahan harga
  produk kemudian tidak mengubah pesanan lama.
- Nomor pesanan: `BDU-YYMMDD-XXXXXX`. Total disimpan sebagai `BigInt` Rupiah.
- Ongkos kirim **sementara Rp 0** ("dikonfirmasi admin") — aturannya di `lib/config/shipping.ts`.
- Customer bisa membatalkan pesanan yang belum dibayar; stok dikembalikan (tepat sekali).
- Riwayat pesanan: `/account/orders`.
- Semua harga **sudah termasuk PPN** (teks di `lib/config/pricing.ts`).

## Pembayaran (DRAFT)

Gateway final **belum dipilih**, jadi pembayaran dibuat sebagai kerangka yang siap disambungkan:

| Bagian | Lokasi |
| ------ | ------ |
| Kontrak gateway (interface) | `lib/payment/types.ts` |
| Pemilih provider (env) | `lib/payment/index.ts` |
| Simulasi untuk development | `lib/payment/mock.ts` + halaman `/payment/mock/<ref>` |
| **Contoh** integrasi lengkap (Midtrans, tidak aktif) | `lib/payment/midtrans.ts` |
| Logika bayar / lunas / kedaluwarsa | `services/payment.service.ts` |

Alur: pesanan dibuat → tombol **Bayar Sekarang** → halaman gateway → gateway mengirim notifikasi ke
`POST /api/payments/webhook` → pesanan menjadi **Dibayar**.

- `PAYMENT_PROVIDER=mock` (default) menampilkan halaman simulasi dengan tombol berhasil/gagal/kedaluwarsa.
  Mock **hanya berjalan di localhost**.
- Status lunas hanya dari gateway (webhook bertanda tangan / cek status server-ke-server) —
  parameter di URL setelah kembali dari gateway diabaikan. Nominal dari gateway dicocokkan dengan database.
- Notifikasi berulang diproses sekali (idempotent). Semua notifikasi dicatat di tabel `PaymentEvent`.
- Batas bayar **24 jam** (`lib/config/payment.ts`). Lewat dari itu pesanan dibatalkan otomatis dan stok kembali —
  saat pembeli membuka pesanannya, dan lewat `GET /api/cron/expire-orders` (header `Authorization: Bearer <CRON_SECRET>`,
  dijadwalkan di Phase 11).
- Pembayaran yang masuk setelah pesanan batal/sudah lunas dicatat dengan catatan `…_NEEDS_REFUND` untuk ditindaklanjuti admin.

**Menyambungkan gateway pilihan:** buat `lib/payment/<nama>.ts` yang mengimplementasikan `PaymentProvider`
(tiru `midtrans.ts`), daftarkan di `getPaymentProvider()`, isi secret di `.env.local`, dan daftarkan URL
`https://<domain>/api/payments/webhook` di dashboard gateway. Halaman & database tidak perlu diubah.

## Dashboard Admin (`/admin`)

Hanya akun **ADMIN** (dibuat dengan `npm run admin:create`). Customer yang membuka `/admin` mendapat 404,
dan setiap tombol/aksi admin memeriksa ulang role dari database.

| Menu | Fungsi |
| ---- | ------ |
| Dashboard | Pendapatan bulan ini, pesanan per status, **perlu tindakan** (pesanan dibayar, refund), stok menipis, pesan baru |
| Pesanan | Filter status & cari; detail: proses → kirim (nomor resi) → selesai, **tandai lunas manual** (transfer bank langsung), batalkan (stok kembali), catatan internal, riwayat tindakan admin |
| Pembayaran | Di detail pesanan: semua percobaan bayar; pembayaran yang masuk untuk pesanan batal/ganda ditandai **perlu refund** → setelah refund dilakukan di gateway/bank, klik "Sudah Direfund" |
| Produk | Tambah/edit/nonaktifkan, harga, stok, spesifikasi, **upload foto** (JPG/PNG/WEBP ≤ 5 MB). Produk yang pernah dipesan tidak bisa dihapus (agar riwayat utuh) — nonaktifkan saja |
| Kategori | Tambah/edit/urutkan/nonaktifkan; kategori berisi produk tidak bisa dihapus |
| Pelanggan | Daftar akun, jumlah pesanan, total belanja |
| Pesan | Pesan formulir Kontak, tandai sudah/belum dibaca, balas via email |

Semua perubahan status memakai pengecekan status lama (aman dari klik ganda / dua admin bersamaan)
dan dicatat di tabel `OrderLog` (siapa, apa, kapan).

**Foto upload** disimpan di folder `storage/uploads/` (tidak di-commit, **wajib di-backup**) dan disajikan di
`/uploads/products/...`. Untuk hosting serverless (mis. Vercel) driver di `lib/storage/index.ts` perlu
diganti object storage (Phase 11).

## Foto Website (Beranda, Header Halaman, Tentang Kami, Kontak)

Semua foto non-produk diatur di **satu file: `lib/config/images.ts`**.

1. Simpan foto di `public/images/site/` (foto kategori di `public/images/categories/`).
2. Di `lib/config/images.ts`, ganti `src: null` menjadi alamat fotonya, mis. `src: "/images/site/hero.jpg"`.
3. Simpan. Selama `src: null`, halaman memakai latar bawaan.

| Slot | Tempat tampil | Ukuran disarankan |
| ---- | ------------- | ----------------- |
| `hero` / `heroVideo` | Latar paling atas Beranda (video menggantikan foto) | 1920×1080 |
| `homeCta` | Kotak "Membutuhkan material…" di Beranda | 1600×700 |
| `productsHeader`, `aboutHeader`, `contactHeader` | Latar judul halaman Produk / Tentang Kami / Kontak | 1920×700 |
| `aboutProfile` | Samping "Profil Perusahaan" | 1200×900 (4:3) |
| `aboutBanner` | Foto lebar di halaman Tentang Kami | 1920×820 (21:9) |
| `contactOffice` | Atas kotak "Informasi Kontak" | 1200×900 (4:3) |
| `categoryImages.<slug>` | Kotak kategori di Beranda | 800×800 |

Foto di latar gelap otomatis diberi lapisan gelap agar teks terbaca. Saat `npm run dev`, nama file
yang salah dilaporkan di terminal (`[images] File tidak ditemukan…`) dan tidak menampilkan gambar rusak.

## Animasi

Pengaturan di **`lib/config/motion.ts`**:

- **Scroll:** konten fade-in (sedikit naik) saat terlihat, dan fade-out saat keluar layar
  (`revealOnce: true` bila ingin hanya sekali). Kartu muncul berurutan (`stagger`).
- **Foto:** fade-in halus setelah selesai dimuat.
- **Pindah halaman:** halaman lama fade-out, halaman baru fade-in (`pageTransition`), memakai
  View Transitions API bawaan browser. Browser lama tetap berpindah halaman seperti biasa.
- Tanpa library tambahan. Bila JavaScript mati atau pengunjung memilih "Kurangi gerakan"
  di perangkatnya, konten langsung tampil tanpa animasi.

Untuk menganimasikan elemen baru: bungkus dengan `<Reveal>` dari `components/ui/Reveal.tsx`.

## Gambar Produk

Saat ini setiap produk contoh memakai **ilustrasi** vektor (berlabel "ILUSTRASI")
di `public/images/products/<slug>.svg` — bukan foto produk asli.

Mengganti dengan foto asli:
1. Simpan foto dengan nama slug produk, mis. `public/images/products/pipa-galvanis-2-inch.jpg`
   (format `.jpg`, `.jpeg`, `.png`, atau `.webp`). Slug terlihat di URL `/products/<slug>`.
2. Jalankan `npm run images:sync`.

Foto otomatis diperkecil & dikonversi (WebP/AVIF) oleh `next/image`. Cara termudah: unggah foto
langsung di **Admin → Produk → edit produk**. `npm run db:seed` tidak menimpa gambar yang sudah diganti.

## API

| Method | Endpoint                 | Keterangan                                        |
| ------ | ------------------------ | ------------------------------------------------- |
| GET    | `/api/products`          | Daftar produk aktif. Query: `q`, `category`, `page`, `limit` (maks. 48) |
| GET    | `/api/products/:slug`    | Detail produk aktif (404 bila tidak ada/nonaktif) |
| GET    | `/api/categories`        | Kategori aktif + jumlah produk                    |
| POST   | `/api/contact`           | Kirim pesan kontak                                |
| GET    | `/api/cart`              | Isi keranjang user login (401 bila belum login)   |
| GET    | `/api/orders`            | Daftar pesanan user login (401 bila belum login)  |
| GET    | `/api/orders/:id`        | Detail pesanan milik user (404 bila bukan miliknya) |
| POST   | `/api/payments/webhook`  | Notifikasi payment gateway (signature wajib valid) |
| GET    | `/api/cron/expire-orders`| Batalkan pesanan lewat batas bayar (butuh `CRON_SECRET`) |
| GET    | `/uploads/products/:file`| Foto produk hasil upload admin |

Harga disimpan sebagai bilangan bulat Rupiah (`Int`).

## SEO, Aksesibilitas & Keamanan Dasar

- `/sitemap.xml` (halaman publik + semua produk & kategori aktif dari database) dan `/robots.txt`
  (halaman admin, akun, keranjang, checkout, dan API tidak diindeks).
- Gambar pratinjau saat link dibagikan (WhatsApp/Facebook/LinkedIn): `app/opengraph-image.tsx`.
- Data terstruktur schema.org: Organization (Beranda) dan Product + Breadcrumb (halaman produk) —
  hanya data nyata, tanpa rating/ulasan karangan.
- **Wajib di production:** `NEXT_PUBLIC_SITE_URL` diisi alamat domain asli (mis. `https://www.domain.co.id`),
  karena dipakai untuk link sitemap, canonical, dan gambar pratinjau.
- Halaman error ramah pengguna di setiap bagian (`error.tsx`) + cadangan `global-error.tsx`;
  detail teknis tidak ditampilkan, hanya kode referensi untuk mencari log.
- Header keamanan: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`
  (HSTS & Content-Security-Policy menyusul di Phase 11).
- Diuji dengan axe-core (WCAG 2.1 AA, 21 halaman: 0 pelanggaran) dan Lighthouse
  (aksesibilitas, best practices, SEO = 100).

## Testing

| Perintah | Isi |
| -------- | --- |
| `npm test` | **Unit** (validasi, format uang, signature payment, upload, password) + **integrasi** (pesanan, stok, pembayaran, admin — dengan database tes sungguhan) |
| `npm run test:watch` | Sama, berjalan ulang otomatis saat file diubah |
| `npm run test:e2e` | **End-to-end** di browser sungguhan: halaman publik, tampilan HP, daftar → keranjang → checkout → bayar (simulasi), akses admin |

**Persiapan sekali:**

```bash
# Database khusus tes (isinya DIHAPUS setiap kali tes berjalan)
createdb begawan_test
# di .env.local:  TEST_DATABASE_URL=postgresql://<user>@localhost:5432/begawan_test?schema=public
npm run test:db:setup        # terapkan migrasi ke database tes (ulangi bila ada migrasi baru)

npm run test:e2e:install     # unduh browser Chromium untuk Playwright (±150 MB)
```

- Tanpa `TEST_DATABASE_URL`, tes integrasi otomatis **dilewati** (tes unit tetap jalan). Demi keamanan, tes menolak
  berjalan bila `TEST_DATABASE_URL` sama dengan `DATABASE_URL` atau nama database-nya tidak mengandung "test".
- Tes E2E memakai server `npm run dev` (dijalankan otomatis bila belum jalan) dan database development yang
  sudah di-seed. Tes membuat akun `e2e-…@test.local` dan pesanan uji di database development.
- Tes admin di E2E butuh `E2E_ADMIN_EMAIL` & `E2E_ADMIN_PASSWORD` di `.env.local` (bila kosong, dilewati).
- Laporan E2E (screenshot & rekaman bila gagal): `npx playwright show-report`.

## Environment Variables

Lihat `.env.example`. Jangan pernah commit `.env.local` atau secret asli.
Hanya variabel berawalan `NEXT_PUBLIC_` yang boleh terlihat di browser.

## Development Phases

0. Project audit & setup ✅
1. Design system & layout ✅
2. Home / About / Contact ✅
3. Database & products ✅
4. Authentication ✅
5. Cart ✅
6. Checkout & orders ✅
7. Payment gateway ✅ (draft — menunggu pilihan gateway)
8. Admin dashboard ✅
9. Polish ✅
10. Testing ✅
11. Production preparation
# website-logam-konstruksi--PT-Begawan-Deru-Utama
