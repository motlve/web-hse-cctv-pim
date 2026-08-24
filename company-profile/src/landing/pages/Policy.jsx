import { createElement, useEffect, useRef, useState } from 'react';
import { ShieldCheck, Target, Users2, RefreshCw, ScrollText, Check } from 'lucide-react';

const COMMITMENTS = [
  {
    icon: Target,
    title: 'Zero Harm',
    desc: 'Berupaya mencegah kecelakaan dan cedera bagi pengunjung, tenant, karyawan, dan kontraktor di seluruh area mall.',
  },
  {
    icon: ScrollText,
    title: 'Kepatuhan Regulasi',
    desc: 'Mematuhi seluruh ketentuan Kemnaker, Dinas Pemadam Kebakaran, dan Dinas Kesehatan yang berlaku.',
  },
  {
    icon: Users2,
    title: 'Keterlibatan Semua Pihak',
    desc: 'Melibatkan tenant, kontraktor, dan karyawan dalam menjaga standar keselamatan bersama.',
  },
  {
    icon: RefreshCw,
    title: 'Perbaikan Berkelanjutan',
    desc: 'Meninjau dan meningkatkan sistem HSE secara berkala mengikuti perkembangan risiko dan teknologi.',
  },
];

const REGULATIONS = [
  { label: 'Kementerian Ketenagakerjaan RI', tilt: -2 },
  { label: 'Dinas Pemadam Kebakaran DKI Jakarta', tilt: 1.5 },
  { label: 'Dinas Kesehatan DKI Jakarta', tilt: -1.5 },
  { label: 'SMK3 — PP No. 50 Tahun 2012', tilt: 2 },
];

// ── SEAL RING ──────────────────────────────────────────────────
// Elemen signature section ini: cincin sertifikasi berputar pelan
// di sekeliling lambang ShieldCheck, mengulang teks sertifikasi
// mengikuti lingkaran (mirip stempel/segel resmi di dokumen
// kebijakan). Saat section masuk viewport, segel ini "menghentak"
// masuk seperti stempel ditekan — menegaskan bahwa ini adalah
// komitmen yang resmi dan tersertifikasi, bukan sekadar teks.
function SealRing({ active }) {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const repeatedText = 'TERSERTIFIKASI SMK3 • KEMNAKER RI • ';

  return (
    <div
      className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 transition-all"
      style={{
        transitionDuration: '650ms',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // overshoot, kesan "hentakan"
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1) rotate(0deg)' : 'scale(1.5) rotate(-14deg)',
      }}
    >
      <svg
        viewBox="0 0 120 120"
        className={reduceMotion ? '' : 'hse-seal-spin'}
        style={{ width: '100%', height: '100%' }}
      >
        <path
          id="hse-seal-path"
          d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
          fill="none"
        />
        <text fontSize="9.2" fill="#E8A33D" letterSpacing="1.5" fontWeight="600">
          <textPath href="#hse-seal-path" startOffset="0%">
            {repeatedText.repeat(2)}
          </textPath>
        </text>
        <circle
          cx="60"
          cy="60"
          r="34"
          fill="none"
          stroke="rgba(232,163,61,0.35)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      </svg>

      {/* Lambang tetap diam di tengah, tidak ikut berputar */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full"
          style={{
            backgroundColor: '#FAF8F3',
            boxShadow: '0 0 0 3px #6B1414, 0 4px 14px rgba(0,0,0,0.35)',
          }}
        >
          {createElement(ShieldCheck, { size: 20, strokeWidth: 2.2, style: { color: '#6B1414' } })}
        </div>
      </div>
    </div>
  );
}

function RegulationChip({ label, tilt, index, active }) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setSettled(true), 300 + index * 130);
    return () => clearTimeout(t);
  }, [active, index]);

  return (
    <span
      className="group inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm transition-all cursor-default"
      style={{
        backgroundColor: 'rgba(250,248,243,0.06)',
        color: '#FAF8F3',
        transitionDuration: '450ms',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: active ? 1 : 0,
        transform: active
          ? `scale(1) rotate(${settled ? 0 : tilt}deg) translateY(0)`
          : 'scale(0.7) rotate(0deg) translateY(6px)',
        transitionDelay: active ? `${index * 90}ms` : '0ms',
      }}
    >
      <span
        className="flex items-center justify-center w-3.5 h-3.5 rounded-full transition-all duration-300"
        style={{
          backgroundColor: settled ? '#E8A33D' : 'rgba(232,163,61,0.25)',
          transform: settled ? 'scale(1)' : 'scale(0.4)',
        }}
      >
        {createElement(Check, { size: 9, strokeWidth: 3, color: '#4A2E0A' })}
      </span>
      <span className="transition-colors duration-200 group-hover:text-[#F3D9AE]">{label}</span>
    </span>
  );
}

export default function PolicySection() {
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
      id="kebijakan"
      ref={sectionRef}
      className="w-full"
      style={{ backgroundColor: '#6B1414' }}
    >
      <style>{`
        @keyframes hse-seal-spin-kf {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hse-seal-spin {
          animation: hse-seal-spin-kf 34s linear infinite;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm transition-all duration-700"
            style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D', ...fadeUp(0) }}
          >
            {createElement(ShieldCheck, { size: 13, strokeWidth: 2 })}
            Kebijakan HSE
          </span>

          {/* Kutipan + segel sertifikasi berdampingan */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
            <p
              className="text-xl sm:text-2xl leading-snug font-medium transition-all duration-700"
              style={{ color: '#FAF8F3', ...fadeUp(120) }}
            >
              "Kami berkomitmen menjadikan Pondok Indah Mall sebagai kompleks perbelanjaan yang
              aman, sehat, dan ramah lingkungan — bagi setiap orang yang berada di dalamnya, tanpa
              terkecuali."
            </p>
            <SealRing active={inView} />
          </div>

          <div
            className="mt-5 flex items-center gap-3 transition-all duration-700"
            style={fadeUp(220)}
          >
            <div className="h-px w-10" style={{ backgroundColor: '#8C2A22' }} />
            <p className="text-sm" style={{ color: '#D9B3AC' }}>
              Manajemen Building &amp; HSE, Pondok Indah Mall
            </p>
          </div>
        </div>

        {/* Commitment pillars — hover mengangkat kartu & menyalakan aksen emas */}
        <div
          className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden transition-all duration-700"
          style={{ backgroundColor: '#8C2A22', ...fadeUp(280) }}
        >
          {COMMITMENTS.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="group relative p-6 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                backgroundColor: '#7A1B16',
                transitionDelay: inView ? `${320 + i * 80}ms` : '0ms',
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"
                style={{ backgroundColor: '#E8A33D' }}
              />
              <span className="inline-flex transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
                {createElement(Icon, { size: 20, strokeWidth: 2, style: { color: '#E8A33D' } })}
              </span>
              <p className="mt-4 text-sm font-semibold" style={{ color: '#FAF8F3' }}>
                {title}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#D9B3AC' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Regulatory compliance — chip "distempel" masuk satu per satu */}
        <div
          className="mt-10 pt-8 transition-all duration-700"
          style={{ borderTop: '1px solid #8C2A22', ...fadeUp(360) }}
        >
          <p className="text-xs uppercase tracking-[0.12em] mb-3" style={{ color: '#C79289' }}>
            Sesuai dengan ketentuan
          </p>
          <div className="flex flex-wrap gap-2">
            {REGULATIONS.map((item, i) => (
              <RegulationChip
                key={item.label}
                label={item.label}
                tilt={item.tilt}
                index={i}
                active={inView}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
