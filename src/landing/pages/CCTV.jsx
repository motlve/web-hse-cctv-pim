import { createElement, useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Radar,
  Clock,
  Database,
  MonitorPlay,
  ScanEye,
  FileClock,
  Radio,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const STATS = [
  { value: '120+', label: 'Titik Kamera Terpasang' },
  { value: '24/7', label: 'Monitoring Non-Stop' },
  { value: '<3 mnt', label: 'Waktu Respons Insiden' },
  { value: '30 Hari', label: 'Retensi Rekaman' },
];

const FEATURES = [
  {
    icon: MonitorPlay,
    title: 'Live Monitoring Terpusat',
    desc: 'Seluruh titik kamera dipantau real-time dari ruang kontrol oleh petugas bersertifikasi.',
  },
  {
    icon: ScanEye,
    title: 'Deteksi & Analitik Otomatis',
    desc: 'Sistem membantu mendeteksi anomali dan pergerakan mencurigakan untuk respons lebih cepat.',
  },
  {
    icon: Radio,
    title: 'Integrasi dengan Command Center',
    desc: 'Terhubung langsung dengan tim keamanan, HSE, dan paramedis untuk koordinasi tanggap darurat.',
  },
  {
    icon: FileClock,
    title: 'Riwayat & Pelaporan Insiden',
    desc: 'Setiap kejadian tercatat dan dapat ditelusuri melalui sistem pelaporan digital.',
  },
];

const TEAM = [
  { name: 'Nama Petugas', role: 'Operator CCTV', photo: null },
  { name: 'Nama Petugas', role: 'Operator CCTV', photo: null },
  { name: 'Nama Petugas', role: 'Operator CCTV', photo: null },
  { name: 'Nama Petugas', role: 'Operator CCTV', photo: null },
  { name: 'Nama Petugas', role: 'Operator CCTV', photo: null },
  { name: 'Nama Petugas', role: 'Operator CCTV', photo: null },
  { name: 'Nama Petugas', role: 'Operator CCTV', photo: null },
  { name: 'Nama Petugas', role: 'Operator CCTV', photo: null },
];

// ── UKURAN FACILITY CCTV SECTION ─────────────────────────────
// Pakai skala "default" (py-16 sm:py-20 lg:py-24), sama dengan
// About, Policy, HSE, dst. Heading, body text, dan card padding
// mengikuti tabel skala di SectionContainer.

export default function FacilityCCTVSection() {
  return (
    <section id="fasilitas-cctv" className="w-full" style={{ backgroundColor: '#6B1414' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D' }}
          >
            {createElement(Camera, { size: 13, strokeWidth: 2 })}
            Fasilitas — Sistem Monitoring
          </span>

          <h2
            className="mt-4 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-snug"
            style={{ color: '#FAF8F3' }}
          >
            Pengawasan CCTV menyeluruh, siaga di setiap sudut mall
          </h2>
          <p
            className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed"
            style={{ color: '#D9B3AC' }}
          >
            Sistem monitoring CCTV Pondok Indah Mall mengawasi seluruh area publik secara real-time,
            terintegrasi dengan tim keamanan dan HSE untuk respons yang cepat dan terkoordinasi.
          </p>
        </div>

        {/* Stats */}
        <div
          className="mt-10 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden"
          style={{ backgroundColor: '#8C2A22' }}
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="p-5 sm:p-6" style={{ backgroundColor: '#7A1B16' }}>
              <p className="text-2xl sm:text-3xl font-semibold" style={{ color: '#E8A33D' }}>
                {value}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#D9B3AC' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mt-10 sm:mt-14 grid sm:grid-cols-2 gap-6 sm:gap-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-5 sm:p-6 rounded-sm"
              style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22' }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
                style={{ backgroundColor: 'rgba(232,163,61,0.12)' }}
              >
                {createElement(Icon, { size: 18, strokeWidth: 2, style: { color: '#E8A33D' } })}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#FAF8F3' }}>
                  {title}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#D9B3AC' }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Team Carousel */}
        <TeamCarousel />

        {/* Coverage note */}
        <div
          className="mt-8 sm:mt-10 flex items-center gap-3 pt-8"
          style={{ borderTop: '1px solid #8C2A22' }}
        >
          {createElement(Radar, { size: 16, strokeWidth: 2, style: { color: '#C79289' } })}
          <p className="text-xs" style={{ color: '#C79289' }}>
            Cakupan mencakup area parkir, lobi, koridor, tangga darurat, dan titik kumpul evakuasi.
          </p>
        </div>
      </div>
    </section>
  );
}

function TeamCarousel() {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [perView, setPerView] = useState(4);

  // Sesuaikan jumlah kartu yang tampil per layar
  useEffect(() => {
    const updatePerView = () => {
      if (window.innerWidth < 640) setPerView(2);
      else if (window.innerWidth < 1024) setPerView(3);
      else setPerView(4);
    };
    updatePerView();
    window.addEventListener('resize', updatePerView);
    return () => window.removeEventListener('resize', updatePerView);
  }, []);

  const maxIndex = Math.max(0, TEAM.length - perView);

  const goTo = useCallback(
    (index) => {
      const clamped = Math.min(Math.max(index, 0), maxIndex);
      setActiveIndex(clamped);
    },
    [maxIndex]
  );

  const goNext = () => goTo(activeIndex + 1);
  const goPrev = () => goTo(activeIndex - 1);

  // Auto-play, berhenti sebentar setelah interaksi manual
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [maxIndex]);

  const cardWidthPct = 100 / perView;

  return (
    <div className="mt-14">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: '#E8A33D' }}>
          Tim CCTV Kami
        </p>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Sebelumnya"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22', color: '#E8A33D' }}
          >
            {createElement(ChevronLeft, { size: 16, strokeWidth: 2 })}
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Berikutnya"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22', color: '#E8A33D' }}
          >
            {createElement(ChevronRight, { size: 16, strokeWidth: 2 })}
          </button>
        </div>
      </div>

      <div className="relative mt-5 overflow-hidden">
        <div
          ref={trackRef}
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * cardWidthPct}%)` }}
        >
          {TEAM.map(({ name, role, photo }, i) => (
            <div
              key={`${role}-${i}`}
              className="shrink-0 px-2"
              style={{ width: `${cardWidthPct}%` }}
            >
              <div
                className="rounded-sm p-5 text-center h-full transition-transform duration-300 hover:-translate-y-1"
                style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22' }}
              >
                <div
                  className="mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: '#6B1414', border: '1px solid #8C2A22' }}
                >
                  {photo ? (
                    <img src={photo} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    createElement(User, { size: 30, strokeWidth: 1.5, style: { color: '#C79289' } })
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold" style={{ color: '#FAF8F3' }}>
                  {name}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: '#E8A33D' }}>
                  {role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              height: 6,
              width: i === activeIndex ? 20 : 6,
              backgroundColor: i === activeIndex ? '#E8A33D' : '#8C2A22',
            }}
          />
        ))}
      </div>

      {/* Mobile nav buttons */}
      <div className="mt-4 flex sm:hidden items-center justify-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Sebelumnya"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22', color: '#E8A33D' }}
        >
          {createElement(ChevronLeft, { size: 16, strokeWidth: 2 })}
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="Berikutnya"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22', color: '#E8A33D' }}
        >
          {createElement(ChevronRight, { size: 16, strokeWidth: 2 })}
        </button>
      </div>
    </div>
  );
}
