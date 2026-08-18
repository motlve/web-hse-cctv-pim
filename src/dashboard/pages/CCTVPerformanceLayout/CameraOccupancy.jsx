import { useState } from "react";

export default function CameraRecord() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        totalCamera: "",
        cameraIP: "",
        analog: "",
        jumlahTambahan: "",
        keterangan: "",
        search: "",
    });

    const [dataTable, setDataTable] = useState([
        {
            id: 1,
            totalCamera: 10,
            cameraIP: 6,
            analog: 4,
            jumlahTambahan: 2,
            keterangan: "Area lobi",
        },
        {
            id: 2,
            totalCamera: 15,
            cameraIP: 8,
            analog: 7,
            jumlahTambahan: 3,
            keterangan: "Area parkir",
        },
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.totalCamera || !formData.cameraIP || !formData.analog) {
            alert("Mohon isi Total Kamera, IP, dan Analog.");
            return;
        }

        setDataTable((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                totalCamera: Number(formData.totalCamera),
                cameraIP: Number(formData.cameraIP),
                analog: Number(formData.analog),
                jumlahTambahan: Number(formData.jumlahTambahan) || 0,
                keterangan: formData.keterangan,
            },
        ]);

        setFormData({
            totalCamera: "",
            cameraIP: "",
            analog: "",
            jumlahTambahan: "",
            keterangan: "",
            search: "",
        });
        setShowForm(false);
    };

    const totalCameraKeseluruhan = dataTable.reduce(
        (acc, cur) => acc + cur.totalCamera,
        0
    );

    return (
        <div className="p-6 bg-white/30 backdrop-blur-md rounded-xl relative max-w-7xl mx-auto">


            {/* Chart */}
            <div className="mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">
                        CAMERA OCCUPANCY ANALYST
                    </h3>
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-500">
                        Grafik Camera Occupancy
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
                <h1 className="text-2xl font-bold text-gray-800">Camera Occupancy Table</h1>
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
                <table className="min-w-[800px] w-full text-sm text-left text-gray-800">
                    <thead className="text-xs uppercase bg-gray-200/70 text-gray-700">
                        <tr>
                            <th className="px-6 py-3">No</th>
                            <th className="px-6 py-3">Total Kamera</th>
                            <th className="px-6 py-3">IP</th>
                            <th className="px-6 py-3">Analog</th>
                            <th className="px-6 py-3">Jumlah Kamera Tambahan</th>
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
                                    <td className="px-6 py-3">{item.totalCamera}</td>
                                    <td className="px-6 py-3">{item.cameraIP}</td>
                                    <td className="px-6 py-3">{item.analog}</td>
                                    <td className="px-6 py-3">{item.jumlahTambahan}</td>
                                    <td className="px-6 py-3">{item.keterangan}</td>
                                </tr>
                            ))}
                    </tbody>
                    {/* Footer row khusus untuk total keseluruhan */}
                    <tfoot>
                        <tr className="bg-gray-100 font-semibold text-gray-700">
                            <td className="px-6 py-2">-</td>
                            <td className="px-6 py-2">
                                <div>
                                    Total Keseluruhan Kamera:
                                    <br />
                                    <span className="text-xl font-bold">{totalCameraKeseluruhan}</span>
                                </div>
                            </td>
                            <td colSpan={4}></td>
                        </tr>
                    </tfoot>
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
                                <label className="text-sm font-medium text-gray-700">
                                    Total Kamera
                                </label>
                                <input
                                    type="number"
                                    name="totalCamera"
                                    value={formData.totalCamera}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 border rounded-md"
                                    min={0}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">IP</label>
                                <input
                                    type="number"
                                    name="cameraIP"
                                    value={formData.cameraIP}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 border rounded-md"
                                    min={0}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Analog</label>
                                <input
                                    type="number"
                                    name="analog"
                                    value={formData.analog}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 border rounded-md"
                                    min={0}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Jumlah Kamera Tambahan
                                </label>
                                <input
                                    type="number"
                                    name="jumlahTambahan"
                                    value={formData.jumlahTambahan}
                                    onChange={handleChange}
                                    className="mt-1 w-full px-3 py-2 border rounded-md"
                                    min={0}
                                />
                            </div>
                            <div className="md:col-span-2">
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
