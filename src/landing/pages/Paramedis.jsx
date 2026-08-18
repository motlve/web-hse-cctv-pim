import { createElement, useState, useRef, useEffect, useCallback } from 'react';
import {
  HeartPulse,
  Stethoscope,
  Ambulance,
  Pill,
  ClipboardList,
  Clock3,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const SERVICES = [
  {
    icon: Stethoscope,
    title: 'Klinik & Ruang P3K',
    desc: 'Ruang pertolongan pertama dengan tenaga medis siaga untuk penanganan awal.',
  },
  {
    icon: Ambulance,
    title: 'Jalur Evakuasi Medis',
    desc: 'Akses cepat menuju rumah sakit rujukan untuk kasus yang memerlukan penanganan lanjutan.',
  },
  {
    icon: Pill,
    title: 'Perlengkapan Medis Standar',
    desc: 'Obat-obatan dan peralatan P3K yang terjaga kelengkapan serta masa berlakunya.',
  },
  {
    icon: ClipboardList,
    title: 'Pencatatan & Pelaporan',
    desc: 'Setiap penanganan medis tercatat sebagai bagian dari sistem pelaporan insiden HSE.',
  },
];

const AVAILABILITY = [
  { icon: Clock3, label: 'Siaga Setiap Jam Operasional Mall' },
  { icon: MapPin, label: 'Titik Layanan Tersebar di Beberapa Lantai' },
];

const TEAM = [
  { name: 'Nama Petugas', role: 'Paramedis', photo: null },
  { name: 'Nama Petugas', role: 'Paramedis', photo: null },
  { name: 'Nama Petugas', role: 'Paramedis', photo: null },
  { name: 'Nama Petugas', role: 'Paramedis', photo: null },
];

export default function FacilityHealthSection() {
  return (
    <section id="fasilitas-kesehatan" className="w-full bg-[#FAF8F3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{ backgroundColor: 'rgba(107,20,20,0.08)', color: '#6B1414' }}
          >
            {createElement(HeartPulse, { size: 13, strokeWidth: 2 })}
            Fasilitas — Kesehatan &amp; Paramedis
          </span>

          <h2
            className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
            style={{ color: '#2B2320' }}
          >
            Layanan kesehatan siaga untuk kenyamanan setiap pengunjung
          </h2>
          <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#7A6F63' }}>
            Tim paramedis Pondok Indah Mall siap memberikan pertolongan pertama dan penanganan
            darurat, didukung fasilitas dan jalur rujukan yang jelas ke rumah sakit terdekat.
          </p>
        </div>

        {/* Services */}
        <div className="mt-14 grid sm:grid-cols-2 gap-6">
          {SERVICES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-6 rounded-sm bg-white"
              style={{ border: '1px solid #EAE0D5' }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
                style={{ backgroundColor: 'rgba(107,20,20,0.08)' }}
              >
                {createElement(Icon, { size: 18, strokeWidth: 2, style: { color: '#6B1414' } })}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#2B2320' }}>
                  {title}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#7A6F63' }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Team Carousel */}
        <TeamCarousel />

        {/* Availability strip */}
        <div
          className="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-8 pt-8"
          style={{ borderTop: '1px solid #EAE0D5' }}
        >
          {AVAILABILITY.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              {createElement(Icon, { size: 16, strokeWidth: 2, style: { color: '#E8A33D' } })}
              <p className="text-sm" style={{ color: '#2B2320' }}>
                {label}
              </p>
            </div>
          ))}
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

  // Auto-play
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
        <p className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: '#6B1414' }}>
          Tim Paramedis Kami
        </p>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Sebelumnya"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE0D5', color: '#6B1414' }}
          >
            {createElement(ChevronLeft, { size: 16, strokeWidth: 2 })}
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Berikutnya"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE0D5', color: '#6B1414' }}
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
                className="rounded-sm p-5 text-center h-full bg-white transition-transform duration-300 hover:-translate-y-1"
                style={{ border: '1px solid #EAE0D5' }}
              >
                <div
                  className="mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: '#FAF8F3', border: '1px solid #EAE0D5' }}
                >
                  {photo ? (
                    <img src={photo} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    createElement(User, { size: 30, strokeWidth: 1.5, style: { color: '#C4A99A' } })
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold" style={{ color: '#2B2320' }}>
                  {name}
                </p>
                <p className="mt-0.5 text-[12px]" style={{ color: '#6B1414' }}>
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
              backgroundColor: i === activeIndex ? '#6B1414' : '#EAE0D5',
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
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE0D5', color: '#6B1414' }}
        >
          {createElement(ChevronLeft, { size: 16, strokeWidth: 2 })}
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="Berikutnya"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE0D5', color: '#6B1414' }}
        >
          {createElement(ChevronRight, { size: 16, strokeWidth: 2 })}
        </button>
      </div>
    </div>
  );
}
