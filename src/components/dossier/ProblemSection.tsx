/** بخش ۲ پرونده — تبیین اصطکاک و صورت‌بندی مسئله. */

import { useState } from 'react';
import {
  CONSEQUENCES,
  EVIDENCE_LABEL,
  EVIDENCE_NOTE,
  FRICTIONS,
  WHY_SPECIALIZED,
  type EvidenceLevel,
} from '../../lib/content/problem';
import { SectionShell } from '../layout/SectionShell';
import { Badge, Button, Note, cx } from '../ui/primitives';
import { Reveal, RevealGroup, RevealItem } from '../ui/motion';
import { faNum } from '../../lib/format';

const EVIDENCE_TONE: Record<EvidenceLevel, 'ok' | 'indigo' | 'warn' | 'outline'> = {
  observation: 'ok',
  hypothesis: 'indigo',
  assumption: 'warn',
  logical: 'outline',
};

export const EvidenceTag = ({ level }: { level: EvidenceLevel }) => (
  <Badge tone={EVIDENCE_TONE[level]} className="shrink-0">
    {EVIDENCE_LABEL[level]}
  </Badge>
);

const SIDE_LABEL = { seller: 'فروشنده', buyer: 'خریدار', both: 'هر دو سمت' } as const;

export const ProblemSection = () => {
  const [filter, setFilter] = useState<'all' | 'seller' | 'buyer' | 'both'>('all');
  const [openId, setOpenId] = useState<string | null>('f2');

  const shown = FRICTIONS.filter((f) => filter === 'all' || f.whoFeelsIt === filter);

  return (
    <SectionShell
      id="problem"
      index={2}
      eyebrow="الزام پایه ۲ — صورت‌بندی مسئله"
      title="هشت اصطکاک وضع موجود، و اینکه هر یک را از کجا می‌دانیم"
      lead="هر اصطکاک با برچسب سطح اطمینان آمده است: مشاهده میدانی، فرضیه کسب‌وکار، فرض نیازمند اعتبارسنجی، یا استنتاج منطقی. این تفکیک عامدانه است؛ ارائه همه گزاره‌ها با یک لحن قطعی، تحلیل را غیرقابل دفاع می‌کند."
    >
      {/* راهنمای سطوح اطمینان */}
      <Reveal>
        <div className="mb-7 grid gap-2.5 rounded-card border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(EVIDENCE_LABEL) as EvidenceLevel[]).map((lv) => (
            <div key={lv} className="flex flex-col gap-1.5">
              <EvidenceTag level={lv} />
              <p className="text-[11.5px] leading-6 text-muted">{EVIDENCE_NOTE[lv]}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* فیلتر سمت بازار */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-muted">نمایش اصطکاک‌های:</span>
        {([
          ['all', 'همه'],
          ['buyer', 'خریدار'],
          ['seller', 'فروشنده'],
          ['both', 'هر دو سمت'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cx(
              'rounded-lg border px-3 py-1 text-[12.5px] transition-colors',
              filter === key
                ? 'border-indigo-700 bg-indigo-100 text-indigo-900'
                : 'border-line bg-surface text-body hover:bg-raised',
            )}
          >
            {label}
          </button>
        ))}
        <span className="num ms-auto text-[12px] text-muted">{faNum(shown.length)} مورد</span>
      </div>

      <RevealGroup className="flex flex-col gap-2.5">
        {shown.map((f) => {
          const open = openId === f.id;
          return (
            <RevealItem key={f.id}>
              <article
                className={cx(
                  'overflow-hidden rounded-card border transition-colors',
                  open ? 'border-indigo-700/40 bg-surface' : 'border-line bg-surface hover:border-line-strong',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : f.id)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-start"
                >
                  <span
                    aria-hidden
                    className={cx(
                      'mt-1 h-2 w-2 shrink-0 rounded-full',
                      open ? 'bg-madder-600' : 'bg-line-strong',
                    )}
                  />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[14.5px] font-semibold text-ink">{f.title}</span>
                      <Badge tone="outline">{SIDE_LABEL[f.whoFeelsIt]}</Badge>
                    </span>
                    {!open && (
                      <span className="mt-1 block max-w-reading text-[12.5px] leading-7 text-muted">
                        {f.statement.slice(0, 110)}…
                      </span>
                    )}
                  </span>
                  <EvidenceTag level={f.evidence} />
                </button>

                {open && (
                  <div className="grid gap-5 border-t border-line px-4 py-4 lg:grid-cols-[1.3fr_1fr]">
                    <div>
                      <p className="label-eyebrow mb-1.5">وضع موجود</p>
                      <p className="text-[13px] leading-8 text-body">{f.statement}</p>
                    </div>
                    <div className="rounded-lg border border-line bg-raised p-3.5">
                      <p className="label-eyebrow mb-1.5">پاسخ تارنو</p>
                      <p className="text-[12.5px] leading-7 text-body">{f.response}</p>
                      {f.mvpAnchor ? (
                        <p className="mt-2.5 border-t border-line pt-2 text-[11.5px] text-indigo-700">
                          ردپا در MVP: {f.mvpAnchor}
                        </p>
                      ) : (
                        <p className="mt-2.5 border-t border-line pt-2 text-[11.5px] text-muted">
                          این اصطکاک در فاز ۱ پیاده‌سازی مستقیمی ندارد.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            </RevealItem>
          );
        })}
      </RevealGroup>

      {/* پیامدها */}
      <Reveal>
        <h3 className="mb-4 mt-12 font-display text-[23px] font-bold text-ink">
          پیامدهای اقتصادی و عملیاتی
        </h3>
      </Reveal>
      <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {CONSEQUENCES.map((c) => (
          <RevealItem key={c.id} className="h-full">
            <div className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-4">
              <Badge tone={c.side === 'بازار' ? 'outline' : c.side === 'فروشنده' ? 'madder' : 'indigo'}>
                {c.side}
              </Badge>
              <p className="text-[13.5px] font-semibold text-ink">{c.title}</p>
              <p className="text-[12px] leading-7 text-muted">{c.body}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-card border border-line bg-surface p-5">
            <h4 className="mb-3 text-[15px] font-bold text-ink">چرا راه‌حل باید تخصصی باشد؟</h4>
            <ol className="flex flex-col gap-3">
              {WHY_SPECIALIZED.map((w, i) => (
                <li key={i} className="flex gap-3 text-[12.5px] leading-7 text-body">
                  <span className="num shrink-0 font-bold text-indigo-700">{faNum(i + 1)}.</span>
                  <span>{w}</span>
                </li>
              ))}
            </ol>
          </div>
          <Note kind="honest" title="مرز ادعا در این بخش">
            هیچ عدد آماری درباره «اندازه بازار موجودی مازاد» یا «درصد پارچه راکد» در این پرونده
            ارائه نشده است، چون منبع قابل استنادی برای آن در اختیار نداریم. ادعاهای این بخش
            درباره <strong>وجود</strong> اصطکاک است، نه <strong>اندازه</strong> آن. اندازه‌گیری،
            کار بخش اعتبارسنجی میدانی است.
            <span className="mt-3 block">
              <Button variant="ghost" size="sm" onClick={() => document.getElementById('validation')?.scrollIntoView({ behavior: 'smooth' })}>
                رفتن به چارچوب اعتبارسنجی
              </Button>
            </span>
          </Note>
        </div>
      </Reveal>
    </SectionShell>
  );
};
