import { createElement, useEffect, useRef, useState } from 'react';
import { Flame, DoorOpen, Siren, Droplets, Wrench, ClipboardCheck } from 'lucide-react';

const STATS = [
  { numeric: 100, suffix: '%', label: 'Area Tercakup Sprinkler' },
  { display: 'Rutin', label: 'Uji Fungsi & Kalibrasi' },
  { numeric: 2, suffix: 'x / thn', label: 'Simulasi Evakuasi' },
];

const SYSTEMS = [
  {
    icon: Siren,
    title: 'Fire Alarm & Deteksi Asap',
    desc: 'Sistem deteksi dini terpasang di seluruh area untuk memberi peringatan sedini mungkin.',
  },
  {
    icon: Droplets,
    title: 'Sprinkler & Hydrant',
    desc: 'Jaringan pemadam otomatis dan titik hydrant tersebar merata di setiap lantai.',
  },
  {
    icon: DoorOpen,
    title: 'Jalur & Tangga Evakuasi',
    desc: 'Rute evakuasi yang jelas, bebas hambatan, dan dilengkapi penanda arah yang memadai.',
  },
  {
    icon: Wrench,
    title: 'Perawatan Berkala',
    desc: 'Inspeksi dan pemeliharaan rutin terhadap seluruh perangkat proteksi kebakaran.',
  },
];

// Titik-titik pada radar merepresentasikan sebaran detektor/sprinkler
// di seluruh area mall — posisi tetap (bukan acak tiap render).
const COVERAGE_POINTS = [
  { x: 44, y: 40, delay: 0 },
  { x: 96, y: 34, delay: 0.6 },
  { x: 70, y: 66, delay: 1.2 },
  { x: 32, y: 88, delay: 0.3 },
  { x: 100, y: 92, delay: 0.9 },
  { x: 62, y: 22, delay: 1.5 },
];

function useCountUp(target, active, duration = 1200) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
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
  }, [active, target, duration]);

  return value;
}

function StatCard({ stat, active, delay }) {
  const count = useCountUp(stat.numeric ?? 0, active && stat.numeric != null);
  return (
    <div
      className="p-6 transition-all duration-700"
      style={{
        backgroundColor: '#7A1B16',
        transitionDelay: `${delay}ms`,
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      <p className="text-2xl sm:text-3xl font-semibold tabular-nums" style={{ color: '#E8A33D' }}>
        {stat.numeric != null ? `${count}${stat.suffix}` : stat.display}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#D9B3AC' }}>
        {stat.label}
      </p>
    </div>
  );
}

// ── DETECTION RADAR ────────────────────────────────────────────
// Elemen signature section ini: visual radar yang terus memindai,
// dengan titik-titik berdenyut merepresentasikan sebaran
// detektor/sprinkler di seluruh mall. Ini "mewujudkan" klaim
// 100% cakupan secara visual — bukan cuma angka statis, tapi
// kesan sistem yang benar-benar aktif memantau saat ini juga.
function DetectionRadar({ active }) {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="relative shrink-0 w-32 h-32 sm:w-36 sm:h-36 transition-all duration-700"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(0.85)',
      }}
    >
      <svg viewBox="0 0 132 116" className="w-full h-full">
        <defs>
          <radialGradient id="hse-sweep-grad" cx="0%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#E8A33D" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#E8A33D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grid denah — kesan peta area mall */}
        <g stroke="rgba(232,163,61,0.18)" strokeWidth="0.6">
          {[22, 44, 66, 88, 110].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="116" />
          ))}
          {[19, 38, 58, 77, 96].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="132" y2={y} />
          ))}
        </g>
        <rect
          x="0.5"
          y="0.5"
          width="131"
          height="115"
          fill="none"
          stroke="rgba(232,163,61,0.35)"
          strokeWidth="1"
        />

        {/* Sapuan radar berputar terus-menerus */}
        {!reduceMotion && (
          <g className="hse-radar-sweep" style={{ transformOrigin: '66px 58px' }}>
            <path d="M66,58 L66,0 A58,58 0 0,1 108,20 Z" fill="url(#hse-sweep-grad)" />
          </g>
        )}

        {/* Titik-titik cakupan yang berdenyut */}
        {COVERAGE_POINTS.map((p, i) => (
          <g key={i}>
            {!reduceMotion && (
              <circle cx={p.x} cy={p.y} r="2.5" fill="#E8A33D" opacity="0.5">
                <animate
                  attributeName="r"
                  values="2.5;9;2.5"
                  dur="2.4s"
                  begin={`${p.delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.5;0;0.5"
                  dur="2.4s"
                  begin={`${p.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <circle cx={p.x} cy={p.y} r="2.5" fill="#E8A33D" />
          </g>
        ))}

        <circle cx="66" cy="58" r="3.5" fill="#FAF8F3" />
      </svg>
    </div>
  );
}

function SystemCard({ icon: Icon, title, desc, index, active }) {
  return (
    <div
      className="group relative flex items-start gap-4 p-6 rounded-sm transition-all duration-300 hover:-translate-y-0.5"
      style={{
        backgroundColor: '#7A1B16',
        border: '1px solid #8C2A22',
        transitionDelay: active ? `${index * 90}ms` : '0ms',
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(14px)',
      }}
    >
      <div
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-sm transition-colors duration-300 group-hover:bg-[rgba(232,163,61,0.2)]"
        style={{ backgroundColor: 'rgba(232,163,61,0.12)' }}
      >
        {createElement(Icon, { size: 18, strokeWidth: 2, style: { color: '#E8A33D' } })}
        {/* Status "aktif" — menegaskan sistem ini live, bukan cuma daftar fitur */}
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: '#8FBF6F' }}
          />
          <span
            className="relative inline-flex rounded-full h-2.5 w-2.5"
            style={{ backgroundColor: '#8FBF6F' }}
          />
        </span>
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
  );
}

export default function FacilityFireSection() {
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
      id="fasilitas-kebakaran"
      ref={sectionRef}
      className="w-full"
      style={{ backgroundColor: '#6B1414' }}
    >
      <style>{`
        @keyframes hse-radar-sweep-kf {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hse-radar-sweep {
          animation: hse-radar-sweep-kf 5s linear infinite;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header + radar deteksi */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-10">
          <div className="max-w-3xl">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm transition-all duration-700"
              style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D', ...fadeUp(0) }}
            >
              {createElement(Flame, { size: 13, strokeWidth: 2 })}
              Fasilitas — Proteksi Kebakaran
            </span>

            <h2
              className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug transition-all duration-700"
              style={{ color: '#FAF8F3', ...fadeUp(100) }}
            >
              Sistem proteksi kebakaran yang teruji dan selalu siap
            </h2>
            <p
              className="mt-3 text-sm sm:text-[15px] leading-relaxed transition-all duration-700"
              style={{ color: '#D9B3AC', ...fadeUp(180) }}
            >
              Pondok Indah Mall dilengkapi sistem proteksi kebakaran menyeluruh, dari deteksi dini
              hingga jalur evakuasi, dengan perawatan dan simulasi rutin untuk memastikan kesiapan
              setiap saat.
            </p>
          </div>

          <DetectionRadar active={inView} />
        </div>

        {/* Stats */}
        <div
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px rounded-sm overflow-hidden"
          style={{ backgroundColor: '#8C2A22' }}
        >
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} active={inView} delay={260 + i * 100} />
          ))}
        </div>

        {/* Systems */}
        <div className="mt-14 grid sm:grid-cols-2 gap-6">
          {SYSTEMS.map((system, i) => (
            <SystemCard key={system.title} {...system} index={i} active={inView} />
          ))}
        </div>

        {/* Compliance note */}
        <div
          className="mt-10 flex items-center gap-3 pt-8 transition-all duration-700"
          style={{ borderTop: '1px solid #8C2A22', ...fadeUp(500) }}
        >
          {createElement(ClipboardCheck, { size: 16, strokeWidth: 2, style: { color: '#C79289' } })}
          <p className="text-xs" style={{ color: '#C79289' }}>
            Seluruh sistem proteksi kebakaran diperiksa sesuai standar Dinas Pemadam Kebakaran
            setempat.
          </p>
        </div>
      </div>
    </section>
  );
}
