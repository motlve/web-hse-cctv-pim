import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Layout from "../components/Layout";

export default function IncidentRecord() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tanggalIncident: null,
    tanggalPenyelesaian: null,
    keterangan: "",
    lokasi: "",
    deskripsi: "",
    kategori: "",
    durasi: "",
    petugas: "",
    search: "",
  });

  const [dataTable, setDataTable] = useState([
    {
      id: 1,
      tanggalIncident: new Date("2024-05-23T10:00"),
      tanggalPenyelesaian: new Date("2024-05-23T12:00"),
      lokasi: "PIM 1",
      kategori: "Analog",
      durasi: "2 Jam",
      deskripsi: "Kabel putus",
      keterangan: "Butuh ganti kabel",
      petugas: "Rizky",
    },
    {
      id: 2,
      tanggalIncident: new Date("2024-05-22T09:30"),
      tanggalPenyelesaian: new Date("2024-05-22T11:00"),
      lokasi: "PIM 2",
      kategori: "Digital",
      durasi: "1.5 Jam",
      deskripsi: "Gangguan sinyal",
      keterangan: "Reset ulang perangkat",
      petugas: "Sari",
    },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tanggalIncident || !formData.lokasi || !formData.petugas) {
      alert("Mohon isi tanggal incident, lokasi, dan petugas.");
      return;
    }

    const newEntry = {
      id: dataTable.length + 1,
      ...formData,
    };

    setDataTable((prev) => [...prev, newEntry]);

    setFormData({
      tanggalIncident: null,
      tanggalPenyelesaian: null,
      keterangan: "",
      lokasi: "",
      deskripsi: "",
      kategori: "",
      durasi: "",
      petugas: "",
      search: "",
    });
    setShowForm(false);
  };

  const formatDateTime = (date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  return (
    <Layout>
      <div className="p-6 bg-white/30 backdrop-blur-md rounded-xl max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Incident Record Form</h1>
        </div>

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

        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-400 hover:bg-green-500 text-white px-6 py-2 rounded-full shadow"
          >
            Tambah Incident
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Incident Record Table</h1>
          <input
            type="text"
            name="search"
            placeholder="Search ..."
            value={formData.search}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-md w-64"
          />
        </div>

        <div className="overflow-auto rounded-xl shadow-md bg-white/60 backdrop-blur-md mb-8">
          <table className="min-w-[1000px] w-full text-sm text-left text-gray-800">
            <thead className="text-xs uppercase bg-gray-200/70 text-gray-700">
              <tr>
                <th className="px-6 py-3">No</th>
                <th className="px-6 py-3">Tanggal & Waktu Incident</th>
                <th className="px-6 py-3">Tanggal & Waktu Penyelesaian</th>
                <th className="px-6 py-3">Lokasi</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Durasi</th>
                <th className="px-6 py-3">Deskripsi</th>
                <th className="px-6 py-3">Keterangan</th>
                <th className="px-6 py-3">Petugas</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white/70">
              {dataTable
                .filter((item) =>
                  item.lokasi.toLowerCase().includes(formData.search.toLowerCase()) ||
                  item.keterangan.toLowerCase().includes(formData.search.toLowerCase()) ||
                  item.petugas.toLowerCase().includes(formData.search.toLowerCase())
                )
                .map((item, index) => (
                  <tr key={item.id} className="border-t hover:bg-gray-100/50 transition">
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3">{formatDateTime(item.tanggalIncident)}</td>
                    <td className="px-6 py-3">{formatDateTime(item.tanggalPenyelesaian)}</td>
                    <td className="px-6 py-3">{item.lokasi}</td>
                    <td className="px-6 py-3">{item.kategori}</td>
                    <td className="px-6 py-3">{item.durasi}</td>
                    <td className="px-6 py-3">{item.deskripsi}</td>
                    <td className="px-6 py-3">{item.keterangan}</td>
                    <td className="px-6 py-3">{item.petugas}</td>
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

        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"></div>
            <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-lg p-6 max-w-3xl w-full grid grid-cols-1 md:grid-cols-3 gap-4 overflow-auto max-h-[90vh]"
              >
                <div>
                  <label className="text-sm font-medium text-gray-700">Tanggal & Waktu Incident</label>
                  <DatePicker
                    selected={formData.tanggalIncident}
                    onChange={(date) => setFormData((prev) => ({ ...prev, tanggalIncident: date }))}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Waktu"
                    dateFormat="dd/MM/yyyy HH:mm"
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tanggal & Waktu Penyelesaian</label>
                  <DatePicker
                    selected={formData.tanggalPenyelesaian}
                    onChange={(date) => setFormData((prev) => ({ ...prev, tanggalPenyelesaian: date }))}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Waktu"
                    dateFormat="dd/MM/yyyy HH:mm"
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Keterangan</label>
                  <input
                    type="text"
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Lokasi</label>
                  <select
                    name="lokasi"
                    value={formData.lokasi}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Pilih Lokasi</option>
                    <option value="PIM 1">PIM 1</option>
                    <option value="PIM 2">PIM 2</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Deskripsi</label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border rounded-md resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    name="kategori"
                    value={formData.kategori}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Kendala_operasional">Kendala operasional</option>
                    <option value="Kehilangan">Kehilangan</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Durasi</label>
                  <input
                    type="text"
                    name="durasi"
                    placeholder="e.g., 2 Jam"
                    value={formData.durasi}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Petugas</label>
                  <input
                    type="text"
                    name="petugas"
                    value={formData.petugas}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 bg-gray-400 rounded-md hover:bg-gray-500 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-500 rounded-md hover:bg-green-600 text-white"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
