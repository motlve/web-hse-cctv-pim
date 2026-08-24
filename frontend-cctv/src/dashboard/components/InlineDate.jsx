import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/themes/material_blue.css';

export default function InlineDatePicker({ selectedDate, onChange }) {
  const calendarRef = useRef(null);
  const fpRef = useRef(null);

  // Ambil waktu WIB sekarang
  const getWIBDate = () => {
    const now = new Date();

    const wib = new Date(
      now.toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta',
      })
    );

    return wib;
  };

  useEffect(() => {
    if (!calendarRef.current) return;

    fpRef.current = flatpickr(calendarRef.current, {
      inline: true,

      enableTime: true,
      enableSeconds: true,

      time_24hr: true,

      dateFormat: 'Y-m-d H:i:S',

      defaultDate: selectedDate || getWIBDate(),

      onChange: (dates) => {
        onChange?.(dates[0] || null);
      },
    });

    return () => {
      fpRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!fpRef.current) return;

    if (selectedDate) {
      fpRef.current.setDate(selectedDate, false);
    }
  }, [selectedDate]);

  return <div ref={calendarRef} />;
}
