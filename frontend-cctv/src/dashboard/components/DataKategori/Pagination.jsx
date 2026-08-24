export default function Pagination({ pageCount, currentPage, setCurrentPage }) {
  return (
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
  );
}
