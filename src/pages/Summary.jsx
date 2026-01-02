import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Bar, Pie } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrasi komponen Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function DashboardSummary() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ fullname: "", role: "" });
  const [incidentList, setIncidentList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
      fetchData(token);
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      const response = await axios.get("http://localhost:8081/api/incident", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Pastikan data yang masuk adalah array
      setIncidentList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC SUMMARY DENGAN FALLBACK SAFE ---
  const summary = useMemo(() => {
    const catCounts = {};
    const locCounts = {};

    // Default structure jika data belum ada
    const defaultData = {
      total: 0,
      categories: { labels: ["No Data"], datasets: [{ data: [0], backgroundColor: ['#cbd5e1'] }] },
      locations: { labels: ["No Data"], datasets: [{ data: [1], backgroundColor: ['#cbd5e1'] }] }
    };

    if (!incidentList || incidentList.length === 0) return defaultData;

    incidentList.forEach((item) => {
      const cat = item.category || "Lainnya";
      const loc = item.location || "Lainnya";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
      locCounts[loc] = (locCounts[loc] || 0) + 1;
    });

    const catLabels = Object.keys(catCounts);
    const locLabels = Object.keys(locCounts);

    return {
      total: incidentList.length,
      categories: {
        labels: catLabels,
        datasets: [{
          label: 'Jumlah Insiden',
          data: Object.values(catCounts),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          borderRadius: 5
        }]
      },
      locations: {
        labels: locLabels,
        datasets: [{
          data: Object.values(locCounts),
          backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
        }]
      }
    };
  }, [incidentList]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <p className="text-slate-500 animate-pulse font-medium">Menyiapkan Ringkasan Data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Ringkasan Operasional</h1>
            <p className="text-slate-500">Pantauan sistem keamanan CCTV unit.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-400">Login sebagai:</p>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
              {user.role || 'Guest'}
            </span>
          </div>
        </div>

        {/* SECTION 1: Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Kasus</p>
            <h2 className="text-4xl font-black text-slate-800 mt-1">{summary.total}</h2>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Kategori Terbanyak</p>
            <h2 className="text-xl font-bold text-blue-600 mt-2 truncate">
              {summary.categories.labels[0] !== "No Data" ? summary.categories.labels[0] : "-"}
            </h2>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Lokasi Rawan</p>
            <h2 className="text-xl font-bold text-red-500 mt-2 truncate">
              {summary.locations.labels[0] !== "No Data" ? summary.locations.labels[0] : "-"}
            </h2>
          </div>
          <div className="bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-200 flex flex-col justify-center cursor-pointer hover:bg-blue-700 transition" onClick={() => navigate("/incident-record")}>
            <div className="text-white font-bold text-sm flex items-center justify-between">
              Input Data Baru <span className="text-xl">→</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Charts Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-800 font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-5 bg-blue-500 rounded-full"></span>
              Tren Insiden per Kategori
            </h3>
            <div className="h-[280px]">
              <Bar
                data={summary.categories}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-800 font-bold mb-6">Sebaran Lokasi</h3>
            <div className="h-[280px] flex items-center justify-center">
              <Pie
                data={summary.locations}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Recent Activity Feed */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Log Kejadian Terakhir</h3>
            <button className="text-xs text-blue-600 font-semibold hover:underline" onClick={() => navigate("/incident-record")}>
              LIHAT SEMUA DATA
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {incidentList.length > 0 ? (
              incidentList.slice(-3).reverse().map((item, i) => (
                <div key={i} className="p-5 flex items-start justify-between hover:bg-slate-50 transition">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                      {item.category === 'Kehilangan' ? '🔍' : '⚠️'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm">{item.descriptionOfIncident || "Tanpa Deskripsi"}</h4>
                      <p className="text-xs text-slate-400 mt-1">{item.location} • {item.nameOfficer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-300 uppercase leading-none">Waktu</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {item.datetimeOfIncident ? new Date(item.datetimeOfIncident).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 text-sm italic">Belum ada data kejadian masuk.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}