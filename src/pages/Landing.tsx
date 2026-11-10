/**
 * صفحه فرود کسب‌وکار — الزام ۱ بخش الف فاز ۱.
 * عنوان کسب‌وکار، بیانیه ارزش، مخاطب هدف، مسئله، منافع و دکمه‌های فراخوان اقدام
 * + ناوبری دوگانه به پرونده تحلیلی و محیط MVP.
 */

import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { AUDIENCES, BRAND, DIFFERENTIATORS } from '../lib/content/brand';
import { SURPLUS_CAUSES } from '../lib/content/problem';
import { useStore } from '../lib/store/StoreProvider';
import { Badge, Button, Stat } from '../components/ui/primitives';
import { Reveal, RevealGroup, RevealItem, CountUp } from '../components/ui/motion';
import { faNum } from '../lib/format';

/** بافت تار و پود متحرک — تنها عنصر تزئینی سایت و فقط در سربرگ صفحه فرود. */
const WeaveHero = () => {
  const reduced = useReducedMotion();
  const warps = Array.from({ length: 26 });
  const wefts = Array.from({ length: 9 });
  return (
    <svg
      aria-hidden
      viewBox="0 0 520 300"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      {warps.map((_, i) => (
        <motion.line
          key={`warp-${i}`}
          x1={10 + i * 20}
          y1={0}
          x2={10 + i * 20}
          y2={300}
          stroke="var(--line-strong)"
          strokeWidth="1"
          initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
          animate={reduced ? undefined : { pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 0.9, delay: i * 0.02, ease: 'easeOut' }}
        />
      ))}
      {wefts.map((_, i) => (
        <motion.line
          key={`weft-${i}`}
          x1={0}
          y1={18 + i * 33}
          x2={520}
          y2={18 + i * 33}
          stroke={i % 3 === 1 ? 'var(--madder-600)' : 'var(--indigo-500)'}
          strokeWidth={i % 3 === 1 ? 2.4 : 1.6}
          opacity={i % 3 === 1 ? 0.55 : 0.4}
          initial={reduced ? undefined : { pathLength: 0 }}
          animate={reduced ? undefined : { pathLength: 1 }}
          transition={{ duration: 1.1, delay: 0.5 + i * 0.07, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
};

export const Landing = () => {
  const { db } = useStore();
  const activeListings = db.listings.filter((l) => l.status === 'active');
  const totalAvailable = activeListings.reduce((a, l) => a + l.availableQuantity, 0);
  const sellerSegments = AUDIENCES.filter((a) => a.side === 'seller');
  const buyerSegments = AUDIENCES.filter((a) => a.side === 'buyer');

  return (
    <main>
      {/* ------------------------------ سربرگ ------------------------------ */}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute inset-y-0 start-0 w-[46%] opacity-[0.5] md:w-[38%]">
          <WeaveHero />
        </div>
        <div className="relative mx-auto grid max-w-[1180px] gap-10 px-4 py-14 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div className="flex flex-col items-start gap-5">
            <Badge tone="madder">{BRAND.model} · بازار {BRAND.market}</Badge>
            <h1 className="font-display text-[40px] font-bold leading-[1.15] text-ink sm:text-[54px]">
              {BRAND.businessTitle}
            </h1>
            <p className="font-display text-[22px] font-semibold text-madder-600 sm:text-[26px]">
              {BRAND.tagline}
            </p>
            <p className="max-w-reading text-[14.5px] leading-8 text-body">{BRAND.valueStatement}</p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link to="/dossier">
                <Button size="lg">مرور پرونده تحلیلی کسب‌وکار</Button>
              </Link>
              <Link to="/mvp">
                <Button size="lg" variant="secondary">
                  ورود به محیط محصول (MVP)
                </Button>
              </Link>
            </div>
            <p className="text-[12px] text-muted">
              دو بخش پروژه از همین دو دکمه در دسترس است؛ هر دو بخش روی یک سامانه و یک لایه داده کار می‌کنند.
            </p>
          </div>

          <Reveal delay={0.15} className="flex flex-col gap-5">
            <div className="plate p-5 shadow-plate">
              <p className="label-eyebrow mb-3">وضعیت کنونی داده سامانه</p>
              <div className="grid grid-cols-2 gap-5">
                <Stat
                  label="آگهی فعال"
                  value={<CountUp value={activeListings.length} format={(n) => faNum(Math.round(n))} />}
                  tone="indigo"
                />
                <Stat
                  label="متر پارچه قابل عرضه"
                  value={<CountUp value={totalAvailable} format={(n) => faNum(Math.round(n))} />}
                />
                <Stat label="دسته تخصصی پارچه" value={faNum(db.categories.length)} />
                <Stat label="کسب‌وکار ثبت‌شده" value={faNum(db.businessProfiles.length)} />
              </div>
              <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-6 text-muted">
                این اعداد از داده پایه (Seed) سامانه خوانده می‌شوند و با انجام سناریوها تغییر می‌کنند؛
                داده واقعی بازار نیستند.
              </p>
            </div>

            <div className="rounded-card border border-indigo-700/25 bg-indigo-100 p-5">
              <p className="label-eyebrow mb-2">فرمول ارزش پیشنهادی</p>
              <p className="text-[13px] leading-8 text-body">
                برای <strong className="text-ink">{BRAND.valueFormula.for}</strong> که{' '}
                {BRAND.valueFormula.who}، <strong className="text-ink">{BRAND.valueFormula.our}</strong>{' '}
                {BRAND.valueFormula.that}؛ {BRAND.valueFormula.unlike}.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ مسئله ------------------------------ */}
      <section className="border-b border-line py-14">
        <div className="mx-auto max-w-[1180px] px-4">
          <Reveal>
            <span className="label-eyebrow">مسئله‌ای که حل می‌کنیم</span>
            <h2 className="mt-2 max-w-[28ch] font-display text-[30px] font-bold leading-tight text-ink sm:text-[36px]">
              پارچه قابل استفاده در انبار می‌ماند، چون پیدا کردن خریدارش گران است
            </h2>
            <p className="mt-4 max-w-reading text-[14px] leading-8 text-body">
              موجودی مازاد پارچه به دلایل ساختاری تولید پدید می‌آید؛ اما مسیر رساندن آن به
              کسب‌وکاری که همان مشخصات را جستجو می‌کند، پراکنده، شفاهی و زمان‌بر است. این هفت
              علت، سرچشمه موجودی مازاد در صنعت نساجی و پوشاک‌اند:
            </p>
          </Reveal>

          <RevealGroup className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SURPLUS_CAUSES.map((c) => (
              <RevealItem key={c.id} className="h-full">
                <div className="flex h-full flex-col gap-2 border-t-2 border-line-strong bg-surface px-4 py-4">
                  <h3 className="text-[14px] font-semibold text-ink">{c.title}</h3>
                  <p className="text-[12.5px] leading-7 text-muted">{c.detail}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.1}>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/dossier#problem">
                <Button variant="ghost">تحلیل کامل اصطکاک‌ها و پیامدها</Button>
              </Link>
              <Link to="/dossier#waste">
                <Button variant="ghost">نمودار اتلاف زمان و هزینه</Button>
              </Link>
              <Link to="/dossier#journey">
                <Button variant="ghost">نقشه سفر فعلی مشتری</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------- تمایزها ----------------------------- */}
      <section className="border-b border-line bg-surface py-14">
        <div className="mx-auto max-w-[1180px] px-4">
          <Reveal>
            <span className="label-eyebrow">سه تمایز اصلی</span>
            <h2 className="mt-2 font-display text-[30px] font-bold leading-tight text-ink sm:text-[36px]">
              آنچه تارنو را از یک تخته‌آگهی جدا می‌کند
            </h2>
            <p className="mt-3 max-w-reading text-[13.5px] leading-8 text-muted">
              هر سه تمایز، هم در تحلیل کسب‌وکار و هم در کد محصول قابل ردگیری‌اند؛ ستون آخر هر
              کارت نشان می‌دهد این ادعا در MVP کجا پیاده شده است.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.id} delay={i * 0.08} className="h-full">
                <article className="flex h-full flex-col gap-3 rounded-card border border-line bg-raised p-5">
                  <div className="flex items-center gap-3">
                    <span className="num flex h-7 w-7 items-center justify-center rounded-md bg-indigo-900 text-[13px] font-bold text-white">
                      {faNum(d.index)}
                    </span>
                    <h3 className="text-[16px] font-bold text-ink">{d.title}</h3>
                  </div>
                  <p className="text-[13px] font-medium leading-7 text-madder-600">{d.short}</p>
                  <p className="text-[12.5px] leading-7 text-body">{d.body}</p>
                  <div className="mt-auto border-t border-line pt-3">
                    <p className="label-eyebrow mb-1">در MVP</p>
                    <p className="text-[12px] leading-6 text-muted">{d.inMvp}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- مخاطب هدف ---------------------------- */}
      <section className="border-b border-line py-14">
        <div className="mx-auto max-w-[1180px] px-4">
          <Reveal>
            <span className="label-eyebrow">مخاطب هدف</span>
            <h2 className="mt-2 font-display text-[30px] font-bold leading-tight text-ink sm:text-[36px]">
              دو سمت بازار، با دو کار متفاوت
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {[
              { title: 'سمت عرضه — فروشندگان', items: sellerSegments, tone: 'madder' as const },
              { title: 'سمت تقاضا — خریداران', items: buyerSegments, tone: 'indigo' as const },
            ].map((group, gi) => (
              <Reveal key={group.title} delay={gi * 0.1}>
                <div className="flex h-full flex-col gap-4 rounded-card border border-line bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-bold text-ink">{group.title}</h3>
                    <Badge tone={group.tone}>{faNum(group.items.length)} بخش بازار</Badge>
                  </div>
                  <ul className="flex flex-col divide-y divide-line">
                    {group.items.map((a) => (
                      <li key={a.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                        <p className="text-[14px] font-semibold text-ink">{a.title}</p>
                        <p className="text-[12.5px] leading-7 text-body">{a.jobToBeDone}</p>
                        <p className="text-[11.5px] leading-6 text-muted">
                          <span className="font-medium">محرک مراجعه:</span> {a.trigger}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {a.examples.map((ex) => (
                            <span
                              key={ex}
                              className="rounded border border-line bg-raised px-1.5 py-0.5 text-[11px] text-muted"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- فراخوان اقدام ---------------------------- */}
      <section className="py-16">
        <div className="mx-auto max-w-[1180px] px-4">
          <Reveal>
            <div className="flex flex-col items-start gap-5 rounded-card border border-indigo-700/25 bg-indigo-900 p-8 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-[26px] font-bold text-white sm:text-[30px]">
                  سناریوی کامل معامله را خودتان اجرا کنید
                </h2>
                <p className="max-w-[62ch] text-[13px] leading-7 text-white/80">
                  با حساب‌های دمو وارد شوید: فروشنده آگهی ثبت می‌کند، خریدار درخواست می‌دهد،
                  فروشنده قیمت نهایی را پیشنهاد می‌کند و پس از تأیید، موجودی رزرو و با پرداخت
                  شبیه‌سازی‌شده قطعی می‌شود — همه با اعتبارسنجی واقعی و داده پایدار.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Link to="/mvp/login">
                  <Button size="lg" variant="secondary" className="w-full">
                    ورود با حساب دمو
                  </Button>
                </Link>
                <Link to="/report">
                  <Button size="lg" variant="ghost" className="w-full text-white hover:bg-white/10">
                    شناسنامه سناریوها و گزارش آزمون
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
};
