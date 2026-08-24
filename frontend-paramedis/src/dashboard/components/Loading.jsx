import { useEffect, useState } from 'react';

export default function Loading({ show, text = 'Memverifikasi kredensial...' }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 450);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md animate-[fadeIn_0.25s_ease-out]">
      {/* CARD */}
      <div className="relative w-[300px] rounded-[28px] bg-[#0B1220]/95 border border-white/[0.08] shadow-2xl shadow-black/60 flex flex-col items-center px-7 py-9 overflow-hidden animate-[popIn_0.35s_cubic-bezier(0.16,1,0.3,1)]">
        {/* top gradient hairline */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/80 to-transparent" />

        {/* ambient glow, breathing */}
        <div className="absolute w-48 h-48 bg-blue-600/15 rounded-full blur-[70px] animate-[breathe_3s_ease-in-out_infinite]" />

        {/* LOGO */}
        <div className="relative mb-6">
          <img
            src="/logo.png"
            alt="Logo"
            className="relative w-11 opacity-95 drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]"
          />
        </div>

        {/* DUAL RING SPINNER */}
        <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{
              borderTopColor: '#3b82f6',
              borderRightColor: '#3b82f6',
              animationDuration: '1.1s',
              animationTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
            }}
          />
          <div
            className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
            style={{
              borderBottomColor: '#818cf8',
              animationDuration: '1.6s',
              animationDirection: 'reverse',
            }}
          />
          <div className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_3px_rgba(96,165,250,0.7)]" />
        </div>

        {/* TITLE */}
        <h3 className="text-white font-semibold text-[15px] tracking-wide text-center">
          Smart Surveillance Center
        </h3>

        {/* STATUS TEXT */}
        <p className="text-blue-400/90 text-xs mt-2 font-medium tracking-wide text-center min-h-[16px]">
          {text}
          <span className="inline-block w-4 text-left">{dots}</span>
        </p>

        {/* PROGRESS BAR */}
        <div className="w-36 h-1 bg-white/[0.06] rounded-full mt-6 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 rounded-full animate-[loadbar_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popIn {
            from { opacity: 0; transform: scale(0.92) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes breathe {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.08); }
          }
          @keyframes loadbar {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(320%); }
          }
        `}
      </style>
    </div>
  );
}
