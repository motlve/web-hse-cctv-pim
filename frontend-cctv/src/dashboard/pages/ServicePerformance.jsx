// If you only imported useState and useEffect before — add useRef:
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Bar, Pie, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'react-chartjs-2';
import { LineController, LineElement, PointElement } from 'chart.js';
ChartJS.register(LineController, LineElement, PointElement);

import api from '../api/axios';
import MonitoringCalendar from '../components/Calander';

import { FiSearch, FiEdit2, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { FiTool, FiArrowRight } from 'react-icons/fi';
import { FiMapPin, FiClock, FiPLus, FiCalendar } from 'react-icons/fi';
import {
  FiX,
  FiBarChart2,
  FiTrendingUp,
  FiZap,
  FiCheck,
  FiAlertTriangle,
  FiClipboard,
} from 'react-icons/fi';
import { FiAlertCircle, FiLayers } from 'react-icons/fi';
import { FiCamera } from 'react-icons/fi';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiHelpCircle } from 'react-icons/fi';

import { LuCalendar } from 'react-icons/lu';

import {
  Chart as ChartJS,
  CategoryScale,
  ArcElement,
  LinearScale,
  BarElement,
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

        // position
        const barBox = bar;
        // for horizontal bar, x is length, y is center
        const barRight = barBox.x; // right edge
        const barLeft = barBox.base ?? barBox.x - barBox.width / 2;
        const barWidth = Math.abs(barRight - barLeft);
        const barY = barBox.y;

        const text = String(Math.round(value));
        ctx.font = '600 12px Inter, Arial, sans-serif';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(text).width;
        const padding = 8;

        // if bar is wide enough, draw inside (white), else draw outside (dark)
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
export default function ServicePerformanceCam() {
  const [showForm, setShowForm] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [editId, setEditId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [servicePerformanceList, setServicePerformanceList] = useState([]);

  const [locations, setLocations] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const servicePerformanceHeaderCardRef = useRef(null);
  const servicePerformanceCalendarCardRef = useRef(null);
  const [showAddServicePerformanceBtnText, setShowAddServicePerformanceBtnText] = useState(true);
  const [showServicePerformanceCalendarText, setShowServicePerformanceCalendarText] =
    useState(true);
  const [showServicePerformanceCalendar, setShowServicePerformanceCalendar] = useState(false);

  const itemsPerPage = 5;

  // ==============================
  // SERVICE PERFORMANCE PERMISSION
  // ==============================

  const role = localStorage.getItem('role');

  const servicePermission = {
    Admin: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    'Manager HSE': {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    'Petugas HSE': {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    'Petugas CCTV': {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    Guest: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
  };

  const access = servicePermission[role] || servicePermission.Guest;

  const canCreate = access.create;
  const canEdit = access.update;
  const canDelete = access.delete;

  const [formData, setFormData] = useState({
    area: '',

    perangkat: '',

    total_camera_affected: '',

    tanggal_kerusakan: '',

    tanggal_dilaporkan: '',

    tanggal_berfungsi_kembali: '',

    total_durasi_perbaikan: '',

    status: '',

    keterangan: '',
  });

  // =====================================
  // GET SERVICE PERFORMANCE
  // =====================================

  const fetchServicePerformance = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('Token not found. User might not be logged in.');
        return;
      }

      const response = await api.get('/service-performance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API ASLI :', response.data);
      console.log('STATUS:', response.status);

      const data = response.data.data || response.data || [];

      console.log('Raw Service Performance:', data);

      const servicePerformanceProcessed = data.map((item) => {
        const performanceDate = new Date(item.tanggal_kerusakan);

        const processedItem = {
          id: item.id || item.ID,

          area: item.area || '',

          perangkat: item.perangkat || '',

          total_camera_affected: item.total_camera_affected || 0,

          tanggal_kerusakan: item.tanggal_kerusakan,

          tanggal_dilaporkan: item.tanggal_dilaporkan,

          tanggal_berfungsi_kembali: item.tanggal_berfungsi_kembali,

          // tambahan filter tahun
          performanceDate,

          year: !isNaN(performanceDate) ? performanceDate.getFullYear() : null,

          total_durasi_perbaikan: item.total_durasi_perbaikan || 0,

          status: item.status || 'Pending',

          keterangan: item.keterangan || '',
        };

        return processedItem;
      });

      setServicePerformanceList(servicePerformanceProcessed);

      // ===============================
      // AUTO SET LATEST SERVICE YEAR
      // ===============================

      if (servicePerformanceProcessed.length > 0) {
        const years = servicePerformanceProcessed
          .map((item) => {
            const date = new Date(item.tanggal_kerusakan);

            return date.getFullYear();
          })
          .filter((year) => !isNaN(year));

        if (years.length > 0) {
          setSelectedServicePerformanceYear(Math.max(...years));
        }
      }

      console.log('Processed Service Performance:', servicePerformanceProcessed);
    } catch (err) {
      console.error('Fetch Service Performance Error:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        window.location.href = '/login';
      }
    }
  };

  // =====================================
  // GET LOCATION
  // =====================================

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get(`/location`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch Location Error:', err);
    }
  };

  // =====================================
  // Fetch Dropdown Data
  // =====================================

  const fetchDataForDropdowns = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('Token not found for dropdowns.');
      return;
    }

    try {
      const locationsRes = await api.get(`/location`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const locationData = Array.isArray(locationsRes.data) ? locationsRes.data : [];

      setLocations(locationData);

      if (locationData.length > 0) {
        console.log('Example Location:', locationData[0]);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  useEffect(() => {
    fetchServicePerformance();
    fetchLocations();
    fetchDataForDropdowns();
  }, []);

  // ================= RESPONSIVE HEADER & CALENDAR BUTTON =================
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === servicePerformanceHeaderCardRef.current) {
          setShowAddServicePerformanceBtnText(width > 260);
        }
        if (entry.target === servicePerformanceCalendarCardRef.current) {
          setShowServicePerformanceCalendarText(width > 260);
        }
      }
    });

    if (servicePerformanceHeaderCardRef.current)
      observer.observe(servicePerformanceHeaderCardRef.current);
    if (servicePerformanceCalendarCardRef.current)
      observer.observe(servicePerformanceCalendarCardRef.current);

    return () => observer.disconnect();
  }, []);

  // =====================================
  // Form Handlers
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================
  // SUBMIT SERVICE PERFORMANCE
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // =====================================
    // VALIDASI DATA WAJIB
    // =====================================

    if (!formData.area || !formData.perangkat || !formData.tanggal_kerusakan) {
      alert('Area, perangkat, dan tanggal kerusakan wajib diisi.');

      return;
    }

    try {
      // =====================================
      // PAYLOAD
      // =====================================

      const payload = {
        area: formData.area,

        perangkat: formData.perangkat,

        total_camera_affected: Number(formData.total_camera_affected || 0),

        // =========================
        // WAJIB
        // =========================

        tanggal_kerusakan: formData.tanggal_kerusakan
          ? new Date(formData.tanggal_kerusakan).toISOString()
          : null,

        // =========================
        // OPSIONAL
        // =========================

        tanggal_dilaporkan: formData.tanggal_dilaporkan
          ? new Date(formData.tanggal_dilaporkan).toISOString()
          : null,

        // =========================
        // OPSIONAL
        // =========================

        tanggal_berfungsi_kembali: formData.tanggal_berfungsi_kembali
          ? new Date(formData.tanggal_berfungsi_kembali).toISOString()
          : null,

        keterangan: formData.keterangan || '',
      };

      console.log('SUBMIT SERVICE PERFORMANCE', payload);

      // =====================================
      // TOKEN
      // =====================================

      // =====================================
      // URL
      // =====================================

      const url = isEditing ? `/service-performance/${editId}` : `/service-performance`;

      // =====================================
      // METHOD
      // =====================================

      const method = isEditing ? 'PUT' : 'POST';

      // CEK ID EDIT

      if (isEditing && !editId) {
        alert('ID data tidak ditemukan.');

        return;
      }

      // =====================================
      // API REQUEST
      // =====================================

      await api({
        method,

        url,

        data: payload,
      });

      alert(isEditing ? 'Data berhasil diperbarui.' : 'Data berhasil disimpan.');

      // =====================================
      // REFRESH
      // =====================================

      fetchServicePerformance();

      // =====================================
      // RESET
      // =====================================

      setShowForm(false);

      setIsEditing(false);

      setEditId(null);

      setFormData({
        area: '',

        perangkat: '',

        total_camera_affected: 0,

        tanggal_kerusakan: null,

        tanggal_dilaporkan: null,

        tanggal_berfungsi_kembali: null,

        total_durasi_perbaikan: 0,

        keterangan: '',
      });
    } catch (err) {
      console.error('Error Submit Service Performance:', err);

      console.log(err.response?.data);

      alert(err.response?.data || 'Gagal menyimpan data.');
    }
  };
  // =====================================
  // EDIT
  // =====================================

  const handleEdit = (item) => {
    console.log('DATA EDIT :', item);

    const id = item.id || item.ID;

    console.log('EDIT ID :', id);

    setEditId(id);

    setFormData({
      area: item.area || '',

      perangkat: item.perangkat || '',

      total_camera_affected: item.total_camera_affected || 0,

      tanggal_kerusakan:
        item.tanggal_kerusakan && item.tanggal_kerusakan !== '0001-01-01T00:00:00Z'
          ? new Date(item.tanggal_kerusakan)
          : null,

      tanggal_dilaporkan:
        item.tanggal_dilaporkan && item.tanggal_dilaporkan !== '0001-01-01T00:00:00Z'
          ? new Date(item.tanggal_dilaporkan)
          : null,

      tanggal_berfungsi_kembali:
        item.tanggal_berfungsi_kembali && item.tanggal_berfungsi_kembali !== '0001-01-01T00:00:00Z'
          ? new Date(item.tanggal_berfungsi_kembali)
          : null,

      total_durasi_perbaikan: item.total_durasi_perbaikan || 0,

      keterangan: item.keterangan || '',
    });

    setShowForm(true);

    setIsEditing(true);
  };

  // =====================================
  // DELETE
  // =====================================

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;

    try {
      const token = localStorage.getItem('token');

      await api.delete(
        `/service-performance/${id}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Data berhasil dihapus.');

      fetchServicePerformance();
    } catch (err) {
      console.error('Delete Service Performance Error:', err);

      alert(err.response?.data?.message || 'Gagal menghapus data.');
    }
  };

  // =====================================
  // Filter Service Performance
  // =====================================

  const [selectedServicePerformanceYear, setSelectedServicePerformanceYear] = useState(
    new Date().getFullYear()
  );

  const currentYear = new Date().getFullYear();
  const servicePerformanceYears = Array.from({ length: 10 }, (_, index) => currentYear - index);

  const filteredServicePerformance = servicePerformanceList.filter((item) => {
    const searchLower = searchTerm.trim().toLowerCase();

    const getValidDate = (...dates) => {
      const date = dates.find((d) => d && d !== '0001-01-01T00:00:00Z');

      return date ? new Date(date) : null;
    };

    const performanceDate = getValidDate(
      item.tanggal_kerusakan,
      item.tanggal_dilaporkan,
      item.tanggal_berfungsi_kembali
    );

    const performanceYear = performanceDate ? performanceDate.getFullYear() : null;

    const area = (item.area || '').toString().trim().toLowerCase();

    const perangkat = (item.perangkat || '').toString().toLowerCase();

    const status = (item.status || '').toString().toLowerCase();

    const keterangan = (item.keterangan || '').toString().toLowerCase();

    const jenisActivity = (item.jenis_activity || item.jenisActivity || '')
      .toString()
      .toLowerCase();

    return (
      performanceYear === selectedServicePerformanceYear &&
      (area.includes(searchLower) ||
        perangkat.includes(searchLower) ||
        status.includes(searchLower) ||
        keterangan.includes(searchLower) ||
        jenisActivity.includes(searchLower) ||
        item.total_camera_affected?.toString().includes(searchLower))
    );
  });

  // =====================================
  // Pagination
  // =====================================

  const pageCountServicePerformance = Math.ceil(filteredServicePerformance.length / itemsPerPage);

  const paginatedServicePerformance = filteredServicePerformance.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  const pieOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'right',

        labels: {
          usePointStyle: true,
          padding: 20,
        },
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

        font: {
          weight: 'bold',
          size: 14,
        },

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

  const [showServiceSummary, setShowServiceSummary] = useState(false);
  const [showRepairDurationAnalysis, setShowRepairDurationAnalysis] = useState(false);
  const [showAreaPerformanceAnalysis, setShowAreaPerformanceAnalysis] = useState(false);
  const [showMaintenanceHistory, setShowMaintenanceHistory] = useState(false);

  // =====================================
  // Service Performance Summary Analysis
  // =====================================

  const getServiceSummaryAnalysis = () => {
    const totalIncident = servicePerformanceList.length;

    const totalAffected = servicePerformanceList.reduce(
      (sum, item) => sum + Number(item.total_camera_affected || 0),
      0
    );

    const totalDuration = servicePerformanceList.reduce(
      (sum, item) => sum + Number(item.total_durasi_perbaikan || 0),
      0
    );

    const averageDuration = totalIncident ? Number((totalDuration / totalIncident).toFixed(2)) : 0;

    // =========================
    // STATUS SUMMARY
    // =========================

    const statusMap = {};

    servicePerformanceList.forEach((item) => {
      const status = item.status?.trim() || 'Unknown';

      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    const ranking = Object.entries(statusMap)
      .map(([status, total]) => ({
        status,

        total,
      }))
      .sort((a, b) => b.total - a.total);

    const highest = ranking[0] || {
      status: '-',

      total: 0,
    };

    // =========================
    // RECOVERY
    // =========================

    const recovered = servicePerformanceList.filter(
      (item) =>
        item.tanggal_berfungsi_kembali && item.tanggal_berfungsi_kembali !== '0001-01-01T00:00:00Z'
    ).length;

    const ongoing = totalIncident - recovered;

    const recoveryRate = totalIncident ? Number(((recovered / totalIncident) * 100).toFixed(2)) : 0;

    // =========================
    // LONGEST REPAIR
    // =========================

    const longest = [...servicePerformanceList].sort(
      (a, b) => Number(b.total_durasi_perbaikan || 0) - Number(a.total_durasi_perbaikan || 0)
    )[0] || {
      perangkat: '-',

      total_durasi_perbaikan: 0,
    };

    return {
      totalIncident,

      totalAffected,

      averageDuration,

      recoveryRate,

      recovered,

      ongoing,

      longest,

      highest,

      ranking,

      insight: [
        `Total histori maintenance sebanyak ${totalIncident} kejadian.`,

        `${totalAffected} unit kamera/perangkat terdampak gangguan.`,

        `Status terbanyak adalah ${highest.status} sebanyak ${highest.total} kejadian.`,

        `Recovery rate mencapai ${recoveryRate}%.`,

        longest.perangkat !== '-'
          ? `${longest.perangkat} memiliki durasi perbaikan terlama ${longest.total_durasi_perbaikan} hari.`
          : 'Belum ada data durasi perbaikan.',
      ],

      recommendation: [
        'Prioritaskan perangkat dengan durasi downtime tertinggi.',

        'Lakukan preventive maintenance berdasarkan histori gangguan.',

        'Evaluasi perangkat yang sering mengalami kerusakan.',

        'Pastikan sparepart tersedia untuk perangkat kritikal.',
      ],
    };
  };

  // =====================================
  // Service Performance Summary Chart
  // =====================================

  const getServiceSummaryChart = () => {
    const analysis = getServiceSummaryAnalysis();

    return {
      labels: analysis.ranking.map((item) => item.status),

      datasets: [
        {
          label: 'Jumlah Gangguan',

          data: analysis.ranking.map((item) => item.total),

          backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'],

          borderRadius: 12,
        },
      ],
    };
  };

  const serviceSummaryAnalysis = getServiceSummaryAnalysis();
  const serviceSummaryChart = getServiceSummaryChart();

  // =====================================
  // Repair Duration Analysis
  // =====================================

  const getRepairDurationAnalysis = () => {
    const bucket = {
      '0 Hari': 0,
      '1-3 Hari': 0,
      '4-7 Hari': 0,
      '>7 Hari': 0,
    };

    let totalDuration = 0;

    // =========================
    // LOOP DATA
    // =========================

    servicePerformanceList.forEach((item) => {
      const days = Number(item.total_durasi_perbaikan || 0);

      totalDuration += days;

      if (days === 0) {
        bucket['0 Hari']++;
      } else if (days <= 3) {
        bucket['1-3 Hari']++;
      } else if (days <= 7) {
        bucket['4-7 Hari']++;
      } else {
        bucket['>7 Hari']++;
      }
    });

    const totalIncident = servicePerformanceList.length;

    // =========================
    // AVERAGE
    // =========================

    const average = totalIncident > 0 ? Number((totalDuration / totalIncident).toFixed(1)) : 0;

    // =========================
    // LONGEST
    // =========================

    const longest =
      servicePerformanceList.length > 0
        ? Math.max(
            ...servicePerformanceList.map((item) => Number(item.total_durasi_perbaikan || 0))
          )
        : 0;

    // =========================
    // LONGEST DEVICE
    // =========================

    const longestDevice = servicePerformanceList.find(
      (item) => Number(item.total_durasi_perbaikan || 0) === longest
    ) || {
      perangkat: '-',
      area: '-',
      total_durasi_perbaikan: 0,
    };

    // =========================
    // CATEGORY
    // =========================

    const ranking = Object.entries(bucket).map(([range, total]) => ({
      range,

      total,
    }));

    return {
      totalIncident,

      average,

      longest,

      longestDevice,

      ranking,

      insight: [
        `Total gangguan service sebanyak ${totalIncident} kejadian.`,

        `Rata-rata durasi perbaikan ${average} hari.`,

        `Durasi perbaikan terlama mencapai ${longest} hari.`,

        longestDevice.perangkat !== '-'
          ? `${longestDevice.perangkat} area ${longestDevice.area} memiliki durasi recovery terlama (${longestDevice.total_durasi_perbaikan} hari).`
          : 'Belum ada data perangkat.',
      ],

      recommendation: [
        'Prioritaskan perangkat dengan downtime tertinggi.',

        'Evaluasi penyebab gangguan berulang.',

        'Siapkan sparepart perangkat kritikal.',

        'Lakukan preventive maintenance berkala.',
      ],
    };
  };

  // =====================================
  // Repair Duration Chart
  // =====================================

  const getRepairDurationChart = () => {
    const analysis = getRepairDurationAnalysis();

    return {
      labels: analysis.ranking.map((item) => item.range),

      datasets: [
        {
          label: 'Jumlah Gangguan',

          data: analysis.ranking.map((item) => item.total),

          backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],

          borderRadius: 8,
        },
      ],
    };
  };

  const repairDurationAnalysis = getRepairDurationAnalysis();
  const repairDurationChart = getRepairDurationChart();

  // =====================================
  // Area Performance Analysis
  // =====================================

  const getAreaPerformanceAnalysis = () => {
    const areaMap = {};

    filteredServicePerformance.forEach((item) => {
      const area = item.area?.trim() || 'Tidak diketahui';

      if (!areaMap[area]) {
        areaMap[area] = {
          area,

          totalIncident: 0,

          totalCameraAffected: 0,

          recovered: 0,

          ongoing: 0,

          totalDuration: 0,
        };
      }

      // Total gangguan

      areaMap[area].totalIncident++;

      // Total kamera terdampak

      areaMap[area].totalCameraAffected += Number(item.total_camera_affected || 0);

      // ==========================
      // STATUS RECOVERY
      // ==========================

      if (item.tanggal_berfungsi_kembali && item.tanggal_berfungsi_kembali !== null) {
        areaMap[area].recovered++;
      } else {
        areaMap[area].ongoing++;
      }

      // ==========================
      // DURASI
      // ==========================

      areaMap[area].totalDuration += Number(item.total_durasi_perbaikan || 0);
    });

    const ranking = Object.values(areaMap)

      .map((item) => {
        return {
          area: item.area,

          totalIncident: item.totalIncident,

          totalCameraAffected: item.totalCameraAffected,

          recovered: item.recovered,

          ongoing: item.ongoing,

          recoveryRate:
            item.totalIncident > 0
              ? Number(((item.recovered / item.totalIncident) * 100).toFixed(1))
              : 0,

          averageDuration:
            item.totalIncident > 0
              ? Number((item.totalDuration / item.totalIncident).toFixed(2))
              : 0,
        };
      })

      // ranking berdasarkan gangguan terbanyak

      .sort((a, b) => b.totalIncident - a.totalIncident);

    const highest = ranking[0] || {
      area: '-',

      totalIncident: 0,

      totalCameraAffected: 0,

      recoveryRate: 0,
    };

    return {
      totalArea: ranking.length,

      totalIncident: servicePerformanceList.length,

      totalCameraAffected: ranking.reduce((sum, item) => sum + item.totalCameraAffected, 0),

      highest,

      ranking,

      insight: [
        `Total area maintenance sebanyak ${ranking.length} area.`,

        `Total gangguan service sebanyak ${servicePerformanceList.length} kejadian.`,

        `Total kamera terdampak ${ranking.reduce(
          (sum, item) => sum + item.totalCameraAffected,
          0
        )} unit.`,

        highest.area !== '-'
          ? `${highest.area} memiliki gangguan terbanyak sebanyak ${highest.totalIncident} kejadian.`
          : 'Belum ada data maintenance.',

        highest.area !== '-'
          ? `Recovery rate ${highest.area} mencapai ${highest.recoveryRate}%.`
          : '',
      ],

      recommendation: [
        'Prioritaskan area dengan jumlah gangguan tertinggi.',

        'Evaluasi area dengan recovery rate rendah.',

        'Lakukan preventive maintenance berkala.',

        'Pantau SLA penyelesaian gangguan setiap area.',
      ],
    };
  };

  // =====================================
  // Area Performance Chart
  // =====================================

  const getAreaPerformanceChart = () => {
    const analysis = getAreaPerformanceAnalysis();

    const top10 = analysis.ranking.slice(0, 10);

    return {
      labels: top10.map((item) => item.area),

      datasets: [
        {
          type: 'bar',
          label: 'Jumlah Gangguan',
          data: top10.map((item) => item.totalIncident),
          backgroundColor: '#6366f1',
          borderRadius: 8,
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Tingkat Recovery (%)',
          data: top10.map((item) => item.recoveryRate),
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          borderWidth: 3,
          tension: 0.35,
          yAxisID: 'y1',
          order: 1,
        },
      ],
    };
  };

  const areaPerformanceAnalysis = getAreaPerformanceAnalysis();

  const areaPerformanceChart = getAreaPerformanceChart();

  // =====================================
  // Maintenance History Analysis
  // =====================================

  const getMaintenanceHistoryAnalysis = () => {
    const total = servicePerformanceList.length;

    const totalCameraAffected = servicePerformanceList.reduce(
      (sum, item) => sum + Number(item.total_camera_affected || 0),
      0
    );

    const totalDuration = servicePerformanceList.reduce(
      (sum, item) => sum + Number(item.total_durasi_perbaikan || 0),
      0
    );

    const averageDuration = total > 0 ? Number((totalDuration / total).toFixed(1)) : 0;

    // =========================
    // SORT HISTORY TERBARU
    // =========================

    const history = [...servicePerformanceList].sort(
      (a, b) => new Date(b.tanggal_kerusakan) - new Date(a.tanggal_kerusakan)
    );

    // =========================
    // DEVICE RANKING
    // =========================

    const perangkatMap = {};

    servicePerformanceList.forEach((item) => {
      const perangkat = item.perangkat?.trim() || 'Tidak diketahui';

      if (!perangkatMap[perangkat]) {
        perangkatMap[perangkat] = {
          perangkat,
          total: 0,
          camera: 0,
          duration: 0,
        };
      }

      perangkatMap[perangkat].total++;

      perangkatMap[perangkat].camera += Number(item.total_camera_affected || 0);

      perangkatMap[perangkat].duration += Number(item.total_durasi_perbaikan || 0);
    });

    const ranking = Object.values(perangkatMap)

      .map((item) => ({
        perangkat: item.perangkat,

        total: item.total,

        camera: item.camera,

        averageDuration: item.total ? Number((item.duration / item.total).toFixed(1)) : 0,
      }))

      .sort((a, b) => b.total - a.total);

    const highest = ranking[0] || {
      perangkat: '-',
      total: 0,
      camera: 0,
      averageDuration: 0,
    };

    // =========================
    // RECOVERY
    // =========================

    const recovered = filteredServicePerformance.filter(
      (item) =>
        item.tanggal_berfungsi_kembali && item.tanggal_berfungsi_kembali !== '0001-01-01T00:00:00Z'
    ).length;

    const recoveryRate = total ? Number(((recovered / total) * 100).toFixed(1)) : 0;

    return {
      total,

      totalCameraAffected,

      averageDuration,

      recovered,

      recoveryRate,

      history,

      ranking,

      highest,

      insight: [
        `Total histori maintenance sebanyak ${total} kejadian.`,

        `Total kamera terdampak mencapai ${totalCameraAffected} unit.`,

        `Recovery rate maintenance mencapai ${recoveryRate}%.`,

        highest.perangkat !== '-'
          ? `${highest.perangkat} memiliki histori gangguan tertinggi sebanyak ${highest.total} kejadian.`
          : 'Belum ada histori maintenance.',

        `Rata-rata durasi penyelesaian maintenance ${averageDuration} hari.`,
      ],

      recommendation: [
        'Prioritaskan perangkat dengan frekuensi kerusakan tertinggi.',

        'Gunakan histori maintenance untuk preventive maintenance.',

        'Evaluasi perangkat dengan downtime panjang.',

        'Siapkan sparepart untuk perangkat kritikal.',
      ],
    };
  };

  // =====================================
  // Maintenance History Chart
  // =====================================

  const getMaintenanceHistoryChart = () => {
    const analysis = getMaintenanceHistoryAnalysis();

    return {
      labels: analysis.ranking.slice(0, 10).map((item) => item.perangkat),

      datasets: [
        {
          label: 'Jumlah Gangguan',

          data: analysis.ranking.slice(0, 10).map((item) => item.total),

          backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6'],

          borderRadius: 10,
        },
      ],
    };
  };

  const maintenanceHistoryAnalysis = getMaintenanceHistoryAnalysis();

  const maintenanceHistoryChart = getMaintenanceHistoryChart();

  return (
    <Layout>
      {/* ================= DASHBOARD ANALYTICS ================= */}
      <section className="p-6 mt-4">
        <Swiper
          modules={[Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          pagination={{
            clickable: true,
          }}
          loop={true}
          className="incident-swiper"
        >
          {/* =====================================================
      SLIDE 1 - RINGKASAN PERFORMA SERVICE
  ===================================================== */}
          <SwiperSlide>
            <div onClick={() => setShowServiceSummary(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-red-600 text-[11px] font-semibold">
                      Analitik Performa Service
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600 shrink-0">
                        <FiTool size={17} />
                      </span>
                      Performa Service CCTV
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Monitoring performa maintenance CCTV berdasarkan gangguan, kamera terdampak,
                      durasi perbaikan dan recovery
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Gangguan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {serviceSummaryAnalysis.totalIncident}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                    <p className="text-red-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera Terdampak
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-red-600 mt-2 tabular-nums">
                      {serviceSummaryAnalysis.totalAffected}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-yellow-50/60 border border-yellow-100 p-4">
                    <p className="text-yellow-700 text-[11px] font-semibold uppercase tracking-wide">
                      Rata-rata Perbaikan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-yellow-600 mt-2 tabular-nums">
                      {serviceSummaryAnalysis.averageDuration}
                    </h3>
                    <p className="text-yellow-600 text-xs mt-0.5">Hari</p>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Tingkat Pemulihan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {serviceSummaryAnalysis.recoveryRate}%
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Distribusi Status Gangguan
                  </h3>

                  <div className="h-[280px] md:h-[320px]">
                    <Pie data={serviceSummaryChart} options={pieOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Status Dominan</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {serviceSummaryAnalysis.highest?.status || '-'} (
                      {serviceSummaryAnalysis.highest?.total || 0} Data)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-red-600 transition-colors duration-300">
                    Lihat Laporan
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* =====================================================
      SLIDE 2 - ANALISIS DURASI PERBAIKAN
  ===================================================== */}

          <SwiperSlide>
            <div
              onClick={() => setShowRepairDurationAnalysis(true)}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-orange-600 text-[11px] font-semibold">
                      Analitik Perbaikan
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                        <FiTool size={17} />
                      </span>
                      Analisis Durasi Perbaikan
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis durasi penyelesaian gangguan CCTV berdasarkan waktu recovery
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Service
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {repairDurationAnalysis.totalIncident}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Rata-rata Perbaikan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {repairDurationAnalysis.average}
                    </h3>
                    <p className="text-blue-600 text-xs mt-0.5">Hari</p>
                  </div>

                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                    <p className="text-red-700 text-[11px] font-semibold uppercase tracking-wide">
                      Perbaikan Terlama
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-red-600 mt-2 tabular-nums">
                      {repairDurationAnalysis.longest}
                    </h3>
                    <p className="text-red-600 text-xs mt-0.5">Hari</p>
                  </div>

                  <div className="rounded-xl bg-yellow-50/60 border border-yellow-100 p-4">
                    <p className="text-yellow-700 text-[11px] font-semibold uppercase tracking-wide">
                      Rentang Durasi
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-yellow-600 mt-2 tabular-nums">
                      {repairDurationAnalysis.ranking.length}
                    </h3>
                    <p className="text-yellow-600 text-xs mt-0.5">Kategori</p>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Distribusi Durasi Perbaikan
                  </h3>

                  <div className="h-[280px] md:h-[320px]">
                    <Bar data={repairDurationChart} options={lineChartOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Performa Perbaikan</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Perangkat terlama:{' '}
                      <b>{repairDurationAnalysis.longestDevice?.perangkat || '-'}</b> (
                      {repairDurationAnalysis.longestDevice?.total_durasi_perbaikan || 0} hari)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-orange-600 transition-colors duration-300">
                    Lihat Laporan
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* =====================================================
      SLIDE 3 - ANALISIS PERFORMA AREA
  ===================================================== */}

          <SwiperSlide>
            <div
              onClick={() => setShowAreaPerformanceAnalysis(true)}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-sky-600 text-[11px] font-semibold">
                      Analitik Performa Area
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 text-sky-600 shrink-0">
                        <FiMapPin size={17} />
                      </span>
                      Performa CCTV per Area
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis performa service CCTV berdasarkan area, gangguan, recovery dan kamera
                      terdampak
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Area
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {areaPerformanceAnalysis.totalArea}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                    <p className="text-red-700 text-[11px] font-semibold uppercase tracking-wide">
                      Total Gangguan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-red-600 mt-2 tabular-nums">
                      {areaPerformanceAnalysis.totalIncident}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-yellow-50/60 border border-yellow-100 p-4">
                    <p className="text-yellow-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera Terdampak
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-yellow-600 mt-2 tabular-nums">
                      {areaPerformanceAnalysis.totalCameraAffected}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-4">
                    <p className="text-sky-700 text-[11px] font-semibold uppercase tracking-wide">
                      Area Prioritas
                    </p>
                    <h3 className="text-lg md:text-xl font-bold text-sky-600 mt-2 truncate">
                      {areaPerformanceAnalysis.highest.area}
                    </h3>
                    <p className="text-sky-600 text-xs mt-0.5">
                      {areaPerformanceAnalysis.highest.totalIncident} Gangguan
                    </p>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Gangguan &amp; Recovery per Area
                    </h3>

                    <div className="flex items-center gap-4">
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Jumlah Gangguan
                      </p>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tingkat
                        Recovery
                      </p>
                    </div>
                  </div>

                  <div className="h-[280px] md:h-[320px]">
                    <Chart
                      type="bar"
                      data={areaPerformanceChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,

                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: '#111827',
                            padding: 12,
                            cornerRadius: 10,
                            callbacks: {
                              label: (ctx) => {
                                if (ctx.dataset.label === 'Tingkat Recovery (%)') {
                                  return ` Recovery: ${ctx.raw}%`;
                                }
                                return ` Gangguan: ${ctx.raw} kejadian`;
                              },
                            },
                          },
                        },

                        scales: {
                          x: {
                            grid: { display: false },
                          },
                          y: {
                            type: 'linear',
                            position: 'left',
                            beginAtZero: true,
                            title: { display: true, text: 'Jumlah Gangguan' },
                            grid: { color: '#f1f5f9' },
                          },
                          y1: {
                            type: 'linear',
                            position: 'right',
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: 'Recovery (%)' },
                            grid: { drawOnChartArea: false },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Area Prioritas Maintenance
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {areaPerformanceAnalysis.highest.area} (
                      {areaPerformanceAnalysis.highest.totalIncident} gangguan)
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tingkat Pemulihan: {areaPerformanceAnalysis.highest.recoveryRate}%
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

          {/* =====================================================
      SLIDE 5 - RIWAYAT MAINTENANCE
  ===================================================== */}

          <SwiperSlide className="!h-auto">
            <div onClick={() => setShowMaintenanceHistory(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                      Analitik Maintenance
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                        <FiClock size={17} />
                      </span>
                      Riwayat Maintenance
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis histori maintenance CCTV berdasarkan perangkat, kamera terdampak,
                      durasi perbaikan, dan recovery system
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Maintenance
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {maintenanceHistoryAnalysis.total || 0}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera Terdampak
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {maintenanceHistoryAnalysis.totalCameraAffected || 0}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-4">
                    <p className="text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                      Rata-rata Perbaikan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-orange-600 mt-2 tabular-nums">
                      {maintenanceHistoryAnalysis.averageDuration || 0}
                    </h3>
                    <p className="text-orange-600 text-xs mt-0.5">Hari</p>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Tingkat Pemulihan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {maintenanceHistoryAnalysis.recoveryRate || 0}%
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Tren Riwayat Maintenance
                  </h3>

                  <div className="h-[280px] md:h-[320px]">
                    <Bar
                      data={
                        maintenanceHistoryChart || {
                          labels: [],
                          datasets: [],
                        }
                      }
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0,
                            },
                            grid: {
                              color: 'rgba(0,0,0,0.08)',
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Perangkat Maintenance Terbanyak
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {maintenanceHistoryAnalysis.highest?.perangkat || '-'} (
                      {maintenanceHistoryAnalysis.highest?.total || 0} gangguan)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-purple-600 transition-colors duration-300">
                    Lihat Riwayat
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        {showServiceSummary && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowServiceSummary(false)}
          >
            <div
              className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-red-600 text-[11px] font-semibold">
                    Performa Service
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600">
                      <FiTool size={17} />
                    </span>
                    Ringkasan Performa Service
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis performa maintenance dan recovery perangkat CCTV.
                  </p>
                </div>

                <button
                  onClick={() => setShowServiceSummary(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* KARTU RINGKASAN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Gangguan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {serviceSummaryAnalysis.totalIncident}
                  </h2>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    Kamera Terdampak
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {serviceSummaryAnalysis.totalAffected}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    Tingkat Pemulihan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {serviceSummaryAnalysis.recoveryRate}%
                  </h2>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                  <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    Rata-rata Perbaikan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {serviceSummaryAnalysis.averageDuration} <span className="text-xl">Hari</span>
                  </h2>
                </div>
              </div>

              {/* STATUS TERBANYAK + PERBAIKAN TERLAMA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl bg-violet-50/60 border border-violet-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-700 mb-4 flex items-center gap-2">
                    <FiBarChart2 size={15} />
                    Status Gangguan Dominan
                  </h3>

                  <div className="bg-white rounded-lg p-4 border border-violet-100/60">
                    <div className="text-2xl font-bold text-violet-600">
                      {serviceSummaryAnalysis.highest.status}
                    </div>
                    <p className="text-slate-500 text-sm mt-1.5">
                      Sebanyak{' '}
                      <b className="text-slate-800">{serviceSummaryAnalysis.highest.total}</b>{' '}
                      kejadian.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 mb-4 flex items-center gap-2">
                    <FiClock size={15} />
                    Durasi Perbaikan Terlama
                  </h3>

                  <div className="bg-white rounded-lg p-4 border border-orange-100/60 space-y-1.5">
                    <p className="text-sm text-slate-500">
                      Perangkat:{' '}
                      <b className="text-slate-800">
                        {serviceSummaryAnalysis.longest.perangkat || '-'}
                      </b>
                    </p>
                    <p className="text-sm text-slate-500">
                      Durasi:{' '}
                      <b className="text-slate-800">
                        {serviceSummaryAnalysis.longest.total_durasi_perbaikan || 0} hari
                      </b>
                    </p>
                  </div>
                </div>
              </div>

              {/* INSIGHT + REKOMENDASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Wawasan
                  </h3>

                  <div className="space-y-2.5">
                    {serviceSummaryAnalysis.insight.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-rose-100/60"
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
                    {serviceSummaryAnalysis.recommendation.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
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

        {showRepairDurationAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowRepairDurationAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-orange-600 text-[11px] font-semibold">
                    Analitik Perbaikan
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600">
                      <FiClock size={17} />
                    </span>
                    Analisis Durasi Perbaikan
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis durasi penyelesaian gangguan CCTV berdasarkan histori maintenance.
                  </p>
                </div>

                <button
                  onClick={() => setShowRepairDurationAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertCircle size={12} />
                    Total Gangguan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {repairDurationAnalysis.totalIncident}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiClock size={12} />
                    Rata-rata Perbaikan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {repairDurationAnalysis.average}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Hari</p>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertTriangle size={12} />
                    Perbaikan Terlama
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {repairDurationAnalysis.longest}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Hari</p>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                  <p className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiLayers size={12} />
                    Kategori Durasi
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {repairDurationAnalysis.ranking.length}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Range</p>
                </div>
              </div>

              {/* PERANGKAT TERLAMA */}
              <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-6 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700 mb-4 flex items-center gap-2">
                  <FiAlertTriangle size={15} />
                  Perangkat Dengan Durasi Terlama
                </h3>

                <div className="bg-white rounded-lg border border-rose-100/60 p-4 grid grid-cols-3 gap-5">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Perangkat</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {repairDurationAnalysis.longestDevice.perangkat || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Area</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {repairDurationAnalysis.longestDevice.area || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Durasi</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {repairDurationAnalysis.longestDevice.total_durasi_perbaikan || 0} Hari
                    </p>
                  </div>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                  <FiBarChart2 size={15} className="text-slate-400" />
                  Distribusi Durasi Perbaikan
                </h3>

                <div className="h-[360px] md:h-[420px]">
                  <Bar data={repairDurationChart} options={lineChartOptions} />
                </div>
              </div>

              {/* TABEL */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiClipboard size={15} className="text-slate-400" />
                  Peringkat Durasi Recovery
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">Range Durasi</th>
                        <th className="p-3.5 text-left font-semibold">Jumlah Gangguan</th>
                        <th className="p-3.5 text-left font-semibold">Persentase</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {repairDurationAnalysis.ranking.map((item, index) => (
                        <tr key={item.range} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.range}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.total}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {repairDurationAnalysis.totalIncident > 0
                              ? ((item.total / repairDurationAnalysis.totalIncident) * 100).toFixed(
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
                <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Wawasan
                  </h3>

                  <div className="space-y-2.5">
                    {repairDurationAnalysis.insight.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-orange-100/60"
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
                    {repairDurationAnalysis.recommendation.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
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

        {showRepairDurationAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowRepairDurationAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-orange-600 text-[11px] font-semibold">
                    Analitik Perbaikan
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600">
                      <FiClock size={17} />
                    </span>
                    Analisis Durasi Perbaikan
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis durasi penyelesaian gangguan CCTV berdasarkan histori maintenance.
                  </p>
                </div>

                <button
                  onClick={() => setShowRepairDurationAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertCircle size={12} />
                    Total Gangguan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {repairDurationAnalysis.totalIncident}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiClock size={12} />
                    Rata-rata Perbaikan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {repairDurationAnalysis.average}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Hari</p>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertTriangle size={12} />
                    Perbaikan Terlama
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {repairDurationAnalysis.longest}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Hari</p>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                  <p className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiLayers size={12} />
                    Kategori Durasi
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {repairDurationAnalysis.ranking.length}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Range</p>
                </div>
              </div>

              {/* PERANGKAT TERLAMA */}
              <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-6 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700 mb-4 flex items-center gap-2">
                  <FiAlertTriangle size={15} />
                  Perangkat Dengan Durasi Terlama
                </h3>

                <div className="bg-white rounded-lg border border-rose-100/60 p-4 grid grid-cols-3 gap-5">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Perangkat</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {repairDurationAnalysis.longestDevice.perangkat || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Area</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {repairDurationAnalysis.longestDevice.area || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Durasi</p>
                    <p className="font-semibold text-slate-800 mt-1">
                      {repairDurationAnalysis.longestDevice.total_durasi_perbaikan || 0} Hari
                    </p>
                  </div>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                  <FiBarChart2 size={15} className="text-slate-400" />
                  Distribusi Durasi Perbaikan
                </h3>

                <div className="h-[360px] md:h-[420px]">
                  <Bar data={repairDurationChart} options={lineChartOptions} />
                </div>
              </div>

              {/* TABEL */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiClipboard size={15} className="text-slate-400" />
                  Peringkat Durasi Recovery
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">Range Durasi</th>
                        <th className="p-3.5 text-left font-semibold">Jumlah Gangguan</th>
                        <th className="p-3.5 text-left font-semibold">Persentase</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {repairDurationAnalysis.ranking.map((item, index) => (
                        <tr key={item.range} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.range}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.total}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {repairDurationAnalysis.totalIncident > 0
                              ? ((item.total / repairDurationAnalysis.totalIncident) * 100).toFixed(
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
                <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Wawasan
                  </h3>

                  <div className="space-y-2.5">
                    {repairDurationAnalysis.insight.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-orange-100/60"
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
                    {repairDurationAnalysis.recommendation.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
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

        {showAreaPerformanceAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowAreaPerformanceAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                    Analitik Performa Area
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600">
                      <FiMapPin size={17} />
                    </span>
                    Performa Maintenance per Area
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis performa maintenance CCTV berdasarkan area.
                  </p>
                </div>

                <button
                  onClick={() => setShowAreaPerformanceAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* RINGKASAN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiMapPin size={12} />
                    Total Area
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {areaPerformanceAnalysis.totalArea || 0}
                  </h2>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertCircle size={12} />
                    Total Gangguan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {areaPerformanceAnalysis.totalIncident || 0}
                  </h2>
                </div>

                <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-5">
                  <p className="flex items-center gap-1.5 text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiCamera size={12} />
                    Kamera Terdampak
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-orange-600 mt-3 tabular-nums">
                    {areaPerformanceAnalysis.totalCameraAffected || 0}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertTriangle size={12} />
                    Area Terburuk
                  </p>
                  <h2 className="text-xl font-bold text-emerald-600 mt-3">
                    {areaPerformanceAnalysis.highest?.area || '-'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {areaPerformanceAnalysis.highest?.totalIncident || 0} Gangguan
                  </p>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                  <FiBarChart2 size={15} className="text-slate-400" />
                  Gangguan per Area
                </h3>

                <div className="h-[360px] md:h-[420px]">
                  <Bar
                    data={{
                      labels:
                        areaPerformanceAnalysis.ranking.slice(0, 10).map((item) => item.area) || [],

                      datasets: [
                        {
                          label: 'Jumlah Gangguan',

                          data:
                            areaPerformanceAnalysis.ranking
                              .slice(0, 10)
                              .map((item) => item.totalIncident) || [],

                          backgroundColor: '#8b5cf6',

                          borderRadius: 10,
                        },
                      ],
                    }}
                  />
                </div>
              </div>

              {/* TABEL */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiClipboard size={15} className="text-slate-400" />
                  Peringkat Area
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">Area</th>
                        <th className="p-3.5 text-left font-semibold">Gangguan</th>
                        <th className="p-3.5 text-left font-semibold">Kamera Terpengaruh</th>
                        <th className="p-3.5 text-left font-semibold">Rata-rata Perbaikan</th>
                        <th className="p-3.5 text-left font-semibold">Recovery</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {areaPerformanceAnalysis.ranking?.map((item, index) => (
                        <tr key={item.area} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.area}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {item.totalIncident}
                          </td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {item.totalCameraAffected}
                          </td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {item.averageRepair} Hari
                          </td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {item.recoveryRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSIGHT + REKOMENDASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Wawasan
                  </h3>

                  <div className="space-y-2.5">
                    {areaPerformanceAnalysis.insight?.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-purple-100/60"
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
                    {areaPerformanceAnalysis.recommendation?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
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

        {showMaintenanceHistory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowMaintenanceHistory(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                    Analitik Maintenance
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600">
                      <FiTool size={17} />
                    </span>
                    Riwayat Maintenance CCTV
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis histori gangguan CCTV berdasarkan perangkat, durasi perbaikan, kamera
                    terdampak, dan recovery.
                  </p>
                </div>

                <button
                  onClick={() => setShowMaintenanceHistory(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* RINGKASAN */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiTool size={12} />
                    Total Maintenance
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {maintenanceHistoryAnalysis.total || 0}
                  </h2>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiCamera size={12} />
                    Kamera Terdampak
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {maintenanceHistoryAnalysis.totalCameraAffected || 0}
                  </h2>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                  <p className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiClock size={12} />
                    Rata-rata Perbaikan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {maintenanceHistoryAnalysis.averageDuration || 0}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Hari</p>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiCheckCircle size={12} />
                    Tingkat Pemulihan
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {maintenanceHistoryAnalysis.recoveryRate || 0}%
                  </h2>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                  <FiBarChart2 size={15} className="text-slate-400" />
                  Frekuensi Maintenance per Perangkat
                </h3>

                <div className="h-[360px] md:h-[420px]">
                  <Bar
                    data={maintenanceHistoryChart}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* TABEL */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiClipboard size={15} className="text-slate-400" />
                  Detail Riwayat Maintenance
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">Perangkat</th>
                        <th className="p-3.5 text-left font-semibold">Area</th>
                        <th className="p-3.5 text-left font-semibold">Tanggal Kerusakan</th>
                        <th className="p-3.5 text-left font-semibold">Kamera</th>
                        <th className="p-3.5 text-left font-semibold">Durasi</th>
                        <th className="p-3.5 text-left font-semibold">Status</th>
                        <th className="p-3.5 text-left font-semibold">Keterangan</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {servicePerformanceList.map((item, index) => (
                        <tr
                          key={item.id || index}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">
                            {item.perangkat || '-'}
                          </td>
                          <td className="p-3.5 text-slate-600">{item.area || '-'}</td>
                          <td className="p-3.5 text-slate-600">
                            {item.tanggal_kerusakan
                              ? new Date(item.tanggal_kerusakan).toLocaleDateString('id-ID')
                              : '-'}
                          </td>
                          <td className="p-3.5">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                              {item.total_camera_affected || 0}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-600">
                              {item.total_durasi_perbaikan || 0} Hari
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-600">
                              {item.status || '-'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600 max-w-md">
                            {item.keterangan || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSIGHT + REKOMENDASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Wawasan
                  </h3>

                  <div className="space-y-2.5">
                    {maintenanceHistoryAnalysis.insight?.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-purple-100/60"
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
                    {maintenanceHistoryAnalysis.recommendation?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
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
      </section>
      {/* =====================================
      Manajemen Performa Service
  ===================================== */}

      <section className="p-3 md:p-6">
        {/* HEADER CARD */}

        <div
          ref={servicePerformanceHeaderCardRef}
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
          {/* TEXT */}

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

          {/* BUTTON TAMBAH */}

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
                          ${showAddServicePerformanceBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                        `}
            >
              <FiTool size={20} className="shrink-0" />

              {showAddServicePerformanceBtnText && (
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
          ref={servicePerformanceCalendarCardRef}
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
            onClick={() => setShowServicePerformanceCalendar(true)}
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
                        ${showServicePerformanceCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                      `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showServicePerformanceCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showServicePerformanceCalendar && (
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
            onClick={() => setShowServicePerformanceCalendar(false)}
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
                onClick={() => setShowServicePerformanceCalendar(false)}
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
        {/* ================= MODAL ================= */}

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
  max-w-5xl
  max-h-[90vh]
  overflow-y-auto
  p-10
  "
            >
              {/* HEADER */}

              <div
                className="
  flex
  justify-between
  items-start
  mb-8
  "
              >
                <div>
                  <p
                    className="
  uppercase
  tracking-[5px]
  text-red-600
  text-xs
  font-semibold
  "
                  >
                    PERFORMA SERVICE
                  </p>

                  <h2
                    className="
  text-3xl
  font-bold
  text-gray-800
  mt-3
  flex
  items-center
  gap-3
  "
                  >
                    {isEditing ? (
                      <>
                        <FiEdit2 /> Edit Service Performance
                      </>
                    ) : (
                      <>
                        <FiTool /> Tambah Service Performance
                      </>
                    )}
                  </h2>

                  <p
                    className="
  text-gray-500
  mt-2
  "
                  >
                    Catat proses perbaikan dan status recovery perangkat
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

              <form
                onSubmit={handleSubmit}
                className="
  grid
  grid-cols-1
  md:grid-cols-2
  gap-5
  "
              >
                {/* AREA */}

                <div>
                  <label
                    className="
  text-sm
  font-semibold
  "
                  >
                    Area
                  </label>

                  <select
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    className="
  w-full
  mt-2
  px-4
  py-3
  rounded-2xl
  border
  focus:ring-2
  focus:ring-red-500
  outline-none
  "
                  >
                    <option value="">Pilih Area</option>

                    {locations.map((item, index) => (
                      <option key={index} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PERANGKAT */}

                <div>
                  <label
                    className="
  text-sm
  font-semibold
  "
                  >
                    Perangkat
                  </label>

                  <select
                    name="perangkat"
                    value={formData.perangkat}
                    onChange={handleChange}
                    className="
  w-full
  mt-2
  px-4
  py-3
  rounded-2xl
  border
  "
                  >
                    <option value="">Pilih Perangkat</option>

                    <option value="Camera">Camera</option>

                    <option value="NVR">NVR</option>

                    <option value="Switch">Switch</option>

                    <option value="Fiber">Fiber</option>

                    <option value="Monitor">Monitor</option>
                  </select>
                </div>

                {/* KAMERA TERDAMPAK */}

                <div>
                  <label
                    className="
  text-sm
  font-semibold
  "
                  >
                    Jumlah Camera Terdampak
                  </label>

                  <input
                    type="number"
                    name="total_camera_affected"
                    value={formData.total_camera_affected}
                    onChange={handleChange}
                    min="0"
                    className="
  w-full
  mt-2
  px-4
  py-3
  rounded-2xl
  border
  "
                  ></input>
                </div>

                {/* STATUS OTOMATIS */}

                <div>
                  <label className="text-sm font-semibold">Status</label>

                  <input
                    type="text"
                    name="status"
                    value={formData.status || 'Otomatis oleh sistem'}
                    readOnly
                    className="
  w-full
  mt-2
  px-4
  py-3
  rounded-2xl
  border
  bg-gray-100
  text-gray-500
  cursor-not-allowed
  "
                  />

                  <p className="text-xs text-gray-400 mt-1">
                    Status akan berubah otomatis berdasarkan proses perbaikan.
                  </p>
                </div>

                {/* DATE PICKER */}

                <div>
                  <label className="text-sm font-semibold">Tanggal Kerusakan</label>

                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={formData.tanggal_kerusakan}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,

                          tanggal_kerusakan: date,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Tanggal Dilaporkan</label>

                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={formData.tanggal_dilaporkan}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,

                          tanggal_dilaporkan: date,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Tanggal Berfungsi Kembali</label>

                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={formData.tanggal_berfungsi_kembali}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,

                          tanggal_berfungsi_kembali: date,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* DURASI */}

                <div>
                  <label
                    className="
  text-sm
  font-semibold
  "
                  >
                    Durasi Perbaikan
                  </label>

                  <input
                    type="number"
                    name="total_durasi_perbaikan"
                    value={formData.total_durasi_perbaikan}
                    onChange={handleChange}
                    min="0"
                    className="
  w-full
  mt-2
  px-4
  py-3
  rounded-2xl
  border
  "
                  />

                  <span className="text-xs text-gray-500">Dalam hari</span>
                </div>

                {/* KETERANGAN */}

                <div
                  className="
  md:col-span-2
  "
                >
                  <label
                    className="
  text-sm
  font-semibold
  "
                  >
                    Keterangan
                  </label>

                  <textarea
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Catatan maintenance"
                    className="
  w-full
  mt-2
  px-4
  py-3
  rounded-2xl
  border
  focus:ring-2
  focus:ring-red-500
  outline-none
  "
                  />
                </div>

                {/* TOMBOL */}

                <div
                  className="
  md:col-span-2
  flex
  justify-end
  gap-3
  mt-6
  "
                >
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="
  px-6
  py-3
  rounded-2xl
  bg-gray-100
  hover:bg-gray-200
  duration-300
  "
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="
  px-8
  py-3
  rounded-2xl
  bg-gradient-to-r
  from-red-600
  to-orange-600
  text-white
  font-semibold
  shadow-lg
  shadow-red-500/30
  hover:scale-105
  duration-300
  "
                  >
                    {isEditing ? 'Simpan Perubahan' : 'Tambah Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* =====================================
      Section 2 - Service Performance Table
  ===================================== */}

      <section className="p-4 mt-12">
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          {/* Pencarian */}
          <div className="relative flex-1">
            <FiSearch
              size={18}
              className="
        absolute
        left-3
        top-1/2
        -translate-y-1/2
        text-gray-400
      "
            />

            <input
              type="text"
              placeholder="Cari Service Performance..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="
        w-full
        pl-10
        pr-4
        py-2.5
        rounded-xl
        border border-gray-300
        bg-white/60
        backdrop-blur-md
        shadow-sm
        focus:outline-none
        focus:ring-2
        focus:ring-blue-400
        transition
      "
            />
          </div>

          {/* Filter Tahun */}
          <div className="relative w-full md:w-44">
            <LuCalendar
              size={16}
              className="
      absolute
      left-3
      top-1/2
      -translate-y-1/2
      text-gray-500
      z-10
      pointer-events-none
    "
            />

            <select
              value={selectedServicePerformanceYear}
              onChange={(e) => {
                setSelectedServicePerformanceYear(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="
      appearance-none
      cursor-pointer

      w-full

      pl-10
      pr-10
      py-2.5

      rounded-xl

      border border-gray-300

      bg-white/60
      backdrop-blur-md

      shadow-sm

      font-medium
      text-gray-700

      hover:bg-white

      focus:outline-none
      focus:ring-2
      focus:ring-blue-400

      transition
    "
            >
              {servicePerformanceYears.map((year) => (
                <option key={year} value={year}>
                  Tahun {year}
                </option>
              ))}
            </select>

            <FiChevronDown
              size={14}
              className="
      pointer-events-none
      absolute
      right-3
      top-1/2
      -translate-y-1/2
      text-gray-500
      z-10
    "
            />
          </div>
        </div>

        <div
          className="
      overflow-x-auto
      rounded-2xl
      shadow-xl
      bg-white/40
      backdrop-blur-md
      "
        >
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">No</th>

                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Area</th>

                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Perangkat</th>

                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">
                  Kamera Terdampak
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">
                  Tanggal Kerusakan
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">
                  Tanggal Dilaporkan
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">
                  Berfungsi Kembali
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">
                  Durasi Perbaikan
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Status</th>

                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Keterangan</th>

                <th className="px-6 py-3 text-center text-sm font-semibold uppercase">Aksi</th>
              </tr>
            </thead>

            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedServicePerformance.length > 0 ? (
                paginatedServicePerformance.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-100/50 transition">
                    {/* NO */}

                    <td className="px-6 py-4 text-sm">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    {/* AREA */}

                    <td className="px-6 py-4 text-sm font-semibold text-red-600">
                      {item.area || '-'}
                    </td>

                    {/* PERANGKAT */}

                    <td className="px-6 py-4 text-sm">{item.perangkat || '-'}</td>

                    {/* TOTAL CAMERA */}

                    <td className="px-6 py-4 text-sm font-semibold">
                      {item.total_camera_affected || 0} Unit
                    </td>

                    {/* TANGGAL KERUSAKAN */}

                    <td className="px-6 py-4 text-sm">
                      {item.tanggal_kerusakan && item.tanggal_kerusakan !== '0001-01-01T00:00:00Z'
                        ? new Date(item.tanggal_kerusakan).toLocaleDateString('id-ID')
                        : '-'}
                    </td>

                    {/* TANGGAL DILAPORKAN */}

                    <td className="px-6 py-4 text-sm">
                      {item.tanggal_dilaporkan && item.tanggal_dilaporkan !== '0001-01-01T00:00:00Z'
                        ? new Date(item.tanggal_dilaporkan).toLocaleDateString('id-ID')
                        : '-'}
                    </td>

                    {/* BERFUNGSI KEMBALI */}

                    <td className="px-6 py-4 text-sm">
                      {item.tanggal_berfungsi_kembali &&
                      item.tanggal_berfungsi_kembali !== '0001-01-01T00:00:00Z'
                        ? new Date(item.tanggal_berfungsi_kembali).toLocaleDateString('id-ID')
                        : '-'}
                    </td>

                    {/* DURASI */}

                    <td className="px-6 py-4 text-sm font-semibold">
                      {item.total_durasi_perbaikan || 0} Hari
                    </td>

                    {/* STATUS OTOMATIS */}

                    <td className="px-6 py-4 text-sm">
                      {(() => {
                        const status =
                          item.tanggal_berfungsi_kembali &&
                          item.tanggal_berfungsi_kembali !== '0001-01-01T00:00:00Z'
                            ? 'Selesai Perbaikan'
                            : item.tanggal_dilaporkan &&
                                item.tanggal_dilaporkan !== '0001-01-01T00:00:00Z'
                              ? 'Request Perbaikan'
                              : item.tanggal_kerusakan &&
                                  item.tanggal_kerusakan !== '0001-01-01T00:00:00Z'
                                ? 'Belum Dilaporkan'
                                : 'Unknown';

                        const style = {
                          'Selesai Perbaikan': 'bg-green-100 text-green-700 border-green-200',

                          'Request Perbaikan': 'bg-blue-100 text-blue-700 border-blue-200',

                          'Belum Dilaporkan': 'bg-yellow-100 text-yellow-700 border-yellow-200',

                          Unknown: 'bg-gray-100 text-gray-600 border-gray-200',
                        };

                        const IconComponent = {
                          'Selesai Perbaikan': FiCheckCircle,
                          'Request Perbaikan': FiTool,
                          'Belum Dilaporkan': FiAlertCircle,
                          Unknown: FiHelpCircle,
                        }[status];

                        return (
                          <span
                            className={`
          inline-flex
          items-center
          gap-2
          px-4
          py-2
          rounded-full
          border
          font-semibold
          text-sm
          shadow-sm
          transition
          hover:scale-105
          ${style[status]}
        `}
                          >
                            <IconComponent size={15} />
                            {status}
                          </span>
                        );
                      })()}
                    </td>

                    {/* KETERANGAN */}

                    <td className="px-6 py-4 text-sm">{item.keterangan || '-'}</td>

                    {/* AKSI */}

                    <td
                      className="
    px-6
    py-4
    text-center
  "
                    >
                      <div className="flex justify-center items-center gap-2">
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
                  <td
                    colSpan="11"
                    className="
        px-6
        py-4
        text-center
        text-gray-500
        "
                  >
                    Tidak ada data service performance ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINASI */}

        {pageCountServicePerformance > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Menampilkan {paginatedServicePerformance.length}
              dari
              {filteredServicePerformance.length}
              data service
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
      "
              >
                <FiChevronLeft size={14} /> Sebelumnya
              </button>

              <span>
                Halaman {currentPage} dari {pageCountServicePerformance}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, pageCountServicePerformance))
                }
                disabled={currentPage === pageCountServicePerformance}
                className="
      inline-flex
      items-center
      gap-1
      px-3
      py-1
      rounded-md
      bg-gray-200
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
