import Logo from '../assets/images/logo.png';
import { useEffect, useState } from 'react';

export default function LoadingOverlay({ show, text = 'Connecting CCTV Network...' }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!show) {
      // saat overlay ditutup, lompat cepat ke 100% dulu baru reset (kesan "selesai")
      setProgress(100);
      const resetTimer = setTimeout(() => setProgress(0), 300);
      return () => clearTimeout(resetTimer);
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return 95; // berhenti di 95%, menunggu proses asli selesai
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-md">
      {/* CARD */}
      <div className="w-[360px] rounded-[32px] bg-white shadow-2xl p-10 flex flex-col items-center animate-[fadeIn_.4s_ease]">
        {/* LOGO */}
        <img src={Logo} alt="logo" className="w-28 h-28 object-contain mb-8 drop-shadow-md" />

        {/* CCTV SCAN */}
        <div className="relative w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
          <div className="text-4xl">📹</div>
          <div className="absolute top-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,.8)] animate-[scan_1.8s_linear_infinite]" />
        </div>

        {/* TITLE */}
        <h2 className="mt-7 text-xl font-semibold text-gray-800">HSE CCTV PIM</h2>
        <p className="mt-2 text-sm text-gray-500">{text}</p>

        {/* LOADING BAR */}
        <div className="mt-8 w-full h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* STATUS */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {progress}% Camera Connected
        </div>
      </div>

      <style>
        {`
          @keyframes scan {
            0% { transform: translateY(-50px); }
            100% { transform: translateY(100px); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}
