// If you only imported useState and useEffect before — add useRef:
import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { Bar } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CostumeDatePicker from "../components/CostumeDatePicker";


// Helper untuk konversi string ke Date object
const parseDate = (str) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/* Plugin: draw numeric value on each horizontal bar (inside if muat, outside otherwise) */
const drawBarValue = {
  id: "drawBarValue",
  afterDatasetsDraw: (chart) => {
    const { ctx } = chart;
    if (!chart?.data) return;
    ctx.save();

    chart.data.datasets.forEach((dataset, dsIndex) => {
      const meta = chart.getDatasetMeta(dsIndex);
      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];
        if (value == null) return;

        // position
        const barBox = bar;
        // for horizontal bar, x is length, y is center
        const barRight = barBox.x; // right edge
        const barLeft = barBox.base ?? (barBox.x - barBox.width / 2);
        const barWidth = Math.abs(barRight - barLeft);
        const barY = barBox.y;

        const text = String(Math.round(value));
        ctx.font = "600 12px Inter, Arial, sans-serif";
        ctx.textBaseline = "middle";
        const textWidth = ctx.measureText(text).width;
        const padding = 8;

        // if bar is wide enough, draw inside (white), else draw outside (dark)
        if (barWidth > textWidth + padding * 2) {
          ctx.fillStyle = "#ffffff";
          ctx.fillText(text, barRight - padding - textWidth, barY);
        } else {
          ctx.fillStyle = "#0f172a";
          ctx.fillText(text, barRight + padding, barY);
        }
      });
    });

    ctx.restore();
  },
};
ChartJS.register(drawBarValue);
export default function IncidentRecord() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [incidentList, setIncidentList] = useState([]);

  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [officers, setOfficers] = useState([]);

  const [formData, setFormData] = useState({
    datetimeOfIncident: null,
    location: "",
    category: "",
    descriptionOfIncident: "",
    nameOfficer: "",
    information: "",
    datetimeComplete: null,
  });


  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  // Slider state: 0 = kategori, 1 = lokasi
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const totalSlides = 2;
  const autoPlay = true;           // set false jika tidak mau auto-play
  const autoPlayIntervalMs = 5000; // waktu tiap slide (ms)

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % totalSlides);
    }, autoPlayIntervalMs);
    return () => clearInterval(id);
  }, [autoPlay, totalSlides]); // only depends on totalSlides and autoPlay vars

  // keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        setActiveSlide(prev => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft") {
        setActiveSlide(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalSlides]);

  // touch handlers kept as before:
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) setActiveSlide(prev => Math.min(prev + 1, totalSlides - 1));
    else if (diff < -threshold) setActiveSlide(prev => Math.max(prev - 1, 0));
  };

  const goTo = (index) => {
    const bounded = Math.max(0, Math.min(index, totalSlides - 1));
    setActiveSlide(bounded);
  };



  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found. User might not be logged in.");
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
          console.error("Unauthorized: Token invalid or expired.");
          alert("Your session has expired or is invalid. Please log in again.");
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw incidents fetched from backend:", data);

      const incidentsWithProcessedData = data.map(incident => {
        const processedIncident = {
          id: incident.id || incident.ID, // Use incident.id (from GORM's json:"id" tag)
          datetimeOfIncident: incident.datetimeOfIncident,
          location: incident.location,
          category: incident.category,
          descriptionOfIncident: incident.descriptionOfIncident,
          nameOfficer: incident.nameOfficer,
          information: incident.information || "",
          datetimeComplete: incident.datetimeComplete,
        };

        let duration = "";
        // Check if datetimeComplete is not null or "0001-01-01T00:00:00Z" (Go's zero time)
        if (processedIncident.datetimeOfIncident && processedIncident.datetimeComplete && processedIncident.datetimeComplete !== "0001-01-01T00:00:00Z") {
          const start = new Date(processedIncident.datetimeOfIncident);
          const end = new Date(processedIncident.datetimeComplete);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffMs = Math.abs(end - start);

            // Convert milliseconds to seconds
            let totalSeconds = Math.floor(diffMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            // Format to HH:MM:SS with leading zeros
            const formatTwoDigits = (num) => String(num).padStart(2, '0');
            duration = `${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`;
          }
        }
        return { ...processedIncident, duration };
      });

      setIncidentList(incidentsWithProcessedData);
      console.log("Processed incidents for display (incidentList state):", incidentsWithProcessedData); // DEBUG: Log processed data
    } catch (error) {
      console.error("Error fetching incidents:", error);
      alert("Failed to retrieve incident data: " + error.message);
    }
  };

  // --- Function to Fetch Dropdown Data ---
  const fetchDataForDropdowns = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token not found for dropdowns.");
      return;
    }

    try {
      const [locationsRes, categoriesRes, officersRes] = await Promise.all([
        axios.get("http://localhost:8081/api/location", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:8081/api/category", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:8081/api/officer", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setOfficers(Array.isArray(officersRes.data) ? officersRes.data : []);

      if (locationsRes.data.length > 0) {
        console.log("Example Location Data (check casing of 'id' and 'name'):", locationsRes.data[0]);
      }
      if (categoriesRes.data.length > 0) {
        console.log("Example Category Data (check casing of 'id' and 'name'):", categoriesRes.data[0]);
      }
      if (officersRes.data.length > 0) {
        console.log("Example Officer Data (check casing of 'id' and 'name_officer'):", officersRes.data[0]);
      }

    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      alert("Failed to retrieve dropdown data: " + error.message);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchDataForDropdowns();
  }, []);

  // --- Chart Data helpers ---

  const getCategoryChartData = () => {
    const counts = {};
    incidentList.forEach((incident) => {
      const cat = incident.category || "Unknown";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    return {
      labels,
      datasets: [
        {
          label: "Jumlah Kasus",
          data,
          backgroundColor: labels.map((_, i) => `rgba(153,27,27, ${0.92 - i * 0.03})`),
          borderColor: "rgba(153,27,27,1)",
          borderWidth: 0,
          borderRadius: 8,
          barThickness: 18,
          maxBarThickness: 36,
        },
      ],
    };
  };

  const getLocationChartData = () => {
    const counts = {};
    incidentList.forEach((incident) => {
      const loc = incident.location || "Unknown";
      counts[loc] = (counts[loc] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    return {
      labels,
      datasets: [
        {
          label: "Jumlah Kasus",
          data,
          backgroundColor: labels.map((_, i) => `rgba(99,102,241, ${0.92 - i * 0.03})`),
          borderColor: "rgba(99,102,241,1)",
          borderWidth: 0,
          borderRadius: 8,
          barThickness: 18,
          maxBarThickness: 36,
        },
      ],
    };
  };

  /* Update chartOptionsSimple: force integer ticks and integer tooltip */
  const chartOptionsSimple = {
    indexAxis: "y", // horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 12, bottom: 12, left: 12, right: 24 } },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.95)",
        titleFont: { size: 14, weight: "600" },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            // horizontal uses parsed.x
            const v = context.parsed?.x ?? context.raw ?? context.parsed;
            return `${context.dataset.label || ""}: ${Math.round(Number(v))}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: "#475569", callback: (v) => String(Math.round(Number(v))) },
        grid: { color: "rgba(203,213,225,0.18)" },
      },
      y: {
        ticks: { color: "#0f172a", font: { size: 13, weight: "600" }, autoSkip: false },
        grid: { display: false },
      },
    },
  };

  // --- Form Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validasi field wajib
    if (
      !formData.datetimeOfIncident ||
      !formData.location ||
      !formData.category ||
      !formData.descriptionOfIncident ||
      !formData.nameOfficer
    ) {
      alert("Lengkapi field wajib");
      return;
    }

    try {
      // 2. Konversi ke ISOString dengan proteksi new Date()
      const payload = {
        // Dibungkus new Date() supaya jika asalnya string tidak error
        datetimeOfIncident: new Date(formData.datetimeOfIncident).toISOString(),
        location: formData.location,
        category: formData.category,
        descriptionOfIncident: formData.descriptionOfIncident,
        nameOfficer: formData.nameOfficer,
        information: (formData.information || "").trim() || null,

        // Cek apakah datetimeComplete ada isinya sebelum dikonversi
        datetimeComplete: formData.datetimeComplete
          ? new Date(formData.datetimeComplete).toISOString()
          : null,
      };

      const token = localStorage.getItem("token");
      const url = isEditing
        ? `http://localhost:8081/api/incident/${editId}`
        : "http://localhost:8081/api/incident";

      const method = isEditing ? "PUT" : "POST";

      // 3. Eksekusi Request
      await axios({
        method,
        url,
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // 4. Reset UI & State
      alert(isEditing ? "Data berhasil diupdate!" : "Data berhasil disimpan!");
      fetchIncidents();
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setFormData({
        datetimeOfIncident: "", // Gunakan string kosong jika input type="datetime-local"
        location: "",
        category: "",
        descriptionOfIncident: "",
        nameOfficer: "",
        information: "",
        datetimeComplete: "",
      });

    } catch (err) {
      console.error("Error submitting incident:", err);
      alert("Gagal menyimpan data: " + (err.response?.data?.message || err.message));
    }
  };


  const handleEdit = (incident) => {
    setFormData({
      datetimeOfIncident: incident.datetimeOfIncident
        ? new Date(incident.datetimeOfIncident)
        : null,

      datetimeComplete:
        incident.datetimeComplete &&
          incident.datetimeComplete !== "0001-01-01T00:00:00Z"
          ? new Date(incident.datetimeComplete)
          : null,

      location: incident.location || "",
      category: incident.category || "",
      descriptionOfIncident: incident.descriptionOfIncident || "",
      nameOfficer: incident.nameOfficer || "",
      information: incident.information || "",
    });

    setShowForm(true);
    setIsEditing(true);
    setEditId(incident.id);
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this incident?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      await axios.delete(`http://localhost:8081/api/incident/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Incident successfully deleted!");
      fetchIncidents();
    } catch (err) {
      console.error("Failed to delete incident:", err.response?.data || err.message);
      alert("Failed to delete incident: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Filter and Pagination ---
  const filteredIncidents = incidentList.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.descriptionOfIncident?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.nameOfficer?.toLowerCase().includes(searchLower) ||
      (item.information && item.information.toLowerCase().includes(searchLower))
    );
  });

  const pageCount = Math.ceil(filteredIncidents.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount || 1);
  }, [pageCount, currentPage]);

  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  return (
    <Layout>
      {/* Combined Chart Section with full-width Slider */}
      <section className="p-4 w-full max-w-full mx-auto mt-6">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 shadow-xl w-full h-[520px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-xl font-semibold text-gray-800">📊 Statistik Kasus</h2>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 hidden md:block">Slide {activeSlide + 1} / {totalSlides}</div>

              <button
                onClick={() => goTo(activeSlide - 1)}
                className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                disabled={activeSlide === 0}
                aria-label="Previous slide"
              >
                ⬅️
              </button>

              <button
                onClick={() => goTo(activeSlide + 1)}
                className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                disabled={activeSlide === totalSlides - 1}
                aria-label="Next slide"
              >
                ➡️
              </button>
            </div>
          </div>

          {/* Slider viewport */}
          <div
            ref={sliderRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-[420px] relative"
            style={{ touchAction: "pan-y" }}
          >
            <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {/* Slide 1 (full width) */}
              <div style={{ flex: "0 0 100%", padding: 12 }}>
                <div className="h-full bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="text-md font-semibold mb-3">📊 Jumlah Kasus per Kategori</h3>
                  <div style={{ height: "calc(100% - 1.2rem)", width: "100%" }}>
                    {incidentList.length > 0 ? (
                      <Bar data={getCategoryChartData()} options={chartOptionsSimple} />
                    ) : (
                      <p className="text-center text-gray-600">Loading chart data atau belum ada data incident.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Slide 2 (full width) */}
              <div style={{ flex: "0 0 100%", padding: 12 }}>
                <div className="h-full bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="text-md font-semibold mb-3">📍 Jumlah Kasus per Lokasi</h3>
                  <div style={{ height: "calc(100% - 1.2rem)", width: "100%" }}>
                    {incidentList.length > 0 ? (
                      <Bar data={getLocationChartData()} options={chartOptionsSimple} />
                    ) : (
                      <p className="text-center text-gray-600">Loading chart data atau belum ada data incident.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`w-3 h-3 rounded-full ${i === activeSlide ? "bg-blue-600" : "bg-gray-300"}`} aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 1 - Incident Button & Form */}
      <section className="p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button
            onClick={() => {
              setShowForm(true);
              setIsEditing(false);
              setEditId(null);
              setFormData({
                datetimeOfIncident: null,
                location: "",
                category: "",
                descriptionOfIncident: "",
                nameOfficer: "",
                information: "",
                datetimeComplete: null,
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            ➕ Tambah Insiden
          </button>
        </div>

        {showForm && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8"
            onClick={() => {
              setShowForm(false);
              setIsEditing(false);
              setFormData({
                datetimeOfIncident: null,
                location: "",
                category: "",
                descriptionOfIncident: "",
                nameOfficer: "",
                information: "",
                datetimeComplete: null,
                duration: null
              });
              setEditId(null);
            }}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full relative animate-fade-in my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                {isEditing ? "✏️ Edit Incident" : "➕ Add Incident"}
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-2 md:space-y-0">
                {/* Tanggal & Waktu Incident */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal & Waktu Incident
                  </label>
                  <CostumeDatePicker
                    selectedDate={formData.datetimeOfIncident}
                    onChange={(date) =>
                      setFormData(prev => ({ ...prev, datetimeOfIncident: date }))
                    }
                    placeholder="Pilih tanggal dan waktu"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Lokasi
                  </label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Lokasi</option>
                    {locations.map((loc, index) => (
                      <option key={loc.id || `loc-${index}`} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat, index) => (
                      <option key={cat.id || `cat-${index}`} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="descriptionOfIncident" className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi Singkat Kejadian
                  </label>
                  <textarea
                    id="descriptionOfIncident"
                    name="descriptionOfIncident"
                    value={formData.descriptionOfIncident}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe incident details..."
                    required
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="nameOfficer" className="block text-sm font-medium text-gray-700 mb-1">
                    Petugas
                  </label>
                  <select
                    id="nameOfficer"
                    name="nameOfficer"
                    value={formData.nameOfficer}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Petugas</option>
                    {officers.map((officer, index) => (
                      <option key={officer.id || `officer-${index}`} value={officer.name_officer}>
                        {officer.name_officer}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="information" className="block text-sm font-medium text-gray-700 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    id="information"
                    name="information"
                    value={formData.information}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Supporting information"
                  />
                </div>

                {/* Tanggal & Waktu Penyelesaian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal & Waktu Penyelesaian
                  </label>
                  <CostumeDatePicker
                    selectedDate={parseDate(formData.datetimeComplete)}
                    onChange={(date) =>
                      setFormData(prev => ({ ...prev, datetimeComplete: date ? date.toISOString() : "" }))
                    }
                    placeholder="Pilih tanggal dan waktu"
                  />
                </div>


                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setIsEditing(false);
                      setFormData({ // Reset form on cancel
                        datetimeOfIncident: null,
                        location: "",
                        category: "",
                        descriptionOfIncident: "",
                        nameOfficer: "",
                        information: "",
                        datetimeComplete: null,
                      });
                      setEditId(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition"
                  >
                    ❌ Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
                  >
                    {isEditing ? "💾 Save Changes" : "➕ Add Incident"}
                  </button>
                </div>
              </form>

              <button
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                  setFormData({ // Reset form on closing
                    datetimeOfIncident: "",
                    location: "",
                    category: "",
                    descriptionOfIncident: "",
                    nameOfficer: "",
                    information: "",
                    datetimeComplete: "",
                  });
                  setEditId(null);
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

      {/* Section 2 - Incident Table (Main Table) */}
      <section className="p-4 mt-12">
        <input
          type="text"
          placeholder="🔍 Search incidents (description, location, category, officer)..."
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Tanggal & Waktu Kejadian</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Lokasi</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Deskripsi Singkat Kejadian</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Petugas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Tanggal & Waktu Penyelesaian (Lift, Escalator, dsb)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Durasi</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginatedIncidents.length > 0 ? (
                paginatedIncidents.map((incident, index) => (
                  <tr key={incident.id || `incident-row-${index}`} className="hover:bg-gray-100/50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.datetimeOfIncident && incident.datetimeOfIncident !== "0001-01-01T00:00:00Z"
                        ? new Date(incident.datetimeOfIncident).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{incident.location || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{incident.category || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{incident.descriptionOfIncident || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{incident.nameOfficer || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.information || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.datetimeComplete && incident.datetimeComplete !== "0001-01-01T00:00:00Z"
                        ? new Date(incident.datetimeComplete).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.duration || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 space-x-2">
                      <button
                        onClick={() => handleEdit(incident)}
                        className="px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold shadow"
                      >
                        ✏️ Ubah
                      </button>
                      <button
                        onClick={() => handleDelete(incident.id)}
                        className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Displaying {paginatedIncidents.length} of {filteredIncidents.length} incidents
            </p>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >
                ⬅️ Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {pageCount}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm text-gray-700 disabled:opacity-50"
              >
                Next ➡️
              </button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
