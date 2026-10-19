import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../../components/auth/AuthInput";

export default function AdminShipping() {
  const [rates, setRates] = useState({ standard: "", express: "", freeShippingThreshold: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings").then(({ data }) => {
      setRates(data.shippingRates || { standard: 200, express: 450, freeShippingThreshold: 3000 });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", {
        shippingRates: {
          standard: Number(rates.standard),
          express: Number(rates.express),
          freeShippingThreshold: Number(rates.freeShippingThreshold),
        },
      });
      toast.success("Shipping settings saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Shipping Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Flat-rate shipping applies store-wide. City/zone-based rates are not set up yet.
      </p>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 sm:grid-cols-3">
          <AuthInput
            label="Standard Delivery Rate (Rs)"
            type="number"
            value={rates.standard}
            onChange={(e) => setRates({ ...rates, standard: e.target.value })}
          />
          <AuthInput
            label="Express Delivery Rate (Rs)"
            type="number"
            value={rates.express}
            onChange={(e) => setRates({ ...rates, express: e.target.value })}
          />
          <AuthInput
            label="Free Shipping Above (Rs)"
            type="number"
            value={rates.freeShippingThreshold}
            onChange={(e) => setRates({ ...rates, freeShippingThreshold: e.target.value })}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}