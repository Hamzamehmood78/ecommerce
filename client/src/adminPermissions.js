import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Star,
  Tag,
  Image,
  Settings,
  BarChart3,
  Mail,
  SlidersHorizontal,
  CreditCard,
  Truck,
  Users,
  Contact,
  Boxes,
} from "lucide-react";

// Staff form mein dikhne wali checklist (backend ki permissions ke saath same keys)
export const PERMISSION_OPTIONS = [
  { key: "reports", label: "Dashboard & Reports" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "inventory", label: "Inventory & Stock" },
  { key: "orders", label: "Orders" },
  { key: "customers", label: "Customers" },
  { key: "reviews", label: "Reviews" },
  { key: "coupons", label: "Coupons" },
  { key: "banners", label: "Banners" },
  { key: "homepage", label: "Homepage Settings" },
  { key: "messages", label: "Contact Messages" },
  { key: "payments", label: "Payments" },
  { key: "shipping", label: "Shipping" },
  { key: "settings", label: "Store Settings" },
];

// Admin sidebar ke saare items, har ek ki required permission ke saath
export const ADMIN_NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "reports" },
  { to: "/admin/products", label: "Products", icon: Package, permission: "products" },
  { to: "/admin/categories", label: "Categories", icon: FolderTree, permission: "categories" },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory" },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, permission: "orders" },
  { to: "/admin/customers", label: "Customers", icon: Contact, permission: "customers" },
  { to: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews" },
  { to: "/admin/coupons", label: "Coupons", icon: Tag, permission: "coupons" },
  { to: "/admin/banners", label: "Banners", icon: Image, permission: "banners" },
  { to: "/admin/homepage", label: "Homepage", icon: Settings, permission: "homepage" },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, permission: "reports" },
  { to: "/admin/messages", label: "Messages", icon: Mail, permission: "messages" },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments" },
  { to: "/admin/shipping", label: "Shipping", icon: Truck, permission: "shipping" },
  { to: "/admin/settings", label: "Store Settings", icon: SlidersHorizontal, permission: "settings" },
  { to: "/admin/staff", label: "Staff", icon: Users, adminOnly: true },
];

export const hasPermission = (user, permission) =>
  !!user &&
  (user.role === "admin" ||
    (user.role === "staff" && (user.permissions || []).includes(permission)));

export const canSeeNavItem = (user, item) =>
  item.adminOnly ? user?.role === "admin" : hasPermission(user, item.permission);