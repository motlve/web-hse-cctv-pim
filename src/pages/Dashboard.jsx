import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (err) {
      console.error("Failed to parse user:", err);
      navigate("/login");
    }
  }, [navigate]);

  if (!user) return <div>Loading...</div>;

  return (
    <Layout>
      <p className="mt-4 text-gray-700">Ini adalah halaman dashboard CCTV.</p>
    </Layout>
  );
}
