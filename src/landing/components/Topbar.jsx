import { useState } from 'react';
import { Phone, Clock, Menu, X, ShieldCheck, ChevronDown, LogIn, Video } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Tentang Kami', href: '#tentang' },
  { label: 'Kebijakan HSE', href: '#kebijakan' },
  {
    label: 'Fasilitas',
    href: '#fasilitas',
    children: [
      { label: 'Sistem Monitoring', href: '#monitoring' },
      { label: 'Fasilitas Kesehatan', href: '#kesehatan' },
      { label: 'Proteksi Kebakaran', href: '#kebakaran' },
    ],
  },
  { label: 'Statistik', href: '#statistik' },
  { label: 'Kontak', href: '#kontak' },
];

export default function HseTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [facilityOpen, setFacilityOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <header
      className="w-full font-sans"
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
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setFacilityOpen(true)}
                    onMouseLeave={() => setFacilityOpen(false)}
                  >
                    <button
                      className="flex items-center gap-1 px-3.5 py-2 text-sm rounded-sm transition-colors"
                      style={{ color: '#2A2A26' }}
                    >
                      {link.label}
                      <ChevronDown size={14} strokeWidth={2} />
                    </button>
                    {facilityOpen && (
                      <div
                        className="absolute top-full left-0 mt-0 min-w-[200px] rounded-sm border shadow-sm py-1.5"
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
                    )}
                  </div>
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

              <div
                className="relative"
                onMouseEnter={() => setLoginOpen(true)}
                onMouseLeave={() => setLoginOpen(false)}
              >
                <button
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-sm border transition-colors"
                  style={{ borderColor: '#6B1414', color: '#6B1414' }}
                >
                  <LogIn size={15} strokeWidth={2} />
                  Login
                  <ChevronDown size={14} strokeWidth={2} />
                </button>

                {loginOpen && (
                  <div
                    className="absolute top-full right-0 mt-0 min-w-[220px] rounded-sm border shadow-sm py-1.5"
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E4DFD2' }}
                  >
                    <a
                      href="/login/hse"
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
                    </a>
                    <a
                      href="/login/cctv"
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
                    </a>
                  </div>
                )}
              </div>
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

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t"
            style={{ borderColor: '#E4DFD2', backgroundColor: '#FAF8F3' }}
          >
            <nav className="px-4 py-3 flex flex-col">
              {NAV_LINKS.map((link) => (
                <div key={link.label}>
                  <a href={link.href} className="block py-2.5 text-sm" style={{ color: '#2A2A26' }}>
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
                <a
                  href="/login/hse"
                  className="flex items-center gap-2.5 py-2.5 text-sm font-medium"
                  style={{ color: '#2A2A26' }}
                >
                  <ShieldCheck size={17} strokeWidth={2} style={{ color: '#6B1414' }} />
                  Login HSE
                </a>
                <a
                  href="/login/cctv"
                  className="flex items-center gap-2.5 py-2.5 text-sm font-medium"
                  style={{ color: '#2A2A26' }}
                >
                  <Video size={17} strokeWidth={2} style={{ color: '#6B1414' }} />
                  Login CCTV
                </a>
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
