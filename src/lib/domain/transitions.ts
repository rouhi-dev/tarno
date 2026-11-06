/** ماشین‌های وضعیت سامانه — تنها مرجع مجاز بودن یک گذار. */

import type { ListingStatus, OrderStatus, PurchaseRequestStatus } from './types';

export const LISTING_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  draft: ['pending'],
  pending: ['active', 'rejected'],
  active: ['paused', 'sold_out', 'rejected'],
  paused: ['active'],
  rejected: ['pending'],
  sold_out: ['paused'],
};

export const REQUEST_TRANSITIONS: Record<PurchaseRequestStatus, PurchaseRequestStatus[]> = {
  pending: ['awaiting_buyer', 'rejected', 'withdrawn'],
  awaiting_buyer: ['converted', 'withdrawn'],
  rejected: [],
  converted: [],
  withdrawn: [],
};

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ['paid', 'payment_failed', 'cancelled'],
  payment_failed: [], // رزرو آزاد شده است؛ خریدار باید درخواست جدید ثبت کند
  paid: [],
  cancelled: [],
};

export const canTransition = <S extends string>(
  table: Record<S, S[]>,
  from: S,
  to: S,
): boolean => (table[from] ?? []).includes(to);

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار تأیید',
  active: 'فعال',
  paused: 'متوقف‌شده',
  rejected: 'ردشده',
  sold_out: 'موجودی تمام',
};

export const REQUEST_STATUS_LABEL: Record<PurchaseRequestStatus, string> = {
  pending: 'در انتظار بررسی فروشنده',
  awaiting_buyer: 'در انتظار تأیید خریدار',
  rejected: 'ردشده',
  converted: 'تبدیل به سفارش',
  withdrawn: 'منصرف‌شده',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'در انتظار پرداخت',
  paid: 'پرداخت‌شده',
  cancelled: 'لغوشده',
  payment_failed: 'پرداخت ناموفق',
};
