import { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Siren,
  ShieldCheck,
  FileWarning,
  ClipboardList,
  Users,
  Mail,
  Check,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Building2,
    label: 'Inspeksi Fasilitas',
    detail: 'Pemeriksaan berkala sarana, prasarana, dan area kerja di seluruh lingkungan mal.',
  },
  {
    icon: Siren,
    label: 'Peralatan Darurat',
    detail:
      'Pengecekan rutin APAR, alarm kebakaran, sprinkler, dan alat darurat lain agar selalu siap pakai.',
  },
  {
    icon: ShieldCheck,
    label: 'Pengawasan K3',
    detail:
      'Pemantauan kepatuhan keselamatan kerja di area mal, dengan arahan langsung bila ditemukan pelanggaran.',
  },
  {
    icon: FileWarning,
    label: 'Penanganan Insiden',
    detail: 'Koordinasi langsung saat terjadi kebakaran, evakuasi darurat, atau kecelakaan kerja.',
  },
  {
    icon: ClipboardList,
    label: 'Pelaporan',
    detail:
      'Laporan harian dan berkala atas temuan HSE untuk disampaikan ke Supervisor dan Manager.',
  },
  {
    icon: Users,
    label: 'Koordinasi Program',
    detail: 'Kolaborasi lintas departemen untuk menjalankan kebijakan dan program kerja K3.',
  },
];

const LOG_LINES = [
  'Menjadwalkan inspeksi fasilitas & area kerja...',
  'Memeriksa status APAR, alarm, dan sprinkler...',
  'Menyinkronkan checklist kepatuhan K3...',
  'Menyiapkan protokol penanganan insiden...',
  'Menyusun format laporan HSE harian...',
];

function useTypewriter(lines, speed = 32, pause = 1400) {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    let charIndex = 0;
    let timeoutId;
    const currentLine = lines[lineIndex];

    function typeChar() {
      charIndex += 1;
      setText(currentLine.slice(0, charIndex));
      if (charIndex < currentLine.length) {
        timeoutId = setTimeout(typeChar, speed);
      } else {
        timeoutId = setTimeout(() => {
          setLineIndex((i) => (i + 1) % lines.length);
        }, pause);
      }
    }

    setText('');
    timeoutId = setTimeout(typeChar, speed);
    return () => clearTimeout(timeoutId);
  }, [lineIndex, lines, speed, pause]);

  return text;
}

function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const start = prevRef.current;
    const startTime = performance.now();
    let frame;

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}

export default function ComingSoon() {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [openFeature, setOpenFeature] = useState(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [score, setScore] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const reduceMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const logText = useTypewriter(LOG_LINES);
  const displayScore = useCountUp(score);
  const needleAngle = (displayScore / 100) * 180 - 90;

  useEffect(() => {
    if (reduceMotion.current) return;

    function handleMove(e) {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        const withinX = e.clientX >= rect.left && e.clientX <= rect.right;
        const withinY = e.clientY >= rect.top && e.clientY <= rect.bottom;
        setTilt(withinX && withinY ? { x: py * -6, y: px * 6 } : { x: 0, y: 0 });
      }
    }

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  function runInspection() {
    const next = Math.floor(55 + Math.random() * 35);
    setScore(next);
    setPulseKey((k) => k + 1);
  }

  function handleNotify(e) {
    e.preventDefault();
    if (!email.includes('@')) return;
    // TODO: wire this up to your real subscribe endpoint
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3200);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FAF8F3] px-6 py-16">
      <div className="hse-scanlines pointer-events-none absolute inset-0 opacity-[0.035]" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12%] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#6B1414]/12 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[420px] w-[420px] rounded-full bg-[#C81E3A]/12 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl" style={{ perspective: '1200px' }}>
        <div
          ref={cardRef}
          className="hse-card rounded-3xl border border-[#6B1414]/10 bg-white/70 backdrop-blur-sm px-8 py-12 sm:px-12 sm:py-14 shadow-[0_20px_60px_-15px_rgba(107,20,20,0.3)] transition-transform duration-150 ease-out"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          {/* signature: readiness inspection gauge */}
          <button
            type="button"
            aria-label="Jalankan inspeksi ulang"
            onClick={runInspection}
            className="mx-auto mb-2 flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C81E3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3] rounded-2xl"
          >
            <span
              key={pulseKey}
              className="hse-pulse-ring pointer-events-none absolute h-32 w-52 rounded-full border border-[#C81E3A]/40"
            />
            <svg viewBox="0 0 200 120" className="h-24 w-40 sm:h-28 sm:w-48">
              <path
                d="M10,110 A90,90 0 0,1 190,110"
                fill="none"
                stroke="#6B1414"
                strokeOpacity="0.12"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M10,110 A90,90 0 0,1 190,110"
                fill="none"
                stroke="url(#hseGaugeGradient)"
                strokeWidth="14"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset={100 - displayScore}
              />
              <defs>
                <linearGradient id="hseGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4A0E0E" />
                  <stop offset="55%" stopColor="#8C1C1C" />
                  <stop offset="100%" stopColor="#E0483C" />
                </linearGradient>
              </defs>
              <g style={{ transform: `rotate(${needleAngle}deg)`, transformOrigin: '100px 110px' }}>
                <line
                  x1="100"
                  y1="110"
                  x2="100"
                  y2="38"
                  stroke="#2A2320"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
              <circle cx="100" cy="110" r="6" fill="#2A2320" />
            </svg>
            <div className="mt-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#6B1414]/70" strokeWidth={1.75} />
              <span className="text-2xl font-bold text-[#6B1414]">{displayScore}%</span>
            </div>
            <span className="hse-mono mt-0.5 text-[10px] uppercase tracking-[0.2em] text-[#6B1414]/50">
              Skor Kesiapan Sistem
            </span>
          </button>

          <p className="hse-mono mt-7 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-[#C81E3A]">
            PIM Health, Safety &amp; Environment
          </p>

          <h1 className="hse-display mt-3 text-center text-4xl sm:text-5xl font-bold tracking-tight text-[#6B1414]">
            HSE Dashboard
          </h1>
          <p className="hse-display mt-1 text-center text-lg font-medium text-[#C81E3A]">
            Segera Hadir
          </p>

          <p className="mx-auto mt-5 max-w-sm text-center text-[15px] leading-relaxed text-[#2A2320]/70">
            Dashboard pemantauan keselamatan &amp; lingkungan kerja sedang dalam tahap pengembangan.
            Klik gauge di atas untuk menjalankan simulasi inspeksi.
          </p>

          <div className="hse-mono mt-7 rounded-xl border border-[#6B1414]/10 bg-[#2A2320] px-4 py-3 text-left text-[12px] text-[#E0483C]">
            <span className="text-[#E0483C]/50">$ </span>
            {logText}
            <span className="hse-caret">▍</span>
          </div>

          <div className="mt-6 space-y-2">
            {FEATURES.map(({ icon: Icon, label, detail }, i) => {
              const open = openFeature === i;
              return (
                <div
                  key={label}
                  className="overflow-hidden rounded-xl border border-[#6B1414]/10 bg-[#FAF8F3]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFeature(open ? null : i)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C81E3A]"
                    aria-expanded={open}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[#6B1414]/70" strokeWidth={1.75} />
                    <span className="text-xs font-medium text-[#2A2320]/80">{label}</span>
                    <span
                      className={`ml-auto text-[#6B1414]/40 transition-transform duration-200 ${
                        open ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-200 ease-out"
                    style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-3.5 pb-3 text-xs leading-relaxed text-[#2A2320]/60">
                        {detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleNotify} className="mt-7">
            {subscribed ? (
              <div className="flex items-center justify-center gap-2 rounded-full bg-[#6B1414]/5 py-2.5 text-sm font-medium text-[#6B1414]">
                <Check className="h-4 w-4" strokeWidth={2} />
                Terdaftar — kami kabari saat live
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-[#6B1414]/15 bg-white px-2 py-1.5 focus-within:border-[#C81E3A]">
                <Mail className="ml-2 h-4 w-4 shrink-0 text-[#6B1414]/40" strokeWidth={1.75} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@piim.co.id"
                  className="w-full bg-transparent text-sm text-[#2A2320] placeholder:text-[#2A2320]/30 focus:outline-none"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[#6B1414] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#8C1C1C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C81E3A]"
                >
                  Beri Tahu
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 border-t border-[#6B1414]/10 pt-6">
            <div className="flex items-center justify-between text-xs">
              <span className="hse-mono flex items-center gap-2 uppercase tracking-wider text-[#6B1414]">
                <span className="hse-dot h-2 w-2 rounded-full bg-[#C81E3A]" />
                Under Development
              </span>
              <span className="hse-mono text-[#6B1414]/50">{displayScore}%</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#6B1414]/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6B1414] to-[#E0483C] transition-[width] duration-700 ease-out"
                style={{ width: `${displayScore}%` }}
              />
            </div>
          </div>
        </div>

        <a
          href="/dashboard"
          className="mt-6 block text-center text-sm text-[#6B1414]/60 underline-offset-4 hover:text-[#6B1414] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C81E3A] rounded"
        >
          ← Kembali ke Dashboard
        </a>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');

        .hse-display { font-family: 'Space Grotesk', sans-serif; }
        .hse-mono { font-family: 'IBM Plex Mono', monospace; }

        .hse-scanlines {
          background-image: repeating-linear-gradient(
            to bottom,
            #6B1414 0px,
            #6B1414 1px,
            transparent 1px,
            transparent 3px
          );
        }

        @keyframes hse-pulse { 0%, 100% { opacity: 0.35; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes hse-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hse-ring { from { transform: scale(0.8); opacity: 0.8; } to { transform: scale(1.3); opacity: 0; } }
        @keyframes hse-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .hse-card { animation: hse-fade 0.6s ease-out both; }
        .hse-dot { animation: hse-pulse 1.8s ease-in-out infinite; }
        .hse-pulse-ring { animation: hse-ring 0.9s ease-out; }
        .hse-caret { animation: hse-blink 1s step-start infinite; }

        @media (prefers-reduced-motion: reduce) {
          .hse-card, .hse-dot, .hse-pulse-ring, .hse-caret { animation: none; }
        }
      `}</style>
    </div>
  );
}
