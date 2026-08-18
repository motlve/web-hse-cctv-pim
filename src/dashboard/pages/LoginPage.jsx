import React, { useState, useEffect } from 'react';
import Logo from '../assets/images/logo.png';
import bgImage from '../assets/images/cctv-illustration.png';
import Swal from 'sweetalert2';
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiMail,
  FiKey,
  FiShield,
  FiX,
  FiArrowLeft,
  FiCheckCircle,
  FiLogIn,
} from 'react-icons/fi';

import Loading from '../components/Loading';

import api from '../api/axios';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [resetStep, setResetStep] = useState('username');

  const [resetUsername, setResetUsername] = useState('');

  const [otp, setOtp] = useState('');

  const [otpTimer, setOtpTimer] = useState(300);

  const [canResendOTP, setCanResendOTP] = useState(false);

  const [newPassword, setNewPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [resetLoading, setResetLoading] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memverifikasi kredensial...');

  useEffect(() => {
    if (resetStep !== 'otp') return;

    if (otpTimer <= 0) {
      setCanResendOTP(true);
      return;
    }

    const timer = setTimeout(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resetStep, otpTimer]);

  const formatTimer = (seconds) => {
    const minute = Math.floor(seconds / 60);

    const second = seconds % 60;

    return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  };

  /*** FUNGSI LOGIN ***/
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      Swal.fire({
        icon: 'warning',
        title: 'Data belum lengkap',
        text: 'Username dan password wajib diisi',
      });

      return;
    }

    setIsLoading(true);
    setLoadingText('Memverifikasi kredensial...');

    try {
      const response = await api.post('/login', {
        username,
        password,
      });

      const data = response.data;

      // =========================
      // SIMPAN SESSION
      // =========================

      localStorage.setItem('token', data.token);

      localStorage.setItem('role', data.user.role);

      localStorage.setItem('username', data.user.username);

      localStorage.setItem('fullname', data.user.fullname);

      localStorage.setItem('user', JSON.stringify(data.user));

      setLoadingText('Menyiapkan dashboard monitoring...');

      // =========================
      // CEK RIWAYAT LOGIN
      // =========================

      const hasLoginBefore = localStorage.getItem('hasLoginBefore');

      setIsLoading(false);

      // =========================
      // POPUP SELAMAT DATANG
      // =========================

      await Swal.fire({
        icon: 'success',

        title: hasLoginBefore ? 'Selamat Datang Kembali' : 'Selamat Datang di HSE Command Center',

        html: `
        <div style="
          font-size:14px;
          color:#555;
          line-height:1.6;
        ">
          Halo 
          <b>${data.user.fullname}</b>
          <br/>
          <span>
            CCTV Monitoring Center siap digunakan
          </span>
        </div>
      `,

        timer: 2500,

        timerProgressBar: true,

        showConfirmButton: false,

        backdrop: `
        rgba(0,0,80,0.35)
      `,

        customClass: {
          popup: 'rounded-3xl shadow-2xl',
        },
      });

      localStorage.setItem('hasLoginBefore', 'true');

      window.location.href = '/id-cctv';
    } catch (error) {
      setIsLoading(false);

      Swal.fire({
        icon: 'error',

        title: 'Login gagal',

        text: error.response?.data?.message || 'Username atau password salah',
      });
    }
  };

  /*** RESET PASSWORD LANGKAH 1 ***/
  const handleCheckUsername = async (e) => {
    e.preventDefault();

    if (!resetUsername) {
      Swal.fire({
        icon: 'warning',
        title: 'Username kosong',
      });

      return;
    }

    setResetLoading(true);

    try {
      const check = await api.post('/auth/check-user', {
        username: resetUsername,
      });

      const checkData = check.data;

      if (!checkData || !checkData.email) {
        Swal.fire({
          icon: 'error',
          title: 'User tidak ditemukan',
          text: 'Username tidak terdaftar',
        });

        return;
      }

      const otpRequest = await api.post('/auth/request-reset-password', {
        username: resetUsername,
      });

      const otpData = otpRequest.data;

      if (otpRequest.status !== 200) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal kirim OTP',
          text: otpData.message || 'OTP gagal dikirim',
        });

        return;
      }

      setOtpTimer(300);
      setCanResendOTP(false);
      setOtp('');
      setResetStep('otp');

      Swal.fire({
        icon: 'success',
        title: 'OTP terkirim',
        text: `OTP dikirim ke ${checkData.email}`,
      });
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: 'error',
        title: 'Terjadi kesalahan',
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otpTimer <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'OTP Kedaluwarsa',
        text: 'Silakan kirim ulang OTP',
      });

      return;
    }

    if (!otp) {
      Swal.fire({
        icon: 'warning',
        title: 'OTP Kosong',
        text: 'Masukkan kode OTP',
      });

      return;
    }

    setResetLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', {
        username: resetUsername,
        otp: otp,
      });

      const data = res.data;

      if (res.status === 200) {
        setResetStep('newPassword');

        Swal.fire({
          icon: 'success',
          title: 'OTP Valid',
          text: 'Silakan buat password baru',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'OTP Salah',
          text: data.message || 'Kode OTP tidak valid',
        });
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Kesalahan Server',
        text: 'Terjadi kesalahan pada server',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResendOTP) return;

    setResendLoading(true);

    try {
      await api.post('/auth/request-reset-password', {
        username: resetUsername,
      });

      setOtp('');
      setOtpTimer(300);
      setCanResendOTP(false);

      Swal.fire({
        icon: 'success',
        title: 'OTP dikirim ulang',
        text: 'Silakan cek email Anda',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal kirim OTP',
        text: error.response?.data?.message || 'Terjadi kesalahan pada server',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      Swal.fire({
        icon: 'warning',
        title: 'Password minimal 8 karakter',
      });

      return;
    }

    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Kosong',
        text: 'Lengkapi password baru',
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Tidak Sama',
        text: 'Konfirmasi password harus sama',
      });

      return;
    }

    setResetLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        username: resetUsername,
        otp: otp,
        newPassword: newPassword,
      });

      const data = res.data;

      if (res.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Password Berhasil Diubah',
          text: 'Silakan login kembali',
        });

        setResetUsername('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setResetStep('username');
        setIsResetModalOpen(false);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mengubah Password',
          text: data.message || 'Password gagal diubah',
        });
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Kesalahan Server',
        text: error.response?.data?.message || 'Tidak dapat memproses reset password',
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <Loading show={isLoading} text={loadingText} />
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
        {/* FORM LOGIN */}
        <div className="w-full md:w-2/5 flex items-center justify-center px-6 py-16 bg-white relative">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center gap-4 mb-8">
              <img src={Logo} alt="Logo" className="w-40 md:w-56 object-contain" />

              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-800">HSE Command Center</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Masuk untuk mengakses dashboard monitoring
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {/* USERNAME */}
              <div>
                <label className="text-sm font-semibold text-gray-700">Username</label>

                <div className="relative mt-2">
                  <FiUser
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="
                      w-full
                      h-14
                      pl-12
                      pr-4
                      rounded-2xl
                      border
                      border-gray-200
                      bg-gray-50
                      outline-none
                      transition
                      focus:bg-white
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm font-semibold text-gray-700">Password</label>

                <div className="relative mt-2">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="
                      w-full
                      h-14
                      pl-12
                      pr-12
                      rounded-2xl
                      border
                      border-gray-200
                      bg-gray-50
                      outline-none
                      transition
                      focus:bg-white
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <FiEyeOff size={19} /> : <FiEye size={19} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full
                    h-14
                    flex
                    items-center
                    justify-center
                    gap-2
                    bg-gradient-to-r
                    from-blue-600
                    to-indigo-600
                    text-white
                    rounded-2xl
                    font-semibold
                    shadow-lg
                    shadow-blue-200
                    hover:opacity-90
                    active:scale-[0.98]
                    transition
                    disabled:opacity-60
                  "
                >
                  <FiLogIn size={18} />
                  Masuk
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(true);
                    setResetStep('username');
                    setResetUsername('');
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="
                    text-blue-600
                    hover:text-blue-800
                    text-sm
                    font-medium
                    self-center
                    mt-1
                    transition
                  "
                >
                  Lupa Password?
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ILUSTRASI */}
        <div
          className="hidden md:flex w-3/5 relative items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#074799' }}
        >
          {/* Glow dekoratif */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 blur-[140px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/20 blur-[140px] rounded-full" />

          <div className="relative z-10 text-center px-10 mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white text-xs font-semibold tracking-wide uppercase mb-4">
              <FiShield size={14} />
              CCTV Monitoring System
            </div>
            <h2 className="text-3xl font-bold text-white leading-snug">
              Pantau Keamanan Fasilitas
              <br />
              Secara Real-time
            </h2>
          </div>

          <img
            src={bgImage}
            alt="Ilustrasi CCTV"
            className="absolute w-[110%] max-w-none transform translate-y-16 opacity-90 select-none pointer-events-none"
          />
        </div>
      </div>

      {/* MODAL RESET PASSWORD */}
      {isResetModalOpen && (
        <ResetPasswordModal
          step={resetStep}
          setStep={setResetStep}
          otpTimer={otpTimer}
          canResendOTP={canResendOTP}
          formatTimer={formatTimer}
          username={resetUsername}
          setUsername={setResetUsername}
          otp={otp}
          setOtp={setOtp}
          onVerifyOTP={handleVerifyOTP}
          onResetPassword={handleResetPassword}
          onResendOTP={handleResendOTP}
          resendLoading={resendLoading}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={resetLoading}
          onClose={() => {
            setIsResetModalOpen(false);
            setResetStep('username');
            setResetUsername('');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
          }}
          onCheckUsername={handleCheckUsername}
        />
      )}
    </>
  );
}

/*** KOMPONEN MODAL RESET PASSWORD ***/
function ResetPasswordModal({
  step,
  setStep,
  username,
  setUsername,
  otp,
  setOtp,
  otpTimer,
  canResendOTP,
  formatTimer,
  onResendOTP,
  resendLoading,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  error,
  onClose,
  onCheckUsername,
  onVerifyOTP,
  onResetPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Label langkah untuk indikator progres
  const steps = [
    { key: 'username', label: 'Username' },
    { key: 'otp', label: 'Verifikasi' },
    { key: 'newPassword', label: 'Password Baru' },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiLock className="text-blue-600" size={20} /> Reset Password
          </h2>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* INDIKATOR LANGKAH */}
        <div className="flex items-center gap-2 mb-6 mt-4">
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${
                    i < currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : i === currentStepIndex
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                        : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {i < currentStepIndex ? <FiCheckCircle size={13} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full ${
                    i < currentStepIndex ? 'bg-blue-600' : 'bg-gray-100'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ================= LANGKAH 1 USERNAME ================= */}

        {step === 'username' && (
          <form onSubmit={onCheckUsername} className="flex flex-col gap-6">
            <div className="flex justify-center">
              <div
                className="
                  w-24
                  h-24
                  rounded-[28px]
                  bg-gradient-to-br
                  from-blue-100
                  to-indigo-100
                  flex
                  items-center
                  justify-center
                  shadow-inner
                "
              >
                <FiUser className="text-blue-600" size={40} />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                Lupa Password?
              </h2>

              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Masukkan username akun Anda.
                <br />
                Kami akan mengirimkan kode verifikasi ke email terdaftar.
              </p>
            </div>

            <div className="relative">
              <FiUser
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="
                  w-full
                  h-14
                  pl-12
                  pr-5
                  rounded-2xl
                  bg-gray-50
                  border
                  border-gray-200
                  text-gray-800
                  placeholder-gray-400
                  outline-none
                  transition
                  focus:bg-white
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="
                  flex-1
                  h-12
                  rounded-2xl
                  bg-gray-100
                  text-gray-700
                  font-medium
                  hover:bg-gray-200
                  transition
                  active:scale-95
                "
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={loading}
                className="
                  flex-1
                  h-12
                  rounded-2xl
                  bg-gradient-to-r
                  from-blue-600
                  to-indigo-600
                  text-white
                  font-semibold
                  shadow-lg
                  shadow-blue-200
                  hover:opacity-90
                  transition
                  active:scale-95
                  disabled:opacity-50
                "
              >
                {loading ? 'Memeriksa...' : 'Lanjutkan'}
              </button>
            </div>
          </form>
        )}

        {/* ================= LANGKAH 2 OTP ================= */}

        {step === 'otp' && (
          <form onSubmit={onVerifyOTP} className="flex flex-col gap-6">
            <div className="flex justify-center">
              <div
                className="
                  w-24
                  h-24
                  rounded-[30px]
                  bg-gradient-to-br
                  from-blue-100
                  to-indigo-100
                  flex
                  items-center
                  justify-center
                  shadow-inner
                "
              >
                <FiMail className="text-blue-600" size={40} />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                Verifikasi Email Anda
              </h2>

              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Masukkan kode 6 digit yang telah dikirim
                <br />
                ke email Anda
              </p>
            </div>

            <div className="flex justify-center gap-3 mt-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={otp[index] || ''}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (!/^[0-9]*$/.test(value)) return;

                    const otpArray = otp.split('');
                    otpArray[index] = value;
                    setOtp(otpArray.join(''));

                    if (value && index < 5) {
                      document.getElementById(`otp-${index + 1}`).focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[index] && index > 0) {
                      document.getElementById(`otp-${index - 1}`).focus();
                    }
                  }}
                  className={`
                    w-12
                    h-14
                    rounded-2xl
                    text-center
                    text-xl
                    font-semibold
                    outline-none
                    transition-all
                    duration-200
                    border
                    ${
                      otp[index]
                        ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-800'
                    }
                    focus:bg-white
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                  `}
                />
              ))}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <div className="px-5 py-2 rounded-full bg-blue-50 text-blue-600 font-semibold text-sm">
                {otpTimer > 0
                  ? `Kode berlaku ${formatTimer(otpTimer)}`
                  : 'Kode OTP sudah kedaluwarsa'}
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              Tidak menerima kode?
              <button
                type="button"
                onClick={() => {
                  if (canResendOTP) onResendOTP();
                }}
                disabled={resendLoading}
                className={`
                  ml-1
                  font-semibold
                  ${canResendOTP ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400'}
                `}
              >
                {resendLoading
                  ? 'Mengirim...'
                  : canResendOTP
                    ? 'Kirim ulang'
                    : `Kirim ulang (${formatTimer(otpTimer)})`}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-14
                rounded-2xl
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                text-white
                font-semibold
                shadow-lg
                shadow-blue-200
                transition
                hover:opacity-90
                active:scale-[0.98]
                disabled:opacity-50
              "
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi Email'}
            </button>

            <button
              type="button"
              onClick={() => setStep('username')}
              className="
                flex
                items-center
                justify-center
                gap-1.5
                text-sm
                text-gray-500
                hover:text-gray-800
                transition
              "
            >
              <FiArrowLeft size={14} /> Ganti Username
            </button>
          </form>
        )}

        {/* ================= LANGKAH 3 PASSWORD BARU ================= */}

        {step === 'newPassword' && (
          <form onSubmit={onResetPassword} className="flex flex-col gap-6">
            <div className="flex justify-center">
              <div
                className="
                  w-24
                  h-24
                  rounded-3xl
                  bg-blue-100
                  flex
                  items-center
                  justify-center
                  shadow-inner
                "
              >
                <FiKey className="text-blue-600" size={38} />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Buat Password Baru
              </h2>

              <p className="text-sm text-gray-500 mt-2">Buat password baru untuk akun Anda</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <FiLock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="
                    w-full
                    h-14
                    rounded-2xl
                    border
                    border-gray-200
                    bg-gray-50
                    pl-12
                    pr-14
                    text-gray-800
                    outline-none
                    transition
                    focus:bg-white
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <FiEyeOff size={19} /> : <FiEye size={19} />}
                </button>
              </div>

              <div className="relative">
                <FiLock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Konfirmasi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="
                    w-full
                    h-14
                    rounded-2xl
                    border
                    border-gray-200
                    bg-gray-50
                    pl-12
                    pr-14
                    text-gray-800
                    outline-none
                    transition
                    focus:bg-white
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showConfirmPassword ? <FiEyeOff size={19} /> : <FiEye size={19} />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700">
              <p className="font-semibold mb-2">Password harus:</p>

              <ul className="space-y-1.5 text-blue-600">
                <li className="flex items-center gap-2">
                  <FiCheckCircle size={14} className="shrink-0" /> Minimal 8 karakter
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle size={14} className="shrink-0" /> Gunakan kombinasi huruf dan angka
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle size={14} className="shrink-0" /> Jangan gunakan password lama
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-14
                rounded-2xl
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                text-white
                font-semibold
                shadow-lg
                transition
                hover:scale-[1.02]
                active:scale-[0.98]
                disabled:opacity-50
              "
            >
              {loading ? 'Mengubah Password...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => setStep('otp')}
              className="
                flex
                items-center
                justify-center
                gap-1.5
                text-gray-500
                text-sm
                hover:text-blue-600
                transition
              "
            >
              <FiArrowLeft size={14} /> Kembali ke verifikasi OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
