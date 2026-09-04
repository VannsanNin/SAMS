import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Trash2, Search, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { apiFetch } from '../api';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const pillCls = { available: 'bg-emerald-50 text-emerald-700', borrowed: 'bg-amber-50 text-amber-700', lost: 'bg-rose-50 text-rose-700', returned: 'bg-emerald-50 text-emerald-700', overdue: 'bg-rose-50 text-rose-700' };

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function BookForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const body = { ...form, total_copies: +form.total_copies || 1, available_copies: +form.available_copies || +form.total_copies || 1 };
      const res = await apiFetch(`${API}/library/books`, { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Save failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title" required><input className={inputCls} value={form.title || ''} onChange={set('title')} required /></Field>
        <Field label="ISBN"><input className={inputCls} value={form.isbn || ''} onChange={set('isbn')} /></Field>
        <Field label="Author"><input className={inputCls} value={form.author || ''} onChange={set('author')} /></Field>
        <Field label="Publisher"><input className={inputCls} value={form.publisher || ''} onChange={set('publisher')} /></Field>
        <Field label="Category"><input className={inputCls} value={form.category || ''} onChange={set('category')} /></Field>
        <Field label="Language">
          <select className={inputCls} value={form.language || 'English'} onChange={set('language')}>
            <option>English</option><option>Khmer</option><option>French</option><option>Chinese</option>
          </select>
        </Field>
        <Field label="Edition"><input className={inputCls} value={form.edition || ''} onChange={set('edition')} /></Field>
        <Field label="Year"><input type="number" className={inputCls} value={form.year || ''} onChange={set('year')} /></Field>
        <Field label="Total Copies" required><input type="number" className={inputCls} value={form.total_copies || 1} onChange={set('total_copies')} min="1" /></Field>
        <Field label="Shelf Location"><input className={inputCls} value={form.shelf_location || ''} onChange={set('shelf_location')} /></Field>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function Library() {
  const [tab, setTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadBooks = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    const res = await apiFetch(`${API}/library/books?${p}`);
    if (res.ok) { const d = await res.json(); setBooks(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search]);

  const loadBorrowings = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    const res = await apiFetch(`${API}/library/borrowings?${p}`);
    if (res.ok) { const d = await res.json(); setBorrowings(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search]);

  useEffect(() => { tab === 'books' ? loadBooks() : loadBorrowings(); }, [tab, loadBooks, loadBorrowings]);

  const handleSaved = () => { setFormOpen(false); setMsg({ type: 'success', text: 'Book saved' }); loadBooks(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await apiFetch(`${API}/library/books/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) { setDeleting(null); setMsg({ type: 'success', text: 'Deleted' }); loadBooks(); setTimeout(() => setMsg(null), 3000); }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Library</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Manage books and borrowings</p></div>
        <div className="flex gap-2">
          <button onClick={() => { setTab('books'); setPage(1); setSearch(''); }} className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${tab === 'books' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>Books</button>
          <button onClick={() => { setTab('borrowings'); setPage(1); setSearch(''); }} className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${tab === 'borrowings' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>Borrowings</button>
        </div>
      </div>
      {msg && <div className={`text-xs p-3 rounded-xl border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder={`Search ${tab}...`} value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {tab === 'books' && (
        <>
          <button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> Add Book</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight flex-1 pr-2">{b.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pillCls[Number(b.available_copies) > 0 ? 'available' : 'borrowed']}`}>{Number(b.available_copies) > 0 ? 'Available' : 'Unavailable'}</span>
                </div>
                {b.author && <p className="text-[10px] text-slate-500 mb-2">by {b.author}</p>}
                <div className="flex gap-2 text-[10px] text-slate-500 mb-3 flex-wrap">
                  {b.isbn && <span>ISBN: {b.isbn}</span>}
                  {b.category && <span className="bg-slate-100 px-2 py-0.5 rounded-full">{b.category}</span>}
                  {b.year && <span>{b.year}</span>}
                </div>
                <div className="text-xs text-slate-600 mb-3">Copies: <strong>{b.available_copies}/{b.total_copies}</strong></div>
                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button onClick={() => setFormOpen(true)} className="flex-1 text-center p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition">Edit</button>
                  <button onClick={() => setDeleting(b)} className="flex-1 text-center p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'borrowings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-slate-900 text-slate-200 grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div>Book</div><div>Student</div><div>Borrowed</div><div>Due</div><div>Status</div><div className="text-right">Actions</div></div>
          <div className="divide-y divide-slate-100 text-slate-700">
            {borrowings.map(b => (
              <div key={b.id} className="grid grid-cols-6 gap-4 px-4 py-3.5 text-xs hover:bg-slate-50/80 transition items-center">
                <div className="font-semibold">{b.book?.title || '—'}</div>
                <div>{b.student?.name || '—'}</div>
                <div>{b.borrow_date}</div>
                <div className={b.status === 'overdue' ? 'text-rose-600 font-semibold' : ''}>{b.due_date}</div>
                <div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${pillCls[b.status] || ''}`}>{b.status}</span></div>
                <div className="flex justify-end">
                  {b.status !== 'returned' && <button onClick={() => setReturnOpen(b)} className="text-emerald-600 hover:text-emerald-700 text-[10px] font-semibold flex items-center gap-1"><ArrowUpFromLine size={12} /> Return</button>}
                </div>
              </div>
            ))}
            {borrowings.length === 0 && <div className="px-4 py-12 text-center text-slate-400 text-sm">No borrowings found</div>}
          </div>
        </div>
      )}

      {formOpen && <Modal title="Add Book" onClose={() => setFormOpen(false)} icon={BookOpen}><BookForm initial={{}} onSave={handleSaved} onClose={() => setFormOpen(false)} /></Modal>}
      {borrowOpen && <Modal title="Borrow Book" onClose={() => setBorrowOpen(false)} icon={ArrowDownToLine}>
        <BorrowForm books={books} onClose={() => setBorrowOpen(false)} onDone={() => { setBorrowOpen(false); setMsg({ type: 'success', text: 'Book borrowed' }); loadBorrowings(); setTimeout(() => setMsg(null), 3000); }} />
      </Modal>}
      {returnOpen && <Modal title="Return Book" onClose={() => setReturnOpen(null)} icon={ArrowUpFromLine}>
        <p className="text-sm text-slate-600">Return <strong>{returnOpen.book?.title}</strong> from <strong>{returnOpen.student?.name}</strong>?</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setReturnOpen(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button>
          <button onClick={async () => { await apiFetch(`${API}/library/borrowings/${returnOpen.id}/return`, { method: 'PUT' }); setReturnOpen(null); setMsg({ type: 'success', text: 'Returned' }); loadBorrowings(); setTimeout(() => setMsg(null), 3000); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Confirm Return</button>
        </div>
      </Modal>}
      {deleting && <Modal title="Delete Book" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete <strong>{deleting.title}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}

function BorrowForm({ books, onClose, onDone }) {
  const [form, setForm] = useState({ book_id: '', student_id: '', borrow_date: new Date().toISOString().slice(0, 10), due_date: '', notes: '' });
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { apiFetch(`${API}/students`).then(r => r.ok && r.json()).then(d => setStudents(d?.data || d || [])); }, []);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await apiFetch(`${API}/library/borrowings`, { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onDone();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">Book *</span>
        <select className={inputCls} value={form.book_id} onChange={set('book_id')} required><option value="">Select book...</option>{books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select>
      </label>
      <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">Student *</span>
        <select className={inputCls} value={form.student_id} onChange={set('student_id')} required><option value="">Select student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">Borrow Date *</span><input type="date" className={inputCls} value={form.borrow_date} onChange={set('borrow_date')} required /></label>
        <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">Due Date *</span><input type="date" className={inputCls} value={form.due_date} onChange={set('due_date')} required /></label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Borrow'}</button>
      </div>
    </form>
  );
}
