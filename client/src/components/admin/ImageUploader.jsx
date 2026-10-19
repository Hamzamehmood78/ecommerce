// import { useRef, useState } from "react";
// import { X, Upload, Loader2 } from "lucide-react";
// import toast from "react-hot-toast";
// import api, { getErrorMessage } from "../../api/axios";

// export default function ImageUploader({ images, onChange, maxFiles = 6 }) {
//   const inputRef = useRef(null);
//   const [uploading, setUploading] = useState(false);

//   const handleFiles = async (fileList) => {
//     const files = Array.from(fileList);
//     if (images.length + files.length > maxFiles) {
//       toast.error(`You can upload up to ${maxFiles} image(s)`);
//       return;
//     }

//     const formData = new FormData();
//     files.forEach((file) => formData.append("images", file));

//     setUploading(true);
//     try {
//       const { data } = await api.post("/upload", formData);
//       onChange([...images, ...data.urls]);
//       toast.success("Image(s) uploaded");
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setUploading(false);
//       if (inputRef.current) inputRef.current.value = "";
//     }
//   };

//   const removeImage = (url) => {
//     onChange(images.filter((img) => img !== url));
//   };

//   return (
//     <div>
//       <label className="mb-1.5 block text-sm font-medium text-ink">Images</label>
//       <div className="flex flex-wrap gap-3">
//         {images.map((url) => (
//           <div
//             key={url}
//             className="group relative h-20 w-20 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
//           >
//             <img src={url} alt="" className="h-full w-full object-cover" />
//             <button
//               type="button"
//               onClick={() => removeImage(url)}
//               className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
//             >
//               <X size={12} />
//             </button>
//           </div>
//         ))}

//         {images.length < maxFiles && (
//           <button
//             type="button"
//             onClick={() => inputRef.current?.click()}
//             disabled={uploading}
//             className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-muted transition hover:border-primary hover:text-primary disabled:opacity-60"
//           >
//             {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
//             <span className="text-[10px]">{uploading ? "..." : "Upload"}</span>
//           </button>
//         )}
//       </div>

//       <input
//         ref={inputRef}
//         type="file"
//         accept="image/*"
//         multiple={maxFiles > 1}
//         onChange={(e) => e.target.files.length && handleFiles(e.target.files)}
//         className="hidden"
//       />
//     </div>
//   );
// }

// import { useRef, useState } from "react";
// import { X, Upload, Loader2 } from "lucide-react";
// import toast from "react-hot-toast";
// import api, { getErrorMessage } from "../../api/axios";

// // onUploadingChange (optional): upload shuru/khatam hone ki khabar parent ko deta hai,
// // taake upload ke dauran Save ka button band rakha ja sake
// export default function ImageUploader({ images, onChange, maxFiles = 6, onUploadingChange }) {
//   const inputRef = useRef(null);
//   const [uploading, setUploading] = useState(false);

//   const setBusy = (value) => {
//     setUploading(value);
//     onUploadingChange?.(value);
//   };

//   const handleFiles = async (fileList) => {
//     const files = Array.from(fileList);
//     if (images.length + files.length > maxFiles) {
//       toast.error(`You can upload up to ${maxFiles} image(s)`);
//       if (inputRef.current) inputRef.current.value = "";
//       return;
//     }

//     const formData = new FormData();
//     files.forEach((file) => formData.append("images", file));

//     setBusy(true);
//     try {
//       const { data } = await api.post("/upload", formData);
//       onChange([...images, ...data.urls]);
//       toast.success("Image(s) uploaded");
//     } catch (err) {
//       toast.error(getErrorMessage(err));
//     } finally {
//       setBusy(false);
//       if (inputRef.current) inputRef.current.value = "";
//     }
//   };

//   const removeImage = (url) => {
//     onChange(images.filter((img) => img !== url));
//   };

//   return (
//     <div>
//       <label className="mb-1.5 block text-sm font-medium text-ink">Images</label>
//       <div className="flex flex-wrap gap-3">
//         {images.map((url) => (
//           <div
//             key={url}
//             className="group relative h-20 w-20 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
//           >
//             <img src={url} alt="" className="h-full w-full object-cover" />
//             <button
//               type="button"
//               onClick={() => removeImage(url)}
//               aria-label="Remove image"
//               className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
//             >
//               <X size={12} />
//             </button>
//           </div>
//         ))}

//         {images.length < maxFiles && (
//           <button
//             type="button"
//             onClick={() => inputRef.current?.click()}
//             disabled={uploading}
//             className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-muted transition hover:border-primary hover:text-primary disabled:opacity-60"
//           >
//             {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
//             <span className="text-[10px]">{uploading ? "Uploading" : "Upload"}</span>
//           </button>
//         )}
//       </div>

//       <input
//         ref={inputRef}
//         type="file"
//         accept="image/jpeg,image/png,image/webp,image/gif"
//         multiple={maxFiles > 1}
//         onChange={(e) => e.target.files.length && handleFiles(e.target.files)}
//         className="hidden"
//       />
//     </div>
//   );
// }


import { useRef, useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";

// Server (uploadMiddleware.js) ke saath ek jaisa hona chahiye
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_LABEL = "JPG, PNG, WebP, GIF";
const MAX_SIZE_MB = 5;

// onUploadingChange (optional): upload shuru/khatam hone ki khabar parent ko deta hai,
// taake upload ke dauran Save ka button band rakha ja sake
export default function ImageUploader({ images, onChange, maxFiles = 6, onUploadingChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const setBusy = (value) => {
    setUploading(value);
    onUploadingChange?.(value);
  };

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList);

    if (images.length + files.length > maxFiles) {
      toast.error(`You can upload up to ${maxFiles} image${maxFiles === 1 ? "" : "s"}`);
      resetInput();
      return;
    }

    // Upload se pehle hi qism aur size ki jaanch, taake saaf message mile
    const wrongType = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (wrongType) {
      toast.error(`"${wrongType.name}" is not allowed. Only ${ALLOWED_LABEL} images can be uploaded.`);
      resetInput();
      return;
    }
    const tooBig = files.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      toast.error(`"${tooBig.name}" is larger than ${MAX_SIZE_MB} MB.`);
      resetInput();
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    setBusy(true);
    try {
      const { data } = await api.post("/upload", formData);
      onChange([...images, ...data.urls]);
      toast.success("Image(s) uploaded");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      resetInput();
    }
  };

  const removeImage = (url) => {
    onChange(images.filter((img) => img !== url));
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">Images</label>
      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <div
            key={url}
            className="group relative h-20 w-20 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              aria-label="Remove image"
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {images.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-muted transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="text-[10px]">{uploading ? "Uploading" : "Upload"}</span>
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted">
        Allowed: {ALLOWED_LABEL}. Max {MAX_SIZE_MB} MB per image. Up to {maxFiles} image{maxFiles === 1 ? "" : "s"}.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple={maxFiles > 1}
        onChange={(e) => e.target.files.length && handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}