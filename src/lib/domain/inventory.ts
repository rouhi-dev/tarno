/**
 * موتور دفتر موجودی — نگهبان ناوردای (Invariant) سامانه:
 *
 *        totalQuantity = availableQuantity + reservedQuantity + soldQuantity
 *
 * همه تغییرات موجودی فقط از این توابع عبور می‌کنند. هر تابع یا یک دفتر معتبر
 * جدید برمی‌گرداند یا خطای تجاری؛ هیچ مسیری اجازه ایجاد موجودی منفی یا
 * بیش‌فروشی (Overselling) ندارد.
 */

import type { FabricListing, InventoryTransaction, InventoryTxKind } from './types';
import { uid } from './ids';

export interface Ledger {
  total: number;
  available: number;
  reserved: number;
  sold: number;
}

export type LedgerError =
  | { code: 'INSUFFICIENT_AVAILABLE'; message: string }
  | { code: 'INSUFFICIENT_RESERVED'; message: string }
  | { code: 'NON_POSITIVE_QUANTITY'; message: string }
  | { code: 'INVARIANT_BROKEN'; message: string };

export type LedgerResult = { ok: true; ledger: Ledger } | { ok: false; error: LedgerError };

export const ledgerOf = (listing: FabricListing): Ledger => ({
  total: listing.totalQuantity,
  available: listing.availableQuantity,
  reserved: listing.reservedQuantity,
  sold: listing.soldQuantity,
});

/** بررسی ناوردا — در آزمون‌ها و پس از هر تراکنش فراخوانی می‌شود. */
export const checkInvariant = (l: Ledger): boolean => {
  const sum = l.available + l.reserved + l.sold;
  const nonNegative = l.available >= 0 && l.reserved >= 0 && l.sold >= 0 && l.total >= 0;
  // تلورانس ممیز شناور برای مقادیر اعشاری متراژ
  return nonNegative && Math.abs(sum - l.total) < 1e-6;
};

const guardPositive = (quantity: number): LedgerError | null =>
  Number.isFinite(quantity) && quantity > 0
    ? null
    : { code: 'NON_POSITIVE_QUANTITY', message: 'مقدار تراکنش باید عددی بزرگ‌تر از صفر باشد.' };

/** قابل عرضه → رزرو (هنگام ایجاد سفارش) */
export const reserve = (l: Ledger, quantity: number): LedgerResult => {
  const bad = guardPositive(quantity);
  if (bad) return { ok: false, error: bad };
  if (quantity > l.available + 1e-9)
    return {
      ok: false,
      error: {
        code: 'INSUFFICIENT_AVAILABLE',
        message: `موجودی قابل عرضه کافی نیست؛ درخواست ${quantity} در برابر موجودی ${l.available}.`,
      },
    };
  const next: Ledger = { ...l, available: l.available - quantity, reserved: l.reserved + quantity };
  return finalize(next);
};

/** رزرو → قابل عرضه (لغو سفارش یا پرداخت ناموفق) */
export const release = (l: Ledger, quantity: number): LedgerResult => {
  const bad = guardPositive(quantity);
  if (bad) return { ok: false, error: bad };
  if (quantity > l.reserved + 1e-9)
    return {
      ok: false,
      error: {
        code: 'INSUFFICIENT_RESERVED',
        message: `مقدار آزادسازی از مقدار رزروشده بیشتر است؛ ${quantity} در برابر ${l.reserved}.`,
      },
    };
  const next: Ledger = { ...l, available: l.available + quantity, reserved: l.reserved - quantity };
  return finalize(next);
};

/** رزرو → فروخته‌شده (پرداخت موفق) */
export const commit = (l: Ledger, quantity: number): LedgerResult => {
  const bad = guardPositive(quantity);
  if (bad) return { ok: false, error: bad };
  if (quantity > l.reserved + 1e-9)
    return {
      ok: false,
      error: {
        code: 'INSUFFICIENT_RESERVED',
        message: `مقدار قطعی‌سازی از مقدار رزروشده بیشتر است؛ ${quantity} در برابر ${l.reserved}.`,
      },
    };
  const next: Ledger = { ...l, reserved: l.reserved - quantity, sold: l.sold + quantity };
  return finalize(next);
};

const finalize = (next: Ledger): LedgerResult =>
  checkInvariant(next)
    ? { ok: true, ledger: round(next) }
    : {
        ok: false,
        error: {
          code: 'INVARIANT_BROKEN',
          message: 'ناوردای دفتر موجودی نقض شد؛ تراکنش اعمال نشد.',
        },
      };

/** حذف خطای تجمعی ممیز شناور در متراژهای اعشاری */
const round = (l: Ledger): Ledger => ({
  total: +l.total.toFixed(3),
  available: +l.available.toFixed(3),
  reserved: +l.reserved.toFixed(3),
  sold: +l.sold.toFixed(3),
});

/** ساخت رکورد حسابرسی برای دفتر تراکنش‌ها */
export const makeTx = (args: {
  listingId: string;
  kind: InventoryTxKind;
  quantity: number;
  ledger: Ledger;
  refType: InventoryTransaction['refType'];
  refId: string;
  actorId: string;
  note: string;
}): InventoryTransaction => ({
  id: uid('itx'),
  listingId: args.listingId,
  kind: args.kind,
  quantity: args.quantity,
  snapshot: { ...args.ledger },
  refType: args.refType,
  refId: args.refId,
  actorId: args.actorId,
  note: args.note,
  createdAt: new Date().toISOString(),
});

/** وضعیت آگهی بر اساس دفتر موجودی: صفر شدن قابل‌عرضه ⇒ sold_out */
export const deriveListingStatus = (
  current: FabricListing['status'],
  l: Ledger,
): FabricListing['status'] => {
  if (current === 'draft' || current === 'pending' || current === 'rejected' || current === 'paused')
    return current;
  if (l.available <= 1e-9 && l.reserved <= 1e-9 && l.sold > 0) return 'sold_out';
  if (l.available <= 1e-9 && l.reserved > 0) return 'active'; // منتظر نتیجه پرداخت
  return 'active';
};
