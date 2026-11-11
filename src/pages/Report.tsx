/**
 * گزارش فنی — شناسنامه سناریوها، مدل داده، نتیجه آزمون‌ها و چک‌لیست انطباق
 * با الزامات فاز ۱ صورت پروژه.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { STUDENT } from '../lib/content/brand';
import { OUT_OF_SCOPE, SCENARIOS } from '../lib/content/scenarios';
import { TEST_CASES, TEST_SUMMARY, type TestCase } from '../lib/content/tests';
import { Badge, Button, Note, Stat, cx } from '../components/ui/primitives';
import { Reveal } from '../components/ui/motion';
import { faNum } from '../lib/format';

/* ------------------------------- مدل داده ------------------------------- */

const ENTITIES = [
  {
    name: 'User',
    purpose: 'حساب کاربری و نقش (فروشنده، خریدار، مدیر سامانه)',
    keyFields: ['id', 'role', 'email', 'businessProfileId'],
    relations: '۱ به ۱ با BusinessProfile؛ ۱ به چند با FabricListing و PurchaseRequest',
  },
  {
    name: 'BusinessProfile',
    purpose: 'هویت کسب‌وکار: نام، نوع فعالیت، استان و شهر',
    keyFields: ['id', 'ownerUserId', 'businessName', 'businessType', 'verified'],
    relations: 'متعلق به یک User',
  },
  {
    name: 'FabricCategory',
    purpose: 'دسته پارچه + تعیین فیلدهای فنی الزامی و اختیاری همان دسته',
    keyFields: ['id', 'slug', 'unit', 'requiredSpecs[]', 'optionalSpecs[]'],
    relations: '۱ به چند با FabricListing',
  },
  {
    name: 'FabricListing',
    purpose: 'شناسنامه فنی موجودی مازاد + دفتر موجودی سه‌بخشی',
    keyFields: [
      'code',
      'specs',
      'totalQuantity',
      'availableQuantity',
      'reservedQuantity',
      'soldQuantity',
      'minOrderQuantity',
      'qualityGrade',
      'status',
    ],
    relations: 'متعلق به User (فروشنده) و FabricCategory؛ ۱ به چند با ListingImage و InventoryTransaction',
  },
  {
    name: 'ListingImage',
    purpose: 'تصاویر آگهی، با نشان اختصاصی «مستند ایراد»',
    keyFields: ['listingId', 'src', 'isDefectEvidence', 'order'],
    relations: 'متعلق به یک FabricListing',
  },
  {
    name: 'PurchaseRequest',
    purpose: 'درخواست خرید با مقدار، قیمت لحظه ثبت و وضعیت چرخه مذاکره',
    keyFields: ['code', 'listingId', 'buyerId', 'quantity', 'status', 'rejectionReason'],
    relations: 'به FabricListing، User و (در صورت پذیرش) PriceOffer و Order وصل می‌شود',
  },
  {
    name: 'PriceOffer',
    purpose: 'پیشنهاد قیمت و مقدار نهایی فروشنده',
    keyFields: ['requestId', 'unitPrice', 'quantity', 'note'],
    relations: 'متعلق به یک PurchaseRequest',
  },
  {
    name: 'Order',
    purpose: 'سفارش ایجادشده پس از تأیید خریدار؛ نقطه رزرو موجودی',
    keyFields: ['code', 'requestId', 'quantity', 'unitPrice', 'totalAmount', 'status'],
    relations: '۱ به ۱ با PurchaseRequest؛ ۱ به چند با Payment و OrderHistory',
  },
  {
    name: 'Payment',
    purpose: 'تراکنش پرداخت شبیه‌سازی‌شده (درگاه ساختگی)',
    keyFields: ['orderId', 'amount', 'gateway', 'status', 'reference', 'failureReason'],
    relations: 'متعلق به یک Order',
  },
  {
    name: 'InventoryTransaction',
    purpose: 'دفتر حسابرسی موجودی: initial / reserve / release / commit / adjust',
    keyFields: ['listingId', 'kind', 'quantity', 'snapshot', 'refType', 'refId'],
    relations: 'متعلق به یک FabricListing و ارجاع به Order یا Request',
  },
  {
    name: 'OrderHistory',
    purpose: 'تاریخچه گذار وضعیت سفارش با ثبت عامل و یادداشت',
    keyFields: ['orderId', 'from', 'to', 'actorId', 'note'],
    relations: 'متعلق به یک Order',
  },
  {
    name: 'FieldInterview',
    purpose: 'رکورد مصاحبه اعتبارسنجی با برچسب منبع (میدانی یا نمونه قالب)',
    keyFields: ['alias', 'side', 'provenance', 'verdicts', 'hoursPerDeal'],
    relations: 'مستقل؛ با شناسه فرضیه‌ها (H1…H9) پیوند دارد',
  },
];

/* ---------------------------- چک‌لیست انطباق ---------------------------- */

const CHECKLIST = [
  {
    group: 'بخش الف — الزامات پایه',
    items: [
      { req: 'صفحه فرود اولیه: عنوان کسب‌وکار، بیانیه ارزش، مخاطب هدف، دکمه‌های فراخوان', where: 'صفحه نخست', status: 'done' },
      { req: 'تبیین اصطکاک و صورت‌بندی مسئله', where: 'پرونده ← لوح ۲', status: 'done' },
      { req: 'ارزیابی ایده با پرسش‌های هشت‌گانه درس', where: 'پرونده ← لوح ۶', status: 'done' },
      { req: 'طبقه‌بندی ایده و مرزبندی فرایند برخط از فیزیکی', where: 'پرونده ← لوح ۷', status: 'done' },
      { req: 'کاربرد مفاهیم فصل ۱ کتاب مرجع (غنا و تراکم اطلاعات)', where: 'پرونده ← لوح ۸', status: 'done' },
    ],
  },
  {
    group: 'بخش الف — موارد تکمیلی و مزیت‌بخش',
    items: [
      { req: 'نمودار بصری مدل اتلاف زمان و هزینه در وضعیت سنتی', where: 'پرونده ← لوح ۳ (ماشین‌حساب تعاملی)', status: 'done' },
      { req: 'گزارش اعتبارسنجی اولیه مبتنی بر مصاحبه میدانی', where: 'پرونده ← لوح ۵', status: 'partial' },
      { req: 'نقشه سفر مشتری در وضعیت موجود', where: 'پرونده ← لوح ۴', status: 'done' },
    ],
  },
  {
    group: 'بخش ب — الزامات پایه MVP',
    items: [
      { req: 'استقرار برخط و عمومی سامانه', where: 'راهنمای استقرار در README', status: 'partial' },
      { req: 'معماری ناوبری دوگانه (پرونده / MVP)', where: 'نوار بالای همه صفحه‌ها', status: 'done' },
      { req: 'پیاده‌سازی نخستین سناریوی پایه با داده اولیه ساختگی', where: 'SC-01 + داده پایه ۱۰ آگهی', status: 'done' },
    ],
  },
  {
    group: 'الزامات مستندسازی',
    items: [
      { req: 'README.md با مشخصات، پشته فناوری، حساب‌های آزمایشی و راهنمای آزمون', where: 'ریشه مخزن', status: 'done' },
      { req: 'AI_DISCLOSURE.md', where: 'ریشه مخزن', status: 'done' },
      { req: 'پوشه docs/ با اسناد مهندسی', where: 'docs/', status: 'done' },
      { req: 'تاریخچه کامیت منظم در گیت‌هاب', where: 'تاریخچه موضوعی + برچسب v1.0-phase1', status: 'done' },
    ],
  },
];

const STATUS_BADGE = {
  done: { tone: 'ok' as const, label: 'انجام‌شده' },
  partial: { tone: 'warn' as const, label: 'انجام‌شده با قید' },
  pending: { tone: 'neutral' as const, label: 'در اختیار دانشجو' },
};

const RESULT_BADGE: Record<TestCase['result'], { tone: 'ok' | 'danger' | 'neutral'; label: string }> = {
  pass: { tone: 'ok', label: 'موفق' },
  fail: { tone: 'danger', label: 'ناموفق' },
  'not-run': { tone: 'neutral', label: 'اجرا نشده' },
};

export const Report = () => {
  const [openScenario, setOpenScenario] = useState<string>('SC-01');
  const [tab, setTab] = useState<'scenarios' | 'data' | 'tests' | 'checklist'>('scenarios');

  const TABS = [
    { key: 'scenarios', label: `شناسنامه سناریوها (${faNum(SCENARIOS.length)})` },
    { key: 'data', label: `مدل داده (${faNum(ENTITIES.length)} موجودیت)` },
    { key: 'tests', label: `موارد آزمون (${faNum(TEST_CASES.length)})` },
    { key: 'checklist', label: 'چک‌لیست انطباق فاز ۱' },
  ] as const;

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-10">
      <Reveal>
        <span className="label-eyebrow">گزارش فنی فاز ۱</span>
        <h1 className="mt-2 font-display text-[34px] font-bold leading-tight text-ink">
          سناریوها، مدل داده و نتیجه آزمون‌ها
        </h1>
        <p className="mt-3 max-w-reading text-[14px] leading-8 text-body">
          این صفحه، پیوند میان تحلیل کسب‌وکار و کد را مستند می‌کند: هر سناریو با معیار پذیرش
          Given-When-Then، مرجع خود در سورس‌کد و مسیر آزمون در سامانه آمده است.
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
          <span>
            دانشجو: <span className="font-medium text-ink">{STUDENT.name}</span>
          </span>
          <span aria-hidden>·</span>
          <span className="num">شماره دانشجویی: {STUDENT.id}</span>
          <span aria-hidden>·</span>
          <span>{STUDENT.phase}</span>
        </p>
      </Reveal>

      {/* خلاصه آزمون */}
      <Reveal>
        <div className="mt-7 grid gap-5 rounded-card border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="سناریوی پیاده‌شده" value={faNum(SCENARIOS.length)} tone="indigo" />
          <Stat label="مورد آزمون" value={faNum(TEST_CASES.length)} />
          <Stat
            label="آزمون خودکار موفق"
            value={faNum(TEST_CASES.filter((t) => t.method === 'automated' && t.result === 'pass').length)}
            tone="ok"
            sub={TEST_SUMMARY.command}
          />
          <Stat label="موجودیت مدل داده" value={faNum(ENTITIES.length)} />
        </div>
      </Reveal>

      {/* زبانه‌ها */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cx(
              'rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
              tab === t.key ? 'bg-indigo-900 text-white' : 'border border-line bg-surface text-body hover:bg-raised',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* سناریوها */}
      {tab === 'scenarios' && (
        <div className="mt-6 flex flex-col gap-3">
          {SCENARIOS.map((s) => {
            const open = openScenario === s.id;
            return (
              <article
                key={s.id}
                className={cx('rounded-card border bg-surface', open ? 'border-indigo-700/45' : 'border-line')}
              >
                <button
                  type="button"
                  onClick={() => setOpenScenario(open ? '' : s.id)}
                  aria-expanded={open}
                  className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5 text-start"
                >
                  <span className="num rounded bg-indigo-900 px-2 py-0.5 text-[11.5px] font-bold text-white">
                    {s.id}
                  </span>
                  <span className="text-[14.5px] font-semibold text-ink">{s.title}</span>
                  <Badge tone="outline">{s.role}</Badge>
                  {s.isBaseline && <Badge tone="madder">سناریوی پایه فاز ۱</Badge>}
                  <span aria-hidden className="ms-auto text-[16px] text-muted">
                    {open ? '−' : '+'}
                  </span>
                </button>

                {open && (
                  <div className="border-t border-line px-4 py-4">
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="label-eyebrow mb-1.5">هدف و ارزش تجاری</p>
                          <p className="text-[13px] leading-8 text-body">{s.businessValue}</p>
                        </div>
                        <div>
                          <p className="label-eyebrow mb-1.5">پیش‌شرط‌ها</p>
                          <ul className="flex flex-col gap-1">
                            {s.preconditions.map((p, i) => (
                              <li key={i} className="text-[12.5px] leading-7 text-body">
                                — {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="label-eyebrow mb-1.5">مسیر اصلی اقدام</p>
                          <ol className="flex flex-col gap-1.5">
                            {s.mainFlow.map((f, i) => (
                              <li key={i} className="flex gap-2 text-[12.5px] leading-7 text-body">
                                <span className="num shrink-0 font-semibold text-indigo-700">
                                  {faNum(i + 1)}.
                                </span>
                                {f}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="rounded-lg border border-warn/35 bg-[color-mix(in_srgb,var(--warn)_7%,transparent)] p-3.5">
                          <p className="label-eyebrow mb-1.5">مدیریت خطاهای مرزی</p>
                          <ul className="flex flex-col gap-1.5">
                            {s.edgeCases.map((e, i) => (
                              <li key={i} className="text-[12px] leading-7 text-body">
                                — {e}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-ok/35 bg-[color-mix(in_srgb,var(--ok)_6%,transparent)] p-3.5">
                          <p className="label-eyebrow mb-2">معیار پذیرش آزمون</p>
                          <dl className="flex flex-col gap-2 text-[12.5px] leading-7">
                            <div>
                              <dt className="font-semibold text-ink">Given (فرض اولیه)</dt>
                              <dd className="text-body">{s.acceptance.given}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-ink">When (اقدام)</dt>
                              <dd className="text-body">{s.acceptance.when}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-ink">Then (نتیجه)</dt>
                              <dd className="text-body">{s.acceptance.then}</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="rounded-lg border border-line bg-raised p-3.5">
                          <p className="label-eyebrow mb-1.5">مرجع در سورس‌کد</p>
                          <p dir="ltr" className="text-[11.5px] leading-6 text-body">
                            {s.sourceRef}
                          </p>
                          <p className="label-eyebrow mb-1.5 mt-3">مسیر آزمون در سامانه</p>
                          <p className="text-[12px] leading-6 text-indigo-700">{s.testPath}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          <div className="mt-2">
            <Note kind="honest" title="مرز دامنه سناریوها">
              صورت پروژه برای فاز ۱ «پیاده‌سازی نخستین سناریوی پایه» را خواسته است. سناریوی پایه
              این تحویل SC-01 است و شش سناریوی دیگر برای بسته شدن یک چرخه تجاری کامل و قابل آزمون
              اضافه شده‌اند. گسترش به ۱۰ سناریوی مستقل، تحویل‌دادنی فاز ۴ است و عامدانه در این فاز
              انجام نشده.
            </Note>
          </div>
        </div>
      )}

      {/* مدل داده */}
      {tab === 'data' && (
        <div className="mt-6 flex flex-col gap-5">
          <div className="thin-scroll overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[840px] text-[12.5px]">
              <caption className="sr-only">موجودیت‌های مدل داده تارنو</caption>
              <thead>
                <tr className="border-b border-line bg-raised text-muted">
                  <th scope="col" className="p-3 text-start font-medium">موجودیت</th>
                  <th scope="col" className="p-3 text-start font-medium">نقش</th>
                  <th scope="col" className="p-3 text-start font-medium">فیلدهای کلیدی</th>
                  <th scope="col" className="p-3 text-start font-medium">روابط</th>
                </tr>
              </thead>
              <tbody>
                {ENTITIES.map((e) => (
                  <tr key={e.name} className="border-b border-line last:border-0">
                    <td className="p-3 font-semibold text-ink" dir="ltr">
                      {e.name}
                    </td>
                    <td className="p-3 text-body">{e.purpose}</td>
                    <td className="p-3" dir="ltr">
                      <span className="text-[11px] text-muted">{e.keyFields.join(', ')}</span>
                    </td>
                    <td className="p-3 text-[11.5px] leading-6 text-muted">{e.relations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-card border border-line bg-surface p-5">
              <h3 className="mb-3 text-[15px] font-bold text-ink">ناوردای یکپارچگی موجودی</h3>
              <p className="num rounded-lg border border-indigo-700/30 bg-indigo-100 p-3 text-center text-[13px] font-bold text-indigo-900">
                totalQuantity = availableQuantity + reservedQuantity + soldQuantity
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-[12.5px] leading-7 text-body">
                <li>
                  — همه تغییرات موجودی تنها از سه تابع <span dir="ltr">reserve</span>،{' '}
                  <span dir="ltr">release</span> و <span dir="ltr">commit</span> عبور می‌کنند.
                </li>
                <li>— هر تابع پیش از اعمال تغییر، کفایت موجودی را بررسی و در صورت کمبود، خطای تجاری برمی‌گرداند.</li>
                <li>— پس از هر تغییر، ناوردا دوباره سنجیده می‌شود و در صورت نقض، تراکنش اعمال نمی‌شود.</li>
                <li>— هر تغییر یک رکورد حسابرسی با عکس لحظه‌ای دفتر موجودی ثبت می‌کند.</li>
              </ul>
            </div>

            <div className="rounded-card border border-line bg-surface p-5">
              <h3 className="mb-3 text-[15px] font-bold text-ink">لایه‌بندی معماری</h3>
              <ol className="flex flex-col gap-2.5 text-[12.5px] leading-7">
                {[
                  { layer: 'lib/domain', desc: 'تایپ‌ها، اعتبارسنجی، ماشین وضعیت، موتور موجودی و سرویس‌ها — بدون هیچ وابستگی به React' },
                  { layer: 'lib/store', desc: 'درایور LocalStorage، داده پایه و مخزن وضعیت React' },
                  { layer: 'lib/content', desc: 'محتوای پرونده تحلیلی به صورت داده ساختاریافته' },
                  { layer: 'components + pages', desc: 'فقط نمایش و تعامل؛ هیچ قاعده کسب‌وکاری در این لایه نیست' },
                ].map((l) => (
                  <li key={l.layer} className="flex gap-3">
                    <span dir="ltr" className="shrink-0 rounded bg-raised px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                      {l.layer}
                    </span>
                    <span className="text-body">{l.desc}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-6 text-muted">
                نتیجه این تفکیک: لایه دامنه بدون مرورگر و بدون React قابل آزمون است (همان کاری که
                فرمان <span dir="ltr" className="num">npm run test:domain</span> انجام می‌دهد).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* آزمون‌ها */}
      {tab === 'tests' && (
        <div className="mt-6 flex flex-col gap-4">
          <Note kind="honest" title="قاعده ثبت نتیجه آزمون">
            {TEST_SUMMARY.note} هیچ موردی بدون اجرا «موفق» علامت نخورده است.
          </Note>

          <div className="thin-scroll overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[920px] text-[12.5px]">
              <caption className="sr-only">موارد آزمون و نتیجه اجرای آن‌ها</caption>
              <thead>
                <tr className="border-b border-line bg-raised text-muted">
                  <th scope="col" className="p-3 text-start font-medium">کد</th>
                  <th scope="col" className="p-3 text-start font-medium">سناریو</th>
                  <th scope="col" className="p-3 text-start font-medium">عنوان</th>
                  <th scope="col" className="p-3 text-start font-medium">نتیجه مورد انتظار</th>
                  <th scope="col" className="p-3 text-start font-medium">روش</th>
                  <th scope="col" className="p-3 text-start font-medium">نتیجه</th>
                </tr>
              </thead>
              <tbody>
                {TEST_CASES.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0">
                    <td className="num p-3 font-medium text-ink">{t.id}</td>
                    <td className="num p-3 text-muted">{t.scenario}</td>
                    <td className="p-3 text-ink">
                      {t.title}
                      <span className="mt-0.5 block text-[11px] leading-6 text-muted">{t.steps}</span>
                    </td>
                    <td className="p-3 text-[11.5px] leading-6 text-body">{t.expected}</td>
                    <td className="p-3">
                      <Badge tone={t.method === 'automated' ? 'indigo' : 'outline'}>
                        {t.method === 'automated' ? 'خودکار' : 'دستی'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge tone={RESULT_BADGE[t.result].tone}>{RESULT_BADGE[t.result].label}</Badge>
                      {t.note && <span className="mt-1 block text-[10.5px] text-muted">{t.note}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* چک‌لیست */}
      {tab === 'checklist' && (
        <div className="mt-6 flex flex-col gap-5">
          {CHECKLIST.map((g) => (
            <div key={g.group} className="rounded-card border border-line bg-surface p-5">
              <h3 className="mb-4 text-[15px] font-bold text-ink">{g.group}</h3>
              <ul className="flex flex-col divide-y divide-line">
                {g.items.map((it) => (
                  <li key={it.req} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="min-w-[240px] flex-1 text-[13px] leading-7 text-body">{it.req}</span>
                    <span className="text-[12px] text-indigo-700">{it.where}</span>
                    <Badge tone={STATUS_BADGE[it.status as keyof typeof STATUS_BADGE].tone}>
                      {STATUS_BADGE[it.status as keyof typeof STATUS_BADGE].label}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-card border border-line bg-surface p-5">
            <h3 className="mb-3 text-[15px] font-bold text-ink">قیدهای اعلام‌شده</h3>
            <ul className="flex flex-col gap-2.5 text-[12.5px] leading-7 text-body">
              <li>
                — <strong className="text-ink">گزارش اعتبارسنجی:</strong> چارچوب، پروتکل، پرسش‌نامه و
                ابزار زنده ثبت پاسخ‌ها آماده است، اما مصاحبه میدانی هنوز اجرا نشده؛ بنابراین
                «انجام‌شده با قید» علامت خورده است.
              </li>
              <li>
                — <strong className="text-ink">آزمون دستی:</strong> ۲ مورد از ۳۹ مورد آزمون (چیدمان
                در عرض موبایل و ترتیب فوکوس صفحه‌کلید) به موتور چیدمان مرورگر واقعی نیاز دارند و با
                jsdom قابل سنجش نیستند؛ بنابراین با برچسب «اجرا نشده» ثبت شده‌اند و موفق علامت
                نخورده‌اند.
              </li>
            </ul>
          </div>

          <div className="rounded-card border border-dashed border-line-strong bg-surface p-5">
            <h3 className="mb-3 text-[15px] font-bold text-ink">خارج از دامنه فاز ۱</h3>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {OUT_OF_SCOPE.map((o) => (
                <div key={o.title} className="rounded-lg border border-line bg-raised p-3">
                  <p className="text-[12.5px] font-semibold text-ink">{o.title}</p>
                  <p className="mt-0.5 text-[11px] leading-6 text-muted">{o.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/dossier">
          <Button variant="secondary">بازگشت به پرونده تحلیلی</Button>
        </Link>
        <Link to="/mvp">
          <Button>اجرای سناریوها در محصول</Button>
        </Link>
      </div>
    </main>
  );
};
