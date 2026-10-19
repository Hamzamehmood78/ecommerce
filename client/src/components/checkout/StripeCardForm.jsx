import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../api/axios";
import { formatMoney } from "../../utils/currency";

const cardElementOptions = {
  style: {
    base: {
      fontSize: "14px",
      color: "#1E293B",
      "::placeholder": { color: "#94a3b8" },
    },
    invalid: { color: "#DC2626" },
  },
};

// amount sirf button par dikhane ke liye hai. Asal raqam server nikalta hai.
// guest = { email, items } (login ke baghair checkout), warna null
export default function StripeCardForm({ amount, deliveryMethod, couponCode, guest, onPaid, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState("");

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setCardError("");

    try {
      const { data } = guest
        ? await api.post("/payments/create-guest-intent", {
            items: guest.items,
            email: guest.email,
            deliveryMethod,
          })
        : await api.post("/payments/create-intent", { deliveryMethod, couponCode });

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setCardError(result.error.message);
        toast.error(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
        toast.success("Payment successful");
        onPaid(result.paymentIntent.id);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-4">
        <CardElement options={cardElementOptions} onChange={(e) => setCardError(e.error?.message || "")} />
      </div>
      {cardError && <p className="text-sm text-danger">{cardError}</p>}

      <p className="text-xs text-muted">
        Test card: 4242 4242 4242 4242, any future expiry date, any CVC, any ZIP.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          className="rounded-lg px-6 py-3 font-medium text-ink ring-1 ring-slate-200 transition hover:bg-surface disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {processing ? "Processing..." : `Pay ${formatMoney(amount)}`}
        </button>
      </div>
    </form>
  );
}