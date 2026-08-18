import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { appleSwal } from '../utils/appleSwal';
import { FiEdit2, FiTrash2, FiSlash } from 'react-icons/fi';

import DataLokasi from './DataLocation';
import api from '../api/axios';
import InlineDatePicker from '../components/InlineDate';
import MonitoringCalendar from '../components/Calander';

import {
  FiMapPin,
  FiMap,
  FiAlertCircle,
  FiAlertTriangle,
  FiPercent,
  FiTrendingUp,
  FiActivity,
  FiX,
  FiCamera,
  FiCheckCircle,
  FiXCircle,
  FiPauseCircle,
  FiPieChart,
  FiAward,
  FiZap,
  FiCheck,
  FiCalendar,
} from 'react-icons/fi';

import { FiPlusCircle } from 'react-icons/fi';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export default function CCTVIdRecord() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [useManualId, setUseManualId] = useState(false);

  const [cctvList, setCctvList] = useState([]);
  const [areaList, setAreaList] = useState([]);
  const [cameraTroubleList, setCameraTroubleList] = useState([]);
  const [showCameraAnalysis, setShowCameraAnalysis] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const role = localStorage.getItem('role');

  const canManage = role === 'Admin' || role === 'Manager HSE' || role === 'Petugas HSE';

  const [formData, setFormData] = useState({
    id_camera: '',
    id_nvr: '',
    lokasi: '',
    area: '',
    kondisi: '',
    jumlah_error: 0,
    jumlah_request: 0,
    jumlah_on_kembali: 0,
    jumlah_durasi_error: '00:00:00',
    average_durasi_x_error: '00:00:00',
  });

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  /* ===================== Responsif Container Tombol Tambah ===================== */
  const addBtnHeaderRef = useRef(null);
  const [showAddBtnText, setShowAddBtnText] = useState(true);

  useEffect(() => {
    const el = addBtnHeaderRef.current;
    if (!el) return;

    const THRESHOLD = 380; // px lebar container, di bawah ini teks disembunyikan

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setShowAddBtnText(width >= THRESHOLD);
      }
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  /* ===================== Responsif Container Tombol Kalender ===================== */
  const calendarCardRef = useRef(null);
  const [showCalendarText, setShowCalendarText] = useState(true);

  useEffect(() => {
    const el = calendarCardRef.current;
    if (!el) return;

    const THRESHOLD = 260; // px lebar container, di bawah ini teks disembunyikan

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setShowCalendarText(width >= THRESHOLD);
      }
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  /* ===================== Helper ===================== */

  const secondsToHHMMSS = (totalSec = 0) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(
      2,
      '0'
    )}:${String(s).padStart(2, '0')}`;
  };

  /* ===================== Pengambilan Data ===================== */
  const fetchArea = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('Token tidak ditemukan');
        setAreaList([]);
        return;
      }

      const res = await api.get('/location', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Respon Area:', res.data);

      const data = res.data.data ?? res.data ?? [];

      console.log('Daftar Area:', data);

      setAreaList(data);
    } catch (err) {
      console.error('Gagal mengambil area:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        appleSwal({
          icon: 'warning',
          title: 'Sesi Berakhir',
          text: 'Silakan login kembali',
        }).then(() => {
          window.location.href = '/login';
        });

        return;
      }

      setAreaList([]);
    }
  };

  const fetchCCTVs = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get('/id-cctv', {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

      setCctvList(data);

      return data;
    } catch (err) {
      console.error('GAGAL MENGAMBIL CCTV:', err.response?.data || err.message);

      setCctvList([]);

      return [];
    }
  };

  const [availableRequestIds, setAvailableRequestIds] = useState([]);
  const [requestCameraList, setRequestCameraList] = useState([]);

  const fetchRequestCameraIds = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await api.get(`/summary-request-camera/uninput`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];

      // simpan data request yang belum terinput
      setRequestCameraList(data);

      // ambil ID camera saja
      const ids = data.map((item) => item.id_camera || item.IDCamera).filter(Boolean);

      setAvailableRequestIds(ids);
    } catch (error) {
      console.error('Gagal mengambil request camera:', error);

      setAvailableRequestIds([]);
      setRequestCameraList([]);
    }
  };

  const fetchCameraTrouble = async (cctvData = []) => {
    try {
      const token = localStorage.getItem('token');

      const res = await api.get(`/list-camera-trouble`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const payload = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);

      const normalized = payload.map((r) => {
        const camera = cctvData.find(
          (c) =>
            String(c.id_camera).trim().toUpperCase() ===
            String(r.id_camera ?? r.IDCamera)
              .trim()
              .toUpperCase()
        );

        return {
          id_camera: r.id_camera ?? r.IDCamera,

          lokasi: camera?.lokasi || r.lokasi || r.Lokasi || 'Tidak diketahui',

          area: camera?.area || r.area || r.Area || 'Tidak diketahui',

          start_error: r.start_error ?? r.StartError ?? '',

          request_perbaikan: r.request_perbaikan ?? r.RequestPerbaikan ?? '',

          selesai_perbaikan: r.selesai_perbaikan ?? r.SelesaiPerbaikan ?? '',
        };
      });

      console.log('Data gangguan ternormalisasi:', normalized);

      setCameraTroubleList(normalized);
    } catch (err) {
      console.error(err);

      setCameraTroubleList([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const cameras = await fetchCCTVs();

        await fetchCameraTrouble(cameras);

        await fetchArea();

        await fetchRequestCameraIds();
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, []);

  /* ===================== Submit ===================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // =====================================
  // PILIH REQUEST CAMERA
  // =====================================

  const handleSelectCameraRequest = (e) => {
    const id = e.target.value;

    const selected = requestCameraList.find(
      (item) => String(item.id_camera || item.IDCamera).trim() === String(id).trim()
    );

    setFormData((prev) => ({
      ...prev,
      id_camera: id,
      id_nvr: selected?.id_nvr || selected?.IDNVR || '',
      lokasi: selected?.lokasi || selected?.Lokasi || '',
      area: selected?.area || selected?.Area || '',
    }));
  };

  // =====================================
  // SUBMIT CCTV
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    if (!token) {
      toast.error('Sesi login habis, silakan login kembali.');
      return;
    }

    // ===============================
    // VALIDASI
    // ===============================

    const requiredFields = [
      { value: formData.id_camera, name: 'ID Kamera' },
      { value: formData.id_nvr, name: 'ID NVR' },
      { value: formData.lokasi, name: 'Lokasi' },
      { value: formData.area, name: 'Area' },
    ];

    const emptyField = requiredFields.find(
      (item) => !item.value || String(item.value).trim() === ''
    );

    if (emptyField) {
      toast.error(`${emptyField.name} wajib diisi`);
      return;
    }

    // ===============================
    // CEK DUPLIKAT
    // ===============================

    const duplicate = cctvList.some(
      (c) =>
        String(c.id_camera).trim().toUpperCase() ===
          String(formData.id_camera).trim().toUpperCase() && c.id !== editId
    );

    if (duplicate) {
      toast.error('ID Kamera sudah terdaftar');
      return;
    }

    // ===============================
    // STATUS OTOMATIS
    // ===============================

    let kondisi = formData.kondisi;

    const jumlahError = Number(formData.jumlah_error) || 0;
    const jumlahOnKembali = Number(formData.jumlah_on_kembali) || 0;

    if (kondisi !== 'DILEPAS') {
      if (jumlahError === jumlahOnKembali) {
        kondisi = 'ON';
      } else if (jumlahError > jumlahOnKembali) {
        kondisi = 'OFF';
      }
    }

    // ===============================
    // KONFIRMASI
    // ===============================

    const confirm = await appleSwal({
      title: isEditing ? 'Update Data CCTV?' : 'Tambah CCTV Baru?',

      html: `
        <div style="text-align:left">
          <p><b>ID Kamera:</b> ${formData.id_camera}</p>
          <p><b>ID NVR:</b> ${formData.id_nvr}</p>
          <p><b>Lokasi:</b> ${formData.lokasi}</p>
          <p><b>Area:</b> ${formData.area}</p>
          <p><b>Kondisi:</b> ${kondisi}</p>
        </div>
      `,

      icon: 'question',

      showCancelButton: true,

      confirmButtonText: isEditing ? 'Update' : 'Simpan',

      cancelButtonText: 'Batal',

      confirmButtonColor: '#2563eb',

      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    // ===============================
    // PAYLOAD
    // ===============================

    const payload = {
      id_camera: formData.id_camera,
      id_nvr: formData.id_nvr,
      lokasi: formData.lokasi,
      area: formData.area,
      kondisi,
      jumlah_error: jumlahError,
      jumlah_request: Number(formData.jumlah_request) || 0,
      jumlah_on_kembali: jumlahOnKembali,
      jumlah_durasi_error: formData.jumlah_durasi_error || '00:00:00',
      average_durasi_x_error: formData.average_durasi_x_error || '00:00:00',
    };

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/id-cctv/${editId}` : '/id-cctv';

      await api({
        method,
        url,
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      toast.success(isEditing ? 'CCTV berhasil diperbarui' : 'CCTV berhasil ditambahkan');

      const cameras = await fetchCCTVs();
      await fetchCameraTrouble(cameras);
      await fetchRequestCameraIds();

      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setUseManualId(false);

      setFormData({
        id_camera: '',
        id_nvr: '',
        lokasi: '',
        area: '',
        kondisi: '',
        jumlah_error: 0,
        jumlah_request: 0,
        jumlah_on_kembali: 0,
        jumlah_durasi_error: '00:00:00',
        average_durasi_x_error: '00:00:00',
      });
    } catch (err) {
      console.error('GAGAL MENYIMPAN CCTV:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Gagal menyimpan CCTV');
    }
  };

  // =====================================
  // EDIT CCTV
  // =====================================

  const handleEdit = (c) => {
    if (!c || !c.id) {
      toast.error('Data CCTV tidak valid');
      return;
    }

    setIsEditing(true);
    setEditId(c.id);
    setUseManualId(true);

    setFormData({
      id_camera: c.id_camera || '',
      id_nvr: c.id_nvr || '',
      lokasi: c.lokasi || '',
      area: c.area || '',
      kondisi: c.kondisi || '',
      jumlah_error: c.jumlah_error || 0,
      jumlah_request: c.jumlah_request || 0,
      jumlah_on_kembali: c.jumlah_on_kembali || 0,
      jumlah_durasi_error: c.jumlah_durasi_error || '00:00:00',
      average_durasi_x_error: c.average_durasi_x_error || '00:00:00',
    });

    setShowForm(true);
  };

  // =====================================
  // HAPUS CCTV
  // =====================================

  const handleDelete = async (id, idCamera, lokasi) => {
    const result = await appleSwal({
      title: 'Hapus Kamera?',

      html: `
        <div style="text-align:left">
          <p><b>ID Kamera:</b> ${idCamera}</p>
          <p><b>Lokasi:</b> ${lokasi}</p>
        </div>
      `,

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Ya, Hapus',

      cancelButtonText: 'Batal',

      confirmButtonColor: '#ef4444',

      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');

      await api.delete(`/id-cctv/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cameras = await fetchCCTVs();
      await fetchCameraTrouble(cameras);
      await fetchRequestCameraIds();

      if (editId === id) {
        setIsEditing(false);
        setEditId(null);
        setShowForm(false);
      }

      appleSwal({
        title: 'Berhasil',
        text: `${idCamera} berhasil dihapus`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('GAGAL MENGHAPUS CCTV:', err.response?.data || err.message);

      appleSwal({
        title: 'Gagal',
        text: 'Data CCTV gagal dihapus',
        icon: 'error',
      });
    }
  };

  /* ===================== Tabel, Paging, Warna ===================== */
  const filteredCCTVs = cctvList.filter((item) =>
    Object.values(item).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pageCount = Math.max(1, Math.ceil(filteredCCTVs.length / itemsPerPage));
  const paginated = filteredCCTVs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isValid = (d) => {
    const dt = new Date(d);
    return dt instanceof Date && !isNaN(dt.getTime()) && dt.getFullYear() !== 1;
  };

  const getTroubleStatsAllError = (idCamera) => {
    const rows = cameraTroubleList.filter(
      (r) => String(r.id_camera).trim().toUpperCase() === String(idCamera).trim().toUpperCase()
    );
    if (!rows.length)
      return {
        totalError: 0,
        reqPerbaikan: 0,
        onKembali: 0,
        totalDurasi: '00:00:00',
        avgDurasi: '00:00:00',
        status: 'ON',
      };

    const totalError = rows.length;
    const reqPerbaikan = rows.filter((r) => isValid(r.request_perbaikan)).length;
    const validRows = rows.filter(
      (r) => isValid(r.start_error) && isValid(r.request_perbaikan) && isValid(r.selesai_perbaikan)
    );

    const totalSeconds = validRows.reduce((acc, r) => {
      const st = new Date(r.start_error);
      const ed = new Date(r.selesai_perbaikan);
      return acc + Math.max(0, (ed - st) / 1000);
    }, 0);

    const doneCount = validRows.length;
    const avgSec = doneCount > 0 ? totalSeconds / doneCount : 0;
    const status = totalError > doneCount ? 'OFF' : 'ON';

    return {
      totalError,
      reqPerbaikan,
      onKembali: doneCount,
      totalDurasi: secondsToHHMMSS(totalSeconds),
      avgDurasi: secondsToHHMMSS(avgSec),
      status,
    };
  };

  const getRowClass = (k) => {
    const status = String(k).toUpperCase();
    if (status === 'DILEPAS') return 'bg-yellow-50';
    if (status === 'ON') return 'bg-green-50';
    if (status === 'OFF') return 'bg-red-50';
    return '';
  };

  const getBadgeClass = (k) => {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold';
    const s = String(k).toUpperCase();
    if (s === 'DILEPAS') return `${base} bg-yellow-100 text-yellow-800`;
    if (s === 'ON') return `${base} bg-green-100 text-green-800`;
    if (s === 'OFF') return `${base} bg-red-100 text-red-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  // =====================================
  // Analisis Gangguan CCTV
  // Area -> Lokasi
  // =====================================

  const getTroubleByLocationAnalysis = () => {
    const locationMap = {};
    const cameraMap = {};

    cameraTroubleList.forEach((item) => {
      const location = item.lokasi?.trim() || 'Tidak diketahui';

      const camera = item.id_camera || 'Kamera Tidak Diketahui';

      // ======================
      // GROUP LOKASI
      // ======================

      if (!locationMap[location]) {
        locationMap[location] = {
          total: 0,
          cameras: {},
        };
      }

      locationMap[location].total++;

      if (!locationMap[location].cameras[camera]) {
        locationMap[location].cameras[camera] = 0;
      }

      locationMap[location].cameras[camera]++;

      // ======================
      // GROUP KAMERA
      // ======================

      if (!cameraMap[camera]) {
        cameraMap[camera] = {
          camera,
          location,
          total: 0,
        };
      }

      cameraMap[camera].total++;
    });

    // ======================
    // RANKING LOKASI
    // ======================

    const ranking = Object.entries(locationMap)

      .map(([location, data]) => ({
        location,

        total: data.total,

        cameras: Object.entries(data.cameras)

          .map(([camera, total]) => ({
            camera,

            total,
          }))

          .sort((a, b) => b.total - a.total),
      }))

      .sort((a, b) => b.total - a.total);

    // ======================
    // RANKING KAMERA
    // ======================

    const cameraRanking = Object.values(cameraMap)

      .sort((a, b) => b.total - a.total);

    // ======================
    // TOTAL
    // ======================

    const totalTrouble = cameraTroubleList.length;

    const totalCamera = cameraRanking.length;

    const totalLocation = ranking.length;

    // ======================
    // TERTINGGI
    // ======================

    const highestLocation = ranking[0] || {
      location: '-',

      total: 0,
    };

    const highestCamera = cameraRanking[0] || {
      camera: '-',

      location: '-',

      total: 0,
    };

    // ======================
    // KONTRIBUSI GANGGUAN
    // ======================

    const highestRate = totalTrouble
      ? Number(((highestCamera.total / totalTrouble) * 100).toFixed(2))
      : 0;

    // ======================
    // LEVEL
    // ======================

    let level = 'NORMAL';

    if (highestRate >= 50) {
      level = 'CRITICAL';
    } else if (highestRate >= 30) {
      level = 'WARNING';
    } else if (totalTrouble > 0) {
      level = 'MONITORING';
    }

    // ======================
    // INSIGHT
    // ======================

    const insight = [];

    if (highestCamera.camera !== '-') {
      insight.push(
        `Kamera ${highestCamera.camera} memiliki gangguan tertinggi sebanyak ${highestCamera.total} kali di lokasi ${highestCamera.location}`
      );
    }

    if (highestLocation.location !== '-') {
      insight.push(
        `Lokasi ${highestLocation.location} menjadi lokasi dengan gangguan terbanyak (${highestLocation.total} laporan)`
      );
    }

    insight.push(`${totalCamera} kamera dan ${totalLocation} lokasi pernah mengalami gangguan`);

    // ======================
    // REKOMENDASI
    // ======================

    const recommendation = [];

    if (highestCamera.camera !== '-') {
      recommendation.push(
        `Prioritaskan pengecekan kamera ${highestCamera.camera} karena mengalami gangguan berulang`
      );
    }

    if (highestLocation.location !== '-') {
      recommendation.push(`Lakukan inspeksi area lokasi ${highestLocation.location}`);
    }

    if (level === 'CRITICAL') {
      recommendation.push(
        'Segera lakukan preventive maintenance karena gangguan terkonsentrasi pada kamera tertentu'
      );
    } else {
      recommendation.push(
        'Lakukan monitoring berkala terhadap kamera yang memiliki histori gangguan'
      );
    }

    return {
      // ======================
      // RINGKASAN
      // ======================

      totalTrouble,

      totalCamera,

      totalLocation,

      // ======================
      // STATUS
      // ======================

      level,

      highestRate,

      // ======================
      // TERTINGGI (DIPAKAI JSX LAMA)
      // ======================

      highest: {
        location: highestCamera.location,
        camera: highestCamera.camera,
        total: highestCamera.total,
      },

      // ======================
      // DETAIL
      // ======================

      highestLocation,

      highestCamera,

      // ======================
      // DATA
      // ======================

      ranking,

      cameraRanking,

      // ======================
      // AI
      // ======================

      insight,

      recommendation,
    };
  };

  // =====================================
  // Chart Gangguan Berdasarkan Lokasi
  // =====================================

  const getTroubleByLocationChart = () => {
    const analysis = getTroubleByLocationAnalysis();

    const ranking = analysis.ranking.slice(0, 10);

    return {
      labels: ranking.map((item) => item.location),

      datasets: [
        {
          label: 'Jumlah Gangguan',

          data: ranking.map((item) => item.total),

          backgroundColor: [
            '#ef4444', // merah
            '#f97316', // orange
            '#eab308', // kuning
            '#22c55e', // hijau
            '#06b6d4', // cyan
            '#3b82f6', // biru
            '#6366f1', // indigo
            '#8b5cf6', // ungu
            '#ec4899', // pink
            '#14b8a6', // teal
          ],

          borderRadius: 12,

          borderSkipped: false,
        },
      ],
    };
  };

  const troubleLocationAnalysis = getTroubleByLocationAnalysis();

  const troubleLocationChart = getTroubleByLocationChart();

  // =====================================
  // ANALISIS STATUS KAMERA
  // ON vs OFF vs DILEPAS
  // =====================================

  const getCameraStatusAnalysis = () => {
    let on = 0;
    let off = 0;
    let dilepas = 0;

    cctvList.forEach((camera) => {
      if (camera.kondisi?.toUpperCase() === 'DILEPAS') {
        dilepas++;
        return;
      }

      const trouble = getTroubleStatsAllError(camera.id_camera);

      if (trouble.status === 'ON') {
        on++;
      } else if (trouble.status === 'OFF') {
        off++;
      }
    });

    const totalCamera = cctvList.length;

    return {
      totalCamera,

      on,

      off,

      dilepas,

      onRate: totalCamera === 0 ? 0 : ((on / totalCamera) * 100).toFixed(1),

      offRate: totalCamera === 0 ? 0 : ((off / totalCamera) * 100).toFixed(1),

      dilepasRate: totalCamera === 0 ? 0 : ((dilepas / totalCamera) * 100).toFixed(1),

      insight: [
        `Total kamera ${totalCamera} unit`,
        `ON ${on} kamera`,
        `OFF ${off} kamera`,
        `DILEPAS ${dilepas} kamera`,
      ],

      recommendation: [
        'Prioritaskan pengecekan kamera OFF',
        'Monitoring kamera ON secara berkala',
        'Evaluasi kamera yang dilepas',
      ],
    };
  };

  // =====================================
  // Chart Status Kamera
  // Dilepas vs OFF vs ON
  // =====================================

  const getCameraStatusChart = () => {
    const analysis = getCameraStatusAnalysis();

    return {
      labels: ['Menyala (ON)', 'Mati (OFF)', 'Dilepas'],

      datasets: [
        {
          label: 'Status Kamera',

          data: [analysis.on, analysis.off, analysis.dilepas],

          backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],

          hoverBackgroundColor: ['#16a34a', '#dc2626', '#d97706'],

          borderColor: '#ffffff',

          borderWidth: 3,

          hoverBorderWidth: 4,

          hoverOffset: 10,

          borderRadius: 6,

          spacing: 2,
        },
      ],
    };
  };

  const cameraStatusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',

    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 13,
            weight: '600',
          },
          color: '#374151',
        },
      },

      tooltip: {
        backgroundColor: '#111827',
        padding: 12,
        cornerRadius: 10,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 13 },
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percent = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: ${ctx.raw} unit (${percent}%)`;
          },
        },
      },

      // 👇 tambahkan ini untuk matikan label angka di atas arc
      datalabels: {
        display: false,
      },
    },

    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeOutQuart',
    },
  };

  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart) => {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;

      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();

      ctx.font = '700 28px Inter, sans-serif';
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(total), centerX, centerY - 8);

      ctx.font = '500 12px Inter, sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Total Kamera', centerX, centerY + 16);

      ctx.restore();
    },
  };

  const cameraStatusAnalysis = getCameraStatusAnalysis();
  const cameraStatusChart = getCameraStatusChart();

  return (
    <>
      <Layout>
        {/* ================= RINGKASAN CCTV ================= */}

        {/* =====================================
    Catatan Gangguan CCTV berdasarkan Lokasi
===================================== */}

        <section className="p-3 md:p-4 w-full max-w-7xl mx-auto mt-6">
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] p-4 md:p-6 cursor-pointer hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-0.5 transition-all duration-300"
            onClick={() => setShowCameraAnalysis(true)}
          >
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                  <FiMapPin size={16} />
                </span>

                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-bold text-slate-900 truncate">
                    Gangguan CCTV per Lokasi
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                    Distribusi jumlah gangguan CCTV berdasarkan lokasi
                  </p>
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap self-start lg:self-auto shrink-0 ${
                  troubleLocationAnalysis.level === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-600'
                    : troubleLocationAnalysis.level === 'WARNING'
                      ? 'bg-amber-100 text-amber-600'
                      : troubleLocationAnalysis.level === 'MONITORING'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {troubleLocationAnalysis.level}
              </div>
            </div>

            {/* RINGKASAN */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                <p className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                  <FiAlertCircle size={12} />
                  Total Gangguan
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-blue-600 mt-2 tabular-nums">
                  {troubleLocationAnalysis.totalTrouble}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Laporan CCTV</p>
              </div>

              <div className="rounded-xl bg-violet-50/60 border border-violet-100 p-4">
                <p className="flex items-center gap-1.5 text-violet-700 text-[11px] font-semibold uppercase tracking-wide">
                  <FiMap size={12} />
                  Total Lokasi
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-violet-600 mt-2 tabular-nums">
                  {troubleLocationAnalysis.totalLocation}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Area terdampak</p>
              </div>

              <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4">
                <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                  <FiAlertTriangle size={12} />
                  Lokasi Tertinggi
                </p>
                <h3 className="text-sm md:text-base font-bold text-slate-800 mt-2 truncate">
                  {troubleLocationAnalysis.highest.location}
                </h3>
                <p className="text-xs text-rose-600 mt-0.5">
                  {troubleLocationAnalysis.highest.total} Laporan
                </p>
              </div>

              <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                <p className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                  <FiPercent size={12} />
                  Kontribusi
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-amber-600 mt-2 tabular-nums">
                  {troubleLocationAnalysis.highestRate}%
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Dari total gangguan</p>
              </div>
            </div>

            {/* CHART */}
            <div className="rounded-xl border border-slate-100 p-3 md:p-5 h-[260px] sm:h-[300px] md:h-[350px] mb-6">
              <Bar
                data={troubleLocationChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,

                  plugins: {
                    legend: {
                      display: false,
                    },

                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          return `${context.raw} Laporan`;
                        },
                      },
                    },
                  },

                  scales: {
                    x: {
                      ticks: {
                        autoSkip: false,
                        maxRotation: 60,
                        minRotation: 45,
                        font: {
                          size: 10,
                        },
                      },
                    },
                    y: {
                      beginAtZero: true,

                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </div>

            {/* INSIGHT SINGKAT */}
            <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4 md:p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700 mb-3 flex items-center gap-2">
                <FiTrendingUp size={15} />
                Analisis
              </h3>

              <div className="space-y-2">
                {troubleLocationAnalysis.insight.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 text-sm text-slate-600 leading-relaxed border border-rose-100/60"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {showCameraAnalysis && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
              onClick={() => setShowCameraAnalysis(false)}
            >
              <div
                className="relative w-full max-w-6xl max-h-[95vh] md:max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}
                <div className="sticky top-0 z-10 bg-slate-900 rounded-t-2xl px-4 md:px-9 py-5 md:py-7 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                  <div className="min-w-0">
                    <p className="uppercase tracking-[3px] text-slate-400 text-[11px] font-semibold mb-1.5">
                      Laporan Operasional
                    </p>

                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <FiActivity className="text-rose-400" size={17} />
                      </span>
                      <span className="truncate">Analisis Operasional CCTV</span>
                    </h2>

                    <p className="text-slate-400 mt-1.5 text-sm">
                      Kondisi kamera dan distribusi gangguan berdasarkan lokasi.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCameraAnalysis(false)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors duration-200 self-end sm:self-auto shrink-0"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <div className="p-4 md:p-9">
                  {/* =========== STATUS KAMERA =========== */}
                  <div className="flex items-center gap-2 mb-4">
                    <FiCamera className="text-blue-600 shrink-0" size={16} />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Ringkasan Status Kamera
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 md:p-5">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                        <FiCamera className="text-blue-600" size={16} />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Total Kamera
                      </p>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                        {cameraStatusAnalysis.totalCamera}
                      </h2>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 md:p-5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                        <FiCheckCircle className="text-emerald-600" size={16} />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Menyala (ON)
                      </p>
                      <div className="flex items-end gap-2 mt-1 flex-wrap">
                        <h2 className="text-2xl md:text-3xl font-bold text-emerald-600 tabular-nums">
                          {cameraStatusAnalysis.on}
                        </h2>
                        <span className="text-xs font-semibold text-emerald-500 mb-1 tabular-nums">
                          {cameraStatusAnalysis.onRate}%
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 md:p-5">
                      <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center mb-3">
                        <FiXCircle className="text-rose-600" size={16} />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Mati (OFF)
                      </p>
                      <div className="flex items-end gap-2 mt-1 flex-wrap">
                        <h2 className="text-2xl md:text-3xl font-bold text-rose-600 tabular-nums">
                          {cameraStatusAnalysis.off}
                        </h2>
                        <span className="text-xs font-semibold text-rose-500 mb-1 tabular-nums">
                          {cameraStatusAnalysis.offRate}%
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 md:p-5">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                        <FiPauseCircle className="text-amber-600" size={16} />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Dilepas
                      </p>
                      <div className="flex items-end gap-2 mt-1 flex-wrap">
                        <h2 className="text-2xl md:text-3xl font-bold text-amber-600 tabular-nums">
                          {cameraStatusAnalysis.dilepas}
                        </h2>
                        <span className="text-xs font-semibold text-amber-500 mb-1 tabular-nums">
                          {cameraStatusAnalysis.dilepasRate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CHART STATUS */}
                  <div className="rounded-xl border border-slate-100 p-4 md:p-7 mb-8">
                    <div className="flex items-center gap-2 mb-5">
                      <FiPieChart className="text-blue-500 shrink-0" size={15} />
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        Distribusi Status Kamera
                      </h3>
                    </div>

                    <div className="h-[260px] md:h-[300px] relative">
                      <Doughnut
                        data={cameraStatusChart}
                        options={cameraStatusChartOptions}
                        plugins={[centerTextPlugin]}
                      />
                    </div>
                  </div>

                  {/* =========== GANGGUAN LOKASI =========== */}
                  <div className="flex items-center gap-2 mb-4">
                    <FiMapPin className="text-rose-600 shrink-0" size={16} />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Analisis Lokasi Gangguan
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 md:p-5">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                        <FiAlertCircle className="text-blue-600" size={16} />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Total Gangguan
                      </p>
                      <h2 className="text-xl md:text-2xl font-bold text-blue-600 mt-1 tabular-nums">
                        {troubleLocationAnalysis.totalTrouble}
                      </h2>
                    </div>

                    <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 md:p-5">
                      <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center mb-3">
                        <FiMap className="text-violet-600" size={16} />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Total Lokasi
                      </p>
                      <h2 className="text-xl md:text-2xl font-bold text-violet-600 mt-1 tabular-nums">
                        {troubleLocationAnalysis.totalLocation}
                      </h2>
                    </div>

                    <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 md:p-5">
                      <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center mb-3">
                        <FiAlertTriangle className="text-rose-600" size={16} />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Gangguan Tertinggi
                      </p>
                      <h3 className="font-bold text-rose-600 truncate mt-1">
                        {troubleLocationAnalysis.highest.location}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {troubleLocationAnalysis.highest.total} laporan
                      </span>
                    </div>

                    <div
                      className={`rounded-xl border p-4 md:p-5
              ${
                troubleLocationAnalysis.level === 'CRITICAL'
                  ? 'bg-rose-50/60 border-rose-100'
                  : troubleLocationAnalysis.level === 'WARNING'
                    ? 'bg-amber-50/60 border-amber-100'
                    : troubleLocationAnalysis.level === 'MONITORING'
                      ? 'bg-blue-50/60 border-blue-100'
                      : 'bg-emerald-50/60 border-emerald-100'
              }
            `}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3
                ${
                  troubleLocationAnalysis.level === 'CRITICAL'
                    ? 'bg-rose-100'
                    : troubleLocationAnalysis.level === 'WARNING'
                      ? 'bg-amber-100'
                      : troubleLocationAnalysis.level === 'MONITORING'
                        ? 'bg-blue-100'
                        : 'bg-emerald-100'
                }
              `}
                      >
                        <FiActivity
                          size={16}
                          className={`
                  ${
                    troubleLocationAnalysis.level === 'CRITICAL'
                      ? 'text-rose-600'
                      : troubleLocationAnalysis.level === 'WARNING'
                        ? 'text-amber-600'
                        : troubleLocationAnalysis.level === 'MONITORING'
                          ? 'text-blue-600'
                          : 'text-emerald-600'
                  }
                `}
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Status
                      </p>
                      <h3
                        className={`text-base md:text-lg font-bold mt-1
                ${
                  troubleLocationAnalysis.level === 'CRITICAL'
                    ? 'text-rose-600'
                    : troubleLocationAnalysis.level === 'WARNING'
                      ? 'text-amber-600'
                      : troubleLocationAnalysis.level === 'MONITORING'
                        ? 'text-blue-600'
                        : 'text-emerald-600'
                }
              `}
                      >
                        {troubleLocationAnalysis.level}
                      </h3>
                    </div>
                  </div>

                  {/* RANKING LOKASI */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <FiAward className="text-amber-500 shrink-0" size={16} />
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        Peringkat Lokasi Gangguan
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {troubleLocationAnalysis.ranking.map((item, index) => {
                        const percent = (
                          (item.total / troubleLocationAnalysis.totalTrouble) *
                          100
                        ).toFixed(1);

                        return (
                          <div
                            key={index}
                            className="rounded-xl border border-slate-100 bg-white p-4 hover:border-slate-200 hover:bg-slate-50/50 transition-colors duration-200"
                          >
                            <div className="flex items-center justify-between mb-2.5 gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
                          ${
                            index === 0
                              ? 'bg-rose-100 text-rose-600'
                              : index === 1
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-slate-100 text-slate-500'
                          }
                        `}
                                >
                                  {index + 1}
                                </span>
                                <b className="text-slate-800 truncate font-semibold">
                                  {item.location}
                                </b>
                              </div>

                              <span className="text-sm font-semibold text-slate-600 shrink-0 tabular-nums">
                                {percent}%
                              </span>
                            </div>

                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  index === 0
                                    ? 'bg-rose-500'
                                    : index === 1
                                      ? 'bg-orange-500'
                                      : 'bg-slate-400'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            <p className="text-xs text-slate-400">{item.total} laporan</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* INSIGHT & REKOMENDASI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-5 md:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FiTrendingUp className="text-slate-600 shrink-0" size={15} />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                          Wawasan
                        </h3>
                      </div>

                      <div className="space-y-2.5">
                        {[...cameraStatusAnalysis.insight, ...troubleLocationAnalysis.insight].map(
                          (item, index) => (
                            <div
                              key={index}
                              className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-slate-100"
                            >
                              {item}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5 md:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FiZap className="text-emerald-600 shrink-0" size={15} />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                          Rekomendasi
                        </h3>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          ...cameraStatusAnalysis.recommendation,
                          ...troubleLocationAnalysis.recommendation,
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-emerald-100/60"
                          >
                            <FiCheck className="mt-0.5 text-emerald-600 shrink-0" size={14} />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ===================== Tombol Tambah & Form ===================== */}

        <section className="p-3 md:p-4">
          {/* HEADER TOMBOL */}

          <div
            ref={addBtnHeaderRef}
            className="
              bg-white/70
              backdrop-blur-3xl
              border
              border-white/40
              rounded-2xl md:rounded-[32px]
              shadow-[0_20px_60px_rgba(15,23,42,.08)]
              p-4 md:p-6
              flex
              flex-wrap
              gap-4
              justify-between
              items-center
            "
          >
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">
                Manajemen CCTV
              </h2>

              <p className="text-sm text-gray-500 mt-1 truncate">
                Kelola perangkat CCTV, lokasi, dan status monitoring
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setIsEditing(false);
                  setEditId(null);
                  setUseManualId(false);

                  setFormData({
                    id_camera: '',
                    id_nvr: '',
                    lokasi: '',
                    area: '',
                    kondisi: '',
                    jumlah_error: 0,
                    jumlah_request: 0,
                    jumlah_on_kembali: 0,
                    jumlah_durasi_error: '00:00:00',
                    average_durasi_x_error: '00:00:00',
                  });
                }}
                title="Tambah CCTV"
                className={`
                  group
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-gradient-to-r
                  from-blue-600
                  to-indigo-600
                  text-white
                  font-semibold
                  shadow-lg
                  shadow-blue-500/30
                  hover:scale-105
                  duration-300
                  shrink-0
                  ${showAddBtnText ? 'px-6 py-3 rounded-2xl' : 'w-11 h-11'}
                `}
              >
                <FiPlusCircle className="text-xl group-hover:rotate-90 duration-300 shrink-0" />
                {showAddBtnText && <span className="whitespace-nowrap">Tambah CCTV</span>}
              </button>
            )}
          </div>
          {/* KALENDER MONITORING */}

          <div
            ref={calendarCardRef}
            className="
              mt-6
              w-full
              bg-white/70
              backdrop-blur-3xl
              border
              border-white/40
              rounded-2xl md:rounded-[32px]
              shadow-[0_20px_60px_rgba(15,23,42,.08)]
              p-4 md:p-6
              flex
              flex-wrap
              gap-4
              justify-between
              items-center
            "
          >
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 truncate">
                Monitoring Kalender
              </h3>
              <p className="text-sm text-gray-500 mt-1 truncate">
                Lihat jam realtime, kalender, dan hari libur
              </p>
            </div>

            <button
              onClick={() => setShowCalendar(true)}
              title="Buka Kalender"
              className={`
                group
                flex
                items-center
                justify-center
                gap-2
                rounded-full
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                text-white
                font-semibold
                shadow-lg
                shadow-blue-500/30
                hover:scale-105
                duration-300
                shrink-0
                ${showCalendarText ? 'px-6 py-3 rounded-2xl' : 'w-11 h-11'}
              `}
            >
              <FiCalendar className="text-xl shrink-0" />
              {showCalendarText && <span className="whitespace-nowrap">Buka Kalender</span>}
            </button>
          </div>

          {showCalendar && (
            <div
              className="
                fixed
                inset-0
                bg-black/50
                backdrop-blur-md
                z-50
                flex
                items-center
                justify-center
                p-2 sm:p-4 md:p-6
              "
              onClick={() => setShowCalendar(false)}
            >
              <div
                className="
                  bg-transparent
                  w-full
                  max-w-lg
                  max-h-[95vh]
                  overflow-y-auto
                  relative
                "
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowCalendar(false)}
                  className="
                    absolute
                    top-3 right-3
                    z-10
                    w-9 h-9
                    rounded-full
                    bg-white
                    shadow-md
                    text-gray-500
                    hover:bg-red-500
                    hover:text-white
                    duration-300
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiX size={16} />
                </button>

                <MonitoringCalendar
                  selectedDate={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                  }}
                />
              </div>
            </div>
          )}
          {/* ================= MODAL ================= */}

          {showForm && (
            <div
              className="
                fixed
                inset-0
                bg-black/40
                backdrop-blur-xl
                flex
                items-center
                justify-center
                z-[999]
                p-2 sm:p-4 md:p-6
              "
              onClick={() => setShowForm(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="
                  bg-white/90 backdrop-blur-3xl
                  rounded-2xl md:rounded-[40px]
                  shadow-[0_40px_100px_rgba(0,0,0,.2)]
                  w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto
                  p-4 sm:p-6 md:p-10
                "
              >
                {/* HEADER */}

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
                  <div>
                    <p className="uppercase tracking-[3px] md:tracking-[5px] text-blue-600 text-xs font-semibold">
                      MANAJEMEN CCTV
                    </p>

                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-3 flex items-center gap-3">
                      {isEditing ? (
                        <>
                          <FiEdit2 /> Edit CCTV
                        </>
                      ) : (
                        <>
                          <FiPlusCircle /> Tambah CCTV
                        </>
                      )}
                    </h2>

                    <p className="text-gray-500 mt-2 text-sm md:text-base">
                      Input data perangkat CCTV dan konfigurasi monitoring.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowForm(false)}
                    className="
                      w-10 h-10 md:w-12 md:h-12
                      rounded-full
                      bg-gray-100
                      hover:bg-red-500
                      hover:text-white
                      text-xl md:text-2xl
                      duration-300
                      flex
                      items-center
                      justify-center
                      self-end sm:self-auto
                      shrink-0
                    "
                  >
                    <FiX />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
                >
                  {/* ID CAMERA */}

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">ID Kamera</label>

                    <div className="flex flex-wrap gap-4 md:gap-5 mt-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={!useManualId}
                          onChange={() => {
                            setUseManualId(false);

                            setFormData((p) => ({
                              ...p,
                              id_camera: '',
                            }));
                          }}
                        />
                        Pilih Request
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={useManualId}
                          onChange={() => {
                            setUseManualId(true);

                            setFormData((p) => ({
                              ...p,
                              id_camera: '',
                            }));
                          }}
                        />
                        Manual
                      </label>
                    </div>

                    {useManualId ? (
                      <input
                        name="id_camera"
                        value={formData.id_camera}
                        onChange={handleChange}
                        placeholder="Masukkan ID Kamera"
                        className="
                          w-full
                          mt-3
                          px-4
                          py-3
                          rounded-2xl
                          border
                          bg-white
                          focus:ring-2
                          focus:ring-blue-500
                          outline-none
                        "
                      />
                    ) : (
                      <select
                        name="id_camera"
                        value={formData.id_camera}
                        onChange={handleSelectCameraRequest}
                        className="
                          w-full
                          mt-3
                          px-4
                          py-3
                          rounded-2xl
                          border
                          bg-white
                          focus:ring-2
                          focus:ring-blue-500
                          outline-none
                        "
                      >
                        <option value="">-- Pilih Request --</option>

                        {availableRequestIds.map((id) => (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* INPUT NORMAL */}

                  {[
                    ['id_nvr', 'ID NVR'],
                    ['lokasi', 'Lokasi'],
                  ].map(([k, l]) => (
                    <div key={k}>
                      <label className="text-sm font-semibold text-gray-700">{l}</label>

                      <input
                        name={k}
                        value={formData[k]}
                        onChange={handleChange}
                        className="
                          w-full
                          mt-2
                          px-4
                          py-3
                          rounded-2xl
                          border
                          focus:ring-2
                          focus:ring-blue-500
                          outline-none
                        "
                      />
                    </div>
                  ))}

                  {/* AREA */}

                  <div>
                    <label className="text-sm font-semibold">Area</label>

                    <select
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      className="w-full mt-2 px-4 py-3 rounded-2xl border"
                    >
                      <option value="">-- Pilih Area --</option>

                      {areaList.map((ar) => (
                        <option key={ar.id} value={ar.name}>
                          {ar.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* KONDISI OTOMATIS */}

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Kondisi</label>

                    <input
                      type="text"
                      value={formData.kondisi || 'Otomatis Sistem'}
                      disabled
                      className="
                        w-full
                        mt-2
                        px-4
                        py-3
                        rounded-2xl
                        border
                        bg-gray-100
                        text-gray-500
                        cursor-not-allowed
                      "
                    />
                  </div>

                  {/* JUMLAH OTOMATIS */}

                  {[
                    ['jumlah_error', 'Jumlah Error'],
                    ['jumlah_request', 'Jumlah Request'],
                    ['jumlah_on_kembali', 'Jumlah On Kembali'],
                  ].map(([k, l]) => (
                    <div key={k}>
                      <label className="text-sm font-semibold text-gray-700">{l}</label>

                      <input
                        type="number"
                        value={formData[k] || 0}
                        disabled
                        className="
                          w-full
                          mt-2
                          px-4
                          py-3
                          rounded-2xl
                          border
                          bg-gray-100
                          text-gray-500
                          cursor-not-allowed
                        "
                      />
                    </div>
                  ))}

                  {/* DURASI OTOMATIS */}

                  {[
                    ['jumlah_durasi_error', 'Durasi Error'],
                    ['average_durasi_x_error', 'Rata-rata Durasi'],
                  ].map(([k, l]) => (
                    <div key={k}>
                      <label className="text-sm font-semibold text-gray-700">{l}</label>

                      <input
                        type="text"
                        value={formData[k] || '00:00:00'}
                        disabled
                        className="
                          w-full
                          mt-2
                          px-4
                          py-3
                          rounded-2xl
                          border
                          bg-gray-100
                          text-gray-500
                          cursor-not-allowed
                        "
                      />
                    </div>
                  ))}

                  {/* TOMBOL */}

                  <div className="md:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="
                        px-6
                        py-3
                        rounded-2xl
                        bg-gray-100
                        hover:bg-gray-200
                        duration-300
                        w-full sm:w-auto
                      "
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      className="
                        px-8
                        py-3
                        rounded-2xl
                        bg-gradient-to-r
                        from-blue-600
                        to-indigo-600
                        text-white
                        font-semibold
                        shadow-lg
                        shadow-blue-500/30
                        hover:scale-105
                        duration-300
                        w-full sm:w-auto
                      "
                    >
                      {isEditing ? 'Simpan Perubahan' : 'Tambah CCTV'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>

        {/* ===================== Tabel ===================== */}
        <section className="p-3 md:p-4">
          {/* ================= FILTER BAR ================= */}

          <div className="mb-5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* PENCARIAN */}

            <div className="w-full md:flex-1">
              <input
                type="text"
                placeholder="🔍 Cari CCTV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  w-full
                  px-4 md:px-5
                  py-2.5 md:py-3
                  rounded-2xl
                  border
                  border-gray-200
                  bg-white/70
                  backdrop-blur-xl
                  shadow-sm
                  focus:ring-2
                  focus:ring-blue-400
                  outline-none
                  transition
                "
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40 -mx-3 px-3 md:mx-0 md:px-0">
            <table className="min-w-[1000px] w-full divide-y divide-gray-300">
              <thead className="bg-white/60">
                <tr>
                  {[
                    'No',
                    'ID Kamera',
                    'ID NVR',
                    'Lokasi',
                    'Area',
                    'Kondisi',
                    'Error',
                    'Request',
                    'On Kembali',
                    'Durasi Error',
                    'Rata-rata × Error',
                    'Aksi',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 md:px-6 py-3 text-xs md:text-sm font-semibold uppercase text-left whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {paginated.length ? (
                  paginated.map((c, i) => {
                    const t = getTroubleStatsAllError(c.id_camera);

                    return (
                      <tr key={c.id} className={getRowClass(t.status)}>
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                          {(currentPage - 1) * itemsPerPage + i + 1}
                        </td>

                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                          {c.id_camera || '-'}
                        </td>

                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">{c.id_nvr || '-'}</td>

                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">{c.lokasi || '-'}</td>

                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">{c.area || '-'}</td>

                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                          <span className={getBadgeClass(t.status)}>{t.status}</span>
                        </td>

                        <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                          {t.totalError}
                        </td>

                        <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                          {t.reqPerbaikan}
                        </td>

                        <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                          {t.onKembali}
                        </td>

                        <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                          {t.totalDurasi}
                        </td>

                        <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                          {t.avgDurasi}
                        </td>

                        {/* AKSI */}

                        <td className="px-4 md:px-6 py-3">
                          {canManage && (
                            <div className="flex flex-col gap-2 items-center min-w-[44px]">
                              {/* EDIT */}

                              <button
                                onClick={() => handleEdit(c)}
                                title="Ubah Data"
                                className="
                                  bg-yellow-400
                                  hover:bg-yellow-500
                                  text-white
                                  p-2
                                  rounded-lg
                                  transition
                                  shadow-sm
                                  hover:scale-105
                                  focus:outline-none
                                  focus:ring-2
                                  focus:ring-yellow-300
                                  w-full
                                  flex
                                  justify-center
                                  items-center
                                "
                              >
                                <FiEdit2 size={17} />
                              </button>

                              {/* HAPUS */}
                              <button
                                onClick={() => handleDelete(c.id, c.id_camera, c.lokasi, c.area)}
                                title="Hapus Data"
                                className="
    bg-red-500
    hover:bg-red-600
    text-white
    p-2
    rounded-lg
    transition
    shadow-sm
    hover:scale-105
    focus:outline-none
    focus:ring-2
    focus:ring-red-300
    w-full
    flex
    justify-center
    items-center
  "
                              >
                                <FiTrash2 size={17} />
                              </button>

                              {/* LEPAS */}
                              {c?.kondisi !== 'DILEPAS' && (
                                <button
                                  onClick={async () => {
                                    const result = await appleSwal({
                                      title: 'Lepas Kamera CCTV?',

                                      html: `
          <div style="text-align:left">
            <p><b>ID Kamera:</b> ${c.id_camera}</p>
            <p><b>Lokasi:</b> ${c.lokasi}</p>
            <p><b>Area:</b> ${c.area}</p>
            <br/>
            Kamera akan berubah status menjadi
            <b style="color:#dc2626">DILEPAS</b>
          </div>
        `,

                                      icon: 'warning',

                                      showCancelButton: true,

                                      confirmButtonText: 'Ya, Lepaskan',

                                      cancelButtonText: 'Batal',

                                      confirmButtonColor: '#4b5563',

                                      cancelButtonColor: '#9ca3af',
                                    });

                                    if (!result.isConfirmed) return;

                                    const token = localStorage.getItem('token');

                                    try {
                                      await api.put(
                                        `/id-cctv/${c.id}`,
                                        {
                                          ...c,
                                          kondisi: 'DILEPAS',
                                        },
                                        {
                                          headers: {
                                            Authorization: `Bearer ${token}`,
                                          },
                                        }
                                      );

                                      await fetchCCTVs();
                                      await fetchRequestCameraIds();

                                      appleSwal({
                                        title: 'Berhasil!',
                                        text: `Kamera ${c.id_camera} berhasil dilepas`,
                                        icon: 'success',
                                        timer: 2500,
                                        showConfirmButton: false,
                                      });
                                    } catch (err) {
                                      console.error('Gagal melepas kamera:', err);

                                      appleSwal({
                                        title: 'Gagal!',
                                        text: 'Kamera gagal dilepas',
                                        icon: 'error',
                                      });
                                    }
                                  }}
                                  title="Lepas Kamera"
                                  className="
      bg-gray-600
      hover:bg-gray-700
      text-white
      p-2
      rounded-lg
      transition
      shadow-sm
      hover:scale-105
      focus:outline-none
      focus:ring-2
      focus:ring-gray-400
      w-full
      flex
      justify-center
      items-center
    "
                                >
                                  <FiSlash size={17} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="text-center py-4 text-gray-500">
                      Data tidak ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginasi */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1.5 rounded bg-gray-200 text-sm disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <span className="text-sm">
              Halaman {currentPage} / {pageCount}
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 rounded bg-gray-200 text-sm disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </section>
      </Layout>
    </>
  );
}
