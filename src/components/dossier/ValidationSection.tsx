/**
 * مورد مزیت‌بخش ۳ — گزارش اعتبارسنجی اولیه مبتنی بر مصاحبه میدانی.
 *
 * رویکرد صادقانه: تا این لحظه مصاحبه‌ای انجام نشده است، پس این بخش «نتیجه»
 * ارائه نمی‌کند؛ بلکه ابزار زنده ثبت و تحلیل مصاحبه + پروتکل اجرا + پرسش‌نامه
 * قابل چاپ است. رکوردهای پیش‌فرض با برچسب «نمونه قالب» از یافته‌های میدانی
 * تفکیک شده‌اند و در شمارش نتیجه محاسبه نمی‌شوند.
 */

import { useMemo, useState } from 'react';
import {
  analyzeHypotheses,
  HYPOTHESES,
  MIN_DECIDED_FOR_VERDICT,
  OUTCOME_LABEL,
  PROTOCOL,
  QUESTIONNAIRE,
  VALIDATION_STATUS,
  type HypothesisOutcome,
} from '../../lib/content/validation';
import { addInterview, removeInterview } from '../../lib/domain/services';
import { useStore } from '../../lib/store/StoreProvider';
import { SectionShell } from '../layout/SectionShell';
import { Badge, Button, Field, FormError, Input, Note, Select, Textarea, cx } from '../ui/primitives';
import { Reveal } from '../ui/motion';
import { faNum, faDate, parseNum } from '../../lib/format';

const STATUS_TONE: Record<HypothesisOutcome['status'], 'ok' | 'danger' | 'warn' | 'neutral'> = {
  supported: 'ok',
  rejected: 'danger',
  inconclusive: 'warn',
  'no-data': 'neutral',
};

const KIND_LABEL = {
  hypothesis: 'فرضیه',
  observation: 'مشاهده',
  assumption: 'فرض',
} as const;

const SIDE_LABEL = { seller: 'فروشنده', buyer: 'خریدار', both: 'هر دو' } as const;

export const ValidationSection = () => {
  const { db, run, notify } = useStore();
  const [onlyReal, setOnlyReal] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const fieldCount = db.interviews.filter((i) => i.provenance === 'field-recorded').length;
  const sampleCount = db.interviews.filter((i) => i.provenance === 'template-sample').length;

  const outcomes = useMemo(() => analyzeHypotheses(db.interviews, onlyReal), [db.interviews, onlyReal]);

  /* ----------------------------- فرم ثبت مصاحبه ----------------------------- */
  const [form, setForm] = useState({
    alias: '',
    side: 'buyer' as 'buyer' | 'seller' | 'both',
    businessType: '',
    city: '',
    hoursPerDeal: '',
    notes: '',
  });
  const [verdicts, setVerdicts] = useState<Record<string, 'support' | 'reject' | 'unclear'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setForm({ alias: '', side: 'buyer', businessType: '', city: '', hoursPerDeal: '', notes: '' });
    setVerdicts({});
    setErrors({});
  };

  const submit = () => {
    const hours = form.hoursPerDeal.trim() === '' ? null : parseNum(form.hoursPerDeal);
    const res = run((current) =>
      addInterview(current, {
        alias: form.alias,
        side: form.side,
        businessType: form.businessType,
        city: form.city,
        date: new Date().toISOString(),
        verdicts,
        hoursPerDeal: hours,
        notes: form.notes,
      }),
    );
    if (!res.ok) {
      setErrors(res.errors);
      notify({ tone: 'error', title: 'ثبت مصاحبه انجام نشد', detail: 'خطاهای فرم را بررسی کنید.' });
      return;
    }
    notify({
      tone: 'success',
      title: 'مصاحبه ثبت شد',
      detail: 'وضعیت فرضیه‌ها بر اساس پاسخ‌های تازه بازمحاسبه شد.',
    });
    resetForm();
    setShowForm(false);
  };

  const dropSamples = () => {
    for (const s of db.interviews.filter((i) => i.provenance === 'template-sample')) {
      run((current) => removeInterview(current, s.id));
    }
    notify({ tone: 'info', title: 'رکوردهای نمونه قالب حذف شدند' });
  };

  return (
    <SectionShell
      id="validation"
      index={5}
      tone="raised"
      eyebrow="مورد مزیت‌بخش — اعتبارسنجی میدانی"
      title="چارچوب و ابزار اعتبارسنجی: فرضیه‌ها پیش از داده اعلام شده‌اند"
      lead="برای پرهیز از تفسیر دلبخواهی نتیجه، نُه فرضیه با آستانه پذیرش عددی مشخص، پیش از جمع‌آوری داده ثبت شده‌اند. ابزار زیر زنده است: هر مصاحبه را ثبت می‌کنید و وضعیت فرضیه‌ها بی‌درنگ بازمحاسبه می‌شود."
    >
      {/* اعلان وضعیت */}
      <Reveal>
        <div className="mb-7 rounded-card border-2 border-warn/40 bg-surface p-5">
          <div className="flex flex-wrap items-start gap-4">
            <Badge tone="warn">وضعیت: اجرا نشده</Badge>
            <div className="min-w-[260px] flex-1">
              <h3 className="text-[16px] font-bold text-ink">{VALIDATION_STATUS.headline}</h3>
              <p className="mt-1.5 max-w-reading text-[13px] leading-8 text-body">
                {VALIDATION_STATUS.body}
              </p>
              <p className="mt-2 text-[12.5px] leading-7 text-indigo-700">{VALIDATION_STATUS.nextStep}</p>
            </div>
            <div className="flex shrink-0 gap-6 border-s border-line ps-5">
              <div className="flex flex-col">
                <span className="text-[11px] text-muted">یافته میدانی ثبت‌شده</span>
                <span className="num text-[26px] font-bold text-ink">{faNum(fieldCount)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-muted">نمونه قالب (داده واقعی نیست)</span>
                <span className="num text-[26px] font-bold text-muted">{faNum(sampleCount)}</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ابزار */}
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* جدول فرضیه‌ها */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[16px] font-bold text-ink">وضعیت نُه فرضیه</h3>
            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-body">
              <input
                type="checkbox"
                id="only-real"
                checked={onlyReal}
                onChange={(e) => setOnlyReal(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[var(--indigo-700)]"
              />
              فقط رکوردهای میدانی را محاسبه کن
            </label>
          </div>

          <ul className="flex flex-col gap-2.5">
            {outcomes.map((o) => (
              <li key={o.hypothesis.id}>
                <div className="rounded-card border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="num rounded bg-indigo-900 px-1.5 py-0.5 text-[11px] font-bold text-white">
                          {o.hypothesis.id}
                        </span>
                        <Badge tone="outline">{KIND_LABEL[o.hypothesis.kind]}</Badge>
                        <Badge tone="neutral">{SIDE_LABEL[o.hypothesis.side]}</Badge>
                      </div>
                      <p className="text-[13px] leading-7 text-ink">{o.hypothesis.statement}</p>
                      <p className="text-[11.5px] leading-6 text-muted">
                        پرسش سنجش: «{o.hypothesis.probe}»
                      </p>
                    </div>
                    <div className="flex w-[150px] shrink-0 flex-col gap-2">
                      <Badge tone={STATUS_TONE[o.status]}>{OUTCOME_LABEL[o.status]}</Badge>
                      <div
                        className="flex h-2 gap-[2px] overflow-hidden rounded-sm"
                        style={{ background: 'var(--grid)' }}
                        role="img"
                        aria-label={`تأیید ${o.support}، رد ${o.reject}، نامشخص ${o.unclear}`}
                      >
                        {o.support > 0 && (
                          <span
                            style={{
                              width: `${(o.support / Math.max(1, o.support + o.reject + o.unclear)) * 100}%`,
                              background: 'var(--series-3)',
                            }}
                          />
                        )}
                        {o.reject > 0 && (
                          <span
                            style={{
                              width: `${(o.reject / Math.max(1, o.support + o.reject + o.unclear)) * 100}%`,
                              background: 'var(--series-8)',
                            }}
                          />
                        )}
                        {o.unclear > 0 && (
                          <span
                            style={{
                              width: `${(o.unclear / Math.max(1, o.support + o.reject + o.unclear)) * 100}%`,
                              background: 'var(--series-4)',
                            }}
                          />
                        )}
                      </div>
                      <p className="num text-[11px] leading-5 text-muted">
                        تأیید {faNum(o.support)} · رد {faNum(o.reject)} · نامشخص {faNum(o.unclear)}
                      </p>
                      <p className="num text-[11px] text-muted">
                        آستانه پذیرش: {faNum(o.hypothesis.acceptThreshold * 100, 0)}٪
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Note kind="info" title="قاعده صدور حکم">
            یک فرضیه تنها وقتی «تأییدشده» یا «ردشده» اعلام می‌شود که حداقل{' '}
            {faNum(MIN_DECIDED_FOR_VERDICT)} پاسخ مشخص (تأیید یا رد) داشته باشد و نسبت تأیید از
            آستانه اعلام‌شده بگذرد. در غیر این صورت وضعیت «بی‌نتیجه» می‌ماند — و این یک پاسخ معتبر
            است، نه نقص گزارش.
          </Note>
        </div>

        {/* ستون کناری: ثبت مصاحبه + پروتکل */}
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[14.5px] font-bold text-ink">ثبت مصاحبه میدانی</h3>
              <Button size="sm" variant={showForm ? 'quiet' : 'primary'} onClick={() => setShowForm((v) => !v)}>
                {showForm ? 'بستن' : 'مصاحبه جدید'}
              </Button>
            </div>

            {!showForm ? (
              <p className="mt-2 text-[12px] leading-7 text-muted">
                پس از هر مصاحبه، پاسخ‌ها را اینجا ثبت کنید. داده در حافظه مرورگر پایدار می‌ماند و
                با بازخوانی صفحه از بین نمی‌رود. هیچ داده هویتی ثبت نمی‌شود؛ فقط کد مستعار.
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <FormError message={errors._form} />
                <Field label="کد مستعار مصاحبه‌شونده" htmlFor="itv-alias" required error={errors.alias}>
                  <Input
                    id="itv-alias"
                    value={form.alias}
                    invalid={!!errors.alias}
                    placeholder="مثلاً: ف-۰۱"
                    onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
                  />
                </Field>
                <Field label="سمت بازار" htmlFor="itv-side">
                  <Select
                    id="itv-side"
                    value={form.side}
                    onChange={(e) => setForm((f) => ({ ...f, side: e.target.value as typeof form.side }))}
                  >
                    <option value="buyer">خریدار</option>
                    <option value="seller">فروشنده</option>
                    <option value="both">هر دو</option>
                  </Select>
                </Field>
                <Field label="نوع کسب‌وکار" htmlFor="itv-type" required error={errors.businessType}>
                  <Input
                    id="itv-type"
                    value={form.businessType}
                    invalid={!!errors.businessType}
                    placeholder="مثلاً: کارگاه تولید پوشاک"
                    onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
                  />
                </Field>
                <Field label="شهر" htmlFor="itv-city" required error={errors.city}>
                  <Input
                    id="itv-city"
                    value={form.city}
                    invalid={!!errors.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </Field>
                <Field
                  label="تخمین مصاحبه‌شونده از زمان یک معامله (ساعت)"
                  htmlFor="itv-hours"
                  error={errors.hoursPerDeal}
                  hint="اختیاری — اگر پاسخ مشخصی نداد خالی بگذارید."
                >
                  <Input
                    id="itv-hours"
                    inputMode="numeric"
                    value={form.hoursPerDeal}
                    invalid={!!errors.hoursPerDeal}
                    onChange={(e) => setForm((f) => ({ ...f, hoursPerDeal: e.target.value }))}
                  />
                </Field>

                <div className="flex flex-col gap-2 rounded-lg border border-line bg-raised p-3">
                  <p className="label-eyebrow">پاسخ به فرضیه‌ها</p>
                  {HYPOTHESES.map((h) => (
                    <div key={h.id} className="flex items-center justify-between gap-2">
                      <span className="num text-[11.5px] text-body">{h.id}</span>
                      <div className="flex gap-1">
                        {([
                          ['support', 'تأیید'],
                          ['reject', 'رد'],
                          ['unclear', 'نامشخص'],
                        ] as const).map(([v, l]) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() =>
                              setVerdicts((prev) => {
                                const next = { ...prev };
                                if (next[h.id] === v) delete next[h.id];
                                else next[h.id] = v;
                                return next;
                              })
                            }
                            className={cx(
                              'rounded border px-2 py-0.5 text-[11px] transition-colors',
                              verdicts[h.id] === v
                                ? v === 'support'
                                  ? 'border-ok bg-ok/10 text-ok'
                                  : v === 'reject'
                                    ? 'border-danger bg-danger/10 text-danger'
                                    : 'border-warn bg-warn/10 text-warn'
                                : 'border-line bg-surface text-muted hover:border-line-strong',
                            )}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-[10.5px] leading-5 text-muted">
                    فرضیه‌هایی که در مصاحبه مطرح نشدند را خالی بگذارید.
                  </p>
                </div>

                <Field label="یادداشت و نقل‌قول کلیدی" htmlFor="itv-notes">
                  <Textarea
                    id="itv-notes"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="عین جمله مصاحبه‌شونده را ثبت کنید؛ تفسیر را جدا بنویسید."
                  />
                </Field>

                <div className="flex gap-2">
                  <Button onClick={submit}>ثبت مصاحبه</Button>
                  <Button variant="quiet" onClick={resetForm}>
                    پاک کردن فرم
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* فهرست رکوردها */}
          <div className="rounded-card border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-[14.5px] font-bold text-ink">رکوردهای ثبت‌شده</h3>
              {sampleCount > 0 && (
                <Button size="sm" variant="danger" onClick={dropSamples}>
                  حذف نمونه‌های قالب
                </Button>
              )}
            </div>
            {db.interviews.length === 0 ? (
              <p className="text-[12px] leading-7 text-muted">هیچ رکوردی ثبت نشده است.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {db.interviews.map((itv) => (
                  <li key={itv.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-ink">{itv.alias}</span>
                        {itv.provenance === 'template-sample' ? (
                          <Badge tone="warn">نمونه قالب</Badge>
                        ) : (
                          <Badge tone="ok">یافته میدانی</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        {SIDE_LABEL[itv.side]} · {itv.businessType} · {itv.city} · {faDate(itv.date)}
                      </p>
                      {itv.notes && <p className="mt-1 text-[11.5px] leading-6 text-body">{itv.notes}</p>}
                    </div>
                    <span className="num shrink-0 text-[11px] text-muted">
                      {faNum(Object.keys(itv.verdicts).length)} پاسخ
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* پروتکل */}
      <Reveal>
        <h3 className="mb-4 mt-12 font-display text-[23px] font-bold text-ink">پروتکل اجرای مصاحبه</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(PROTOCOL).map((block) => (
            <div key={block.title} className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
              <h4 className="text-[14px] font-semibold text-ink">{block.title}</h4>
              <ul className="flex flex-col gap-2">
                {block.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-[12px] leading-7 text-body">
                    <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>

      {/* پرسش‌نامه */}
      <Reveal>
        <div className="mt-6 rounded-card border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[16px] font-bold text-ink">پرسش‌نامه میدانی</h3>
              <p className="mt-1 text-[12px] text-muted">
                پنج بخش، با رعایت قاعده «ایده را تا پایان بخش دو معرفی نکن».
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowQuestionnaire((v) => !v)}>
              {showQuestionnaire ? 'بستن پرسش‌نامه' : 'نمایش پرسش‌نامه'}
            </Button>
          </div>

          {showQuestionnaire && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {QUESTIONNAIRE.map((block) => (
                <div key={block.section} className="flex flex-col gap-2">
                  <p className="text-[12.5px] font-semibold text-indigo-700">{block.section}</p>
                  <ol className="flex flex-col gap-1.5">
                    {block.items.map((q, i) => (
                      <li key={i} className="flex gap-2 text-[12px] leading-7 text-body">
                        <span className="num shrink-0 text-muted">{faNum(i + 1)}.</span>
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </SectionShell>
  );
};
