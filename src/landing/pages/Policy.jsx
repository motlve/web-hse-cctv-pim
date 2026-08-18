import { createElement } from 'react';
import { ShieldCheck, Target, Users2, RefreshCw, ScrollText } from 'lucide-react';

const COMMITMENTS = [
  {
    icon: Target,
    title: 'Zero Harm',
    desc: 'Berupaya mencegah kecelakaan dan cedera bagi pengunjung, tenant, karyawan, dan kontraktor di seluruh area mall.',
  },
  {
    icon: ScrollText,
    title: 'Kepatuhan Regulasi',
    desc: 'Mematuhi seluruh ketentuan Kemnaker, Dinas Pemadam Kebakaran, dan Dinas Kesehatan yang berlaku.',
  },
  {
    icon: Users2,
    title: 'Keterlibatan Semua Pihak',
    desc: 'Melibatkan tenant, kontraktor, dan karyawan dalam menjaga standar keselamatan bersama.',
  },
  {
    icon: RefreshCw,
    title: 'Perbaikan Berkelanjutan',
    desc: 'Meninjau dan meningkatkan sistem HSE secara berkala mengikuti perkembangan risiko dan teknologi.',
  },
];

const REGULATIONS = [
  'Kementerian Ketenagakerjaan RI',
  'Dinas Pemadam Kebakaran DKI Jakarta',
  'Dinas Kesehatan DKI Jakarta',
  'SMK3 — PP No. 50 Tahun 2012',
];

export default function PolicySection() {
  return (
    <section id="kebijakan" className="w-full" style={{ backgroundColor: '#6B1414' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D' }}
          >
            {createElement(ShieldCheck, { size: 13, strokeWidth: 2 })}
            Kebijakan HSE
          </span>

          <p
            className="mt-5 text-xl sm:text-2xl leading-snug font-medium"
            style={{ color: '#FAF8F3' }}
          >
            "Kami berkomitmen menjadikan Pondok Indah Mall sebagai kompleks perbelanjaan yang aman,
            sehat, dan ramah lingkungan — bagi setiap orang yang berada di dalamnya, tanpa
            terkecuali."
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px w-10" style={{ backgroundColor: '#8C2A22' }} />
            <p className="text-sm" style={{ color: '#D9B3AC' }}>
              Manajemen Building &amp; HSE, Pondok Indah Mall
            </p>
          </div>
        </div>

        {/* Commitment pillars */}
        <div
          className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden"
          style={{ backgroundColor: '#8C2A22' }}
        >
          {COMMITMENTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6" style={{ backgroundColor: '#7A1B16' }}>
              {createElement(Icon, { size: 20, strokeWidth: 2, style: { color: '#E8A33D' } })}
              <p className="mt-4 text-sm font-semibold" style={{ color: '#FAF8F3' }}>
                {title}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#D9B3AC' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Regulatory compliance */}
        <div className="mt-10 pt-8" style={{ borderTop: '1px solid #8C2A22' }}>
          <p className="text-xs uppercase tracking-[0.12em] mb-3" style={{ color: '#C79289' }}>
            Sesuai dengan ketentuan
          </p>
          <div className="flex flex-wrap gap-2">
            {REGULATIONS.map((item) => (
              <span
                key={item}
                className="text-xs px-3 py-1.5 rounded-sm"
                style={{ backgroundColor: 'rgba(250,248,243,0.06)', color: '#FAF8F3' }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
