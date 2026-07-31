"use client";

/**
 * Quantum web-only motion helpers — framer-motion + count-up.
 * Disabled for print and prefers-reduced-motion.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useInView, useReducedMotion, animate } from "framer-motion";

export function useQuantumMotionOn(): boolean {
  const reduce = useReducedMotion();
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const onBefore = () => setPrinting(true);
    const onAfter = () => setPrinting(false);
    window.addEventListener("beforeprint", onBefore);
    window.addEventListener("afterprint", onAfter);
    return () => {
      window.removeEventListener("beforeprint", onBefore);
      window.removeEventListener("afterprint", onAfter);
    };
  }, []);

  return !reduce && !printing;
}

/** Count-up when scrolled into view; falls back to final label instantly. */
export function QuantumCountUp({
  value,
  format,
  className,
  duration = 1.05,
  decimals = 0,
  empty = "—",
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  duration?: number;
  decimals?: number;
  empty?: string;
}) {
  const motionOn = useQuantumMotionOn();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [display, setDisplay] = useState(() =>
    !motionOn && value > 0 ? format(value) : empty
  );

  useEffect(() => {
    if (!(value > 0)) {
      setDisplay(empty);
      return;
    }
    if (!motionOn) {
      setDisplay(format(value));
      return;
    }
    if (!inView) return;

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        const n = decimals > 0 ? Number(v.toFixed(decimals)) : Math.round(v);
        setDisplay(format(n));
      },
    });
    return () => controls.stop();
    // format intentionally omitted — callers pass stable wrappers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionOn, inView, value, duration, decimals, empty]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

export function QuantumFadeUp({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const motionOn = useQuantumMotionOn();
  if (!motionOn) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** CSS height bar grows on enter (bill compare / impact). */
export function QuantumGrowBar({
  className,
  heightPx,
  heightPct,
  delay = 0,
  style,
}: {
  className?: string;
  heightPx?: number;
  heightPct?: number;
  delay?: number;
  style?: CSSProperties;
}) {
  const motionOn = useQuantumMotionOn();
  const target =
    heightPx != null
      ? `${heightPx}px`
      : heightPct != null
        ? `${heightPct}%`
        : "0";

  if (!motionOn) {
    return <div className={className} style={{ ...style, height: target }} />;
  }

  return (
    <motion.div
      className={className}
      style={{ ...style, overflow: "hidden" }}
      initial={{ height: 0, opacity: 0.5 }}
      whileInView={{ height: target, opacity: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    />
  );
}

/** SVG path draw for wealth line + soft fill fade. */
export function QuantumChartDraw({
  linePath,
  areaPath,
  children,
}: {
  linePath: string;
  areaPath: string;
  children?: ReactNode;
}) {
  const motionOn = useQuantumMotionOn();
  const ref = useRef<SVGPathElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [len, setLen] = useState(0);

  useLayoutEffect(() => {
    if (!ref.current) return;
    try {
      setLen(ref.current.getTotalLength());
    } catch {
      setLen(800);
    }
  }, [linePath]);

  if (!motionOn) {
    return (
      <>
        <path d={areaPath} fill="url(#qWealthFill)" />
        <path
          ref={ref}
          d={linePath}
          stroke="url(#qWealthLine)"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {children}
      </>
    );
  }

  return (
    <>
      <motion.path
        d={areaPath}
        fill="url(#qWealthFill)"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.65, delay: 0.2, ease: "easeOut" }}
      />
      <motion.path
        ref={ref}
        d={linePath}
        stroke="url(#qWealthLine)"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len || 1}
        initial={{ strokeDashoffset: len || 1 }}
        animate={
          inView && len > 0
            ? { strokeDashoffset: 0 }
            : { strokeDashoffset: len || 1 }
        }
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.g
        initial={{ opacity: 0, scale: 0.92 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0 }}
        transition={{ duration: 0.35, delay: 0.75 }}
        style={{ transformOrigin: "center" }}
      >
        {children}
      </motion.g>
    </>
  );
}
