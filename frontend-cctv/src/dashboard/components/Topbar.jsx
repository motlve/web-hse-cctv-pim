import { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  FaSearch,
  FaVideo,
  FaMapMarkerAlt,
  FaClipboardList,
  FaExclamationTriangle,
  FaClock,
  FaChartBar,
  FaUsers,
  FaUserCog,
  FaUserCircle,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import { FiWifi } from 'react-icons/fi';

export default function Topbar({ onMenuClick, searchTerm, setSearchTerm }) {
  const location = useLocation();

  const navigate = useNavigate();

  const [user, setUser] = useState({
    fullname: 'Guest',
    role: 'User',
    avatar: null,
  });

  const [isReturningUser, setIsReturningUser] = useState(false);

  const [showResult, setShowResult] = useState(false);

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const searchRef = useRef(null);

  const [showWelcome, setShowWelcome] = useState(false);

  const keyword = searchTerm?.toLowerCase().trim() || '';

  const menuItems = [
    {
      label: 'ID CCTV',
      path: '/id-cctv',
      icon: <FaVideo />,
    },

    {
      label: 'Petugas CCTV',
      path: '/petugas',
      icon: <FaUsers />,
    },

    {
      label: 'User',
      path: '/user',
      icon: <FaUserCog />,
    },

    {
      label: 'Data Lokasi',
      path: '/data-lokasi',
      icon: <FaMapMarkerAlt />,
    },

    {
      label: 'Kategori',
      path: '/kategori',
      icon: <FaClipboardList />,
    },

    {
      label: 'Gangguan Kamera',
      path: '/list-camera-trouble',
      icon: <FaExclamationTriangle />,
    },

    {
      label: 'Catatan Insiden',
      path: '/incident-record',
      icon: <FaClipboardList />,
    },

    {
      label: 'Okupansi Kamera',
      path: '/camera-occupancy',
      icon: <FaVideo />,
    },

    {
      label: 'Durasi Rekaman',
      path: '/recording-duration',
      icon: <FaClock />,
    },

    {
      label: 'Performa Service',
      path: '/service-performance',
      icon: <FaChartBar />,
    },

    {
      label: 'Request Kamera',
      path: '/summary-request-camera',
      icon: <FaVideo />,
    },
  ];

  const filteredMenu = useMemo(() => {
    if (!keyword) {
      return [];
    }

    return menuItems.filter((item) => item.label.toLowerCase().includes(keyword));
  }, [keyword]);

  useEffect(() => {
    const fullname = localStorage.getItem('fullname');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    setUser({
      fullname: fullname || username || 'Guest',
      username: username || '',
      role: role || 'User',
      avatar: null,
    });

    const loginStatus = localStorage.getItem('hasLoginBefore');

    if (loginStatus) {
      setIsReturningUser(true);
    } else {
      localStorage.setItem('hasLoginBefore', 'true');

      setIsReturningUser(false);
    }

    const showTimer = setTimeout(() => {
      setShowWelcome(true);
    }, 500);

    const hideTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 4500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    const clickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResult(false);
      }
    };

    document.addEventListener('mousedown', clickOutside);

    return () => {
      document.removeEventListener('mousedown', clickOutside);
    };
  }, []);

  useEffect(() => {
    setShowResult(false);
    setShowMobileSearch(false);
  }, [location.pathname]);

  return (
    <div className="w-full relative">
      {/* ================= POPUP SELAMAT DATANG ================= */}
      {showWelcome && (
        <div
          className="
        fixed
        top-4
        right-4
        left-4
        sm:left-auto
        sm:top-6
        sm:right-6
        z-[9999]
        w-auto
        sm:w-80
        bg-white
        rounded-2xl
        shadow-xl
        border
        border-slate-100
        p-4
        "
        >
          <div className="flex items-center gap-3">
            <div
              className="
            w-11
            h-11
            rounded-full
            bg-blue-50
            flex
            items-center
            justify-center
            shrink-0
            "
            >
              <FaUserCircle
                className="
              text-blue-600
              text-2xl
              "
              />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-800 truncate">
                {isReturningUser ? 'Selamat Datang Kembali' : 'Selamat Datang'}
              </p>

              <p className="text-sm text-slate-600 truncate">{user.fullname}</p>

              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            HSE CCTV Monitoring Center
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            Sistem Aktif
          </div>
        </div>
      )}

      {/* ================= TOPBAR ================= */}

      <div
        className="
      bg-blue-600
      rounded-none
      shadow-[0_10px_30px_rgba(15,23,42,.15)]
      border
      border-blue-700
      px-3
      sm:px-5
      py-3
      sm:py-4
      flex
      items-center
      justify-between
      gap-2
      sm:gap-5
      "
      >
        {/* ================= HAMBURGER MOBILE ================= */}

        <button
          onClick={onMenuClick}
          aria-label="Buka menu"
          className="
        lg:hidden
        w-10
        h-10
        shrink-0
        rounded-none
        bg-blue-500
        text-white
        flex
        items-center
        justify-center
        text-lg
        hover:bg-blue-400
        transition-colors
        "
        >
          <FaBars size={16} />
        </button>

        {/* ================= SEARCH (DESKTOP) ================= */}

        <div
          ref={searchRef}
          className="
        relative
        hidden
        md:block
        flex-1
        max-w-[380px]
        "
        >
          <div
            className="
          bg-white
          border
          border-blue-700
          rounded-xl
          px-4
          py-2
          flex
          items-center
          w-full
          "
          >
            <FaSearch
              className="
            text-slate-400
            mr-3
            shrink-0
            "
              size={14}
            />

            <input
              type="text"
              value={searchTerm || ''}
              onChange={(e) => {
                const value = e.target.value;

                setSearchTerm(value);

                setShowResult(value.trim().length > 0);
              }}
              onFocus={() => {
                if (keyword) {
                  setShowResult(true);
                }
              }}
              placeholder="Cari menu..."
              autoComplete="off"
              className="
            outline-none
            bg-transparent
            text-sm
            w-full
            min-w-0
            "
            />
          </div>

          {/* HASIL PENCARIAN */}

          {showResult && keyword && (
            <div
              className="
            absolute
            top-14
            left-0
            w-full
            bg-white
            rounded-none
            shadow-xl
            border
            border-slate-100
            p-3
            z-[999]
            "
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Hasil Pencarian
              </p>

              {filteredMenu.length > 0 ? (
                filteredMenu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      setShowResult(false);

                      setSearchTerm('');
                    }}
                    className="
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2
                  rounded-none
                  text-slate-600
                  hover:bg-blue-50
                  hover:text-blue-600
                  transition-colors
                  "
                  >
                    <span className="text-blue-500 shrink-0">{item.icon}</span>

                    <span className="text-sm truncate">{item.label}</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400">Menu tidak ditemukan</p>
              )}
            </div>
          )}
        </div>

        {/* ================= SEARCH TOGGLE (MOBILE) ================= */}

        <button
          onClick={() => setShowMobileSearch((prev) => !prev)}
          aria-label="Cari menu"
          className="
        md:hidden
        w-10
        h-10
        shrink-0
        rounded-none
        bg-blue-500
        text-white
        flex
        items-center
        justify-center
        hover:bg-blue-400
        transition-colors
        "
        >
          {showMobileSearch ? <FaTimes size={15} /> : <FaSearch size={15} />}
        </button>

        {/* SPACER supaya elemen kanan tetap rapat di mobile */}
        <div className="flex-1 md:hidden" />

        {/* ================= USER ================= */}

        <div
          onClick={() => navigate('/profile')}
          role="button"
          title="Buka Profil"
          className="
 flex
 items-center
 gap-2
 sm:gap-4
 cursor-pointer
 bg-blue-500
 border
 border-blue-700
 px-2.5
 sm:px-4
 py-1.5
 sm:py-2
 rounded-xl
 hover:bg-blue-400
 transition-colors
 shrink-0
 "
        >
          <div className="text-right hidden sm:block min-w-0">
            <p className="font-semibold text-sm text-white truncate max-w-[140px]">
              {user.fullname}
            </p>

            <p className="text-xs text-blue-100 truncate">{user.role}</p>

            <div className="flex justify-end items-center gap-1 text-[11px] text-emerald-300 font-medium">
              <FiWifi size={11} />
              Online
            </div>
          </div>

          {user.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="
            w-10
            h-10
            sm:w-12
            sm:h-12
            rounded-full
            object-cover
            border-2
            border-white
            shadow-sm
            shrink-0
            "
            />
          ) : (
            <div
              className="
            w-10
            h-10
            sm:w-12
            sm:h-12
            rounded-full
            bg-white
            flex
            items-center
            justify-center
            shrink-0
            "
            >
              <FaUserCircle
                className="
              text-blue-600
              "
                size={26}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= SEARCH BAR MOBILE (EXPANDABLE) ================= */}

      {showMobileSearch && (
        <div
          ref={searchRef}
          className="
        md:hidden
        mt-2
        relative
        "
        >
          <div
            className="
          bg-blue-600
          border
          border-blue-700
          rounded-none
          px-4
          py-2.5
          flex
          items-center
          w-full
          shadow-[0_10px_30px_rgba(15,23,42,.15)]
          "
          >
            <FaSearch className="text-blue-100 mr-3 shrink-0" size={14} />

            <input
              type="text"
              value={searchTerm || ''}
              onChange={(e) => {
                const value = e.target.value;

                setSearchTerm(value);

                setShowResult(value.trim().length > 0);
              }}
              autoFocus
              placeholder="Cari menu..."
              autoComplete="off"
              className="outline-none bg-transparent text-sm w-full min-w-0 text-white placeholder-blue-100"
            />
          </div>

          {showResult && keyword && (
            <div
              className="
            absolute
            top-full
            mt-2
            left-0
            w-full
            bg-white
            rounded-none
            shadow-xl
            border
            border-slate-100
            p-3
            z-[999]
            "
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Hasil Pencarian
              </p>

              {filteredMenu.length > 0 ? (
                filteredMenu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      setShowResult(false);
                      setSearchTerm('');
                      setShowMobileSearch(false);
                    }}
                    className="
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2
                  rounded-none
                  text-slate-600
                  hover:bg-blue-50
                  hover:text-blue-600
                  transition-colors
                  "
                  >
                    <span className="text-blue-500 shrink-0">{item.icon}</span>

                    <span className="text-sm truncate">{item.label}</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400">Menu tidak ditemukan</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
