/** مورد مزیت‌بخش ۲ — نقشه سفر مشتری در وضعیت موجود (As-Is). */

import { useState } from 'react';
import {
  CRITICAL_STAGES,
  EMOTION_LABEL,
  JOURNEY,
  JOURNEY_CONCLUSION,
} from '../../lib/content/journey';
import { SectionShell } from '../layout/SectionShell';
import { EmotionCurve, StageTimeBars } from '../charts/JourneyCharts';
import { Badge, Note, cx } from '../ui/primitives';
import { Reveal } from '../ui/motion';
import { faNum } from '../../lib/format';

const WASTE_KIND_LABEL = {
  search: 'جستجو',
  communication: 'ارتباط',
  verification: 'راستی‌آزمایی',
  logistics: 'جابه‌جایی',
  decision: 'تصمیم',
} as const;

const SeverityDots = ({ value }: { value: number }) => (
  <span className="inline-flex items-center gap-1" aria-label={`شدت درد ${value} از ۵`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        aria-hidden
        className={cx('h-1.5 w-3 rounded-sm', i <= value ? 'bg-madder-600' : 'bg-line')}
      />
    ))}
  </span>
);

export const JourneySection = () => {
  const [activeId, setActiveId] = useState<string>('j3');
  const active = JOURNEY.find((s) => s.id === activeId) ?? JOURNEY[0];
  const totalActive = JOURNEY.reduce((a, s) => a + s.activeHours, 0);
  const totalWaiting = JOURNEY.reduce((a, s) => a + s.waitingHours, 0);

  return (
    <SectionShell
      id="journey"
      index={4}
      eyebrow="مورد مزیت‌بخش — نقشه سفر مشتری"
      title="سفر کنونی خریدار، بدون تارنو"
      lead="این نقشه «وضع موجود» است و نه وضع مطلوب: مسیری که یک کسب‌وکار امروز برای یافتن و خرید پارچه طی می‌کند. روی هر نقطه از نمودار یا هر مرحله کلیک کنید تا اقدام‌ها، پرسش‌ها، نقاط درد و فرصت بهبود آن مرحله را ببینید."
    >
      <Reveal>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge tone="madder">وضع موجود (As-Is)</Badge>
          <Badge tone="outline">سفر خریدار</Badge>
          <Badge tone="outline">{faNum(JOURNEY.length)} مرحله</Badge>
          <span className="num text-[12.5px] text-muted">
            مجموع مدل‌شده: {faNum(totalActive, 1)} ساعت کار فعال + {faNum(totalWaiting, 0)} ساعت انتظار
          </span>
        </div>
      </Reveal>

      {/* خط سیر احساسی */}
      <Reveal>
        <div className="rounded-card border border-line bg-surface p-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[16px] font-bold text-ink">خط سیر حال کاربر در طول سفر</h3>
            <p className="text-[11.5px] text-muted">
              شاخص ۱ (نگران/کلافه) تا ۵ (آسوده) — فرضیه مدل‌سازی، نه داده میدانی
            </p>
          </div>
          <EmotionCurve activeId={activeId} onSelect={setActiveId} />
        </div>
      </Reveal>

      {/* نوار مراحل */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="flex flex-col gap-1.5">
          {JOURNEY.map((s) => {
            const isActive = s.id === activeId;
            const critical = CRITICAL_STAGES.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveId(s.id)}
                aria-current={isActive}
                className={cx(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition-colors',
                  isActive
                    ? 'border-indigo-700 bg-indigo-100'
                    : 'border-line bg-surface hover:border-line-strong',
                )}
              >
                <span
                  className={cx(
                    'num flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[12px] font-bold',
                    isActive ? 'bg-indigo-900 text-white' : 'bg-raised text-muted',
                  )}
                >
                  {faNum(s.index)}
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-medium text-ink">{s.title}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <SeverityDots value={s.severity} />
                    {critical && <span className="text-[10.5px] text-madder-600">گلوگاه</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* جزئیات مرحله فعال */}
        <Reveal key={active.id} y={8}>
          <article className="flex h-full flex-col gap-5 rounded-card border border-line bg-surface p-5">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="label-eyebrow mb-1">مرحله {faNum(active.index)} از {faNum(JOURNEY.length)}</p>
                <h3 className="font-display text-[24px] font-bold text-ink">{active.title}</h3>
                <p className="mt-1.5 max-w-reading text-[13px] leading-7 text-body">
                  <span className="font-medium text-ink">هدف کاربر: </span>
                  {active.goal}
                </p>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <Badge tone="warn">حال کاربر: {EMOTION_LABEL[active.emotion]}</Badge>
                <Badge tone="outline">{WASTE_KIND_LABEL[active.wasteKind]}</Badge>
                <span className="num text-[11.5px] text-muted">
                  {faNum(active.activeHours, 1)} ساعت کار + {faNum(active.waitingHours, 0)} ساعت انتظار
                </span>
              </div>
            </header>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="label-eyebrow mb-2">اقدام‌های کاربر</p>
                <ul className="flex flex-col gap-1.5">
                  {active.actions.map((a, i) => (
                    <li key={i} className="flex gap-2 text-[12.5px] leading-7 text-body">
                      <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label-eyebrow mb-2">نقاط تماس</p>
                <ul className="flex flex-wrap gap-1.5">
                  {active.touchpoints.map((t) => (
                    <li
                      key={t}
                      className="rounded border border-line bg-raised px-2 py-0.5 text-[11.5px] text-body"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="label-eyebrow mb-2 mt-4">پرسش‌ها و ابهام‌های کاربر</p>
                <ul className="flex flex-col gap-1.5">
                  {active.questions.map((q, i) => (
                    <li key={i} className="text-[12.5px] leading-7 text-muted">
                      «{q}»
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div className="rounded-lg border border-madder-600/25 bg-madder-100 p-3.5">
                <p className="label-eyebrow mb-2">نقاط درد و فعالیت‌های بی‌بازده</p>
                <ul className="flex flex-col gap-2">
                  {active.painPoints.map((p, i) => (
                    <li key={i} className="flex gap-2 text-[12.5px] leading-7 text-body">
                      <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-madder-600" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-indigo-700/25 bg-indigo-100 p-3.5">
                <p className="label-eyebrow mb-2">فرصت بهبود با تارنو</p>
                <p className="text-[12.5px] leading-7 text-body">{active.opportunity}</p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-line-strong bg-raised p-3.5">
              <p className="label-eyebrow mb-1.5">پرسش اعتبارسنجی این مرحله</p>
              <p className="text-[12.5px] leading-7 text-body">«{active.validationProbe}»</p>
              <p className="mt-1.5 text-[11px] text-muted">
                این پرسش در پرسش‌نامه میدانی بخش اعتبارسنجی گنجانده شده است.
              </p>
            </div>
          </article>
        </Reveal>
      </div>

      {/* زمان هر مرحله */}
      <Reveal>
        <div className="mt-6 rounded-card border border-line bg-surface p-5">
          <h3 className="mb-4 text-[16px] font-bold text-ink">توزیع زمان بین مراحل</h3>
          <StageTimeBars stages={JOURNEY} />
        </div>
      </Reveal>

      {/* جمع‌بندی */}
      <Reveal>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-card border border-line bg-surface p-5">
            <h3 className="mb-2 text-[16px] font-bold text-ink">{JOURNEY_CONCLUSION.title}</h3>
            <p className="text-[13px] leading-8 text-body">{JOURNEY_CONCLUSION.body}</p>
          </div>
          <Note kind="honest" title="برچسب صریح وضعیت داده">
            {JOURNEY_CONCLUSION.claimBoundary}
          </Note>
        </div>
      </Reveal>
    </SectionShell>
  );
};
