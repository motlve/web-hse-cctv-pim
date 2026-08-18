import { ShieldCheck, ChevronRight, Camera } from 'lucide-react';

export default function HeroSectionV2() {
  return (
    <section id="beranda" className="relative w-full" style={{ backgroundColor: '#6B1414' }}>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-24 sm:pt-20 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div className="max-w-xl">
            <h1
              className="text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold leading-tight tracking-tight"
              style={{ color: '#FAF8F3' }}
            >
              Kenyamanan dan Keselamatan Anda, Kami Jaga Sepenuh Hati di Pondok Indah Mall
            </h1>

            <p className="mt-4 text-base leading-relaxed" style={{ color: '#D9B3AC' }}>
              Standar Health, Safety &amp; Environment yang menyeluruh — pengawasan area 24 jam, tim
              medis siaga, dan sistem proteksi kebakaran aktif di setiap sudut mall.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#kontak"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 rounded-sm transition-colors"
                style={{ backgroundColor: '#E8A33D', color: '#6B1414' }}
              >
                Hubungi Tim HSE
                <ChevronRight size={16} strokeWidth={2} />
              </a>
              <a
                href="#kebijakan"
                className="text-sm font-medium px-5 py-2.5 rounded-sm border transition-colors"
                style={{ borderColor: '#8C2A22', color: '#FAF8F3' }}
              >
                Lihat Kebijakan HSE
              </a>
            </div>
          </div>

          {/* Image placeholder — ganti src dengan foto asli mall/pengunjung */}
          <div className="relative">
            <div
              className="relative w-full aspect-[4/3] rounded-sm overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22' }}
            >
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <Camera size={28} strokeWidth={1.5} style={{ color: '#A8635B' }} />
                <p className="text-xs" style={{ color: '#A8635B' }}>
                  Ganti dengan foto pengunjung / area mall
                </p>
              </div>
            </div>

            {/* Floating badge card */}
            <div
              className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 rounded-sm px-4 py-3 shadow-sm"
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
          </div>
        </div>
      </div>

      {/* Curved bottom transition */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{ height: 60, display: 'block' }}
      >
        <path d="M0,32 C480,80 960,0 1440,32 L1440,80 L0,80 Z" fill="#FAF8F3" />
      </svg>
    </section>
  );
}
