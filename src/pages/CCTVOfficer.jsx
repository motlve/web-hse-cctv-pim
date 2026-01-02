import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function OfficerLeaderboard() {
  const [officerList, setOfficerList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [cameraRes, incidentRes, officerRes] = await Promise.all([
        fetch("http://localhost:8081/api/list-camera-trouble", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8081/api/incident", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8081/api/officer", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!cameraRes.ok || !incidentRes.ok || !officerRes.ok)
        throw new Error("Failed to fetch data");

      const cameraData = await cameraRes.json();
      const incidentData = await incidentRes.json();
      const officerData = await officerRes.json();

      console.log("RAW Incident Data:", incidentData);
      console.log("RAW Camera Trouble Data:", cameraData);
      console.log("Master Officer List:", officerData);

      const counts = {};

      // --- Hitung kasus incident ---
      incidentData.forEach(i => {
        const key = (i.NameOfficer || "").trim();
        if (!key) return; // skip jika kosong
        if (!counts[key]) counts[key] = { name: i.NameOfficer, total: 0, source: [] };
        counts[key].total += 1;
        counts[key].source.push({ type: "incident", id: i.ID });
      });

      // Camera trouble mapping
      cameraData.forEach(c => {
        const key = (c.petugas || "").trim(); // HARUS 'petugas' bukan 'Petugas'
        if (!key) return;
        if (!counts[key]) counts[key] = { name: key, total: 0, source: [] };
        counts[key].total += 1;
        counts[key].source.push({ type: "camera", id: c.id_camera }); // HARUS 'id_camera' bukan 'IDCamera'
      });


      // --- Merge dengan master officer supaya semua petugas muncul ---
      officerData.forEach(o => {
        const key = (o.NameOfficer || "").trim();
        if (!counts[key]) counts[key] = { name: o.NameOfficer, total: 0, source: [] };
      });

      // --- Debug summary ---
      console.log("Case counts per officer:", counts);

      // --- Convert ke array untuk chart/table ---
      const summary = Object.values(counts)
        .map(o => ({ name: o.name, incidentCount: o.total, cases: o.source }))
        .sort((a, b) => b.incidentCount - a.incidentCount);

      console.log("Final Officer Summary:", summary);

      setOfficerList(summary);

    } catch (err) {
      console.error(err);
      alert("Gagal memuat data petugas.");
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  // --- Chart Data ---
  const chartColors = [
    "rgba(255, 215, 0, 0.8)",   // Gold
    "rgba(192,192,192, 0.8)",   // Silver
    "rgba(205, 127, 50, 0.8)",  // Bronze
    "rgba(59, 130, 246, 0.7)"   // Default Blue
  ];

  const getChartData = () => {
    const labels = officerList.map(o => o.name);
    const data = officerList.map(o => o.totalCases);
    const colors = officerList.map((_, i) => chartColors[i] || chartColors[3]);

    return {
      labels,
      datasets: [
        {
          label: "Jumlah Kasus Total",
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace("0.7", "1")),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            const officer = officerList[context.dataIndex];
            return `Total: ${officer.totalCases} (Incident: ${officer.incidentCases}, Camera: ${officer.cameraCases})`;
          }
        }
      }
    },
    onClick: (evt, elements) => {
      if (!elements.length) return;
      const index = elements[0].index;
      const officer = officerList[index];
      alert(`Klik petugas: ${officer.name}\nTotal Kasus: ${officer.totalCases}\nIncident: ${officer.incidentCases}\nCamera Trouble: ${officer.cameraCases}`);
    },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: "Jumlah Kasus" }, ticks: { stepSize: 1 } },
      y: { title: { display: true, text: "Nama Petugas" }, ticks: { autoSkip: false } },
    },
  };

  // --- Filter & Pagination ---
  const filteredOfficers = officerList.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pageCount = Math.ceil(filteredOfficers.length / itemsPerPage);
  const paginatedOfficers = filteredOfficers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount || 1);
  }, [pageCount, currentPage]);

  return (
    <Layout>
      {/* Section 0 - Horizontal Bar Chart */}
      <section className="p-4 w-full max-w-full mx-auto flex gap-6">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-xl w-full h-[500px]">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Leaderboard Petugas CCTV</h2>
          {officerList.length > 0 ? (
            <Bar data={getChartData()} options={chartOptions} />
          ) : (
            <p className="text-center text-gray-600">Memuat data...</p>
          )}
        </div>
      </section>

      {/* Section 1 - Table */}
      <section className="p-4 mt-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ringkasan Kasus per Petugas</h2>
        <input
          type="text"
          placeholder="🔍 Cari nama petugas..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Nama Petugas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Total Kasus</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Incident</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Camera Trouble</th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedOfficers.length > 0 ? (
                paginatedOfficers.map((officer, index) => (
                  <tr key={officer.name} className="hover:bg-gray-100/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{officer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{officer.totalCases}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{officer.incidentCases}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{officer.cameraCases}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Tidak ada data ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Menampilkan {paginatedOfficers.length} dari {filteredOfficers.length} petugas
            </p>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >⬅️ Sebelumnya</button>
              <span className="text-sm text-gray-700">Halaman {currentPage} dari {pageCount}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >Selanjutnya ➡️</button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
