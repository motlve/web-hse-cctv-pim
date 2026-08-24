import { createElement, useState, useEffect, useRef } from 'react';
import {
  Mail,
  MapPin,
  Clock,
  PhoneCall,
  Phone,
  Send,
  CheckCircle2,
  MessageSquare,
  Copy,
  Check,
  User,
  AlertCircle,
  ShieldAlert,
  HelpCircle,
  Handshake,
  Radio,
  Sparkles,
} from 'lucide-react';

// TODO: ganti dengan data kontak asli
const EMERGENCY = {
  label: 'Hotline Darurat 24 Jam',
  value: '(021) 000-0000',
  href: 'tel:+62210000000',
};

const CONTACT_INFO = [
  {
    icon: Phone,
    label: 'Telepon Kantor HSE',
    value: '(021) 000-0001',
    href: 'tel:+62210000001',
    copyable: true,
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'hse@pondokindahmall.co.id',
    href: 'mailto:hse@pondokindahmall.co.id',
    copyable: true,
  },
  {
    icon: MapPin,
    label: 'Alamat',
    value: 'Jl. Metro Pondok Indah, Jakarta Selatan',
    href: 'https://maps.google.com/?q=Pondok+Indah+Mall',
  },
  {
    icon: Clock,
    label: 'Jam Operasional',
    value: '10.00 - 22.00 WIB (Setiap Hari)',
  },
];

// Setiap jenis pesan punya nada, tip konsol, dan balasan cepat sendiri —
// dipakai bareng oleh DispatchConsole dan chip "Balasan Cepat" di form.
const MESSAGE_TYPES = [
  {
    id: 'umum',
    icon: HelpCircle,
    label: 'Pertanyaan Umum',
    tip: 'Rata-rata dibalas dalam 24 jam kerja.',
    accent: '#E8A33D',
    quickReplies: [
      'Saya ingin tanya jam operasional mall.',
      'Bagaimana cara menuju pos HSE terdekat?',
      'Apakah tersedia layanan lost & found?',
    ],
  },
  {
    id: 'insiden',
    icon: ShieldAlert,
    label: 'Laporan Insiden',
    tip: 'Prioritas tinggi — tim lapangan segera dihubungi.',
    accent: '#E8877A',
    quickReplies: [
      'Saya ingin melaporkan kecelakaan kerja.',
      'Ada kerusakan fasilitas yang berpotensi bahaya.',
      'Saya menemukan barang/aktivitas mencurigakan.',
    ],
  },
  {
    id: 'kerjasama',
    icon: Handshake,
    label: 'Kerja Sama',
    tip: 'Tim business diproses dalam 2-3 hari kerja.',
    accent: '#F0C88A',
    quickReplies: [
      'Kami tertarik mengajukan kerja sama sponsorship.',
      'Kami ingin menyewa ruang untuk event.',
      'Kami mewakili media dan ingin liputan bersama.',
    ],
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return reduced;
}

function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return value;
}

// ── DISPATCH CONSOLE ──────────────────────────────────────────
// Elemen signature section ini: konsol operator kecil bergaya
// command center — jam berjalan real-time, indikator "operator
// standby" berkedip, dan tip yang mengetik sendiri (typewriter)
// mengikuti jenis pesan yang sedang dipilih di form di bawah.
function DispatchConsole({ messageType }) {
  const [now, setNow] = useState(new Date());
  const [typedTip, setTypedTip] = useState('');
  const reduced = usePrefersReducedMotion();
  const avgHours = useCountUp(8);

  const active = MESSAGE_TYPES.find((m) => m.id === messageType) || MESSAGE_TYPES[0];

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (reduced) {
      setTypedTip(active.tip);
      return;
    }
    setTypedTip('');
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTypedTip(active.tip.slice(0, i));
      if (i >= active.tip.length) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [active.tip, reduced]);

  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });

  return (
    <div
      className="relative shrink-0 w-full sm:w-64 rounded-sm overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: '#2A0808', border: '1px solid #8C2A22' }}
    >
      <style>{`
        @keyframes hse-console-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>

      <div className="flex items-center justify-between px-3.5 pt-3">
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: active.accent,
              animation: reduced ? 'none' : 'hse-console-blink 1.6s ease-in-out infinite',
            }}
          />
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: active.accent }}
          >
            Operator Standby
          </span>
        </div>
        {createElement(Radio, { size: 12, strokeWidth: 2, style: { color: '#C79289' } })}
      </div>

      <div className="px-3.5 pt-2.5 min-h-[34px]">
        <p className="text-[11.5px] leading-snug" style={{ color: '#F0C88A' }}>
          {typedTip}
          <span
            className="inline-block w-[5px] h-[11px] ml-0.5 align-middle"
            style={{
              backgroundColor: active.accent,
              animation: reduced ? 'none' : 'hse-console-blink 0.9s step-start infinite',
            }}
          />
        </p>
      </div>

      <div
        className="mt-3 flex items-center justify-between px-3.5 py-2"
        style={{ borderTop: '1px solid #3D0A0A', backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-semibold tabular-nums" style={{ color: '#FAF8F3' }}>
            {avgHours}
          </span>
          <span className="text-[9px]" style={{ color: '#C79289' }}>
            jam rata-rata respons
          </span>
        </div>
        <span className="text-[9px] font-mono tabular-nums" style={{ color: '#E8A33D' }}>
          {timeStr}
        </span>
      </div>
    </div>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Salin"
      className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ backgroundColor: 'rgba(232,163,61,0.15)' }}
    >
      {createElement(copied ? Check : Copy, {
        size: 12,
        strokeWidth: 2,
        style: { color: '#E8A33D' },
      })}
      {copied && (
        <span
          className="absolute -top-7 right-0 whitespace-nowrap text-[10px] px-2 py-1 rounded-full"
          style={{ backgroundColor: '#E8A33D', color: '#4A2E0A' }}
        >
          Disalin!
        </span>
      )}
    </button>
  );
}

// Tombol hotline dengan efek "sonar" — cincin sinyal yang melebar
// keluar seperti gelombang radio, dipicu ulang tiap kali diketuk.
function EmergencyHotline() {
  const [pulses, setPulses] = useState([0]);
  const reduced = usePrefersReducedMotion();
  const idRef = useRef(1);

  function triggerPulse() {
    if (reduced) return;
    const id = idRef.current++;
    setPulses((p) => [...p, id]);
    setTimeout(() => {
      setPulses((p) => p.filter((x) => x !== id));
    }, 900);
  }

  return (
    <a
      href={EMERGENCY.href}
      onClick={triggerPulse}
      className="group relative overflow-hidden rounded-2xl p-6 flex items-center gap-4 transition-transform hover:-translate-y-0.5"
      style={{ background: 'linear-gradient(135deg, #E8A33D 0%, #C97F1F 100%)' }}
    >
      <style>{`
        @keyframes hse-sonar {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      <div
        className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full transition-transform duration-500 group-hover:scale-125"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
      />
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        {pulses.map((id) => (
          <span
            key={id}
            className="absolute inset-0 rounded-full"
            style={{
              border: '1.5px solid rgba(74,46,10,0.55)',
              animation: 'hse-sonar 0.9s ease-out forwards',
            }}
          />
        ))}
        <div
          className="relative flex h-12 w-12 items-center justify-center rounded-full animate-pulse"
          style={{ backgroundColor: 'rgba(74,46,10,0.15)' }}
        >
          {createElement(PhoneCall, { size: 20, strokeWidth: 2, style: { color: '#4A2E0A' } })}
        </div>
      </div>
      <div className="relative">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.1em]"
          style={{ color: '#4A2E0A' }}
        >
          {EMERGENCY.label}
        </p>
        <p className="mt-0.5 text-xl font-bold" style={{ color: '#3A2408' }}>
          {EMERGENCY.value}
        </p>
      </div>
    </a>
  );
}

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [messageType, setMessageType] = useState('umum');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeType = MESSAGE_TYPES.find((m) => m.id === messageType) || MESSAGE_TYPES[0];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: null }));
  }

  function handleQuickReply(text) {
    setForm((f) => ({
      ...f,
      message: f.message.trim() ? `${f.message.trim()}\n${text}` : text,
    }));
    if (errors.message) setErrors((er) => ({ ...er, message: null }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Nama wajib diisi';
    if (!form.email.trim()) next.email = 'Email wajib diisi';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Format email tidak valid';
    if (!form.message.trim()) next.message = 'Pesan tidak boleh kosong';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // TODO: sambungkan ke endpoint backend Go, sertakan `messageType` (mis. POST /api/contact)
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 700);
  }

  const fieldClass =
    'mt-1.5 w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#6B1414]/10';

  const fieldStyle = (name) => ({
    border: `1px solid ${errors[name] ? '#C1443A' : '#EAE0D5'}`,
    color: '#2B2320',
  });

  const messageProgress = Math.min((form.message.length / 500) * 100, 100);

  return (
    <section
      id="kontak"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: '#6B1414' }}
    >
      {/* Decorative orbs */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full"
        style={{ backgroundColor: 'rgba(232,163,61,0.08)', filter: 'blur(60px)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full translate-x-1/3 translate-y-1/3"
        style={{ backgroundColor: 'rgba(232,163,61,0.06)', filter: 'blur(80px)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header + konsol dispatch */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-8 sm:gap-10 sm:justify-between">
          <div className="max-w-3xl">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] px-3 py-1 rounded-sm"
              style={{ backgroundColor: 'rgba(232,163,61,0.12)', color: '#E8A33D' }}
            >
              {createElement(MessageSquare, { size: 13, strokeWidth: 2 })}
              Kontak
            </span>

            <h2
              className="mt-5 text-2xl sm:text-3xl font-semibold leading-snug"
              style={{ color: '#FAF8F3' }}
            >
              Hubungi tim HSE kami
            </h2>
            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed" style={{ color: '#D9B3AC' }}>
              Ada pertanyaan, laporan insiden, atau butuh koordinasi terkait keselamatan? Tim kami
              siap membantu — rata-rata respons di bawah 24 jam.
            </p>
          </div>

          <DispatchConsole messageType={messageType} />
        </div>

        <div className="mt-12 grid lg:grid-cols-5 gap-6">
          {/* Left: contact info */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Emergency hotline dengan efek sonar */}
            <EmergencyHotline />

            {/* Info list */}
            <div
              className="rounded-2xl divide-y"
              style={{
                backgroundColor: '#7A1B16',
                border: '1px solid #8C2A22',
                borderColor: '#8C2A22',
              }}
            >
              {CONTACT_INFO.map(({ icon: Icon, label, value, href, copyable }) => {
                const inner = (
                  <div
                    className="group flex items-center gap-4 p-5"
                    style={{ borderColor: '#8C2A22' }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:bg-[rgba(232,163,61,0.2)]"
                      style={{ backgroundColor: 'rgba(232,163,61,0.12)' }}
                    >
                      {createElement(Icon, {
                        size: 16,
                        strokeWidth: 2,
                        style: { color: '#E8A33D' },
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[11px] uppercase tracking-[0.08em]"
                        style={{ color: '#C79289' }}
                      >
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-medium truncate" style={{ color: '#FAF8F3' }}>
                        {value}
                      </p>
                    </div>
                    {copyable && <CopyButton value={value} />}
                  </div>
                );
                return href ? (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className="block transition-colors hover:bg-black/10"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={label}>{inner}</div>
                );
              })}
            </div>

            {/* Map */}
            <div
              className="relative rounded-2xl overflow-hidden h-48"
              style={{ border: '1px solid #8C2A22' }}
            >
              <iframe
                title="Lokasi Pondok Indah Mall"
                src="https://www.google.com/maps?q=Pondok+Indah+Mall&output=embed"
                className="h-full w-full"
                style={{ border: 0, filter: 'grayscale(0.15) contrast(1.05)' }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl p-7 sm:p-8 bg-white h-full">
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: 'rgba(107,20,20,0.08)',
                      animation: 'contact-pop 0.35s ease-out',
                    }}
                  >
                    {createElement(CheckCircle2, {
                      size: 28,
                      strokeWidth: 2,
                      style: { color: '#6B1414' },
                    })}
                  </div>
                  <p className="mt-5 text-base font-semibold" style={{ color: '#2B2320' }}>
                    Pesan terkirim
                  </p>
                  <p className="mt-2 text-sm max-w-xs" style={{ color: '#7A6F63' }}>
                    Terima kasih, tim HSE kami akan menghubungi Anda kembali secepatnya.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', email: '', message: '' });
                      setMessageType('umum');
                    }}
                    className="mt-6 text-sm font-medium px-5 py-2.5 rounded-full transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#6B1414', color: '#FAF8F3' }}
                  >
                    Kirim pesan lain
                  </button>
                  <style>{`@keyframes contact-pop { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                  {/* Message type chips */}
                  <div>
                    <label className="text-xs font-medium" style={{ color: '#2B2320' }}>
                      Jenis Pesan
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MESSAGE_TYPES.map(({ id, icon: Icon, label }) => {
                        const isActive = messageType === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setMessageType(id)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full transition-colors"
                            style={{
                              backgroundColor: isActive ? '#6B1414' : '#FAF8F3',
                              color: isActive ? '#FAF8F3' : '#7A6F63',
                              border: `1px solid ${isActive ? '#6B1414' : '#EAE0D5'}`,
                            }}
                          >
                            {createElement(Icon, { size: 13, strokeWidth: 2 })}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-medium" style={{ color: '#2B2320' }}>
                        Nama
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 mt-0.5">
                          {createElement(User, {
                            size: 15,
                            strokeWidth: 2,
                            style: { color: '#B5A79A' },
                          })}
                        </div>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Nama lengkap"
                          className={fieldClass}
                          style={fieldStyle('name')}
                        />
                      </div>
                      {errors.name && (
                        <p
                          className="mt-1.5 flex items-center gap-1 text-[11px]"
                          style={{ color: '#C1443A' }}
                        >
                          {createElement(AlertCircle, { size: 11, strokeWidth: 2 })}
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium" style={{ color: '#2B2320' }}>
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 mt-0.5">
                          {createElement(Mail, {
                            size: 15,
                            strokeWidth: 2,
                            style: { color: '#B5A79A' },
                          })}
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="nama@email.com"
                          className={fieldClass}
                          style={fieldStyle('email')}
                        />
                      </div>
                      {errors.email && (
                        <p
                          className="mt-1.5 flex items-center gap-1 text-[11px]"
                          style={{ color: '#C1443A' }}
                        >
                          {createElement(AlertCircle, { size: 11, strokeWidth: 2 })}
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium" style={{ color: '#2B2320' }}>
                        Pesan
                      </label>
                      <span className="text-[11px]" style={{ color: '#B5A79A' }}>
                        {form.message.length}/500
                      </span>
                    </div>

                    {/* Balasan cepat — mengetuk menyisipkan kalimat template sesuai jenis pesan yang dipilih */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeType.quickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => handleQuickReply(reply)}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full transition-colors hover:bg-[#F4EEE3]"
                          style={{
                            backgroundColor: '#FAF8F3',
                            color: '#7A6F63',
                            border: '1px solid #EAE0D5',
                          }}
                        >
                          {createElement(Sparkles, {
                            size: 10,
                            strokeWidth: 2,
                            style: { color: '#C97F1F' },
                          })}
                          {reply}
                        </button>
                      ))}
                    </div>

                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      maxLength={500}
                      rows={5}
                      placeholder="Tulis pesan Anda di sini, atau ketuk salah satu balasan cepat di atas..."
                      className="mt-2.5 w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-[#6B1414]/10"
                      style={{
                        border: `1px solid ${errors.message ? '#C1443A' : '#EAE0D5'}`,
                        color: '#2B2320',
                      }}
                    />
                    <div
                      className="mt-1.5 h-1 w-full rounded-full overflow-hidden"
                      style={{ backgroundColor: '#EAE0D5' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${messageProgress}%`,
                          backgroundColor: messageProgress > 90 ? '#C1443A' : '#E8A33D',
                        }}
                      />
                    </div>
                    {errors.message && (
                      <p
                        className="mt-1.5 flex items-center gap-1 text-[11px]"
                        style={{ color: '#C1443A' }}
                      >
                        {createElement(AlertCircle, { size: 11, strokeWidth: 2 })}
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 inline-flex items-center justify-center gap-2 text-sm font-medium px-6 py-3 rounded-full transition-all hover:shadow-lg disabled:opacity-60"
                    style={{ backgroundColor: '#6B1414', color: '#FAF8F3' }}
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Pesan'}
                    {!submitting && createElement(Send, { size: 15, strokeWidth: 2 })}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
