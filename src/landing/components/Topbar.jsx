import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Clock,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  LogIn,
  Video,
  HeartPulse,
} from 'lucide-react';
import { HoverDropdown } from './HoverDropdown';

const NAV_LINKS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Tentang Kami', href: '#tentang' },
  { label: 'Kebijakan HSE', href: '#kebijakan' },
  { label: 'Program', href: '#program-hse' },
  {
    label: 'Fasilitas',
    href: '#fasilitas-hse',
    children: [
      { label: 'Fasilitas HSE', href: '#fasilitas-hse' },
      { label: 'Sistem Monitoring CCTV', href: '#fasilitas-cctv' },
      { label: 'Proteksi Kebakaran', href: '#fasilitas-kebakaran' },
      { label: 'Fasilitas Kesehatan', href: '#fasilitas-kesehatan' },
    ],
  },
  { label: 'Statistik', href: '#statistik' },
  { label: 'Kontak', href: '#kontak' },
];

export default function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // NOTE: Topbar & Footer TIDAK ikut discroll — layout halaman
    // (lihat Layout.jsx) menaruh Topbar & Footer sebagai elemen tetap
    // di luar area scroll, dan hanya <main> yang overflow-y-auto.
    // Jadi header di sini cukup "relative z-50" (bukan sticky/fixed)
    // karena dia memang sudah selalu terlihat tanpa perlu sticky.
    //
    // Dropdown "Fasilitas" & "Login" di-render lewat Portal (lihat
    // HoverDropdown.jsx) supaya tidak kepotong oleh overflow-hidden
    // di Layout.jsx, jadi z-50 di sini tinggal formalitas urutan tumpuk
    // biasa (bukan lagi solusi utama untuk masalah clipping).
    <header
      className="w-full font-sans relative z-50 shrink-0"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Utility strip */}
      <div className="w-full text-[#EFEAE0]" style={{ backgroundColor: '#6B1414' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9 text-xs">
          <div className="flex items-center gap-5">
            <a
              href="tel:+622175811116"
              className="flex items-center gap-1.5 hover:text-[#E8A33D] transition-colors"
            >
              <Phone size={13} strokeWidth={2} />
              <span className="hidden sm:inline">Emergency Medical</span>
              <span className="font-medium">(021) 7581-1116</span>
            </a>
            <span className="hidden md:flex items-center gap-1.5 text-[#D9B3AC]">
              <Clock size={13} strokeWidth={2} />
              Mall: 10.00 - 22.00 WIB
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: '#8FCB9A' }}
              ></span>
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ backgroundColor: '#8FCB9A' }}
              ></span>
            </span>
            <span className="text-[#D9B3AC]">Sistem HSE Aktif</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div
        className="w-full border-b"
        style={{ backgroundColor: '#FAF8F3', borderColor: '#E4DFD2' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#beranda" className="flex items-center gap-2.5 shrink-0">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-sm"
                style={{ backgroundColor: '#6B1414' }}
              >
                <ShieldCheck size={18} color="#E8A33D" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <p
                  className="text-[15px] font-semibold tracking-tight"
                  style={{ color: '#6B1414' }}
                >
                  Pondok Indah Mall
                </p>
                <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: '#8A5A52' }}>
                  HSE &amp; Safety Center
                </p>
              </div>
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) =>
                link.children ? (
                  <HoverDropdown
                    key={link.label}
                    align="left"
                    trigger={
                      <button
                        className="flex items-center gap-1 px-3.5 py-2 text-sm rounded-sm transition-colors"
                        style={{ color: '#2A2A26' }}
                      >
                        {link.label}
                        <ChevronDown size={14} strokeWidth={2} />
                      </button>
                    }
                  >
                    <div
                      className="min-w-[220px] rounded-sm border shadow-sm py-1.5"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#E4DFD2' }}
                    >
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block px-4 py-2 text-sm hover:bg-[#F3EEE1] transition-colors"
                          style={{ color: '#3A3A34' }}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </HoverDropdown>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="px-3.5 py-2 text-sm rounded-sm hover:bg-[#F3EEE1] transition-colors"
                    style={{ color: '#2A2A26' }}
                  >
                    {link.label}
                  </a>
                )
              )}
            </nav>

            {/* CTA + Login */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href="#kontak"
                className="text-sm font-medium px-4 py-2 rounded-sm transition-colors"
                style={{ backgroundColor: '#E8A33D', color: '#6B1414' }}
              >
                Hubungi Tim HSE
              </a>

              <HoverDropdown
                align="right"
                trigger={
                  <button
                    className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-sm border transition-colors"
                    style={{ borderColor: '#6B1414', color: '#6B1414' }}
                  >
                    <LogIn size={15} strokeWidth={2} />
                    Login
                    <ChevronDown size={14} strokeWidth={2} />
                  </button>
                }
              >
                <div
                  className="min-w-[220px] rounded-sm border shadow-sm py-1.5"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E4DFD2' }}
                >
                  <Link
                    to="/login/hse"
                    className="flex items-start gap-3 px-4 py-2.5 hover:bg-[#F3EEE1] transition-colors"
                  >
                    <ShieldCheck
                      size={17}
                      strokeWidth={2}
                      style={{ color: '#6B1414', marginTop: 2 }}
                    />
                    <span>
                      <span className="block text-sm font-medium" style={{ color: '#2A2A26' }}>
                        Login HSE
                      </span>
                      <span className="block text-xs" style={{ color: '#8A5A52' }}>
                        Data insiden &amp; kebijakan
                      </span>
                    </span>
                  </Link>
                  <Link
                    to="/dashboard/login"
                    className="flex items-start gap-3 px-4 py-2.5 hover:bg-[#F3EEE1] transition-colors"
                  >
                    <Video size={17} strokeWidth={2} style={{ color: '#6B1414', marginTop: 2 }} />
                    <span>
                      <span className="block text-sm font-medium" style={{ color: '#2A2A26' }}>
                        Login CCTV
                      </span>
                      <span className="block text-xs" style={{ color: '#8A5A52' }}>
                        Monitoring &amp; rekaman kamera
                      </span>
                    </span>
                  </Link>
                  <Link
                    to="/login/paramedis"
                    className="flex items-start gap-3 px-4 py-2.5 hover:bg-[#F3EEE1] transition-colors"
                  >
                    <HeartPulse
                      size={17}
                      strokeWidth={2}
                      style={{ color: '#6B1414', marginTop: 2 }}
                    />
                    <span>
                      <span className="block text-sm font-medium" style={{ color: '#2A2A26' }}>
                        Login Paramedis
                      </span>
                      <span className="block text-xs" style={{ color: '#8A5A52' }}>
                        Layanan medis &amp; kesehatan
                      </span>
                    </span>
                  </Link>
                </div>
              </HoverDropdown>
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9"
              style={{ color: '#6B1414' }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu — tetap inline (bukan portal), karena mobile menu
            memang didesain untuk mendorong/berada dalam flow header,
            bukan floating di atas konten seperti dropdown desktop */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t max-h-[calc(100vh-6rem)] overflow-y-auto"
            style={{ borderColor: '#E4DFD2', backgroundColor: '#FAF8F3' }}
          >
            <nav className="px-4 py-3 flex flex-col">
              {NAV_LINKS.map((link) => (
                <div key={link.label}>
                  <a
                    href={link.href}
                    className="block py-2.5 text-sm"
                    style={{ color: '#2A2A26' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                  {link.children && (
                    <div className="pl-4 flex flex-col">
                      {link.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block py-2 text-[13px]"
                          style={{ color: '#6B6B62' }}
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <a
                href="#kontak"
                className="mt-2 text-sm font-medium text-center px-4 py-2.5 rounded-sm"
                style={{ backgroundColor: '#E8A33D', color: '#6B1414' }}
                onClick={() => setMobileOpen(false)}
              >
                Hubungi Tim HSE
              </a>

              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E4DFD2' }}>
                <p
                  className="text-[11px] uppercase tracking-[0.12em] mb-2"
                  style={{ color: '#8A5A52' }}
                >
                  Login
                </p>
                <Link
                  to="/login/hse"
                  className="flex items-center gap-2.5 py-2.5 text-sm font-medium"
                  style={{ color: '#2A2A26' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <ShieldCheck size={17} strokeWidth={2} style={{ color: '#6B1414' }} />
                  Login HSE
                </Link>
                <Link
                  to="/dashboard/login"
                  className="flex items-center gap-2.5 py-2.5 text-sm font-medium"
                  style={{ color: '#2A2A26' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Video size={17} strokeWidth={2} style={{ color: '#6B1414' }} />
                  Login CCTV
                </Link>
                <Link
                  to="/login/paramedis"
                  className="flex items-center gap-2.5 py-2.5 text-sm font-medium"
                  style={{ color: '#2A2A26' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <HeartPulse size={17} strokeWidth={2} style={{ color: '#6B1414' }} />
                  Login Paramedis
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Signature accent stripe — safety signage motif */}
      <div
        className="h-[3px] w-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, #E8A33D 0px, #E8A33D 14px, #6B1414 14px, #6B1414 28px)',
        }}
      />
    </header>
  );
}
