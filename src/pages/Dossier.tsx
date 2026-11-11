/**
 * بخش الف — پرونده تحلیلی کسب‌وکار.
 * ده لوح پیوسته با ریل ناوبری چسبان و نوار پیشرفت مطالعه.
 */

import { useEffect, useState, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { BRAND, DIFFERENTIATORS } from '../lib/content/brand';
import { MATURE_IDEA } from '../lib/content/matureIdea';
import { FRICTIONS } from '../lib/content/problem';
import { JOURNEY } from '../lib/content/journey';
import { HYPOTHESES } from '../lib/content/validation';
import { ProblemSection } from '../components/dossier/ProblemSection';
import { WasteSection } from '../components/dossier/WasteSection';
import { JourneySection } from '../components/dossier/JourneySection';
import { ValidationSection } from '../components/dossier/ValidationSection';
import { MatureIdeaSection } from '../components/dossier/MatureIdeaSection';
import { ClassificationSection } from '../components/dossier/ClassificationSection';
import { ConceptsSection } from '../components/dossier/ConceptsSection';
import { CompetitorsSection } from '../components/dossier/CompetitorsSection';
import { RevenueSection } from '../components/dossier/RevenueSection';
import { SectionShell } from '../components/layout/SectionShell';
import { Badge, Note, cx } from '../components/ui/primitives';
import { Reveal } from '../components/ui/motion';
import { faNum } from '../lib/format';

const DOSSIER_PATH = '/dossier';

const SECTIONS = [
  { id: 'overview', label: 'خلاصه و روش‌شناسی', badge: 'پایه' },
  { id: 'problem', label: 'صورت‌بندی مسئله', badge: 'پایه' },
  { id: 'waste', label: 'مدل اتلاف زمان و هزینه', badge: 'مزیت‌بخش' },
  { id: 'journey', label: 'نقشه سفر مشتری (As-Is)', badge: 'مزیت‌بخش' },
  { id: 'validation', label: 'اعتبارسنجی میدانی', badge: 'مزیت‌بخش' },
  { id: 'mature-idea', label: 'هشت پرسش ایده بالغ', badge: 'پایه' },
  { id: 'classification', label: 'طبقه‌بندی و مرزبندی', badge: 'پایه' },
  { id: 'concepts', label: 'مفاهیم فصل ۱ کتاب', badge: 'پایه' },
  { id: 'competitors', label: 'رقبا و جایگزین‌ها', badge: 'تکمیلی' },
  { id: 'revenue', label: 'فرضیه درآمد و نقشه راه', badge: 'تکمیلی' },
] as const;

const useActiveSection = () => {
  const [active, setActive] = useState<string>('overview');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.3, 0.6] },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
  return active;
};

const ReadingProgress = () => {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="no-print fixed inset-x-0 top-0 z-50 h-[3px] origin-right bg-madder-600"
      style={{ scaleX: width }}
    />
  );
};

const OverviewSection = () => (
  <SectionShell
    id="overview"
    index={1}
    eyebrow="بخش الف — پرونده تحلیلی کسب‌وکار"
    title="این پرونده چه چیزی را ثابت می‌کند و چه چیزی را نه"
    lead="پرونده تحلیلی تارنو بر یک قاعده نگارشی بنا شده است: هر گزاره باید سطح اطمینان خودش را اعلام کند. به همین دلیل در این پرونده نه آمار بازار بدون منبع می‌بینید، نه ادعای «اولین بودن»، و نه نتیجه مصاحبه‌ای که انجام نشده است."
  >
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <Reveal>
        <div className="flex flex-col gap-5">
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="label-eyebrow mb-2">هسته ارزش پیشنهادی</p>
            <p className="max-w-[80ch] text-[14px] leading-8 text-body">{BRAND.valueStatement}</p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              {DIFFERENTIATORS.map((d) => (
                <Badge key={d.id} tone="indigo">
                  {faNum(d.index)}. {d.title}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-line bg-surface p-5">
            <p className="label-eyebrow mb-3">محتوای این پرونده در یک نگاه</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'اصطکاک تحلیل‌شده', value: FRICTIONS.length },
                { label: 'پرسش ایده بالغ', value: MATURE_IDEA.length },
                { label: 'مرحله سفر مشتری', value: JOURNEY.length },
                { label: 'فرضیه آزمون‌پذیر', value: HYPOTHESES.length },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1 border-s-2 border-line ps-3">
                  <span className="num text-[24px] font-bold leading-8 text-ink">{faNum(s.value)}</span>
                  <span className="text-[11.5px] leading-5 text-muted">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="flex flex-col gap-4">
          <Note kind="honest" title="چهار قاعده نگارشی این پرونده">
            <ol className="flex flex-col gap-2">
              <li>۱. هر گزاره برچسب سطح اطمینان دارد: مشاهده، فرضیه، فرض، یا استنتاج منطقی.</li>
              <li>۲. هیچ آمار بازاری که منبع قابل استناد نداشته باشد نقل نشده است.</li>
              <li>۳. درباره رقبا، «نامعلوم» به جای حدس نوشته شده و کار راستی‌آزمایی تعریف شده است.</li>
              <li>۴. مصاحبه میدانی هنوز انجام نشده و این موضوع در بخش مربوطه صریحاً اعلام شده است.</li>
            </ol>
          </Note>
          <div className="rounded-card border border-line bg-raised p-4">
            <p className="label-eyebrow mb-2">پیوند دو بخش پروژه</p>
            <p className="text-[12.5px] leading-7 text-body">
              هر ادعای این پرونده که در محصول پیاده شده باشد، با برچسب «ردپا در MVP» مشخص است؛
              بنابراین می‌توان از هر بند تحلیل، به کد و رابط کاربری متناظر آن رسید.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  </SectionShell>
);

/** مسیر یک لوح به شکلی که HashRouter می‌فهمد: #/dossier#<id> */
const sectionHref = (id: string) => `#${DOSSIER_PATH}#${id}`;

export const Dossier = () => {
  const active = useActiveSection();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * سامانه روی HashRouter کار می‌کند، یعنی کل مسیر در هش نشانی قرار دارد
   * (مثل `#/dossier`). بنابراین یک لنگر خام مثل `href="#waste"` هش را بازنویسی
   * می‌کند، مسیریاب آن را مسیر `/waste` می‌خواند و چون چنین مسیری وجود ندارد به
   * صفحه نخست هدایت می‌شود. پس پیمایش باید از خود مسیریاب عبور کند تا هش در
   * نشانی هم هم‌زمان به‌روز شود.
   */
  const jumpToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    // کلیک با کلید کمکی یا دکمه میانی به رفتار پیش‌فرض مرورگر واگذار می‌شود.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();

    if (location.hash === `#${id}`) {
      // هش تغییر نمی‌کند، پس ناظر مسیر دوباره اجرا نمی‌شود؛ خودمان پیمایش می‌کنیم.
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate({ pathname: DOSSIER_PATH, hash: id });
  };

  return (
    <main>
      <ReadingProgress />
      <div className="mx-auto flex max-w-[1340px] gap-0 lg:gap-8">
        {/* ریل ناوبری */}
        <nav
          aria-label="فهرست لوح‌های پرونده"
          className="no-print sticky top-24 hidden h-[calc(100vh-8rem)] w-[250px] shrink-0 flex-col gap-1 overflow-y-auto py-10 ps-4 lg:flex"
        >
          <p className="label-eyebrow mb-3">فهرست پرونده</p>
          {SECTIONS.map((s, i) => {
            const isActive = active === s.id;
            return (
              <a
                key={s.id}
                href={sectionHref(s.id)}
                onClick={(event) => jumpToSection(event, s.id)}
                aria-current={isActive ? 'true' : undefined}
                className={cx(
                  'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors',
                  isActive ? 'bg-indigo-100 text-indigo-900' : 'text-body hover:bg-raised',
                )}
              >
                <span
                  className={cx(
                    'num flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10.5px] font-bold',
                    isActive ? 'bg-indigo-900 text-white' : 'bg-raised text-muted',
                  )}
                >
                  {faNum(i + 1)}
                </span>
                <span className="flex-1 leading-6">{s.label}</span>
                {s.badge === 'مزیت‌بخش' && (
                  <span
                    aria-label="مورد مزیت‌بخش"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-madder-600"
                  />
                )}
              </a>
            );
          })}
          <p className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[11px] text-muted">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-madder-600" />
            موارد تکمیلی و مزیت‌بخش فاز ۱
          </p>
        </nav>

        <div className="min-w-0 flex-1">
          <OverviewSection />
          <ProblemSection />
          <WasteSection />
          <JourneySection />
          <ValidationSection />
          <MatureIdeaSection />
          <ClassificationSection />
          <ConceptsSection />
          <CompetitorsSection />
          <RevenueSection />
        </div>
      </div>
    </main>
  );
};
