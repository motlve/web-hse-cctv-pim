import { createElement, useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  ArrowUp,
  ArrowRight,
  PhoneCall,
  Award,
  BadgeCheck,
  Camera,
  Stethoscope,
  Copy,
  Check,
  ChevronDown,
} from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';

const QUICK_LINKS = [
  { label: 'Tentang Kami', href: '#tentang' },
  { label: 'Kebijakan HSE', href: '#kebijakan' },
  { label: 'Struktur Organisasi', href: '#struktur-organisasi' },
  { label: 'Tim HSE', href: '#tim-hse' },
  { label: 'Program & Kegiatan', href: '#program-hse' },
  { label: 'Statistik & Pencapaian', href: '#statistik' },
];

const FACILITY_LINKS = [
  { label: 'Fasilitas HSE', href: '#fasilitas-hse' },
  { label: 'Sistem Monitoring CCTV', href: '#fasilitas-cctv' },
  { label: 'Kesehatan & Paramedis', href: '#fasilitas-kesehatan' },
  { label: 'Proteksi Kebakaran', href: '#fasilitas-kebakaran' },
];

const SOCIALS = [
  { icon: FaInstagram, href: '#', label: 'Instagram' },
  { icon: FaFacebook, href: '#', label: 'Facebook' },
  { icon: FaTwitter, href: '#', label: 'Twitter / X' },
];

const LEGAL_LINKS = [
  { label: 'Kebijakan Privasi', href: '#' },
  { label: 'Syarat & Ketentuan', href: '#' },
];

const CERTIFICATIONS = [
  {
    icon: Award,
    label: 'ISO 45001',
    detail: 'Standar internasional sistem manajemen keselamatan & kesehatan kerja.',
  },
  {
    icon: BadgeCheck,
    label: 'SMK3 Emas',
    detail: 'Penghargaan tertinggi penerapan Sistem Manajemen K3 dari Kemnaker RI.',
  },
];

// Sistem yang statusnya ditampilkan di strip operasional — merangkum
// section CCTV, Tim HSE, dan Paramedis yang ada di halaman ini.
const SYSTEMS = [
  { icon: Camera, label: 'Monitoring CCTV', status: 'Online', href: '#fasilitas-cctv' },
  { icon: ShieldCheck, label: 'Tim HSE', status: 'Siaga', href: '#tim-hse' },
  { icon: Stethoscope, label: 'Paramedis', status: 'Siaga', href: '#fasilitas-kesehatan' },
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

function FooterLink({ label, href }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-1.5 text-[13px] transition-colors"
      style={{ color: '#C79289' }}
    >
      <span className="transition-colors group-hover:text-[#FAF8F3]">{label}</span>
      <span
        className="opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
        style={{ color: '#E8A33D' }}
      >
        {createElement(ArrowRight, { size: 11, strokeWidth: 2.5 })}
      </span>
    </a>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Salin"
      className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ backgroundColor: 'rgba(232,163,61,0.15)' }}
    >
      {createElement(copied ? Check : Copy, {
        size: 10,
        strokeWidth: 2,
        style: { color: '#E8A33D' },
      })}
      {copied && (
        <span
          className="absolute -top-6 right-0 whitespace-nowrap text-[10px] px-2 py-1 rounded-full"
          style={{ backgroundColor: '#E8A33D', color: '#4A2E0A' }}
        >
          Disalin!
        </span>
      )}
    </button>
  );
}

// ── OPERATIONS STATUS STRIP ────────────────────────────────────
// Elemen signature footer ini: strip status operasional bergaya
// status page — merangkum tiga sistem yang sudah dibangun di
// halaman (CCTV, HSE, Paramedis) masing-masing dengan titik hijau
// yang berkedip, plus jam WIB yang benar-benar berjalan real-time,
// menutup "bahasa visual" jam & indikator siaga yang dipakai di
// section-section sebelumnya.
function OperationsStatusStrip() {
  const [now, setNow] = useState(new Date());
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-2xl px-5 py-4 mb-6"
      style={{
        backgroundColor: 'rgba(250,248,243,0.04)',
        border: '1px solid rgba(250,248,243,0.08)',
      }}
    >
      <style>{`
        @keyframes hse-status-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: '#6FCF97',
            animation: reduced ? 'none' : 'hse-status-blink 1.8s ease-in-out infinite',
          }}
        />
        <span
          className="text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: '#E8DCCF' }}
        >
          Semua sistem normal
        </span>
      </div>

      <div
        className="hidden sm:block h-4 w-px"
        style={{ backgroundColor: 'rgba(250,248,243,0.12)' }}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 flex-1">
        {SYSTEMS.map(({ icon: Icon, label, status, href }) => (
          <a
            key={label}
            href={href}
            className="group inline-flex items-center gap-1.5 text-[12px] transition-colors"
            style={{ color: '#C79289' }}
          >
            {createElement(Icon, {
              size: 12,
              strokeWidth: 2,
              style: { color: '#C79289' },
              className: 'transition-colors group-hover:text-[#E8A33D]',
            })}
            <span className="transition-colors group-hover:text-[#FAF8F3]">{label}</span>
            <span
              className="h-1 w-1 rounded-full"
              style={{
                backgroundColor: '#6FCF97',
                animation: reduced ? 'none' : 'hse-status-blink 1.8s ease-in-out infinite',
              }}
            />
            <span style={{ color: '#E8DCCF' }}>{status}</span>
          </a>
        ))}
      </div>

      <span className="text-[11px] font-mono tabular-nums shrink-0" style={{ color: '#E8A33D' }}>
        {timeStr} WIB
      </span>
    </div>
  );
}

// Tombol hotline dengan efek "sonar" — cincin sinyal yang melebar
// keluar seperti gelombang radio, dipicu ulang tiap kali diketuk.
function EmergencyHotlineButton() {
  const [pulses, setPulses] = useState([]);
  const reduced = usePrefersReducedMotion();
  const idRef = useRef(1);

  function triggerPulse() {
    if (reduced) return;
    const id = idRef.current++;
    setPulses((p) => [...p, id]);
    setTimeout(() => setPulses((p) => p.filter((x) => x !== id)), 900);
  }

  return (
    <a
      href="tel:+62210000000"
      onClick={triggerPulse}
      className="relative inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full whitespace-nowrap transition-transform hover:-translate-y-0.5 overflow-visible"
      style={{ backgroundColor: '#E8A33D', color: '#4A2E0A' }}
    >
      <style>{`
        @keyframes hse-footer-sonar {
          0% { transform: scale(0.7); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      {pulses.map((id) => (
        <span
          key={id}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: '1.5px solid #E8A33D',
            animation: 'hse-footer-sonar 0.9s ease-out forwards',
          }}
        />
      ))}
      {createElement(PhoneCall, { size: 15, strokeWidth: 2.5 })}
      (021) 000-0000
    </a>
  );
}

function BackToTop() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
      setVisible(scrollTop > 400);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <span
        className="text-[11px] font-mono tabular-nums px-2 py-1 rounded-full transition-all duration-200"
        style={{
          backgroundColor: '#4A0E0E',
          color: '#E8A33D',
          opacity: visible && hovering ? 1 : 0,
          transform: visible && hovering ? 'translateX(0)' : 'translateX(4px)',
        }}
      >
        {Math.round(progress)}% dibaca
      </span>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Kembali ke atas"
        className="rounded-full p-[3px] shadow-lg transition-all duration-300"
        style={{
          background: `conic-gradient(#E8A33D ${progress}%, rgba(255,255,255,0.18) ${progress}%)`,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105"
          style={{ backgroundColor: '#4A0E0E', color: '#E8A33D' }}
        >
          {createElement(ArrowUp, { size: 18, strokeWidth: 2.5 })}
        </span>
      </button>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [openCert, setOpenCert] = useState(null);

  return (
    <footer className="relative w-full overflow-hidden" style={{ backgroundColor: '#4A0E0E' }}>
      {/* Top accent line */}
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, #E8A33D, transparent)' }}
      />

      {/* Texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(rgba(250,248,243,0.035) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full"
        style={{ backgroundColor: 'rgba(232,163,61,0.05)', filter: 'blur(90px)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* Status operasional */}
        <OperationsStatusStrip />

        {/* CTA hotline bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl p-6 sm:p-7 mb-16"
          style={{
            background: 'linear-gradient(135deg, rgba(232,163,61,0.14), rgba(232,163,61,0.05))',
            border: '1px solid rgba(232,163,61,0.25)',
          }}
        >
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full animate-pulse"
              style={{ backgroundColor: 'rgba(232,163,61,0.18)' }}
            >
              {createElement(PhoneCall, { size: 20, strokeWidth: 2, style: { color: '#E8A33D' } })}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#FAF8F3' }}>
                Butuh bantuan darurat?
              </p>
              <p className="text-[13px]" style={{ color: '#D9B3AC' }}>
                Tim HSE kami siaga 24 jam untuk kondisi darurat di area mall.
              </p>
            </div>
          </div>
          <EmergencyHotlineButton />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg, #E8A33D, #C97F1F)' }}
              >
                {createElement(ShieldCheck, {
                  size: 19,
                  strokeWidth: 2,
                  style: { color: '#4A2E0A' },
                })}
              </div>
              <p className="text-base font-semibold" style={{ color: '#FAF8F3' }}>
                HSE Pondok Indah Mall
              </p>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed max-w-xs" style={{ color: '#C79289' }}>
              Berkomitmen menjadikan Pondok Indah Mall sebagai kompleks perbelanjaan yang aman,
              sehat, dan ramah lingkungan bagi setiap orang di dalamnya.
            </p>

            {/* Certification badges — bisa diketuk untuk detail singkat */}
            <div className="mt-5 flex flex-col gap-1.5">
              {CERTIFICATIONS.map(({ icon: Icon, label, detail }) => {
                const open = openCert === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setOpenCert((c) => (c === label ? null : label))}
                    aria-expanded={open}
                    className="text-left rounded-xl transition-colors"
                    style={{ backgroundColor: open ? 'rgba(250,248,243,0.08)' : 'transparent' }}
                  >
                    <span
                      className="inline-flex w-full items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: open ? 'transparent' : 'rgba(250,248,243,0.06)',
                        color: '#E8DCCF',
                      }}
                    >
                      {createElement(Icon, {
                        size: 12,
                        strokeWidth: 2,
                        style: { color: '#E8A33D' },
                      })}
                      {label}
                      {createElement(ChevronDown, {
                        size: 10,
                        strokeWidth: 2.5,
                        style: {
                          color: '#A8776E',
                          marginLeft: 'auto',
                          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.25s ease',
                        },
                      })}
                    </span>
                    <DetailPanel open={open}>
                      <p
                        className="px-3 pb-2 pt-1 text-[11px] leading-relaxed"
                        style={{ color: '#A8776E' }}
                      >
                        {detail}
                      </p>
                    </DetailPanel>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: 'rgba(250,248,243,0.06)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(232,163,61,0.18)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(250,248,243,0.06)')
                  }
                >
                  {createElement(Icon, { size: 15, strokeWidth: 2, style: { color: '#E8DCCF' } })}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p
              className="text-xs uppercase tracking-[0.12em] font-medium"
              style={{ color: '#E8A33D' }}
            >
              Navigasi
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          {/* Facilities */}
          <div>
            <p
              className="text-xs uppercase tracking-[0.12em] font-medium"
              style={{ color: '#E8A33D' }}
            >
              Fasilitas
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {FACILITY_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p
              className="text-xs uppercase tracking-[0.12em] font-medium"
              style={{ color: '#E8A33D' }}
            >
              Kontak
            </p>
            <ul className="mt-4 flex flex-col gap-3.5">
              <li className="group flex items-start gap-2.5">
                {createElement(Phone, {
                  size: 14,
                  strokeWidth: 2,
                  style: { color: '#E8A33D', marginTop: 2 },
                })}
                <a
                  href="tel:+62210000000"
                  className="text-[13px] transition-colors hover:text-[#FAF8F3]"
                  style={{ color: '#C79289' }}
                >
                  (021) 000-0000
                </a>
                <CopyButton value="(021) 000-0000" />
              </li>
              <li className="group flex items-start gap-2.5">
                {createElement(Mail, {
                  size: 14,
                  strokeWidth: 2,
                  style: { color: '#E8A33D', marginTop: 2 },
                })}
                <a
                  href="mailto:hse@pondokindahmall.co.id"
                  className="text-[13px] transition-colors hover:text-[#FAF8F3]"
                  style={{ color: '#C79289' }}
                >
                  hse@pondokindahmall.co.id
                </a>
                <CopyButton value="hse@pondokindahmall.co.id" />
              </li>
              <li className="flex items-start gap-2.5">
                {createElement(MapPin, {
                  size: 14,
                  strokeWidth: 2,
                  style: { color: '#E8A33D', marginTop: 2 },
                })}
                <span className="text-[13px]" style={{ color: '#C79289' }}>
                  Jl. Metro Pondok Indah, Jakarta Selatan
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(250,248,243,0.08)' }}
        >
          <p className="text-[12px]" style={{ color: '#A8776E' }}>
            &copy; {year} HSE Pondok Indah Mall. Seluruh hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-5">
            {LEGAL_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[12px] transition-colors hover:text-[#FAF8F3]"
                style={{ color: '#A8776E' }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <BackToTop />
    </footer>
  );
}
