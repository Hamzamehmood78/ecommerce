import { useEffect, useState } from "react";
import api from "../api/axios";
import { STORE_NAME } from "../config";

const STORAGE_KEY = "storeInfo";
const DEFAULT_INFO = { name: STORE_NAME, email: "", phone: "", address: "" };

// Pichli baar ka naam browser mein yaad rehta hai, taake page khulte hi sahi naam dikhe
const readStored = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return raw && typeof raw === "object" ? { ...DEFAULT_INFO, ...raw } : DEFAULT_INFO;
  } catch {
    return DEFAULT_INFO;
  }
};

const clean = (store = {}) => ({
  name: String(store.name || "").trim() || STORE_NAME,
  email: String(store.email || "").trim(),
  phone: String(store.phone || "").trim(),
  address: String(store.address || "").trim(),
});

let current = readStored();
let fetched = false;
let pending = null;
const listeners = new Set();

const publish = (info) => {
  current = info;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // storage band ho to bhi app chalti rahe
  }
  listeners.forEach((fn) => fn(info));
};

const load = () => {
  if (pending) return pending;
  pending = api
    .get("/settings")
    .then(({ data }) => {
      publish(clean(data.store));
      fetched = true;
    })
    .catch(() => {})
    .finally(() => {
      pending = null;
    });
  return pending;
};

// Admin Store Settings save kare to dukan ke saare hisse foran naya naam/phone dikhayen
export const updateStoreInfo = (store) => {
  publish(clean(store));
  fetched = true;
};

export default function useStoreInfo() {
  const [info, setInfo] = useState(current);

  useEffect(() => {
    listeners.add(setInfo);
    setInfo(current);
    if (!fetched) load();
    return () => {
      listeners.delete(setInfo);
    };
  }, []);

  return info;
}