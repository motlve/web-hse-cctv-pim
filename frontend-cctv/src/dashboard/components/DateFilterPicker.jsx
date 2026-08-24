import { useState } from 'react';

export default function DateFilterPicker({ mode, value, onChange }) {
  const [open, setOpen] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const label = () => {
    if (!value) return mode === 'month' ? 'Pilih Bulan' : 'Pilih Tahun';

    if (mode === 'month') {
      return `${months[value.getMonth()]} ${value.getFullYear()}`;
    }

    return value.getFullYear();
  };

  return (
    <div className="relative">
      {/* BUTTON */}

      <button
        onClick={() => setOpen(!open)}
        className="
        min-w-[160px]
        bg-white/70
        backdrop-blur-xl
        border
        border-white/60
        rounded-2xl
        px-4
        py-2.5
        text-sm
        font-semibold
        text-gray-700
        shadow-sm
        hover:bg-white
        transition
        flex
        items-center
        justify-between
        gap-3
        "
      >
        <span>{label()}</span>

        <span>▾</span>
      </button>

      {open && (
        <div
          className="
            absolute
            z-50
            mt-2
            w-[260px]
            rounded-3xl
            bg-white
            shadow-2xl
            border
            border-gray-100
            p-4
            "
        >
          {mode === 'month' && (
            <div>
              <p
                className="
                text-xs
                text-gray-400
                mb-3
                font-semibold
                uppercase
                "
              >
                Pilih Bulan
              </p>

              <div
                className="
                grid
                grid-cols-3
                gap-2
                "
              >
                {months.map((m, index) => (
                  <button
                    key={m}
                    onClick={() => {
                      const date = new Date(
                        value?.getFullYear() || new Date().getFullYear(),

                        index,

                        1
                      );

                      onChange(date);

                      setOpen(false);
                    }}
                    className="
                      px-2
                      py-2
                      rounded-xl
                      text-xs
                      font-medium
                      hover:bg-blue-100
                      hover:text-blue-600
                      transition
                      "
                  >
                    {m.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'year' && (
            <div>
              <p
                className="
                text-xs
                text-gray-400
                mb-3
                font-semibold
                uppercase
                "
              >
                Pilih Tahun
              </p>

              <div
                className="
                grid
                grid-cols-3
                gap-2
                "
              >
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      onChange(new Date(`${y}-01-01`));

                      setOpen(false);
                    }}
                    className="
                    px-3
                    py-2
                    rounded-xl
                    text-sm
                    font-semibold
                    hover:bg-blue-100
                    hover:text-blue-600
                    transition
                    "
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
