export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page, last_page, from, to, total } = meta;

  const pages = [];
  for (let i = Math.max(1, current_page - 2); i <= Math.min(last_page, current_page + 2); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-6 text-sm">
      <span className="text-ledger-slate">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex gap-1">
        <button
          disabled={current_page === 1}
          onClick={() => onPageChange(current_page - 1)}
          className="px-3 py-1.5 rounded-sm border border-hairline disabled:opacity-40 hover:bg-paper"
        >
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded-sm border ${
              p === current_page
                ? 'bg-ink text-white border-ink'
                : 'border-hairline hover:bg-paper'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={current_page === last_page}
          onClick={() => onPageChange(current_page + 1)}
          className="px-3 py-1.5 rounded-sm border border-hairline disabled:opacity-40 hover:bg-paper"
        >
          Next
        </button>
      </div>
    </div>
  );
}
