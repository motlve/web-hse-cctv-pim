import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import CountUp from 'react-countup';
import MonitoringCalendar from '../components/Calander';

import { FiEdit2, FiTrash2, FiCameraOff, FiX, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { FiTool, FiAlertTriangle, FiCheckCircle, FiClock, FiActivity } from 'react-icons/fi';
import { FiBarChart2, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import { FiCamera, FiShield } from 'react-icons/fi';
import { FiTrendingDown } from 'react-icons/fi';
import { FiLayers } from 'react-icons/fi';
import { FiCalendar, FiEdit3, FiSave } from 'react-icons/fi';

import { FiAlertCircle } from 'react-icons/fi';
import { FiInfo } from 'react-icons/fi';
import { FiGlobe, FiPlus, FiPlusCircle, FiUser, FiFileText, FiXCircle } from 'react-icons/fi';

import { LuCalendar } from 'react-icons/lu';

import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

import api from '../api/axios';

import Swal from 'sweetalert2';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';

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

import CostumeDatePicker from '../components/CostumeDatePicker';

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
  Filler
);

export default function ListTroubleCamera() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [troubleList, setTroubleList] = useState([]);
  const [officerList, setOfficerList] = useState([]);
  const [cameraList, setCameraList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [showKeteranganPopup, setShowKeteranganPopup] = useState(false);
  const [tempKeterangan, setTempKeterangan] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState('all');
  const [yearOptions, setYearOptions] = useState([]);

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedCameras, setSelectedCameras] = useState([]); // untuk mode bulk
  const [cameraDetails, setCameraDetails] = useState({}); // { "CCTV-001": "Lantai 1 Area A", "CCTV-002": "..." }

  const troubleHeaderCardRef = useRef(null);
  const troubleCalendarCardRef = useRef(null);
  const [showAddTroubleBtnText, setShowAddTroubleBtnText] = useState(true);
  const [showTroubleCalendarText, setShowTroubleCalendarText] = useState(true);
  const [showTroubleCalendar, setShowTroubleCalendar] = useState(false);

  // HELPER

  // eslint-disable-next-line no-unused-vars
  const formatHour = (hour) => {
    if (!hour || isNaN(hour)) {
      return '0 Jam';
    }

    return `${Number(hour).toFixed(2)} Jam`;
  };

  const recoveryCenterText = {
    id: 'recoveryCenterText',

    beforeDraw(chart) {
      const {
        ctx,
        chartArea: { top, bottom, left, right },
      } = chart;

      const dataset = chart.data.datasets[0].data;

      const error = dataset[0] || 0;

      const request = dataset[1] || 0;

      const recovered = dataset[2] || 0;

      const total = error + request + recovered;

      const recoveryRate = total === 0 ? 0 : ((recovered / total) * 100).toFixed(2);

      const x = (left + right) / 2;

      const y = (top + bottom) / 2;

      ctx.save();

      ctx.textAlign = 'center';

      ctx.textBaseline = 'middle';

      // angka utama

      ctx.font = '900 32px Arial';

      ctx.fillStyle = '#16a34a';

      ctx.fillText(`${recoveryRate}%`, x, y - 10);

      // label

      ctx.font = '600 13px Arial';

      ctx.fillStyle = '#6b7280';

      ctx.fillText('Recovery Rate', x, y + 25);

      ctx.restore();
    },
  };

  // ==============================
  // ACCESS MANAGEMENT
  // ==============================

  const role = localStorage.getItem('role');

  const troublePermission = {
    Admin: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    'Manager HSE': {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    'Petugas HSE': {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    'Petugas CCTV': {
      view: true,
      create: true,
      update: true,
      delete: true,
    },

    Guest: {
      view: true,
      create: false,
      update: false,
      delete: false,
    },
  };

  const access = troublePermission[role] || troublePermission.Guest;

  const canCreate = access.create;

  const canReleaseCamera = ['Admin', 'Manager HSE', 'Petugas HSE'].includes(role);

  const canEdit = access.update;

  const canDelete = access.delete;

  // ==============================

  const navigate = useNavigate();
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  useEffect(() => {
    const expired = () => {
      setShowSessionExpired(true);
    };

    window.addEventListener('session-expired', expired);

    return () => window.removeEventListener('session-expired', expired);
  }, []);

  // =====================================
  // Modal
  // =====================================

  const [showRecovery, setShowRecovery] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showDurationError, setShowDurationError] = useState(false);
  const [showErrorImpact, setShowErrorImpact] = useState(false);

  const [formData, setFormData] = useState({
    id_camera: '',
    lokasi: '',
    lokasi_detail: '',
    status: '',
    start_error: '',
    request_perbaikan: '',
    selesai_perbaikan: '',
    durasi_error: '00:00:00', // ✅ BARU
    response_time: '00:00:00',
    average_response: '00:00:00',
    petugas: '',
    keterangan: '',
  });

  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const cameraOptions = cameraList.map((cam) => ({
    value: cam.id_camera,
    label: cam.id_camera,
    camera: cam, // simpan data lengkap kalau perlu
  }));

  const formatToIndoDateTime = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') return '00/00/0000 00:00:00';

    const date = new Date(dateString);
    if (isNaN(date)) return '00/00/0000 00:00:00';

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  };

  // =====================================
  // CONVERT SECONDS TO HH:MM:SS
  // =====================================

  const secondsToHhmmss = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
      return '00:00:00';
    }

    const totalSeconds = Math.floor(seconds);

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const secs = totalSeconds % 60;

    return (
      String(hours).padStart(2, '0') +
      ':' +
      String(minutes).padStart(2, '0') +
      ':' +
      String(secs).padStart(2, '0')
    );
  };

  // Ubah dari "HH:MM:SS" jadi detik
  function hhmmssToSeconds(hhmmss) {
    if (!hhmmss || typeof hhmmss !== 'string') return 0;

    const parts = hhmmss.trim().split(':').map(Number);

    if (parts.some(isNaN)) return 0;

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    return Number(parts[0]) || 0;
  }

  const secondsToHH = (sec) => {
    if (!sec || sec <= 0) return '00:00:00';

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);

    return `${String(h).padStart(2, '0')}:${String(m).padStart(
      2,
      '0'
    )}:${String(s).padStart(2, '0')}`;
  };

  // Fungsi utama untuk rata-rata
  const calculateAverageResponse = (data) => {
    const validTimes = data
      .map((item) => hhmmssToSeconds(item.response_time))
      .filter((sec) => sec > 0);

    if (validTimes.length === 0) {
      return '00:00:00';
    }

    const avgSec = validTimes.reduce((total, sec) => total + sec, 0) / validTimes.length;

    return secondsToHH(Math.round(avgSec));
  };

  const fetchTroubleList = async () => {
    try {
      const res = await api.get(`/list-camera-trouble`);
      const raw = Array.isArray(res.data) ? res.data : res.data.data || [];

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
      const enriched = raw.map((item) => {
        const durSec = diffSeconds(item.start_error, item.selesai_perbaikan);

        const respSec = diffSeconds(item.request_perbaikan, item.selesai_perbaikan);

        let status = item.status;

        // ==========================
        // AUTO STATUS ENGINE
        // ==========================

        if (item.selesai_perbaikan && item.selesai_perbaikan !== '0001-01-01T00:00:00Z') {
          status = 'Selesai Perbaikan/On Kembali';
        } else if (item.request_perbaikan && item.request_perbaikan !== '0001-01-01T00:00:00Z') {
          status = 'Request Perbaikan';
        } else if (item.start_error) {
          status = 'Error';
        } else {
          status = 'Kamera Dilepas';
        }

        return {
          ...item,

          status,

          id: item.id ?? item.ID,

          durasi_error: item.durasi_error || secondsToHH(durSec),

          response_time: item.response_time || secondsToHH(respSec),

          __durasi_error_seconds: durSec,

          __response_time_seconds: respSec,
        };
      });

      setTroubleList(enriched);

      // ===============================
      // YEAR FILTER OPTIONS (10 YEARS)
      // ===============================

      const availableYears = [
        ...new Set(
          enriched.map((item) => {
            const date = new Date(item.start_error);
            return date.getFullYear();
          })
        ),
      ].sort((a, b) => b - a);

      console.log(availableYears);
      setYearOptions(availableYears);

      // ===============================
      // AUTO SET LATEST YEAR
      // ===============================

      if (enriched.length > 0) {
        setSelectedYear('all');
      }

      // update average_response di formData (global, dari seluruh data)
      const validRespSecs = enriched
        .map((it) => it.__response_time_seconds || 0)
        .filter((s) => s > 0);
      if (validRespSecs.length > 0) {
        const avg = Math.floor(validRespSecs.reduce((a, b) => a + b, 0) / validRespSecs.length);
        setFormData((prev) => ({ ...prev, average_response: secondsToHH(avg) }));
      } else {
        setFormData((prev) => ({ ...prev, average_response: '00:00:00' }));
      }
    } catch (err) {
      console.error(err);
    }
  }; /*  */

  function calculateDuration(start, end) {
    if (!start) return '00:00:00';

    const startTime = new Date(start);

    // Jika belum selesai perbaikan → tampilkan "00:00:00"
    if (!end || end === '00/00/0000' || end === '0000-00-00' || isNaN(new Date(end))) {
      return '00:00:00';
    }

    const endTime = new Date(end);
    if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
      return '00:00:00';
    }

    const diffMs = endTime - startTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // ======================= RESPONSE TIME =======================
  function calculateResponseTime(request, selesai) {
    if (!request || !selesai) {
      return '00:00:00';
    }

    const start = new Date(request);
    const end = new Date(selesai);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return '00:00:00';
    }

    if (end < start) {
      return '00:00:00';
    }

    const diff = end - start;

    const totalSeconds = Math.floor(diff / 1000);

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const seconds = totalSeconds % 60;

    return (
      `${String(hours).padStart(2, '0')}:` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(seconds).padStart(2, '0')}`
    );
  }

  const fetchCameraList = async () => {
    try {
      const response = await api.get(`/id-cctv`);
      setCameraList(response.data || []);
    } catch (error) {
      console.error('Error fetching camera list:', error);
      alert('Failed to fetch camera list.');
    }
  };

  const fetchOfficerList = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await api.get(`/officer`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOfficerList(response.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        setShowSessionExpired(true);
        return;
      }

      console.error(error);
    }
  };

  const fetchLocationList = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await api.get(`/location`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLocationList(response.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        setShowSessionExpired(true);
        return;
      }

      console.error(error);
    }
  };

  useEffect(() => {
    document.documentElement.lang = 'id';
    fetchTroubleList();
    fetchCameraList();
    fetchOfficerList();
    fetchLocationList();
  }, []);

  // ================= RESPONSIVE HEADER & CALENDAR BUTTON =================
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (entry.target === troubleHeaderCardRef.current) {
          setShowAddTroubleBtnText(width > 260);
        }
        if (entry.target === troubleCalendarCardRef.current) {
          setShowTroubleCalendarText(width > 260);
        }
      }
    });

    if (troubleHeaderCardRef.current) observer.observe(troubleHeaderCardRef.current);
    if (troubleCalendarCardRef.current) observer.observe(troubleCalendarCardRef.current);

    return () => observer.disconnect();
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

    // ================================
    // HELPER FORMAT DATETIME
    // ================================

    const formatDateTime = (value) => {
      if (!value || value === '' || value === '0001-01-01T00:00:00Z') {
        return null;
      }

      const date = new Date(value);

      if (isNaN(date.getTime())) {
        return null;
      }

      return date.toISOString();
    };

    // ================================
    // VALIDASI
    // ================================

    if (isBulkMode) {
      if (selectedCameras.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'ID Camera kosong',
          text: 'Pilih minimal satu ID Camera untuk input massal.',
          confirmButtonColor: '#2563eb',
        });

        return;
      }
    } else if (!formData.id_camera) {
      Swal.fire({
        icon: 'warning',
        title: 'ID Camera kosong',
        text: 'ID Camera wajib dipilih.',
        confirmButtonColor: '#2563eb',
      });

      return;
    }

    // ================================
    // KONFIRMASI
    // ================================

    const confirm = await Swal.fire({
      title: isBulkMode
        ? `Tambah ${selectedCameras.length} data trouble?`
        : isEditing
          ? 'Update data trouble?'
          : 'Tambah data trouble?',

      text: isBulkMode
        ? `Data trouble akan disimpan untuk ${selectedCameras.length} kamera sekaligus.`
        : isEditing
          ? 'Data trouble camera akan diperbarui.'
          : 'Data trouble camera akan disimpan.',

      icon: 'question',

      showCancelButton: true,

      confirmButtonText: isBulkMode ? 'Ya, Simpan Semua' : isEditing ? 'Ya, Update' : 'Ya, Simpan',

      cancelButtonText: 'Batal',

      confirmButtonColor: '#2563eb',

      cancelButtonColor: '#dc2626',

      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    // ================================
    // BUILD PAYLOAD (BASE, TANPA id_camera)
    // ================================

    const buildPayload = (idCamera) => ({
      id_camera: idCamera,

      lokasi: formData.lokasi || '',

      lokasi_detail: formData.lokasi_detail || '',

      start_error: formatDateTime(formData.start_error),

      request_perbaikan: formatDateTime(formData.request_perbaikan),

      selesai_perbaikan: formatDateTime(formData.selesai_perbaikan),

      petugas: formData.petugas || '',

      keterangan: formData.keterangan || '',

      // backend akan hitung ulang
      durasi_error: formData.durasi_error || '00:00:00',

      response_time: formData.response_time || '00:00:00',

      average_response: formData.average_response || '00:00:00',
    });

    const resetForm = () => {
      setShowForm(false);

      setIsEditing(false);

      setEditId(null);

      setIsBulkMode(false);

      setCameraDetails({});

      setSelectedCameras([]);

      setFormData({
        id_camera: '',

        lokasi: '',

        lokasi_detail: '',

        status: '',

        start_error: '',

        request_perbaikan: '',

        selesai_perbaikan: '',

        durasi_error: '00:00:00',

        response_time: '00:00:00',

        average_response: '00:00:00',

        petugas: '',

        keterangan: '',
      });
    };

    // ================================
    // HANDLE ERROR (dipakai di kedua mode)
    // ================================

    const resolveErrorMessage = (error) => {
      let errorTitle = 'Gagal menyimpan data';

      let errorMessage = 'Terjadi kesalahan pada sistem. Silakan coba lagi.';

      const serverError = error.response?.data?.toString() || error.message;

      if (serverError.includes('Incorrect datetime value')) {
        errorTitle = 'Format Tanggal Tidak Valid';

        errorMessage =
          'Tanggal error tidak valid atau kosong.\n\n' +
          'Pastikan tanggal mulai error sudah diisi dengan benar.';
      } else if (serverError.includes('id_camera wajib diisi')) {
        errorTitle = 'ID Camera Belum Dipilih';

        errorMessage = 'Silakan pilih ID Camera terlebih dahulu sebelum menyimpan data.';
      } else if (serverError.includes('Duplicate entry')) {
        errorTitle = 'Data Sudah Ada';

        errorMessage =
          'Data dengan ID Camera tersebut sudah terdaftar.\n\n' +
          'Gunakan ID Camera lain atau edit data yang sudah ada.';
      } else if (serverError.includes('Unauthorized') || error.response?.status === 401) {
        errorTitle = 'Sesi Berakhir';

        errorMessage = 'Sesi login sudah berakhir.\n\n' + 'Silakan login kembali.';
      } else if (error.response?.status === 500) {
        errorTitle = 'Kesalahan Server';

        errorMessage =
          'Terjadi kesalahan pada server.\n\n' + 'Silakan cek kembali data yang dimasukkan.';
      }

      return { errorTitle, errorMessage };
    };

    // ================================
    // MODE BULK
    // ================================

    if (isBulkMode) {
      Swal.fire({
        title: 'Menyimpan data...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await api.post('/list-camera-trouble/bulk', {
          items: selectedCameras.map((cam) => ({
            id_camera: cam.value,
            lokasi_detail: cameraDetails[cam.value] || '',
          })),

          // field yang tetap sama untuk semua kamera
          lokasi: formData.lokasi || '',
          petugas: formData.petugas || '',
          keterangan: formData.keterangan || '',
          start_error: formatDateTime(formData.start_error),
          request_perbaikan: formatDateTime(formData.request_perbaikan),
          selesai_perbaikan: formatDateTime(formData.selesai_perbaikan),
        });

        Swal.close();

        const { success, failed } = response.data.result;

        if (failed.length === 0) {
          await Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: `${success.length} data gangguan berhasil ditambahkan.`,
            timer: 2500,
            showConfirmButton: false,
            iconColor: '#16a34a',
          });
        } else {
          await Swal.fire({
            icon: success.length > 0 ? 'warning' : 'error',
            title: success.length > 0 ? 'Sebagian Berhasil' : 'Gagal menyimpan data',
            html: `
          Berhasil: <b>${success.length}</b> kamera<br/>
          Gagal: <b>${failed.length}</b> kamera<br/>
          <span style="font-size:13px;color:#6b7280">${failed
            .map((f) => `${f.id_camera}: ${f.error}`)
            .join('<br/>')}</span>
        `,
            confirmButtonText: 'Mengerti',
            confirmButtonColor: '#dc2626',
          });
        }
      } catch (error) {
        Swal.close();
        console.error('BULK ERROR:', error.response?.data || error.message);

        Swal.fire({
          icon: 'error',
          title: 'Gagal menyimpan data massal',
          text: error.response?.data?.message || 'Terjadi kesalahan pada sistem.',
          confirmButtonColor: '#dc2626',
        });
      }

      fetchTroubleList();
      resetForm();
      return;
    }

    // ================================
    // MODE SINGLE (CREATE / EDIT)
    // ================================

    const payload = buildPayload(formData.id_camera);

    const method = isEditing ? 'put' : 'post';

    const url = isEditing ? `/list-camera-trouble/${editId}` : `/list-camera-trouble`;

    try {
      // ================================
      // LOADING
      // ================================

      Swal.fire({
        title: 'Menyimpan data...',

        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      // ================================
      // API REQUEST
      // ================================

      const response = await api({
        method,

        url,

        data: payload,
      });

      Swal.close();

      // ================================
      // SUCCESS
      // ================================

      await Swal.fire({
        icon: 'success',

        title: 'Berhasil',

        text:
          response.data.message ||
          (isEditing ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan'),

        timer: 2000,

        showConfirmButton: false,

        iconColor: '#16a34a',
      });

      fetchTroubleList();

      resetForm();
    } catch (error) {
      Swal.close();

      console.error('ERROR SAVE:', error.response?.data || error.message);

      const { errorTitle, errorMessage } = resolveErrorMessage(error);

      Swal.fire({
        icon: 'error',

        title: errorTitle,

        text: errorMessage,

        confirmButtonText: 'Mengerti',

        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleEdit = (item) => {
    // Fungsi bantu untuk ubah format ISO ke 'YYYY-MM-DDTHH:mm' biar bisa dipakai di input datetime-local
    const formatForInput = (dateStr) => {
      if (!dateStr || dateStr === '0001-01-01T00:00:00Z') return ''; // skip kalau kosong
      const date = new Date(dateStr);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };

    console.log('========== HANDLE EDIT ==========');
    console.log(item);
    console.log('item.id =', item.id);
    console.log('item.ID =', item.ID);

    setEditId(item.id ?? item.ID);

    console.log('SET EDIT ID =', item.id ?? item.ID);

    // Pastikan mode bulk tidak nyangkut saat pindah ke edit
    setIsBulkMode(false);
    setSelectedCameras([]);

    // Set formData berdasarkan data lama
    setFormData({
      id_camera: item.id_camera || '',
      lokasi: item.lokasi || '',
      lokasi_detail: item.lokasi_detail || '',
      status: item.selesai_perbaikan
        ? 'Selesai Perbaikan/On Kembali'
        : item.request_perbaikan
          ? 'Request Perbaikan'
          : item.start_error
            ? 'Error'
            : 'Kamera Dilepas',
      start_error: formatForInput(item.start_error),
      request_perbaikan: formatForInput(item.request_perbaikan),
      selesai_perbaikan: formatForInput(item.selesai_perbaikan),

      durasi_error: item.durasi_error || '00:00:00',

      response_time: item.response_time || '00:00:00',

      average_response: item.average_response || '00:00:00',

      petugas: item.petugas || '',
      keterangan: item.keterangan || '',
    });

    console.log('EDIT ID:', editId);
    console.log('URL:', `/list-camera-trouble/${editId}`);
    setIsEditing(true);
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    console.group('DELETE CAMERA TROUBLE');

    console.log('ID Camera yang akan dihapus :', item.id_camera);

    console.log('ID Database :', item.id);

    const confirm = await Swal.fire({
      title: `Hapus Camera ${item.id_camera}?`,

      text: 'Data trouble camera ini akan dihapus permanen.',

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Ya, Hapus',

      cancelButtonText: 'Batal',

      confirmButtonColor: '#dc2626',

      cancelButtonColor: '#6b7280',

      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      console.log('Delete dibatalkan user');

      console.groupEnd();

      return;
    }

    try {
      const url = `/list-camera-trouble/${item.id}`;

      console.log('Request URL:', url);

      Swal.fire({
        title: 'Menghapus data...',

        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await api.delete(url);

      Swal.close();

      console.log('SUCCESS');

      console.log(res.data);

      await Swal.fire({
        icon: 'success',

        title: 'Data berhasil dihapus',

        text: `Camera ${item.id_camera} berhasil dihapus.`,

        timer: 2000,

        showConfirmButton: false,
      });

      fetchTroubleList();
    } catch (error) {
      Swal.close();

      console.error('DELETE ERROR:', error.response?.data || error.message);

      Swal.fire({
        icon: 'error',

        title: 'Gagal menghapus',

        text: error.response?.data || 'Terjadi kesalahan saat menghapus data.',

        confirmButtonColor: '#dc2626',
      });
    }

    console.groupEnd();
  };

  const handleReleaseCamera = async (item) => {
    // ================================
    // KONFIRMASI
    // ================================

    const confirm = await Swal.fire({
      title: 'Lepas kamera?',

      text: 'Status kamera akan diubah menjadi "Kamera Dilepas".',

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Ya, Lepas Kamera',

      cancelButtonText: 'Batal',

      confirmButtonColor: '#4b5563',

      cancelButtonColor: '#dc2626',

      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // ================================
      // LOADING
      // ================================

      Swal.fire({
        title: 'Memproses...',

        text: 'Mengubah status kamera',

        allowOutsideClick: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      const payload = {
        ...item,
        status: 'Kamera Dilepas',
      };

      console.log('UPDATE CAMERA PAYLOAD:', payload);

      await api.put(
        `/list-camera-trouble/${item.id}`,

        payload,

        {
          headers: {
            Authorization: `Bearer ${token}`,

            'Content-Type': 'application/json',
          },
        }
      );

      Swal.close();

      // ================================
      // SUCCESS
      // ================================

      await Swal.fire({
        icon: 'success',

        title: 'Kamera berhasil dilepas',

        text: 'Status kamera telah berubah menjadi Kamera Dilepas.',

        timer: 2000,

        showConfirmButton: false,

        iconColor: '#16a34a',
      });

      fetchTroubleList();
    } catch (error) {
      Swal.close();

      console.error(
        'Gagal melepas kamera:',

        error.response?.data || error.message
      );

      let message = 'Terjadi kesalahan saat melepas kamera.';

      const serverError = error.response?.data?.toString();

      if (serverError?.includes('Data tidak ditemukan')) {
        message = 'Data kamera tidak ditemukan. Silakan refresh halaman.';
      } else if (error.response?.status === 500) {
        message = 'Terjadi kesalahan server saat memperbarui status kamera.';
      } else if (error.response?.status === 401) {
        message = 'Sesi login telah berakhir. Silakan login kembali.';
      }

      Swal.fire({
        icon: 'error',

        title: 'Gagal melepas kamera',

        text: message,

        confirmButtonColor: '#dc2626',
      });
    }
  };

  const filteredTroubleList = troubleList.filter((item) => {
    const year = new Date(item.start_error).getFullYear();

    const keyword = searchTerm.toLowerCase();

    const matchYear = selectedYear === 'all' || String(year) === String(selectedYear);

    const matchSearch =
      item.id_camera?.toLowerCase().includes(keyword) ||
      item.lokasi?.toLowerCase().includes(keyword) ||
      item.lokasi_detail?.toLowerCase().includes(keyword) ||
      item.status?.toLowerCase().includes(keyword);

    return matchYear && matchSearch;
  });

  const pageCount = Math.ceil(filteredTroubleList.length / itemsPerPage);

  const paginatedTroubleList = filteredTroubleList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ====== Chart data builders (use filteredTroubleList to reflect search/pagination filter) ====== */

  // eslint-disable-next-line no-unused-vars
  const cameraColor = (camera) => {
    const colors = [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#06B6D4',
      '#EC4899',
      '#84CC16',
      '#F97316',
      '#6366F1',
      '#14B8A6',
      '#A855F7',
    ];

    let hash = 0;

    for (let i = 0; i < camera.length; i++) {
      hash += camera.charCodeAt(i);
    }

    return colors[hash % colors.length];
  };

  // =====================================
  // CCTV TROUBLE RECOVERY ANALYSIS
  // =====================================
  const getCameraRecoveryAnalysis = (data = []) => {
    const totalTroubleIncident = data.length;

    let recovered = 0;
    let request = 0;
    let error = 0;

    const cameraRecovery = {};
    const areaRecovery = {};

    const isValidDate = (value) => {
      if (!value) return false;

      if (value === '0001-01-01T00:00:00Z' || value === '0001-01-01T00:00:00') {
        return false;
      }

      return !isNaN(new Date(value).getTime());
    };

    data.forEach((item) => {
      let recoveryStatus = 'Error';

      // ==========================
      // STATUS GLOBAL
      // ==========================

      if (isValidDate(item.selesai_perbaikan)) {
        recovered++;
        recoveryStatus = 'Selesai Perbaikan/On Kembali';
      } else if (isValidDate(item.request_perbaikan)) {
        request++;
        recoveryStatus = 'Request Perbaikan';
      } else {
        error++;
        recoveryStatus = 'Error';
      }

      // ==========================
      // CAMERA ANALYSIS
      // ==========================

      const camera = item.id_camera || 'UNKNOWN';

      if (!cameraRecovery[camera]) {
        cameraRecovery[camera] = {
          total: 0,
          recovered: 0,
          request: 0,
          error: 0,
        };
      }

      cameraRecovery[camera].total++;

      if (recoveryStatus === 'Selesai Perbaikan/On Kembali') {
        cameraRecovery[camera].recovered++;
      } else if (recoveryStatus === 'Request Perbaikan') {
        cameraRecovery[camera].request++;
      } else {
        cameraRecovery[camera].error++;
      }

      // ==========================
      // AREA ANALYSIS
      // ==========================

      const area = item.lokasi || 'UNKNOWN';

      if (!areaRecovery[area]) {
        areaRecovery[area] = {
          total: 0,
          recovered: 0,
        };
      }

      areaRecovery[area].total++;

      if (recoveryStatus === 'Selesai Perbaikan/On Kembali') {
        areaRecovery[area].recovered++;
      }
    });

    // ==========================
    // RECOVERY RATE
    // ==========================

    const recoveryRate =
      totalTroubleIncident === 0
        ? 0
        : Number(((recovered / totalTroubleIncident) * 100).toFixed(2));

    let healthLevel;

    if (recoveryRate >= 95) {
      healthLevel = 'EXCELLENT';
    } else if (recoveryRate >= 80) {
      healthLevel = 'GOOD';
    } else if (recoveryRate >= 50) {
      healthLevel = 'WARNING';
    } else {
      healthLevel = 'CRITICAL';
    }

    const cameraRanking = Object.entries(cameraRecovery)
      .map(([camera, value]) => ({
        camera,
        ...value,
      }))
      .sort((a, b) => b.total - a.total);

    const areaRanking = Object.entries(areaRecovery)
      .map(([area, value]) => ({
        area,
        ...value,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalTroubleIncident,

      recovered,

      request,

      error,

      recoveryRate,

      healthLevel,

      cameraRanking,

      areaRanking,

      highestRecoveryCamera: cameraRanking[0] || null,

      highestRecoveryArea: areaRanking[0] || null,

      insight: [
        `Total trouble record sebanyak ${totalTroubleIncident} incident.`,

        `${recovered} CCTV berhasil kembali normal.`,

        `${request} CCTV masih menunggu perbaikan.`,

        `${error} CCTV masih mengalami gangguan.`,

        `Recovery rate mencapai ${recoveryRate}%.`,
      ],

      recommendation: [
        'Prioritaskan CCTV Error yang belum masuk request perbaikan.',

        'Percepat penyelesaian CCTV yang masih Request Perbaikan.',

        'Monitoring kamera dengan histori trouble tinggi.',

        'Lakukan preventive maintenance berkala.',
      ],
    };
  };

  const getCameraRecoveryChart = (analysis) => {
    return {
      labels: ['Error', 'Request Perbaikan', 'On Kembali'],

      datasets: [
        {
          label: 'CCTV Trouble Status',

          data: [analysis.error, analysis.request, analysis.recovered],

          backgroundColor: ['#dc2626', '#f59e0b', '#16a34a'],

          borderColor: '#ffffff',

          borderWidth: 5,

          hoverOffset: 20,

          spacing: 5,
        },
      ],
    };
  };

  // =====================================
  // Trouble Distribution Analysis Per Area
  // =====================================
  const getTroubleAreaAnalysis = (data = []) => {
    const areaMap = {};

    // ==============================
    // Collect Trouble Per Area
    // ==============================

    data.forEach((item) => {
      const area = item.lokasi || item.lokasi_detail || 'UNKNOWN';

      if (!areaMap[area]) {
        areaMap[area] = 0;
      }

      areaMap[area]++;
    });

    // ==============================
    // Ranking Area
    // ==============================

    const ranking = Object.entries(areaMap)
      .map(([area, total]) => {
        const percentage = data.length === 0 ? 0 : Number(((total / data.length) * 100).toFixed(2));

        let risk = 'LOW';

        if (total >= 150) {
          risk = 'CRITICAL';
        } else if (total >= 100) {
          risk = 'HIGH';
        } else if (total >= 50) {
          risk = 'MEDIUM';
        }

        return {
          area,

          total,

          percentage,

          risk,
        };
      })
      .sort((a, b) => b.total - a.total);

    const highestArea = ranking[0] || {
      area: '-',
      total: 0,
      percentage: 0,
      risk: 'NO DATA',
    };

    const lowestArea =
      ranking.length > 0
        ? ranking[ranking.length - 1]
        : {
            area: '-',
            total: 0,
            percentage: 0,
            risk: 'NO DATA',
          };

    return {
      totalIncident: data.length,

      totalArea: ranking.length,

      highestArea,

      lowestArea,

      ranking,

      insight: [
        `Total trouble CCTV sebanyak ${data.length} incident.`,

        `Area ${highestArea.area} memiliki gangguan tertinggi sebanyak ${highestArea.total} incident (${highestArea.percentage}%).`,

        `Area tersebut menjadi prioritas utama maintenance.`,

        `Area dengan gangguan terendah adalah ${lowestArea.area}.`,
      ],

      recommendation: [
        `Prioritaskan inspeksi CCTV area ${highestArea.area}.`,

        'Analisa penyebab recurring trouble.',

        'Buat jadwal preventive maintenance berdasarkan risiko area.',
      ],
    };
  };

  // =====================================
  // Trouble Area Chart
  // =====================================

  const getTroubleAreaChart = (analysis = {}) => {
    const ranking = analysis.ranking || [];

    return {
      labels: ranking.map((item) => item.area),

      datasets: [
        {
          label: 'Jumlah Trouble Incident',

          data: ranking.map((item) => item.total),

          backgroundColor: ranking.map((item) => {
            if (item.risk === 'CRITICAL') return '#dc2626';

            if (item.risk === 'HIGH') return '#f97316';

            if (item.risk === 'MEDIUM') return '#f59e0b';

            return '#16a34a';
          }),

          borderRadius: 8,

          barThickness: 35,
        },
      ],
    };
  };

  // =====================================
  // CCTV ERROR RATE ANALYSIS
  // =====================================

  const getCameraErrorAnalysis = (data = []) => {
    const cameraMap = {};

    // ==============================
    // COLLECT ERROR PER CAMERA
    // ==============================

    data.forEach((item) => {
      const camera = item.id_camera || item.idCamera || item.camera || 'UNKNOWN';

      const area = item.lokasi || item.lokasi_detail || item.lokasiDetail || item.area || 'UNKNOWN';

      if (!cameraMap[camera]) {
        cameraMap[camera] = {
          camera,

          area,

          total: 0,
        };
      }

      if (cameraMap[camera].area === 'UNKNOWN' && area !== 'UNKNOWN') {
        cameraMap[camera].area = area;
      }

      cameraMap[camera].total++;
    });

    // ==============================
    // CAMERA RANKING
    // ==============================

    const ranking = Object.values(cameraMap)

      .map((item) => {
        let risk = 'LOW';

        if (item.total >= 15) {
          risk = 'CRITICAL';
        } else if (item.total >= 8) {
          risk = 'HIGH';
        } else if (item.total >= 3) {
          risk = 'MEDIUM';
        }

        const percentage =
          data.length === 0 ? 0 : Number(((item.total / data.length) * 100).toFixed(2));

        return {
          camera: item.camera,

          area: item.area,

          total: item.total,

          percentage,

          risk,
        };
      })

      .sort((a, b) => b.total - a.total);

    // ==============================
    // HIGHEST CAMERA
    // ==============================

    const highestCamera = ranking[0] || {
      camera: '-',

      area: '-',

      total: 0,

      percentage: 0,

      risk: 'NO DATA',
    };

    const lowestCamera =
      ranking.length > 0
        ? ranking[ranking.length - 1]
        : {
            camera: '-',

            area: '-',

            total: 0,

            percentage: 0,

            risk: 'NO DATA',
          };

    // ==============================
    // AREA DISTRIBUTION
    // ==============================

    const areaMap = {};

    ranking.forEach((item) => {
      const area = item.area || 'UNKNOWN';

      if (!areaMap[area]) {
        areaMap[area] = 0;
      }

      areaMap[area] += item.total;
    });

    const areaRanking = Object.entries(areaMap)

      .map(([area, total]) => ({
        area,

        total,
      }))

      .sort((a, b) => b.total - a.total);

    const highestArea = areaRanking[0] || {
      area: '-',

      total: 0,
    };

    // ==============================
    // SUMMARY
    // ==============================

    const totalError = ranking.reduce((sum, item) => sum + item.total, 0);

    const totalCamera = ranking.length;

    // ==============================
    // GLOBAL RISK
    // ==============================

    let riskLevel = 'LOW';

    if (totalError >= 100) {
      riskLevel = 'CRITICAL';
    } else if (totalError >= 50) {
      riskLevel = 'HIGH';
    } else if (totalError >= 20) {
      riskLevel = 'MEDIUM';
    }

    const criticalCamera = ranking.filter((item) => item.risk === 'CRITICAL').length;

    return {
      totalError,

      totalCamera,

      highestCamera,

      lowestCamera,

      highestArea,

      ranking,

      areaRanking,

      riskLevel,

      criticalCamera,

      insight: [
        `Total error CCTV sebanyak ${totalError} incident.`,

        `${highestCamera.camera} menjadi kamera dengan gangguan tertinggi sebanyak ${highestCamera.total} error (${highestCamera.percentage}%).`,

        `${highestArea.area} merupakan area dengan kontribusi error terbesar sebanyak ${highestArea.total} incident.`,

        `${criticalCamera} camera masuk kategori critical dan membutuhkan inspeksi.`,
      ],

      recommendation: [
        `Prioritaskan pengecekan CCTV ${highestCamera.camera}.`,

        `Lakukan inspeksi area ${highestArea.area} karena memiliki tingkat gangguan tertinggi.`,

        'Evaluasi penyebab recurring failure pada kamera dengan error berulang.',

        'Susun preventive maintenance berdasarkan tingkat risiko camera.',
      ],
    };
  };

  // =====================================
  // CAMERA ERROR RANKING CHART
  // =====================================

  const getCameraErrorChart = (analysis = {}) => {
    const ranking = analysis.ranking?.slice(0, 10) || [];

    return {
      labels: ranking.map((item) => item.camera),

      datasets: [
        {
          label: 'Jumlah Error (Incident)',

          data: ranking.map((item) => item.total),

          backgroundColor: ranking.map((item) => {
            if (item.risk === 'CRITICAL') return '#ef4444';

            if (item.risk === 'HIGH') return '#fb923c';

            if (item.risk === 'MEDIUM') return '#fde047';

            return '#86efac';
          }),

          borderRadius: 12,

          barThickness: 28,
        },
      ],
    };
  };

  // =====================================
  // CCTV ERROR DURATION ANALYSIS
  // =====================================

  const getCameraErrorDurationAnalysis = (data = []) => {
    const cameraMap = {};

    // =====================================
    // COLLECT DATA
    // =====================================

    data.forEach((item) => {
      const camera = item.id_camera || item.idCamera || item.camera || 'UNKNOWN';

      const area = item.lokasi || item.lokasi_detail || item.area || 'UNKNOWN';

      const duration = hhmmssToSeconds(item.durasi_error || item.durasiError || '00:00:00');

      if (!cameraMap[camera]) {
        cameraMap[camera] = {
          camera,
          area,
          incident: 0,
          totalDurationSeconds: 0,
        };
      }

      cameraMap[camera].incident++;

      cameraMap[camera].totalDurationSeconds += duration;
    });

    // =====================================
    // GLOBAL TOTAL
    // =====================================

    const totalDowntimeSeconds = Object.values(cameraMap).reduce(
      (sum, item) => sum + item.totalDurationSeconds,
      0
    );

    // =====================================
    // CAMERA RANKING
    // =====================================

    const ranking = Object.values(cameraMap)
      .map((item) => {
        const avg = item.totalDurationSeconds / item.incident;

        const downtimePercentage =
          totalDowntimeSeconds > 0
            ? Number(((item.totalDurationSeconds / totalDowntimeSeconds) * 100).toFixed(2))
            : 0;

        const hours = avg / 3600;

        let risk = 'LOW';

        if (hours >= 24 || item.incident >= 20) {
          risk = 'CRITICAL';
        } else if (hours >= 12 || item.incident >= 10) {
          risk = 'HIGH';
        } else if (hours >= 5 || item.incident >= 5) {
          risk = 'MEDIUM';
        }

        return {
          camera: item.camera,

          area: item.area,

          incident: item.incident,

          totalDurationSeconds: item.totalDurationSeconds,

          totalDuration: secondsToHhmmss(item.totalDurationSeconds),

          averageDurationSeconds: avg,

          averageDuration: secondsToHhmmss(avg),

          downtimePercentage,

          risk,
        };
      })
      .sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds);

    // =====================================
    // AREA RANKING
    // =====================================

    const areaMap = {};

    ranking.forEach((item) => {
      const area = item.area;

      if (!areaMap[area]) {
        areaMap[area] = 0;
      }

      areaMap[area] += item.totalDurationSeconds;
    });

    const areaRanking = Object.entries(areaMap)
      .map(([area, total]) => ({
        area,

        totalDurationSeconds: total,

        duration: secondsToHhmmss(total),
      }))
      .sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds);

    const highestCamera = ranking[0] || {
      camera: '-',
      totalDuration: '00:00:00',
      risk: 'NO DATA',
    };

    const highestArea = areaRanking[0] || {
      area: '-',
      duration: '00:00:00',
    };

    const averageDurationSeconds = data.length > 0 ? totalDowntimeSeconds / data.length : 0;

    let riskLevel = 'LOW';

    const avgHour = averageDurationSeconds / 3600;

    if (avgHour >= 24) {
      riskLevel = 'CRITICAL';
    } else if (avgHour >= 12) {
      riskLevel = 'HIGH';
    } else if (avgHour >= 5) {
      riskLevel = 'MEDIUM';
    }

    return {
      totalDurationSeconds: totalDowntimeSeconds,

      totalDuration: secondsToHhmmss(totalDowntimeSeconds),

      averageDuration: secondsToHhmmss(averageDurationSeconds),

      totalCamera: ranking.length,

      totalIncident: data.length,

      highestCamera,

      highestArea,

      ranking,

      areaRanking,

      riskLevel,

      insight: [
        `Total downtime CCTV ${secondsToHhmmss(totalDowntimeSeconds)}.`,

        `${highestCamera.camera} memiliki downtime tertinggi ${highestCamera.totalDuration}.`,

        `${highestArea.area} merupakan area dengan downtime terbesar (${highestArea.duration}).`,

        `${ranking.filter((x) => x.risk === 'CRITICAL').length} kamera masuk kategori critical.`,
      ],

      recommendation: [
        `Prioritaskan kamera ${highestCamera.camera} untuk analisa root cause.`,

        `Lakukan inspeksi area ${highestArea.area}.`,

        'Evaluasi MTTR untuk mempercepat recovery.',

        'Gunakan histori downtime sebagai dasar preventive maintenance.',
      ],
    };
  };

  // =====================================
  // CCTV DOWNTIME TREND CHART
  // =====================================

  const getCameraErrorDurationChart = () => {
    const dailyDowntime = {};

    filteredTroubleList.forEach((item) => {
      const date = new Date(item.tanggal_input);

      if (isNaN(date)) return;

      const label = date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      });

      const duration = hhmmssToSeconds(item.durasi_error || '00:00:00');

      if (!dailyDowntime[label]) {
        dailyDowntime[label] = 0;
      }

      dailyDowntime[label] += duration;
    });

    const labels = Object.keys(dailyDowntime);

    return {
      labels,

      datasets: [
        {
          label: 'Downtime CCTV (Hours)',

          data: labels.map((item) => Number((dailyDowntime[item] / 3600).toFixed(2))),

          // AREA COLOR
          backgroundColor: 'rgba(148, 163, 184, 0.35)',

          // LINE COLOR
          borderColor: '#64748b',

          borderWidth: 2,

          fill: true,

          tension: 0.45,

          pointRadius: 3,

          pointHoverRadius: 6,

          pointBackgroundColor: '#475569',

          pointBorderColor: '#ffffff',

          pointBorderWidth: 2,
        },
      ],
    };
  };

  // =====================================
  // CAMERA ERROR IMPACT ANALYSIS
  // ERROR VS DURATION COMPARISON
  // =====================================

  const getCameraErrorImpactAnalysis = () => {
    const cameraMap = {};

    // =====================================
    // COLLECT ERROR DATA
    // =====================================

    troubleList.forEach((item) => {
      const camera = item.id_camera || item.idCamera || item.camera || 'UNKNOWN';

      const area = item.lokasi || item.lokasi_detail || item.lokasiDetail || item.area || 'UNKNOWN';

      const duration = hhmmssToSeconds(item.durasi_error || item.durasiError || '00:00:00');

      if (!cameraMap[camera]) {
        cameraMap[camera] = {
          camera,

          area,

          totalError: 0,

          totalDurationSeconds: 0,
        };
      }

      cameraMap[camera].totalError++;

      cameraMap[camera].totalDurationSeconds += duration;
    });

    // =====================================
    // GLOBAL TOTAL
    // =====================================

    const totalError = Object.values(cameraMap).reduce((sum, item) => sum + item.totalError, 0);

    const totalDurationSeconds = Object.values(cameraMap).reduce(
      (sum, item) => sum + item.totalDurationSeconds,
      0
    );

    const ranking = Object.values(cameraMap)

      .map((item) => {
        const durationHour = item.totalDurationSeconds / 3600;

        const errorPercentage =
          totalError > 0 ? Number(((item.totalError / totalError) * 100).toFixed(2)) : 0;

        const durationPercentage =
          totalDurationSeconds > 0
            ? Number(((item.totalDurationSeconds / totalDurationSeconds) * 100).toFixed(2))
            : 0;

        // ============================
        // IMPACT SCORE
        // ============================

        const impactScore = Number((errorPercentage * 0.4 + durationPercentage * 0.6).toFixed(2));

        let impactLevel = 'LOW';

        if (impactScore >= 40) {
          impactLevel = 'CRITICAL';
        } else if (impactScore >= 25) {
          impactLevel = 'HIGH';
        } else if (impactScore >= 10) {
          impactLevel = 'MEDIUM';
        }

        return {
          camera: item.camera,

          area: item.area,

          // ERROR

          totalError: item.totalError,

          // supaya chart lama tetap jalan
          incident: item.totalError,

          errorPercentage,

          // DURATION

          totalDurationSeconds: item.totalDurationSeconds,

          totalDuration: secondsToHhmmss(item.totalDurationSeconds),

          durationHour: Number(durationHour.toFixed(2)),

          durationPercentage,

          // IMPACT

          impactScore,

          impactLevel,
        };
      })

      .sort((a, b) => b.impactScore - a.impactScore);

    // =====================================
    // HIGHEST IMPACT
    // =====================================

    const highestImpact = ranking[0] || {
      camera: '-',

      totalError: 0,

      totalDuration: '00:00:00',

      impactLevel: 'NO DATA',
    };

    return {
      totalCamera: ranking.length,

      totalError,

      totalDuration: secondsToHhmmss(totalDurationSeconds),

      highestImpact,

      criticalCount: ranking.filter((x) => x.impactLevel === 'CRITICAL').length,

      ranking,

      insight: [
        `${highestImpact.camera} memiliki kontribusi downtime terbesar ${highestImpact.durationPercentage}%.`,

        `${highestImpact.camera} mengalami ${highestImpact.totalError} kali error dengan total downtime ${highestImpact.totalDuration}.`,

        `${
          ranking.filter((x) => x.impactLevel === 'CRITICAL').length
        } camera masuk kategori critical impact.`,
      ],

      recommendation: [
        `Prioritaskan maintenance ${highestImpact.camera}.`,

        'Bandingkan frekuensi error dengan downtime untuk menentukan prioritas perbaikan.',

        'Gunakan data error impact sebagai dasar preventive maintenance.',
      ],
    };
  };

  const getCameraErrorImpactChart = () => {
    const ranking = errorImpactAnalysis?.ranking || [];

    return {
      labels: ranking.map((item) => item.camera),

      datasets: [
        {
          label: 'Jumlah Error',

          data: ranking.map((item) => item.totalError),

          borderColor: '#2563eb',

          backgroundColor: '#2563eb',

          pointRadius: 6,

          borderWidth: 3,

          tension: 0.4,

          yAxisID: 'error',
        },

        {
          label: 'Durasi Error (Jam)',

          data: ranking.map((item) => item.durationHour),

          borderColor: '#ef4444',

          backgroundColor: '#ef4444',

          pointRadius: 6,

          borderWidth: 3,

          tension: 0.4,

          yAxisID: 'duration',
        },
      ],
    };
  };

  const recoveryAnalysis = getCameraRecoveryAnalysis(filteredTroubleList);
  const recoveryChart = getCameraRecoveryChart(recoveryAnalysis);
  const areaAnalysis = getTroubleAreaAnalysis(filteredTroubleList);
  const areaChart = getTroubleAreaChart(areaAnalysis);
  const errorAnalysis = getCameraErrorAnalysis(filteredTroubleList);
  const errorChart = getCameraErrorChart(errorAnalysis);
  const durationAnalysis = getCameraErrorDurationAnalysis(filteredTroubleList);
  const durationChart = getCameraErrorDurationChart(durationAnalysis);
  const errorImpactAnalysis = getCameraErrorImpactAnalysis(filteredTroubleList);
  const errorImpactChart = getCameraErrorImpactChart(errorImpactAnalysis);

  const getStatusHighlight = (status) => {
    switch (status) {
      case 'Request Perbaikan':
        return 'bg-orange-100 text-orange-700';

      case 'Error':
        return 'bg-red-100 text-red-700';

      case 'Selesai Perbaikan':
      case 'Selesai Perbaikan/On Kembali':
        return 'bg-green-100 text-green-700';

      case 'Kamera Dilepas':
        return 'bg-red-200 text-red-800';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderDurationError = (item) => {
    if (item?.durasi_error && item.durasi_error !== '0:00:00' && item.durasi_error !== '00:00:00') {
      return <span className="text-blue-700 font-semibold">{item.durasi_error}</span>;
    }

    const start = item?.start_error ? new Date(item.start_error) : null;
    const selesai = item?.selesai_perbaikan ? new Date(item.selesai_perbaikan) : null;

    if (!start || isNaN(start.getTime())) {
      return (
        <div>
          <span className="text-red-600 font-semibold">00:00:00</span>
          <div className="text-xs text-gray-500">Start kosong</div>
        </div>
      );
    }

    if (!selesai || isNaN(selesai.getTime())) {
      return (
        <div>
          <span className="text-orange-600 font-semibold">00:00:00</span>
          <div className="text-xs text-gray-500">Belum selesai</div>
        </div>
      );
    }

    const diff = Math.floor((selesai - start) / 1000);

    if (diff <= 0) {
      return (
        <div>
          <span className="text-red-600 font-semibold">00:00:00</span>
          <div className="text-xs text-red-500">Tidak logis</div>
        </div>
      );
    }

    return <span className="text-blue-700 font-semibold">{secondsToHhmmss(diff)}</span>;
  };

  const renderResponseTime = (item) => {
    if (item?.response_time) {
      return <span className="text-green-600 font-semibold">{item.response_time}</span>;
    }

    const request = item?.request_perbaikan ? new Date(item.request_perbaikan) : null;

    const selesai = item?.selesai_perbaikan ? new Date(item.selesai_perbaikan) : null;

    if (!request || isNaN(request.getTime())) {
      return (
        <div>
          <span className="text-red-600 font-semibold">00:00:00</span>
          <div className="text-xs text-gray-500">Belum request</div>
        </div>
      );
    }

    if (!selesai || isNaN(selesai.getTime())) {
      return (
        <div>
          <span className="text-orange-600 font-semibold">00:00:00</span>
          <div className="text-xs text-gray-500">Belum selesai</div>
        </div>
      );
    }

    const diff = Math.floor((selesai - request) / 1000);

    if (diff <= 0) {
      return <span className="text-red-600 font-semibold">00:00:00</span>;
    }

    return <span className="text-green-600 font-semibold">{secondsToHhmmss(diff)}</span>;
  };

  const currentYear = new Date().getFullYear();

  // eslint-disable-next-line no-unused-vars
  const troubleYears = Array.from({ length: currentYear - 2024 + 1 }, (_, index) => 2024 + index);

  return (
    <>
      {/* ===========================
        SESSION EXPIRED MODAL
    =========================== */}
      {showSessionExpired && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[9999]">
          <div className="bg-white rounded-3xl shadow-2xl w-[480px] overflow-hidden">
            <div className="bg-red-600 text-white py-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-5xl">
                🔒
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-3xl font-bold text-center mb-4">Session Expired</h2>

              <p className="text-center text-gray-500 leading-8">
                Demi menjaga keamanan akun Anda,
                <br />
                sesi login telah berakhir.
                <br />
                Silakan login kembali untuk melanjutkan.
              </p>

              <button
                className="mt-8 w-full rounded-xl py-4 bg-blue-600 hover:bg-blue-700 transition text-white font-bold text-lg"
                onClick={() => {
                  localStorage.clear();
                  navigate('/');
                }}
              >
                Login Kembali
              </button>
            </div>
          </div>
        </div>
      )}
      <Layout>
        {/* ====== TROUBLE CAMERA DASHBOARD ====== */}
        <section className="relative max-w-7xl mx-auto mt-10 px-6">
          <Swiper
            modules={[Pagination]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
            }}
            spaceBetween={40}
            slidesPerView={1}
            className="px-8 pb-16 pt-8"
          >
            {/* ====================== Slide 1 ====================== */}

            <SwiperSlide>
              <div onClick={() => setShowRecovery(true)} className="group cursor-pointer">
                <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                  {/* HEADER */}
                  <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                    <div className="min-w-0">
                      <p className="uppercase tracking-[3px] text-orange-600 text-[11px] font-semibold">
                        CCTV Maintenance Center
                      </p>

                      <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                          <FiTool size={17} />
                        </span>
                        Intelijen Pemulihan Gangguan CCTV
                      </h2>

                      <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Monitoring gangguan CCTV, progres perbaikan, dan performa pemulihan kamera
                      </p>
                    </div>
                  </div>

                  {/* CHART */}
                  <div className="rounded-xl border border-slate-100 p-3 md:p-6 mb-6">
                    <div className="h-[320px] md:h-[380px] flex justify-center items-center">
                      <Doughnut
                        data={recoveryChart}
                        plugins={[recoveryCenterText]}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: '75%',
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percent = ((context.raw / total) * 100).toFixed(2);
                                  return `${context.label}: ${context.raw} Kamera (${percent}%)`;
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* STATUS CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                      <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiAlertTriangle size={12} />
                        Gangguan
                      </p>
                      <h3 className="text-3xl md:text-4xl font-bold text-rose-600 mt-2 tabular-nums">
                        {recoveryAnalysis.error}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Kamera Bermasalah</p>
                    </div>

                    <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                      <p className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiClock size={12} />
                        Perbaikan
                      </p>
                      <h3 className="text-3xl md:text-4xl font-bold text-amber-600 mt-2 tabular-nums">
                        {recoveryAnalysis.request}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Dalam Proses Perbaikan</p>
                    </div>

                    <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-5">
                      <p className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiCheckCircle size={12} />
                        Pulih
                      </p>
                      <h3 className="text-3xl md:text-4xl font-bold text-emerald-600 mt-2 tabular-nums">
                        {recoveryAnalysis.recovered}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Kamera Aktif Kembali</p>
                    </div>
                  </div>

                  {/* FOOTER STATUS */}
                  <div className="rounded-xl bg-slate-900 text-white p-5 flex flex-wrap gap-3 justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">
                        Performa Pemulihan
                      </p>
                      <h3 className="text-lg md:text-xl font-bold mt-1">
                        {recoveryAnalysis.healthLevel}
                        <span className="text-slate-400 text-sm font-normal ml-2">
                          ({recoveryAnalysis.recoveryRate}% Tingkat Pemulihan)
                        </span>
                      </h3>
                    </div>

                    <div
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                        recoveryAnalysis.recoveryRate >= 90
                          ? 'bg-emerald-500'
                          : recoveryAnalysis.recoveryRate >= 70
                            ? 'bg-blue-500'
                            : 'bg-rose-500'
                      }`}
                    >
                      {recoveryAnalysis.recoveryRate >= 90
                        ? 'SEHAT'
                        : recoveryAnalysis.recoveryRate >= 70
                          ? 'PANTAU'
                          : 'KRITIS'}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* ====================== Slide 2 ====================== */}
            {/* ====================== Slide CCTV Trouble Distribution ====================== */}

            <SwiperSlide>
              <div onClick={() => setShowArea(true)} className="group cursor-pointer">
                <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                  {/* HEADER */}
                  <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                    <div className="min-w-0">
                      <p className="uppercase tracking-[3px] text-rose-600 text-[11px] font-semibold">
                        CCTV Risk Monitoring
                      </p>

                      <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                          <FiBarChart2 size={17} />
                        </span>
                        Analisis Distribusi Gangguan CCTV
                      </h2>

                      <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Analisis frekuensi gangguan berdasarkan area operasional CCTV
                      </p>
                    </div>
                  </div>

                  {/* CHART */}
                  <div className="rounded-xl border border-slate-100 p-3 md:p-6 mb-6">
                    <div className="h-[320px] md:h-[380px] flex justify-center items-center">
                      <Bar
                        data={
                          areaChart && areaChart.labels && areaChart.datasets
                            ? areaChart
                            : {
                                labels: [],
                                datasets: [
                                  {
                                    label: 'Jumlah Gangguan CCTV',
                                    data: [],
                                  },
                                ],
                              }
                        }
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                            datalabels: {
                              anchor: 'end',
                              align: 'right',
                              formatter: (value) => value,
                              font: {
                                weight: 'bold',
                                size: 14,
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  return `${context.raw} Gangguan`;
                                },
                              },
                            },
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              grid: {
                                display: false,
                              },
                              title: {
                                display: true,
                                text: 'Jumlah Gangguan',
                              },
                            },
                            y: {
                              grid: {
                                display: false,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* KPI SUMMARY */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                        <FiActivity size={12} />
                        Total Gangguan
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                        <CountUp end={areaAnalysis?.totalIncident || 0} duration={2} />
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Seluruh Gangguan CCTV</p>
                    </div>

                    <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4">
                      <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiAlertTriangle size={12} />
                        Area Risiko Tertinggi
                      </p>
                      <h3 className="text-lg md:text-xl font-bold text-rose-600 mt-2 truncate">
                        {areaAnalysis?.highestArea?.area || '-'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {areaAnalysis?.highestArea?.total || 0} Gangguan
                      </p>
                    </div>

                    <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-4">
                      <p className="flex items-center gap-1.5 text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiTrendingUp size={12} />
                        Kontribusi
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-orange-600 mt-2 tabular-nums">
                        {areaAnalysis?.highestArea?.percentage || 0}%
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Dari Total Gangguan</p>
                    </div>

                    <div
                      className={`rounded-xl border p-4 ${
                        areaAnalysis?.highestArea?.risk === 'CRITICAL'
                          ? 'bg-rose-50/60 border-rose-100'
                          : areaAnalysis?.highestArea?.risk === 'HIGH'
                            ? 'bg-orange-50/60 border-orange-100'
                            : areaAnalysis?.highestArea?.risk === 'MEDIUM'
                              ? 'bg-amber-50/60 border-amber-100'
                              : 'bg-emerald-50/60 border-emerald-100'
                      }`}
                    >
                      <p
                        className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                          areaAnalysis?.highestArea?.risk === 'CRITICAL'
                            ? 'text-rose-700'
                            : areaAnalysis?.highestArea?.risk === 'HIGH'
                              ? 'text-orange-700'
                              : areaAnalysis?.highestArea?.risk === 'MEDIUM'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                        }`}
                      >
                        <FiAlertTriangle size={12} />
                        Tingkat Risiko
                      </p>
                      <h3
                        className={`text-lg md:text-xl font-bold mt-2 ${
                          areaAnalysis?.highestArea?.risk === 'CRITICAL'
                            ? 'text-rose-600'
                            : areaAnalysis?.highestArea?.risk === 'HIGH'
                              ? 'text-orange-600'
                              : areaAnalysis?.highestArea?.risk === 'MEDIUM'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                        }`}
                      >
                        {areaAnalysis?.highestArea?.risk || 'TIDAK ADA DATA'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Prioritas Pemeliharaan</p>
                    </div>
                  </div>

                  {/* LEGEND */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3 text-center">
                      <FiCheckCircle className="mx-auto mb-1 text-emerald-600" size={16} />
                      <p className="font-semibold text-emerald-700 text-xs">RENDAH</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">&lt; 50 Gangguan</p>
                    </div>

                    <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-3 text-center">
                      <FiActivity className="mx-auto mb-1 text-amber-600" size={16} />
                      <p className="font-semibold text-amber-700 text-xs">SEDANG</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">50 - 99 Gangguan</p>
                    </div>

                    <div className="rounded-lg bg-orange-50/60 border border-orange-100 p-3 text-center">
                      <FiAlertTriangle className="mx-auto mb-1 text-orange-600" size={16} />
                      <p className="font-semibold text-orange-700 text-xs">TINGGI</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">100 - 149 Gangguan</p>
                    </div>

                    <div className="rounded-lg bg-rose-50/60 border border-rose-100 p-3 text-center">
                      <FiAlertTriangle className="mx-auto mb-1 text-rose-600" size={16} />
                      <p className="font-semibold text-rose-700 text-xs">KRITIS</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">≥150 Gangguan</p>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="rounded-xl bg-slate-900 text-white p-5 flex flex-wrap gap-4 justify-between items-center">
                    <div className="min-w-0">
                      <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">
                        Insight Manajemen
                      </p>
                      <h3 className="text-sm md:text-base font-semibold mt-1.5">
                        {areaAnalysis?.insight?.[1] || 'Belum terdapat analisa area.'}
                      </h3>
                    </div>

                    <div className="bg-white/10 px-4 py-2.5 rounded-xl text-center shrink-0">
                      <p className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Total Area
                      </p>
                      <h2 className="text-2xl font-bold tabular-nums">
                        {areaAnalysis?.totalArea || 0}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* ====================== Slide 3 ====================== */}
            {/* ====================== Slide CCTV Error Ranking ====================== */}
            <SwiperSlide>
              <div onClick={() => setShowError(true)} className="group cursor-pointer">
                <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                  {/* HEADER */}
                  <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                    <div className="min-w-0">
                      <p className="uppercase tracking-[3px] text-orange-600 text-[11px] font-semibold">
                        CCTV Error Monitoring
                      </p>

                      <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                          <FiBarChart2 size={17} />
                        </span>
                        Analisis Ranking Error CCTV
                      </h2>

                      <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Analisis frekuensi kerusakan kamera dan prioritas pemeliharaan
                      </p>
                    </div>
                  </div>

                  {/* CHART */}
                  <div className="rounded-xl border border-slate-100 p-3 md:p-6 mb-6">
                    <div className="h-[300px] md:h-[350px] flex justify-center items-center">
                      <Bar
                        data={
                          errorChart || {
                            labels: [],
                            datasets: [],
                          }
                        }
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                          plugins: {
                            legend: {
                              display: false,
                            },
                            datalabels: {
                              anchor: 'end',
                              align: 'right',
                              formatter: (value) => value,
                              font: {
                                weight: 'bold',
                                size: 14,
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (ctx) => `${ctx.raw} Gangguan`,
                              },
                            },
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              grid: {
                                display: false,
                              },
                              title: {
                                display: true,
                                text: 'Jumlah Gangguan CCTV',
                              },
                            },
                            y: {
                              grid: {
                                display: false,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* KPI */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                        <FiAlertTriangle size={12} />
                        Total Gangguan
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                        {errorAnalysis?.totalError || 0}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Seluruh Data Gangguan</p>
                    </div>

                    <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-4">
                      <p className="flex items-center gap-1.5 text-orange-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiCamera size={12} />
                        Kamera Terdampak
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-orange-600 mt-2 tabular-nums">
                        {errorAnalysis?.totalCamera || 0}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Kamera Bermasalah</p>
                    </div>

                    <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4">
                      <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiAlertTriangle size={12} />
                        Kamera Terburuk
                      </p>
                      <h3 className="text-lg md:text-xl font-bold text-rose-600 mt-2 truncate">
                        {errorAnalysis?.highestCamera?.camera || '-'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {errorAnalysis?.highestCamera?.total || 0} Gangguan
                      </p>
                    </div>

                    <div
                      className={`rounded-xl border p-4 ${
                        errorAnalysis?.riskLevel === 'CRITICAL'
                          ? 'bg-rose-50/60 border-rose-100'
                          : errorAnalysis?.riskLevel === 'HIGH'
                            ? 'bg-orange-50/60 border-orange-100'
                            : errorAnalysis?.riskLevel === 'MEDIUM'
                              ? 'bg-amber-50/60 border-amber-100'
                              : 'bg-emerald-50/60 border-emerald-100'
                      }`}
                    >
                      <p
                        className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                          errorAnalysis?.riskLevel === 'CRITICAL'
                            ? 'text-rose-700'
                            : errorAnalysis?.riskLevel === 'HIGH'
                              ? 'text-orange-700'
                              : errorAnalysis?.riskLevel === 'MEDIUM'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                        }`}
                      >
                        <FiShield size={12} />
                        Tingkat Risiko
                      </p>
                      <h3
                        className={`text-lg md:text-xl font-bold mt-2 ${
                          errorAnalysis?.riskLevel === 'CRITICAL'
                            ? 'text-rose-600'
                            : errorAnalysis?.riskLevel === 'HIGH'
                              ? 'text-orange-600'
                              : errorAnalysis?.riskLevel === 'MEDIUM'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                        }`}
                      >
                        {errorAnalysis?.riskLevel || 'TIDAK ADA DATA'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Prioritas Perbaikan</p>
                    </div>
                  </div>

                  {/* LEGEND */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3 text-center">
                      <FiCheckCircle className="mx-auto mb-1 text-emerald-600" size={16} />
                      <p className="font-semibold text-emerald-700 text-xs">RENDAH</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">&lt; 5 Gangguan</p>
                    </div>

                    <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-3 text-center">
                      <FiActivity className="mx-auto mb-1 text-amber-600" size={16} />
                      <p className="font-semibold text-amber-700 text-xs">SEDANG</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">5 - 9 Gangguan</p>
                    </div>

                    <div className="rounded-lg bg-orange-50/60 border border-orange-100 p-3 text-center">
                      <FiAlertTriangle className="mx-auto mb-1 text-orange-600" size={16} />
                      <p className="font-semibold text-orange-700 text-xs">TINGGI</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">10 - 19 Gangguan</p>
                    </div>

                    <div className="rounded-lg bg-rose-50/60 border border-rose-100 p-3 text-center">
                      <FiAlertTriangle className="mx-auto mb-1 text-rose-600" size={16} />
                      <p className="font-semibold text-rose-700 text-xs">KRITIS</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">≥ 20 Gangguan</p>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="rounded-xl bg-slate-900 text-white p-5 flex flex-wrap gap-4 justify-between items-center">
                    <div className="min-w-0">
                      <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">
                        Insight Manajemen
                      </p>
                      <h3 className="text-sm md:text-base font-semibold mt-1.5">
                        {errorAnalysis?.insight?.[1] || 'Belum terdapat analisa error CCTV.'}
                      </h3>
                    </div>

                    <div className="bg-white/10 px-4 py-2.5 rounded-xl text-center shrink-0">
                      <p className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Total Kamera
                      </p>
                      <h2 className="text-2xl font-bold tabular-nums">
                        {errorAnalysis?.totalCamera || 0}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* ====================== Slide 4 ====================== */}
            {/* ====================== Slide CCTV Downtime Analysis ====================== */}

            <SwiperSlide>
              <div onClick={() => setShowDurationError(true)} className="group cursor-pointer">
                <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                  {/* HEADER */}
                  <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                    <div className="min-w-0">
                      <p className="uppercase tracking-[3px] text-rose-600 text-[11px] font-semibold">
                        CCTV Performance Monitoring
                      </p>

                      <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                          <FiClock size={17} />
                        </span>
                        Analisis Kontribusi Downtime CCTV
                      </h2>

                      <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Analisis kontribusi kamera terhadap total waktu gangguan CCTV
                      </p>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    {/* LEFT CHART */}
                    <div className="rounded-xl border border-slate-100 p-5 h-[340px] md:h-[380px]">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                        Distribusi Kontribusi Downtime
                      </h3>

                      <div className="h-[260px] md:h-[290px] flex justify-center">
                        <Line
                          data={durationChart}
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
                                    return `${context.raw} Jam`;
                                  },
                                },
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Downtime (Jam)',
                                },
                                grid: {
                                  color: 'rgba(0,0,0,0.08)',
                                },
                              },
                              x: {
                                grid: {
                                  display: false,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* RIGHT RANKING */}
                    <div className="rounded-xl border border-slate-100 p-5 h-[340px] md:h-[380px] overflow-y-auto">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                        <FiTrendingDown size={15} className="text-rose-500" />
                        Kamera Penyumbang Downtime Tertinggi
                      </h3>

                      <div className="space-y-3">
                        {durationAnalysis?.ranking?.slice(0, 5)?.map((item, index) => (
                          <div
                            key={item.camera}
                            className="rounded-lg bg-slate-50 border border-slate-100 p-3.5"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">
                                  #{index + 1} {item.camera}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <FiMapPin size={11} />
                                  {item.area}
                                </p>
                              </div>

                              <div className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-600 font-semibold text-xs shrink-0">
                                {item.downtimePercentage || 0}%
                              </div>
                            </div>

                            <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <FiClock size={11} />
                                {item.totalDuration}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiActivity size={11} />
                                {item.incident} Gangguan
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* KPI */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                        <FiCamera size={12} />
                        Jumlah Kamera
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                        {durationAnalysis?.totalCamera || 0}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                      <p className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiClock size={12} />
                        Total Downtime
                      </p>
                      <h3 className="text-lg md:text-xl font-bold text-blue-600 mt-2 tabular-nums">
                        {durationAnalysis?.totalDuration || '00:00:00'}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4">
                      <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiAlertTriangle size={12} />
                        Kontributor Tertinggi
                      </p>
                      <h3 className="text-sm md:text-base font-bold text-rose-600 mt-2 truncate">
                        {durationAnalysis?.highestCamera?.camera || '-'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {durationAnalysis?.highestCamera?.downtimePercentage || 0}%
                      </p>
                    </div>

                    <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                      <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide">
                        Tingkat Risiko
                      </p>
                      <h3 className="text-lg md:text-xl font-bold text-amber-600 mt-2">
                        {durationAnalysis?.riskLevel || 'TIDAK ADA DATA'}
                      </h3>
                    </div>
                  </div>

                  {/* INSIGHT */}
                  <div className="rounded-xl bg-slate-900 text-white p-5">
                    <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">
                      Insight Manajemen
                    </p>
                    <h3 className="text-sm md:text-base font-semibold mt-1.5">
                      {durationAnalysis?.insight?.[1] || 'Belum terdapat analisa downtime CCTV'}
                    </h3>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* ====================== Slide 5 ====================== */}
            {/* ====================== Slide 5 ====================== */}

            <SwiperSlide>
              <div onClick={() => setShowErrorImpact(true)} className="group cursor-pointer">
                <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,.1)] hover:-translate-y-1 transition-all duration-300 p-4 sm:p-6 md:p-8">
                  {/* HEADER */}
                  <div className="flex flex-wrap gap-4 justify-between items-start mb-6 pb-5 border-b border-slate-100">
                    <div className="min-w-0">
                      <p className="uppercase tracking-[3px] text-purple-600 text-[11px] font-semibold">
                        CCTV Impact Monitoring
                      </p>

                      <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                          <FiTrendingDown size={17} />
                        </span>
                        Camera Error Impact Analysis
                      </h2>

                      <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Comparison between camera error frequency and downtime contribution
                      </p>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    {/* LEFT CHART */}
                    <div className="rounded-xl border border-slate-100 p-5 h-[340px] md:h-[380px]">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4">
                        Error Frequency vs Downtime Duration
                      </h3>

                      <div className="h-[260px] md:h-[290px]">
                        <Line
                          data={errorImpactChart || { labels: [], datasets: [] }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                              mode: 'index',
                              intersect: false,
                            },
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  usePointStyle: true,
                                  font: { size: 11 },
                                },
                              },
                              tooltip: {
                                callbacks: {
                                  label: (ctx) => {
                                    const item = errorImpactAnalysis?.ranking?.[ctx.dataIndex];

                                    if (ctx.dataset.label === 'Durasi Error (Jam)') {
                                      return item
                                        ? `Downtime ${item.totalDuration} (${ctx.raw} Jam)`
                                        : `${ctx.raw} Jam`;
                                    }

                                    if (ctx.dataset.label === 'Jumlah Error') {
                                      return `${ctx.raw} Error`;
                                    }

                                    return ctx.raw;
                                  },
                                },
                              },
                            },
                            scales: {
                              x: {
                                grid: { display: false },
                                ticks: {
                                  maxRotation: 45,
                                  minRotation: 45,
                                  font: { size: 9 },
                                },
                              },
                              error: {
                                type: 'linear',
                                position: 'left',
                                beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.08)' },
                                title: {
                                  display: true,
                                  text: 'Error Count',
                                },
                              },
                              duration: {
                                type: 'linear',
                                position: 'right',
                                beginAtZero: true,
                                grid: { drawOnChartArea: false },
                                title: {
                                  display: true,
                                  text: 'Downtime Hours',
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* RIGHT RANKING */}
                    <div className="rounded-xl border border-slate-100 p-5 h-[340px] md:h-[380px] overflow-y-auto">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                        <FiBarChart2 size={15} className="text-purple-500" />
                        Highest Downtime Impact Camera
                      </h3>

                      <div className="space-y-3">
                        {errorImpactAnalysis?.ranking?.slice(0, 5)?.map((item, index) => (
                          <div
                            key={item.camera}
                            className="rounded-lg bg-slate-50 border border-slate-100 p-3.5"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">
                                  #{index + 1} {item.camera}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <FiMapPin size={11} />
                                  {item.area}
                                </p>
                              </div>

                              <div className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-600 font-semibold text-xs shrink-0">
                                {item.durationPercentage || 0}%
                              </div>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <FiAlertTriangle size={11} />
                                {item.totalError || 0} Error
                              </span>
                              <span className="flex items-center gap-1">
                                <FiClock size={11} />
                                {item.totalDuration || '00:00:00'}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiTrendingDown size={11} />
                                {item.errorPercentage || 0}% Frequency
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* KPI */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                        <FiCamera size={12} />
                        Total Camera
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2 tabular-nums">
                        {errorImpactAnalysis?.totalCamera || 0}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-4">
                      <p className="flex items-center gap-1.5 text-purple-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiAlertTriangle size={12} />
                        Total Error
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-purple-600 mt-2 tabular-nums">
                        {errorImpactAnalysis?.totalError || 0}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-4">
                      <p className="flex items-center gap-1.5 text-rose-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiTrendingDown size={12} />
                        Highest Impact
                      </p>
                      <h3 className="text-sm md:text-base font-bold text-rose-600 mt-2 truncate">
                        {errorImpactAnalysis?.highestImpact?.camera || '-'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {errorImpactAnalysis?.highestImpact?.durationPercentage || 0}%
                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
                      <p className="flex items-center gap-1.5 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                        <FiClock size={12} />
                        Total Downtime
                      </p>
                      <h3 className="text-lg md:text-xl font-bold text-blue-600 mt-2 tabular-nums">
                        {errorImpactAnalysis?.totalDuration || '00:00:00'}
                      </h3>
                    </div>
                  </div>

                  {/* INSIGHT */}
                  <div className="rounded-xl bg-slate-900 text-white p-5">
                    <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">
                      Management Insight
                    </p>
                    <h3 className="text-sm md:text-base font-semibold mt-1.5">
                      {errorImpactAnalysis?.insight?.[0] || 'No impact analysis available.'}
                    </h3>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>

          {/* ================= RECOVERY INTELLIGENCE MODAL ================= */}

          {showRecovery && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
              onClick={() => setShowRecovery(false)}
            >
              <div
                className="relative w-full max-w-[980px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250"
                onClick={(e) => e.stopPropagation()}
              >
                {/* CLOSE */}
                <button
                  onClick={() => setShowRecovery(false)}
                  className="absolute top-5 right-5 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200"
                >
                  <FiX size={18} />
                </button>

                {/* HEADER */}
                <div className="sticky top-0 z-20 px-7 md:px-9 pt-8 pb-6 bg-white/95 backdrop-blur-sm border-b border-slate-100">
                  <p className="text-[11px] tracking-[3px] uppercase font-semibold text-orange-600">
                    Intelijen Pemeliharaan CCTV
                  </p>

                  <h1 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold mt-2 text-slate-900">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600">
                      <FiTool size={17} />
                    </span>
                    Analisis Pemulihan CCTV
                  </h1>

                  <p className="text-slate-500 text-sm mt-2 max-w-xl leading-relaxed">
                    Monitoring performa pemulihan, proses perbaikan, dan kesehatan operasional CCTV.
                  </p>
                </div>

                <div className="px-7 md:px-9 pb-9 pt-6">
                  {/* KPI */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        title: 'Total Gangguan',
                        value: recoveryAnalysis?.totalTroubleIncident || 0,
                        icon: <FiBarChart2 />,
                        accent: 'text-slate-500',
                      },
                      {
                        title: 'Error Aktif',
                        value: recoveryAnalysis?.error || 0,
                        icon: <FiAlertCircle />,
                        accent: 'text-rose-500',
                      },
                      {
                        title: 'Menunggu Perbaikan',
                        value: recoveryAnalysis?.request || 0,
                        icon: <FiClock />,
                        accent: 'text-amber-500',
                      },
                      {
                        title: 'Sudah Normal',
                        value: recoveryAnalysis?.recovered || 0,
                        icon: <FiCheckCircle />,
                        accent: 'text-emerald-500',
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl p-5 bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {item.title}
                          </span>
                          <span className={`text-lg ${item.accent}`}>{item.icon}</span>
                        </div>

                        <h2 className="text-3xl font-bold mt-3 text-slate-900 tabular-nums">
                          {item.value}
                        </h2>
                      </div>
                    ))}
                  </div>

                  {/* HEALTH STATUS */}
                  <div className="mt-5 rounded-xl p-6 bg-slate-50/70 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wide">
                        Status Kesehatan Operasional
                      </p>
                      <h2 className="text-xl font-bold mt-1 text-slate-900">
                        {recoveryAnalysis?.healthLevel || 'TIDAK DIKETAHUI'}
                      </h2>
                    </div>

                    <div
                      className={`px-5 py-2 rounded-full font-semibold text-xs uppercase tracking-wide ring-1
              ${
                recoveryAnalysis?.healthLevel === 'EXCELLENT'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : recoveryAnalysis?.healthLevel === 'GOOD'
                    ? 'bg-sky-50 text-sky-700 ring-sky-200'
                    : recoveryAnalysis?.healthLevel === 'WARNING'
                      ? 'bg-amber-50 text-amber-700 ring-amber-200'
                      : 'bg-rose-50 text-rose-700 ring-rose-200'
              }
            `}
                    >
                      {recoveryAnalysis?.healthLevel || 'TIDAK ADA DATA'}
                    </div>
                  </div>

                  {/* PERFORMANCE */}
                  <div className="mt-5 rounded-xl bg-white border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        Performa Pemulihan
                      </h3>
                      <span className="font-bold text-emerald-600 text-lg tabular-nums">
                        {recoveryAnalysis?.recoveryRate || 0}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                        style={{ width: `${recoveryAnalysis?.recoveryRate || 0}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 mt-6 text-center divide-x divide-slate-100">
                      <div>
                        <p className="text-slate-400 text-[11px] uppercase tracking-wide">Pulih</p>
                        <h3 className="text-xl font-bold text-emerald-600 mt-1 tabular-nums">
                          {recoveryAnalysis?.recovered || 0}
                        </h3>
                      </div>

                      <div>
                        <p className="text-slate-400 text-[11px] uppercase tracking-wide">
                          Target SLA
                        </p>
                        <h3 className="text-xl font-bold text-slate-800 mt-1">95%</h3>
                      </div>

                      <div>
                        <p className="text-slate-400 text-[11px] uppercase tracking-wide">Status</p>
                        <h3
                          className={`text-sm font-bold mt-1 ${
                            (recoveryAnalysis?.recoveryRate || 0) >= 95
                              ? 'text-emerald-600'
                              : 'text-rose-500'
                          }`}
                        >
                          {(recoveryAnalysis?.recoveryRate || 0) >= 95
                            ? 'MEMENUHI TARGET'
                            : 'BELUM MEMENUHI'}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* INSIGHT + REKOMENDASI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-700 mb-4">
                        Analisis Pemulihan
                      </h3>

                      <div className="space-y-2.5">
                        {(recoveryAnalysis?.insight || []).map((item, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-sky-100/60"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 mb-4">
                        Rekomendasi Tindakan
                      </h3>

                      <div className="space-y-2.5">
                        {(recoveryAnalysis?.recommendation || []).map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-orange-100/60"
                          >
                            <FiCheckCircle className="text-orange-500 mt-0.5 shrink-0" size={14} />
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

          {/* ================= ERROR ANALYSIS MODAL ================= */}

          {showError && (
            <div
              className="
      fixed inset-0
      bg-black/60
      backdrop-blur-md
      flex
      justify-center
      items-center
      z-50
      p-6
    "
              onClick={() => setShowError(false)}
            >
              <div
                className="
        relative
        bg-white
        rounded-[40px]
        w-[1100px]
        max-h-[92vh]
        overflow-y-auto
        p-10
        shadow-2xl
      "
                onClick={(e) => e.stopPropagation()}
              >
                {/* CLOSE */}
                <button
                  onClick={() => setShowError(false)}
                  className="
          absolute
          top-6
          right-6
          w-12
          h-12
          rounded-full
          bg-white
          shadow-xl
          flex
          items-center
          justify-center
          text-gray-500
          hover:bg-red-500
          hover:text-white
          hover:rotate-90
          transition-all
          duration-300
          z-50
        "
                >
                  <FiX size={24} />
                </button>

                {/* HEADER */}
                <div className="flex justify-between items-start mb-10 pr-16">
                  <div>
                    <p className="text-xs tracking-[5px] uppercase font-black text-red-600">
                      CCTV RISK CENTER
                    </p>

                    <h2 className="text-4xl font-black text-gray-900 mt-3 flex items-center gap-3">
                      <FiAlertTriangle className="text-red-600" size={40} />
                      Analisa Intelijen Gangguan CCTV
                    </h2>

                    <p className="text-gray-500 mt-3">
                      Monitoring frekuensi gangguan kamera, ranking error dan prioritas perbaikan
                      CCTV
                    </p>
                  </div>

                  <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center shrink-0">
                    <FiAlertTriangle size={42} className="text-red-600" />
                  </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-4 gap-5">
                  {/* TOTAL ERROR */}
                  <div className="rounded-3xl bg-red-50 border p-6">
                    <p className="text-red-700 font-bold flex gap-2 items-center">
                      <FiAlertCircle />
                      Total Gangguan
                    </p>

                    <h1 className="text-5xl font-black text-red-600 mt-3">
                      {errorAnalysis?.totalError || 0}
                    </h1>

                    <p className="text-sm text-gray-500">Total record gangguan kamera</p>
                  </div>

                  {/* CAMERA */}
                  <div className="rounded-3xl bg-orange-50 border p-6">
                    <p className="text-orange-700 font-bold flex items-center gap-2">
                      <FiCamera />
                      Kamera Paling Bermasalah
                    </p>

                    <h1 className="text-3xl font-black text-orange-600 mt-3">
                      {errorAnalysis?.highestCamera?.camera || '-'}
                    </h1>

                    <p className="text-sm text-gray-500">
                      {errorAnalysis?.highestCamera?.total || 0} kali gangguan
                    </p>
                  </div>

                  {/* AREA */}
                  <div className="rounded-3xl bg-yellow-50 border p-6">
                    <p className="text-yellow-700 font-bold flex items-center gap-2">
                      <FiMapPin />
                      Area Risiko Tertinggi
                    </p>

                    <h1 className="text-3xl font-black text-yellow-600 mt-3">
                      {errorAnalysis?.highestArea?.area || '-'}
                    </h1>

                    <p className="text-sm text-gray-500">
                      {errorAnalysis?.highestArea?.total || 0} incident
                    </p>
                  </div>

                  {/* RISK */}
                  <div
                    className={`
            rounded-3xl
            border
            p-6
            ${
              errorAnalysis?.riskLevel === 'CRITICAL'
                ? 'bg-red-100 border-red-300 text-red-700'
                : errorAnalysis?.riskLevel === 'HIGH'
                  ? 'bg-orange-100 border-orange-300 text-orange-700'
                  : errorAnalysis?.riskLevel === 'MEDIUM'
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                    : 'bg-green-100 border-green-300 text-green-700'
            }
          `}
                  >
                    <p className="font-bold flex items-center gap-2">
                      <FiActivity />
                      Status Risiko
                    </p>

                    <h1 className="text-3xl font-black mt-3">
                      {errorAnalysis?.riskLevel === 'CRITICAL'
                        ? 'KRITIS'
                        : errorAnalysis?.riskLevel === 'HIGH'
                          ? 'TINGGI'
                          : errorAnalysis?.riskLevel === 'MEDIUM'
                            ? 'SEDANG'
                            : errorAnalysis?.riskLevel === 'LOW'
                              ? 'RENDAH'
                              : 'TIDAK ADA DATA'}
                    </h1>

                    <p className="text-sm">Prioritas maintenance</p>
                  </div>
                </div>

                {/* RANKING */}
                <div className="mt-8 bg-white border rounded-3xl p-6">
                  <h3 className="text-xl font-black mb-5 flex items-center gap-2">
                    <FiBarChart2 />
                    Ranking Gangguan Kamera
                  </h3>

                  <div className="space-y-3">
                    {errorAnalysis?.ranking?.slice(0, 10)?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-gray-50 rounded-xl p-4"
                      >
                        <div>
                          <p className="font-bold flex items-center gap-2">
                            <FiCamera />#{index + 1} {item.camera}
                          </p>

                          <p className="text-sm text-gray-500">
                            <FiMapPin className="inline" /> Area : {item.area}
                          </p>
                        </div>

                        <div className="text-right">
                          <h3 className="text-2xl font-black text-red-600">{item.total}</h3>
                          <p className="text-xs text-gray-500">Gangguan</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* INSIGHT */}
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="bg-blue-50 border rounded-3xl p-6">
                    <h3 className="text-xl font-black mb-5 flex gap-2 items-center">
                      <FiInfo />
                      Insight Gangguan
                    </h3>

                    <div className="space-y-3">
                      {errorAnalysis?.insight?.map((item, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RECOMMENDATION */}
                  <div className="bg-red-50 border rounded-3xl p-6">
                    <h3 className="text-xl font-black mb-5 flex gap-2 items-center">
                      <FiTool />
                      Rekomendasi Perbaikan
                    </h3>

                    <div className="space-y-3">
                      {errorAnalysis?.recommendation?.map((item, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                          <FiCheckCircle className="inline text-green-600 mr-2" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= AREA TROUBLE MODAL ================= */}

          {showArea && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
              onClick={() => setShowArea(false)}
            >
              <div
                className="relative w-full max-w-[1080px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250"
                onClick={(e) => e.stopPropagation()}
              >
                {/* CLOSE */}
                <button
                  onClick={() => setShowArea(false)}
                  className="absolute top-5 right-5 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200"
                >
                  <FiX size={18} />
                </button>

                {/* HEADER */}
                <div className="px-7 md:px-9 pt-8 pb-6 border-b border-slate-100 flex justify-between items-start gap-6">
                  <div>
                    <p className="text-[11px] tracking-[3px] uppercase font-semibold text-rose-600">
                      CCTV Risk Monitoring Center
                    </p>

                    <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-50 text-rose-600">
                        <FiBarChart2 size={17} />
                      </span>
                      Analisa Distribusi Gangguan CCTV
                    </h2>

                    <p className="text-slate-500 text-sm mt-2 max-w-xl leading-relaxed">
                      Analisa jumlah gangguan berdasarkan area operasional CCTV.
                    </p>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                    <FiMapPin size={20} className="text-rose-600" />
                  </div>
                </div>

                <div className="px-7 md:px-9 pb-9 pt-6">
                  {/* KPI */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* TOTAL INCIDENT */}
                    <div className="rounded-xl p-5 bg-sky-50/60 border border-sky-100">
                      <p className="text-sky-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiAlertTriangle size={13} />
                        Total Gangguan
                      </p>

                      <h1 className="text-3xl font-bold text-sky-600 mt-3 tabular-nums">
                        {areaAnalysis?.totalIncident || 0}
                      </h1>

                      <p className="text-xs text-slate-500 mt-1">Total record gangguan CCTV</p>
                    </div>

                    {/* AREA MONITORING */}
                    <div className="rounded-xl p-5 bg-emerald-50/60 border border-emerald-100">
                      <p className="text-emerald-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiGlobe size={13} />
                        Jumlah Area Monitoring
                      </p>

                      <h1 className="text-3xl font-bold text-emerald-600 mt-3 tabular-nums">
                        {areaAnalysis?.totalArea || 0}
                      </h1>

                      <p className="text-xs text-slate-500 mt-1">Area operasional terpantau</p>
                    </div>

                    {/* HIGHEST AREA */}
                    <div className="rounded-xl p-5 bg-rose-50/60 border border-rose-100">
                      <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiTrendingUp size={13} />
                        Area Gangguan Tertinggi
                      </p>

                      <h1 className="text-xl font-bold text-rose-600 mt-3 truncate">
                        {areaAnalysis?.highestArea?.area || '-'}
                      </h1>

                      <p className="text-xs text-slate-500 mt-1">
                        {areaAnalysis?.highestArea?.total || 0} incident
                      </p>
                    </div>

                    {/* RISK */}
                    <div className="rounded-xl p-5 bg-orange-50/60 border border-orange-100">
                      <p className="text-orange-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiActivity size={13} />
                        Level Risiko
                      </p>

                      <h1 className="text-2xl font-bold text-orange-600 mt-3">
                        {areaAnalysis?.highestArea?.risk === 'CRITICAL'
                          ? 'Kritis'
                          : areaAnalysis?.highestArea?.risk === 'HIGH'
                            ? 'Tinggi'
                            : areaAnalysis?.highestArea?.risk === 'MEDIUM'
                              ? 'Sedang'
                              : 'Rendah'}
                      </h1>

                      <p className="text-xs text-slate-500 mt-1">Prioritas maintenance</p>
                    </div>
                  </div>

                  {/* CHART */}
                  <div className="mt-5 bg-white border border-slate-100 rounded-xl p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                      <FiBarChart2 size={15} className="text-slate-400" />
                      Ranking Distribusi Gangguan Area
                    </h3>

                    <div className="h-[320px]">
                      <Line
                        data={durationChart}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.raw} Jam Downtime`,
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: { display: true, text: 'Downtime (Jam)' },
                              grid: { color: '#f1f5f9' },
                            },
                            x: {
                              grid: { display: false },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* TABLE */}
                  <div className="mt-5 bg-white border border-slate-100 rounded-xl p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-4 flex items-center gap-2">
                      <FiTrendingUp size={15} className="text-slate-400" />
                      Ranking Risiko Area
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
                            <th className="p-3.5 text-left font-semibold rounded-l-lg">Rank</th>
                            <th className="p-3.5 text-left font-semibold">Area</th>
                            <th className="p-3.5 text-left font-semibold">Jumlah Gangguan</th>
                            <th className="p-3.5 text-left font-semibold">Kontribusi</th>
                            <th className="p-3.5 text-left font-semibold rounded-r-lg">Risiko</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {areaAnalysis?.ranking?.map((item, index) => (
                            <tr key={item.area} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3.5 font-semibold text-slate-400">#{index + 1}</td>

                              <td className="p-3.5 font-semibold text-slate-800">
                                <span className="flex items-center gap-1.5">
                                  <FiMapPin size={13} className="text-slate-400" />
                                  {item.area}
                                </span>
                              </td>

                              <td className="p-3.5 text-slate-600 tabular-nums">{item.total}</td>

                              <td className="p-3.5 text-slate-600 tabular-nums">
                                {item.percentage}%
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ring-1
                          ${
                            item.risk === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 ring-rose-200'
                              : item.risk === 'HIGH'
                                ? 'bg-orange-50 text-orange-700 ring-orange-200'
                                : item.risk === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-700 ring-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          }
                        `}
                                >
                                  {item.risk === 'CRITICAL'
                                    ? 'Kritis'
                                    : item.risk === 'HIGH'
                                      ? 'Tinggi'
                                      : item.risk === 'MEDIUM'
                                        ? 'Sedang'
                                        : 'Rendah'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* INSIGHT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-700 mb-4 flex gap-2 items-center">
                        <FiActivity size={15} />
                        Insight Area
                      </h3>

                      <div className="space-y-2.5">
                        {areaAnalysis?.insight?.map((item, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-sky-100/60"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-orange-50/60 border border-orange-100 p-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 mb-4 flex items-center gap-2">
                        <FiTool size={15} />
                        Rekomendasi Maintenance
                      </h3>

                      <div className="space-y-2.5">
                        {areaAnalysis?.recommendation?.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-orange-100/60"
                          >
                            <FiCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
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

          {/* ====================== MODAL ANALISA DURASI ERROR ====================== */}

          {showDurationError && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
              onClick={() => setShowDurationError(false)}
            >
              <div
                className="relative w-full max-w-[1120px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}
                <div className="px-7 md:px-9 pt-8 pb-6 border-b border-slate-100 flex justify-between items-start gap-6">
                  <div>
                    <p className="text-[11px] tracking-[3px] uppercase font-semibold text-rose-600">
                      CCTV Performance Analytics
                    </p>

                    <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-50 text-rose-600">
                        <FiClock size={17} />
                      </span>
                      Analisa Kontribusi Downtime CCTV
                    </h2>

                    <p className="text-slate-500 text-sm mt-2 max-w-xl leading-relaxed">
                      Analisa kontribusi waktu gangguan setiap kamera berdasarkan histori trouble
                      CCTV.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowDurationError(false)}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <div className="px-7 md:px-9 pb-9 pt-6">
                  {/* KPI */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* CAMERA */}
                    <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-5">
                      <p className="text-slate-600 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiCamera size={13} />
                        Total Kamera
                      </p>

                      <h3 className="text-3xl font-bold text-slate-900 mt-3 tabular-nums">
                        {durationAnalysis?.totalCamera || 0}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">Kamera yang dianalisa</p>
                    </div>

                    {/* DOWNTIME */}
                    <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-5">
                      <p className="text-sky-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiClock size={13} />
                        Total Downtime
                      </p>

                      <h3 className="text-2xl font-bold text-sky-600 mt-3 tabular-nums">
                        {durationAnalysis?.totalDuration || '00:00:00'}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">Akumulasi durasi gangguan</p>
                    </div>

                    {/* HIGHEST CONTRIBUTOR */}
                    <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                      <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiTrendingUp size={13} />
                        Kontributor Tertinggi
                      </p>

                      <h3 className="text-xl font-bold text-rose-600 mt-3 truncate">
                        {durationAnalysis?.highestCamera?.camera || '-'}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        {durationAnalysis?.highestCamera?.downtimePercentage || 0}% kontribusi
                        downtime
                      </p>
                    </div>

                    {/* RISK */}
                    <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-5">
                      <p className="text-amber-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiAlertTriangle size={13} />
                        Tingkat Risiko
                      </p>

                      <h3 className="text-2xl font-bold text-amber-600 mt-3">
                        {durationAnalysis?.riskLevel || 'TIDAK ADA DATA'}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">Tingkat keparahan downtime</p>
                    </div>
                  </div>

                  {/* TABLE */}
                  <div className="mt-5 rounded-xl border border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 text-white px-6 py-3.5 text-sm font-semibold flex items-center gap-2">
                      <FiBarChart2 size={15} />
                      Ranking Kontribusi Downtime Kamera
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                            <th className="p-3.5 text-left font-semibold">Peringkat</th>
                            <th className="p-3.5 text-left font-semibold">Kamera</th>
                            <th className="p-3.5 text-left font-semibold">Area</th>
                            <th className="p-3.5 text-left font-semibold">Total Downtime</th>
                            <th className="p-3.5 text-left font-semibold">Kontribusi</th>
                            <th className="p-3.5 text-left font-semibold">Incident</th>
                            <th className="p-3.5 text-left font-semibold">Risiko</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {durationAnalysis?.ranking?.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3.5 font-semibold text-slate-400">#{index + 1}</td>

                              <td className="p-3.5 font-semibold text-slate-800">{item.camera}</td>

                              <td className="p-3.5 text-slate-600">
                                <span className="flex items-center gap-1.5">
                                  <FiMapPin size={13} className="text-slate-400" />
                                  {item.area}
                                </span>
                              </td>

                              <td className="p-3.5 font-semibold text-rose-600 tabular-nums">
                                {item.totalDuration || '00:00:00'}
                              </td>

                              <td className="p-3.5 font-bold text-sky-600 tabular-nums">
                                {item.downtimePercentage || 0}%
                              </td>

                              <td className="p-3.5 text-slate-600 tabular-nums">{item.incident}</td>

                              <td className="p-3.5">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ring-1
                          ${
                            item.risk === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 ring-rose-200'
                              : item.risk === 'HIGH'
                                ? 'bg-orange-50 text-orange-700 ring-orange-200'
                                : item.risk === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-700 ring-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          }
                        `}
                                >
                                  {item.risk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* INSIGHT */}
                  <div className="mt-5 rounded-xl bg-slate-900 text-white p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 text-slate-200">
                      <FiShield size={15} />
                      Insight Analisa
                    </h3>

                    <ul className="space-y-2.5">
                      {durationAnalysis?.insight?.map((item, index) => (
                        <li
                          key={index}
                          className="text-slate-300 text-sm leading-relaxed flex gap-2"
                        >
                          <span className="text-slate-500">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* RECOMMENDATION */}
                  <div className="mt-4 rounded-xl bg-rose-50/60 border border-rose-100 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700 mb-4 flex items-center gap-2">
                      <FiTool size={15} />
                      Rekomendasi Maintenance
                    </h3>

                    <div className="space-y-2.5">
                      {durationAnalysis?.recommendation?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-rose-100/60"
                        >
                          <FiCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================== MODAL ANALISIS DAMPAK ERROR ====================== */}

          {showErrorImpact && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
              onClick={() => setShowErrorImpact(false)}
            >
              <div
                className="relative w-full max-w-[1120px] max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,.25)] ring-1 ring-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-250"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER */}
                <div className="px-7 md:px-9 pt-8 pb-6 border-b border-slate-100 flex justify-between items-start gap-6">
                  <div>
                    <p className="text-[11px] tracking-[3px] uppercase font-semibold text-violet-600">
                      CCTV Impact Analytics
                    </p>

                    <h2 className="flex items-center gap-2.5 text-2xl md:text-[28px] font-bold text-slate-900 mt-2">
                      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50 text-violet-600">
                        <FiActivity size={17} />
                      </span>
                      Analisis Dampak Gangguan Kamera
                    </h2>

                    <p className="text-slate-500 text-sm mt-2 max-w-xl leading-relaxed">
                      Analisa perbandingan frekuensi gangguan dan akumulasi downtime setiap kamera
                      CCTV.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowErrorImpact(false)}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-violet-50 text-slate-400 hover:text-violet-500 flex items-center justify-center transition-colors duration-200 shrink-0"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <div className="px-7 md:px-9 pb-9 pt-6">
                  {/* KPI */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* TOTAL CAMERA */}
                    <div className="rounded-xl bg-slate-50/70 border border-slate-100 p-5">
                      <p className="text-slate-600 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiCamera size={13} />
                        Total Kamera
                      </p>

                      <h3 className="text-3xl font-bold text-slate-900 mt-3 tabular-nums">
                        {errorImpactAnalysis?.totalCamera || 0}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">Jumlah kamera yang dianalisis</p>
                    </div>

                    {/* TOTAL ERROR */}
                    <div className="rounded-xl bg-violet-50/60 border border-violet-100 p-5">
                      <p className="text-violet-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiAlertTriangle size={13} />
                        Total Gangguan
                      </p>

                      <h3 className="text-3xl font-bold text-violet-600 mt-3 tabular-nums">
                        {errorImpactAnalysis?.totalError || 0}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">Total histori incident CCTV</p>
                    </div>

                    {/* IMPACT TERTINGGI */}
                    <div className="rounded-xl bg-rose-50/60 border border-rose-100 p-5">
                      <p className="text-rose-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiTrendingDown size={13} />
                        Kamera Dampak Tertinggi
                      </p>

                      <h3 className="text-xl font-bold text-rose-600 mt-3 truncate">
                        {errorImpactAnalysis?.highestImpact?.camera || '-'}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        Kontribusi downtime:{' '}
                        {errorImpactAnalysis?.highestImpact?.durationPercentage || 0}%
                      </p>
                    </div>

                    {/* TOTAL DOWNTIME */}
                    <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-5">
                      <p className="text-sky-700 text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                        <FiClock size={13} />
                        Total Downtime
                      </p>

                      <h3 className="text-2xl font-bold text-sky-600 mt-3 tabular-nums">
                        {errorImpactAnalysis?.totalDuration || '00:00:00'}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">Akumulasi waktu gangguan</p>
                    </div>
                  </div>

                  {/* TABLE */}
                  <div className="mt-5 rounded-xl border border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 text-white px-6 py-3.5 text-sm font-semibold flex items-center gap-2">
                      <FiBarChart2 size={15} />
                      Peringkat Dampak Gangguan Kamera
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                            <th className="p-3.5 text-left font-semibold">Peringkat</th>
                            <th className="p-3.5 text-left font-semibold">Kamera</th>
                            <th className="p-3.5 text-left font-semibold">Area</th>
                            <th className="p-3.5 text-left font-semibold">Jumlah Gangguan</th>
                            <th className="p-3.5 text-left font-semibold">Durasi Gangguan</th>
                            <th className="p-3.5 text-left font-semibold">Persentase Error</th>
                            <th className="p-3.5 text-left font-semibold">Kontribusi Downtime</th>
                            <th className="p-3.5 text-left font-semibold">Level Dampak</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {errorImpactAnalysis?.ranking?.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3.5 font-semibold text-slate-400">#{index + 1}</td>

                              <td className="p-3.5 font-semibold text-slate-800">{item.camera}</td>

                              <td className="p-3.5 text-slate-600">{item.area}</td>

                              <td className="p-3.5 font-semibold text-violet-600 tabular-nums">
                                <span className="flex items-center gap-1.5">
                                  <FiAlertTriangle size={12} />
                                  {item.totalError}
                                </span>
                              </td>

                              <td className="p-3.5 font-semibold text-rose-600 tabular-nums">
                                <span className="flex items-center gap-1.5">
                                  <FiClock size={12} />
                                  {item.totalDuration}
                                </span>
                              </td>

                              <td className="p-3.5 text-slate-600 tabular-nums">
                                {item.errorPercentage}%
                              </td>

                              <td className="p-3.5 font-bold text-sky-600 tabular-nums">
                                {item.durationPercentage}%
                              </td>

                              <td className="p-3.5">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ring-1
                          ${
                            item.impactLevel === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 ring-rose-200'
                              : item.impactLevel === 'HIGH'
                                ? 'bg-orange-50 text-orange-700 ring-orange-200'
                                : item.impactLevel === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-700 ring-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          }
                        `}
                                >
                                  {item.impactLevel}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* INSIGHT */}
                  <div className="mt-5 rounded-xl bg-slate-900 text-white p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 text-slate-200">
                      <FiActivity size={15} />
                      Insight Manajemen
                    </h3>

                    <ul className="space-y-2.5">
                      {errorImpactAnalysis?.insight?.map((item, index) => (
                        <li
                          key={index}
                          className="text-slate-300 text-sm leading-relaxed flex gap-2"
                        >
                          <span className="text-slate-500">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* RECOMMENDATION */}
                  <div className="mt-4 rounded-xl bg-violet-50/60 border border-violet-100 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-700 mb-4 flex items-center gap-2">
                      <FiTool size={15} />
                      Rekomendasi Pengurangan Dampak
                    </h3>

                    <div className="space-y-2.5">
                      {errorImpactAnalysis?.recommendation?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 bg-white rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-violet-100/60"
                        >
                          <FiCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ===================== Manajemen Trouble Camera ===================== */}

        <section className="p-3 md:p-6">
          {/* HEADER CARD */}

          <div
            ref={troubleHeaderCardRef}
            className="
              w-full
              max-w-sm
              bg-white
              rounded-2xl md:rounded-[28px]
              shadow-[0_15px_40px_rgba(0,0,0,.08)]
              px-4 md:px-5
              py-4 md:py-5
              flex
              flex-wrap
              gap-3
              justify-between
              items-center
            "
          >
            {/* TEXT */}

            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <FiCamera size={18} />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-800 truncate">
                  Manajemen Trouble Camera
                </h2>

                <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                  Monitoring gangguan & perbaikan CCTV
                </p>
              </div>
            </div>

            {/* BUTTON TAMBAH */}

            {canCreate && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setIsEditing(false);
                }}
                title="Tambah Trouble Camera"
                className={`
                  group
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-gradient-to-br
                  from-blue-500
                  to-indigo-600
                  text-white
                  text-xs
                  font-semibold
                  shadow-[0_10px_25px_rgba(37,99,235,.35)]
                  hover:scale-105
                  transition-all
                  duration-300
                  shrink-0
                  ${showAddTroubleBtnText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
                `}
              >
                <FiPlus size={20} className="shrink-0" />

                {showAddTroubleBtnText && (
                  <span className="whitespace-nowrap">
                    Tambah
                    <br />
                    Trouble
                  </span>
                )}
              </button>
            )}
          </div>

          {/* MONITORING CALENDAR */}

          <div
            ref={troubleCalendarCardRef}
            className="
              mt-6
              w-full
              max-w-sm
              bg-white
              rounded-2xl md:rounded-[28px]
              shadow-[0_15px_40px_rgba(0,0,0,.08)]
              px-4 md:px-5
              py-4 md:py-5
              flex
              flex-wrap
              gap-3
              justify-between
              items-center
            "
          >
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">Monitoring Kalender</h3>
              <p className="text-[11px] leading-relaxed text-gray-400 mt-1 truncate max-w-[150px]">
                Jam realtime & hari libur
              </p>
            </div>

            <button
              onClick={() => setShowTroubleCalendar(true)}
              title="Buka Kalender"
              className={`
                group
                flex
                items-center
                justify-center
                gap-2
                rounded-full
                bg-gradient-to-br
                from-blue-500
                to-indigo-600
                text-white
                text-xs
                font-semibold
                shadow-[0_10px_25px_rgba(37,99,235,.35)]
                hover:scale-105
                transition-all
                duration-300
                shrink-0
                ${showTroubleCalendarText ? 'px-5 py-3 rounded-2xl' : 'w-11 h-11'}
              `}
            >
              <FiCalendar size={18} className="shrink-0" />
              {showTroubleCalendarText && <span className="whitespace-nowrap">Buka</span>}
            </button>
          </div>

          {showTroubleCalendar && (
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
              onClick={() => setShowTroubleCalendar(false)}
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
                  onClick={() => setShowTroubleCalendar(false)}
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

          {/* ================= MODAL FORM TROUBLE CAMERA ================= */}

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
p-6
"
              onClick={() => setShowForm(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="
bg-white/90
backdrop-blur-3xl
rounded-[40px]
shadow-[0_40px_100px_rgba(0,0,0,.2)]
w-full
max-w-5xl
max-h-[90vh]
overflow-y-auto
p-10
"
              >
                {/* HEADER */}

                <div
                  className="
flex
justify-between
items-start
mb-6
"
                >
                  <div>
                    <p
                      className="
uppercase
tracking-[5px]
text-blue-600
text-xs
font-black
"
                    >
                      TROUBLE CAMERA MANAGEMENT
                    </p>

                    <h2
                      className="
text-3xl
font-black
text-gray-800
mt-3
flex
items-center
gap-3
"
                    >
                      {isEditing ? (
                        <>
                          <FiEdit3 className="text-blue-600" />
                          Edit Gangguan Kamera
                        </>
                      ) : isBulkMode ? (
                        <>
                          <FiLayers className="text-blue-600" />
                          Tambah Gangguan Massal
                        </>
                      ) : (
                        <>
                          <FiPlus className="text-blue-600" />
                          Tambah Gangguan Kamera
                        </>
                      )}
                    </h2>

                    <p
                      className="
text-gray-500
mt-2
"
                    >
                      Input gangguan CCTV dan proses perbaikan maintenance.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowForm(false)}
                    className="
w-12
h-12
rounded-full
bg-gray-100
hover:bg-red-500
hover:text-white
flex
items-center
justify-center
transition
"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                {/* TOGGLE MODE */}

                {!isEditing && (
                  <div className="flex items-center gap-2 mb-8 bg-gray-100 rounded-2xl p-1.5 w-fit">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBulkMode(false);
                        setSelectedCameras([]);
                      }}
                      className={`
px-5
py-2
rounded-xl
text-sm
font-semibold
transition
flex
items-center
gap-2
${!isBulkMode ? 'bg-white shadow text-blue-600' : 'text-gray-500'}
`}
                    >
                      <FiCamera size={15} /> Input Satuan
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsBulkMode(true)}
                      className={`
px-5
py-2
rounded-xl
text-sm
font-semibold
transition
flex
items-center
gap-2
${isBulkMode ? 'bg-white shadow text-blue-600' : 'text-gray-500'}
`}
                    >
                      <FiLayers size={15} /> Input Massal
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="
grid
grid-cols-1
md:grid-cols-2
gap-5
"
                >
                  {/* CAMERA */}

                  <div className={isBulkMode ? 'md:col-span-2' : ''}>
                    <label
                      className="
text-sm
font-semibold
text-gray-700
flex
items-center
gap-2
"
                    >
                      <FiCamera />
                      {isBulkMode ? `ID Kamera (${selectedCameras.length} dipilih)` : 'ID Kamera'}
                    </label>

                    <div className="mt-2">
                      <Select
                        options={cameraOptions}
                        placeholder={
                          isBulkMode ? 'Pilih beberapa ID Kamera sekaligus...' : 'Cari ID Kamera...'
                        }
                        isClearable
                        isSearchable
                        isMulti={isBulkMode}
                        value={
                          isBulkMode
                            ? selectedCameras
                            : cameraOptions.find((opt) => opt.value === formData.id_camera) || null
                        }
                        onChange={(selected) => {
                          if (isBulkMode) {
                            const newSelected = selected || [];
                            setSelectedCameras(newSelected);

                            // sinkronkan cameraDetails: buang yang tidak lagi terpilih, pertahankan yang masih ada
                            setCameraDetails((prev) => {
                              const updated = {};
                              newSelected.forEach((cam) => {
                                updated[cam.value] = prev[cam.value] || '';
                              });
                              return updated;
                            });
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              id_camera: selected ? selected.value : '',
                            }));
                          }
                        }}
                      />
                    </div>

                    {isBulkMode && selectedCameras.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                          <FiMapPin />
                          Detail Lokasi per Kamera
                        </label>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {selectedCameras.map((cam) => (
                            <div
                              key={cam.value}
                              className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3"
                            >
                              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-2 rounded-xl whitespace-nowrap min-w-[110px] text-center">
                                {cam.value}
                              </span>

                              <input
                                type="text"
                                placeholder="Contoh: Lantai 1 Area A"
                                value={cameraDetails[cam.value] || ''}
                                onChange={(e) =>
                                  setCameraDetails((prev) => ({
                                    ...prev,
                                    [cam.value]: e.target.value,
                                  }))
                                }
                                className="
flex-1
px-4
py-2
rounded-xl
border
border-gray-200
bg-white
focus:ring-2
focus:ring-blue-500
outline-none
text-sm
"
                              />
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Isi detail lokasi masing-masing kamera secara terpisah. Kosongkan jika
                          tidak perlu.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* LOKASI */}

                  <div>
                    <label
                      className="
text-sm
font-semibold
flex
items-center
gap-2
"
                    >
                      <FiMapPin />
                      Lokasi
                    </label>

                    <select
                      name="lokasi"
                      value={formData.lokasi}
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
                    >
                      <option value="">--- Pilih Lokasi ---</option>

                      {locationList.map((location, index) => (
                        <option key={`location-${index}`} value={location.name}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* DETAIL LOKASI */}

                  {!isBulkMode && (
                    <div>
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <FiMapPin />
                        Detail Lokasi
                      </label>

                      <input
                        name="lokasi_detail"
                        value={formData.lokasi_detail}
                        onChange={handleChange}
                        className="..."
                      />
                    </div>
                  )}

                  {/* STATUS */}

                  <div>
                    <label
                      className="
text-sm
font-semibold
"
                    >
                      Status Gangguan
                    </label>

                    <input
                      readOnly
                      value={formData.status || ''}
                      className="
w-full
mt-2
px-4
py-3
rounded-2xl
border
bg-gray-100
text-gray-500
"
                    />
                  </div>

                  {/* DATE */}

                  <div
                    className="
md:col-span-2
grid
md:grid-cols-3
gap-5
"
                  >
                    {[
                      ['start_error', 'Mulai Gangguan'],
                      ['request_perbaikan', 'Permintaan Perbaikan'],
                      ['selesai_perbaikan', 'Selesai Perbaikan'],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label
                          className="
text-sm
font-semibold
"
                        >
                          {label}
                        </label>

                        <div className="mt-2">
                          <CostumeDatePicker
                            selectedDate={formData[key]}
                            placeholder={`Pilih ${label}`}
                            onChange={(date) => {
                              setFormData((prev) => {
                                const updated = {
                                  ...prev,

                                  [key]: date,
                                };

                                if (updated.start_error && updated.selesai_perbaikan) {
                                  updated.durasi_error = calculateDuration(
                                    updated.start_error,

                                    updated.selesai_perbaikan
                                  );
                                } else {
                                  updated.durasi_error = '00:00:00';
                                }

                                if (updated.request_perbaikan && updated.selesai_perbaikan) {
                                  updated.response_time = calculateResponseTime(
                                    updated.request_perbaikan,

                                    updated.selesai_perbaikan
                                  );
                                } else {
                                  updated.response_time = '00:00:00';
                                }

                                return updated;
                              });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DURASI */}

                  {[
                    ['durasi_error', 'Durasi Gangguan'],
                    ['response_time', 'Waktu Respon'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label
                        className="
text-sm
font-semibold
"
                      >
                        {label}
                      </label>

                      <input
                        readOnly
                        value={formData[key] || ''}
                        className="
w-full
mt-2
px-4
py-3
rounded-2xl
border
bg-gray-100
"
                      />
                    </div>
                  ))}

                  {/* PETUGAS */}

                  <div>
                    <label
                      className="
text-sm
font-semibold
flex
gap-2
items-center
"
                    >
                      <FiUser />
                      Petugas
                    </label>

                    <select
                      name="petugas"
                      value={formData.petugas}
                      onChange={handleChange}
                      className="
w-full
mt-2
px-4
py-3
rounded-2xl
border
"
                    >
                      <option value="">--- Pilih Petugas ---</option>

                      {officerList.map((officer, index) => (
                        <option key={index} value={officer.name_officer}>
                          {officer.name_officer}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* KETERANGAN */}

                  <div>
                    <label
                      className="
text-sm
font-semibold
flex
gap-2
items-center
"
                    >
                      <FiFileText />
                      Keterangan
                    </label>

                    <input
                      readOnly
                      value={formData.keterangan}
                      onClick={() => {
                        setTempKeterangan(formData.keterangan || '');

                        setShowKeteranganPopup(true);
                      }}
                      placeholder="
Klik untuk menulis keterangan...
"
                      className="
w-full
mt-2
px-4
py-3
rounded-2xl
border
cursor-pointer
"
                    />
                  </div>

                  {/* BUTTON */}

                  <div
                    className="
md:col-span-2
flex
justify-end
gap-3
mt-6
"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setIsBulkMode(false);
                        setSelectedCameras([]);
                      }}
                      className="
px-6
py-3
rounded-2xl
bg-gray-100
hover:bg-gray-200
flex
items-center
gap-2
transition
"
                    >
                      <FiXCircle />
                      Batal
                    </button>

                    <button
                      type="submit"
                      disabled={isBulkMode && selectedCameras.length === 0}
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
transition
flex
items-center
gap-2
disabled:opacity-50
disabled:cursor-not-allowed
disabled:hover:scale-100
"
                    >
                      {isBulkMode ? (
                        <>
                          <FiLayers />
                          Tambah {selectedCameras.length || ''} Gangguan
                        </>
                      ) : isEditing ? (
                        <>
                          <FiSave />
                          Simpan Perubahan
                        </>
                      ) : (
                        <>
                          <FiTool />
                          Tambah Gangguan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>

        {/* ====== TABLE CAMERA TROUBLE (with Durasi Error) ====== */}
        <section className="p-4">
          {/* Search + Filter Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1">
              <span
                className="
        absolute left-3 top-1/2 
        -translate-y-1/2 
        text-gray-400
      "
              >
                🔍
              </span>

              <input
                type="text"
                placeholder="Search Camera Trouble..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
          w-full
          pl-10 pr-4 py-2.5
          rounded-xl
          border border-gray-300
          bg-white/60
          backdrop-blur-md
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-400
          transition
        "
              />
            </div>

            {/* Year Dropdown */}
            <div className="relative w-full md:w-48">
              <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 pl-4 pr-3 py-2.5">
                <LuCalendar size={16} className="text-blue-500 shrink-0" />

                <div className="relative flex-1">
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedYear(value === 'all' ? 'all' : Number(value));
                      setCurrentPage(1);
                    }}
                    className="
          appearance-none
          w-full
          bg-blue-50
          text-blue-700
          font-bold
          text-sm
          pl-3
          pr-8
          py-1.5
          rounded-xl
          border-none
          outline-none
          cursor-pointer
          hover:bg-blue-100
          transition-colors
          duration-200
          focus:ring-2
          focus:ring-blue-400
        "
                  >
                    <option value="all">Semua Tahun</option>

                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        Tahun {year}
                      </option>
                    ))}
                  </select>

                  <svg
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div
            className="
    overflow-x-auto 
    rounded-2xl 
    shadow-xl 
    bg-white/40 
    backdrop-blur-md
  "
          >
            {/* ====== TABLE WRAPPER ====== */}

            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-white/60">
                <tr>
                  {[
                    'No',
                    'ID Camera',
                    'Lokasi',
                    'Lokasi Detail',
                    'Status',
                    'Start Error',
                    'Request Perbaikan',
                    'Selesai Perbaikan',
                    'Durasi Error',
                    'Response Time',
                    'Petugas',
                    'Keterangan',
                    'Aksi',
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
                  paginatedTroubleList.map((item, index) => (
                    <tr key={`${currentPage}-${index}`} className="hover:bg-white/40 transition">
                      <td className="px-6 py-3 text-center font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      <td className="px-6 py-3">{item?.id_camera || '-'}</td>

                      <td className="px-6 py-3">{item?.lokasi || '-'}</td>

                      <td className="px-6 py-3">{item?.lokasi_detail || '-'}</td>

                      <td className="px-6 py-3 text-center">
                        <span
                          className={`
px-2 py-1 text-sm font-medium rounded-sm
${getStatusHighlight(item?.status)}
`}
                        >
                          {item?.status || 'Unknown'}
                        </span>
                      </td>

                      <td className="px-6 py-3">{formatToIndoDateTime(item.start_error)}</td>

                      <td className="px-6 py-3">{formatToIndoDateTime(item.request_perbaikan)}</td>

                      <td className="px-6 py-3">{formatToIndoDateTime(item.selesai_perbaikan)}</td>

                      <td className="px-6 py-3 text-center">{renderDurationError(item)}</td>

                      <td className="px-6 py-3 text-center">{renderResponseTime(item)}</td>

                      <td className="px-6 py-3 text-center">{item.petugas || '-'}</td>

                      <td className="px-6 py-3 text-center">{item.keterangan || '-'}</td>

                      <td className="px-6 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(item)}
                              title="Edit Data"
                              className="
          bg-yellow-400
          hover:bg-yellow-500
          text-white
          p-2
          rounded-lg
          transition
          shadow-sm
          hover:scale-105
        "
                            >
                              <FiEdit2 size={17} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item)}
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
        "
                            >
                              <FiTrash2 size={17} />
                            </button>
                          )}

                          {canReleaseCamera && item.status !== 'Kamera Dilepas' && (
                            <button
                              onClick={() => handleReleaseCamera(item)}
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
        "
                            >
                              <FiCameraOff size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
                  <td colSpan={9} className="px-6 py-3 text-right font-semibold text-gray-700">
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
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
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
