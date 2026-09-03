import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Fades + slides content in when it enters the viewport, and back out when
 * it leaves — so the effect replays whether the user scrolls down or back up.
 */
const ScrollReveal = ({ children, className, delayMs = 0 }: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Safety net: if IntersectionObserver never fires (unsupported, or a
    // background/inactive tab throttling it), reveal anyway after a short
    // delay — this is a landing page, it must never get stuck invisible.
    const fallback = setTimeout(() => setVisible(true), 1200);

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) clearTimeout(fallback);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(fallback); };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delayMs}ms, transform 0.6s ease ${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
