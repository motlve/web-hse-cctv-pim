import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import ChartDataLabels from "chartjs-plugin-datalabels";
import Select from "react-select";


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

import CostumeDatePicker from "../components/CostumeDatePicker";




ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels,
);

export default function ListTroubleCamera() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [troubleList, setTroubleList] = useState([]);
  const [officerList, setOfficerList] = useState([]);
  const [cameraList, setCameraList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [showKeteranganPopup, setShowKeteranganPopup] = useState(false);
  const [tempKeterangan, setTempKeterangan] = useState("");


  const [formData, setFormData] = useState({
    id_camera: "",
    lokasi: "",
    lokasi_detail: "",
    status: "",
    start_error: "",
    request_perbaikan: "",
    selesai_perbaikan: "",
    durasi_error: "00:00:00",   // ✅ BARU
    response_time: "00:00:00",
    average_response: "00:00:00",
    petugas: "",
    keterangan: "",
  });

  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);
  /* ---------------- Slider state + helpers for 5 charts ---------------- */
  const totalSlides = 5;
  const sliderRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);

  const cameraOptions = cameraList.map(cam => ({
    value: cam.id_camera,
    label: cam.id_camera,
    camera: cam, // simpan data lengkap kalau perlu
  }));




  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setActiveSlide(prev => Math.min(prev + 1, totalSlides - 1));
      if (e.key === "ArrowLeft") setActiveSlide(prev => Math.max(prev - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) setActiveSlide(prev => Math.min(prev + 1, totalSlides - 1));
    else if (diff < -threshold) setActiveSlide(prev => Math.max(prev - 1, 0));
  };
  const goTo = (i) => setActiveSlide(Math.max(0, Math.min(i, totalSlides - 1)));


  const formatToIndoDateTime = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00Z") return "00/00/0000 00:00:00";

    const date = new Date(dateString);
    if (isNaN(date)) return "00/00/0000 00:00:00";

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");

    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  };



  // Fungsi bantu: konversi HH:MM:SS ke detik
  const timeToSeconds = (time) => {
    if (!time || time === "00:00:00") return 0;
    const [h, m, s] = time.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  // Fungsi bantu: konversi detik ke HH:MM:SS
  const secondsToTime = (sec) => {
    if (!sec || sec <= 0) return "00:00:00";

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);

    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Ubah dari "HH:MM:SS" jadi detik
  function hhmmssToSeconds(hhmmss) {
    if (!hhmmss) return 0;
    const parts = hhmmss.split(":").map(Number);
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return h * 3600 + m * 60 + s;
    } else if (parts.length === 2) {
      const [m, s] = parts;
      return m * 60 + s;
    } else if (parts.length === 1) {
      return Number(parts[0]) || 0;
    }
    return 0;
  }

  // Ubah dari detik jadi "HH:MM:SS"
  function secondsToHhmmss(sec) {
    if (!sec || isNaN(sec)) return "00:00:00";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(":");
  }

  // Fungsi utama untuk rata-rata
  const calculateAverageResponse = (data) => {
    const validTimes = data
      .map((item) => timeToSeconds(item.response_time))
      .filter((sec) => sec > 0);

    if (validTimes.length === 0) return "00:00:00";

    const avgSec = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    return secondsToTime(Math.round(avgSec));
  };


  const fetchTroubleList = async () => {
    try {
      const res = await axios.get("http://localhost:8081/api/list-camera-trouble");
      const raw = Array.isArray(res.data) ? res.data : (res.data.data || []);

      // helper safe parse ISO-ish string to Date
      const toDate = (v) => {
        if (!v) return null;
        const d = new Date(v);
        return isNaN(d) ? null : d;
      };

      const diffSeconds = (a, b) => {
        const A = toDate(a);
        const B = toDate(b);
        if (!A || !B) return 0;
        return Math.max(0, Math.floor((B - A) / 1000));
      };

      const secondsToHH = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      };

      // enrich setiap record dengan durasi_error (selisih start -> selesai)
      // dan response_time (selisih request -> selesai) — definisi bisa disesuaikan
      const enriched = raw.map(item => {
        const durSec = diffSeconds(item.start_error, item.selesai_perbaikan);
        const respSec = diffSeconds(item.request_perbaikan, item.selesai_perbaikan);
        return {
          ...item,
          durasi_error: secondsToHH(durSec),
          __durasi_error_seconds: durSec,    // helper internal numeric untuk chart
          response_time: item.response_time && item.response_time !== "00:00:00"
            ? item.response_time
            : secondsToHH(respSec),          // fallback jika backend belum isi response_time
          __response_time_seconds: respSec,  // helper numeric
        };
      });

      setTroubleList(enriched);

      // update average_response di formData (global, dari seluruh data)
      const validRespSecs = enriched.map(it => it.__response_time_seconds || 0).filter(s => s > 0);
      if (validRespSecs.length > 0) {
        const avg = Math.floor(validRespSecs.reduce((a, b) => a + b, 0) / validRespSecs.length);
        setFormData(prev => ({ ...prev, average_response: secondsToHH(avg) }));
      } else {
        setFormData(prev => ({ ...prev, average_response: "00:00:00" }));
      }
    } catch (err) {
      console.error(err);
    }
  };/*  */

  function calculateDuration(start, end) {
    if (!start) return "00:00:00";

    const startTime = new Date(start);

    // Jika belum selesai perbaikan → tampilkan "00:00:00"
    if (!end || end === "00/00/0000" || end === "0000-00-00" || isNaN(new Date(end))) {
      return "00:00:00";
    }

    const endTime = new Date(end);
    if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
      return "00:00:00";
    }

    const diffMs = endTime - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }


  // ======================= RESPONSE TIME =======================
  function calculateResponseTime(startError, requestRepair) {
    if (!startError || !requestRepair) return "00:00:00";

    const startTime = new Date(startError);
    const requestTime = new Date(requestRepair);

    // Jika tanggal request invalid atau sebelum error terjadi → 00:00:00
    if (isNaN(startTime) || isNaN(requestTime) || requestTime <= startTime) {
      return "00:00:00";
    }

    const diffMs = requestTime - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }




  const fetchCameraList = async () => {
    try {
      const response = await axios.get("http://localhost:8081/api/id-cctv");
      setCameraList(response.data || []);
    } catch (error) {
      console.error("Error fetching camera list:", error);
      alert("Failed to fetch camera list.");
    }
  };

  const fetchOfficerList = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get("http://localhost:8081/api/officer", {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });
      setOfficerList(response.data || []);
    } catch (error) {
      console.error("Error fetching officer list:", error);
      alert("Failed to fetch officer list.");
    }
  };

  const fetchLocationList = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get("http://localhost:8081/api/location", {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });
      setLocationList(response.data || []);
    } catch (error) {
      console.error("Error fetching location list:", error);
      alert("Failed to fetch location list.");
    }
  };

  useEffect(() => {
    document.documentElement.lang = "id";
    fetchTroubleList();
    fetchCameraList();
    fetchOfficerList();
    fetchLocationList();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // helper: validasi HH:MM:SS
    const isValidHhMmSs = (s) => {
      if (!s) return false;
      return /^\d{1,2}:[0-5]\d:[0-5]\d$/.test(s);
    };

    // helper: jika date string kosong -> null, else toISOString()
    const formatDateTime = (value) => {
      if (!value || value === "" || value === "0001-01-01T00:00:00Z") return null;
      const d = new Date(value);
      if (isNaN(d)) return null;
      return d.toISOString();
    };

    // validasi response_time supaya backend tidak kebingungan
    if (!isValidHhMmSs(formData.response_time)) {
      alert("Format Response Time harus HH:MM:SS, contoh 00:05:30");
      return;
    }

    // Pastikan average_response terkirim (pakai formData atau computed fallback)
    const fallbackAverage = calculateAverageResponse(troubleList || []);
    const avgToSend = formData.average_response && formData.average_response !== ""
      ? formData.average_response
      : fallbackAverage || "00:00:00";

    // Build payload: always include average_response; kosongkan tanggal -> null
    const payload = {
      id_camera: formData.id_camera || undefined,
      lokasi: formData.lokasi || undefined,
      lokasi_detail: formData.lokasi_detail || undefined,
      start_error: formatDateTime(formData.start_error),
      request_perbaikan: formatDateTime(formData.request_perbaikan),
      selesai_perbaikan: formatDateTime(formData.selesai_perbaikan),
      durasi_error: formData.durasi_error || "00:00:00",  // ✅ baru
      response_time: formData.response_time || "00:00:00",
      average_response: avgToSend,
      petugas: formData.petugas || undefined,
      keterangan: formData.keterangan || undefined,
    };


    // Hapus property undefined agar payload lebih bersih (jika ingin)
    Object.keys(payload).forEach(k => {
      if (payload[k] === undefined) delete payload[k];
    });

    const method = isEditing ? "put" : "post";
    const url = isEditing
      ? `http://localhost:8081/api/list-camera-trouble/${encodeURIComponent(editId)}`
      : "http://localhost:8081/api/list-camera-trouble";

    try {
      console.log("🔁 Sending payload:", payload);
      const resp = await axios({
        method,
        url,
        headers: { "Content-Type": "application/json" },
        data: payload,
      });

      console.log("✅ Save response:", resp.status, resp.data);
      alert("Data berhasil disimpan!");
      fetchTroubleList();
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setFormData({
        id_camera: "",
        lokasi: "",
        lokasi_detail: "",
        status: "",
        start_error: "",
        request_perbaikan: "",
        selesai_perbaikan: "",
        response_time: "00:00:00",
        average_response: "00:00:00",
        petugas: "",
        keterangan: "",
      });
    } catch (error) {
      console.error("Error saving data:", error);

      // tampilkan detail error dari server bila ada
      if (error.response) {
        console.error("Server status:", error.response.status);
        console.error("Server response data:", error.response.data);
        let serverMsg = typeof error.response.data === "string"
          ? error.response.data
          : JSON.stringify(error.response.data);
        alert(`Gagal menyimpan (status ${error.response.status}):\n${serverMsg}`);
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("Gagal menyimpan: tidak ada response dari server (cek server atau network).");
      } else {
        console.error("Axios error:", error.message);
        alert(`Gagal menyimpan: ${error.message}`);
      }
    }
  };



  const handleEdit = (item) => {
    // Fungsi bantu untuk ubah format ISO ke 'YYYY-MM-DDTHH:mm' biar bisa dipakai di input datetime-local
    const formatForInput = (dateStr) => {
      if (!dateStr || dateStr === "0001-01-01T00:00:00Z") return ""; // skip kalau kosong
      const date = new Date(dateStr);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };

    // Set formData berdasarkan data lama
    setFormData({
      id_camera: item.id_camera || "",
      lokasi: item.lokasi || "",
      lokasi_detail: item.lokasi_detail || "",
      status: item.status || "",
      start_error: formatForInput(item.start_error),
      request_perbaikan: formatForInput(item.request_perbaikan),
      selesai_perbaikan: formatForInput(item.selesai_perbaikan),
      response_time: item.response_time || "00:00:00",
      average_response: item.average_response || "00:00:00",
      petugas: item.petugas || "",
      keterangan: item.keterangan || "",
    });

    setIsEditing(true);
    setEditId(item.id_camera);
    setShowForm(true);
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      // Gunakan id kolom unik, bukan id_camera
      await axios.delete(`http://localhost:8081/api/list-camera-trouble/${id}`);
      window.alert("Data berhasil dihapus!"); // window alert untuk feedback
      fetchTroubleList(); // refresh data setelah delete
    } catch (error) {
      console.error("Error deleting data:", error);
      window.alert("Gagal menghapus data."); // window alert untuk error
    }
  };

  const filteredTroubleList = troubleList.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const pageCount = Math.ceil(filteredTroubleList.length / itemsPerPage);
  const paginatedTroubleList = filteredTroubleList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* Chart options shared (integer formatting, tooltip) */
  const chartOptionsCameraBar = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: "index",
      intersect: false,
    },

    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#2f2f2f",
          font: { size: 12, weight: "600" },
          boxWidth: 10,
          padding: 10,
        },
      },

      tooltip: {
        backgroundColor: "rgba(255,255,255,0.98)",
        titleColor: "#111",
        bodyColor: "#222",
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        displayColors: true,
        callbacks: {
          label: (ctx) => `📷 Error: ${ctx.raw}`,
        },
      },
    },

    scales: {
      x: {
        ticks: {
          color: "#444",
          font: { size: 11, weight: "500" },
        },
        grid: { display: false },
      },

      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: "Jumlah Error",
          color: "#475569",
          font: { size: 13, weight: "600" },
          padding: { bottom: 6 },
        },
        ticks: {
          color: "#475569",
          font: { size: 12 },
          stepSize: 10,               // naik tiap 10
          callback: (value) => value, // tampilkan angka bulat
        },
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
      },

    },
  };

  /* ====== Chart data builders (use filteredTroubleList to reflect search/pagination filter) ====== */

  // Slide 1: summary
  const getSummary = () => {
    const total = troubleList.length; // Total semua kasus dari Slide 2–5

    const locCount = {};
    troubleList.forEach(it =>
      locCount[it.lokasi || "Unknown"] = (locCount[it.lokasi] || 0) + 1
    ); // Hitung jumlah kasus per lokasi (Slide 2 & 3)

    const sorted = Object.entries(locCount).sort((a, b) => b[1] - a[1]);
    const topLoc = sorted[0] || ["-", 0]; // Lokasi dengan kasus terbanyak (Slide 2 & 3)

    return { total, topLoc, locCount };
  };

  const summary = getSummary();// untuk animasi menghitung total

  useEffect(() => {
    let start = 0;
    const end = summary.total;
    if (!end) return;

    const stepTime = Math.max(Math.floor(1000 / end), 1); // durasi animasi 1 detik
    const timer = setInterval(() => {
      start += 1;
      // eslint-disable-next-line no-undef
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [summary.total]);

  const getBarByCamera = () => {
    const counts = {};
    (filteredTroubleList || troubleList || []).forEach((it) => {
      const cam = it.id_camera || "Unknown";
      counts[cam] = (counts[cam] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    const labels = entries.map((e) => e[0]);
    const data = entries.map((e) => e[1]);

    const colors = labels.map((_, i) => `hsl(${(i * 55) % 360} 65% 55%)`);

    return {
      labels,
      datasets: [
        {
          label: "Jumlah Error per ID Camera",
          data,
          backgroundColor: colors,
          borderColor: "#fff",
          borderWidth: 1,
        },
      ],
    };
  };




  const getCompareErrorDuration = () => {
    const map = {};

    filteredTroubleList.forEach(it => {
      const cam = it.id_camera || "Unknown";

      if (!map[cam]) {
        map[cam] = {
          totalError: 0,
          totalResponse: 0,
          responseCount: 0,
        };
      }

      const durasi = hhmmssToSeconds(it.durasi_error);
      const response = hhmmssToSeconds(it.response_time);

      if (durasi > 0) map[cam].totalError += durasi;
      if (response > 0) {
        map[cam].totalResponse += response;
        map[cam].responseCount += 1;
      }
    });

    const labels = Object.keys(map);

    const totalError = labels.map(k => map[k].totalError);
    const totalResponse = labels.map(k => map[k].totalResponse);
    const avgResponse = labels.map(k =>
      map[k].responseCount
        ? map[k].totalResponse / map[k].responseCount
        : 0
    );

    return {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Total Durasi Error",
          data: totalError,
          backgroundColor: "rgba(239,68,68,0.8)",
          yAxisID: "yError",
        },
        {
          type: "bar",
          label: "Total Response Time",
          data: totalResponse,
          backgroundColor: "rgba(16,185,129,0.8)",
          yAxisID: "yResponse",
        },
        {
          type: "line",
          label: "Rata-rata Response",
          data: avgResponse,
          borderColor: "rgba(37,99,235,1)",
          borderDash: [6, 6],
          yAxisID: "yResponse",
          tension: 0.4,
          pointRadius: 4,
        },
      ],
    };
  };



  const compareOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },

    plugins: {
      legend: { position: "bottom" },

      // ✅ datalabels hanya untuk LINE
      datalabels: {
        display: (ctx) => ctx.dataset.type === "line",
        color: "#000",
        anchor: "end",
        align: "end",
        offset: 4,
        font: { size: 10, weight: "600" },
        formatter: (value) => secondsToHhmmss(Math.round(value)),
      },

      // ✅ tooltip harus DI SINI
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw ?? ctx.parsed?.y ?? 0;
            const formatted = secondsToHhmmss(Math.round(val));

            if (ctx.dataset.label.includes("Durasi"))
              return `🔴 ${ctx.dataset.label}: ${formatted}`;

            if (ctx.dataset.label.includes("Response"))
              return `🟢 ${ctx.dataset.label}: ${formatted}`;

            return `${ctx.dataset.label}: ${formatted}`;
          },
        },
      },
    },

    scales: {
      yError: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        ticks: {
          callback: (v) => secondsToHhmmss(Math.round(v)),
        },
        title: {
          display: true,
          text: "Total Durasi Error (hh:mm:ss)",
        },
      },

      yResponse: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: {
          callback: (v) => secondsToHhmmss(Math.round(v)),
        },
        title: {
          display: true,
          text: "Total Response Time (hh:mm:ss)",
        },
      },
    },
  };


  const getStatusHighlight = (status) => {
    switch (status) {
      case "Request Perbaikan":
        return "bg-orange-100 text-orange-700";

      case "Error":
        return "bg-red-100 text-red-700";

      case "Selesai Perbaikan":
      case "Selesai Perbaikan/On Kembali":
        return "bg-green-100 text-green-700";

      case "Kamera Dilepas":
        return "bg-red-200 text-red-800";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  return (
    <>
      <Layout>
        {/* ====== TROUBLE CAMERA DASHBOARD ====== */}
        <section className="p-4 w-full max-w-7xl mx-auto mt-6 flex flex-col gap-6">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 shadow-xl w-full min-h-[400px] md:h-[560px] relative overflow-hidden">

            {/* ====== Header + Navigation ====== */}
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-base md:text-xl font-semibold text-gray-800">
                📊 Trouble Camera Dashboard
              </h2>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 hidden md:block">
                  Slide {activeSlide + 1} / {totalSlides}
                </div>
                <button
                  onClick={() => goTo(activeSlide - 1)}
                  disabled={activeSlide === 0}
                  className="px-2 md:px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-xs md:text-sm disabled:opacity-50"
                >
                  ⬅️
                </button>
                <button
                  onClick={() => goTo(activeSlide + 1)}
                  disabled={activeSlide === totalSlides - 1}
                  className="px-2 md:px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-xs md:text-sm disabled:opacity-50"
                >
                  ➡️
                </button>
              </div>
            </div>

            {/* ====== SLIDER (gesture support) ====== */}
            <div
              ref={sliderRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full h-[460px] relative"
              style={{ touchAction: "pan-y" }}
            >
              <div
                className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >

                {/* === Slide 1: Summary Overview === */}
                <div className="flex-none w-full px-2 md:px-4">
                  <div className="h-full bg-white rounded-xl p-6 shadow-sm flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">📋 Ringkasan Trouble</h3>
                      <div className="text-sm text-gray-500 italic">
                        Auto-play aktif • navigasi ← →
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Left Column: 10 Lokasi Teratas Horizontal Bar */}
                      <div className="border rounded p-4 flex flex-col">
                        <h4 className="text-sm font-semibold mb-2">10 Lokasi Teratas</h4>
                        <div style={{ width: "100%", height: 300 }}>
                          <Bar
                            data={{
                              labels: Object.entries(summary.locCount)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 10)
                                .map(([loc]) => loc),
                              datasets: [{
                                label: "Jumlah Kasus",
                                data: Object.entries(summary.locCount)
                                  .sort((a, b) => b[1] - a[1])
                                  .slice(0, 10)
                                  .map(([, c]) => c),
                                backgroundColor: "#e53e3e"
                              }]
                            }}
                            options={{
                              indexAxis: "y", // Horizontal bar
                              responsive: true,
                              plugins: {
                                legend: { display: false },
                                tooltip: { enabled: true }
                              },
                              scales: {
                                x: { beginAtZero: true, ticks: { stepSize: 1 } },
                                y: { ticks: { autoSkip: false } }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Right Column: Top Lokasi */}
                      <div className="flex flex-col justify-center items-center border rounded p-4 h-full">
                        <div className="text-lg font-semibold">Top Lokasi</div>
                        <div className="mt-2 text-sm">
                          <strong>{summary.topLoc[0]}</strong> ({summary.topLoc[1]})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {/* === SLIDE 2: Area Chart per Lokasi === */}
                {/* === SLIDE 2: Jumlah Kasus per Lokasi === */}
                <div style={{ flex: "0 0 100%", padding: 12 }}>
                  <div className="h-full bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-md font-semibold mb-3">
                      📍 Jumlah Kasus per Lokasi
                    </h3>

                    <div style={{ height: "calc(100% - 1.2rem)", width: "100%" }}>
                      <Bar
                        data={(() => {
                          const counts = {};
                          filteredTroubleList.forEach(it => {
                            const loc = it.lokasi || "Tidak tersedia";
                            counts[loc] = (counts[loc] || 0) + 1;
                          });

                          return {
                            labels: Object.keys(counts),
                            datasets: [{
                              label: "Jumlah Kasus",
                              data: Object.values(counts),
                              backgroundColor: "rgba(59,130,246,0.7)",
                              borderRadius: 6,
                            }]
                          };
                        })()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { enabled: true },
                          },
                          scales: {
                            x: {
                              ticks: { color: "#475569" },
                              grid: { display: false }
                            },
                            y: {
                              beginAtZero: true,
                              ticks: { stepSize: 5, color: "#475569" }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                {/* === SLIDE 3: Bar per Kamera === */}
                <div style={{ flex: "0 0 100%", padding: 12 }}>
                  <div className="h-full bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-md font-semibold mb-3">
                      📷 Jumlah Trouble per Kamera
                    </h3>
                    <div style={{ height: "calc(100% - 1.2rem)", width: "100%" }}>
                      <Bar
                        data={getBarByCamera()}
                        options={{
                          ...chartOptionsCameraBar,
                          plugins: {
                            ...chartOptionsCameraBar.plugins,
                            legend: { position: "bottom" },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* === SLIDE 4: Pie Distribusi Error (all slices, legend right) === */}
                <div style={{ flex: "0 0 100%", padding: 12 }}>
                  <div className="h-full bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-md font-semibold mb-3">🥧 Rate Jumlah Error (by Filter)</h3>
                    <div style={{ height: 280, width: "100%" }}>
                      <Pie
                        data={getBarByCamera()}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: {
                              display: true,
                              position: "right",
                              align: "start",
                              labels: {
                                boxWidth: 10,
                                padding: 6,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                color: "#333",
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (ctx) => {
                                  const dataset = ctx.dataset;
                                  const total = dataset.data.reduce((a, b) => a + b, 0) || 1;
                                  const value = ctx.raw || 0;
                                  const pct = Math.round((value / total) * 10000) / 100;
                                  return `${ctx.label}: ${value} (${pct}%)`;
                                }
                              }
                            }
                          },
                          layout: {
                            padding: { left: 10, right: 10, top: 6, bottom: 6 }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>


                {/* === SLIDE 5: Perbandingan Error vs Durasi === */}
                <div style={{ flex: "0 0 100%", padding: 12 }}>
                  <div className="h-full bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="text-md font-semibold mb-3">
                      📈 Perbandingan Durasi Error vs Response Time
                    </h3>
                    <div style={{ height: "calc(100% - 1.2rem)", width: "100%" }}>
                      <Bar data={getCompareErrorDuration()} options={compareOptions} />
                    </div>
                  </div>xx
                </div>
              </div>
            </div>

            {/* ====== Navigasi Dots ====== */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-3 h-3 rounded-full ${i === activeSlide ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="p-4">
          <button
            onClick={() => {
              setShowForm(true);
              setIsEditing(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition"
          >
            ➕ Tambah Data Trouble Camera
          </button>

          {/* Form */}
          {showForm && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setShowForm(false)}
            >
              <div
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-6">
                  {isEditing ? "✏️ Edit Data Trouble Camera" : "➕ Tambah Data Trouble Camera"}
                </h2>

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* Select kamera */}
                  <div>
                    <label className="block text-sm font-medium mb-1">ID Camera</label>

                    <Select
                      options={cameraOptions}
                      placeholder="Cari ID Camera..."
                      isClearable
                      isSearchable
                      value={
                        cameraOptions.find(
                          opt => opt.value === formData.id_camera
                        ) || null
                      }
                      onChange={(selected) => {
                        setFormData(prev => ({
                          ...prev,
                          id_camera: selected ? selected.value : "",
                        }));
                      }}
                    />
                  </div>


                  {/* Lokasi */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Lokasi</label>
                    <select
                      name="lokasi"
                      value={formData.lokasi}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">--- Pilih Lokasi --</option>
                      {locationList.map((location, index) => (
                        <option key={`location-${index}-${location.id}`} value={location.name}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lokasi detail */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Lokasi Detail</label>
                    <input
                      type="text"
                      name="lokasi_detail"
                      value={formData.lokasi_detail}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <input
                      type="text"
                      name="status"
                      value={formData.status || ""}
                      readOnly
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                      placeholder="Otomatis oleh sistem"
                    />
                  </div>

                  {/* Date Pickers */}
                  <div className="space-y-4">
                    {["start_error", "request_perbaikan", "selesai_perbaikan"].map((key) => {
                      const labelMap = {
                        start_error: "Start Error",
                        request_perbaikan: "Request Perbaikan",
                        selesai_perbaikan: "Selesai Perbaikan",
                      };

                      return (
                        <div key={key} className="flex flex-col w-full">
                          <label className="block text-sm font-semibold mb-2">
                            {labelMap[key]}
                          </label>

                          <div className="w-full max-w-md">
                            <CostumeDatePicker
                              selectedDate={formData[key] ? new Date(formData[key]) : null}
                              onChange={(date) => {
                                const updated = { ...formData, [key]: date };

                                // Hitung durasi error
                                if (updated.start_error && updated.selesai_perbaikan) {
                                  updated.durasi_error = calculateDuration(
                                    updated.start_error,
                                    updated.selesai_perbaikan
                                  );
                                }

                                // Hitung response time
                                if (updated.request_perbaikan && updated.selesai_perbaikan) {
                                  updated.response_time = calculateResponseTime(
                                    updated.request_perbaikan,
                                    updated.selesai_perbaikan
                                  );
                                }

                                setFormData(updated);
                              }}
                              placeholder={`Pilih ${labelMap[key]}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Durasi & Response Time */}
                  {[
                    ["durasi_error", "Durasi Error (HH:MM:SS)"],
                    ["response_time", "Response Time (HH:MM:SS)"],
                  ].map(([key, label]) => (
                    <div key={key} className="mb-3">
                      <label className="block text-sm font-semibold mb-1">{label}</label>
                      <input
                        type="text"
                        name={key}
                        value={formData[key] || ""}
                        readOnly
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                      />
                    </div>
                  ))}

                  {/* Select Petugas */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Petugas</label>
                    <select
                      name="petugas"
                      value={formData.petugas}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">--- Pilih Petugas --</option>
                      {officerList.map((officer, index) => (
                        <option
                          key={`officer-${index}-${officer.name_officer}`}
                          value={officer.name_officer}
                        >
                          {officer.name_officer}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Keterangan */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Keterangan</label>
                    <input
                      type="text"
                      name="keterangan"
                      value={formData.keterangan}
                      readOnly
                      onClick={() => {
                        setTempKeterangan(formData.keterangan || "");
                        setShowKeteranganPopup(true);
                      }}
                      placeholder="Klik untuk menulis keterangan...."
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="md:col-span-2 flex justify-end mt-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      {isEditing ? "Simpan Perubahan" : "Tambah Data"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
        {/* ====== TABLE CAMERA TROUBLE (with Durasi Error) ====== */}
        <section className="p-4">
          {/* 🔍 Search Bar */}
          <input
            type="text"
            placeholder="🔍 Search Camera Trouble..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* ====== TABLE WRAPPER ====== */}
          <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 backdrop-blur-md">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-white/60">
                <tr>
                  {[
                    "No", "ID Camera", "Lokasi", "Lokasi Detail", "Status",
                    "Start Error", "Request Perbaikan", "Selesai Perbaikan",
                    "Durasi Error", "Response Time", "Petugas", "Keterangan", "Aksi"
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-sm font-semibold text-gray-700 uppercase tracking-wider text-left"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>



              <tbody className="bg-white/30 divide-y divide-gray-200">
                {paginatedTroubleList.length > 0 ? (

                  paginatedTroubleList.map((item, index) => {
                    return (
                      <tr key={`${currentPage}-${index}`}>
                        <td className="px-6 py-3 text-center font-medium">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-6 py-3">{item.id_camera}</td>
                        <td className="px-6 py-3">{item.lokasi}</td>
                        <td className="px-6 py-3">{item.lokasi_detail}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-1 text-sm font-medium rounded-sm ${getStatusHighlight(item.status)}`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="px-6 py-3">{formatToIndoDateTime(item.start_error)}</td>
                        <td className="px-6 py-3">{formatToIndoDateTime(item.request_perbaikan)}</td>
                        <td className="px-6 py-3">{formatToIndoDateTime(item.selesai_perbaikan)}</td>

                        {/* ===== Durasi Error (lengkap & warna) ===== */}
                        <td className="px-6 py-3 text-center">
                          {(() => {
                            // ambil date object bila ada
                            const start = item.start_error ? new Date(item.start_error) : null;
                            const selesai = item.selesai_perbaikan ? new Date(item.selesai_perbaikan) : null;

                            // fungsi pembantu lokal: cek apakah selesai valid
                            const selesaiValid = selesai && !isNaN(selesai) && selesai.getFullYear() >= 2000;
                            // hitung durasi memakai helper yang ada (akan return "00:00:00" bila invalid)
                            const durasi = calculateDuration(item.start_error, item.selesai_perbaikan);

                            // 1) Kalau start tidak ada -> tampilkan "00:00:00" merah (atau kamu bisa ganti '-')
                            if (!start || isNaN(start)) {
                              return (
                                <div>
                                  <span className="text-red-600 font-semibold">00:00:00</span>
                                  <div className="text-xs text-gray-500 mt-1">Start kosong</div>
                                </div>
                              );
                            }

                            // 2) Kalau selesai belum valid/terisi -> durasi 00:00:00 (MERAH) + label
                            if (!selesaiValid) {
                              return (
                                <div>
                                  <span className="text-red-600 font-semibold">00:00:00</span>
                                  <div className="text-xs text-gray-500 mt-1">Belum selesai</div>
                                </div>
                              );
                            }

                            // 3) Kalau selesai valid tapi durasi helper mengembalikan 00:00:00 -> kemungkinan selesai <= start -> tampil 'Tidak logis'
                            if (durasi === "00:00:00") {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="text-red-600 font-semibold">00:00:00</div>
                                  <div className="text-xs italic text-red-500 mt-1">Tidak logis</div>
                                </div>
                              );
                            }

                            // 4) Semua valid -> tampil durasi (biru tegas)
                            return <span className="text-blue-700 font-semibold">{durasi}</span>;
                          })()}
                        </td>

                        {/* ===== Response Time (lengkap & warna hijau kalau valid) ===== */}
                        <td className="px-6 py-3 text-center">
                          {(() => {
                            const request = item.request_perbaikan ? new Date(item.request_perbaikan) : null;
                            const selesai = item.selesai_perbaikan ? new Date(item.selesai_perbaikan) : null;

                            const requestValid = request && !isNaN(request);
                            const selesaiValid = selesai && !isNaN(selesai) && selesai.getFullYear() >= 2000;

                            // 1) Jika tidak ada request -> tunjukkan label abu-abu
                            if (!requestValid) {
                              // kalau selesai juga belum ada, tampilkan 00:00:00 merah (konsisten)
                              if (!selesaiValid) {
                                return (
                                  <div>
                                    <span className="text-red-600 font-semibold">00:00:00</span>
                                    <div className="text-xs text-gray-500 mt-1">Belum ada request</div>
                                  </div>
                                );
                              }
                              return <div className="text-gray-400 italic text-sm">Belum ada request</div>;
                            }

                            // 2) Kalau selesai belum ada -> response 00:00:00 (merah) + label "Belum selesai"
                            if (!selesaiValid) {
                              return (
                                <div>
                                  <span className="text-red-600 font-semibold">00:00:00</span>
                                  <div className="text-xs text-gray-500 mt-1">Belum selesai</div>
                                </div>
                              );
                            }

                            // 3) Kalau request > selesai -> tidak logis
                            if (request > selesai) {
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="text-red-600 font-semibold">❌</div>
                                  <div className="text-xs italic text-red-500">Tidak logis</div>
                                </div>
                              );
                            }

                            // 4) Semua valid -> hitung response (pakai helper) dan tampil hijau
                            const response = calculateResponseTime(item.request_perbaikan, item.selesai_perbaikan);
                            if (!response || response === "00:00:00") {
                              // fallback safety: kalau helper balikan 00:00:00 (mis. sama waktu) tunjukkan merah
                              return (
                                <div>
                                  <span className="text-red-600 font-semibold">00:00:00</span>
                                </div>
                              );
                            }
                            return <span className="text-green-600 font-semibold">{response}</span>;
                          })()}
                        </td>



                        <td className="px-6 py-3 text-center">{item.petugas}</td>
                        <td className="px-6 py-3 text-center">{item.keterangan}</td>

                        {/* ====== ACTION BUTTONS ====== */}
                        <td className="px-6 py-3 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {/* ✏️ Edit Button */}
                            <button
                              onClick={() => handleEdit(item)}
                              className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-md w-full"
                            >
                              ✏️ Edit
                            </button>

                            {/* 🗑️ Delete Button */}
                            <button
                              onClick={() => handleDelete(item.id_camera)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md w-full"
                            >
                              🗑️ Hapus
                            </button>

                            {/* 📷 Lepas Button */}
                            {item.status !== "Kamera Dilepas" && (
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem("token");
                                    const payload = { ...item, status: "Kamera Dilepas" };

                                    await axios.put(
                                      `http://localhost:8081/api/list-camera-trouble/${encodeURIComponent(item.id_camera)}`,
                                      payload,
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );

                                    alert("✅ Kamera berhasil dilepas!");
                                    fetchTroubleList();
                                  } catch (error) {
                                    console.error("❌ Gagal update:", error.response?.data || error.message);
                                    alert("Gagal melepas kamera.");
                                  }
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md w-full"
                              >
                                📷 Lepas
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={14} className="text-gray-500 py-3 text-center">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>

              {/* ====== FOOTER RATA-RATA ====== */}
              <tfoot className="bg-gray-100">
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-3 text-right font-semibold text-gray-700"
                  >
                    Average Response Time:
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">
                    {calculateAverageResponse(paginatedTroubleList)}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex justify-between mt-4">
              <p className="text-sm text-gray-600">
                Melihat halaman {paginatedTroubleList.length} dari {filteredTroubleList.length} data
              </p>
              <div className="space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  ⬅️ Sebelumnya
                </button>
                <span className="text-sm text-gray-700">
                  Halaman {currentPage} dari {pageCount}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                  disabled={currentPage === pageCount}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Selanjutnya ➡️
                </button>
              </div>
            </div>
          )}
        </section>
      </Layout>

      {/* Keterangan Popup */}
      {showKeteranganPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => setShowKeteranganPopup(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4">✏️ Tulis Keterangan</h3>

            <textarea
              value={tempKeterangan}
              onChange={(e) => setTempKeterangan(e.target.value)}
              placeholder="Tuliskan detail keterangan disini..."
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setShowKeteranganPopup(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setFormData((prevData) => ({ ...prevData, keterangan: tempKeterangan }));
                  setShowKeteranganPopup(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}