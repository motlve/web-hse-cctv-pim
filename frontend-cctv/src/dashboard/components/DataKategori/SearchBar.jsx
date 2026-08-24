export default function SearchBar({ searchTerm, setSearchTerm, onAdd }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <input
        type="text"
        placeholder="Cari nama kategori..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="px-4 py-2 border rounded-md focus:outline-none focus:ring"
      />
      <button
        onClick={onAdd}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
      >
        Tambah Kategori
      </button>
    </div>
  );
}
