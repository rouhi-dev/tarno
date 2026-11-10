/**
 * نمودار مدل اتلاف زمان و هزینه — میله‌های افقی جفتی.
 *
 * قواعد رسم: یک مقیاس برای همه میله‌ها، برچسب مستقیم روی هر میله، رنگ از
 * توکن‌های تم (در هر دو حالت روشن و تاریک خوانا)، و راهنمای رنگ همیشه حاضر.
 */

import { useMemo, useState } from 'react';
import type { WasteBreakdownItem } from '../../lib/content/waste';
import { WASTE_KIND_LABEL } from '../../lib/content/waste';
import { faNum, tomanShort } from '../../lib/format';

type Mode = 'hours' | 'money';

export const WasteChart = ({
  items,
  mode,
}: {
  items: WasteBreakdownItem[];
  mode: Mode;
}) => {
  const [hover, setHover] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      items
        .map((it) => ({
          id: it.id,
          label: it.label,
          kind: it.kind,
          current: mode === 'hours' ? it.hours : it.money,
          improved: mode === 'hours' ? it.hoursWithTarno : it.moneyWithTarno,
        }))
        .filter((r) => r.current > 0)
        .sort((a, b) => b.current - a.current),
    [items, mode],
  );

  const max = Math.max(...rows.map((r) => r.current), 1);
  const fmt = (v: number) => (mode === 'hours' ? `${faNum(v, 1)} ساعت` : tomanShort(v));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: 'var(--series-2)' }} />
          وضعیت سنتی
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: 'var(--series-1)' }} />
          با تارنو (فرض طراحی)
        </span>
      </div>

      <ul className="flex flex-col gap-3.5">
        {rows.map((r) => {
          const wCur = Math.max(1.5, (r.current / max) * 100);
          const wImp = Math.max(0.6, (r.improved / max) * 100);
          const active = hover === r.id;
          return (
            <li
              key={r.id}
              className="group"
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] font-medium text-ink">{r.label}</span>
                <span className="num text-[11.5px] text-muted">
                  {WASTE_KIND_LABEL[r.kind]}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="h-[13px] flex-1 overflow-hidden rounded-[3px]" style={{ background: 'var(--grid)' }}>
                    <div
                      className="h-full rounded-[3px] transition-[width] duration-500"
                      style={{ width: `${wCur}%`, background: 'var(--series-2)' }}
                    />
                  </div>
                  <span className="num w-[108px] shrink-0 text-[11.5px] text-body">{fmt(r.current)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-[13px] flex-1 overflow-hidden rounded-[3px]" style={{ background: 'var(--grid)' }}>
                    <div
                      className="h-full rounded-[3px] transition-[width] duration-500"
                      style={{ width: `${wImp}%`, background: 'var(--series-1)' }}
                    />
                  </div>
                  <span className="num w-[108px] shrink-0 text-[11.5px] text-muted">{fmt(r.improved)}</span>
                </div>
              </div>
              {active && (
                <p className="mt-1.5 text-[11.5px] leading-6 text-muted">
                  کاهش فرضی: {faNum(((1 - r.improved / (r.current || 1)) * 100), 0)}٪
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/** نمودار دایره‌ای سهم انواع اتلاف از کل */
export const WasteShareDonut = ({ items, mode }: { items: WasteBreakdownItem[]; mode: Mode }) => {
  const byKind = useMemo(() => {
    const map = new Map<WasteBreakdownItem['kind'], number>();
    for (const it of items) {
      const v = mode === 'hours' ? it.hours : it.money;
      if (v <= 0) continue;
      map.set(it.kind, (map.get(it.kind) ?? 0) + v);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items, mode]);

  const total = byKind.reduce((a, b) => a + b[1], 0) || 1;
  const COLORS = ['var(--series-2)', 'var(--series-1)', 'var(--series-3)', 'var(--series-4)', 'var(--series-7)', 'var(--series-5)'];

  let acc = 0;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-[132px] w-[132px] shrink-0" role="img" aria-label="سهم انواع اتلاف">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--grid)" strokeWidth="18" />
        {byKind.map(([kind, value], i) => {
          const frac = value / total;
          const dash = `${frac * C - 2} ${C - frac * C + 2}`;
          const rotation = (acc / total) * 360 - 90;
          acc += value;
          return (
            <circle
              key={kind}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="18"
              strokeDasharray={dash}
              transform={`rotate(${rotation} 70 70)`}
            />
          );
        })}
        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="num"
          style={{ fill: 'var(--text-muted)', fontSize: 10 }}
        >
          سهم اتلاف
        </text>
        <text
          x="70"
          y="82"
          textAnchor="middle"
          className="num"
          style={{ fill: 'var(--ink)', fontSize: 13, fontWeight: 700 }}
        >
          {mode === 'hours' ? `${faNum(total, 1)} ساعت` : tomanShort(total)}
        </text>
      </svg>
      <ul className="flex min-w-[170px] flex-1 flex-col gap-2">
        {byKind.map(([kind, value], i) => (
          <li key={kind} className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {WASTE_KIND_LABEL[kind]}
            </span>
            <span className="num text-muted">{faNum((value / total) * 100, 0)}٪</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
