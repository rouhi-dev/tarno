/**
 * SC-01 (سناریوی پایه فاز ۱) — ثبت شناسنامه فنی موجودی مازاد.
 *
 * نکته طراحی: فیلدهای فنی بر اساس دسته انتخابی ساخته می‌شوند؛ همین وابستگی،
 * تمایز «شناسنامه فنی استاندارد» را از یک فرم آگهی عمومی جدا می‌کند.
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store/StoreProvider';
import { createListing } from '../../lib/domain/services';
import { SPEC_LABELS, validateListingDraft } from '../../lib/domain/validation';
import type { FabricSpecs, QualityGrade, SpecKey } from '../../lib/domain/types';
import { fabricSwatch, type WeavePattern } from '../../lib/store/swatch';
import {
  Badge,
  Button,
  Checkbox,
  Field,
  FormError,
  Input,
  Note,
  Textarea,
  cx,
} from '../../components/ui/primitives';
import { faNum, parseNum, toman } from '../../lib/format';

const NUMERIC_SPECS: SpecKey[] = ['width', 'gsm', 'rollLength', 'rubCycles'];

/** پالت نمونه بافت — به جای آپلود تصویر واقعی در محیط دمو. */
const SWATCHES: { label: string; base: string; thread: string; pattern: WeavePattern }[] = [
  { label: 'نیلی ساده', base: '#2c3b63', thread: '#1b2745', pattern: 'plain' },
  { label: 'سرمه‌ای سرژه', base: '#2a3a55', thread: '#16233a', pattern: 'twill' },
  { label: 'شکسته ریب', base: '#efeae0', thread: '#d8d0c2', pattern: 'rib' },
  { label: 'خاکی دابی', base: '#b9a88c', thread: '#8d7a5e', pattern: 'dobby' },
  { label: 'طوسی ملانژ', base: '#8d9196', thread: '#5f646b', pattern: 'melange' },
  { label: 'زرشکی ساده', base: '#7a2230', thread: '#51151f', pattern: 'plain' },
  { label: 'زیتونی ساده', base: '#5c6b4a', thread: '#44502f', pattern: 'plain' },
  { label: 'کرم راه‌راه', base: '#e3d6bd', thread: '#a8402f', pattern: 'stripe' },
];

const GRADES: { value: QualityGrade; label: string; hint: string }[] = [
  { value: 'A', label: 'درجه A', hint: 'بدون ایراد اعلامی' },
  { value: 'B', label: 'درجه B', hint: 'ایراد جزئی — توصیف الزامی' },
  { value: 'C', label: 'درجه C', hint: 'ایراد مشخص — توصیف الزامی' },
];

export const NewListing = () => {
  const { db, currentUser, run, notify } = useStore();
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [qualityGrade, setQualityGrade] = useState<QualityGrade | ''>('');
  const [defects, setDefects] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [negotiable, setNegotiable] = useState(true);
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [fireRetardant, setFireRetardant] = useState(false);
  const [pickedSwatch, setPickedSwatch] = useState<number[]>([0]);
  const [submitForReview, setSubmitForReview] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  const category = db.categories.find((c) => c.id === categoryId);

  /** ساخت ورودی اعتبارسنجی از وضعیت فرم */
  const draft = useMemo(() => {
    const specsRecord: Record<string, string | number | boolean | undefined> = {};
    if (category) {
      for (const k of [...category.requiredSpecs, ...category.optionalSpecs]) {
        if (k === 'fireRetardant') {
          specsRecord[k] = fireRetardant;
          continue;
        }
        const raw = specs[k];
        if (raw === undefined || raw.trim() === '') continue;
        specsRecord[k] = NUMERIC_SPECS.includes(k) ? parseNum(raw) : raw;
      }
    }
    return {
      title,
      categoryId,
      description,
      totalQuantity: parseNum(totalQuantity),
      minOrderQuantity: parseNum(minOrderQuantity),
      pricePerUnit: parseNum(pricePerUnit),
      qualityGrade,
      defects,
      province,
      city,
      negotiable,
      specs: specsRecord,
      imageCount: pickedSwatch.length,
    };
  }, [
    title,
    categoryId,
    description,
    totalQuantity,
    minOrderQuantity,
    pricePerUnit,
    qualityGrade,
    defects,
    province,
    city,
    negotiable,
    specs,
    fireRetardant,
    pickedSwatch.length,
    category,
  ]);

  const liveErrors = useMemo(
    () => (touched ? validateListingDraft(draft, category).errors : {}),
    [draft, category, touched],
  );
  const shown = { ...liveErrors, ...errors };

  if (!currentUser || currentUser.role !== 'seller')
    return (
      <Note kind="warn" title="دسترسی محدود">
        ثبت آگهی تنها با نقش فروشنده امکان‌پذیر است.{' '}
        <Link to="/mvp/login" className="text-indigo-700 underline">
          ورود با حساب فروشنده
        </Link>
      </Note>
    );

  const estimatedValue =
    Number.isFinite(draft.totalQuantity) && Number.isFinite(draft.pricePerUnit)
      ? draft.totalQuantity * draft.pricePerUnit
      : 0;

  const submit = () => {
    setTouched(true);
    const typedSpecs: FabricSpecs = {};
    if (category) {
      for (const k of [...category.requiredSpecs, ...category.optionalSpecs]) {
        if (k === 'fireRetardant') {
          typedSpecs.fireRetardant = fireRetardant;
          continue;
        }
        const raw = specs[k];
        if (raw === undefined || raw.trim() === '') continue;
        if (NUMERIC_SPECS.includes(k)) {
          (typedSpecs[k] as number | undefined) = parseNum(raw);
        } else {
          (typedSpecs[k] as string | undefined) = raw.trim();
        }
      }
    }

    const images = pickedSwatch.map((idx, i) => ({
      src: fabricSwatch(SWATCHES[idx].base, SWATCHES[idx].thread, SWATCHES[idx].pattern),
      caption: i === 0 ? 'نمونه بافت و شید رنگ' : SWATCHES[idx].label,
      isDefectEvidence: false,
    }));

    const res = run((current) =>
      createListing(current, currentUser.id, {
        ...draft,
        specsTyped: typedSpecs,
        images,
        submitForReview,
      }),
    );

    if (!res.ok) {
      setErrors(res.errors);
      notify({
        tone: 'error',
        title: 'آگهی ثبت نشد',
        detail: `${faNum(Object.keys(res.errors).length)} خطای اعتبارسنجی — فیلدهای مشخص‌شده را اصلاح کنید.`,
      });
      return;
    }

    notify({
      tone: 'success',
      title: `آگهی ${res.data.code} ثبت شد`,
      detail: submitForReview
        ? 'آگهی برای داوری مدیر سامانه ارسال شد. با حساب admin@tarno.ir آن را تأیید کنید.'
        : 'آگهی به صورت پیش‌نویس ذخیره شد.',
    });
    navigate('/mvp/seller');
  };

  const specField = (key: SpecKey, required: boolean) => {
    if (key === 'fireRetardant')
      return (
        <div key={key} className="flex items-end pb-2">
          <Checkbox
            id={`spec-${key}`}
            label={SPEC_LABELS[key]}
            checked={fireRetardant}
            onChange={setFireRetardant}
            hint="گواهی ضد شعله دارد"
          />
        </div>
      );
    const isNum = NUMERIC_SPECS.includes(key);
    return (
      <Field
        key={key}
        label={SPEC_LABELS[key]}
        htmlFor={`spec-${key}`}
        required={required}
        error={shown[`specs.${key}`]}
      >
        <Input
          id={`spec-${key}`}
          inputMode={isNum ? 'numeric' : 'text'}
          value={specs[key] ?? ''}
          invalid={!!shown[`specs.${key}`]}
          onChange={(e) => setSpecs((s) => ({ ...s, [key]: e.target.value }))}
          placeholder={
            key === 'fiber'
              ? 'مثلاً: ۱۰۰٪ ویسکوز'
              : key === 'width'
                ? '۱۵۰'
                : key === 'gsm'
                  ? '۱۳۵'
                  : key === 'rubCycles'
                    ? '۴۵۰۰۰'
                    : undefined
          }
        />
      </Field>
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
      <div className="flex flex-col gap-5">
        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="text-[17px] font-bold text-ink">ثبت شناسنامه فنی موجودی مازاد</h2>
          <p className="mt-1.5 max-w-reading text-[12.5px] leading-7 text-muted">
            ابتدا دسته پارچه را انتخاب کنید؛ فیلدهای فنی الزامی بر اساس همان دسته ساخته می‌شوند.
            برای پارچه مبلمان «چرخه سایش» و برای پارچه پوشاک «گراماژ و کاربرد» الزامی است.
          </p>
        </div>

        <FormError message={shown._form} />

        {/* گام ۱ — دسته */}
        <section className="rounded-card border border-line bg-surface p-5">
          <p className="label-eyebrow mb-3">گام ۱ — دسته پارچه</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {db.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategoryId(c.id);
                  setSpecs({});
                }}
                className={cx(
                  'flex flex-col gap-1 rounded-lg border p-3 text-start transition-colors',
                  categoryId === c.id
                    ? 'border-indigo-700 bg-indigo-100'
                    : 'border-line bg-surface hover:border-line-strong',
                )}
              >
                <span className="text-[13px] font-semibold text-ink">{c.title}</span>
                <span className="text-[11px] leading-6 text-muted">{c.description}</span>
                <span className="num mt-1 text-[10.5px] text-indigo-700">
                  واحد: {c.unit === 'meter' ? 'متر' : 'کیلوگرم'} · {faNum(c.requiredSpecs.length)} فیلد
                  الزامی
                </span>
              </button>
            ))}
          </div>
          {shown.categoryId && (
            <p role="alert" className="mt-2 text-[12px] text-danger">
              {shown.categoryId}
            </p>
          )}
        </section>

        {/* گام ۲ — معرفی */}
        <section className="rounded-card border border-line bg-surface p-5">
          <p className="label-eyebrow mb-4">گام ۲ — معرفی موجودی</p>
          <div className="flex flex-col gap-4">
            <Field
              label="عنوان آگهی"
              htmlFor="l-title"
              required
              error={shown.title}
              hint="بین ۵ تا ۹۰ نویسه؛ علت مازاد بودن را ذکر کنید."
            >
              <Input
                id="l-title"
                value={title}
                invalid={!!shown.title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="مثلاً: کرپ ویسکوز نیلی — باقی‌مانده سفارش تولید"
              />
            </Field>
            <Field
              label="توضیح وضعیت موجودی"
              htmlFor="l-desc"
              required
              error={shown.description}
              hint="حداقل ۲۰ نویسه — تعداد طاقه، متراژ هر طاقه و شرایط تحویل را بنویسید."
            >
              <Textarea
                id="l-desc"
                value={description}
                invalid={!!shown.description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="مثلاً: باقی‌مانده سفارش تولید مانتو بهاره در ۹ طاقه ۳۰ تا ۴۵ متری؛ تحویل از انبار یزد."
              />
            </Field>
          </div>
        </section>

        {/* گام ۳ — مشخصات فنی */}
        {category && (
          <section className="rounded-card border border-line bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="label-eyebrow">گام ۳ — مشخصات فنی دسته «{category.title}»</p>
              <Badge tone="indigo">
                {faNum(category.requiredSpecs.length)} فیلد الزامی ·{' '}
                {faNum(category.optionalSpecs.length)} اختیاری
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.requiredSpecs.map((k) => specField(k, true))}
            </div>
            {category.optionalSpecs.length > 0 && (
              <>
                <p className="mb-3 mt-5 border-t border-line pt-4 text-[12px] font-medium text-muted">
                  فیلدهای اختیاری
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.optionalSpecs.map((k) => specField(k, false))}
                </div>
              </>
            )}
          </section>
        )}

        {/* گام ۴ — مقدار و قیمت */}
        <section className="rounded-card border border-line bg-surface p-5">
          <p className="label-eyebrow mb-4">گام ۴ — مقدار، قیمت و شرایط فروش</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={`موجودی کل (${category?.unit === 'kilogram' ? 'کیلوگرم' : 'متر'})`}
              htmlFor="l-total"
              required
              error={shown.totalQuantity}
            >
              <Input
                id="l-total"
                inputMode="numeric"
                value={totalQuantity}
                invalid={!!shown.totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="۳۲۰۰"
              />
            </Field>
            <Field
              label="حداقل سفارش"
              htmlFor="l-moq"
              required
              error={shown.minOrderQuantity}
              hint="نمی‌تواند از موجودی کل بیشتر باشد."
            >
              <Input
                id="l-moq"
                inputMode="numeric"
                value={minOrderQuantity}
                invalid={!!shown.minOrderQuantity}
                onChange={(e) => setMinOrderQuantity(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="۱۰۰"
              />
            </Field>
            <Field label="قیمت واحد (تومان)" htmlFor="l-price" required error={shown.pricePerUnit}>
              <Input
                id="l-price"
                inputMode="numeric"
                value={pricePerUnit}
                invalid={!!shown.pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="۱۴۸۰۰۰"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Checkbox
              id="l-neg"
              label="قیمت قابل مذاکره است"
              checked={negotiable}
              onChange={setNegotiable}
              hint="در پاسخ به درخواست خرید می‌توانید قیمت نهایی متفاوتی پیشنهاد کنید."
            />
          </div>
        </section>

        {/* گام ۵ — کیفیت */}
        <section className="rounded-card border border-line bg-surface p-5">
          <p className="label-eyebrow mb-4">گام ۵ — درجه کیفی و اعلام ایراد</p>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {GRADES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => {
                  setQualityGrade(g.value);
                  setTouched(true);
                }}
                className={cx(
                  'flex flex-col gap-0.5 rounded-lg border p-3 text-start transition-colors',
                  qualityGrade === g.value
                    ? 'border-indigo-700 bg-indigo-100'
                    : 'border-line bg-surface hover:border-line-strong',
                )}
              >
                <span className="text-[13px] font-semibold text-ink">{g.label}</span>
                <span className="text-[11px] text-muted">{g.hint}</span>
              </button>
            ))}
          </div>
          {shown.qualityGrade && (
            <p role="alert" className="mb-3 text-[12px] text-danger">
              {shown.qualityGrade}
            </p>
          )}
          <Field
            label="توصیف ایرادها و محدودیت‌ها"
            htmlFor="l-defects"
            required={qualityGrade === 'B' || qualityGrade === 'C'}
            error={shown.defects}
            hint={
              qualityGrade === 'B' || qualityGrade === 'C'
                ? 'برای درجه B و C الزامی است: نوع ایراد و متراژ درگیر را بنویسید.'
                : 'برای درجه A اختیاری است؛ خالی بودن آن یعنی «بدون ایراد اعلام‌شده».'
            }
          >
            <Textarea
              id="l-defects"
              value={defects}
              invalid={!!shown.defects}
              onChange={(e) => setDefects(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="مثلاً: اختلاف نیم شید رنگ در ۲ طاقه (حدود ۴۸۰ متر)؛ بافت و کشش سالم است."
            />
          </Field>
        </section>

        {/* گام ۶ — موقعیت و تصویر */}
        <section className="rounded-card border border-line bg-surface p-5">
          <p className="label-eyebrow mb-4">گام ۶ — محل تحویل و تصویر</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="استان" htmlFor="l-prov" required error={shown.province}>
              <Input
                id="l-prov"
                value={province}
                invalid={!!shown.province}
                onChange={(e) => setProvince(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="یزد"
              />
            </Field>
            <Field label="شهر" htmlFor="l-city" required error={shown.city}>
              <Input
                id="l-city"
                value={city}
                invalid={!!shown.city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="یزد"
              />
            </Field>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[13px] font-medium text-ink">
              نمونه بافت <span className="text-madder-600">*</span>
            </p>
            <p className="mb-3 text-[11.5px] leading-6 text-muted">
              در محیط دمو، به جای بارگذاری عکس واقعی، نمونه بافت را از پالت زیر انتخاب می‌کنید؛
              تصویر به صورت SVG تولید و در لایه داده ذخیره می‌شود. حداقل یک نمونه الزامی است.
            </p>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((s, i) => {
                const picked = pickedSwatch.includes(i);
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() =>
                      setPickedSwatch((prev) =>
                        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                      )
                    }
                    aria-pressed={picked}
                    className={cx(
                      'overflow-hidden rounded-lg border-2 transition-colors',
                      picked ? 'border-indigo-700' : 'border-line hover:border-line-strong',
                    )}
                  >
                    <img
                      src={fabricSwatch(s.base, s.thread, s.pattern)}
                      alt={s.label}
                      className="h-14 w-20 object-cover"
                    />
                    <span className="block bg-surface px-1 py-0.5 text-[10px] text-muted">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {shown.images && (
              <p role="alert" className="mt-2 text-[12px] text-danger">
                {shown.images}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ستون کنار: خلاصه و ثبت */}
      <div className="flex flex-col gap-4">
        <div className="sticky top-24 flex flex-col gap-4">
          <div className="rounded-card border border-line bg-surface p-4">
            <p className="label-eyebrow mb-3">خلاصه آگهی</p>
            <dl className="flex flex-col gap-2 text-[12.5px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">دسته</dt>
                <dd className="text-ink">{category?.title ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">موجودی کل</dt>
                <dd className="num text-ink">
                  {Number.isFinite(draft.totalQuantity) ? faNum(draft.totalQuantity) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">قیمت واحد</dt>
                <dd className="num text-ink">
                  {Number.isFinite(draft.pricePerUnit) ? toman(draft.pricePerUnit) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-line pt-2">
                <dt className="text-muted">ارزش کل موجودی</dt>
                <dd className="num font-semibold text-indigo-700">
                  {estimatedValue > 0 ? toman(estimatedValue) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">تصاویر انتخاب‌شده</dt>
                <dd className="num text-ink">{faNum(pickedSwatch.length)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-card border border-line bg-surface p-4">
            <Checkbox
              id="l-review"
              label="ارسال برای داوری مدیر سامانه"
              checked={submitForReview}
              onChange={setSubmitForReview}
              hint="اگر غیرفعال باشد، آگهی به صورت پیش‌نویس ذخیره می‌شود و در بازارگاه دیده نمی‌شود."
            />
            <Button size="lg" className="mt-4 w-full" onClick={submit}>
              ثبت آگهی
            </Button>
            {touched && Object.keys(liveErrors).length > 0 && (
              <p className="mt-2 text-[11.5px] text-danger">
                {faNum(Object.keys(liveErrors).length)} فیلد نیازمند اصلاح است.
              </p>
            )}
          </div>

          <Note kind="info" title="قواعد اعتبارسنجی این فرم">
            موجودی و قیمت باید مثبت باشند؛ حداقل سفارش نمی‌تواند از موجودی کل بیشتر باشد؛ عرض باید
            بین ۲۰ و ۴۰۰ سانتی‌متر و گراماژ بین ۲۰ و ۱۲۰۰ باشد؛ و درجه B یا C بدون توصیف ایراد ثبت
            نمی‌شود.
          </Note>
        </div>
      </div>
    </div>
  );
};
