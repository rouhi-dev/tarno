/**
 * میله دفتر موجودی — نمایش ناوردای «کل = قابل عرضه + رزرو + فروخته‌شده».
 * فاصله ۲ پیکسلی میان بخش‌ها از رنگ سطح، تا مرز بخش‌ها در هر تم دیده شود.
 */

import { faNum, UNIT_LABEL } from '../../lib/format';

export const LedgerBar = ({
  total,
  available,
  reserved,
  sold,
  unit,
  compact = false,
}: {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  unit: 'meter' | 'kilogram';
  compact?: boolean;
}) => {
  const safeTotal = total > 0 ? total : 1;
  const pct = (v: number) => (v / safeTotal) * 100;
  const parts = [
    { key: 'available', label: 'قابل عرضه', value: available, color: 'var(--series-1)' },
    { key: 'reserved', label: 'رزروشده', value: reserved, color: 'var(--series-4)' },
    { key: 'sold', label: 'فروخته‌شده', value: sold, color: 'var(--series-3)' },
  ].filter((p) => p.value > 0);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[3px]"
        style={{ background: 'var(--grid)' }}
        role="img"
        aria-label={`کل ${total} ${UNIT_LABEL[unit]}: قابل عرضه ${available}، رزروشده ${reserved}، فروخته‌شده ${sold}`}
      >
        {parts.map((p) => (
          <div
            key={p.key}
            className="h-full transition-[width] duration-500"
            style={{ width: `${pct(p.value)}%`, background: p.color }}
          />
        ))}
      </div>
      {!compact && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px]">
          {[
            { label: 'کل', value: total, color: 'var(--line-strong)' },
            { label: 'قابل عرضه', value: available, color: 'var(--series-1)' },
            { label: 'رزروشده', value: reserved, color: 'var(--series-4)' },
            { label: 'فروخته‌شده', value: sold, color: 'var(--series-3)' },
          ].map((p) => (
            <li key={p.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
              <span className="text-muted">{p.label}:</span>
              <span className="num font-medium text-ink">{faNum(p.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
