import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ fullname: "", role: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    // Parse user data langsung dari localStorage
    setUser(JSON.parse(userData));                    
  }, [navigate]);

  if (!user.fullname) return <div>Loading...</div>;

  return (
    <Layout>                                      
      <p className="mt-4 text-gray-700">Ini adalah halaman dashboard CCTV</p>
    </Layout>
  );
}
