import { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '../components/Layout';
import { Pie } from 'react-chartjs-2';
import Swal from 'sweetalert2';

import MonitoringCalendar from '../components/Calander';
import { FiEdit2, FiTrash2, FiPlus, FiCalendar, FiX } from 'react-icons/fi';
import { BarChart3, TrendingUp, ClipboardList, X } from 'lucide-react';

import { Plus, Pencil, PlusCircle, Tag } from 'lucide-react';

import api from '../api/axios';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import {
  FaClipboardList,
  FaExclamationTriangle,
  FaMosque,
  FaTools,
  FaStore,
  FaBoxOpen,
  FaCarCrash,
  FaHardHat,
  FaTrashAlt,
  FaBuilding,
  FaArrowsAltV,
  FaMoneyBillWave,
  FaCoins,
  FaHandHoldingUsd,
} from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DataKategori() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null); // store id of category being edited
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '' });
  const [kategoriList, setKategoriList] = useState([]);
  const [incidentList, setIncidentList] = useState([]); // State to store incident data
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const kategoriHeaderCardRef = useRef(null);
  const kategoriCalendarCardRef = useRef(null);
  const [showAddKategoriBtnText, setShowAddKategoriBtnText] = useState(true);
  const [showKategoriCalendarText, setShowKategoriCalendarText] = useState(true);
  const [showKategoriCalendar, setShowKategoriCalendar] = useState(false);

  const role = localStorage.getItem('role');

  // FULL CRUD
  const canManage = role === 'Admin' || role === 'Manager HSE' || role === 'Petugas HSE';

  // Warna berbeda untuk tiap kategori
  const pieColors = [
    '#2563EB', // Biru
    '#DC2626', // Merah
    '#16A34A', // Hijau
    '#F59E0B', // Orange
    '#9333EA', // Ungu
    '#0891B2', // Cyan
    '#DB2777', // Pink
    '#65A30D', // Lime
    '#EA580C', // Dark Orange
    '#4F46E5', // Indigo
  ];
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // --- Function to Fetch Category Data ---
  const fetchCategory = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await api.get('/category', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Categories:', response.data);

      const data = response.data.data || response.data || [];

      setKategoriList(data);
    } catch (error) {
      console.error('Error fetching categories:', error);

      if (error.response?.status === 401) {
        alert('Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.');

        localStorage.removeItem('token');
        window.location.href = '/dashboard/login';
        return;
      }

      alert('Gagal mengambil data kategori: ' + error.message);
    }
  };

  // --- Function to Fetch Incident Data ---
  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('Token tidak ditemukan untuk insiden.');
        return;
      }

      const response = await api.get('/incident', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Incidents:', response.data);

      const data = response.data.data || response.data || [];

      setIncidentList(data);
    } catch (error) {
      console.error('Error fetching incidents for chart:', error);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/dashboard/login';
      }
    }
  };

  // Fetch both categories and incidents on component mount
  useEffect(() => {
    fetchCategory();
    fetchIncidents();
  }, []);

  // ================= RESPONSIVE HEADER & CALENDAR BUTTON =================
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === kategoriHeaderCardRef.current) {
          setShowAddKategoriBtnText(width > 260);
        }
        if (entry.target === kategoriCalendarCardRef.current) {
          setShowKategoriCalendarText(width > 260);
        }
      }
    });

    if (kategoriHeaderCardRef.current) observer.observe(kategoriHeaderCardRef.current);
    if (kategoriCalendarCardRef.current) observer.observe(kategoriCalendarCardRef.current);

    return () => observer.disconnect();
  }, []);

  const getCategoryIcon = (category) => {
    const name = category.toLowerCase();

    if (name.includes('lain')) {
      return <FaClipboardList />;
    }

    if (
      name.includes('perilaku') ||
      name.includes('mencurigakan') ||
      name.includes('membahayakan')
    ) {
      return <FaExclamationTriangle />;
    }

    if (name.includes('mushola')) {
      return <FaMosque />;
    }

    if (name.includes('operasional') || name.includes('utilitas') || name.includes('peralatan')) {
      return <FaTools />;
    }

    if (name.includes('tenant')) {
      return <FaStore />;
    }

    if (name.includes('publik')) {
      return <FaBoxOpen />;
    }

    if (name.includes('kendaraan')) {
      return <FaCarCrash />;
    }

    if (name.includes('kecelakaan kerja')) {
      return <FaHardHat />;
    }

    if (name.includes('tipping')) {
      return <FaMoneyBillWave />;
    }

    return <FaArrowsAltV />;
  };

  const categoryStats = useMemo(() => {
    const categoryMap = {};

    kategoriList.forEach((cat, index) => {
      const categoryName = cat.name || cat.name_category;

      categoryMap[categoryName] = {
        id: cat.ID || cat.id,

        name: categoryName,

        total: 0,

        color: pieColors[index % pieColors.length],

        description: cat.description || '-',
      };
    });

    incidentList.forEach((incident) => {
      const categoryName = incident.category || incident.Category;

      if (categoryMap[categoryName]) {
        categoryMap[categoryName].total++;
      }
    });

    return Object.values(categoryMap)

      .sort((a, b) => b.total - a.total)

      .map((item, index) => ({
        ...item,

        rank: index + 1,
      }));
  }, [kategoriList, incidentList, pieColors]);

  const getChartData = useMemo(() => {
    return {
      labels: categoryStats.map((item) => item.name),

      datasets: [
        {
          label: 'Jumlah Insiden',

          data: categoryStats.map((item) => item.total),

          backgroundColor: categoryStats.map((item) => item.color),

          borderColor: categoryStats.map((item) => item.color),

          borderWidth: 2,

          borderRadius: 5,
        },
      ],
    };
  }, [categoryStats]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ================================
  // SUBMIT CATEGORY
  // ================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ================================
    // VALIDASI INPUT
    // ================================

    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nama kategori kosong',
        text: 'Nama kategori wajib diisi.',
        confirmButtonColor: '#2563eb',
      });

      return;
    }

    // ================================
    // KONFIRMASI SIMPAN
    // ================================

    const result = await Swal.fire({
      title: isEditing ? 'Update kategori?' : 'Tambah kategori?',

      text: isEditing ? 'Data kategori akan diperbarui.' : 'Data kategori baru akan disimpan.',

      icon: 'question',

      showCancelButton: true,

      confirmButtonText: isEditing ? 'Ya, Update' : 'Ya, Simpan',

      cancelButtonText: 'Batal',

      confirmButtonColor: '#2563eb',

      cancelButtonColor: '#dc2626',

      reverseButtons: true,
    });

    // ================================
    // JIKA BATAL
    // ================================

    if (result.value !== true) {
      console.log('BATAL SIMPAN');

      return;
    }

    // ================================
    // LOADING
    // ================================

    Swal.fire({
      title: 'Menyimpan data...',

      allowOutsideClick: false,

      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const token = localStorage.getItem('token');

      // ================================
      // UPDATE
      // ================================

      if (isEditing) {
        await api.put(
          `category/${editId}`,

          {
            name: formData.name.trim(),
          },

          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // ================================
      // CREATE
      // ================================
      else {
        await api.post(
          `/category`,

          {
            name: formData.name.trim(),
          },

          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // TUTUP LOADING

      Swal.close();

      // ================================
      // SUCCESS
      // ================================

      await Swal.fire({
        icon: 'success',

        title: isEditing ? 'Kategori diperbarui' : 'Kategori berhasil ditambahkan',

        text: isEditing ? 'Data kategori berhasil diperbarui.' : 'Kategori baru berhasil disimpan.',

        timer: 2000,

        showConfirmButton: false,
      });

      await fetchCategory();

      await fetchIncidents();

      setFormData({
        name: '',
      });

      setShowForm(false);

      setIsEditing(false);

      setEditId(null);
    } catch (err) {
      Swal.close();

      console.error('Gagal menyimpan kategori:', err.response?.data || err.message);

      Swal.fire({
        icon: 'error',

        title: 'Gagal menyimpan',

        text: err.response?.data?.message || err.message || 'Terjadi kesalahan',

        confirmButtonColor: '#dc2626',
      });
    }
  };

  // ================================
  // EDIT CATEGORY
  // ================================

  const handleEdit = (kategori) => {
    setFormData({
      name: kategori.name,
    });

    setShowForm(true);

    setIsEditing(true);

    setEditId(kategori.id);

    Swal.fire({
      icon: 'info',
      title: 'Mode Edit Aktif',
      text: `Mengubah kategori "${kategori.name}"`,
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-3xl',
      },
    });
  };

  // ================================
  // DELETE CATEGORY
  // ================================

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Kategori?',

      text: 'Data kategori akan dihapus permanen dari sistem.',

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Ya, Hapus',

      cancelButtonText: 'Batal',

      confirmButtonColor: '#dc2626',

      cancelButtonColor: '#6b7280',

      customClass: {
        popup: 'rounded-3xl',
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await api.delete(`/category/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchCategory();

      await fetchIncidents();

      Swal.fire({
        icon: 'success',

        title: 'Kategori berhasil dihapus',

        showConfirmButton: false,

        timer: 1800,

        customClass: {
          popup: 'rounded-3xl',
        },
      });
    } catch (err) {
      console.error('Gagal menghapus kategori:', err.response?.data || err.message);

      Swal.fire({
        icon: 'error',

        title: 'Gagal menghapus kategori',

        text: err.response?.data?.message || err.message,

        confirmButtonColor: '#dc2626',
      });
    }
  };

  // Filter and paginate categories
  const filteredList = kategoriList.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredList.length / itemsPerPage);

  // Make sure current page is valid
  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount || 1);
  }, [pageCount, currentPage]);

  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Layout>
      {/* SECTION 0 - DASHBOARD KATEGORI */}
      <section className="p-4 w-full max-w-full mx-auto flex flex-col lg:flex-row gap-6">
        {/* CHART */}
        <div
          className="
      w-full lg:w-3/4
      h-[450px]
      bg-white/20
      backdrop-blur-2xl
      border border-white/30
      rounded-3xl
      shadow-2xl
      p-6
    "
        >
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                <BarChart3 size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Grafik Insiden per Kategori</h2>
                <p className="text-gray-500 text-sm">
                  Distribusi jumlah insiden berdasarkan kategori
                </p>
              </div>
            </div>

            <div
              className="
          px-4 py-2
          rounded-xl
          bg-blue-100
          text-blue-700
          font-semibold
        "
            >
              {kategoriList.length} Kategori
            </div>
          </div>

          <div
            style={{
              height: 'calc(100% - 70px)',
              width: '100%',
            }}
          >
            {kategoriList.length > 0 && incidentList.length > 0 ? (
              <Pie
                data={{
                  labels: getChartData.labels,

                  datasets: [
                    {
                      data: getChartData.datasets[0].data,

                      backgroundColor: getChartData.labels.map(
                        (_, index) => pieColors[index % pieColors.length]
                      ),

                      borderColor: '#ffffff',
                      borderWidth: 4,

                      hoverBackgroundColor: getChartData.labels.map(
                        (_, index) => pieColors[index % pieColors.length]
                      ),

                      hoverOffset: 25,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,

                  plugins: {
                    legend: {
                      display: true,
                      position: 'right',

                      labels: {
                        usePointStyle: true,

                        pointStyle: 'circle',

                        padding: 20,

                        font: {
                          size: 14,
                          weight: '600',
                        },
                      },
                    },

                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);

                          const value = context.raw;

                          const percentage = ((value / total) * 100).toFixed(1);

                          return `${context.label}: ${value} (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Belum ada data kategori atau insiden.</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR RANKING CARD */}
        <div
          className="
    w-full lg:w-[320px]
    h-[450px]
    bg-white/80
    backdrop-blur-xl
    rounded-3xl
    p-5
    shadow-2xl
    border border-white/30
    overflow-y-auto
  "
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={20} className="text-emerald-500" strokeWidth={2.2} />
            <h3 className="text-xl font-bold text-gray-800">Ranking Kategori</h3>
          </div>

          <div className="space-y-4">
            {categoryStats.length > 0 ? (
              categoryStats.map((item, index) => {
                const color = pieColors[index % pieColors.length];

                const percentage = (
                  (item.total / Math.max(...categoryStats.map((x) => x.total))) *
                  100
                ).toFixed(0);

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedCategory({
                        name: item.name,

                        total: item.total,

                        percentage: ((item.total / incidentList.length) * 100).toFixed(1),

                        rank: index + 1,

                        color,
                      });
                    }}
                    className="
              group
              cursor-pointer
              bg-white
              rounded-2xl
              p-4
              shadow-md
              border
              border-gray-100
              hover:-translate-y-1
              hover:shadow-xl
              transition-all
              duration-300
            "
                  >
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                      <div className="flex items-center gap-3">
                        {/* RANK */}
                        <div
                          className="
       w-9
    h-9
    rounded-xl
    flex
    items-center
    justify-center
    text-lg
    shrink-0
  "
                          style={{
                            backgroundColor: `${color}20`,
                            color: color,
                          }}
                        >
                          {getCategoryIcon(item.name)}
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
      font-semibold
      text-gray-800
      text-sm
      leading-tight
      line-clamp-3
    "
                          >
                            {item.name}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">Total Insiden</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <h2
                          className="
      text-xl
      font-bold
      text-gray-900
    "
                        >
                          {item.total}
                        </h2>

                        <p className="text-[11px] text-gray-500">Kasus</p>
                      </div>
                    </div>

                    {/* MINI BAR */}

                    <div
                      className="
              mt-4
              w-full
              h-2
              bg-gray-200
              rounded-full
              overflow-hidden
            "
                    >
                      <div
                        className="
                  h-full
                  rounded-full
                  transition-all
                  duration-700
                "
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>

                    <div
                      className="
              mt-2
              flex
              justify-between
              text-xs
              text-gray-500
            "
                    >
                      <span>Ranking #{index + 1}</span>

                      <span>{percentage}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500">Tidak ada data kategori.</p>
            )}
          </div>
        </div>
        {selectedCategory && (
          <div
            className="
      fixed inset-0
      z-50
      bg-black/40
      backdrop-blur-md
      flex
      items-center
      justify-center
      p-4
    "
            onClick={() => setSelectedCategory(null)}
          >
            <div
              className="
        w-full
        max-w-xl
        bg-white
        rounded-3xl
        shadow-2xl
        p-8
        animate-in
        fade-in
        zoom-in
        duration-300
      "
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                    style={{
                      backgroundColor: `${selectedCategory.color}20`,
                      color: selectedCategory.color,
                    }}
                  >
                    {getCategoryIcon(selectedCategory.name)}
                  </div>

                  <div>
                    <h2
                      className="
              text-2xl
              font-bold
              text-gray-800
            "
                    >
                      {selectedCategory.name}
                    </h2>

                    <p
                      className="
              text-gray-500
              text-sm
            "
                    >
                      Detail Statistik Kategori
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCategory(null)}
                  className="
            p-2
            rounded-full
            text-gray-400
            hover:text-red-500
            hover:bg-red-50
            transition-colors
            duration-200
          "
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>

              {/* STAT CARD */}

              <div
                className="
          grid
          grid-cols-3
          gap-4
          mt-8
        "
              >
                <div
                  className="
            bg-blue-50
            rounded-2xl
            p-5
          "
                >
                  <p className="text-gray-500 text-sm">Ranking</p>

                  <h3
                    className="
            text-4xl
            font-bold
            text-blue-600
          "
                  >
                    #{selectedCategory.rank}
                  </h3>
                </div>

                <div
                  className="
            bg-red-50
            rounded-2xl
            p-5
          "
                >
                  <p className="text-gray-500 text-sm">Total</p>

                  <h3
                    className="
            text-4xl
            font-bold
            text-red-600
          "
                  >
                    {selectedCategory.total}
                  </h3>
                </div>

                <div
                  className="
            bg-green-50
            rounded-2xl
            p-5
          "
                >
                  <p className="text-gray-500 text-sm">Persentase</p>

                  <h3
                    className="
            text-4xl
            font-bold
            text-green-600
          "
                  >
                    {selectedCategory.percentage}%
                  </h3>
                </div>
              </div>

              {/* PROGRESS */}

              <div
                className="
          mt-8
          bg-gray-50
          rounded-2xl
          p-5
        "
              >
                <div
                  className="
          flex
          justify-between
          mb-3
        "
                >
                  <span className="font-semibold">Tingkat Kejadian</span>

                  <span className="font-bold">{selectedCategory.percentage}%</span>
                </div>

                <div
                  className="
            w-full
            h-4
            bg-gray-200
            rounded-full
            overflow-hidden
          "
                >
                  <div
                    className="
              h-full
              rounded-full
              transition-all
              duration-700
            "
                    style={{
                      width: `${selectedCategory.percentage}%`,
                      backgroundColor: selectedCategory.color,
                    }}
                  />
                </div>
              </div>

              {/* INSIGHT CARD */}

              <div
                className="
          mt-5
          rounded-2xl
          p-5
        "
                style={{
                  backgroundColor: `${selectedCategory.color}15`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList size={18} className="text-gray-700" strokeWidth={2.2} />
                  <h3
                    className="
          font-bold
        "
                  >
                    Insight Kategori
                  </h3>
                </div>

                <p
                  className="
          text-gray-600
          leading-relaxed
        "
                >
                  Kategori
                  <b> {selectedCategory.name} </b>
                  memiliki total
                  <b> {selectedCategory.total} kasus </b>
                  dan berada pada ranking
                  <b> #{selectedCategory.rank}</b>
                  dari seluruh kategori insiden.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===================== Category Management ===================== */}

      <section className="p-3 md:p-6">
        {/* HEADER CARD */}

        <div
          ref={kategoriHeaderCardRef}
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
              <Tag size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 truncate">Manajemen Kategori</h2>

              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Kelola kategori & klasifikasi insiden
              </p>
            </div>
          </div>

          {/* BUTTON TAMBAH */}

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setIsEditing(false);
                setFormData({ name: '' });
                setEditId(null);
              }}
              title="Tambah Kategori"
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
                ${showAddKategoriBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
              `}
            >
              <FiPlus size={20} className="shrink-0" />

              {showAddKategoriBtnText && (
                <span className="whitespace-nowrap">
                  Tambah
                  <br />
                  Kategori
                </span>
              )}
            </button>
          )}
        </div>

        {/* MONITORING CALENDAR */}

        <div
          ref={kategoriCalendarCardRef}
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
            onClick={() => setShowKategoriCalendar(true)}
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
              ${showKategoriCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
            `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showKategoriCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showKategoriCalendar && (
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
            onClick={() => setShowKategoriCalendar(false)}
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
                onClick={() => setShowKategoriCalendar(false)}
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
    "
            onClick={() => {
              setShowForm(false);
              setIsEditing(false);
              setFormData({ name: '' });
              setEditId(null);
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
        max-w-xl
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
                    MANAJEMEN KATEGORI
                  </p>

                  <h2
                    className="
              flex
              items-center
              gap-2
              text-3xl
              font-bold
              text-gray-800
              mt-3
            "
                  >
                    {isEditing ? (
                      <>
                        <Pencil size={26} strokeWidth={2.2} className="text-blue-600" />
                        Edit Kategori
                      </>
                    ) : (
                      <>
                        <PlusCircle size={26} strokeWidth={2.2} className="text-blue-600" />
                        Tambah Kategori
                      </>
                    )}
                  </h2>

                  <p
                    className="
              text-gray-500
              mt-2
            "
                  >
                    Kelola kategori klasifikasi insiden
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);

                    setIsEditing(false);

                    setFormData({
                      name: '',
                    });

                    setEditId(null);
                  }}
                  className="
            w-12
            h-12
            flex
            items-center
            justify-center
            rounded-full
            bg-gray-100
            hover:bg-red-500
            hover:text-white
            duration-300
          "
                >
                  <X size={22} strokeWidth={2.5} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="
          space-y-6
        "
              >
                <div>
                  <label
                    htmlFor="name"
                    className="
              text-sm
              font-semibold
              text-gray-700
            "
                  >
                    Nama Kategori
                  </label>

                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: Kehilangan barang tenant"
                    className="
              w-full
              mt-3
              px-5
              py-3
              rounded-2xl
              border
              border-gray-300
              focus:ring-2
              focus:ring-blue-500
              outline-none
              transition
            "
                  />
                </div>

                <div
                  className="
            flex
            justify-end
            gap-3
            mt-8
          "
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);

                      setIsEditing(false);

                      setFormData({
                        name: '',
                      });

                      setEditId(null);
                    }}
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
                    {isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Section 3 - Tabel */}
      <section className="p-4 max-w-6xl mx-auto">
        {' '}
        {/* Removed overflow-x-auto from here */}
        <input
          type="text"
          placeholder="🔍 Cari nama kategori..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-full divide-y divide-gray-300">
            {' '}
            {/* Added min-w-full back */}
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Nama Kategori
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedList.length > 0 ? (
                paginatedList.map((kategori, index) => (
                  <tr key={kategori.id} className="hover:bg-gray-100/50 transition">
                    {/* NO */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    {/* NAMA KATEGORI */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {kategori.name}
                    </td>

                    {/* AKSI */}

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
                      {canManage && (
                        <div className="flex justify-center gap-2">
                          {/* EDIT */}

                          <button
                            onClick={() => handleEdit(kategori)}
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

                          {/* DELETE */}

                          <button
                            onClick={() => handleDelete(kategori.id)}
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
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada kategori ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Menampilkan {paginatedList.length} dari {filteredList.length} kategori
          </p>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
            >
              ⬅️ Sebelumnya
            </button>
            <span className="text-sm text-gray-700">
              Halaman {currentPage} dari {pageCount}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
            >
              Selanjutnya ➡️
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
