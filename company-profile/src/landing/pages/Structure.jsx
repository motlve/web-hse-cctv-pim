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

const LINE = '#D9C4B0';
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
    responsibilities: [
      'Memantau 120+ titik kamera 24 jam',
      'Melaporkan anomali ke command center',
    ],
  },
  {
    icon: Flame,
    title: 'Petugas Pemadam Kebakaran',
    desc: 'Siaga terhadap risiko kebakaran dan menjalankan prosedur evakuasi.',
    team: '6 Personel / Shift',
    responsibilities: [
      'Siaga proteksi kebakaran',
      'Memimpin prosedur evakuasi',
    ],
  },
  {
    icon: Stethoscope,
    title: 'Petugas Paramedis',
    desc: 'Memberikan pertolongan pertama dan penanganan medis darurat.',
    team: '4 Personel / Shift',
    responsibilities: [
      'Pertolongan pertama on-site',
      'Rujukan medis darurat',
    ],
  },
  {
    icon: Shield,
    title: 'Petugas Keamanan Lapangan',
    desc: 'Menjaga ketertiban dan keamanan fisik di seluruh area mall.',
    team: '12 Personel / Shift',
    responsibilities: [
      'Patroli & pengawasan area',
      'Penanganan insiden keamanan',
    ],
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

/* =========================================================
   REDUCED MOTION
========================================================= */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    );

    if (!mq) return;

    setReduced(mq.matches);

    const handler = (e) => setReduced(e.matches);

    mq.addEventListener?.('change', handler);

    return () => {
      mq.removeEventListener?.('change', handler);
    };
  }, []);

  return reduced;
}

/* =========================================================
   DETAIL PANEL
========================================================= */

function DetailPanel({
  open,
  team,
  responsibilities,
  dark = false,
}) {
  return (
    <div
      className="grid transition-all duration-300 ease-out"
      style={{
        gridTemplateRows: open ? '1fr' : '0fr',
      }}
    >
      <div className="overflow-hidden">
        <div
          className="mt-2.5 pt-2.5 text-left"
          style={{
            borderTop: `1px solid ${
              dark
                ? 'rgba(250,248,243,0.18)'
                : '#EAE0D5'
            }`,
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{
              color: dark ? '#F3D9AE' : '#B5791F',
            }}
          >
            {team}
          </p>

          <ul className="mt-1.5 space-y-1">
            {responsibilities.map((r) => (
              <li
                key={r}
                className="text-[11.5px] leading-relaxed flex gap-1.5"
                style={{
                  color: dark ? '#D9B3AC' : '#7A6F63',
                }}
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

/* =========================================================
   ANIMATED CONNECTOR
   React Bits inspired:
   - drawing line
   - glow
   - moving signal
========================================================= */

function AnimatedConnector({
  vertical = true,
  active = false,
  visible = true,
  delay = 0,
  duration = 650,
  pulse = true,
  className = '',
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <div
      className={`relative overflow-visible ${
        vertical ? 'w-px' : 'h-px'
      } ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity 400ms ease ${delay}ms`,
      }}
    >
      {/* Base line */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: active
            ? LINE_ACTIVE
            : LINE,
          opacity: active ? 1 : 0.85,
          boxShadow: active
            ? '0 0 8px rgba(232,163,61,0.45)'
            : 'none',
          transition:
            'background-color 300ms ease, box-shadow 300ms ease',
        }}
      />

      {/* Drawing line */}
      <div
        className={`absolute ${
          vertical
            ? 'left-0 top-0 bottom-0 w-px'
            : 'left-0 top-0 right-0 h-px'
        }`}
        style={{
          backgroundColor: active
            ? LINE_ACTIVE
            : '#BFAE9D',

          transformOrigin: vertical
            ? 'top center'
            : 'left center',

          transform: visible
            ? 'scale(1)'
            : vertical
              ? 'scaleY(0)'
              : 'scaleX(0)',

          transition: reduced
            ? 'none'
            : `transform ${duration}ms cubic-bezier(.22,1,.36,1) ${delay}ms`,

          boxShadow: active
            ? '0 0 7px rgba(232,163,61,0.55)'
            : 'none',
        }}
      />

      {/* Moving signal */}
      {pulse && visible && !reduced && (
        <span
          className={
            vertical
              ? 'absolute left-1/2 -translate-x-1/2 h-2 w-2 rounded-full'
              : 'absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full'
          }
          style={{
            backgroundColor: LINE_ACTIVE,
            boxShadow:
              '0 0 0 2px rgba(232,163,61,0.12), 0 0 10px rgba(232,163,61,0.9)',
            animation: vertical
              ? `hse-signal-vertical ${
                  active ? '1.25s' : '2.8s'
                } ease-in-out infinite`
              : `hse-signal-horizontal ${
                  active ? '1.25s' : '2.8s'
                } ease-in-out infinite`,
            animationDelay: `${delay + 250}ms`,
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   ORG NODE
========================================================= */

function OrgNode({
  node,
  highlight = false,
  dark = false,
  onHoverChange,
  animationDelay = 0,
  visible = true,
}) {
  const [open, setOpen] = useState(false);

  const {
    title,
    desc,
    team,
    responsibilities,
  } = node;

  const reduced = usePrefersReducedMotion();

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      aria-expanded={open}
      className="group relative w-full rounded-sm px-4 py-3 text-center shadow-sm transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        backgroundColor: highlight
          ? '#7A1B16'
          : dark
            ? '#6B1414'
            : '#FFFFFF',

        border: `1px solid ${
          highlight
            ? '#E8A33D'
            : dark
              ? '#6B1414'
              : '#EAE0D5'
        }`,

        outlineColor: '#E8A33D',

        opacity: visible ? 1 : 0,

        transform: visible
          ? 'translateY(0) scale(1)'
          : 'translateY(24px) scale(.96)',

        transitionDelay: `${animationDelay}ms`,

        boxShadow: highlight
          ? '0 0 0 1px rgba(232,163,61,.15), 0 10px 35px rgba(107,20,20,.12)'
          : '0 4px 18px rgba(60,40,20,.04)',
      }}
    >
      {/* Top glow */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-[2px] origin-left rounded-t-sm"
        style={{
          backgroundColor: '#E8A33D',
          transform: highlight
            ? 'scaleX(1)'
            : 'scaleX(0)',
          transition: reduced
            ? 'none'
            : 'transform 500ms cubic-bezier(.22,1,.36,1)',
        }}
      />

      <div className="flex items-center justify-center gap-1.5">
        <p
          className="text-sm font-semibold"
          style={{
            color: dark
              ? '#FAF8F3'
              : '#2B2320',
          }}
        >
          {title}
        </p>

        {createElement(ChevronDown, {
          size: 13,
          strokeWidth: 2.5,
          style: {
            color: dark
              ? '#D9B3AC'
              : '#B5A997',

            transform: open
              ? 'rotate(180deg)'
              : 'rotate(0deg)',

            transition:
              'transform 0.25s ease',
          },
        })}
      </div>

      {desc && (
        <p
          className="mt-1 text-[12px] leading-relaxed"
          style={{
            color: dark
              ? '#D9B3AC'
              : '#7A6F63',
          }}
        >
          {desc}
        </p>
      )}

      <DetailPanel
        open={open}
        team={team}
        responsibilities={responsibilities}
        dark={dark}
      />
    </button>
  );
}

/* =========================================================
   TIER 3 NODE
========================================================= */

function Tier3Node({
  node,
  active,
  onHoverChange,
  animationDelay = 0,
  visible = true,
}) {
  const [open, setOpen] = useState(false);

  const {
    icon: Icon,
    title,
    desc,
    team,
    responsibilities,
  } = node;

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      aria-expanded={open}
      className="group relative w-full rounded-sm px-4 py-4 text-center bg-white transition-all duration-500 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        border: `1px solid ${
          active ? '#E8A33D' : '#EAE0D5'
        }`,

        outlineColor: '#E8A33D',

        opacity: visible ? 1 : 0,

        transform: visible
          ? 'translateY(0) scale(1)'
          : 'translateY(24px) scale(.96)',

        transitionDelay: `${animationDelay}ms`,

        boxShadow: active
          ? '0 10px 35px rgba(232,163,61,.12), 0 0 0 1px rgba(232,163,61,.08)'
          : '0 4px 18px rgba(60,40,20,.04)',
      }}
    >
      {/* Animated top line */}
      <div
        className="absolute left-0 right-0 top-0 h-[2px] origin-left rounded-t-sm"
        style={{
          backgroundColor: '#E8A33D',
          transform: active
            ? 'scaleX(1)'
            : 'scaleX(0)',
          transition:
            'transform 400ms cubic-bezier(.22,1,.36,1)',
        }}
      />

      <div className="flex justify-center">
        {createElement(Icon, {
          size: 18,
          strokeWidth: 2,
          style: {
            color: active
              ? '#E8A33D'
              : '#6B1414',
            transition:
              'color 300ms ease, transform 300ms ease',
            transform: active
              ? 'scale(1.12)'
              : 'scale(1)',
          },
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1.5">
        <p
          className="text-[13px] font-semibold"
          style={{ color: '#2B2320' }}
        >
          {title}
        </p>

        {createElement(ChevronDown, {
          size: 12,
          strokeWidth: 2.5,
          style: {
            color: '#B5A997',
            transform: open
              ? 'rotate(180deg)'
              : 'rotate(0deg)',
            transition:
              'transform 0.25s ease',
          },
        })}
      </div>

      <p
        className="mt-1 text-[12px] leading-relaxed"
        style={{ color: '#7A6F63' }}
      >
        {desc}
      </p>

      <DetailPanel
        open={open}
        team={team}
        responsibilities={responsibilities}
      />
    </button>
  );
}

/* =========================================================
   EXTERNAL CARD
========================================================= */

function ExternalCard({ item }) {
  const {
    icon: Icon,
    title,
    org,
    note,
    phone,
  } = item;

  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e.stopPropagation();

    try {
      await navigator.clipboard?.writeText(phone);

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        1600
      );
    } catch {
      // ignore
    }
  }

  return (
    <div className="group relative p-6 bg-white transition-colors duration-300 hover:bg-[#FBF7F0]">
      {createElement(Icon, {
        size: 20,
        strokeWidth: 2,
        style: {
          color: '#6B1414',
          transition:
            'transform 0.3s ease',
        },
        className:
          'group-hover:scale-110',
      })}

      <p
        className="mt-4 text-sm font-semibold"
        style={{ color: '#2B2320' }}
      >
        {title}
      </p>

      <p
        className="mt-1 text-[12px] font-medium"
        style={{ color: '#E8A33D' }}
      >
        {org}
      </p>

      <p
        className="mt-1.5 text-[13px] leading-relaxed"
        style={{ color: '#7A6F63' }}
      >
        {note}
      </p>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1.5 rounded-full transition-colors"
        style={{
          backgroundColor: copied
            ? 'rgba(232,163,61,0.15)'
            : '#F5F0E8',
          color: copied
            ? '#B5791F'
            : '#7A6F63',
        }}
      >
        {createElement(
          copied ? Check : Copy,
          {
            size: 12,
            strokeWidth: 2.5,
          }
        )}

        {copied
          ? 'Nomor disalin'
          : phone}
      </button>
    </div>
  );
}

/* =========================================================
   MAIN SECTION
========================================================= */

export default function OrgStructureSection() {
  const [inView, setInView] = useState(false);
  const [activeTier, setActiveTier] =
    useState(null);

  const sectionRef = useRef(null);

  const reduced =
    usePrefersReducedMotion();

  useEffect(() => {
    const el = sectionRef.current;

    if (!el) return;

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.2,
        }
      );

    observer.observe(el);

    return () =>
      observer.disconnect();
  }, []);

  const fadeUp = (delay) => ({
    transitionDelay: reduced
      ? '0ms'
      : `${delay}ms`,

    opacity: inView ? 1 : 0,

    transform: inView
      ? 'translateY(0)'
      : 'translateY(16px)',

    transition:
      reduced
        ? 'none'
        : 'opacity 700ms ease, transform 700ms cubic-bezier(.22,1,.36,1)',
  });

  const pathActive =
    activeTier !== null;

  return (
    <section
      id="struktur-organisasi"
      ref={sectionRef}
      className="w-full bg-[#FAF8F3]"
    >
      {/* =====================================================
          ANIMATION CSS
      ===================================================== */}

      <style>{`
        @keyframes hse-signal-vertical {
          0% {
            top: 0%;
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          75% {
            opacity: 1;
          }

          100% {
            top: 100%;
            opacity: 0;
          }
        }

        @keyframes hse-signal-horizontal {
          0% {
            left: 0%;
            opacity: 0;
          }

          10% {
            opacity: 1;
          }

          75% {
            opacity: 1;
          }

          100% {
            left: 100%;
            opacity: 0;
          }
        }

        @keyframes hse-manager-pulse {
          0%,
          100% {
            box-shadow:
              0 0 0 0 rgba(232,163,61,0);
          }

          50% {
            box-shadow:
              0 0 0 7px rgba(232,163,61,0.08),
              0 0 25px rgba(232,163,61,0.08);
          }
        }

        @keyframes hse-node-pulse {
          0%,
          100% {
            opacity: .35;
            transform: scale(.85);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .hse-manager-live {
          animation:
            hse-manager-pulse
            2.8s ease-in-out infinite;
        }

        .hse-node-live {
          animation:
            hse-node-pulse
            2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hse-manager-live,
          .hse-node-live {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="max-w-3xl transition-all duration-700"
          style={fadeUp(0)}
        >
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{
              backgroundColor:
                'rgba(107,20,20,0.08)',
              color: '#6B1414',
            }}
          >
            {createElement(Network, {
              size: 13,
              strokeWidth: 2,
            })}

            Struktur Organisasi HSE
          </span>

          <h2
            className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
            style={{ color: '#2B2320' }}
          >
            Tim yang siap siaga,
            terkoordinasi dari pusat
            kontrol hingga lapangan
          </h2>

          <p
            className="mt-3 text-sm sm:text-[15px] leading-relaxed"
            style={{ color: '#7A6F63' }}
          >
            Struktur organisasi HSE Pondok
            Indah Mall dirancang untuk
            memastikan pengawasan, respons
            cepat, dan koordinasi yang jelas
            di setiap lini. Arahkan kursor
            ke sebuah peran untuk melihat
            jalur pelaporannya, atau klik
            untuk membuka detail tanggung
            jawabnya.
          </p>
        </div>

        {/* =================================================
            ORGANIZATION CHART
        ================================================= */}

        <div className="mt-16 flex flex-col items-center">

          {/* ===============================================
              TIER 1 — HSE MANAGER
          =============================================== */}

          <div
            className="relative w-full max-w-xs"
            style={fadeUp(80)}
          >
            {/* live indicator */}
            <div
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                backgroundColor:
                  '#FAF8F3',
                border:
                  '1px solid #EAE0D5',
              }}
            >
              <span
                className="relative flex h-1.5 w-1.5"
              >
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{
                    backgroundColor:
                      '#E8A33D',
                    animation:
                      reduced
                        ? 'none'
                        : 'hse-node-pulse 1.8s ease-in-out infinite',
                  }}
                />

                <span
                  className="relative inline-flex rounded-full h-1.5 w-1.5"
                  style={{
                    backgroundColor:
                      '#E8A33D',
                  }}
                />
              </span>

              <span
                className="text-[8px] font-semibold uppercase tracking-wider"
                style={{
                  color: '#8C2A22',
                }}
              >
                Command
              </span>
            </div>

            <div
              className={
                pathActive
                  ? ''
                  : 'hse-manager-live'
              }
            >
              <OrgNode
                node={HSE_MANAGER}
                highlight={pathActive}
                dark
                visible={inView}
                animationDelay={80}
              />
            </div>
          </div>

          {/* ===============================================
              MANAGER → TIER 2
          =============================================== */}

          <div
            className="relative flex justify-center h-12"
            style={fadeUp(180)}
          >
            <AnimatedConnector
              vertical
              visible={inView}
              active={pathActive}
              delay={200}
              duration={700}
              pulse
              className="h-12"
            />
          </div>

          {/* ===============================================
              TIER 2 CONNECTOR
          =============================================== */}

          <div
            className="relative w-full max-w-2xl"
            style={fadeUp(240)}
          >
            {/* horizontal rail */}

            <div
              className="absolute top-0 left-[25%] right-[25%] h-px"
            >
              <AnimatedConnector
                vertical={false}
                visible={inView}
                active={pathActive}
                delay={300}
                duration={700}
                pulse
                className="w-full"
              />
            </div>

            {/* Tier 2 cards */}

            <div className="grid grid-cols-2 gap-6 pt-8">
              {TIER_2.map(
                (item, index) => {
                  const isActive =
                    activeTier === 2;

                  return (
                    <div
                      key={item.title}
                      className="relative flex flex-col items-center"
                    >
                      {/* vertical branch */}

                      <div className="absolute -top-8 h-8">
                        <AnimatedConnector
                          visible={inView}
                          active={isActive}
                          delay={
                            380 +
                            index * 120
                          }
                          duration={500}
                          pulse
                          className="h-8"
                        />
                      </div>

                      {/* signal dot */}

                      <div
                        className="absolute -top-[34px] h-2 w-2 rounded-full z-10"
                        style={{
                          backgroundColor:
                            isActive
                              ? '#E8A33D'
                              : '#D9C4B0',

                          boxShadow:
                            isActive
                              ? '0 0 0 4px rgba(232,163,61,.10), 0 0 10px rgba(232,163,61,.55)'
                              : 'none',

                          opacity:
                            inView ? 1 : 0,

                          transition:
                            'all 300ms ease',

                          transitionDelay: `${
                            450 +
                            index * 120
                          }ms`,
                        }}
                      />

                      <OrgNode
                        node={item}
                        onHoverChange={(
                          value
                        ) =>
                          setActiveTier(
                            value
                              ? 2
                              : null
                          )
                        }
                        visible={inView}
                        animationDelay={
                          420 +
                          index * 130
                        }
                      />
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* ===============================================
              TIER 2 → TIER 3
          =============================================== */}

          <div
            className="relative flex justify-center h-12"
            style={fadeUp(430)}
          >
            <AnimatedConnector
              vertical
              visible={inView}
              active={activeTier === 3}
              delay={600}
              duration={700}
              pulse
              className="h-12"
            />
          </div>

          {/* ===============================================
              TIER 3
          =============================================== */}

          <div
            className="relative w-full"
            style={fadeUp(500)}
          >
            {/* horizontal rail */}

            <div
              className="absolute top-0 left-[12.5%] right-[12.5%] h-px"
            >
              <AnimatedConnector
                vertical={false}
                visible={inView}
                active={activeTier === 3}
                delay={680}
                duration={800}
                pulse
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
              {TIER_3.map(
                (node, index) => {
                  const isActive =
                    activeTier === 3;

                  return (
                    <div
                      key={node.title}
                      className="relative flex flex-col items-center"
                    >
                      {/* branch */}

                      <div className="absolute -top-8 h-8">
                        <AnimatedConnector
                          visible={inView}
                          active={isActive}
                          delay={
                            720 +
                            index * 100
                          }
                          duration={500}
                          pulse
                          className="h-8"
                        />
                      </div>

                      {/* endpoint */}

                      <div
                        className="absolute -top-[34px] h-2 w-2 rounded-full z-10"
                        style={{
                          backgroundColor:
                            isActive
                              ? '#E8A33D'
                              : '#D9C4B0',

                          boxShadow:
                            isActive
                              ? '0 0 0 4px rgba(232,163,61,.10), 0 0 10px rgba(232,163,61,.55)'
                              : 'none',

                          opacity:
                            inView ? 1 : 0,

                          transition:
                            'all 300ms ease',

                          transitionDelay: `${
                            780 +
                            index * 100
                          }ms`,
                        }}
                      />

                      <Tier3Node
                        node={node}
                        active={isActive}
                        visible={inView}
                        animationDelay={
                          760 +
                          index * 120
                        }
                        onHoverChange={(
                          value
                        ) =>
                          setActiveTier(
                            value
                              ? 3
                              : null
                          )
                        }
                      />
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* =================================================
              FLOW LEGEND
          ================================================= */}

          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            style={fadeUp(950)}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    '#E8A33D',
                  boxShadow:
                    '0 0 8px rgba(232,163,61,.5)',
                }}
              />

              <span
                className="text-[10px] uppercase tracking-[0.1em]"
                style={{
                  color: '#9A8C80',
                }}
              >
                Jalur koordinasi aktif
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="h-px w-5"
                style={{
                  backgroundColor:
                    '#D9C4B0',
                }}
              />

              <span
                className="text-[10px] uppercase tracking-[0.1em]"
                style={{
                  color: '#9A8C80',
                }}
              >
                Struktur pelaporan
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            EXTERNAL COORDINATION
        ================================================= */}

        <div
          className="mt-20 pt-10 transition-all duration-700"
          style={{
            borderTop:
              '1px solid #EAE0D5',
            ...fadeUp(1050),
          }}
        >
          <div className="flex items-center gap-2">
            {createElement(Users2, {
              size: 16,
              strokeWidth: 2,
              style: {
                color: '#6B1414',
              },
            })}

            <p
              className="text-xs uppercase tracking-[0.12em] font-medium"
              style={{
                color: '#6B1414',
              }}
            >
              Koordinasi dengan Pihak
              Eksternal
            </p>
          </div>

          <p
            className="mt-2 text-sm max-w-2xl"
            style={{
              color: '#7A6F63',
            }}
          >
            Tim HSE menjalin kerja sama
            aktif dengan instansi terkait
            untuk memastikan respons darurat
            yang cepat dan terkoordinasi.
            Ketuk nomor untuk menyalinnya.
          </p>

          <div
            className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-sm overflow-hidden"
            style={{
              backgroundColor:
                '#EAE0D5',
            }}
          >
            {EXTERNAL_COORDINATION.map(
              (item) => (
                <ExternalCard
                  key={item.title}
                  item={item}
                />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
