// import { useEffect, useState } from "react";
// import { X } from "lucide-react";
// import toast from "react-hot-toast";
// import api, { getErrorMessage } from "../../api/axios";
// import AuthInput from "../auth/AuthInput";

// const emptyForm = { name: "", image: "", description: "", parent: "" };

// export default function CategoryFormModal({ open, onClose, onSaved, editingCategory, categories }) {
//   const [form, setForm] = useState(emptyForm);
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     if (editingCategory) {
//       setForm({
//         name: editingCategory.name,
//         image: editingCategory.image || "",
//         description: editingCategory.description || "",
//         parent: editingCategory.parent?._id || "",
//       });
//     } else {
//       setForm(emptyForm);
//     }
//   }, [editingCategory, open]);

//   if (!open) return null;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.name.trim()) {
//       toast.error("Category name is required");
//       return;
//     }
//     setSubmitting(true);
//     try {
//       if (editingCategory) {
//         await api.put(`/categories/${editingCategory._id}`, form);
//         toast.success("Category updated");
//       } else {
//         await api.post("/categories", form);
//         toast.success("Category created");
//       }
//       onSaved();
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/50" onClick={onClose} />

//       <form
//         onSubmit={handleSubmit}
//         className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
//       >
//         <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
//           <h3 className="text-lg font-semibold text-ink">
//             {editingCategory ? "Edit Category" : "Add Category"}
//           </h3>
//           <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
//             <X size={20} />
//           </button>
//         </div>

//         <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
//           <AuthInput
//             label="Name"
//             value={form.name}
//             onChange={(e) => setForm({ ...form, name: e.target.value })}
//           />
//           <AuthInput
//             label="Image URL"
//             value={form.image}
//             onChange={(e) => setForm({ ...form, image: e.target.value })}
//             placeholder="https://..."
//           />
//           <div>
//             <label className="mb-1.5 block text-sm font-medium text-ink">Parent Category (optional)</label>
//             <select
//               value={form.parent}
//               onChange={(e) => setForm({ ...form, parent: e.target.value })}
//               className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
//             >
//               <option value="">None (top-level)</option>
//               {categories
//                 .filter((c) => c._id !== editingCategory?._id)
//                 .map((c) => (
//                   <option key={c._id} value={c._id}>{c.name}</option>
//                 ))}
//             </select>
//           </div>
//           <AuthInput
//             label="Description (optional)"
//             value={form.description}
//             onChange={(e) => setForm({ ...form, description: e.target.value })}
//           />
//         </div>

//         <div className="flex flex-shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4">
//           <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-slate-200 hover:bg-surface">
//             Cancel
//           </button>
//           <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
//             {submitting ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import AuthInput from "../auth/AuthInput";
import ImageUploader from "./ImageUploader";

const emptyForm = { name: "", images: [], description: "", parent: "" };

export default function CategoryFormModal({ open, onClose, onSaved, editingCategory, categories }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setForm({
        name: editingCategory.name,
        images: editingCategory.image ? [editingCategory.image] : [],
        description: editingCategory.description || "",
        parent: editingCategory.parent?._id || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingCategory, open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        parent: form.parent,
        image: form.images[0] || "",
      };
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, payload);
        toast.success("Category updated");
      } else {
        await api.post("/categories", payload);
        toast.success("Category created");
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
        className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">
            {editingCategory ? "Edit Category" : "Add Category"}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <AuthInput
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <ImageUploader
            images={form.images}
            onChange={(images) => setForm({ ...form, images: images.slice(-1) })}
            maxFiles={1}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Parent Category (optional)</label>
            <select
              value={form.parent}
              onChange={(e) => setForm({ ...form, parent: e.target.value })}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary"
            >
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => c._id !== editingCategory?._id)
                .map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
            </select>
          </div>
          <AuthInput
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
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