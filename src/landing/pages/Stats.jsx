import { createElement, useState, useRef, useEffect, useCallback } from 'react';
import {
  HeartPulse,
  ShieldAlert,
  Flame,
  Stethoscope,
  ClipboardCheck,
  Siren,
  HardHat,
  Wind,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const STATS = [
  { value: '15+', label: 'Petugas HSE Bersertifikasi' },
  { value: '24/7', label: 'Siaga Tanggap Darurat' },
  { value: '<5 mnt', label: 'Waktu Respons Medis' },
  { value: '100%', label: 'Area Tercover Jalur Evakuasi' },
];

const FEATURES = [
  {
    icon: Stethoscope,
    title: 'Layanan Medis Standby',
    desc: 'Tim paramedis dan ruang P3K siaga penuh untuk menangani kondisi darurat kesehatan pengunjung.',
  },
  {
    icon: Flame,
    title: 'Manajemen Risiko Kebakaran',
    desc: 'Inspeksi rutin sistem pemadam, jalur evakuasi, dan titik kumpul sesuai standar keselamatan gedung.',
  },
  {
    icon: ClipboardCheck,
    title: 'Audit & Inspeksi Berkala',
    desc: 'Pemeriksaan lingkungan kerja, sanitasi, dan kepatuhan K3 dilakukan terjadwal di seluruh area mall.',
  },
  {
    icon: Siren,
    title: 'Protokol Tanggap Darurat',
    desc: 'Prosedur evakuasi dan respons insiden terintegrasi dengan tim keamanan dan command center.',
  },
];

const TEAM = [
  { name: 'Nama Petugas', role: 'Manager HSE', level: 'Manajemen', photo: null },
  { name: 'Nama Petugas', role: 'Asisten Manager HSE', level: 'Manajemen', photo: null },
  { name: 'Nama Petugas', role: 'Supervisor HSE', level: 'Supervisor', photo: null },
  { name: 'Nama Petugas', role: 'Supervisor HSE', level: 'Supervisor', photo: null },
  { name: 'Nama Petugas', role: 'Anggota HSE', level: 'Anggota', photo: null },
  { name: 'Nama Petugas', role: 'Anggota HSE', level: 'Anggota', photo: null },
  { name: 'Nama Petugas', role: 'Anggota HSE', level: 'Anggota', photo: null },
  { name: 'Nama Petugas', role: 'Anggota HSE', level: 'Anggota', photo: null },
];

export default function FacilityHSESection() {
  return (
    <section id="fasilitas-hse" className="w-full" style={{ backgroundColor: '#6B1414' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D' }}
          >
            {createElement(HeartPulse, { size: 13, strokeWidth: 2 })}
            Fasilitas — Health, Safety & Environment
          </span>

          <h2
            className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
            style={{ color: '#FAF8F3' }}
          >
            Keselamatan dan kesehatan terjaga di setiap langkah
          </h2>
          <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#D9B3AC' }}>
            Tim HSE Pondok Indah Mall memastikan standar keselamatan, kesehatan, dan lingkungan
            terpenuhi di seluruh area, dengan kesiapan penuh menghadapi situasi darurat.
          </p>
        </div>

        {/* Stats */}
        <div
          className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden"
          style={{ backgroundColor: '#8C2A22' }}
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="p-6" style={{ backgroundColor: '#7A1B16' }}>
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
        <div className="mt-14 grid sm:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-6 rounded-sm"
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
          className="mt-10 flex items-center gap-3 pt-8"
          style={{ borderTop: '1px solid #8C2A22' }}
        >
          {createElement(HardHat, { size: 16, strokeWidth: 2, style: { color: '#C79289' } })}
          <p className="text-xs" style={{ color: '#C79289' }}>
            Mencakup keselamatan kerja kontraktor, kesiapsiagaan bencana, dan pengelolaan lingkungan
            gedung.
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
          Tim HSE Kami
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
          {TEAM.map(({ name, role, level, photo }, i) => (
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
                <p
                  className="mt-0.5 text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: '#C79289' }}
                >
                  {level}
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
