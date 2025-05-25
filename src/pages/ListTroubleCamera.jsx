import { useState, useMemo } from "react";
import Layout from "../components/Layout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CameraTrouble() {
  const lokasiOptions = ["PIM 1", "PIM 2"];
  const petugasOptions = ["Budi", "Siti", "Andi", "Rina"];

  const [dataList, setDataList] = useState([
    {
      tanggalInput: "02/05/2025",
      idCamera: "CAM-001",
      lokasi: "Analog",
      detailLokasi: "Gedung A Lt. 3",
      keterangan: "Camera rusak akibat hujan",
      petugas: "Budi",
      startError: "2025-05-02T08:00:00",
      requestPerbaikan: "2025-05-02T10:00:00",
      selesaiPerbaikan: "2025-05-02T12:00:00",
    },
    {
      tanggalInput: "02/05/2025",
      idCamera: "CAM-002",
      lokasi: "Digital",
      detailLokasi: "Gedung B Lt. 2",
      keterangan: "Sinyal lemah",
      petugas: "Siti",
      startError: "2025-05-02T09:00:00",
      requestPerbaikan: "2025-05-02T11:00:00",
      selesaiPerbaikan: "", // belum selesai
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tanggalInput: "",
    idCamera: "",
    lokasi: "",
    detailLokasi: "",
    keterangan: "",
    petugas: "",
    startError: "",
    requestPerbaikan: "",
    selesaiPerbaikan: "",
  });

  // Status Terupdate
  function getStatusTerupdate(item) {
    if (item.selesaiPerbaikan) return "Selesai Perbaikan";
    if (item.requestPerbaikan) return "Request Perbaikan";
    if (item.startError) return "Error";
    return "-";
  }

  // Format tanggal input (DD/MM/YYYY)
  function formatTanggalDDMMYYYY(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // Format tanggal dan waktu ke "DD/MM/YYYY HH:mm:ss"
  function formatTanggalWaktu(date) {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return "-";

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  }

  // Hitung durasi dalam format HH:MM:SS
  function diffTimeFormat(start, end) {
    if (!start || !end) return "-";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    if (diffMs < 0) return "-";

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }

  // Hitung rata-rata response time dalam ms
  const avgResponseTimeMs = useMemo(() => {
    let total = 0;
    let count = 0;
    dataList.forEach(({ selesaiPerbaikan, requestPerbaikan }) => {
      if (selesaiPerbaikan && requestPerbaikan) {
        const diff = new Date(selesaiPerbaikan) - new Date(requestPerbaikan);
        if (diff >= 0) {
          total += diff;
          count++;
        }
      }
    });
    return count === 0 ? 0 : total / count;
  }, [dataList]);

  // Format ms ke HH:MM:SS
  function formatMsToHMS(ms) {
    if (!ms || ms <= 0) return "-";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  // Handle form input change untuk input biasa
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle perubahan datepicker untuk tanggal dan waktu dengan detik
  const handleDateChange = (name, date) => {
    if (date instanceof Date && !isNaN(date)) {
      // Simpan dalam format ISO string tanpa timezone offset (local time)
      const isoString = date.toISOString().slice(0, 19);
      setFormData((prev) => ({
        ...prev,
        [name]: isoString,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Submit form tambah data
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.idCamera || !formData.lokasi || !formData.petugas) {
      alert("Mohon isi ID Camera, Lokasi, dan Petugas");
      return;
    }

    // Set tanggalInput hari ini jika kosong
    const tanggalInputFormatted = formData.tanggalInput
      ? formData.tanggalInput
      : formatTanggalDDMMYYYY(new Date());

    setDataList((prev) => [
      ...prev,
      {
        ...formData,
        tanggalInput: tanggalInputFormatted,
      },
    ]);
    setFormData({
      tanggalInput: "",
      idCamera: "",
      lokasi: "",
      detailLokasi: "",
      keterangan: "",
      petugas: "",
      startError: "",
      requestPerbaikan: "",
      selesaiPerbaikan: "",
    });
    setShowForm(false);
  };

  // Fungsi untuk konversi ISO string formData ke Date object (untuk datepicker)
  const isoToDate = (isoStr) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    return isNaN(d) ? null : d;
  };

  return (
    <Layout>
      <div className="p-6 bg-white/30 backdrop-blur-md rounded-xl relative max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          LIST CAMERA TROUBLE FORM
        </h2>

        {/* Chart */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-md font-semibold text-gray-700 mb-2">
              INCIDENT RECORD ANALYST
            </h3>
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-500">
              Grafik Incident Record
            </div>
          </div>
        </div>

        {/* Tombol Tambah */}
        <div className="mb-6">
          <button
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                tanggalInput: formatTanggalDDMMYYYY(new Date()),
              }));
              setShowForm(true);
            }}
            className="bg-green-400 hover:bg-green-500 text-white px-6 py-2 rounded-full shadow"
          >
            Tambah
          </button>
        </div>

          <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">List Trouble Camera Table</h1>
          <input
            type="text"
            name="search"
            placeholder="Search ..."
            value={formData.search}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-md w-64"
          />
        </div>

        {/* Tabel */}
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="px-6 py-3">No.</th>
                <th className="px-6 py-3">Tanggal Input</th>
                <th className="px-6 py-3">ID Cam</th>
                <th className="px-6 py-3">Lokasi</th>
                <th className="px-6 py-3">Lokasi Detail</th>
                <th className="px-6 py-3">Keterangan</th>
                <th className="px-6 py-3">Petugas</th>
                <th className="px-6 py-3">Start Error</th>
                <th className="px-6 py-3">Request Perbaikan</th>
                <th className="px-6 py-3">Selesai Perbaikan</th>
                <th className="px-6 py-3">Status Terupdate</th>
                <th className="px-6 py-3">Durasi Error</th>
                <th className="px-6 py-3">Response Time</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataList.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-6 py-3">{i + 1}</td>
                  <td className="px-6 py-3">{item.tanggalInput || "-"}</td>
                  <td className="px-6 py-3">{item.idCamera || "-"}</td>
                  <td className="px-6 py-3">{item.lokasi || "-"}</td>
                  <td className="px-6 py-3">{item.detailLokasi || "-"}</td>
                  <td className="px-6 py-3">{item.keterangan || "-"}</td>
                  <td className="px-6 py-3">{item.petugas || "-"}</td>
                  <td className="px-6 py-3">{formatTanggalWaktu(item.startError)}</td>
                  <td className="px-6 py-3">{formatTanggalWaktu(item.requestPerbaikan)}</td>
                  <td className="px-6 py-3">{formatTanggalWaktu(item.selesaiPerbaikan)}</td>
                  <td className="px-6 py-3">{getStatusTerupdate(item)}</td>
                  <td className="px-6 py-3">
                    {diffTimeFormat(item.startError, item.selesaiPerbaikan)}
                  </td>
                  <td className="px-6 py-3">{formatMsToHMS(avgResponseTimeMs)}</td>
                  <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-md shadow-sm">Detail</button>
                        <button className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded-md shadow-sm">Edit</button>
                        <button className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-md shadow-sm">Delete</button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start z-50 overflow-auto py-8"
            onClick={() => setShowForm(false)}
          >
            {/* Stop propagation agar klik di dalam form tidak menutup modal */}
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSubmit}
              className="bg-white rounded-xl p-6 max-w-3xl w-full shadow-lg"
              style={{ minWidth: "320px" }}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Tambah Data Camera Trouble
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tanggal Input */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Tanggal Input
                  </label>
                  <input
                    type="text"
                    name="tanggalInput"
                    value={formData.tanggalInput}
                    onChange={handleChange}
                    placeholder="DD/MM/YYYY"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>

                {/* ID Camera */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    ID Camera
                  </label>
                  <input
                    type="text"
                    name="idCamera"
                    value={formData.idCamera}
                    onChange={handleChange}
                    placeholder="Contoh: CAM-001"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>

                {/* Lokasi */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Lokasi
                  </label>
                  <select
                    name="lokasi"
                    value={formData.lokasi}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">Pilih lokasi</option>
                    {lokasiOptions.map((lok) => (
                      <option key={lok} value={lok}>
                        {lok}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Detail Lokasi */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Detail Lokasi
                  </label>
                  <input
                    type="text"
                    name="detailLokasi"
                    value={formData.detailLokasi}
                    onChange={handleChange}
                    placeholder="Detail lokasi"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                {/* Keterangan */}
                <div className="sm:col-span-2">
                  <label className="block mb-1 font-medium text-gray-600">
                    Keterangan
                  </label>
                  <textarea
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleChange}
                    placeholder="Keterangan"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={3}
                  />
                </div>

                {/* Petugas */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Petugas
                  </label>
                  <select
                    name="petugas"
                    value={formData.petugas}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">Pilih petugas</option>
                    {petugasOptions.map((pet) => (
                      <option key={pet} value={pet}>
                        {pet}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Error */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Start Error
                  </label>
                  <DatePicker
                    selected={isoToDate(formData.startError)}
                    onChange={(date) => handleDateChange("startError", date)}
                    showTimeSelect
                    timeFormat="HH:mm:ss"
                    timeIntervals={1}
                    dateFormat="dd/MM/yyyy HH:mm:ss"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholderText="Pilih tanggal dan waktu"
                    isClearable
                  />
                </div>

                {/* Request Perbaikan */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Request Perbaikan
                  </label>
                  <DatePicker
                    selected={isoToDate(formData.requestPerbaikan)}
                    onChange={(date) => handleDateChange("requestPerbaikan", date)}
                    showTimeSelect
                    timeFormat="HH:mm:ss"
                    timeIntervals={1}
                    dateFormat="dd/MM/yyyy HH:mm:ss"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholderText="Pilih tanggal dan waktu"
                    isClearable
                  />
                </div>

                {/* Selesai Perbaikan */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Selesai Perbaikan
                  </label>
                  <DatePicker
                    selected={isoToDate(formData.selesaiPerbaikan)}
                    onChange={(date) => handleDateChange("selesaiPerbaikan", date)}
                    showTimeSelect
                    timeFormat="HH:mm:ss"
                    timeIntervals={1}
                    dateFormat="dd/MM/yyyy HH:mm:ss"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholderText="Pilih tanggal dan waktu"
                    isClearable
                  />
                </div>
              </div>

              {/* Tombol aksi */}
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
