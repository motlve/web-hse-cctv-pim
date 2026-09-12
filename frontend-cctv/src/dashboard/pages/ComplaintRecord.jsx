import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { appleSwal } from '../utils/appleSwal';
import MonitoringCalendar from '../components/Calander';
import CostumeDatePicker from '../components/CostumeDatePicker';
import {
  FiPlus,
  FiEdit2,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiTag,
  FiAlertCircle,
  FiMessageSquare,
  FiClipboard,
  FiCalendar,
  FiX,
} from 'react-icons/fi';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

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

const STATUS_OPTIONS = ['Open', 'In Progress', 'Solved', 'Closed'];

export default function ComplaintGSL() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [gslOfficers, setGslOfficers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ==============================
  // MONITORING KALENDER
  // ==============================

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showComplaintCalendar, setShowComplaintCalendar] = useState(false);

  // ==============================
  // ROLE-BASED PERMISSION
  // ==============================

  const role = localStorage.getItem('role');

  const complaintPermission = {
    Admin: { create: true, edit: true, followup: true, setStatus: true, view: true },
    'Petugas GSL': { create: true, edit: true, followup: false, setStatus: false, view: true },
    'Petugas CCTV': { create: false, edit: false, followup: true, setStatus: false, view: true },
    'Manager HSE': { create: false, edit: false, followup: false, setStatus: true, view: true },
    'Petugas HSE': { create: false, edit: false, followup: false, setStatus: false, view: true },
    Guest: { create: false, edit: false, followup: false, setStatus: false, view: true },
  };

  const access = complaintPermission[role] || complaintPermission.Guest;

  // ==============================
  // MODAL STATE
  // ==============================

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);

  const [createFormData, setCreateFormData] = useState({
    complaintDate: null,
    reporterName: '',
    gslOfficerId: '',
    incidentDate: null,
    detailLocation: '',
    complaintDescription: '',
    dateTimeReported: null,
    categoryId: '',
    month: '',
  });

  const [followupFormData, setFollowupFormData] = useState({
    chronology: '',
    dateTimeFollowedUp: null,
    notes: '',
  });

  const [statusFormData, setStatusFormData] = useState({ status: '' });

  const [showEditForm, setShowEditForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    complaintDate: null,
    reporterName: '',
    gslOfficerId: '',
    incidentDate: null,
    detailLocation: '',
    complaintDescription: '',
    dateTimeReported: null,
    categoryId: '',
    month: '',
  });

  // ==============================
  // RESPONSIVE HEADER + CALENDAR CARD
  // ==============================

  const complaintHeaderCardRef = useRef(null);
  const [showAddComplaintBtnText, setShowAddComplaintBtnText] = useState(true);

  const complaintCalendarCardRef = useRef(null);
  const [showComplaintCalendarText, setShowComplaintCalendarText] = useState(true);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === complaintHeaderCardRef.current) {
          setShowAddComplaintBtnText(width > 260);
        }
        if (entry.target === complaintCalendarCardRef.current) {
          setShowComplaintCalendarText(width > 260);
        }
      }
    });

    if (complaintHeaderCardRef.current) observer.observe(complaintHeaderCardRef.current);
    if (complaintCalendarCardRef.current) observer.observe(complaintCalendarCardRef.current);

    return () => observer.disconnect();
  }, []);

  // ==============================
  // FETCH DATA
  // ==============================

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get('/complaints', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComplaints(res.data || []);
    } catch (err) {
      console.error('Fetch complaints error:', err.response?.data || err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get('/complaint-categories', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch categories error:', err.response?.data || err.message);
    }
  };

  const fetchGSLOfficers = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get('/gsl-officer', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGslOfficers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Fetch GSL officers error:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchCategories();
    fetchGSLOfficers();
  }, []);

  // ==============================
  // HELPERS — STAGE & STATUS BADGE
  // ==============================

  const getStage = (c) => {
    if (!c.chronology) return 'Menunggu Followup';
    if (!c.status) return 'Menunggu Status';
    return c.status;
  };

  const stageStyle = {
    'Menunggu Followup': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Menunggu Status': 'bg-blue-100 text-blue-700 border-blue-200',
    Open: 'bg-orange-100 text-orange-700 border-orange-200',
    'In Progress': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Solved: 'bg-green-100 text-green-700 border-green-200',
    Closed: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  // ==============================
  // KPI + CHART DATA
  // ==============================

  const totalComplaints = complaints.length;

  // Bucket tiap komplain lewat getStage() (satu-satunya sumber kebenaran yang
  // juga dipakai buat badge status di tabel), supaya donut chart "Status
  // Penanganan Komplain" selalu exhaustive dan totalnya konsisten dengan
  // "Total Komplain". Sebelumnya donut cuma punya 3 bucket (Menunggu Followup,
  // Menunggu Status, Selesai) padahal STATUS_OPTIONS ada 4 nilai (termasuk
  // 'Open' dan 'In Progress') — komplain dengan status itu jadi hilang diam-diam
  // dari chart walau tetap terhitung di "Total Komplain".
  const STAGE_ORDER = ['Menunggu Followup', 'Menunggu Status', 'Open', 'In Progress', 'Solved', 'Closed'];
  const STAGE_COLORS = {
    'Menunggu Followup': { bg: '#facc15', border: '#eab308' },
    'Menunggu Status': { bg: '#3b82f6', border: '#2563eb' },
    Open: { bg: '#fb923c', border: '#ea580c' },
    'In Progress': { bg: '#6366f1', border: '#4f46e5' },
    Solved: { bg: '#22c55e', border: '#16a34a' },
    Closed: { bg: '#9ca3af', border: '#6b7280' },
  };

  const stageCounts = {};
  STAGE_ORDER.forEach((stage) => {
    stageCounts[stage] = 0;
  });

  // Komplain dengan status di luar STAGE_ORDER (mis. data lama sebelum
  // STATUS_OPTIONS ini dipakai) dihitung terpisah, bukan diam-diam di-skip.
  let unmatchedStatusCount = 0;

  complaints.forEach((c) => {
    const stage = getStage(c);
    if (Object.prototype.hasOwnProperty.call(stageCounts, stage)) {
      stageCounts[stage]++;
    } else {
      unmatchedStatusCount++;
    }
  });

  const pendingFollowup = stageCounts['Menunggu Followup'];
  const pendingStatus = stageCounts['Menunggu Status'];
  const solved = stageCounts['Solved'] + stageCounts['Closed'];

  const visibleStages = STAGE_ORDER.filter((stage) => stageCounts[stage] > 0);

  const statusChartData = {
    labels: visibleStages,
    datasets: [
      {
        data: visibleStages.map((stage) => stageCounts[stage]),
        backgroundColor: visibleStages.map((stage) => STAGE_COLORS[stage].bg),
        borderColor: visibleStages.map((stage) => STAGE_COLORS[stage].border),
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const categoryMap = {};
  complaints.forEach((c) => {
    const name = c.category?.name || 'Tanpa Kategori';
    categoryMap[name] = (categoryMap[name] || 0) + 1;
  });

  const categoryChartData = {
    labels: Object.keys(categoryMap),
    datasets: [
      {
        label: 'Jumlah Komplain',
        data: Object.values(categoryMap),
        backgroundColor: '#8b5cf6',
        borderRadius: 10,
        barThickness: 32,
      },
    ],
  };

  // ==============================
  // HELPER FORMAT DATETIME
  // (samain pola dengan ListTroubleCamera.jsx: validasi
  // null/empty/'0001-01-01T00:00:00Z' sebelum di-toISOString,
  // biar Date invalid dari CostumeDatePicker tidak lolos ke backend)
  // ==============================

  const formatDateTime = (value) => {
    if (!value || value === '' || value === '0001-01-01T00:00:00Z') {
      return null;
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  };

  // ==============================
  // FILTER + SEARCH + PAGINATION
  // ==============================

  const filtered = complaints.filter((c) => {
    const matchSearch =
      `${c.reporterName} ${c.gslOfficer?.nameOfficer || ''} ${c.detailLocation} ${c.complaintDescription}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchMonth = filterMonth ? c.month === filterMonth : true;
    const matchCategory = filterCategory ? String(c.categoryId) === filterCategory : true;
    const matchStatus = filterStatus ? getStage(c) === filterStatus : true;

    return matchSearch && matchMonth && matchCategory && matchStatus;
  });

  const pageCount = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ==============================
  // CREATE COMPLAINT (Petugas GSL)
  // ==============================

  const handleCreateChange = (e) => {
    setCreateFormData({ ...createFormData, [e.target.name]: e.target.value });
  };

  const handleCreateDateChange = (field) => (date) => {
    setCreateFormData((prev) => ({ ...prev, [field]: date }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (
      !createFormData.complaintDate ||
      !createFormData.incidentDate ||
      !createFormData.dateTimeReported
    ) {
      appleSwal({
        icon: 'warning',
        title: 'Tanggal belum lengkap',
        text: 'Tanggal Komplain, Tanggal Kejadian, dan Date/Time Reported wajib diisi',
        confirmButtonColor: '#7c3aed',
      });
      return;
    }

    const token = localStorage.getItem('token');

    try {
      await api.post(
        '/complaints',
        {
          complaintDate: formatDateTime(createFormData.complaintDate),
          reporterName: createFormData.reporterName,
          gslOfficerId: Number(createFormData.gslOfficerId),
          incidentDate: formatDateTime(createFormData.incidentDate),
          detailLocation: createFormData.detailLocation,
          complaintDescription: createFormData.complaintDescription,
          dateTimeReported: formatDateTime(createFormData.dateTimeReported),
          categoryId: Number(createFormData.categoryId),
          month: createFormData.month,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await appleSwal({
        icon: 'success',
        title: 'Berhasil',
        text: 'Komplain berhasil dicatat',
        timer: 2000,
        showConfirmButton: false,
      });

      setShowCreateForm(false);
      setCreateFormData({
        complaintDate: null,
        reporterName: '',
        gslOfficerId: '',
        incidentDate: null,
        detailLocation: '',
        complaintDescription: '',
        dateTimeReported: null,
        categoryId: '',
        month: '',
      });
      fetchComplaints();
    } catch (err) {
      appleSwal({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data || 'Gagal menyimpan komplain',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // ==============================
  // EDIT COMPLAINT (Petugas GSL — sebelum di-followup)
  // ==============================

  const openEdit = (c) => {
    setEditId(c.id);
    setEditFormData({
      complaintDate: c.complaintDate ? new Date(c.complaintDate) : null,
      reporterName: c.reporterName || '',
      gslOfficerId: c.gslOfficerId || '',
      incidentDate: c.incidentDate ? new Date(c.incidentDate) : null,
      detailLocation: c.detailLocation || '',
      complaintDescription: c.complaintDescription || '',
      dateTimeReported: c.dateTimeReported ? new Date(c.dateTimeReported) : null,
      categoryId: c.categoryId || '',
      month: c.month || '',
    });
    setShowEditForm(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditDateChange = (field) => (date) => {
    setEditFormData((prev) => ({ ...prev, [field]: date }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.complaintDate || !editFormData.incidentDate || !editFormData.dateTimeReported) {
      appleSwal({
        icon: 'warning',
        title: 'Tanggal belum lengkap',
        text: 'Tanggal Komplain, Tanggal Kejadian, dan Date/Time Reported wajib diisi',
        confirmButtonColor: '#7c3aed',
      });
      return;
    }

    const token = localStorage.getItem('token');

    try {
      await api.put(
        `/complaints/${editId}`,
        {
          complaintDate: formatDateTime(editFormData.complaintDate),
          reporterName: editFormData.reporterName,
          gslOfficerId: Number(editFormData.gslOfficerId),
          incidentDate: formatDateTime(editFormData.incidentDate),
          detailLocation: editFormData.detailLocation,
          complaintDescription: editFormData.complaintDescription,
          dateTimeReported: formatDateTime(editFormData.dateTimeReported),
          categoryId: Number(editFormData.categoryId),
          month: editFormData.month,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await appleSwal({
        icon: 'success',
        title: 'Berhasil',
        text: 'Komplain berhasil diupdate',
        timer: 2000,
        showConfirmButton: false,
      });

      setShowEditForm(false);
      fetchComplaints();
    } catch (err) {
      appleSwal({
        icon: 'error',
        title: 'Gagal Update',
        text: err.response?.data || 'Gagal mengupdate komplain',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // ==============================
  // FOLLOWUP (Petugas CCTV)
  // ==============================

  const openFollowup = (complaint) => {
    setActiveComplaint(complaint);
    setFollowupFormData({ chronology: '', dateTimeFollowedUp: null, notes: '' });
    setShowFollowupForm(true);
  };

  const handleFollowupDateChange = (date) => {
    setFollowupFormData((prev) => ({ ...prev, dateTimeFollowedUp: date }));
  };

  const handleFollowupSubmit = async (e) => {
    e.preventDefault();

    if (!followupFormData.dateTimeFollowedUp) {
      appleSwal({
        icon: 'warning',
        title: 'Tanggal belum diisi',
        text: 'Date/Time Followed Up wajib diisi',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const token = localStorage.getItem('token');

    try {
      await api.patch(
        `/complaints/${activeComplaint.id}/followup`,
        {
          chronology: followupFormData.chronology,
          dateTimeFollowedUp: formatDateTime(followupFormData.dateTimeFollowedUp),
          notes: followupFormData.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await appleSwal({
        icon: 'success',
        title: 'Berhasil',
        text: 'Follow up berhasil disimpan',
        timer: 2000,
        showConfirmButton: false,
      });

      setShowFollowupForm(false);
      fetchComplaints();
    } catch (err) {
      appleSwal({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data || 'Gagal menyimpan follow up',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // ==============================
  // SET STATUS (Manager HSE)
  // ==============================

  const openStatus = (complaint) => {
    setActiveComplaint(complaint);
    setStatusFormData({ status: complaint.status || '' });
    setShowStatusForm(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    try {
      await api.patch(
        `/complaints/${activeComplaint.id}/status`,
        { status: statusFormData.status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await appleSwal({
        icon: 'success',
        title: 'Berhasil',
        text: 'Status berhasil diupdate',
        timer: 2000,
        showConfirmButton: false,
      });

      setShowStatusForm(false);
      fetchComplaints();
    } catch (err) {
      appleSwal({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data || 'Gagal update status',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  return (
    <>
      <Layout>
      {/* ================= KPI + CHART ================= */}
      <section className="p-6 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 p-5">
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
              Total Komplain
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
              {totalComplaints}
            </h3>
          </div>
          <div className="bg-yellow-50/60 rounded-2xl shadow-lg border border-yellow-100 p-5">
            <p className="text-yellow-700 text-[11px] font-semibold uppercase tracking-wide">
              Menunggu Followup
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-yellow-600 mt-2 tabular-nums">
              {pendingFollowup}
            </h3>
          </div>
          <div className="bg-blue-50/60 rounded-2xl shadow-lg border border-blue-100 p-5">
            <p className="text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
              Menunggu Status
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mt-2 tabular-nums">
              {pendingStatus}
            </h3>
          </div>
          <div className="bg-green-50/60 rounded-2xl shadow-lg border border-green-100 p-5">
            <p className="text-green-700 text-[11px] font-semibold uppercase tracking-wide">
              Selesai
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-green-600 mt-2 tabular-nums">
              {solved}
            </h3>
          </div>
        </div>

        {unmatchedStatusCount > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-amber-800">
            <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
            <p className="text-xs sm:text-sm leading-snug">
              <b>{unmatchedStatusCount}</b> komplain punya status yang tidak dikenali sistem
              (di luar {STATUS_OPTIONS.join(', ')}) dan tidak muncul di breakdown chart di bawah.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Status Penanganan Komplain</h3>
            <div className="h-[280px] flex justify-center">
              <Doughnut
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
                }}
              />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Komplain per Kategori</h3>
            <div className="h-[280px]">
              <Bar
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Complaint Management ===================== */}
      <section className="p-3 md:p-6">
        {/* HEADER CARD */}
        <div
          ref={complaintHeaderCardRef}
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
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <FiClipboard size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 truncate">Komplain GSL</h2>
              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Pelaporan &amp; tindak lanjut komplain
              </p>
            </div>
          </div>

          {/* BUTTON TAMBAH */}
          {access.create && (
            <button
              onClick={() => setShowCreateForm(true)}
              title="Tambah Komplain"
              className={`
                group
                flex
                items-center
                justify-center
                gap-2
                rounded-full
                bg-gradient-to-br
                from-purple-500
                to-indigo-600
                text-white
                text-xs
                font-semibold
                shadow-[0_10px_25px_rgba(124,58,237,.35)]
                hover:scale-105
                transition-all
                duration-300
                shrink-0
                ${showAddComplaintBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
              `}
            >
              <FiPlus size={20} className="shrink-0" />

              {showAddComplaintBtnText && (
                <span className="whitespace-nowrap">
                  Tambah
                  <br />
                  Komplain
                </span>
              )}
            </button>
          )}
        </div>

        {/* MONITORING CALENDAR */}
        <div
          ref={complaintCalendarCardRef}
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
            onClick={() => setShowComplaintCalendar(true)}
            title="Buka Kalender"
            className={`
              group
              flex
              items-center
              justify-center
              gap-2
              rounded-full
              bg-gradient-to-br
              from-purple-500
              to-indigo-600
              text-white
              text-xs
              font-semibold
              shadow-[0_10px_25px_rgba(124,58,237,.35)]
              hover:scale-105
              transition-all
              duration-300
              shrink-0
              ${showComplaintCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
            `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showComplaintCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showComplaintCalendar && (
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
            onClick={() => setShowComplaintCalendar(false)}
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
                onClick={() => setShowComplaintCalendar(false)}
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

        {/* ================= MODAL: CREATE (Petugas GSL) ================= */}
        {showCreateForm && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-[999] p-2 sm:p-4 md:p-6 overflow-y-auto"
            onClick={() => setShowCreateForm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 backdrop-blur-3xl rounded-2xl md:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,.2)] w-full max-w-3xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-10"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <p className="uppercase tracking-[5px] text-purple-600 text-xs font-semibold">
                    KOMPLAIN GSL
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-3 flex items-center gap-3">
                    <FiPlus className="text-purple-600" />
                    Tambah Komplain
                  </h2>
                  <p className="text-gray-500 mt-2">Catat laporan komplain baru dari pengunjung</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-red-500 hover:text-white text-2xl duration-300 flex items-center justify-center shrink-0"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold">Tanggal Komplain</label>
                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={createFormData.complaintDate}
                      placeholder="Pilih Tanggal Komplain"
                      onChange={handleCreateDateChange('complaintDate')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Nama Pelapor</label>
                  <input
                    type="text"
                    name="reporterName"
                    value={createFormData.reporterName}
                    onChange={handleCreateChange}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Petugas GSL</label>
                  <select
                    name="gslOfficerId"
                    value={createFormData.gslOfficerId}
                    onChange={handleCreateChange}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Pilih Petugas GSL</option>
                    {gslOfficers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nameOfficer}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Tanggal Kejadian</label>
                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={createFormData.incidentDate}
                      placeholder="Pilih Tanggal Kejadian"
                      onChange={handleCreateDateChange('incidentDate')}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">Lokasi Detail Kejadian</label>
                  <input
                    type="text"
                    name="detailLocation"
                    value={createFormData.detailLocation}
                    onChange={handleCreateChange}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">Deskripsi Komplain</label>
                  <textarea
                    name="complaintDescription"
                    value={createFormData.complaintDescription}
                    onChange={handleCreateChange}
                    rows="3"
                    required
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Date/Time Reported</label>
                  <div className="mt-2">
                    <CostumeDatePicker
                      selectedDate={createFormData.dateTimeReported}
                      placeholder="Pilih Date/Time Reported"
                      onChange={handleCreateDateChange('dateTimeReported')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Kategori</label>
                  <select
                    name="categoryId"
                    value={createFormData.categoryId}
                    onChange={handleCreateChange}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Bulan</label>
                  <select
                    name="month"
                    value={createFormData.month}
                    onChange={handleCreateChange}
                    required
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 duration-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:scale-105 duration-300"
                  >
                    Simpan Komplain
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* ===================== Complaint Table (Main Table) ===================== */}
      <section className="p-4 mt-12">
        {/* Search + Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <FiSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari pelapor, petugas, lokasi..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            />
          </div>

          <select
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md shadow-sm"
          >
            <option value="">Semua Bulan</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md shadow-sm"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md shadow-sm"
          >
            <option value="">Semua Tahap</option>
            <option value="Menunggu Followup">Menunggu Followup</option>
            <option value="Menunggu Status">Menunggu Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* TABEL */}
        <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-[900px] divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Tanggal Komplain
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Pelapor
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Petugas GSL
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Lokasi
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Tahap
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginated.length > 0 ? (
                paginated.map((c, index) => {
                  const stage = getStage(c);

                  return (
                    <tr key={c.id} className="hover:bg-gray-100/50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {c.complaintDate
                          ? new Date(c.complaintDate).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-purple-600">
                        {c.reporterName || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {c.gslOfficer?.nameOfficer || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{c.category?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{c.detailLocation || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-full border font-semibold text-sm ${stageStyle[stage] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                        >
                          {stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        <div className="flex justify-center items-center gap-2">
                          {access.edit && !c.chronology && (
                            <button
                              onClick={() => openEdit(c)}
                              title="Edit Komplain"
                              className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg transition shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                            >
                              <FiEdit2 size={17} />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActiveComplaint(c);
                              setShowDetail(true);
                            }}
                            title="Lihat Detail"
                            className="bg-slate-500 hover:bg-slate-600 text-white p-2 rounded-lg transition shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-300"
                          >
                            <FiEye size={17} />
                          </button>

                          {access.followup && !c.chronology && (
                            <button
                              onClick={() => openFollowup(c)}
                              title="Isi Follow Up"
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                              <FiMessageSquare size={17} />
                            </button>
                          )}

                          {access.setStatus && c.chronology && !c.status && (
                            <button
                              onClick={() => openStatus(c)}
                              title="Set Status"
                              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300"
                            >
                              <FiCheckCircle size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data komplain ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pageCount > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Menampilkan {paginated.length} dari {filtered.length} data komplain
            </p>
            <div className="space-x-2 flex items-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >
                <FiChevronLeft size={14} /> Sebelumnya
              </button>
              <span className="text-sm text-gray-700">
                Halaman {currentPage} dari {pageCount}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >
                Berikutnya <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
      </Layout>

      {/* ================= MODAL: EDIT (Petugas GSL) ================= */}
      {showEditForm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-[999] p-2 sm:p-4 md:p-6 overflow-y-auto"
          onClick={() => setShowEditForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 backdrop-blur-3xl rounded-2xl md:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,.2)] w-full max-w-3xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-10"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <p className="uppercase tracking-[5px] text-orange-600 text-xs font-semibold">
                  KOMPLAIN GSL
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-3 flex items-center gap-3">
                  <FiEdit2 className="text-orange-600" />
                  Edit Komplain
                </h2>
                <p className="text-gray-500 mt-2">Perbarui data komplain sebelum di-followup CCTV</p>
              </div>
              <button
                onClick={() => setShowEditForm(false)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-red-500 hover:text-white text-2xl duration-300 flex items-center justify-center shrink-0"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold">Tanggal Komplain</label>
                <div className="mt-2">
                  <CostumeDatePicker
                    selectedDate={editFormData.complaintDate}
                    placeholder="Pilih Tanggal Komplain"
                    onChange={handleEditDateChange('complaintDate')}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Nama Pelapor</label>
                <input
                  type="text"
                  name="reporterName"
                  value={editFormData.reporterName}
                  onChange={handleEditChange}
                  required
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Petugas GSL</label>
                <select
                  name="gslOfficerId"
                  value={editFormData.gslOfficerId}
                  onChange={handleEditChange}
                  required
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">Pilih Petugas GSL</option>
                  {gslOfficers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nameOfficer}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Tanggal Kejadian</label>
                <div className="mt-2">
                  <CostumeDatePicker
                    selectedDate={editFormData.incidentDate}
                    placeholder="Pilih Tanggal Kejadian"
                    onChange={handleEditDateChange('incidentDate')}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Lokasi Detail Kejadian</label>
                <input
                  type="text"
                  name="detailLocation"
                  value={editFormData.detailLocation}
                  onChange={handleEditChange}
                  required
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">Deskripsi Komplain</label>
                <textarea
                  name="complaintDescription"
                  value={editFormData.complaintDescription}
                  onChange={handleEditChange}
                  rows="3"
                  required
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Date/Time Reported</label>
                <div className="mt-2">
                  <CostumeDatePicker
                    selectedDate={editFormData.dateTimeReported}
                    placeholder="Pilih Date/Time Reported"
                    onChange={handleEditDateChange('dateTimeReported')}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Kategori</label>
                <select
                  name="categoryId"
                  value={editFormData.categoryId}
                  onChange={handleEditChange}
                  required
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Bulan</label>
                <select
                  name="month"
                  value={editFormData.month}
                  onChange={handleEditChange}
                  required
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">Pilih Bulan</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 duration-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30 hover:scale-105 duration-300"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: FOLLOWUP (Petugas CCTV) ================= */}
      {showFollowupForm && activeComplaint && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-[999] p-2 sm:p-4 md:p-6 overflow-y-auto"
          onClick={() => setShowFollowupForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 backdrop-blur-3xl rounded-2xl md:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,.2)] w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-10"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <p className="uppercase tracking-[5px] text-blue-600 text-xs font-semibold">
                  FOLLOW UP CCTV
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-3">
                  🎥 Isi Kronologi
                </h2>
                <p className="text-gray-500 mt-2">Komplain dari {activeComplaint.reporterName}</p>
              </div>
              <button
                onClick={() => setShowFollowupForm(false)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-red-500 hover:text-white text-2xl duration-300 flex items-center justify-center shrink-0"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFollowupSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-semibold">Kronologi</label>
                <textarea
                  value={followupFormData.chronology}
                  onChange={(e) =>
                    setFollowupFormData({ ...followupFormData, chronology: e.target.value })
                  }
                  rows="4"
                  required
                  placeholder="Hasil pengecekan rekaman CCTV / kronologi kejadian"
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Date/Time Followed Up</label>
                <div className="mt-2">
                  <CostumeDatePicker
                    selectedDate={followupFormData.dateTimeFollowedUp}
                    placeholder="Pilih Date/Time Followed Up"
                    onChange={handleFollowupDateChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Keterangan (opsional)</label>
                <textarea
                  value={followupFormData.notes}
                  onChange={(e) =>
                    setFollowupFormData({ ...followupFormData, notes: e.target.value })
                  }
                  rows="2"
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFollowupForm(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 duration-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:scale-105 duration-300"
                >
                  Simpan Follow Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SET STATUS (Manager HSE) ================= */}
      {showStatusForm && activeComplaint && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-[999] p-2 sm:p-4 md:p-6 overflow-y-auto"
          onClick={() => setShowStatusForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 backdrop-blur-3xl rounded-2xl md:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,.2)] w-full max-w-lg max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-10"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <p className="uppercase tracking-[5px] text-green-600 text-xs font-semibold">
                  FINALISASI HSE
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-3">✅ Set Status</h2>
                <p className="text-gray-500 mt-2">Komplain dari {activeComplaint.reporterName}</p>
              </div>
              <button
                onClick={() => setShowStatusForm(false)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-red-500 hover:text-white text-2xl duration-300 flex items-center justify-center shrink-0"
              >
                ×
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-5 text-sm text-slate-600 space-y-1">
              <p>
                <b>Kronologi:</b> {activeComplaint.chronology}
              </p>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-semibold">Status</label>
                <select
                  value={statusFormData.status}
                  onChange={(e) => setStatusFormData({ status: e.target.value })}
                  required
                  className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-green-500 outline-none"
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
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg shadow-green-500/30 hover:scale-105 duration-300"
                >
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETAIL (semua role, read-only) ================= */}
      {showDetail && activeComplaint && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center z-[999] p-2 sm:p-4 md:p-6 overflow-y-auto"
          onClick={() => setShowDetail(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 backdrop-blur-3xl rounded-2xl md:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,.2)] w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-10"
          >
            <div className="flex justify-between items-start gap-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Detail Komplain</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-red-500 hover:text-white text-2xl duration-300 flex items-center justify-center shrink-0"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p>
                <FiUser className="inline mr-2 text-purple-500" />
                <b>Pelapor:</b> {activeComplaint.reporterName}
              </p>
              <p>
                <FiUser className="inline mr-2 text-purple-500" />
                <b>Petugas GSL:</b> {activeComplaint.gslOfficer?.nameOfficer || '-'}
              </p>
              <p>
                <FiTag className="inline mr-2 text-purple-500" />
                <b>Kategori:</b> {activeComplaint.category?.name || '-'}
              </p>
              <p>
                <FiAlertCircle className="inline mr-2 text-purple-500" />
                <b>Lokasi:</b> {activeComplaint.detailLocation}
              </p>
              <p>
                <b>Deskripsi:</b> {activeComplaint.complaintDescription}
              </p>
              <hr />
              <p>
                <b>Kronologi:</b> {activeComplaint.chronology || 'Belum diisi'}
              </p>
              <p>
                <b>Keterangan CCTV:</b> {activeComplaint.notes || '-'}
              </p>
              <hr />
              <p>
                <b>Status:</b> {activeComplaint.status || 'Belum ditentukan'}
              </p>
              <p>
                <FiClock className="inline mr-2 text-purple-500" />
                <b>Total Response:</b> {activeComplaint.totalResponse || '-'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
