# PRD — Sistem HSE, CCTV & Paramedis Monitoring

Pondok Indah Mall — **Versi Draft 1.10** — Diperbarui 13 September 2026 — HSE

> **Catatan revisi (1.0 → 1.1):** Draft ini disusun ulang dari PRD Draft 1.0 (PDF, dibuat 11 September 2026),
> digabung dengan status teknis aktual yang ditemukan lewat audit codebase (didokumentasikan di `CLAUDE.md`
> pada repo ini). Aturan penggabungan:
> - **Status teknis** (apa yang sudah dibangun/di-deploy) — kalau PDF lama dan `CLAUDE.md` beda, **`CLAUDE.md` yang menang**, karena diambil langsung dari kode & konfigurasi deployment yang berjalan.
> - **Requirement bisnis, goals, dan rencana ke depan** — tetap mengikuti PDF lama sebagai basis, tidak diubah kecuali sudah didiskusikan.
>
> Bagian yang dikoreksi dari draft sebelumnya ditandai dengan **⚠️ Koreksi status teknis** di bagian yang relevan (Bagian 5, 6, dan 8). Isi lain (problem statement, persona, goals, user stories, data model, open questions) dipertahankan dari Draft 1.0.

> **Catatan revisi (1.1 → 1.2):** Update ini didorong oleh audit kode terhadap dua halaman `frontend-cctv` yang baru diperbarui — `DataLocation.jsx` (Data Lokasi) dan `ComplaintRecord.jsx` (Komplain GSL) — dan modul backend pendukungnya di `backend-cctv`. Ringkasan perubahan:
> - **Modul Komplain GSL didokumentasikan untuk pertama kali.** Modul ini ternyata sudah live dan full CRUD (backend `backend-cctv` + frontend `frontend-cctv`) tapi belum pernah tercatat di draft sebelumnya — ditandai **⚠️ Baru, dari audit kode** di Bagian 4, 5, dan 7.
> - **Redesign chart** di Data Lokasi (donut + total di tengah + custom legend breakdown per lokasi) dan Komplain GSL (donut status penanganan + bar chart per kategori) — detail teknis di Bagian 6.
> - **Satu bug data-integrity ditemukan (belum diperbaiki)** di Data Lokasi: total insiden di dashboard bisa tidak match dengan breakdown per lokasi karena ada `IncidentRecord` lama yang field `location`-nya tidak match ke `LocationModels` aktif mana pun. Redesign chart yang masuk sejauh ini murni visual — perhitungan total dan penanganan data tak-tertaut belum disentuh. Detail di Bagian 8, dan ditambahkan sebagai item kerja terbuka.

> **Catatan revisi (1.2 → 1.3):** Bug data-integrity di Data Lokasi yang ditandai "belum diperbaiki" di atas **sudah diperbaiki** di `DataLocation.jsx`: total insiden sekarang dihitung dari data yang benar-benar tampil di breakdown per lokasi (bukan `incidentList.length` mentah), dan dashboard menampilkan warning jumlah insiden yang tidak tertaut ke lokasi aktif alih-alih menyembunyikannya diam-diam. Perbaikan bersifat kode saja — tidak mengubah data model, jadi tidak ada perubahan skema. Detail di Bagian 8.

> **Catatan revisi (1.3 → 1.4):** Setelah bug Data Lokasi di atas diperbaiki, dicek apakah bug sejenis (total tidak match breakdown karena bucket yang tidak exhaustive) ada juga di Komplain GSL — **ternyata ada dan sudah diperbaiki** di `ComplaintRecord.jsx`. Donut chart "Status Penanganan Komplain" sebelumnya cuma punya 3 bucket (Menunggu Followup, Menunggu Status, Selesai) padahal status komplain (`STATUS_OPTIONS`) punya 4 nilai termasuk `Open` dan `In Progress` — komplain dengan status itu hilang diam-diam dari chart walau tetap terhitung di KPI "Total Komplain". Fix-nya membuat bucket chart exhaustive mengikuti `getStage()` (sumber kebenaran yang sama dipakai badge status di tabel), plus warning kalau ada status yang tidak dikenali sistem. Detail di Bagian 6 dan 8.

> **Catatan revisi (1.4 → 1.5):** Audit pola bug yang sama diperluas ke dua halaman pendukung Komplain GSL — `CategoryComplaint.jsx` (Kategori Komplain) dan `GSLOfficers.jsx` (Petugas GSL) — dan **dua bug baru ditemukan dan diperbaiki**:
> - **Kategori Komplain:** ranking kategori (`categoryStats`) hanya menghitung komplain yang kategorinya masih match ke kategori aktif; komplain dengan kategori yang sudah dihapus/diganti nama hilang diam-diam dari ranking, dan persentase per kategori (memakai `complaintList.length` mentah sebagai penyebut) tidak pernah menjumlah ke 100%.
> - **Petugas GSL — Analisis Performa:** ranking petugas hanya mencakup petugas yang masih aktif (backend exclude petugas yang soft-deleted); komplain yang tertaut ke petugas yang sudah dihapus tetap terhitung di data mentah tapi hilang dari ranking **dan** dari KPI "Total Komplain" di halaman ini.
> - Analisis Status Petugas (donut Aktif/Cuti/Nonaktif) **dicek dan dikonfirmasi aman** — `STATUS_OPTIONS` persis 3 nilai yang sama dengan bucket-nya, tidak ada celah silent-drop.
> - Fix untuk kedua bug mengikuti pola yang sama seperti Data Lokasi & status Komplain GSL: hitung breakdown/persentase dari data yang benar-benar match, dan tampilkan warning jumlah data yang tidak tertaut alih-alih menyembunyikannya diam-diam. Detail di Bagian 6 dan 8.

> **Catatan revisi (1.5 → 1.6):** Audit gejala "total tidak match breakdown yang ditampilkan" diperluas ke `ServicePerformance.jsx` (modul CCTV) dan `ListTroubleCamera.jsx`. Tidak ditemukan mekanisme reference-yang-dihapus seperti sebelumnya, tapi ditemukan **3 bug dengan gejala sama lewat mekanisme berbeda — filter-scope yang tidak konsisten (data terfilter tahun/search dicampur dengan data mentah semua tahun)** — dan ketiganya sudah diperbaiki:
> - **`ServicePerformance.jsx` — Analisis Performa Area:** KPI "Total Gangguan" dihitung dari `servicePerformanceList.length` (semua tahun) sementara tabel ranking area di bawahnya dibangun dari data yang sudah difilter tahun/search — dua angka yang ditampilkan berdampingan bisa tidak pernah sama kalau filter tahun aktif.
> - **`ServicePerformance.jsx` — Analisis Riwayat Maintenance:** `recoveryRate` (%) dihitung dari `recovered` (data terfilter tahun) dibagi `total` (data semua tahun) — pembilang dan penyebut beda scope, hasilnya persentase yang secara matematis tidak berarti.
> - **`ListTroubleCamera.jsx` — Camera Error Impact Analysis:** fungsi `getCameraErrorImpactAnalysis()` didefinisikan tanpa parameter dan selalu memakai `troubleList` mentah, walau dipanggil dengan argumen `filteredTroubleList` — argumennya diam-diam diabaikan, jadi panel ini satu-satunya di halaman yang tidak ikut filter tahun/search, beda dari panel-panel analisis lain di halaman yang sama.
> - Fix: samakan scope data (numerator dan denominator/breakdown dari array yang sama), dan tambahkan parameter yang hilang di `getCameraErrorImpactAnalysis` supaya konsisten dengan fungsi analisis lain di file yang sama. Detail di Bagian 6 dan 8.

> **Catatan revisi (1.6 → 1.7):** Audit gejala yang sama diperluas ke sisa halaman `frontend-cctv` yang belum dicek (`CCTVOfficers.jsx`, `CameraOccupancy.jsx`, `Category.jsx`, `Dashboard.jsx`, `DataCCTV.jsx`, `DurationRecord.jsx`, `IncidentRecord.jsx`, `SummaryRequestCam.jsx`, `User.jsx`). Ditemukan **3 bug lagi (sudah diperbaiki)** dan **2 hal yang butuh keputusan produk (belum diubah)**:
> - **`Category.jsx` (Kategori CCTV):** bug identik dengan `CategoryComplaint.jsx` yang sudah diperbaiki di Draft 1.5 — ranking kategori cuma menghitung insiden yang match ke kategori aktif, persentase per kategori pakai `incidentList.length` mentah sebagai penyebut. Fix sama: `unmatchedCategoryCount` + warning banner, penyebut persentase diganti `totalMatchedIncidents`.
> - **`CCTVOfficers.jsx` — Analisis Performa Petugas:** cuma menghitung insiden dari petugas berstatus **Aktif**; insiden milik petugas **Mutasi/Resign** hilang dari `totalOfficer`, `totalIncident`, dan `average` tanpa warning — cakupan exclude-nya lebih luas dari kasus sebelumnya (bukan cuma yang dihapus). Fix: tambah `unmatchedOfficerIncidentCount` + warning banner di kartu ringkasan maupun modal detail.
> - **`DurationRecord.jsx` — Analisis Jenis Kamera:** `getCameraTypeAnalysis()` cuma punya 2 bucket (IP/Analog) padahal form "Jenis Kamera" punya opsi ketiga **Mixed**; record Mixed hilang dari `totalRecorder` dan chart donut, padahal insight text eksplisit menyebut `totalRecorder` sebagai "Total DVR/NVR yang dianalisa". Fix: tambah bucket `totalMixedRecorder` (bucket jadi exhaustive terhadap 3 opsi form), masuk ke ranking dan chart donut (3 slice, bukan 2).
> - **`User.jsx` (belum diubah, perlu diskusi):** role distribution pakai daftar 6 role tetap yang match dropdown saat ini, tapi field `Role` di database bertipe bebas (`varchar`, tanpa enum) — user dengan role di luar daftar (data lama/seed/insert API) berpotensi hilang dari bar chart. Belum diverifikasi ada data seperti itu di database aktual, jadi belum diperbaiki menunggu konfirmasi.
> - **`CameraOccupancy.jsx` (belum diubah, ambiguitas desain):** dua panel memakai penyebut berbeda untuk persentase IP/Analog (`total_kamera` yang diinput manual vs `ip + analog` hasil hitung) — bisa jadi memang disengaja (kapasitas vs realisasi terpasang), bukan bug yang pasti, perlu konfirmasi maksud aslinya sebelum diubah.
> - Halaman lain yang dicek (`DataCCTV.jsx`, `IncidentRecord.jsx`, `SummaryRequestCam.jsx`, `Dashboard.jsx`) dikonfirmasi bersih — `SummaryRequestCam.jsx` malah jadi contoh implementasi filter-tahun yang benar (semua panel analisisnya konsisten pakai array yang sama-sama sudah difilter). `CCTVPerformance.jsx` beserta 4 sub-halaman `CCTVPerformanceLayout/` dikonfirmasi ulang sebagai dead code (tidak terdaftar di routing `App.jsx`), tidak diaudit lebih lanjut. Detail di Bagian 6 dan 8.

> **Catatan revisi (1.7 → 1.8):** Dua hal yang ditandai "belum diubah, butuh keputusan produk" di atas ditindaklanjuti dan **keduanya sudah diselesaikan**:
> - **`User.jsx`:** dicek langsung isi 3 dump SQL yang ada di repo (`db_hse_cctv_pim.sql` — 11 user, `backup.sql` — 1 user) — semua nilai `Role` yang benar-benar ada di data (`Admin`, `Manager HSE`, `Petugas CCTV`, `Petugas HSE`, `Guest`) masuk ke 6 opsi yang ada di dropdown/`roleDistribution`. Jadi ini **risiko laten yang belum termanifestasi**, bukan bug aktif — chart-nya sudah benar/exhaustive relatif terhadap data yang ada. Root cause-nya di backend: kolom `Role` di model `User` (`backend-cctv/models/user.go`) bertipe `varchar(50)` tanpa enum constraint, dan controller `CreateUser`/`UpdateUser` cuma validasi "tidak boleh kosong". **Fix yang diterapkan:** whitelist role (`isValidUserRole()`, daftar sama dengan dropdown frontend) ditambahkan di kedua controller tersebut, supaya role di luar daftar ditolak di titik masuk API, bukan menambal di sisi chart.
> - **`CameraOccupancy.jsx`:** ternyata **bukan ambiguitas desain** — `CameraOccupancyController.go` (backend) sendiri, saat create maupun update, menghitung `PersentaseIP`/`PersentaseAnalog` dari `IP / TotalKamera` — artinya sistem sudah punya definisi resmi: `total_kamera` adalah penyebut yang benar, bukan `ip + analog`. Panel "Occupancy Summary" sudah cocok dengan definisi ini, tapi panel "Camera Type By Area" dan "Analisis Jenis Kamera" ternyata pakai `ip + analog` — dua formula berbeda untuk metrik yang terlihat sama di halaman yang sama. **Fix yang diterapkan:** kedua panel yang menyimpang diseragamkan memakai `total_kamera` sebagai penyebut (sama dengan backend & "Occupancy Summary"); ditambah warning banner yang menghitung berapa baris data occupancy yang `total_kamera`-nya tidak sama dengan `ip + analog` (data-entry inconsistency, karena form tidak memvalidasi ketiganya harus konsisten). Detail di Bagian 6 dan 8; Open Questions #8 diperbarui jadi catatan selesai.

> **Catatan revisi (1.8 → 1.9):** Audit gejala yang sama diperluas ke `company-profile` dan ke halaman dashboard clone di `frontend-hse`/`frontend-paramedis`. **`company-profile` dikonfirmasi bersih** — cuma satu titik fetch data live di seluruh site (`CCTV.jsx`, carousel tim dari `/public/officer`), dan filter role-nya diturunkan langsung dari data yang datang, bukan dicocokkan ke daftar referensi eksternal yang bisa basi, jadi tidak rawan pola bug ini. **`frontend-hse`/`frontend-paramedis` — dikonfirmasi ulang sebagai dead code, DAN dikonfirmasi carry bug yang sama:**
> - Entry point yang benar-benar ter-mount (`frontend-hse/src/App.jsx`, `frontend-paramedis/src/App.jsx`) cuma me-render `ComingSoon` untuk semua route — `dashboard/App.jsx` beserta seluruh halaman clone di baliknya (termasuk yang mengandung bug) **tidak pernah diimpor**, jadi tidak reachable oleh siapa pun. Ini menegaskan ulang temuan yang sudah ada di Bagian 5/8 sejak Draft 1.1.
> - Spot-check langsung ke kode mengonfirmasi clone `CCTVOfficers.jsx`, `DurationRecord.jsx`, `CameraOccupancy.jsx`, `Category.jsx`, `ServicePerformance.jsx`, `ListTroubleCamera.jsx` di kedua frontend membawa persis bug yang sama seperti versi `frontend-cctv` **sebelum** diperbaiki di Draft 1.5–1.8 (isi HSE dan Paramedis identik satu sama lain). `DataLocation.jsx` di clone ini malah versi yang lebih lama lagi — belum ada redesign chart maupun angka "Total Insiden" sama sekali, jadi gejala "dua angka bertentangan" itu sendiri tidak kelihatan di versi ini walau logika silent-drop-nya tetap ada. `ComplaintRecord.jsx`/`CategoryComplaint.jsx`/`GSLOfficers.jsx` (3 bug Komplain GSL) tidak ada di clone ini karena HSE/Paramedis di-fork sebelum modul Komplain GSL dibangun.
> - **Keputusan:** clone ini sengaja TIDAK ditambal sekarang, sesuai rencana yang sudah ada di Bagian 5 (V2) dan Bagian 8 — dashboard HSE/Paramedis akan didesain ulang dengan model domain sendiri, bukan menyambungkan clone CCTV apa adanya, jadi mem-patch bug di kode yang akan diganti/didesain ulang bukan prioritas. Dicatat di Bagian 8 sebagai referensi kalau clone ini dipakai sebagai starting point sebelum desain ulang selesai.

> **Catatan revisi (1.9 → 1.10):** Audit diperluas ke halaman non-dashboard di `frontend-hse`/`frontend-paramedis`, yaitu direktori terpisah `src/pages/` (di luar `src/dashboard/pages/` yang sudah diaudit di Draft 1.9). Ditemukan **dua file yatim (orphaned) per frontend, lebih mati dari clone dashboard, dan sengaja TIDAK dihapus/diubah** (keputusan eksplisit — cukup dicatat):
> - **`src/pages/IncidentRecord.jsx`:** byte-identik 100% dengan `src/dashboard/pages/IncidentRecord.jsx`, tapi tidak diimpor dari mana pun sama sekali (grep menyeluruh ke seluruh source dan `vite.config.js` tidak menemukan satu pun referensi ke `src/pages/...`) — duplikat murni yang tidak pernah masuk dependency graph Vite, beda dari clone dashboard yang setidaknya *bisa* jadi live kalau di-routing.
> - **`src/pages/CCTVOfficer.jsx`:** bukan duplikat — prototype terpisah (`OfficerLeaderboard`, 284 baris, jauh lebih kecil dari `CCTVOfficers.jsx` versi dashboard yang 2449 baris) yang menggabungkan incident + camera trouble + master officer list dengan niat desain yang sebenarnya sudah benar (komentar eksplisit "supaya semua petugas muncul" — persis pola yang diperbaiki di `CCTVOfficers.jsx` Draft 1.7). Tapi rusak secara independen: chart/tooltip/tabelnya mereferensikan `o.totalCases`/`o.incidentCases`/`o.cameraCases` yang tidak pernah di-set di objek `summary` — kalau pernah dirender, semua angka itu `undefined`. Bug ini beda kelas dari pola "total vs breakdown" yang diaudit di sesi ini (referensi field yang salah, bukan silent-drop data), dan tidak relevan diperbaiki karena file ini tidak pernah dieksekusi.
> - Isi `frontend-hse` dan `frontend-paramedis` di kedua file ini identik satu sama lain.
> - **Keputusan:** dibiarkan apa adanya — tidak dihapus maupun diperbaiki. Dicatat di Bagian 8 sebagai tech debt (file yatim yang sebaiknya dihapus saat ada kesempatan bebenah, bukan ditambal).

---

## 1. Problem Statement

Pondok Indah Mall (PIM) mengoperasikan beberapa fungsi operasional kritikal — **Health, Safety & Environment (HSE)**, pemantauan CCTV, dan layanan medis/paramedis — yang sebelumnya dikelola secara manual atau terpisah-pisah: laporan kertas, spreadsheet, dan checklist manual. Akibatnya:

- Tim operasional (HSE officer, CCTV, paramedis) tidak punya satu sumber data yang bisa diandalkan untuk pelaporan insiden, status fasilitas, dan kondisi lapangan secara real-time.
- Manajemen kesulitan mendapat visibilitas cepat atas kondisi keselamatan, keamanan, dan kesehatan tanpa menunggu laporan manual disusun.
- Data historis tersebar dan sulit dianalisis untuk pengambilan keputusan atau audit.

Sistem ini dibangun untuk memusatkan data dan operasional ketiga fungsi tersebut ke dalam platform web terintegrasi, dengan dashboard khusus per modul dan satu company profile sebagai etalase publik.

**Siapa yang dirugikan tanpa sistem ini:**

- **Operator lapangan (HSE)** — kerja dobel input data, respons lambat karena info tidak terpusat.
- **Manajemen** — tidak punya data real-time untuk keputusan operasional/keselamatan.
- **Pengunjung mall** — terdampak tidak langsung jika respons insiden HSE/medis lambat karena koordinasi buruk.

## 2. Target User & Persona

### Persona 1 — Petugas Lapangan (HSE, Petugas CCTV, Paramedis)

Bertugas shift di lapangan — memonitor kondisi fasilitas & CCTV, menangani insiden K3/kebakaran, memberikan respons medis awal, dan mengisi laporan harian sesuai modul masing-masing.

**Sub-role:**

- **HSE Officer** (Team Pak Yudha Pranata) — mencatat insiden HSE (kebakaran, kondisi fasilitas, K3), memonitor kepatuhan safety.
- **Petugas CCTV** — memantau rekaman & statistik CCTV real-time, melaporkan anomali/insiden yang tertangkap kamera.
- **Paramedis** — mencatat kejadian medis, respons P3K, dan status kesehatan di lokasi.

**Butuh:** input cepat dari HP/tablet/PC, akses cepat ke rekaman/statistik CCTV, alur pelaporan insiden yang tidak ribet dan konsisten lintas modul (HSE/CCTV/Paramedis pakai pola input yang sama).

**Pain point saat ini:** laporan manual, harus pindah-pindah aplikasi/sistem untuk cek CCTV vs input laporan HSE vs catatan medis — ketiga modul belum terintegrasi dalam satu alur kerja.

> Catatan: persona untuk modul Paramedis belum dikonfirmasi — lihat Bagian 10, Open Questions.

## 3. Goals & Non-Goals

### Goals

- Satu platform terpusat untuk 3 fungsi operasional (HSE, CCTV, Paramedis) plus 1 company profile publik.
- Alat input dan monitoring cepat serta mobile-friendly untuk operator lapangan.
- Dashboard analitik (chart, statistik, filter tahun) untuk manajemen.
- Standardisasi UI/UX antar modul supaya konsisten dan mudah di-maintain.
- Deployment reliable dan reproducible lewat Docker dan Nginx per modul.

### Non-Goals (untuk versi ini)

- Bukan sistem CCTV recording/VMS pengganti — asumsi sistem ini melengkapi VMS yang sudah ada, bukan menggantikan infrastruktur rekaman (perlu konfirmasi — lihat Open Questions #3, sudah dijawab: analytics-only).
- Bukan sistem HR/payroll untuk staff HSE/security/paramedis.
- Belum mencakup integrasi sensor IoT real-time kecuali sudah ada (perlu konfirmasi).
- Belum mencakup aplikasi mobile native — web responsive lebih dahulu.

## 4. User Stories

### HSE

- Sebagai HSE officer, saya ingin mencatat insiden K3 dari lapangan, supaya laporan langsung tersimpan terpusat tanpa proses manual.
- Sebagai HSE officer, saya ingin melihat status fasilitas keselamatan (APAR, jalur evakuasi, dll.) dalam satu halaman, supaya saya tahu mana yang perlu tindak lanjut.
- Sebagai manajemen, saya ingin melihat statistik insiden HSE per tahun dalam bentuk chart, supaya saya bisa evaluasi tren tanpa membaca laporan mentah.
- Fitur ini masih berstatus **Coming Soon** (frontend menampilkan placeholder dekoratif, belum ada alur input/simpan data sungguhan) — lihat Open Questions #2.

### CCTV

- Sebagai security, saya ingin melihat dashboard status kamera/fasilitas CCTV, supaya saya tahu titik mana yang bermasalah.
- Sebagai manajemen, saya ingin membuka modal analisis per kategori (14 modal yang sudah ada), supaya saya bisa drill-down data tanpa berpindah halaman.
- Sebagai Admin/Manager HSE, saya ingin melihat total insiden per lokasi yang akurat dan diberi tahu kalau ada insiden dengan data lokasi yang sudah tidak valid, supaya saya bisa mempercayai angka di dashboard dan menindaklanjuti data yang bermasalah.
- Fitur ini berstatus **On Going**, sudah punya backend dan frontend yang berjalan (lihat Bagian 5).

### Komplain GSL

> **⚠️ Baru, dari audit kode:** sub-bagian ini belum pernah ada di draft sebelumnya. Modul Komplain GSL ternyata sudah live (bukan Coming Soon) — model, controller, dan route-nya ada di `backend-cctv` (bagian dari service yang sudah di `docker-compose.yml`), dan sidebar `frontend-cctv` sudah punya menu "Komplain GSL" yang mengarah ke halaman CRUD sungguhan (`ComplaintRecord.jsx`, `CategoryComplaint.jsx`, `GSLOfficers.jsx`), bukan placeholder. Alur kerjanya tiga tahap, tercermin dari field-field di model `ComplaintRecord` (lihat Bagian 7).

- Sebagai Petugas GSL, saya ingin mencatat komplain baru dari pelapor (tanggal komplain, lokasi detail, deskripsi, kategori) begitu komplain masuk, supaya ada catatan resmi sejak tahap pertama tanpa menunggu tindak lanjut selesai.
- Sebagai Petugas CCTV, saya ingin mengisi kronologi dan catatan follow-up pada komplain yang sudah masuk, supaya tahap penyelidikan/tindak lanjut tercatat terpisah dari data awal yang diisi Petugas GSL.
- Sebagai Manager HSE, saya ingin mengubah status penanganan komplain (mis. selesai/ditutup) setelah follow-up diisi, supaya saya bisa memantau komplain mana yang masih terbuka dan mana yang sudah tuntas.
- Fitur ini berstatus **On Going** — backend dan frontend sudah berjalan di stack yang sama dengan modul CCTV (lihat Bagian 5).

### Paramedis

- Sebagai paramedis, saya ingin mencatat kasus medis yang ditangani di lapangan, supaya ada rekam jejak dan bisa dianalisis manajemen.
- Fitur ini masih berstatus **Coming Soon** (frontend menampilkan placeholder dekoratif, belum ada alur input/simpan data sungguhan) — lihat Open Questions #1.

### Company Profile

- Sebagai pengunjung/publik, saya ingin melihat informasi umum PIM (fasilitas, kontak, tim) di satu microsite, tanpa perlu login.

## 5. Daftar Fitur — MVP, V2, Nanti

### MVP — sudah selesai

- Landing page 12 section (org chart, fasilitas CCTV, kesehatan, fire safety, program, tim, statistik, kontak, footer) — Company Profile.
- 14 modal analisis dengan desain pastel konsisten — modul CCTV.
- Chart.js termasuk combo chart — modul CCTV (HSE belum punya dashboard fungsional, lihat catatan di bawah). Secara spesifik mencakup: donut chart dengan total di tengah + custom legend breakdown per lokasi (Data Lokasi), dan donut dengan status penanganan komplain + bar chart per kategori (Komplain GSL) — detail teknis di Bagian 6.
- Filter dropdown tahun dinamis — modul CCTV.
- Utilitas alert terstandardisasi (appleSwal) — frontend yang sudah aktif.
- Backend Go + MySQL untuk modul CCTV (`backend-cctv`), berjalan via Docker Compose di belakang nginx, endpoint di-proxy lewat `/api/`.
- **Modul Komplain GSL** (CRUD komplain, kategori komplain, data petugas GSL) — bagian dari `backend-cctv`/`frontend-cctv`, sudah live di stack yang sama dengan modul CCTV.
- **⚠️ Baru, dari audit kode (diperbaiki di Draft 1.3):** Akurasi total insiden di Data Lokasi — total sekarang dihitung dari data yang benar-benar tampil di breakdown per lokasi, dan dashboard menampilkan warning jumlah insiden yang tidak tertaut ke lokasi aktif. Lihat Bagian 8.

> **⚠️ Baru, dari audit kode:** item Komplain GSL di atas baru muncul sekarang di PRD padahal sudah live di kode. Penyebabnya: modul ini dibangun setelah Draft 1.0/1.1 disusun dan tidak ada catatan riwayat pekerjaan yang menyebutkannya secara eksplisit sebelumnya, jadi tidak tertangkap saat audit codebase yang menghasilkan Draft 1.1. Statusnya dikonfirmasi lewat pengecekan langsung: model (`ComplaintRecord`, `ComplaintCategory`, `GSLOfficerModel`), controller, dan router (`RegisterComplaintRoutes`, `RegisterComplaintCategoryRoutes`, `RegisterGSLOfficerRoutes`) ada di `backend-cctv` dan didaftarkan di `SetupRouters()` — service yang sama yang tercantum di `docker-compose.yml` (bukan clone `backend-hse`/`backend-paramedis` yang belum live), dan sidebar `frontend-cctv` menunjuk ke halaman CRUD sungguhan, bukan `ComingSoon`.

> **⚠️ Koreksi status teknis (vs Draft 1.0):**
> Draft sebelumnya menulis *"Backend Go plus MySQL per modul, deploy via Docker — semua modul"* sebagai item MVP yang sudah selesai. Berdasarkan audit codebase (`CLAUDE.md`), ini tidak akurat:
> - Hanya **`backend-cctv`** yang benar-benar terdaftar di `docker-compose.yml` dan di-proxy oleh `nginx.conf` (path `/api/` → `backend-cctv:8081`). Ini satu-satunya backend yang live di stack deployment saat ini.
> - **`backend-hse`** dan **`backend-paramedis`** ada sebagai kode Go (struktur folder identik: `config`, `controllers`, `middlewares`, `models`, `routers`, `utils`), tapi merupakan **clone struktural 1:1 dari `backend-cctv`** — model, route, dan logika bisnisnya masih model CCTV (mis. `IncidentRecord`, `CameraOccupancy`, `IDCCTVModels`), hanya port listen yang beda (`:8082` dan `:8083`). Belum ada domain model khusus HSE atau Paramedis di dalamnya.
> - Kedua service ini **tidak terdaftar** di `docker-compose.yml` maupun `nginx.conf` — artinya tidak ada jalur network yang membuat keduanya bisa diakses lewat stack yang jalan sekarang. Statusnya scaffolding, bukan layanan yang di-deploy.
> - Konsekuensinya untuk perencanaan: membangun modul HSE/Paramedis bukan sekadar "menyalakan" backend yang sudah ada, melainkan (1) mendesain ulang model data sesuai domain masing-masing, (2) baru setelah itu mendaftarkan service-nya ke `docker-compose.yml` dan menambah `location` block di `nginx.conf`. Ini menegaskan ulang Open Questions #1 dan #2 di Draft 1.0 yang memang sudah menandai scope ini sebagai belum dikonfirmasi.

- ~~Dashboard routing dengan prefix `/dashboard/` — semua modul dashboard~~ — **dikoreksi, lihat catatan routing di bawah.**

> **⚠️ Koreksi status teknis (routing prefix):**
> Draft 1.0 mencantumkan *"Dashboard routing dengan prefix `/dashboard/` — semua modul dashboard"* sebagai fitur MVP yang selesai. Kode aktual (dikonfirmasi lewat `CLAUDE.md` dan pengecekan `main.jsx`/`nginx.conf`) menunjukkan routing per-modul memakai prefix yang **berbeda-beda**, bukan `/dashboard/` bersama:
> - `frontend-cctv` — React Router `basename="/cctv"`, di-serve nginx di `location ^~ /cctv/`.
> - `frontend-hse` — di-serve nginx di `location ^~ /login/hse/`.
> - `frontend-paramedis` — di-serve nginx di `location ^~ /login/paramedis/`.
> - `company-profile` — di-serve di `/` (root).
>
> Ada beberapa commit historis (`b093698`, `f919c13`, `181f2d8`) yang menyebut "prefix `/dashboard`" pada `Sidebar.jsx`/`Topbar.jsx`/redirect logout, tapi perubahan itu dilakukan di struktur `src/` lama sebelum refactor monorepo (`53c7990`) yang memecah project jadi `frontend-cctv`/`frontend-hse`/`frontend-paramedis`. Prefix `/dashboard` tersebut **tidak ditemukan** lagi di kode `frontend-cctv` hasil refactor. Kalau prefix `/dashboard/` memang masih jadi target, ini perlu masuk sebagai item kerja baru, bukan dianggap sudah selesai.

### V2 — dalam pengembangan

- Dashboard fungsional untuk modul **HSE** (saat ini placeholder dengan elemen dekoratif *gauge needle*) — status: Coming Soon. Frontend `frontend-hse` sudah punya kloningan halaman dashboard CCTV di `src/dashboard/`, tapi `App.jsx`-nya saat ini hanya me-render halaman `ComingSoon` untuk semua route — kode dashboard yang ada belum tersambung.
- Dashboard fungsional untuk modul **Paramedis** (saat ini placeholder dengan elemen dekoratif *ECG monitor*) — status: Coming Soon, kondisi kode setara dengan HSE di atas.
- Backend domain-specific untuk HSE dan Paramedis — **item baru**, ditambahkan berdasarkan temuan status teknis di atas. Mencakup: desain model data sesuai domain (bukan reuse model CCTV), lalu pendaftaran service ke `docker-compose.yml` dan `nginx.conf` supaya benar-benar bisa diakses.
- Input insiden dari lapangan lewat form mobile-friendly — modul HSE, scope belum dikonfirmasi.
- Pencatatan kasus medis — modul Paramedis, scope belum dikonfirmasi.
- **⚠️ Baru, dari audit kode:** Keseragaman styling chart Komplain GSL dengan Data Lokasi (donut total di tengah, bar gradient + value-label) — kalau ini memang jadi target, saat ini implementasinya masih pakai Chart.js polos (legend bawaan, warna solid). Lihat Bagian 6.

### Nanti / Backlog

- Integrasi sensor IoT real-time, jika relevan.
- Role-based access control lintas modul secara terpadu, jika belum ada.
- Notifikasi atau alert real-time untuk insiden kritikal.
- Export laporan PDF/Excel dari dashboard analitik.

> Catatan: pembagian di atas didasarkan pada riwayat pekerjaan yang tercatat dan audit kode aktual. Item yang scope-nya belum dikonfirmasi ditandai secara eksplisit — lihat Bagian 10, Open Questions.

## 6. Functional Requirements per Fitur MVP

### Landing Page (Company Profile)

- Menampilkan 12 section statis/semi-dinamis: org chart, fasilitas CCTV, info kesehatan, fire safety, program, tim, statistik, kontak, footer.
- Harus responsive di mobile dan desktop.
- Tidak memerlukan login.

### Routing per Modul (nginx + React Router)

> **⚠️ Menggantikan bagian "Dashboard Routing" di Draft 1.0** — lihat koreksi di Bagian 5.

- Setiap frontend SPA punya prefix path sendiri yang harus **sinkron** antara `basename` React Router-nya dan `location` block nginx yang meng-arahkan ke situ (`/cctv/` untuk CCTV, `/login/hse/` untuk HSE, `/login/paramedis/` untuk Paramedis, `/` untuk company profile).
- Kalau salah satu sisi berubah (basename di kode atau location di nginx) tanpa mengubah yang lain, app akan pecah di stack yang di-deploy walau tetap jalan normal saat dev standalone (`npm run dev`) — ini pernah jadi sumber bug routing sebelumnya.

### Modal Analisis CCTV — 14 modal

- Setiap modal menampilkan data analisis kategori tertentu, kategori spesifik belum didetailkan dalam catatan dan perlu dilengkapi.
- Desain konsisten: skema warna pastel, layout seragam antar modal.
- Bisa dibuka dan ditutup tanpa reload halaman.

### Chart & Filter Tahun

- Chart.js untuk visualisasi, termasuk combo chart, kemungkinan untuk data insiden per bulan/tahun.
- Dropdown filter tahun dinamis, mengikuti data yang tersedia di database, bukan hardcode tahun.
- Saat ini hanya berjalan penuh di modul CCTV; HSE/Paramedis akan memakai pola yang sama begitu dashboard-nya dibangun (lihat Open Questions #1).
- **Data Lokasi (`DataLocation.jsx`):** donut chart (`Doughnut` dari `react-chartjs-2`, `cutout: '72%'`) dengan angka total insiden di-overlay di tengah lewat elemen HTML `position: absolute` di atas canvas (bukan plugin Chart.js), plus custom legend breakdown per lokasi (list HTML biasa dengan warna, jumlah, dan persentase per baris) menggantikan legend bawaan Chart.js. Tooltip custom menampilkan jumlah dan persentase per lokasi. Semuanya native Chart.js + markup React, tidak menambah dependency baru.
- **Komplain GSL (`ComplaintRecord.jsx`):** donut chart status penanganan komplain (`Doughnut`, `cutout: '65%'`, legend bawaan Chart.js di posisi bawah) dan bar chart jumlah komplain per kategori (`Bar`, warna solid ungu `#8b5cf6`, `borderRadius: 10`). Donut-nya membagi komplain ke 6 bucket status yang saling eksklusif dan exhaustive (`Menunggu Followup`, `Menunggu Status`, `Open`, `In Progress`, `Solved`, `Closed`, hanya bucket dengan data > 0 yang ditampilkan) lewat helper `getStage()` yang sama dipakai badge status di tabel, supaya totalnya selalu konsisten dengan KPI "Total Komplain". Komplain dengan status di luar bucket yang dikenal (data lama) dihitung terpisah dan ditampilkan sebagai warning, bukan di-skip diam-diam.
- **Kategori Komplain (`CategoryComplaint.jsx`):** Pie chart + sidebar ranking per kategori, warna dari palet `pieColors` yang sama dipakai Data Lokasi. Sejak Draft 1.5, ranking dan persentase per kategori cuma menghitung komplain yang kategorinya masih match ke `kategoriList` aktif, dengan warning banner kalau ada komplain yang tidak match (lihat Bagian 8).
- **Petugas GSL (`GSLOfficers.jsx`):** Bar chart "Peringkat Penanganan Komplain" (top 10 petugas berdasarkan jumlah komplain) dan Doughnut "Analisis Status Petugas" (Aktif/Cuti/Nonaktif). Sejak Draft 1.5, ranking performa petugas disertai warning kalau ada komplain yang tertaut ke petugas yang sudah dihapus (lihat Bagian 8); breakdown status petugas sudah dikonfirmasi exhaustive sejak awal.
- **Service Performance (`ServicePerformance.jsx`):** dashboard multi-panel (Ringkasan Service, Analisis Performa Area, Analisis Riwayat Maintenance, dll.) dengan filter tahun (`selectedServicePerformanceYear`) yang diterapkan lewat `filteredServicePerformance`. Sejak Draft 1.6, KPI "Total Gangguan" di panel Analisis Performa Area dan "Tingkat Pemulihan" di panel Analisis Riwayat Maintenance dihitung dengan scope data yang konsisten (lihat Bagian 8) — sebelumnya masing-masing mencampur data terfilter dan data mentah semua tahun.
- **List Trouble Camera (`ListTroubleCamera.jsx`):** dashboard multi-panel serupa dengan filter tahun (`selectedYear`) lewat `filteredTroubleList`. Sejak Draft 1.6, panel "Camera Error Impact Analysis" (`getCameraErrorImpactAnalysis`) ikut menerima dan memakai parameter `data` seperti panel analisis lain di halaman ini, supaya konsisten mengikuti filter tahun/search yang aktif (lihat Bagian 8).
- **Kategori CCTV (`Category.jsx`):** Pie chart + sidebar ranking per kategori insiden CCTV, struktur identik dengan `CategoryComplaint.jsx`. Sejak Draft 1.7, ranking dan persentase per kategori cuma menghitung insiden yang kategorinya masih match ke `kategoriList` aktif, dengan warning banner kalau ada insiden yang tidak match (lihat Bagian 8).
- **Petugas CCTV (`CCTVOfficers.jsx`):** Bar chart "Peringkat Performa Petugas" (insiden ditangani per petugas, filter tahun) dan Doughnut status petugas (Aktif/Mutasi/Resign — dikonfirmasi exhaustive). Sejak Draft 1.7, ranking performa disertai warning kalau ada insiden tahun berjalan yang tercatat atas nama petugas berstatus bukan Aktif (lihat Bagian 8).
- **Duration Record (`DurationRecord.jsx`):** Doughnut dua-ring "Analisis Jenis Kamera" (IP vs Analog, plus ring persentase). Sejak Draft 1.7, chart dan ranking-nya punya 3 slice/bucket (IP Camera, Analog Camera, Mixed) mengikuti 3 opsi form "Jenis Kamera" yang sebenarnya, bukan cuma 2 (lihat Bagian 8).
- **Camera Occupancy (`CameraOccupancy.jsx`):** beberapa panel analisis (Occupancy Summary, Camera Type Analysis, Camera Type By Area) menampilkan persentase IP/Analog Camera dari data `camera_occupancy`. Sejak Draft 1.8, seluruh panel konsisten memakai `total_kamera` sebagai penyebut persentase (sama dengan formula `PersentaseIP`/`PersentaseAnalog` yang dihitung backend), dengan warning banner kalau ada baris data yang `total_kamera`-nya tidak sama dengan `ip + analog` (lihat Bagian 8).

> **⚠️ Koreksi vs deskripsi awal perubahan ini:** chart Komplain GSL sempat direncanakan meniru gaya Data Lokasi persis (donut dengan total di tengah, bar dengan gradient warna dan value-label per batang), tapi audit kode menunjukkan implementasi yang benar-benar berjalan saat ini **belum** memakai center-total overlay, gradient, maupun plugin value-label — donut-nya pakai legend bawaan Chart.js dan bar-nya warna solid tanpa label angka di atas batang. Kalau keseragaman visual dengan Data Lokasi memang jadi target, ini perlu masuk sebagai item kerja baru (lihat Bagian 5 V2 dan Bagian 8).

### Backend Go + MySQL

> **⚠️ Koreksi status teknis (vs Draft 1.0):** requirement di bawah berlaku penuh untuk `backend-cctv`. Untuk `backend-hse` dan `backend-paramedis`, lihat catatan di Bagian 5 — keduanya masih clone kode CCTV yang belum di-deploy, jadi requirement ini baru berlaku setelah domain model-nya didesain ulang.

- Setiap modul (`backend-cctv`, dan nantinya `backend-hse`, `backend-paramedis`) punya service Go terpisah dengan struktur folder konsisten: `config`, `controllers`, `middlewares`, `models`, `routers`, `utils`.
- `backend-cctv`: JWT-based auth, GORM + MySQL, auto-migration dan seeding default user saat startup, di-proxy nginx di `/api/`.
- Base image Docker sudah diperbaiki ke versi Go yang sesuai (`go.mod` mensyaratkan Go 1.25.0).
- Fix data MySQL untuk status NULL sudah diterapkan di `backend-cctv`, perlu dipastikan constraint/validasi di level aplikasi juga mencegah NULL masuk lagi ke depannya.

## 7. Sketsa Data Model

> Catatan: berikut sketsa awal berdasarkan struktur folder dan fitur yang diketahui. Field detail dan skema pasti perlu divalidasi langsung dari file `db_hse_cctv_pim.sql` di masing-masing backend. Model di bawah ini adalah model yang **benar-benar dipakai `backend-cctv`** — `backend-hse` dan `backend-paramedis` saat ini mendefinisikan model yang identik (clone), belum ada model domain HSE/Paramedis yang sesungguhnya.

### HSE

- **Coming Soon** — belum ada model domain HSE (mis. checklist APAR, jalur evakuasi, insiden K3) yang terpisah dari model CCTV.

### CCTV

- `CameraOccupancy`: `id, area, total_kamera, ip, analog, persentase_ip, persentase_analog, jumlah_kamera_tambahan, keterangan`
- `CategoryModels`: `id, name`
- `IDCCTVModels`: `id, id_camera, id_nvr, lokasi, area, kondisi, jumlah_error, jumlah_request, jumlah_on_kembali, jumlah_durasi_error, average_durasi_x_error`
- `OfficerModels`: `id, name_officer, gender, role, status, tanggal_status`
- `RecordingDuration`: `id, no_dvr_nvr, jenis_kamera, durasi_rekaman_hari, kapasitas_tb, keterangan`
- `IncidentRecord`: `id, datetime_of_incident, location, category, description_of_incident, name_officer, information, datetime_complete, duration`
- `ListCameraTrouble`: `id, id_camera, tanggal_input, lokasi, lokasi_detail, keterangan, petugas, start_error, request_perbaikan, selesai_perbaikan, status, durasi_error, response_time, average_response`
- `LocationModels`: `id, name` — **tidak punya kolom soft-delete** (`DeletedAt`); `DeleteLocation` di `LocationController.go` melakukan hard delete lewat GORM. Lihat Bagian 8 dan Open Questions #7 untuk implikasinya terhadap histori `IncidentRecord`/`ComplaintRecord`.
- `ServicePerformance`: `id, area, perangkat, total_camera_affected, tanggal_kerusakan, tanggal_dilaporkan, tanggal_berfungsi_kembali, total_durasi_perbaikan, status, keterangan`
- `SummaryRequestCamera`: `id, id_camera, tanggal_request, lokasi, lokasi_detail, tanggal_pemasangan, status, progress_days, input_database, keterangan`

> **⚠️ Baru, dari audit kode — modul Komplain GSL:** tiga model berikut belum pernah tercatat di draft sebelumnya, ditemukan lewat audit kode (`backend-cctv/models/`). Field diambil langsung dari struct Go, bukan dikira-kira.

- `ComplaintRecord` (tabel `complaint_record`): `id, complaint_date, reporter_name, gsl_officer_id (FK → GSLOfficerModel), incident_date, detail_location, complaint_description, date_time_reported, category_id (FK → ComplaintCategory), month, chronology (nullable), date_time_followed_up (nullable), notes (nullable), status (nullable), deleted_at`. Diisi bertahap: field tahap 1 (wajib saat create, oleh Petugas GSL) sampai `month`; `chronology`/`date_time_followed_up`/`notes` diisi belakangan oleh Petugas CCTV (tahap 2); `status` diisi belakangan oleh Manager HSE (tahap 3). "Total Response" sengaja tidak disimpan sebagai kolom — dihitung di controller dari selisih `date_time_followed_up - date_time_reported` supaya tidak out-of-sync kalau salah satu tanggal diedit belakangan. Sudah punya soft-delete (`deleted_at` via `gorm.DeletedAt`).
- `ComplaintCategory` (tabel `complaint_category`): `id, name, deleted_at` — sudah punya soft-delete.
- `GSLOfficerModel` (tabel `gsl_officer`): `id, name_officer, gender, role, status, tanggal_status (nullable), deleted_at` — sudah punya soft-delete.

### Paramedis

- **Coming Soon** — sama seperti HSE, belum ada model domain Paramedis yang sesungguhnya.

### User / Auth lintas modul

- `User`: `id, nama, role, modul_akses` — asumsi ada auth berbasis role, belum dikonfirmasi shared across modul atau per-modul secara final (lihat Open Questions #4 — sudah dijawab: **auth per-modul, terpisah**, dengan Manager HSE mendapat full admin access ke 3 modul).
- Struct `User` sebenarnya (`backend-cctv/controllers/user.go` dan `models`) sedang dalam perubahan aktif di working tree repo ini — cek diff terbaru sebelum mengasumsikan field final.

## 8. Edge Case & Failure Mode

- Status NULL di MySQL — sudah pernah terjadi dan sudah di-fix di `backend-cctv`, tapi perlu dipastikan constraint/default value di level DB supaya tidak berulang.
- **⚠️ Direvisi:** ~~Routing dashboard salah prefix — pernah terjadi dan sudah di-fix, risiko berulang jika ada halaman baru tanpa mengikuti konvensi `/dashboard/`~~ → Konvensi yang benar-benar berlaku saat ini adalah **basename per-modul yang harus sinkron dengan nginx `location` block-nya masing-masing** (`/cctv/`, `/login/hse/`, `/login/paramedis/`), bukan satu prefix `/dashboard/` bersama. Risiko utamanya: kalau basename di kode React Router diubah tanpa mengubah `nginx.conf` (atau sebaliknya), app pecah di stack Docker walau tetap terlihat normal saat `npm run dev` lokal.
- **⚠️ Baru, dari audit kode:** Asumsi bahwa `backend-hse` dan `backend-paramedis` "tinggal di-deploy" itu keliru — keduanya masih clone struktural `backend-cctv` (model, route, logika bisnis identik, cuma port beda) dan tidak terdaftar di `docker-compose.yml`/`nginx.conf`. Perencanaan timeline untuk modul HSE/Paramedis harus menghitung waktu desain ulang model data domain-specific, bukan cuma waktu "nyalain service yang sudah ada".
- Modul Paramedis dan HSE dashboard belum solid — risiko data placeholder Coming Soon bisa membingungkan user asli jika sistem sudah dipakai produksi sebagian. Diperkuat oleh temuan bahwa `frontend-hse`/`frontend-paramedis` bahkan me-render `ComingSoon` di semua route lewat `App.jsx`, walau kode dashboard clone-nya sudah ada di folder tapi belum disambungkan.
- Docker base image mismatch — pernah menyebabkan build gagal, sudah di-fix (`go.mod` backend-cctv mensyaratkan Go 1.25.0), pertimbangkan pinning versi base image di semua Dockerfile termasuk frontend (saat ini `node:20-alpine` tanpa pin minor/patch).
- Filter tahun dinamis dengan data kosong — belum jelas bagaimana UI menangani kondisi saat tidak ada data sama sekali untuk tahun tertentu.
- Konsistensi desain antar 4 frontend terpisah (`frontend-cctv`, `frontend-hse`, `frontend-paramedis`, `company-profile`) — risiko drift karena masing-masing adalah project npm independen (bukan monorepo dengan shared component library), sekalipun struktur foldernya identik hasil clone dari `frontend-cctv`.
- Tidak ada test runner (Jest/Vitest/Go test) di seluruh repo saat ini — perubahan pada model/route yang di-share antar tiga backend clone berisiko regresi diam-diam kalau hanya di-cek manual.
- **⚠️ Baru, dari audit kode — ditemukan dan diperbaiki di Draft 1.3:** Total insiden di dashboard Data Lokasi (`DataLocation.jsx`) sempat bisa tidak match dengan breakdown per lokasi. Penyebabnya: `getChartData()` hanya menghitung insiden yang field `location`-nya cocok persis dengan salah satu `LocationModels` yang masih aktif — `IncidentRecord` lama yang lokasinya sudah dihapus/diganti nama (lihat `LocationModels` di Bagian 7, tidak ada soft-delete) di-skip diam-diam dari breakdown, sementara angka total (`totalInsiden`) dihitung dari seluruh `incidentList` tanpa filter yang sama. **Fix yang sudah diterapkan:** total sekarang dihitung dari penjumlahan data yang benar-benar ditampilkan di breakdown (bukan `incidentList.length` mentah), dan dashboard menampilkan warning banner berisi jumlah insiden yang "tidak tertaut ke lokasi aktif" alih-alih menyembunyikannya diam-diam (`unmatchedCount` di `getChartData()`, ditampilkan lewat `unmatchedIncidentCount`). Root cause di sisi data (histori `IncidentRecord`/`ComplaintRecord` bisa lepas dari referensi kalau `LocationModels`/`CategoryModels` dihapus tanpa soft-delete) masih terbuka — lihat Open Questions #7.
- **⚠️ Baru, dari audit kode — ditemukan dan diperbaiki di Draft 1.4:** Bug sekelas ditemukan juga di Komplain GSL (`ComplaintRecord.jsx`) setelah dicek menyusul temuan Data Lokasi di atas. Donut chart "Status Penanganan Komplain" sebelumnya cuma punya 3 bucket saling eksklusif (`Menunggu Followup`, `Menunggu Status`, `Selesai`), padahal field `status` komplain bisa diisi salah satu dari 4 nilai `STATUS_OPTIONS` (`Open`, `In Progress`, `Solved`, `Closed`) lewat form "Set Status" Manager HSE, dan `Open`/`In Progress` memang dipakai sebagai badge status di tabel (`getStage()` + `stageStyle`). Akibatnya, komplain yang sudah punya `chronology` dan `status: 'Open'` atau `'In Progress'` tidak masuk bucket manapun di chart (bukan `Menunggu Followup` karena chronology sudah ada, bukan `Menunggu Status` karena status sudah ada, bukan `Selesai` karena bukan Solved/Closed) — hilang diam-diam dari donut walau tetap terhitung di KPI "Total Komplain". **Fix yang sudah diterapkan:** bucket chart diperluas jadi 6 status (menampilkan hanya yang datanya > 0) memakai `getStage()` yang sama dengan badge tabel, sehingga totalnya konsisten by construction; status yang tidak dikenali sistem (data lama) dihitung terpisah lewat `unmatchedStatusCount` dan ditampilkan sebagai warning, bukan di-skip diam-diam.
- **⚠️ Baru, dari audit kode — ditemukan dan diperbaiki di Draft 1.5:** Dua bug sekelas lagi ditemukan di dua halaman pendukung Komplain GSL, setelah pola yang sama dicek secara sistematis:
  - **Kategori Komplain (`CategoryComplaint.jsx`):** ranking kategori (Pie chart + sidebar) cuma menghitung komplain yang `category.name`-nya match ke `kategoriList` aktif. Fix: tambah `unmatchedCategoryCount` (dihitung terpisah, ditampilkan sebagai warning banner), dan ganti penyebut persentase per kategori dari `complaintList.length` mentah jadi `totalMatchedComplaints` (jumlah yang benar-benar match) supaya persentase antar kategori konsisten menjumlah ke 100%.
  - **Petugas GSL — Analisis Performa (`GSLOfficers.jsx`):** ranking petugas (`getOfficerPerformanceAnalysis()`) cuma mencakup petugas yang masih ada di `officers` (backend exclude petugas yang soft-deleted). Fix: tambah `unmatchedOfficerComplaintCount` yang menjumlah komplain bermilik petugas yang sudah dihapus, ditampilkan sebagai warning banner di kartu ringkasan maupun modal detail "Analisis Performa Petugas GSL", supaya KPI "Total Komplain" di halaman ini tidak disalahartikan sebagai total komplain sesungguhnya di sistem.
  - Analisis Status Petugas (donut Aktif/Cuti/Nonaktif) di halaman yang sama **dicek dan dikonfirmasi tidak bermasalah** — enumerasi `STATUS_OPTIONS` di form create/edit persis sama dengan 3 bucket di `statusMap`, jadi tidak ada celah nilai status yang lolos tanpa bucket.
- **⚠️ Baru, dari audit kode — ditemukan dan diperbaiki di Draft 1.6:** Audit gejala yang sama diperluas ke `ServicePerformance.jsx` dan `ListTroubleCamera.jsx` (modul CCTV). Kali ini bukan reference yang dihapus, tapi **filter-scope yang tidak konsisten** — angka pembilang/penyebut atau KPI/breakdown yang ditampilkan berdampingan diam-diam diambil dari dua array berbeda (satu sudah difilter tahun/search, satu belum):
  - **`ServicePerformance.jsx` — Analisis Performa Area:** KPI "Total Gangguan" (`getAreaPerformanceAnalysis().totalIncident`) dihitung dari `servicePerformanceList.length` (semua tahun), padahal tabel ranking area di bawahnya dibangun dari `filteredServicePerformance` (sudah difilter tahun/search) — dua angka yang tampil berdampingan bisa berbeda kalau filter tahun aktif. **Fix:** `totalIncident` sekarang dijumlah dari `ranking` yang sama yang dipakai tabel, bukan dihitung ulang dari list mentah.
  - **`ServicePerformance.jsx` — Analisis Riwayat Maintenance:** `recoveryRate = recovered / total` mencampur `recovered` dari `filteredServicePerformance` (per-tahun terpilih) dengan `total` dari `servicePerformanceList.length` (semua tahun) — pembilang dan penyebut beda scope, persentase yang dihasilkan tidak berarti secara matematis. **Fix:** `recovered` diseragamkan memakai `servicePerformanceList` yang sama dengan `total`, karena bagian "Riwayat Maintenance" ini memang didesain menampilkan histori semua tahun (bukan mengikuti filter tahun), bukan `filteredServicePerformance`.
  - **`ListTroubleCamera.jsx` — Camera Error Impact Analysis:** `getCameraErrorImpactAnalysis()` didefinisikan tanpa parameter dan selalu memakai `troubleList` mentah, walau dipanggil dengan argumen `getCameraErrorImpactAnalysis(filteredTroubleList)` — argumennya diam-diam diabaikan JavaScript (bukan error), sehingga panel ini satu-satunya di halaman yang tidak ikut filter tahun/search seperti panel analisis lain (`getCameraRecoveryAnalysis`, `getTroubleAreaAnalysis`, `getCameraErrorAnalysis`, `getCameraErrorDurationAnalysis`, yang semuanya sudah benar menerima parameter `data`). **Fix:** tambah parameter `data = []` dan pakai `data` alih-alih `troubleList` di dalam fungsi, konsisten dengan fungsi analisis lain di file yang sama.
  - Pola aggregasi lain yang dicek di kedua file (breakdown per status, per perangkat, per kamera, per range durasi) dikonfirmasi dibangun secara dinamis dari array yang sama dengan totalnya (exhaustive), tidak ada celah silent-drop di situ.
- **⚠️ Baru, dari audit kode — ditemukan dan diperbaiki di Draft 1.7:** Audit gejala yang sama diperluas ke sisa halaman `frontend-cctv` yang belum dicek. Tiga bug baru ditemukan (kembali ke mekanisme Flavor A — reference yang tidak match hilang diam-diam, bukan filter-scope):
  - **`Category.jsx`:** identik dengan bug `CategoryComplaint.jsx` (Draft 1.5) — ranking kategori insiden CCTV cuma menghitung insiden yang match ke `kategoriList` aktif, persentase pakai `incidentList.length` mentah. **Fix:** `unmatchedCategoryCount` + warning banner, penyebut persentase diganti `totalMatchedIncidents` (sum dari breakdown yang ditampilkan).
  - **`CCTVOfficers.jsx`:** panel "Analisis Performa Petugas" cuma menghitung insiden dari petugas berstatus Aktif — insiden milik petugas Mutasi/Resign hilang dari `totalOfficer`, `totalIncident`, dan `average`, tanpa indikasi apa pun. Lebih luas dari kasus GSL sebelumnya karena excludenya bukan cuma "sudah dihapus" tapi status apa pun selain Aktif. **Fix:** tambah `unmatchedOfficerIncidentCount` (dihitung di `fetchIncidentSummary`) + warning banner di kartu ringkasan dan modal detail performa.
  - **`DurationRecord.jsx`:** `getCameraTypeAnalysis()` cuma punya 2 bucket (IP/Analog), padahal dropdown "Jenis Kamera" (`formData.jenis_kamera`) punya opsi ketiga **Mixed** — record Mixed hilang dari `totalRecorder`, ranking, dan chart donut, padahal insight text eksplisit menyebut `totalRecorder` sebagai "Total DVR/NVR yang dianalisa" (klaim kelengkapan yang tidak akurat). **Fix:** tambah bucket `totalMixedRecorder`, masuk ke `ranking` dan chart donut (jadi 3 slice, bukan 2) — beda pendekatan dari kasus lain karena di sini "Mixed" bukan data anomali yang perlu warning, melainkan kategori sah yang memang belum punya tempat di bucket.
  - **`User.jsx` (sempat dilaporkan BELUM diperbaiki — ditindaklanjuti dan diselesaikan di Draft 1.8):** role distribution memakai 6 role tetap yang match dropdown saat ini, sementara kolom `Role` di database bertipe bebas (`varchar`, tanpa enum constraint). Dicek langsung ke 3 dump SQL yang ada di repo — semua `Role` yang benar-benar ada di data cocok dengan 6 opsi di dropdown, jadi ini **risiko laten, bukan bug yang sudah termanifestasi**. Chart-nya sendiri tidak diubah (sudah benar). **Fix yang diterapkan:** whitelist role (`isValidUserRole()`) ditambahkan di `CreateUser`/`UpdateUser` (`backend-cctv/controllers/user.go`), menolak role di luar daftar di titik masuk API, supaya risiko ini tidak pernah termanifestasi ke depannya.
  - **`CameraOccupancy.jsx` (sempat dilaporkan sebagai ambiguitas desain — ternyata bug, sudah diperbaiki di Draft 1.8):** panel "Occupancy Summary" menghitung persentase IP/Analog pakai `total_kamera` (field input manual) sebagai penyebut, sementara panel "Camera Type By Area" dan "Analisis Jenis Kamera" memakai `ip + analog` (hasil hitung) sebagai penyebut. Dicek ke `CameraOccupancyController.go` (backend) — controller ini sendiri menghitung `PersentaseIP`/`PersentaseAnalog` dari `IP / TotalKamera`, jadi sistem sudah punya definisi resmi dan dua panel yang pakai `ip + analog` itu yang menyimpang, bukan pilihan desain yang sah. **Fix yang diterapkan:** kedua panel yang menyimpang diseragamkan memakai `total_kamera` sebagai penyebut, plus warning banner yang menghitung baris data occupancy yang `total_kamera`-nya tidak sama dengan `ip + analog` (data-entry inconsistency, karena form `total_kamera`/`ip`/`analog` tidak saling divalidasi).
  - Halaman lain yang dicek (`DataCCTV.jsx`, `IncidentRecord.jsx`, `SummaryRequestCam.jsx`, `Dashboard.jsx`) dikonfirmasi bersih dari pola ini. `SummaryRequestCam.jsx` secara khusus jadi contoh implementasi filter-tahun yang benar: semua panel analisisnya konsisten memakai satu array yang sama-sama sudah difilter tahun (`yearFilteredRequestCamera`), berbeda dari `ServicePerformance.jsx`/`ListTroubleCamera.jsx` sebelum diperbaiki di Draft 1.6.
- **⚠️ Baru, dari audit kode — Draft 1.9, sengaja TIDAK diperbaiki:** Audit gejala yang sama diperluas ke `company-profile` dan ke dashboard clone `frontend-hse`/`frontend-paramedis`.
  - **`company-profile`** dikonfirmasi bersih dari pola ini — satu-satunya fetch data live di seluruh site (`CCTV.jsx`, carousel tim dari `/public/officer`) menurunkan filter role-nya langsung dari data yang datang, bukan dari daftar referensi eksternal yang bisa basi.
  - **`frontend-hse`/`frontend-paramedis`** — clone `CCTVOfficers.jsx`, `DurationRecord.jsx`, `CameraOccupancy.jsx`, `Category.jsx`, `ServicePerformance.jsx`, `ListTroubleCamera.jsx` di kedua frontend dikonfirmasi membawa persis bug yang sama seperti `frontend-cctv` sebelum diperbaiki di Draft 1.5–1.8 (isi HSE dan Paramedis identik). `DataLocation.jsx` di clone ini versi lebih lama lagi (belum ada redesign chart maupun angka "Total Insiden"), jadi gejala mismatch-nya tidak kelihatan walau logika silent-drop-nya tetap ada. Tapi karena `frontend-hse/src/App.jsx` dan `frontend-paramedis/src/App.jsx` (entry point yang benar-benar ter-mount) cuma me-render `ComingSoon` untuk semua route, seluruh clone ini **tidak reachable oleh siapa pun** — sudah dead code sejak awal (lihat Bagian 5, Bagian 8 poin lain, dan `CLAUDE.md`).
  - **Keputusan yang diambil:** clone ini sengaja tidak ditambal sekarang. Alasannya konsisten dengan rencana yang sudah ada di Bagian 5 (V2) — dashboard HSE/Paramedis akan didesain ulang dengan model domain sendiri (bukan `IncidentRecord`/`LocationModels` dsb. milik CCTV), jadi menambal bug di kode yang kemungkinan besar akan diganti bukan prioritas. Perlu diingat kalau tim ke depan memutuskan memakai clone ini apa adanya sebagai starting point (bukan desain ulang penuh), bug-bug di atas perlu ditambal lebih dulu sebelum di-wire ke routing sungguhan.
- **⚠️ Baru, dari audit kode — Draft 1.10, sengaja TIDAK dihapus/diperbaiki:** Ditemukan direktori `src/pages/` (terpisah dari `src/dashboard/pages/`) di `frontend-hse` dan `frontend-paramedis`, masing-masing berisi 2 file yatim yang lebih mati dari clone dashboard di atas — bukan cuma belum di-routing, tapi memang tidak pernah masuk dependency graph Vite sama sekali (tidak ada satu pun import ke `src/pages/...` di seluruh source maupun `vite.config.js`).
  - **`src/pages/IncidentRecord.jsx`:** byte-identik 100% dengan `src/dashboard/pages/IncidentRecord.jsx` — duplikat murni tanpa tujuan.
  - **`src/pages/CCTVOfficer.jsx`:** bukan duplikat, melainkan prototype terpisah (`OfficerLeaderboard`) yang menggabungkan incident + camera trouble + master officer list dengan niat mencegah petugas hilang dari leaderboard — ide yang sebenarnya benar (mirip fix `CCTVOfficers.jsx` di Draft 1.7), tapi rusak sendiri karena field yang direferensikan di chart/tabel (`totalCases`, `incidentCases`, `cameraCases`) tidak pernah di-set di data yang diproses — akan tampil `undefined` kalau pernah dirender.
  - Isi kedua file ini identik di `frontend-hse` maupun `frontend-paramedis`.
  - **Keputusan:** dibiarkan apa adanya, tidak dihapus maupun ditambal — dicatat sebagai tech debt untuk dibersihkan saat ada kesempatan, bukan prioritas untuk ditindaklanjuti sekarang.

## 9. Success Metrics

Belum ada metrik yang dikonfirmasi eksplisit, berikut usulan awal berdasarkan goals yang perlu divalidasi.

- **Adopsi operator:** persentase insiden/laporan HSE yang diinput lewat sistem versus manual.
- **Waktu respons insiden:** rata-rata waktu dari insiden dicatat sampai ditindaklanjuti, dibandingkan sebelum sistem ada.
- **Uptime dashboard:** target uptime layanan, misalnya 99%, mengingat deployment berbasis Docker/Nginx.
- **Kelengkapan data:** persentase record tanpa field NULL/kosong pada data kritikal.
- **Penggunaan dashboard analitik oleh manajemen:** frekuensi akses per bulan.

## 10. Open Questions

1. **Scope modul Paramedis** — saat ini masih Coming Soon dengan elemen dekoratif gauge needle dan ECG monitor. Apakah target berikutnya membangun fitur pencatatan kasus medis sungguhan, dan seperti apa alurnya?
   > **Dijawab:** target berikutnya adalah membangun dashboard manajemen Paramedis penuh, mencakup: pencatatan kasus medis (form input, menggantikan placeholder gauge/ECG saat ini), dan chart/visualisasi data mengikuti pola yang sama dengan dashboard HSE/CCTV (Chart.js, filter tahun dinamis, dll.), disesuaikan dengan jenis data paramedis (mis. jumlah kasus per kategori, tren bulanan/tahunan).
   > **Tambahan dari audit kode:** ini juga berarti perlu backend baru (model + route) untuk Paramedis — `backend-paramedis` yang ada sekarang belum punya model itu, dan belum terdaftar di deployment (lihat Bagian 5 & 8).

2. **Scope dashboard HSE** — landing page 12 section sudah selesai, tapi apakah dashboard operasional untuk input/monitoring insiden harian sudah berjalan atau masih tahap awal?
   > **Dijawab:** dashboard operasional (input/monitoring insiden harian) belum dibangun — statusnya sama seperti Paramedis (masih Coming Soon). Yang sudah selesai baru landing page 12 section (company profile), bukan dashboard operasional fungsional.
   > **Tambahan dari audit kode:** `frontend-hse` punya salinan kode dashboard CCTV di foldernya, tapi `App.jsx` saat ini cuma me-render `ComingSoon`; dan `backend-hse` juga belum punya model domain sendiri serta belum terdaftar di deployment.

3. **Hubungan dengan sistem CCTV fisik/VMS** — apakah modul CCTV hanya menampilkan data status/analitik, atau juga terhubung ke live feed rekaman kamera sungguhan?
   > **Dijawab:** status: *Analytics-only, read-only* — kalau ada requirement live streaming di masa depan, itu jadi item scope baru (fase 2) yang butuh estimasi terpisah (infra media server, lisensi VMS API, dll).

4. **Autentikasi dan role** — apakah ada sistem login/role-based access yang shared di semua modul, atau tiap modul punya auth terpisah?
   > **Dijawab:** auth per-modul, terpisah, dengan Manager HSE mendapat full admin access ke 3 modul (HSE, CCTV, Paramedis). Role lain tetap terbatas pada modul masing-masing (mis. Petugas CCTV hanya bisa akses modul CCTV, Paramedis hanya modul Paramedis).

5. **Prioritas pengembangan lanjut** — dari semua item di kolom V2 dan Nanti, mana yang jadi prioritas berikutnya?
   > **Dijawab:** prioritas membangun dashboard HSE yang menampilkan data analitik dan data real time.
   > **Perlu diperjelas ulang mengingat temuan audit:** karena `backend-hse` belum punya model domain sendiri dan belum ter-deploy, prioritas ini kemungkinan butuh urutan kerja: (a) desain model data HSE, (b) implementasi backend + registrasi ke `docker-compose.yml`/`nginx.conf`, (c) baru sambungkan dashboard `frontend-hse` yang kode UI-nya sudah ada.

6. **Skema database detail** — perlu akses/isi `db_hse_cctv_pim.sql` di masing-masing backend untuk validasi struktur tabel sebenarnya (catatan: file ini ada identik di ketiga folder backend karena hasil clone, perlu dicek apakah isinya juga identik atau sudah ada penyesuaian).

7. **Soft-delete untuk model referensi** — apakah `LocationModels` (dan model referensi lain seperti kategori, mis. `CategoryModels`) perlu soft-delete alih-alih hard delete, supaya histori `IncidentRecord`/`ComplaintRecord` lama tetap bisa ditelusuri ke nama lokasi/kategori aslinya, bukan jadi data "tidak tertaut" seperti temuan di Bagian 8?
   > **Catatan dari audit kode:** model-model komplain yang baru (`ComplaintRecord`, `ComplaintCategory`, `GSLOfficerModel`) sudah didesain dengan soft-delete (`gorm.DeletedAt`) sejak awal, sementara `LocationModels` dan `CategoryModels` (modul CCTV) tidak — ada inkonsistensi pola antar model referensi dalam satu backend yang sama.

8. ~~Dua temuan audit Draft 1.7 yang sengaja belum diubah, butuh keputusan produk~~ — **sudah dijawab & diselesaikan di Draft 1.8:**
   - **Role `User` bertipe bebas:** dicek langsung ke data (3 dump SQL di repo) — tidak ada role di luar daftar 6 opsi yang benar-benar dipakai, jadi murni risiko laten. **Diselesaikan** dengan menambah whitelist role di backend (`isValidUserRole()` pada `CreateUser`/`UpdateUser`), bukan mengubah chart frontend yang sudah benar.
   - **`total_kamera` vs `ip + analog` di `CameraOccupancy.jsx`:** dicek ke `CameraOccupancyController.go` — backend sendiri sudah mendefinisikan `total_kamera` sebagai penyebut resmi untuk `PersentaseIP`/`PersentaseAnalog`, jadi ini bukan dua konsep yang sengaja berbeda, melainkan dua panel frontend yang tidak konsisten dengan definisi backend-nya sendiri. **Diselesaikan** dengan menyeragamkan kedua panel yang menyimpang supaya memakai `total_kamera`, plus warning kalau ada baris data yang `total_kamera`-nya tidak sama dengan `ip + analog` (indikasi salah input, bukan makna yang berbeda).

---

PRD ini disusun dari riwayat pekerjaan yang tercatat, struktur folder project, dan audit langsung terhadap kode & konfigurasi deployment (`CLAUDE.md`). Bagian yang masih membutuhkan konfirmasi ditandai secara eksplisit di Bagian 10 — perlu didiskusikan langsung supaya PRD ini akurat dan bisa dipakai sebagai acuan pengembangan.
