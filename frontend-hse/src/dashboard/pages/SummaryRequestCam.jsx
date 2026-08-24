// If you only imported useState and useEffect before — add useRef:
import { useState, useEffect, useRef, useMemo } from 'react';
import Layout from '../components/Layout';
import { Bar, Pie, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import MonitoringCalendar from '../components/Calander';
import api from '../api/axios';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

import {
  FiRadio,
  FiClock,
  FiMapPin,
  FiDatabase,
  FiTrendingUp,
  FiTarget,
  FiZap,
  FiCheck,
  FiArrowRight,
} from 'react-icons/fi';
import { FiX, FiPieChart, FiClipboard, FiBarChart2, FiInbox, FiCalendar } from 'react-icons/fi';
import { FiPlusCircle, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { LuCalendar } from 'react-icons/lu';

import {
  Chart as ChartJS,
  CategoryScale,
  ArcElement,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CostumeDatePicker from '../components/CostumeDatePicker';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

/* Plugin: draw numeric value on each horizontal bar (inside if muat, outside otherwise) */
const drawBarValue = {
  id: 'drawBarValue',
  afterDatasetsDraw: (chart) => {
    const { ctx } = chart;
    if (!chart?.data) return;
    ctx.save();

    chart.data.datasets.forEach((dataset, dsIndex) => {
      const meta = chart.getDatasetMeta(dsIndex);
      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];
        if (value == null) return;

        const barBox = bar;
        const barRight = barBox.x;
        const barLeft = barBox.base ?? barBox.x - barBox.width / 2;
        const barWidth = Math.abs(barRight - barLeft);
        const barY = barBox.y;

        const text = String(Math.round(value));
        ctx.font = '600 12px Inter, Arial, sans-serif';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(text).width;
        const padding = 8;

        if (barWidth > textWidth + padding * 2) {
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, barRight - padding - textWidth, barY);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillText(text, barRight + padding, barY);
        }
      });
    });

    ctx.restore();
  },
};
ChartJS.register(drawBarValue);

/* ===================== KOMPONEN DROPDOWN TAHUN (reusable) ===================== */
function YearDropdown({ selectedYear, yearOptions, onChange, className = 'mb-4' }) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 pl-4 pr-3 py-2.5">
        <FiCalendar className="text-blue-500 shrink-0" size={16} />

        <span className="text-sm font-semibold text-gray-500">Tahun</span>

        <div className="relative">
          <select
            value={selectedYear}
            onChange={onChange}
            className="
              appearance-none
              bg-blue-50
              text-blue-700
              font-bold
              text-sm
              pl-3
              pr-8
              py-1.5
              rounded-xl
              border-none
              outline-none
              cursor-pointer
              hover:bg-blue-100
              transition-colors
              duration-200
              focus:ring-2
              focus:ring-blue-400
            "
          >
            <option value="all">Semua Tahun</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Custom arrow icon */}
          <svg
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function SummaryRequestCam() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [requestCameraList, setRequestCameraList] = useState([]);

  const [locations, setLocations] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const requestCameraHeaderCardRef = useRef(null);
  const requestCameraCalendarCardRef = useRef(null);
  const [showAddRequestCameraBtnText, setShowAddRequestCameraBtnText] = useState(true);
  const [showRequestCameraCalendarText, setShowRequestCameraCalendarText] = useState(true);
  const [showRequestCameraCalendar, setShowRequestCameraCalendar] = useState(false);

  const [selectedYear, setSelectedYear] = useState('all');

  const itemsPerPage = 5;

  // ==============================
  // SUMMARY REQUEST CAMERA PERMISSION
  // ==============================

  const role = localStorage.getItem('role');

  const requestPermission = {
    Admin: { view: true, create: true, update: true, delete: true },
    'Manager HSE': { view: true, create: true, update: true, delete: true },
    'Petugas HSE': { view: true, create: true, update: true, delete: true },
    'Petugas CCTV': { view: true, create: true, update: true, delete: true },
    Guest: { view: true, create: false, update: false, delete: false },
  };

  const access = requestPermission[role] || requestPermission.Guest;

  const canCreate = access.create;
  const canEdit = access.update;
  const canDelete = access.delete;

  const [formData, setFormData] = useState({
    id_camera: '',
    tanggal_request: null,
    lokasi: '',
    lokasi_detail: '',
    tanggal_pemasangan: null,
    status: 'Request',
    progress_days: 0,
    input_database: 'Belum Terinput',
    keterangan: '',
  });

  const fetchRequestCamera = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await api.get('/summary-request-camera', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Request Camera Response:', response.data);

      const data = response.data.data || response.data || [];

      const result = data.map((item) => ({
        id: item.id,
        id_camera: item.id_camera,
        tanggal_request: item.tanggal_request,
        lokasi: item.lokasi,
        lokasi_detail: item.lokasi_detail,
        tanggal_pemasangan: item.tanggal_pemasangan,
        status: item.status,
        progress_days: item.progress_days,
        input_database: item.input_database,
        keterangan: item.keterangan,
      }));

      setRequestCameraList(result);
    } catch (err) {
      console.error('Error fetch request camera:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/dashboard/login';
      }
    }
  };

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get(`/location`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    }
  };

  // --- Function to Fetch Dropdown Data ---
  const fetchDataForDropdowns = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token not found for dropdowns.');
      return;
    }

    try {
      const [locationsRes] = await Promise.all([
        api.get(`/location`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);

      if (locationsRes.data.length > 0) {
        console.log(
          "Example Location Data (check casing of 'id' and 'name'):",
          locationsRes.data[0]
        );
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      alert('Failed to retrieve dropdown data: ' + error.message);
    }
  };

  useEffect(() => {
    fetchRequestCamera();
    fetchLocations();
    fetchDataForDropdowns();
  }, []);

  // ================= RESPONSIVE HEADER & CALENDAR BUTTON =================
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === requestCameraHeaderCardRef.current) {
          setShowAddRequestCameraBtnText(width > 260);
        }
        if (entry.target === requestCameraCalendarCardRef.current) {
          setShowRequestCameraCalendarText(width > 260);
        }
      }
    });

    if (requestCameraHeaderCardRef.current) observer.observe(requestCameraHeaderCardRef.current);
    if (requestCameraCalendarCardRef.current)
      observer.observe(requestCameraCalendarCardRef.current);

    return () => observer.disconnect();
  }, []);

  // --- Form Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id_camera || !formData.tanggal_request || !formData.lokasi) {
      alert('Lengkapi data yang wajib diisi.');
      return;
    }

    try {
      const payload = {
        id_camera: formData.id_camera,
        tanggal_request: new Date(formData.tanggal_request).toISOString(),
        lokasi: formData.lokasi,
        lokasi_detail: formData.lokasi_detail || '',
        tanggal_pemasangan: formData.tanggal_pemasangan
          ? new Date(formData.tanggal_pemasangan).toISOString()
          : null,
        keterangan: formData.keterangan || '',
      };

      const url = isEditing ? `/summary-request-camera/${editId}` : `/summary-request-camera`;
      const method = isEditing ? 'PUT' : 'POST';

      await api({ method, url, data: payload });

      alert(isEditing ? 'Data berhasil diperbarui.' : 'Data berhasil disimpan.');

      fetchRequestCamera();

      setShowForm(false);
      setIsEditing(false);
      setEditId(null);

      setFormData({
        id_camera: '',
        tanggal_request: null,
        lokasi: '',
        lokasi_detail: '',
        tanggal_pemasangan: null,
        status: 'Request',
        progress_days: 0,
        input_database: 'Belum Terinput',
        keterangan: '',
      });
    } catch (err) {
      console.error('Error Submit Summary Request Camera:', err);
      alert(err.response?.data?.message || 'Gagal menyimpan data.');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id_camera: item.id_camera || '',
      tanggal_request: item.tanggal_request ? new Date(item.tanggal_request) : null,
      lokasi: item.lokasi || '',
      lokasi_detail: item.lokasi_detail || '',
      tanggal_pemasangan:
        item.tanggal_pemasangan && item.tanggal_pemasangan !== '0001-01-01T00:00:00Z'
          ? new Date(item.tanggal_pemasangan)
          : null,
      keterangan: item.keterangan || '',
    });

    setShowForm(true);
    setIsEditing(true);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;

    try {
      const token = localStorage.getItem('token');

      await api.delete(`/summary-request-camera/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Data berhasil dihapus.');

      fetchRequestCamera();
    } catch (err) {
      console.error('Delete Error:', err);
      alert(err.response?.data?.message || 'Gagal menghapus data.');
    }
  };

  // =====================================
  // YEAR OPTIONS (dari data asli, dinamis)
  // =====================================
  const yearOptions = useMemo(() => {
    const years = requestCameraList
      .map((item) => {
        const date = new Date(item.tanggal_request);
        return !isNaN(date) ? date.getFullYear() : null;
      })
      .filter((year) => year !== null);

    return [...new Set(years)].sort((a, b) => b - a);
  }, [requestCameraList]);

  // Handler dropdown tahun (dipakai di semua modal & toolbar tabel)
  const handleYearChange = (e) => {
    const value = e.target.value;
    setSelectedYear(value === 'all' ? 'all' : Number(value));
    setCurrentPage(1);
  };

  // =====================================
  // DATA UNTUK TABEL - filter Tahun + Search
  // =====================================
  const filteredRequestCamera = requestCameraList.filter((item) => {
    const search = searchTerm.toLowerCase();

    const requestYear = item.tanggal_request ? new Date(item.tanggal_request).getFullYear() : null;

    const matchYear = selectedYear === 'all' || requestYear === selectedYear;

    const matchSearch =
      search === '' ||
      item.id_camera?.toLowerCase().includes(search) ||
      item.lokasi?.toLowerCase().includes(search) ||
      item.lokasi_detail?.toLowerCase().includes(search) ||
      item.status?.toLowerCase().includes(search) ||
      item.input_database?.toLowerCase().includes(search) ||
      item.keterangan?.toLowerCase().includes(search);

    return matchYear && matchSearch;
  });

  // =====================================
  // DATA UNTUK CHART/ANALISIS - hanya filter Tahun (tidak ikut search tabel)
  // =====================================
  const yearFilteredRequestCamera = useMemo(() => {
    return requestCameraList.filter((item) => {
      const requestYear = item.tanggal_request
        ? new Date(item.tanggal_request).getFullYear()
        : null;
      return selectedYear === 'all' || requestYear === selectedYear;
    });
  }, [requestCameraList, selectedYear]);

  const pageCountRequest = Math.ceil(filteredRequestCamera.length / itemsPerPage);

  const paginatedRequestCamera = filteredRequestCamera.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, padding: 20 },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const data = context.dataset.data;
            const total = data.reduce((sum, item) => sum + item, 0);
            const percentage = total ? ((context.raw / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.raw} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: '#fff',
        font: { weight: 'bold', size: 14 },
        formatter: (value, context) => {
          const total = context.chart.data.datasets[0].data.reduce((sum, item) => sum + item, 0);
          return total ? `${((value / total) * 100).toFixed(1)}%` : '0%';
        },
      },
    },
  };

  // =====================================
  // Modal Analysis
  // =====================================
  const [showRequestStatus, setShowRequestStatus] = useState(false);
  const [showProgressAnalysis, setShowProgressAnalysis] = useState(false);
  const [showLocationAnalysis, setShowLocationAnalysis] = useState(false);
  const [showInputDatabaseAnalysis, setShowInputDatabaseAnalysis] = useState(false);
  const [showDashboardSummary, setShowDashboardSummary] = useState(false);

  // =====================================
  // Request Camera By Location Analysis
  // =====================================
  const getRequestCameraByLocationAnalysis = () => {
    const map = {};

    yearFilteredRequestCamera.forEach((item) => {
      const location = item.lokasi?.trim() || 'Tidak diketahui';
      map[location] = (map[location] || 0) + 1;
    });

    const ranking = Object.entries(map)
      .map(([location, total]) => ({ location, total }))
      .sort((a, b) => b.total - a.total);

    const totalRequest = yearFilteredRequestCamera.length;

    const average = ranking.length === 0 ? 0 : Number((totalRequest / ranking.length).toFixed(2));

    const highest = ranking[0] || { location: '-', total: 0 };

    return {
      totalLocation: ranking.length,
      totalRequest,
      average,
      highest,
      ranking,
      top10: ranking.slice(0, 10),
      insight: [
        `Total lokasi CCTV sebanyak ${ranking.length}.`,
        `Total permintaan CCTV sebanyak ${totalRequest}.`,
        highest.location !== '-'
          ? `${highest.location} memiliki jumlah permintaan CCTV terbanyak (${highest.total} request).`
          : 'Belum terdapat data permintaan CCTV.',
      ],
      recommendation: [
        'Prioritaskan pemasangan CCTV pada lokasi dengan permintaan tertinggi.',
        'Evaluasi kebutuhan CCTV berdasarkan tingkat permintaan setiap lokasi.',
        'Pastikan proses pemasangan dilakukan sesuai prioritas.',
        'Lakukan monitoring terhadap lokasi yang belum mendapatkan pemasangan.',
      ],
    };
  };

  // =====================================
  // Request Camera By Location Chart
  // =====================================
  const getRequestCameraByLocationChart = () => {
    const analysis = getRequestCameraByLocationAnalysis();

    const colors = [
      '#2563eb',
      '#ef4444',
      '#22c55e',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16',
    ];

    return {
      labels: analysis.top10.map((item) => item.location),
      datasets: [
        {
          label: 'Jumlah Request',
          data: analysis.top10.map((item) => item.total),
          borderColor: analysis.top10.map((_, index) => colors[index % colors.length]),
          backgroundColor: analysis.top10.map((_, index) => `${colors[index % colors.length]}33`),
          pointBackgroundColor: analysis.top10.map((_, index) => colors[index % colors.length]),
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const requestLocationAnalysis = getRequestCameraByLocationAnalysis();
  const requestLocationChart = getRequestCameraByLocationChart();

  // =====================================
  // Request Status Analysis
  // =====================================
  const getRequestStatusAnalysis = () => {
    const map = { Success: 0, Request: 0 };

    let totalRequest = yearFilteredRequestCamera.length;

    yearFilteredRequestCamera.forEach((item) => {
      const status = item.status?.trim().toLowerCase();
      if (status === 'success') {
        map.Success++;
      } else if (status === 'request') {
        map.Request++;
      }
    });

    const ranking = Object.entries(map)
      .map(([status, total]) => ({ status, total }))
      .sort((a, b) => b.total - a.total);

    const success = map.Success;
    const request = map.Request;

    const successRate = totalRequest ? Number(((success / totalRequest) * 100).toFixed(2)) : 0;
    const requestRate = totalRequest ? Number(((request / totalRequest) * 100).toFixed(2)) : 0;

    const highest = ranking[0] || { status: '-', total: 0 };

    return {
      totalStatus: ranking.length,
      totalRequest,
      success,
      request,
      successRate,
      requestRate,
      highest,
      ranking,
      insight: [
        `Total request CCTV sebanyak ${totalRequest}.`,
        `${success} CCTV sudah berhasil dipasang (${successRate}%).`,
        `${request} CCTV masih dalam proses request (${requestRate}%).`,
        `Status dominan adalah ${highest.status} dengan ${highest.total} data.`,
      ],
      recommendation:
        request > 0
          ? [
              'Prioritaskan pemasangan CCTV yang masih berstatus Request.',
              'Evaluasi hambatan instalasi CCTV.',
              'Monitor progress pemasangan secara berkala.',
              'Update database setelah CCTV selesai dipasang.',
            ]
          : ['Seluruh request CCTV telah selesai.', 'Pertahankan monitoring instalasi CCTV.'],
    };
  };

  // =====================================
  // Request Status Chart
  // =====================================
  const getRequestStatusChart = () => {
    const analysis = getRequestStatusAnalysis();

    return {
      labels: analysis.ranking.map((item) => item.status),
      datasets: [
        {
          data: analysis.ranking.map((item) => item.total),
          backgroundColor: ['#22c55e', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  };

  const requestStatusAnalysis = getRequestStatusAnalysis();
  const requestStatusChart = getRequestStatusChart();

  // =====================================
  // Progress Installation Analysis
  // =====================================
  const getProgressAnalysis = () => {
    const bucket = {
      '0-3 Hari': 0,
      '4-7 Hari': 0,
      '8-14 Hari': 0,
      '>14 Hari': 0,
    };

    let totalDays = 0;
    let count = 0;

    yearFilteredRequestCamera.forEach((item) => {
      const days = Number(item.progress_days || 0);

      totalDays += days;
      count++;

      if (days <= 3) {
        bucket['0-3 Hari']++;
      } else if (days <= 7) {
        bucket['4-7 Hari']++;
      } else if (days <= 14) {
        bucket['8-14 Hari']++;
      } else {
        bucket['>14 Hari']++;
      }
    });

    const average = count ? Number((totalDays / count).toFixed(1)) : 0;

    const ranking = Object.entries(bucket).map(([range, total]) => ({ range, total }));

    const longest = Math.max(
      ...yearFilteredRequestCamera.map((x) => Number(x.progress_days || 0)),
      0
    );

    return {
      average,
      longest,
      ranking,
      insight: [
        `Rata-rata pemasangan CCTV membutuhkan ${average} hari.`,
        `Durasi pemasangan terlama adalah ${longest} hari.`,
      ],
      recommendation:
        average > 14
          ? [
              'Percepat proses pemasangan CCTV.',
              'Evaluasi penyebab keterlambatan pemasangan.',
              'Prioritaskan request yang telah lama menunggu.',
            ]
          : ['Progress pemasangan sudah cukup baik.', 'Pertahankan SLA pemasangan CCTV.'],
    };
  };

  // =====================================
  // Progress Installation Chart
  // =====================================
  const getProgressChart = () => {
    const analysis = getProgressAnalysis();

    return {
      labels: analysis.ranking.map((item) => item.range),
      datasets: [
        {
          label: 'Jumlah CCTV',
          data: analysis.ranking.map((item) => item.total),
          backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
          borderRadius: 8,
        },
      ],
    };
  };

  const progressAnalysis = getProgressAnalysis();
  const progressChart = getProgressChart();

  // =====================================
  // Input Database Analysis
  // =====================================
  const getInputDatabaseAnalysis = () => {
    const input = yearFilteredRequestCamera.filter(
      (item) => item.input_database === 'Terinput'
    ).length;

    const notInput = yearFilteredRequestCamera.filter(
      (item) => item.input_database === 'Belum Terinput'
    ).length;

    const totalRequest = yearFilteredRequestCamera.length;

    const inputRate = totalRequest ? Number(((input / totalRequest) * 100).toFixed(1)) : 0;

    return {
      totalRequest,
      input,
      notInput,
      inputRate,
      insight: [
        `${input} data sudah masuk ke database CCTV.`,
        `${notInput} data masih belum terinput.`,
        `${inputRate}% request telah berhasil disinkronkan.`,
      ],
      recommendation:
        notInput > 0
          ? [
              'Segera input seluruh request yang belum masuk database.',
              'Pastikan ID Camera telah dibuat sebelum pemasangan.',
              'Lakukan sinkronisasi database setiap hari.',
            ]
          : ['Seluruh request telah tersinkronisasi.', 'Pertahankan konsistensi input data CCTV.'],
    };
  };

  // =====================================
  // Input Database Chart
  // =====================================
  const getInputDatabaseChart = () => {
    const analysis = getInputDatabaseAnalysis();

    return {
      labels: ['Terinput', 'Belum Terinput'],
      datasets: [
        {
          data: [analysis.input, analysis.notInput],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  };

  const inputDatabaseAnalysis = getInputDatabaseAnalysis();
  const inputDatabaseChart = getInputDatabaseChart();

  return (
    <Layout>
      {/* ================= DASHBOARD ANALYTICS ================= */}
      <section className="p-6 mt-4">
        <Swiper
          modules={[Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          pagination={{ clickable: true }}
          loop={true}
          className="incident-swiper"
        >
          {/* SLIDE 1 */}
          <SwiperSlide>
            <div onClick={() => setShowRequestStatus(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-green-600 text-[11px] font-semibold">
                      Analitik Request
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 text-green-600 shrink-0">
                        <FiRadio size={17} />
                      </span>
                      Ringkasan Status Request
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Monitoring status pemasangan CCTV berdasarkan Request dan Success
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Request
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {requestStatusAnalysis.totalRequest}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Berhasil
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {requestStatusAnalysis.success}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                    <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                      Tertunda
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-amber-600 mt-2 tabular-nums">
                      {requestStatusAnalysis.request}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Tingkat Keberhasilan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {requestStatusAnalysis.successRate}%
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Distribusi Status Request
                  </h3>

                  <div className="h-[280px] md:h-[320px] flex justify-center items-center">
                    <Pie data={requestStatusChart} options={pieOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Status Dominan</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {requestStatusAnalysis.highest.status} ({requestStatusAnalysis.highest.total}{' '}
                      CCTV)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-green-600 transition-colors duration-300">
                    Lihat Laporan
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* SLIDE PROGRES */}
          <SwiperSlide>
            <div
              onClick={() => setShowProgressAnalysis(true)}
              className="
    group
    cursor-pointer
    relative
    overflow-hidden
    rounded-[36px]
    bg-white/70
    backdrop-blur-3xl
    border border-white/40
    shadow-[0_25px_70px_rgba(15,23,42,.08)]
    hover:-translate-y-2
    hover:shadow-[0_40px_90px_rgba(245,158,11,.18)]
    duration-500
    p-10
    "
            >
              <div className="absolute -left-20 bottom-0 w-72 h-72 bg-yellow-300/20 blur-[120px]" />

              <div className="relative flex justify-between">
                <div>
                  <p className="uppercase tracking-[5px] text-yellow-600 font-semibold text-xs">
                    ANALITIK PEMASANGAN
                  </p>

                  <h2 className="text-4xl font-semibold mt-2">Progres Pemasangan</h2>

                  <p className="text-gray-500 mt-3">
                    Analisis durasi pemasangan CCTV berdasarkan Progress Days.
                  </p>
                </div>

                <div className="w-20 h-20 rounded-3xl bg-yellow-100 flex items-center justify-center text-4xl text-yellow-600">
                  <FiClock />
                </div>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-3 gap-6 mt-10">
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Rata-rata</p>
                  <h2 className="text-5xl font-bold">{progressAnalysis.average}</h2>
                  <p className="text-gray-500 mt-2">Hari</p>
                </div>

                <div className="bg-red-50 rounded-3xl p-6">
                  <p className="text-sm text-red-500">Terlama</p>
                  <h2 className="text-5xl font-bold text-red-600">{progressAnalysis.longest}</h2>
                  <p className="text-red-500 mt-2">Hari</p>
                </div>

                <div className="bg-green-50 rounded-3xl p-6">
                  <p className="text-sm text-green-600">Distribusi</p>
                  <h2 className="text-2xl font-bold">{progressAnalysis.ranking.length}</h2>
                  <p className="text-green-600 mt-2">Kategori</p>
                </div>
              </div>

              {/* Chart */}
              <div className="mt-8 bg-white rounded-[32px] border shadow-inner p-8">
                <div className="h-[350px]">
                  <Bar data={progressChart} options={lineChartOptions} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-8">
                <div>
                  <p className="font-semibold text-gray-800">Rata-rata Pemasangan</p>
                  <p className="text-gray-500">{progressAnalysis.average} hari</p>
                </div>

                <div
                  className="
        px-6
        py-3
        rounded-full
        bg-yellow-500
        text-white
        inline-flex
        items-center
        gap-2
        group-hover:scale-105
        duration-300
        "
                >
                  Lihat Laporan <FiArrowRight />
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* SLIDE LOKASI */}
          <SwiperSlide>
            <div onClick={() => setShowLocationAnalysis(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-sky-600 text-[11px] font-semibold">
                      Analitik Lokasi
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 text-sky-600 shrink-0">
                        <FiMapPin size={17} />
                      </span>
                      Request per Lokasi
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Distribusi permintaan pemasangan CCTV berdasarkan lokasi
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Request
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {requestLocationAnalysis.totalRequest}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                    <p className="text-red-700 text-[11px] font-semibold uppercase tracking-wide">
                      Lokasi Tertinggi
                    </p>
                    <h3 className="text-lg md:text-xl font-bold text-red-600 mt-2 truncate">
                      {requestLocationAnalysis.highest.location}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kontribusi
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {requestLocationAnalysis.totalRequest
                        ? (
                            (requestLocationAnalysis.highest.total /
                              requestLocationAnalysis.totalRequest) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Distribusi Request per Lokasi
                  </h3>

                  <div className="h-[280px] md:h-[320px]">
                    <Bar
                      data={requestLocationChart}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                      }}
                    />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Lokasi Terbanyak</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {requestLocationAnalysis.highest.location} (
                      {requestLocationAnalysis.highest.total} CCTV)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-sky-600 transition-colors duration-300">
                    Lihat Laporan
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* SLIDE INPUT DATABASE */}
          <SwiperSlide>
            <div
              onClick={() => setShowInputDatabaseAnalysis(true)}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-emerald-600 text-[11px] font-semibold">
                      Analitik Database
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                        <FiDatabase size={17} />
                      </span>
                      Input Database
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Sinkronisasi data request CCTV dengan database master CCTV
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Request
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {inputDatabaseAnalysis.totalRequest}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Terinput
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {inputDatabaseAnalysis.input}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                    <p className="text-red-700 text-[11px] font-semibold uppercase tracking-wide">
                      Belum
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-red-600 mt-2 tabular-nums">
                      {inputDatabaseAnalysis.notInput}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                    <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                      Tingkat Input
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-emerald-600 mt-2 tabular-nums">
                      {inputDatabaseAnalysis.inputRate}%
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Distribusi Status Input
                  </h3>

                  <div className="h-[280px] md:h-[320px] flex justify-center items-center">
                    <Pie data={inputDatabaseChart} options={pieOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Sinkronisasi Database</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {inputDatabaseAnalysis.inputRate}% data telah terinput
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-emerald-600 transition-colors duration-300">
                    Lihat Laporan
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* SLIDE DASHBOARD */}
          <SwiperSlide>
            <div onClick={() => setShowDashboardSummary(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-indigo-600 text-[11px] font-semibold">
                      Dashboard Eksekutif
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                        <FiTrendingUp size={17} />
                      </span>
                      Ringkasan Request CCTV
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Ringkasan keseluruhan performa permintaan pemasangan CCTV
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Request
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {requestStatusAnalysis.totalRequest}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Berhasil
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {requestStatusAnalysis.success}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                    <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                      Request
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-amber-600 mt-2 tabular-nums">
                      {requestStatusAnalysis.request}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Sinkronisasi Database
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {inputDatabaseAnalysis.inputRate}%
                    </h3>
                  </div>
                </div>

                {/* INSIGHT + REKOMENDASI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl border border-slate-100 p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                      <FiTarget size={15} /> Wawasan Eksekutif
                    </h3>

                    <ul className="space-y-2.5 text-sm text-slate-600">
                      <li>
                        • Total permintaan CCTV sebanyak{' '}
                        <b className="text-slate-800">{requestStatusAnalysis.totalRequest}</b>.
                      </li>
                      <li>
                        • Tingkat keberhasilan pemasangan mencapai{' '}
                        <b className="text-slate-800">{requestStatusAnalysis.successRate}%</b>.
                      </li>
                      <li>
                        • Lokasi dengan request terbanyak adalah{' '}
                        <b className="text-slate-800">{requestLocationAnalysis.highest.location}</b>
                        .
                      </li>
                      <li>
                        • Rata-rata pemasangan membutuhkan{' '}
                        <b className="text-slate-800">{progressAnalysis.average}</b> hari.
                      </li>
                      <li>
                        • Sinkronisasi database mencapai{' '}
                        <b className="text-slate-800">{inputDatabaseAnalysis.inputRate}%</b>.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-xl bg-slate-900 text-white p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide mb-4">
                      <FiZap size={15} /> Rekomendasi
                    </h3>

                    <ul className="space-y-3 text-sm">
                      {requestStatusAnalysis.recommendation.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <FiCheck className="mt-0.5 shrink-0" size={14} /> {item}
                        </li>
                      ))}

                      {inputDatabaseAnalysis.notInput > 0 && (
                        <li className="flex items-start gap-2">
                          <FiCheck className="mt-0.5 shrink-0" size={14} /> Sinkronkan seluruh
                          request yang belum masuk ke database CCTV.
                        </li>
                      )}

                      {progressAnalysis.average > 7 && (
                        <li className="flex items-start gap-2">
                          <FiCheck className="mt-0.5 shrink-0" size={14} /> Kurangi waktu pemasangan
                          agar SLA tetap tercapai.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-end items-center gap-3 pt-1">
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-indigo-600 transition-colors duration-300">
                    Lihat Laporan Eksekutif
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        {/* ============================================================
            MODAL: STATUS REQUEST
        ============================================================ */}
        {showRequestStatus && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowRequestStatus(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-emerald-600 text-[11px] font-semibold">
                    Analitik Status Request
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600">
                      <FiRadio size={17} />
                    </span>
                    Analisis Status Request CCTV
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis status pemasangan CCTV berdasarkan request dan success.
                  </p>
                </div>

                <button
                  onClick={() => setShowRequestStatus(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* DROPDOWN TAHUN */}
              <div className="mb-5">
                <YearDropdown
                  selectedYear={selectedYear}
                  yearOptions={yearOptions}
                  onChange={handleYearChange}
                />
              </div>

              {/* RINGKASAN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Request
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {requestStatusAnalysis.totalRequest}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    Berhasil
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {requestStatusAnalysis.success}
                  </h2>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                  <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    Menunggu Request
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {requestStatusAnalysis.request}
                  </h2>
                </div>

                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-5">
                  <p className="text-indigo-700 text-[11px] font-semibold uppercase tracking-wide">
                    Tingkat Keberhasilan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-indigo-600 mt-3 tabular-nums">
                    {requestStatusAnalysis.successRate}%
                  </h2>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-5 flex items-center gap-2">
                  <FiPieChart size={15} className="text-emerald-500" />
                  Distribusi Status
                </h3>

                <div className="h-[320px] md:h-[380px] flex justify-center">
                  <Pie data={requestStatusChart} options={pieOptions} />
                </div>
              </div>

              {/* TABEL STATUS */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiClipboard size={15} className="text-slate-400" />
                  Peringkat Status Request CCTV
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">Status</th>
                        <th className="p-3.5 text-left font-semibold">Jumlah CCTV</th>
                        <th className="p-3.5 text-left font-semibold">Kontribusi</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {requestStatusAnalysis.ranking.map((item, index) => (
                        <tr key={item.status} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.status}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.total}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {requestStatusAnalysis.totalRequest
                              ? ((item.total / requestStatusAnalysis.totalRequest) * 100).toFixed(1)
                              : 0}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSIGHT + REKOMENDASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Wawasan
                  </h3>

                  <div className="space-y-2.5">
                    {requestStatusAnalysis.insight.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-4 flex items-center gap-2">
                    <FiZap size={15} />
                    Rekomendasi
                  </h3>

                  <div className="space-y-2.5">
                    {requestStatusAnalysis.recommendation.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
                      >
                        <FiCheck className="mt-0.5 text-blue-600 shrink-0" size={14} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL: LOKASI
        ============================================================ */}
        {showLocationAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowLocationAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-sky-600 text-[11px] font-semibold">
                    Analitik Lokasi
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 text-sky-600">
                      <FiMapPin size={17} />
                    </span>
                    Request per Lokasi
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis distribusi permintaan pemasangan CCTV berdasarkan lokasi.
                  </p>
                </div>

                <button
                  onClick={() => setShowLocationAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* DROPDOWN TAHUN */}
              <div className="mb-5">
                <YearDropdown
                  selectedYear={selectedYear}
                  yearOptions={yearOptions}
                  onChange={handleYearChange}
                />
              </div>

              {/* RINGKASAN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Lokasi
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {requestLocationAnalysis.totalLocation}
                  </h2>
                </div>

                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-5">
                  <p className="text-indigo-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Request
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-indigo-600 mt-3 tabular-nums">
                    {requestLocationAnalysis.totalRequest}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    Lokasi Tertinggi
                  </p>
                  <h2 className="text-lg md:text-xl font-bold text-emerald-600 mt-3 truncate">
                    {requestLocationAnalysis.highest.location}
                  </h2>
                </div>

                <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-5">
                  <p className="text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                    Kontribusi
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-orange-600 mt-3 tabular-nums">
                    {requestLocationAnalysis.totalRequest
                      ? (
                          (requestLocationAnalysis.highest.total /
                            requestLocationAnalysis.totalRequest) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </h2>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <div className="h-[360px] md:h-[420px]">
                  <Bar
                    data={requestLocationChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { color: '#f1f5f9' } },
                        y: { grid: { display: false } },
                      },
                    }}
                  />
                </div>
              </div>

              {/* RANKING */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiBarChart2 size={15} className="text-slate-400" />
                  Lokasi Request Terbanyak
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">Lokasi</th>
                        <th className="p-3.5 text-left font-semibold">Total Request</th>
                        <th className="p-3.5 text-left font-semibold">Kontribusi</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {requestLocationAnalysis.ranking.map((item, index) => (
                        <tr key={item.location} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.location}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.total}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {requestLocationAnalysis.totalRequest
                              ? ((item.total / requestLocationAnalysis.totalRequest) * 100).toFixed(
                                  1
                                )
                              : 0}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSIGHT + REKOMENDASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Wawasan
                  </h3>

                  <div className="space-y-2.5">
                    {requestLocationAnalysis.insight.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-sky-100/60"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                    <FiZap size={15} />
                    Rekomendasi
                  </h3>

                  <div className="space-y-2.5">
                    {requestLocationAnalysis.recommendation.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60"
                      >
                        <FiCheck className="mt-0.5 text-emerald-600 shrink-0" size={14} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL: PROGRESS
        ============================================================ */}
        {showProgressAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowProgressAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-amber-600 text-[11px] font-semibold">
                    Analitik Pemasangan
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50 text-amber-600">
                      <FiClock size={17} />
                    </span>
                    Progres Pemasangan
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis durasi pemasangan CCTV berdasarkan Progress Days.
                  </p>
                </div>

                <button
                  onClick={() => setShowProgressAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* DROPDOWN TAHUN */}
              <div className="mb-5">
                <YearDropdown
                  selectedYear={selectedYear}
                  yearOptions={yearOptions}
                  onChange={handleYearChange}
                />
              </div>

              {/* RINGKASAN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Rata-rata
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {progressAnalysis.average}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Hari</p>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    Terlama
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {progressAnalysis.longest}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Hari</p>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Request
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {requestStatusAnalysis.totalRequest}
                  </h2>
                </div>

                <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-5">
                  <p className="text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                    SLA
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold text-orange-600 mt-3">
                    {progressAnalysis.average <= 7 ? 'BAIK' : 'PERINGATAN'}
                  </h2>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <div className="h-[360px] md:h-[420px]">
                  <Bar data={progressChart} options={lineChartOptions} />
                </div>
              </div>

              {/* DISTRIBUSI */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiBarChart2 size={15} className="text-slate-400" />
                  Distribusi Progres
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">Range</th>
                        <th className="p-3.5 text-left font-semibold">Total CCTV</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {progressAnalysis.ranking.map((item, index) => (
                        <tr key={item.range} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.range}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSIGHT + REKOMENDASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Wawasan
                  </h3>

                  <div className="space-y-2.5">
                    {progressAnalysis.insight.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                    <FiZap size={15} />
                    Rekomendasi
                  </h3>

                  <div className="space-y-2.5">
                    {progressAnalysis.recommendation.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60"
                      >
                        <FiCheck className="mt-0.5 text-emerald-600 shrink-0" size={14} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL: INPUT DATABASE
        ============================================================ */}
        {showInputDatabaseAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowInputDatabaseAnalysis(false)}
          >
            <div
              className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-emerald-600 text-[11px] font-semibold">
                    Analisis Database
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600">
                      <FiDatabase size={17} />
                    </span>
                    Integrasi Database CCTV
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis kesesuaian data request CCTV dengan master ID CCTV.
                  </p>
                </div>

                <button
                  onClick={() => setShowInputDatabaseAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* DROPDOWN TAHUN */}
              <div className="mb-5">
                <YearDropdown
                  selectedYear={selectedYear}
                  yearOptions={yearOptions}
                  onChange={handleYearChange}
                />
              </div>

              {/* RINGKASAN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Request
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {inputDatabaseAnalysis.totalRequest}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    Terinput
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {inputDatabaseAnalysis.input}
                  </h2>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    Belum Input
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {inputDatabaseAnalysis.notInput}
                  </h2>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                  <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    Tingkat Database
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {inputDatabaseAnalysis.inputRate}%
                  </h2>
                </div>
              </div>

              {/* TABEL */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiClipboard size={15} className="text-slate-400" />
                  Detail Sinkronisasi
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">ID Camera</th>
                        <th className="p-3.5 text-left font-semibold">Lokasi</th>
                        <th className="p-3.5 text-left font-semibold">Status Database</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {yearFilteredRequestCamera.map((item, index) => (
                        <tr
                          key={item.id_camera || index}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.id_camera}</td>
                          <td className="p-3.5 text-slate-600">{item.lokasi}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                item.input_database === 'Terinput'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-rose-100 text-rose-600'
                              }`}
                            >
                              {item.input_database}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSIGHT + REKOMENDASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Wawasan
                  </h3>

                  <div className="space-y-2.5">
                    {inputDatabaseAnalysis.insight.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                    <FiZap size={15} />
                    Rekomendasi
                  </h3>

                  <div className="space-y-2.5">
                    {inputDatabaseAnalysis.recommendation.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60"
                      >
                        <FiCheck className="mt-0.5 text-emerald-600 shrink-0" size={14} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL: DASHBOARD RINGKASAN
        ============================================================ */}
        {showDashboardSummary && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowDashboardSummary(false)}
          >
            <div
              className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-indigo-600 text-[11px] font-semibold">
                    Ringkasan Eksekutif
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600">
                      <FiTrendingUp size={17} />
                    </span>
                    Ringkasan Eksekutif CCTV
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Dashboard monitoring performa request CCTV.
                  </p>
                </div>

                <button
                  onClick={() => setShowDashboardSummary(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* DROPDOWN TAHUN */}
              <div className="mb-5">
                <YearDropdown
                  selectedYear={selectedYear}
                  yearOptions={yearOptions}
                  onChange={handleYearChange}
                />
              </div>

              {/* RINGKASAN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Request
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {yearFilteredRequestCamera.length}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    Selesai
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {requestStatusAnalysis.success}
                  </h2>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    Tertunda
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {requestStatusAnalysis.request}
                  </h2>
                </div>
              </div>

              {/* WAWASAN MANAJEMEN */}
              <div className="rounded-xl bg-violet-50/60 border border-violet-100 p-6 mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-700 mb-4 flex items-center gap-2">
                  <FiTarget size={15} />
                  Wawasan Manajemen
                </h3>

                <div className="space-y-2.5">
                  <div className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-violet-100/60">
                    Lokasi prioritas:{' '}
                    <b className="text-slate-800">{requestLocationAnalysis.highest.location}</b>
                  </div>

                  <div className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-violet-100/60">
                    Rata-rata pemasangan:{' '}
                    <b className="text-slate-800">{progressAnalysis.average} hari</b>
                  </div>

                  <div className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-violet-100/60">
                    Database CCTV sudah sinkron:{' '}
                    <b className="text-slate-800">{inputDatabaseAnalysis.inputRate}%</b>
                  </div>

                  <div className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-violet-100/60">
                    Status request dominan:{' '}
                    <b className="text-slate-800">{requestStatusAnalysis.highest.status}</b>
                  </div>
                </div>
              </div>

              {/* REKOMENDASI AKHIR */}
              <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                  <FiZap size={15} />
                  Rekomendasi Akhir
                </h3>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60">
                    <FiCheck className="mt-0.5 text-emerald-600 shrink-0" size={14} />
                    Prioritaskan request CCTV yang belum terpasang.
                  </div>

                  <div className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60">
                    <FiCheck className="mt-0.5 text-emerald-600 shrink-0" size={14} />
                    Pastikan seluruh CCTV baru masuk master database.
                  </div>

                  <div className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60">
                    <FiCheck className="mt-0.5 text-emerald-600 shrink-0" size={14} />
                    Monitoring lokasi dengan request tertinggi.
                  </div>

                  <div className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60">
                    <FiCheck className="mt-0.5 text-emerald-600 shrink-0" size={14} />
                    Evaluasi SLA pemasangan CCTV berkala.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =====================================
    Manajemen Request Camera
===================================== */}

      <section className="p-3 md:p-6">
        {/* HEADER CARD */}
        <div
          ref={requestCameraHeaderCardRef}
          className="
                           w-full
                           max-w-sm
                           bg-white
                           rounded-2xl md:rounded-[28px]
                           shadow-[0_15px_40px_rgba(0,0,0,.08)]
                           px-4 md:px-5
                           py-4 md:py-5
                           flex
                           flex-wrap
                           gap-3
                           justify-between
                           items-center
                         "
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <FiClock size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 truncate">
                Manajemen Trouble Camera
              </h2>

              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Monitoring gangguan & perbaikan CCTV
              </p>
            </div>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                setShowForm(true);
                setIsEditing(false);
              }}
              title="Tambah Trouble Camera"
              className={`
                               group
                               flex
                               items-center
                               justify-center
                               gap-2
                               rounded-full
                               bg-gradient-to-br
                               from-blue-500
                               to-indigo-600
                               text-white
                               text-xs
                               font-semibold
                               shadow-[0_10px_25px_rgba(37,99,235,.35)]
                               hover:scale-105
                               transition-all
                               duration-300
                               shrink-0
                               ${showAddRequestCameraBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                             `}
            >
              <FiInbox size={20} className="shrink-0" />

              {showAddRequestCameraBtnText && (
                <span className="whitespace-nowrap">
                  Tambah
                  <br />
                  Durasi
                </span>
              )}
            </button>
          )}
        </div>

        {/* MONITORING CALENDAR */}
        <div
          ref={requestCameraCalendarCardRef}
          className="
                           mt-6
                           w-full
                           max-w-sm
                           bg-white
                           rounded-2xl md:rounded-[28px]
                           shadow-[0_15px_40px_rgba(0,0,0,.08)]
                           px-4 md:px-5
                           py-4 md:py-5
                           flex
                           flex-wrap
                           gap-3
                           justify-between
                           items-center
                         "
        >
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate">Monitoring Kalender</h3>
            <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
              Jam realtime & hari libur
            </p>
          </div>

          <button
            onClick={() => setShowRequestCameraCalendar(true)}
            title="Buka Kalender"
            className={`
                             group
                             flex
                             items-center
                             justify-center
                             gap-2
                             rounded-full
                             bg-gradient-to-br
                             from-blue-500
                             to-indigo-600
                             text-white
                             text-xs
                             font-semibold
                             shadow-[0_10px_25px_rgba(37,99,235,.35)]
                             hover:scale-105
                             transition-all
                             duration-300
                             shrink-0
                             ${showRequestCameraCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                           `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showRequestCameraCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showRequestCameraCalendar && (
          <div
            className="
                             fixed
                             inset-0
                             bg-black/50
                             backdrop-blur-md
                             z-50
                             flex
                             items-center
                             justify-center
                             p-2 sm:p-4 md:p-6
                           "
            onClick={() => setShowRequestCameraCalendar(false)}
          >
            <div
              className="
                               bg-transparent
                               w-full
                               max-w-lg
                               max-h-[95vh]
                               overflow-y-auto
                               relative
                             "
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowRequestCameraCalendar(false)}
                className="
                                 absolute
                                 top-3 right-3
                                 z-10
                                 w-9 h-9
                                 rounded-full
                                 bg-white
                                 shadow-md
                                 text-gray-500
                                 hover:bg-red-500
                                 hover:text-white
                                 duration-300
                                 flex
                                 items-center
                                 justify-center
                               "
              >
                <FiX size={16} />
              </button>

              <MonitoringCalendar
                selectedDate={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                }}
              />
            </div>
          </div>
        )}

        {/* ================= MODAL FORM ================= */}
        {showForm && (
          <div
            className="
fixed
inset-0
bg-black/40
backdrop-blur-xl
flex
items-center
justify-center
z-[999]
p-6
overflow-y-auto
"
            onClick={() => setShowForm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="
bg-white/90
backdrop-blur-3xl
rounded-[40px]
shadow-[0_40px_100px_rgba(0,0,0,.2)]
w-full
max-w-4xl
max-h-[90vh]
overflow-y-auto
p-10
"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="uppercase tracking-[5px] text-blue-600 text-xs font-semibold">
                    REQUEST CCTV
                  </p>

                  <h2 className="text-3xl font-bold text-gray-800 mt-3 flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <FiEdit2 /> Edit Request CCTV
                      </>
                    ) : (
                      <>
                        <FiPlusCircle /> Tambah Request CCTV
                      </>
                    )}
                  </h2>

                  <p className="text-gray-500 mt-2">
                    Input request pemasangan CCTV dan monitoring status instalasi
                  </p>
                </div>

                <button
                  onClick={() => setShowForm(false)}
                  className="
w-12
h-12
rounded-full
bg-gray-100
hover:bg-red-500
hover:text-white
text-2xl
duration-300
flex
items-center
justify-center
"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold">ID Camera</label>
                  <input
                    type="text"
                    name="id_camera"
                    value={formData.id_camera}
                    onChange={handleChange}
                    placeholder="Contoh : CCTV-PIM-001"
                    required
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Tanggal Request</label>
                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={formData.tanggal_request}
                      onChange={(date) =>
                        setFormData((prev) => ({ ...prev, tanggal_request: date }))
                      }
                      placeholder="Tanggal request"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Lokasi</label>
                  <select
                    name="lokasi"
                    value={formData.lokasi}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-2xl border"
                  >
                    <option value="">Pilih Lokasi</option>
                    {locations.map((loc, index) => (
                      <option key={loc.id || index} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Detail Lokasi</label>
                  <input
                    type="text"
                    name="lokasi_detail"
                    value={formData.lokasi_detail}
                    onChange={handleChange}
                    placeholder="Contoh : Area Produksi Line 1"
                    className="w-full mt-2 px-4 py-3 rounded-2xl border"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Tanggal Pemasangan</label>
                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={formData.tanggal_pemasangan}
                      onChange={(date) =>
                        setFormData((prev) => ({ ...prev, tanggal_pemasangan: date }))
                      }
                      placeholder="Tanggal pemasangan"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <input
                    type="text"
                    value={formData.tanggal_pemasangan ? 'Success' : 'Request'}
                    readOnly
                    className="w-full mt-2 px-4 py-3 rounded-2xl border bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Status otomatis berdasarkan pemasangan CCTV
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold">Input Database</label>
                  <input
                    type="text"
                    value={formData.input_database || 'Otomatis'}
                    readOnly
                    className="w-full mt-2 px-4 py-3 rounded-2xl border bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Terinput jika ID Camera ditemukan pada master CCTV
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">Keterangan</label>
                  <textarea
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Catatan tambahan..."
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 duration-300"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:scale-105 duration-300"
                  >
                    {isEditing ? 'Simpan Perubahan' : 'Tambah Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Bagian 2 - Tabel Request Camera */}
      <section className="p-4 mt-12">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari ID Camera, lokasi, status..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="
        w-full
        pl-10
        pr-4
        py-2
        border
        border-gray-300
        rounded-md
        focus:outline-none
        focus:ring-2
        focus:ring-blue-400
        transition
      "
            />
          </div>

          {/* Year Dropdown */}
          <div className="relative w-full md:w-48">
            <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 pl-4 pr-3 py-2.5">
              <LuCalendar size={16} className="text-blue-500 shrink-0" />

              <div className="relative flex-1">
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="
            appearance-none
            w-full
            bg-blue-50
            text-blue-700
            font-bold
            text-sm
            pl-3
            pr-8
            py-1.5
            rounded-xl
            border-none
            outline-none
            cursor-pointer
            hover:bg-blue-100
            transition-colors
            duration-200
            focus:ring-2
            focus:ring-blue-400
          "
                >
                  <option value="all">Semua Tahun</option>

                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      Tahun {year}
                    </option>
                  ))}
                </select>

                <svg
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  No
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  ID Camera
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  Tanggal Request
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  Lokasi
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  Detail Lokasi
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  Input Database
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  Tanggal Pemasangan
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">
                  Keterangan
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedRequestCamera.length > 0 ? (
                paginatedRequestCamera.map((item, index) => (
                  <tr key={item.id_camera || index} className="hover:bg-gray-100/50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                      {item.id_camera || '-'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.tanggal_request && item.tanggal_request !== '0001-01-01T00:00:00Z'
                        ? new Date(item.tanggal_request).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : '-'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">{item.lokasi || '-'}</td>

                    <td className="px-6 py-4 text-sm text-gray-900">{item.lokasi_detail || '-'}</td>

                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-semibold

                    ${
                      item.status === 'Success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }

                  `}
                      >
                        {item.status || '-'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold">
                      {item.progress_days || 0} Hari
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`
      px-3
      py-1
      rounded-full
      text-xs
      font-semibold

      ${
        (item.input_database || item.InputDatabase) === 'Terinput'
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }
    `}
                      >
                        {item.input_database || item.InputDatabase || '-'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.tanggal_pemasangan
                        ? new Date(item.tanggal_pemasangan).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : '-'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">{item.keterangan || '-'}</td>

                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex justify-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(item)}
                            title="Ubah Data"
                            className="
          bg-yellow-400
          hover:bg-yellow-500
          text-white
          p-2
          rounded-lg
          transition
          shadow-sm
          hover:scale-105
          focus:outline-none
          focus:ring-2
          focus:ring-yellow-300
          flex
          items-center
          justify-center
        "
                          >
                            <FiEdit2 size={17} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Hapus Data"
                            className="
          bg-red-500
          hover:bg-red-600
          text-white
          p-2
          rounded-lg
          transition
          shadow-sm
          hover:scale-105
          focus:outline-none
          focus:ring-2
          focus:ring-red-300
          flex
          items-center
          justify-center
        "
                          >
                            <FiTrash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data request camera ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi */}
        {pageCountRequest > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Menampilkan {paginatedRequestCamera.length} dari {filteredRequestCamera.length}{' '}
              request camera
            </p>

            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="
            inline-flex
            items-center
            gap-1
            px-3
            py-1
            rounded-md
            bg-gray-200
            disabled:opacity-50
            "
              >
                <FiChevronLeft size={14} /> Sebelumnya
              </button>

              <span className="text-sm">
                Halaman {currentPage} dari {pageCountRequest}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCountRequest))}
                disabled={currentPage === pageCountRequest}
                className="
            inline-flex
            items-center
            gap-1
            px-3
            py-1
            rounded-md
            bg-gray-200
            disabled:opacity-50
            "
              >
                Berikutnya <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
