import { createElement, useState, useRef, useEffect } from 'react';
import {
  Network,
  Flame,
  HeartPulse,
  Shield,
  PhoneCall,
  Camera,
  Stethoscope,
  Users2,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';

const LINE = '#D9C4B0'; // connector line color, tuned for light bg
const LINE_ACTIVE = '#E8A33D';

const HSE_MANAGER = {
  title: 'HSE Manager',
  desc: 'Penanggung jawab keseluruhan program HSE mall',
  team: '1 Manajer',
  responsibilities: [
    'Menyusun kebijakan & standar HSE mall',
    'Melapor langsung ke manajemen mall',
    'Mengawasi seluruh lini supervisor',
  ],
};

const TIER_2 = [
  {
    title: 'Supervisor Keselamatan Kerja',
    desc: 'Mengawasi implementasi K3, inspeksi rutin, dan kesiapan tanggap darurat.',
    team: '6 Personel Lapangan',
    responsibilities: [
      'Inspeksi rutin fasilitas & prosedur K3',
      'Koordinasi simulasi tanggap darurat',
      'Menindaklanjuti temuan audit HSE',
    ],
  },
  {
    title: 'Supervisor Kesehatan & Lingkungan',
    desc: 'Mengoordinasikan layanan kesehatan, sanitasi, dan pengelolaan lingkungan mall.',
    team: '5 Personel',
    responsibilities: [
      'Mengelola layanan klinik & kesehatan karyawan',
      'Memantau sanitasi & kebersihan lingkungan',
      'Koordinasi program kesejahteraan',
    ],
  },
];

const TIER_3 = [
  {
    icon: Camera,
    title: 'Petugas CCTV & Monitoring',
    desc: 'Memantau seluruh area mall 24 jam dari ruang kontrol CCTV.',
    team: '8 Personel / Shift',
    responsibilities: ['Memantau 120+ titik kamera 24 jam', 'Melaporkan anomali ke command center'],
  },
  {
    icon: Flame,
    title: 'Petugas Pemadam Kebakaran',
    desc: 'Siaga terhadap risiko kebakaran dan menjalankan prosedur evakuasi.',
    team: '6 Personel / Shift',
    responsibilities: ['Siaga proteksi kebakaran', 'Memimpin prosedur evakuasi'],
  },
  {
    icon: Stethoscope,
    title: 'Petugas Paramedis',
    desc: 'Memberikan pertolongan pertama dan penanganan medis darurat.',
    team: '4 Personel / Shift',
    responsibilities: ['Pertolongan pertama on-site', 'Rujukan medis darurat'],
  },
  {
    icon: Shield,
    title: 'Petugas Keamanan Lapangan',
    desc: 'Menjaga ketertiban dan keamanan fisik di seluruh area mall.',
    team: '12 Personel / Shift',
    responsibilities: ['Patroli & pengawasan area', 'Penanganan insiden keamanan'],
  },
];

const EXTERNAL_COORDINATION = [
  {
    icon: Flame,
    title: 'Pemadam Kebakaran',
    org: 'Damkar Sektor Setempat',
    note: 'Koordinasi rutin & simulasi tanggap darurat kebakaran.',
    phone: '113',
  },
  {
    icon: HeartPulse,
    title: 'Rumah Sakit Rujukan',
    org: 'RS Terdekat',
    note: 'Jalur evakuasi medis untuk kondisi darurat 24 jam.',
    phone: 'Ext. 100 (Klinik Mall)',
  },
  {
    icon: Shield,
    title: 'Kepolisian',
    org: 'Polsek Setempat',
    note: 'Pengamanan area dan penanganan insiden keamanan.',
    phone: '110',
  },
  {
    icon: PhoneCall,
    title: 'Ambulans',
    org: '118 / RS Rujukan',
    note: 'Respons cepat untuk kondisi darurat medis.',
    phone: '118',
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}

// Garis konektor — bisa "menyala" (state highlight) untuk memperlihatkan
// jalur pelaporan dari sebuah node hingga ke HSE Manager.
function Connector({ vertical = true, active, delay = 0, className = '' }) {
  return (
    <div
      className={`${vertical ? 'w-px' : 'h-px'} transition-all duration-300 ${className}`}
      style={{
        backgroundColor: active ? LINE_ACTIVE : LINE,
        transitionDelay: `${delay}ms`,
        boxShadow: active ? '0 0 6px rgba(232,163,61,0.6)' : 'none',
      }}
    />
  );
}

function DetailPanel({ open, team, responsibilities, dark = false }) {
  return (
    <div
      className="grid transition-all duration-300 ease-out"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <div
          className="mt-2.5 pt-2.5 text-left"
          style={{ borderTop: `1px solid ${dark ? 'rgba(250,248,243,0.18)' : '#EAE0D5'}` }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: dark ? '#F3D9AE' : '#B5791F' }}
          >
            {team}
          </p>
          <ul className="mt-1.5 space-y-1">
            {responsibilities.map((r) => (
              <li
                key={r}
                className="text-[11.5px] leading-relaxed flex gap-1.5"
                style={{ color: dark ? '#D9B3AC' : '#7A6F63' }}
              >
                <span aria-hidden="true">·</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── NODE ────────────────────────────────────────────────────────
// Ditekan untuk membuka detail tanggung jawab; di-hover/focus untuk
// menyorot jalur pelaporan menuju HSE Manager di garis konektor.
function OrgNode({ node, highlight = false, dark = false, onHoverChange }) {
  const [open, setOpen] = useState(false);
  const { title, desc, team, responsibilities } = node;

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      aria-expanded={open}
      className="w-full rounded-sm px-4 py-3 text-center shadow-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        backgroundColor: highlight ? '#7A1B16' : dark ? '#6B1414' : '#FFFFFF',
        border: `1px solid ${highlight ? '#E8A33D' : dark ? '#6B1414' : '#EAE0D5'}`,
        outlineColor: '#E8A33D',
      }}
    >
      <div className="flex items-center justify-center gap-1.5">
        <p className="text-sm font-semibold" style={{ color: dark ? '#FAF8F3' : '#2B2320' }}>
          {title}
        </p>
        {createElement(ChevronDown, {
          size: 13,
          strokeWidth: 2.5,
          style: {
            color: dark ? '#D9B3AC' : '#B5A997',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          },
        })}
      </div>
      {desc && (
        <p
          className="mt-1 text-[12px] leading-relaxed"
          style={{ color: dark ? '#D9B3AC' : '#7A6F63' }}
        >
          {desc}
        </p>
      )}
      <DetailPanel open={open} team={team} responsibilities={responsibilities} dark={dark} />
    </button>
  );
}

function Tier3Node({ node, active, onHoverChange }) {
  const [open, setOpen] = useState(false);
  const { icon: Icon, title, desc, team, responsibilities } = node;

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      aria-expanded={open}
      className="w-full rounded-sm px-4 py-4 text-center shadow-sm bg-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ border: `1px solid ${active ? '#E8A33D' : '#EAE0D5'}`, outlineColor: '#E8A33D' }}
    >
      <div className="flex justify-center">
        {createElement(Icon, {
          size: 18,
          strokeWidth: 2,
          style: { color: active ? '#E8A33D' : '#6B1414' },
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-1.5">
        <p className="text-[13px] font-semibold" style={{ color: '#2B2320' }}>
          {title}
        </p>
        {createElement(ChevronDown, {
          size: 12,
          strokeWidth: 2.5,
          style: {
            color: '#B5A997',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          },
        })}
      </div>
      <p className="mt-1 text-[12px] leading-relaxed" style={{ color: '#7A6F63' }}>
        {desc}
      </p>
      <DetailPanel open={open} team={team} responsibilities={responsibilities} />
    </button>
  );
}

function ExternalCard({ item }) {
  const { icon: Icon, title, org, note, phone } = item;
  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard?.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard tidak tersedia — abaikan secara diam-diam
    }
  }

  return (
    <div className="group relative p-6 bg-white transition-colors duration-300 hover:bg-[#FBF7F0]">
      {createElement(Icon, {
        size: 20,
        strokeWidth: 2,
        style: {
          color: '#6B1414',
          transition: 'transform 0.3s ease',
        },
        className: 'group-hover:scale-110',
      })}
      <p className="mt-4 text-sm font-semibold" style={{ color: '#2B2320' }}>
        {title}
      </p>
      <p className="mt-1 text-[12px] font-medium" style={{ color: '#E8A33D' }}>
        {org}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#7A6F63' }}>
        {note}
      </p>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1.5 rounded-full transition-colors"
        style={{
          backgroundColor: copied ? 'rgba(232,163,61,0.15)' : '#F5F0E8',
          color: copied ? '#B5791F' : '#7A6F63',
        }}
      >
        {createElement(copied ? Check : Copy, { size: 12, strokeWidth: 2.5 })}
        {copied ? 'Nomor disalin' : phone}
      </button>
    </div>
  );
}

export default function OrgStructureSection() {
  const [inView, setInView] = useState(false);
  const [activeTier, setActiveTier] = useState(null); // null | 2 | 3
  const sectionRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fadeUp = (delay) => ({
    transitionDelay: reduced ? '0ms' : `${delay}ms`,
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(16px)',
  });

  // Saat hover/focus di Tier 2 atau Tier 3, seluruh jalur konektor
  // menuju HSE Manager ikut menyala — menunjukkan rantai pelaporan.
  const pathActive = activeTier != null;

  return (
    <section id="struktur-organisasi" ref={sectionRef} className="w-full bg-[#FAF8F3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-3xl transition-all duration-700" style={fadeUp(0)}>
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
            cepat, dan koordinasi yang jelas di setiap lini. Arahkan kursor ke sebuah peran untuk
            melihat jalur pelaporannya, atau klik untuk membuka detail tanggung jawabnya.
          </p>
        </div>

        {/* Org chart */}
        <div className="mt-16 flex flex-col items-center">
          {/* Tier 1 */}
          <div className="w-full max-w-xs transition-all duration-700" style={fadeUp(80)}>
            <OrgNode node={HSE_MANAGER} highlight={pathActive} dark />
          </div>

          <div className="h-8 flex justify-center transition-all duration-700" style={fadeUp(140)}>
            <Connector active={pathActive} delay={pathActive ? 160 : 0} className="h-8" />
          </div>

          {/* Tier 2 */}
          <div
            className="relative w-full max-w-2xl transition-all duration-700"
            style={fadeUp(160)}
          >
            <div className="absolute top-0 left-[25%] right-[25%] h-px overflow-hidden">
              <Connector
                vertical={false}
                active={pathActive}
                delay={pathActive ? 100 : 0}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-6 pt-8">
              {TIER_2.map((item) => (
                <div key={item.title} className="relative flex flex-col items-center">
                  <div className="absolute -top-8 h-8">
                    <Connector active={activeTier === 2} delay={0} className="h-8" />
                  </div>
                  <OrgNode node={item} onHoverChange={(v) => setActiveTier(v ? 2 : null)} />
                </div>
              ))}
            </div>
          </div>

          <div className="h-8 flex justify-center transition-all duration-700" style={fadeUp(220)}>
            <Connector active={activeTier === 3} delay={0} className="h-8" />
          </div>

          {/* Tier 3 */}
          <div className="relative w-full transition-all duration-700" style={fadeUp(240)}>
            <div className="absolute top-0 left-[12.5%] right-[12.5%] h-px overflow-hidden">
              <Connector vertical={false} active={activeTier === 3} delay={40} className="w-full" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
              {TIER_3.map((node) => (
                <div key={node.title} className="relative flex flex-col items-center">
                  <div className="absolute -top-8 h-8">
                    <Connector active={activeTier === 3} delay={0} className="h-8" />
                  </div>
                  <Tier3Node
                    node={node}
                    active={activeTier === 3}
                    onHoverChange={(v) => setActiveTier(v ? 3 : null)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* External coordination */}
        <div
          className="mt-20 pt-10 transition-all duration-700"
          style={{ borderTop: '1px solid #EAE0D5', ...fadeUp(320) }}
        >
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
            darurat yang cepat dan terkoordinasi. Ketuk nomor untuk menyalinnya.
          </p>

          <div
            className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden"
            style={{ backgroundColor: '#EAE0D5' }}
          >
            {EXTERNAL_COORDINATION.map((item) => (
              <ExternalCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
