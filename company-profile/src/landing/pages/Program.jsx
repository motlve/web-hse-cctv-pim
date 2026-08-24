import { createElement, useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalendarClock,
  GraduationCap,
  Siren,
  Stethoscope,
  Megaphone,
  SearchCheck,
  Users,
  X,
  Clock3,
  MapPin,
  UsersRound,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';

// TODO: ganti "image" dengan URL foto asli kegiatan (dokumentasi pelatihan, drill, dll).
// Selama masih placeholder, dipakai foto stok bertema dari picsum.photos (konsisten per program lewat seed).
const PROGRAMS = [
  {
    icon: GraduationCap,
    title: 'Pelatihan K3 & Tanggap Darurat',
    desc: 'Pelatihan rutin bagi karyawan dan tenant mengenai prosedur keselamatan kerja dan tanggap darurat, mencakup simulasi skenario nyata di lapangan.',
    frequency: 'Berkala',
    image: 'https://picsum.photos/seed/pelatihan-k3/1000/800',
    peserta: 'Karyawan & Tenant',
    durasi: '2 - 4 Jam',
    lokasi: 'Ruang Serbaguna',
    featured: true,
  },
  {
    icon: Siren,
    title: 'Simulasi Evakuasi & Fire Drill',
    desc: 'Latihan evakuasi menyeluruh untuk menguji kesiapan seluruh penghuni mall menghadapi keadaan darurat.',
    frequency: '2x / Tahun',
    image: 'https://picsum.photos/seed/fire-drill/800/600',
    peserta: 'Seluruh Penghuni Mall',
    durasi: 'Setengah Hari',
    lokasi: 'Seluruh Area Mall',
  },
  {
    icon: Stethoscope,
    title: 'Pemeriksaan Kesehatan Berkala',
    desc: 'Layanan pemeriksaan kesehatan bagi karyawan sebagai bagian dari program kesejahteraan.',
    frequency: 'Berkala',
    image: 'https://picsum.photos/seed/medical-check/800/600',
    peserta: 'Karyawan',
    durasi: '1 Hari',
    lokasi: 'Klinik Mall',
  },
  {
    icon: SearchCheck,
    title: 'Audit & Inspeksi HSE',
    desc: 'Pemeriksaan menyeluruh terhadap fasilitas dan prosedur keselamatan di seluruh area mall.',
    frequency: 'Bulanan',
    image: 'https://picsum.photos/seed/audit-hse/800/600',
    peserta: 'Tim HSE Internal',
    durasi: '1 - 2 Hari',
    lokasi: 'Seluruh Area Mall',
  },
  {
    icon: Megaphone,
    title: 'Kampanye Kesadaran Keselamatan',
    desc: 'Sosialisasi dan edukasi keselamatan kepada pengunjung, tenant, dan karyawan.',
    frequency: 'Rutin',
    image: 'https://picsum.photos/seed/campaign-safety/800/600',
    peserta: 'Pengunjung & Tenant',
    durasi: 'Bervariasi',
    lokasi: 'Area Publik Mall',
  },
  {
    icon: Users,
    title: 'Koordinasi dengan Tenant',
    desc: 'Pertemuan berkala membahas standar HSE dan tindak lanjut temuan bersama pihak tenant.',
    frequency: 'Berkala',
    image: 'https://picsum.photos/seed/tenant-meeting/800/600',
    peserta: 'Perwakilan Tenant',
    durasi: '1 - 2 Jam',
    lokasi: 'Ruang Meeting',
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}

function FrequencyBadge({ children, solid = false }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: solid ? '#E8A33D' : 'rgba(250,248,243,0.92)',
        color: '#4A2E0A',
      }}
    >
      {children}
    </span>
  );
}

// ── PROGRAM TICKER ─────────────────────────────────────────────
// Elemen signature baru: strip berjalan (marquee) yang menampilkan
// ritme seluruh program secara berurutan — visualisasi langsung dari
// kata "berkelanjutan" di body text, bukan sekadar klaim. Berhenti
// saat disentuh/di-hover supaya tetap terbaca, dan diam total jika
// pengguna memilih reduced motion.
function ProgramTicker({ programs, reduced }) {
  const [paused, setPaused] = useState(false);
  const items = [...programs, ...programs];

  return (
    <div
      className="relative mt-8 overflow-hidden rounded-2xl"
      style={{ backgroundColor: '#6B1414' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <style>{`
        @keyframes hse-ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <div
        className="flex items-center gap-2 px-4 pt-2.5 pb-2 border-b"
        style={{ borderColor: 'rgba(232,163,61,0.18)' }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#E8A33D' }} />
        <span
          className="text-[10px] font-mono uppercase tracking-[0.14em]"
          style={{ color: '#E8A33D' }}
        >
          Ritme Program Berjalan
        </span>
      </div>

      <div className="py-3 overflow-hidden">
        <div
          className="flex items-center gap-8 whitespace-nowrap px-4"
          style={{
            width: 'max-content',
            animation: reduced ? 'none' : 'hse-ticker-scroll 32s linear infinite',
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {items.map((p, i) => (
            <div
              key={`${p.title}-${i}`}
              className="inline-flex items-center gap-2 text-[12.5px]"
              style={{ color: '#F0DFC0' }}
              aria-hidden={i >= programs.length ? 'true' : undefined}
            >
              {createElement(p.icon, { size: 13, strokeWidth: 2, style: { color: '#E8A33D' } })}
              {p.title}
              <span style={{ color: '#C79289' }}>·</span>
              <span style={{ color: '#E8A33D' }}>{p.frequency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PROGRAM CARD ───────────────────────────────────────────────
// Komponen tersendiri (bukan inline di dalam .map()) supaya boleh
// punya state sendiri (status loading gambar) tanpa melanggar
// Rules of Hooks.
function ProgramCard({
  program,
  isFeatured,
  index,
  entered,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) {
  const [loaded, setLoaded] = useState(false);
  const { icon: Icon, title, desc, frequency, image, durasi, lokasi } = program;

  return (
    <button
      onClick={onSelect}
      className={`group relative text-left rounded-3xl overflow-hidden transition-all duration-500 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        isFeatured ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''
      }`}
      style={{
        boxShadow: '0 1px 3px rgba(43,35,32,0.06)',
        transitionDelay: entered ? `${index * 60}ms` : '0ms',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.98)',
        outlineColor: '#E8A33D',
      }}
    >
      <div className={`relative w-full ${isFeatured ? 'h-72 sm:h-full sm:min-h-[22rem]' : 'h-56'}`}>
        {/* Skeleton shimmer — tampil sampai foto selesai dimuat */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: loaded ? 0 : 1,
            background: 'linear-gradient(100deg, #EFE8DA 30%, #F7F2E8 45%, #EFE8DA 60%)',
            backgroundSize: '200% 100%',
            animation: loaded ? 'none' : 'hse-shimmer 1.4s ease-in-out infinite',
          }}
        />

        <img
          src={image}
          alt={title}
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
          style={{ opacity: loaded ? 1 : 0 }}
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(20,12,10,0.92) 0%, rgba(20,12,10,0.45) 45%, rgba(20,12,10,0.05) 75%)',
          }}
        />

        <div className="absolute inset-0 flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: 'rgba(250,248,243,0.15)',
                backdropFilter: 'blur(6px)',
              }}
            >
              {createElement(Icon, { size: 16, strokeWidth: 2, style: { color: '#FAF8F3' } })}
            </div>

            <div className="flex items-center gap-2">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(title);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite(title);
                  }
                }}
                aria-label={isFavorite ? 'Hapus dari favorit' : 'Tandai sebagai favorit'}
                aria-pressed={isFavorite}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: 'rgba(20,12,10,0.35)',
                  backdropFilter: 'blur(4px)',
                  outlineColor: '#E8A33D',
                }}
              >
                {createElement(Star, {
                  size: 13,
                  strokeWidth: 2,
                  style: {
                    color: isFavorite ? '#E8A33D' : '#FAF8F3',
                    fill: isFavorite ? '#E8A33D' : 'none',
                  },
                })}
              </span>
              <FrequencyBadge>{frequency}</FrequencyBadge>
            </div>
          </div>

          <div>
            <p
              className={`font-semibold leading-snug ${isFeatured ? 'text-xl sm:text-2xl' : 'text-base'}`}
              style={{ color: '#FAF8F3' }}
            >
              {title}
            </p>
            <p
              className={`mt-2 leading-relaxed text-[#E8DCCF] ${
                isFeatured ? 'text-[13px] max-w-sm' : 'text-[12.5px] line-clamp-2'
              }`}
              style={{ opacity: 0.85 }}
            >
              {desc}
            </p>

            {/* Quick preview — muncul saat hover/focus, tanpa perlu buka modal */}
            <div
              className="mt-3 hidden sm:flex items-center gap-4 text-[11px] opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
              style={{ color: '#E8DCCF' }}
            >
              <span className="inline-flex items-center gap-1">
                {createElement(Clock3, { size: 11, strokeWidth: 2 })}
                {durasi}
              </span>
              <span className="inline-flex items-center gap-1">
                {createElement(MapPin, { size: 11, strokeWidth: 2 })}
                {lokasi}
              </span>
            </div>

            <div
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium transition-all duration-300 group-hover:gap-2.5"
              style={{ color: '#E8A33D' }}
            >
              Lihat detail
              {createElement(isFeatured ? ArrowUpRight : ArrowRight, {
                size: 13,
                strokeWidth: 2.5,
              })}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function ProgramModal({
  program,
  position,
  total,
  isFavorite,
  onToggleFavorite,
  onClose,
  onPrev,
  onNext,
}) {
  const [visible, setVisible] = useState(false);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    function onKeyDown(e) {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight' && total > 1) onNext();
      if (e.key === 'ArrowLeft' && total > 1) onPrev();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleClose, onNext, onPrev, total]);

  const Icon = program.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200"
      style={{
        backgroundColor: 'rgba(20,10,10,0.65)',
        backdropFilter: 'blur(6px)',
        opacity: visible ? 1 : 0,
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden bg-white grid sm:grid-cols-2 transition-all duration-200"
        style={{
          border: '1px solid #EAE0D5',
          boxShadow: '0 24px 60px rgba(20,10,10,0.35)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image side */}
        <div className="relative h-56 sm:h-full">
          <img
            key={program.title}
            src={program.image}
            alt={program.title}
            className="h-full w-full object-cover"
            style={{ animation: 'hse-fade-in 250ms ease-out' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(43,35,32,0.5), transparent 45%), linear-gradient(to right, transparent 60%, rgba(43,35,32,0.15))',
            }}
          />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <FrequencyBadge solid>{program.frequency}</FrequencyBadge>
            {total > 1 && (
              <span
                className="text-[10px] font-medium px-2 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(250,248,243,0.85)', color: '#4A2E0A' }}
              >
                {position} / {total}
              </span>
            )}
          </div>

          <button
            onClick={() => onToggleFavorite(program.title)}
            aria-label={isFavorite ? 'Hapus dari favorit' : 'Tandai sebagai favorit'}
            aria-pressed={isFavorite}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
            style={{ backgroundColor: 'rgba(20,12,10,0.4)', backdropFilter: 'blur(4px)' }}
          >
            {createElement(Star, {
              size: 15,
              strokeWidth: 2,
              style: {
                color: isFavorite ? '#E8A33D' : '#FAF8F3',
                fill: isFavorite ? '#E8A33D' : 'none',
              },
            })}
          </button>

          {/* Navigasi program sebelumnya/berikutnya */}
          {total > 1 && (
            <>
              <button
                onClick={onPrev}
                aria-label="Program sebelumnya"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20"
                style={{ backgroundColor: 'rgba(20,12,10,0.35)', backdropFilter: 'blur(4px)' }}
              >
                {createElement(ChevronLeft, { size: 16, color: '#FAF8F3', strokeWidth: 2.5 })}
              </button>
              <button
                onClick={onNext}
                aria-label="Program berikutnya"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20 sm:right-3"
                style={{ backgroundColor: 'rgba(20,12,10,0.35)', backdropFilter: 'blur(4px)' }}
              >
                {createElement(ChevronRight, { size: 16, color: '#FAF8F3', strokeWidth: 2.5 })}
              </button>
            </>
          )}
        </div>

        {/* Content side */}
        <div
          className="p-6 sm:p-7 flex flex-col"
          key={`content-${program.title}`}
          style={{ animation: 'hse-fade-in 250ms ease-out' }}
        >
          <button
            onClick={handleClose}
            aria-label="Tutup"
            className="self-end -mt-1 -mr-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: '#F5F0E8', color: '#2B2320' }}
          >
            {createElement(X, { size: 15, strokeWidth: 2.5 })}
          </button>

          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl -mt-2"
            style={{ backgroundColor: 'rgba(107,20,20,0.08)' }}
          >
            {createElement(Icon, { size: 18, strokeWidth: 2, style: { color: '#6B1414' } })}
          </div>

          <p className="mt-4 text-lg font-semibold leading-snug" style={{ color: '#2B2320' }}>
            {program.title}
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: '#7A6F63' }}>
            {program.desc}
          </p>

          <div className="mt-auto pt-6 grid grid-cols-3 gap-3">
            {[
              { icon: UsersRound, label: 'Peserta', value: program.peserta },
              { icon: Clock3, label: 'Durasi', value: program.durasi },
              { icon: MapPin, label: 'Lokasi', value: program.lokasi },
            ].map(({ icon: FIcon, label, value }) => (
              <div key={label} className="rounded-xl p-3" style={{ backgroundColor: '#FAF8F3' }}>
                {createElement(FIcon, { size: 13, strokeWidth: 2, style: { color: '#B5791F' } })}
                <p
                  className="mt-1.5 text-[9.5px] uppercase tracking-[0.08em]"
                  style={{ color: '#7A6F63' }}
                >
                  {label}
                </p>
                <p
                  className="mt-0.5 text-[12px] font-semibold leading-tight"
                  style={{ color: '#2B2320' }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {total > 1 && (
            <p className="mt-4 text-[11px]" style={{ color: '#B5A997' }}>
              Gunakan tombol ← → untuk melihat program lain
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProgramSection() {
  // Modal menyimpan daftar (list) yang aktif saat dibuka + index-nya,
  // supaya navigasi prev/next konsisten dengan hasil filter saat itu.
  const [modalState, setModalState] = useState(null);
  const [filter, setFilter] = useState('Semua');
  const [entered, setEntered] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());
  const reduced = usePrefersReducedMotion();

  const toggleFavorite = useCallback((title) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const frequencies = useMemo(
    () => ['Semua', ...Array.from(new Set(PROGRAMS.map((p) => p.frequency)))],
    []
  );
  const chips = useMemo(
    () => (favorites.size > 0 ? [...frequencies, 'Favorit'] : frequencies),
    [frequencies, favorites.size]
  );

  const counts = useMemo(() => {
    const map = { Semua: PROGRAMS.length, Favorit: favorites.size };
    PROGRAMS.forEach((p) => {
      map[p.frequency] = (map[p.frequency] || 0) + 1;
    });
    return map;
  }, [favorites.size]);

  const filtered = useMemo(() => {
    if (filter === 'Favorit') return PROGRAMS.filter((p) => favorites.has(p.title));
    return filter === 'Semua' ? PROGRAMS : PROGRAMS.filter((p) => p.frequency === filter);
  }, [filter, favorites]);

  // Jika filter "Favorit" aktif tapi daftar favorit dikosongkan, kembali ke "Semua".
  useEffect(() => {
    if (filter === 'Favorit' && favorites.size === 0) setFilter('Semua');
  }, [filter, favorites.size]);

  // Re-trigger staggered entrance setiap kali hasil filter berubah.
  useEffect(() => {
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [filter]);

  function openProgram(program) {
    const index = filtered.findIndex((p) => p.title === program.title);
    setModalState({ list: filtered, index });
  }
  function closeModal() {
    setModalState(null);
  }
  function goNext() {
    setModalState((s) => (s ? { ...s, index: (s.index + 1) % s.list.length } : s));
  }
  function goPrev() {
    setModalState((s) => (s ? { ...s, index: (s.index - 1 + s.list.length) % s.list.length } : s));
  }

  return (
    <section id="program-hse" className="w-full bg-[#FAF8F3]">
      <style>{`
        @keyframes hse-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes hse-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
              style={{ backgroundColor: 'rgba(107,20,20,0.08)', color: '#6B1414' }}
            >
              {createElement(CalendarClock, { size: 13, strokeWidth: 2 })}
              Program &amp; Kegiatan HSE
            </span>

            <h2
              className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
              style={{ color: '#2B2320' }}
            >
              Komitmen yang dijalankan lewat program berkelanjutan
            </h2>
            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#7A6F63' }}>
              Kebijakan HSE diwujudkan melalui rangkaian program dan kegiatan rutin bersama
              karyawan, tenant, dan pengunjung. Klik salah satu program untuk melihat detailnya,
              atau tandai dengan bintang untuk menyimpannya sebagai favorit.
            </p>
          </div>

          {/* Filter chips — tiap chip menampilkan jumlah program */}
          <div className="flex flex-wrap gap-2">
            {chips.map((f) => {
              const isActive = f === filter;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full transition-colors"
                  style={{
                    backgroundColor: isActive ? '#6B1414' : 'white',
                    color: isActive ? '#FAF8F3' : '#7A6F63',
                    border: `1px solid ${isActive ? '#6B1414' : '#EAE0D5'}`,
                  }}
                >
                  {f === 'Favorit' &&
                    createElement(Star, {
                      size: 11,
                      strokeWidth: 2,
                      style: { color: isActive ? '#F3D9AE' : '#B5791F' },
                    })}
                  {f}
                  <span
                    className="text-[10px] font-semibold rounded-full px-1.5 py-0.5"
                    style={{
                      backgroundColor: isActive ? 'rgba(250,248,243,0.18)' : '#F5F0E8',
                      color: isActive ? '#F3D9AE' : '#B5A997',
                    }}
                  >
                    {counts[f] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ProgramTicker programs={PROGRAMS} reduced={reduced} />

        {/* Bento grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((program, index) => (
            <ProgramCard
              key={program.title}
              program={program}
              index={index}
              entered={entered}
              isFeatured={program.featured && filter === 'Semua'}
              isFavorite={favorites.has(program.title)}
              onToggleFavorite={toggleFavorite}
              onSelect={() => openProgram(program)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-sm" style={{ color: '#B5A997' }}>
            Belum ada program pada kategori ini.
          </p>
        )}
      </div>

      {modalState && (
        <ProgramModal
          program={modalState.list[modalState.index]}
          position={modalState.index + 1}
          total={modalState.list.length}
          isFavorite={favorites.has(modalState.list[modalState.index].title)}
          onToggleFavorite={toggleFavorite}
          onClose={closeModal}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </section>
  );
}
