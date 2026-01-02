import { useState, useEffect, useMemo } from "react";
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

export default function DataKategori() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null); // store id of category being edited
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "" });
  const [kategoriList, setKategoriList] = useState([]);
  const [incidentList, setIncidentList] = useState([]); // State to store incident data

  // Warna berbeda untuk tiap kategori
  const barColors = [
    "rgba(59, 130, 246, 0.7)", // blue-500
    "rgba(234, 88, 12, 0.7)",  // orange-600
    "rgba(16, 185, 129, 0.7)", // emerald-500
    "rgba(234, 179, 8, 0.7)",  // yellow-500
    "rgba(147, 51, 234, 0.7)", // violet-600
    "rgba(239, 68, 68, 0.7)",  // red-500
    "rgba(14, 165, 233, 0.7)", // sky-500
    "rgba(132, 204, 22, 0.7)", // lime-500
    "rgba(219, 39, 119, 0.7)", // pink-600
    "rgba(6, 182, 212, 0.7)"   // cyan-500
  ];

  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // --- Function to Fetch Category Data ---
  const fetchCategory = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:8081/api/category", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
      console.log("Categories:", data);
      setKategoriList(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Gagal mengambil data kategori: " + error.message);
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
          // No alert here, as fetchCategory already handles it.
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIncidentList(data);
    } catch (error) {
      console.error("Error fetching incidents for chart:", error);
      // No alert here, as fetchCategory already handles it.
    }
  };

  // Fetch both categories and incidents on component mount
  useEffect(() => {
    fetchCategory();
    fetchIncidents();
  }, []);

  const getChartData = useMemo(() => {
    const categoryCounts = {};

    // Inisialisasi
    kategoriList.forEach(cat => {
      categoryCounts[cat.name] = 0;
    });

    // Hitung insiden
    incidentList.forEach(incident => {
      const categoryName = incident.category || incident.Category;
      if (categoryName && Object.prototype.hasOwnProperty.call(categoryCounts, categoryName)) {
        categoryCounts[categoryName]++;
      }
    });

    const labels = Object.keys(categoryCounts);
    const dataValues = Object.values(categoryCounts);
    const colors = labels.map((_, i) => barColors[i % barColors.length]);

    return {
      labels: labels, // Nama kategori langsung jadi label
      datasets: [
        {
          label: "Jumlah Insiden",
          data: dataValues,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.7', '1')),
          borderWidth: 2,
          borderRadius: 5
        },
      ],
      fullCategoryNames: labels // Untuk keperluan legend manual
    };
  }, [kategoriList, incidentList, barColors]); // Dependency array

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Sembunyikan legend default karena sudah ada keterangan di samping
      },
      title: {
        display: true,
        text: "Statistik Insiden per Kategori",
        font: { size: 18, weight: 'bold' },
        padding: { bottom: 20 }
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (context) => ` Total: ${context.raw} Insiden`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: true, drawBorder: false },
        ticks: { stepSize: 1, color: "#64748b" },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#64748b",
          font: { size: 11 },
          maxRotation: 45,
          minRotation: 45 // Dimiringkan agar nama kategori panjang tidak tumpang tindih
        },
      },
    },
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return alert("Nama Kategori tidak boleh kosong.");
    }

    try {
      const token = localStorage.getItem("token");
      if (isEditing) {
        await axios.put(
          `http://localhost:8081/api/category/${editId}`,
          { name: formData.name.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "http://localhost:8081/api/category",
          { name: formData.name.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await fetchCategory(); // Refresh category list
      await fetchIncidents(); // Refresh incident list for chart
      setFormData({ name: "" });
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
    } catch (err) {
      console.error("Gagal menyimpan kategori:", err.response?.data || err.message);
      alert("Gagal menyimpan kategori: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (kategori) => {
    setFormData({ name: kategori.name });
    setShowForm(true);
    setIsEditing(true);
    setEditId(kategori.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8081/api/category/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCategory(); // Refresh category list
      await fetchIncidents(); // Refresh incident list for chart
      alert("Kategori berhasil dihapus!");
    } catch (err) {
      console.error("Gagal menghapus kategori:", err.response?.data || err.message);
      alert("Gagal menghapus kategori: " + (err.response?.data?.message || err.message));
    }
  };

  // Filter and paginate categories
  const filteredList = kategoriList.filter((item) =>
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


  return (
    <Layout>
      {/* Section 0 - Grafik */}
      <section className="p-4 w-full max-w-full mx-auto flex flex-col lg:flex-row gap-6"> {/* Added flex-col lg:flex-row for responsiveness */}
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-xl w-full lg:w-3/4 h-[400px]"> {/* Added w-full lg:w-3/4 */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Grafik Insiden per Kategori</h2>
          <div style={{ height: "calc(100% - 2.5rem)", width: "100%" }}>
            {kategoriList.length > 0 && incidentList.length > 0 ? (
              <Bar data={getChartData} options={chartOptions} />
            ) : (
              <p className="text-center text-gray-600">Memuat data grafik atau belum ada data kategori/insiden.</p>
            )}
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-xl w-full lg:w-1/4 h-[400px] flex flex-col overflow-auto"> {/* Added w-full lg:w-1/4 */}
          <h3 className="text-lg font-semibold mb-4">Keterangan Kategori</h3>
          {/* Use chartData.fullCategoryNames for the legend */}
          {getChartData.fullCategoryNames && getChartData.fullCategoryNames.length > 0 ? (
            getChartData.fullCategoryNames.map((fullName, index) => (
              <div key={fullName || `chart-label-${index}`} className="flex items-center mb-2">
                <div
                  className="w-6 h-6 rounded mr-3"
                  style={{ backgroundColor: getChartData.datasets[0].backgroundColor[index] }}
                ></div>
                <span>
                  {fullName} (Jumlah Insiden: {getChartData.datasets[0].data[index]})
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
          ➕ Tambah Kategori Baru
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
                {isEditing ? "✏️ Edit Kategori" : "➕ Tambah Kategori"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: Kehilangan barang di tenant"
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
      <section className="p-4 max-w-6xl mx-auto"> {/* Removed overflow-x-auto from here */}
        <input
          type="text"
          placeholder="🔍 Cari nama kategori..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-full divide-y divide-gray-300"> {/* Added min-w-full back */}
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Nama Kategori</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedList.length > 0 ? (
                paginatedList.map((kategori, index) => (
                  <tr key={kategori.id} className="hover:bg-gray-100/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kategori.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 space-x-2">
                      <button
                        onClick={() => handleEdit(kategori)}
                        className="px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold shadow"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(kategori.id)}
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
                    Tidak ada kategori ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Menampilkan {paginatedList.length} dari {filteredList.length} kategori
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
