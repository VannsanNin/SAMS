export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page, last_page, from, to, total } = meta;

  const pages = [];
  for (let i = Math.max(1, current_page - 2); i <= Math.min(last_page, current_page + 2); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-6 text-sm">
      <span className="text-gray-500">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex gap-1">
        <button
          disabled={current_page === 1}
          onClick={() => onPageChange(current_page - 1)}
          className="px-3 py-1.5 rounded border disabled:opacity-40 hover:bg-gray-100"
        >
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded border ${
              p === current_page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={current_page === last_page}
          onClick={() => onPageChange(current_page + 1)}
          className="px-3 py-1.5 rounded border disabled:opacity-40 hover:bg-gray-100"
        >
          Next
        </button>
      </div>
    </div>
  );
}
