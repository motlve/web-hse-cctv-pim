// src/components/Layout.jsx
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100 p-4 gap-2">
      {/* Sidebar */}
      <div className="w-64">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col gap-2">
        <Topbar /> {/* Topbar sudah dibagi dua section */}
        {/* Konten utama */}
        <div className="flex-1 bg-white rounded-none shadow p-6">{children}</div>
      </div>
    </div>
  );
}