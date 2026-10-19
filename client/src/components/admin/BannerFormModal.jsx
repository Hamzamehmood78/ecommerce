import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../auth/AuthInput";
import ImageUploader from "./ImageUploader";

const emptyForm = { images: [], heading: "", subtext: "", buttonText: "Shop Now", link: "/shop" };

export default function BannerFormModal({ open, onClose, onSaved, editingBanner }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingBanner) {
      setForm({
        images: editingBanner.image ? [editingBanner.image] : [],
        heading: editingBanner.heading,
        subtext: editingBanner.subtext || "",
        buttonText: editingBanner.buttonText || "Shop Now",
        link: editingBanner.link || "/shop",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingBanner, open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.images[0] || !form.heading.trim()) {
      toast.error("Image and heading are required");
      return;
    }

    const payload = {
      image: form.images[0],
      heading: form.heading,
      subtext: form.subtext,
      buttonText: form.buttonText,
      link: form.link,
    };

    setSubmitting(true);
    try {
      if (editingBanner) {
        await api.put(`/banners/${editingBanner._id}`, payload);
        toast.success("Banner updated");
      } else {
        await api.post("/banners", payload);
        toast.success("Banner created");
      }
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">{editingBanner ? "Edit Banner" : "Add Banner"}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <ImageUploader images={form.images} onChange={(images) => setForm({ ...form, images: images.slice(-1) })} maxFiles={1} />

          <AuthInput label="Heading" value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} />
          <AuthInput label="Subtext (optional)" value={form.subtext} onChange={(e) => setForm({ ...form, subtext: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <AuthInput label="Button Text" value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} />
            <AuthInput label="Link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/shop" />
          </div>

          {form.images[0] && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Preview</label>
              <div className="relative h-32 overflow-hidden rounded-xl">
                <img src={form.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative flex h-full flex-col justify-center gap-1 p-4 text-white">
                  <p className="text-sm font-bold">{form.heading || "Heading"}</p>
                  {form.subtext && <p className="text-xs text-white/90">{form.subtext}</p>}
                  <span className="mt-1 w-fit rounded bg-accent px-2 py-1 text-xs font-semibold">
                    {form.buttonText || "Shop Now"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}