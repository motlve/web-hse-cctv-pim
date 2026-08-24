import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';

import MonitoringCalendar from '../components/Calander';
import api from '../api/axios';
import { FiEdit2, FiTrash2, FiUsers, FiPlus, FiCalendar, FiX } from 'react-icons/fi';
import { BarChart3, Activity } from 'lucide-react';

import { appleSwal } from '../utils/appleSwal';
// sesuaikan path relatif dengan lokasi file ini

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

export default function UserManagement() {
  const [userList, setUserList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const userHeaderCardRef = useRef(null);
  const userCalendarCardRef = useRef(null);
  const [showAddUserBtnText, setShowAddUserBtnText] = useState(true);
  const [showUserCalendarText, setShowUserCalendarText] = useState(true);
  const [showUserCalendar, setShowUserCalendar] = useState(false);

  const role = localStorage.getItem('role');

  const canManageUser = role === 'Admin';

  // modal + edit state
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    role: '',
    password: '',
  });

  // ===============================
  // DONUT CENTER TEXT PLUGIN
  // ===============================

  const centerTextPlugin = {
    id: 'centerText',

    beforeDraw(chart) {
      const { width, height, ctx } = chart;

      ctx.save();

      ctx.font = 'bold 28px Arial';

      ctx.textAlign = 'center';

      ctx.textBaseline = 'middle';

      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

      ctx.fillText(total, width / 2, height / 2);

      ctx.restore();
    },
  };

  // REGISTER CHART

  ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    centerTextPlugin
  );

  // ================= FETCH USER =================
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get('/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUserList(res.data);
    } catch (err) {
      console.error('Fetch user error:', err.response?.data || err.message);
      alert('Gagal load user');
    }
  };

  useEffect(() => {
    fetchUsers();

    const interval = setInterval(() => {
      fetchUsers();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ================= RESPONSIVE HEADER & CALENDAR BUTTON =================
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === userHeaderCardRef.current) {
          setShowAddUserBtnText(width > 260);
        }
        if (entry.target === userCalendarCardRef.current) {
          setShowUserCalendarText(width > 260);
        }
      }
    });

    if (userHeaderCardRef.current) observer.observe(userHeaderCardRef.current);
    if (userCalendarCardRef.current) observer.observe(userCalendarCardRef.current);

    return () => observer.disconnect();
  }, []);

  // ================= HANDLE FORM =================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ================= OPEN EDIT USER =================

  const openEdit = (user) => {
    console.log('USER EDIT:', user);

    setFormData({
      username: user.username || '',
      fullname: user.fullname || '',
      email: user.email || '',
      role: user.role || '',
      password: '',
    });

    setEditId(user.ID);

    setIsEdit(true);

    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    try {
      if (isEdit) {
        await api.put(
          `/user/${editId}`,
          {
            fullname: formData.fullname,
            email: formData.email,
            role: formData.role,
            password: formData.password,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await appleSwal({
          icon: 'success',
          title: 'Berhasil',
          text: 'User berhasil diupdate',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        const res = await api.post(
          `/user`,
          {
            fullname: formData.fullname,
            email: formData.email,
            role: formData.role,
            password: formData.password,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        await appleSwal({
          icon: 'success',
          title: 'User Berhasil Dibuat',
          html: `
          <div style="text-align:left">
            <p><b>Username:</b> ${res.data.username}</p>
          </div>
        `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#2563eb',
        });
      }

      await fetchUsers();

      setShowForm(false);

      setFormData({
        username: '',
        fullname: '',
        email: '',
        role: '',
        password: '',
      });
    } catch (error) {
      console.log(error.response?.data);

      appleSwal({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: error.response?.data?.message || error.response?.data || 'Gagal menyimpan user',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // ================= DELETE USER =================

  const handleDelete = async (id) => {
    const confirmDelete = await appleSwal({
      title: 'Hapus User?',
      text: 'Yakin ingin menghapus user ini?',
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

      await api.delete(`/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await appleSwal({
        icon: 'success',
        title: 'Berhasil',
        text: 'User berhasil dihapus',
        timer: 2000,
        showConfirmButton: false,
      });

      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error.response?.data || error.message);

      appleSwal({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: error.response?.data?.message || 'Gagal menghapus user',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  // ================= FILTER & PAGINATION =================
  const filtered = userList.filter((u) =>
    `${u.username} ${u.fullname} ${u.role} ${u.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filtered.length / itemsPerPage);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ================= USER ANALYTICS =================

  const userAnalytics = {
    total: userList.length,

    active: userList.filter((u) => u.is_online === true).length,

    inactive: userList.filter((u) => u.is_online !== true).length,

    emailRegistered: userList.filter((u) => u.email).length,

    roleDistribution: ['Admin', 'Manager HSE', 'Petugas CCTV', 'Petugas HSE', 'Guest'].map(
      (role) => ({
        role,
        total: userList.filter((u) => u.role === role).length,
      })
    ),
  };

  // DONUT ACTIVE USER

  const userStatusChart = {
    labels: ['Online User', 'Offline User'],

    datasets: [
      {
        data: [userAnalytics.active, userAnalytics.inactive],
        backgroundColor: ['#22c55e', '#e5e7eb'],
        borderColor: ['#16a34a', '#d1d5db'],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  // ROLE BAR

  const userRoleChart = {
    labels: userAnalytics.roleDistribution.map((item) => item.role),

    datasets: [
      {
        label: 'Jumlah User',
        data: userAnalytics.roleDistribution.map((item) => item.total),
        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#6b7280'],
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 35,
      },
    ],
  };

  return (
    <Layout>
      {/* ================= USER ANALYTICS CHART ================= */}

      <section className="p-4 grid grid-cols-2 gap-6">
        {/* ROLE DISTRIBUTION */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <BarChart3 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Distribusi Hak Akses Pengguna</h3>
              <p className="text-sm text-gray-500">Jumlah pengguna berdasarkan peran</p>
            </div>
          </div>

          <div className="h-[300px]">
            <Bar
              data={userRoleChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </div>

        {/* ACTIVE USER */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
              <Activity size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Status Aktivitas Pengguna</h3>
              <p className="text-sm text-gray-500">Perbandingan pengguna aktif dan tidak aktif</p>
            </div>
          </div>

          <div className="h-[300px] flex justify-center">
            <Doughnut
              data={userStatusChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true },
                  },
                },
              }}
            />
          </div>
        </div>
      </section>

      {/* =====================================
    Section - Manajemen Pengguna
===================================== */}

      <section className="p-3 md:p-6">
        {/* HEADER CARD */}

        <div
          ref={userHeaderCardRef}
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
              <h2 className="text-sm font-bold text-slate-800 truncate">Manajemen Pengguna</h2>

              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Kelola akun pengguna & hak akses
              </p>
            </div>
          </div>

          {/* BUTTON TAMBAH */}

          {canManageUser && (
            <button
              onClick={() => {
                setShowForm(true);
                setIsEdit(false);
                setEditId(null);
                setFormData({
                  username: '',
                  fullname: '',
                  email: '',
                  role: '',
                  password: '',
                });
              }}
              title="Tambah Pengguna"
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
                ${showAddUserBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
              `}
            >
              <FiPlus size={20} className="shrink-0" />

              {showAddUserBtnText && (
                <span className="whitespace-nowrap">
                  Tambah
                  <br />
                  Pengguna
                </span>
              )}
            </button>
          )}
        </div>

        {/* MONITORING CALENDAR */}

        <div
          ref={userCalendarCardRef}
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
            onClick={() => setShowUserCalendar(true)}
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
              ${showUserCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
            `}
          >
            <FiCalendar size={18} className="shrink-0" />
            {showUserCalendarText && <span className="whitespace-nowrap">Buka</span>}
          </button>
        </div>

        {showUserCalendar && (
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
            onClick={() => setShowUserCalendar(false)}
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
                onClick={() => setShowUserCalendar(false)}
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

        {/* ================= MODAL FORM PENGGUNA ================= */}

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
                max-w-3xl
                max-h-[90vh]
                overflow-y-auto
                p-10
              "
            >
              {/* HEADER */}

              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="uppercase tracking-[5px] text-blue-600 text-xs font-semibold">
                    MANAJEMEN PENGGUNA
                  </p>

                  <h2 className="text-3xl font-bold text-gray-800 mt-3">
                    {isEdit ? '✏️ Edit Pengguna' : '👤 Tambah Pengguna Baru'}
                  </h2>

                  <p className="text-gray-500 mt-2">Membuat akun dan mengatur hak akses sistem</p>
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

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* USERNAME */}

                <div>
                  <label className="text-sm font-semibold">Username Otomatis</label>

                  <input
                    disabled
                    value={formData.username || 'Dibuat Otomatis'}
                    className="w-full mt-2 px-4 py-3 rounded-2xl border bg-gray-100 text-gray-500"
                  />
                </div>

                {/* FULLNAME */}

                <div>
                  <label className="text-sm font-semibold">Nama Lengkap</label>

                  <input
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="text-sm font-semibold">Email</label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Masukkan email pengguna"
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* PASSWORD */}

                {!isEdit && (
                  <div>
                    <label className="text-sm font-semibold">Kata Sandi</label>

                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Masukkan kata sandi"
                      className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}

                {/* ROLE */}

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">Hak Akses Role</label>

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full mt-2 px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Pilih Role</option>
                    <option>Admin</option>
                    <option>Manager HSE</option>
                    <option>Petugas CCTV</option>
                    <option>Petugas HSE</option>
                    <option>Guest</option>
                  </select>
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
                    {isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* =====================================
    Section - User Management Table
===================================== */}

      <section className="p-4 mt-12">
        {/* SEARCH */}

        <input
          type="text"
          placeholder="🔍 Search username, fullname, email, role..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="
    w-full
    mb-4
    px-4
    py-2
    border
    rounded-md
    focus:ring-2
    focus:ring-blue-400
    outline-none
    "
        />

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
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Username</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Fullname</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold uppercase">Aksi</th>
              </tr>
            </thead>

            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginated.length > 0 ? (
                paginated.map((u, index) => (
                  <tr key={u.ID} className="hover:bg-gray-100/50 transition">
                    <td className="px-6 py-4 text-sm">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                      {u.username || '-'}
                    </td>

                    <td className="px-6 py-4 text-sm">{u.fullname || '-'}</td>

                    <td className="px-6 py-4 text-sm">{u.email || '-'}</td>

                    <td className="px-6 py-4">
                      {(() => {
                        const style = {
                          Admin: 'bg-red-100 text-red-700 border-red-200',
                          'Manager HSE': 'bg-yellow-100 text-yellow-700 border-yellow-200',
                          'Petugas CCTV': 'bg-blue-100 text-blue-700 border-blue-200',
                          'Petugas HSE': 'bg-green-100 text-green-700 border-green-200',
                          Guest: 'bg-gray-100 text-gray-700 border-gray-300',
                        };

                        const icon = {
                          Admin: '👑',
                          'Manager HSE': '🦺',
                          'Petugas CCTV': '📹',
                          'Petugas HSE': '🛡️',
                          Guest: '👤',
                        };

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
${style[u.role] || 'bg-gray-100 text-gray-600 border-gray-200'}
`}
                          >
                            {icon[u.role] || '❓'}
                            {u.role}
                          </span>
                        );
                      })()}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`
px-4
py-2
rounded-full
font-semibold
${u.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
`}
                      >
                        {u.is_online ? '🟢 Online' : '⚪ Offline'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
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

                        <button
                          onClick={() => handleDelete(u.ID)}
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data user ditemukan
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
              Displaying {paginated.length} of {filtered.length} user data
            </p>

            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-gray-200"
              >
                ⬅️ Previous
              </button>

              <span>
                Page {currentPage} of {pageCount}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="px-3 py-1 rounded-md bg-gray-200"
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
