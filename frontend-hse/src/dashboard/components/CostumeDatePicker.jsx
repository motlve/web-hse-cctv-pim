import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/themes/material_blue.css';

export default function CostumeDatePicker({ selectedDate, onChange, placeholder }) {
  const inputRef = useRef(null);
  const fpRef = useRef(null);

  // Simpan callback terbaru agar tidak stale
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!inputRef.current) return;

    fpRef.current = flatpickr(inputRef.current, {
      enableTime: true,
      enableSeconds: true,
      time_24hr: true,

      dateFormat: 'Y-m-d H:i:S',

      allowInput: false,
      clickOpens: true,
      closeOnSelect: true,

      onChange: (dates) => {
        onChangeRef.current?.(dates[0] || null);
      },
    });

    return () => {
      if (fpRef.current) {
        fpRef.current.destroy();
        fpRef.current = null;
      }
    };
  }, []);

  // Sinkronkan nilai dari React -> Flatpickr
  useEffect(() => {
    if (!fpRef.current) return;

    if (selectedDate) {
      fpRef.current.setDate(selectedDate, false);
    } else {
      fpRef.current.clear();
    }
  }, [selectedDate]);

  return (
    <input
      ref={inputRef}
      readOnly
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 shadow-sm
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  );
}
