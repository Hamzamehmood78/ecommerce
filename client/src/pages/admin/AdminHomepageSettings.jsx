import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";

const sectionLabels = {
  categoryGrid: "Shop by Category",
  dealOfDay: "Deal of the Day",
  newArrivals: "New Arrivals",
  testimonials: "Testimonials",
  newsletter: "Newsletter Signup",
  trustStrip: "Trust Strip (Free Shipping, Secure Payment, etc.)",
};

function ProductPicker({ title, allProducts, selectedIds, onChange }) {
  const [search, setSearch] = useState("");
  const filtered = allProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-muted">Leave empty to show newest/default products automatically.</p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        className="mt-3 w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
      />
      <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
        {filtered.map((p) => (
          <label key={p._id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface">
            <input
              type="checkbox"
              checked={selectedIds.includes(p._id)}
              onChange={() => toggle(p._id)}
              className="h-4 w-4 rounded accent-primary"
            />
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-slate-100">
              {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
            </div>
            <span className="truncate text-ink">{p.name}</span>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-primary">{selectedIds.length} selected</p>
    </div>
  );
}

export default function AdminHomepageSettings() {
  const [settings, setSettings] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [featuredIds, setFeaturedIds] = useState([]);
  const [dealIds, setDealIds] = useState([]);
  const [sections, setSections] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/settings"),
      api.get("/products/admin/all", { params: { limit: 50, status: "active" } }),
    ]).then(([settingsRes, productsRes]) => {
      setSettings(settingsRes.data);
      setFeaturedIds((settingsRes.data.featuredProductIds || []).map((p) => p._id));
      setDealIds((settingsRes.data.dealProductIds || []).map((p) => p._id));
      setSections(settingsRes.data.sections);
      setAllProducts(productsRes.data.products);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", {
        featuredProductIds: featuredIds,
        dealProductIds: dealIds,
        sections,
      });
      toast.success("Homepage settings saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Homepage Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="font-semibold text-ink">Section Visibility</h3>
        <div className="mt-3 space-y-2">
          {Object.entries(sectionLabels).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-surface">
              <span className="text-ink">{label}</span>
              <input
                type="checkbox"
                checked={sections[key] !== false}
                onChange={(e) => setSections({ ...sections, [key]: e.target.checked })}
                className="h-4 w-4 rounded accent-primary"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ProductPicker title="Featured Products" allProducts={allProducts} selectedIds={featuredIds} onChange={setFeaturedIds} />
        <ProductPicker title="Deal of the Day Products" allProducts={allProducts} selectedIds={dealIds} onChange={setDealIds} />
      </div>
    </div>
  );
}