// If you only imported useState and useEffect before — add useRef:
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Bar, Pie, Line, Radar, Doughnut, Scatter } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import MonitoringCalendar from '../components/Calander';
import Swal from 'sweetalert2';

import {
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiPlus,
  FiCalendar,
  FiX,
  FiCheck,
  FiClipboard,
} from 'react-icons/fi';
import {
  FiClock,
  FiHardDrive,
  FiDatabase,
  FiFileText,
  FiVideo,
  FiMonitor,
  FiBarChart2,
  FiLayers,
  FiZap,
  FiArrowRight,
} from 'react-icons/fi';

import {
  FiAlertTriangle,
  FiTrendingUp,
  FiCheckCircle,
  FiInfo,
  FiCamera,
  FiPieChart,
} from 'react-icons/fi';

import api from '../api/axios';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  ScatterController,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  ScatterController
);

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
export default function DurationRecord() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [durationRecordList, setDurationRecordList] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const durationHeaderCardRef = useRef(null);
  const durationCalendarCardRef = useRef(null);
  const [showAddDurationBtnText, setShowAddDurationBtnText] = useState(true);
  const [showDurationCalendarText, setShowDurationCalendarText] = useState(true);
  const [showDurationCalendar, setShowDurationCalendar] = useState(false);

  const itemsPerPage = 5;

  // ==============================
  // DURATION RECORD PERMISSION
  // ==============================

  const role = localStorage.getItem('role');

  const durationPermission = {
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

  const access = durationPermission[role] || durationPermission.Guest;

  const canCreate = access.create;
  const canEdit = access.update;
  const canDelete = access.delete;

  const [formData, setFormData] = useState({
    no_dvr_nvr: '',

    jenis_kamera: '',

    durasi_rekaman_hari: '',

    kapasitas_tb: '',

    keterangan: '',
  });

  // =====================================
  // GET RECORDING DURATION
  // =====================================

  const fetchDurationRecord = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await api.get('/recording-duration', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('STATUS:', response.status);
      console.log('Recording Duration:', response.data);

      const data = response.data.data || response.data || [];

      setDurationRecordList(data);
    } catch (err) {
      console.error('Error fetching recording duration:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/dashboard/login';
      }
    }
  };

  useEffect(() => {
    fetchDurationRecord();
  }, []);

  // ================= RESPONSIVE HEADER & CALENDAR BUTTON =================
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === durationHeaderCardRef.current) {
          setShowAddDurationBtnText(width > 260);
        }
        if (entry.target === durationCalendarCardRef.current) {
          setShowDurationCalendarText(width > 260);
        }
      }
    });

    if (durationHeaderCardRef.current) observer.observe(durationHeaderCardRef.current);
    if (durationCalendarCardRef.current) observer.observe(durationCalendarCardRef.current);

    return () => observer.disconnect();
  }, []);

  // --- Form Handlers ---

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================
  // SUBMIT RECORDING DURATION
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.no_dvr_nvr ||
      !formData.jenis_kamera ||
      !formData.durasi_rekaman_hari ||
      !formData.kapasitas_tb
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Belum Lengkap',
        text: 'Lengkapi data yang wajib diisi.',
        confirmButtonColor: '#3085d6',
      });

      return;
    }

    try {
      const payload = {
        no_dvr_nvr: formData.no_dvr_nvr,

        jenis_kamera: formData.jenis_kamera,

        durasi_rekaman_hari: Number(formData.durasi_rekaman_hari),

        kapasitas_tb: Number(formData.kapasitas_tb),

        keterangan: formData.keterangan || '',
      };

      if (isEditing) {
        await api.put(`/recording-duration/${editId}`, payload);
      } else {
        await api.post('/recording-duration', payload);
      }

      Swal.fire({
        icon: 'success',
        title: isEditing ? 'Berhasil Diperbarui' : 'Berhasil Disimpan',
        text: isEditing
          ? 'Data recording duration berhasil diperbarui.'
          : 'Data recording duration berhasil ditambahkan.',
        timer: 2000,
        showConfirmButton: false,
      });

      fetchDurationRecord();

      setShowForm(false);
      setIsEditing(false);
      setEditId(null);

      setFormData({
        no_dvr_nvr: '',
        jenis_kamera: '',
        durasi_rekaman_hari: '',
        kapasitas_tb: '',
        keterangan: '',
      });
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Data',
        text: err.response?.data || 'Terjadi kesalahan saat menyimpan data.',
        confirmButtonColor: '#d33',
      });
    }
  };

  // =====================================
  // EDIT RECORDING DURATION
  // =====================================

  const handleEdit = (item) => {
    setFormData({
      no_dvr_nvr: item.no_dvr_nvr || '',

      jenis_kamera: item.jenis_kamera || '',

      durasi_rekaman_hari: item.durasi_rekaman_hari || '',

      kapasitas_tb: item.kapasitas_tb || '',

      keterangan: item.keterangan || '',
    });

    setEditId(item.id);

    setIsEditing(true);

    setShowForm(true);
  };

  // =====================================
  // DELETE RECORDING DURATION
  // =====================================

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Data?',

      text: 'Data recording duration yang dihapus tidak dapat dikembalikan.',

      icon: 'warning',

      showCancelButton: true,

      confirmButtonColor: '#d33',

      cancelButtonColor: '#3085d6',

      confirmButtonText: 'Ya, Hapus',

      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');

      await api.delete(
        `/recording-duration/${id}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        icon: 'success',

        title: 'Berhasil Dihapus',

        text: 'Data recording duration berhasil dihapus.',

        timer: 2000,

        showConfirmButton: false,
      });

      fetchDurationRecord();
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: 'error',

        title: 'Gagal Menghapus Data',

        text: err.response?.data || 'Terjadi kesalahan saat menghapus data.',

        confirmButtonColor: '#d33',
      });
    }
  };

  // --- Filter and Pagination ---

  const filteredDurationRecord = durationRecordList.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.no_dvr_nvr?.toLowerCase().includes(search) ||
      item.jenis_kamera?.toLowerCase().includes(search) ||
      item.keterangan?.toLowerCase().includes(search) ||
      item.durasi_rekaman_hari?.toString().includes(search) ||
      item.kapasitas_tb?.toString().includes(search)
    );
  });

  const pageCount = Math.ceil(filteredDurationRecord.length / itemsPerPage);

  const paginatedDurationRecord = filteredDurationRecord.slice(
    (currentPage - 1) * itemsPerPage,

    currentPage * itemsPerPage
  );

  // =====================================
  // SUMMARY
  // =====================================

  // =====================================
  // TOTAL SUMMARY RECORDING
  // =====================================

  const totalSummary = filteredDurationRecord.reduce(
    (acc, item) => {
      acc.totalDVR += 1;

      acc.totalStorage += Number(item.kapasitas_tb || 0);

      acc.totalDuration += Number(item.durasi_rekaman_hari || 0);

      return acc;
    },
    {
      totalDVR: 0,
      totalDuration: 0,
      totalStorage: 0,
    }
  );

  // =====================================
  // STORAGE EFFICIENCY
  // =====================================

  // Hari rekaman yang didapat dari setiap 1 TB storage
  const storageEfficiency =
    totalSummary.totalStorage === 0
      ? 0
      : Number((totalSummary.totalDuration / totalSummary.totalStorage).toFixed(2));

  // =====================================
  // STORAGE UTILIZATION
  // =====================================

  // Target kapasitas storage perusahaan
  const TARGET_STORAGE = 300; // TB
  const storageEfficiencyRadarOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'top',

        labels: {
          usePointStyle: true,

          padding: 20,

          font: {
            size: 12,

            weight: '600',
          },
        },
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw}%`;
          },
        },
      },

      datalabels: {
        display: false,
      },
    },

    scales: {
      r: {
        min: 0,

        max: 100,

        ticks: {
          display: false,
        },

        pointLabels: {
          font: {
            size: 13,

            weight: '600',
          },

          color: '#334155',
        },

        grid: {
          color: 'rgba(148,163,184,0.25)',
        },

        angleLines: {
          color: 'rgba(148,163,184,0.25)',
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,

    maintainAspectRatio: false,

    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        position: 'top',

        labels: {
          usePointStyle: true,

          pointStyle: 'rectRounded',

          padding: 20,

          font: {
            size: 13,

            weight: 'bold',
          },
        },
      },

      tooltip: {
        backgroundColor: 'rgba(15,23,42,.95)',

        titleFont: {
          size: 14,
          weight: 'bold',
        },

        bodyFont: {
          size: 13,
        },

        padding: 15,

        cornerRadius: 12,
      },

      datalabels: {
        display: false,
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        grid: {
          color: 'rgba(148,163,184,.25)',

          drawBorder: false,
        },

        ticks: {
          callback: (value) => {
            return value + ' Hari';
          },
        },

        title: {
          display: true,

          text: 'Retention Duration (Hari)',

          font: {
            size: 14,

            weight: 'bold',
          },
        },
      },

      x: {
        grid: {
          color: 'rgba(148,163,184,.15)',
        },

        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },

    elements: {
      line: {
        tension: 0.5,
      },

      point: {
        radius: 4,

        hoverRadius: 8,
      },
    },

    animation: {
      duration: 1500,

      easing: 'easeOutQuart',
    },
  };

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 13,
            weight: 'bold',
          },
        },
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },

    scales: {
      r: {
        beginAtZero: true,

        suggestedMin: 0,

        ticks: {
          callback: (value) => value.toLocaleString(),
        },

        angleLines: {
          color: 'rgba(156,163,175,.35)',
        },

        grid: {
          color: 'rgba(156,163,175,.25)',
        },

        pointLabels: {
          color: '#374151',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
    },

    animation: {
      duration: 1200,
      easing: 'easeOutQuart',
    },
  };

  // eslint-disable-next-line no-unused-vars
  const horizontalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,

    indexAxis: 'y',

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} Camera`,
        },
      },
    },

    scales: {
      x: {
        beginAtZero: true,

        grid: {
          color: 'rgba(229,231,235,0.7)',
        },

        ticks: {
          color: '#6b7280',
          callback: (value) => value.toLocaleString(),
        },

        title: {
          display: true,
          text: 'Jumlah Camera',
        },
      },

      y: {
        grid: {
          display: false,
        },

        ticks: {
          color: '#374151',
          font: {
            size: 13,
            weight: 'bold',
          },
        },
      },
    },

    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  const barOptions = {
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
  };

  const storageCapacityOptions = {
    responsive: true,

    maintainAspectRatio: false,

    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        position: 'top',

        labels: {
          usePointStyle: true,

          padding: 20,

          font: {
            size: 13,
            weight: '600',
          },
        },
      },

      tooltip: {
        backgroundColor: '#111827',

        titleFont: {
          size: 14,
        },

        bodyFont: {
          size: 13,
        },

        padding: 12,

        callbacks: {
          label: function (context) {
            if (context.dataset.type === 'line') {
              return ` ${context.dataset.label}: ${context.raw}%`;
            }

            return ` ${context.dataset.label}: ${context.raw} TB`;
          },
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        title: {
          display: true,

          text: 'Capacity (TB)',

          font: {
            weight: '600',
          },
        },

        ticks: {
          callback: (value) => `${value} TB`,
        },

        grid: {
          color: 'rgba(0,0,0,0.08)',
        },
      },

      percentage: {
        position: 'right',

        beginAtZero: true,

        max: 100,

        title: {
          display: true,

          text: 'Usage (%)',

          font: {
            weight: '600',
          },
        },

        ticks: {
          callback: (value) => `${value}%`,
        },

        grid: {
          drawOnChartArea: false,
        },
      },

      x: {
        grid: {
          display: false,
        },

        ticks: {
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
    },
  };

  const cameraTypeOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'right',

        labels: {
          usePointStyle: true,

          padding: 20,

          font: {
            size: 14,

            weight: '600',
          },
        },
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: ${context.raw}`;
          },
        },
      },
    },

    cutout: '55%',
  };

  const storageEfficiencyOptions = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'top',

        labels: {
          usePointStyle: true,

          font: {
            size: 13,
            weight: '600',
          },
        },
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },

      datalabels: {
        display: false,
      },
    },

    scales: {
      r: {
        beginAtZero: true,

        ticks: {
          display: false,
        },

        pointLabels: {
          font: {
            size: 14,

            weight: '600',
          },

          color: '#334155',
        },

        grid: {
          color: 'rgba(148,163,184,0.25)',
        },

        angleLines: {
          color: 'rgba(148,163,184,0.25)',
        },
      },
    },
  };

  // ===================================== // Modal Recording Duration Analysis // =====================================
  const [showRecordingDurationAnalysis, setShowRecordingDurationAnalysis] = useState(false);
  const [showStorageCapacityAnalysis, setShowStorageCapacityAnalysis] = useState(false);
  const [showCameraTypeDistribution, setShowCameraTypeDistribution] = useState(false);
  const [showStorageEfficiency, setShowStorageEfficiency] = useState(false);

  // =====================================
  // Recording Duration Analysis
  // =====================================

  const getRecordingDurationAnalysis = () => {
    const ranking = [...durationRecordList]
      .map((item) => {
        const durasi = Number(item.durasi_rekaman_hari || 0);

        const kapasitas = Number(item.kapasitas_tb || 0);

        return {
          no_dvr_nvr: item.no_dvr_nvr,

          durasi,

          kapasitas,

          efficiency: kapasitas === 0 ? 0 : Number((durasi / kapasitas).toFixed(2)),
        };
      })

      .sort((a, b) => b.durasi - a.durasi);

    // =====================================
    // SUMMARY
    // =====================================

    const totalDVR = ranking.length;

    const totalDuration = ranking.reduce((sum, item) => sum + item.durasi, 0);

    // Average retention
    const averageRetention = totalDVR === 0 ? 0 : Number((totalDuration / totalDVR).toFixed(1));

    // Minimum retention
    const minimumRetention =
      ranking.length > 0 ? Math.min(...ranking.map((item) => item.durasi)) : 0;

    // Maximum retention
    const maximumRetention =
      ranking.length > 0 ? Math.max(...ranking.map((item) => item.durasi)) : 0;

    // =====================================
    // HIGHEST & LOWEST RETENTION
    // =====================================

    const highest =
      ranking.length > 0
        ? ranking[0]
        : {
            no_dvr_nvr: '-',
            durasi: 0,
          };

    const lowest =
      ranking.length > 0
        ? ranking[ranking.length - 1]
        : {
            no_dvr_nvr: '-',
            durasi: 0,
          };

    // =====================================
    // STATUS RETENTION
    // =====================================

    const critical = ranking.filter((item) => item.durasi < 14);

    const warning = ranking.filter((item) => item.durasi >= 14 && item.durasi < 30);

    const good = ranking.filter((item) => item.durasi >= 30);

    return {
      // Summary
      totalDVR,

      totalDuration,

      averageRetention,

      minimumRetention,

      maximumRetention,

      // Ranking
      highest,

      lowest,

      ranking,

      // Status
      critical,

      warning,

      good,

      top10: ranking.slice(0, 10),

      // =====================================
      // INSIGHT
      // =====================================

      insight: [
        `Total DVR/NVR yang dianalisa sebanyak ${totalDVR} unit.`,

        `Rata-rata retention rekaman CCTV sebesar ${averageRetention} hari.`,

        `Range retention berada pada ${minimumRetention} - ${maximumRetention} hari.`,

        highest.no_dvr_nvr !== '-'
          ? `${highest.no_dvr_nvr} memiliki retention tertinggi ${highest.durasi} hari.`
          : 'Belum terdapat data recording duration.',

        lowest.no_dvr_nvr !== '-'
          ? `${lowest.no_dvr_nvr} memiliki retention terendah ${lowest.durasi} hari.`
          : '',

        critical.length > 0
          ? `${critical.length} DVR/NVR memiliki retention dibawah standar 14 hari dan perlu evaluasi storage.`
          : 'Tidak ada DVR/NVR dengan retention kritis.',

        warning.length > 0
          ? `${warning.length} DVR/NVR berada pada kategori monitoring 14-30 hari.`
          : 'Tidak ada DVR/NVR kategori monitoring.',
      ],

      // =====================================
      // RECOMMENDATION
      // =====================================

      recommendation: [
        'Prioritaskan DVR/NVR dengan retention terendah.',

        'Tambahkan kapasitas HDD apabila retention belum memenuhi kebutuhan operasional.',

        'Optimalkan bitrate, resolusi, dan codec kamera.',

        'Lakukan pengecekan retention secara berkala.',
      ],
    };
  };

  // =====================================
  // Recording Duration Line Chart
  // =====================================

  const getRecordingDurationChart = () => {
    const analysis = getRecordingDurationAnalysis();

    return {
      labels: analysis.ranking.map((item) => item.no_dvr_nvr),

      datasets: [
        {
          label: 'Critical Retention',

          data: analysis.ranking.map((item) => (item.durasi < 14 ? item.durasi : 0)),

          borderColor: '#ef4444',

          backgroundColor: 'rgba(239,68,68,0.35)',

          fill: true,

          tension: 0.45,

          borderWidth: 2,
        },

        {
          label: 'Warning Retention',

          data: analysis.ranking.map((item) =>
            item.durasi >= 14 && item.durasi < 30 ? item.durasi : 0
          ),

          borderColor: '#f59e0b',

          backgroundColor: 'rgba(245,158,11,0.35)',

          fill: true,

          tension: 0.45,

          borderWidth: 2,
        },

        {
          label: 'Good Retention',

          data: analysis.ranking.map((item) => (item.durasi >= 30 ? item.durasi : 0)),

          borderColor: '#22c55e',

          backgroundColor: 'rgba(34,197,94,0.35)',

          fill: true,

          tension: 0.45,

          borderWidth: 3,
        },
      ],
    };
  };

  const recordingDurationAnalysis = getRecordingDurationAnalysis();
  const recordingDurationChart = getRecordingDurationChart();

  // =====================================
  // Camera Type Analysis
  // =====================================

  const getCameraTypeAnalysis = () => {
    let totalIPRecorder = 0;

    let totalAnalogRecorder = 0;

    durationRecordList.forEach((item) => {
      const jenis = item.jenis_kamera?.toLowerCase();

      if (jenis?.includes('ip')) {
        totalIPRecorder++;
      }

      if (jenis?.includes('analog')) {
        totalAnalogRecorder++;
      }
    });

    const totalRecorder = totalIPRecorder + totalAnalogRecorder;

    const ipPercentage =
      totalRecorder === 0 ? 0 : Number(((totalIPRecorder / totalRecorder) * 100).toFixed(1));

    const analogPercentage =
      totalRecorder === 0 ? 0 : Number(((totalAnalogRecorder / totalRecorder) * 100).toFixed(1));

    // =====================================
    // Ranking Device Type
    // =====================================

    const ranking = [
      {
        type: 'IP Camera Recorder',

        total: totalIPRecorder,

        percentage: ipPercentage,
      },

      {
        type: 'Analog Camera Recorder',

        total: totalAnalogRecorder,

        percentage: analogPercentage,
      },
    ].sort((a, b) => b.total - a.total);

    const highest =
      ranking.length > 0
        ? ranking[0]
        : {
            type: '-',
            total: 0,
            percentage: 0,
          };

    return {
      // ===============================
      // Summary
      // ===============================

      totalRecorder,

      totalIPRecorder,

      totalAnalogRecorder,

      ipPercentage,

      analogPercentage,

      ranking,

      highest,

      // ===============================
      // Insight
      // ===============================

      insight: [
        `Total DVR/NVR yang dianalisa sebanyak ${totalRecorder} unit.`,

        `Konfigurasi IP Camera digunakan pada ${totalIPRecorder} DVR/NVR (${ipPercentage}%).`,

        `Konfigurasi Analog Camera digunakan pada ${totalAnalogRecorder} DVR/NVR (${analogPercentage}%).`,

        highest.type !== '-'
          ? `${highest.type} merupakan konfigurasi terbanyak dengan ${highest.total} unit.`
          : 'Belum terdapat data camera type.',
      ],

      // ===============================
      // Recommendation
      // ===============================

      recommendation: [
        'Lakukan migrasi bertahap dari Analog Camera menuju IP Camera.',

        'Evaluasi kamera analog yang sudah melewati umur operasional.',

        'Pastikan bandwidth jaringan mendukung ekspansi IP Camera.',

        'Pastikan kapasitas NVR mencukupi untuk penambahan kamera IP.',
      ],
    };
  };

  // =====================================
  // Camera Type Nested Doughnut Chart
  // =====================================

  const getCameraTypeChart = () => {
    const analysis = getCameraTypeAnalysis();

    return {
      labels: ['IP Camera', 'Analog Camera'],

      datasets: [
        // ==========================
        // OUTER RING
        // ==========================

        {
          label: 'Current Camera Distribution',

          data: [analysis.totalIPRecorder, analysis.totalAnalogRecorder],

          backgroundColor: ['#06b6d4', '#f97316'],

          borderColor: '#ffffff',

          borderWidth: 4,

          hoverOffset: 15,

          cutout: '65%',
        },

        // ==========================
        // INNER RING
        // ==========================

        {
          label: 'Percentage',

          data: [analysis.ipPercentage, analysis.analogPercentage],

          backgroundColor: ['#38bdf8', '#fb923c'],

          borderColor: '#ffffff',

          borderWidth: 4,

          cutout: '40%',
        },
      ],
    };
  };

  const cameraTypeAnalysis = getCameraTypeAnalysis();
  const cameraTypeChart = getCameraTypeChart();

  // =====================================
  // Storage Capacity Analysis
  // =====================================

  const getStorageCapacityAnalysis = () => {
    let totalStorage = 0;

    durationRecordList.forEach((item) => {
      totalStorage += Number(item.kapasitas_tb || 0);
    });

    const totalDVR = durationRecordList.length;

    const averageStorage = totalDVR === 0 ? 0 : Number((totalStorage / totalDVR).toFixed(2));

    // =====================================
    // Ranking Storage DVR/NVR
    // =====================================

    const ranking = [...durationRecordList]

      .map((item) => {
        const storage = Number(item.kapasitas_tb || 0);

        return {
          no_dvr_nvr: item.no_dvr_nvr,

          storage,

          duration: Number(item.durasi_rekaman_hari || 0),

          percentage: totalStorage === 0 ? 0 : Number(((storage / totalStorage) * 100).toFixed(1)),
        };
      })

      .sort((a, b) => b.storage - a.storage);

    // =====================================
    // Highest & Lowest Storage
    // =====================================

    const highest =
      ranking.length > 0
        ? ranking[0]
        : {
            no_dvr_nvr: '-',
            storage: 0,
            percentage: 0,
          };

    const lowest =
      ranking.length > 0
        ? ranking[ranking.length - 1]
        : {
            no_dvr_nvr: '-',
            storage: 0,
            percentage: 0,
          };

    // =====================================
    // Storage Classification
    // =====================================

    const lowStorage = ranking.filter((item) => item.storage <= 4);

    const normalStorage = ranking.filter((item) => item.storage > 4);

    return {
      // ===============================
      // Summary
      // ===============================

      totalDVR,

      totalStorage,

      averageStorage,

      // ===============================
      // Ranking
      // ===============================

      highest,

      lowest,

      ranking,

      top10: ranking.slice(0, 10),

      // ===============================
      // Status
      // ===============================

      lowStorage,

      normalStorage,

      // ===============================
      // Insight
      // ===============================

      insight: [
        `Total kapasitas storage CCTV sebesar ${totalStorage} TB.`,

        `Rata-rata kapasitas HDD setiap DVR/NVR sebesar ${averageStorage} TB.`,

        highest.no_dvr_nvr !== '-'
          ? `${highest.no_dvr_nvr} memiliki kapasitas storage terbesar ${highest.storage} TB (${highest.percentage}%).`
          : 'Belum terdapat data storage.',

        lowest.no_dvr_nvr !== '-'
          ? `${lowest.no_dvr_nvr} memiliki kapasitas storage terendah ${lowest.storage} TB.`
          : '',

        lowStorage.length > 0
          ? `${lowStorage.length} DVR/NVR memiliki kapasitas HDD kecil (≤4 TB) dan perlu evaluasi kebutuhan retention.`
          : 'Seluruh DVR/NVR memiliki kapasitas storage yang memadai.',
      ],

      // ===============================
      // Recommendation
      // ===============================

      recommendation: [
        'Evaluasi kebutuhan storage berdasarkan retention rekaman.',

        'Tambahkan HDD apabila kebutuhan retention belum terpenuhi.',

        'Optimalkan bitrate, resolusi, dan codec kamera.',

        'Lakukan monitoring kapasitas storage secara berkala.',
      ],
    };
  };

  // =====================================
  // Storage Capacity Chart
  // =====================================

  // =====================================
  // Storage Capacity Mixed Chart
  // Bar + Line
  // =====================================

  const getStorageCapacityChart = () => {
    const analysis = getStorageCapacityAnalysis();

    return {
      labels: analysis.top10.map((item) => item.no_dvr_nvr),

      datasets: [
        // ==========================
        // BAR STORAGE
        // ==========================

        {
          type: 'bar',

          label: 'Kapasitas HDD (TB)',

          data: analysis.top10.map((item) => item.storage),

          backgroundColor: [
            '#2563eb',
            '#3b82f6',
            '#60a5fa',
            '#22c55e',
            '#16a34a',
            '#f59e0b',
            '#f97316',
            '#ef4444',
            '#8b5cf6',
            '#ec4899',
          ],

          borderRadius: 10,

          borderWidth: 0,

          barThickness: 35,
        },

        // ==========================
        // LINE PERCENTAGE
        // ==========================

        {
          type: 'line',

          label: 'Storage Usage (%)',

          data: analysis.top10.map((item) => item.percentage),

          borderColor: '#eab308',

          backgroundColor: 'rgba(234,179,8,0.15)',

          borderWidth: 3,

          tension: 0.4,

          pointRadius: 6,

          pointHoverRadius: 8,

          pointBackgroundColor: '#eab308',

          fill: false,

          yAxisID: 'percentage',
        },
      ],
    };
  };

  const storageCapacityAnalysis = getStorageCapacityAnalysis();
  const storageCapacityChart = getStorageCapacityChart();

  // =====================================
  // Storage Efficiency Analysis
  // =====================================

  const getStorageEfficiencyAnalysis = () => {
    let totalStorage = 0;

    let totalDuration = 0;

    durationRecordList.forEach((item) => {
      totalStorage += Number(item.kapasitas_tb || 0);

      totalDuration += Number(item.durasi_rekaman_hari || 0);
    });

    const totalDVR = durationRecordList.length;

    // =====================================
    // Ranking Efficiency DVR/NVR
    // =====================================

    const ranking = [...durationRecordList]

      .map((item) => {
        const storage = Number(item.kapasitas_tb || 0);

        const duration = Number(item.durasi_rekaman_hari || 0);

        const efficiency = storage === 0 ? 0 : Number((duration / storage).toFixed(2));

        return {
          no_dvr_nvr: item.no_dvr_nvr,

          duration,

          storage,

          efficiency,
        };
      })

      .sort((a, b) => b.efficiency - a.efficiency);

    // =====================================
    // Efficiency Calculation
    // =====================================

    // Total hari rekaman dibanding total storage
    const overallEfficiency =
      totalStorage === 0 ? 0 : Number((totalDuration / totalStorage).toFixed(2));

    // Rata-rata efficiency tiap DVR/NVR

    const averageEfficiency =
      totalDVR === 0
        ? 0
        : Number((ranking.reduce((sum, item) => sum + item.efficiency, 0) / totalDVR).toFixed(2));

    // =====================================
    // Highest & Lowest
    // =====================================

    const highest =
      ranking.length > 0
        ? ranking[0]
        : {
            no_dvr_nvr: '-',
            efficiency: 0,
          };

    const lowest =
      ranking.length > 0
        ? ranking[ranking.length - 1]
        : {
            no_dvr_nvr: '-',
            efficiency: 0,
          };

    // =====================================
    // Efficiency Status
    // =====================================

    const inefficient = ranking.filter((item) => item.efficiency < 3);

    const efficient = ranking.filter((item) => item.efficiency >= 10);

    return {
      // ===============================
      // Summary
      // ===============================

      totalDVR,

      totalStorage,

      totalDuration,

      overallEfficiency,

      averageEfficiency,

      // ===============================
      // Ranking
      // ===============================

      highest,

      lowest,

      ranking,

      top10: ranking.slice(0, 10),

      inefficient,

      efficient,

      // ===============================
      // Insight
      // ===============================

      insight: [
        `Total DVR/NVR yang dianalisa sebanyak ${totalDVR} unit.`,

        `Total storage yang digunakan sebesar ${totalStorage} TB.`,

        `Efisiensi storage keseluruhan sebesar ${overallEfficiency} hari/TB.`,

        highest.no_dvr_nvr !== '-'
          ? `${highest.no_dvr_nvr} memiliki efisiensi terbaik ${highest.efficiency} hari/TB.`
          : 'Belum terdapat data recording duration.',

        lowest.no_dvr_nvr !== '-'
          ? `${lowest.no_dvr_nvr} memiliki efisiensi terendah ${lowest.efficiency} hari/TB dan perlu evaluasi konfigurasi storage.`
          : '',

        inefficient.length > 0
          ? `${inefficient.length} DVR/NVR memiliki efisiensi rendah dibawah 3 hari/TB.`
          : 'Seluruh DVR/NVR memiliki efisiensi storage yang baik.',
      ],

      // ===============================
      // Recommendation
      // ===============================

      recommendation: [
        'Optimalkan bitrate, resolusi, dan codec kamera.',

        'Evaluasi DVR/NVR dengan nilai hari/TB rendah.',

        'Upgrade HDD apabila kebutuhan retention meningkat.',

        'Lakukan monitoring storage efficiency secara berkala.',
      ],
    };
  };
  // =====================================
  // Storage Efficiency Radar Chart
  // =====================================

  const getStorageEfficiencyChart = () => {
    const analysis = getStorageEfficiencyAnalysis();

    const topDVR = analysis.top10.slice(0, 5);

    const maxStorage = Math.max(...topDVR.map((item) => item.storage), 1);

    const maxDuration = Math.max(...topDVR.map((item) => item.duration), 1);

    const colors = [
      {
        border: '#10b981',
        background: 'rgba(16,185,129,0.25)',
      },

      {
        border: '#3b82f6',
        background: 'rgba(59,130,246,0.25)',
      },

      {
        border: '#f59e0b',
        background: 'rgba(245,158,11,0.25)',
      },

      {
        border: '#ef4444',
        background: 'rgba(239,68,68,0.25)',
      },

      {
        border: '#a855f7',
        background: 'rgba(168,85,247,0.25)',
      },
    ];

    return {
      labels: [
        'Storage Capacity',

        'Retention Duration',

        'Efficiency',

        'Storage Utilization',

        'Performance Score',

        'Reliability',
      ],

      datasets: topDVR.map((item, index) => {
        const storageScore = (item.storage / maxStorage) * 100;

        const retentionScore = (item.duration / maxDuration) * 100;

        const efficiencyScore = Math.min(item.efficiency * 10, 100);

        const utilizationScore = retentionScore;

        const performanceScore = (storageScore + retentionScore + efficiencyScore) / 3;

        const reliability = item.efficiency >= 10 ? 100 : item.efficiency >= 5 ? 70 : 40;

        return {
          label: item.no_dvr_nvr,

          data: [
            Number(storageScore.toFixed(0)),

            Number(retentionScore.toFixed(0)),

            Number(efficiencyScore.toFixed(0)),

            Number(utilizationScore.toFixed(0)),

            Number(performanceScore.toFixed(0)),

            reliability,
          ],

          fill: true,

          backgroundColor: colors[index].background,

          borderColor: colors[index].border,

          borderWidth: 2,

          pointRadius: 3,

          pointHoverRadius: 6,
        };
      }),
    };
  };
  const storageEfficiencyAnalysis = getStorageEfficiencyAnalysis();
  const storageEfficiencyChart = getStorageEfficiencyChart();

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
          {/* ===================================== */}
          {/* SLIDE 1 : Analisis Durasi Rekaman */}
          {/* ===================================== */}

          <SwiperSlide>
            <div
              onClick={() => setShowRecordingDurationAnalysis(true)}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-blue-600 text-[11px] font-semibold">
                      Analisis Durasi Rekaman
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <FiClock size={17} />
                      </span>
                      Analisis Durasi Rekaman
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis lama penyimpanan rekaman CCTV pada setiap perangkat DVR/NVR
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total DVR/NVR
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {recordingDurationAnalysis.totalDVR}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Rata-rata Retensi
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {recordingDurationAnalysis.averageRetention}
                      <span className="text-sm ml-1 font-semibold">Hari</span>
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Retensi Maksimal
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {recordingDurationAnalysis.maximumRetention}
                      <span className="text-sm ml-1 font-semibold">Hari</span>
                    </h3>
                  </div>

                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                    <p className="text-red-700 text-[11px] font-semibold uppercase tracking-wide">
                      DVR/NVR Kritis
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-red-600 mt-2 tabular-nums">
                      {recordingDurationAnalysis.critical.length}
                    </h3>
                    <p className="text-red-500 text-xs mt-0.5">&lt; 14 Hari</p>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Tren Durasi Retensi Rekaman
                  </h3>

                  <div className="h-[280px] md:h-[320px]">
                    <Line data={recordingDurationChart} options={lineChartOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      DVR/NVR Dengan Retensi Tertinggi
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {recordingDurationAnalysis.highest.no_dvr_nvr} (
                      {recordingDurationAnalysis.highest.durasi} Hari)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-blue-600 transition-colors duration-300">
                    Lihat Laporan
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* ===================================== */}
          {/* SLIDE 2 : Analisis Kapasitas Storage */}
          {/* ===================================== */}

          <SwiperSlide>
            <div
              onClick={() => setShowStorageCapacityAnalysis(true)}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                      Analisis Kapasitas Storage
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                        <FiHardDrive size={17} />
                      </span>
                      Analisis Kapasitas Penyimpanan
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis kapasitas HDD penyimpanan rekaman pada setiap perangkat DVR/NVR CCTV
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total DVR/NVR
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {storageCapacityAnalysis.totalDVR}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Total Penyimpanan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {storageCapacityAnalysis.totalStorage}
                      <span className="text-sm ml-1 font-semibold">TB</span>
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Rata-rata Kapasitas
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {storageCapacityAnalysis.averageStorage}
                      <span className="text-sm ml-1 font-semibold">TB</span>
                    </h3>
                  </div>

                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                    <p className="text-red-700 text-[11px] font-semibold uppercase tracking-wide">
                      Storage Rendah
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-red-600 mt-2 tabular-nums">
                      {storageCapacityAnalysis.lowStorage.length}
                      <span className="text-sm ml-1 font-semibold">Unit</span>
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Distribusi Kapasitas Storage
                  </h3>

                  <div className="h-[280px] md:h-[320px]">
                    <Bar data={storageCapacityChart} options={storageCapacityOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      DVR/NVR Dengan Kapasitas Terbesar
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {storageCapacityAnalysis.highest.no_dvr_nvr} -{' '}
                      {storageCapacityAnalysis.highest.storage} TB
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-purple-600 transition-colors duration-300">
                    Lihat Laporan
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* ===================================== */}
          {/* SLIDE 3 : Analisis Konfigurasi Kamera */}
          {/* ===================================== */}

          <SwiperSlide>
            <div
              onClick={() => setShowCameraTypeDistribution(true)}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                      Analisis Konfigurasi Kamera
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                        <FiVideo size={17} />
                      </span>
                      Distribusi Jenis Kamera
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis konfigurasi jenis kamera CCTV pada setiap perangkat DVR/NVR
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total DVR/NVR
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {cameraTypeAnalysis.totalRecorder}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Recorder Kamera IP
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {cameraTypeAnalysis.totalIPRecorder}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-4">
                    <p className="text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                      Recorder Analog
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-orange-600 mt-2 tabular-nums">
                      {cameraTypeAnalysis.totalAnalogRecorder}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Konfigurasi Dominan
                    </p>
                    <h3 className="text-lg md:text-xl font-bold text-green-600 mt-2 truncate">
                      {cameraTypeAnalysis.highest.type}
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Distribusi Jenis Kamera
                  </h3>

                  <div className="h-[280px] md:h-[320px] flex justify-center items-center">
                    <Doughnut data={cameraTypeChart} options={cameraTypeOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Konfigurasi Kamera Terbanyak
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cameraTypeAnalysis.highest.type} ({cameraTypeAnalysis.highest.total} DVR/NVR)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-purple-600 transition-colors duration-300">
                    Lihat Laporan
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* ===================================== */}
          {/* SLIDE 4 : Analisis Efisiensi Storage */}
          {/* ===================================== */}

          <SwiperSlide>
            <div onClick={() => setShowStorageEfficiency(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-green-600 text-[11px] font-semibold">
                      Optimasi Storage
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 text-green-600 shrink-0">
                        <FiZap size={17} />
                      </span>
                      Analisis Efisiensi Storage
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis tingkat efisiensi kapasitas penyimpanan terhadap durasi retensi
                      rekaman CCTV
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total DVR/NVR
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {storageEfficiencyAnalysis.totalDVR}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Total Storage
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {storageEfficiencyAnalysis.totalStorage}
                      <span className="text-sm ml-1 font-semibold">TB</span>
                    </h3>
                  </div>

                  <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-4">
                    <p className="text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                      Efisiensi Keseluruhan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-purple-600 mt-2 tabular-nums">
                      {storageEfficiencyAnalysis.overallEfficiency}
                      <span className="text-xs ml-1 font-semibold">Hari/TB</span>
                    </h3>
                  </div>

                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                    <p className="text-red-700 text-[11px] font-semibold uppercase tracking-wide">
                      Efisiensi Rendah
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-red-600 mt-2 tabular-nums">
                      {storageEfficiencyAnalysis.inefficient.length}
                      <span className="text-sm ml-1 font-semibold">Unit</span>
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Radar Efisiensi Storage
                  </h3>

                  <div className="h-[280px] md:h-[320px] flex justify-center items-center">
                    <Radar data={storageEfficiencyChart} options={storageEfficiencyOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      DVR/NVR Dengan Efisiensi Storage Terbaik
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {storageEfficiencyAnalysis.highest.no_dvr_nvr} -{' '}
                      {storageEfficiencyAnalysis.highest.efficiency} Hari/TB
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
        </Swiper>
        {/* =======================================================
    ANALISIS DURASI REKAMAN
======================================================= */}

        {showRecordingDurationAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowRecordingDurationAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-blue-600 text-[11px] font-semibold">
                    Analisis Durasi Rekaman
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600">
                      <FiClock size={17} />
                    </span>
                    Analisis Durasi Rekaman
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis lama penyimpanan rekaman CCTV pada setiap DVR/NVR.
                  </p>
                </div>

                <button
                  onClick={() => setShowRecordingDurationAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total DVR/NVR
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {recordingDurationAnalysis.totalDVR}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    Rata-rata Retensi
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {recordingDurationAnalysis.averageRetention}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Hari</p>
                </div>

                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-5">
                  <p className="text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                    Retensi Tertinggi
                  </p>
                  <h2 className="text-xl font-bold text-purple-600 mt-3">
                    {recordingDurationAnalysis.highest.no_dvr_nvr}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {recordingDurationAnalysis.highest.durasi} Hari
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    DVR/NVR Kritis
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {recordingDurationAnalysis.critical.length}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <FiAlertTriangle size={11} />
                    &lt;14 Hari
                  </p>
                </div>
              </div>

              {/* RANGE SUMMARY */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                    Retensi Minimum
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1.5 tabular-nums">
                    {recordingDurationAnalysis.minimumRetention} Hari
                  </h3>
                </div>

                <div>
                  <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                    Retensi Maksimum
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1.5 tabular-nums">
                    {recordingDurationAnalysis.maximumRetention} Hari
                  </h3>
                </div>

                <div>
                  <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                    Perlu Monitoring
                  </p>
                  <h3 className="text-2xl font-bold text-amber-600 mt-1.5 tabular-nums">
                    {recordingDurationAnalysis.warning.length} Unit
                  </h3>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                  <FiTrendingUp size={15} className="text-slate-400" />
                  Tren Durasi Rekaman
                </h3>

                <div className="h-[360px] md:h-[420px]">
                  <Line data={recordingDurationChart} options={lineChartOptions} />
                </div>
              </div>

              {/* TABLE */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiBarChart2 size={15} className="text-slate-400" />
                  Ranking Retensi DVR/NVR
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">DVR/NVR</th>
                        <th className="p-3.5 text-left font-semibold">Retensi</th>
                        <th className="p-3.5 text-left font-semibold">Efisiensi</th>
                        <th className="p-3.5 text-left font-semibold">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {recordingDurationAnalysis.ranking.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">
                            {item.no_dvr_n_vr || item.no_dvr_nvr}
                          </td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.durasi} Hari</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {item.efficiency} Hari/TB
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                item.durasi < 14
                                  ? 'bg-rose-100 text-rose-600'
                                  : item.durasi < 30
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-emerald-100 text-emerald-600'
                              }`}
                            >
                              {item.durasi < 14
                                ? 'Kritis'
                                : item.durasi < 30
                                  ? 'Monitoring'
                                  : 'Baik'}
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
                    <FiInfo size={15} />
                    Insight
                  </h3>

                  <div className="space-y-2.5">
                    {recordingDurationAnalysis.insight.map((item, index) => (
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
                    <FiCheckCircle size={15} />
                    Rekomendasi
                  </h3>

                  <div className="space-y-2.5">
                    {recordingDurationAnalysis.recommendation.map((item, index) => (
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

        {/* =======================================================
    STORAGE CAPACITY ANALYSIS MODAL
======================================================= */}

        {showStorageCapacityAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowStorageCapacityAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-blue-600 text-[11px] font-semibold">
                    Storage Capacity Analytics
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600">
                      <FiHardDrive size={17} />
                    </span>
                    Storage Capacity Analysis
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis kapasitas HDD dan distribusi storage pada DVR/NVR.
                  </p>
                </div>

                <button
                  onClick={() => setShowStorageCapacityAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total DVR/NVR
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {storageCapacityAnalysis.totalDVR}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Storage
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {storageCapacityAnalysis.totalStorage}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">TB</p>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                  <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    Average Storage
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {storageCapacityAnalysis.averageStorage}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">TB / DVR</p>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                  <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    Low Storage Device
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {storageCapacityAnalysis.lowStorage.length}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Unit</p>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                    Largest Storage
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1.5 tabular-nums">
                    {storageCapacityAnalysis.highest.storage} TB
                  </h3>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {storageCapacityAnalysis.highest.no_dvr_nvr}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                    Smallest Storage
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1.5 tabular-nums">
                    {storageCapacityAnalysis.lowest.storage} TB
                  </h3>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {storageCapacityAnalysis.lowest.no_dvr_nvr}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                    Normal Capacity
                  </p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1.5 tabular-nums">
                    {storageCapacityAnalysis.normalStorage.length} Unit
                  </h3>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                  <FiBarChart2 size={15} className="text-slate-400" />
                  Storage Capacity Distribution
                </h3>

                <div className="h-[360px] md:h-[420px]">
                  <Bar data={storageCapacityChart} options={barOptions} />
                </div>
              </div>

              {/* TABLE */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiClipboard size={15} className="text-slate-400" />
                  Storage Capacity Ranking
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">DVR/NVR</th>
                        <th className="p-3.5 text-left font-semibold">Capacity</th>
                        <th className="p-3.5 text-left font-semibold">Contribution</th>
                        <th className="p-3.5 text-left font-semibold">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {storageCapacityAnalysis.ranking.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.no_dvr_nvr}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.storage} TB</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.percentage}%</td>
                          <td className="p-3.5">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                item.storage <= 4
                                  ? 'bg-rose-100 text-rose-600'
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}
                            >
                              {item.storage <= 4 ? 'Low Capacity' : 'Normal'}
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
                    Insight
                  </h3>

                  <div className="space-y-2.5">
                    {storageCapacityAnalysis.insight.map((item, index) => (
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
                    <FiCheckCircle size={15} />
                    Recommendation
                  </h3>

                  <div className="space-y-2.5">
                    {storageCapacityAnalysis.recommendation.map((item, index) => (
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

        {/* =======================================================
    CAMERA TYPE DISTRIBUTION SHOW
======================================================= */}

        {showCameraTypeDistribution && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowCameraTypeDistribution(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                    Camera Type Analytics
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600">
                      <FiCamera size={17} />
                    </span>
                    Camera Type Distribution Analysis
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis distribusi penggunaan IP Camera dan Analog Camera.
                  </p>
                </div>

                <button
                  onClick={() => setShowCameraTypeDistribution(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Recorder
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {cameraTypeAnalysis.totalRecorder}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    IP Camera
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {cameraTypeAnalysis.totalIPRecorder}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">{cameraTypeAnalysis.ipPercentage}%</p>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                  <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    Analog Camera
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {cameraTypeAnalysis.totalAnalogRecorder}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {cameraTypeAnalysis.analogPercentage}%
                  </p>
                </div>

                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-5">
                  <p className="text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                    Dominant Type
                  </p>
                  <h2 className="text-xl font-bold text-purple-600 mt-3">
                    {cameraTypeAnalysis.highest.type}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {cameraTypeAnalysis.highest.total} Unit
                  </p>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                  <FiPieChart size={15} className="text-slate-400" />
                  Camera Type Distribution
                </h3>

                <div className="h-[360px] md:h-[420px] flex justify-center items-center">
                  <Doughnut data={cameraTypeChart} options={cameraTypeOptions} />
                </div>
              </div>

              {/* TABLE */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiClipboard size={15} className="text-slate-400" />
                  Camera Type Summary
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">Camera Type</th>
                        <th className="p-3.5 text-left font-semibold">Total</th>
                        <th className="p-3.5 text-left font-semibold">Percentage</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {cameraTypeAnalysis.ranking.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.type}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.total}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.percentage}%</td>
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
                    Insight
                  </h3>

                  <div className="space-y-2.5">
                    {cameraTypeAnalysis.insight.map((item, index) => (
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
                    Recommendation
                  </h3>

                  <div className="space-y-2.5">
                    {cameraTypeAnalysis.recommendation.map((item, index) => (
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
        {/* =======================================================
    STORAGE EFFICIENCY ANALYSIS MODAL
======================================================= */}

        {showStorageEfficiency && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowStorageEfficiency(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start gap-6 mb-7 pb-6 border-b border-slate-100">
                <div>
                  <p className="uppercase tracking-[3px] text-emerald-600 text-[11px] font-semibold">
                    Storage Performance Analytics
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600">
                      <FiZap size={17} />
                    </span>
                    Storage Efficiency Analysis
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis efisiensi penggunaan storage terhadap durasi rekaman CCTV.
                  </p>
                </div>

                <button
                  onClick={() => setShowStorageEfficiency(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                  <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total DVR/NVR
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {storageEfficiencyAnalysis.totalDVR}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                  <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    Total Storage
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {storageEfficiencyAnalysis.totalStorage}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">TB</p>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                  <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    Average Efficiency
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {storageEfficiencyAnalysis.averageEfficiency}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Hari / TB</p>
                </div>

                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-5">
                  <p className="text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                    Best Efficiency
                  </p>
                  <h2 className="text-xl font-bold text-purple-600 mt-3">
                    {storageEfficiencyAnalysis.highest.no_dvr_nvr}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {storageEfficiencyAnalysis.highest.efficiency} Hari/TB
                  </p>
                </div>
              </div>

              {/* RADAR CHART */}
              <div className="rounded-xl border border-slate-100 p-5 md:p-7 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 flex items-center gap-2">
                    <FiBarChart2 size={15} className="text-slate-400" />
                    Storage Efficiency Ranking
                  </h3>

                  <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold">
                    Top 5 DVR/NVR
                  </div>
                </div>

                <div className="h-[460px] md:h-[520px] w-full flex justify-center items-center">
                  <Radar
                    data={storageEfficiencyChart}
                    options={{
                      ...storageEfficiencyRadarOptions,
                      maintainAspectRatio: false,
                      plugins: {
                        ...storageEfficiencyRadarOptions.plugins,
                        legend: {
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                              size: 12,
                              weight: '600',
                            },
                          },
                        },
                      },
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            display: false,
                          },
                          angleLines: {
                            color: 'rgba(0,0,0,0.08)',
                          },
                          grid: {
                            color: 'rgba(0,0,0,0.08)',
                          },
                          pointLabels: {
                            color: '#334155',
                            font: {
                              size: 13,
                              weight: '600',
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* TABLE */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiClipboard size={15} className="text-slate-400" />
                  Storage Efficiency Overview
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                        <th className="p-3.5 text-left font-semibold">No</th>
                        <th className="p-3.5 text-left font-semibold">DVR/NVR</th>
                        <th className="p-3.5 text-left font-semibold">Storage</th>
                        <th className="p-3.5 text-left font-semibold">Efficiency</th>
                        <th className="p-3.5 text-left font-semibold">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {storageEfficiencyAnalysis.ranking.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-slate-400">{index + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-800">{item.no_dvr_nvr}</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">{item.storage} TB</td>
                          <td className="p-3.5 text-slate-600 tabular-nums">
                            {item.efficiency} Hari/TB
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                item.efficiency >= storageEfficiencyAnalysis.averageEfficiency
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-rose-100 text-rose-600'
                              }`}
                            >
                              {item.efficiency >= storageEfficiencyAnalysis.averageEfficiency
                                ? 'Efficient'
                                : 'Low Efficiency'}
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
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp size={15} />
                    Efficiency Insight
                  </h3>

                  <div className="space-y-2.5">
                    {storageEfficiencyAnalysis.insight.map((item, index) => (
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
                    Strategic Recommendation
                  </h3>

                  <div className="space-y-2.5">
                    {storageEfficiencyAnalysis.recommendation.map((item, index) => (
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
    Recording Duration Management
===================================== */}

      <section className="p-3 md:p-6">
        {/* HEADER CARD */}

        <div
          ref={durationHeaderCardRef}
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
                      ${showAddDurationBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                    `}
            >
              <FiPlus size={20} className="shrink-0" />

              {showAddDurationBtnText && (
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
          ref={durationCalendarCardRef}
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
            onClick={() => setShowDurationCalendar(true)}
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
                    ${showDurationCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                  `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showDurationCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showDurationCalendar && (
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
            onClick={() => setShowDurationCalendar(false)}
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
                onClick={() => setShowDurationCalendar(false)}
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
            onClick={() => {
              setShowForm(false);
              setIsEditing(false);
            }}
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
text-blue-600
text-xs
font-semibold
"
                  >
                    RECORDING DURATION
                  </p>

                  <h2
                    className="
text-3xl
font-bold
text-gray-800
mt-3
"
                  >
                    {isEditing ? '✏️ Edit Recording Duration' : '➕ Add Recording Duration'}
                  </h2>

                  <p
                    className="
text-gray-500
mt-2
"
                  >
                    Configure DVR/NVR storage and recording performance
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
"
                >
                  ×
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
                {/* DVR */}

                <div>
                  <label
                    className="
text-sm
font-semibold
"
                  >
                    No DVR / NVR
                  </label>

                  <input
                    type="text"
                    name="no_dvr_nvr"
                    value={formData.no_dvr_nvr}
                    onChange={handleChange}
                    placeholder="Contoh : NVR 01"
                    required
                    className="
w-full
mt-2
px-4
py-3
rounded-2xl
border
focus:ring-2
focus:ring-blue-500
outline-none
"
                  />
                </div>

                {/* TYPE */}

                <div>
                  <label
                    className="
text-sm
font-semibold
"
                  >
                    Jenis Kamera
                  </label>

                  <select
                    name="jenis_kamera"
                    value={formData.jenis_kamera}
                    onChange={handleChange}
                    required
                    className="
w-full
mt-2
px-4
py-3
rounded-2xl
border
focus:ring-2
focus:ring-blue-500
outline-none
"
                  >
                    <option value="">Pilih Jenis</option>

                    <option value="IP Camera">IP Camera</option>

                    <option value="Analog Camera">Analog Camera</option>

                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                {/* DURATION */}

                <div>
                  <label
                    className="
text-sm
font-semibold
"
                  >
                    Durasi Rekaman (Hari)
                  </label>

                  <input
                    type="number"
                    name="durasi_rekaman_hari"
                    value={formData.durasi_rekaman_hari}
                    onChange={handleChange}
                    placeholder="30"
                    required
                    className="
w-full
mt-2
px-4
py-3
rounded-2xl
border
focus:ring-2
focus:ring-blue-500
outline-none
"
                  />
                </div>

                {/* STORAGE */}

                <div>
                  <label
                    className="
text-sm
font-semibold
"
                  >
                    Kapasitas HDD (TB)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    name="kapasitas_tb"
                    value={formData.kapasitas_tb}
                    onChange={handleChange}
                    placeholder="4.00"
                    required
                    className="
w-full
mt-2
px-4
py-3
rounded-2xl
border
focus:ring-2
focus:ring-blue-500
outline-none
"
                  />
                </div>

                {/* EFFICIENCY STORAGE OTOMATIS */}

                <div>
                  <label
                    className="
text-sm
font-semibold
"
                  >
                    Efisiensi Storage
                  </label>

                  <input
                    type="text"
                    value={
                      formData.kapasitas_tb && formData.durasi_rekaman_hari
                        ? (
                            Number(formData.durasi_rekaman_hari) / Number(formData.kapasitas_tb)
                          ).toFixed(2) + ' Hari/TB'
                        : '0 Hari/TB'
                    }
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
                    Dihitung otomatis berdasarkan durasi rekaman dan kapasitas HDD.
                  </p>
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
                    rows={5}
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleChange}
                    placeholder="Catatan tambahan..."
                    className="
w-full
mt-2
px-4
py-3
rounded-2xl
border
focus:ring-2
focus:ring-blue-500
outline-none
"
                  />
                </div>

                {/* BUTTON */}

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
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="
px-8
py-3
rounded-2xl
bg-gradient-to-r
from-blue-600
to-indigo-600
text-white
font-semibold
shadow-lg
shadow-blue-500/30
hover:scale-105
duration-300
"
                  >
                    {isEditing ? 'Save Changes' : 'Add Recording'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* =====================================
    Section - Recording Duration Table
===================================== */}

      <section className="p-4 mt-12">
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
            placeholder="Search DVR / Camera Type..."
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
      text-gray-700
      focus:outline-none
      focus:ring-2
      focus:ring-blue-400
      transition
    "
          />
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
                <th
                  className="
 px-6 py-3
 text-left
 text-sm
 font-semibold
 text-gray-700
 uppercase
 tracking-wider
 "
                >
                  No
                </th>

                <th
                  className="
 px-6 py-3
 text-left
 text-sm
 font-semibold
 text-gray-700
 uppercase
 tracking-wider
 "
                >
                  DVR / NVR
                </th>

                <th
                  className="
 px-6 py-3
 text-left
 text-sm
 font-semibold
 text-gray-700
 uppercase
 tracking-wider
 "
                >
                  Jenis Kamera
                </th>

                <th
                  className="
 px-6 py-3
 text-left
 text-sm
 font-semibold
 text-gray-700
 uppercase
 tracking-wider
 "
                >
                  Durasi Rekaman
                </th>

                <th
                  className="
 px-6 py-3
 text-left
 text-sm
 font-semibold
 text-gray-700
 uppercase
 tracking-wider
 "
                >
                  Kapasitas HDD
                </th>

                <th
                  className="
 px-6 py-3
 text-left
 text-sm
 font-semibold
 text-gray-700
 uppercase
 tracking-wider
 "
                >
                  Storage Efficiency
                </th>

                <th
                  className="
 px-6 py-3
 text-left
 text-sm
 font-semibold
 text-gray-700
 uppercase
 tracking-wider
 "
                >
                  Keterangan
                </th>

                <th
                  className="
 px-6 py-3
 text-left
 text-sm
 font-semibold
 text-gray-700
 uppercase
 tracking-wider
 "
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedDurationRecord.length > 0 ? (
                <>
                  {paginatedDurationRecord.map((item, index) => (
                    <tr
                      key={item.id}
                      className="
                hover:bg-blue-50
                transition
              "
                    >
                      {/* NO */}

                      <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>

                      {/* DVR / NVR */}

                      <td
                        className="
                  px-6
                  py-4
                  font-semibold
                  text-blue-600
                "
                      >
                        {item.no_dvr_nvr}
                      </td>

                      {/* JENIS KAMERA */}

                      <td className="px-6 py-4">
                        <span
                          className={`
                    px-3
                    py-1
                    rounded-full
                    font-semibold

                    ${
                      item.jenis_kamera === 'IP Camera'
                        ? 'bg-blue-100 text-blue-700'
                        : item.jenis_kamera === 'Analog Camera'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-purple-100 text-purple-700'
                    }

                  `}
                        >
                          {item.jenis_kamera}
                        </span>
                      </td>

                      {/* DURASI */}

                      <td className="px-6 py-4">
                        <span
                          className="
                    px-3
                    py-1
                    rounded-full
                    bg-green-100
                    text-green-700
                    font-semibold
                  "
                        >
                          {item.durasi_rekaman_hari} Hari
                        </span>
                      </td>

                      {/* STORAGE */}

                      <td className="px-6 py-4 font-semibold">
                        {Number(item.kapasitas_tb || 0).toFixed(2)} TB
                      </td>

                      {/* EFFICIENCY */}

                      <td className="px-6 py-4">
                        <span
                          className="
                    px-3
                    py-1
                    rounded-full
                    bg-green-50
                    text-green-700
                    font-semibold
                  "
                        >
                          {item.kapasitas_tb > 0
                            ? (
                                Number(item.durasi_rekaman_hari) / Number(item.kapasitas_tb)
                              ).toFixed(2)
                            : 0}
                          Hari/TB
                        </span>
                      </td>

                      {/* KETERANGAN */}

                      <td
                        className="
                  px-6
                  py-4
                  whitespace-pre-wrap
                "
                      >
                        {item.keterangan || '-'}
                      </td>

                      {/* ACTION */}

                      <td
                        className="
    px-6
    py-4
    whitespace-nowrap
    text-center
    text-sm
    text-gray-900
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
                  ))}

                  {/* TOTAL */}

                  <tr
                    className="
    bg-blue-700
    text-white
    font-bold
    text-center
  "
                  >
                    <td className="px-6 py-4">TOTAL</td>

                    <td className="px-6 py-4">{totalSummary.totalDVR} DVR/NVR</td>

                    <td className="px-6 py-4">-</td>

                    <td className="px-6 py-4">{totalSummary.totalHari} Hari</td>

                    <td className="px-6 py-4">
                      {Number(totalSummary.totalStorage || 0).toFixed(2)} TB
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className="
        px-4
        py-2
        rounded-full
        bg-green-100
        text-green-700
        font-semibold
      "
                      >
                        {storageEfficiency}%
                      </span>
                    </td>

                    <td className="px-6 py-4">-</td>

                    <td className="px-6 py-4">-</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="
      px-6
      py-6
      text-center
      text-gray-500
      text-sm
    "
                  >
                    No Recording Duration Data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}

        {pageCount > 1 && (
          <div
            className="
        flex
        justify-between
        items-center
        mt-4
      "
          >
            <p className="text-sm text-gray-600">
              Displaying {paginatedDurationRecord.length} of {filteredDurationRecord.length} records
            </p>

            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="
            px-3
            py-1
            rounded-md
            bg-gray-200
            disabled:opacity-50
          "
              >
                ⬅ Previous
              </button>

              <span>
                Page {currentPage} of {pageCount}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="
            px-3
            py-1
            rounded-md
            bg-gray-200
            disabled:opacity-50
          "
              >
                Next ➡
              </button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
