export default function TableKategori({ data, currentPage, itemsPerPage, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-lg shadow mb-4">
      <table className="min-w-full bg-white border border-gray-200 text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase">
          <tr>
            <th className="px-4 py-3 border">No</th>
            <th className="px-4 py-3 border">Nama Kategori</th>
            <th className="px-4 py-3 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map((kategori, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{(currentPage - 1) * itemsPerPage + index + 1}</td>
              <td className="px-4 py-2 border">{kategori.namaKategori}</td>
              <td className="px-4 py-2 border space-x-2">
                <button
                  onClick={() => onEdit((currentPage - 1) * itemsPerPage + index)}
                  className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete((currentPage - 1) * itemsPerPage + index)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center p-4 text-gray-500">
                Data kategori tidak ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
