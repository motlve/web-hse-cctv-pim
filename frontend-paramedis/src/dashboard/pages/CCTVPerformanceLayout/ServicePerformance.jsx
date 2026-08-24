import { useState } from "react";

export default function ServicePerformance() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        tanggalKerusakan: "",
        tanggalDilaporkan: "",
        tanggalBerfungsi: "",
        keterangan: "",
        search: "",
    });

    // Data awal dummy
    const [dataTable, setDataTable] = useState([
        {
            id: 1,
            tanggalKerusakan: "2025-05-01",
            tanggalDilaporkan: "2025-05-02",
            tanggalBerfungsi: "2025-05-05",
            keterangan: "Perbaikan rutin",
        },
        {
            id: 2,
            tanggalKerusakan: "2025-04-25",
            tanggalDilaporkan: "2025-04-26",
            tanggalBerfungsi: "2025-04-28",
            keterangan: "Ganti kabel",
        },
    ]);

    // Fungsi hitung durasi perbaikan (hari)
    const calculateDurasi = (start, end) => {
        if (!start || !end) return "-";
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = endDate - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : "-";
    };

    // Handle input form
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();

        if (
            !formData.tanggalKerusakan ||
            !formData.tanggalDilaporkan ||
            !formData.tanggalBerfungsi
        ) {
            alert("Mohon isi semua tanggal.");
            return;
        }

        setDataTable((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                tanggalKerusakan: formData.tanggalKerusakan,
                tanggalDilaporkan: formData.tanggalDilaporkan,
                tanggalBerfungsi: formData.tanggalBerfungsi,
                keterangan: formData.keterangan,
            },
        ]);

        setFormData({
            tanggalKerusakan: "",
            tanggalDilaporkan: "",
            tanggalBerfungsi: "",
            keterangan: "",
            search: "",
        });
        setShowForm(false);
    };

    

    return (
        <div className="p-6 bg-white/30 backdrop-blur-md rounded-xl relative max-w-7xl mx-auto">
            {/* Chart placeholder */}
            <div className="mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">
                        SERVICE PERFORMANCE ANALYST
                    </h3>
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-500">
                        Grafik Service Performance
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-green-400 hover:bg-green-500 text-white px-6 py-2 rounded-full shadow"
                >
                    Tambah
                </button>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Service Performance Table</h1>
                <input
                    type="text"
                    name="search"
                    placeholder="Search keterangan..."
                    value={formData.search}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-md w-64"
                />
            </div>

            <div className="overflow-auto rounded-xl shadow-md bg-white/60 backdrop-blur-md mb-4">
                <table className="min-w-[900px] w-full text-sm text-left text-gray-800">
                    <thead className="text-xs uppercase bg-gray-200/70 text-gray-700">
                        <tr>
                            <th className="px-6 py-3">No</th>
                            <th className="px-6 py-3">Tanggal Kerusakan</th>
                            <th className="px-6 py-3">Tanggal Dilaporkan</th>
                            <th className="px-6 py-3">Tanggal Kamera Berfungsi</th>
                            <th className="px-6 py-3">Total Durasi Perbaikan (Hari)</th>
                            <th className="px-6 py-3">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/70">
                        {dataTable
                            .filter((item) =>
                                item.keterangan
                                    .toLowerCase()
                                    .includes(formData.search.toLowerCase())
                            )
                            .map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="border-t hover:bg-gray-100/50 transition"
                                >
                                    <td className="px-6 py-3">{index + 1}</td>
                                    <td className="px-6 py-3">{item.tanggalKerusakan}</td>
                                    <td className="px-6 py-3">{item.tanggalDilaporkan}</td>
                                    <td className="px-6 py-3">{item.tanggalBerfungsi}</td>
                                    <td className="px-6 py-3">
                                        {calculateDurasi(item.tanggalKerusakan, item.tanggalBerfungsi)}
                                    </td>
                                    <td className="px-6 py-3">{item.keterangan}</td>
                                </tr>
                            ))}
                    </tbody>

                    {/* Baris total durasi */}
                    <tfoot>
                        <tr className="bg-gray-100 font-semibold text-gray-700">
                            <td colSpan={4} className="px-6 py-3 text-right">
                                Total Durasi Keseluruhan (Hari)
                            </td>
                            <td className="px-6 py-3">
                                {dataTable
                                    .filter((item) =>
                                        item.keterangan
                                            .toLowerCase()
                                            .includes(formData.search.toLowerCase())
                                    )
                                    .reduce((total, item) => {
                                        const durasi = calculateDurasi(
                                            item.tanggalKerusakan,
                                            item.tanggalBerfungsi
                                        );
                                        return total + (durasi !== "-" ? durasi : 0);
                                    }, 0)}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Form tambah data */}
            {showForm && (
                <>
                    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"></div>
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-xl shadow-lg p-6 max-w-3xl w-full grid grid-cols-1 md:grid-cols-3 gap-4 overflow-auto max-h-[90vh]"
                        >
                            {/* Form fields tetap sama */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Tanggal Kerusakan
                                </label>
                                <input
                                    type="text"
                                    name="tanggalKerusakan"
                                    value={formData.tanggalKerusakan}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Tanggal Dilaporkan
                                </label>
                                <input
                                    type="text"
                                    name="tanggalDilaporkan"
                                    value={formData.tanggalDilaporkan}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Tanggal Kamera Berfungsi
                                </label>
                                <input
                                    type="text"
                                    name="tanggalBerfungsi"
                                    value={formData.tanggalBerfungsi}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="text-sm font-medium text-gray-700">Keterangan</label>
                                <input
                                    type="text"
                                    name="keterangan"
                                    value={formData.keterangan}
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
    );
}