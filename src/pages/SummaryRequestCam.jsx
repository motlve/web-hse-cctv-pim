/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useMemo } from "react";
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

/* Plugin: draw numeric value on each horizontal bar (inside if muat, outside otherwise) */
const drawBarValue = {
  id: "drawBarValue",
  afterDatasetsDraw: (chart) => {
    const { ctx } = chart;
    if (!chart?.data) return;
    ctx.save();

    chart.data.datasets.forEach((dataset) => {
      const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(dataset));
      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];
        if (value == null) return;

        const barBox = bar;
        const barRight = barBox.x ?? (barBox.x + (barBox.width || 0));
        const barLeft = barBox.base ?? (barBox.x - (barBox.width || 0));
        const barWidth = Math.abs(barRight - barLeft);
        const barY = barBox.y;

        const text = String(Math.round(value));
        ctx.font = "600 12px Inter, Arial, sans-serif";
        ctx.textBaseline = "middle";
        const textWidth = ctx.measureText(text).width;
        const padding = 8;

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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, drawBarValue);

export default function SummaryRequestCamera() {
  const API_BASE = "http://localhost:8081/api";

  // create axios instance once
  const axiosInstance = useMemo(() => {
    const inst = axios.create({
      baseURL: API_BASE,
      headers: { "Content-Type": "application/json" },
    });
    inst.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    inst.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status;
        if (status === 401) {
          localStorage.removeItem("token");
          alert("Sesi habis / tidak berizin. Silakan login ulang.");
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    );
    return inst;
  }, []);

  // main state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null); // internal id (primary key) for PUT/DELETE
  const [searchTerm, setSearchTerm] = useState("");

  const [requestList, setRequestList] = useState([]);
  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({
    id_camera: "",
    tanggal_request: "", // YYYY-MM-DD
    lokasi: "",
    lokasi_detail: "",
    tanggal_pemasangan: "", // YYYY-MM-DD or ""
    status: "Request",
    progress_days: "",
    // input_database removed from form
    keterangan: "",
  });

  // --- date-range filter state ---
  const [tempFilterStart, setTempFilterStart] = useState("");
  const [tempFilterEnd, setTempFilterEnd] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  // inline editor state for Input DB (use internal id)
  const [editingInputDbId, setEditingInputDbId] = useState(null);
  const [editingInputDbValue, setEditingInputDbValue] = useState("");

  // pagination & slider
  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const totalSlides = 2;
  const autoPlay = true;
  const autoPlayIntervalMs = 5000;

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => setActiveSlide((s) => (s + 1) % totalSlides), autoPlayIntervalMs);
    return () => clearInterval(id);
  }, [autoPlay, totalSlides]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setActiveSlide((s) => Math.min(s + 1, totalSlides - 1));
      if (e.key === "ArrowLeft") setActiveSlide((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalSlides]);

  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.touches[0].clientX);
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) setActiveSlide((s) => Math.min(s + 1, totalSlides - 1));
    else if (diff < -threshold) setActiveSlide((s) => Math.max(s - 1, 0));
  };
  const goTo = (idx) => setActiveSlide(Math.max(0, Math.min(idx, totalSlides - 1)));

  /* ---------- fetch data ---------- */
  useEffect(() => {
    fetchRequests();
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axiosInstance.get("/summary-request-camera");
      const payload = Array.isArray(res.data) ? res.data : [];
      const normalized = payload.map((r) => normalizeRequestItem(r));
      setRequestList(normalized);
    } catch (err) {
      console.error("Error fetching summary-request-camera:", err);
      alert("Gagal mengambil data summary request camera: " + (err?.response?.data?.message || err.message));
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axiosInstance.get("/location"); // endpoint sesuai backend
      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching locations:", err);
      setLocations([]);
    }
  };

  // normalize backend item -> frontend shape (date-only) + try find internal id
  const normalizeRequestItem = (r) => {
    const zeroTime = "0001-01-01T00:00:00Z";
    const parseToDateOnly = (v) => {
      if (!v) return "";
      if (v === zeroTime) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return v;
      const d = new Date(v);
      if (isNaN(d.getTime())) return "";
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // YYYY-MM-DD
    };

    // try to locate backend primary id (common names). fallback to id_camera if that's what backend uses.
    let internalId = r.id ?? r.ID ?? r._id ?? r._ID ?? r.internal_id ?? r.id_camera ?? null;
    if (internalId === "") internalId = null;

    return {
      internal_id: internalId, // use this for PUT/DELETE
      id_camera: (r.id_camera ?? r.IDCamera ?? r.idCamera ?? "") + "",
      tanggal_request: parseToDateOnly(r.tanggal_request ?? r.TanggalRequest ?? r.tanggalRequest),
      lokasi: r.lokasi ?? r.Lokasi ?? "",
      lokasi_detail: r.lokasi_detail ?? r.LokasiDetail ?? "",
      tanggal_pemasangan: parseToDateOnly(r.tanggal_pemasangan ?? r.TanggalPemasangan ?? r.tanggalPemasangan),
      status: r.status ?? r.Status ?? "Request",
      progress_days: typeof r.progress_days === "number" ? r.progress_days : r.ProgressDays ?? 0,
      input_database: r.input_database ?? r.InputDatabase ?? "Belum Terinput",
      keterangan: r.keterangan ?? r.Keterangan ?? "",
      __raw: r,
    };
  };

  /* ---------- helpers tanggal (date-only) ---------- */
  const dateStrToISO = (dateStr) => {
    // dateStr expected "YYYY-MM-DD"
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return null;
    const yyyy = Number(y), mm = Number(m) - 1, dd = Number(d);
    if (Number.isNaN(yyyy) || Number.isNaN(mm) || Number.isNaN(dd)) return null;
    // construct an exact UTC midnight for that date (no timezone shift)
    const dt = new Date(Date.UTC(yyyy, mm, dd, 0, 0, 0));
    return dt.toISOString(); // e.g. "2025-01-09T00:00:00.000Z"
  };

  const parseToDisplayDate = (dateStr) => {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    if (!y) return "-";
    return `${d}/${m}/${y}`; // dd/mm/yyyy
  };

  const computeProgressDays = (reqDateStr, installDateStr) => {
    if (!reqDateStr || !installDateStr) return "";
    const a = new Date(reqDateStr + "T00:00:00");
    const b = new Date(installDateStr + "T00:00:00");
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return "";
    const diffMs = b - a;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  /* ---------- form handlers ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => {
      const updated = { ...p, [name]: value };
      // otomatis status based on tanggal_pemasangan presence
      if (name === "tanggal_request" || name === "tanggal_pemasangan") {
        updated.progress_days = computeProgressDays(updated.tanggal_request, updated.tanggal_pemasangan);
        if (updated.tanggal_pemasangan) updated.status = "Success";
        else updated.status = "Request";
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDASI WAJIB
    if (!formData.id_camera) {
      alert("ID Camera wajib diisi.");
      return;
    }

    if (!formData.tanggal_request || !formData.lokasi) {
      alert("Lengkapi minimal: Tanggal Request dan Lokasi.");
      return;
    }

    if (formData.status === "Success" && !formData.tanggal_pemasangan) {
      alert("Status 'Success' dipilih — mohon isi Tanggal Pemasangan juga.");
      return;
    }

    try {
      const payload = {
        id_camera: formData.id_camera || null,
        tanggal_request: dateStrToISO(formData.tanggal_request),
        lokasi: formData.lokasi,
        lokasi_detail: formData.lokasi_detail || null,
        tanggal_pemasangan: formData.tanggal_pemasangan
          ? dateStrToISO(formData.tanggal_pemasangan)
          : null,
        status: formData.status,
        progress_days: Number(formData.progress_days) || 0,
        keterangan: formData.keterangan || null,
      };

      console.log("Submitting payload:", payload);

      if (isEditing && editId) {
        const res = await axiosInstance.put(`/summary-request-camera/${encodeURIComponent(editId)}`, payload);
        console.log("PUT response:", res.data);
      } else {
        const res = await axiosInstance.post("/summary-request-camera", payload);
        console.log("POST response:", res.data);
      }

      await fetchRequests();
      resetForm();
      setShowForm(false);
      alert("Data berhasil disimpan.");
    } catch (err) {
      console.error("Gagal simpan (detailed):", err);
      const status = err?.response?.status;
      const data = err?.response?.data;
      let serverMessage = "";
      if (data) {
        if (typeof data === "object") serverMessage = JSON.stringify(data, null, 2);
        else serverMessage = String(data);
      }
      const axiosInfo = err?.toJSON ? err.toJSON() : {};
      alert(
        `Gagal menyimpan.\nHTTP status: ${status || "unknown"}\nServer response:\n${serverMessage || "(no response body)"}\n\nAxios info: ${JSON.stringify(axiosInfo)}\n\nCek console (DevTools) untuk detail.`
      );
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      id_camera: "",
      tanggal_request: "",
      lokasi: "",
      lokasi_detail: "",
      tanggal_pemasangan: "",
      status: "Request",
      progress_days: "",
      keterangan: "",
    });
  };

  // set form fields and editId (use internal_id)
  const handleEdit = (item) => {
    setFormData({
      id_camera: item.id_camera || "",
      tanggal_request: item.tanggal_request || "",
      lokasi: item.lokasi || "",
      lokasi_detail: item.lokasi_detail || "",
      tanggal_pemasangan: item.tanggal_pemasangan || "",
      status: item.status || "Request",
      progress_days: item.progress_days ?? "",
      keterangan: item.keterangan || "",
    });
    setIsEditing(true);
    setEditId(item.internal_id);
    setShowForm(true);
  };

  const handleDelete = async (internal_id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    if (!internal_id) {
      alert("Internal ID tidak ditemukan.");
      return;
    }

    try {
      await axiosInstance.delete(`/summary-request-camera/${encodeURIComponent(internal_id)}`);
      await fetchRequests();
      alert("Data berhasil dihapus.");
    } catch (err) {
      console.error("Gagal hapus:", err);
      alert("Gagal menghapus: " + (err?.response?.data?.message || err.message));
    }
  };




  /* ---------- date filter helpers ---------- */
  const isDateInRange = (dateStr, start, end) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return false;
    if (start) {
      const s = new Date(start + "T00:00:00");
      if (d < s) return false;
    }
    if (end) {
      const e = new Date(end + "T00:00:00");
      if (d > e) return false;
    }
    return true;
  };

  const applyDateFilter = () => {
    if (tempFilterStart && tempFilterEnd) {
      const s = new Date(tempFilterStart + "T00:00:00");
      const e = new Date(tempFilterEnd + "T00:00:00");
      if (s.getTime() > e.getTime()) {
        alert("Tanggal mulai tidak boleh setelah tanggal selesai.");
        return;
      }
    }
    setFilterStart(tempFilterStart || "");
    setFilterEnd(tempFilterEnd || "");
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setTempFilterStart("");
    setTempFilterEnd("");
    setFilterStart("");
    setFilterEnd("");
    setCurrentPage(1);
  };

  /* ---------- inline Input DB editor ---------- */
  const openInputDbEditor = (internalId, currentValue) => {
    if (!internalId) {
      alert("Tidak dapat mengedit Input DB: internal id tidak ditemukan.");
      return;
    }
    setEditingInputDbId(internalId);
    setEditingInputDbValue(currentValue || "");
  };

  const cancelInputDbEditor = () => {
    setEditingInputDbId(null);
    setEditingInputDbValue("");
  };

  const saveInputDb = async (internalId) => {
    if (!internalId) return;
    try {
      // update only input_database field
      const payload = { input_database: editingInputDbValue || null };
      if (payload.input_database === null) delete payload.input_database;

      await axiosInstance.put(`/summary-request-camera/${encodeURIComponent(internalId)}`, payload);
      await fetchRequests();
      setEditingInputDbId(null);
      setEditingInputDbValue("");
      alert("Input DB berhasil diperbarui.");
    } catch (err) {
      console.error("Gagal update input_database:", err);
      alert("Gagal update input_database: " + (err?.response?.data?.message || err.message));
    }
  };

  /* ---------- filter & pagination (includes date-range) ---------- */
  const filtered = requestList.filter((r) => {
    if (filterStart || filterEnd) {
      if (!isDateInRange(r.tanggal_request, filterStart, filterEnd)) return false;
    }
    const s = searchTerm.trim().toLowerCase();
    if (!s) return true;
    return (
      (r.id_camera || "").toLowerCase().includes(s) ||
      (r.lokasi || "").toLowerCase().includes(s) ||
      (r.lokasi_detail || "").toLowerCase().includes(s) ||
      (r.keterangan || "").toLowerCase().includes(s) ||
      (r.status || "").toLowerCase().includes(s)
    );
  });

  const pageCount = Math.ceil(filtered.length / itemsPerPage) || 1;
  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* ---------- chart helpers (use filtered so charts follow date+search filter) ---------- */
  const chartDataPerLocation = (() => {
    const perLoc = {};
    filtered.forEach((r) => {
      const loc = r.lokasi || "Tidak Diketahui";
      if (!perLoc[loc]) perLoc[loc] = { Request: 0, Success: 0 };
      if (r.status === "Success") perLoc[loc].Success++;
      else perLoc[loc].Request++;
    });
    const labels = Object.keys(perLoc);
    return {
      labels,
      datasets: [
        {
          label: "Request",
          data: labels.map((l) => perLoc[l].Request),
          backgroundColor: labels.map((_, i) => `rgba(220,38,38, ${0.9 - i * 0.02})`), // red-ish
          borderRadius: 8,
        },
        {
          label: "Success",
          data: labels.map((l) => perLoc[l].Success),
          backgroundColor: labels.map((_, i) => `rgba(16,185,129, ${0.9 - i * 0.02})`), // green-ish
          borderRadius: 8,
        },
      ],
    };
  })();

  const chartOptionsSimple = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label || ""}: ${Math.round(Number(ctx.parsed?.x ?? ctx.raw ?? 0))}`,
        },
      },
    },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } },
      y: { ticks: { autoSkip: false } },
    },
  };

  // parse "dd/mm/yyyy" -> "YYYY-MM-DD"
  const parseDisplayDateToIso = (display) => {
    if (!display) return "";
    const cleaned = display.trim();
    const parts = cleaned.includes("/") ? cleaned.split("/") : cleaned.split("-");
    if (parts.length !== 3) return "";
    let [d, m, y] = parts.map((s) => s.trim());
    if (y.length === 2) y = `20${y}`;
    const dd = String(Number(d)).padStart(2, "0");
    const mm = String(Number(m)).padStart(2, "0");
    const yyyy = String(Number(y));
    const dateObj = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (isNaN(dateObj.getTime())) return "";
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDateInput = (name, displayValue) => {
    setFormData((p) => {
      const iso = parseDisplayDateToIso(displayValue);
      const updated = { ...p, [name]: iso };
      if (name === "tanggal_request" || name === "tanggal_pemasangan") {
        updated.progress_days = computeProgressDays(updated.tanggal_request, updated.tanggal_pemasangan);
        if (updated.tanggal_pemasangan) updated.status = "Success";
        else updated.status = updated.status || "Request";
      }
      return updated;
    });
  };

  /* ---------- render ---------- */
  return (
    <Layout>
      {/* Charts slider */}
      <section className="p-4 w-full max-w-full mx-auto mt-6">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 shadow-xl w-full h-[520px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-xl font-semibold text-gray-800">📊 Statistik Summary Request Camera</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 hidden md:block">Slide {activeSlide + 1} / {totalSlides}</div>
              <button onClick={() => goTo(activeSlide - 1)} className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50" disabled={activeSlide === 0}>⬅️</button>
              <button onClick={() => goTo(activeSlide + 1)} className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50" disabled={activeSlide === totalSlides - 1}>➡️</button>
            </div>
          </div>

          <div ref={sliderRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="w-full h-[420px] relative" style={{ touchAction: "pan-y" }}>
            <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {/* Slide 1 */}
              <div style={{ flex: "0 0 100%", padding: 12 }}>
                <div className="h-full bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="text-md font-semibold mb-3">📍 Request vs Success per Lokasi</h3>
                  <div style={{ height: "calc(100% - 1.2rem)", width: "100%" }}>
                    {filtered.length > 0 ? <Bar data={chartDataPerLocation} options={chartOptionsSimple} /> : <p className="text-center text-gray-600">Tidak ada data (per filter).</p>}
                  </div>
                </div>
              </div>

              {/* Slide 2 */}
              <div style={{ flex: "0 0 100%", padding: 12 }}>
                <div className="h-full bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="text-md font-semibold mb-3">📈 Total per Status</h3>
                  <div style={{ height: "calc(100% - 1.2rem)", width: "100%" }}>
                    {filtered.length > 0 ? (
                      <Bar
                        data={{
                          labels: ["Request", "Success"],
                          datasets: [{
                            label: "Jumlah",
                            data: [
                              filtered.filter(r => r.status !== "Success").length,
                              filtered.filter(r => r.status === "Success").length
                            ],
                            backgroundColor: ["rgba(220,38,38,0.9)", "rgba(16,185,129,0.9)"],
                            borderRadius: 8
                          }],
                        }}
                        options={{ ...chartOptionsSimple, indexAxis: "x" }}
                      />
                    ) : (
                      <p className="text-center text-gray-600">Tidak ada data (per filter).</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`w-3 h-3 rounded-full ${i === activeSlide ? "bg-blue-600" : "bg-gray-300"}`} aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Form & Add */}
      <section className="p-4">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition">➕ Tambah Request</button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8" onClick={() => { setShowForm(false); resetForm(); }}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full relative animate-fade-in my-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{isEditing ? "✏️ Edit Request" : "➕ Add Request"}</h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-2 md:space-y-0">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Camera (opsional sampai status Success)</label>
                  <input name="id_camera" value={formData.id_camera} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Request</label>
                  <input type="date" name="tanggal_request" value={formData.tanggal_request} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pemasangan (opsional)</label>
                  <input type="date" name="tanggal_pemasangan" value={formData.tanggal_pemasangan} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                  <select name="lokasi" value={formData.lokasi} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" required>
                    <option value="">Pilih Lokasi</option>
                    {locations.map((loc, i) => <option key={loc.id ?? i} value={loc.name ?? loc.nama ?? loc}>{loc.name ?? loc.nama ?? loc}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Detail</label>
                  <input name="lokasi_detail" value={formData.lokasi_detail} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="Request">Request</option>
                    <option value="Success">Success</option>
                  </select>
                </div>

                {/* input_database removed from form intentionally */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress Days</label>
                  <input name="progress_days" value={formData.progress_days} onChange={handleChange} type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                  <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} rows="3" className="w-full border border-gray-300 rounded-md px-3 py-2" />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300">❌ Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">{isEditing ? "💾 Save Changes" : "➕ Add Request"}</button>
                </div>
              </form>

              <button onClick={() => { setShowForm(false); resetForm(); }} className="absolute top-4 right-4 text-gray-600 text-2xl font-bold">&times;</button>
            </div>
          </div>
        )}
      </section>

      {/* Table + Filters */}
      <section className="p-4 mt-12">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
          <input type="text" placeholder="🔍 Search (id camera, lokasi, keterangan, status)..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full md:w-1/3 mb-2 md:mb-0 px-4 py-2 border border-gray-300 rounded-md" />

          {/* Date range filter UI */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Start</label>
            <input type="date" value={tempFilterStart} onChange={(e) => setTempFilterStart(e.target.value)} className="border rounded px-2 py-1" />
            <label className="text-sm text-gray-700">End</label>
            <input type="date" value={tempFilterEnd} onChange={(e) => setTempFilterEnd(e.target.value)} className="border rounded px-2 py-1" />
            <button onClick={applyDateFilter} className="px-3 py-1 rounded bg-indigo-600 text-white">Apply</button>
            <button onClick={clearDateFilter} className="px-3 py-1 rounded bg-gray-200">Clear</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">ID Camera</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tanggal Request</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tanggal Pemasangan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Lokasi</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Progress (hari)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Input DB</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Keterangan</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200">
              {paginated.length > 0 ? paginated.map((r, idx) => (
                <tr key={r.internal_id ?? r.id_camera ?? idx} className="hover:bg-gray-100/50">
                  <td className="px-6 py-4 text-sm">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="px-6 py-4 text-sm">{r.id_camera || "-"}</td>
                  <td className="px-6 py-4 text-sm">{r.tanggal_request ? parseToDisplayDate(r.tanggal_request) : "-"}</td>
                  <td className="px-6 py-4 text-sm">{r.tanggal_pemasangan ? parseToDisplayDate(r.tanggal_pemasangan) : "-"}</td>
                  <td className="px-6 py-4 text-sm">{r.lokasi || "-"}</td>
                  <td className="px-6 py-4 text-sm">{r.progress_days ?? "-"}</td>

                  {/* Status badge: red for Request, green for Success */}
                  <td className="px-6 py-4 text-sm">
                    {r.status === "Success" ? (
                      <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-sm font-semibold">Success</span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 text-sm font-semibold">Request</span>
                    )}
                  </td>

                  {/* Input DB: inline editor (uses internal id) */}
                  <td className="px-6 py-4 text-sm">
                    {editingInputDbId === r.internal_id ? (
                      <div className="flex items-center gap-2">
                        <select value={editingInputDbValue} onChange={(e) => setEditingInputDbValue(e.target.value)} className="border rounded px-2 py-1 text-sm">
                          <option value="">(kosong)</option>
                          <option value="Belum Terinput">Belum Terinput</option>
                          <option value="Terinput">Terinput</option>
                        </select>
                        <button onClick={() => saveInputDb(r.internal_id)} className="px-2 py-1 rounded bg-green-500 text-white text-sm">Save</button>
                        <button onClick={cancelInputDbEditor} className="px-2 py-1 rounded bg-gray-200 text-sm">Cancel</button>
                      </div>
                    ) : (
                      <>
                        {r.input_database === "Terinput" ? (
                          <span className="inline-block px-2 py-1 rounded bg-green-50 text-green-800 text-sm font-medium">Terinput</span>
                        ) : (
                          <button onClick={() => openInputDbEditor(r.internal_id, r.input_database)} className="px-3 py-1 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-sm">Input DB</button>
                        )}
                      </>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm">{r.keterangan || "-"}</td>
                  <td className="px-6 py-4 text-sm text-center space-x-2">
                    <button
                      onClick={() => handleEdit(r)}
                      className={`px-3 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white ${r.status === "Success" ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      disabled={r.status === "Success"}
                      title={r.status === "Success" ? "Tidak bisa diedit (status Success)" : "Edit"}
                    >
                      ✏️
                    </button>

                    {/* === TOMBOL DELETE HANYA MUNCUL JIKA id_camera ADA === */}
                    {r.id_camera ? (
                      <button
                        onClick={() => handleDelete(r.internal_id)}
                        className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                      >
                        🗑️
                      </button>
                    ) : null}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="10" className="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        {pageCount > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">Displaying {paginated.length} of {filtered.length} items {filterStart || filterEnd ? ` (filtered ${filterStart || "—"} → ${filterEnd || "—"})` : ""}</p>
            <div className="space-x-2">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-200">⬅️ Previous</button>
              <span className="text-sm">Page {currentPage} of {pageCount}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))} disabled={currentPage === pageCount} className="px-3 py-1 rounded-md bg-gray-200">Next ➡️</button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
