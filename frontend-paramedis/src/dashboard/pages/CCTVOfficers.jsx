import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay } from 'swiper/modules';
import { appleSwal } from '../utils/appleSwal';
import MonitoringCalendar from '../components/Calander';
import { Pagination } from 'swiper/modules';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiUserPlus, FiCalendar } from 'react-icons/fi';
import {
  FiShield,
  FiUsers,
  FiAlertCircle,
  FiAward,
  FiBarChart2,
  FiUserCheck,
  FiRepeat,
  FiUserX,
  FiTrendingUp,
  FiZap,
  FiCheck,
  FiClipboard,
  FiClock,
  FiPieChart,
  FiMousePointer,
  FiArrowRight,
  FiPercent,
} from 'react-icons/fi';

import api from '../api/axios';

import 'swiper/css';
import 'swiper/css/effect-coverflow';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function CCTVOfficers() {
  // State untuk manajemen form dan tabel petugas
  const [showOfficerForm, setShowOfficerForm] = useState(false);
  const [isEditingOfficer, setIsEditingOfficer] = useState(false);
  const [editOfficerId, setEditOfficerId] = useState(null);
  const [searchOfficerTerm, setSearchOfficerTerm] = useState('');
  const [officerFormData, setOfficerFormData] = useState({
    name_officer: '',
    gender: '',
    role: '',
  });

  // State baru untuk data ringkasan insiden per petugas (untuk grafik)

  const itemsPerPage = 5;
  const [currentOfficerPage, setCurrentOfficerPage] = useState(1);

  const [officerList, setOfficerList] = useState([]);
  const [officerIncidentSummary, setOfficerIncidentSummary] = useState([]);

  const [showOfficerAnalysis, setShowOfficerAnalysis] = useState(false);
  const [showOfficerStatusAnalysis, setShowOfficerStatusAnalysis] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const role = localStorage.getItem('role');

  const canManageOfficer = ['Admin', 'Manager HSE', 'Petugas HSE'].includes(role);

  /* ===================== Responsif Container Header Card ===================== */
  const headerCardRef = useRef(null);
  const [showAddBtnText, setShowAddBtnText] = useState(true);

  useEffect(() => {
    const el = headerCardRef.current;
    if (!el) return;

    const THRESHOLD = 340;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setShowAddBtnText(entry.contentRect.width >= THRESHOLD);
      }
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  /* ===================== Responsif Container Tombol Kalender ===================== */
  const calendarCardRef = useRef(null);
  const [showCalendarText, setShowCalendarText] = useState(true);

  useEffect(() => {
    const el = calendarCardRef.current;
    if (!el) return;

    const THRESHOLD = 260;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setShowCalendarText(entry.contentRect.width >= THRESHOLD);
      }
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Warna untuk grafik

  // =====================================
  // Officer Performance Analysis
  // =====================================

  // =====================================
  // Officer Performance Analysis
  // =====================================

  const getOfficerPerformanceAnalysis = () => {
    const ranking = officerIncidentSummary
      .map((item) => ({
        name: item.name,

        incidentCount: item.incidentCount,
      }))
      .sort((a, b) => b.incidentCount - a.incidentCount);

    const totalOfficer = ranking.length;

    const totalIncident = ranking.reduce((total, item) => total + item.incidentCount, 0);

    const highest = ranking[0] || {
      name: '-',

      incidentCount: 0,
    };

    const average = totalOfficer === 0 ? 0 : Number((totalIncident / totalOfficer).toFixed(2));

    return {
      totalOfficer,

      totalIncident,

      average,

      highest,

      ranking,

      top10: ranking.slice(0, 10),

      insight: [
        `Total petugas aktif yang menangani incident sebanyak ${totalOfficer} orang.`,

        `Total incident yang berhasil ditangani sebanyak ${totalIncident} kasus.`,

        highest.name !== '-'
          ? `${highest.name} memiliki performa tertinggi dengan ${highest.incidentCount} kasus.`
          : 'Belum ada data incident petugas.',
      ],

      recommendation: [
        'Berikan apresiasi kepada petugas dengan jumlah penanganan tertinggi.',

        'Evaluasi distribusi incident jika terdapat perbedaan beban kerja besar.',

        'Gunakan histori incident sebagai dasar evaluasi performa.',

        'Pastikan pembagian incident antar petugas tetap seimbang.',
      ],
    };
  };

  // =====================================
  // Officer Performance Chart
  // =====================================

  const getOfficerPerformanceChart = () => {
    const analysis = getOfficerPerformanceAnalysis();

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
      labels: analysis.top10.map((item) => item.name),

      datasets: [
        {
          label: 'Jumlah Kasus Ditangani',

          data: analysis.top10.map((item) => item.incidentCount),

          backgroundColor: analysis.top10.map((_, index) => colors[index % colors.length]),

          borderColor: analysis.top10.map((_, index) => colors[index % colors.length]),

          borderWidth: 2,

          borderRadius: 10,
        },
      ],
    };
  };

  const officerPerformanceAnalysis = getOfficerPerformanceAnalysis();

  const officerPerformanceChart = getOfficerPerformanceChart();

  // =====================================
  // Officer Status Analysis
  // =====================================

  const getOfficerStatusAnalysis = () => {
    const statusMap = {
      Aktif: 0,
      Mutasi: 0,
      Resign: 0,
    };

    const officerListData = [];

    officerList.forEach((item) => {
      const status = item.status?.trim() || 'Aktif';

      if (statusMap[status] !== undefined) {
        statusMap[status]++;
      }

      officerListData.push({
        ID: item.ID,

        name_officer: item.name_officer || '-',

        role: item.role || '-',

        status,

        tanggal_status: item.tanggal_status || null,

        gender: item.gender || '-',
      });
    });

    const totalOfficer = officerList.length;

    const aktif = statusMap.Aktif;

    const mutasi = statusMap.Mutasi;

    const resign = statusMap.Resign;

    const activeRate = totalOfficer === 0 ? 0 : Number(((aktif / totalOfficer) * 100).toFixed(1));

    const mutationRate =
      totalOfficer === 0 ? 0 : Number(((mutasi / totalOfficer) * 100).toFixed(1));

    const resignRate = totalOfficer === 0 ? 0 : Number(((resign / totalOfficer) * 100).toFixed(1));

    const ranking = [
      {
        status: 'Aktif',
        total: aktif,
      },

      {
        status: 'Mutasi',
        total: mutasi,
      },

      {
        status: 'Resign',
        total: resign,
      },
    ].sort((a, b) => b.total - a.total);

    const highest = ranking[0] || {
      status: '-',
      total: 0,
    };

    // cari update terakhir

    const lastUpdate = officerListData
      .filter((item) => item.tanggal_status)
      .sort((a, b) => new Date(b.tanggal_status) - new Date(a.tanggal_status))[0];

    return {
      totalOfficer,

      aktif,

      mutasi,

      resign,

      activeRate,

      mutationRate,

      resignRate,

      highest,

      lastUpdate: lastUpdate
        ? new Date(lastUpdate.tanggal_status).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',

      ranking,

      // INI YANG DIPAKAI MODAL
      officerList: officerListData,

      insight: [
        `Total petugas terdaftar sebanyak ${totalOfficer} orang.`,

        `Jumlah petugas aktif sebanyak ${aktif} orang (${activeRate}%).`,

        `Jumlah petugas mutasi sebanyak ${mutasi} orang (${mutationRate}%).`,

        `Jumlah petugas resign sebanyak ${resign} orang (${resignRate}%).`,

        highest.status !== '-'
          ? `${highest.status} merupakan status dominan dengan jumlah ${highest.total} petugas.`
          : 'Belum terdapat data status petugas.',
      ],

      recommendation: [
        'Update tanggal perubahan status setiap terjadi mutasi atau resign.',

        'Gunakan data status untuk menentukan kebutuhan manpower CCTV.',

        'Monitoring jumlah petugas aktif secara berkala.',

        'Pastikan coverage monitoring CCTV tetap berjalan.',
      ],
    };
  };

  // =====================================
  // Officer Status Chart
  // =====================================

  const getOfficerStatusChart = () => {
    const analysis = getOfficerStatusAnalysis();

    return {
      labels: ['Aktif', 'Mutasi', 'Resign'],

      datasets: [
        {
          label: 'Jumlah Petugas',

          data: [analysis.aktif, analysis.mutasi, analysis.resign],

          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],

          borderColor: ['#16a34a', '#d97706', '#dc2626'],

          borderWidth: 2,

          hoverOffset: 15,
        },
      ],
    };
  };

  const officerStatusAnalysis = getOfficerStatusAnalysis();
  const officerStatusChart = getOfficerStatusChart();

  // =====================================
  // Officer Performance Chart Options
  // =====================================

  const officerPerformanceOptions = {
    responsive: true,

    maintainAspectRatio: false,

    indexAxis: 'y',

    animation: {
      duration: 1200,
    },

    plugins: {
      legend: {
        display: false,
      },

      title: {
        display: true,

        text: '🏆 Ranking Performa Petugas CCTV',

        font: {
          size: 18,
        },
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);

            const value = context.raw;

            const percent = total === 0 ? 0 : ((value / total) * 100).toFixed(1);

            return `${value} kasus (${percent}%)`;
          },
        },
      },
    },

    scales: {
      x: {
        beginAtZero: true,

        title: {
          display: true,

          text: 'Jumlah Kasus',
        },

        ticks: {
          stepSize: 1,
        },
      },

      y: {
        title: {
          display: true,

          text: 'Nama Petugas',
        },
      },
    },
  };

  // =====================================
  // Officer Status Doughnut Options
  // =====================================

  const officerStatusOptions = {
    responsive: true,

    maintainAspectRatio: false,

    cutout: '65%',

    animation: {
      animateRotate: true,

      duration: 1200,
    },

    plugins: {
      legend: {
        position: 'bottom',

        labels: {
          padding: 20,
        },
      },

      title: {
        display: true,

        text: '📌 Status Personel CCTV',

        font: {
          size: 18,
        },
      },

      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);

            const value = context.raw;

            const percent = total === 0 ? 0 : ((value / total) * 100).toFixed(1);

            return `${context.label}: ${value} (${percent}%)`;
          },
        },
      },
    },
  };

  // --- Fetch Data Petugas (untuk tabel manajemen petugas) ---
  const fetchOfficer = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('Token tidak ditemukan');
        return;
      }

      const response = await api.get('/officer', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Officer Response:', response.data);

      const data = response.data.data || response.data || [];

      setOfficerList(data);
    } catch (error) {
      console.error('Error fetching officers:', error);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/dashboard/login';
      }
    }
  };

  const fetchIncidentSummary = async (year) => {
    try {
      // ============================
      // AMBIL INCIDENT
      // ============================
      const incidentResponse = await api.get('/incident');
      const incidentData = incidentResponse.data.data || incidentResponse.data || [];

      // ============================
      // AMBIL SEMUA TAHUN YANG ADA (untuk isi dropdown)
      // ============================
      const years = incidentData
        .map((item) => {
          const date = new Date(item.datetimeOfIncident);
          return !isNaN(date) ? date.getFullYear() : null;
        })
        .filter(Boolean);

      const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
      setAvailableYears(uniqueYears);

      // Kalau year belum ditentukan (misal saat load pertama), pakai tahun terbaru
      const targetYear =
        year || (uniqueYears.length > 0 ? uniqueYears[0] : new Date().getFullYear());

      // ============================
      // FILTER INCIDENT SESUAI TAHUN YANG DIPILIH
      // ============================
      const filteredIncidents = incidentData.filter((item) => {
        const date = new Date(item.datetimeOfIncident);
        return date.getFullYear() === targetYear;
      });

      // ============================
      // AMBIL OFFICER AKTIF
      // ============================
      const officerResponse = await api.get('/officer');
      const officers = officerResponse.data.data || officerResponse.data || [];
      const activeOfficers = officers.filter((officer) => (officer.status || 'Aktif') === 'Aktif');
      const activeOfficerNames = activeOfficers.map((officer) => officer.name_officer);

      // ============================
      // HITUNG INCIDENT PER OFFICER
      // ============================
      const officerCounts = {};
      filteredIncidents.forEach((incident) => {
        const officerName = incident.nameOfficer;
        if (!officerName || !activeOfficerNames.includes(officerName)) return;
        officerCounts[officerName] = (officerCounts[officerName] || 0) + 1;
      });

      const summaryArray = Object.keys(officerCounts)
        .map((name) => ({ name, incidentCount: officerCounts[name] }))
        .sort((a, b) => b.incidentCount - a.incidentCount);

      setOfficerIncidentSummary(summaryArray);
      setSelectedYear(targetYear); // sinkronkan dropdown dengan tahun yang dipakai
    } catch (error) {
      console.error('Gagal fetch summary officer:', error);
    }
  };

  // useEffect untuk memuat data petugas dan ringkasan insiden saat komponen mount
  useEffect(() => {
    fetchOfficer();
    fetchIncidentSummary();
  }, []);

  const handleYearChange = (e) => {
    const year = Number(e.target.value);
    fetchIncidentSummary(year);
  };

  // --- Form Petugas Handlers ---
  const handleOfficerChange = (e) => {
    setOfficerFormData({ ...officerFormData, [e.target.name]: e.target.value });
  };

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();

    if (
      !officerFormData.name_officer.trim() ||
      !officerFormData.gender.trim() ||
      !officerFormData.role.trim()
    ) {
      appleSwal({
        icon: 'warning',
        title: 'Data Belum Lengkap',
        text: 'Semua field petugas harus diisi.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        appleSwal({
          icon: 'error',
          title: 'Session Expired',
          text: 'Silahkan login kembali.',
        });
        return;
      }

      const confirm = await appleSwal({
        title: isEditingOfficer ? 'Update Data Petugas?' : 'Tambah Petugas Baru?',
        html: `
        <div style="text-align:left">
          <p><b>Nama:</b> ${officerFormData.name_officer}</p>
          <p><b>Gender:</b> ${officerFormData.gender}</p>
          <p><b>Role:</b> ${officerFormData.role}</p>
        </div>
      `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: isEditingOfficer ? 'Ya, Update' : 'Ya, Tambahkan',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#9ca3af',
      });

      if (!confirm.isConfirmed) return;

      if (isEditingOfficer) {
        if (!editOfficerId) {
          appleSwal({
            icon: 'error',
            title: 'ID Tidak Valid',
            text: 'ID officer tidak ditemukan',
          });
          return;
        }

        await api.put(`officer/${editOfficerId}`, officerFormData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post(`/officer`, officerFormData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await appleSwal({
        icon: 'success',
        title: isEditingOfficer ? 'Petugas Diperbarui' : 'Petugas Ditambahkan',
        text: isEditingOfficer
          ? 'Data petugas berhasil diperbarui.'
          : 'Petugas baru berhasil ditambahkan.',
        timer: 2000,
        showConfirmButton: false,
      });

      await fetchOfficer();
      await fetchIncidentSummary();

      setCurrentOfficerPage(1);
      setOfficerFormData({ name_officer: '', gender: '', role: '' });
      setShowOfficerForm(false);
      setIsEditingOfficer(false);
      setEditOfficerId(null);
    } catch (err) {
      console.error('FULL ERROR:', err.response?.data || err);

      appleSwal({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data || err.message || 'Terjadi kesalahan',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleEditOfficer = (officer) => {
    const id = officer.ID ?? officer.id;

    if (!id) {
      appleSwal({
        title: 'Error',
        text: 'ID officer tidak ditemukan',
        icon: 'error',
      });
      return;
    }

    setOfficerFormData({
      name_officer: officer.name_officer || '',
      gender: officer.gender || '',
      role: officer.role || '',
    });

    setEditOfficerId(id);
    setIsEditingOfficer(true);
    setShowOfficerForm(true);

    appleSwal({
      title: 'Mode Edit Aktif',
      text: `Mengubah data ${officer.name_officer}`,
      icon: 'info',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleDeleteOfficer = async (officer) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        appleSwal({
          icon: 'error',
          title: 'Session Expired',
          text: 'Silahkan login kembali.',
          confirmButtonColor: '#dc2626',
        });
        return;
      }

      const officerId = officer.ID ?? officer.id;

      if (!officerId) {
        appleSwal({
          icon: 'error',
          title: 'ID Tidak Ditemukan',
          text: 'ID petugas tidak valid.',
        });
        return;
      }

      const confirmDelete = await appleSwal({
        title: 'Hapus Petugas?',
        html: `
        <div style="text-align:left">
          <p><b>Nama:</b> ${officer.name_officer}</p>
          <p><b>Gender:</b> ${officer.gender}</p>
          <p><b>Role:</b> ${officer.role}</p>
          <p><b>Status:</b> ${officer.status || 'Aktif'}</p>
          <br/>
          <span>Data petugas akan dihapus dari sistem.</span>
          <br/>
          <span style="color:#dc2626">Data tidak akan tampil pada daftar petugas aktif.</span>
        </div>
      `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#9ca3af',
      });

      if (!confirmDelete.isConfirmed) return;

      await api.delete(`/officer/${officerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await appleSwal({
        icon: 'success',
        title: 'Petugas Berhasil Dihapus',
        text: `${officer.name_officer} sudah dihapus dari daftar petugas.`,
        timer: 2000,
        showConfirmButton: false,
      });

      await fetchOfficer();
      await fetchIncidentSummary();
    } catch (error) {
      console.error('Gagal menghapus petugas:', error.response?.data || error.message);

      appleSwal({
        icon: 'error',
        title: 'Gagal Menghapus Petugas',
        text: error.response?.data || error.message || 'Terjadi kesalahan pada server.',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // =====================================
  // UPDATE STATUS OFFICER
  // =====================================

  const handleStatusOfficer = async (officer, newStatus) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        appleSwal({
          icon: 'error',
          title: 'Session Expired',
          text: 'Silahkan login kembali.',
        });

        return;
      }

      const officerId = officer.ID ?? officer.id;

      if (!officerId) {
        appleSwal({
          icon: 'error',
          title: 'ID Tidak Ditemukan',
          text: 'ID officer tidak valid.',
        });

        return;
      }

      // ==========================
      // CONFIRM STATUS
      // ==========================

      const confirmUpdate = await appleSwal({
        title: 'Ubah Status Petugas?',

        html: `
        <div style="text-align:left">
          <p><b>Nama:</b> ${officer.name_officer}</p>
          <p><b>Status Lama:</b> ${officer.status}</p>
          <p><b>Status Baru:</b> ${newStatus}</p>
        </div>
      `,

        icon: 'question',

        showCancelButton: true,

        confirmButtonText: 'Ya, Ubah',

        cancelButtonText: 'Batal',

        confirmButtonColor: '#2563eb',

        cancelButtonColor: '#9ca3af',
      });

      if (!confirmUpdate.isConfirmed) {
        return;
      }

      // ==========================
      // UPDATE STATUS
      // ==========================

      const response = await api.put(
        `/officer/status/${officerId}`,
        {
          status: newStatus,
          status_date: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Status updated:', response.data);

      // ==========================
      // SUCCESS
      // ==========================

      await appleSwal({
        icon: 'success',

        title: 'Status Berhasil Diubah',

        html: `
        <div>
          <b>${officer.name_officer}</b>
          <br/>
          sekarang menjadi
          <br/>
          <strong>${newStatus}</strong>
        </div>
      `,

        timer: 2000,

        showConfirmButton: false,
      });

      await fetchOfficer();
      await fetchIncidentSummary();
    } catch (error) {
      console.error('Gagal update status officer:', error.response?.data || error.message);

      appleSwal({
        icon: 'error',

        title: 'Gagal Mengubah Status',

        text: error.response?.data || error.message || 'Terjadi kesalahan',

        confirmButtonColor: '#dc2626',
      });
    }
  };

  // --- Filter dan Paginasi untuk Tabel Petugas ---
  const filteredOfficer = Array.isArray(officerList)
    ? officerList.filter((item) => {
        const name = item?.name_officer ?? '';
        return name.toLowerCase().includes(searchOfficerTerm.toLowerCase());
      })
    : [];

  const officerPageCount = Math.ceil(filteredOfficer.length / itemsPerPage);

  useEffect(() => {
    if (currentOfficerPage > officerPageCount) setCurrentOfficerPage(officerPageCount || 1);
  }, [officerPageCount, currentOfficerPage]);

  const paginatedOfficer = filteredOfficer.slice(
    (currentOfficerPage - 1) * itemsPerPage,
    currentOfficerPage * itemsPerPage
  );

  return (
    <Layout>
      <section className="p-3 md:p-6 mt-4">
        <Swiper
          modules={[Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          pagination={{
            clickable: true,
          }}
          loop={true}
        >
          {/* =================================
SLIDE 1 ANALISIS PERFORMA PETUGAS
================================= */}

          <SwiperSlide>
            <div
              onClick={() => setShowOfficerAnalysis(true)}
              className="group cursor-pointer relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8"
            >
              {/* HEADER */}
              <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="uppercase tracking-[3px] text-blue-600 text-[11px] font-semibold">
                    Analisis Petugas
                  </p>

                  <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <FiShield size={17} />
                    </span>
                    Performa Petugas
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis peringkat performa petugas berdasarkan jumlah insiden yang ditangani.
                  </p>
                </div>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUsers size={12} />
                    Total Petugas
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                    {officerPerformanceAnalysis.totalOfficer}
                  </h3>
                </div>

                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                  <p className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertCircle size={12} />
                    Total Insiden
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                    {officerPerformanceAnalysis.totalIncident}
                  </h3>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                  <p className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAward size={12} />
                    Petugas Terbaik
                  </p>
                  <h3 className="text-sm md:text-base font-bold text-slate-800 mt-2 truncate">
                    {officerPerformanceAnalysis.highest.name}
                  </h3>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                  <p className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiBarChart2 size={12} />
                    Rata-rata
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-amber-600 mt-2 tabular-nums">
                    {officerPerformanceAnalysis.average}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Insiden / Petugas</p>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-3 md:p-6 mb-6">
                <div className="h-[260px] sm:h-[300px] md:h-[350px]">
                  <Bar data={officerPerformanceChart} options={officerPerformanceOptions} />
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <p className="text-slate-400 flex items-center gap-2 text-xs md:text-sm">
                  <FiMousePointer size={14} />
                  Klik untuk melihat detail petugas
                </p>

                <div className="px-5 py-2.5 rounded-full bg-blue-600 text-white inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-300 text-sm font-semibold">
                  Lihat Laporan <FiArrowRight size={15} />
                </div>
              </div>
            </div>
          </SwiperSlide>
          {/* =================================
SLIDE 2 STATUS PETUGAS
================================= */}
          <SwiperSlide>
            <div
              onClick={() => setShowOfficerStatusAnalysis(true)}
              className="group cursor-pointer relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8"
            >
              {/* HEADER */}
              <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="uppercase tracking-[3px] text-emerald-600 text-[11px] font-semibold">
                    Status Personel
                  </p>

                  <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <FiClipboard size={17} />
                    </span>
                    Ringkasan Status Petugas
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Pemantauan status petugas aktif, mutasi, dan mengundurkan diri.
                  </p>
                </div>
              </div>

              {/* KPI STATUS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4">
                  <p className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUserCheck size={12} />
                    Aktif
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-emerald-600 mt-2 tabular-nums">
                    {officerStatusAnalysis.aktif}
                  </h3>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                  <p className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiRepeat size={12} />
                    Mutasi
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-amber-600 mt-2 tabular-nums">
                    {officerStatusAnalysis.mutasi}
                  </h3>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4">
                  <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUserX size={12} />
                    Resign
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-rose-600 mt-2 tabular-nums">
                    {officerStatusAnalysis.resign}
                  </h3>
                </div>

                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                  <p className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiPercent size={12} />
                    Persentase Aktif
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
                    {officerStatusAnalysis.activeRate}%
                  </h3>
                </div>
              </div>

              {/* DOUGHNUT */}
              <div className="rounded-xl border border-slate-100 p-3 md:p-6 mb-6">
                <div className="h-[260px] sm:h-[300px] md:h-[350px]">
                  <Doughnut data={officerStatusChart} options={officerStatusOptions} />
                </div>
              </div>

              {/* INSIGHT */}
              <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4 md:p-6 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-3 flex items-center gap-2">
                  <FiTrendingUp size={15} />
                  Analisis
                </h3>

                <div className="space-y-2">
                  {officerStatusAnalysis.insight.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-3 text-sm text-slate-600 leading-relaxed border border-emerald-100/60"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <p className="text-slate-400 flex items-center gap-2 text-xs md:text-sm">
                  <FiMousePointer size={14} />
                  Klik untuk melihat detail status petugas
                </p>

                <div className="px-5 py-2.5 rounded-full bg-emerald-600 text-white inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-300 text-sm font-semibold">
                  Lihat Laporan <FiArrowRight size={15} />
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
        {showOfficerAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
            onClick={() => setShowOfficerAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[95vh] md:max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-4 sm:p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-7 pb-6 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="uppercase tracking-[3px] text-blue-600 text-[11px] font-semibold">
                    Analisis Petugas
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <FiShield size={17} />
                    </span>
                    <span className="truncate">Analisis Performa Petugas</span>
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis performa petugas berdasarkan jumlah insiden yang berhasil ditangani.
                  </p>
                </div>

                <button
                  onClick={() => setShowOfficerAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 self-end sm:self-auto shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* SUMMARY KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUsers size={13} />
                    Total Petugas
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {officerPerformanceAnalysis.totalOfficer}
                  </h2>
                </div>

                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-indigo-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertCircle size={13} />
                    Total Insiden
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-indigo-600 mt-3 tabular-nums">
                    {officerPerformanceAnalysis.totalIncident}
                  </h2>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAward size={13} />
                    Petugas Terbaik
                  </div>

                  <h2 className="text-lg md:text-xl font-bold text-emerald-600 mt-3 truncate">
                    {officerPerformanceAnalysis.highest.name}
                  </h2>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiBarChart2 size={13} />
                    Rata-rata
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {officerPerformanceAnalysis.average}
                  </h2>

                  <p className="text-xs text-amber-600 mt-0.5">Insiden / Petugas</p>
                </div>
              </div>

              {/* DROPDOWN TAHUN */}
              <div className="relative inline-flex items-center mb-5">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 pl-4 pr-3 py-2.5 hover:border-slate-300 transition-colors duration-200">
                  <FiCalendar className="text-blue-500 shrink-0" size={15} />

                  <span className="text-sm font-medium text-slate-500">Tahun</span>

                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={handleYearChange}
                      className="appearance-none bg-blue-50 text-blue-700 font-semibold text-sm pl-3 pr-8 py-1.5 rounded-lg border-none outline-none cursor-pointer hover:bg-blue-100 transition-colors duration-200 focus:ring-2 focus:ring-blue-300"
                    >
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>

                    <svg
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500"
                      width="11"
                      height="11"
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

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-4 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-5 flex items-center gap-2">
                  <FiBarChart2 className="text-blue-500 shrink-0" size={15} />
                  Peringkat Performa Petugas
                </h3>

                <div className="h-[280px] md:h-[380px]">
                  <Bar data={officerPerformanceChart} options={officerPerformanceOptions} />
                </div>
              </div>

              {/* TABLE RANKING */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiAward className="text-amber-500 shrink-0" size={15} />
                  Peringkat Petugas Terbaik
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">
                            Peringkat
                          </th>
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">
                            Nama Petugas
                          </th>
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">
                            Insiden
                          </th>
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">
                            Kontribusi
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {officerPerformanceAnalysis.ranking.map((item, index) => (
                          <tr key={item.name} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 font-semibold text-slate-400 whitespace-nowrap">
                              #{index + 1}
                            </td>
                            <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                              {item.name}
                            </td>
                            <td className="p-3.5 text-slate-600 tabular-nums whitespace-nowrap">
                              {item.incidentCount}
                            </td>
                            <td className="p-3.5 text-slate-600 tabular-nums whitespace-nowrap">
                              {(
                                (item.incidentCount / officerPerformanceAnalysis.totalIncident) *
                                100
                              ).toFixed(1)}
                              %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* STATUS PETUGAS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUserCheck size={13} />
                    Aktif
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.aktif}
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">{officerStatusAnalysis.activeRate}%</p>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiRepeat size={13} />
                    Mutasi
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.mutasi}
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    {officerStatusAnalysis.mutationRate}%
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUserX size={13} />
                    Mengundurkan Diri
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.resign}
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">{officerStatusAnalysis.resignRate}%</p>
                </div>
              </div>

              {/* ANALISIS + REKOMENDASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5 md:p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp className="text-blue-600 shrink-0" size={15} />
                    Analisis
                  </h3>

                  <div className="space-y-2.5">
                    {officerPerformanceAnalysis.insight.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5 md:p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                    <FiZap className="text-emerald-600 shrink-0" size={15} />
                    Rekomendasi
                  </h3>

                  <div className="space-y-2.5">
                    {officerPerformanceAnalysis.recommendation.map((item, index) => (
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

        {showOfficerStatusAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
            onClick={() => setShowOfficerStatusAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[95vh] md:max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-4 sm:p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-7 pb-6 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="uppercase tracking-[3px] text-emerald-600 text-[11px] font-semibold">
                    Status Personel
                  </p>

                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <FiClipboard size={17} />
                    </span>
                    <span className="truncate">Analisis Status Petugas</span>
                  </h2>

                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Pemantauan status aktif, mutasi, dan pengunduran diri petugas CCTV.
                  </p>
                </div>

                <button
                  onClick={() => setShowOfficerStatusAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 self-end sm:self-auto shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* SUMMARY */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
                {/* TOTAL PETUGAS */}
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUsers size={13} />
                    Total Petugas
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.totalOfficer}
                  </h2>
                </div>

                {/* AKTIF */}
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUserCheck size={13} />
                    Aktif
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.aktif}
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">{officerStatusAnalysis.activeRate}%</p>
                </div>

                {/* MUTASI */}
                <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiRepeat size={13} />
                    Mutasi
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-amber-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.mutasi}
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    {officerStatusAnalysis.mutationRate}%
                  </p>
                </div>

                {/* MENGUNDURKAN DIRI */}
                <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUserX size={13} />
                    Mengundurkan Diri
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-rose-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.resign}
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">{officerStatusAnalysis.resignRate}%</p>
                </div>

                {/* UPDATE TERAKHIR */}
                <div className="rounded-xl bg-violet-50/60 border border-violet-100 p-4 md:p-5 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-violet-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiClock size={13} />
                    Pembaruan Terakhir
                  </div>

                  <h2 className="text-base md:text-lg font-bold text-violet-600 mt-3">
                    {officerStatusAnalysis.lastUpdate || '-'}
                  </h2>
                </div>
              </div>

              {/* CHART */}
              <div className="rounded-xl border border-slate-100 p-4 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-5 flex items-center gap-2">
                  <FiPieChart className="text-emerald-500 shrink-0" size={15} />
                  Distribusi Status Petugas
                </h3>

                <div className="h-[280px] md:h-[360px]">
                  <Doughnut data={officerStatusChart} options={officerStatusOptions} />
                </div>
              </div>

              {/* DETAIL TABLE */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3 flex items-center gap-2">
                  <FiUsers className="text-slate-400 shrink-0" size={15} />
                  Detail Status Petugas
                </h3>

                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">No</th>
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">Nama</th>
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">
                            Jabatan
                          </th>
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">
                            Status
                          </th>
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">
                            Tanggal Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {officerStatusAnalysis.officerList?.map((item, index) => (
                          <tr key={item.ID} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 text-slate-400 whitespace-nowrap">{index + 1}</td>

                            <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                              {item.name_officer}
                            </td>

                            <td className="p-3.5 text-slate-600 whitespace-nowrap">{item.role}</td>

                            <td className="p-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs ring-1
                          ${
                            (item.status || 'Aktif') === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : item.status === 'Mutasi'
                                ? 'bg-amber-50 text-amber-700 ring-amber-200'
                                : 'bg-rose-50 text-rose-700 ring-rose-200'
                          }
                        `}
                              >
                                {(item.status || 'Aktif') === 'Aktif' && <FiUserCheck size={12} />}
                                {item.status === 'Mutasi' && <FiRepeat size={12} />}
                                {item.status === 'Resign' && <FiUserX size={12} />}
                                {item.status || 'Aktif'}
                              </span>
                            </td>

                            <td className="p-3.5 text-slate-600 whitespace-nowrap">
                              {item.tanggal_status
                                ? new Date(item.tanggal_status).toLocaleString('id-ID', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ANALISIS + REKOMENDASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-5 md:p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp className="text-blue-600 shrink-0" size={15} />
                    Analisis
                  </h3>

                  <div className="space-y-2.5">
                    {officerStatusAnalysis.insight?.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-blue-100/60"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5 md:p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 mb-4 flex items-center gap-2">
                    <FiZap className="text-emerald-600 shrink-0" size={15} />
                    Rekomendasi
                  </h3>

                  <div className="space-y-2.5">
                    {officerStatusAnalysis.recommendation?.map((item, index) => (
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
      </section>
      {/* Section 1 - Tombol & Form Petugas */}

      <section className="p-3 md:p-6">
        {/* HEADER CARD */}

        <div
          ref={headerCardRef}
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
              <FiUsers size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 truncate">Manajemen Petugas</h2>

              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Kelola data petugas HSE & CCTV
              </p>
            </div>
          </div>

          {/* BUTTON TAMBAH */}

          {canManageOfficer && (
            <button
              onClick={() => {
                setShowOfficerForm(true);

                setIsEditingOfficer(false);

                setOfficerFormData({
                  name_officer: '',
                  gender: '',
                  role: '',
                });

                setEditOfficerId(null);
              }}
              title="Tambah Petugas"
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
                ${showAddBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
              `}
            >
              <FiPlus size={20} className="shrink-0" />

              {showAddBtnText && (
                <span className="whitespace-nowrap">
                  Tambah
                  <br />
                  Petugas
                </span>
              )}
            </button>
          )}
        </div>

        {/* MONITORING CALENDAR */}

        <div
          ref={calendarCardRef}
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
            onClick={() => setShowCalendar(true)}
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
              ${showCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
            `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showCalendar && (
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
            onClick={() => setShowCalendar(false)}
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
                onClick={() => setShowCalendar(false)}
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

        {/* FORM MODAL */}

        {showOfficerForm && (
          <div
            className="
              fixed
              inset-0
              bg-black/40
              backdrop-blur-xl
              flex
              items-center
              justify-center
              z-50
              p-2 sm:p-4 md:p-6
            "
            onClick={() => {
              setShowOfficerForm(false);

              setIsEditingOfficer(false);

              setOfficerFormData({
                name_officer: '',
                gender: '',
                role: '',
              });

              setEditOfficerId(null);
            }}
          >
            <div
              className="
                w-full
                max-w-xl
                bg-white/90
                backdrop-blur-2xl
                rounded-2xl md:rounded-[32px]
                shadow-2xl
                border
                border-white/50
                p-4 sm:p-6 md:p-8
                max-h-[95vh]
                overflow-y-auto
                relative
                animate-fade-in
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`
                      w-11 h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      shrink-0
                      ${isEditingOfficer ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}
                    `}
                  >
                    {isEditingOfficer ? <FiEdit2 size={18} /> : <FiUserPlus size={18} />}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 truncate">
                      {isEditingOfficer ? 'Edit Petugas' : 'Tambah Petugas'}
                    </h2>

                    <p className="text-sm text-gray-500 mt-0.5">Kelola data personel HSE & CCTV</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowOfficerForm(false);

                    setIsEditingOfficer(false);

                    setEditOfficerId(null);
                  }}
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-gray-100
                    hover:bg-gray-200
                    text-gray-500
                    transition
                    flex
                    items-center
                    justify-center
                    self-end sm:self-auto
                    shrink-0
                  "
                >
                  <FiX size={22} />
                </button>
              </div>

              <form onSubmit={handleOfficerSubmit} className="space-y-5 md:space-y-6">
                {/* NAMA */}

                <div>
                  <label className="text-sm font-semibold text-gray-700">Nama Petugas</label>

                  <input
                    type="text"
                    name="name_officer"
                    value={officerFormData.name_officer}
                    onChange={handleOfficerChange}
                    required
                    className="
                      mt-2
                      w-full
                      px-4 md:px-5
                      py-3
                      md:py-3.5
                      rounded-2xl
                      bg-gray-50
                      border
                      border-gray-200
                      outline-none
                      transition
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/20
                      focus:border-blue-500
                    "
                  />
                </div>

                {/* GENDER */}

                <div>
                  <label className="text-sm font-semibold text-gray-700">Jenis Kelamin</label>

                  <select
                    name="gender"
                    value={officerFormData.gender}
                    onChange={handleOfficerChange}
                    required
                    className="
                      mt-2
                      w-full
                      px-4 md:px-5
                      py-3
                      md:py-3.5
                      rounded-2xl
                      bg-gray-50
                      border
                      border-gray-200
                      outline-none
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/20
                      focus:border-blue-500
                    "
                  >
                    <option value="">Pilih Jenis Kelamin</option>

                    <option value="Laki-laki">Laki-laki</option>

                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* JABATAN */}

                <div>
                  <label className="text-sm font-semibold text-gray-700">Jabatan</label>

                  <select
                    name="role"
                    value={officerFormData.role}
                    onChange={handleOfficerChange}
                    required
                    className="
                      mt-2
                      w-full
                      px-4 md:px-5
                      py-3
                      md:py-3.5
                      rounded-2xl
                      bg-gray-50
                      border
                      border-gray-200
                      outline-none
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/20
                      focus:border-blue-500
                    "
                  >
                    <option value="">Pilih Jabatan</option>

                    <option value="Manager HSE">Manager HSE</option>

                    <option value="Petugas HSE">Petugas HSE</option>

                    <option value="Petugas CCTV">Petugas CCTV</option>
                  </select>
                </div>

                {/* BUTTON */}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOfficerForm(false);

                      setIsEditingOfficer(false);

                      setEditOfficerId(null);
                    }}
                    className="
                      px-6
                      py-3
                      rounded-2xl
                      bg-gray-100
                      hover:bg-gray-200
                      text-gray-700
                      font-semibold
                      transition
                      w-full sm:w-auto
                    "
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="
                      px-7
                      py-3
                      rounded-2xl
                      bg-black
                      hover:bg-gray-800
                      text-white
                      font-semibold
                      shadow-lg
                      transition
                      flex
                      items-center
                      justify-center
                      gap-2
                      w-full sm:w-auto
                    "
                  >
                    {isEditingOfficer ? (
                      <>
                        <FiCheck size={16} /> Simpan
                      </>
                    ) : (
                      <>
                        <FiPlus size={16} /> Tambah
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Section 2 - Tabel Petugas */}
      <section className="p-3 md:p-4 mt-8 md:mt-12">
        <input
          type="text"
          placeholder="🔍 Cari nama petugas..."
          value={searchOfficerTerm}
          onChange={(e) => {
            setSearchOfficerTerm(e.target.value);
            setCurrentOfficerPage(1);
          }}
          className="
            w-full
            mb-4
            px-4
            py-2.5
            border
            border-gray-300
            rounded-md
            focus:outline-none
            focus:ring-2
            focus:ring-blue-400
            transition
          "
        />

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md -mx-3 px-3 md:mx-0 md:px-0">
          <table className="min-w-[900px] w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  No
                </th>

                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Nama Petugas
                </th>

                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Jenis Kelamin
                </th>

                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Jabatan
                </th>

                <th className="px-4 md:px-6 py-3 text-center text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Status
                </th>

                <th className="px-4 md:px-6 py-3 text-center text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Tanggal Status
                </th>

                <th className="px-4 md:px-6 py-3 text-center text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedOfficer.length > 0 ? (
                paginatedOfficer.map((officer, index) => (
                  <tr
                    key={officer?.ID || `officer-row-${index}`}
                    className="hover:bg-gray-100/50 transition"
                  >
                    {/* NO */}

                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {(currentOfficerPage - 1) * itemsPerPage + index + 1}
                    </td>

                    {/* NAMA */}

                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {officer.name_officer}
                    </td>

                    {/* GENDER */}

                    <td className="px-4 md:px-6 py-4 text-center text-sm text-gray-900 whitespace-nowrap">
                      {officer.gender}
                    </td>

                    {/* JABATAN */}

                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {officer.role}
                    </td>

                    {/* STATUS */}

                    <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                      {(officer.status || 'Aktif') === 'Aktif' && (
                        <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-xs md:text-sm">
                          🟢 Aktif
                        </span>
                      )}

                      {officer.status === 'Mutasi' && (
                        <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-xs md:text-sm">
                          🟡 Mutasi
                        </span>
                      )}

                      {officer.status === 'Resign' && (
                        <span className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-red-100 text-red-700 font-semibold text-xs md:text-sm">
                          🔴 Resign
                        </span>
                      )}
                    </td>

                    {/* TANGGAL STATUS */}

                    <td className="px-4 md:px-6 py-4 text-center text-sm text-gray-700 whitespace-nowrap">
                      {officer.tanggal_status
                        ? new Date(officer.tanggal_status).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    {/* AKSI */}

                    <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        {canManageOfficer && (
                          <>
                            {/* EDIT */}
                            <button
                              onClick={() => handleEditOfficer(officer)}
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

                            {/* STATUS DROPDOWN */}

                            <select
                              value={officer.status || 'Aktif'}
                              onChange={(e) => {
                                const newStatus = e.target.value;

                                if (newStatus === (officer.status || 'Aktif')) {
                                  return;
                                }

                                handleStatusOfficer(officer, newStatus);
                              }}
                              title="Status Officer"
                              className="
                                px-2 md:px-3
                                py-1.5
                                rounded-lg
                                border
                                border-gray-300
                                bg-white
                                text-xs md:text-sm
                                font-semibold
                                text-gray-700
                                shadow-sm
                                cursor-pointer
                              "
                            >
                              <option value="Aktif">🟢 Aktif</option>

                              <option value="Mutasi">🟡 Mutasi</option>

                              <option value="Resign">🔴 Resign</option>
                            </select>

                            {/* DELETE */}

                            <button
                              onClick={() => handleDeleteOfficer(officer)}
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada petugas ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {officerPageCount > 1 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[...Array(officerPageCount)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentOfficerPage(i + 1)}
                className={`
                  px-3
                  py-1.5
                  rounded
                  text-sm
                  ${
                    currentOfficerPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }
                `}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
