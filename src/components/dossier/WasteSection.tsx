/**
 * مورد مزیت‌بخش ۱ — نمودار بصری مدل اتلاف زمان و هزینه در وضعیت سنتی.
 * یک ماشین‌حساب تعاملی: کاربر پارامترها را تغییر می‌دهد و نمودار و جمع‌بندی
 * بلافاصله بازمحاسبه می‌شود.
 */

import { useMemo, useState } from 'react';
import {
  computeWaste,
  DEFAULT_WASTE_INPUTS,
  TARNO_REDUCTION,
  WASTE_DISCLAIMER,
  WASTE_PARAMS,
  type WasteInputs,
} from '../../lib/content/waste';
import { SectionShell } from '../layout/SectionShell';
import { WasteChart, WasteShareDonut } from '../charts/WasteChart';
import { Badge, Button, Note, cx } from '../ui/primitives';
import { Reveal } from '../ui/motion';
import { faNum, toman, tomanShort } from '../../lib/format';

const SIDE_TABS = [
  { key: 'buyer', label: 'پارامترهای خریدار' },
  { key: 'shared', label: 'پارامترهای مشترک' },
  { key: 'seller', label: 'پارامترهای فروشنده' },
] as const;

export const WasteSection = () => {
  const [inputs, setInputs] = useState<WasteInputs>(DEFAULT_WASTE_INPUTS);
  const [mode, setMode] = useState<'hours' | 'money'>('hours');
  const [tab, setTab] = useState<(typeof SIDE_TABS)[number]['key']>('buyer');

  const result = useMemo(() => computeWaste(inputs), [inputs]);
  const t = result.totals;

  const set = (key: keyof WasteInputs, value: number) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const savedHours = t.hoursPerYear - t.hoursPerYearTarno;
  const savedMoney = t.moneyPerYear - t.moneyPerYearTarno;
  const workDays = savedHours / 8;

  return (
    <SectionShell
      id="waste"
      index={3}
      tone="raised"
      eyebrow="مورد مزیت‌بخش — مدل اتلاف"
      title="زمان و پولی که در مسیر سنتی خرج می‌شود، کجا می‌رود؟"
      lead="این بخش یک مدل پارامتری است و نه گزارش آماری. هر عدد ورودی را خودتان تغییر می‌دهید و خروجی بی‌درنگ بازمحاسبه می‌شود؛ هدف، نشان دادن ساختار اتلاف است: اینکه سهم عمده زمان صرف «جستجو و استعلام» می‌شود، نه صرف تصمیم‌گیری."
    >
      {/* جمع‌بندی بالا */}
      <Reveal>
        <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'زمان هر معامله — وضعیت سنتی',
              value: `${faNum(t.hoursPerDeal, 1)} ساعت`,
              sub: `در سال: ${faNum(t.hoursPerYear, 0)} ساعت`,
              tone: 'warn' as const,
            },
            {
              label: 'زمان هر معامله — با تارنو (فرض)',
              value: `${faNum(t.hoursPerDealTarno, 1)} ساعت`,
              sub: `در سال: ${faNum(t.hoursPerYearTarno, 0)} ساعت`,
              tone: 'ok' as const,
            },
            {
              label: 'هزینه سالانه اتلاف — سنتی',
              value: tomanShort(t.moneyPerYear),
              sub: `هر معامله: ${tomanShort(t.moneyPerDeal)}`,
              tone: 'warn' as const,
            },
            {
              label: 'صرفه‌جویی سالانه فرضی',
              value: tomanShort(savedMoney),
              sub: `معادل ${faNum(workDays, 0)} روز کاری`,
              tone: 'ok' as const,
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cx(
                'flex flex-col gap-1 rounded-card border bg-surface p-4',
                s.tone === 'ok' ? 'border-ok/35' : 'border-warn/35',
              )}
            >
              <span className="text-[11.5px] leading-6 text-muted">{s.label}</span>
              <span
                className={cx(
                  'num text-[21px] font-bold leading-8',
                  s.tone === 'ok' ? 'text-ok' : 'text-warn',
                )}
              >
                {s.value}
              </span>
              <span className="num text-[11.5px] text-muted">{s.sub}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* نمودار */}
        <Reveal className="order-2 lg:order-1">
          <div className="flex h-full flex-col gap-6 rounded-card border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[16px] font-bold text-ink">تفکیک اتلاف برای هر معامله</h3>
              <div className="flex gap-1 rounded-lg border border-line bg-raised p-1">
                {([
                  ['hours', 'بر حسب زمان'],
                  ['money', 'بر حسب هزینه'],
                ] as const).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setMode(k)}
                    className={cx(
                      'rounded-md px-3 py-1 text-[12.5px] transition-colors',
                      mode === k ? 'bg-indigo-700 text-white' : 'text-body hover:bg-surface',
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <WasteChart items={result.perDeal} mode={mode} />

            <div className="border-t border-line pt-5">
              <h4 className="mb-4 text-[14px] font-semibold text-ink">
                سهم هر نوع فعالیت از کل اتلاف
              </h4>
              <WasteShareDonut items={result.perDeal} mode={mode} />
            </div>
          </div>
        </Reveal>

        {/* پارامترها */}
        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14.5px] font-bold text-ink">پارامترهای مدل</h3>
              <Button variant="quiet" size="sm" onClick={() => setInputs(DEFAULT_WASTE_INPUTS)}>
                بازنشانی
              </Button>
            </div>

            <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-line bg-raised p-1">
              {SIDE_TABS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setTab(s.key)}
                  className={cx(
                    'flex-1 rounded-md px-2 py-1 text-[11.5px] transition-colors',
                    tab === s.key ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-muted',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="thin-scroll flex max-h-[420px] flex-col gap-4 overflow-y-auto pe-1">
              {WASTE_PARAMS.filter((p) => p.side === tab).map((p) => (
                <div key={p.id} className="flex flex-col gap-1.5">
                  <label htmlFor={`wp-${p.id}`} className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] leading-6 text-body">{p.label}</span>
                    <span className="num shrink-0 text-[12px] font-semibold text-indigo-700">
                      {p.unit === 'تومان' || p.unit.includes('تومان')
                        ? tomanShort(inputs[p.id])
                        : `${faNum(inputs[p.id], p.step < 1 ? 1 : 0)} ${p.unit}`}
                    </span>
                  </label>
                  <input
                    id={`wp-${p.id}`}
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={inputs[p.id]}
                    onChange={(e) => set(p.id, Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[var(--indigo-700)]"
                    style={{ background: 'var(--grid)' }}
                  />
                  <p className="text-[10.5px] leading-5 text-muted">{p.basis}</p>
                </div>
              ))}
            </div>
          </div>

          {/* سمت فروشنده: هزینه سرمایه قفل‌شده */}
          <div className="rounded-card border border-line bg-surface p-4">
            <p className="label-eyebrow mb-2">سمت فروشنده — هزینه فرصت موجودی راکد</p>
            <div className="flex flex-col gap-2 text-[12.5px]">
              <div className="flex items-baseline justify-between">
                <span className="text-muted">هزینه سرمایه در وضعیت کنونی</span>
                <span className="num font-semibold text-warn">{toman(result.seller.capitalCost)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted">با کوتاه شدن دوره فروش (فرض)</span>
                <span className="num font-semibold text-ok">{toman(result.seller.capitalCostTarno)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <span className="text-muted">کاهش مدت راکد ماندن</span>
                <span className="num font-semibold text-ink">
                  {faNum(result.seller.monthsSaved, 1)} ماه
                </span>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-6 text-muted">
              فرمول: ارزش موجودی × نرخ هزینه سرمایه × (ماه راکد ÷ ۱۲)
            </p>
          </div>

          {/* ضرایب بهبود */}
          <div className="rounded-card border border-line bg-surface p-4">
            <p className="label-eyebrow mb-2">ضرایب بهبود فرضی تارنو</p>
            <ul className="flex flex-wrap gap-1.5">
              {Object.entries(TARNO_REDUCTION).map(([k, v]) => (
                <li key={k}>
                  <Badge tone="outline">
                    {
                      {
                        search: 'جستجو',
                        contact: 'تماس',
                        followUp: 'پیگیری',
                        comparison: 'مقایسه',
                        negotiation: 'مذاکره',
                        sample: 'نمونه',
                        trip: 'سفر',
                        mismatch: 'ریسک تطابق',
                        idleTime: 'دوره رکود',
                      }[k as keyof typeof TARNO_REDUCTION]
                    }{' '}
                    −{faNum(v * 100, 0)}٪
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-6 text-muted">
              این ضرایب «هدف طراحی» هستند. مذاکره کمترین کاهش را دارد چون چانه‌زنی با سامانه حذف
              نمی‌شود، و حمل نمونه هم کاهش می‌یابد اما از بین نمی‌رود.
            </p>
          </div>
        </div>
      </div>

      <Reveal>
        <div className="mt-6">
          <Note kind="honest" title="این نمودار چه چیزی را ثابت می‌کند و چه چیزی را نه">
            {WASTE_DISCLAIMER}
          </Note>
        </div>
      </Reveal>
    </SectionShell>
  );
};
