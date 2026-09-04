import { useEffect, useState } from "react";
import { CreditCard, Wallet, ReceiptText } from "lucide-react";
import Modal from "../components/Modal";
import { apiFetch } from "../api";
import { COLORS, PageShell, KPI, KpiRow, Panel, Badge, Table, Select, TextInput } from "../components/shared";

const API = "/api";

const STATUS_TONE = { paid: "sage", partial: "amber", unpaid: "coral", overdue: "coral" };

const PAY_METHODS = ["mobile", "bank_transfer", "online", "cash", "check"];

const inputCls = "px-3 py-2 text-[13px] w-full border border-hairline bg-white text-ink focus:outline-none focus:border-ink transition";
const labelCls = "text-[12px] text-slate font-medium block mb-1";

function fmtMoney(v) {
  const n = Number(v || 0);
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleDateString();
}

export default function MyFees() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [payOpen, setPayOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", payment_method: "mobile", payment_date: "", transaction_reference: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const flash = (text, type = "success") => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  const load = () => {
    setLoading(true);
    apiFetch(`${API}/my/fees`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => flash("Failed to load your fees", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const summary = data?.summary || {};
  const invoices = data?.invoices || [];
  const student = data?.student;

  const openPay = (inv) => {
    setPayInvoice(inv);
    setPayForm({
      amount: Number(inv.balance).toFixed(2),
      payment_method: "mobile",
      payment_date: new Date().toISOString().slice(0, 10),
      transaction_reference: "",
      notes: "",
    });
    setPayOpen(true);
  };

  const submitPay = async () => {
    setSaving(true);
    const res = await apiFetch(`${API}/my/fees/pay`, {
      method: "POST",
      body: JSON.stringify({
        invoice_id: payInvoice.id,
        amount: payForm.amount,
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date,
        transaction_reference: payForm.transaction_reference || undefined,
        notes: payForm.notes || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      flash("Payment submitted successfully");
      setPayOpen(false);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      const err = d.errors ? Object.values(d.errors).flat().join("; ") : (d.message || "Payment failed");
      flash(err, "error");
    }
  };

  const allPayments = invoices.flatMap((inv) =>
    (inv.payments || []).map((p) => ({ ...p, invoice: inv }))
  ).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

  return (
    <PageShell title="My Fees" sub={student ? `${student.name} · ${student.class?.name || "—"} · ${student.student_id}` : "Your tuition and payment status"}>
      {msg.text && (
        <div className="mb-4 px-4 py-2 text-[13px] rounded-sm" style={{ background: msg.type === "error" ? `${COLORS.coral}22` : `${COLORS.sage}22`, color: msg.type === "error" ? COLORS.coral : COLORS.sage, border: `1px solid ${msg.type === "error" ? COLORS.coral : COLORS.sage}` }}>
          {msg.text}
        </div>
      )}

      {loading && !data ? (
        <p className="text-[13px]" style={{ color: COLORS.slate }}>Loading...</p>
      ) : (
        <>
          <KpiRow cols={4}>
            <KPI label="Total Fees" value={fmtMoney(summary.total_amount)} tone="ink" />
            <KPI label="Discount" value={fmtMoney(summary.total_discount)} tone="slate" />
            <KPI label="Paid" value={fmtMoney(summary.total_paid)} tone="sage" />
            <KPI label="Balance Due" value={fmtMoney(summary.total_balance)} tone={Number(summary.total_balance) > 0 ? "coral" : "sage"} />
          </KpiRow>

          <Panel title="Your Invoices">
            <Table
              columns={["Invoice", "Type", "Amount", "Paid", "Balance", "Due", "Status", ""]}
              rows={invoices}
              emptyText="No invoices yet"
              renderRow={(inv) => (
                <>
                  <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3 capitalize">{inv.feeStructure?.name || inv.feeStructure?.type || "—"}</td>
                  <td className="px-4 py-3">{fmtMoney(inv.amount)}</td>
                  <td className="px-4 py-3">{fmtMoney(inv.paid_amount)}</td>
                  <td className="px-4 py-3 font-semibold">{fmtMoney(inv.balance)}</td>
                  <td className="px-4 py-3">{fmtDate(inv.due_date)}</td>
                  <td className="px-4 py-3"><Badge text={inv.status} tone={STATUS_TONE[inv.status] || "slate"} /></td>
                  <td className="px-4 py-3">
                    {inv.status !== "paid" && Number(inv.balance) > 0 && (
                      <button className="px-3 py-1.5 text-[12px] text-white rounded-sm flex items-center gap-1" style={{ background: COLORS.ink }} onClick={() => openPay(inv)}>
                        <CreditCard size={13} /> Pay
                      </button>
                    )}
                  </td>
                </>
              )}
            />
          </Panel>

          <div className="mt-6">
            <Panel title="Payment History">
              <Table
                columns={["Invoice", "Date", "Method", "Reference", "Amount"]}
                rows={allPayments}
                emptyText="No payments recorded yet"
                renderRow={(p) => (
                  <>
                    <td className="px-4 py-3">{p.invoice?.invoice_number || "—"}</td>
                    <td className="px-4 py-3">{fmtDate(p.payment_date)}</td>
                    <td className="px-4 py-3 capitalize">{p.payment_method}</td>
                    <td className="px-4 py-3" style={{ color: COLORS.slate }}>{p.transaction_reference || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{fmtMoney(p.amount)}</td>
                  </>
                )}
              />
            </Panel>
          </div>

          <Panel title="How to pay">
            <p className="text-[13px]" style={{ color: COLORS.slate }}>
              Select an invoice with an outstanding balance and record a payment using your preferred method (mobile, bank transfer, online, cash, or cheque). Payments are recorded against your account and will be verified by the finance office.
            </p>
          </Panel>
        </>
      )}

      {payOpen && payInvoice && (
        <Modal title={`Pay — ${payInvoice.invoice_number}`} icon={Wallet} onClose={() => setPayOpen(false)} footer={
          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 text-[13px] border" style={{ borderColor: COLORS.hairline }} onClick={() => setPayOpen(false)}>Cancel</button>
            <button className="px-4 py-2 text-[13px] text-white" style={{ background: COLORS.ink }} onClick={submitPay} disabled={saving}>{saving ? "Submitting..." : "Submit Payment"}</button>
          </div>
        }>
          <div className="mb-4 flex items-center gap-2 text-[13px]" style={{ color: COLORS.slate }}>
            <ReceiptText size={16} />
            <span>Balance due: <b style={{ color: COLORS.ink }}>{fmtMoney(payInvoice.balance)}</b></span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Amount *</label><input className={inputCls} type="number" min="0.01" step="0.01" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
            <div><label className={labelCls}>Date *</label><input className={inputCls} type="date" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} /></div>
            <div><label className={labelCls}>Method *</label>
              <Select value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })} className="w-full">
                {PAY_METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </Select>
            </div>
            <div><label className={labelCls}>Reference</label><input className={inputCls} value={payForm.transaction_reference} onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label className={labelCls}>Notes</label><textarea className={inputCls} rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} /></div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
