import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios";
import HeroSlider from "../components/home/HeroSlider";
import CategoryGrid from "../components/home/CategoryGrid";
import ProductRow from "../components/home/ProductRow";
import DealOfTheDay from "../components/home/DealOfTheDay";
import Testimonials from "../components/home/Testimonials";
import Newsletter from "../components/home/Newsletter";
import TrustStrip from "../components/home/TrustStrip";

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [deal, setDeal] = useState([]);
  const [sections, setSections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadHomeData = async () => {
      try {
        const [bannerRes, catRes, settingsRes] = await Promise.all([
          api.get("/banners"),
          api.get("/categories"),
          api.get("/settings"),
        ]);
        if (ignore) return;

        setBanners(bannerRes.data);
        setCategories(catRes.data);
        setSections(settingsRes.data.sections);

        const featuredIds = (settingsRes.data.featuredProductIds || []).map((p) => p._id);
        const dealIds = (settingsRes.data.dealProductIds || []).map((p) => p._id);

        const [featuredRes, newRes, dealRes] = await Promise.all([
          featuredIds.length > 0
            ? api.get("/products", { params: { ids: featuredIds.join(","), limit: 8 } })
            : api.get("/products", { params: { limit: 8 } }),
          api.get("/products", { params: { limit: 8, sort: "newest" } }),
          dealIds.length > 0
            ? api.get("/products", { params: { ids: dealIds.join(","), limit: 4 } })
            : api.get("/products", { params: { limit: 4, sort: "price_desc" } }),
        ]);
        if (ignore) return;

        setFeatured(featuredRes.data.products);
        setNewArrivals(newRes.data.products);
        setDeal(dealRes.data.products);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadHomeData();
    return () => {
      ignore = true;
    };
  }, []);

  if (!loading && error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="rounded-xl bg-red-50 p-4 text-danger ring-1 ring-red-200">{error}</p>
      </div>
    );
  }

  const show = (key) => loading || !sections || sections[key] !== false;

  return (
    <div>
      <HeroSlider slides={banners} />

      {show("categoryGrid") && <CategoryGrid categories={categories} loading={loading} />}

      <ProductRow title="Featured Products" products={featured} loading={loading} viewAllLink="/shop" />

      {show("dealOfDay") && <DealOfTheDay products={deal} loading={loading} />}

      {show("newArrivals") && (
        <ProductRow
          title="New Arrivals"
          products={newArrivals}
          loading={loading}
          viewAllLink="/shop?sort=newest"
        />
      )}

      {show("testimonials") && <Testimonials />}
      {show("newsletter") && <Newsletter />}
      {show("trustStrip") && <TrustStrip />}
    </div>
  );
}