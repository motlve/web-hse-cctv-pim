import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Bar } from "react-chartjs-2";
import axios from "axios";
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

export default function CCTVOfficers() {
  // State untuk manajemen form dan tabel petugas
  const [showOfficerForm, setShowOfficerForm] = useState(false);
  const [isEditingOfficer, setIsEditingOfficer] = useState(false);
  const [editOfficerId, setEditOfficerId] = useState(null);
  const [searchOfficerTerm, setSearchOfficerTerm] = useState("");
  const [officerFormData, setOfficerFormData] = useState({
    name_officer: "",
    gender: "",
    role: "",
  });
  const [officerList, setOfficerList] = useState([]); // Data detail petugas dari /api/officer

  // State baru untuk data ringkasan insiden per petugas (untuk grafik)
  const [officerIncidentSummary, setOfficerIncidentSummary] = useState([]);

  const itemsPerPage = 5;
  const [currentOfficerPage, setCurrentOfficerPage] = useState(1);

  // Warna untuk grafik
  const barColors = [
    "rgba(59, 130, 246, 0.7)", // Blue
    "rgba(234, 88, 12, 0.7)",  // Orange
    "rgba(16, 185, 129, 0.7)", // Emerald
    "rgba(234, 179, 8, 0.7)",  // Yellow
    "rgba(147, 51, 234, 0.7)", // Purple
    "rgba(239, 68, 68, 0.7)",  // Red
    "rgba(14, 165, 233, 0.7)", // Sky
    "rgba(132, 204, 22, 0.7)", // Lime
    "rgba(219, 39, 119, 0.7)", // Rose
    "rgba(6, 182, 212, 0.7)"   // Cyan
  ];

  // --- Data dan Opsi untuk Grafik Jumlah Kasus Ditangani per Petugas ---
  const getChartData = () => {
    const labels = officerIncidentSummary.map(summary => summary.name);
    const data = officerIncidentSummary.map(summary => summary.incidentCount);
    const colorsForChart = labels.map((_, i) => barColors[i % barColors.length]);

    return {
      labels: labels,
      datasets: [
        {
          label: "Jumlah Kasus Ditangani",
          data: data,
          backgroundColor: colorsForChart,
          borderColor: colorsForChart.map(color => color.replace('0.7', '1')), // Border lebih gelap
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Jumlah Kasus Ditangani per Petugas" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Jumlah Kasus",
        },
        ticks: {
          stepSize: 1, // Pastikan tick Y-axis adalah bilangan bulat
        },
      },
      x: {
        title: {
          display: true,
          text: "Nama Petugas",
        },
      },
    },
  };

  // --- Fetch Data Petugas (untuk tabel manajemen petugas) ---
  const fetchOfficer = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token tidak ditemukan. Pengguna mungkin belum login.");
        return;
      }

      const response = await fetch("http://localhost:8081/api/officer", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Tidak Sah: Token tidak valid atau kedaluwarsa.");
          alert("Sesi Anda telah berakhir atau tidak valid. Harap masuk kembali.");
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Petugas yang diambil dari backend:", data);
      setOfficerList(data);

    } catch (error) {
      console.error("Error fetching officers:", error);
      alert("Gagal mengambil data petugas: " + error.message);
    }
  };

  // --- Fetch Data Insiden dan Hitung Ringkasan per Petugas (untuk grafik) ---
  const fetchIncidentSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token tidak ditemukan. Pengguna mungkin belum login.");
        return;
      }

      const response = await fetch("http://localhost:8081/api/incident", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Tidak Sah: Token tidak valid atau kedaluwarsa.");
          // Tidak perlu alert lagi karena fetchOfficer sudah menanganinya
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Insiden mentah yang diambil dari backend:", data);

      // Proses insiden untuk menghitung per petugas
      const officerCounts = {};
      data.forEach(incident => {
        const officerName = incident.nameOfficer || "Petugas Tidak Dikenal"; // Pastikan nama field sesuai backend Go
        officerCounts[officerName] = (officerCounts[officerName] || 0) + 1;
      });

      // Konversi objek officerCounts menjadi array untuk grafik dan pengurutan
      const summaryArray = Object.keys(officerCounts).map(officer => ({
        name: officer,
        incidentCount: officerCounts[officer],
      })).sort((a, b) => b.incidentCount - a.incidentCount); // Urutkan berdasarkan jumlah insiden (menurun)

      setOfficerIncidentSummary(summaryArray);
      console.log("Ringkasan insiden petugas yang diproses:", summaryArray);
    } catch (error) {
      console.error("Error fetching incident summary:", error);
      // alert("Gagal mengambil ringkasan data insiden: " + error.message); // Hindari alert ganda
    }
  };


  // useEffect untuk memuat data petugas dan ringkasan insiden saat komponen mount
  useEffect(() => {
    fetchOfficer();
    fetchIncidentSummary();
  }, []);

  // --- Form Petugas Handlers ---
  const handleOfficerChange = (e) => {
    setOfficerFormData({ ...officerFormData, [e.target.name]: e.target.value });
  };

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();

    if (
      !officerFormData.name_officer.trim() ||
      !officerFormData.gender.trim() ||
      !officerFormData.role.trim()
    ) {
      alert("Semua field petugas harus diisi.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      if (isEditingOfficer) {
        await axios.put(
          `http://localhost:8081/api/officer/${editOfficerId}`,
          officerFormData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "http://localhost:8081/api/officer",
          officerFormData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      alert("Petugas berhasil disimpan!");
      await fetchOfficer(); // Perbarui daftar petugas
      await fetchIncidentSummary(); // Perbarui ringkasan insiden untuk grafik
      setCurrentOfficerPage(1);
      setOfficerFormData({
        name_officer: "",
        gender: "",
        role: "",
      });
      setShowOfficerForm(false);
      setIsEditingOfficer(false);
      setEditOfficerId(null);
    } catch (err) {
      console.error("Gagal menyimpan petugas:", err.response?.data || err.message);
      alert("Gagal menyimpan petugas: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEditOfficer = (officer) => {
    setOfficerFormData({
      name_officer: officer.name_officer || "",
      gender: officer.gender || "",
      role: officer.role || "",
    });
    setShowOfficerForm(true);
    setIsEditingOfficer(true);
    setEditOfficerId(officer.id);
  };

  const handleDeleteOfficer = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus petugas ini?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      await axios.delete(`http://localhost:8081/api/officer/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Petugas berhasil dihapus!");
      await fetchOfficer(); // Perbarui daftar petugas
      await fetchIncidentSummary(); // Perbarui ringkasan insiden untuk grafik
    } catch (err) {
      console.error("Gagal menghapus petugas:", err.response?.data || err.message);
      alert("Gagal menghapus petugas: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Filter dan Paginasi untuk Tabel Petugas ---
  const filteredOfficer = Array.isArray(officerList)
    ? officerList.filter((item) => {
      const name = item?.name_officer ?? "";
      return name.toLowerCase().includes(searchOfficerTerm.toLowerCase());
    })
    : [];

  const officerPageCount = Math.ceil(filteredOfficer.length / itemsPerPage);

  useEffect(() => {
    if (currentOfficerPage > officerPageCount) setCurrentOfficerPage(officerPageCount || 1);
  }, [officerPageCount, currentOfficerPage]);

  const paginatedOfficer = filteredOfficer.slice(
    (currentOfficerPage - 1) * itemsPerPage,
    currentOfficerPage * itemsPerPage
  );

  return (
    <Layout>
      {/* Section 0 - Grafik Petugas (Jumlah Kasus Ditangani) */}
      <section className="p-4 w-full max-w-full mx-auto flex gap-6">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-xl w-3/4 h-[400px]">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Grafik Jumlah Kasus Ditangani per Petugas</h2>
          <div style={{ height: "calc(100% - 2.5rem)", width: "100%" }}>
            {officerIncidentSummary.length > 0 ? (
              <Bar data={getChartData()} options={chartOptions} />
            ) : (
              <p className="text-center text-gray-600">Memuat data grafik atau tidak ada data insiden yang tersedia.</p>
            )}
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-xl w-1/4 h-[400px] flex flex-col overflow-auto">
          <h3 className="text-lg font-semibold mb-4">Keterangan Grafik</h3>
          {officerIncidentSummary.length > 0 ? (
            officerIncidentSummary.map((summary, index) => (
              <div key={summary.name || `summary-legend-${index}`} className="flex items-center mb-2">
                <div
                  className="w-6 h-6 rounded mr-3"
                  style={{ backgroundColor: barColors[index % barColors.length] }}
                ></div>
                <span>
                  {summary.name} ({summary.incidentCount} Kasus)
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm">Tidak ada data untuk keterangan grafik.</p>
          )}
        </div>
      </section>

      {/* Section 1 - Tombol & Form Petugas */}
      <section className="p-4">
        <button
          onClick={() => {
            setShowOfficerForm(true);
            setIsEditingOfficer(false);
            setOfficerFormData({
              name_officer: "",
              gender: "",
              role: "",
            });
            setEditOfficerId(null);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition"
        >
          ➕ Tambah Petugas Baru
        </button>

        {/* Modal Form Petugas */}
        {showOfficerForm && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8"
            onClick={() => {
              setShowOfficerForm(false);
              setIsEditingOfficer(false);
              setOfficerFormData({
                name_officer: "",
                gender: "",
                role: "",
              });
              setEditOfficerId(null);
            }}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                {isEditingOfficer ? "✏️ Edit Petugas" : "➕ Tambah Petugas"}
              </h2>

              <form onSubmit={handleOfficerSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name_officer"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nama Petugas
                  </label>
                  <input
                    type="text"
                    id="name_officer"
                    name="name_officer"
                    value={officerFormData.name_officer}
                    onChange={handleOfficerChange}
                    autoFocus
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Jenis Kelamin
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={officerFormData.gender}
                    onChange={handleOfficerChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={officerFormData.role}
                    onChange={handleOfficerChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Jabatan</option>
                    <option value="Manager HSE">Manager HSE</option>
                    <option value="Petugas HSE">Petugas HSE</option>
                    <option value="Petugas CCTV">Petugas CCTV</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOfficerForm(false);
                      setIsEditingOfficer(false);
                      setOfficerFormData({
                        name_officer: "",
                        gender: "",
                        role: "",
                        entryWork: "",
                      });
                      setEditOfficerId(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
                  >
                    ❌ Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
                  >
                    {isEditingOfficer ? "💾 Simpan Perubahan" : "➕ Tambah Petugas"}
                  </button>
                </div>
              </form>

              <button
                onClick={() => {
                  setShowOfficerForm(false);
                  setIsEditingOfficer(false);
                  setOfficerFormData({
                    name_officer: "",
                    gender: "",
                    role: "",
                  });
                  setEditOfficerId(null);
                }}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
                aria-label="Close form"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Section 2 - Tabel Petugas */}
      <section className="p-4 mt-12">
        <input
          type="text"
          placeholder="🔍 Cari nama petugas..."
          value={searchOfficerTerm}
          onChange={(e) => {
            setSearchOfficerTerm(e.target.value);
            setCurrentOfficerPage(1);
          }}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Nama Petugas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Jenis Kelamin</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Jabatan</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedOfficer.length > 0 ? (
                paginatedOfficer.map((officer, index) => (
                  <tr key={officer?.id || `officer-row-${index}`} className="hover:bg-gray-100/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(currentOfficerPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{officer.name_officer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{officer.gender}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{officer.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 space-x-2">
                      <button
                        onClick={() => handleEditOfficer(officer)}
                        className="px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold shadow"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOfficer(officer.id)}
                        className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada petugas ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi Petugas */}
        {officerPageCount > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {[...Array(officerPageCount)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentOfficerPage(i + 1)}
                className={`px-3 py-1 rounded ${currentOfficerPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
