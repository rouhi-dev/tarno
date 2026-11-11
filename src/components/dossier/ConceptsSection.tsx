/** بخش ۸ پرونده — انطباق با مفاهیم فصل ۱ کتاب مرجع درس. */

import { useState } from 'react';
import { EC_FEATURES, EC_VS_EB, RICHNESS_DENSITY } from '../../lib/content/concepts';
import { SectionShell } from '../layout/SectionShell';
import { Badge, Note, cx } from '../ui/primitives';
import { Reveal, RevealGroup, RevealItem } from '../ui/motion';
import { faNum } from '../../lib/format';

const STRENGTH_LABEL = { high: 'نقش پررنگ', medium: 'نقش متوسط', low: 'نقش محدود' } as const;
const STRENGTH_DOTS = { high: 3, medium: 2, low: 1 } as const;

export const ConceptsSection = () => {
  const [activeId, setActiveId] = useState<string>('richness');
  const active = EC_FEATURES.find((f) => f.id === activeId) ?? EC_FEATURES[0];

  return (
    <SectionShell
      id="concepts"
      index={8}
      tone="raised"
      eyebrow="کاربرد منابع درس — فصل ۱ کتاب مرجع"
      title="مفاهیم فصل یک، روی بدن همین محصول"
      lead="هر مفهوم با سه چیز همراه شده است: تجلی آن در تارنو، محدودیت واقع‌بینانه آن در این کسب‌وکار، و ردپای آن در MVP. ستون محدودیت عامدانه آمده است؛ ادعای تحقق کامل هر هشت ویژگی در یک محصول فاز‌اولی، قابل دفاع نیست."
    >
      {/* تجارت الکترونیک vs کسب‌وکار الکترونیک */}
      <Reveal>
        <div className="mb-10 grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
          {[EC_VS_EB.ecommerce, EC_VS_EB.ebusiness].map((block, i) => (
            <div
              key={block.title}
              className={cx(
                'flex flex-col gap-3 rounded-card border p-5',
                i === 0 ? 'border-indigo-700/30 bg-indigo-100' : 'border-line bg-surface',
              )}
            >
              <h3 className="text-[16px] font-bold text-ink">{block.title}</h3>
              <p className="text-[12.5px] leading-7 text-body">{block.definition}</p>
              <ul className="mt-auto flex flex-col gap-1.5 border-t border-line pt-3">
                {block.examples.map((ex) => (
                  <li key={ex} className="flex gap-2 text-[12px] leading-6 text-body">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Note kind="info" title="آزمون تشخیص مرز">
            {EC_VS_EB.boundaryNote}
          </Note>
        </div>
      </Reveal>

      {/* هشت ویژگی */}
      <Reveal>
        <h3 className="mb-4 font-display text-[23px] font-bold text-ink">
          ویژگی‌های هشت‌گانه فناوری تجارت الکترونیک
        </h3>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
        <RevealGroup className="flex flex-col gap-2">
          {EC_FEATURES.map((f) => {
            const isActive = f.id === activeId;
            return (
              <RevealItem key={f.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(f.id)}
                  aria-current={isActive}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start transition-colors',
                    isActive
                      ? 'border-indigo-700 bg-surface'
                      : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <span className="flex-1">
                    <span className="block text-[13.5px] font-semibold text-ink">{f.title}</span>
                    <span className="block text-[11px] tracking-wide text-muted">{f.latin}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1" aria-label={STRENGTH_LABEL[f.strength]}>
                    {[1, 2, 3].map((i) => (
                      <span
                        key={i}
                        aria-hidden
                        className={cx(
                          'h-1.5 w-1.5 rounded-full',
                          i <= STRENGTH_DOTS[f.strength] ? 'bg-indigo-700' : 'bg-line',
                        )}
                      />
                    ))}
                  </span>
                </button>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Reveal key={active.id} y={8}>
          <article className="flex h-full flex-col gap-4 rounded-card border border-line bg-surface p-5">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <h4 className="font-display text-[24px] font-bold text-ink">{active.title}</h4>
                <p className="text-[12px] tracking-wide text-muted">{active.latin}</p>
              </div>
              <Badge tone={active.strength === 'high' ? 'ok' : active.strength === 'medium' ? 'indigo' : 'warn'}>
                {STRENGTH_LABEL[active.strength]}
              </Badge>
            </header>

            <div>
              <p className="label-eyebrow mb-1.5">تعریف مفهوم</p>
              <p className="text-[13px] leading-8 text-body">{active.meaning}</p>
            </div>
            <div>
              <p className="label-eyebrow mb-1.5">تجلی در تارنو</p>
              <p className="text-[13px] leading-8 text-body">{active.inTarno}</p>
            </div>
            <div className="rounded-lg border border-warn/30 bg-[color-mix(in_srgb,var(--warn)_7%,transparent)] p-3.5">
              <p className="label-eyebrow mb-1.5">محدودیت واقع‌بینانه</p>
              <p className="text-[12.5px] leading-7 text-body">{active.limit}</p>
            </div>
            <div className="mt-auto border-t border-line pt-3">
              <p className="label-eyebrow mb-1">ردپا در MVP</p>
              <p className="text-[12px] text-indigo-700">
                {active.mvpTrace ?? 'در فاز ۱ پیاده‌سازی مستقیمی ندارد.'}
              </p>
            </div>
          </article>
        </Reveal>
      </div>

      {/* غنا و تراکم */}
      <Reveal>
        <div className="mt-10 rounded-card border border-line bg-surface p-5">
          <h3 className="mb-2 font-display text-[22px] font-bold text-ink">
            {RICHNESS_DENSITY.tradeoffTitle}
          </h3>
          <p className="max-w-[80ch] text-[13px] leading-8 text-body">{RICHNESS_DENSITY.tradeoffBody}</p>

          {/* نمودار شکست بده‌بستان */}
          <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
            <figure className="rounded-lg border border-line bg-raised p-4">
              <svg viewBox="0 0 280 200" className="h-auto w-full" role="img" aria-label="نمودار بده‌بستان غنا و گستره اطلاعات">
                <line x1="40" y1="165" x2="258" y2="165" stroke="var(--line-strong)" strokeWidth="1.2" />
                <line x1="40" y1="165" x2="40" y2="18" stroke="var(--line-strong)" strokeWidth="1.2" />
                <text x="150" y="186" textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 10 }}>
                  گستره مخاطب
                </text>
                <text x="12" y="92" style={{ fill: 'var(--text-muted)', fontSize: 10 }} transform="rotate(-90 18 92)">
                  غنای اطلاعات
                </text>
                {/* مرز سنتی */}
                <path d="M48 32 C110 44, 150 120, 250 158" fill="none" stroke="var(--series-2)" strokeWidth="2" strokeDasharray="5 4" />
                <text x="118" y="60" style={{ fill: 'var(--series-2)', fontSize: 9.5 }}>
                  مرز سنتی
                </text>
                {/* نقاط */}
                <g>
                  <circle cx="62" cy="40" r="5" fill="var(--series-2)" />
                  <text x="72" y="38" style={{ fill: 'var(--text-body)', fontSize: 9.5 }}>بازدید حضوری</text>
                  <circle cx="232" cy="150" r="5" fill="var(--series-4)" />
                  <text x="150" y="146" style={{ fill: 'var(--text-body)', fontSize: 9.5 }}>آگهی متنی عمومی</text>
                  <circle cx="214" cy="52" r="6.5" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />
                  <text x="128" y="48" style={{ fill: 'var(--series-1)', fontSize: 10, fontWeight: 700 }}>
                    شناسنامه تارنو
                  </text>
                </g>
              </svg>
              <figcaption className="mt-2 text-[11px] leading-6 text-muted">
                موقعیت‌ها مفهومی‌اند و مقیاس عددی ندارند؛ نمودار فقط نشان می‌دهد شناسنامه فنی
                ساختاریافته، هم‌زمان غنی و گسترده است.
              </figcaption>
            </figure>

            <div>
              <p className="label-eyebrow mb-3">پنج اثر تراکم اطلاعات در تارنو — دو لبه آن</p>
              <ul className="flex flex-col gap-2.5">
                {RICHNESS_DENSITY.densityEffects.map((d, i) => (
                  <li
                    key={d.id}
                    className={cx(
                      'flex gap-3 rounded-lg border p-3.5',
                      d.beneficiary.includes('ریسک')
                        ? 'border-madder-600/30 bg-madder-100'
                        : 'border-line bg-raised',
                    )}
                  >
                    <span className="num shrink-0 text-[13px] font-bold text-indigo-700">
                      {faNum(i + 1)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-ink">{d.title}</p>
                        <Badge tone={d.beneficiary.includes('ریسک') ? 'madder' : 'outline'}>
                          {d.beneficiary}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[12.5px] leading-7 text-body">{d.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
};
