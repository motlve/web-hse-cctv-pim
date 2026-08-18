import { createElement } from 'react';
import {
  Camera,
  Radar,
  Clock,
  Database,
  MonitorPlay,
  ScanEye,
  FileClock,
  Radio,
} from 'lucide-react';

const STATS = [
  { value: '120+', label: 'Titik Kamera Terpasang' },
  { value: '24/7', label: 'Monitoring Non-Stop' },
  { value: '<3 mnt', label: 'Waktu Respons Insiden' },
  { value: '30 Hari', label: 'Retensi Rekaman' },
];

const FEATURES = [
  {
    icon: MonitorPlay,
    title: 'Live Monitoring Terpusat',
    desc: 'Seluruh titik kamera dipantau real-time dari ruang kontrol oleh petugas bersertifikasi.',
  },
  {
    icon: ScanEye,
    title: 'Deteksi & Analitik Otomatis',
    desc: 'Sistem membantu mendeteksi anomali dan pergerakan mencurigakan untuk respons lebih cepat.',
  },
  {
    icon: Radio,
    title: 'Integrasi dengan Command Center',
    desc: 'Terhubung langsung dengan tim keamanan, HSE, dan paramedis untuk koordinasi tanggap darurat.',
  },
  {
    icon: FileClock,
    title: 'Riwayat & Pelaporan Insiden',
    desc: 'Setiap kejadian tercatat dan dapat ditelusuri melalui sistem pelaporan digital.',
  },
];

export default function FacilityCCTVSection() {
  return (
    <section id="fasilitas-cctv" className="w-full" style={{ backgroundColor: '#6B1414' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D' }}
          >
            {createElement(Camera, { size: 13, strokeWidth: 2 })}
            Fasilitas — Sistem Monitoring
          </span>

          <h2
            className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
            style={{ color: '#FAF8F3' }}
          >
            Pengawasan CCTV menyeluruh, siaga di setiap sudut mall
          </h2>
          <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#D9B3AC' }}>
            Sistem monitoring CCTV Pondok Indah Mall mengawasi seluruh area publik secara real-time,
            terintegrasi dengan tim keamanan dan HSE untuk respons yang cepat dan terkoordinasi.
          </p>
        </div>

        {/* Stats */}
        <div
          className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden"
          style={{ backgroundColor: '#8C2A22' }}
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="p-6" style={{ backgroundColor: '#7A1B16' }}>
              <p className="text-2xl sm:text-3xl font-semibold" style={{ color: '#E8A33D' }}>
                {value}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#D9B3AC' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mt-14 grid sm:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-6 rounded-sm"
              style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22' }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
                style={{ backgroundColor: 'rgba(232,163,61,0.12)' }}
              >
                {createElement(Icon, { size: 18, strokeWidth: 2, style: { color: '#E8A33D' } })}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#FAF8F3' }}>
                  {title}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#D9B3AC' }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Coverage note */}
        <div
          className="mt-10 flex items-center gap-3 pt-8"
          style={{ borderTop: '1px solid #8C2A22' }}
        >
          {createElement(Radar, { size: 16, strokeWidth: 2, style: { color: '#C79289' } })}
          <p className="text-xs" style={{ color: '#C79289' }}>
            Cakupan mencakup area parkir, lobi, koridor, tangga darurat, dan titik kumpul evakuasi.
          </p>
        </div>
      </div>
    </section>
  );
}
