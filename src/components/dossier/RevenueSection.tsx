/** بخش ۱۰ پرونده — فرضیه‌های مدل درآمدی (پیش‌نگاشت فاز ۲) و نقشه راه. */

import {
  REVENUE_CONCLUSION,
  REVENUE_HYPOTHESES,
  ROADMAP,
  ROADMAP_LABEL,
  type RoadmapItem,
} from '../../lib/content/revenue';
import { OUT_OF_SCOPE } from '../../lib/content/scenarios';
import { SectionShell } from '../layout/SectionShell';
import { Badge, Note, cx } from '../ui/primitives';
import { Reveal, RevealGroup, RevealItem } from '../ui/motion';

const TEST_LABEL = { high: 'آزمون‌پذیری بالا', medium: 'آزمون‌پذیری متوسط', low: 'آزمون‌پذیری پایین' } as const;

const HORIZONS: RoadmapItem['horizon'][] = ['phase2', 'phase3', 'phase4', 'beyond'];

export const RevenueSection = () => (
  <SectionShell
    id="revenue"
    index={10}
    tone="raised"
    eyebrow="پیش‌نگاشت فاز ۲ + نقشه راه"
    title="فرضیه‌های درآمدی و آنچه عامدانه ساخته نشده است"
    lead="این لوح، پاسخ پرسش پنجم ایده بالغ را به یک جدول فرضیه تبدیل می‌کند. هیچ یک از این مدل‌ها در فاز ۱ پیاده‌سازی نشده است: نه کارمزدی دریافت می‌شود و نه اشتراکی فروخته می‌شود. تحلیل کامل مدل کسب‌وکار و بوم ۹ بخشی، تحویل‌دادنی فاز ۲ است."
  >
    <Reveal>
      <div className="mb-6">
        <Note kind="warn" title="مرز فاز">
          مطالب این لوح در حد «فرضیه برای تحلیل» است. پیاده‌سازی مدل کسب‌وکار، دریافت واقعی وجه و
          بوم ۹ بخشی به فاز ۲ تعلق دارد و عامدانه در این تحویل انجام نشده است.
        </Note>
      </div>
    </Reveal>

    <RevealGroup className="grid gap-4 lg:grid-cols-2">
      {REVENUE_HYPOTHESES.map((r) => (
        <RevealItem key={r.id} className="h-full">
          <article className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15.5px] font-bold text-ink">{r.title}</h3>
              <Badge tone="neutral">پرداخت‌کننده: {r.payer}</Badge>
              <Badge tone={r.testability === 'high' ? 'ok' : r.testability === 'medium' ? 'indigo' : 'warn'}>
                {TEST_LABEL[r.testability]}
              </Badge>
              <Badge tone="outline">در فاز ۱ پیاده نشده</Badge>
            </div>
            <p className="text-[12.5px] leading-7 text-body">
              <span className="font-medium text-ink">سازوکار: </span>
              {r.mechanism}
            </p>
            <div className="rounded-lg border border-ok/30 bg-[color-mix(in_srgb,var(--ok)_6%,transparent)] p-3">
              <p className="label-eyebrow mb-1">هم‌راستایی با ارزش</p>
              <p className="text-[12px] leading-7 text-body">{r.alignment}</p>
            </div>
            <div className="mt-auto rounded-lg border border-madder-600/25 bg-madder-100 p-3">
              <p className="label-eyebrow mb-1">ریسک</p>
              <p className="text-[12px] leading-7 text-body">{r.risk}</p>
            </div>
          </article>
        </RevealItem>
      ))}
    </RevealGroup>

    <Reveal>
      <div className="mt-5 rounded-card border border-indigo-700/25 bg-indigo-100 p-5">
        <p className="label-eyebrow mb-1.5">ترتیب پیشنهادی آزمون</p>
        <p className="max-w-[86ch] text-[13px] leading-8 text-body">{REVENUE_CONCLUSION}</p>
      </div>
    </Reveal>

    {/* خارج از دامنه */}
    <Reveal>
      <h3 className="mb-4 mt-12 font-display text-[23px] font-bold text-ink">
        آنچه عامدانه در فاز ۱ ساخته نشده است
      </h3>
      <p className="mb-5 max-w-reading text-[13px] leading-8 text-body">
        شفافیت در مرز دامنه، بخشی از ارزیابی است. موارد زیر نه فراموش شده‌اند و نه ناقص مانده‌اند؛
        بر اساس صورت پروژه به فازهای بعد تعلق دارند یا صریحاً ممنوع‌اند.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {OUT_OF_SCOPE.map((o) => (
          <div key={o.title} className="flex gap-3 rounded-card border border-dashed border-line-strong bg-surface p-4">
            <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-sm bg-line-strong" />
            <div>
              <p className="text-[13px] font-semibold text-ink">{o.title}</p>
              <p className="mt-0.5 text-[11.5px] leading-6 text-muted">{o.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </Reveal>

    {/* نقشه راه */}
    <Reveal>
      <h3 className="mb-5 mt-12 font-display text-[23px] font-bold text-ink">نقشه راه توسعه</h3>
      <div className="grid gap-4 lg:grid-cols-4">
        {HORIZONS.map((h, hi) => (
          <div key={h} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={cx(
                  'h-2.5 w-2.5 rounded-full',
                  hi === 0 ? 'bg-indigo-700' : hi === 3 ? 'bg-line-strong' : 'bg-indigo-500',
                )}
              />
              <p className="text-[12.5px] font-semibold text-ink">{ROADMAP_LABEL[h]}</p>
            </div>
            <div className="flex flex-col gap-2 border-s-2 border-line ps-3">
              {ROADMAP.filter((r) => r.horizon === h).map((r) => (
                <div key={r.title} className="rounded-lg border border-line bg-surface p-3">
                  <p className="text-[12.5px] font-medium text-ink">{r.title}</p>
                  <p className="mt-1 text-[11.5px] leading-6 text-muted">{r.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  </SectionShell>
);
