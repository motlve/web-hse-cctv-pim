import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import API_BASE_URL from '../api/axios';

import {
  FaHome,
  FaWpforms,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaVideo,
  FaChartLine,
  FaMapMarkedAlt,
  FaUserTie,
  FaUserCog,
  FaTags,
  FaExclamationTriangle,
  FaClipboardCheck,
  FaCamera,
  FaClock,
  FaCameraRetro,
  FaCogs,
} from 'react-icons/fa';

import Logo from '../assets/images/logo.png';

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isDashboardActive = [
    '/id-cctv',
    '/data-lokasi',
    '/kategori',
    '/petugas',

    // hanya Admin yang punya User
    ...(role === 'Admin' ? ['/user'] : []),
  ].some((path) => location.pathname.startsWith(path));

  const isFormActive = ['/incident-record', '/summary-request-camera', '/list-camera-trouble'].some(
    (path) => location.pathname.startsWith(path)
  );

  useEffect(() => {
    setDashboardOpen(isDashboardActive);

    setFormOpen(isFormActive);

    if (
      location.pathname.startsWith('/camera-occupancy') ||
      location.pathname.startsWith('/recording-duration') ||
      location.pathname.startsWith('/service-performance')
    ) {
      setPerformanceOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Keluar?',
      text: 'Apakah Anda yakin ingin keluar dari sistem?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token');

    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await Swal.fire({
        title: 'Berhasil Keluar',
        text: 'Anda telah keluar dari sistem.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.log(err);

      Swal.fire({
        title: 'Gagal Keluar',
        text: 'Terjadi kesalahan saat logout.',
        icon: 'error',
      });
    } finally {
      localStorage.clear();
      navigate('/dashboard/login');
    }
  };

  // ===============================
  // ROLE PERMISSION
  // ===============================

  const isAdmin = role === 'Admin';

  const canViewUser = isAdmin;

  return (
    <div
      className="
      h-full
      w-full
      flex
      flex-col
      px-3
      sm:px-4
      py-4
      sm:py-5
      overflow-hidden
      bg-white
      border-r
      border-slate-100
      "
    >
      {/* HEADER MOBILE */}
      <div
        className="
        flex
        justify-between
        items-center
        mb-6
        pb-5
        border-b
        border-slate-100
        lg:hidden
        shrink-0
        "
      >
        <img src={Logo} alt="Logo" className="w-28 sm:w-36 object-contain" />

        <button
          onClick={onClose}
          aria-label="Tutup menu"
          className="
          p-2
          rounded-lg
          text-slate-400
          hover:text-slate-600
          hover:bg-slate-50
          transition-colors
          shrink-0
          "
        >
          <FaTimes size={16} />
        </button>
      </div>

      {/* LOGO DESKTOP */}
      <div
        className="
        hidden
        lg:flex
        justify-center
        mb-8
        pb-6
        border-b
        border-slate-100
        shrink-0
        "
      >
        <img src={Logo} alt="Logo" className="w-32 xl:w-36 object-contain" />
      </div>

      <nav
        className="
        flex-1
        min-h-0
        overflow-y-auto
        overflow-x-hidden
        space-y-1
        pr-1
        scrollbar-thin
        "
      >
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-400 mb-2">
          Menu Utama
        </p>

        {/* DASHBOARD */}
        <MenuButton
          icon={<FaHome size={15} />}
          title="Dashboard"
          active={isDashboardActive}
          open={dashboardOpen}
          onClick={() => setDashboardOpen(!dashboardOpen)}
        />

        {dashboardOpen && (
          <div className="ml-3 pl-3 border-l border-slate-100 space-y-0.5 py-1">
            <SidebarLink
              to="/dashboard/id-cctv"
              label="ID CCTV"
              icon={<FaVideo size={13} />}
              active={isActive('/id-cctv')}
            />

            <SidebarLink
              to="/dashboard/petugas"
              label="Petugas CCTV"
              icon={<FaUserTie size={13} />}
              active={isActive('/petugas')}
            />

            {canViewUser && (
              <SidebarLink
                to="/dashboard/user"
                label="User"
                icon={<FaUserCog size={13} />}
                active={isActive('/user')}
              />
            )}

            <SidebarLink
              to="/dashboard/data-lokasi"
              label="Data Lokasi"
              icon={<FaMapMarkedAlt size={13} />}
              active={isActive('/data-lokasi')}
            />

            <SidebarLink
              to="/dashboard/kategori"
              label="Kategori"
              icon={<FaTags size={13} />}
              active={isActive('/kategori')}
            />
          </div>
        )}

        <div className="pt-2" />

        {/* FORMULIR */}
        <MenuButton
          icon={<FaWpforms size={15} />}
          title="Formulir"
          active={isFormActive}
          open={formOpen}
          onClick={() => setFormOpen(!formOpen)}
        />

        {formOpen && (
          <div className="ml-3 pl-3 border-l border-slate-100 space-y-0.5 py-1">
            <SidebarLink
              to="/dashboard/list-camera-trouble"
              label="Gangguan Kamera"
              icon={<FaExclamationTriangle size={13} />}
              active={isActive('/list-camera-trouble')}
            />

            <SidebarLink
              to="/dashboard/incident-record"
              label="Catatan Insiden"
              icon={<FaClipboardCheck size={13} />}
              active={isActive('/incident-record')}
            />

            <MenuButton
              icon={<FaChartLine size={14} />}
              title="Performa CCTV"
              active={
                location.pathname.includes('camera-occupancy') ||
                location.pathname.includes('recording-duration') ||
                location.pathname.includes('service-performance')
              }
              open={performanceOpen}
              onClick={() => setPerformanceOpen(!performanceOpen)}
              nested
            />

            {performanceOpen && (
              <div className="ml-3 pl-3 border-l border-slate-100 space-y-0.5 py-1">
                <SidebarLink
                  to="/dashboard/camera-occupancy"
                  label="Okupansi Kamera"
                  icon={<FaCamera size={13} />}
                  active={isActive('/camera-occupancy')}
                />

                <SidebarLink
                  to="/dashboard/recording-duration"
                  label="Durasi Rekaman"
                  icon={<FaClock size={13} />}
                  active={isActive('/recording-duration')}
                />

                <SidebarLink
                  to="/dashboard/service-performance"
                  label="Performa Service"
                  icon={<FaCogs size={13} />}
                  active={isActive('/service-performance')}
                />
              </div>
            )}

            <SidebarLink
              to="/dashboard/summary-request-camera"
              label="Request Kamera"
              icon={<FaCameraRetro size={13} />}
              active={isActive('/summary-request-camera')}
            />
          </div>
        )}
      </nav>

      {/* LOGOUT */}
      <div className="pt-4 mt-2 border-t border-slate-100 shrink-0">
        <button
          onClick={handleLogout}
          className="
          w-full
          flex
          items-center
          gap-3
          px-3
          py-2.5
          rounded-xl
          text-slate-600
          hover:bg-red-50
          hover:text-red-600
          transition-colors
          duration-200
          "
        >
          <span className="w-5 flex items-center justify-center shrink-0 text-red-500">
            <FaSignOutAlt size={14} />
          </span>
          <span className="text-sm font-semibold">Keluar</span>
        </button>
      </div>
    </div>
  );
}

function MenuButton({ icon, title, active, open, onClick, nested = false }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full
        flex
        justify-between
        items-center
        px-3
        ${nested ? 'py-2' : 'py-2.5'}
        rounded-xl
        transition-colors
        duration-200

        ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`
            w-5
            shrink-0
            flex
            items-center
            justify-center
            ${active ? 'text-blue-600' : 'text-slate-400'}
          `}
        >
          {icon}
        </span>

        <span className={`truncate ${nested ? 'text-sm font-medium' : 'text-sm font-semibold'}`}>
          {title}
        </span>
      </div>

      <span className={`shrink-0 ml-2 ${active ? 'text-blue-500' : 'text-slate-300'}`}>
        {open ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
      </span>
    </button>
  );
}

function SidebarLink({ to, label, icon, active }) {
  return (
    <Link
      to={to}
      className={`
        flex
        items-center
        gap-3
        px-3
        py-2
        rounded-lg
        transition-colors
        duration-200

        ${
          active
            ? 'bg-blue-50 text-blue-600 font-semibold'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }
      `}
    >
      <span
        className={`w-5 shrink-0 flex items-center justify-center ${active ? 'text-blue-500' : 'text-slate-400'}`}
      >
        {icon}
      </span>

      <span className="text-sm whitespace-nowrap truncate">{label}</span>
    </Link>
  );
}
