import { createElement, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  HeartPulse,
  Siren,
  Stethoscope,
  ShieldPlus,
  Radio,
  FileClock,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Activity,
} from 'lucide-react';

const STATS = [
  {
    numeric: 12,
    suffix: '+',
    label: 'Personel Medis Siaga',
    detail: 'Paramedis bersertifikat BLS/PPGD berjaga bergiliran di seluruh area mall.',
  },
  {
    display: '24/7',
    label: 'Siaga Medis Non-Stop',
    detail: 'Pos kesehatan aktif setiap saat, tanpa jeda, termasuk hari libur dan jam sibuk.',
  },
  {
    display: '<5 mnt',
    label: 'Waktu Respons',
    detail: 'Dihitung sejak panggilan darurat diterima hingga paramedis tiba di lokasi kejadian.',
  },
  {
    numeric: 6,
    suffix: ' Pos',
    label: 'Titik Pos P3K',
    detail: 'Tersebar di lantai dasar, area parkir, foodcourt, dan titik kumpul evakuasi.',
  },
];

const FEATURES = [
  {
    icon: Stethoscope,
    title: 'Tim Medis Bersertifikat',
    desc: 'Paramedis terlatih menangani penanganan pertama hingga stabilisasi kondisi darurat.',
    detail:
      'Setiap petugas memegang sertifikasi BLS/PPGD aktif dan mengikuti pelatihan penyegaran berkala.',
  },
  {
    icon: Siren,
    title: 'Ambulans Siaga di Lokasi',
    desc: 'Unit ambulans standby di area mall untuk evakuasi cepat ke fasilitas kesehatan rujukan.',
    detail:
      'Ambulans dilengkapi peralatan dasar kegawatdaruratan dan siap bergerak dalam hitungan menit.',
  },
  {
    icon: Radio,
    title: 'Integrasi dengan Command Center',
    desc: 'Panggilan darurat medis diteruskan langsung ke tim keamanan dan HSE untuk koordinasi cepat.',
    detail:
      'Setiap laporan medis otomatis tersinkron dengan radio command center dan tim lapangan terdekat.',
  },
  {
    icon: FileClock,
    title: 'Riwayat Penanganan Tercatat',
    desc: 'Setiap kejadian medis terdokumentasi lengkap untuk keperluan evaluasi dan pelaporan.',
    detail: 'Catatan mencakup waktu kejadian, jenis penanganan, dan status tindak lanjut pasien.',
  },
];

// Data tim sementara (statis) — dipakai selama endpoint publik untuk
// data paramedis belum tersambung. Ganti dengan hasil fetch API nanti
// (lihat catatan di ParamedisTeamCarousel).
const TEAM_DATA = [
  { name: 'Nama Paramedis 1', role: 'Paramedis', photo: null },
  { name: 'Nama Paramedis 2', role: 'Paramedis', photo: null },
  { name: 'Nama Paramedis 3', role: 'Perawat', photo: null },
  { name: 'Nama Paramedis 4', role: 'Perawat', photo: null },
  { name: 'Nama Paramedis 5', role: 'Paramedis', photo: null },
  { name: 'Nama Paramedis 6', role: 'Dokter Jaga', photo: null },
  { name: 'Nama Paramedis 7', role: 'Paramedis', photo: null },
  { name: 'Nama Paramedis 8', role: 'Perawat', photo: null },
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

function useCountUp(target, active, duration = 1200) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!active || startedRef.current || target == null) return;
    startedRef.current = true;

    if (reduced) {
      setValue(target);
      return;
    }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration, reduced]);

  return value;
}

// Panel detail yang membuka/menutup dengan animasi tinggi, dipakai
// bersama oleh StatCard dan FeatureCard supaya perilakunya konsisten
// dengan section CCTV.
function DetailPanel({ open, children }) {
  return (
    <div
      className="grid transition-all duration-300 ease-out"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function StatCard({ stat, active, delay }) {
  const count = useCountUp(stat.numeric ?? 0, active && stat.numeric != null);
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="p-5 sm:p-6 text-left w-full transition-all duration-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset"
      style={{
        backgroundColor: open ? '#8C2A22' : '#7A1B16',
        transitionDelay: `${delay}ms`,
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(10px)',
        outlineColor: '#E8A33D',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-2xl sm:text-3xl font-semibold tabular-nums" style={{ color: '#E8A33D' }}>
          {stat.numeric != null ? `${count}${stat.suffix}` : stat.display}
        </p>
        {createElement(ChevronDown, {
          size: 14,
          strokeWidth: 2.5,
          style: {
            color: '#C79289',
            flexShrink: 0,
            marginTop: 4,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          },
        })}
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#D9B3AC' }}>
        {stat.label}
      </p>
      <DetailPanel open={open}>
        <p className="pt-2 text-[11.5px] leading-relaxed" style={{ color: '#F0C88A' }}>
          {stat.detail}
        </p>
      </DetailPanel>
    </button>
  );
}

// ── VITAL SIGNS MONITOR ─────────────────────────────────────────
// Elemen signature section ini: monitor vital sign bergaya alat medis
// ruang gawat darurat — garis ECG yang benar-benar berjalan (SVG path
// dengan animasi dash-offset), angka BPM yang berdetak mengikuti
// puncak gelombang, dan status "SIAGA" berkedip seperti indikator
// alat kesehatan sungguhan. Ketuk untuk mengganti antara 3 preset
// status siaga (Normal / Waspada / Tanggap Cepat).
const VITAL_PRESETS = [
  { label: 'SIAGA NORMAL', bpm: 78, color: '#E8A33D' },
  { label: 'MODE WASPADA', bpm: 96, color: '#F0C88A' },
  { label: 'TANGGAP CEPAT', bpm: 118, color: '#E8877A' },
];

function VitalMonitor({ active }) {
  const [now, setNow] = useState(new Date());
  const [presetIndex, setPresetIndex] = useState(0);
  const [displayBpm, setDisplayBpm] = useState(VITAL_PRESETS[0].bpm);
  const reduced = usePrefersReducedMotion();
  const preset = VITAL_PRESETS[presetIndex];

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // BPM sedikit berdenyut secara acak di sekitar nilai preset, memberi
  // kesan alat monitor yang benar-benar membaca sesuatu.
  useEffect(() => {
    if (reduced) {
      setDisplayBpm(preset.bpm);
      return;
    }
    const t = setInterval(() => {
      setDisplayBpm(preset.bpm + Math.round(Math.sin(Date.now() / 400) * 2));
    }, 480);
    return () => clearInterval(t);
  }, [preset.bpm, reduced]);

  function cyclePreset() {
    setPresetIndex((p) => (p + 1) % VITAL_PRESETS.length);
  }

  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
  const beatDuration = Math.max(0.55, 60 / preset.bpm);

  return (
    <button
      type="button"
      onClick={cyclePreset}
      aria-label="Ganti mode siaga monitor"
      className="relative shrink-0 w-40 h-24 sm:w-48 sm:h-28 rounded-sm overflow-hidden text-left transition-all duration-700"
      style={{
        backgroundColor: '#2A0808',
        border: '1px solid #8C2A22',
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(0.92)',
        cursor: 'pointer',
      }}
    >
      <style>{`
        @keyframes hse-ecg-scroll {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -240; }
        }
        @keyframes hse-vital-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <svg
        viewBox="0 0 240 60"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <path
          d="M0,30 L20,30 L28,30 L34,10 L40,50 L46,30 L60,30 L120,30 L128,30 L134,10 L140,50 L146,30 L160,30 L220,30 L228,30 L234,10 L240,50"
          fill="none"
          stroke={preset.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="120 120"
          style={{
            animation: reduced ? 'none' : `hse-ecg-scroll ${beatDuration * 3}s linear infinite`,
            opacity: 0.85,
          }}
        />
      </svg>

      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: preset.color,
            animation: reduced ? 'none' : `hse-vital-blink ${beatDuration}s ease-in-out infinite`,
          }}
        />
        <span
          className="text-[8px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: preset.color }}
        >
          {preset.label}
        </span>
      </div>

      <div className="absolute bottom-1 left-1.5 flex items-baseline gap-1">
        {createElement(HeartPulse, { size: 11, strokeWidth: 2, style: { color: preset.color } })}
        <span className="text-sm font-semibold tabular-nums" style={{ color: '#FAF8F3' }}>
          {displayBpm}
        </span>
        <span className="text-[8px]" style={{ color: '#C79289' }}>
          BPM
        </span>
      </div>

      <div
        className="absolute bottom-1 right-1.5 text-[8.5px] font-mono tabular-nums px-1 py-0.5 rounded-[2px]"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#E8A33D' }}
      >
        {timeStr}
      </div>
    </button>
  );
}

function FeatureCard({ feature, index, active }) {
  const { icon: Icon, title, desc, detail } = feature;
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="group relative flex items-start gap-4 p-5 sm:p-6 rounded-sm text-left w-full transition-all duration-300 hover:-translate-y-0.5 overflow-hidden focus:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: '#7A1B16',
        border: '1px solid #8C2A22',
        transitionDelay: active ? `${index * 90}ms` : '0ms',
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(14px)',
        outlineColor: '#E8A33D',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-transform duration-300 origin-left"
        style={{ backgroundColor: '#E8A33D', transform: open ? 'scaleX(1)' : 'scaleX(0)' }}
      />
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm transition-all duration-300 group-hover:scale-110"
        style={{ backgroundColor: 'rgba(232,163,61,0.12)' }}
      >
        {createElement(Icon, { size: 18, strokeWidth: 2, style: { color: '#E8A33D' } })}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: '#FAF8F3' }}>
            {title}
          </p>
          {createElement(ChevronDown, {
            size: 14,
            strokeWidth: 2.5,
            style: {
              color: '#C79289',
              flexShrink: 0,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
            },
          })}
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#D9B3AC' }}>
          {desc}
        </p>
        <DetailPanel open={open}>
          <p
            className="pt-2.5 mt-1 text-[12px] leading-relaxed"
            style={{ color: '#F0C88A', borderTop: '1px solid rgba(232,163,61,0.18)' }}
          >
            {detail}
          </p>
        </DetailPanel>
      </div>
    </button>
  );
}

// ── UKURAN FACILITY PARAMEDIS SECTION ────────────────────────
// Skala "default" (py-16 sm:py-20 lg:py-24), sama dengan
// About, Policy, HSE, CCTV, dst.

export default function FacilityParamedisSection() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fadeUp = (delay) => ({
    transitionDelay: `${delay}ms`,
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(16px)',
  });

  return (
    <section
      id="fasilitas-paramedis"
      ref={sectionRef}
      className="w-full"
      style={{ backgroundColor: '#6B1414' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Header + monitor vital sign */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-10">
          <div className="max-w-3xl">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm transition-all duration-700"
              style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D', ...fadeUp(0) }}
            >
              {createElement(ShieldPlus, { size: 13, strokeWidth: 2 })}
              Fasilitas — Layanan Medis
            </span>

            <h2
              className="mt-4 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-snug transition-all duration-700"
              style={{ color: '#FAF8F3', ...fadeUp(100) }}
            >
              Siaga medis 24 jam, siap menjangkau setiap pengunjung
            </h2>
            <p
              className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed transition-all duration-700"
              style={{ color: '#D9B3AC', ...fadeUp(180) }}
            >
              Tim paramedis Pondok Indah Mall siaga di seluruh area publik, terintegrasi dengan tim
              keamanan dan HSE untuk penanganan darurat yang cepat dan terkoordinasi. Ketuk kartu di
              bawah, atau monitor vital sign, untuk melihat detailnya.
            </p>
          </div>

          <VitalMonitor active={inView} />
        </div>

        {/* Stats — bisa diketuk untuk detail singkat */}
        <div
          className="mt-10 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden"
          style={{ backgroundColor: '#8C2A22' }}
        >
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} active={inView} delay={260 + i * 100} />
          ))}
        </div>

        {/* Features — bisa diketuk untuk detail singkat */}
        <div className="mt-10 sm:mt-14 grid sm:grid-cols-2 gap-6 sm:gap-8">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} active={inView} />
          ))}
        </div>

        {/* Team Carousel */}
        <ParamedisTeamCarousel />

        {/* Coverage note */}
        <div
          className="mt-8 sm:mt-10 flex items-center gap-3 pt-8 transition-all duration-700"
          style={{ borderTop: '1px solid #8C2A22', ...fadeUp(500) }}
        >
          {createElement(Activity, { size: 16, strokeWidth: 2, style: { color: '#C79289' } })}
          <p className="text-xs" style={{ color: '#C79289' }}>
            Cakupan mencakup area parkir, lobi, foodcourt, dan titik kumpul evakuasi.
          </p>
        </div>
      </div>
    </section>
  );
}

function ParamedisTeamCarousel() {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [perView, setPerView] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const [roleFilter, setRoleFilter] = useState('Semua');
  const touchStartX = useRef(null);
  const resumeTimer = useRef(null);

  // Data tim masih statis (TEAM_DATA di atas) — panggilan ke
  // /public/paramedic sengaja belum dipasang. Saat endpoint siap,
  // tinggal ganti `team` ini dengan hasil fetch, dengan mapping field
  // yang sama seperti versi CCTV:
  //   name: p.NameParamedic || p.name_paramedic
  //   role: p.Role || p.role || 'Paramedis'
  //   photo: p.Photo || p.photo || null
  const team = TEAM_DATA;

  const roles = useMemo(() => Array.from(new Set(team.map((t) => t.role))), [team]);
  const showRoleFilter = roles.length > 1;
  const filteredTeam = roleFilter === 'Semua' ? team : team.filter((t) => t.role === roleFilter);

  useEffect(() => {
    setRoleFilter('Semua');
  }, [roles.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [roleFilter]);

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

  const maxIndex = Math.max(0, filteredTeam.length - perView);

  const goTo = useCallback(
    (index, fromUser = false) => {
      const clamped = Math.min(Math.max(index, 0), maxIndex);
      setActiveIndex(clamped);
      if (fromUser) {
        setIsPaused(true);
        clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => setIsPaused(false), 5000);
      }
    },
    [maxIndex]
  );

  const goNext = (fromUser = true) => goTo(activeIndex + 1, fromUser);
  const goPrev = (fromUser = true) => goTo(activeIndex - 1, fromUser);

  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [maxIndex, isPaused]);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  function handleKeyDown(e) {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  }
  function handleTouchEnd(e) {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -40) {
      goNext();
    } else if (delta > 40) {
      goPrev();
    } else {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => setIsPaused(false), 5000);
    }
    touchStartX.current = null;
  }

  const cardWidthPct = 100 / perView;

  return (
    <div className="mt-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: '#E8A33D' }}>
          Tim Paramedis Kami
        </p>

        <div className="flex items-center gap-3">
          {showRoleFilter && (
            <div className="flex flex-wrap gap-1.5">
              {['Semua', ...roles].map((r) => {
                const isActive = r === roleFilter;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleFilter(r)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors"
                    style={{
                      backgroundColor: isActive ? '#E8A33D' : 'transparent',
                      color: isActive ? '#4A2E0A' : '#D9B3AC',
                      border: `1px solid ${isActive ? '#E8A33D' : '#8C2A22'}`,
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => goPrev()}
              aria-label="Sebelumnya"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgba(232,163,61,0.12)]"
              style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22', color: '#E8A33D' }}
            >
              {createElement(ChevronLeft, { size: 16, strokeWidth: 2 })}
            </button>
            <button
              type="button"
              onClick={() => goNext()}
              aria-label="Berikutnya"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgba(232,163,61,0.12)]"
              style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22', color: '#E8A33D' }}
            >
              {createElement(ChevronRight, { size: 16, strokeWidth: 2 })}
            </button>
          </div>
        </div>
      </div>

      <div
        className="relative mt-5 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Karosel tim paramedis, gunakan panah kiri kanan untuk navigasi"
      >
        <div
          ref={trackRef}
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * cardWidthPct}%)` }}
        >
          {filteredTeam.map(({ name, role, photo }, i) => (
            <div
              key={`${name}-${i}`}
              className="shrink-0 px-2"
              style={{ width: `${cardWidthPct}%` }}
            >
              <div
                className="group rounded-sm p-5 text-center h-full transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22' }}
              >
                <div
                  className="mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
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

        {/* Fade mask di tepi kiri/kanan — memberi isyarat masih ada kartu lain */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12"
          style={{ background: 'linear-gradient(to right, #6B1414, transparent)' }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12"
          style={{ background: 'linear-gradient(to left, #6B1414, transparent)' }}
        />
      </div>

      {filteredTeam.length === 0 && (
        <p className="mt-6 text-center text-xs" style={{ color: '#C79289' }}>
          Belum ada paramedis pada peran ini.
        </p>
      )}

      {/* Dot indicators */}
      {maxIndex > 0 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i, true)}
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
      )}

      {/* Mobile nav buttons */}
      <div className="mt-4 flex sm:hidden items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goPrev()}
          aria-label="Sebelumnya"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22', color: '#E8A33D' }}
        >
          {createElement(ChevronLeft, { size: 16, strokeWidth: 2 })}
        </button>
        <button
          type="button"
          onClick={() => goNext()}
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
