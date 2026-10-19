import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Clock, TrendingUp, Tag, Award } from "lucide-react";
import api from "../../api/axios";
import useDebounce from "../../hooks/useDebounce";

const RECENT_KEY = "recentSearches";

const getRecent = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const saveRecent = (term) => {
  const next = [term, ...getRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage band ho to bhi search chalti rahe
  }
  return next;
};

export default function SearchBar() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(getRecent);
  const [popular, setPopular] = useState(null);

  const term = value.trim();
  const debounced = useDebounce(term, 300);
  const showSuggestions = term.length >= 2;

  // Bahar click karne par dropdown band
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Pehli baar focus par "Popular right now" ek hi dafa mangwate hain
  useEffect(() => {
    if (!open || popular !== null) return;
    api
      .get("/products", { params: { sort: "popular", limit: 4 } })
      .then(({ data }) => setPopular(data.products))
      .catch(() => setPopular([]));
  }, [open, popular]);

  // Typing rukne ke 300ms baad suggestions
  useEffect(() => {
    if (debounced.length < 2) {
      setSuggestions(null);
      return;
    }
    let ignore = false;
    setLoading(true);
    api
      .get("/products/suggestions", { params: { q: debounced } })
      .then(({ data }) => {
        if (!ignore) setSuggestions(data);
      })
      .catch(() => {
        if (!ignore) setSuggestions(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [debounced]);

  const goTo = (path) => {
    setOpen(false);
    setValue("");
    navigate(path);
  };

  const submit = (text) => {
    const clean = text.trim();
    if (!clean) return;
    setRecent(saveRecent(clean));
    setOpen(false);
    navigate(`/shop?keyword=${encodeURIComponent(clean)}`);
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
    setRecent([]);
  };

  const hasResults =
    suggestions &&
    (suggestions.products.length > 0 || suggestions.categories.length > 0 || suggestions.brands.length > 0);

  return (
    <div ref={wrapRef} className="relative order-last w-full md:order-none md:mx-4 md:w-auto md:max-w-xl md:flex-1">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex items-center rounded-xl bg-surface px-3 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-primary"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search products..."
          aria-label="Search products"
          autoComplete="off"
          className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted"
        />
        <button type="submit" aria-label="Search" className="p-1 text-muted hover:text-primary">
          <Search size={20} />
        </button>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
          {showSuggestions ? (
            <>
              {loading && !suggestions && <p className="px-3 py-3 text-sm text-muted">Searching...</p>}

              {suggestions && !hasResults && !loading && (
                <p className="px-3 py-3 text-sm text-muted">No suggestions found.</p>
              )}

              {suggestions?.categories.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-muted">Categories</p>
                  {suggestions.categories.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => goTo(`/shop?category=${c.slug}`)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                    >
                      <Tag size={15} className="text-muted" /> {c.name}
                    </button>
                  ))}
                </div>
              )}

              {suggestions?.brands.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-muted">Brands</p>
                  {suggestions.brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => goTo(`/shop?keyword=${encodeURIComponent(b)}`)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                    >
                      <Award size={15} className="text-muted" /> {b}
                    </button>
                  ))}
                </div>
              )}

              {suggestions?.products.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-muted">Products</p>
                  {suggestions.products.map((p) => (
                    <Link
                      key={p._id}
                      to={`/product/${p.slug}`}
                      onClick={() => {
                        setOpen(false);
                        setValue("");
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface"
                    >
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <span className="flex-1 truncate text-sm text-ink">{p.name}</span>
                      <span className="text-sm font-medium text-ink">
                        Rs {(p.discountPrice > 0 ? p.discountPrice : p.price).toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <button
                onClick={() => submit(value)}
                className="mt-1 w-full rounded-lg border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-surface"
              >
                See all results for "{term}"
              </button>
            </>
          ) : (
            <>
              {recent.length > 0 && (
                <div className="mb-1">
                  <div className="flex items-center justify-between px-3 pb-1 pt-2">
                    <p className="text-xs font-semibold uppercase text-muted">Recent Searches</p>
                    <button onClick={clearRecent} className="text-xs font-medium text-primary hover:underline">
                      Clear
                    </button>
                  </div>
                  {recent.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setValue(t);
                        submit(t);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                    >
                      <Clock size={15} className="text-muted" /> {t}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-muted">Popular right now</p>
                {popular === null ? (
                  <p className="px-3 py-2 text-sm text-muted">Loading...</p>
                ) : popular.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted">Start typing to search.</p>
                ) : (
                  popular.map((p) => (
                    <Link
                      key={p._id}
                      to={`/product/${p.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface"
                    >
                      <TrendingUp size={15} className="text-muted" />
                      <span className="truncate">{p.name}</span>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}