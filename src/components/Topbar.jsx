import { useEffect, useState } from "react";
import { FaBell, FaSearch, FaRegCalendar } from "react-icons/fa";

export default function Topbar() {
  const [user, setUser] = useState({fullname: "Guest", role: "Uknown"});

  useEffect(() => {
    fetch("/api/user")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    })
    .then((data) => {
      setUser(data);
    })
    .catch((err) => {
      console.error(err);
    })
  })
  return (
    <div className="flex gap-1 justify-between items-center">
      {/* Bagian kiri: search + user info */}
      <div className="bg-blue-500 text-white flex items-center rounded-none shadow px-5 py-3 flex-1">
        {/* Search */}
        <div className="flex items-center bg-white text-black px-3 py-2 rounded-md w-full max-w-md">
          <FaSearch className="mr-2 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="outline-none w-full text-sm"
          />
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 ml-120">
          <div className="text-center">
            <div className="font-bold">{user.fullname}</div>
            <div className="text-sm italic">{user.role}</div>
          </div>
          <img
            src="/avatar.png"
            alt="Profile"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
        </div>
      </div>

      {/* Bagian kanan: icon bell + tanggal */}
      <div className="bg-blue-500 text-white rounded-none shadow px-6 py-5 flex items-center justify-between flex-1 max-w-xs">
        <FaBell className="text-white text-2xl w-5 h-7" />
        <FaRegCalendar className="text-white text-2xl w-5 h-7" />
      </div>
    </div>
  );
}
