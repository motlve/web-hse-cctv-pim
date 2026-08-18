import { createElement } from 'react';
import { Flame, DoorOpen, Siren, Droplets, Wrench, ClipboardCheck } from 'lucide-react';

const STATS = [
  { value: '100%', label: 'Area Tercakup Sprinkler' },
  { value: 'Rutin', label: 'Uji Fungsi & Kalibrasi' },
  { value: '2x/thn', label: 'Simulasi Evakuasi' },
];

const SYSTEMS = [
  {
    icon: Siren,
    title: 'Fire Alarm & Deteksi Asap',
    desc: 'Sistem deteksi dini terpasang di seluruh area untuk memberi peringatan sedini mungkin.',
  },
  {
    icon: Droplets,
    title: 'Sprinkler & Hydrant',
    desc: 'Jaringan pemadam otomatis dan titik hydrant tersebar merata di setiap lantai.',
  },
  {
    icon: DoorOpen,
    title: 'Jalur & Tangga Evakuasi',
    desc: 'Rute evakuasi yang jelas, bebas hambatan, dan dilengkapi penanda arah yang memadai.',
  },
  {
    icon: Wrench,
    title: 'Perawatan Berkala',
    desc: 'Inspeksi dan pemeliharaan rutin terhadap seluruh perangkat proteksi kebakaran.',
  },
];

export default function FacilityFireSection() {
  return (
    <section id="fasilitas-kebakaran" className="w-full" style={{ backgroundColor: '#6B1414' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D' }}
          >
            {createElement(Flame, { size: 13, strokeWidth: 2 })}
            Fasilitas — Proteksi Kebakaran
          </span>

          <h2
            className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
            style={{ color: '#FAF8F3' }}
          >
            Sistem proteksi kebakaran yang teruji dan selalu siap
          </h2>
          <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#D9B3AC' }}>
            Pondok Indah Mall dilengkapi sistem proteksi kebakaran menyeluruh, dari deteksi dini
            hingga jalur evakuasi, dengan perawatan dan simulasi rutin untuk memastikan kesiapan
            setiap saat.
          </p>
        </div>

        {/* Stats */}
        <div
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px rounded-sm overflow-hidden"
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

        {/* Systems */}
        <div className="mt-14 grid sm:grid-cols-2 gap-6">
          {SYSTEMS.map(({ icon: Icon, title, desc }) => (
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

        {/* Compliance note */}
        <div
          className="mt-10 flex items-center gap-3 pt-8"
          style={{ borderTop: '1px solid #8C2A22' }}
        >
          {createElement(ClipboardCheck, { size: 16, strokeWidth: 2, style: { color: '#C79289' } })}
          <p className="text-xs" style={{ color: '#C79289' }}>
            Seluruh sistem proteksi kebakaran diperiksa sesuai standar Dinas Pemadam Kebakaran
            setempat.
          </p>
        </div>
      </div>
    </section>
  );
}
