import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ChevronRight, Radio } from 'lucide-react';
import mallImage from '../assets/images/Pondok-Indah-Mall.png';

// ── UKURAN HERO ────────────────────────────────────────────────
// Hero pakai skala "large" (py-20 sm:py-24 lg:py-32) karena ini
// section pembuka yang butuh ruang lebih besar dari section biasa
// (yang pakai skala "default": py-16 sm:py-20 lg:py-24).
// Padding bawah ditambah sedikit ekstra untuk ruang curve SVG.

// NOTE: Topbar & Footer ada di luar area scroll (lihat Layout.jsx),
// hanya <main> yang scroll. Jadi navigasi anchor (#beranda dst.) ke
// section-section di dalam <main> tidak akan pernah ketutup header,
// tidak perlu scroll-margin-top khusus.

// ── STAT COUNTER ───────────────────────────────────────────────
// Angka naik dari 0 ke target sekali saat section masuk viewport.
// Ini "mengesahkan" klaim 24/7 di headline dengan data konkret,
// bukan sekadar dekorasi — jadi hanya dipasang sekali, tidak looping.
function useCountUp(target, active, duration = 1400) {
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

function StatBlock({ value, suffix, label, active, delay }) {
  const count = useCountUp(value, active);
  return (
    <div
      className="transition-all duration-700"
      style={{
        transitionDelay: `${delay}ms`,
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      <p className="text-2xl sm:text-3xl font-semibold tabular-nums" style={{ color: '#FAF8F3' }}>
        {count}
        <span style={{ color: '#E8A33D' }}>{suffix}</span>
      </p>
      <p className="mt-1 text-xs sm:text-[13px]" style={{ color: '#D9B3AC' }}>
        {label}
      </p>
    </div>
  );
}

export default function HeroSectionV2() {
  const [mounted, setMounted] = useState(false);
  const [statsInView, setStatsInView] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const statsRef = useRef(null);

  // Staggered entrance saat halaman mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Trigger count-up saat blok statistik masuk viewport
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Tilt halus mengikuti kursor pada foto (dimatikan di touch device)
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 });
  }
  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  const fadeUp = (delay) => ({
    transitionDelay: `${delay}ms`,
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(16px)',
  });

  return (
    <section
      id="beranda"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: '#6B1414' }}
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 lg:pt-24 pb-24 sm:pb-28 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="max-w-xl">
            {/* Live status pill — menegaskan "24 jam" di headline dengan sinyal hidup */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 transition-all duration-700"
              style={{
                backgroundColor: 'rgba(232,163,61,0.12)',
                border: '1px solid rgba(232,163,61,0.35)',
                ...fadeUp(0),
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: '#E8A33D' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: '#E8A33D' }}
                />
              </span>
              <span className="text-xs font-medium tracking-wide" style={{ color: '#F3D9AE' }}>
                Tim HSE aktif memantau sekarang
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-tight transition-all duration-700"
              style={{ color: '#FAF8F3', ...fadeUp(100) }}
            >
              Standar Keselamatan Kerja &amp; Lingkungan Tertinggi untuk Setiap Pengunjung Pondok
              Indah Mall
            </h1>

            <p
              className="mt-4 sm:mt-5 text-sm sm:text-base leading-relaxed transition-all duration-700"
              style={{ color: '#D9B3AC', ...fadeUp(200) }}
            >
              Tim Health, Safety &amp; Environment kami mengawasi seluruh area mall selama 24 jam.
              mulai dari kesiapan tim medis, sistem proteksi kebakaran aktif, hingga prosedur
              tanggap darurat yang teruji, demi kenyamanan dan keselamatan Anda beraktivitas.
            </p>

            <div
              className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-4 transition-all duration-700"
              style={fadeUp(300)}
            >
              <a
                href="#kontak"
                className="group inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 sm:py-3 rounded-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ backgroundColor: '#E8A33D', color: '#6B1414' }}
              >
                Hubungi Tim HSE
                <ChevronRight
                  size={16}
                  strokeWidth={2}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
              <a
                href="#kebijakan"
                className="text-sm font-medium px-5 py-2.5 sm:py-3 rounded-sm border transition-colors hover:bg-white/5"
                style={{ borderColor: '#8C2A22', color: '#FAF8F3' }}
              >
                Lihat Kebijakan HSE
              </a>
            </div>

            {/* Statistik singkat — angka berjalan saat section terlihat */}
            <div
              ref={statsRef}
              className="mt-9 sm:mt-10 grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t"
              style={{ borderColor: 'rgba(250,248,243,0.12)' }}
            >
              <StatBlock
                value={24}
                suffix="/7"
                label="Pemantauan CCTV"
                active={statsInView}
                delay={0}
              />
              <StatBlock
                value={5}
                suffix=" mnt"
                label="Rata-rata respons medis"
                active={statsInView}
                delay={120}
              />
              <StatBlock
                value={15}
                suffix="+"
                label="Personel HSE bertugas"
                active={statsInView}
                delay={240}
              />
            </div>
          </div>

          {/* Image — foto asli mall, dengan tilt halus mengikuti kursor */}
          <div
            className="relative transition-all duration-700"
            style={fadeUp(150)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="relative w-full aspect-[4/3] rounded-sm overflow-hidden transition-transform duration-200 ease-out"
              style={{
                backgroundColor: '#7A1B16',
                border: '1px solid #8C2A22',
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              }}
            >
              <img
                src={mallImage}
                alt="Pondok Indah Mall"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>

            {/* Floating badge card — ukuran icon box sama dengan logo di Topbar (w-9 h-9) untuk konsistensi visual */}
            <div
              className="absolute -bottom-5 sm:-bottom-6 -left-4 sm:-left-6 hidden sm:flex items-center gap-3 rounded-sm px-4 py-3 shadow-sm z-10 transition-transform duration-300 hover:-translate-y-1"
              style={{ backgroundColor: '#FAF8F3', border: '1px solid #E4DFD2' }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-sm shrink-0"
                style={{ backgroundColor: '#6B1414' }}
              >
                <ShieldCheck size={18} color="#E8A33D" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold" style={{ color: '#6B1414' }}>
                  Sertifikasi SMK3
                </p>
                <p className="text-xs" style={{ color: '#8A5A52' }}>
                  Terverifikasi Kemnaker RI
                </p>
              </div>
            </div>

            {/* Chip kecil di kanan atas foto — menandai "live" secara visual, senada dengan pill status */}
            <div
              className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 z-10"
              style={{ backgroundColor: 'rgba(107,20,20,0.85)', backdropFilter: 'blur(4px)' }}
            >
              <Radio size={12} color="#E8A33D" strokeWidth={2.5} />
              <span className="text-[11px] font-medium" style={{ color: '#FAF8F3' }}>
                LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Curved bottom transition */}
      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{ height: 60, display: 'block' }}
      >
        <path d="M0,32 C480,80 960,0 1440,32 L1440,80 L0,80 Z" fill="#FAF8F3" />
      </svg>
    </section>
  );
}
