import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../../components/auth/AuthInput";
import { formatMoney } from "../../utils/currency";

export default function AdminPayments() {
  const [gateways, setGateways] = useState({ stripeKey: "", paypalClientId: "", razorpayKeyId: "" });
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTransactions = () => {
    api.get("/admin/payments/transactions", { params: filter ? { status: filter } : {} })
      .then(({ data }) => setTransactions(data))
      .catch((err) => toast.error(getErrorMessage(err)));
  };

  useEffect(() => {
    api.get("/settings/admin").then(({ data }) => {
      setGateways(data.paymentGateways || { stripeKey: "", paypalClientId: "", razorpayKeyId: "" });
      setLoading(false);
    });
  }, []);

  useEffect(loadTransactions, [filter]);

  const handleSaveGateways = async () => {
    setSaving(true);
    try {
      await api.put("/settings", { paymentGateways: gateways });
      toast.success("Gateway settings saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async (id) => {
    try {
      await api.put(`/admin/payments/${id}/refund`);
      toast.success("Marked as refunded");
      loadTransactions();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const statusLabel = (order) => {
    if (order.isRefunded) return { text: "Refunded", cls: "bg-red-50 text-danger" };
    if (order.isPaid) return { text: "Paid", cls: "bg-green-50 text-success" };
    return { text: "Pending (COD)", cls: "bg-amber-50 text-warning" };
  };

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Payments</h1>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-ink">Gateway Settings</h3>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-warning ring-1 ring-amber-200">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          No payment gateway is connected yet. Keys are saved for future use — only Cash on Delivery
          works at checkout right now.
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <AuthInput label="Stripe Secret Key" value={gateways.stripeKey} onChange={(e) => setGateways({ ...gateways, stripeKey: e.target.value })} />
          <AuthInput label="PayPal Client ID" value={gateways.paypalClientId} onChange={(e) => setGateways({ ...gateways, paypalClientId: e.target.value })} />
          <AuthInput label="Razorpay Key ID" value={gateways.razorpayKeyId} onChange={(e) => setGateways({ ...gateways, razorpayKeyId: e.target.value })} />
        </div>
        <button
          onClick={handleSaveGateways}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Keys"}
        </button>
      </div>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink">Transactions</h3>
          <div className="flex gap-2">
            {[{ v: "", l: "All" }, { v: "paid", l: "Paid" }, { v: "pending", l: "Pending" }, { v: "refunded", l: "Refunded" }].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setFilter(opt.v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filter === opt.v ? "bg-primary text-white" : "bg-surface text-muted"}`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th className="py-2">Order ID</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Method</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-muted">No transactions found.</td></tr>
              ) : (
                transactions.map((o) => {
                  const status = statusLabel(o);
                  return (
                    <tr key={o._id} className="border-t border-slate-100">
                      <td className="py-2 font-mono text-xs text-ink">#{o._id.slice(-8).toUpperCase()}</td>
                      <td className="py-2 text-ink">{o.user?.name || "—"}</td>
                      <td className="py-2 uppercase text-muted">{o.paymentMethod}</td>
                      <td className="py-2 text-ink">{formatMoney(o.totalPrice)}</td>
                      <td className="py-2">
                        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${status.cls}`}>{status.text}</span>
                      </td>
                      <td className="py-2 text-right">
                        {o.isPaid && !o.isRefunded && (
                          <button onClick={() => handleRefund(o._id)} className="text-xs font-medium text-danger hover:underline">
                            Mark Refunded
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}