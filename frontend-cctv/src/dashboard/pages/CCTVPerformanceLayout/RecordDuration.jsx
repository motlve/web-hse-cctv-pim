import { useState } from "react";

export default function RecordingDuration() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        nomorDVRNVR: "",
        jenisKamera: "",
        durasiRekamanHari: "",
        keterangan: "",
        kapasitasTB: "",
        search: "",
    });

    const [dataTable, setDataTable] = useState([
        {
            id: 1,
            nomorDVRNVR: "DVR-001",
            jenisKamera: "IP Camera",
            durasiRekamanHari: 30,
            keterangan: "Rekaman lancar",
            kapasitasTB: 4,
        },
        {
            id: 2,
            nomorDVRNVR: "NVR-002",
            jenisKamera: "Analog Camera",
            durasiRekamanHari: 15,
            keterangan: "Perlu upgrade kapasitas",
            kapasitasTB: 2,
        },
        {
            id: 3,
            nomorDVRNVR: "DVR-003",
            jenisKamera: "IP Camera",
            durasiRekamanHari: 45,
            keterangan: "Kapasitas cukup besar",
            kapasitasTB: 8,
        },
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validasi sederhana
        if (
            !formData.nomorDVRNVR ||
            !formData.jenisKamera ||
            !formData.durasiRekamanHari ||
            !formData.kapasitasTB
        ) {
            alert("Mohon isi semua field yang wajib.");
            return;
        }

        setDataTable((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                nomorDVRNVR: formData.nomorDVRNVR,
                jenisKamera: formData.jenisKamera,
                durasiRekamanHari: Number(formData.durasiRekamanHari),
                keterangan: formData.keterangan,
                kapasitasTB: Number(formData.kapasitasTB),
            },
        ]);

        setFormData({
            nomorDVRNVR: "",
            jenisKamera: "",
            durasiRekamanHari: "",
            keterangan: "",
            kapasitasTB: "",
            search: "",
        });

        setShowForm(false);
    };

    const totalKapasitas = dataTable.reduce(
        (acc, cur) => acc + cur.kapasitasTB,
        0
    );

    return (
        <div className="p-6 bg-white/30 backdrop-blur-md rounded-xl relative max-w-7xl mx-auto">


            {/* Chart placeholder */}
            <div className="mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">
                        RECORDING DURATION ANALYST
                    </h3>
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-500">
                        Grafik Durasi Rekaman
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
                <h1 className="text-2xl font-bold text-gray-800">Durasi Rekaman Table</h1>
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
                            <th className="px-6 py-3">Nomor DVR/NVR</th>
                            <th className="px-6 py-3">Jenis Kamera</th>
                            <th className="px-6 py-3">Durasi Rekaman (Hari)</th>
                            <th className="px-6 py-3">Keterangan</th>
                            <th className="px-6 py-3">Kapasitas DVR/NVR (TB)</th>
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
                                    <td className="px-6 py-3">{item.nomorDVRNVR}</td>
                                    <td className="px-6 py-3">{item.jenisKamera}</td>
                                    <td className="px-6 py-3">{item.durasiRekamanHari}</td>
                                    <td className="px-6 py-3">{item.keterangan}</td>
                                    <td className="px-6 py-3">{item.kapasitasTB}</td>
                                </tr>
                            ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100 font-semibold text-gray-700">
                            <td className="px-6 py-2">-</td>
                            <td colSpan={4} className="px-6 py-2 text-right">
                                Total Kapasitas DVR/NVR:
                            </td>
                            <td className="px-6 py-2">{totalKapasitas} TB</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {showForm && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"></div>
                    <div className="fixed inset-0 flex items-center justify-center z-60 p-6">
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-xl shadow-lg p-6 max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in overflow-auto max-h-[90vh]"
                        >
                            <div className="md:col-span-3 text-2xl font-bold text-gray-800 mb-2">
                                FORM DURASI REKAMAN
                            </div>

                            {[
                                { label: "Nomor DVR/NVR", name: "nomorDVRNVR", type: "text", required: true },
                                { label: "Jenis Kamera", name: "jenisKamera", type: "text", required: true },
                                { label: "Durasi Rekaman (Hari)", name: "durasiRekamanHari", type: "number", required: true, min: 0 },
                                { label: "Keterangan", name: "keterangan", type: "text" },
                                { label: "Kapasitas DVR/NVR (TB)", name: "kapasitasTB", type: "number", required: true, step: "0.1", min: 0 },
                            ].map(({ label, name, ...props }) => (
                                <div key={name} className="relative">
                                    <input
                                        id={name}
                                        name={name}
                                        value={formData[name]}
                                        onChange={handleChange}
                                        className={`peer w-full border-b-2 border-gray-300 py-2 px-1 focus:outline-none focus:border-green-500 bg-transparent placeholder-transparent`}
                                        placeholder={label}
                                        {...props}
                                    />
                                    <label
                                        htmlFor={name}
                                        className="absolute left-1 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-[-0.6rem] peer-focus:text-sm peer-focus:text-green-600 bg-white px-1"
                                    >
                                        {label}
                                    </label>
                                </div>
                            ))}

                            <div className="md:col-span-3 flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-2 bg-gray-400 rounded-md hover:bg-gray-500 text-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-500 rounded-md hover:bg-green-600 text-white transition"
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
