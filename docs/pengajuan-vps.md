# Pengajuan VPS — Sistem HSE, CCTV & Paramedis Monitoring

**Pengaju:** [Diisi: nama pengaju]
**Tanggal:** [Diisi: tanggal]

Dokumen ini dibuat untuk mengajukan penyediaan VPS ke tim IT, berdasarkan konfigurasi deployment aktual (`docker-compose.yml`, `nginx/nginx.conf`) dan status pengembangan aplikasi saat ini (`PRD.md`).

---

## 1. Info Dasar

- **Nama aplikasi:** Sistem HSE, CCTV & Paramedis Monitoring (Pondok Indah Mall)
- **Kondisi saat ini:** Masih berjalan di environment lokal/development (docker-compose di mesin developer, `server_name localhost` di nginx). **Belum ada environment production.** Pengajuan VPS ini adalah untuk menyiapkan environment production pertama.
- **Pengguna:**
  - **Internal:** Petugas CCTV, HSE Officer, Paramedis, dan Manager HSE (akses dashboard operasional dengan login).
  - **Publik:** Pengunjung umum yang mengakses company profile (tanpa login).
- **Tipe akses:** Aplikasi web (browser), diakses dari desktop dan mobile. Tidak ada aplikasi native.

---

## 2. Spesifikasi Teknis

| Komponen | Spesifikasi Diajukan | Alasan |
|---|---|---|
| **OS** | Ubuntu 24.04 LTS | Dukungan jangka panjang, kompatibel penuh dengan Docker & Docker Compose. |
| **CPU** | 2 vCPU (minimum), 4 vCPU (disarankan) | Saat ini ada **7 container** yang berjalan bersamaan lewat `docker-compose.yml`: 1 database (MySQL), 1 backend Go (`backend-cctv`), 4 frontend (masing-masing di-serve oleh nginx di dalam container-nya sendiri: `company-profile`, `frontend-cctv`, `frontend-hse`, `frontend-paramedis`), dan 1 nginx reverse proxy utama. Beban aktual masih ringan (frontend HSE & Paramedis saat ini cuma menampilkan halaman *Coming Soon*, belum ada trafik dashboard sungguhan), tapi CPU perlu ruang untuk 2 backend Go tambahan (`backend-hse`, `backend-paramedis`) yang direncanakan menyusul sesuai roadmap di `PRD.md` — belum ada di `docker-compose.yml` saat ini, jadi belum menambah beban sekarang.
| **RAM** | 4 GB (minimum), 8 GB (disarankan) | MySQL adalah komponen yang paling banyak makan memori di stack ini; sisanya (binary Go, nginx-alpine per frontend, nginx reverse proxy) relatif ringan. RAM 8 GB memberi headroom untuk 2 service backend tambahan yang direncanakan (HSE & Paramedis) tanpa perlu upgrade ulang dalam waktu dekat. |
| **Storage** | 40–80 GB SSD | Kebutuhan saat ini kecil (image Docker + database MySQL untuk data operasional teks/angka, bukan file besar seperti rekaman CCTV — sistem ini analytics-only, tidak menyimpan video). Alokasi diberi ruang tumbuh untuk log, backup database, dan penambahan modul HSE/Paramedis ke depan. |
| **Bandwidth** | ≥ 2 TB/bulan atau unmetered | Trafik didominasi akses dashboard internal (jumlah user terbatas) ditambah company profile publik (marketing site, trafik moderat). Tidak ada streaming video/file besar yang lewat server ini. |
| **Network/Port** | Port **80** (dan **443** setelah SSL aktif) terbuka ke publik. Port lain (termasuk **3306/MySQL**) **tidak** boleh diekspos ke publik. | Konfigurasi saat ini: hanya container `nginx` yang mem-publish port ke host (`80:80`); semua service lain (termasuk MySQL) hanya reachable lewat internal Docker network (`company-network`) dan tidak punya mapping port ke host sama sekali. Kebijakan ini perlu dipertahankan di VPS production. |

---

## 3. Software yang Perlu Didukung

- **Docker & Docker Compose (wajib).** Seluruh stack aplikasi (database, backend, 4 frontend, reverse proxy) dijalankan sebagai container lewat satu `docker-compose.yml`. VPS harus mengizinkan instalasi Docker Engine + Docker Compose plugin, dan idealnya akses root/sudo untuk setup awal.
- **Nginx** — dipakai sebagai reverse proxy utama (bukan software terpisah di VPS, tapi berjalan sebagai salah satu container di dalam stack yang sama). Tidak perlu instalasi Nginx terpisah di level OS, kecuali tim IT lebih memilih Nginx di level host sebagai proxy tambahan di depan Docker (opsional, didiskusikan).
- **MySQL 8** — saat ini dijalankan sebagai container tersendiri (`mysql:8` di dalam `docker-compose.yml`), bukan managed database service.
  - **Open question untuk didiskusikan dengan tim IT:** apakah MySQL tetap dijalankan sebagai container di VPS yang sama (setup saat ini), atau dipindah ke managed database service terpisah (mis. untuk kebutuhan backup/HA yang lebih baik)? Dokumen ini tidak mengasumsikan salah satu — perlu keputusan bersama sebelum provisioning final.

---

## 4. Kebutuhan Jaringan & Domain

- **Domain/subdomain:** [isi domain yang diinginkan] — belum ditentukan, perlu disiapkan sebelum go-live (nginx saat ini masih pakai `server_name localhost`, perlu diganti ke domain sungguhan).
- **SSL/TLS:** Wajib untuk semua path yang publik-facing (company profile di `/`, serta login dashboard HSE/CCTV/Paramedis). Disarankan **Let's Encrypt** (gratis, auto-renewal) kecuali tim IT punya kebijakan sertifikat sendiri. Konfigurasi nginx saat ini baru mendukung HTTP (port 80) — port 443 + sertifikat perlu ditambahkan saat setup production.
- **Catatan keamanan:**
  - Port MySQL (3306) **tidak boleh** diekspos ke internet — hanya boleh diakses lewat internal Docker network, sesuai konfigurasi yang sudah berjalan sekarang.
  - Hanya port 80/443 yang perlu terbuka ke publik lewat firewall VPS.
  - Kredensial database (`MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, dll.) dan `JWT_SECRET` dikelola lewat file `.env` yang **tidak** masuk ke repository — perlu disiapkan langsung di server, bukan di-commit ke git.

---

## 5. Akses & Operasional

- **SSH access untuk deploy:** Dibutuhkan akses SSH (idealnya dengan key-based auth, bukan password) untuk PIC deploy. PIC: [Diisi: nama PIC].
- **Kebijakan backup database — perlu didiskusikan dengan tim IT:**
  - Frekuensi backup yang disarankan tim IT (harian? per beberapa jam?).
  - Masa retensi backup (berapa lama backup disimpan sebelum dihapus).
  - Apakah backup dikelola otomatis oleh tim IT/provider VPS, atau perlu di-setup sendiri di level aplikasi (mis. cron job `mysqldump`).
- **Environment staging:** Perlu didiskusikan apakah dibutuhkan VPS/environment staging terpisah dari production untuk testing sebelum deploy, atau cukup satu environment untuk tahap awal ini (mengingat aplikasi baru akan pertama kali punya environment production).

---

## 6. Justifikasi (Kenapa VPS, Bukan Shared Hosting)

Aplikasi ini berjalan sebagai kumpulan service (backend Go, database MySQL, beberapa frontend, dan reverse proxy Nginx) yang saling terhubung lewat Docker dan Docker Compose. Shared hosting pada umumnya tidak mendukung Docker, custom port/proses long-running, maupun akses root yang dibutuhkan untuk menjalankan setup ini — sehingga dibutuhkan VPS dengan akses root penuh agar seluruh stack bisa di-deploy dan dikelola sebagaimana mestinya.

---

*Dokumen ini disusun berdasarkan `docker-compose.yml`, `nginx/nginx.conf`, dan `PRD.md` per tanggal dokumen ini dibuat. Spesifikasi di atas adalah estimasi awal dan bisa disesuaikan hasil diskusi dengan tim IT.*
