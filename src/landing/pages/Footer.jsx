import { createElement, useState, useEffect } from 'react';
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
  { icon: Award, label: 'ISO 45001' },
  { icon: BadgeCheck, label: 'SMK3 Emas' },
];

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

function BackToTop() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

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
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Kembali ke atas"
      className="fixed bottom-6 right-6 z-40 rounded-full p-[3px] shadow-lg transition-all duration-300"
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
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

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
          <a
            href="tel:+62210000000"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full whitespace-nowrap transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#E8A33D', color: '#4A2E0A' }}
          >
            {createElement(PhoneCall, { size: 15, strokeWidth: 2.5 })}
            (021) 000-0000
          </a>
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

            {/* Certification badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              {CERTIFICATIONS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'rgba(250,248,243,0.06)', color: '#E8DCCF' }}
                >
                  {createElement(Icon, { size: 12, strokeWidth: 2, style: { color: '#E8A33D' } })}
                  {label}
                </span>
              ))}
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
              <li className="flex items-start gap-2.5">
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
              </li>
              <li className="flex items-start gap-2.5">
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
