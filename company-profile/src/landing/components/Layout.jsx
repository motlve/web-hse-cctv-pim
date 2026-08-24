import Topbar from './Topbar';

import HeroSection from '../pages/HeroSection';
import About from '../pages/About';
import Policy from '../pages/Policy';
import HSE from '../pages/HSE';
import Program from '../pages/Program';
import FacilityFire from '../pages/FacilityFire';
import CCTV from '../pages/CCTV';
import Paramedis from '../pages/Paramedis';
import Structure from '../pages/Structure';
import Team from '../pages/Team';
import Stats from '../pages/Stats';
import Contact from '../pages/Contact';
import Footer from '../pages/Footer';

// Layout = kerangka halaman. Semua section didaftarkan di sini secara
// berurutan. Mau ubah urutan / tambah / hapus section? cukup edit
// urutan komponen di bawah — tidak perlu ubah isi masing-masing section.
//
// NOTE: import di atas mengasumsikan tiap file di pages/ punya
// `export default function <NamaFile>()` yang namanya sama dengan nama
// filenya (mis. About.jsx -> export default function About()). Kalau ada
// yang beda, sesuaikan nama importnya saja, urutan pemakaian di bawah
// tidak perlu berubah.
//
// FIX: Topbar & Footer tidak ikut ke-scroll, hanya <main> yang scroll.
// Caranya:
//   1. Wrapper terluar dikunci ke tinggi viewport ("h-screen") dan jadi
//      flex column, dengan "overflow-hidden" supaya BODY/halaman itu
//      sendiri tidak pernah scroll — cuma anak-anaknya yang boleh.
//   2. Topbar & Footer diberi "shrink-0" supaya tingginya tetap sesuai
//      kontennya sendiri dan tidak "dipepetin" oleh flexbox.
//      (shrink-0 pada Topbar sudah ditambahkan langsung di Topbar.jsx)
//   3. <main> mengambil sisa ruang ("flex-1") dan scroll sendiri
//      ("overflow-y-auto") — ini satu-satunya elemen yang bisa discroll.
// Efeknya: Topbar selalu terlihat di atas, Footer selalu terlihat di
// bawah, dan semua section (Hero, About, dst.) discroll di dalam
// <main> tanpa pernah menutupi atau "nabrak" Topbar/Footer.
export default function Layout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#FAF8F3' }}>
      <Topbar />

      <main className="flex-1 overflow-y-auto overscroll-contain">
        <HeroSection />
        <About />
        <Policy />
        <HSE />
        <Program />
        <FacilityFire />
        <CCTV />
        <Paramedis />
        <Structure />
        <Team />
        <Stats />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
