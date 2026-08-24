import { useEffect, useRef, useState } from 'react';
import {
  HeartPulse,
  Siren,
  Syringe,
  ClipboardList,
  PackageSearch,
  Sparkles,
  Mail,
  Check,
} from 'lucide-react';

const FEATURES = [
  {
    icon: HeartPulse,
    label: 'Pemeriksaan Tanda Vital',
    detail:
      'Pengukuran tekanan darah, suhu tubuh, dan nadi pengunjung maupun tenant secara berkala.',
  },
  {
    icon: Siren,
    label: 'Pertolongan Pertama',
    detail:
      'Penanganan cepat kondisi darurat seperti pingsan, sesak napas, atau kecelakaan ringan di area mal.',
  },
  {
    icon: Syringe,
    label: 'Terapi & Tindakan Medis',
    detail: 'Pemberian infus, injeksi, dan terapi lain sesuai instruksi dokter yang bertugas.',
  },
  {
    icon: ClipboardList,
    label: 'Rekam Medis',
    detail: 'Pencatatan administrasi dan riwayat kunjungan pasien secara rapi dan akurat.',
  },
  {
    icon: PackageSearch,
    label: 'Alat & Obat-obatan',
    detail: 'Penyiapan alat kesehatan dan bahan medis habis pakai agar selalu siap digunakan.',
  },
  {
    icon: Sparkles,
    label: 'Sterilisasi Ruang Tindakan',
    detail: 'Menjaga kebersihan dan sterilitas ruang klinik sesuai standar pelayanan.',
  },
];

const LOG_LINES = [
  'Memeriksa tekanan darah & nadi pasien...',
  'Menyiapkan alat pertolongan pertama...',
  'Menyinkronkan data rekam medis...',
  'Memvalidasi stok obat & alat kesehatan...',
  'Menjadwalkan sterilisasi ruang tindakan...',
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

function useCountUp(target, duration = 700) {
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

const BP_OPTIONS = ['110/70', '115/75', '118/76', '120/80', '122/78', '125/82'];
const SPO2_OPTIONS = [97, 98, 98, 99, 99, 100];

export default function ParamedisComingSoon() {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [openFeature, setOpenFeature] = useState(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [bpm, setBpm] = useState(78);
  const [bp, setBp] = useState('118/76');
  const [spo2, setSpo2] = useState(98);
  const [pulseKey, setPulseKey] = useState(0);
  const reduceMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const logText = useTypewriter(LOG_LINES);
  const displayBpm = useCountUp(bpm);
  const beatDuration = Math.max(0.45, 60 / bpm);

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

  function runVitalsCheck() {
    const nextBpm = Math.floor(64 + Math.random() * 32);
    const nextBp = BP_OPTIONS[Math.floor(Math.random() * BP_OPTIONS.length)];
    const nextSpo2 = SPO2_OPTIONS[Math.floor(Math.random() * SPO2_OPTIONS.length)];
    setBpm(nextBpm);
    setBp(nextBp);
    setSpo2(nextSpo2);
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
          {/* signature: live vitals monitor */}
          <button
            type="button"
            aria-label="Jalankan pemeriksaan vital ulang"
            onClick={runVitalsCheck}
            className="relative mx-auto mb-2 flex w-full max-w-[280px] flex-col items-center rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C81E3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3]"
          >
            <span
              key={pulseKey}
              className="hse-pulse-ring pointer-events-none absolute top-4 h-24 w-40 rounded-full border border-[#C81E3A]/40"
            />
            <div className="relative w-full overflow-hidden rounded-xl border border-[#6B1414]/10 bg-[#2A2320] px-3 py-3">
              <svg viewBox="0 0 300 60" className="h-14 w-full" preserveAspectRatio="none">
                <polyline
                  className="hse-ecg-line"
                  style={{ animationDuration: `${beatDuration}s` }}
                  points="0,30 40,30 52,30 58,10 64,50 70,16 76,30 88,30 150,30 162,30 168,10 174,50 180,16 186,30 198,30 300,30"
                  fill="none"
                  stroke="#E0483C"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-1 flex items-center justify-between px-0.5">
                <span className="hse-mono flex items-center gap-1.5 text-[11px] text-[#E0483C]">
                  <HeartPulse className="h-3.5 w-3.5" strokeWidth={2} />
                  {displayBpm} bpm
                </span>
                <span className="hse-mono text-[11px] text-[#E0483C]/70">TD {bp}</span>
                <span className="hse-mono text-[11px] text-[#E0483C]/70">SpO2 {spo2}%</span>
              </div>
            </div>
            <span className="hse-mono mt-2 text-[10px] uppercase tracking-[0.2em] text-[#6B1414]/50">
              Cek Vital &middot; Klik untuk simulasi
            </span>
          </button>

          <p className="hse-mono mt-7 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-[#C81E3A]">
            PIM Health, Safety &amp; Environment
          </p>

          <h1 className="hse-display mt-3 text-center text-4xl sm:text-5xl font-bold tracking-tight text-[#6B1414]">
            Klinik Paramedis
          </h1>
          <p className="hse-display mt-1 text-center text-lg font-medium text-[#C81E3A]">
            Segera Hadir
          </p>

          <p className="mx-auto mt-5 max-w-sm text-center text-[15px] leading-relaxed text-[#2A2320]/70">
            Dashboard layanan klinik &amp; paramedis mal sedang dalam tahap pengembangan. Klik
            monitor di atas untuk menjalankan simulasi cek vital.
          </p>

          <div className="hse-mono mt-7 rounded-xl border border-[#6B1414]/10 bg-[#2A2320] px-4 py-3 text-left text-[12px] text-[#E0483C]">
            <span className="text-[#E0483C]/50">$ </span>
            {logText}
            <span className="hse-caret">▍</span>
          </div>

          <div className="mt-6 space-y-2">
            // eslint-disable-next-line no-unused-vars
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
              <span className="hse-mono text-[#6B1414]/50">Klinik &amp; Paramedis</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#6B1414]/10">
              <div className="h-full w-[35%] rounded-full bg-gradient-to-r from-[#6B1414] to-[#E0483C] transition-[width] duration-700 ease-out" />
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
        @keyframes hse-ecg-scroll { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }

        .hse-card { animation: hse-fade 0.6s ease-out both; }
        .hse-dot { animation: hse-pulse 1.8s ease-in-out infinite; }
        .hse-pulse-ring { animation: hse-ring 0.9s ease-out; }
        .hse-caret { animation: hse-blink 1s step-start infinite; }
        .hse-ecg-line {
          stroke-dasharray: 300;
          animation: hse-ecg-scroll linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hse-card, .hse-dot, .hse-pulse-ring, .hse-caret, .hse-ecg-line { animation: none; }
        }
      `}</style>
    </div>
  );
}
