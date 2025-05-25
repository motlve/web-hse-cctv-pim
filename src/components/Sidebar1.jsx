import { useState, useEffect, useMemo } from "react";
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
  const isActive = (path) => location.pathname === path;

  // Memoize fungsi cek apakah path termasuk group Dashboard
  const isDashboardActive = useMemo(() => {
    return (
      location.pathname.startsWith("/id-cctv") ||
      location.pathname.startsWith("/summary") ||
      location.pathname.startsWith("/data-lokasi") ||
      location.pathname.startsWith("/kategori")
    );
  }, [location.pathname]);

  // Memoize fungsi cek apakah path termasuk group Form
  const isFormActive = useMemo(() => {
    return (
      location.pathname.startsWith("/incident-record") ||
      location.pathname.startsWith("/performance") ||
      location.pathname.startsWith("/summary-request") ||
      location.pathname.startsWith("/camera-trouble")
    );
  }, [location.pathname]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/api/login");
  };

  // Sync dropdown open state dengan aktifnya submenu
  useEffect(() => {
    setDashboardOpen(isDashboardActive);
    setFormOpen(isFormActive);
  }, [isDashboardActive, isFormActive]);

  // Styling class
  const activeClass = "text-blue-600 font-semibold";
  const defaultClass = "text-gray-800 hover:text-blue-600";
  const iconActiveClass = "text-blue-600";
  const iconDefaultClass = "text-gray-800 group-hover:text-blue-600";

  return (
    <div className="w-full h-full bg-white shadow-md px-4 py-6 rounded-none flex flex-col">
      <div className="text-center mb-6">
        <img src={Logo} alt="Logo" className="w-80 mx-auto" />
      </div>

      <nav className="flex flex-col space-y-2 flex-grow overflow-auto">
        {/* Dashboard Dropdown */}
        <div>
          <button
            type="button"
            aria-expanded={dashboardOpen}
            aria-controls="dashboard-menu"
            onClick={() => setDashboardOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between px-2 py-2 rounded-md ${
              isDashboardActive ? activeClass : defaultClass
            }`}
          >
            <div className="flex items-center space-x-2">
              <FaHome
                className={isDashboardActive ? iconActiveClass : iconDefaultClass}
              />
              <span>Dashboard</span>
            </div>
            {dashboardOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {dashboardOpen && (
            <div
              id="dashboard-menu"
              className="ml-6 mt-1 flex flex-col space-y-1"
              role="menu"
              aria-label="Dashboard submenu"
            >
              <Link
                to="/id-cctv"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/id-cctv")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
                role="menuitem"
              >
                <FaCamera
                  className={isActive("/id-cctv") ? iconActiveClass : "text-gray-700"}
                />
                <span>ID CCTV</span>
              </Link>

              <Link
                to="/summary"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/summary")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
                role="menuitem"
              >
                <FaClipboardList
                  className={isActive("/summary") ? iconActiveClass : "text-gray-700"}
                />
                <span>Summary</span>
              </Link>

              <Link
                to="/data-lokasi"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/data-lokasi")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
                role="menuitem"
              >
                <FaList
                  className={isActive("/data-lokasi") ? iconActiveClass : "text-gray-700"}
                />
                <span>Data Lokasi</span>
              </Link>

              <Link
                to="/kategori"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/kategori")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
                role="menuitem"
              >
                <FaClipboardList
                  className={isActive("/kategori") ? iconActiveClass : "text-gray-700"}
                />
                <span>Kategori</span>
              </Link>
            </div>
          )}
        </div>

        <hr className="my-3" />

        {/* Form Dropdown */}
        <div>
          <button
            type="button"
            aria-expanded={formOpen}
            aria-controls="form-menu"
            onClick={() => setFormOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between px-2 py-2 rounded-md ${
              isFormActive ? activeClass : defaultClass
            }`}
          >
            <div className="flex items-center space-x-2">
              <FaWpforms
                className={isFormActive ? iconActiveClass : iconDefaultClass}
              />
              <span>Form</span>
            </div>
            {formOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {formOpen && (
            <div
              id="form-menu"
              className="ml-6 mt-1 flex flex-col space-y-1"
              role="menu"
              aria-label="Form submenu"
            >
              <Link
                to="/camera-trouble"
                className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
                  isActive("/camera-trouble")
                    ? activeClass
                    : "text-gray-700 hover:text-blue-600"
                }`}
                role="menuitem"
              >
                <FaList
                  className={isActive("/camera-trouble") ? iconActiveClass : "text-gray-700"}
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
                role="menuitem"
              >
                <FaClipboardList
                  className={isActive("/incident-record") ? iconActiveClass : "text-gray-700"}
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
                role="menuitem"
              >
                <FaCamera
                  className={isActive("/performance") ? iconActiveClass : "text-gray-700"}
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
                role="menuitem"
              >
                <FaCamera
                  className={isActive("/summary-request") ? iconActiveClass : "text-gray-700"}
                />
                <span>Summary Request</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Logout fixed di bawah */}
      <div className="pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center space-x-2 text-red-500 hover:text-red-700 cursor-pointer"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
