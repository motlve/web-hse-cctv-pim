import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/logo.png";
import bgImage from "../assets/images/cctv-illustration.png";
import iconCloseEye from "../assets/images/close-eye.png";
import iconCloseUpEye from "../assets/images/eye-close-up.png";

export default function LoginPage() {
  const navigate = useNavigate();

  /*** LOGIN STATES ***/
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /*** RESET PASSWORD STATES ***/
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState("username"); // username | newPassword
  const [resetUsername, setResetUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  /*** STATUS MODAL ***/
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusSuccess, setStatusSuccess] = useState(false);

  /*** LOGIN FUNCTION ***/
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8081/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/summary");
      } else {
        setLoginError(data.message || "Login gagal.");
      }
    } catch (err) {
      console.error(err);
      setLoginError("Gagal menghubungi server.");
    } finally {
      setIsLoading(false);
    }
  };

  /*** RESET PASSWORD STEP 1 ***/
  const handleCheckUsername = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      const res = await fetch("http://localhost:8081/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: resetUsername }),
      });
      const data = await res.json().catch(() => ({
        message: "Server tidak merespon JSON",
      }));

      if (res.ok) {
        setResetStep("newPassword");
      } else {
        setResetError(data.message || "Username tidak ditemukan.");
      }
    } catch (err) {
      console.error(err);
      setResetError("Gagal menghubungi server.");
    } finally {
      setResetLoading(false);
    }
  };

  /*** RESET PASSWORD STEP 2 ***/
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");

    if (newPassword !== confirmPassword) {
      setStatusMessage("Password dan konfirmasi harus sama.");
      setStatusSuccess(false);
      setStatusModalOpen(true);
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch("http://localhost:8081/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: resetUsername, newPassword }),
      });

      const data = await res.json().catch(() => ({
        message: "Server tidak merespon JSON",
      }));

      if (res.ok) {
        setStatusMessage("Password berhasil diubah!");
        setStatusSuccess(true);
        // Reset semua input
        setResetUsername("");
        setNewPassword("");
        setConfirmPassword("");
        setResetStep("username");
      } else {
        setStatusMessage(data.message || "Gagal reset password.");
        setStatusSuccess(false);
      }
      setStatusModalOpen(true);
    } catch (err) {
      console.error(err);
      setStatusMessage("Gagal menghubungi server.");
      setStatusSuccess(false);
      setStatusModalOpen(true);
    } finally {
      setResetLoading(false);
    }
  };

  /*** HANDLE STATUS MODAL CLOSE ***/
  const handleCloseStatusModal = () => {
    setStatusModalOpen(false);
    if (statusSuccess) {
      // Jika password berhasil, tutup reset password modal
      setIsResetModalOpen(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
        {/* LOGIN FORM */}
        <div className="w-full md:w-2/5 flex items-center justify-center px-6 py-16 bg-white">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center gap-4 mb-6">
              <img src={Logo} alt="Logo" className="w-40 md:w-56 object-contain" />
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <label className="text-sm font-medium">Username</label>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="text-sm font-medium mt-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full mt-2 border border-gray-200 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  <img src={showPassword ? iconCloseEye : iconCloseUpEye} alt="eye icon" className="w-10 h-10 p-1" />
                </button>
              </div>

              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
                >
                  {isLoading ? "Logging in..." : "LOGIN"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(true);
                    setResetStep("username");
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm underline self-start mt-1"
                >
                  Lupa Password?
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ILLUSTRATION */}
        <div
          className="hidden md:flex w-3/5 relative items-center justify-center overflow-hidden"
          style={{ backgroundColor: "#074799" }}
        >
          <img
            src={bgImage}
            alt="CCTV Illustration"
            className="absolute w-[110%] max-w-none transform translate-y-8 opacity-90 select-none pointer-events-none"
          />
        </div>
      </div>

      {/* RESET PASSWORD MODAL */}
      {isResetModalOpen && (
        <ResetPasswordModal
          step={resetStep}
          setStep={setResetStep}
          username={resetUsername}
          setUsername={setResetUsername}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={resetLoading}
          error={resetError}
          onClose={() => setIsResetModalOpen(false)}
          onCheckUsername={handleCheckUsername}
          onResetPassword={handleResetPassword}
        />
      )}

      {/* STATUS MODAL */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-lg">
            <p className={`${statusSuccess ? "text-green-600" : "text-red-600"} font-semibold`}>
              {statusMessage}
            </p>
            <button
              onClick={handleCloseStatusModal}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/*** RESET PASSWORD MODAL COMPONENT ***/
function ResetPasswordModal({
  step,
  setStep,
  username,
  setUsername,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  error,
  onClose,
  onCheckUsername,
  onResetPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">🔒 Reset Password</h2>

        {step === "username" && (
          <form onSubmit={onCheckUsername} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
              >
                ❌ Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition disabled:opacity-60"
              >
                {loading ? "Memeriksa..." : "Lanjut"}
              </button>
            </div>
          </form>
        )}

        {step === "newPassword" && (
          <form onSubmit={onResetPassword} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Konfirmasi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showConfirmPassword ? "" : "👁️"}
              </button>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("username")}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition disabled:opacity-60"
              >
                {loading ? "Mengubah..." : "Selesai"}
              </button>
            </div>
          </form>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
