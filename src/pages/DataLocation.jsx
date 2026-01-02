import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Pie } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DataLokasi() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null); // store id of category being edited
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "" });
  const [lokasiList, setLokasiList] = useState([]);
  const [incidentList, setIncidentList] = useState([]); // NEW: State to store incident data

  // Warna berbeda untuk tiap lokasi
  const pieColors = [ // Renamed from barColors for clarity
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

  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // --- Function to Fetch Location Data ---
  const fetchLocation = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8081/api/location", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized: Token tidak valid atau kadaluarsa.");
          alert("Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.");
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLokasiList(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
      alert("Gagal mengambil data lokasi: " + error.message);
    }
  };

  // --- Function to Fetch Incident Data ---
  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token tidak ditemukan untuk insiden.");
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
            console.error("Unauthorized: Token tidak valid atau kadaluarsa.");
            // No alert here, as fetchLocation already handles it.
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIncidentList(data);
    } catch (error) {
      console.error("Error fetching incidents for chart:", error);
      // No alert here, as fetchLocation already handles it.
    }
  };

  // Fetch both locations and incidents on component mount
  useEffect(() => {
    fetchLocation();
    fetchIncidents();
  }, []);

  // --- Chart Data Calculation (Based on Incident Counts per Location) ---
  const getChartData = () => {
    const locationCounts = {};
    // Initialize counts for all known locations to 0
    lokasiList.forEach(loc => {
      locationCounts[loc.name] = 0;
    });

    // Count incidents for each location
    incidentList.forEach(incident => {
      const locationName = incident.location || incident.Location; // Handle potential casing
      if (locationName && Object.prototype.hasOwnProperty.call(locationCounts, locationName)) {
        locationCounts[locationName]++;
      }
    });

    const labels = Object.keys(locationCounts);
    const data = Object.values(locationCounts);
    const colorsForChart = labels.map((_, i) => pieColors[i % pieColors.length]);

    return {
      labels: labels,
      datasets: [
        {
          label: "Jumlah Insiden",
          data: data,
          backgroundColor: colorsForChart,
          borderColor: '#fff', // White border for slices
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" }, // Legend on the right side
      title: {
        display: true,
        text: "Jumlah Insiden per Lokasi", // Chart title
        font: {
          size: 18
        }
      },
    },
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return alert("Nama Lokasi tidak boleh kosong.");
    }

    try {
      const token = localStorage.getItem("token");
      if (isEditing) {
        await axios.put(
          `http://localhost:8081/api/location/${editId}`,
          { name: formData.name.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "http://localhost:8081/api/location",
          { name: formData.name.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await fetchLocation(); // Refresh location list
      await fetchIncidents(); // Refresh incident list for chart
      setFormData({ name: "" });
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
    } catch (err) {
      console.error("Gagal menyimpan lokasi:", err.response?.data || err.message);
      alert("Gagal menyimpan lokasi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (lokasi) => {
    setFormData({ name: lokasi.name });
    setShowForm(true);
    setIsEditing(true);
    setEditId(lokasi.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) return; // Changed to window.confirm
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8081/api/location/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchLocation(); // Refresh location list
      await fetchIncidents(); // Refresh incident list for chart
      alert("Lokasi berhasil dihapus!"); // Added success alert
    } catch (err) {
      console.error("Gagal menghapus lokasi:", err.response?.data || err.message);
      alert("Gagal menghapus lokasi: " + (err.response?.data?.message || err.message));
    }
  };

  // Filter and paginate locations
  const filteredList = lokasiList.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredList.length / itemsPerPage);

  // Make sure current page is valid
  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount || 1);
  }, [pageCount, currentPage]);

  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const chartData = getChartData(); // Call getChartData here to ensure it uses updated state

  return (
    <Layout>
      {/* Section 0 - Grafik */}
      <section className="p-4 w-full max-w-full mx-auto flex gap-6">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-xl w-3/4 h-[400px]">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Grafik Insiden per Lokasi</h2> {/* Updated title */}
          <div style={{ height: "calc(100% - 2.5rem)", width: "100%" }}>
            {lokasiList.length > 0 && incidentList.length > 0 ? (
              <Pie data={chartData} options={chartOptions} />
            ) : (
              <p className="text-center text-gray-600">Memuat data grafik atau belum ada data lokasi/insiden.</p>
            )}
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-xl w-1/4 h-[400px] flex flex-col overflow-auto">
          <h3 className="text-lg font-semibold mb-4">Keterangan Lokasi</h3> {/* Updated title */}
          {chartData.labels.length > 0 ? (
            chartData.labels.map((label, index) => (
              <div key={label || `chart-label-${index}`} className="flex items-center mb-2">
                <div
                  className="w-6 h-6 rounded mr-3"
                  style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }}
                ></div>
                <span>
                  {label} (Jumlah Insiden: {chartData.datasets[0].data[index]})
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm">Tidak ada data untuk keterangan.</p>
          )}
        </div>
      </section>


      {/* Section 1 - Button */}
      <section className="p-4">
        <button
          onClick={() => {
            setShowForm(true);
            setIsEditing(false);
            setFormData({ name: "" });
            setEditId(null);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition"
        >
          ➕ Tambah Lokasi Baru
        </button>

        {/* Modal Form */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => {
              setShowForm(false);
              setIsEditing(false);
              setFormData({ name: "" });
              setEditId(null);
            }}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                {isEditing ? "✏️ Edit Lokasi" : "➕ Tambah Lokasi"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nama Lokasi
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: PIM 1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setIsEditing(false);
                      setFormData({ name: "" });
                      setEditId(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
                  >
                    ❌ Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
                  >
                    {isEditing ? "💾 Simpan" : "➕ Tambah"}
                  </button>
                </div>
              </form>

              <button
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                  setFormData({ name: "" });
                  setEditId(null);
                }}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
                aria-label="Close form"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Section 3 - Tabel */}
      <section className="p-4 max-w-6xl mx-auto">
        <input
          type="text"
          placeholder="🔍 Cari nama lokasi..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Nama Lokasi</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedList.length > 0 ? (
                paginatedList.map((lokasi, index) => (
                  <tr key={lokasi.id} className="hover:bg-gray-100/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lokasi.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 space-x-2">
                      <button
                        onClick={() => handleEdit(lokasi)}
                        className="px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold shadow"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(lokasi.id)}
                        className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada lokasi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Menampilkan {paginatedList.length} dari {filteredList.length} lokasi
          </p>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
            >
              ⬅️ Sebelumnya
            </button>
            <span className="text-sm text-gray-700">
              Halaman {currentPage} dari {pageCount}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
            >
              Selanjutnya ➡️
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
