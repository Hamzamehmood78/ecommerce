import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../../components/auth/AuthInput";
import EmailTemplateEditor from "../../components/admin/EmailTemplateEditor";
import { useCurrency } from "../../context/CurrencyContext";
import { CURRENCIES, formatMoney, roundMoney } from "../../utils/currency";

export default function AdminStoreSettings() {
  const { code: storeCurrency, applyCurrency } = useCurrency();

  const [store, setStore] = useState({ name: "", email: "", phone: "", address: "" });
  const [policies, setPolicies] = useState({ shipping: "", returns: "", privacy: "", terms: "" });
  const [tax, setTax] = useState({ enabled: false, rate: "0", label: "Tax" });
  const [currencyCode, setCurrencyCode] = useState(storeCurrency);
  const [confirmCurrency, setConfirmCurrency] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const currencyChanged = currencyCode !== storeCurrency;

  useEffect(() => {
    api.get("/settings").then(({ data }) => {
      setStore(data.store || { name: "", email: "", phone: "", address: "" });
      setPolicies(data.policies || { shipping: "", returns: "", privacy: "", terms: "" });
      setTax({
        enabled: data.tax?.enabled || false,
        rate: String(data.tax?.rate ?? 0),
        label: data.tax?.label || "Tax",
      });
      if (data.currency?.code) setCurrencyCode(data.currency.code);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const rate = Number(tax.rate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error("Tax rate must be a number between 0 and 100");
      return;
    }
    if (currencyChanged && !confirmCurrency) {
      toast.error("Please confirm the currency change first");
      return;
    }

    setSaving(true);
    try {
      await api.put("/settings", {
        store,
        policies,
        tax: { enabled: tax.enabled, rate, label: tax.label },
        ...(currencyChanged && { currency: { code: currencyCode } }),
      });
      toast.success("Settings saved");
      if (currencyChanged) applyCurrency(currencyCode); // poori app naye currency mein dobara banti hai
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted">Loading...</p>;

  const policyFields = [
    { key: "shipping", label: "Shipping Policy" },
    { key: "returns", label: "Return & Refund Policy" },
    { key: "privacy", label: "Privacy Policy" },
    { key: "terms", label: "Terms & Conditions" },
  ];

  const exampleRate = Number(tax.rate) || 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Store Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">
        "Save Changes" saves General, Currency, Tax and Policy settings. Email templates have their own Save button
        below.
      </p>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-ink">General Settings</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AuthInput label="Store Name" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
          <AuthInput label="Contact Email" value={store.email} onChange={(e) => setStore({ ...store, email: e.target.value })} />
          <AuthInput label="Contact Phone" value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} />
          <AuthInput label="Business Address" value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} />
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-ink">Currency</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Store Currency</label>
            <select
              value={currencyCode}
              onChange={(e) => {
                setCurrencyCode(e.target.value);
                setConfirmCurrency(false);
              }}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
            >
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {code} — {info.name} ({info.symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg bg-surface px-4 py-3">
            <p className="text-xs text-muted">Prices will look like</p>
            <p className="mt-1 text-lg font-bold text-ink">{formatMoney(1234.5, currencyCode)}</p>
          </div>
        </div>

        {currencyChanged && (
          <div className="mt-4 rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200">
            <div className="flex items-start gap-2 text-sm text-warning">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <p>
                Changing the currency does <strong>not convert</strong> any amounts. A product priced at 1,500 stays
                1,500, only the symbol changes (and old orders will show the new symbol too). Card payments will be
                charged in {currencyCode} from now on. Do this before you start selling.
              </p>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={confirmCurrency}
                onChange={(e) => setConfirmCurrency(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              I understand, change the currency to {currencyCode}
            </label>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-ink">Tax</h3>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={tax.enabled}
            onChange={(e) => setTax({ ...tax, enabled: e.target.checked })}
            className="h-4 w-4 rounded accent-primary"
          />
          Charge tax on orders
        </label>

        <div className={`mt-4 grid gap-4 sm:grid-cols-2 ${tax.enabled ? "" : "pointer-events-none opacity-50"}`}>
          <AuthInput
            label="Tax Name (e.g. GST, Sales Tax)"
            value={tax.label}
            onChange={(e) => setTax({ ...tax, label: e.target.value })}
            maxLength={20}
          />
          <AuthInput
            label="Tax Rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={tax.rate}
            onChange={(e) => setTax({ ...tax, rate: e.target.value })}
          />
        </div>

        {tax.enabled && (
          <p className="mt-3 text-xs text-muted">
            Example: on an order of {formatMoney(1000)} (after discount), {tax.label || "Tax"} will be{" "}
            {formatMoney(roundMoney((1000 * exampleRate) / 100))}. Tax is added on top of product prices and is not
            charged on shipping.
          </p>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-ink">Policy Pages</h3>
        <p className="mt-1 text-xs text-muted">Leave blank to show the default placeholder text on the storefront.</p>
        <div className="mt-4 space-y-4">
          {policyFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-sm font-medium text-ink">{field.label}</label>
              <textarea
                rows={4}
                value={policies[field.key]}
                onChange={(e) => setPolicies({ ...policies, [field.key]: e.target.value })}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      <EmailTemplateEditor />
    </div>
  );
}