import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Swiper, SwiperSlide } from 'swiper/react';
import { appleSwal } from '../utils/appleSwal';
// sesuaikan path relatif dengan lokasi file ini
import api from '../api/axios';
import MonitoringCalendar from '../components/Calander';
import { FiEdit2, FiTrash2, FiCalendar, FiPlus, FiX } from 'react-icons/fi';
import { PieChart, RefreshCw, TrendingDown, Trophy, MapPin } from 'lucide-react';

import 'swiper/css';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DataLokasi() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null); // store id of category being edited
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '' });
  const [lokasiList, setLokasiList] = useState([]);
  const [incidentList, setIncidentList] = useState([]); // NEW: State to store incident data
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const lokasiHeaderCardRef = useRef(null);
  const lokasiCalendarCardRef = useRef(null);
  const [showAddLokasiBtnText, setShowAddLokasiBtnText] = useState(true);
  const [showLokasiCalendarText, setShowLokasiCalendarText] = useState(true);
  const [showLokasiCalendar, setShowLokasiCalendar] = useState(false);

  const role = localStorage.getItem('role');

  // FULL CRUD
  const canManage = role === 'Admin' || role === 'Manager HSE' || role === 'Petugas HSE';

  // Warna berbeda untuk tiap lokasi
  const pieColors = [
    // Renamed from barColors for clarity
    'rgba(59, 130, 246, 0.7)', // Blue
    'rgba(234, 88, 12, 0.7)', // Orange
    'rgba(16, 185, 129, 0.7)', // Emerald
    'rgba(234, 179, 8, 0.7)', // Yellow
    'rgba(147, 51, 234, 0.7)', // Purple
    'rgba(239, 68, 68, 0.7)', // Red
    'rgba(14, 165, 233, 0.7)', // Sky
    'rgba(132, 204, 22, 0.7)', // Lime
    'rgba(219, 39, 119, 0.7)', // Rose
    'rgba(6, 182, 212, 0.7)', // Cyan
  ];

  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // --- Function to Fetch Location Data ---
  const fetchLocation = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await api.get('/location', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Location Response:', response.data);

      const data = response.data.data || response.data || [];

      setLokasiList(
        data.map((item) => ({
          id: item.id ?? item.ID,
          name: item.name,
        }))
      );
    } catch (error) {
      console.error('Error fetching locations:', error);

      if (error.response?.status === 401) {
        console.error('Unauthorized: Token tidak valid atau kadaluarsa.');

        alert('Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.');

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        window.location.href = '/login';

        return;
      }

      alert('Gagal mengambil data lokasi: ' + error.message);
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

      console.log('Incident Response:', response.data);

      const data = response.data.data || response.data || [];

      setIncidentList(data);
    } catch (error) {
      console.error('Error fetching incidents for chart:', error);

      if (error.response?.status === 401) {
        console.error('Unauthorized: Token tidak valid atau kadaluarsa.');

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        window.location.href = '/login';
      }
    }
  };

  // Fetch both locations and incidents on component mount
  useEffect(() => {
    fetchLocation();
    fetchIncidents();
  }, []);

  // ================= RESPONSIVE HEADER & CALENDAR BUTTON =================
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === lokasiHeaderCardRef.current) {
          setShowAddLokasiBtnText(width > 260);
        }
        if (entry.target === lokasiCalendarCardRef.current) {
          setShowLokasiCalendarText(width > 260);
        }
      }
    });

    if (lokasiHeaderCardRef.current) observer.observe(lokasiHeaderCardRef.current);
    if (lokasiCalendarCardRef.current) observer.observe(lokasiCalendarCardRef.current);

    return () => observer.disconnect();
  }, []);

  const getChartData = () => {
    const locationCounts = {};

    // Buat jumlah awal semua lokasi = 0
    lokasiList.forEach((loc) => {
      locationCounts[loc.name] = 0;
    });

    // Hitung jumlah insiden tiap lokasi
    incidentList.forEach((incident) => {
      const locationName = incident.location || incident.Location;

      if (locationName && Object.prototype.hasOwnProperty.call(locationCounts, locationName)) {
        locationCounts[locationName]++;
      }
    });

    // Ubah object menjadi array lalu urutkan terbesar ke terkecil
    const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]); // DESC

    const labels = sortedLocations.map((item) => item[0]);
    const data = sortedLocations.map((item) => item[1]);

    const colorsForChart = labels.map((_, i) => pieColors[i % pieColors.length]);

    return {
      labels,
      datasets: [
        {
          label: 'Jumlah Insiden',
          data,
          backgroundColor: colorsForChart,
          borderColor: '#fff',
          borderWidth: 1,
        },
      ],
    };
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 12,
        padding: 12,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
    },
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      appleSwal({
        icon: 'warning',
        title: 'Data belum lengkap',
        text: 'Nama Lokasi tidak boleh kosong.',
        confirmButtonColor: '#2563eb',
      });

      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (isEditing) {
        await api.put(
          `/location/${editId}`,
          {
            name: formData.name.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await api.post(
          `/location`,
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

      await fetchLocation();
      await fetchIncidents();

      appleSwal({
        icon: 'success',
        title: isEditing ? 'Lokasi diperbarui' : 'Lokasi ditambahkan',
        text: isEditing ? 'Data lokasi berhasil diperbarui.' : 'Lokasi baru berhasil ditambahkan.',
        timer: 1800,
        showConfirmButton: false,
      });

      setFormData({ name: '' });

      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
    } catch (err) {
      console.error('Gagal menyimpan lokasi:', err.response?.data || err.message);

      appleSwal({
        icon: 'error',
        title: 'Gagal menyimpan data',
        text: err.response?.data?.message || err.message,
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleEdit = (lokasi) => {
    setFormData({ name: lokasi.name });
    setShowForm(true);
    setIsEditing(true);
    setEditId(lokasi.id);
  };

  const handleDelete = async (id, name) => {
    console.log('DELETE LOCATION ID:', id);
    console.log('DELETE LOCATION NAME:', name);

    const result = await appleSwal({
      title: 'Hapus Lokasi?',

      html: `
      <div style="text-align:left">
        <p><b>Lokasi:</b> ${name}</p>
        <br/>
        <span>Data lokasi akan dihapus permanen dari sistem.</span>
      </div>
    `,

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Ya, Hapus',

      cancelButtonText: 'Batal',

      confirmButtonColor: '#dc2626',

      cancelButtonColor: '#6b7280',

      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await api.delete(`/location/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchLocation();
      await fetchIncidents();

      appleSwal({
        icon: 'success',
        title: 'Lokasi berhasil dihapus',
        text: `${name} sudah dihapus dari sistem.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Gagal menghapus lokasi:', err.response?.data || err.message);

      appleSwal({
        icon: 'error',
        title: 'Gagal menghapus lokasi',
        text: err.response?.data?.message || err.message,
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // Filter and paginate locations
  const filteredList = lokasiList.filter((item) =>
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

  const chartData = getChartData(); // Call getChartData here to ensure it uses updated state

  return (
    <Layout>
      {/* Section 0 - Grafik */}
      <section className="p-6 w-full max-w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* CHART */}
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-gray-100 h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                  <PieChart size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Grafik Insiden Berdasarkan Lokasi
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Distribusi jumlah insiden berdasarkan lokasi kamera CCTV
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <RefreshCw
                  size={14}
                  strokeWidth={2.5}
                  className="animate-spin [animation-duration:3s]"
                />
                Data Realtime
              </div>
            </div>

            <div className="h-[380px] flex items-center justify-center">
              {lokasiList.length > 0 && incidentList.length > 0 ? (
                <Pie data={chartData} options={chartOptions} />
              ) : (
                <div className="text-center">
                  <div className="flex justify-center mb-3 text-gray-300">
                    <TrendingDown size={56} strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-500">Belum tersedia data lokasi atau insiden.</p>
                </div>
              )}
            </div>
          </div>

          {/* TOP LOCATION */}
          <div className="h-[500px]">
            <div
              className="
        h-full
        bg-white/80
        backdrop-blur-xl
        rounded-3xl
        shadow-xl
        border border-gray-100
        p-5
        overflow-hidden
        "
            >
              <div className="flex items-center justify-center gap-2 mb-5">
                <Trophy size={20} className="text-amber-500" strokeWidth={2.2} />
                <h3
                  className="
          text-center
          text-xl
          font-bold
          "
                >
                  Lokasi Dengan Insiden Tertinggi
                </h3>
              </div>

              <Swiper
                direction="vertical"
                slidesPerView={1}
                spaceBetween={15}
                loop={chartData.labels.length > 1}
                className="h-[390px] w-full"
                allowTouchMove={true}
              >
                {chartData.labels.map((location, index) => {
                  const incidentCount = chartData.datasets[0].data[index];

                  const maxCase = Math.max(...chartData.datasets[0].data);

                  const percentage = maxCase > 0 ? (incidentCount / maxCase) * 100 : 0;

                  const color = chartData.datasets[0].backgroundColor[index];

                  return (
                    <SwiperSlide key={location}>
                      <div
                        onClick={() => {
                          setSelectedLocation({
                            name: location,
                            rank: index + 1,
                            incidents: incidentCount,
                            percentage: Number(percentage.toFixed(1)),
                            color,
                          });
                        }}
                        className="
                  h-[350px]
                  w-full
                  rounded-3xl
                  bg-gradient-to-br
                  from-white
                  to-blue-50
                  shadow-lg
                  border border-gray-100
                  p-5
                  cursor-pointer
                  hover:scale-[1.03]
                  hover:shadow-xl
                  transition-all
                  duration-300
                  select-none
                  "
                      >
                        {/* HEADER */}

                        <div>
                          <div
                            className="
                      flex
                      justify-between
                      items-center
                      "
                          >
                            <span
                              className={`
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-bold
                        flex
                        items-center
                        gap-1
                        ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}
                        `}
                            >
                              {index === 0 && <Trophy size={14} strokeWidth={2.5} />}
                              Peringkat #{index + 1}
                            </span>

                            <div className="p-2 rounded-full bg-blue-50 text-blue-500">
                              <MapPin size={20} strokeWidth={2.2} />
                            </div>
                          </div>

                          <h2
                            className="
                      mt-8
                      text-xl
                      font-bold
                      text-gray-800
                      truncate
                      "
                          >
                            {location}
                          </h2>

                          <p className="text-sm text-gray-500">Lokasi CCTV</p>
                        </div>

                        {/* STAT */}

                        <div className="mt-6">
                          <p
                            className="
                      text-gray-500
                      text-sm
                      "
                          >
                            Total Insiden
                          </p>

                          <h1
                            className="
                      text-5xl
                      font-bold
                      text-blue-600
                      "
                          >
                            {incidentCount}
                          </h1>

                          {/* PROGRESS */}

                          <div
                            className="
                      mt-6
                      h-3
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

                          <p
                            className="
                      text-xs
                      text-gray-400
                      text-center
                      mt-5
                      "
                          >
                            Klik untuk melihat detail lokasi
                          </p>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Tambah Lokasi ===================== */}

      <section className="p-3 md:p-6">
        {/* HEADER CARD */}

        <div
          ref={lokasiHeaderCardRef}
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
              <MapPin size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800 truncate">Manajemen Lokasi</h2>

              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Kelola lokasi CCTV & area pemantauan
              </p>
            </div>
          </div>

          {/* BUTTON TAMBAH */}

          {canManage && (
            <button
              onClick={() => {
                setShowForm(true);
                setIsEditing(false);
                setEditId(null);

                setFormData({
                  name: '',
                });
              }}
              title="Tambah Lokasi"
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
                ${showAddLokasiBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
              `}
            >
              <FiPlus size={20} className="shrink-0" />

              {showAddLokasiBtnText && (
                <span className="whitespace-nowrap">
                  Tambah
                  <br />
                  Lokasi
                </span>
              )}
            </button>
          )}
        </div>

        {/* MONITORING CALENDAR */}

        <div
          ref={lokasiCalendarCardRef}
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
            onClick={() => setShowLokasiCalendar(true)}
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
              ${showLokasiCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
            `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showLokasiCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showLokasiCalendar && (
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
            onClick={() => setShowLokasiCalendar(false)}
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
                onClick={() => setShowLokasiCalendar(false)}
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
                    MANAJEMEN LOKASI
                  </p>

                  <h2
                    className="
text-3xl
font-bold
text-gray-800
mt-3
"
                  >
                    {isEditing ? '✏️ Edit Lokasi' : '➕ Tambah Lokasi'}
                  </h2>

                  <p
                    className="
text-gray-500
mt-2
"
                  >
                    Tambahkan lokasi pemantauan CCTV ke dalam sistem
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
space-y-6
"
              >
                <div>
                  <label
                    className="
text-sm
font-semibold
text-gray-700
"
                  >
                    Nama Lokasi
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh : PIM 1"
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
"
                    required
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
                    {isEditing ? 'Simpan Perubahan' : 'Tambah Lokasi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= DETAIL LOKASI ================= */}

        {selectedLocation && (
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
            onClick={() => setSelectedLocation(null)}
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
p-10
"
            >
              <div
                className="
flex
justify-between
items-start
mb-8
"
              >
                <div className="flex items-center gap-5">
                  <div
                    className="
w-14
h-14
rounded-3xl
shadow
"
                    style={{
                      backgroundColor: selectedLocation.color,
                    }}
                  />

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
                      DETAIL LOKASI
                    </p>

                    <h2
                      className="
text-3xl
font-bold
mt-2
"
                    >
                      📍 {selectedLocation.name}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLocation(null)}
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

              <div
                className="
grid
md:grid-cols-3
gap-5
"
              >
                <div className="bg-blue-50 rounded-3xl p-6">
                  <p className="text-gray-500">Peringkat</p>

                  <h3 className="text-4xl font-bold text-blue-600">#{selectedLocation.rank}</h3>
                </div>

                <div className="bg-red-50 rounded-3xl p-6">
                  <p className="text-gray-500">Total Insiden</p>

                  <h3 className="text-4xl font-bold text-red-600">{selectedLocation.incidents}</h3>
                </div>

                <div className="bg-green-50 rounded-3xl p-6">
                  <p className="text-gray-500">Persentase</p>

                  <h3 className="text-4xl font-bold text-green-600">
                    {selectedLocation.percentage}%
                  </h3>
                </div>
              </div>

              <div
                className="
mt-8
bg-gray-50
rounded-3xl
p-6
"
              >
                <h3
                  className="
font-bold
text-xl
"
                >
                  Informasi
                </h3>

                <p
                  className="
text-gray-600
mt-3
text-lg
"
                >
                  Lokasi <b>{selectedLocation.name}</b> memiliki
                  <b> {selectedLocation.incidents}</b> insiden dan berada pada peringkat{' '}
                  <b>#{selectedLocation.rank}</b>.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section 3 - Tabel */}
      <section className="p-4 max-w-6xl mx-auto">
        <input
          type="text"
          placeholder="🔍 Cari nama lokasi..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Nama Lokasi
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedList.length > 0 ? (
                paginatedList.map((lokasi, index) => (
                  <tr key={lokasi.id} className="hover:bg-gray-100/50 transition">
                    <td
                      className="
px-6
py-4
whitespace-nowrap
text-sm
text-gray-900
"
                    >
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td
                      className="
px-6
py-4
whitespace-nowrap
text-sm
text-gray-900
"
                    >
                      {lokasi.name}
                    </td>

                    {/* ACTION */}

                    <td
                      className="
    px-6
    py-4
    text-center
  "
                    >
                      {canManage && (
                        <div
                          className="
        flex
        justify-center
        gap-2
      "
                        >
                          {/* EDIT */}

                          <button
                            onClick={() => handleEdit(lokasi)}
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
                            onClick={() => {
                              console.log('LOKASI DI BUTTON:', lokasi);

                              console.log('ID YANG DIKIRIM:', lokasi.id);

                              handleDelete(lokasi.id, lokasi.name);
                            }}
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
                  <td
                    colSpan={3}
                    className="
px-6
py-4
text-center
text-gray-500
"
                  >
                    Tidak ada lokasi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Menampilkan {paginatedList.length} dari {filteredList.length} lokasi
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
