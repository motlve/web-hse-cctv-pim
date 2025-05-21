import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCamera,
  FaClipboardList,
  FaList,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaWpforms,
} from "react-icons/fa";

import Logo from "../assets/images/logo.png";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // State untuk buka tutup dropdown
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Fungsi untuk cek path mana aktif
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Untuk parent dropdown aktif jika ada submenu yang aktif di dalamnya
  // Contoh Dashboard: submenu /id-cctv atau /incident
  // Contoh Form: submenu /incident-record dll

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    if (
      location.pathname.startsWith("/id-cctv") ||
      location.pathname.startsWith("/incident")
    ) {
      setDashboardOpen(true);
    } else {
      setDashboardOpen(false);
    }

    if (
      location.pathname.startsWith("/incident-record") ||
      location.pathname.startsWith("/performance") ||
      location.pathname.startsWith("/summary-request") ||
      location.pathname.startsWith("/camera-trouble")
    ) {
      setFormOpen(true);
    } else {
      setFormOpen(false);
    }
  }, [location.pathname]);

  // Fungsi untuk menentukan class aktif
  const activeClass = "text-blue-600 font-semibold";
  const defaultClass = "text-gray-800 hover:text-blue-600";
  const iconActiveClass = "text-blue-600";
  const iconDefaultClass = "text-gray-800 group-hover:text-blue-600";

  return (
    <div className="w-64 bg-white shadow-md min-h-screen px-4 py-6 rounded-none flex flex-col">
      <div className="text-center mb-6">
        <img src={Logo} alt="Logo" className="w-80 mx-auto" />
      </div>

      <nav className="flex flex-col space-y-2 flex-grow overflow-auto">
        {/* Dashboard Dropdown */}
        <div>
          <button
            onClick={() => setDashboardOpen(!dashboardOpen)}
            className={`w-full flex items-center justify-between px-2 py-2 rounded-md ${
              dashboardOpen ? activeClass : defaultClass
            }`}
          >
            <div className="flex items-center space-x-2">
              <FaHome
                className={dashboardOpen ? iconActiveClass : iconDefaultClass}
              />
              <span>Dashboard</span>
            </div>
            {dashboardOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {dashboardOpen && (
            <div className="ml-6 mt-1 flex flex-col space-y-1">
              <Link
                to="/id-cctv"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/id-cctv")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <FaCamera
                  className={
                    isActive("/id-cctv") ? iconActiveClass : "text-gray-700"
                  }
                />
                <span>ID CCTV</span>
              </Link>
              <Link
                to="/incident"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/incident")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <FaClipboardList
                  className={
                    isActive("/incident") ? iconActiveClass : "text-gray-700"
                  }
                />
                <span>Summary</span>
              </Link>
            </div>
          )}
        </div>

        <hr className="my-3" />

        {/* Form Dropdown */}

        <div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className={`w-full flex items-center justify-between px-2 py-2 rounded-md ${
              formOpen ? activeClass : defaultClass
            }`}
          >
            <div className="flex items-center space-x-2">
              <FaWpforms
                className={formOpen ? iconActiveClass : iconDefaultClass}
              />
              <span>Form</span>
            </div>
            {formOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {formOpen && (
            <div className="ml-6 mt-1 flex flex-col space-y-1">
              <Link
                to="/camera-trouble"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/camera-trouble")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <FaList
                  className={
                    isActive("/camera-trouble")
                      ? iconActiveClass
                      : "text-gray-700"
                  }
                />
                <span>List Camera Trouble</span>
              </Link>
              <Link
                to="/incident-record"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/incident-record")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <FaClipboardList
                  className={
                    isActive("/incident-record")
                      ? iconActiveClass
                      : "text-gray-700"
                  }
                />
                <span>Incident Record</span>
              </Link>
              <Link
                to="/performance"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/performance")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <FaCamera
                  className={
                    isActive("/performance") ? iconActiveClass : "text-gray-700"
                  }
                />
                <span>CCTV Performance</span>
              </Link>
              <Link
                to="/summary-request"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/summary-request")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <FaCamera
                  className={
                    isActive("/summary-request")
                      ? iconActiveClass
                      : "text-gray-700"
                  }
                />
                <span>Summary Request</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Logout fixed di bawah */}
      <div className="pt-6">
        <Link
          onClick={(logout) => {
            logout.preventDefault();
            handleLogout();
          }}
          className="flex items-center space-x-2 text-red-500 hover:text-red-700"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}
