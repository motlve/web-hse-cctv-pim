import { createElement } from 'react';
import { Users, Store, Building2, ShieldCheck, HardHat, UserCheck } from 'lucide-react';

const QUICK_STATS = [
  { icon: Building2, value: '5', label: 'Gedung terintegrasi' },
  { icon: Store, value: '400+', label: 'Tenant beroperasi' },
  { icon: Users, value: '20.000+', label: 'Pengunjung / hari' },
];

const PROPERTIES = [
  { name: 'PIM 1', year: '1991' },
  { name: 'PIM 2', year: '2005' },
  { name: 'Street Gallery', year: '2013' },
  { name: 'PIM 3', year: '2021' },
  { name: 'PIM 5', year: '2026' },
];

const SCOPE = [
  {
    icon: Users,
    title: 'Pengunjung',
    desc: 'Keselamatan dan kenyamanan setiap orang yang datang, dari area parkir hingga seluruh lantai mall.',
  },
  {
    icon: Store,
    title: 'Tenant',
    desc: 'Pengawasan kepatuhan standar keselamatan operasional toko dan restoran di dalam mall.',
  },
  {
    icon: HardHat,
    title: 'Kontraktor',
    desc: 'Pengawasan pekerjaan renovasi dan konstruksi tenant agar tidak membahayakan area sekitar.',
  },
  {
    icon: UserCheck,
    title: 'Karyawan',
    desc: 'Perlindungan bagi seluruh staf building management dalam menjalankan tugas sehari-hari.',
  },
];

export default function AboutSection() {
  return (
    <section id="tentang" className="w-full" style={{ backgroundColor: '#FAF8F3' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Text */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
              style={{ backgroundColor: 'rgba(107,20,20,0.08)', color: '#6B1414' }}
            >
              <ShieldCheck size={13} strokeWidth={2} />
              Tentang Kami
            </span>

            <h2
              className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight tracking-tight"
              style={{ color: '#2A2A26' }}
            >
              Satu pusat perbelanjaan, tanggung jawab keselamatan untuk semua
            </h2>

            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: '#6B6B62' }}>
              Pondok Indah Mall adalah kompleks pusat perbelanjaan terintegrasi di Jakarta Selatan,
              terdiri dari PIM 1, PIM 2, PIM 3, PIM 5, dan Street Gallery yang saling terhubung
              melalui skywalk. Divisi HSE (Health, Safety &amp; Environment) bertanggung jawab
              memastikan seluruh gedung dalam kompleks — dari kunjungan harian hingga renovasi
              tenant — berjalan sesuai standar keselamatan yang berlaku.
            </p>

            {/* Property list */}
            <div className="mt-6 flex flex-wrap gap-2">
              {PROPERTIES.map(({ name, year }) => (
                <span
                  key={name}
                  className="inline-flex items-baseline gap-1.5 text-xs px-3 py-1.5 rounded-sm"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E4DFD2',
                    color: '#2A2A26',
                  }}
                >
                  <span className="font-medium">{name}</span>
                  <span style={{ color: '#8A8A80' }}>· {year}</span>
                </span>
              ))}
            </div>

            {/* Quick stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
              {QUICK_STATS.map(({ icon: StatIcon, value, label }) => (
                <div key={label}>
                  {createElement(StatIcon, {
                    size: 18,
                    strokeWidth: 2,
                    style: { color: '#E8A33D' },
                  })}
                  <p
                    className="mt-2 text-xl sm:text-2xl font-semibold"
                    style={{ color: '#2A2A26' }}
                  >
                    {value}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: '#8A8A80' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Scope cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {SCOPE.map(({ icon: ScopeIcon, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-sm"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4DFD2' }}
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-sm"
                  style={{ backgroundColor: '#6B1414' }}
                >
                  {createElement(ScopeIcon, { size: 17, color: '#E8A33D', strokeWidth: 2 })}
                </div>
                <p className="mt-3 text-sm font-semibold" style={{ color: '#2A2A26' }}>
                  {title}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#8A8A80' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
