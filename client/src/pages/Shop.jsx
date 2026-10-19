import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios";
import ProductCard from "../components/home/ProductCard";
import ProductListItem from "../components/shop/ProductListItem";
import FilterSidebar from "../components/shop/FilterSidebar";
import SortBar from "../components/shop/SortBar";
import Pagination from "../components/shop/Pagination";
import EmptyState from "../components/shop/EmptyState";
import useDebounce from "../hooks/useDebounce";

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <div className="aspect-square rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-1/3 rounded bg-slate-200" />
    </div>
  );
}

const emptyFilters = {
  category: "",
  minPrice: "",
  maxPrice: "",
  rating: "",
  brands: [],
  sizes: [],
  colors: [],
};

const splitParam = (value) => (value ? value.split(",").filter(Boolean) : []);

const filtersFromUrl = (params) => ({
  category: params.get("category") || "",
  minPrice: params.get("minPrice") || "",
  maxPrice: params.get("maxPrice") || "",
  rating: params.get("rating") || "",
  brands: splitParam(params.get("brand")),
  sizes: splitParam(params.get("size")),
  colors: splitParam(params.get("color")),
});

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [options, setOptions] = useState({ brands: [], sizes: [], colors: [] });
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(() => filtersFromUrl(searchParams));

  const keyword = searchParams.get("keyword") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page")) || 1;
  const urlKey = searchParams.toString();

  const debouncedMin = useDebounce(filters.minPrice, 500);
  const debouncedMax = useDebounce(filters.maxPrice, 500);

  // URL ko update karta hai (yehi filters ka "Apply" hai)
  const applyFilters = (next = filters) => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (sort !== "newest") params.set("sort", sort);
    if (next.category) params.set("category", next.category);
    if (next.minPrice) params.set("minPrice", next.minPrice);
    if (next.maxPrice) params.set("maxPrice", next.maxPrice);
    if (next.rating) params.set("rating", next.rating);
    if (next.brands.length) params.set("brand", next.brands.join(","));
    if (next.sizes.length) params.set("size", next.sizes.join(","));
    if (next.colors.length) params.set("color", next.colors.join(","));
    setSearchParams(params);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    setSearchParams(params);
    setFiltersOpen(false);
  };

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    if (newSort === "newest") params.delete("sort");
    else params.set("sort", newSort);
    params.delete("page");
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // URL kisi aur jagah se badle (jaise Header ka category menu) to sidebar bhi saath badle
  useEffect(() => {
    setFilters(filtersFromUrl(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  // Price likhna rukne ke baad khud filter lag jaye
  useEffect(() => {
    if (debouncedMin === filters.minPrice && debouncedMax === filters.maxPrice) {
      const urlMin = searchParams.get("minPrice") || "";
      const urlMax = searchParams.get("maxPrice") || "";
      if (urlMin !== debouncedMin || urlMax !== debouncedMax) {
        applyFilters(filters);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin, debouncedMax]);

  // Categories aur filter ki list ek hi baar
  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
    api.get("/products/filter-options").then((res) => setOptions(res.data)).catch(() => {});
  }, []);

  // URL badalte hi products dobara load hon (sab filter server par lagte hain)
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    const params = { page, sort, limit: 12 };
    const add = (key, value) => {
      if (value) params[key] = value;
    };
    add("keyword", keyword);
    add("category", searchParams.get("category"));
    add("minPrice", searchParams.get("minPrice"));
    add("maxPrice", searchParams.get("maxPrice"));
    add("brand", searchParams.get("brand"));
    add("size", searchParams.get("size"));
    add("color", searchParams.get("color"));
    add("minRating", searchParams.get("rating"));

    api
      .get("/products", { params })
      .then(({ data }) => {
        if (ignore) return;
        setProducts(data.products);
        setMeta({ page: data.page, pages: data.pages, total: data.total });
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  const heading = useMemo(() => {
    if (keyword) return `Search results for "${keyword}"`;
    const catSlug = searchParams.get("category");
    const cat = categories.find((c) => c.slug === catSlug);
    return cat ? cat.name : "All Products";
  }, [keyword, searchParams, categories]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">{heading}</h1>

      <div className="mt-6 flex gap-6">
        <FilterSidebar
          categories={categories}
          options={options}
          filters={filters}
          onChange={setFilters}
          onApply={() => applyFilters(filters)}
          onClear={clearFilters}
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <SortBar
            total={meta.total}
            sort={sort}
            onSortChange={handleSortChange}
            view={view}
            onViewChange={setView}
            onOpenFilters={() => setFiltersOpen(true)}
          />

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-danger ring-1 ring-red-200">{error}</div>
          )}

          {!error && loading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {!error && !loading && products.length === 0 && <EmptyState onClear={clearFilters} />}

          {!error && !loading && products.length > 0 && (
            <>
              {view === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((p) => (
                    <ProductListItem key={p._id} product={p} />
                  ))}
                </div>
              )}

              <Pagination page={meta.page} pages={meta.pages} onPageChange={handlePageChange} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}