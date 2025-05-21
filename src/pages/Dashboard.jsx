import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ fullname: "", role: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Verifikasi token dengan /api/profile
    fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        setUser({ fullname: data.fullname, role: data.role });
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  if (loading) return <div>Loading...</div>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold">Welcome, {user.fullname}</h1>
      <p className="text-gray-700">Role: {user.role}</p>
      <p className="mt-4 text-gray-700">Ini adalah halaman dashboard CCTV</p>
    </Layout>
  );
}
