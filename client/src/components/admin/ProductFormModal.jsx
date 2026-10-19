


import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../auth/AuthInput";
import ImageUploader from "./ImageUploader";

const emptyForm = {
  name: "", description: "", category: "", brand: "", price: "", discountPrice: "",
  sku: "", stock: "", sizes: "", colors: "", images: [], isFeatured: false, status: "active",
};

export default function ProductFormModal({ open, onClose, onSaved, editingProduct, categories }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        description: editingProduct.description,
        category: editingProduct.category?._id || "",
        brand: editingProduct.brand || "",
        price: editingProduct.price,
        discountPrice: editingProduct.discountPrice || "",
        sku: editingProduct.sku || "",
        stock: editingProduct.stock,
        sizes: (editingProduct.sizes || []).join(", "),
        colors: (editingProduct.colors || []).join(", "),
        images: editingProduct.images || [],
        isFeatured: editingProduct.isFeatured,
        status: editingProduct.status,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingProduct, open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
        if (uploading) {
      toast.error("Please wait until the image upload finishes");
      return;
    }
    if (!form.name.trim() || !form.description.trim() || !form.category || !form.price) {
      toast.error("Name, description, category and price are required");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      brand: form.brand,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
      sku: form.sku || undefined,
      stock: Number(form.stock) || 0,
      sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
      colors: form.colors ? form.colors.split(",").map((s) => s.trim()).filter(Boolean) : [],
      images: form.images,
      isFeatured: form.isFeatured,
      status: form.status,
    };

    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
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
        noValidate
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">
            {editingProduct ? "Edit Product" : "Add Product"}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <AuthInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <AuthInput label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <AuthInput label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <AuthInput label="Discount Price (optional)" type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
            <AuthInput label="SKU (optional)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <AuthInput label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <AuthInput label="Sizes (comma separated)" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L" />
            <AuthInput label="Colors (comma separated)" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Black, White" />
          </div>

         
                    <ImageUploader
            images={form.images}
            onChange={(images) => setForm({ ...form, images })}
            onUploadingChange={setUploading}
            maxFiles={6}
          />

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded accent-primary"
              />
              Featured Product
            </label>

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-lg px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface">
            Cancel
          </button>
          <button type="submit" disabled={submitting || uploading} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
            {submitting ? "Saving..." : uploading ? "Uploading image..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}