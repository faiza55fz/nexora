"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type FestiveCarouselProps = {
  children: ReactNode;
  ariaLabel: string;
};

export function FestiveCarousel({ children, ariaLabel }: FestiveCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateArrows, children]);

  function scrollByPage(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.85, 200),
      behavior: "smooth",
    });
  }

  const arrowClass =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-ink shadow-md transition hover:scale-105 hover:shadow-lg md:grid";

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={ariaLabel}>
      {canPrev ? (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Scroll left"
          className={`${arrowClass} -left-4`}
        >
          <ChevronLeft size={20} />
        </button>
      ) : null}

      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-3 pb-3 pt-1 [scrollbar-width:none] sm:-mx-4 sm:gap-4 sm:px-4 [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <div className="w-[44vw] max-w-[200px] shrink-0 snap-start sm:w-[200px] sm:max-w-none lg:w-[212px]">
            {child}
          </div>
        ))}
      </div>

      {canNext ? (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Scroll right"
          className={`${arrowClass} -right-4`}
        >
          <ChevronRight size={20} />
        </button>
      ) : null}
    </div>
  );
}
