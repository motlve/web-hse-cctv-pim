import { createElement } from 'react';
import {
  BarChart3,
  ShieldCheck,
  HeartPulse,
  Camera,
  Flame,
  Clock3,
  Award,
  Users,
} from 'lucide-react';

const HIGHLIGHT_STATS = [
  {
    icon: ShieldCheck,
    value: '0',
    label: 'Insiden Fatal',
    sub: 'Sepanjang tahun berjalan',
  },
  {
    icon: Clock3,
    value: '<5 mnt',
    label: 'Rata-rata Respons Darurat',
    sub: 'Medis & keamanan',
  },
  {
    icon: Camera,
    value: '120+',
    label: 'Titik Kamera Aktif',
    sub: 'Termonitor 24/7',
  },
  {
    icon: HeartPulse,
    value: '15+',
    label: 'Petugas HSE Bersertifikasi',
    sub: 'Siaga setiap hari',
  },
];

const SECONDARY_STATS = [
  {
    icon: Flame,
    value: '100%',
    label: 'Area Tercakup Sistem Proteksi Kebakaran',
  },
  {
    icon: Award,
    value: '2x/thn',
    label: 'Simulasi Evakuasi Menyeluruh',
  },
  {
    icon: Users,
    value: '20.000+',
    label: 'Pengunjung Terlindungi / Hari',
  },
  {
    icon: BarChart3,
    value: '30 Hari',
    label: 'Retensi Rekaman CCTV',
  },
];

export default function StatsSection() {
  return (
    <section id="statistik" className="w-full" style={{ backgroundColor: '#6B1414' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D' }}
          >
            {createElement(BarChart3, { size: 13, strokeWidth: 2 })}
            Statistik Kinerja HSE
          </span>

          <h2
            className="mt-4 sm:mt-6 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-snug"
            style={{ color: '#FAF8F3' }}
          >
            Angka yang mencerminkan komitmen keselamatan kami
          </h2>
          <p
            className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed"
            style={{ color: '#D9B3AC' }}
          >
            Ringkasan capaian sistem HSE, keamanan, dan kesehatan Pondok Indah Mall — dipantau dan
            diperbarui secara berkelanjutan sebagai bagian dari tanggung jawab kami kepada seluruh
            pengunjung, tenant, dan karyawan.
          </p>
        </div>

        {/* Highlight stats */}
        <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {HIGHLIGHT_STATS.map(({ icon: Icon, value, label, sub }) => (
            <div
              key={label}
              className="p-5 sm:p-6 rounded-sm"
              style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22' }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-sm"
                style={{ backgroundColor: 'rgba(232,163,61,0.12)' }}
              >
                {createElement(Icon, { size: 18, strokeWidth: 2, style: { color: '#E8A33D' } })}
              </div>
              <p className="mt-4 text-2xl sm:text-3xl font-semibold" style={{ color: '#E8A33D' }}>
                {value}
              </p>
              <p
                className="mt-1.5 text-[13px] font-medium leading-relaxed"
                style={{ color: '#FAF8F3' }}
              >
                {label}
              </p>
              <p className="mt-0.5 text-[12px]" style={{ color: '#C79289' }}>
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* Secondary stats strip */}
        <div
          className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden"
          style={{ backgroundColor: '#8C2A22' }}
        >
          {SECONDARY_STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-5 sm:p-6"
              style={{ backgroundColor: '#7A1B16' }}
            >
              {createElement(Icon, { size: 16, strokeWidth: 2, style: { color: '#C79289' } })}
              <div>
                <p className="text-base sm:text-lg font-semibold" style={{ color: '#FAF8F3' }}>
                  {value}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: '#D9B3AC' }}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
