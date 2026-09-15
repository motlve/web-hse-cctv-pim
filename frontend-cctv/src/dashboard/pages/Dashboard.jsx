import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { FiCamera, FiTool, FiAlertTriangle, FiCheckCircle, FiFilter } from 'react-icons/fi';
import { FaVideo, FaUserShield } from 'react-icons/fa';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

const KONDISI_COLORS = {
  Baik: '#22c55e',
  Rusak: '#ef4444',
  Perbaikan: '#f59e0b',
};

export default function MainDashboard() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);

  const [cctvDistribution, setCctvDistribution] = useState([]);
  const [topDamage, setTopDamage] = useState([]);
  const [topCctvCategory, setTopCctvCategory] = useState([]);
  const [topGslCategory, setTopGslCategory] = useState([]);
  const [completion, setCompletion] = useState({ total: 0, completed: 0, completion_rate: 0 });

  const fetchDashboard = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);

      const res = await api.get(`/dashboard/main?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || {};

      setCctvDistribution(data.cctv_distribution || []);
      setTopDamage(data.top_damage || []);
      setTopCctvCategory(data.top_cctv_category || []);
      setTopGslCategory(data.top_gsl_category || []);
      setCompletion(data.complaint_completion || { total: 0, completed: 0, completion_rate: 0 });
    } catch (err) {
      console.error('Fetch dashboard error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // ==============================
  // CHART DATA
  // ==============================

  const cctvDistributionChart = {
    labels: cctvDistribution.map((item) => item.area),
    datasets: [
      {
        label: 'Jumlah Kamera',
        data: cctvDistribution.map((item) => item.total),
        backgroundColor: '#2563eb',
        borderRadius: 8,
      },
    ],
  };

  const topDamageChart = {
    labels: topDamage.map((item) => item.lokasi),
    datasets: [
      {
        label: 'Laporan Trouble',
        data: topDamage.map((item) => item.total),
        backgroundColor: '#ef4444',
        borderRadius: 8,
      },
    ],
  };

  const cctvCategoryColors = ['#2563eb', '#ef4444', '#22c55e', '#f59e0b', '#9333ea', '#0891b2'];

  const topCctvCategoryChart = {
    labels: topCctvCategory.map((item) => item.category),
    datasets: [
      {
        data: topCctvCategory.map((item) => item.total),
        backgroundColor: topCctvCategory.map(
          (_, i) => cctvCategoryColors[i % cctvCategoryColors.length]
        ),
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const gslCategoryColors = ['#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const topGslCategoryChart = {
    labels: topGslCategory.map((item) => item.category),
    datasets: [
      {
        data: topGslCategory.map((item) => item.total),
        backgroundColor: topGslCategory.map(
          (_, i) => gslCategoryColors[i % gslCategoryColors.length]
        ),
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const completionChart = {
    labels: ['Selesai', 'Belum Selesai'],
    datasets: [
      {
        data: [completion.completed, Math.max(completion.total - completion.completed, 0)],
        backgroundColor: ['#22c55e', '#e5e7eb'],
        borderColor: ['#16a34a', '#d1d5db'],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 16, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total ? ((context.raw / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.raw} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Layout>
      {/* ================= HEADER + FILTER ================= */}
      <section className="p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Utama</h1>
            <p className="text-sm text-slate-500 mt-1">Ringkasan CCTV, insiden, dan komplain GSL</p>
          </div>

          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md rounded-2xl shadow-md border border-white/40 px-4 py-3">
            <FiFilter className="text-slate-400" size={16} />

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Semua Bulan</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-10 text-slate-400 text-sm">Memuat data dashboard...</div>
        )}

        {!loading && (
          <>
            {/* ================= SECTION 1: PENYEBARAN ID CCTV ================= */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 p-6 mb-6">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                    <FaVideo size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Penyebaran ID CCTV per Area</h3>
                    <p className="text-xs text-slate-400">
                      Data inventory — tidak dipengaruhi filter tahun/bulan
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-semibold text-sm">
                  {cctvDistribution.reduce((sum, i) => sum + i.total, 0)} Kamera
                </div>
              </div>

              <div className="h-[220px] sm:h-[260px] md:h-[300px] mt-4">
                <Bar data={cctvDistributionChart} options={barOptions} />
              </div>
            </div>

            {/* ================= SECTION 2 + 3: DAMAGE + CCTV CATEGORY ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                    <FiTool size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Kerusakan Terbanyak</h3>
                </div>

                <div className="h-[220px] sm:h-[250px] md:h-[280px]">
                  {topDamage.length > 0 ? (
                    <Bar data={topDamageChart} options={barOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      Tidak ada data trouble di periode ini
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
                    <FiAlertTriangle size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Kategori Insiden CCTV Terbanyak
                  </h3>
                </div>

                <div className="h-[220px] sm:h-[250px] md:h-[280px] flex justify-center">
                  {topCctvCategory.length > 0 ? (
                    <Doughnut data={topCctvCategoryChart} options={pieOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      Tidak ada data insiden di periode ini
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ================= SECTION 4 + 5: GSL CATEGORY + COMPLETION ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                    <FaUserShield size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Kategori Komplain GSL Terbanyak
                  </h3>
                </div>

                <div className="h-[220px] sm:h-[250px] md:h-[280px] flex justify-center">
                  {topGslCategory.length > 0 ? (
                    <Doughnut data={topGslCategoryChart} options={pieOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      Tidak ada data komplain di periode ini
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-green-100 text-green-600">
                    <FiCheckCircle size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Komplain Selesai</h3>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                    <p className="text-slate-500 text-[10px] font-semibold uppercase">Total</p>
                    <h4 className="text-xl font-bold text-slate-800 mt-1">{completion.total}</h4>
                  </div>
                  <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
                    <p className="text-green-600 text-[10px] font-semibold uppercase">Selesai</p>
                    <h4 className="text-xl font-bold text-green-600 mt-1">{completion.completed}</h4>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                    <p className="text-blue-600 text-[10px] font-semibold uppercase">Rate</p>
                    <h4 className="text-xl font-bold text-blue-600 mt-1">
                      {completion.completion_rate}%
                    </h4>
                  </div>
                </div>

                <div className="h-[150px] sm:h-[160px] md:h-[180px] flex justify-center">
                  <Doughnut data={completionChart} options={{ ...pieOptions, cutout: '65%' }} />
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </Layout>
  );
}
