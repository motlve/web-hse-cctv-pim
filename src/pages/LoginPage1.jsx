import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // kalau pakai react-router
import Logo from "../assets/images/logo.png";
import bgImage from "../assets/images/cctv-illustration.png";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // untuk redirect

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Simpan token dan user ke localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Login successful", data);
      navigate("/dashboard");
      console.log("Navigated to /dashboard");
    } else {
      setError(data.message || "Login failed");
    }
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    setError("Username atau password salah");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex h-screen w-full">
      <div className="w-2/5 bg-white flex flex-col justify-center items-center px-16">
        <img src={Logo} alt="Logo" className="w-150" />

        <form
          onSubmit={handleLogin}
          className="w-full max-w-md flex flex-col gap-5 -mt-35"
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="off"
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition mt-10"
            disabled={loading}
          >
            {loading ? "Logging in..." : "LOGIN"}
          </button>
        </form>
      </div>

      <div
        className="w-3/5 relative flex justify-center items-center overflow-hidden"
        style={{ backgroundColor: "#074799" }}
      >
        <img
          src={bgImage}
          alt="CCTV Illustration"
          className="absolute w-[120%] h-[110%] object-cover translate-y-10"
        />
      </div>
    </div>
  );
}
