import { createElement, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  Radar,
  MonitorPlay,
  ScanEye,
  FileClock,
  Radio,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

import api from '../../api/axios.js';

const STATS = [
  {
    numeric: 120,
    suffix: '+',
    label: 'Titik Kamera Terpasang',
    detail:
      'Tersebar merata di area parkir, lobi, koridor, tangga darurat, dan titik kumpul evakuasi.',
  },
  {
    display: '24/7',
    label: 'Monitoring Non-Stop',
    detail: 'Ruang kontrol dijaga bergiliran oleh operator bersertifikasi tanpa jeda.',
  },
  {
    display: '<3 mnt',
    label: 'Waktu Respons Insiden',
    detail: 'Dihitung sejak anomali terdeteksi hingga tim lapangan terdekat merespons.',
  },
  {
    numeric: 30,
    suffix: ' Hari',
    label: 'Retensi Rekaman',
    detail: 'Rekaman disimpan dan dapat ditelusuri kapan saja diperlukan untuk investigasi.',
  },
];

const FEATURES = [
  {
    icon: MonitorPlay,
    title: 'Live Monitoring Terpusat',
    desc: 'Seluruh titik kamera dipantau real-time dari ruang kontrol oleh petugas bersertifikasi.',
    detail:
      'Seluruh feed kamera dipantau bergiliran shift oleh operator bersertifikasi di command center.',
  },
  {
    icon: ScanEye,
    title: 'Deteksi & Analitik Otomatis',
    desc: 'Sistem membantu mendeteksi anomali dan pergerakan mencurigakan untuk respons lebih cepat.',
    detail: 'Sistem menandai pergerakan mencurigakan sebagai bahan verifikasi cepat oleh operator.',
  },
  {
    icon: Radio,
    title: 'Integrasi dengan Command Center',
    desc: 'Terhubung langsung dengan tim keamanan, HSE, dan paramedis untuk koordinasi tanggap darurat.',
    detail: 'Notifikasi insiden diteruskan langsung ke radio tim keamanan, HSE, dan paramedis.',
  },
  {
    icon: FileClock,
    title: 'Riwayat & Pelaporan Insiden',
    desc: 'Setiap kejadian tercatat dan dapat ditelusuri melalui sistem pelaporan digital.',
    detail: 'Setiap insiden tercatat dengan waktu, lokasi kamera, dan status tindak lanjut.',
  },
];

// Dipakai sebagai placeholder selama data asli dari /officer masih dimuat,
// dan sebagai fallback jika permintaan API gagal.
const FALLBACK_TEAM = Array.from({ length: 8 }, () => ({
  name: 'Nama Petugas',
  role: 'Operator CCTV',
  photo: null,
}));

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
// bersama oleh StatCard dan FeatureCard supaya perilakunya konsisten.
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

// ── SURVEILLANCE WALL ──────────────────────────────────────────
// Elemen signature section ini: dinding monitor mini bergaya ruang
// kontrol CCTV — 6 tile kamera dengan lampu REC berkedip bergantian,
// satu tile yang dipantau bergilir otomatis (menyorot border emas)
// atau bisa dipilih manual dengan klik, dan jam digital yang benar-
// benar berjalan real-time seperti overlay timestamp CCTV sungguhan.
function SurveillanceWall({ active }) {
  const [now, setNow] = useState(new Date());
  const [activeTile, setActiveTile] = useState(0);
  const [manualPause, setManualPause] = useState(false);
  const resumeTimer = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (reduced || manualPause) return;
    const t = setInterval(() => setActiveTile((p) => (p + 1) % 6), 1800);
    return () => clearInterval(t);
  }, [reduced, manualPause]);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  function selectTile(i) {
    setActiveTile(i);
    setManualPause(true);
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setManualPause(false), 4000);
  }

  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });

  return (
    <div
      className="relative shrink-0 w-40 h-24 sm:w-48 sm:h-28 rounded-sm overflow-hidden transition-all duration-700"
      style={{
        backgroundColor: '#3D0A0A',
        border: '1px solid #8C2A22',
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(0.92)',
      }}
    >
      <style>{`
        @keyframes hse-rec-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>

      <div className="absolute inset-1.5 grid grid-cols-3 grid-rows-2 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => selectTile(i)}
            aria-label={`Tampilkan kamera ${i + 1}`}
            aria-pressed={activeTile === i}
            className="relative rounded-[2px] overflow-hidden flex items-center justify-center transition-all duration-500"
            style={{
              backgroundColor: '#2A0808',
              outline: activeTile === i ? '1.5px solid #E8A33D' : '1px solid rgba(232,163,61,0.12)',
              outlineOffset: '-1px',
              cursor: 'pointer',
            }}
          >
            {createElement(Camera, {
              size: 10,
              strokeWidth: 1.5,
              style: { color: activeTile === i ? 'rgba(232,163,61,0.85)' : 'rgba(232,163,61,0.4)' },
            })}
            <span
              className="absolute top-0.5 left-0.5 h-1 w-1 rounded-full"
              style={{
                backgroundColor: '#E8877A',
                animation: reduced ? 'none' : 'hse-rec-blink 1.6s ease-in-out infinite',
                animationDelay: `${i * 0.22}s`,
              }}
            />
          </button>
        ))}
      </div>

      <div
        className="absolute bottom-1 right-1.5 text-[8.5px] font-mono tabular-nums px-1 py-0.5 rounded-[2px]"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#E8A33D' }}
      >
        CAM 0{activeTile + 1} · {timeStr}
      </div>
    </div>
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

// ── UKURAN FACILITY CCTV SECTION ─────────────────────────────
// Pakai skala "default" (py-16 sm:py-20 lg:py-24), sama dengan
// About, Policy, HSE, dst. Heading, body text, dan card padding
// mengikuti tabel skala di SectionContainer.

export default function FacilityCCTVSection() {
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
      id="fasilitas-cctv"
      ref={sectionRef}
      className="w-full"
      style={{ backgroundColor: '#6B1414' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Header + dinding monitor */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-10">
          <div className="max-w-3xl">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm transition-all duration-700"
              style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D', ...fadeUp(0) }}
            >
              {createElement(Camera, { size: 13, strokeWidth: 2 })}
              Fasilitas — Sistem Monitoring
            </span>

            <h2
              className="mt-4 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-snug transition-all duration-700"
              style={{ color: '#FAF8F3', ...fadeUp(100) }}
            >
              Pengawasan CCTV menyeluruh, siaga di setiap sudut mall
            </h2>
            <p
              className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed transition-all duration-700"
              style={{ color: '#D9B3AC', ...fadeUp(180) }}
            >
              Sistem monitoring CCTV Pondok Indah Mall mengawasi seluruh area publik secara
              real-time, terintegrasi dengan tim keamanan dan HSE untuk respons yang cepat dan
              terkoordinasi. Ketuk kartu di bawah, atau salah satu tile monitor, untuk melihat
              detailnya.
            </p>
          </div>

          <SurveillanceWall active={inView} />
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
        <TeamCarousel />

        {/* Coverage note */}
        <div
          className="mt-8 sm:mt-10 flex items-center gap-3 pt-8 transition-all duration-700"
          style={{ borderTop: '1px solid #8C2A22', ...fadeUp(500) }}
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
  const [isPaused, setIsPaused] = useState(false);
  const [roleFilter, setRoleFilter] = useState('Semua');
  const touchStartX = useRef(null);
  const resumeTimer = useRef(null);

  // Data petugas — diambil dari endpoint /officer (sumber sama dengan
  // OfficerLeaderboard), dengan fallback sementara loading/gagal.
  const [team, setTeam] = useState(FALLBACK_TEAM);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchOfficers = async () => {
      try {
        const res = await api.get('/public/officer');

        const officerData = res.data || [];

        const mapped = officerData
          .map((o) => ({
            name: (o.NameOfficer || o.name_officer || '').trim(),
            role: o.Role || o.role || 'Operator CCTV',
            photo: o.Photo || o.photo || null,
          }))
          .filter((o) => o.name);

        if (isMounted && mapped.length > 0) {
          setTeam(mapped);
        }
      } catch (err) {
        console.error('Gagal memuat data petugas:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchOfficers();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Peran ditemukan langsung dari data yang datang — chip filter hanya
  // muncul kalau memang ada lebih dari satu peran berbeda di antara petugas.
  const roles = useMemo(() => Array.from(new Set(team.map((t) => t.role))), [team]);
  const showRoleFilter = roles.length > 1;
  const filteredTeam = roleFilter === 'Semua' ? team : team.filter((t) => t.role === roleFilter);

  useEffect(() => {
    setRoleFilter('Semua');
  }, [roles.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [roleFilter]);

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

  // Reset index kalau jumlah data berubah (mis. setelah fetch selesai)
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  // Auto-play, berhenti saat di-hover atau baru saja dinavigasi manual
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
          Tim CCTV Kami
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
        aria-label="Karosel tim CCTV, gunakan panah kiri kanan untuk navigasi"
      >
        <div
          ref={trackRef}
          className={`flex transition-transform duration-500 ease-out ${isLoading ? 'animate-pulse' : ''}`}
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
          Belum ada petugas pada peran ini.
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
