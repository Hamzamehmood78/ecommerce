import { createContext, useContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);
const GUEST_CART_KEY = "guestCart";
const GUEST_SAVED_KEY = "guestSaved";

// Guest (bina login) ka cart aur shelf localStorage mein rehte hain
const readList = (key) => {
  try {
    const list = JSON.parse(localStorage.getItem(key));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const writeList = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // storage bhar gayi ho to bhi app chalti rahe
  }
};

const guestKey = (it) => `${it.productId}-${it.size}-${it.color}`;

// Guest aur logged-in dono ke liye cart items ka ek hi shape
const toCartItems = (guestItems) =>
  guestItems.map((it) => ({
    itemId: guestKey(it),
    product: it.product,
    quantity: it.quantity,
    size: it.size,
    color: it.color,
  }));

// Backend ke cart (ya shelf) ki lines ko simple shape mein badalta hai
const normalizeLines = (lines) =>
  (lines || [])
    .filter((it) => it.product) // deleted product ho to skip
    .map((it) => ({
      itemId: it._id,
      product: it.product,
      quantity: it.quantity,
      size: it.size,
      color: it.color,
    }));

// Server ko sirf zaroori cheezein bhejte hain (qeemat ya product ki nakal nahi)
const slimLines = (list) =>
  list.map(({ productId, quantity, size, color }) => ({ productId, quantity, size, color }));

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState(null); // { code, discountAmount }
  const [miniCartOpen, setMiniCartOpen] = useState(false);

  const applyServerCart = (data) => {
    setItems(normalizeLines(data.items));
    setSavedItems(normalizeLines(data.savedItems));
  };

  const loadServerCart = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setItems(normalizeLines(data.items));
      setSavedItems(normalizeLines(data.savedItems));
    } catch {
      // chup chaap fail, cart khali dikha do
    } finally {
      setLoading(false);
    }
  }, []);

  // Login/logout hote hi cart switch ho
  useEffect(() => {
    if (user) {
      const guestItems = readList(GUEST_CART_KEY);
      const guestSaved = readList(GUEST_SAVED_KEY);

      if (guestItems.length > 0 || guestSaved.length > 0) {
        api
          .post("/cart/merge", { items: slimLines(guestItems), savedItems: slimLines(guestSaved) })
          .then(({ data }) => {
            localStorage.removeItem(GUEST_CART_KEY);
            localStorage.removeItem(GUEST_SAVED_KEY);
            applyServerCart(data);
          })
          .catch(() => loadServerCart());
      } else {
        loadServerCart();
      }
    } else {
      setItems(toCartItems(readList(GUEST_CART_KEY)));
      setSavedItems(toCartItems(readList(GUEST_SAVED_KEY)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addItem = async (product, quantity = 1, size = "", color = "") => {
    if (user) {
      try {
        const { data } = await api.post("/cart", {
          productId: product._id,
          quantity,
          size,
          color,
        });
        applyServerCart(data);
        toast.success(`${product.name} added to cart`);
        setMiniCartOpen(true);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    } else {
      const guestItems = readList(GUEST_CART_KEY);
      const idx = guestItems.findIndex(
        (it) => it.productId === product._id && it.size === size && it.color === color
      );
      if (idx > -1) {
        guestItems[idx].quantity = Math.min(guestItems[idx].quantity + quantity, product.stock);
      } else {
        guestItems.push({ productId: product._id, product, quantity, size, color });
      }
      writeList(GUEST_CART_KEY, guestItems);
      setItems(toCartItems(guestItems));
      toast.success(`${product.name} added to cart`);
      setMiniCartOpen(true);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (user) {
      try {
        const { data } = await api.put(`/cart/${itemId}`, { quantity });
        applyServerCart(data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    } else {
      const guestItems = readList(GUEST_CART_KEY);
      const idx = guestItems.findIndex((it) => guestKey(it) === itemId);
      if (idx > -1) {
        guestItems[idx].quantity = quantity;
        writeList(GUEST_CART_KEY, guestItems);
        setItems(toCartItems(guestItems));
      }
    }
  };

  const removeItem = async (itemId) => {
    if (user) {
      try {
        const { data } = await api.delete(`/cart/${itemId}`);
        applyServerCart(data);
        toast.success("Item removed");
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    } else {
      const guestItems = readList(GUEST_CART_KEY).filter((it) => guestKey(it) !== itemId);
      writeList(GUEST_CART_KEY, guestItems);
      setItems(toCartItems(guestItems));
      toast.success("Item removed");
    }
  };

  // ---- Save for Later ----

  const saveForLater = async (itemId) => {
    if (user) {
      try {
        const { data } = await api.post(`/cart/${itemId}/save`);
        applyServerCart(data);
        toast.success("Saved for later");
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    } else {
      const cart = readList(GUEST_CART_KEY);
      const saved = readList(GUEST_SAVED_KEY);
      const idx = cart.findIndex((it) => guestKey(it) === itemId);
      if (idx === -1) return;

      const [line] = cart.splice(idx, 1);
      const sIdx = saved.findIndex((it) => guestKey(it) === itemId);
      if (sIdx > -1) saved[sIdx].quantity = Math.min(saved[sIdx].quantity + line.quantity, 99);
      else saved.push(line);

      writeList(GUEST_CART_KEY, cart);
      writeList(GUEST_SAVED_KEY, saved);
      setItems(toCartItems(cart));
      setSavedItems(toCartItems(saved));
      toast.success("Saved for later");
    }
  };

  const moveToCart = async (itemId) => {
    if (user) {
      try {
        const { data } = await api.post(`/cart/saved/${itemId}/move`);
        applyServerCart(data);
        toast.success(data.adjusted ? "Moved to cart (quantity adjusted to available stock)" : "Moved to cart");
      } catch (err) {
        toast.error(getErrorMessage(err));
        loadServerCart(); // shelf se hata diya gaya ho to list taaza ho jaye
      }
    } else {
      const saved = readList(GUEST_SAVED_KEY);
      const idx = saved.findIndex((it) => guestKey(it) === itemId);
      if (idx === -1) return;

      const line = saved[idx];
      const product = line.product;
      if (product.status === "out_of_stock" || product.stock < 1) {
        toast.error(`${product.name} is out of stock right now`);
        return;
      }

      const cart = readList(GUEST_CART_KEY);
      const cIdx = cart.findIndex((it) => guestKey(it) === itemId);
      const desired = (cIdx > -1 ? cart[cIdx].quantity : 0) + line.quantity;
      const finalQuantity = Math.min(desired, product.stock);

      if (cIdx > -1) cart[cIdx].quantity = finalQuantity;
      else cart.push({ ...line, quantity: finalQuantity });
      saved.splice(idx, 1);

      writeList(GUEST_CART_KEY, cart);
      writeList(GUEST_SAVED_KEY, saved);
      setItems(toCartItems(cart));
      setSavedItems(toCartItems(saved));
      toast.success(finalQuantity < desired ? "Moved to cart (quantity adjusted to available stock)" : "Moved to cart");
    }
  };

  const removeSaved = async (itemId) => {
    if (user) {
      try {
        const { data } = await api.delete(`/cart/saved/${itemId}`);
        applyServerCart(data);
        toast.success("Removed from saved items");
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    } else {
      const saved = readList(GUEST_SAVED_KEY).filter((it) => guestKey(it) !== itemId);
      writeList(GUEST_SAVED_KEY, saved);
      setSavedItems(toCartItems(saved));
      toast.success("Removed from saved items");
    }
  };

  // Order place hone ke baad turant UI se cart khali dikhane ke liye
  // (backend cart pehle hi order banate waqt khali ho chuka hota hai). Shelf nahi chhedte.
  const clearCartLocally = () => {
    setItems([]);
    setCoupon(null);
    writeList(GUEST_CART_KEY, []);
  };

  const removeCoupon = () => setCoupon(null);

  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = items.reduce((sum, it) => {
    const price = it.product?.discountPrice > 0 ? it.product.discountPrice : it.product?.price || 0;
    return sum + price * it.quantity;
  }, 0);
  const discountAmount = coupon?.discountAmount || 0;

  return (
    <CartContext.Provider
      value={{
        items,
        savedItems,
        loading,
        addItem,
        updateQuantity,
        removeItem,
        saveForLater,
        moveToCart,
        removeSaved,
        clearCartLocally,
        itemCount,
        subtotal,
        coupon,
        setCoupon,
        removeCoupon,
        discountAmount,
        miniCartOpen,
        setMiniCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);