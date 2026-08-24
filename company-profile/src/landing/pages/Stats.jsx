import { createElement, useState, useRef, useEffect } from 'react';
import {
  BarChart3,
  ShieldCheck,
  HeartPulse,
  Camera,
  Flame,
  Clock3,
  Award,
  Users,
  Activity,
} from 'lucide-react';

// Setiap stat sekarang punya `numeric` (untuk animasi count-up) dan
// `detail` (penjelasan singkat yang muncul saat kartu di-hover/tap).
// Stat yang nilainya bukan angka murni (mis. "2x/thn") cukup pakai `display`.
const HIGHLIGHT_STATS = [
  {
    icon: ShieldCheck,
    numeric: 0,
    suffix: '',
    label: 'Insiden Fatal',
    sub: 'Sepanjang tahun berjalan',
    detail:
      'Tercatat sejak awal tahun — setiap insiden tertangani sebelum meningkat menjadi fatalitas.',
    pulse: true,
  },
  {
    icon: Clock3,
    display: '<5',
    suffix: ' mnt',
    label: 'Rata-rata Respons Darurat',
    sub: 'Medis & keamanan',
    detail: 'Dihitung sejak laporan diterima hingga petugas tiba di lokasi kejadian.',
  },
  {
    icon: Camera,
    numeric: 120,
    suffix: '+',
    label: 'Titik Kamera Aktif',
    sub: 'Termonitor 24/7',
    detail: 'Tersebar di area parkir, lobi, koridor, dan titik kumpul evakuasi.',
  },
  {
    icon: HeartPulse,
    numeric: 15,
    suffix: '+',
    label: 'Petugas HSE Bersertifikasi',
    sub: 'Siaga setiap hari',
    detail: 'Mencakup tenaga medis, tim K3, dan petugas pemadam kebakaran terlatih.',
    pulse: true,
  },
];

const SECONDARY_STATS = [
  {
    icon: Flame,
    numeric: 100,
    suffix: '%',
    label: 'Area Tercakup Sistem Proteksi Kebakaran',
    detail: 'Sprinkler, detektor asap, dan APAR tersedia di setiap lantai.',
  },
  {
    icon: Award,
    display: '2x',
    suffix: '/thn',
    label: 'Simulasi Evakuasi Menyeluruh',
    detail: 'Melibatkan seluruh tenant dan pengunjung yang sedang berada di mall.',
  },
  {
    icon: Users,
    numeric: 20000,
    suffix: '+',
    label: 'Pengunjung Terlindungi / Hari',
    detail: 'Estimasi rata-rata kunjungan harian yang tercakup sistem keamanan.',
  },
  {
    icon: BarChart3,
    display: '30',
    suffix: ' Hari',
    label: 'Retensi Rekaman CCTV',
    detail: 'Rekaman disimpan dan dapat ditelusuri kapan saja diperlukan.',
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

function useCountUp(target, active, duration = 1400) {
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

// ── SAFETY PULSE BAR ───────────────────────────────────────────
// Elemen signature section ini: garis EKG yang berdenyut stabil —
// merepresentasikan "kondisi aman" secara visual, bukan cuma tekstual —
// diiringi indikator status berkedip dan penghitung durasi monitoring
// real-time sejak halaman dibuka. Bukan dekorasi statis: ini adalah
// bentuk visual dari klaim "0 insiden fatal" yang ada di data.
function SafetyPulseBar({ active }) {
  const reduced = usePrefersReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  const format = (totalSeconds) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div
      className="relative shrink-0 w-full sm:w-56 rounded-sm overflow-hidden transition-all duration-700"
      style={{
        backgroundColor: '#3D0A0A',
        border: '1px solid #8C2A22',
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(0.96)',
      }}
    >
      <style>{`
        @keyframes hse-ecg-dash { to { stroke-dashoffset: -240; } }
        @keyframes hse-status-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes hse-heartbeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.22); }
          30% { transform: scale(1); }
          45% { transform: scale(1.12); }
          60% { transform: scale(1); }
        }
      `}</style>

      <div className="flex items-center gap-2 px-3 pt-2.5">
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{
            backgroundColor: '#8FCB8A',
            animation: reduced ? 'none' : 'hse-status-blink 2s ease-in-out infinite',
          }}
        />
        <span className="text-[10.5px] font-mono tracking-[0.12em]" style={{ color: '#8FCB8A' }}>
          STATUS: AMAN
        </span>
        <span className="ml-auto text-[10px] font-mono tabular-nums" style={{ color: '#C79289' }}>
          {format(elapsed)}
        </span>
      </div>

      <svg viewBox="0 0 220 44" className="w-full h-10 px-1" preserveAspectRatio="none">
        <polyline
          points="0,22 40,22 50,22 58,6 66,38 74,22 90,22 100,22 108,10 114,34 120,22 220,22"
          fill="none"
          stroke="#E8A33D"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="6 4"
          style={{
            animation: reduced ? 'none' : 'hse-ecg-dash 3.2s linear infinite',
            opacity: 0.85,
          }}
        />
      </svg>

      <p className="px-3 pb-2.5 text-[10.5px] leading-relaxed" style={{ color: '#C79289' }}>
        Waktu monitoring aktif tanpa insiden
      </p>
    </div>
  );
}

function StatDetail({ open, detail }) {
  return (
    <div
      className="grid transition-all duration-300 ease-out"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <p className="pt-2 text-[11.5px] leading-relaxed" style={{ color: '#F0C88A' }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

function HighlightCard({ stat, active, delay, reduced }) {
  const { icon: Icon, numeric, display, suffix, label, sub, detail, pulse } = stat;
  const count = useCountUp(numeric ?? 0, active && numeric != null);
  const [open, setOpen] = useState(false);

  const shown = numeric != null ? `${count}${suffix}` : `${display}${suffix}`;

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="group relative text-left p-5 sm:p-6 rounded-sm transition-all duration-500 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: '#7A1B16',
        border: '1px solid #8C2A22',
        transitionDelay: active ? `${delay}ms` : '0ms',
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(14px)',
        outlineColor: '#E8A33D',
      }}
    >
      <div
        className="absolute top-0 left-0 h-[2px] transition-all duration-300"
        style={{
          backgroundColor: '#E8A33D',
          width: open ? '100%' : '0%',
        }}
      />

      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-sm transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: 'rgba(232,163,61,0.12)',
            animation: pulse && !reduced ? 'hse-heartbeat 2.6s ease-in-out infinite' : 'none',
          }}
        >
          {createElement(Icon, { size: 18, strokeWidth: 2, style: { color: '#E8A33D' } })}
        </div>
        {createElement(Activity, {
          size: 13,
          strokeWidth: 2,
          style: {
            color: '#C79289',
            opacity: open ? 1 : 0.35,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'all 0.3s ease',
          },
        })}
      </div>

      <p
        className="mt-4 text-2xl sm:text-3xl font-semibold tabular-nums"
        style={{ color: '#E8A33D' }}
      >
        {shown}
      </p>
      <p className="mt-1.5 text-[13px] font-medium leading-relaxed" style={{ color: '#FAF8F3' }}>
        {label}
      </p>
      <p className="mt-0.5 text-[12px]" style={{ color: '#C79289' }}>
        {sub}
      </p>

      <StatDetail open={open} detail={detail} />
    </button>
  );
}

function SecondaryStat({ stat, active }) {
  const { icon: Icon, numeric, display, suffix, label, detail } = stat;
  const count = useCountUp(numeric ?? 0, active && numeric != null);
  const [open, setOpen] = useState(false);
  const shown =
    numeric != null ? `${count.toLocaleString('id-ID')}${suffix}` : `${display}${suffix}`;

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="group flex flex-col items-start gap-1 p-5 sm:p-6 text-left transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset"
      style={{ backgroundColor: open ? '#8C2A22' : '#7A1B16', outlineColor: '#E8A33D' }}
    >
      <div className="flex items-center gap-3 w-full">
        {createElement(Icon, {
          size: 16,
          strokeWidth: 2,
          style: { color: '#C79289', transition: 'color 0.3s ease' },
          className: 'group-hover:text-[#E8A33D]',
        })}
        <div>
          <p
            className="text-base sm:text-lg font-semibold tabular-nums"
            style={{ color: '#FAF8F3' }}
          >
            {shown}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: '#D9B3AC' }}>
            {label}
          </p>
        </div>
      </div>
      <StatDetail open={open} detail={detail} />
    </button>
  );
}

export default function StatsSection() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);
  const reduced = usePrefersReducedMotion();

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
      id="statistik"
      ref={sectionRef}
      className="w-full"
      style={{ backgroundColor: '#6B1414' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Header + pulse bar */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-8 sm:gap-10">
          <div className="max-w-3xl">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm transition-all duration-700"
              style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D', ...fadeUp(0) }}
            >
              {createElement(BarChart3, { size: 13, strokeWidth: 2 })}
              Statistik Kinerja HSE
            </span>

            <h2
              className="mt-4 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-snug transition-all duration-700"
              style={{ color: '#FAF8F3', ...fadeUp(100) }}
            >
              Angka yang mencerminkan komitmen keselamatan kami
            </h2>
            <p
              className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed transition-all duration-700"
              style={{ color: '#D9B3AC', ...fadeUp(180) }}
            >
              Ringkasan capaian sistem HSE, keamanan, dan kesehatan Pondok Indah Mall — dipantau dan
              diperbarui secara berkelanjutan sebagai bagian dari tanggung jawab kami kepada seluruh
              pengunjung, tenant, dan karyawan. Ketuk kartu untuk melihat detailnya.
            </p>
          </div>

          <SafetyPulseBar active={inView} />
        </div>

        {/* Highlight stats — sekarang bisa di-tap untuk membuka detail */}
        <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {HIGHLIGHT_STATS.map((stat, i) => (
            <HighlightCard
              key={stat.label}
              stat={stat}
              active={inView}
              delay={260 + i * 100}
              reduced={reduced}
            />
          ))}
        </div>

        {/* Secondary stats strip — juga interaktif */}
        <div
          className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden transition-all duration-700"
          style={{ backgroundColor: '#8C2A22', ...fadeUp(620) }}
        >
          {SECONDARY_STATS.map((stat) => (
            <SecondaryStat key={stat.label} stat={stat} active={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
