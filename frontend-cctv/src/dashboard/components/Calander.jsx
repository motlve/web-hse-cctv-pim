import { useEffect, useRef, useState } from 'react';

import flatpickr from 'flatpickr';

import 'flatpickr/dist/themes/material_blue.css';

import Holidays from 'date-holidays';

export default function MonitoringCalendar({ selectedDate, onChange }) {
  const calendarRef = useRef(null);

  const fpRef = useRef(null);

  const holidayCache = useRef({});

  const [clock, setClock] = useState('');

  const [selectedInfo, setSelectedInfo] = useState(null);

  // ===============================
  // REALTIME CLOCK WIB
  // ===============================

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(
        new Date().toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour12: false,
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ===============================
  // HOLIDAY LIST
  // ===============================

  const getHolidayList = (year) => {
    if (holidayCache.current[year]) return holidayCache.current[year];

    const hd = new Holidays('ID');

    const result = {};

    hd.getHolidays(year).forEach((item) => {
      const d = new Date(item.date);

      const yyyy = d.getFullYear();

      const mm = String(d.getMonth() + 1).padStart(2, '0');

      const dd = String(d.getDate()).padStart(2, '0');

      result[`${yyyy}-${mm}-${dd}`] = item.name;
    });

    holidayCache.current[year] = result;

    return result;
  };

  // ===============================
  // INIT CALENDAR
  // ===============================

  useEffect(() => {
    if (!calendarRef.current) return;

    fpRef.current = flatpickr(calendarRef.current, {
      inline: true,

      monthSelectorType: 'static',

      enableTime: false,

      dateFormat: 'Y-m-d',

      defaultDate: selectedDate || new Date(),

      // =========================
      // MARK DATE
      // =========================

      onDayCreate: (dObj, dStr, instance, dayElem) => {
        const dateObj = dayElem.dateObj;

        if (!dateObj) return;

        const yyyy = dateObj.getFullYear();

        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');

        const dd = String(dateObj.getDate()).padStart(2, '0');

        const key = `${yyyy}-${mm}-${dd}`;

        const holiday = getHolidayList(yyyy)[key];

        const sunday = dateObj.getDay() === 0;

        const today = dateObj.toDateString() === new Date().toDateString();

        if (today) {
          dayElem.classList.add('today-monitoring');
        }

        if (holiday) {
          dayElem.classList.add('holiday-national');

          dayElem.title = holiday;
        } else if (sunday) {
          dayElem.classList.add('holiday-sunday');

          dayElem.title = 'Hari Minggu';
        }
      },

      // =========================
      // CLICK DATE
      // =========================

      onChange: (dates) => {
        const date = dates[0];

        if (!date) return;

        const yyyy = date.getFullYear();

        const mm = String(date.getMonth() + 1).padStart(2, '0');

        const dd = String(date.getDate()).padStart(2, '0');

        const key = `${yyyy}-${mm}-${dd}`;

        const holiday = getHolidayList(yyyy)[key];

        const sunday = date.getDay() === 0;

        setSelectedInfo({
          date: `${dd}-${mm}-${yyyy}`,

          name: holiday || (sunday ? 'Hari Minggu' : 'Tidak ada libur'),

          type: holiday ? 'Libur Nasional' : sunday ? 'Weekend' : 'Tanggal Monitoring',
        });

        onChange?.(date);
      },
    });

    return () => {
      fpRef.current?.destroy();
    };
  }, []);

  return (
    <div
      className="
bg-white/80
backdrop-blur-3xl

border
border-white/50

rounded-[40px]

shadow-xl

p-8
w-full
"
    >
      {/* HEADER */}

      <div
        className="
flex
justify-between
items-center
mb-8
"
      >
        <div>
          <p
            className="
text-xs
uppercase
tracking-[5px]
text-gray-400
font-semibold
"
          >
            MONITORING TIME
          </p>

          <h1
            className="
text-5xl
font-bold
text-blue-600
mt-3
"
          >
            {clock}
          </h1>

          <p className="text-gray-500">Asia/Jakarta (WIB)</p>
        </div>

        <div className="text-right">
          <p className="text-red-500 font-bold">🔴 Holiday</p>

          <p className="text-xs text-gray-400">National Holiday</p>
        </div>
      </div>

      <div ref={calendarRef} />

      {selectedInfo && (
        <div
          className="
relative

mt-6

bg-gradient-to-br
from-red-50
to-white

border
border-red-200

rounded-3xl

p-5

shadow-sm
"
        >
          {/* CLOSE BUTTON */}

          <button
            onClick={() => setSelectedInfo(null)}
            className="
absolute

top-3
right-3

w-8
h-8

rounded-full

bg-white

border
border-red-200

text-red-500

font-bold

hover:bg-red-500
hover:text-white

transition

flex
items-center
justify-center

"
          >
            ×
          </button>

          <div
            className="
flex
gap-4
items-center
"
          >
            <div className="text-4xl">🇮🇩</div>

            <div>
              <p
                className="
text-xs
uppercase
tracking-widest

text-red-500
font-bold
"
              >
                {selectedInfo.type}
              </p>

              <h3 className="font-bold text-lg">{selectedInfo.name}</h3>

              <p className="text-sm text-gray-500">📅 {selectedInfo.date}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
