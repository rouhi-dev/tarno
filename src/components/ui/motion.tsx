/**
 * اجزای حرکت — پوشش نازک روی framer-motion.
 *
 * قاعده: حرکت باید معنا داشته باشد (ورود محتوا، تغییر وضعیت، تأکید روی داده)
 * و با prefers-reduced-motion غیرفعال شود. هیچ انیمیشن تزئینی تکرارشونده‌ای
 * در رابط MVP به کار نرفته است؛ حرکت‌های روایی مخصوص پرونده تحلیلی است.
 */

import { motion, useReducedMotion, type MotionProps } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from './primitives';

export const Reveal = ({
  children,
  delay = 0,
  y = 14,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) => {
  const reduced = useReducedMotion();
  const Tag = motion[as] as React.ComponentType<MotionProps & { className?: string }>;
  if (reduced) return <Tag className={className}>{children}</Tag>;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
};

/** ورود پشت‌سرهم اعضای یک فهرست */
export const RevealGroup = ({
  children,
  className,
  stagger = 0.07,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) => {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.1 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
};

export const RevealItem = ({ children, className }: { children: ReactNode; className?: string }) => {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
};

/** شمارنده عددی که با ورود به دید، تا مقدار نهایی بالا می‌رود. */
export const CountUp = ({
  value,
  format,
  className,
  duration = 1.1,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  duration?: number;
}) => {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / (duration * 1000));
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          setShown(value * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration, reduced]);

  if (reduced) return <span className={cx('num', className)}>{format(value)}</span>;
  return (
    <span ref={ref} className={cx('num', className)}>
      {format(shown)}
    </span>
  );
};
