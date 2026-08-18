import { createElement } from 'react';
import {
  Network,
  ShieldCheck,
  Flame,
  HeartPulse,
  Shield,
  PhoneCall,
  Camera,
  Stethoscope,
  Users2,
} from 'lucide-react';

const LINE = '#D9C4B0'; // connector line color, tuned for light bg

const TIER_2 = [
  {
    title: 'Supervisor Keselamatan Kerja',
    desc: 'Mengawasi implementasi K3, inspeksi rutin, dan kesiapan tanggap darurat.',
  },
  {
    title: 'Supervisor Kesehatan & Lingkungan',
    desc: 'Mengoordinasikan layanan kesehatan, sanitasi, dan pengelolaan lingkungan mall.',
  },
];

const TIER_3 = [
  {
    icon: Camera,
    title: 'Petugas CCTV & Monitoring',
    desc: 'Memantau seluruh area mall 24 jam dari ruang kontrol CCTV.',
  },
  {
    icon: Flame,
    title: 'Petugas Pemadam Kebakaran',
    desc: 'Siaga terhadap risiko kebakaran dan menjalankan prosedur evakuasi.',
  },
  {
    icon: Stethoscope,
    title: 'Petugas Paramedis',
    desc: 'Memberikan pertolongan pertama dan penanganan medis darurat.',
  },
  {
    icon: Shield,
    title: 'Petugas Keamanan Lapangan',
    desc: 'Menjaga ketertiban dan keamanan fisik di seluruh area mall.',
  },
];

const EXTERNAL_COORDINATION = [
  {
    icon: Flame,
    title: 'Pemadam Kebakaran',
    org: 'Damkar Sektor Setempat',
    note: 'Koordinasi rutin & simulasi tanggap darurat kebakaran.',
  },
  {
    icon: HeartPulse,
    title: 'Rumah Sakit Rujukan',
    org: 'RS Terdekat',
    note: 'Jalur evakuasi medis untuk kondisi darurat 24 jam.',
  },
  {
    icon: Shield,
    title: 'Kepolisian',
    org: 'Polsek Setempat',
    note: 'Pengamanan area dan penanganan insiden keamanan.',
  },
  {
    icon: PhoneCall,
    title: 'Ambulans',
    org: '118 / RS Rujukan',
    note: 'Respons cepat untuk kondisi darurat medis.',
  },
];

function NodeCard({ title, desc, highlight = false }) {
  return (
    <div
      className="w-full rounded-sm px-4 py-3 text-center shadow-sm"
      style={{
        backgroundColor: highlight ? '#6B1414' : '#FFFFFF',
        border: `1px solid ${highlight ? '#6B1414' : '#EAE0D5'}`,
      }}
    >
      <p className="text-sm font-semibold" style={{ color: highlight ? '#FAF8F3' : '#2B2320' }}>
        {title}
      </p>
      {desc && (
        <p
          className="mt-1 text-[12px] leading-relaxed"
          style={{ color: highlight ? '#D9B3AC' : '#7A6F63' }}
        >
          {desc}
        </p>
      )}
    </div>
  );
}

export default function OrgStructureSection() {
  return (
    <section id="struktur-organisasi" className="w-full bg-[#FAF8F3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{ backgroundColor: 'rgba(107,20,20,0.08)', color: '#6B1414' }}
          >
            {createElement(Network, { size: 13, strokeWidth: 2 })}
            Struktur Organisasi HSE
          </span>

          <h2
            className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
            style={{ color: '#2B2320' }}
          >
            Tim yang siap siaga, terkoordinasi dari pusat kontrol hingga lapangan
          </h2>
          <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#7A6F63' }}>
            Struktur organisasi HSE Pondok Indah Mall dirancang untuk memastikan pengawasan, respons
            cepat, dan koordinasi yang jelas di setiap lini — dari manajemen hingga petugas di
            lapangan.
          </p>
        </div>

        {/* Org chart */}
        <div className="mt-16 flex flex-col items-center">
          {/* Tier 1 */}
          <div className="w-full max-w-xs">
            <NodeCard
              title="HSE Manager"
              desc="Penanggung jawab keseluruhan program HSE mall"
              highlight
            />
          </div>

          <div className="h-8 w-px" style={{ backgroundColor: LINE }} />

          {/* Tier 2 */}
          <div className="relative w-full max-w-2xl">
            <div
              className="absolute top-0 left-[25%] right-[25%] h-px"
              style={{ backgroundColor: LINE }}
            />
            <div className="grid grid-cols-2 gap-6 pt-8">
              {TIER_2.map((item) => (
                <div key={item.title} className="relative flex flex-col items-center">
                  <div className="absolute -top-8 h-8 w-px" style={{ backgroundColor: LINE }} />
                  <NodeCard title={item.title} desc={item.desc} />
                </div>
              ))}
            </div>
          </div>

          <div className="h-8 w-px" style={{ backgroundColor: LINE }} />

          {/* Tier 3 */}
          <div className="relative w-full">
            <div
              className="absolute top-0 left-[12.5%] right-[12.5%] h-px"
              style={{ backgroundColor: LINE }}
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
              {TIER_3.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="relative flex flex-col items-center">
                  <div className="absolute -top-8 h-8 w-px" style={{ backgroundColor: LINE }} />
                  <div
                    className="w-full rounded-sm px-4 py-4 text-center shadow-sm bg-white"
                    style={{ border: '1px solid #EAE0D5' }}
                  >
                    <div className="flex justify-center">
                      {createElement(Icon, {
                        size: 18,
                        strokeWidth: 2,
                        style: { color: '#6B1414' },
                      })}
                    </div>
                    <p className="mt-2.5 text-[13px] font-semibold" style={{ color: '#2B2320' }}>
                      {title}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed" style={{ color: '#7A6F63' }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* External coordination */}
        <div className="mt-20 pt-10" style={{ borderTop: '1px solid #EAE0D5' }}>
          <div className="flex items-center gap-2">
            {createElement(Users2, { size: 16, strokeWidth: 2, style: { color: '#6B1414' } })}
            <p
              className="text-xs uppercase tracking-[0.12em] font-medium"
              style={{ color: '#6B1414' }}
            >
              Koordinasi dengan Pihak Eksternal
            </p>
          </div>
          <p className="mt-2 text-sm max-w-2xl" style={{ color: '#7A6F63' }}>
            Tim HSE menjalin kerja sama aktif dengan instansi terkait untuk memastikan respons
            darurat yang cepat dan terkoordinasi.
          </p>

          <div
            className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden"
            style={{ backgroundColor: '#EAE0D5' }}
          >
            {EXTERNAL_COORDINATION.map(({ icon: Icon, title, org, note }) => (
              <div key={title} className="p-6 bg-white">
                {createElement(Icon, { size: 20, strokeWidth: 2, style: { color: '#6B1414' } })}
                <p className="mt-4 text-sm font-semibold" style={{ color: '#2B2320' }}>
                  {title}
                </p>
                <p className="mt-1 text-[12px] font-medium" style={{ color: '#E8A33D' }}>
                  {org}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#7A6F63' }}>
                  {note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
