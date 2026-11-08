/** SC-03 — بازارگاه: جستجو و فیلتر چندمعیاره با حالت خالی معنادار. */

import { useMemo, useState } from 'react';
import { useStore } from '../../lib/store/StoreProvider';
import {
  activeFilterCount,
  EMPTY_FILTER,
  filterListings,
  SORT_LABEL,
  type ListingFilter,
  type SortKey,
} from '../../lib/domain/queries';
import type { QualityGrade } from '../../lib/domain/types';
import { ListingCard } from '../../components/mvp/ListingCard';
import { Badge, Button, Checkbox, EmptyState, Field, Input, Select, cx } from '../../components/ui/primitives';
import { faNum, parseNum } from '../../lib/format';

const GRADES: QualityGrade[] = ['A', 'B', 'C'];

/** متن ورودی را به عدد تبدیل می‌کند؛ خالی یا نامعتبر ⇒ بدون فیلتر. */
const numOrNull = (v: string): number | null => {
  if (v.trim() === '') return null;
  const n = parseNum(v);
  return Number.isFinite(n) ? n : null;
};

export const Marketplace = () => {
  const { db } = useStore();
  const [filter, setFilter] = useState<ListingFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<SortKey>('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);

  /**
   * متن خام ورودی‌های عددی جداگانه نگه داشته می‌شود تا هم ارقام فارسی پذیرفته
   * شود و هم با «حذف همه فیلترها» کادرها واقعاً خالی شوند.
   */
  const [raw, setRaw] = useState({ minPrice: '', maxPrice: '', minAvailable: '', minWidth: '', maxGsm: '' });

  const resetAll = () => {
    setFilter(EMPTY_FILTER);
    setRaw({ minPrice: '', maxPrice: '', minAvailable: '', minWidth: '', maxGsm: '' });
  };

  /** ورودی عددی: متن خام را نگه می‌دارد و مقدار پارس‌شده را در فیلتر می‌گذارد. */
  const onNumChange = (key: keyof typeof raw, value: string) => {
    setRaw((r) => ({ ...r, [key]: value }));
    setFilter((f) => ({ ...f, [key]: numOrNull(value) }));
  };

  const provinces = useMemo(
    () => [...new Set(db.listings.map((l) => l.province))].sort(),
    [db.listings],
  );

  const results = useMemo(() => filterListings(db.listings, filter, sort), [db.listings, filter, sort]);
  const count = activeFilterCount(filter);



  const toggleGrade = (g: QualityGrade) =>
    setFilter((f) => ({
      ...f,
      grades: f.grades.includes(g) ? f.grades.filter((x) => x !== g) : [...f.grades, g],
    }));

  /** برچسب‌های فیلتر فعال با امکان حذف تک‌تک */
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filter.text.trim())
    chips.push({ key: 'text', label: `جستجو: ${filter.text}`, clear: () => setFilter((f) => ({ ...f, text: '' })) });
  if (filter.categoryId !== 'all') {
    const c = db.categories.find((x) => x.id === filter.categoryId);
    chips.push({
      key: 'cat',
      label: `دسته: ${c?.title ?? ''}`,
      clear: () => setFilter((f) => ({ ...f, categoryId: 'all' })),
    });
  }
  for (const g of filter.grades)
    chips.push({ key: `g-${g}`, label: `درجه ${g}`, clear: () => toggleGrade(g) });
  if (filter.province !== 'all')
    chips.push({
      key: 'prov',
      label: `استان: ${filter.province}`,
      clear: () => setFilter((f) => ({ ...f, province: 'all' })),
    });
  if (filter.minPrice !== null)
    chips.push({
      key: 'minp',
      label: `حداقل قیمت: ${faNum(filter.minPrice)}`,
      clear: () => onNumChange('minPrice', ''),
    });
  if (filter.maxPrice !== null)
    chips.push({
      key: 'maxp',
      label: `حداکثر قیمت: ${faNum(filter.maxPrice)}`,
      clear: () => onNumChange('maxPrice', ''),
    });
  if (filter.minAvailable !== null)
    chips.push({
      key: 'minq',
      label: `حداقل موجودی: ${faNum(filter.minAvailable)}`,
      clear: () => onNumChange('minAvailable', ''),
    });
  if (filter.minWidth !== null)
    chips.push({
      key: 'minw',
      label: `حداقل عرض: ${faNum(filter.minWidth)}`,
      clear: () => onNumChange('minWidth', ''),
    });
  if (filter.maxGsm !== null)
    chips.push({
      key: 'maxg',
      label: `حداکثر گراماژ: ${faNum(filter.maxGsm)}`,
      clear: () => onNumChange('maxGsm', ''),
    });
  if (filter.onlyNegotiable)
    chips.push({
      key: 'neg',
      label: 'فقط قابل مذاکره',
      clear: () => setFilter((f) => ({ ...f, onlyNegotiable: false })),
    });
  if (filter.onlyFlawless)
    chips.push({
      key: 'flaw',
      label: 'فقط بدون ایراد اعلامی',
      clear: () => setFilter((f) => ({ ...f, onlyFlawless: false })),
    });

  const reversedRange =
    filter.minPrice !== null && filter.maxPrice !== null && filter.minPrice > filter.maxPrice;

  return (
    <div className="flex flex-col gap-5">
      {/* نوار فیلتر */}
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto]">
          <Field label="جستجو در عنوان، مشخصات و کد آگهی" htmlFor="f-text">
            <Input
              id="f-text"
              value={filter.text}
              placeholder="مثلاً: ویسکوز، مخمل مبلی، TRN-1002"
              onChange={(e) => setFilter((f) => ({ ...f, text: e.target.value }))}
            />
          </Field>
          <Field label="دسته پارچه" htmlFor="f-cat">
            <Select
              id="f-cat"
              value={filter.categoryId}
              onChange={(e) => setFilter((f) => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="all">همه دسته‌ها</option>
              {db.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="مرتب‌سازی" htmlFor="f-sort">
            <Select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => setShowAdvanced((v) => !v)}>
              فیلتر فنی {showAdvanced ? '−' : '+'}
            </Button>
          </div>
        </div>

        {showAdvanced && (
          <div className="grid gap-3 border-t border-line pt-4 md:grid-cols-3 lg:grid-cols-4">
            <Field label="استان محل تحویل" htmlFor="f-prov">
              <Select
                id="f-prov"
                value={filter.province}
                onChange={(e) => setFilter((f) => ({ ...f, province: e.target.value }))}
              >
                <option value="all">همه استان‌ها</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="بازه قیمت واحد (تومان)"
              htmlFor="f-minprice"
              error={reversedRange ? 'بازه معکوس وارد شده؛ سامانه آن را خودکار اصلاح می‌کند.' : undefined}
            >
              <div className="flex gap-2">
                <Input
                  id="f-minprice"
                  inputMode="numeric"
                  placeholder="از"
                  value={raw.minPrice}
                  onChange={(e) => onNumChange('minPrice', e.target.value)}
                />
                <Input
                  id="f-maxprice"
                  inputMode="numeric"
                  placeholder="تا"
                  value={raw.maxPrice}
                  onChange={(e) => onNumChange('maxPrice', e.target.value)}
                />
              </div>
            </Field>
            <Field label="حداقل موجودی قابل عرضه" htmlFor="f-minq">
              <Input
                id="f-minq"
                inputMode="numeric"
                placeholder="مثلاً ۵۰۰"
                value={raw.minAvailable}
                onChange={(e) => onNumChange('minAvailable', e.target.value)}
              />
            </Field>
            <Field label="حداقل عرض (سانتی‌متر)" htmlFor="f-minw">
              <Input
                id="f-minw"
                inputMode="numeric"
                placeholder="مثلاً ۱۴۰"
                value={raw.minWidth}
                onChange={(e) => onNumChange('minWidth', e.target.value)}
              />
            </Field>
            <Field label="حداکثر گراماژ (گرم بر مترمربع)" htmlFor="f-maxg">
              <Input
                id="f-maxg"
                inputMode="numeric"
                placeholder="مثلاً ۲۰۰"
                value={raw.maxGsm}
                onChange={(e) => onNumChange('maxGsm', e.target.value)}
              />
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-ink">درجه کیفی</span>
              <div className="flex gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGrade(g)}
                    className={cx(
                      'num rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors',
                      filter.grades.includes(g)
                        ? 'border-indigo-700 bg-indigo-100 text-indigo-900'
                        : 'border-line-strong bg-surface text-body hover:bg-raised',
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-end gap-2">
              <Checkbox
                id="f-neg"
                label="فقط آگهی‌های قابل مذاکره"
                checked={filter.onlyNegotiable}
                onChange={(v) => setFilter((f) => ({ ...f, onlyNegotiable: v }))}
              />
              <Checkbox
                id="f-flaw"
                label="فقط بدون ایراد اعلام‌شده"
                checked={filter.onlyFlawless}
                onChange={(v) => setFilter((f) => ({ ...f, onlyFlawless: v }))}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="num text-[12.5px] font-medium text-ink">
            {faNum(results.length)} آگهی یافت شد
          </span>
          {count > 0 && (
            <>
              <span className="text-[12px] text-muted">·</span>
              <span className="num text-[12px] text-muted">{faNum(count)} فیلتر فعال</span>
            </>
          )}
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-2 py-0.5 text-[11.5px] text-body hover:border-danger hover:text-danger"
              >
                {c.label}
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
          {count > 0 && (
            <Button variant="ghost" size="sm" className="ms-auto" onClick={resetAll}>
              حذف همه فیلترها
            </Button>
          )}
        </div>
      </div>

      {/* نتایج */}
      {results.length === 0 ? (
        <EmptyState
          title="هیچ آگهی‌ای با این معیارها پیدا نشد"
          body={
            count > 0
              ? 'ترکیب فیلترها بیش از حد محدودکننده است. پیشنهاد: ابتدا محدودکننده‌ترین معیار (حداقل موجودی یا بازه قیمت) را حذف کنید.'
              : 'در حال حاضر آگهی فعالی در سامانه نیست. با حساب فروشنده وارد شوید و یک آگهی ثبت کنید.'
          }
          action={
            count > 0 ? (
              <Button variant="secondary" size="sm" onClick={resetAll}>
                بازنشانی فیلترها
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((l) => {
            const img = db.listingImages.find((i) => i.listingId === l.id && i.order === 0);
            const cat = db.categories.find((c) => c.id === l.categoryId);
            const profile = db.businessProfiles.find((p) => p.ownerUserId === l.sellerId);
            return (
              <ListingCard
                key={l.id}
                listing={l}
                image={img?.src}
                categoryTitle={cat?.title ?? '—'}
                sellerName={profile?.businessName ?? '—'}
              />
            );
          })}
        </div>
      )}

      {/* راهنمای درجه کیفی */}
      <div className="rounded-card border border-line bg-raised p-4">
        <p className="label-eyebrow mb-2">راهنمای درجه‌بندی کیفی تارنو</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { g: 'A', text: 'بدون ایراد اعلام‌شده؛ قابل استفاده در تولید اصلی.' },
            { g: 'B', text: 'ایراد جزئی و اعلام‌شده (مثل اختلاف شید) با توصیف اجباری.' },
            { g: 'C', text: 'ایراد مشخص و محدودکننده؛ مناسب کاربری‌های خاص با قیمت پایین‌تر.' },
          ].map((x) => (
            <div key={x.g} className="flex gap-2.5">
              <Badge tone={x.g === 'A' ? 'ok' : x.g === 'B' ? 'warn' : 'danger'}>درجه {x.g}</Badge>
              <p className="text-[12px] leading-6 text-body">{x.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-line pt-2 text-[11.5px] leading-6 text-muted">
          قاعده اجباری سامانه: آگهی با درجه B یا C بدون توصیف ایراد ثبت نمی‌شود.
        </p>
      </div>
    </div>
  );
};
