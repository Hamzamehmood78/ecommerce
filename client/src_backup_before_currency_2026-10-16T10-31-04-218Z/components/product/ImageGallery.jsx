import { useState } from "react";

export default function ImageGallery({ images = [], name }) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
        {hasImages ? (
          <img
            src={images[active]}
            alt={name}
            className="h-full w-full object-cover transition hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            No image available
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === active ? "ring-primary" : "ring-transparent hover:ring-slate-300"
              }`}
            >
              <img src={img} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}