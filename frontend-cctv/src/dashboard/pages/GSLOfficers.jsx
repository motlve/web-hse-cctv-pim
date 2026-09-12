import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import api from '../api/axios';
import { appleSwal } from '../utils/appleSwal';
import MonitoringCalendar from '../components/Calander';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUserCheck,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiCalendar,
  FiUsers,
  FiAlertCircle,
  FiAward,
  FiBarChart2,
  FiTrendingUp,
  FiZap,
  FiCheck,
  FiClipboard,
  FiClock,
  FiPieChart,
  FiMousePointer,
  FiArrowRight,
  FiPercent,
  FiUserX,
  FiUserPlus,
} from 'react-icons/fi';
import { FaUmbrellaBeach } from 'react-icons/fa';

import 'swiper/css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const STATUS_OPTIONS = ['Aktif', 'Cuti', 'Nonaktif'];

export default function GSLOfficerManagement() {
  const role = localStorage.getItem('role');
  const canManage = ['Admin', 'Manager HSE', 'Petugas HSE'].includes(role);

  const [officers, setOfficers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nameOfficer: '',
    gender: '',
    role: '',
    status: 'Aktif',
  });

  const [showStatusForm, setShowStatusForm] = useState(false);
  const [statusTargetId, setStatusTargetId] = useState(null);
  const [statusValue, setStatusValue] = useState('');

  const [showPerformanceAnalysis, setShowPerformanceAnalysis] = useState(false);
  const [showStatusAnalysis, setShowStatusAnalysis] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  /* ===================== Responsif Header & Kalender ===================== */
  const headerCardRef = useRef(null);
  const [showAddBtnText, setShowAddBtnText] = useState(true);

  const calendarCardRef = useRef(null);
  const [showCalendarText, setShowCalendarText] = useState(true);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === headerCardRef.current) {
          setShowAddBtnText(width > 340);
        }
        if (entry.target === calendarCardRef.current) {
          setShowCalendarText(width > 260);
        }
      }
    });

    if (headerCardRef.current) observer.observe(headerCardRef.current);
    if (calendarCardRef.current) observer.observe(calendarCardRef.current);

    return () => observer.disconnect();
  }, []);

  /* ===================== Fetch Data ===================== */
  const fetchOfficers = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get('/gsl-officer', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOfficers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch GSL officers error:', err.response?.data || err.message);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get('/complaints', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComplaints(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch complaints error:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchOfficers();
    fetchComplaints();
  }, []);

  /* ===================== Analisis Performa (Komplain per Petugas) ===================== */
  const getOfficerPerformanceAnalysis = () => {
    const counts = {};

    complaints.forEach((c) => {
      const id = c.gslOfficerId || c.gslOfficer?.id;
      if (!id) return;
      counts[id] = (counts[id] || 0) + 1;
    });

    const ranking = officers
      .map((o) => ({
        name: o.nameOfficer,
        id: o.id,
        complaintCount: counts[o.id] || 0,
      }))
      .filter((item) => item.complaintCount > 0)
      .sort((a, b) => b.complaintCount - a.complaintCount);

    const totalOfficer = ranking.length;
    const totalComplaint = ranking.reduce((sum, item) => sum + item.complaintCount, 0);
    const highest = ranking[0] || { name: '-', complaintCount: 0 };
    const average = totalOfficer === 0 ? 0 : Number((totalComplaint / totalOfficer).toFixed(2));

    // `officers` cuma berisi petugas yang masih aktif (backend exclude yang
    // soft-deleted). Komplain yang gslOfficerId-nya menunjuk ke petugas yang
    // sudah dihapus tetap ada di `counts` tapi tidak pernah masuk `ranking`
    // di atas — dihitung terpisah di sini, bukan diam-diam hilang dari
    // "Total Komplain", sama seperti fix pola serupa di Data Lokasi & Kategori Komplain.
    const activeOfficerIds = new Set(officers.map((o) => o.id));
    const unmatchedOfficerComplaintCount = Object.entries(counts).reduce(
      (sum, [id, count]) => (activeOfficerIds.has(Number(id)) ? sum : sum + count),
      0
    );

    return {
      totalOfficer,
      totalComplaint,
      unmatchedOfficerComplaintCount,
      average,
      highest,
      ranking,
      top10: ranking.slice(0, 10),
      insight: [
        `Total petugas GSL yang menangani komplain sebanyak ${totalOfficer} orang.`,
        `Total komplain yang tercatat sebanyak ${totalComplaint} kasus.`,
        highest.name !== '-'
          ? `${highest.name} memiliki beban penanganan tertinggi dengan ${highest.complaintCount} komplain.`
          : 'Belum ada data komplain yang tercatat.',
      ],
      recommendation: [
        'Berikan apresiasi kepada petugas dengan jumlah penanganan tertinggi.',
        'Evaluasi distribusi komplain jika terdapat perbedaan beban kerja besar.',
        'Gunakan histori komplain sebagai dasar evaluasi performa.',
        'Pastikan pembagian komplain antar petugas tetap seimbang.',
      ],
    };
  };

  const getOfficerPerformanceChart = () => {
    const analysis = getOfficerPerformanceAnalysis();

    const colors = [
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16',
      '#f59e0b',
      '#ef4444',
      '#22c55e',
      '#2563eb',
    ];

    return {
      labels: analysis.top10.map((item) => item.name),
      datasets: [
        {
          label: 'Jumlah Komplain Ditangani',
          data: analysis.top10.map((item) => item.complaintCount),
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

  const officerPerformanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    animation: { duration: 1200 },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: '🏆 Ranking Penanganan Komplain Petugas GSL',
        font: { size: 18 },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} komplain`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: { display: true, text: 'Jumlah Komplain' },
        ticks: { stepSize: 1 },
      },
      y: {
        title: { display: true, text: 'Nama Petugas' },
      },
    },
  };

  /* ===================== Analisis Status Petugas ===================== */
  const getOfficerStatusAnalysis = () => {
    const statusMap = { Aktif: 0, Cuti: 0, Nonaktif: 0 };
    const officerListData = [];

    officers.forEach((item) => {
      const status = item.status?.trim() || 'Aktif';

      if (statusMap[status] !== undefined) {
        statusMap[status]++;
      }

      officerListData.push({
        id: item.id,
        nameOfficer: item.nameOfficer || '-',
        role: item.role || '-',
        status,
        tanggalStatus: item.tanggalStatus || null,
        gender: item.gender || '-',
      });
    });

    const totalOfficer = officers.length;
    const aktif = statusMap.Aktif;
    const cuti = statusMap.Cuti;
    const nonaktif = statusMap.Nonaktif;

    const activeRate = totalOfficer === 0 ? 0 : Number(((aktif / totalOfficer) * 100).toFixed(1));
    const cutiRate = totalOfficer === 0 ? 0 : Number(((cuti / totalOfficer) * 100).toFixed(1));
    const nonaktifRate =
      totalOfficer === 0 ? 0 : Number(((nonaktif / totalOfficer) * 100).toFixed(1));

    const ranking = [
      { status: 'Aktif', total: aktif },
      { status: 'Cuti', total: cuti },
      { status: 'Nonaktif', total: nonaktif },
    ].sort((a, b) => b.total - a.total);

    const highest = ranking[0] || { status: '-', total: 0 };

    const lastUpdate = officerListData
      .filter((item) => item.tanggalStatus)
      .sort((a, b) => new Date(b.tanggalStatus) - new Date(a.tanggalStatus))[0];

    return {
      totalOfficer,
      aktif,
      cuti,
      nonaktif,
      activeRate,
      cutiRate,
      nonaktifRate,
      highest,
      lastUpdate: lastUpdate
        ? new Date(lastUpdate.tanggalStatus).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
      ranking,
      officerList: officerListData,
      insight: [
        `Total petugas GSL terdaftar sebanyak ${totalOfficer} orang.`,
        `Jumlah petugas aktif sebanyak ${aktif} orang (${activeRate}%).`,
        `Jumlah petugas cuti sebanyak ${cuti} orang (${cutiRate}%).`,
        `Jumlah petugas nonaktif sebanyak ${nonaktif} orang (${nonaktifRate}%).`,
        highest.status !== '-'
          ? `${highest.status} merupakan status dominan dengan jumlah ${highest.total} petugas.`
          : 'Belum terdapat data status petugas.',
      ],
      recommendation: [
        'Update status petugas setiap terjadi perubahan (cuti/nonaktif).',
        'Gunakan data status untuk menentukan kebutuhan manpower GSL per shift.',
        'Monitoring jumlah petugas aktif secara berkala.',
        'Pastikan coverage penanganan komplain tetap berjalan meski ada petugas cuti.',
      ],
    };
  };

  const getOfficerStatusChart = () => {
    const analysis = getOfficerStatusAnalysis();

    return {
      labels: ['Aktif', 'Cuti', 'Nonaktif'],
      datasets: [
        {
          label: 'Jumlah Petugas',
          data: [analysis.aktif, analysis.cuti, analysis.nonaktif],
          backgroundColor: ['#22c55e', '#eab308', '#6b7280'],
          borderColor: ['#16a34a', '#ca8a04', '#4b5563'],
          borderWidth: 2,
          hoverOffset: 15,
        },
      ],
    };
  };

  const officerStatusAnalysis = getOfficerStatusAnalysis();
  const officerStatusChart = getOfficerStatusChart();

  const officerStatusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    animation: { animateRotate: true, duration: 1200 },
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20 } },
      title: {
        display: true,
        text: '📌 Status Personel GSL',
        font: { size: 18 },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percent = total === 0 ? 0 : ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percent}%)`;
          },
        },
      },
    },
  };

  /* ===================== CRUD Petugas ===================== */
  const openCreate = () => {
    setFormData({ nameOfficer: '', gender: '', role: '', status: 'Aktif' });
    setIsEdit(false);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (o) => {
    setFormData({ nameOfficer: o.nameOfficer, gender: o.gender, role: o.role, status: o.status });
    setIsEdit(true);
    setEditId(o.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    try {
      if (isEdit) {
        await api.put(
          `/gsl-officer/${editId}`,
          { nameOfficer: formData.nameOfficer, gender: formData.gender, role: formData.role },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await appleSwal({
          icon: 'success',
          title: 'Berhasil',
          text: 'Petugas GSL berhasil diupdate',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await api.post(
          '/gsl-officer',
          {
            nameOfficer: formData.nameOfficer,
            gender: formData.gender,
            role: formData.role,
            status: formData.status,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await appleSwal({
          icon: 'success',
          title: 'Berhasil',
          text: 'Petugas GSL berhasil ditambahkan',
          timer: 2000,
          showConfirmButton: false,
        });
      }

      setShowForm(false);
      fetchOfficers();
    } catch (err) {
      appleSwal({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data || 'Gagal menyimpan data petugas',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const openStatusUpdate = (o) => {
    setStatusTargetId(o.id);
    setStatusValue(o.status || '');
    setShowStatusForm(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    try {
      await api.put(
        `/gsl-officer/status/${statusTargetId}`,
        { status: statusValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await appleSwal({
        icon: 'success',
        title: 'Berhasil',
        text: 'Status petugas berhasil diupdate',
        timer: 2000,
        showConfirmButton: false,
      });

      setShowStatusForm(false);
      fetchOfficers();
    } catch (err) {
      appleSwal({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data || 'Gagal update status',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = await appleSwal({
      title: 'Hapus Petugas?',
      text: 'Petugas yang masih dipakai di data komplain tidak bisa dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af',
      reverseButtons: true,
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');

      await api.delete(`/gsl-officer/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await appleSwal({
        icon: 'success',
        title: 'Berhasil',
        text: 'Petugas GSL berhasil dihapus',
        timer: 2000,
        showConfirmButton: false,
      });

      fetchOfficers();
    } catch (err) {
      appleSwal({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.response?.data || 'Gagal menghapus petugas',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  /* ===================== Filter & Pagination ===================== */
  const filtered = officers.filter((o) =>
    `${o.nameOfficer} ${o.role}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount || 1);
  }, [pageCount, currentPage]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const statusStyle = {
    Aktif: 'bg-green-100 text-green-700 border-green-200',
    Cuti: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Nonaktif: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  return (
    <Layout>
      {/* ================= ANALYTICS SWIPER ================= */}
      <section className="p-3 md:p-6 mt-4">
        <Swiper
          modules={[Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          pagination={{ clickable: true }}
          loop={true}
        >
          {/* SLIDE 1 - PERFORMA PETUGAS */}
          <SwiperSlide>
            <div
              onClick={() => setShowPerformanceAnalysis(true)}
              className="group cursor-pointer relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8"
            >
              <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                    Analisis Petugas
                  </p>
                  <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                      <FiUserCheck size={17} />
                    </span>
                    Performa Petugas GSL
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis peringkat petugas berdasarkan jumlah komplain yang ditangani.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUsers size={12} />
                    Petugas Aktif Menangani
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                    {officerPerformanceAnalysis.totalOfficer}
                  </h3>
                </div>

                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-4">
                  <p className="flex items-center gap-1.5 text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertCircle size={12} />
                    Total Komplain
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-purple-600 mt-2 tabular-nums">
                    {officerPerformanceAnalysis.totalComplaint}
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
                  <p className="text-xs text-slate-500 mt-0.5">Komplain / Petugas</p>
                </div>
              </div>

              {officerPerformanceAnalysis.unmatchedOfficerComplaintCount > 0 && (
                <div className="mb-6 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-amber-800">
                  <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-xs sm:text-sm leading-snug">
                    <b>{officerPerformanceAnalysis.unmatchedOfficerComplaintCount}</b> komplain
                    tertaut ke petugas GSL yang sudah dihapus dan tidak muncul di peringkat/"Total
                    Komplain" di atas.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-slate-100 p-3 md:p-6 mb-6">
                <div className="h-[260px] sm:h-[300px] md:h-[350px]">
                  <Bar data={officerPerformanceChart} options={officerPerformanceOptions} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <p className="text-slate-400 flex items-center gap-2 text-xs md:text-sm">
                  <FiMousePointer size={14} />
                  Klik untuk melihat detail petugas
                </p>
                <div className="px-5 py-2.5 rounded-full bg-purple-600 text-white inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-300 text-sm font-semibold">
                  Lihat Laporan <FiArrowRight size={15} />
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* SLIDE 2 - STATUS PETUGAS */}
          <SwiperSlide>
            <div
              onClick={() => setShowStatusAnalysis(true)}
              className="group cursor-pointer relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8"
            >
              <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="uppercase tracking-[3px] text-emerald-600 text-[11px] font-semibold">
                    Status Personel
                  </p>
                  <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <FiClipboard size={17} />
                    </span>
                    Ringkasan Status Petugas GSL
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Pemantauan status petugas aktif, cuti, dan nonaktif.
                  </p>
                </div>
              </div>

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

                <div className="rounded-xl bg-yellow-50/60 border border-yellow-100 p-4">
                  <p className="flex items-center gap-1.5 text-yellow-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FaUmbrellaBeach size={12} />
                    Cuti
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-yellow-600 mt-2 tabular-nums">
                    {officerStatusAnalysis.cuti}
                  </h3>
                </div>

                <div className="rounded-xl bg-gray-50/80 border border-gray-200 p-4">
                  <p className="flex items-center gap-1.5 text-gray-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUserX size={12} />
                    Nonaktif
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-600 mt-2 tabular-nums">
                    {officerStatusAnalysis.nonaktif}
                  </h3>
                </div>

                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-4">
                  <p className="flex items-center gap-1.5 text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiPercent size={12} />
                    Persentase Aktif
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-purple-600 mt-2 tabular-nums">
                    {officerStatusAnalysis.activeRate}%
                  </h3>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-3 md:p-6 mb-6">
                <div className="h-[260px] sm:h-[300px] md:h-[350px]">
                  <Doughnut data={officerStatusChart} options={officerStatusOptions} />
                </div>
              </div>

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

        {/* ================= MODAL: PERFORMANCE ANALYSIS ================= */}
        {showPerformanceAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
            onClick={() => setShowPerformanceAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[95vh] md:max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-4 sm:p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-7 pb-6 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                    Analisis Petugas
                  </p>
                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                      <FiUserCheck size={17} />
                    </span>
                    <span className="truncate">Analisis Performa Petugas GSL</span>
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Analisis performa petugas berdasarkan jumlah komplain yang berhasil ditangani.
                  </p>
                </div>

                <button
                  onClick={() => setShowPerformanceAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 self-end sm:self-auto shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUsers size={13} />
                    Petugas Aktif Menangani
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-purple-600 mt-3 tabular-nums">
                    {officerPerformanceAnalysis.totalOfficer}
                  </h2>
                </div>

                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-indigo-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiAlertCircle size={13} />
                    Total Komplain
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-indigo-600 mt-3 tabular-nums">
                    {officerPerformanceAnalysis.totalComplaint}
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
                  <p className="text-xs text-amber-600 mt-0.5">Komplain / Petugas</p>
                </div>
              </div>

              {officerPerformanceAnalysis.unmatchedOfficerComplaintCount > 0 && (
                <div className="mb-6 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800">
                  <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-xs sm:text-sm leading-snug">
                    <b>{officerPerformanceAnalysis.unmatchedOfficerComplaintCount}</b> komplain
                    tertaut ke petugas GSL yang sudah dihapus dan tidak muncul di peringkat/"Total
                    Komplain" di atas.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-slate-100 p-4 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-5 flex items-center gap-2">
                  <FiBarChart2 className="text-purple-500 shrink-0" size={15} />
                  Peringkat Penanganan Komplain
                </h3>
                <div className="h-[280px] md:h-[380px]">
                  <Bar data={officerPerformanceChart} options={officerPerformanceOptions} />
                </div>
              </div>

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
                            Komplain
                          </th>
                          <th className="p-3.5 text-left font-semibold whitespace-nowrap">
                            Kontribusi
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {officerPerformanceAnalysis.ranking.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 font-semibold text-slate-400 whitespace-nowrap">
                              #{index + 1}
                            </td>
                            <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                              {item.name}
                            </td>
                            <td className="p-3.5 text-slate-600 tabular-nums whitespace-nowrap">
                              {item.complaintCount}
                            </td>
                            <td className="p-3.5 text-slate-600 tabular-nums whitespace-nowrap">
                              {officerPerformanceAnalysis.totalComplaint
                                ? (
                                    (item.complaintCount /
                                      officerPerformanceAnalysis.totalComplaint) *
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-5 md:p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp className="text-purple-600 shrink-0" size={15} />
                    Analisis
                  </h3>
                  <div className="space-y-2.5">
                    {officerPerformanceAnalysis.insight.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-purple-100/60"
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

        {/* ================= MODAL: STATUS ANALYSIS ================= */}
        {showStatusAnalysis && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
            onClick={() => setShowStatusAnalysis(false)}
          >
            <div
              className="relative w-full max-w-7xl max-h-[95vh] md:max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 p-4 sm:p-6 md:p-9"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-7 pb-6 border-b border-slate-100">
                <div className="min-w-0">
                  <p className="uppercase tracking-[3px] text-emerald-600 text-[11px] font-semibold">
                    Status Personel
                  </p>
                  <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <FiClipboard size={17} />
                    </span>
                    <span className="truncate">Analisis Status Petugas GSL</span>
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Pemantauan status aktif, cuti, dan nonaktif petugas GSL.
                  </p>
                </div>

                <button
                  onClick={() => setShowStatusAnalysis(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 self-end sm:self-auto shrink-0"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUsers size={13} />
                    Total Petugas
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-purple-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.totalOfficer}
                  </h2>
                </div>

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

                <div className="rounded-xl bg-yellow-50/60 border border-yellow-100 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-yellow-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FaUmbrellaBeach size={13} />
                    Cuti
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-yellow-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.cuti}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">{officerStatusAnalysis.cutiRate}%</p>
                </div>

                <div className="rounded-xl bg-gray-50/80 border border-gray-200 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-gray-700 text-[11px] font-semibold uppercase tracking-wide">
                    <FiUserX size={13} />
                    Nonaktif
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-600 mt-3 tabular-nums">
                    {officerStatusAnalysis.nonaktif}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {officerStatusAnalysis.nonaktifRate}%
                  </p>
                </div>

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

              <div className="rounded-xl border border-slate-100 p-4 md:p-7 mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-5 flex items-center gap-2">
                  <FiPieChart className="text-emerald-500 shrink-0" size={15} />
                  Distribusi Status Petugas
                </h3>
                <div className="h-[280px] md:h-[360px]">
                  <Doughnut data={officerStatusChart} options={officerStatusOptions} />
                </div>
              </div>

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
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 text-slate-400 whitespace-nowrap">{index + 1}</td>
                            <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                              {item.nameOfficer}
                            </td>
                            <td className="p-3.5 text-slate-600 whitespace-nowrap">{item.role}</td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs ring-1
                          ${
                            item.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : item.status === 'Cuti'
                                ? 'bg-yellow-50 text-yellow-700 ring-yellow-200'
                                : 'bg-gray-50 text-gray-700 ring-gray-200'
                          }
                        `}
                              >
                                {item.status === 'Aktif' && <FiUserCheck size={12} />}
                                {item.status === 'Cuti' && <FaUmbrellaBeach size={12} />}
                                {item.status === 'Nonaktif' && <FiUserX size={12} />}
                                {item.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-600 whitespace-nowrap">
                              {item.tanggalStatus
                                ? new Date(item.tanggalStatus).toLocaleString('id-ID', {
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-5 md:p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-purple-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp className="text-purple-600 shrink-0" size={15} />
                    Analisis
                  </h3>
                  <div className="space-y-2.5">
                    {officerStatusAnalysis.insight?.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-purple-100/60"
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

      {/* ================= HEADER + KALENDER + FORM ================= */}
      <section className="p-3 md:p-6">
        <div
          ref={headerCardRef}
          className="w-full max-w-sm bg-white rounded-2xl md:rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,.08)] px-4 md:px-5 py-4 md:py-5 flex flex-wrap gap-3 justify-between items-center"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <FiUsers size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 truncate">Manajemen Petugas GSL</h2>
              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Kelola data personel GSL
              </p>
            </div>
          </div>

          {canManage && (
            <button
              onClick={openCreate}
              title="Tambah Petugas"
              className={`group flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-semibold shadow-[0_10px_25px_rgba(124,58,237,.35)] hover:scale-105 transition-all duration-300 shrink-0 ${showAddBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}`}
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

        <div
          ref={calendarCardRef}
          className="mt-6 w-full max-w-sm bg-white rounded-2xl md:rounded-[28px] shadow-[0_15px_40px_rgba(0,0,0,.08)] px-4 md:px-5 py-4 md:py-5 flex flex-wrap gap-3 justify-between items-center"
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
            className={`group flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-semibold shadow-[0_10px_25px_rgba(124,58,237,.35)] hover:scale-105 transition-all duration-300 shrink-0 ${showCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}`}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showCalendar && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
            onClick={() => setShowCalendar(false)}
          >
            <div
              className="bg-transparent w-full max-w-lg max-h-[95vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCalendar(false)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white shadow-md text-gray-500 hover:bg-red-500 hover:text-white duration-300 flex items-center justify-center"
              >
                <FiX size={16} />
              </button>

              <MonitoringCalendar
                selectedDate={selectedDate}
                onChange={(date) => setSelectedDate(date)}
              />
            </div>
          </div>
        )}

        {/* MODAL CREATE/EDIT */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-[999] p-2 sm:p-4 md:p-6"
            onClick={() => setShowForm(false)}
          >
            <div
              className="w-full max-w-xl bg-white/90 backdrop-blur-2xl rounded-2xl md:rounded-[32px] shadow-2xl border border-white/50 p-4 sm:p-6 md:p-8 max-h-[95vh] overflow-y-auto relative animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isEdit ? 'bg-yellow-100 text-yellow-600' : 'bg-purple-100 text-purple-600'}`}
                  >
                    {isEdit ? <FiEdit2 size={18} /> : <FiUserPlus size={18} />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 truncate">
                      {isEdit ? 'Edit Petugas' : 'Tambah Petugas'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Kelola data personel GSL</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowForm(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition flex items-center justify-center self-end sm:self-auto shrink-0"
                >
                  <FiX size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Nama Petugas</label>
                  <input
                    type="text"
                    name="nameOfficer"
                    value={formData.nameOfficer}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full px-4 md:px-5 py-3 md:py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Jenis Kelamin</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-2 w-full px-4 md:px-5 py-3 md:py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Role/Jabatan</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Contoh: GSL Staff, GSL Supervisor"
                    className="mt-2 w-full px-4 md:px-5 py-3 md:py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {!isEdit && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Status Awal</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-2 w-full px-4 md:px-5 py-3 md:py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition w-full sm:w-auto"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg transition flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {isEdit ? (
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

        {/* MODAL UPDATE STATUS */}
        {showStatusForm && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-[999] p-2 sm:p-4 md:p-6 overflow-y-auto"
            onClick={() => setShowStatusForm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 backdrop-blur-3xl rounded-2xl md:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,.2)] w-full max-w-md max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-10"
            >
              <div className="flex justify-between items-start gap-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Ubah Status Petugas</h2>
                <button
                  onClick={() => setShowStatusForm(false)}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-red-500 hover:text-white text-2xl duration-300 shrink-0"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleStatusSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Pilih Status</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowStatusForm(false)}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 duration-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:scale-105 duration-300"
                  >
                    Simpan Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* ================= TABEL PETUGAS ================= */}
      <section className="p-3 md:p-4 mt-8 md:mt-12">
        <input
          type="text"
          placeholder="🔍 Cari nama, role..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full mb-4 px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
        />

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md -mx-3 px-3 md:mx-0 md:px-0">
          <table className="min-w-[800px] w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  No
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Nama Petugas
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Gender
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Role
                </th>
                <th className="px-4 md:px-6 py-3 text-center text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 md:px-6 py-3 text-center text-xs md:text-sm font-semibold text-gray-700 uppercase whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginated.length > 0 ? (
                paginated.map((o, index) => (
                  <tr key={o.id} className="hover:bg-gray-100/50 transition">
                    <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm font-semibold text-purple-600 whitespace-nowrap">
                      {o.nameOfficer}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">
                      {o.gender || '-'}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap">{o.role || '-'}</td>
                    <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full border font-semibold text-sm ${statusStyle[o.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        {o.status || '-'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        {canManage && (
                          <button
                            onClick={() => openStatusUpdate(o)}
                            title="Ubah Status"
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition shadow-sm hover:scale-105"
                          >
                            <FiRefreshCw size={16} />
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => openEdit(o)}
                            title="Ubah Data"
                            className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg transition shadow-sm hover:scale-105"
                          >
                            <FiEdit2 size={16} />
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => handleDelete(o.id)}
                            title="Hapus"
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition shadow-sm hover:scale-105"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data petugas ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[...Array(pageCount)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1.5 rounded text-sm ${
                  currentPage === i + 1
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
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
