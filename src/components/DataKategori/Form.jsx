export default function FormKategoriModal({ showForm, onClose, isEditing, formData, handleChange, handleSubmit }) {
  if (!showForm) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 w-11/12 max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 z-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            {isEditing ? "Edit Kategori" : "Tambah Kategori"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="namaKategori"
            value={formData.namaKategori}
            onChange={handleChange}
            placeholder="Masukkan Nama Kategori"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
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
  );
}
