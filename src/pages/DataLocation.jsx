import { useState } from "react";
import Layout from "../components/Layout";

export default function DataLokasi() {
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ namaAreal: "" });

  const [lokasiList, setLokasiList] = useState([
    { no: 1, namaAreal: "PIM 1" },
    { no: 2, namaAreal: "PIM 2" },
  ]);

  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.namaAreal.trim()) return alert("Nama Areal tidak boleh kosong.");

    if (isEditing) {
      const updatedList = [...lokasiList];
      updatedList[editIndex].namaAreal = formData.namaAreal.trim();
      setLokasiList(updatedList);
    } else {
      const newEntry = {
        no: lokasiList.length + 1,
        namaAreal: formData.namaAreal.trim(),
      };
      setLokasiList([...lokasiList, newEntry]);
    }

    setFormData({ namaAreal: "" });
    setShowForm(false);
    setIsEditing(false);
    setEditIndex(null);
  };

  const handleEdit = (index) => {
    setFormData({ namaAreal: lokasiList[index].namaAreal });
    setShowForm(true);
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    const updatedList = lokasiList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: i + 1 }));
    setLokasiList(updatedList);
  };

  const filteredList = lokasiList.filter((item) =>
    item.namaAreal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Layout>
      <div className="p-6 bg-white/30 backdrop-blur-md rounded-xl max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Data Lokasi Areal</h2>

        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Cari nama areal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring"
          />
          <button
            onClick={() => {
              setShowForm(true);
              setIsEditing(false);
              setFormData({ namaAreal: "" });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Tambah Lokasi
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg shadow mb-4">
          <table className="min-w-full bg-white border border-gray-200 text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase">
              <tr>
                <th className="px-4 py-3 border">No</th>
                <th className="px-4 py-3 border">Nama Areal</th>
                <th className="px-4 py-3 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((lokasi, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{lokasi.no}</td>
                  <td className="px-4 py-2 border">{lokasi.namaAreal}</td>
                  <td className="px-4 py-2 border space-x-2">
                    <button
                      onClick={() => handleEdit((currentPage - 1) * itemsPerPage + index)}
                      className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete((currentPage - 1) * itemsPerPage + index)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {showForm && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowForm(false)}
            />
            <div className="fixed top-1/2 left-1/2 w-11/12 max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 z-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  {isEditing ? "Edit Lokasi" : "Tambah Lokasi"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="namaAreal"
                  value={formData.namaAreal}
                  onChange={handleChange}
                  placeholder="Masukkan Nama Areal (cth: PIM 3)"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {isEditing ? "Perbarui" : "Simpan"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}