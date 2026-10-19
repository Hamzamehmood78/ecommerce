import { useEffect, useState } from "react";
import api from "../../api/axios";

// Free hosting par backend so jata hai. Agar jawab 4 second se zyada le to visitor ko samjha do.
export default function ServerWakeNotice() {
  const enabled = import.meta.env.VITE_DEMO_MODE === "true";
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) setWaking(true);
    }, 4000);

    api
      .get("/settings")
      .catch(() => {})
      .finally(() => {
        finished = true;
        clearTimeout(timer);
        setWaking(false);
      });

    return () => {
      finished = true;
      clearTimeout(timer);
    };
  }, [enabled]);

  if (!enabled || !waking) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[90%] max-w-md rounded-xl bg-ink px-4 py-3 text-center text-sm text-white shadow-lg">
      The demo server is waking up (free hosting). The first visit can take up to a minute. Thanks for waiting!
    </div>
  );
}