// If you only imported useState and useEffect before — add useRef:
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Layout from '../components/Layout';
import { Line, Doughnut, Pie, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Swal from 'sweetalert2';
import MonitoringCalendar from '../components/Calander';
import { appleSwal } from '../utils/appleSwal';

import {
  FiMapPin,
  FiBarChart2,
  FiMap,
  FiAlertTriangle,
  FiActivity,
  FiTrendingUp,
  FiShield,
} from 'react-icons/fi';

import { FiLayers, FiPercent, FiFileText, FiClipboard } from 'react-icons/fi';
import { FiTarget, FiCheckCircle, FiX } from 'react-icons/fi';
import { FiAward, FiList } from 'react-icons/fi';
import { FiCalendar, FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';

import api from '../api/axios';

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

import { LuCalendar } from 'react-icons/lu';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CostumeDatePicker from '../components/CostumeDatePicker';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

// Helper untuk konversi string ke Date object
const parseDate = (str) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

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
export default function IncidentRecord() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [incidentList, setIncidentList] = useState([]);

  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [officers, setOfficers] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedIncidentYear, setSelectedIncidentYear] = useState('all');

  const incidentHeaderCardRef = useRef(null);
  const incidentCalendarCardRef = useRef(null);
  const [showAddIncidentBtnText, setShowAddIncidentBtnText] = useState(true);
  const [showIncidentCalendarText, setShowIncidentCalendarText] = useState(true);
  const [showIncidentCalendar, setShowIncidentCalendar] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  // ==============================
  // INCIDENT PERMISSION
  // ==============================

  const role = localStorage.getItem('role');

  const incidentPermission = {
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

  const access = incidentPermission[role] || incidentPermission.Guest;

  const canCreate = access.create;
  const canEdit = access.update;
  const canDelete = access.delete;

  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    datetimeOfIncident: null,
    location: '',
    category: '',
    descriptionOfIncident: '',
    nameOfficer: '',
    information: '',
    datetimeComplete: null,
  });

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('Token not found. User might not be logged in.');
        return;
      }

      const response = await api.get(`/incident`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data.data || response.data || [];

      console.log('Raw incidents fetched from backend:', data);

      const incidentsWithProcessedData = data.map((incident) => {
        const incidentDate = new Date(incident.datetimeOfIncident);

        const processedIncident = {
          id: incident.id || incident.ID,

          datetimeOfIncident: incident.datetimeOfIncident,

          // TAMBAHAN UNTUK FILTER TAHUN
          incidentDate,

          year: !isNaN(incidentDate) ? incidentDate.getFullYear() : null,

          location: incident.location,

          category: incident.category,

          descriptionOfIncident: incident.descriptionOfIncident,

          nameOfficer: incident.nameOfficer,

          information: incident.information || '',

          datetimeComplete: incident.datetimeComplete,
        };

        // ============================
        // HITUNG DURASI INCIDENT
        // ============================

        let duration = '00:00:00';

        if (
          processedIncident.datetimeOfIncident &&
          processedIncident.datetimeComplete &&
          processedIncident.datetimeComplete !== '0001-01-01T00:00:00Z'
        ) {
          const start = new Date(processedIncident.datetimeOfIncident);

          const end = new Date(processedIncident.datetimeComplete);

          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffMs = Math.abs(end - start);

            let totalSeconds = Math.floor(diffMs / 1000);

            const hours = Math.floor(totalSeconds / 3600);

            totalSeconds %= 3600;

            const minutes = Math.floor(totalSeconds / 60);

            const seconds = totalSeconds % 60;

            const pad = (num) => String(num).padStart(2, '0');

            duration = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
          }
        }

        return {
          ...processedIncident,

          duration,
        };
      });

      setIncidentList(incidentsWithProcessedData);

      // ===============================
      // AUTO SET LATEST INCIDENT YEAR
      // ===============================

      if (incidentsWithProcessedData.length > 0) {
        const years = incidentsWithProcessedData
          .map((item) => {
            const date = new Date(item.datetimeOfIncident);
            return date.getFullYear();
          })
          .filter((year) => !isNaN(year));

        if (years.length > 0) {
          setSelectedIncidentYear('all');
        }
      }

      console.log('Processed incidents:', incidentsWithProcessedData);
    } catch (error) {
      console.error('Error fetching incidents:', error);

      alert('Failed to retrieve incident data: ' + error.message);
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
      const [locationsRes, categoriesRes, officersRes] = await Promise.all([
        api.get(`/location`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/category`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/officer`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setOfficers(Array.isArray(officersRes.data) ? officersRes.data : []);

      if (locationsRes.data.length > 0) {
        console.log(
          "Example Location Data (check casing of 'id' and 'name'):",
          locationsRes.data[0]
        );
      }
      if (categoriesRes.data.length > 0) {
        console.log(
          "Example Category Data (check casing of 'id' and 'name'):",
          categoriesRes.data[0]
        );
      }
      if (officersRes.data.length > 0) {
        console.log(
          "Example Officer Data (check casing of 'id' and 'name_officer'):",
          officersRes.data[0]
        );
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      alert('Failed to retrieve dropdown data: ' + error.message);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchDataForDropdowns();
  }, []);

  // ================= RESPONSIVE HEADER & CALENDAR BUTTON =================
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === incidentHeaderCardRef.current) {
          setShowAddIncidentBtnText(width > 260);
        }
        if (entry.target === incidentCalendarCardRef.current) {
          setShowIncidentCalendarText(width > 260);
        }
      }
    });

    if (incidentHeaderCardRef.current) observer.observe(incidentHeaderCardRef.current);
    if (incidentCalendarCardRef.current) observer.observe(incidentCalendarCardRef.current);

    return () => observer.disconnect();
  }, []);

  // --- Chart Data helpers ---

  // --- Form Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ================================
    // VALIDASI FIELD WAJIB
    // ================================

    if (
      !formData.datetimeOfIncident ||
      !formData.location ||
      !formData.category ||
      !formData.descriptionOfIncident ||
      !formData.nameOfficer
    ) {
      appleSwal({
        icon: 'warning',
        title: 'Data belum lengkap',
        text: 'Tanggal kejadian, lokasi, kategori, deskripsi, dan petugas wajib diisi.',
        confirmButtonColor: '#2563eb',
      });

      return;
    }

    // ================================
    // KONFIRMASI SIMPAN
    // ================================

    const confirm = await appleSwal({
      title: isEditing ? 'Update incident?' : 'Tambah incident?',
      text: isEditing ? 'Data incident akan diperbarui.' : 'Data incident baru akan disimpan.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isEditing ? 'Ya, Update' : 'Ya, Simpan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#dc2626',
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      // ================================
      // FORMAT DATETIME
      // ================================

      const formatDate = (value) => {
        if (!value) {
          return null;
        }

        const date = new Date(value);

        if (isNaN(date.getTime())) {
          return null;
        }

        return date.toISOString();
      };

      const token = localStorage.getItem('token');

      if (!token) {
        appleSwal({
          icon: 'error',
          title: 'Session berakhir',
          text: 'Silakan login kembali.',
        });

        return;
      }

      // ================================
      // PAYLOAD
      // ================================

      const payload = {
        datetimeOfIncident: formatDate(formData.datetimeOfIncident),
        location: formData.location.trim(),
        category: formData.category.trim(),
        descriptionOfIncident: formData.descriptionOfIncident.trim(),
        nameOfficer: formData.nameOfficer.trim(),

        // OPTIONAL
        information:
          formData.information && formData.information.trim() !== ''
            ? formData.information.trim()
            : null,

        // OPTIONAL
        datetimeComplete: formatDate(formData.datetimeComplete),
      };

      console.log('PAYLOAD INCIDENT:', payload);

      // ================================
      // URL + METHOD
      // ================================

      const url = isEditing ? `/incident/${editId}` : `/incident`;
      const method = isEditing ? 'PUT' : 'POST';

      // ================================
      // LOADING
      // ================================

      appleSwal({
        title: 'Menyimpan data...',
        text: 'Mohon tunggu',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // ================================
      // API REQUEST
      // ================================

      const response = await api({
        method,
        url,
        data: payload,
      });

      Swal.close();

      // ================================
      // SUCCESS
      // ================================

      await appleSwal({
        icon: 'success',
        title: 'Berhasil',
        text:
          response.data.message ||
          (isEditing ? 'Incident berhasil diperbarui.' : 'Incident berhasil ditambahkan.'),
        timer: 2000,
        showConfirmButton: false,
        iconColor: '#16a34a',
      });

      fetchIncidents();

      setShowForm(false);
      setIsEditing(false);
      setEditId(null);

      setFormData({
        datetimeOfIncident: '',
        location: '',
        category: '',
        descriptionOfIncident: '',
        nameOfficer: '',
        information: '',
        datetimeComplete: '',
      });
    } catch (err) {
      Swal.close();

      console.error('ERROR SAVE INCIDENT:', err.response?.data || err.message);

      let errorMessage = 'Terjadi kesalahan saat menyimpan data.';

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = 'Data yang dikirim tidak valid. Periksa kembali input form.';
        } else if (err.response.status === 401) {
          errorMessage = 'Sesi login sudah berakhir. Silakan login ulang.';
        } else if (err.response.status === 500) {
          errorMessage = 'Terjadi kesalahan server saat menyimpan data.';
        } else {
          errorMessage =
            err.response.data?.message ||
            (typeof err.response.data === 'string' ? err.response.data : errorMessage);
        }
      }

      appleSwal({
        icon: 'error',
        title: 'Gagal menyimpan incident',
        text: errorMessage,
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleEdit = (incident) => {
    setFormData({
      datetimeOfIncident: incident.datetimeOfIncident
        ? new Date(incident.datetimeOfIncident)
        : null,

      datetimeComplete:
        incident.datetimeComplete && incident.datetimeComplete !== '0001-01-01T00:00:00Z'
          ? new Date(incident.datetimeComplete)
          : null,

      location: incident.location || '',
      category: incident.category || '',
      descriptionOfIncident: incident.descriptionOfIncident || '',
      nameOfficer: incident.nameOfficer || '',
      information: incident.information || '',
    });

    setShowForm(true);
    setIsEditing(true);
    setEditId(incident.id);
  };

  const handleDelete = async (id) => {
    const confirm = await appleSwal({
      title: 'Hapus incident?',
      text: 'Data incident akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      appleSwal({
        title: 'Menghapus data...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await api.delete(`/incident/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.close();

      await appleSwal({
        icon: 'success',
        title: 'Berhasil',
        text: response.data.message || 'Incident berhasil dihapus.',
        timer: 2000,
        showConfirmButton: false,
      });

      fetchIncidents();
    } catch (err) {
      Swal.close();

      console.error('Delete incident error:', err.response?.data || err.message);

      appleSwal({
        icon: 'error',
        title: 'Gagal menghapus',
        text:
          err.response?.data?.message ||
          (typeof err.response?.data === 'string' ? err.response.data : null) ||
          'Terjadi kesalahan saat menghapus data.',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const incidentYears = useMemo(() => {
    const years = incidentList
      .map((item) => item.year) // sudah dihitung di fetchIncidents
      .filter((year) => year !== null && !isNaN(year));

    // ambil unique years, urutkan dari terbaru ke terlama
    return [...new Set(years)].sort((a, b) => b - a);
  }, [incidentList]);

  const filteredIncidents = incidentList.filter((item) => {
    const searchLower = searchTerm.trim().toLowerCase();

    // gunakan field 'year' yang sudah dihitung di fetchIncidents, bukan hitung ulang
    const incidentYear = item.year;

    // ambil area lokasi
    const area = item.location?.area || item.location?.name_location || item.location || '';
    const locationArea = area.toString().trim().toLowerCase();

    const category = (item.category?.name_category || item.category || '').toString().toLowerCase();
    const officer = item.nameOfficer?.toString().toLowerCase() || '';

    const matchYear = selectedIncidentYear === 'all' || incidentYear === selectedIncidentYear;

    const matchSearch =
      searchLower === '' ||
      locationArea.includes(searchLower) ||
      category.includes(searchLower) ||
      officer.includes(searchLower);

    return matchYear && matchSearch;
  });

  const pageCount = Math.ceil(filteredIncidents.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount || 1);
    }
  }, [pageCount, currentPage]);

  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // =====================================
  // INCIDENT DISTRIBUTION ANALYSIS PER LOCATION
  // =====================================

  const getIncidentByLocationAnalysis = () => {
    const locationMap = {};

    // gunakan data yang sudah difilter tahun
    filteredIncidents.forEach((item) => {
      const location =
        typeof item.location === 'object'
          ? item.location?.name_location
          : item.location || 'Tidak diketahui';

      if (!locationMap[location]) {
        locationMap[location] = 0;
      }

      locationMap[location]++;
    });

    const totalIncident = filteredIncidents.length;

    const ranking = Object.entries(locationMap)

      .map(([location, total]) => {
        const percentage =
          totalIncident > 0 ? Number(((total / totalIncident) * 100).toFixed(2)) : 0;

        let risk = 'LOW';

        if (total >= 50 || percentage >= 50) {
          risk = 'CRITICAL';
        } else if (total >= 30 || percentage >= 30) {
          risk = 'HIGH';
        } else if (total >= 10 || percentage >= 15) {
          risk = 'MEDIUM';
        }

        return {
          location,

          total,

          percentage,

          risk,
        };
      })

      .sort((a, b) => b.total - a.total);

    const highest = ranking[0] || {
      location: '-',

      total: 0,

      percentage: 0,

      risk: 'NO DATA',
    };

    return {
      totalLocation: ranking.length,

      totalIncident,

      average: ranking.length > 0 ? Number((totalIncident / ranking.length).toFixed(2)) : 0,

      highest,

      ranking,

      top10: ranking.slice(0, 10),

      insight:
        ranking.length > 0
          ? [
              `Total incident periode ${selectedIncidentYear} sebanyak ${totalIncident} kejadian.`,

              `Lokasi dengan incident tertinggi adalah ${highest.location} sebanyak ${highest.total} incident (${highest.percentage}%).`,

              `Rata-rata incident per lokasi adalah ${(totalIncident / ranking.length).toFixed(2)} kejadian.`,

              `${highest.location} menjadi prioritas investigasi karena memiliki frekuensi incident tertinggi.`,
            ]
          : ['Belum terdapat data incident.'],

      recommendation:
        ranking.length > 0
          ? [
              `Lakukan investigasi detail pada lokasi ${highest.location}.`,

              'Analisa pola kejadian berulang berdasarkan kategori incident.',

              'Tingkatkan inspeksi keselamatan pada lokasi dengan risiko tinggi.',

              'Buat preventive action berdasarkan ranking incident area.',
            ]
          : ['Belum ada rekomendasi.'],
    };
  };

  const getIncidentByLocation = () => {
    const analysis = getIncidentByLocationAnalysis();

    return {
      labels: analysis.top10.map((item) => item.location),

      datasets: [
        {
          label: 'Jumlah Incident',

          data: analysis.top10.map((item) => item.total),

          backgroundColor: analysis.top10.map((item) => {
            if (item.risk === 'CRITICAL') return '#dc2626';

            if (item.risk === 'HIGH') return '#f97316';

            if (item.risk === 'MEDIUM') return '#f59e0b';

            return '#16a34a';
          }),

          borderRadius: 12,

          barThickness: 35,
        },
      ],
    };
  };

  // =====================================
  // INCIDENT DISTRIBUTION ANALYSIS PER CATEGORY
  // =====================================

  const getIncidentCategoryAnalysis = () => {
    const categoryMap = {};

    filteredIncidents.forEach((item) => {
      const category =
        item.category?.name_category || item.category?.name || item.category || 'Tidak diketahui';

      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }

      categoryMap[category]++;
    });

    const totalIncident = filteredIncidents.length;

    const ranking = Object.entries(categoryMap)

      .map(([category, total]) => {
        const percentage =
          totalIncident > 0 ? Number(((total / totalIncident) * 100).toFixed(2)) : 0;

        let risk = 'LOW';

        // Risk berdasarkan jumlah & kontribusi
        if (total >= 50 || percentage >= 50) {
          risk = 'CRITICAL';
        } else if (total >= 30 || percentage >= 30) {
          risk = 'HIGH';
        } else if (total >= 10 || percentage >= 15) {
          risk = 'MEDIUM';
        }

        return {
          category,
          total,
          percentage,
          risk,
        };
      })

      .sort((a, b) => b.total - a.total);

    const highest = ranking[0] || {
      category: '-',
      total: 0,
      percentage: 0,
      risk: 'NO DATA',
    };

    return {
      totalCategory: ranking.length,

      totalIncident,

      average: ranking.length > 0 ? Number((totalIncident / ranking.length).toFixed(2)) : 0,

      highest,

      ranking,

      top10: ranking.slice(0, 10),

      insight:
        ranking.length > 0
          ? [
              `Total incident periode ${selectedIncidentYear} sebanyak ${totalIncident} kejadian.`,

              `Kategori paling dominan adalah ${highest.category} dengan ${highest.total} incident (${highest.percentage}%).`,

              `Kategori ${highest.category} memiliki level risiko ${highest.risk}.`,

              `${
                ranking.filter((item) => item.risk === 'CRITICAL').length
              } kategori masuk dalam level risiko critical.`,
            ]
          : ['Belum terdapat data incident.'],

      recommendation:
        ranking.length > 0
          ? [
              `Prioritaskan mitigasi kategori ${highest.category}.`,

              `Lakukan investigasi penyebab utama pada kategori dengan jumlah incident tertinggi (${highest.total} kejadian).`,

              'Lakukan refresh training sesuai kategori incident dominan.',

              'Evaluasi SOP dan preventive action untuk mengurangi kejadian berulang.',
            ]
          : ['Belum ada rekomendasi.'],
    };
  };

  const getIncidentByCategory = () => {
    const analysis = getIncidentCategoryAnalysis();

    const colors = [
      '#2563eb',
      '#dc2626',
      '#f59e0b',
      '#16a34a',
      '#9333ea',
      '#db2777',
      '#0891b2',
      '#65a30d',
      '#475569',
      '#ea580c',
    ];

    return {
      labels: analysis.top10.map((item) => item.category),

      datasets: [
        {
          label: 'Incident Category',

          data: analysis.top10.map((item) => item.total),

          backgroundColor: analysis.top10.map((_, index) => colors[index % colors.length]),

          borderColor: '#fff',

          borderWidth: 4,

          hoverOffset: 20,

          spacing: 3,
        },
      ],
    };
  };

  // eslint-disable-next-line no-unused-vars
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

    layout: {
      padding: 30,
    },

    plugins: {
      legend: {
        position: 'right',

        labels: {
          usePointStyle: true,

          pointStyle: 'circle',

          padding: 20,

          boxWidth: 12,

          font: {
            size: 12,
            weight: '600',
          },
        },
      },

      datalabels: {
        color: '#ffffff',

        font: {
          weight: 'bold',
          size: 14,
        },

        formatter: (value, ctx) => {
          const data = ctx.chart.data.datasets[0].data;

          const total = data.reduce((sum, item) => sum + item, 0);

          const percentage = (value / total) * 100;

          return `${percentage.toFixed(1)}%`;
        },

        anchor: 'center',

        align: 'center',

        clamp: true,

        clip: false,
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            const data = context.dataset.data;

            const total = data.reduce((sum, item) => sum + item, 0);

            const percentage = ((context.raw / total) * 100).toFixed(1);

            return `${context.label}: ${context.raw} Incident (${percentage}%)`;
          },
        },
      },
    },

    animation: {
      animateRotate: true,

      animateScale: true,
    },

    elements: {
      arc: {
        borderWidth: 3,

        borderColor: '#ffffff',
      },
    },
  };

  const locationAnalysis = getIncidentByLocationAnalysis();
  const categoryAnalysis = getIncidentCategoryAnalysis();
  const [showLocationAnalysis, setShowLocationAnalysis] = useState(false);
  const [showCategoryAnalysis, setShowCategoryAnalysis] = useState(false);

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
          {/* ====================== Slide Analisis Lokasi Incident ====================== */}

          <SwiperSlide>
            <div onClick={() => setShowLocationAnalysis(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-blue-600 text-[11px] font-semibold">
                      Analisis Insiden
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                        <FiMapPin size={17} />
                      </span>
                      Distribusi Lokasi Insiden
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis persebaran insiden berdasarkan lokasi operasional CCTV
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      <FiAlertTriangle size={12} />
                      Total Insiden
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {locationAnalysis?.totalIncident || 0}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Periode {selectedIncidentYear}</p>
                  </div>

                  <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4">
                    <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                      <FiMapPin size={12} />
                      Lokasi Tertinggi
                    </p>
                    <h3 className="text-sm md:text-base font-bold text-rose-600 mt-2 truncate">
                      {locationAnalysis?.highest?.location || '-'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {locationAnalysis?.highest?.total || 0} Insiden
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                    <p className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                      <FiActivity size={12} />
                      Rata-rata Lokasi
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-amber-600 mt-2 tabular-nums">
                      {locationAnalysis?.average || 0}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Insiden per lokasi</p>
                  </div>

                  <div
                    className={`rounded-xl border p-4 ${
                      locationAnalysis?.highest?.risk === 'CRITICAL'
                        ? 'bg-rose-50/60 border-rose-100'
                        : locationAnalysis?.highest?.risk === 'HIGH'
                          ? 'bg-amber-50/60 border-amber-100'
                          : locationAnalysis?.highest?.risk === 'MEDIUM'
                            ? 'bg-yellow-50/60 border-yellow-100'
                            : 'bg-green-50/60 border-green-100'
                    }`}
                  >
                    <p
                      className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                        locationAnalysis?.highest?.risk === 'CRITICAL'
                          ? 'text-rose-700'
                          : locationAnalysis?.highest?.risk === 'HIGH'
                            ? 'text-amber-700'
                            : locationAnalysis?.highest?.risk === 'MEDIUM'
                              ? 'text-yellow-700'
                              : 'text-green-700'
                      }`}
                    >
                      <FiTarget size={12} />
                      Tingkat Risiko
                    </p>
                    <h3
                      className={`text-lg md:text-xl font-bold mt-2 ${
                        locationAnalysis?.highest?.risk === 'CRITICAL'
                          ? 'text-rose-600'
                          : locationAnalysis?.highest?.risk === 'HIGH'
                            ? 'text-amber-600'
                            : locationAnalysis?.highest?.risk === 'MEDIUM'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                      }`}
                    >
                      {locationAnalysis?.highest?.risk || 'TIDAK ADA DATA'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Prioritas Tindakan</p>
                  </div>
                </div>

                {/* CHART */}
                <div className="rounded-xl border border-slate-100 p-5 mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                    Jumlah Insiden per Lokasi
                  </h3>

                  <div className="h-[300px] md:h-[340px]">
                    <Bar
                      data={getIncidentByLocation()}
                      plugins={[ChartDataLabels]}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              font: { size: 11 },
                            },
                          },
                          datalabels: {
                            anchor: 'end',
                            align: 'right',
                            formatter: (value) => value,
                            font: {
                              weight: 'bold',
                              size: 12,
                            },
                            color: '#475569',
                          },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => {
                                return `${ctx.raw} Insiden`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0,0,0,0.08)',
                            },
                            title: {
                              display: true,
                              text: 'Jumlah Insiden',
                            },
                          },
                          y: {
                            grid: {
                              display: false,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {/* INSIGHT */}
                <div className="rounded-xl bg-slate-900 text-white p-5 flex flex-wrap justify-between items-center gap-4">
                  <div className="min-w-0">
                    <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">
                      Insight Manajemen
                    </p>
                    <h3 className="text-sm md:text-base font-semibold mt-1.5">
                      {locationAnalysis?.insight?.[2] || 'Belum tersedia analisis lokasi insiden'}
                    </h3>
                  </div>

                  <div className="bg-white/10 px-4 py-2.5 rounded-lg text-center shrink-0">
                    <FiMap className="mx-auto text-base mb-1" />
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                      Total Lokasi
                    </p>
                    <h2 className="text-xl md:text-2xl font-bold tabular-nums">
                      {locationAnalysis?.totalLocation || 0}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* ====================== Slide Analisis Kategori Incident ====================== */}

          <SwiperSlide>
            <div onClick={() => setShowCategoryAnalysis(true)} className="group cursor-pointer">
              <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                {/* HEADER */}
                <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                      Analisis Insiden
                    </p>

                    <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                        <FiLayers size={17} />
                      </span>
                      Kategori Insiden
                    </h2>

                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                      Analisis jenis insiden yang paling sering terjadi pada sistem CCTV
                    </p>
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                      <FiAlertTriangle size={12} />
                      Total Insiden
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                      {categoryAnalysis?.totalIncident || 0}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                    <p className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                      <FiLayers size={12} />
                      Kategori Dominan
                    </p>
                    <h3 className="text-sm md:text-base font-bold text-amber-600 mt-2 truncate">
                      {categoryAnalysis?.highest?.category || '-'}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4">
                    <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                      <FiPercent size={12} />
                      Kontribusi
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-rose-600 mt-2 tabular-nums">
                      {categoryAnalysis?.totalIncident
                        ? (
                            (categoryAnalysis.highest.total / categoryAnalysis.totalIncident) *
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
                    Distribusi Kategori Insiden
                  </h3>

                  <div className="h-[300px] md:h-[360px] flex justify-center items-center">
                    <Pie
                      data={getIncidentByCategory()}
                      options={pieOptions}
                      plugins={[ChartDataLabels]}
                    />
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                  <p className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <FiFileText size={13} />
                    Klik untuk melihat laporan kategori
                  </p>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-purple-600 transition-colors duration-300">
                    Lihat Laporan
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
        {showLocationAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowLocationAnalysis(false)}
          >
            <div
              className="relative w-full max-w-[1140px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250"
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE */}
              <button
                onClick={() => setShowLocationAnalysis(false)}
                className="absolute top-5 right-5 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200"
              >
                <FiX size={18} />
              </button>

              {/* HEADER */}
              <div className="px-7 md:px-9 pt-8 pb-6 border-b border-slate-100">
                <p className="text-[11px] tracking-[3px] uppercase font-semibold text-blue-600">
                  Incident Risk Monitoring
                </p>

                <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600">
                    <FiMapPin size={17} />
                  </span>
                  Analisis Lokasi Insiden
                </h2>

                <p className="text-slate-500 text-sm mt-2 max-w-xl leading-relaxed">
                  Analisis distribusi insiden berdasarkan lokasi operasional dan tingkat risiko
                  area.
                </p>
              </div>

              <div className="px-7 md:px-9 pb-9 pt-6">
                {/* KPI */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* TOTAL LOCATION */}
                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5">
                    <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <FiMapPin size={13} />
                      Total Lokasi
                    </p>

                    <h2 className="text-3xl font-bold text-blue-600 mt-3 tabular-nums">
                      {locationAnalysis?.totalLocation || 0}
                    </h2>
                  </div>

                  {/* TOTAL INCIDENT */}
                  <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                    <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <FiAlertTriangle size={13} />
                      Total Insiden
                    </p>

                    <h2 className="text-3xl font-bold text-rose-600 mt-3 tabular-nums">
                      {locationAnalysis?.totalIncident || 0}
                    </h2>
                  </div>

                  {/* AVERAGE */}
                  <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-5">
                    <p className="text-orange-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <FiActivity size={13} />
                      Rata-rata Lokasi
                    </p>

                    <h2 className="text-3xl font-bold text-orange-600 mt-3 tabular-nums">
                      {locationAnalysis?.average || 0}
                    </h2>
                  </div>

                  {/* HIGHEST AREA */}
                  <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                    <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <FiTarget size={13} />
                      Lokasi Tertinggi
                    </p>

                    <h2 className="text-lg font-bold text-emerald-600 mt-3 truncate">
                      {locationAnalysis?.highest?.location || '-'}
                    </h2>
                  </div>

                  {/* RISK */}
                  <div
                    className={`rounded-xl p-5 border
              ${
                locationAnalysis?.highest?.total >= 50
                  ? 'bg-rose-50/60 border-rose-100 text-rose-700'
                  : locationAnalysis?.highest?.total >= 20
                    ? 'bg-orange-50/60 border-orange-100 text-orange-700'
                    : 'bg-emerald-50/60 border-emerald-100 text-emerald-700'
              }
            `}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <FiActivity size={13} />
                      Tingkat Risiko
                    </p>

                    <h2 className="text-xl font-bold mt-3">
                      {locationAnalysis?.highest?.total >= 50
                        ? 'CRITICAL'
                        : locationAnalysis?.highest?.total >= 20
                          ? 'HIGH'
                          : 'LOW'}
                    </h2>
                  </div>
                </div>

                {/* HIGHEST RISK AREA */}
                <div className="mt-5 rounded-xl bg-rose-50/50 border border-rose-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700 mb-4 flex items-center gap-2">
                    <FiAlertTriangle size={15} />
                    Lokasi Dengan Risiko Tertinggi
                  </h3>

                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <p className="text-slate-500 text-xs">Lokasi</p>
                      <h3 className="font-bold text-lg text-slate-900 mt-1 truncate">
                        {locationAnalysis?.highest?.location || '-'}
                      </h3>
                    </div>

                    <div>
                      <p className="text-slate-500 text-xs">Total Insiden</p>
                      <h3 className="font-bold text-lg text-slate-900 mt-1 tabular-nums">
                        {locationAnalysis?.highest?.total || 0}
                      </h3>
                    </div>

                    <div>
                      <p className="text-slate-500 text-xs">Kontribusi</p>
                      <h3 className="font-bold text-lg text-rose-600 mt-1 tabular-nums">
                        {(
                          ((locationAnalysis?.highest?.total || 0) /
                            (locationAnalysis?.totalIncident || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </h3>
                    </div>
                  </div>
                </div>

                {/* TABLE */}
                <div className="mt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                    <FiBarChart2 size={15} className="text-slate-400" />
                    Peringkat Lokasi Insiden
                  </h3>

                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                            <th className="p-3.5 text-left font-semibold">Rank</th>
                            <th className="p-3.5 text-left font-semibold">Lokasi</th>
                            <th className="p-3.5 text-left font-semibold">Insiden</th>
                            <th className="p-3.5 text-left font-semibold">Kontribusi</th>
                            <th className="p-3.5 text-left font-semibold">Risiko</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {locationAnalysis?.top10?.map((item, index) => (
                            <tr
                              key={item.location}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="p-3.5 font-semibold text-slate-400">#{index + 1}</td>

                              <td className="p-3.5 font-semibold text-slate-800">
                                {item.location}
                              </td>

                              <td className="p-3.5 text-slate-600 tabular-nums">{item.total}</td>

                              <td className="p-3.5 text-slate-600 tabular-nums">
                                {((item.total / locationAnalysis.totalIncident) * 100).toFixed(1)}%
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ring-1
                            ${
                              item.total >= 50
                                ? 'bg-rose-50 text-rose-700 ring-rose-200'
                                : item.total >= 20
                                  ? 'bg-orange-50 text-orange-700 ring-orange-200'
                                  : item.total >= 10
                                    ? 'bg-amber-50 text-amber-700 ring-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            }
                          `}
                                >
                                  {item.total >= 50
                                    ? 'CRITICAL'
                                    : item.total >= 20
                                      ? 'HIGH'
                                      : item.total >= 10
                                        ? 'MEDIUM'
                                        : 'LOW'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* INSIGHT + RECOMMENDATION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-4 flex items-center gap-2">
                      <FiTrendingUp size={15} />
                      Insight Manajemen
                    </h3>

                    <div className="space-y-2.5">
                      {locationAnalysis?.insight?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
                        >
                          <FiActivity size={14} className="text-blue-500 mt-0.5 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                      <FiCheckCircle size={15} />
                      Rekomendasi Tindakan
                    </h3>

                    <div className="space-y-2.5">
                      {locationAnalysis?.recommendation?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60"
                        >
                          <FiCheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCategoryAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowCategoryAnalysis(false)}
          >
            <div
              className="relative w-full max-w-[1040px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250"
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE */}
              <button
                onClick={() => setShowCategoryAnalysis(false)}
                className="absolute top-5 right-5 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200"
              >
                <FiX size={18} />
              </button>

              {/* HEADER */}
              <div className="px-7 md:px-9 pt-8 pb-6 border-b border-slate-100">
                <p className="text-[11px] tracking-[3px] uppercase font-semibold text-violet-600">
                  Incident Category Insight
                </p>

                <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50 text-violet-600">
                    <FiBarChart2 size={17} />
                  </span>
                  Analisis Kategori Insiden
                </h2>

                <p className="text-slate-500 text-sm mt-2 max-w-xl leading-relaxed">
                  Analisis distribusi insiden berdasarkan kategori kejadian.
                </p>
              </div>

              <div className="px-7 md:px-9 pb-9 pt-6">
                {/* SUMMARY KPI */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* TOTAL CATEGORY */}
                  <div className="rounded-xl bg-violet-50/60 border border-violet-100 p-5 text-center">
                    <div className="flex justify-center items-center gap-1.5 text-violet-700 text-[11px] font-semibold uppercase tracking-wide">
                      <FiLayers size={13} />
                      Total Kategori
                    </div>

                    <h2 className="text-3xl font-bold text-violet-600 mt-3 tabular-nums">
                      {categoryAnalysis?.totalCategory || 0}
                    </h2>
                  </div>

                  {/* TOTAL INCIDENT */}
                  <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5 text-center">
                    <div className="flex justify-center items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                      <FiAlertTriangle size={13} />
                      Total Insiden
                    </div>

                    <h2 className="text-3xl font-bold text-rose-600 mt-3 tabular-nums">
                      {categoryAnalysis?.totalIncident || 0}
                    </h2>
                  </div>

                  {/* DOMINANT */}
                  <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-5 text-center">
                    <div className="flex justify-center items-center gap-1.5 text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                      <FiAward size={13} />
                      Kategori Dominan
                    </div>

                    <h2 className="text-lg font-bold text-orange-600 mt-3 truncate">
                      {categoryAnalysis?.highest?.category || '-'}
                    </h2>
                  </div>

                  {/* TOTAL DOMINANT */}
                  <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5 text-center">
                    <div className="flex justify-center items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                      <FiBarChart2 size={13} />
                      Jumlah
                    </div>

                    <h2 className="text-3xl font-bold text-emerald-600 mt-3 tabular-nums">
                      {categoryAnalysis?.highest?.total || 0}
                    </h2>
                  </div>
                </div>

                {/* DOMINANT CATEGORY */}
                <div className="mt-5 rounded-xl bg-orange-50/50 border border-orange-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 mb-4 flex items-center gap-2">
                    <FiAward size={15} />
                    Kategori Dominan
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <p className="text-slate-500 text-xs">Kategori</p>
                      <h3 className="font-bold text-lg text-slate-900 mt-1 truncate">
                        {categoryAnalysis?.highest?.category || '-'}
                      </h3>
                    </div>

                    <div>
                      <p className="text-slate-500 text-xs">Total Insiden</p>
                      <h3 className="font-bold text-lg text-slate-900 mt-1 tabular-nums">
                        {categoryAnalysis?.highest?.total || 0}
                      </h3>
                    </div>

                    <div>
                      <p className="text-slate-500 text-xs">Kontribusi</p>
                      <h3 className="font-bold text-lg text-orange-600 mt-1 tabular-nums">
                        {categoryAnalysis?.totalIncident
                          ? (
                              (categoryAnalysis.highest.total / categoryAnalysis.totalIncident) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mt-4 pt-4 border-t border-orange-100">
                    Kategori ini menjadi penyebab insiden paling dominan sehingga perlu menjadi
                    prioritas dalam program perbaikan.
                  </p>
                </div>

                {/* TABLE */}
                <div className="mt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                    <FiList size={15} className="text-slate-400" />
                    Peringkat Kategori Insiden
                  </h3>

                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                          <th className="p-3.5 text-left font-semibold">#</th>
                          <th className="p-3.5 text-left font-semibold">Kategori</th>
                          <th className="p-3.5 text-left font-semibold">Total</th>
                          <th className="p-3.5 text-left font-semibold">Kontribusi</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {categoryAnalysis?.top10?.map((item, index) => (
                          <tr
                            key={item.category}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="p-3.5 font-semibold text-slate-400">{index + 1}</td>
                            <td className="p-3.5 font-semibold text-slate-800">{item.category}</td>
                            <td className="p-3.5 text-slate-600 tabular-nums">{item.total}</td>
                            <td className="p-3.5 text-slate-600 tabular-nums">
                              {((item.total / categoryAnalysis.totalIncident) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* INSIGHT + RECOMMENDATION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-4 flex items-center gap-2">
                      <FiTrendingUp size={15} />
                      Insight Analisis
                    </h3>

                    <div className="space-y-2.5">
                      {categoryAnalysis?.insight?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
                        >
                          <FiTrendingUp size={14} className="text-blue-500 mt-0.5 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                      <FiCheckCircle size={15} />
                      Rekomendasi Tindakan
                    </h3>

                    <div className="space-y-2.5">
                      {categoryAnalysis?.recommendation?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60"
                        >
                          <FiCheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===================== Incident Management ===================== */}

      <section className="p-3 md:p-6">
        {/* HEADER CARD */}

        <div
          ref={incidentHeaderCardRef}
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
              <FiClipboard size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 truncate">Manajemen Insiden CCTV</h2>

              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Monitoring insiden CCTV dan aktivitas pengawasan
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
                        ${showAddIncidentBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                      `}
            >
              <FiPlus size={20} className="shrink-0" />

              {showAddIncidentBtnText && (
                <span className="whitespace-nowrap">
                  Tambah
                  <br />
                  Insiden
                </span>
              )}
            </button>
          )}
        </div>

        {/* MONITORING CALENDAR */}

        <div
          ref={incidentCalendarCardRef}
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
            onClick={() => setShowIncidentCalendar(true)}
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
                      ${showIncidentCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                    `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showIncidentCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showIncidentCalendar && (
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
            onClick={() => setShowIncidentCalendar(false)}
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
                onClick={() => setShowIncidentCalendar(false)}
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
            text-blue-600
            text-xs
            font-semibold
            "
                  >
                    MANAJEMEN INSIDEN CCTV
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
                        <FiEdit2 className="text-blue-600" />
                        Edit Insiden
                      </>
                    ) : (
                      <>
                        <FiPlus className="text-blue-600" />
                        Tambah Insiden
                      </>
                    )}
                  </h2>

                  <p
                    className="
            text-gray-500
            mt-2
            "
                  >
                    Catat laporan insiden CCTV dan aktivitas monitoring
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
                {/* DATE INCIDENT */}

                <div
                  className="
          md:col-span-2
          "
                >
                  <label
                    className="
            text-sm
            font-semibold
            text-gray-700
            "
                  >
                    Tanggal & Waktu Insiden
                  </label>

                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={formData.datetimeOfIncident}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,

                          datetimeOfIncident: date,
                        }))
                      }
                      placeholder="Pilih tanggal dan waktu insiden"
                    />
                  </div>
                </div>

                {/* LOCATION */}

                <div>
                  <label className="text-sm font-semibold">Lokasi</label>

                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
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
                    <option value="">Pilih Lokasi</option>

                    {locations.map((loc, index) => (
                      <option key={loc.id || index} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CATEGORY */}

                <div>
                  <label className="text-sm font-semibold">Kategori Insiden</label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
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
                    <option value="">Pilih Kategori</option>

                    {categories.map((cat, index) => (
                      <option key={cat.id || index} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DESCRIPTION */}

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
                    Deskripsi Singkat Insiden
                  </label>

                  <textarea
                    name="descriptionOfIncident"
                    value={formData.descriptionOfIncident}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Masukkan detail kejadian insiden..."
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

                {/* OFFICER */}

                <div>
                  <label className="text-sm font-semibold">Petugas</label>

                  <select
                    name="nameOfficer"
                    value={formData.nameOfficer}
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
                    <option value="">Pilih Petugas</option>

                    {officers.map((officer, index) => (
                      <option key={officer.id || index} value={officer.name_officer}>
                        {officer.name_officer}
                      </option>
                    ))}
                  </select>
                </div>

                {/* INFORMATION */}

                <div>
                  <label className="text-sm font-semibold">Keterangan</label>

                  <input
                    type="text"
                    name="information"
                    value={formData.information}
                    onChange={handleChange}
                    placeholder="Masukkan informasi tambahan"
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

                {/* COMPLETE DATE */}

                <div>
                  <label className="text-sm font-semibold">Tanggal Penyelesaian</label>

                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={parseDate(formData.datetimeComplete)}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,

                          datetimeComplete: date ? date.toISOString() : '',
                        }))
                      }
                      placeholder="Pilih tanggal selesai"
                    />
                  </div>
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
                    Batal
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
                    {isEditing ? 'Simpan Perubahan' : 'Tambah Insiden'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Section 2 - Incident Table (Main Table) */}
      <section className="p-4 mt-12">
        {/* Search + Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <span
              className="
      absolute
      left-3
      top-1/2
      -translate-y-1/2
      text-gray-400
      "
            >
              🔍
            </span>

            <input
              type="text"
              placeholder="Search Incident..."
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
          {/* Year Dropdown */}
          <div className="relative w-full md:w-48">
            <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 pl-4 pr-3 py-2.5">
              <LuCalendar size={16} className="text-blue-500 shrink-0" />

              <div className="relative flex-1">
                <select
                  value={selectedIncidentYear}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedIncidentYear(value === 'all' ? 'all' : Number(value));
                    setCurrentPage(1);
                  }}
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

                  {incidentYears.map((year) => (
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Tanggal & Waktu Kejadian
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Lokasi
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Deskripsi Singkat Kejadian
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Petugas
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Tanggal & Waktu Penyelesaian (Lift, Escalator, dsb)
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Durasi
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedIncidents.length > 0 ? (
                paginatedIncidents.map((incident, index) => (
                  <tr
                    key={incident.id || `incident-row-${index}`}
                    className="hover:bg-gray-100/50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.datetimeOfIncident &&
                      incident.datetimeOfIncident !== '0001-01-01T00:00:00Z'
                        ? new Date(incident.datetimeOfIncident).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{incident.location || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{incident.category || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.descriptionOfIncident || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.nameOfficer || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.information || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.datetimeComplete &&
                      incident.datetimeComplete !== '0001-01-01T00:00:00Z'
                        ? new Date(incident.datetimeComplete).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{incident.duration || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      <div className="flex justify-center items-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(incident)}
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
                            onClick={() => handleDelete(incident.id)}
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
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Displaying {paginatedIncidents.length} of {filteredIncidents.length} incidents
            </p>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >
                ⬅️ Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {pageCount}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >
                Next ➡️
              </button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
