/** بخش ۹ پرونده — تحلیل رقبا و جایگزین‌های سنتی. */

import { useState } from 'react';
import {
  COMPARISON_AXES,
  COMPETITORS,
  KIND_LABEL,
  KNOWLEDGE_LABEL,
  MATRIX,
  MATRIX_CAVEAT,
  POSITIONING_CONCLUSION,
  SUPPORT_LABEL,
  type CompetitorKind,
  type Support,
} from '../../lib/content/competitors';
import { SectionShell } from '../layout/SectionShell';
import { Badge, Note, cx } from '../ui/primitives';
import { Reveal, RevealGroup, RevealItem } from '../ui/motion';
import { faNum } from '../../lib/format';

const SUPPORT_CELL: Record<Support, { cls: string; mark: string }> = {
  yes: { cls: 'bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-ok', mark: '✓' },
  partial: { cls: 'bg-[color-mix(in_srgb,var(--warn)_16%,transparent)] text-warn', mark: '~' },
  none: { cls: 'bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger', mark: '×' },
  unknown: { cls: 'bg-raised text-muted', mark: '؟' },
};

const KIND_TONE: Record<CompetitorKind, 'madder' | 'indigo' | 'outline'> = {
  direct: 'madder',
  indirect: 'indigo',
  traditional: 'outline',
};

const ROWS = [
  { id: 'tarno', name: 'تارنو (این پروژه)' },
  ...COMPETITORS.map((c) => ({ id: c.id, name: c.name })),
];

export const CompetitorsSection = () => {
  const [openId, setOpenId] = useState<string | null>('nasajit');
  const unknownCount = Object.values(MATRIX)
    .flatMap((row) => Object.values(row))
    .filter((v) => v === 'unknown').length;

  return (
    <SectionShell
      id="competitors"
      index={9}
      eyebrow="تحلیل رقبا و جایگزین‌ها"
      title="رقیب اصلی تارنو یک سایت نیست؛ تلفن و شبکه ارتباطی شخصی است"
      lead="این تحلیل سه دسته را از هم جدا می‌کند: رقیب مستقیم بالقوه، رقیب غیرمستقیم و جایگزین سنتی. قاعده نگارش آن صریح است: هیچ قابلیتی برای رقیب ساخته یا نفی نشده و برای هر مورد، یک «کار راستی‌آزمایی» مشخص تعریف شده است."
    >
      {/* ماتریس */}
      <Reveal>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[16px] font-bold text-ink">ماتریس مقایسه قابلیت‌ها</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SUPPORT_CELL) as Support[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
                <span
                  aria-hidden
                  className={cx(
                    'flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-bold',
                    SUPPORT_CELL[s].cls,
                  )}
                >
                  {SUPPORT_CELL[s].mark}
                </span>
                {SUPPORT_LABEL[s]}
              </span>
            ))}
          </div>
        </div>

        <div className="thin-scroll overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
            <caption className="sr-only">ماتریس مقایسه تارنو با رقبا و جایگزین‌های سنتی</caption>
            <thead>
              <tr className="border-b border-line bg-raised">
                <th scope="col" className="p-3 text-start font-semibold text-ink">
                  گزینه
                </th>
                {COMPARISON_AXES.map((a) => (
                  <th key={a.id} scope="col" className="p-3 text-center font-medium text-body">
                    <span className="block">{a.title}</span>
                    <span className="mt-0.5 block text-[10.5px] font-normal leading-5 text-muted">
                      {a.why}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.id}
                  className={cx(
                    'border-b border-line last:border-0',
                    row.id === 'tarno' && 'bg-indigo-100',
                  )}
                >
                  <th scope="row" className="p-3 text-start font-semibold text-ink">
                    {row.name}
                  </th>
                  {COMPARISON_AXES.map((a) => {
                    const v = MATRIX[row.id]?.[a.id] ?? 'unknown';
                    return (
                      <td key={a.id} className="p-2 text-center">
                        <span
                          className={cx(
                            'mx-auto flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-bold',
                            SUPPORT_CELL[v].cls,
                          )}
                          title={SUPPORT_LABEL[v]}
                        >
                          {SUPPORT_CELL[v].mark}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <Note kind="honest" title={`${faNum(unknownCount)} خانه «نامعلوم» — و چرا این درست است`}>
            {MATRIX_CAVEAT}
          </Note>
        </div>
      </Reveal>

      {/* کارت رقبا */}
      <Reveal>
        <h3 className="mb-4 mt-10 font-display text-[23px] font-bold text-ink">
          پرونده هر گزینه، با پرسش‌های باز و کار راستی‌آزمایی
        </h3>
      </Reveal>

      <RevealGroup className="flex flex-col gap-2.5">
        {COMPETITORS.map((c) => {
          const open = openId === c.id;
          return (
            <RevealItem key={c.id}>
              <article className={cx('rounded-card border bg-surface', open ? 'border-indigo-700/40' : 'border-line')}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : c.id)}
                  aria-expanded={open}
                  className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5 text-start"
                >
                  <span className="text-[15px] font-bold text-ink">{c.name}</span>
                  <Badge tone={KIND_TONE[c.kind]}>{KIND_LABEL[c.kind]}</Badge>
                  <Badge tone={c.knowledge === 'needs-verification' ? 'warn' : 'neutral'}>
                    {KNOWLEDGE_LABEL[c.knowledge]}
                  </Badge>
                  <span className="ms-auto text-[11.5px] text-muted">
                    هم‌پوشانی با دامنه موجودی مازاد:{' '}
                    {{ high: 'بالا', partial: 'نسبی', low: 'کم', unknown: 'نامعلوم' }[c.surplusOverlap]}
                  </span>
                  <span aria-hidden className="text-[16px] text-muted">
                    {open ? '−' : '+'}
                  </span>
                </button>

                {open && (
                  <div className="border-t border-line px-4 py-4">
                    <p className="mb-4 max-w-[86ch] text-[13px] leading-8 text-body">{c.positioning}</p>
                    <div className="grid gap-4 lg:grid-cols-4">
                      <div>
                        <p className="label-eyebrow mb-1.5">مشتری هدف</p>
                        <p className="text-[12px] leading-7 text-body">{c.targetCustomer}</p>
                        <p className="label-eyebrow mb-1.5 mt-3">تمرکز محصول</p>
                        <p className="text-[12px] leading-7 text-body">{c.productFocus}</p>
                      </div>
                      <div className="rounded-lg border border-ok/30 bg-[color-mix(in_srgb,var(--ok)_6%,transparent)] p-3">
                        <p className="label-eyebrow mb-1.5">نقاط قوت در برابر تارنو</p>
                        <ul className="flex flex-col gap-1.5">
                          {c.strengths.map((s, i) => (
                            <li key={i} className="text-[12px] leading-7 text-body">
                              — {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-warn/30 bg-[color-mix(in_srgb,var(--warn)_7%,transparent)] p-3">
                        <p className="label-eyebrow mb-1.5">پرسش‌های باز (نه ادعای ضعف)</p>
                        <ul className="flex flex-col gap-1.5">
                          {c.openQuestions.map((q, i) => (
                            <li key={i} className="text-[12px] leading-7 text-body">
                              ؟ {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-indigo-700/25 bg-indigo-100 p-3">
                        <p className="label-eyebrow mb-1.5">کار راستی‌آزمایی فاز ۲</p>
                        <p className="text-[12px] leading-7 text-body">{c.verificationTask}</p>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </RevealItem>
          );
        })}
      </RevealGroup>

      {/* جمع‌بندی موضع */}
      <Reveal>
        <div className="mt-8 rounded-card border border-line bg-surface p-5">
          <h3 className="mb-4 text-[16px] font-bold text-ink">جمع‌بندی موضع رقابتی</h3>
          <ol className="flex flex-col gap-3">
            {POSITIONING_CONCLUSION.map((p, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-8 text-body">
                <span className="num shrink-0 font-bold text-indigo-700">{faNum(i + 1)}</span>
                <span className="max-w-[86ch]">{p}</span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </SectionShell>
  );
};
