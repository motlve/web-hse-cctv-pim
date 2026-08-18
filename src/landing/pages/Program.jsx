import { createElement, useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  GraduationCap,
  Siren,
  Stethoscope,
  Megaphone,
  SearchCheck,
  Users,
  X,
  Clock3,
  MapPin,
  UsersRound,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';

// TODO: ganti "image" dengan URL foto asli kegiatan (dokumentasi pelatihan, drill, dll).
// Selama masih placeholder, dipakai foto stok bertema dari picsum.photos (konsisten per program lewat seed).
const PROGRAMS = [
  {
    icon: GraduationCap,
    title: 'Pelatihan K3 & Tanggap Darurat',
    desc: 'Pelatihan rutin bagi karyawan dan tenant mengenai prosedur keselamatan kerja dan tanggap darurat, mencakup simulasi skenario nyata di lapangan.',
    frequency: 'Berkala',
    image: 'https://picsum.photos/seed/pelatihan-k3/1000/800',
    peserta: 'Karyawan & Tenant',
    durasi: '2 - 4 Jam',
    lokasi: 'Ruang Serbaguna',
    featured: true,
  },
  {
    icon: Siren,
    title: 'Simulasi Evakuasi & Fire Drill',
    desc: 'Latihan evakuasi menyeluruh untuk menguji kesiapan seluruh penghuni mall menghadapi keadaan darurat.',
    frequency: '2x / Tahun',
    image: 'https://picsum.photos/seed/fire-drill/800/600',
    peserta: 'Seluruh Penghuni Mall',
    durasi: 'Setengah Hari',
    lokasi: 'Seluruh Area Mall',
  },
  {
    icon: Stethoscope,
    title: 'Pemeriksaan Kesehatan Berkala',
    desc: 'Layanan pemeriksaan kesehatan bagi karyawan sebagai bagian dari program kesejahteraan.',
    frequency: 'Berkala',
    image: 'https://picsum.photos/seed/medical-check/800/600',
    peserta: 'Karyawan',
    durasi: '1 Hari',
    lokasi: 'Klinik Mall',
  },
  {
    icon: SearchCheck,
    title: 'Audit & Inspeksi HSE',
    desc: 'Pemeriksaan menyeluruh terhadap fasilitas dan prosedur keselamatan di seluruh area mall.',
    frequency: 'Bulanan',
    image: 'https://picsum.photos/seed/audit-hse/800/600',
    peserta: 'Tim HSE Internal',
    durasi: '1 - 2 Hari',
    lokasi: 'Seluruh Area Mall',
  },
  {
    icon: Megaphone,
    title: 'Kampanye Kesadaran Keselamatan',
    desc: 'Sosialisasi dan edukasi keselamatan kepada pengunjung, tenant, dan karyawan.',
    frequency: 'Rutin',
    image: 'https://picsum.photos/seed/campaign-safety/800/600',
    peserta: 'Pengunjung & Tenant',
    durasi: 'Bervariasi',
    lokasi: 'Area Publik Mall',
  },
  {
    icon: Users,
    title: 'Koordinasi dengan Tenant',
    desc: 'Pertemuan berkala membahas standar HSE dan tindak lanjut temuan bersama pihak tenant.',
    frequency: 'Berkala',
    image: 'https://picsum.photos/seed/tenant-meeting/800/600',
    peserta: 'Perwakilan Tenant',
    durasi: '1 - 2 Jam',
    lokasi: 'Ruang Meeting',
  },
];

function FrequencyBadge({ children, solid = false }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: solid ? '#E8A33D' : 'rgba(250,248,243,0.92)',
        color: '#4A2E0A',
      }}
    >
      {children}
    </span>
  );
}

function ProgramModal({ program, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    function onKeyDown(e) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 180);
  }

  const Icon = program.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200"
      style={{
        backgroundColor: 'rgba(20,10,10,0.65)',
        backdropFilter: 'blur(6px)',
        opacity: visible ? 1 : 0,
      }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl overflow-hidden bg-white grid sm:grid-cols-2 transition-all duration-200"
        style={{
          border: '1px solid #EAE0D5',
          boxShadow: '0 24px 60px rgba(20,10,10,0.35)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image side */}
        <div className="relative h-56 sm:h-full">
          <img src={program.image} alt={program.title} className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(43,35,32,0.5), transparent 45%), linear-gradient(to right, transparent 60%, rgba(43,35,32,0.15))',
            }}
          />
          <div className="absolute top-4 left-4">
            <FrequencyBadge solid>{program.frequency}</FrequencyBadge>
          </div>
        </div>

        {/* Content side */}
        <div className="p-6 sm:p-7 flex flex-col">
          <button
            onClick={handleClose}
            aria-label="Tutup"
            className="self-end -mt-1 -mr-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: '#F5F0E8', color: '#2B2320' }}
          >
            {createElement(X, { size: 15, strokeWidth: 2.5 })}
          </button>

          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl -mt-2"
            style={{ backgroundColor: 'rgba(107,20,20,0.08)' }}
          >
            {createElement(Icon, { size: 18, strokeWidth: 2, style: { color: '#6B1414' } })}
          </div>

          <p className="mt-4 text-lg font-semibold leading-snug" style={{ color: '#2B2320' }}>
            {program.title}
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: '#7A6F63' }}>
            {program.desc}
          </p>

          <div className="mt-auto pt-6 grid grid-cols-3 gap-3">
            {[
              { icon: UsersRound, label: 'Peserta', value: program.peserta },
              { icon: Clock3, label: 'Durasi', value: program.durasi },
              { icon: MapPin, label: 'Lokasi', value: program.lokasi },
            ].map(({ icon: FIcon, label, value }) => (
              <div key={label} className="rounded-xl p-3" style={{ backgroundColor: '#FAF8F3' }}>
                {createElement(FIcon, { size: 13, strokeWidth: 2, style: { color: '#B5791F' } })}
                <p
                  className="mt-1.5 text-[9.5px] uppercase tracking-[0.08em]"
                  style={{ color: '#7A6F63' }}
                >
                  {label}
                </p>
                <p
                  className="mt-0.5 text-[12px] font-semibold leading-tight"
                  style={{ color: '#2B2320' }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProgramSection() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('Semua');

  const frequencies = useMemo(
    () => ['Semua', ...Array.from(new Set(PROGRAMS.map((p) => p.frequency)))],
    []
  );

  const filtered = useMemo(
    () => (filter === 'Semua' ? PROGRAMS : PROGRAMS.filter((p) => p.frequency === filter)),
    [filter]
  );

  return (
    <section id="program-hse" className="w-full bg-[#FAF8F3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
              style={{ backgroundColor: 'rgba(107,20,20,0.08)', color: '#6B1414' }}
            >
              {createElement(CalendarClock, { size: 13, strokeWidth: 2 })}
              Program &amp; Kegiatan HSE
            </span>

            <h2
              className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
              style={{ color: '#2B2320' }}
            >
              Komitmen yang dijalankan lewat program berkelanjutan
            </h2>
            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#7A6F63' }}>
              Kebijakan HSE diwujudkan melalui rangkaian program dan kegiatan rutin bersama
              karyawan, tenant, dan pengunjung. Klik salah satu program untuk melihat detailnya.
            </p>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {frequencies.map((f) => {
              const isActive = f === filter;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="text-xs font-medium px-4 py-2 rounded-full transition-colors"
                  style={{
                    backgroundColor: isActive ? '#6B1414' : 'white',
                    color: isActive ? '#FAF8F3' : '#7A6F63',
                    border: `1px solid ${isActive ? '#6B1414' : '#EAE0D5'}`,
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bento grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((program) => {
            const { icon: Icon, title, desc, frequency, image, featured } = program;
            const isFeatured = featured && filter === 'Semua';
            return (
              <button
                key={title}
                onClick={() => setSelected(program)}
                className={`group relative text-left rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  isFeatured ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''
                }`}
                style={{ boxShadow: '0 1px 3px rgba(43,35,32,0.06)' }}
              >
                <div
                  className={`relative w-full ${isFeatured ? 'h-72 sm:h-full sm:min-h-[22rem]' : 'h-56'}`}
                >
                  <img
                    src={image}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(20,12,10,0.92) 0%, rgba(20,12,10,0.45) 45%, rgba(20,12,10,0.05) 75%)',
                    }}
                  />

                  <div className="absolute inset-0 flex flex-col justify-between p-5">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: 'rgba(250,248,243,0.15)',
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        {createElement(Icon, {
                          size: 16,
                          strokeWidth: 2,
                          style: { color: '#FAF8F3' },
                        })}
                      </div>
                      <FrequencyBadge>{frequency}</FrequencyBadge>
                    </div>

                    <div>
                      <p
                        className={`font-semibold leading-snug ${isFeatured ? 'text-xl sm:text-2xl' : 'text-base'}`}
                        style={{ color: '#FAF8F3' }}
                      >
                        {title}
                      </p>
                      <p
                        className={`mt-2 leading-relaxed text-[#E8DCCF] ${
                          isFeatured ? 'text-[13px] max-w-sm' : 'text-[12.5px] line-clamp-2'
                        }`}
                        style={{ opacity: 0.85 }}
                      >
                        {desc}
                      </p>
                      <div
                        className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium transition-opacity"
                        style={{ color: '#E8A33D' }}
                      >
                        Lihat detail
                        {createElement(isFeatured ? ArrowUpRight : ArrowRight, {
                          size: 13,
                          strokeWidth: 2.5,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && <ProgramModal program={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
