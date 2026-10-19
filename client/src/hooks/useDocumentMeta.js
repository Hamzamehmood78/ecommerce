import { useEffect } from "react";
import { STORE_NAME } from "../config";

const DEFAULT_TITLE = `${STORE_NAME} - Online Store`;
const DEFAULT_DESCRIPTION = "Shop quality products with fast delivery, easy returns and secure payment.";

const setMetaTag = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const removeMetaTag = (attr, key) => document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();

const restoreDefaults = () => {
  document.title = DEFAULT_TITLE;
  setMetaTag("name", "description", DEFAULT_DESCRIPTION);
  setMetaTag("property", "og:title", DEFAULT_TITLE);
  setMetaTag("property", "og:description", DEFAULT_DESCRIPTION);
  setMetaTag("property", "og:type", "website");
  removeMetaTag("property", "og:image");
  removeMetaTag("property", "og:url");
  removeMetaTag("name", "robots");
};

// Page ka title, description, share-preview ki tasveer aur "search engine se chhupao" set karta hai.
// Page chhodte hi purane default wapas aa jate hain.
export default function useDocumentMeta({ title, description, image, type = "website", noindex = false, disabled = false } = {}) {
  useEffect(() => {
    if (disabled) return undefined;

    const fullTitle = title ? `${title} | ${STORE_NAME}` : DEFAULT_TITLE;
    const desc = String(description || DEFAULT_DESCRIPTION).replace(/\s+/g, " ").trim().slice(0, 160);

    document.title = fullTitle;
    setMetaTag("name", "description", desc);
    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", desc);
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:url", window.location.href);

    if (image) setMetaTag("property", "og:image", image);
    else removeMetaTag("property", "og:image");

    if (noindex) setMetaTag("name", "robots", "noindex, nofollow");
    else removeMetaTag("name", "robots");

    return restoreDefaults;
  }, [title, description, image, type, noindex, disabled]);
}