import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CCTVIdRecord() {
  const API_BASE = "http://localhost:8081/api";

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [useManualId, setUseManualId] = useState(false);

  const [cctvList, setCctvList] = useState([]);
  const [areaList, setAreaList] = useState([]);
  const [requestList, setRequestList] = useState([]);
  const [cameraTroubleList, setCameraTroubleList] = useState([]);

  const [formData, setFormData] = useState({
    id_camera: "",
    id_nvr: "",
    lokasi: "",
    area: "",
    kondisi: "",
    jumlah_error: 0,
    jumlah_request: 0,
    jumlah_on_kembali: 0,
    jumlah_durasi_error: "00:00:00",
    average_durasi_x_error: "00:00:00",
  });

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  /* ===================== Helpers ===================== */
  const hhmmssToSeconds = (timeStr = "00:00:00") => {
    const parts = String(timeStr).split(":").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return 0;
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  };

  const secondsToHHMMSS = (totalSec = 0) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  /* ===================== Fetchers ===================== */
  const fetchArea = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/location`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAreaList(res.data.data || res.data || []);
    } catch {
      setAreaList([]);
    }
  };

  const fetchCCTVs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/id-cctv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCctvList(res.data || []);
    } catch {
      setCctvList([]);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/summary-request-camera`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? [];
      const normalized = payload.map((r) => ({
        id_camera: String(
          r.id_camera ?? r.IDCamera ?? r.idCamera ?? r.id ?? ""
        ),
        status: String(r.status ?? r.Status ?? ""),
        input_database: String(r.input_database ?? r.InputDatabase ?? ""),
      }));
      setRequestList(normalized);
    } catch {
      setRequestList([]);
    }
  };

  const fetchCameraTrouble = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/list-camera-trouble`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = Array.isArray(res.data)
        ? res.data
        : res.data?.data ?? [];
      const normalized = payload.map((r) => ({
        id_camera: String(
          r.id_camera ?? r.IDCamera ?? r.idCamera ?? r.id ?? ""
        ),
        start_error: String(r.start_error ?? r.StartError ?? ""),
        request_perbaikan: String(
          r.request_perbaikan ?? r.RequestPerbaikan ?? ""
        ),
        selesai_perbaikan: String(
          r.selesai_perbaikan ?? r.SelesaiPerbaikan ?? ""
        ),
      }));
      setCameraTroubleList(normalized);
    } catch {
      setCameraTroubleList([]);
    }
  };

  useEffect(() => {
    fetchCCTVs();
    fetchArea();
    fetchRequests();
    fetchCameraTrouble();
    setCurrentPage(1);
  }, [searchTerm]);

  /* ===================== Logic Available Request ID ===================== */
  const availableRequestIds = requestList
    .filter((r) => {
      const ok1 = r.status.toLowerCase() === "success";
      const ok2 = r.input_database.toLowerCase() === "terinput";
      const ok3 = !cctvList.some(
        (c) => String(c.id_camera).trim() === String(r.id_camera).trim()
      );
      return ok1 && ok2 && ok3 && r.id_camera.trim() !== "";
    })
    .map((r) => r.id_camera);

  /* ===================== Submit ===================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return alert("Not authenticated!");

    if (
      formData.id_camera &&
      cctvList.some(
        (c) => String(c.id_camera).trim() === String(formData.id_camera).trim()
      ) &&
      !isEditing
    ) {
      return alert(
        "ID Camera sudah ada. Pilih ID Camera lain atau gunakan manual ID unik."
      );
    }

    let kondisi = formData.kondisi;
    const jumlahError = Number(formData.jumlah_error);
    const jumlahOnKembali = Number(formData.jumlah_on_kembali);

    if (formData.kondisi !== "DILEPAS") {
      if (jumlahError === jumlahOnKembali) kondisi = "ON";
      else if (jumlahError > jumlahOnKembali) kondisi = "OFF";
    }

    const dataToSend = {
      ...formData,
      kondisi,
      jumlah_error: jumlahError,
      jumlah_request: Number(formData.jumlah_request),
      jumlah_on_kembali: jumlahOnKembali,
    };

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `${API_BASE}/id-cctv/${editId}`
        : `${API_BASE}/id-cctv`;

      await axios({
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: dataToSend,
      });

      alert("Saved successfully!");
      await fetchCCTVs();
      await fetchRequests();
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setUseManualId(false);
      setFormData({
        id_camera: "",
        id_nvr: "",
        lokasi: "",
        area: "",
        kondisi: "",
        jumlah_error: 0,
        jumlah_request: 0,
        jumlah_on_kembali: 0,
        jumlah_durasi_error: "00:00:00",
        average_durasi_x_error: "00:00:00",
      });
    } catch (err) {
      alert("Failed to save: " + err.message);
    }
  };

  const handleEdit = (c) => {
    setFormData({ ...c });
    setIsEditing(true);
    setEditId(c.id);
    setShowForm(true);
    setUseManualId(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete data ini?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/id-cctv/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCCTVs();
      await fetchRequests();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  /* ===================== Table, Paging, Color ===================== */
  const filteredCCTVs = cctvList.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const pageCount = Math.max(
    1,
    Math.ceil(filteredCCTVs.length / itemsPerPage)
  );
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
      (r) =>
        String(r.id_camera).trim().toUpperCase() ===
        String(idCamera).trim().toUpperCase()
    );
    if (!rows.length)
      return {
        totalError: 0,
        reqPerbaikan: 0,
        onKembali: 0,
        totalDurasi: "00:00:00",
        avgDurasi: "00:00:00",
        status: "ON",
      };

    const totalError = rows.length;
    const reqPerbaikan = rows.filter((r) => isValid(r.request_perbaikan)).length;
    const validRows = rows.filter(
      (r) =>
        isValid(r.start_error) &&
        isValid(r.request_perbaikan) &&
        isValid(r.selesai_perbaikan)
    );

    const totalSeconds = validRows.reduce((acc, r) => {
      const st = new Date(r.start_error);
      const ed = new Date(r.selesai_perbaikan);
      return acc + Math.max(0, (ed - st) / 1000);
    }, 0);

    const doneCount = validRows.length;
    const avgSec = doneCount > 0 ? totalSeconds / doneCount : 0;
    const status = totalError > doneCount ? "OFF" : "ON";

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
    if (status === "DILEPAS") return "bg-yellow-50";
    if (status === "ON") return "bg-green-50";
    if (status === "OFF") return "bg-red-50";
    return "";
  };

  const getBadgeClass = (k) => {
    const base =
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";
    const s = String(k).toUpperCase();
    if (s === "DILEPAS") return `${base} bg-yellow-100 text-yellow-800`;
    if (s === "ON") return `${base} bg-green-100 text-green-800`;
    if (s === "OFF") return `${base} bg-red-100 text-red-800`;
    return `${base} bg-gray-100 text-gray-800`;
  };

  return (
    <Layout>
      {/* ===================== Chart ===================== */}
      <section className="p-4">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-xl w-full h-[400px]">
          <h2 className="text-xl font-semibold mb-4">
            Stacked Line: Average Durasi × Jumlah Error per Area & Lokasi
          </h2>
          <div style={{ height: "calc(100% - 2.5rem)" }}>
            {cctvList.length > 0 ? (
              <Line
                data={{
                  labels: [...new Set(cctvList.map((c) => c.lokasi))],
                  datasets: Object.entries(
                    cctvList.reduce((acc, c) => {
                      const ar = c.area || "Unknown Area";
                      const lok = c.lokasi || "Unknown";
                      if (!acc[ar]) acc[ar] = {};
                      if (!acc[ar][lok]) acc[ar][lok] = 0;
                      acc[ar][lok] +=
                        hhmmssToSeconds(c.average_durasi_x_error) *
                        Number(c.jumlah_error);
                      return acc;
                    }, {})
                  ).map(([area, d], idx) => ({
                    label: area,
                    data: [...new Set(cctvList.map((c) => c.lokasi))].map(
                      (l) => d[l] || 0
                    ),
                    fill: true,
                    borderColor: `hsl(${(idx * 60) % 360},70%,50%)`,
                    backgroundColor: `hsla(${(idx * 60) % 360},70%,50%,0.3)`,
                    tension: 0.3,
                    stack: "Stack 0",
                  })),
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: "index", intersect: false },
                  scales: { x: { stacked: true }, y: { stacked: true } },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (ctx) =>
                          `${ctx.dataset.label}: ${secondsToHHMMSS(
                            ctx.raw || 0
                          )}`,
                      },
                    },
                  },
                }}
              />
            ) : (
              <p className="text-center">No CCTV data</p>
            )}
          </div>
        </div>
      </section>

      {/* ===================== Add Button & Form ===================== */}
      <section className="p-4">
        <button
          onClick={() => {
            setShowForm(true);
            setIsEditing(false);
            setEditId(null);
            setUseManualId(false);
            setFormData({
              id_camera: "",
              id_nvr: "",
              lokasi: "",
              area: "",
              kondisi: "",
              jumlah_error: 0,
              jumlah_request: 0,
              jumlah_on_kembali: 0,
              jumlah_durasi_error: "00:00:00",
              average_durasi_x_error: "00:00:00",
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md"
        >
          ➕ Add CCTV
        </button>

        {showForm && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowForm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full"
            >
              <h2 className="text-2xl font-bold mb-6">
                {isEditing ? "✏️ Edit CCTV" : "➕ Add CCTV"}
              </h2>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Select ID Camera */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    ID Camera
                  </label>
                  <div className="flex gap-4 mb-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!useManualId}
                        onChange={() => {
                          setUseManualId(false);
                          setFormData((p) => ({ ...p, id_camera: "" }));
                        }}
                      />
                      Pilih dari Request
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={useManualId}
                        onChange={() => {
                          setUseManualId(true);
                          setFormData((p) => ({ ...p, id_camera: "" }));
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
                      placeholder="Masukkan ID Camera manual"
                      className="w-full border rounded-md px-3 py-2"
                      required={!isEditing}
                    />
                  ) : (
                    <select
                      name="id_camera"
                      value={formData.id_camera}
                      onChange={handleChange}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="">-- Pilih dari request --</option>
                      {availableRequestIds.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Fields */}
                {[
                  ["id_nvr", "ID NVR"],
                  ["lokasi", "Lokasi"],
                ].map(([k, l]) => (
                  <div key={k}>
                    <label className="block text-sm mb-1">{l}</label>
                    <input
                      name={k}
                      value={formData[k]}
                      onChange={handleChange}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm mb-1">Area</label>
                  <select
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">-- Pilih Area --</option>
                    {areaList.map((ar) => (
                      <option key={ar.id ?? ar.name} value={ar.name ?? ar}>
                        {ar.name ?? ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Kondisi</label>
                  <select
                    name="kondisi"
                    value={formData.kondisi}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">-- Pilih Kondisi --</option>
                    <option value="DILEPAS">DILEPAS (kamera dicabut)</option>
                  </select>
                </div>

                {/* Numeric */}
                {[
                  ["jumlah_error", "Jumlah Error"],
                  ["jumlah_request", "Jumlah Request"],
                  ["jumlah_on_kembali", "Jumlah On Kembali"],
                ].map(([k, l]) => (
                  <div key={k}>
                    <label className="block text-sm mb-1">{l}</label>
                    <input
                      type="number"
                      name={k}
                      value={formData[k]}
                      onChange={handleChange}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                ))}

                {/* Duration */}
                {[
                  ["jumlah_durasi_error", "Jumlah Durasi Error"],
                  ["average_durasi_x_error", "Rata-rata Durasi × Error"],
                ].map(([k, l]) => (
                  <div key={k}>
                    <label className="block text-sm mb-1">{l}</label>
                    <input
                      placeholder="HH:MM:SS"
                      name={k}
                      value={formData[k]}
                      onChange={handleChange}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                ))}

                <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-200 px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md"
                  >
                    {isEditing ? "Save Changes" : "Add CCTV"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* ===================== Table ===================== */}
      <section className="p-4">
        <input
          type="text"
          placeholder="🔍 Search CCTV..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded-md"
        />

        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white/40">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-white/60">
              <tr>
                {[
                  "No",
                  "ID Camera",
                  "ID NVR",
                  "Lokasi",
                  "Area",
                  "Kondisi",
                  "Error",
                  "Request",
                  "On Kembali",
                  "Durasi Error",
                  "Avg × Error",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-sm font-semibold uppercase text-left"
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
                      <td className="px-6 py-3">
                        {(currentPage - 1) * itemsPerPage + i + 1}
                      </td>
                      <td className="px-6 py-3">{c.id_camera}</td>
                      <td className="px-6 py-3">{c.id_nvr}</td>
                      <td className="px-6 py-3">{c.lokasi}</td>
                      <td className="px-6 py-3">{c.area}</td>
                      <td className="px-6 py-3">
                        <span className={getBadgeClass(t.status)}>
                          {t.status}
                        </span>
                      </td>

                      <td className="px-6 py-3 text-center">
                        {t.totalError}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {t.reqPerbaikan}
                      </td>
                      <td className="px-6 py-3 text-center">{t.onKembali}</td>
                      <td className="px-6 py-3 text-center">
                        {t.totalDurasi}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {t.avgDurasi}
                      </td>

                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleEdit(c)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-md"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                          >
                            🗑️ Hapus
                          </button>
                          {c.kondisi !== "DILEPAS" && (
                            <button
                              onClick={async () => {
                                const token =
                                  localStorage.getItem("token");
                                try {
                                  await axios.put(
                                    `${API_BASE}/id-cctv/${c.id}`,
                                    { ...c, kondisi: "DILEPAS" },
                                    {
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                    }
                                  );
                                  await fetchCCTVs();
                                  await fetchRequests();
                                } catch {
                                  alert("Gagal melepas kamera");
                                }
                              }}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md"
                            >
                              🚫 Lepas
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="text-center py-4">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-200"
          >
            Prev
          </button>
          <span>
            Page {currentPage} / {pageCount}
          </span>
          <button
            disabled={currentPage >= pageCount}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-200"
          >
            Next
          </button>
        </div>
      </section>
    </Layout>
  );
}
