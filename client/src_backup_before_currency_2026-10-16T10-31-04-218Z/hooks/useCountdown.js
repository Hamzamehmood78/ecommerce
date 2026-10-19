import { useEffect, useState } from "react";

// targetDate ke pass milliseconds ka Date object dein
export default function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(targetDate - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(targetDate - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const clamped = Math.max(timeLeft, 0);
  const hours = Math.floor(clamped / (1000 * 60 * 60));
  const minutes = Math.floor((clamped / (1000 * 60)) % 60);
  const seconds = Math.floor((clamped / 1000) % 60);

  return { hours, minutes, seconds, expired: clamped === 0 };
}