import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Heart, ShoppingCart, User, LogOut, Package, ShoppingBag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import useStoreInfo from "../../hooks/useStoreInfo";
import SearchBar from "./SearchBar";
import CategoryMenu from "./CategoryMenu";
import MiniCart from "./MiniCart";
import NotificationBell from "../notifications/NotificationBell";

function CountBadge({ count }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-white">
      {count}
    </span>
  );
}

const iconClass = "relative rounded-full p-2 text-muted transition hover:bg-surface hover:text-primary";

export default function Header() {
  const store = useStoreInfo();
  const { user, logout } = useAuth();
  const { itemCount, setMiniCartOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <ShoppingBag size={26} />
         {store.name}
        </Link>

        <CategoryMenu />

        <SearchBar />

        <div className="ml-auto flex items-center gap-1">
          <Link to="/wishlist" aria-label="Wishlist" className={iconClass}>
            <Heart size={22} />
            <CountBadge count={wishlistCount} />
          </Link>

          <button onClick={() => setMiniCartOpen(true)} aria-label="Open cart" className={iconClass}>
            <ShoppingCart size={22} />
            <CountBadge count={itemCount} />
          </button>
          <NotificationBell />
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full p-2 text-muted transition hover:bg-surface hover:text-primary"
                aria-label="Account menu"
              >
                <User size={22} />
                <span className="hidden max-w-24 truncate text-sm font-medium sm:block">{user.name}</span>
              </button>

              {menuOpen && (
                <>
                  {/* bahar click karne par menu band */}
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5">
                    <Link
                      to="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface"
                    >
                      <User size={18} /> My Account
                    </Link>
                    <Link
                      to="/account/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface"
                    >
                      <Package size={18} /> My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface"
                    >
                      <Heart size={18} /> Wishlist
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-surface"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-1 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
            >
              <User size={18} /> Login
            </Link>
          )}
        </div>
      </div>

      <MiniCart />
    </header>
  );
}