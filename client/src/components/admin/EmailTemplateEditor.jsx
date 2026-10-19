import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import api, { getErrorMessage } from "../../api/axios";
import { formatMoney } from "../../utils/currency";
const LIMITS = { subject: 150, heading: 100, message: 2000 };

// Preview ke liye farzi order
const SAMPLE = {
  customerName: "Ali Khan",
  orderId: "#2D76A9F3",
    get total() {
    return formatMoney(3000);
  },
  trackingNumber: "TCS123456",
  storeName: "ShopEase",
};

const fillSample = (text) =>
  text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(SAMPLE, name) ? SAMPLE[name] : match
  );

export default function EmailTemplateEditor() {
  const [meta, setMeta] = useState(null); // { defaults, labels, placeholders }
  const [saved, setSaved] = useState({});
  const [drafts, setDrafts] = useState({});
  const [active, setActive] = useState("order_placed");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const fieldRefs = useRef({});
  const lastField = useRef("message");

  useEffect(() => {
    api
      .get("/settings/email-templates")
      .then(({ data }) => {
        setMeta({ defaults: data.defaults, labels: data.labels, placeholders: data.placeholders });
        setSaved(data.templates);
        setDrafts(data.templates);
      })
      .catch((err) => setLoadError(getErrorMessage(err)));
  }, []);

  if (loadError) {
    return (
      <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-danger ring-1 ring-red-200">{loadError}</div>
    );
  }
  if (!meta) {
    return <div className="mt-5 h-40 animate-pulse rounded-xl bg-slate-100" />;
  }

  const keys = Object.keys(meta.labels);
  const draft = drafts[active];
  const defaults = meta.defaults[active];
  const isDirty = ["subject", "heading", "message"].some((f) => draft[f] !== saved[active][f]);

  const setField = (field, value) =>
    setDrafts((prev) => ({
      ...prev,
      [active]: { ...prev[active], [field]: value.slice(0, LIMITS[field]) },
    }));

  const insertPlaceholder = (name) => {
    const field = lastField.current;
    const el = fieldRefs.current[field];
    const token = `{{${name}}}`;
    const current = draft[field] || "";
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;

    setField(field, current.slice(0, start) + token + current.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", { emailTemplates: { [active]: draft } });
      setSaved((prev) => ({ ...prev, [active]: draft }));
      toast.success(`"${meta.labels[active]}" template saved`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setDrafts((prev) => ({ ...prev, [active]: { ...defaults } }));

  // Jo {{naam}} hamare pas hai hi nahi, uski khabardari
  const known = meta.placeholders.map((p) => p.key);
  const unknown = [
    ...new Set(
      ["subject", "heading", "message"]
        .flatMap((f) => [...(draft[f] || "").matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]))
        .filter((name) => !known.includes(name))
    ),
  ];

  // Khali chhoda gaya hissa default ban jata hai (jaise asal email mein hota hai)
  const effective = (field) => (draft[field] || "").trim() || defaults[field];
  const showTracking = active !== "order_placed";

  const inputClass =
    "w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary";

  return (
    <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="font-semibold text-ink">Email Templates</h3>
      <p className="mt-1 text-xs text-muted">
        Customize the wording of the emails customers receive. Plain text only. A line break in the message
        becomes a new line in the email.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              active === key ? "bg-primary text-white" : "bg-surface text-muted ring-1 ring-slate-200 hover:text-ink"
            }`}
          >
            {meta.labels[key]}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Subject</label>
            <input
              ref={(el) => (fieldRefs.current.subject = el)}
              onFocus={() => (lastField.current = "subject")}
              value={draft.subject}
              onChange={(e) => setField("subject", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Heading</label>
            <input
              ref={(el) => (fieldRefs.current.heading = el)}
              onFocus={() => (lastField.current = "heading")}
              value={draft.heading}
              onChange={(e) => setField("heading", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Message</label>
            <textarea
              ref={(el) => (fieldRefs.current.message = el)}
              onFocus={() => (lastField.current = "message")}
              rows={5}
              value={draft.message}
              onChange={(e) => setField("message", e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-right text-xs text-muted">
              {draft.message.length} / {LIMITS.message}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted">Click to insert at the cursor:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {meta.placeholders.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  title={p.description}
                  onClick={() => insertPlaceholder(p.key)}
                  className="rounded-md bg-surface px-2.5 py-1 font-mono text-xs text-primary ring-1 ring-slate-200 hover:bg-primary/5"
                >
                  {`{{${p.key}}}`}
                </button>
              ))}
            </div>
          </div>

          {unknown.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-warning ring-1 ring-amber-200">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                Unknown placeholder{unknown.length > 1 ? "s" : ""}:{" "}
                {unknown.map((u) => `{{${u}}}`).join(", ")}. {unknown.length > 1 ? "They" : "It"} will appear as
                written in the email.
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Template"}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface"
            >
              Reset to default
            </button>
            {isDirty && <span className="self-center text-xs text-warning">Unsaved changes</span>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted">Preview (sample order)</p>
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="mb-3 truncate text-xs text-muted">
              <span className="font-semibold text-ink">Subject:</span> {fillSample(effective("subject"))}
            </p>
            <div className="mx-auto max-w-[500px] rounded-lg bg-white p-6 text-sm text-ink shadow-sm">
              <h4 className="text-xl font-bold text-primary">{fillSample(effective("heading"))}</h4>
              <p className="mt-3 whitespace-pre-line">{fillSample(effective("message"))}</p>
              <p className="mt-3">
                <strong>Order ID:</strong> {SAMPLE.orderId}
              </p>
              <p>
                <strong>Total:</strong> {SAMPLE.total}
              </p>
              {showTracking && (
                <p>
                  <strong>Tracking Number:</strong> {SAMPLE.trackingNumber}
                </p>
              )}
              <p className="mt-3 text-xs text-muted">Thank you for shopping with {SAMPLE.storeName}.</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            {showTracking
              ? "The Tracking Number line appears only when the order has one."
              : "A real email uses the customer's own name, order number and total."}
          </p>
        </div>
      </div>
    </div>
  );
}