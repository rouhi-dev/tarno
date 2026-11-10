/** بخش ۶ پرونده — ارزیابی ایده با پرسش‌های هشت‌گانه درس. */

import { useState } from 'react';
import { MATURE_IDEA } from '../../lib/content/matureIdea';
import { SectionShell } from '../layout/SectionShell';
import { EvidenceTag } from './ProblemSection';
import { Badge, cx } from '../ui/primitives';
import { Reveal } from '../ui/motion';
import { faNum } from '../../lib/format';

const TONE_LABEL = {
  positive: 'پاسخ روشن',
  conditional: 'مشروط',
  cautious: 'با احتیاط',
} as const;

const TONE_BADGE = {
  positive: 'ok',
  conditional: 'indigo',
  cautious: 'warn',
} as const;

export const MatureIdeaSection = () => {
  const [openId, setOpenId] = useState<string>('q1');

  return (
    <SectionShell
      id="mature-idea"
      index={6}
      eyebrow="الزام پایه ۳ — ارزیابی ایده بالغ"
      title="هشت پرسش درس، با تفکیک «می‌دانیم» از «فرض کرده‌ایم»"
      lead="برای هر پرسش، پاسخ کوتاه و استدلال آن آمده و سپس سه ستون جدا می‌شود: آنچه می‌دانیم، آنچه فرض کرده‌ایم، و آنچه باید اعتبارسنجی شود. ستون سوم به فرضیه‌های ابزار اعتبارسنجی گره خورده است."
    >
      <div className="flex flex-col gap-3">
        {MATURE_IDEA.map((a) => {
          const open = openId === a.id;
          return (
            <Reveal key={a.id}>
              <article
                className={cx(
                  'overflow-hidden rounded-card border bg-surface transition-colors',
                  open ? 'border-indigo-700/45' : 'border-line hover:border-line-strong',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? '' : a.id)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-4 px-5 py-4 text-start"
                >
                  <span
                    className={cx(
                      'num mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[14px] font-bold',
                      open ? 'bg-indigo-900 text-white' : 'bg-raised text-indigo-700',
                    )}
                  >
                    {faNum(a.index)}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15px] font-semibold leading-7 text-ink">
                      {a.question}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge tone={TONE_BADGE[a.verdictTone]}>{TONE_LABEL[a.verdictTone]}</Badge>
                      <EvidenceTag level={a.evidence} />
                      {a.hypothesisIds.map((h) => (
                        <span key={h} className="num text-[11px] text-muted">
                          {h}
                        </span>
                      ))}
                    </span>
                    <span className="mt-2 block max-w-reading text-[13px] font-medium leading-7 text-madder-600">
                      {a.verdict}
                    </span>
                  </span>
                  <span aria-hidden className="mt-1 shrink-0 text-[18px] text-muted">
                    {open ? '−' : '+'}
                  </span>
                </button>

                {open && (
                  <div className="border-t border-line px-5 py-5">
                    <p className="label-eyebrow mb-2">استدلال</p>
                    <ol className="mb-5 flex flex-col gap-2.5">
                      {a.reasoning.map((r, i) => (
                        <li key={i} className="flex gap-3 text-[13px] leading-8 text-body">
                          <span className="num shrink-0 font-semibold text-indigo-500">
                            {faNum(i + 1)}
                          </span>
                          <span className="max-w-[78ch]">{r}</span>
                        </li>
                      ))}
                    </ol>

                    <div className="grid gap-3 lg:grid-cols-3">
                      {[
                        { title: 'آنچه می‌دانیم', items: a.known, tone: 'ok' as const },
                        { title: 'آنچه فرض کرده‌ایم', items: a.assumed, tone: 'warn' as const },
                        { title: 'آنچه باید اعتبارسنجی شود', items: a.toValidate, tone: 'indigo' as const },
                      ].map((col) => (
                        <div
                          key={col.title}
                          className={cx(
                            'flex flex-col gap-2 rounded-lg border p-3.5',
                            col.tone === 'ok'
                              ? 'border-ok/30 bg-[color-mix(in_srgb,var(--ok)_6%,transparent)]'
                              : col.tone === 'warn'
                                ? 'border-warn/30 bg-[color-mix(in_srgb,var(--warn)_7%,transparent)]'
                                : 'border-indigo-700/25 bg-indigo-100',
                          )}
                        >
                          <p className="text-[12.5px] font-semibold text-ink">{col.title}</p>
                          <ul className="flex flex-col gap-2">
                            {col.items.map((it, i) => (
                              <li key={i} className="flex gap-2 text-[12px] leading-7 text-body">
                                <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-45" />
                                {it}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
};
