import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, footer, wide, icon: Icon }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`bg-white border border-hairline rounded-sm shadow-xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <h2 className="text-lg font-display font-bold flex items-center gap-2 text-ink">
            {Icon && <Icon size={20} className="text-ochre" />}
            {title}
          </h2>
          <button onClick={onClose} className="text-ledger-slate hover:text-ink transition" aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-hairline bg-paper rounded-b-sm">{footer}</div>}
      </div>
    </div>
  );
}
