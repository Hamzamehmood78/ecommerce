import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "../stripeClient";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import useTaxSettings, { calculateTax } from "../hooks/useTaxSettings";
import StepIndicator from "../components/checkout/StepIndicator";
import AddressStep from "../components/checkout/AddressStep";
import GuestInfoStep from "../components/checkout/GuestInfoStep";
import DeliveryStep from "../components/checkout/DeliveryStep";
import PaymentStep from "../components/checkout/PaymentStep";
import ReviewStep from "../components/checkout/ReviewStep";
import AddressFormModal from "../components/account/AddressFormModal";
import ConfirmDialog from "../components/admin/ConfirmDialog";

const emailRegex = /^\S+@\S+\.\S+$/;

const emptyGuest = {
  email: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
};

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, loading: cartLoading, clearCartLocally, coupon, discountAmount } = useCart();
  const taxSettings = useTaxSettings();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Logged-in customer: saved addresses
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Guest: contact aur address
  const [guestInfo, setGuestInfo] = useState(emptyGuest);
  const [guestErrors, setGuestErrors] = useState({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [quote, setQuote] = useState(null);

  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [rates, setRates] = useState(null);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(3000);
  const [placing, setPlacing] = useState(false);

  // Guest ke items server ko bhejne ki shakal mein (qeemat nahi bhejte, server khud nikalta hai)
  const guestItems = useMemo(
    () =>
      items.map((it) => ({
        productId: it.product._id,
        quantity: it.quantity,
        size: it.size,
        color: it.color,
      })),
    [items]
  );
  const guestItemsKey = JSON.stringify(guestItems);

  // List badalne ke baad selected address sahi rakhta hai (warna default chun leta hai)
  const applyAddresses = (list, preferredId) => {
    setAddresses(list);
    setSelectedId((current) => {
      const wanted = preferredId || current;
      if (wanted && list.some((a) => a._id === wanted)) return wanted;
      return (list.find((a) => a.isDefault) || list[0])?._id || null;
    });
  };

  useEffect(() => {
    if (!user) {
      setAddressesLoading(false);
      return;
    }
    api
      .get("/account/addresses")
      .then(({ data }) => applyAddresses(data))
      .catch(() => {})
      .finally(() => setAddressesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    api
      .get("/orders/shipping-rates")
      .then(({ data }) => {
        setRates(data.rates);
        setFreeShippingThreshold(data.freeShippingThreshold ?? 3000);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [cartLoading, items, navigate]);

  // Guest: payment aur review se pehle server se taaza qeemat/shipping/tax/total
  useEffect(() => {
    if (user || step < 3 || items.length === 0) return;
    let ignore = false;
    setQuote(null);
    api
      .post("/orders/guest-quote", { items: guestItems, deliveryMethod })
      .then(({ data }) => {
        if (!ignore) setQuote(data);
      })
      .catch((err) => {
        if (!ignore) toast.error(getErrorMessage(err));
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, step, deliveryMethod, guestItemsKey]);

  const selectedAddress = addresses.find((a) => a._id === selectedId);

  const handleAddressSaved = (list, isNew) => {
    applyAddresses(list, isNew ? list[list.length - 1]._id : undefined);
    setAddressModalOpen(false);
  };

  const handleDeleteAddress = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/account/addresses/${deleteTarget._id}`);
      applyAddresses(data);
      toast.success("Address deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // Guest ka Step 1: jaanch, phir server se email ki tasdeeq (kya is email par asli account hai?)
  const handleGuestNext = async () => {
    const next = {};
    if (!emailRegex.test(guestInfo.email.trim())) next.email = "Enter a valid email";
    if (!guestInfo.fullName.trim()) next.fullName = "Required";
    if (!guestInfo.phone.trim()) next.phone = "Required";
    if (!guestInfo.addressLine1.trim()) next.addressLine1 = "Required";
    if (!guestInfo.city.trim()) next.city = "Required";
    if (!guestInfo.zip.trim()) next.zip = "Required";
    setGuestErrors(next);
    if (Object.keys(next).length > 0) return;

    setCheckingEmail(true);
    try {
      await api.post("/orders/guest-check", { email: guestInfo.email.trim() });
      setStep(2);
    } catch (err) {
      setGuestErrors({
        email: getErrorMessage(err),
        emailExists: err.response?.status === 409,
      });
    } finally {
      setCheckingEmail(false);
    }
  };

  // Totals: customer ke liye local hisaab (server bhi wohi karta hai), guest ke liye server ka quote
  const effectiveDiscount = user ? discountAmount : 0; // coupon sirf account walon ke liye
  const taxable = Math.max(subtotal - effectiveDiscount, 0);
  const localShipping =
    taxable > freeShippingThreshold ? 0 : rates?.[deliveryMethod]?.price ?? (deliveryMethod === "express" ? 450 : 200);
  const localTax = calculateTax(taxable, taxSettings);

  const totals = user
    ? {
        itemsPrice: subtotal,
        discountAmount: effectiveDiscount,
        shippingPrice: localShipping,
        taxPrice: localTax,
        taxLabel: taxSettings.label,
        taxRate: taxSettings.rate,
        totalPrice: taxable + localShipping + localTax,
      }
    : quote
    ? { ...quote, discountAmount: 0 }
    : null;

  const reviewAddress = user ? selectedAddress : guestInfo;

  const handlePlaceOrder = async () => {
    if (!reviewAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    const shippingAddress = {
      fullName: reviewAddress.fullName,
      phone: reviewAddress.phone,
      addressLine1: reviewAddress.addressLine1,
      addressLine2: reviewAddress.addressLine2,
      city: reviewAddress.city,
      state: reviewAddress.state,
      zip: reviewAddress.zip,
    };

    setPlacing(true);
    try {
      if (user) {
        const { data } = await api.post("/orders", {
          shippingAddress,
          deliveryMethod,
          paymentMethod,
          couponCode: coupon?.code,
          paymentIntentId,
        });
        clearCartLocally();
        toast.success("Order placed successfully!");
        navigate(`/order-confirmation/${data._id}`, { replace: true });
      } else {
        const email = guestInfo.email.trim();
        const { data } = await api.post("/orders/guest", {
          email,
          shippingAddress,
          items: guestItems,
          deliveryMethod,
          paymentMethod,
          paymentIntentId,
        });
        // Guest ke paas login nahi, is liye confirmation page ke liye order yahin yaad rakhte hain
        sessionStorage.setItem("guestOrder", JSON.stringify({ order: data, email }));
        clearCartLocally();
        toast.success("Order placed successfully!");
        navigate(`/order-confirmation/${data._id}`, { replace: true });
      }
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);

      if (err.response?.status === 409) {
        if (!user && /account already exists|account now exists/i.test(message)) {
          // Is email par asli account hai: Step 1 par wapas, login ka raasta dikhayen
          setGuestErrors({ email: message, emailExists: true });
          setPaymentIntentId(null);
          setStep(1);
        } else {
          // Payment ke baad total badal gaya: paisa wapas ho chuka hota hai, dobara payment karwayein
          setPaymentIntentId(null);
          setStep(3);
        }
      }
    } finally {
      setPlacing(false);
    }
  };

  if (cartLoading) {
    return <div className="mx-auto max-w-3xl animate-pulse px-4 py-12"><div className="h-64 rounded-xl bg-slate-100" /></div>;
  }

  const waitingForQuote = step >= 3 && !totals;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">Checkout</h1>
      <p className="mt-1 text-sm text-muted">
        <Link to="/cart" className="hover:text-primary">Cart</Link> / Checkout
        {!user && " (Guest)"}
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <StepIndicator current={step} />

        {step === 1 &&
          (user ? (
            <AddressStep
              addresses={addresses}
              loading={addressesLoading}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={() => { setEditingAddress(null); setAddressModalOpen(true); }}
              onEdit={(a) => { setEditingAddress(a); setAddressModalOpen(true); }}
              onDelete={setDeleteTarget}
              onNext={() => {
                if (selectedAddress) setStep(2);
                else toast.error("Please select or add a shipping address");
              }}
            />
          ) : (
            <GuestInfoStep
              info={guestInfo}
              setInfo={(next) => {
                setGuestInfo(next);
                if (guestErrors.email) setGuestErrors((e) => ({ ...e, email: "", emailExists: false }));
              }}
              errors={guestErrors}
              checking={checkingEmail}
              onNext={handleGuestNext}
            />
          ))}

        {step === 2 && (
          <DeliveryStep
            deliveryMethod={deliveryMethod}
            setDeliveryMethod={setDeliveryMethod}
            rates={rates}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {waitingForQuote && <div className="h-40 animate-pulse rounded-xl bg-slate-100" />}

        {step === 3 && totals && (
          <Elements stripe={stripePromise}>
            <PaymentStep
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              amount={totals.totalPrice}
              deliveryMethod={deliveryMethod}
              couponCode={user ? coupon?.code : undefined}
              guest={user ? null : { email: guestInfo.email.trim(), items: guestItems }}
              onPaid={(id) => {
                setPaymentIntentId(id);
                setStep(4);
              }}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          </Elements>
        )}

        {step === 4 && totals && reviewAddress && (
          <ReviewStep
            address={reviewAddress}
            deliveryMethod={deliveryMethod}
            paymentMethod={paymentMethod}
            items={items}
            itemsPrice={totals.itemsPrice}
            shippingPrice={totals.shippingPrice}
            discountAmount={totals.discountAmount}
            couponCode={user ? coupon?.code : undefined}
            taxPrice={totals.taxPrice}
            taxLabel={totals.taxLabel}
            taxRate={totals.taxRate}
            onBack={() => setStep(3)}
            onPlaceOrder={handlePlaceOrder}
            placing={placing}
          />
        )}
      </div>

      {user && (
        <>
          <AddressFormModal
            open={addressModalOpen}
            onClose={() => setAddressModalOpen(false)}
            onSaved={handleAddressSaved}
            editingAddress={editingAddress}
          />

          <ConfirmDialog
            open={!!deleteTarget}
            title="Delete Address"
            message="Are you sure you want to delete this address?"
            onConfirm={handleDeleteAddress}
            onCancel={() => setDeleteTarget(null)}
            confirming={deleting}
          />
        </>
      )}
    </div>
  );
}