import { useEffect, useState } from "react";
import api from "../api/axios";
import { roundMoney } from "../utils/currency";

const DEFAULT_TAX = { enabled: false, rate: 0, label: "Tax" };
let cached = null; // ek baar mangwa kar yaad rakhte hain

// Server ki tarah currency ki decimals tak round (PKR: poore rupay, USD: cents)
export const calculateTax = (taxableAmount, tax) =>
  tax?.enabled && tax.rate > 0 ? roundMoney((taxableAmount * tax.rate) / 100) : 0;

export default function useTaxSettings() {
  const [tax, setTax] = useState(cached || DEFAULT_TAX);

  useEffect(() => {
    if (cached) return;
    api
      .get("/settings")
      .then(({ data }) => {
        cached = { ...DEFAULT_TAX, ...(data.tax || {}) };
        setTax(cached);
      })
      .catch(() => {});
  }, []);

  return tax;
}