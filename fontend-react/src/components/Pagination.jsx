export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page, last_page, from, to, total } = meta;

  const pages = [];
  for (let i = Math.max(1, current_page - 2); i <= Math.min(last_page, current_page + 2); i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-sm">
      <span className="text-slate-500 dark:text-slate-400 font-medium">
        Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{from}</span>–<span className="font-semibold text-slate-800 dark:text-slate-200">{to}</span> of{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> records
      </span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={current_page === 1}
          onClick={() => onPageChange(current_page - 1)}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium shadow-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150"
        >
          Previous
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center ${
              p === current_page
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/20'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={current_page === last_page}
          onClick={() => onPageChange(current_page + 1)}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium shadow-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150"
        >
          Next
        </button>
      </div>
    </div>
  );
}
