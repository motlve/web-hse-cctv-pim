import { createElement, useState, useRef, useEffect, useCallback } from 'react';

import {
  HeartPulse,
  Flame,
  Stethoscope,
  ClipboardCheck,
  Siren,
  HardHat,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

/* =========================================================
   DATA
========================================================= */

const STATS = [
  {
    numeric: 15,
    suffix: '+',
    label: 'Petugas HSE Bersertifikasi',
    detail: 'Termasuk sertifikasi BLS, PPGD, dan Ahli K3 Umum.',
  },
  {
    display: '24/7',
    label: 'Siaga Tanggap Darurat',
    detail: 'Petugas berjaga bergiliran dalam 3 shift tanpa jeda.',
  },
  {
    display: '<5 mnt',
    label: 'Waktu Respons Medis',
    detail: 'Dihitung sejak laporan diterima hingga paramedis tiba di lokasi.',
  },
  {
    numeric: 100,
    suffix: '%',
    label: 'Area Tercover Jalur Evakuasi',
    detail: 'Dipetakan dan diuji lewat simulasi evakuasi rutin.',
  },
];

const FEATURES = [
  {
    icon: Stethoscope,
    title: 'Layanan Medis Standby',
    desc: 'Tim paramedis dan ruang P3K siaga penuh untuk menangani kondisi darurat kesehatan pengunjung.',
    detail: 'Ruang P3K aktif 24 jam dengan tenaga paramedis bersertifikasi BLS/PPGD.',
  },
  {
    icon: Flame,
    title: 'Manajemen Risiko Kebakaran',
    desc: 'Inspeksi rutin sistem pemadam, jalur evakuasi, dan titik kumpul sesuai standar keselamatan gedung.',
    detail:
      'Inspeksi APAR, hydrant, dan jalur evakuasi dilakukan sesuai jadwal bersama Damkar setempat.',
  },
  {
    icon: ClipboardCheck,
    title: 'Audit & Inspeksi Berkala',
    desc: 'Pemeriksaan lingkungan kerja, sanitasi, dan kepatuhan K3 dilakukan terjadwal di seluruh area mall.',
    detail: 'Mencakup kualitas udara, sanitasi dapur tenant, dan kepatuhan prosedur K3 kontraktor.',
  },
  {
    icon: Siren,
    title: 'Protokol Tanggap Darurat',
    desc: 'Prosedur evakuasi dan respons insiden terintegrasi dengan tim keamanan dan command center.',
    detail: 'Terhubung langsung ke command center dan seluruh radio petugas lapangan.',
  },
];

const TEAM = [
  {
    name: 'Nama Petugas',
    role: 'Manager HSE',
    level: 'Manajemen',
    photo: null,
  },
  {
    name: 'Nama Petugas',
    role: 'Asisten Manager HSE',
    level: 'Manajemen',
    photo: null,
  },
  {
    name: 'Nama Petugas',
    role: 'Supervisor HSE',
    level: 'Supervisor',
    photo: null,
  },
  {
    name: 'Nama Petugas',
    role: 'Supervisor HSE',
    level: 'Supervisor',
    photo: null,
  },
  {
    name: 'Nama Petugas',
    role: 'Anggota HSE',
    level: 'Anggota',
    photo: null,
  },
  {
    name: 'Nama Petugas',
    role: 'Anggota HSE',
    level: 'Anggota',
    photo: null,
  },
  {
    name: 'Nama Petugas',
    role: 'Anggota HSE',
    level: 'Anggota',
    photo: null,
  },
  {
    name: 'Nama Petugas',
    role: 'Anggota HSE',
    level: 'Anggota',
    photo: null,
  },
];

const LEVELS = ['Semua', 'Manajemen', 'Supervisor', 'Anggota'];

const LEVEL_RING = {
  Manajemen: '#E8A33D',
  Supervisor: 'rgba(232,163,61,0.55)',
  Anggota: '#8C2A22',
};

/* =========================================================
   ECG
========================================================= */

const ECG_PATH =
  'M0,45 L16,45 L20,45 L24,18 L28,72 L32,38 L36,45 L52,45 L60,45 L64,28 L68,58 L72,45 L96,45 L104,45 L108,15 L112,75 L116,36 L120,45 L160,45';

/* =========================================================
   REDUCED MOTION
========================================================= */

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

/* =========================================================
   COUNT UP
========================================================= */

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

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [active, target, duration, reduced]);

  return value;
}

/* =========================================================
   DETAIL PANEL
========================================================= */

function DetailPanel({ open, children }) {
  return (
    <div
      className="grid transition-all duration-300 ease-out"
      style={{
        gridTemplateRows: open ? '1fr' : '0fr',
      }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ stat, active, delay }) {
  const count = useCountUp(stat.numeric ?? 0, active && stat.numeric != null);

  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="w-full p-6 text-left transition-all duration-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset"
      style={{
        backgroundColor: open ? '#8C2A22' : '#7A1B16',
        transitionDelay: `${delay}ms`,
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(10px)',
        outlineColor: '#E8A33D',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-2xl font-semibold tabular-nums sm:text-3xl"
          style={{
            color: '#E8A33D',
          }}
        >
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

      <p
        className="mt-1.5 text-[13px] leading-relaxed"
        style={{
          color: '#D9B3AC',
        }}
      >
        {stat.label}
      </p>

      <DetailPanel open={open}>
        <p
          className="pt-2 text-[11.5px] leading-relaxed"
          style={{
            color: '#F0C88A',
          }}
        >
          {stat.detail}
        </p>
      </DetailPanel>
    </button>
  );
}

/* =========================================================
   VITAL MONITOR
========================================================= */

function VitalMonitor({ active }) {
  const reduceMotion = usePrefersReducedMotion();
  const [bpm, setBpm] = useState(72);

  useEffect(() => {
    if (!active || reduceMotion) return;

    const t = setInterval(() => {
      setBpm(70 + Math.round(Math.random() * 5));
    }, 2600);

    return () => clearInterval(t);
  }, [active, reduceMotion]);

  return (
    <div
      className="relative h-20 w-40 shrink-0 overflow-hidden rounded-sm transition-all duration-700 sm:h-24 sm:w-44"
      style={{
        backgroundColor: '#5A0F0F',
        border: '1px solid #8C2A22',
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(0.9)',
      }}
    >
      <svg
        viewBox="0 0 160 90"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <g stroke="rgba(232,163,61,0.14)" strokeWidth="0.5">
          {[20, 40, 60, 80, 100, 120, 140].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="90" />
          ))}

          {[18, 36, 54, 72].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="160" y2={y} />
          ))}
        </g>
      </svg>

      <svg
        viewBox="0 0 160 90"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <g className={reduceMotion ? '' : 'hse-ecg-scroll'}>
          <path
            d={ECG_PATH}
            fill="none"
            stroke="#E8A33D"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <g transform="translate(160,0)">
            <path
              d={ECG_PATH}
              fill="none"
              stroke="#E8A33D"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </svg>

      <div className="absolute left-2.5 top-2 flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{
              backgroundColor: '#8FBF6F',
            }}
          />

          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: '#8FBF6F',
            }}
          />
        </span>

        <span
          className="text-[8.5px] font-semibold uppercase tracking-wider"
          style={{
            color: '#F3D9AE',
          }}
        >
          Medis Siaga
        </span>
      </div>

      <div
        className="absolute bottom-1.5 right-2.5 text-[9px] font-mono tabular-nums"
        style={{
          color: '#E8A33D',
          animation: reduceMotion ? 'none' : 'hse-bpm-tick 2.6s ease-in-out infinite',
        }}
      >
        {bpm} BPM
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({ feature, index, active }) {
  const { icon: Icon, title, desc, detail } = feature;

  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="group relative flex w-full items-start gap-4 overflow-hidden rounded-sm p-6 text-left transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2"
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
        className="absolute left-0 right-0 top-0 h-[2px] origin-left transition-transform duration-300"
        style={{
          backgroundColor: '#E8A33D',
          transform: open ? 'scaleX(1)' : 'scaleX(0)',
        }}
      />

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm transition-all duration-300 group-hover:scale-110"
        style={{
          backgroundColor: 'rgba(232,163,61,0.12)',
        }}
      >
        {createElement(Icon, {
          size: 18,
          strokeWidth: 2,
          style: {
            color: '#E8A33D',
          },
        })}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-sm font-semibold"
            style={{
              color: '#FAF8F3',
            }}
          >
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

        <p
          className="mt-1.5 text-[13px] leading-relaxed"
          style={{
            color: '#D9B3AC',
          }}
        >
          {desc}
        </p>

        <DetailPanel open={open}>
          <p
            className="mt-1 border-t pt-2.5 text-[12px] leading-relaxed"
            style={{
              color: '#F0C88A',
              borderColor: 'rgba(232,163,61,0.18)',
            }}
          >
            {detail}
          </p>
        </DetailPanel>
      </div>
    </button>
  );
}

/* =========================================================
   BOUNCE TEAM CARD
   UI ONLY — LOGIC CAROUSEL TETAP
========================================================= */

function TeamMemberCard({ name, role, level, photo }) {
  return (
    <div
      className="group relative h-full overflow-hidden rounded-2xl p-5 text-center transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02]"
      style={{
        background: 'linear-gradient(145deg, rgba(122,27,22,0.98), rgba(90,15,15,0.98))',
        border: '1px solid rgba(232,163,61,0.18)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Glow kanan atas */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-100"
        style={{
          backgroundColor: '#E8A33D',
        }}
      />

      {/* Glow kiri bawah */}
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-60"
        style={{
          backgroundColor: '#8C2A22',
        }}
      />

      {/* Accent line */}
      <div
        className="absolute left-1/2 top-0 h-[3px] w-0 -translate-x-1/2 rounded-full transition-all duration-500 group-hover:w-16"
        style={{
          backgroundColor: '#E8A33D',
          boxShadow: '0 0 14px rgba(232,163,61,0.65)',
        }}
      />

      {/* Avatar */}
      <div className="relative mx-auto">
        <div
          className="absolute inset-[-7px] rounded-full opacity-40 blur-sm transition-all duration-500 group-hover:scale-110 group-hover:opacity-80"
          style={{
            backgroundColor:
              level === 'Manajemen' ? 'rgba(232,163,61,0.28)' : 'rgba(232,163,61,0.10)',
          }}
        />

        <div
          className="relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-2"
          style={{
            backgroundColor: '#6B1414',
            border: `2px solid ${LEVEL_RING[level] || '#8C2A22'}`,
            boxShadow:
              level === 'Manajemen'
                ? '0 0 0 4px rgba(232,163,61,0.10), 0 8px 20px rgba(0,0,0,0.25)'
                : '0 8px 20px rgba(0,0,0,0.22)',
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            createElement(User, {
              size: 34,
              strokeWidth: 1.4,
              style: {
                color: '#C79289',
              },
            })
          )}
        </div>

        {/* Online indicator */}
        <span
          className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full"
          style={{
            backgroundColor: '#6B1414',
            border: '2px solid #7A1B16',
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: '#8FBF6F',
              boxShadow: '0 0 8px rgba(143,191,111,0.8)',
            }}
          />
        </span>
      </div>

      {/* Nama */}
      <p
        className="relative mt-5 truncate text-sm font-semibold transition-transform duration-500 group-hover:-translate-y-0.5"
        style={{
          color: '#FAF8F3',
        }}
        title={name}
      >
        {name}
      </p>

      {/* Jabatan */}
      <p
        className="relative mt-1 text-[12px] font-medium"
        style={{
          color: '#E8A33D',
        }}
      >
        {role}
      </p>

      {/* Level */}
      <div className="relative mt-3 flex justify-center">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 group-hover:px-4"
          style={{
            color: level === 'Manajemen' ? '#4A2E0A' : '#D9B3AC',
            backgroundColor: level === 'Manajemen' ? '#E8A33D' : 'rgba(140,42,34,0.35)',
            border: level === 'Manajemen' ? '1px solid #E8A33D' : '1px solid rgba(232,163,61,0.16)',
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: level === 'Manajemen' ? '#7A1B16' : '#E8A33D',
            }}
          />

          {level}
        </span>
      </div>

      {/* Bottom shine */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 transition-all duration-500 group-hover:w-24"
        style={{
          backgroundColor: '#E8A33D',
          boxShadow: '0 0 10px rgba(232,163,61,0.5)',
        }}
      />
    </div>
  );
}

/* =========================================================
   TEAM CAROUSEL
   LOGIC TETAP
========================================================= */

function TeamCarousel() {
  const trackRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const [perView, setPerView] = useState(4);

  const [isPaused, setIsPaused] = useState(false);

  const [levelFilter, setLevelFilter] = useState('Semua');

  const touchStartX = useRef(null);
  const resumeTimer = useRef(null);

  const filteredTeam = levelFilter === 'Semua' ? TEAM : TEAM.filter((t) => t.level === levelFilter);

  const counts = LEVELS.reduce((map, lvl) => {
    map[lvl] = lvl === 'Semua' ? TEAM.length : TEAM.filter((t) => t.level === lvl).length;

    return map;
  }, {});

  /* Responsive per view */
  useEffect(() => {
    const updatePerView = () => {
      if (window.innerWidth < 640) {
        setPerView(2);
      } else if (window.innerWidth < 1024) {
        setPerView(3);
      } else {
        setPerView(4);
      }
    };

    updatePerView();

    window.addEventListener('resize', updatePerView);

    return () => window.removeEventListener('resize', updatePerView);
  }, []);

  const maxIndex = Math.max(0, filteredTeam.length - perView);

  /* Reset filter */
  useEffect(() => {
    setActiveIndex(0);
  }, [levelFilter]);

  /* Keep index valid */
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  /* Navigation */
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

  /* Auto play */
  useEffect(() => {
    if (isPaused || maxIndex <= 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(timer);
  }, [maxIndex, isPaused]);

  useEffect(() => {
    return () => clearTimeout(resumeTimer.current);
  }, []);

  /* Keyboard */
  function handleKeyDown(e) {
    if (e.key === 'ArrowRight') {
      goNext();
    }

    if (e.key === 'ArrowLeft') {
      goPrev();
    }
  }

  /* Touch */
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          className="text-xs font-medium uppercase tracking-[0.14em]"
          style={{
            color: '#E8A33D',
          }}
        >
          Tim HSE Kami
        </p>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((lvl) => {
              const isActive = lvl === levelFilter;

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? '#E8A33D' : 'transparent',

                    color: isActive ? '#4A2E0A' : '#D9B3AC',

                    border: `1px solid ${isActive ? '#E8A33D' : '#8C2A22'}`,
                  }}
                >
                  {lvl}

                  <span
                    className="rounded-full px-1.5 text-[9.5px] font-semibold"
                    style={{
                      color: isActive ? '#4A2E0A' : '#C79289',
                    }}
                  >
                    {counts[lvl]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => goPrev()}
              aria-label="Sebelumnya"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgba(232,163,61,0.12)]"
              style={{
                backgroundColor: '#7A1B16',
                border: '1px solid #8C2A22',
                color: '#E8A33D',
              }}
            >
              {createElement(ChevronLeft, {
                size: 16,
                strokeWidth: 2,
              })}
            </button>

            <button
              type="button"
              onClick={() => goNext()}
              aria-label="Berikutnya"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgba(232,163,61,0.12)]"
              style={{
                backgroundColor: '#7A1B16',
                border: '1px solid #8C2A22',
                color: '#E8A33D',
              }}
            >
              {createElement(ChevronRight, {
                size: 16,
                strokeWidth: 2,
              })}
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        className="relative mt-5 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Karosel tim HSE, gunakan panah kiri kanan untuk navigasi"
      >
        <div
          ref={trackRef}
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${activeIndex * cardWidthPct}%)`,
          }}
        >
          {filteredTeam.map(({ name, role, level, photo }, i) => (
            <div
              key={`${role}-${i}`}
              className="shrink-0 px-2 py-2"
              style={{
                width: `${cardWidthPct}%`,
              }}
            >
              {/* =================================================
                    BOUNCE CARD UI
                ================================================= */}
              <TeamMemberCard name={name} role={role} level={level} photo={photo} />
            </div>
          ))}
        </div>

        {/* Left fade */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12"
          style={{
            background: 'linear-gradient(to right, #6B1414, transparent)',
          }}
        />

        {/* Right fade */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12"
          style={{
            background: 'linear-gradient(to left, #6B1414, transparent)',
          }}
        />
      </div>

      {/* Empty state */}
      {filteredTeam.length === 0 && (
        <p
          className="mt-6 text-center text-xs"
          style={{
            color: '#C79289',
          }}
        >
          Belum ada anggota pada level ini.
        </p>
      )}

      {/* Dots */}
      {maxIndex > 0 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({
            length: maxIndex + 1,
          }).map((_, i) => (
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

      {/* Mobile navigation */}
      <div className="mt-4 flex items-center justify-center gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => goPrev()}
          aria-label="Sebelumnya"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: '#7A1B16',
            border: '1px solid #8C2A22',
            color: '#E8A33D',
          }}
        >
          {createElement(ChevronLeft, {
            size: 16,
            strokeWidth: 2,
          })}
        </button>

        <button
          type="button"
          onClick={() => goNext()}
          aria-label="Berikutnya"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            backgroundColor: '#7A1B16',
            border: '1px solid #8C2A22',
            color: '#E8A33D',
          }}
        >
          {createElement(ChevronRight, {
            size: 16,
            strokeWidth: 2,
          })}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN HSE SECTION
========================================================= */

export default function FacilityHSESection() {
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
      {
        threshold: 0.25,
      }
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
      id="fasilitas-hse"
      ref={sectionRef}
      className="w-full"
      style={{
        backgroundColor: '#6B1414',
      }}
    >
      <style>{`
        @keyframes hse-ecg-scroll-kf {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-160px);
          }
        }

        .hse-ecg-scroll {
          animation:
            hse-ecg-scroll-kf
            2.6s linear infinite;
        }

        @keyframes hse-bpm-tick {
          0%,
          100% {
            opacity: 0.7;
            transform: scale(1);
          }

          15% {
            opacity: 1;
            transform: scale(1.08);
          }

          30% {
            opacity: 0.85;
            transform: scale(1);
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-10">
          <div className="max-w-3xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] transition-all duration-700"
              style={{
                backgroundColor: 'rgba(232,163,61,0.12)',
                color: '#E8A33D',
                ...fadeUp(0),
              }}
            >
              {createElement(HeartPulse, {
                size: 13,
                strokeWidth: 2,
              })}
              Fasilitas — Health, Safety & Environment
            </span>

            <h2
              className="mt-5 text-2xl font-semibold leading-snug transition-all duration-700 sm:text-3xl"
              style={{
                color: '#FAF8F3',
                ...fadeUp(100),
              }}
            >
              Keselamatan dan kesehatan terjaga di setiap langkah
            </h2>

            <p
              className="mt-3 text-sm leading-relaxed transition-all duration-700 sm:text-[15px]"
              style={{
                color: '#D9B3AC',
                ...fadeUp(180),
              }}
            >
              Tim HSE Pondok Indah Mall memastikan standar keselamatan, kesehatan, dan lingkungan
              terpenuhi di seluruh area, dengan kesiapan penuh menghadapi situasi darurat. Ketuk
              kartu di bawah untuk melihat detailnya.
            </p>
          </div>

          <VitalMonitor active={inView} />
        </div>

        {/* Stats */}
        <div
          className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-sm lg:grid-cols-4"
          style={{
            backgroundColor: '#8C2A22',
          }}
        >
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} active={inView} delay={260 + i * 100} />
          ))}
        </div>

        {/* Features */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} active={inView} />
          ))}
        </div>

        {/* Team */}
        <TeamCarousel />

        {/* Coverage */}
        <div
          className="mt-10 flex items-center gap-3 border-t pt-8 transition-all duration-700"
          style={{
            borderColor: '#8C2A22',
            ...fadeUp(500),
          }}
        >
          {createElement(HardHat, {
            size: 16,
            strokeWidth: 2,
            style: {
              color: '#C79289',
            },
          })}

          <p
            className="text-xs"
            style={{
              color: '#C79289',
            }}
          >
            Mencakup keselamatan kerja kontraktor, kesiapsiagaan bencana, dan pengelolaan lingkungan
            gedung.
          </p>
        </div>
      </div>
    </section>
  );
}
