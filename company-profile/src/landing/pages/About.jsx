import { createElement, useEffect, useRef, useState } from 'react';
import { Users, Store, Building2, ShieldCheck, HardHat, UserCheck } from 'lucide-react';

const QUICK_STATS = [
  { icon: Building2, value: 5, suffix: '', label: 'Gedung terintegrasi' },
  { icon: Store, value: 400, suffix: '+', label: 'Tenant beroperasi' },
  { icon: Users, value: 20000, suffix: '+', label: 'Pengunjung / hari' },
];

const PROPERTIES = [
  { name: 'PIM 1', year: '1991', desc: 'Gedung pertama, fondasi kompleks Pondok Indah Mall.' },
  { name: 'PIM 2', year: '2005', desc: 'Perluasan area ritel dan hiburan keluarga.' },
  { name: 'Street Gallery', year: '2013', desc: 'Area open-air penghubung PIM 2 dan PIM 3.' },
  { name: 'PIM 3', year: '2021', desc: 'Gedung modern dengan konsep lifestyle terpadu.' },
  { name: 'PIM 5', year: '2026', desc: 'Perluasan terbaru, saat ini dalam tahap pembangunan.' },
];

const SCOPE = [
  {
    icon: Users,
    title: 'Pengunjung',
    desc: 'Keselamatan dan kenyamanan setiap orang yang datang, dari area parkir hingga seluruh lantai mall.',
  },
  {
    icon: Store,
    title: 'Tenant',
    desc: 'Pengawasan kepatuhan standar keselamatan operasional toko dan restoran di dalam mall.',
  },
  {
    icon: HardHat,
    title: 'Kontraktor',
    desc: 'Pengawasan pekerjaan renovasi dan konstruksi tenant agar tidak membahayakan area sekitar.',
  },
  {
    icon: UserCheck,
    title: 'Karyawan',
    desc: 'Perlindungan bagi seluruh staf building management dalam menjalankan tugas sehari-hari.',
  },
];

// ── UKURAN ABOUT SECTION ──────────────────────────────────────
// Pakai skala "default" (py-16 sm:py-20 lg:py-24), sama dengan
// section standar lain (Policy, HSE, Program, dst). Heading, body
// text, dan card padding mengikuti tabel skala di SectionContainer.

// ── STAT COUNTER ───────────────────────────────────────────────
// Sama seperti di Hero: angka naik sekali saat masuk viewport,
// supaya klaim skala operasi (400+ tenant, 20.000+ pengunjung)
// terasa hidup, bukan cuma angka statis.
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

function formatNumber(n) {
  return n.toLocaleString('id-ID');
}

// Komponen terpisah karena hook tidak boleh dipanggil di dalam
// callback .map() — harus di badan komponen/hook, bukan nested function.
function QuickStatBlock({ icon: StatIcon, value, suffix, label, active, delay }) {
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
      {createElement(StatIcon, { size: 18, strokeWidth: 2, style: { color: '#E8A33D' } })}
      <p
        className="mt-2 text-xl sm:text-2xl font-semibold tabular-nums"
        style={{ color: '#2A2A26' }}
      >
        {formatNumber(count)}
        <span style={{ color: '#E8A33D' }}>{suffix}</span>
      </p>
      <p className="mt-0.5 text-xs" style={{ color: '#8A8A80' }}>
        {label}
      </p>
    </div>
  );
}

export default function AboutSection() {
  const [mounted, setMounted] = useState(false);
  const [statsInView, setStatsInView] = useState(false);
  const [activeProperty, setActiveProperty] = useState(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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

  const fadeUp = (delay) => ({
    transitionDelay: `${delay}ms`,
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(16px)',
  });

  return (
    <section id="tentang" className="w-full" style={{ backgroundColor: '#FAF8F3' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-start">
          {/* Text */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm transition-all duration-700"
              style={{ backgroundColor: 'rgba(107,20,20,0.08)', color: '#6B1414', ...fadeUp(0) }}
            >
              <ShieldCheck size={13} strokeWidth={2} />
              Tentang Kami
            </span>

            <h2
              className="mt-4 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight transition-all duration-700"
              style={{ color: '#2A2A26', ...fadeUp(80) }}
            >
              Satu pusat perbelanjaan, tanggung jawab keselamatan untuk semua
            </h2>

            <p
              className="mt-4 text-sm sm:text-base leading-relaxed transition-all duration-700"
              style={{ color: '#6B6B62', ...fadeUp(160) }}
            >
              Pondok Indah Mall adalah kompleks pusat perbelanjaan terintegrasi di Jakarta Selatan,
              terdiri dari PIM 1, PIM 2, PIM 3, PIM 5, dan Street Gallery yang saling terhubung
              melalui skywalk. Divisi HSE (Health, Safety &amp; Environment) bertanggung jawab
              memastikan seluruh gedung dalam kompleks — dari kunjungan harian hingga renovasi
              tenant — berjalan sesuai standar keselamatan yang berlaku.
            </p>

            {/* Property list — hover/tap untuk lihat detail singkat tiap gedung */}
            <div className="mt-6 transition-all duration-700" style={fadeUp(220)}>
              <div className="flex flex-wrap gap-2">
                {PROPERTIES.map((prop) => {
                  const isActive = activeProperty === prop.name;
                  return (
                    <button
                      key={prop.name}
                      type="button"
                      onMouseEnter={() => setActiveProperty(prop.name)}
                      onFocus={() => setActiveProperty(prop.name)}
                      onClick={() => setActiveProperty(isActive ? null : prop.name)}
                      className="inline-flex items-baseline gap-1.5 text-xs px-3 py-1.5 rounded-sm transition-colors duration-200"
                      style={{
                        backgroundColor: isActive ? '#6B1414' : '#FFFFFF',
                        border: `1px solid ${isActive ? '#6B1414' : '#E4DFD2'}`,
                        color: isActive ? '#FAF8F3' : '#2A2A26',
                      }}
                    >
                      <span className="font-medium">{prop.name}</span>
                      <span style={{ color: isActive ? '#D9B3AC' : '#8A8A80' }}>· {prop.year}</span>
                    </button>
                  );
                })}
              </div>

              {/* Deskripsi singkat — hanya muncul saat salah satu gedung dipilih/di-hover */}
              <div
                className="grid transition-all duration-300 ease-out"
                style={{
                  gridTemplateRows: activeProperty ? '1fr' : '0fr',
                  opacity: activeProperty ? 1 : 0,
                }}
              >
                <div className="overflow-hidden">
                  <p
                    className="mt-3 text-xs sm:text-[13px] leading-relaxed pl-0.5"
                    style={{ color: '#8A8A80' }}
                  >
                    {activeProperty && PROPERTIES.find((p) => p.name === activeProperty)?.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick stats — angka berjalan saat blok ini terlihat */}
            <div
              ref={statsRef}
              className="mt-8 grid grid-cols-3 gap-4 sm:gap-6 transition-all duration-700"
              style={fadeUp(280)}
            >
              {QUICK_STATS.map((stat, i) => (
                <QuickStatBlock key={stat.label} {...stat} active={statsInView} delay={i * 120} />
              ))}
            </div>
          </div>

          {/* Scope cards — hover mengangkat card dan menyalakan ikon */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {SCOPE.map(({ icon: ScopeIcon, title, desc }, i) => (
              <div
                key={title}
                className="group p-5 sm:p-6 rounded-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md cursor-default"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E4DFD2',
                  transitionDelay: mounted ? `${i * 90}ms` : '0ms',
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(16px)',
                }}
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-sm transition-colors duration-300"
                  style={{ backgroundColor: '#6B1414' }}
                >
                  <span className="transition-transform duration-300 group-hover:scale-110 flex">
                    {createElement(ScopeIcon, { size: 17, color: '#E8A33D', strokeWidth: 2 })}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold" style={{ color: '#2A2A26' }}>
                  {title}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#8A8A80' }}>
                  {desc}
                </p>
                <div
                  className="mt-3 h-[2px] w-0 rounded-full transition-all duration-300 ease-out group-hover:w-7"
                  style={{ backgroundColor: '#E8A33D' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
