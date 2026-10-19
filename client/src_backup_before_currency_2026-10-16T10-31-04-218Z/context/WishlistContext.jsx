import { createContext, useContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadWishlist = useCallback(() => {
    if (!user) {
      setProducts([]);
      return;
    }
    setLoading(true);
    api
      .get("/wishlist")
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(loadWishlist, [loadWishlist]);

  const isInWishlist = (productId) => products.some((p) => p._id === productId);

  const toggleWishlist = async (product) => {
    if (!user) {
      toast.error("Please login to use your wishlist");
      return;
    }

    if (isInWishlist(product._id)) {
      try {
        const { data } = await api.delete(`/wishlist/${product._id}`);
        setProducts(data.products || []);
        toast.success("Removed from wishlist");
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    } else {
      try {
        const { data } = await api.post("/wishlist", { productId: product._id });
        setProducts(data.products || []);
        toast.success("Added to wishlist");
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      setProducts(data.products || []);
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <WishlistContext.Provider
      value={{ products, loading, isInWishlist, toggleWishlist, removeFromWishlist, count: products.length }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);