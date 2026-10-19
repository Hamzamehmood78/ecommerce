import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import ComingSoon from "./pages/ComingSoon";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import Wishlist from "./pages/Wishlist";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccountLayout from "./pages/account/AccountLayout";
import Profile from "./pages/account/Profile";
import Addresses from "./pages/account/Addresses";
import ChangePassword from "./pages/account/ChangePassword";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import FAQs from "./pages/FAQs";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminHome from "./pages/admin/AdminHome";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminPrintDocument from "./pages/admin/AdminPrintDocument";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminHomepageSettings from "./pages/admin/AdminHomepageSettings";
import AdminReports from "./pages/admin/AdminReports";
import AdminContactMessages from "./pages/admin/AdminContactMessages";
import AdminStoreSettings from "./pages/admin/AdminStoreSettings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminShipping from "./pages/admin/AdminShipping";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail";
import AdminInventory from "./pages/admin/AdminInventory";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";
import TrackOrder from "./pages/TrackOrder";

// Yeh pages aage ke tasks mein banenge
const comingSoonPages = [];

// Admin ke kisi section ko ek permission ke peeche rakhta hai
const guard = (permission, element) => (
  <ProtectedRoute permission={permission}>{element}</ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
    <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/cart" element={<Cart />} />
             <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route
          path="/account/orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<AboutUs />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Profile />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="password" element={<ChangePassword />} />
        </Route>
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        {comingSoonPages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<ComingSoon title={page.title} />}
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="/admin/print/:id/:type"
        element={
          <ProtectedRoute adminArea permission="orders">
            <AdminPrintDocument />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminArea>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="dashboard" element={guard("reports", <AdminDashboard />)} />
        <Route path="products" element={guard("products", <AdminProducts />)} />
        <Route path="categories" element={guard("categories", <AdminCategories />)} />
        <Route path="inventory" element={guard("inventory", <AdminInventory />)} />
        <Route path="orders" element={guard("orders", <AdminOrders />)} />
                <Route path="orders/:id" element={guard("orders", <AdminOrderDetail />)} />
        <Route path="customers" element={guard("customers", <AdminCustomers />)} />
        <Route path="customers/:id" element={guard("customers", <AdminCustomerDetail />)} />
        <Route path="reviews" element={guard("reviews", <AdminReviews />)} />
        <Route path="coupons" element={guard("coupons", <AdminCoupons />)} />
        <Route path="banners" element={guard("banners", <AdminBanners />)} />
        <Route path="homepage" element={guard("homepage", <AdminHomepageSettings />)} />
        <Route path="reports" element={guard("reports", <AdminReports />)} />
        <Route path="messages" element={guard("messages", <AdminContactMessages />)} />
        <Route path="payments" element={guard("payments", <AdminPayments />)} />
        <Route path="shipping" element={guard("shipping", <AdminShipping />)} />
        <Route path="settings" element={guard("settings", <AdminStoreSettings />)} />
        <Route
          path="staff"
          element={
            <ProtectedRoute adminOnly>
              <AdminStaff />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}