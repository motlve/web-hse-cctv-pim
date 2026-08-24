import { useState } from 'react';
import { Children, isValidElement } from 'react';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  // Konversi children jadi array yang konsisten, apa pun bentuk aslinya
  // (single element, fragment, array, dsb). Ini mencegah children?.[0]
  // gagal diam-diam saat parent hanya mengirim 1-2 elemen.
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div
      className="
      min-h-screen
      w-full
      bg-gray-100
      overflow-x-hidden
      "
    >
      {/* ================= SIDEBAR ================= */}

      <aside
        className={`
        fixed
        inset-y-0
        left-0

        z-50

        w-[85vw]
        max-w-[280px]

        bg-white

        shadow-2xl

        transform

        transition-transform
        duration-300
        ease-in-out

        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}

        lg:translate-x-0
        lg:w-[280px]
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* ================= OVERLAY MOBILE ================= */}

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="
          fixed
          inset-0

          z-40

          bg-black/40

          backdrop-blur-sm

          lg:hidden

          "
        />
      )}

      {/* ================= PAGE ================= */}

      <div
        className="
        min-h-screen
        w-full

        flex
        flex-col

        lg:ml-[280px]
        lg:w-[calc(100%-280px)]
        "
      >
        {/* ================= HEADER ================= */}

        <header
          className="
          sticky
          top-0

          z-30
          "
        >
          <Topbar
            onMenuClick={() => setSidebarOpen((prev) => !prev)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </header>

        {/* ================= BODY ================= */}

        <main
          className="
          flex-1
          w-full

          overflow-y-auto
          overflow-x-hidden

          p-3
          sm:p-5
          lg:p-6

          space-y-4
          sm:space-y-5
          "
        >
          {/* ================= TOP CONTENT ================= */}

          <div
            className="
            grid

            grid-cols-1

            xl:grid-cols-4

            gap-4
            sm:gap-5
            "
          >
            {/* CHART */}

            <section
              className="
              xl:col-span-3

              w-full
              min-w-0

              bg-white

              rounded-2xl
              sm:rounded-3xl

              shadow-lg

              p-3
              sm:p-6

              min-h-[280px]
              sm:min-h-[340px]
              lg:min-h-[400px]
              "
            >
              {items[0]}
            </section>

            {/* LEGEND */}

            <section
              className="
              xl:col-span-1

              w-full
              min-w-0

              bg-white

              rounded-2xl
              sm:rounded-3xl

              shadow-lg

              p-3
              sm:p-6
              "
            >
              {items[1]}
            </section>
          </div>

          {/* ================= TABLE ================= */}

          <section
            className="
            w-full

            bg-white

            rounded-2xl
            sm:rounded-3xl

            shadow-lg

            p-3
            sm:p-6

            overflow-hidden
            "
          >
            <div
              className="
              w-full
              overflow-x-auto
              -mx-3
              px-3
              sm:mx-0
              sm:px-0
              "
            >
              {items[2]}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
