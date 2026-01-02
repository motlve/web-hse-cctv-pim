import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row bg-gray-100 min-h-screen overflow-hidden">

      {/* === Sidebar === */}
      <aside
        className={`fixed lg:relative z-50 top-0 left-0 h-full lg:h-auto bg-white shadow-xl w-64 transform transition-transform duration-300 ease-in-out 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* === Overlay Mobile === */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* === Main Area === */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* === Topbar === */}
        <header className="sticky top-0 z-30 bg-blue-500">
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        </header>

        {/* === Chart + Legend === */}
        <div className="flex flex-col lg:flex-row gap-4 p-4">

          {/* Chart Section */}
          <section className="w-full lg:w-3/4 bg-white rounded-2xl shadow-lg p-4">
            {children?.[0]}
          </section>

          {/* Legend Section */}
          <section className="w-full lg:w-1/4 bg-white rounded-2xl shadow-lg p-4">
            {children?.[1]}
          </section>
        </div>

        {/* === Table Area === */}
        <div className="flex-1 overflow-y-auto p-4">

          <section className="bg-white rounded-2xl shadow-lg p-4">
            {children?.[2]}
          </section>

        </div>
      </div>
    </div>
  );
}
