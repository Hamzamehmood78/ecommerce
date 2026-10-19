import { useEffect, useState } from "react";

// Value ko thori der (delay ms) rukne ke baad hi update karta hai,
// taake price slider ya typing par baar baar API call na ho
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}