import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HeroSlider({ slides = [] }) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (slides.length ? (i + 1) % slides.length : 0));
  }, [slides.length]);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  if (slides.length === 0) return null;

  const slide = slides[index];

  return (
    <section className="relative mx-auto mt-6 max-w-7xl overflow-hidden rounded-2xl px-4">
      <div className="relative min-h-64 overflow-hidden rounded-2xl sm:min-h-80">
        <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative flex min-h-64 flex-col items-start justify-center gap-4 p-8 text-white sm:min-h-80 sm:p-14">
          <h1 className="max-w-lg text-3xl font-bold sm:text-4xl">{slide.heading}</h1>
          {slide.subtext && <p className="max-w-md text-white/90">{slide.subtext}</p>}
          <Link
            to={slide.link || "/shop"}
            className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-dark"
          >
            {slide.buttonText || "Shop Now"}
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-ink shadow transition hover:bg-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-ink shadow transition hover:bg-white"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}