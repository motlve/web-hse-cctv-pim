// If you only imported useState and useEffect before — add useRef:
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Bar, Pie, Line, Radar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import api from '../api/axios';

import MonitoringCalendar from '../components/Calander';

import { FiCamera, FiBarChart2, FiArrowRight, FiCalendar } from 'react-icons/fi';
import { FiVideo, FiGrid } from 'react-icons/fi';
import { FiPlusCircle } from 'react-icons/fi';

import { FiMapPin, FiList, FiTrendingUp } from 'react-icons/fi';
import { FiPieChart, FiCheckCircle, FiX, FiPlus } from 'react-icons/fi';
import { FiSearch, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaLightbulb } from 'react-icons/fa';

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
  Filler
);

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CostumeDatePicker from '../components/CostumeDatePicker';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import React from 'react';

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
export default function CameraOccupancyCam() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [cameraOccupancyList, setCameraOccupancyList] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [locations, setLocations] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const itemsPerPage = 5;

  const occupancyHeaderCardRef = useRef(null);
  const occupancyCalendarCardRef = useRef(null);
  const [showAddOccupancyBtnText, setShowAddOccupancyBtnText] = useState(true);
  const [showOccupancyCalendarText, setShowOccupancyCalendarText] = useState(true);
  const [showOccupancyCalendar, setShowOccupancyCalendar] = useState(false);

  // ==============================
  // CAMERA OCCUPANCY PERMISSION
  // ==============================

  const role = localStorage.getItem('role');

  const occupancyPermission = {
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

  const access = occupancyPermission[role] || occupancyPermission.Guest;

  const canCreate = access.create;
  const canEdit = access.update;
  const canDelete = access.delete;

  const [formData, setFormData] = useState({
    area: '',
    total_kamera: '',
    ip: '',
    analog: '',
    jumlah_kamera_tambahan: '',
    keterangan: '',
  });

  const fetchCameraOccupancy = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await api.get('/camera-occupancy', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('STATUS:', response.status);
      console.log('CAMERA OCCUPANCY DATA:', response.data);

      const data = response.data.data || response.data || [];

      setCameraOccupancyList(data);
    } catch (err) {
      console.error('Error fetching camera occupancy:', err);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLocations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCameraOccupancy();
    fetchLocations();
  }, []);

  // ================= RESPONSIVE HEADER & CALENDAR BUTTON =================
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === occupancyHeaderCardRef.current) {
          setShowAddOccupancyBtnText(width > 260);
        }
        if (entry.target === occupancyCalendarCardRef.current) {
          setShowOccupancyCalendarText(width > 260);
        }
      }
    });

    if (occupancyHeaderCardRef.current) observer.observe(occupancyHeaderCardRef.current);
    if (occupancyCalendarCardRef.current) observer.observe(occupancyCalendarCardRef.current);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.area || !formData.total_kamera || formData.ip === '' || formData.analog === '') {
      alert('Lengkapi data yang wajib diisi.');
      return;
    }

    try {
      const payload = {
        area: formData.area,
        total_kamera: Number(formData.total_kamera),
        ip: Number(formData.ip),
        analog: Number(formData.analog),
        jumlah_kamera_tambahan: Number(formData.jumlah_kamera_tambahan || 0),
        keterangan: formData.keterangan || '',
      };

      if (isEditing) {
        await api.put(`/camera-occupancy/${editId}`, payload);
      } else {
        await api.post('/camera-occupancy', payload);
      }

      alert(isEditing ? 'Data berhasil diperbarui.' : 'Data berhasil disimpan.');

      fetchCameraOccupancy();

      setShowForm(false);
      setIsEditing(false);
      setEditId(null);

      setFormData({
        area: '',
        total_kamera: '',
        ip: '',
        analog: '',
        jumlah_kamera_tambahan: '',
        keterangan: '',
      });
    } catch (err) {
      console.error(err);

      alert(err.response?.data || 'Gagal menyimpan data.');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      area: item.area || '',
      total_kamera: item.total_kamera || '',
      ip: item.ip || '',
      analog: item.analog || '',
      jumlah_kamera_tambahan: item.jumlah_kamera_tambahan || '',
      keterangan: item.keterangan || '',
    });

    setEditId(item.id);

    setIsEditing(true);

    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;

    try {
      const token = localStorage.getItem('token');

      await api.delete(`/camera-occupancy/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert('Data berhasil dihapus.');

      fetchCameraOccupancy();
    } catch (err) {
      console.error(err);

      alert(err.response?.data || 'Gagal menghapus data.');
    }
  };

  // --- Filter and Pagination ---
  const filteredCameraOccupancy = cameraOccupancyList.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.area?.toLowerCase().includes(search) ||
      item.keterangan?.toLowerCase().includes(search) ||
      item.total_kamera?.toString().includes(search) ||
      item.ip?.toString().includes(search) ||
      item.analog?.toString().includes(search) ||
      item.jumlah_kamera_tambahan?.toString().includes(search)
    );
  });

  const pageCount = Math.ceil(filteredCameraOccupancy.length / itemsPerPage);

  const paginatedCameraOccupancy = filteredCameraOccupancy.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalSummary = filteredCameraOccupancy.reduce(
    (acc, item) => {
      acc.totalKamera += Number(item.total_kamera || 0);
      acc.ip += Number(item.ip || 0);
      acc.analog += Number(item.analog || 0);
      acc.tambahan += Number(item.jumlah_kamera_tambahan || 0);

      return acc;
    },
    {
      totalKamera: 0,
      ip: 0,
      analog: 0,
      tambahan: 0,
    }
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

  // =====================================
  // Modal Analysis
  // =====================================
  const [showCameraTypeByAreaAnalysis, setShowCameraTypeByAreaAnalysis] = useState(false);
  const [showDistributionAnalysis, setShowDistributionAnalysis] = useState(false);
  const [showCameraTypeAnalysis, setShowCameraTypeAnalysis] = useState(false);
  const [showAdditionalCameraAnalysis, setShowAdditionalCameraAnalysis] = useState(false);
  const [showOccupancySummary, setShowOccupancySummary] = useState(false);

  // =====================================
  // Camera Type Comparison By Area
  // =====================================

  const getCameraTypeByAreaAnalysis = () => {
    const areaMap = {};

    cameraOccupancyList.forEach((item) => {
      const area = item.area || 'Tidak diketahui';

      if (!areaMap[area]) {
        areaMap[area] = {
          area,

          ip: 0,

          analog: 0,

          total: 0,
        };
      }

      areaMap[area].ip += Number(item.ip || 0);

      areaMap[area].analog += Number(item.analog || 0);

      areaMap[area].total = areaMap[area].ip + areaMap[area].analog;
    });

    const ranking = Object.values(areaMap)

      .map((item) => ({
        ...item,

        ipPercentage: item.total === 0 ? 0 : Number(((item.ip / item.total) * 100).toFixed(2)),

        analogPercentage:
          item.total === 0 ? 0 : Number(((item.analog / item.total) * 100).toFixed(2)),
      }))

      .sort((a, b) => b.total - a.total);

    const totalCamera = ranking.reduce((sum, item) => sum + item.total, 0);

    const totalIP = ranking.reduce((sum, item) => sum + item.ip, 0);

    const totalAnalog = ranking.reduce((sum, item) => sum + item.analog, 0);

    const highestIPArea = [...ranking].sort((a, b) => b.ip - a.ip)[0] || {
      area: '-',

      ip: 0,
    };

    const highestAnalogArea = [...ranking].sort((a, b) => b.analog - a.analog)[0] || {
      area: '-',

      analog: 0,
    };

    return {
      totalArea: ranking.length,

      totalCamera,

      totalIP,

      totalAnalog,

      ipPercentage: totalCamera === 0 ? 0 : Number(((totalIP / totalCamera) * 100).toFixed(2)),

      analogPercentage:
        totalCamera === 0 ? 0 : Number(((totalAnalog / totalCamera) * 100).toFixed(2)),

      ranking,

      highestIPArea,

      highestAnalogArea,

      insight: [
        `Total area yang dianalisa sebanyak ${ranking.length} area.`,

        `Total kamera sebanyak ${totalCamera} unit.`,

        `IP Camera sebanyak ${totalIP} unit.`,

        `Analog Camera sebanyak ${totalAnalog} unit.`,

        highestIPArea.area !== '-'
          ? `${highestIPArea.area} memiliki jumlah IP Camera terbanyak (${highestIPArea.ip} unit).`
          : 'Belum ada data IP Camera.',

        highestAnalogArea.area !== '-'
          ? `${highestAnalogArea.area} memiliki jumlah Analog Camera terbanyak (${highestAnalogArea.analog} unit).`
          : 'Belum ada data Analog Camera.',
      ],

      recommendation: [
        'Prioritaskan migrasi Analog Camera pada area dengan jumlah analog tertinggi.',

        'Evaluasi kebutuhan bandwidth pada area dengan IP Camera terbanyak.',

        'Pastikan kapasitas NVR sesuai jumlah kamera aktif.',

        'Lakukan standarisasi tipe kamera antar area.',
      ],
    };
  };

  // =====================================
  // Camera Type Comparison Chart By Area
  // =====================================
  // =====================================
  // Camera Type By Area Line Chart
  // =====================================

  const getCameraTypeByAreaChart = () => {
    const analysis = getCameraTypeByAreaAnalysis();

    const dataArea = analysis.ranking.slice(0, 10);

    return {
      labels: dataArea.map((item) => item.area),

      datasets: [
        {
          label: 'IP Camera',

          data: dataArea.map((item) => item.ip),

          borderColor: '#2563eb',

          backgroundColor: 'rgba(37,99,235,0.15)',

          tension: 0.4,

          fill: true,

          pointRadius: 6,

          pointHoverRadius: 9,

          pointBackgroundColor: '#2563eb',

          borderWidth: 3,
        },

        {
          label: 'Analog Camera',

          data: dataArea.map((item) => item.analog),

          borderColor: '#f97316',

          backgroundColor: 'rgba(249,115,22,0.15)',

          tension: 0.4,

          fill: true,

          pointRadius: 6,

          pointHoverRadius: 9,

          pointBackgroundColor: '#f97316',

          borderWidth: 3,
        },
      ],
    };
  };

  const cameraTypeByAreaAnalysis = getCameraTypeByAreaAnalysis();
  const cameraTypeByAreaChart = getCameraTypeByAreaChart();

  // =====================================
  // Request Camera By Location Analysis
  // =====================================
  // =====================================
  // Camera Distribution Analysis
  // =====================================

  const getCameraDistributionAnalysis = () => {
    const ranking = [...cameraOccupancyList]
      .map((item) => ({
        area: item.area,
        total: Number(item.total_kamera || 0),
      }))
      .sort((a, b) => b.total - a.total);

    const totalArea = ranking.length;

    const totalCamera = ranking.reduce((sum, item) => sum + item.total, 0);

    const average = totalArea === 0 ? 0 : Number((totalCamera / totalArea).toFixed(2));

    const highest = ranking[0] || {
      area: '-',
      total: 0,
    };

    return {
      totalArea,

      totalCamera,

      average,

      highest,

      ranking,

      top10: ranking.slice(0, 10),

      insight: [
        `Total area CCTV sebanyak ${totalArea}.`,
        `Total kamera terpasang sebanyak ${totalCamera} unit.`,
        highest.area !== '-'
          ? `${highest.area} memiliki jumlah kamera terbanyak (${highest.total} unit).`
          : 'Belum terdapat data Camera Occupancy.',
      ],

      recommendation: [
        'Evaluasi distribusi kamera pada setiap area.',
        'Prioritaskan penambahan kamera pada area dengan jumlah rendah.',
        'Lakukan monitoring occupancy secara berkala.',
        'Pastikan seluruh area memiliki cakupan CCTV yang memadai.',
      ],
    };
  };

  // =====================================
  // Request Camera By Location Chart
  // =====================================

  // =====================================
  // Camera Distribution Chart
  // =====================================

  const getCameraDistributionChart = () => {
    const analysis = getCameraDistributionAnalysis();

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
      labels: analysis.top10.map((item) => item.area),

      datasets: [
        {
          label: 'Total Kamera',

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

  const distributionAnalysis = getCameraDistributionAnalysis();

  const distributionChart = getCameraDistributionChart();

  // =====================================
  // Camera Type Analysis
  // =====================================

  const getCameraTypeAnalysis = () => {
    let totalIP = 0;
    let totalAnalog = 0;

    cameraOccupancyList.forEach((item) => {
      totalIP += Number(item.ip || 0);
      totalAnalog += Number(item.analog || 0);
    });

    const totalCamera = totalIP + totalAnalog;

    const ipPercentage = totalCamera === 0 ? 0 : Number(((totalIP / totalCamera) * 100).toFixed(2));

    const analogPercentage =
      totalCamera === 0 ? 0 : Number(((totalAnalog / totalCamera) * 100).toFixed(2));

    // ===============================
    // Ranking Camera Type
    // ===============================

    const ranking = [
      {
        type: 'IP Camera',
        total: totalIP,
        percentage: ipPercentage,
      },
      {
        type: 'Analog Camera',
        total: totalAnalog,
        percentage: analogPercentage,
      },
    ].sort((a, b) => b.total - a.total);

    const highest =
      ranking.length > 0
        ? ranking[0]
        : {
            type: '-',
            total: 0,
          };

    return {
      totalCamera,

      totalIP,

      totalAnalog,

      ipPercentage,

      analogPercentage,

      ranking,

      highest,

      insight: [
        `Total kamera sebanyak ${totalCamera} unit.`,
        `IP Camera sebanyak ${totalIP} unit (${ipPercentage}%).`,
        `Analog Camera sebanyak ${totalAnalog} unit (${analogPercentage}%).`,
        highest.type === 'IP Camera'
          ? 'Mayoritas kamera telah menggunakan teknologi IP Camera.'
          : 'Mayoritas kamera masih menggunakan Analog Camera.',
      ],

      recommendation: [
        'Lakukan migrasi bertahap dari Analog Camera ke IP Camera.',
        'Prioritaskan penggantian kamera analog yang sudah usang.',
        'Pastikan kapasitas jaringan mendukung penambahan IP Camera.',
        'Lakukan evaluasi perangkat NVR untuk mendukung kamera IP.',
      ],
    };
  };

  const getCameraTypeChart = () => {
    const analysis = getCameraTypeAnalysis();

    return {
      labels: ['IP Camera', 'Analog Camera'],

      datasets: [
        {
          data: [analysis.totalIP, analysis.totalAnalog],

          backgroundColor: ['#2563eb', '#f59e0b'],

          borderColor: '#fff',

          borderWidth: 3,
        },
      ],
    };
  };

  const cameraTypeAnalysis = getCameraTypeAnalysis();
  const cameraTypeChart = getCameraTypeChart();

  // =====================================
  // Additional Camera Analysis
  // =====================================

  const getAdditionalCameraAnalysis = () => {
    const ranking = [...cameraOccupancyList]
      .map((item) => ({
        area: item.area,
        total: Number(item.jumlah_kamera_tambahan || 0),
      }))
      .sort((a, b) => b.total - a.total);

    const totalArea = ranking.length;

    const needArea = ranking.filter((item) => item.total > 0).length;

    const totalAdditional = ranking.reduce((sum, item) => sum + item.total, 0);

    const average = totalArea === 0 ? 0 : Number((totalAdditional / totalArea).toFixed(2));

    const highest = ranking[0] || {
      area: '-',
      total: 0,
    };

    return {
      totalArea,

      needArea,

      totalAdditional,

      average,

      highest,

      ranking,

      top10: ranking.slice(0, 10),

      insight: [
        `Total kebutuhan penambahan CCTV sebanyak ${totalAdditional} unit.`,
        `Rata-rata kebutuhan tambahan kamera sebesar ${average} unit per area.`,
        highest.area !== '-'
          ? `${highest.area} membutuhkan penambahan CCTV terbanyak (${highest.total} unit).`
          : 'Belum terdapat data kebutuhan penambahan kamera.',
      ],

      recommendation: [
        'Prioritaskan pengadaan CCTV pada area dengan kebutuhan tertinggi.',
        'Sesuaikan pengadaan kamera dengan tingkat risiko setiap area.',
        'Lakukan evaluasi kebutuhan CCTV secara berkala.',
        'Pastikan anggaran pengadaan mengakomodasi kebutuhan tambahan kamera.',
      ],
    };
  };

  // =====================================
  // Additional Camera Chart
  // =====================================

  const getAdditionalCameraChart = () => {
    const analysis = getAdditionalCameraAnalysis();

    return {
      labels: analysis.top10.map((item) => item.area),

      datasets: [
        {
          label: 'Kebutuhan Tambahan CCTV',

          data: analysis.top10.map((item) => item.total),

          backgroundColor: '#2563eb',

          borderRadius: 8,
        },
      ],
    };
  };

  const additionalCameraAnalysis = getAdditionalCameraAnalysis();
  const additionalCameraChart = getAdditionalCameraChart();

  // =====================================
  // Occupancy Summary
  // =====================================

  const getOccupancySummary = () => {
    let totalCamera = 0;
    let totalIP = 0;
    let totalAnalog = 0;
    let totalAdditional = 0;

    cameraOccupancyList.forEach((item) => {
      totalCamera += Number(item.total_kamera || 0);
      totalIP += Number(item.ip || 0);
      totalAnalog += Number(item.analog || 0);
      totalAdditional += Number(item.jumlah_kamera_tambahan || 0);
    });

    const totalArea = cameraOccupancyList.length;

    const ipPercentage = totalCamera === 0 ? 0 : Number(((totalIP / totalCamera) * 100).toFixed(2));

    const analogPercentage =
      totalCamera === 0 ? 0 : Number(((totalAnalog / totalCamera) * 100).toFixed(2));

    const occupancyRate =
      totalCamera + totalAdditional === 0
        ? 0
        : Number(((totalCamera / (totalCamera + totalAdditional)) * 100).toFixed(2));

    const additionalRate =
      totalCamera + totalAdditional === 0
        ? 0
        : Number(((totalAdditional / (totalCamera + totalAdditional)) * 100).toFixed(2));

    return {
      totalArea,
      totalCamera,
      totalIP,
      totalAnalog,
      totalAdditional,
      ipPercentage,
      analogPercentage,
      occupancyRate,
      additionalRate,

      insight: [
        `Total area yang dimonitor sebanyak ${totalArea}.`,
        `Total kamera terpasang sebanyak ${totalCamera} unit.`,
        `Sebanyak ${ipPercentage}% kamera telah menggunakan IP Camera.`,
        `Masih dibutuhkan ${totalAdditional} unit kamera tambahan.`,
      ],

      recommendation: [
        'Pertahankan dominasi penggunaan IP Camera.',
        'Lakukan penggantian kamera analog secara bertahap.',
        'Realisasikan kebutuhan penambahan kamera sesuai prioritas area.',
        'Evaluasi Camera Occupancy secara berkala untuk memastikan seluruh area memiliki cakupan CCTV yang memadai.',
      ],
    };
  };

  // =====================================
  // Occupancy Summary Chart
  // =====================================

  const getOccupancySummaryChart = () => {
    const summary = getOccupancySummary();

    return {
      labels: [
        'Total Kamera',
        'IP Camera',
        'Analog Camera',
        'Tambahan Kamera',
        'IP %',
        'Occupancy %',
      ],

      datasets: [
        {
          label: 'Occupancy Summary',

          data: [
            summary.totalCamera,
            summary.totalIP,
            summary.totalAnalog,
            summary.totalAdditional,
            summary.ipPercentage,
            summary.occupancyRate,
          ],

          backgroundColor: 'rgba(37,99,235,0.2)',

          borderColor: '#2563eb',

          pointBackgroundColor: '#2563eb',

          pointRadius: 5,

          borderWidth: 3,

          fill: true,
        },
      ],
    };
  };

  const occupancySummary = getOccupancySummary();
  const occupancySummaryChart = getOccupancySummaryChart();

  return (
    <Layout>
      {/* ================= DASHBOARD ANALYTICS ================= */}
      <section className="p-6 mt-4">
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          pagination={{
            clickable: true,
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          loop={true}
          className="incident-swiper"
        >
          {/* ===================================== */}
          {/* SLIDE 1 : Analisis Distribusi */}
          {/* ===================================== */}

          <SwiperSlide>
            <div onClick={() => setShowDistributionAnalysis(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-blue-600 text-[11px] font-semibold">
                      Okupansi Camera CCTV
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <FiCamera size={17} />
                      </span>
                      Analisis Distribusi Kamera
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis penyebaran jumlah kamera CCTV pada setiap area monitoring
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Area Monitoring
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {distributionAnalysis.totalArea}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Total Kamera CCTV
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {distributionAnalysis.totalCamera}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Rata-rata / Area
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {distributionAnalysis.average}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-4">
                    <p className="text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                      Area Terbanyak
                    </p>
                    <h3 className="text-lg md:text-xl font-bold text-purple-600 mt-2 truncate">
                      {distributionAnalysis.highest.area}
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Distribusi Kamera per Area
                  </h3>

                  <div className="h-[280px] md:h-[320px]">
                    <Bar data={distributionChart} options={barOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Area Dengan Jumlah Kamera Terbanyak
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {distributionAnalysis.highest.area} ({distributionAnalysis.highest.total}{' '}
                      Kamera)
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
          {/* SLIDE 2 : Analisis Tipe Kamera */}
          {/* ===================================== */}

          <SwiperSlide>
            <div onClick={() => setShowCameraTypeAnalysis(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-yellow-600 text-[11px] font-semibold">
                      Okupansi Camera CCTV
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-50 text-yellow-600 shrink-0">
                        <FiVideo size={17} />
                      </span>
                      Analisis Tipe Kamera
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis komposisi penggunaan kamera IP dan kamera analog pada sistem CCTV
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Kamera CCTV
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {cameraTypeAnalysis.totalCamera}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera IP
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {cameraTypeAnalysis.totalIP}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-4">
                    <p className="text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera Analog
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-orange-600 mt-2 tabular-nums">
                      {cameraTypeAnalysis.totalAnalog}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Persentase Kamera IP
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {cameraTypeAnalysis.ipPercentage}%
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Komposisi Tipe Kamera
                  </h3>

                  <div className="h-[280px] md:h-[320px] flex justify-center items-center">
                    <Doughnut data={cameraTypeChart} options={pieOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Tipe Kamera Dominan</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cameraTypeAnalysis.highest.type} ({cameraTypeAnalysis.highest.total} Unit)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-yellow-500 transition-colors duration-300">
                    Lihat Laporan
                    <FiArrowRight />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* ===================================== */}
          {/* SLIDE 3 : Analisis Penambahan Kamera */}
          {/* ===================================== */}

          <SwiperSlide>
            <div
              onClick={() => setShowAdditionalCameraAnalysis(true)}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-green-600 text-[11px] font-semibold">
                      Okupansi Camera CCTV
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 text-green-600 shrink-0">
                        <FiPlusCircle size={17} />
                      </span>
                      Analisis Penambahan Kamera
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis kebutuhan penambahan kamera CCTV pada setiap area monitoring
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Penambahan Kamera
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {additionalCameraAnalysis.totalAdditional}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-red-50/60 border border-red-100 p-4">
                    <p className="text-red-700 text-[11px] font-semibold uppercase tracking-wide">
                      Area Membutuhkan Ekspansi
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-red-600 mt-2 tabular-nums">
                      {additionalCameraAnalysis.needArea}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Rata-rata / Area
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {additionalCameraAnalysis.average}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Prioritas Tertinggi
                    </p>
                    <h3 className="text-lg md:text-xl font-bold text-green-600 mt-2 truncate">
                      {additionalCameraAnalysis.highest.area}
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Kebutuhan Penambahan Kamera per Area
                  </h3>

                  <div className="h-[280px] md:h-[320px]">
                    <Bar data={additionalCameraChart} options={horizontalBarOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Kebutuhan Penambahan Kamera Tertinggi
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {additionalCameraAnalysis.highest.area} (
                      {additionalCameraAnalysis.highest.total} Unit)
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

          {/* ===================================== */}
          {/* SLIDE 4 : Ringkasan Occupancy Kamera */}
          {/* ===================================== */}

          <SwiperSlide>
            <div onClick={() => setShowOccupancySummary(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                      Camera Occupancy
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                        <FiBarChart2 size={17} />
                      </span>
                      Ringkasan Occupancy Kamera
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Ringkasan kondisi penggunaan kamera CCTV berdasarkan seluruh area monitoring
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Kamera CCTV
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {occupancySummary.totalCamera}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera IP
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {occupancySummary.totalIP}
                    </h3>
                    <p className="text-blue-600 text-xs mt-0.5">{occupancySummary.ipPercentage}%</p>
                  </div>

                  <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-4">
                    <p className="text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera Analog
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-orange-600 mt-2 tabular-nums">
                      {occupancySummary.totalAnalog}
                    </h3>
                    <p className="text-orange-600 text-xs mt-0.5">
                      {occupancySummary.analogPercentage}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50/60 border border-green-100 p-4">
                    <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera Tambahan
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
                      {occupancySummary.totalAdditional}
                    </h3>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Radar Occupancy Kamera
                  </h3>

                  <div className="h-[280px] md:h-[320px] flex justify-center items-center">
                    <Radar data={occupancySummaryChart} options={radarOptions} />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Tingkat Coverage Kamera</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {occupancySummary.occupancyRate}% Cakupan Area Monitoring
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
          {/* SLIDE 5 : Jenis Kamera Berdasarkan Area */}
          {/* ===================================== */}

          <SwiperSlide>
            <div
              onClick={() => setShowCameraTypeByAreaAnalysis(true)}
              className="group cursor-pointer"
            >
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-blue-600 text-[11px] font-semibold">
                      Camera Occupancy
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <FiVideo size={17} />
                      </span>
                      Jenis Kamera Berdasarkan Area
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis perbandingan distribusi Kamera IP dan Kamera Analog berdasarkan area
                      monitoring
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      Total Area Monitoring
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {cameraTypeByAreaAnalysis.totalArea}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                      Total Kamera CCTV
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                      {cameraTypeByAreaAnalysis.totalCamera}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-4">
                    <p className="text-indigo-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera IP
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-indigo-600 mt-2 tabular-nums">
                      {cameraTypeByAreaAnalysis.totalIP}
                    </h3>
                    <p className="text-indigo-600 text-xs mt-0.5">
                      {cameraTypeByAreaAnalysis.ipPercentage}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-4">
                    <p className="text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                      Kamera Analog
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-orange-600 mt-2 tabular-nums">
                      {cameraTypeByAreaAnalysis.totalAnalog}
                    </h3>
                    <p className="text-orange-600 text-xs mt-0.5">
                      {cameraTypeByAreaAnalysis.analogPercentage}%
                    </p>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Tren Jenis Kamera per Area
                  </h3>

                  <div className="h-[280px] md:h-[320px]">
                    <Line
                      data={cameraTypeByAreaChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                return `${context.dataset.label}: ${context.raw} Kamera`;
                              },
                            },
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
                    <p className="text-sm font-semibold text-slate-800">Area Dominan Kamera IP</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cameraTypeByAreaAnalysis.highestIPArea.area} (
                      {cameraTypeByAreaAnalysis.highestIPArea.ip} Kamera IP)
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
        </Swiper>
        {/* =======================================================
    ANALISIS DISTRIBUSI KAMERA
======================================================= */}

        {showDistributionAnalysis && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-6"
            onClick={() => setShowDistributionAnalysis(false)}
          >
            <div
              className="bg-white rounded-[36px] shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}

              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="uppercase tracking-[5px] text-blue-500 text-xs font-semibold">
                    ANALISIS OCCUPANCY KAMERA CCTV
                  </p>

                  <h2 className="text-4xl font-bold mt-2 flex items-center gap-3">
                    <FiMapPin className="text-blue-600" />
                    Analisis Distribusi Kamera CCTV
                  </h2>

                  <p className="text-gray-500 mt-2">
                    Analisis persebaran kamera CCTV berdasarkan lokasi pemasangan.
                  </p>
                </div>

                <button
                  onClick={() => setShowDistributionAnalysis(false)}
                  className="w-12 h-12 rounded-full bg-red-100 hover:bg-red-500 hover:text-white duration-300 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* KPI */}

              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-3xl p-6">
                  <p className="text-gray-500">Total Lokasi Monitoring</p>

                  <h2 className="text-5xl font-bold text-blue-600 mt-2">
                    {distributionAnalysis.totalArea}
                  </h2>
                </div>

                <div className="bg-green-50 rounded-3xl p-6">
                  <p className="text-gray-500">Total Kamera CCTV</p>

                  <h2 className="text-5xl font-bold text-green-600 mt-2">
                    {distributionAnalysis.totalCamera}
                  </h2>
                </div>

                <div className="bg-yellow-50 rounded-3xl p-6">
                  <p className="text-gray-500">Rata-rata Kamera</p>

                  <h2 className="text-5xl font-bold text-yellow-600 mt-2">
                    {distributionAnalysis.average}
                  </h2>

                  <p className="mt-2 text-yellow-600">Kamera / Lokasi</p>
                </div>

                <div className="bg-purple-50 rounded-3xl p-6">
                  <p className="text-gray-500">Lokasi Kamera Terbanyak</p>

                  <h2 className="text-2xl font-bold text-purple-600 mt-2">
                    {distributionAnalysis.highest.area}
                  </h2>

                  <p className="text-purple-600 mt-2">
                    {distributionAnalysis.highest.total} Kamera
                  </p>
                </div>
              </div>

              {/* CHART */}

              <div className="bg-white border rounded-[32px] shadow-inner p-8 mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiBarChart2 className="text-blue-600" />
                  Grafik Distribusi Kamera CCTV
                </h3>

                <div className="h-[420px]">
                  <Bar data={distributionChart} options={lineChartOptions} />
                </div>
              </div>

              {/* TABLE */}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiList className="text-blue-600" />
                  Ranking Distribusi Kamera
                </h3>

                <table className="w-full rounded-3xl overflow-hidden">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-4">No</th>

                      <th>Lokasi</th>

                      <th>Total Kamera CCTV</th>

                      <th>Persentase</th>
                    </tr>
                  </thead>

                  <tbody>
                    {distributionAnalysis.ranking.map((item, index) => (
                      <tr key={index} className="border-b text-center hover:bg-gray-50">
                        <td className="p-4">{index + 1}</td>

                        <td className="font-semibold">{item.area}</td>

                        <td>{item.total}</td>

                        <td>
                          {distributionAnalysis.totalCamera
                            ? ((item.total / distributionAnalysis.totalCamera) * 100).toFixed(1)
                            : '0.0'}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* INSIGHT */}

              <div className="bg-blue-50 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiTrendingUp className="text-blue-600" />
                  Insight Analisis
                </h3>

                <ul className="space-y-3">
                  {distributionAnalysis.insight.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              {/* RECOMMENDATION */}

              <div className="bg-green-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FaLightbulb className="text-green-600" />
                  Rekomendasi Maintenance
                </h3>

                <ul className="space-y-3">
                  {distributionAnalysis.recommendation.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
    ANALISIS TIPE CAMERA
======================================================= */}

        {showCameraTypeAnalysis && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-6"
            onClick={() => setShowCameraTypeAnalysis(false)}
          >
            <div
              className="bg-white rounded-[36px] shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}

              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="uppercase tracking-[5px] text-green-600 text-xs font-semibold">
                    ANALISIS TIPE CAMERA
                  </p>

                  <h2 className="text-4xl font-bold mt-2 flex items-center gap-3">
                    <FiVideo />
                    Analisis Tipe Kamera
                  </h2>

                  <p className="text-gray-500 mt-2">
                    Analisis komposisi penggunaan IP Camera dan Analog Camera pada sistem CCTV.
                  </p>
                </div>

                <button
                  onClick={() => setShowCameraTypeAnalysis(false)}
                  className="w-12 h-12 rounded-full bg-red-100 hover:bg-red-500 hover:text-white duration-300 text-2xl flex items-center justify-center"
                >
                  <FiX />
                </button>
              </div>

              {/* KPI */}

              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-3xl p-6">
                  <p className="text-gray-500">Total Kamera</p>

                  <h2 className="text-5xl font-bold text-blue-600 mt-2">
                    {cameraTypeAnalysis.totalCamera}
                  </h2>
                </div>

                <div className="bg-green-50 rounded-3xl p-6">
                  <p className="text-gray-500">IP Camera</p>

                  <h2 className="text-5xl font-bold text-green-600 mt-2">
                    {cameraTypeAnalysis.totalIP}
                  </h2>

                  <p className="mt-2 text-green-600">{cameraTypeAnalysis.ipPercentage}%</p>
                </div>

                <div className="bg-yellow-50 rounded-3xl p-6">
                  <p className="text-gray-500">Analog Camera</p>

                  <h2 className="text-5xl font-bold text-yellow-600 mt-2">
                    {cameraTypeAnalysis.totalAnalog}
                  </h2>

                  <p className="mt-2 text-yellow-600">{cameraTypeAnalysis.analogPercentage}%</p>
                </div>

                <div className="bg-purple-50 rounded-3xl p-6">
                  <p className="text-gray-500">Tipe Dominan</p>

                  <h2 className="text-3xl font-bold text-purple-600 mt-2">
                    {cameraTypeAnalysis.highest.type}
                  </h2>

                  <p className="mt-2 text-purple-600">{cameraTypeAnalysis.highest.total} Kamera</p>
                </div>
              </div>

              {/* CHART */}

              <div className="bg-white border rounded-[32px] shadow-inner p-8 mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiPieChart />
                  Distribusi Tipe Kamera
                </h3>

                <div className="h-[420px] flex justify-center">
                  <Pie data={cameraTypeChart} options={pieOptions} />
                </div>
              </div>

              {/* TABLE */}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiList />
                  Ringkasan Tipe Kamera
                </h3>

                <table className="w-full rounded-3xl overflow-hidden">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="p-4">No</th>

                      <th>Tipe Kamera</th>

                      <th>Jumlah</th>

                      <th>Persentase</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cameraTypeAnalysis.ranking.map((item, index) => (
                      <tr key={index} className="border-b text-center hover:bg-gray-50">
                        <td className="p-4">{index + 1}</td>

                        <td className="font-semibold">{item.type}</td>

                        <td>{item.total}</td>

                        <td>{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* INSIGHT */}

              <div className="bg-green-50 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiTrendingUp />
                  Insight Analisis
                </h3>

                <ul className="space-y-3">
                  {cameraTypeAnalysis.insight.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              {/* RECOMMENDATION */}

              <div className="bg-blue-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiCheckCircle />
                  Rekomendasi
                </h3>

                <ul className="space-y-3">
                  {cameraTypeAnalysis.recommendation.map((item, index) => (
                    <li key={index}>
                      <FiCheckCircle className="inline mr-2 text-blue-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
    ANALISIS KEBUTUHAN PENAMBAHAN CAMERA
======================================================= */}

        {showAdditionalCameraAnalysis && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-6"
            onClick={() => setShowAdditionalCameraAnalysis(false)}
          >
            <div
              className="bg-white rounded-[36px] shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}

              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="uppercase tracking-[5px] text-red-500 text-xs font-semibold">
                    ANALISIS EKSPANSI CAMERA
                  </p>

                  <h2 className="text-4xl font-bold mt-2 flex items-center gap-3">
                    <FiPlusCircle />
                    Analisis Kebutuhan Penambahan Kamera
                  </h2>

                  <p className="text-gray-500 mt-2">
                    Analisis kebutuhan penambahan CCTV berdasarkan prioritas setiap area monitoring.
                  </p>
                </div>

                <button
                  onClick={() => setShowAdditionalCameraAnalysis(false)}
                  className="w-12 h-12 rounded-full bg-red-100 hover:bg-red-500 hover:text-white duration-300 text-2xl flex items-center justify-center"
                >
                  <FiX />
                </button>
              </div>

              {/* KPI */}

              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-red-50 rounded-3xl p-6">
                  <p className="text-gray-500">Total Tambahan Kamera</p>

                  <h2 className="text-5xl font-bold text-red-600 mt-2">
                    {additionalCameraAnalysis.totalAdditional}
                  </h2>
                </div>

                <div className="bg-blue-50 rounded-3xl p-6">
                  <p className="text-gray-500">Total Area</p>

                  <h2 className="text-5xl font-bold text-blue-600 mt-2">
                    {additionalCameraAnalysis.totalArea}
                  </h2>
                </div>

                <div className="bg-green-50 rounded-3xl p-6">
                  <p className="text-gray-500">Rata-rata Kebutuhan</p>

                  <h2 className="text-5xl font-bold text-green-600 mt-2">
                    {additionalCameraAnalysis.average}
                  </h2>

                  <p className="mt-2 text-green-600">Kamera / Area</p>
                </div>

                <div className="bg-yellow-50 rounded-3xl p-6">
                  <p className="text-gray-500">Area Prioritas Tertinggi</p>

                  <h2 className="text-2xl font-bold text-yellow-600 mt-2">
                    {additionalCameraAnalysis.highest.area}
                  </h2>

                  <p className="mt-2 text-yellow-600">
                    {additionalCameraAnalysis.highest.total} Kamera
                  </p>
                </div>
              </div>

              {/* CHART */}

              <div className="bg-white border rounded-[32px] shadow-inner p-8 mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiBarChart2 />
                  Analisis Kebutuhan Penambahan Kamera
                </h3>

                <div className="h-[420px]">
                  <Bar data={additionalCameraChart} options={lineChartOptions} />
                </div>
              </div>

              {/* TABLE */}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiList />
                  Ranking Kebutuhan Penambahan Kamera
                </h3>

                <table className="w-full rounded-3xl overflow-hidden">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="p-4">No</th>

                      <th>Area</th>

                      <th>Tambahan Kamera</th>

                      <th>Kontribusi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {additionalCameraAnalysis.ranking.map((item, index) => (
                      <tr key={index} className="border-b text-center hover:bg-gray-50">
                        <td className="p-4">{index + 1}</td>

                        <td className="font-semibold">{item.area}</td>

                        <td>{item.total}</td>

                        <td>
                          {additionalCameraAnalysis.totalAdditional
                            ? (
                                (item.total / additionalCameraAnalysis.totalAdditional) *
                                100
                              ).toFixed(1)
                            : '0.0'}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* INSIGHT */}

              <div className="bg-red-50 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiTrendingUp />
                  Insight Analisis
                </h3>

                <ul className="space-y-3">
                  {additionalCameraAnalysis.insight.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              {/* RECOMMENDATION */}

              <div className="bg-blue-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiCheckCircle />
                  Rekomendasi
                </h3>

                <ul className="space-y-3">
                  {additionalCameraAnalysis.recommendation.map((item, index) => (
                    <li key={index}>
                      <FiCheckCircle className="inline mr-2 text-blue-600" />

                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
    CAMERA OCCUPANCY SUMMARY ANALYSIS
======================================================= */}

        {showOccupancySummary && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-6"
            onClick={() => setShowOccupancySummary(false)}
          >
            <div
              className="bg-white rounded-[36px] shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}

              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="uppercase tracking-[5px] text-indigo-600 text-xs font-semibold">
                    EXECUTIVE SUMMARY
                  </p>

                  <h2 className="text-4xl font-bold mt-2">📊 Camera Occupancy Summary</h2>

                  <p className="text-gray-500 mt-2">
                    Ringkasan kondisi keseluruhan infrastruktur CCTV.
                  </p>
                </div>

                <button
                  onClick={() => setShowOccupancySummary(false)}
                  className="w-12 h-12 rounded-full bg-red-100 hover:bg-red-500 hover:text-white duration-300 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* KPI */}

              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-3xl p-6">
                  <p className="text-gray-500">Total Camera</p>

                  <h2 className="text-5xl font-bold text-blue-600 mt-2">
                    {occupancySummary.totalCamera}
                  </h2>
                </div>

                <div className="bg-green-50 rounded-3xl p-6">
                  <p className="text-gray-500">IP Camera</p>

                  <h2 className="text-5xl font-bold text-green-600 mt-2">
                    {occupancySummary.totalIP}
                  </h2>

                  <p className="mt-2 text-green-600">{occupancySummary.ipPercentage}%</p>
                </div>

                <div className="bg-yellow-50 rounded-3xl p-6">
                  <p className="text-gray-500">Analog Camera</p>

                  <h2 className="text-5xl font-bold text-yellow-600 mt-2">
                    {occupancySummary.totalAnalog}
                  </h2>

                  <p className="mt-2 text-yellow-600">{occupancySummary.analogPercentage}%</p>
                </div>

                <div className="bg-red-50 rounded-3xl p-6">
                  <p className="text-gray-500">Additional Camera</p>

                  <h2 className="text-5xl font-bold text-red-600 mt-2">
                    {occupancySummary.totalAdditional}
                  </h2>
                </div>
              </div>

              {/* CHART */}

              <div className="bg-white border rounded-[32px] shadow-inner p-8 mb-8">
                <h3 className="text-2xl font-bold mb-5">📈 Occupancy Summary</h3>

                <div className="h-[420px]">
                  <Bar data={occupancySummaryChart} options={lineChartOptions} />
                </div>
              </div>

              {/* TABLE */}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-5">📋 Camera Occupancy Overview</h3>

                <table className="w-full rounded-3xl overflow-hidden">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      <th className="p-4">Category</th>

                      <th>Total</th>

                      <th>Percentage</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="text-center border-b">
                      <td>Total Camera</td>
                      <td>{occupancySummary.totalCamera}</td>
                      <td>100%</td>
                    </tr>

                    <tr className="text-center border-b">
                      <td>IP Camera</td>
                      <td>{occupancySummary.totalIP}</td>
                      <td>{occupancySummary.ipPercentage}%</td>
                    </tr>

                    <tr className="text-center border-b">
                      <td>Analog Camera</td>
                      <td>{occupancySummary.totalAnalog}</td>
                      <td>{occupancySummary.analogPercentage}%</td>
                    </tr>

                    <tr className="text-center border-b">
                      <td>Additional Camera</td>
                      <td>{occupancySummary.totalAdditional}</td>
                      <td>{occupancySummary.additionalRate}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* INSIGHT */}

              <div className="bg-indigo-50 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold mb-5">📈 Executive Insight</h3>

                <ul className="space-y-3">
                  {occupancySummary.insight.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              {/* RECOMMENDATION */}

              <div className="bg-green-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-5">💡 Strategic Recommendation</h3>

                <ul className="space-y-3">
                  {occupancySummary.recommendation.map((item, index) => (
                    <li key={index}>✅ {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
    CAMERA TYPE BY AREA ANALYSIS MODAL
======================================================= */}

        {showCameraTypeByAreaAnalysis && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[999] p-6"
            onClick={() => setShowCameraTypeByAreaAnalysis(false)}
          >
            <div
              className="bg-white rounded-[36px] shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-y-auto p-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}

              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="uppercase tracking-[6px] text-blue-600 text-xs font-semibold">
                    CAMERA INTELLIGENCE REPORT
                  </p>

                  <h2 className="text-4xl font-bold text-gray-800 mt-3">
                    📊 Camera Type By Area Analysis
                  </h2>

                  <p className="text-gray-500 mt-3">
                    Analisis detail distribusi IP Camera dan Analog Camera pada setiap area.
                  </p>
                </div>

                <button
                  onClick={() => setShowCameraTypeByAreaAnalysis(false)}
                  className="w-12 h-12 rounded-full bg-red-100 hover:bg-red-500 hover:text-white duration-300 text-3xl"
                >
                  ×
                </button>
              </div>

              {/* KPI */}

              <div className="grid grid-cols-4 gap-6 mb-10">
                <div className="bg-gray-50 rounded-3xl p-6">
                  <p className="text-gray-500">Total Area</p>

                  <h2 className="text-5xl font-bold text-gray-800 mt-3">
                    {cameraTypeByAreaAnalysis.totalArea}
                  </h2>
                </div>

                <div className="bg-blue-50 rounded-3xl p-6">
                  <p className="text-blue-600">IP Camera</p>

                  <h2 className="text-5xl font-bold text-blue-600 mt-3">
                    {cameraTypeByAreaAnalysis.totalIP}
                  </h2>

                  <p className="text-blue-600 mt-2">{cameraTypeByAreaAnalysis.ipPercentage}%</p>
                </div>

                <div className="bg-orange-50 rounded-3xl p-6">
                  <p className="text-orange-600">Analog Camera</p>

                  <h2 className="text-5xl font-bold text-orange-600 mt-3">
                    {cameraTypeByAreaAnalysis.totalAnalog}
                  </h2>

                  <p className="text-orange-600 mt-2">
                    {cameraTypeByAreaAnalysis.analogPercentage}%
                  </p>
                </div>

                <div className="bg-green-50 rounded-3xl p-6">
                  <p className="text-green-600">Total Camera</p>

                  <h2 className="text-5xl font-bold text-green-600 mt-3">
                    {cameraTypeByAreaAnalysis.totalCamera}
                  </h2>
                </div>
              </div>

              {/* CHART */}

              <div className="bg-white border rounded-[32px] shadow-inner p-8 mb-10">
                <div className="flex justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <FiBarChart2 className="text-blue-600" />
                    Distribusi Teknologi Kamera Per Area
                  </h3>

                  <span className="text-gray-500">IP vs Analog</span>
                </div>

                <div className="h-[420px]">
                  <Line
                    data={cameraTypeByAreaChart}
                    options={{
                      responsive: true,

                      maintainAspectRatio: false,

                      plugins: {
                        legend: {
                          position: 'top',

                          labels: {
                            font: {
                              size: 14,
                            },
                          },
                        },

                        tooltip: {
                          callbacks: {
                            label: (ctx) => {
                              return `${ctx.dataset.label}: ${ctx.raw} Kamera`;
                            },
                          },
                        },
                      },

                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },

                      elements: {
                        line: {
                          tension: 0.4,
                        },

                        point: {
                          radius: 6,

                          hoverRadius: 9,
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

              {/* TABLE */}

              <div className="bg-gray-50 rounded-[32px] p-8 mb-10">
                <div className="flex items-center gap-3">
                  <FiMapPin className="text-blue-600" />
                  Perbandingan Teknologi Kamera Berdasarkan Area
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th>Area</th>

                        <th>IP Camera</th>

                        <th>Kamera Analog</th>

                        <th>Total Kamera</th>

                        <th>Persentase IP</th>

                        <th>Persentase Analog</th>
                      </tr>
                    </thead>

                    <tbody>
                      {cameraTypeByAreaAnalysis.ranking.map((item, index) => (
                        <tr key={index} className="border-b text-center hover:bg-white">
                          <td className="p-4 text-left font-semibold">{item.area}</td>

                          <td className="font-bold text-blue-600">{item.ip}</td>

                          <td className="font-bold text-orange-600">{item.analog}</td>

                          <td>{item.total}</td>

                          <td>
                            <div className="flex items-center gap-3">
                              <div
                                className="h-2 bg-blue-500 rounded-full"
                                style={{
                                  width: `${item.ipPercentage}%`,
                                }}
                              />

                              <span>{item.ipPercentage}%</span>
                            </div>
                          </td>

                          <td>
                            <div className="flex items-center gap-3">
                              <div
                                className="h-2 bg-orange-500 rounded-full"
                                style={{
                                  width: `${item.analogPercentage}%`,
                                }}
                              />

                              <span>{item.analogPercentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INSIGHT */}

              <div className="bg-blue-50 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FiTrendingUp className="text-blue-600" />
                  Insight Analisis
                </h3>

                <ul className="space-y-3 text-gray-700">
                  {cameraTypeByAreaAnalysis.insight.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>

              {/* RECOMMENDATION */}

              <div className="bg-green-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-5 flex items-center gap-3">
                  <FaLightbulb className="text-green-600" />
                  Rekomendasi Strategis
                </h3>
                <ul className="space-y-3 text-gray-700">
                  {cameraTypeByAreaAnalysis.recommendation.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <FaLightbulb className="text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =====================================
    Camera Occupancy Management
===================================== */}

      <section className="p-3 md:p-6">
        {/* HEADER CARD */}

        <div
          ref={occupancyHeaderCardRef}
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
              <FiGrid size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 truncate">
                Manajemen Occupancy Kamera
              </h2>

              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Monitoring occupancy kamera dan aktivitas pengawasan
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
                             ${showAddOccupancyBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                           `}
            >
              <FiPlus size={20} className="shrink-0" />

              {showAddOccupancyBtnText && (
                <span className="whitespace-nowrap">
                  Tambah
                  <br />
                  Occupancy
                </span>
              )}
            </button>
          )}
        </div>

        {/* MONITORING CALENDAR */}

        <div
          ref={occupancyCalendarCardRef}
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
            onClick={() => setShowOccupancyCalendar(true)}
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
                           ${showOccupancyCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                         `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showOccupancyCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showOccupancyCalendar && (
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
            onClick={() => setShowOccupancyCalendar(false)}
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
                onClick={() => setShowOccupancyCalendar(false)}
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
      </section>

      {/* =====================================================
    MODAL FORM OKUPANSI KAMERA
===================================================== */}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-[999] p-6 overflow-y-auto"
          onClick={() => {
            setShowForm(false);
            setIsEditing(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 backdrop-blur-3xl rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,.2)] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10"
          >
            {/* HEADER */}

            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="uppercase tracking-[6px] text-blue-600 text-xs font-semibold">
                  ANALISIS OKUPANSI KAMERA
                </p>

                <h2 className="text-4xl font-bold text-gray-800 mt-3 flex items-center gap-3">
                  <FiCamera className="text-blue-600" />
                  Form Data Okupansi Kamera
                </h2>

                <p className="text-gray-500 mt-3">
                  Input data jumlah kamera berdasarkan area, jenis kamera, dan kebutuhan tambahan
                  CCTV.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="w-12 h-12 rounded-full bg-red-100 hover:bg-red-500 hover:text-white duration-300 text-3xl flex items-center justify-center"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* AREA */}

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Area Monitoring</label>

                <select
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  required
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Pilih Area Monitoring</option>

                  {locations.map((loc, index) => (
                    <option key={loc.id || index} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* INPUT ANGKA */}

              {[
                ['total_kamera', 'Total Kamera'],

                ['ip', 'IP Camera'],

                ['analog', 'Analog Camera'],

                ['jumlah_kamera_tambahan', 'Kebutuhan Kamera Tambahan'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-sm font-semibold">{label}</label>

                  <input
                    type="number"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    required={key !== 'jumlah_kamera_tambahan'}
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}

              {/* PERCENT IP */}

              <div>
                <label className="text-sm font-semibold">Persentase IP Camera</label>

                <input
                  type="text"
                  readOnly
                  value={
                    formData.total_kamera
                      ? ((Number(formData.ip) / Number(formData.total_kamera)) * 100).toFixed(1) +
                        '%'
                      : '0%'
                  }
                  className="w-full mt-2 px-4 py-3 rounded-2xl border bg-gray-100 text-gray-500 cursor-not-allowed"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Dihitung otomatis berdasarkan jumlah IP Camera.
                </p>
              </div>

              {/* PERCENT ANALOG */}

              <div>
                <label className="text-sm font-semibold">Persentase Analog Camera</label>

                <input
                  type="text"
                  readOnly
                  value={
                    formData.total_kamera
                      ? ((Number(formData.analog) / Number(formData.total_kamera)) * 100).toFixed(
                          1
                        ) + '%'
                      : '0%'
                  }
                  className="w-full mt-2 px-4 py-3 rounded-2xl border bg-gray-100 text-gray-500 cursor-not-allowed"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Dihitung otomatis berdasarkan jumlah Analog Camera.
                </p>
              </div>

              {/* KETERANGAN */}

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Keterangan Tambahan</label>

                <textarea
                  rows={5}
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  placeholder="Masukkan catatan tambahan..."
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* BUTTON */}

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
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================
    Section - Camera Occupancy Table
===================================== */}

      <section className="p-4 mt-12">
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Lokasi..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3">No</th>

                <th className="px-6 py-3">Lokasi</th>

                <th className="px-6 py-3">Total Kamera</th>

                <th className="px-6 py-3">IP Camera</th>

                <th className="px-6 py-3">Analog Camera</th>

                <th className="px-6 py-3">Kebutuhan Tambahan</th>

                <th className="px-6 py-3">Keterangan</th>

                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y bg-white/30">
              {paginatedCameraOccupancy.length > 0 ? (
                <>
                  {paginatedCameraOccupancy.map((item, index) => (
                    <tr key={item.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>

                      <td className="px-6 py-4 font-semibold text-blue-600">{item.area}</td>

                      <td className="px-6 py-4 font-semibold">{item.total_kamera}</td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                          {item.ip}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">
                          {item.analog}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
                          {item.jumlah_kamera_tambahan}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-pre-wrap">{item.keterangan || '-'}</td>

                      <td className="px-6 py-4 text-center space-x-2">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white"
                          >
                            <FiEdit2 /> Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                          >
                            <FiTrash2 /> Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* TOTAL */}
                  <tr className="bg-blue-700 text-white font-bold text-center">
                    <td className="px-6 py-4" colSpan={2}>
                      TOTAL
                    </td>

                    <td className="px-6 py-4">{totalSummary.totalKamera}</td>

                    <td className="px-6 py-4">{totalSummary.ip}</td>

                    <td className="px-6 py-4">{totalSummary.analog}</td>

                    <td className="px-6 py-4">{totalSummary.tambahan}</td>

                    <td className="px-6 py-4">-</td>

                    <td className="px-6 py-4">-</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-gray-500">
                    Tidak Ada Data Kapasitas Kamera
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi */}

        {pageCount > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Menampilkan {paginatedCameraOccupancy.length} dari {filteredCameraOccupancy.length}{' '}
              data
            </p>

            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50"
              >
                <FiChevronLeft /> Sebelumnya
              </button>

              <span>
                Halaman {currentPage} dari {pageCount}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50"
              >
                Berikutnya <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
