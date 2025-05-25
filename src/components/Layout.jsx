import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  return (
    <div className="flex bg-gray-100 p-4 gap-2 h-screen">
      {/* Sidebar */}
      <nav className="w-64 overflow-y-auto h-full">
        <Sidebar />
      </nav>

      {/* Main area */}
      <main className="flex-1 flex flex-col gap-2 overflow-hidden h-full">
        <header>
          <Topbar />
        </header>
        {/* Konten utama bisa scroll */}
        <section className="flex-1 bg-white rounded-none shadow p-6 overflow-y-auto">
          {children}
        </section>
      </main>
    </div>
  );
}
