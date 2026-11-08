/** کارت آگهی — نمایش یکسان مشخصات تا مقایسه ممکن باشد. */

import { Link } from 'react-router-dom';
import type { FabricListing } from '../../lib/domain/types';
import { LISTING_STATUS_LABEL } from '../../lib/domain/transitions';
import { faNum, qty, toman } from '../../lib/format';
import { Badge, cx } from '../ui/primitives';
import { LedgerBar } from '../charts/LedgerBar';

const GRADE_TONE = { A: 'ok', B: 'warn', C: 'danger' } as const;
const GRADE_LABEL = { A: 'درجه A — بدون ایراد اعلامی', B: 'درجه B — ایراد جزئی', C: 'درجه C — ایراد مشخص' } as const;

export const GradeBadge = ({ grade }: { grade: FabricListing['qualityGrade'] }) => (
  <Badge tone={GRADE_TONE[grade]}>{GRADE_LABEL[grade]}</Badge>
);

export const StatusBadge = ({ status }: { status: FabricListing['status'] }) => {
  const tone =
    status === 'active'
      ? 'ok'
      : status === 'pending'
        ? 'warn'
        : status === 'rejected'
          ? 'danger'
          : 'neutral';
  return <Badge tone={tone}>{LISTING_STATUS_LABEL[status]}</Badge>;
};

export const ListingCard = ({
  listing,
  image,
  categoryTitle,
  sellerName,
  showLedger = true,
  href,
}: {
  listing: FabricListing;
  image?: string;
  categoryTitle: string;
  sellerName: string;
  showLedger?: boolean;
  href?: string;
}) => {
  const specs = [
    listing.specs.fiber && { label: 'الیاف', value: listing.specs.fiber },
    listing.specs.width && { label: 'عرض', value: `${faNum(listing.specs.width)} سانتی‌متر` },
    listing.specs.gsm && { label: 'گراماژ', value: `${faNum(listing.specs.gsm)} گرم` },
    listing.specs.rubCycles && { label: 'سایش', value: `${faNum(listing.specs.rubCycles)} چرخه` },
    listing.specs.color && { label: 'رنگ', value: listing.specs.color },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article
      className={cx(
        'group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-line-strong',
        listing.availableQuantity <= 0 && 'opacity-80',
      )}
    >
      <div className="relative">
        {image ? (
          <img
            src={image}
            alt={`نمونه بافت ${listing.title}`}
            className="h-[136px] w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div aria-hidden className="weave h-[136px] w-full" />
        )}
        <span className="absolute bottom-2 start-2 rounded bg-ink/75 px-1.5 py-0.5 text-[10px] text-white">
          نمونه بافت شبیه‌سازی‌شده
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="num text-[11px] text-muted">{listing.code}</span>
          <StatusBadge status={listing.status} />
        </div>

        <h3 className="text-[14.5px] font-semibold leading-7 text-ink">{listing.title}</h3>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone="indigo">{categoryTitle}</Badge>
          <GradeBadge grade={listing.qualityGrade} />
          {listing.negotiable && <Badge tone="outline">قابل مذاکره</Badge>}
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-y border-line py-2.5">
          {specs.slice(0, 4).map((s) => (
            <div key={s.label} className="flex items-baseline gap-1.5 text-[11.5px]">
              <dt className="text-muted">{s.label}:</dt>
              <dd className="num font-medium text-body">{s.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="num text-[16px] font-bold text-ink">{toman(listing.pricePerUnit)}</p>
            <p className="text-[11px] text-muted">
              هر {listing.unit === 'meter' ? 'متر' : 'کیلوگرم'} · حداقل سفارش{' '}
              {qty(listing.minOrderQuantity, listing.unit)}
            </p>
          </div>
          <div className="text-end">
            <p className="num text-[13px] font-semibold text-indigo-700">
              {qty(listing.availableQuantity, listing.unit)}
            </p>
            <p className="text-[11px] text-muted">قابل عرضه</p>
          </div>
        </div>

        {showLedger && (
          <LedgerBar
            total={listing.totalQuantity}
            available={listing.availableQuantity}
            reserved={listing.reservedQuantity}
            sold={listing.soldQuantity}
            unit={listing.unit}
            compact
          />
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-muted">
            {sellerName} · {listing.city}
          </span>
          <Link
            to={href ?? `/mvp/listing/${listing.id}`}
            className="rounded-lg border border-line-strong px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:bg-raised"
          >
            مشاهده و استعلام
          </Link>
        </div>
      </div>
    </article>
  );
};
