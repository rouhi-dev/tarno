/** پیام‌های بازخورد سیستم — پس از هر اقدام، نتیجه صریح اعلام می‌شود. */

import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../lib/store/StoreProvider';

const TONE = {
  success: 'border-ok/45 bg-surface text-ok',
  error: 'border-danger/45 bg-surface text-danger',
  info: 'border-line-strong bg-surface text-ink',
} as const;

export const Toasts = () => {
  const { toasts, dismissToast } = useStore();
  return (
    <div
      className="no-print pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4"
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto w-full max-w-[440px] rounded-card border px-4 py-3 shadow-pop ${TONE[t.tone]}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold">{t.title}</p>
                {t.detail && <p className="mt-0.5 text-[12px] leading-6 text-muted">{t.detail}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-[11px] text-muted hover:text-ink"
                aria-label="بستن پیام"
              >
                بستن
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
