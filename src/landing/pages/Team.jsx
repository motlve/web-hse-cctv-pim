import { createElement, useState } from 'react';
import { Users2, ShieldCheck, Camera, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';

// TODO: ganti "name" & "role" dengan data asli. "photo" bisa diisi URL foto asli;
// selama masih kosong, dipakai avatar generate otomatis dari inisial nama.
const TEAMS = {
  hse: {
    label: 'Tim HSE',
    icon: ShieldCheck,
    members: [
      { name: 'Nama Manager HSE', role: 'HSE Manager', photo: '' },
      { name: 'Nama Supervisor 1', role: 'Supervisor Keselamatan Kerja', photo: '' },
      { name: 'Nama Supervisor 2', role: 'Supervisor Kesehatan & Lingkungan', photo: '' },
    ],
  },
  cctv: {
    label: 'Tim CCTV & Monitoring',
    icon: Camera,
    members: [
      { name: 'Nama Petugas 1', role: 'Petugas CCTV', photo: '' },
      { name: 'Nama Petugas 2', role: 'Petugas CCTV', photo: '' },
      { name: 'Nama Petugas 3', role: 'Petugas CCTV', photo: '' },
      { name: 'Nama Petugas 4', role: 'Petugas CCTV', photo: '' },
    ],
  },
  paramedis: {
    label: 'Tim Paramedis',
    icon: Stethoscope,
    members: [
      { name: 'Nama Paramedis 1', role: 'Paramedis', photo: '' },
      { name: 'Nama Paramedis 2', role: 'Paramedis', photo: '' },
      { name: 'Nama Paramedis 3', role: 'Paramedis', photo: '' },
    ],
  },
};

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=7A1B16&color=FAF8F3&size=256&bold=true&font-size=0.36`;
}

export default function TeamCarouselSection() {
  const [category, setCategory] = useState('hse');
  const [index, setIndex] = useState(0);

  const active = TEAMS[category];
  const members = active.members;
  const person = members[index];

  function selectCategory(key) {
    setCategory(key);
    setIndex(0);
  }

  function prev() {
    setIndex((i) => (i === 0 ? members.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === members.length - 1 ? 0 : i + 1));
  }

  return (
    <section id="tim-hse" className="w-full" style={{ backgroundColor: '#6B1414' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
            style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D' }}
          >
            {createElement(Users2, { size: 13, strokeWidth: 2 })}
            Tim HSE
          </span>

          <h2
            className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
            style={{ color: '#FAF8F3' }}
          >
            Orang-orang di balik keselamatan Pondok Indah Mall
          </h2>
          <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#D9B3AC' }}>
            Mulai dari manajemen hingga petugas lapangan, berikut tim yang bertanggung jawab menjaga
            keselamatan dan kesehatan di seluruh area mall.
          </p>
        </div>

        {/* Category tabs */}
        <div className="mt-10 flex flex-wrap gap-2">
          {Object.entries(TEAMS).map(([key, val]) => {
            const isActive = key === category;
            return (
              <button
                key={key}
                onClick={() => selectCategory(key)}
                className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full transition-colors"
                style={{
                  backgroundColor: isActive ? '#E8A33D' : 'rgba(250,248,243,0.06)',
                  color: isActive ? '#6B1414' : '#D9B3AC',
                }}
              >
                {createElement(val.icon, { size: 14, strokeWidth: 2 })}
                {val.label}
              </button>
            );
          })}
        </div>

        {/* Slide */}
        <div className="mt-10 flex flex-col items-center">
          <div className="relative w-full max-w-sm">
            <div
              className="flex flex-col items-center text-center p-8 rounded-sm"
              style={{ backgroundColor: '#7A1B16', border: '1px solid #8C2A22' }}
            >
              <img
                src={person.photo || avatarUrl(person.name)}
                alt={person.name}
                className="h-28 w-28 rounded-full object-cover"
                style={{ border: '3px solid #E8A33D' }}
              />
              <p className="mt-5 text-base font-semibold" style={{ color: '#FAF8F3' }}>
                {person.name}
              </p>
              <p className="mt-1 text-[13px]" style={{ color: '#D9B3AC' }}>
                {person.role}
              </p>
              <p className="mt-4 text-[11px] tracking-wide" style={{ color: '#C79289' }}>
                {index + 1} / {members.length}
              </p>
            </div>

            {/* Nav arrows */}
            {members.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Sebelumnya"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#E8A33D', color: '#6B1414' }}
                >
                  {createElement(ChevronLeft, { size: 18, strokeWidth: 2.5 })}
                </button>
                <button
                  onClick={next}
                  aria-label="Berikutnya"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#E8A33D', color: '#6B1414' }}
                >
                  {createElement(ChevronRight, { size: 18, strokeWidth: 2.5 })}
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          {members.length > 1 && (
            <div className="mt-6 flex items-center gap-2">
              {members.map((m, i) => (
                <button
                  key={m.name}
                  onClick={() => setIndex(i)}
                  aria-label={`Ke slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === index ? '20px' : '6px',
                    backgroundColor: i === index ? '#E8A33D' : 'rgba(250,248,243,0.25)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
