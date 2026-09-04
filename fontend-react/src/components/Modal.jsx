import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, footer, wide, icon: Icon }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-white border border-slate-200/80 rounded-2xl shadow-2xl w-full ${
          wide ? 'max-w-4xl' : 'max-w-2xl'
        } max-h-[90vh] flex flex-col overflow-hidden transition-all duration-200 transform scale-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-display font-bold flex items-center gap-2.5 text-slate-900">
            {Icon && (
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Icon size={20} />
              </div>
            )}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto custom-scrollbar flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
