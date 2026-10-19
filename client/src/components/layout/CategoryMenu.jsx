import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, ChevronDown, ChevronRight } from "lucide-react";
import api from "../../api/axios";
import { formatMoney } from "../../utils/currency";

export default function CategoryMenu() {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState(null); // null = abhi load nahi hui
  const [activeId, setActiveId] = useState(null);
  const [productsBySlug, setProductsBySlug] = useState({});

  const topLevel = useMemo(() => (categories || []).filter((c) => !c.parent), [categories]);
  const active = topLevel.find((c) => c._id === activeId) || topLevel[0];
  const subCategories = active ? (categories || []).filter((c) => c.parent?._id === active._id) : [];

  // Bahar click aur Escape par band
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Categories pehli baar kholne par hi mangwate hain
  useEffect(() => {
    if (!open || categories !== null) return;
    api
      .get("/categories")
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories([]));
  }, [open, categories]);

  // Chuni hui category ke 3 popular products (ek baar mangwa kar yaad rakhte hain)
  useEffect(() => {
    if (!open || !active || productsBySlug[active.slug]) return;
    let ignore = false;
    api
      .get("/products", { params: { category: active.slug, limit: 3, sort: "popular" } })
      .then(({ data }) => {
        if (!ignore) setProductsBySlug((prev) => ({ ...prev, [active.slug]: data.products }));
      })
      .catch(() => {
        if (!ignore) setProductsBySlug((prev) => ({ ...prev, [active.slug]: [] }));
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active?.slug]);

  const close = () => setOpen(false);
  const products = active ? productsBySlug[active.slug] : undefined;

  return (
    <div ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface"
      >
        <LayoutGrid size={18} className="text-primary" />
        <span className="hidden sm:inline">Shop by Category</span>
        <ChevronDown size={16} className={`text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-full z-50 mt-1 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 md:right-auto md:w-[44rem]">
          {categories === null ? (
            <p className="p-6 text-sm text-muted">Loading categories...</p>
          ) : topLevel.length === 0 ? (
            <p className="p-6 text-sm text-muted">No categories available yet.</p>
          ) : (
            <div className="grid max-h-[70vh] md:grid-cols-[14rem_1fr]">
              <div className="overflow-y-auto border-b border-slate-100 bg-surface p-2 md:border-b-0 md:border-r">
                {topLevel.map((c) => (
                  <button
                    key={c._id}
                    onMouseEnter={() => setActiveId(c._id)}
                    onClick={() => setActiveId(c._id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                      active?._id === c._id ? "bg-white text-primary shadow-sm" : "text-ink hover:bg-white"
                    }`}
                  >
                    {c.name}
                    <ChevronRight size={15} className="text-muted" />
                  </button>
                ))}
              </div>

              {active && (
                <div className="overflow-y-auto p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink">{active.name}</h3>
                    <Link
                      to={`/shop?category=${active.slug}`}
                      onClick={close}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View all →
                    </Link>
                  </div>

                  {subCategories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {subCategories.map((s) => (
                        <Link
                          key={s._id}
                          to={`/shop?category=${s.slug}`}
                          onClick={close}
                          className="rounded-lg bg-surface px-3 py-1.5 text-sm text-ink ring-1 ring-slate-200 hover:text-primary"
                        >
                          {s.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  <p className="mb-2 mt-5 text-xs font-semibold uppercase text-muted">Popular in {active.name}</p>
                  {products === undefined ? (
                    <p className="text-sm text-muted">Loading...</p>
                  ) : products.length === 0 ? (
                    <p className="text-sm text-muted">No products in this category yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {products.map((p) => (
                        <Link
                          key={p._id}
                          to={`/product/${p.slug}`}
                          onClick={close}
                          className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-surface"
                        >
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <span className="flex-1 truncate text-sm text-ink">{p.name}</span>
                          <span className="text-sm font-medium text-ink">
                            {formatMoney((p.discountPrice > 0 ? p.discountPrice : p.price))}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}