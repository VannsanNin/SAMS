import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, footer, wide, icon: Icon }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {Icon && <Icon size={20} className="text-blue-600" />}
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition" aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}
