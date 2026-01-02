import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaWpforms,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
} from "react-icons/fa";
import Logo from "../assets/images/logo.png";

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const isDashboardActive = useMemo(() => {
    return (
      location.pathname.startsWith("/id-cctv") ||
      location.pathname.startsWith("/summary") ||
      location.pathname.startsWith("/data-lokasi") ||
      location.pathname.startsWith("/kategori") ||
      location.pathname.startsWith("/petugas")
    );
  }, [location.pathname]);

  const isFormActive = useMemo(() => {
    return (
      location.pathname.startsWith("/incident-record") ||
      location.pathname.startsWith("/performance") ||
      location.pathname.startsWith("/summary-request-camera") ||
      location.pathname.startsWith("/list-camera-trouble")
    );
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    setDashboardOpen(isDashboardActive);
    setFormOpen(isFormActive);
  }, [isDashboardActive, isFormActive]);

  const activeClass = "text-blue-600 font-semibold";
  const defaultClass = "text-gray-800 hover:text-blue-600";

  return (
    <div className="h-full flex flex-col px-4 py-6 overflow-y-auto">
      {/* Mobile Header */}
      <div className="flex justify-between items-center mb-6 lg:hidden">
        <img src={Logo} alt="Logo" className="w-40" />
        <button onClick={onClose} className="text-gray-600">
          <FaTimes size={22} />
        </button>
      </div>

      {/* Desktop Logo */}
      <div className="hidden lg:flex justify-center mb-6">
        <img src={Logo} alt="Logo" className="w-60" />
      </div>

      <nav className="flex flex-col space-y-2 flex-grow">
        {/* DASHBOARD */}
        <div>
          <button
            onClick={() => setDashboardOpen(!dashboardOpen)}
            className={`w-full flex items-center justify-between px-2 py-2 rounded-md ${
              isDashboardActive ? activeClass : defaultClass
            }`}
          >
            <div className="flex items-center space-x-2">
              <FaHome />
              <span>Dashboard</span>
            </div>
            {dashboardOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {dashboardOpen && (
            <div className="ml-6 mt-1 flex flex-col space-y-1">
              <SidebarLink
                to="/id-cctv"
                label="ID CCTV"
                active={isActive("/id-cctv")}
              />
              <SidebarLink
                to="/summary"
                label="Summary"
                active={isActive("/summary")}
              />
              <SidebarLink
                to="/petugas"
                label="Petugas CCTV"
                active={isActive("/petugas")}
              />
              <SidebarLink
                to="/data-lokasi"
                label="Data Lokasi"
                active={isActive("/data-lokasi")}
              />
              <SidebarLink
                to="/kategori"
                label="Kategori"
                active={isActive("/kategori")}
              />
            </div>
          )}
        </div>

        <hr className="my-3" />

        {/* FORM */}
        <div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className={`w-full flex items-center justify-between px-2 py-2 rounded-md ${
              isFormActive ? activeClass : defaultClass
            }`}
          >
            <div className="flex items-center space-x-2">
              <FaWpforms />
              <span>Form</span>
            </div>
            {formOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {formOpen && (
            <div className="ml-6 mt-1 flex flex-col space-y-1">
              <SidebarLink
                to="/list-camera-trouble"
                label="List Camera Trouble"
                active={isActive("/list-camera-trouble")}
              />
              <SidebarLink
                to="/incident-record"
                label="Incident Record"
                active={isActive("/incident-record")}
              />
              <SidebarLink
                to="/performance"
                label="CCTV Performance"
                active={isActive("/performance")}
              />
              <SidebarLink
                to="/summary-request-camera"
                label="Summary Request Camera"
                active={isActive("/summary-request-camera")}
              />
            </div>
          )}
        </div>
      </nav>

      {/* Logout */}
      <div className="pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center space-x-2 text-red-500 hover:text-red-700"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function SidebarLink({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-2 px-2 py-1 rounded-md ${
        active ? "text-blue-600 font-semibold" : "text-gray-700 hover:text-blue-600"
      }`}
    >
      <span>{label}</span>
    </Link>
  );
}
