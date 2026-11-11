/** بخش ۷ پرونده — طبقه‌بندی ایده و مرزبندی فرایندهای برخط و فیزیکی. */

import { useState } from 'react';
import {
  BOUNDARY_INSIGHT,
  CLASSIFICATION,
  PHASE1_LABEL,
  PROCESS_BOUNDARY,
  WHY_ECOMMERCE,
  ZONE_LABEL,
  type ProcessZone,
} from '../../lib/content/classification';
import { SectionShell } from '../layout/SectionShell';
import { Badge, Note, cx } from '../ui/primitives';
import { Reveal, RevealGroup, RevealItem } from '../ui/motion';
import { faNum } from '../../lib/format';

const ZONE_STYLE: Record<ProcessZone, { bar: string; badge: 'indigo' | 'warn' | 'madder' }> = {
  online: { bar: 'bg-indigo-700', badge: 'indigo' },
  hybrid: { bar: 'bg-warn', badge: 'warn' },
  offline: { bar: 'bg-madder-600', badge: 'madder' },
};

const PHASE_TONE = {
  implemented: 'ok',
  simulated: 'warn',
  'out-of-scope': 'neutral',
} as const;

export const ClassificationSection = () => {
  const [zoneFilter, setZoneFilter] = useState<ProcessZone | 'all'>('all');
  const steps = PROCESS_BOUNDARY.filter((s) => zoneFilter === 'all' || s.zone === zoneFilter);
  const counts = {
    online: PROCESS_BOUNDARY.filter((s) => s.zone === 'online').length,
    hybrid: PROCESS_BOUNDARY.filter((s) => s.zone === 'hybrid').length,
    offline: PROCESS_BOUNDARY.filter((s) => s.zone === 'offline').length,
  };

  return (
    <SectionShell
      id="classification"
      index={7}
      eyebrow="الزام پایه ۴ — طبقه‌بندی و مرزبندی"
      title="تارنو چه نوع کسب‌وکاری است و مرز دیجیتال آن کجا تمام می‌شود؟"
      lead="بخش دوم این لوح مهم‌تر از بخش اول است: نشان می‌دهد از دوازده گام یک معامله، کدام‌ها واقعاً برخط می‌شوند، کدام‌ها ترکیبی می‌مانند و کدام‌ها ناگزیر فیزیکی‌اند."
    >
      {/* طبقه‌بندی */}
      <RevealGroup className="mb-10 grid gap-4 lg:grid-cols-3">
        <RevealItem className="h-full">
          <div className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-5">
            <p className="label-eyebrow">نوع ایده</p>
            <p className="font-display text-[22px] font-bold text-ink">{CLASSIFICATION.ideaType.label}</p>
            <p className="text-[12.5px] leading-7 text-body">{CLASSIFICATION.ideaType.reason}</p>
          </div>
        </RevealItem>
        <RevealItem className="h-full">
          <div className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-5">
            <p className="label-eyebrow">نوع تجارت الکترونیکی</p>
            <p className="font-display text-[20px] font-bold leading-8 text-ink">
              {CLASSIFICATION.commerceType.label}
            </p>
            <p className="text-[12.5px] leading-7 text-body">{CLASSIFICATION.commerceType.reason}</p>
          </div>
        </RevealItem>
        <RevealItem className="h-full">
          <div className="flex h-full flex-col gap-2 rounded-card border border-madder-600/25 bg-madder-100 p-5">
            <p className="label-eyebrow">مالکیت کالا و ریسک</p>
            <p className="text-[12.5px] leading-7 text-body">{CLASSIFICATION.revenueOwnership}</p>
          </div>
        </RevealItem>
      </RevealGroup>

      {/* چرا تجارت الکترونیک */}
      <Reveal>
        <h3 className="mb-4 font-display text-[23px] font-bold text-ink">
          چرا این کسب‌وکار «تجارت الکترونیکی» است؟
        </h3>
        <div className="mb-10 grid gap-3 lg:grid-cols-3">
          {WHY_ECOMMERCE.map((w, i) => (
            <div key={w.title} className="flex gap-3 rounded-card border border-line bg-surface p-4">
              <span className="num shrink-0 text-[26px] font-bold leading-none text-line-strong">
                {faNum(i + 1)}
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{w.title}</p>
                <p className="mt-1 text-[12.5px] leading-7 text-body">{w.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* مرزبندی فرایند */}
      <Reveal>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-[23px] font-bold text-ink">
              دوازده گام یک معامله: برخط، ترکیبی، فیزیکی
            </h3>
            <p className="mt-1.5 text-[12.5px] text-muted">
              روی نوار رنگی کلیک کنید تا فقط همان نوع گام نمایش داده شود.
            </p>
          </div>
          <div className="flex gap-2">
            {([
              ['all', `همه (${faNum(PROCESS_BOUNDARY.length)})`],
              ['online', `${ZONE_LABEL.online} (${faNum(counts.online)})`],
              ['hybrid', `${ZONE_LABEL.hybrid} (${faNum(counts.hybrid)})`],
              ['offline', `${ZONE_LABEL.offline} (${faNum(counts.offline)})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setZoneFilter(key as ProcessZone | 'all')}
                className={cx(
                  'rounded-lg border px-3 py-1 text-[12px] transition-colors',
                  zoneFilter === key
                    ? 'border-indigo-700 bg-indigo-100 text-indigo-900'
                    : 'border-line bg-surface text-body hover:bg-raised',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* نوار سهم سه ناحیه */}
      <Reveal>
        <div className="mb-6 flex h-4 gap-[2px] overflow-hidden rounded-[3px]">
          <div
            className="flex items-center justify-center bg-indigo-700 text-[10px] text-white"
            style={{ width: `${(counts.online / PROCESS_BOUNDARY.length) * 100}%` }}
          >
            {ZONE_LABEL.online}
          </div>
          <div
            className="flex items-center justify-center bg-warn text-[10px] text-white"
            style={{ width: `${(counts.hybrid / PROCESS_BOUNDARY.length) * 100}%` }}
          >
            {ZONE_LABEL.hybrid}
          </div>
          <div
            className="flex items-center justify-center bg-madder-600 text-[10px] text-white"
            style={{ width: `${(counts.offline / PROCESS_BOUNDARY.length) * 100}%` }}
          >
            {ZONE_LABEL.offline}
          </div>
        </div>
      </Reveal>

      <RevealGroup className="flex flex-col gap-2">
        {steps.map((s) => (
          <RevealItem key={s.id}>
            <div className="flex items-stretch gap-0 overflow-hidden rounded-card border border-line bg-surface">
              <div className={cx('w-1.5 shrink-0', ZONE_STYLE[s.zone].bar)} />
              <div className="flex flex-1 flex-wrap items-center gap-3 px-4 py-3">
                <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-raised text-[12px] font-bold text-muted">
                  {faNum(s.order)}
                </span>
                <div className="min-w-[200px] flex-1">
                  <p className="text-[13.5px] font-semibold text-ink">{s.title}</p>
                  <p className="mt-0.5 text-[12px] leading-6 text-muted">{s.note}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="outline">{s.actor}</Badge>
                  <Badge tone={ZONE_STYLE[s.zone].badge}>{ZONE_LABEL[s.zone]}</Badge>
                  <Badge tone={PHASE_TONE[s.inPhase1]}>{PHASE1_LABEL[s.inPhase1]}</Badge>
                </div>
              </div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal>
        <div className="mt-6">
          <Note kind="honest" title="نتیجه مرزبندی برای طراحی محصول">
            {BOUNDARY_INSIGHT}
          </Note>
        </div>
      </Reveal>
    </SectionShell>
  );
};
