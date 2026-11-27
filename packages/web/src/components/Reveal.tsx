import { useEffect, useRef, useState } from "react";
import {
  getRevealTransform,
  prefersReducedMotion,
  type RevealDirection,
} from "./motion/motionHelper";

export function Reveal({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: RevealDirection;
}) {
  const [isVisible, setIsVisible] = useState(() => prefersReducedMotion());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) return;
    const el = ref.current;
    if (!el) return;

    // Reveal immediately if IntersectionObserver is unavailable
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0.05) {
          setIsVisible(true);
          // Once revealed, stay visible and stop observing to prevent scroll-flicker
          observer.unobserve(entry.target);
        }
      },
      { threshold: [0, 0.05, 0.15], rootMargin: "0px 0px -30px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div
      ref={ref}
      className={`transform-gpu transition-[transform,opacity] duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isVisible ? "opacity-100" : "opacity-0"} ${getRevealTransform(direction, isVisible)} ${className}`}
      style={{ transitionDelay: isVisible && !prefersReducedMotion() ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
