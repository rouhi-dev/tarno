/** شناسنامه فنی پارچه — جدول مشخصات با فیلدهای وابسته به دسته. */

import type { FabricCategory, FabricListing } from '../../lib/domain/types';
import { SPEC_LABELS } from '../../lib/domain/validation';
import { faNum } from '../../lib/format';

const formatSpec = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'دارد' : 'ندارد';
  if (typeof value === 'number') return faNum(value);
  return String(value);
};

export const SpecTable = ({
  listing,
  category,
}: {
  listing: FabricListing;
  category: FabricCategory | null;
}) => {
  const keys = category
    ? [...category.requiredSpecs, ...category.optionalSpecs]
    : (Object.keys(listing.specs) as (keyof typeof listing.specs)[]);

  const rows = keys
    .map((k) => ({ key: k, value: listing.specs[k as keyof typeof listing.specs] }))
    .filter((r) => r.value !== undefined && r.value !== '');

  if (rows.length === 0)
    return <p className="text-[12.5px] text-muted">مشخصه فنی ثبت‌شده‌ای وجود ندارد.</p>;

  return (
    <dl className="grid gap-x-6 gap-y-0 sm:grid-cols-2">
      {rows.map((r) => (
        <div
          key={String(r.key)}
          className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-0"
        >
          <dt className="text-[12.5px] text-muted">
            {SPEC_LABELS[r.key as keyof typeof SPEC_LABELS] ?? String(r.key)}
          </dt>
          <dd className="num text-[12.5px] font-medium text-ink">
            {formatSpec(r.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
};
