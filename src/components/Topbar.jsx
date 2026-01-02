import { useEffect, useState } from "react";
import { FaBell, FaSearch, FaRegCalendar, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onMenuClick }) {
  const [user, setUser] = useState({ fullname: "Guest", role: "Unknown" });
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResult, setFilteredResult] = useState([]);

  const menuList = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Incident Record", path: "/incident-record" },
    { name: "CCTV Performance", path: "/cctv-performance" },
    { name: "Data Lokasi", path: "/data-lokasi" },
    { name: "Kategori", path: "/kategori" },
    { name: "Petugas", path: "/petugas" },
    { name: "Summary Request Camera", path: "/summary-request-camera" },
    { name: "Profile", path: "/profile" },
    { name: "ID CCTV", path: "/id-cctv" },
    { name: "List Camera Trouble", path: "/list-camera-trouble" },
  ];


  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Failed to parse user:", error);
      }
    }
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredResult([]);
    } else {
      const results = menuList.filter((menu) =>
        menu.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResult(results);
    }
  };

  const handleSelectMenu = (path) => {
    navigate(path);
    setSearchQuery("");
    setFilteredResult([]);
  };

  const handleProfileClick = () => navigate("/profile");

  return (
    <div className="flex items-center justify-between bg-blue-500 text-white px-4 py-3 shadow relative z-50">
      {/* Kiri */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button className="lg:hidden text-white" onClick={onMenuClick}>
          <FaBars size={22} />
        </button>

        {/* Search Input Group */}
        <div className="hidden md:block relative flex-1 max-w-sm lg:max-w-md">
          <div className="flex items-center bg-white text-black px-3 py-2 rounded-md">
            <FaSearch className="mr-2 text-gray-500" />
            <input
              type="text"
              placeholder="Cari menu atau halaman..."
              className="outline-none w-full text-sm"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Dropdown Hasil Search */}
          {filteredResult.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white text-black mt-1 rounded-md shadow-lg border border-gray-200 overflow-hidden">
              {filteredResult.map((result, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-none"
                  onClick={() => handleSelectMenu(result.path)}
                >
                  {result.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kanan */}
      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
        <FaBell className="text-white text-xl" />
        <FaRegCalendar className="text-white text-xl" />

        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
          onClick={handleProfileClick}
        >
          <div className="text-right hidden sm:block">
            <div className="font-semibold text-sm leading-tight">
              {user.fullname}
            </div>
            <div className="text-xs italic leading-tight">{user.role}</div>
          </div>

          <img
            src="/avatar.png"
            alt="Profile"
            className="w-9 h-9 rounded-full border-2 border-white"
          />
        </div>
      </div>
    </div>
  );
}
