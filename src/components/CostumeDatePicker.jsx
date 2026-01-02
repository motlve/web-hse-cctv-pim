import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/themes/material_blue.css";

const CostumeDatePicker = ({ selectedDate, onChange, placeholder }) => {
  const inputRef = useRef(null);
  const fpRef = useRef(null);
  const isOpeningRef = useRef(false);

  useEffect(() => {
    fpRef.current = flatpickr(inputRef.current, {
      enableTime: true,
      enableSeconds: true,
      dateFormat: "Y-m-d H:i:S",
      time_24hr: true,

      closeOnSelect: false,
      allowInput: false,
      clickOpens: true,

      // ❌ JANGAN defaultDate
      defaultDate: undefined,

      onOpen: (_, __, fp) => {
        isOpeningRef.current = true;

        // 🔥 PAKSA CLEAR BIAR GA AUTO NOW
        if (!selectedDate) {
          fp.clear();
        }

        // release lock setelah open selesai
        setTimeout(() => {
          isOpeningRef.current = false;
        }, 0);
      },

      onChange: (selectedDates) => {
        // 🔥 BLOK AUTO CHANGE SAAT OPEN
        if (isOpeningRef.current) return;

        onChange?.(selectedDates[0] || null);
      },
    });

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, []);

  // Update dari luar (edit mode)
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
      placeholder={placeholder}
      readOnly
      className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 
                 focus:border-blue-500 shadow-sm"
    />
  );
};

export default CostumeDatePicker;
