/**
 * سرویس‌های دامنه — قواعد کسب‌وکار سناریوهای فاز ۱.
 *
 * هر سرویس یک تابع «خالص» است: وضعیت فعلی پایگاه داده را می‌گیرد و وضعیت جدید
 * را برمی‌گرداند؛ هیچ دسترسی مستقیمی به LocalStorage یا React ندارد. همین
 * تفکیک باعث می‌شود همین توابع بدون مرورگر هم قابل آزمون باشند (tests/domain.test.ts).
 */

import type {
  DatabaseShape,
  FabricListing,
  FieldInterview,
  ID,
  InventoryTransaction,
  Order,
  OrderHistory,
  Payment,
  PriceOffer,
  PurchaseRequest,
  QualityGrade,
  FabricSpecs,
} from './types';
import { humanCode, nextSeq, uid } from './ids';
import * as inv from './inventory';
import { canTransition, ORDER_TRANSITIONS, REQUEST_TRANSITIONS } from './transitions';
import {
  validateListingDraft,
  validatePriceOffer,
  validatePurchaseRequest,
  validateRejection,
  type FieldErrors,
  type ListingDraftInput,
} from './validation';

export type ServiceResult<T> =
  | { ok: true; db: DatabaseShape; data: T }
  | { ok: false; errors: FieldErrors };

const now = () => new Date().toISOString();

const err = (errors: FieldErrors): { ok: false; errors: FieldErrors } => ({ ok: false, errors });

/** جایگزینی یک رکورد در آرایه بر اساس شناسه */
const upsert = <T extends { id: ID }>(items: T[], next: T): T[] =>
  items.map((i) => (i.id === next.id ? next : i));

/* ========================================================================== */
/* SC-01 — ثبت آگهی موجودی مازاد توسط فروشنده                                 */
/* ========================================================================== */

export interface CreateListingInput extends ListingDraftInput {
  specsTyped: FabricSpecs;
  images: { src: string; caption: string; isDefectEvidence: boolean }[];
  /** انتشار مستقیم یا ارسال برای تأیید مدیر سامانه */
  submitForReview: boolean;
}

export const createListing = (
  db: DatabaseShape,
  sellerId: ID,
  input: CreateListingInput,
): ServiceResult<FabricListing> => {
  const category = db.categories.find((c) => c.id === input.categoryId);
  const v = validateListingDraft({ ...input, imageCount: input.images.length }, category);
  if (!v.ok) return err(v.errors);
  if (!category) return err({ categoryId: 'دسته انتخاب‌شده معتبر نیست.' });

  const seller = db.users.find((u) => u.id === sellerId);
  if (!seller || (seller.role !== 'seller' && seller.role !== 'admin'))
    return err({ _form: 'تنها حساب فروشنده مجاز به ثبت آگهی است.' });

  const id = uid('lst');
  const listing: FabricListing = {
    id,
    code: humanCode('TRN', nextSeq(db.listings, 'TRN', 1001)),
    sellerId,
    categoryId: category.id,
    title: input.title.trim(),
    description: input.description.trim(),
    specs: input.specsTyped,
    unit: category.unit,
    totalQuantity: input.totalQuantity,
    availableQuantity: input.totalQuantity,
    reservedQuantity: 0,
    soldQuantity: 0,
    minOrderQuantity: input.minOrderQuantity,
    pricePerUnit: input.pricePerUnit,
    negotiable: input.negotiable,
    qualityGrade: input.qualityGrade as QualityGrade,
    defects: input.defects.trim(),
    province: input.province.trim(),
    city: input.city.trim(),
    status: input.submitForReview ? 'pending' : 'draft',
    moderationNote: null,
    createdAt: now(),
    updatedAt: now(),
  };

  const images = input.images.map((img, idx) => ({
    id: uid('img'),
    listingId: id,
    src: img.src,
    caption: img.caption,
    isDefectEvidence: img.isDefectEvidence,
    order: idx,
  }));

  const tx = inv.makeTx({
    listingId: id,
    kind: 'initial',
    quantity: listing.totalQuantity,
    ledger: inv.ledgerOf(listing),
    refType: 'listing',
    refId: id,
    actorId: sellerId,
    note: 'ثبت موجودی اولیه آگهی',
  });

  return {
    ok: true,
    data: listing,
    db: {
      ...db,
      listings: [listing, ...db.listings],
      listingImages: [...db.listingImages, ...images],
      inventoryTransactions: [tx, ...db.inventoryTransactions],
    },
  };
};

/* ========================================================================== */
/* SC-02 — داوری آگهی توسط مدیر سامانه                                        */
/* ========================================================================== */

export const moderateListing = (
  db: DatabaseShape,
  adminId: ID,
  listingId: ID,
  decision: 'approve' | 'reject',
  note: string,
): ServiceResult<FabricListing> => {
  const admin = db.users.find((u) => u.id === adminId);
  if (!admin || admin.role !== 'admin') return err({ _form: 'این عملیات تنها برای مدیر سامانه مجاز است.' });

  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) return err({ _form: 'آگهی یافت نشد.' });
  if (listing.status !== 'pending' && listing.status !== 'active')
    return err({ _form: 'تنها آگهی‌های «در انتظار تأیید» یا «فعال» قابل داوری هستند.' });
  if (decision === 'reject' && note.trim().length < 5)
    return err({ note: 'ذکر دلیل رد آگهی (حداقل ۵ نویسه) الزامی است.' });

  const next: FabricListing = {
    ...listing,
    status: decision === 'approve' ? 'active' : 'rejected',
    moderationNote: note.trim() || null,
    updatedAt: now(),
  };

  return { ok: true, data: next, db: { ...db, listings: upsert(db.listings, next) } };
};

/** توقف/فعال‌سازی آگهی توسط فروشنده (SC-02ب) */
export const toggleListingPause = (
  db: DatabaseShape,
  sellerId: ID,
  listingId: ID,
): ServiceResult<FabricListing> => {
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) return err({ _form: 'آگهی یافت نشد.' });
  if (listing.sellerId !== sellerId) return err({ _form: 'این آگهی به حساب شما تعلق ندارد.' });
  if (listing.status !== 'active' && listing.status !== 'paused')
    return err({ _form: 'تنها آگهی فعال یا متوقف‌شده قابل تغییر وضعیت است.' });
  if (listing.status === 'active' && listing.reservedQuantity > 0)
    return err({ _form: 'تا تعیین تکلیف مقدار رزروشده، توقف آگهی امکان‌پذیر نیست.' });

  const next: FabricListing = {
    ...listing,
    status: listing.status === 'active' ? 'paused' : 'active',
    updatedAt: now(),
  };
  return { ok: true, data: next, db: { ...db, listings: upsert(db.listings, next) } };
};

/* ========================================================================== */
/* SC-03 — ثبت درخواست خرید توسط خریدار                                       */
/* ========================================================================== */

export const submitPurchaseRequest = (
  db: DatabaseShape,
  buyerId: ID,
  listingId: ID,
  input: { quantity: number; message: string },
): ServiceResult<PurchaseRequest> => {
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) return err({ _form: 'آگهی یافت نشد.' });

  const buyer = db.users.find((u) => u.id === buyerId);
  if (!buyer) return err({ _form: 'برای ثبت درخواست باید وارد سامانه شوید.' });
  if (buyer.role === 'admin') return err({ _form: 'حساب مدیر سامانه مجاز به ثبت درخواست خرید نیست.' });

  const v = validatePurchaseRequest(input, listing, buyerId);
  if (!v.ok) return err(v.errors);

  // قاعده ضد درخواست تکراری: یک درخواست باز برای هر خریدار روی هر آگهی
  const duplicate = db.purchaseRequests.find(
    (r) =>
      r.listingId === listingId &&
      r.buyerId === buyerId &&
      (r.status === 'pending' || r.status === 'awaiting_buyer'),
  );
  if (duplicate)
    return err({
      _form: `شما یک درخواست باز (${duplicate.code}) روی این آگهی دارید؛ ابتدا آن را تعیین تکلیف کنید.`,
    });

  const request: PurchaseRequest = {
    id: uid('req'),
    code: humanCode('REQ', nextSeq(db.purchaseRequests, 'REQ', 10201)),
    listingId,
    buyerId,
    sellerId: listing.sellerId,
    quantity: input.quantity,
    quotedUnitPrice: listing.pricePerUnit,
    message: input.message.trim(),
    status: 'pending',
    rejectionReason: null,
    priceOfferId: null,
    orderId: null,
    createdAt: now(),
    updatedAt: now(),
  };

  return {
    ok: true,
    data: request,
    db: { ...db, purchaseRequests: [request, ...db.purchaseRequests] },
  };
};

/* ========================================================================== */
/* SC-04 — بررسی درخواست توسط فروشنده: پذیرش با پیشنهاد قیمت یا رد با دلیل     */
/* ========================================================================== */

export const respondToRequest = (
  db: DatabaseShape,
  sellerId: ID,
  requestId: ID,
  decision:
    | { kind: 'accept'; unitPrice: number; quantity: number; note: string }
    | { kind: 'reject'; reason: string },
): ServiceResult<PurchaseRequest> => {
  const request = db.purchaseRequests.find((r) => r.id === requestId);
  if (!request) return err({ _form: 'درخواست یافت نشد.' });
  if (request.sellerId !== sellerId) return err({ _form: 'این درخواست به آگهی‌های شما مربوط نیست.' });

  const listing = db.listings.find((l) => l.id === request.listingId);
  if (!listing) return err({ _form: 'آگهی مرتبط یافت نشد.' });

  if (decision.kind === 'reject') {
    if (!canTransition(REQUEST_TRANSITIONS, request.status, 'rejected'))
      return err({ _form: 'در وضعیت فعلی، رد این درخواست مجاز نیست.' });
    const v = validateRejection(decision.reason);
    if (!v.ok) return err(v.errors);

    const next: PurchaseRequest = {
      ...request,
      status: 'rejected',
      rejectionReason: decision.reason.trim(),
      updatedAt: now(),
    };
    return { ok: true, data: next, db: { ...db, purchaseRequests: upsert(db.purchaseRequests, next) } };
  }

  if (!canTransition(REQUEST_TRANSITIONS, request.status, 'awaiting_buyer'))
    return err({ _form: 'در وضعیت فعلی، پذیرش این درخواست مجاز نیست.' });

  const v = validatePriceOffer(decision.unitPrice, decision.quantity, listing);
  if (!v.ok) return err(v.errors);

  const offer: PriceOffer = {
    id: uid('ofr'),
    requestId: request.id,
    byUserId: sellerId,
    unitPrice: decision.unitPrice,
    quantity: decision.quantity,
    note: decision.note.trim(),
    createdAt: now(),
  };

  const next: PurchaseRequest = {
    ...request,
    status: 'awaiting_buyer',
    priceOfferId: offer.id,
    quantity: decision.quantity,
    rejectionReason: null,
    updatedAt: now(),
  };

  return {
    ok: true,
    data: next,
    db: {
      ...db,
      priceOffers: [offer, ...db.priceOffers],
      purchaseRequests: upsert(db.purchaseRequests, next),
    },
  };
};

/* ========================================================================== */
/* SC-05 — تأیید خریدار، ایجاد سفارش و رزرو موجودی                            */
/* ========================================================================== */

export const confirmOfferAndCreateOrder = (
  db: DatabaseShape,
  buyerId: ID,
  requestId: ID,
): ServiceResult<Order> => {
  const request = db.purchaseRequests.find((r) => r.id === requestId);
  if (!request) return err({ _form: 'درخواست یافت نشد.' });
  if (request.buyerId !== buyerId) return err({ _form: 'این درخواست به حساب شما تعلق ندارد.' });
  if (!canTransition(REQUEST_TRANSITIONS, request.status, 'converted'))
    return err({ _form: 'این درخواست در وضعیت قابل تأیید نیست.' });

  const listing = db.listings.find((l) => l.id === request.listingId);
  if (!listing) return err({ _form: 'آگهی مرتبط یافت نشد.' });

  const offer = db.priceOffers.find((o) => o.id === request.priceOfferId);
  const unitPrice = offer?.unitPrice ?? request.quotedUnitPrice;
  const quantity = offer?.quantity ?? request.quantity;

  // نگهبان بیش‌فروشی: ممکن است بین پذیرش فروشنده و تأیید خریدار، موجودی کاهش یافته باشد.
  const reserved = inv.reserve(inv.ledgerOf(listing), quantity);
  if (!reserved.ok) return err({ _form: reserved.error.message });

  const order: Order = {
    id: uid('ord'),
    code: humanCode('ORD', nextSeq(db.orders, 'ORD', 5501)),
    requestId: request.id,
    listingId: listing.id,
    buyerId,
    sellerId: listing.sellerId,
    quantity,
    unitPrice,
    totalAmount: Math.round(quantity * unitPrice),
    status: 'awaiting_payment',
    createdAt: now(),
    updatedAt: now(),
  };

  const nextListing: FabricListing = {
    ...listing,
    availableQuantity: reserved.ledger.available,
    reservedQuantity: reserved.ledger.reserved,
    soldQuantity: reserved.ledger.sold,
    status: inv.deriveListingStatus(listing.status, reserved.ledger),
    updatedAt: now(),
  };

  const tx: InventoryTransaction = inv.makeTx({
    listingId: listing.id,
    kind: 'reserve',
    quantity,
    ledger: reserved.ledger,
    refType: 'order',
    refId: order.id,
    actorId: buyerId,
    note: `رزرو موجودی برای سفارش ${order.code}`,
  });

  const history: OrderHistory = {
    id: uid('oh'),
    orderId: order.id,
    from: null,
    to: 'awaiting_payment',
    actorId: buyerId,
    note: 'ایجاد سفارش و رزرو موجودی پس از تأیید پیشنهاد فروشنده',
    createdAt: now(),
  };

  const nextRequest: PurchaseRequest = {
    ...request,
    status: 'converted',
    quantity,
    orderId: order.id,
    updatedAt: now(),
  };

  return {
    ok: true,
    data: order,
    db: {
      ...db,
      orders: [order, ...db.orders],
      listings: upsert(db.listings, nextListing),
      purchaseRequests: upsert(db.purchaseRequests, nextRequest),
      inventoryTransactions: [tx, ...db.inventoryTransactions],
      orderHistory: [history, ...db.orderHistory],
    },
  };
};

/* ========================================================================== */
/* SC-06 — پرداخت شبیه‌سازی‌شده: موفق ⇒ قطعی‌سازی فروش، ناموفق ⇒ آزادسازی رزرو  */
/* ========================================================================== */

export const settlePayment = (
  db: DatabaseShape,
  actorId: ID,
  orderId: ID,
  outcome: 'success' | 'failure' | 'cancel',
  failureReason = '',
): ServiceResult<{ order: Order; payment: Payment }> => {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return err({ _form: 'سفارش یافت نشد.' });
  if (order.buyerId !== actorId) return err({ _form: 'این سفارش به حساب شما تعلق ندارد.' });

  const targetStatus =
    outcome === 'success' ? 'paid' : outcome === 'failure' ? 'payment_failed' : 'cancelled';
  if (!canTransition(ORDER_TRANSITIONS, order.status, targetStatus))
    return err({ _form: `گذار وضعیت سفارش از «${order.status}» به «${targetStatus}» مجاز نیست.` });

  const listing = db.listings.find((l) => l.id === order.listingId);
  if (!listing) return err({ _form: 'آگهی مرتبط یافت نشد.' });

  const ledgerResult =
    outcome === 'success'
      ? inv.commit(inv.ledgerOf(listing), order.quantity)
      : inv.release(inv.ledgerOf(listing), order.quantity);
  if (!ledgerResult.ok) return err({ _form: ledgerResult.error.message });

  const payment: Payment = {
    id: uid('pay'),
    orderId: order.id,
    amount: order.totalAmount,
    gateway: 'mock-gateway',
    status: outcome === 'success' ? 'success' : 'failed',
    reference: `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    failureReason:
      outcome === 'success'
        ? null
        : failureReason ||
          (outcome === 'cancel' ? 'انصراف خریدار از پرداخت' : 'خطای شبیه‌سازی‌شده درگاه'),
    createdAt: now(),
  };

  const nextOrder: Order = { ...order, status: targetStatus, updatedAt: now() };

  const nextListing: FabricListing = {
    ...listing,
    availableQuantity: ledgerResult.ledger.available,
    reservedQuantity: ledgerResult.ledger.reserved,
    soldQuantity: ledgerResult.ledger.sold,
    status: inv.deriveListingStatus(listing.status, ledgerResult.ledger),
    updatedAt: now(),
  };

  const tx = inv.makeTx({
    listingId: listing.id,
    kind: outcome === 'success' ? 'commit' : 'release',
    quantity: order.quantity,
    ledger: ledgerResult.ledger,
    refType: 'order',
    refId: order.id,
    actorId,
    note:
      outcome === 'success'
        ? `قطعی‌سازی فروش پس از پرداخت موفق سفارش ${order.code}`
        : `آزادسازی رزرو سفارش ${order.code} (${outcome === 'cancel' ? 'انصراف' : 'پرداخت ناموفق'})`,
  });

  const history: OrderHistory = {
    id: uid('oh'),
    orderId: order.id,
    from: order.status,
    to: targetStatus,
    actorId,
    note: payment.failureReason ?? `پرداخت شبیه‌سازی‌شده موفق — مرجع ${payment.reference}`,
    createdAt: now(),
  };

  return {
    ok: true,
    data: { order: nextOrder, payment },
    db: {
      ...db,
      orders: upsert(db.orders, nextOrder),
      listings: upsert(db.listings, nextListing),
      payments: [payment, ...db.payments],
      inventoryTransactions: [tx, ...db.inventoryTransactions],
      orderHistory: [history, ...db.orderHistory],
    },
  };
};

/* ========================================================================== */
/* SC-07 — انصراف خریدار از درخواست باز                                        */
/* ========================================================================== */

export const withdrawRequest = (
  db: DatabaseShape,
  buyerId: ID,
  requestId: ID,
): ServiceResult<PurchaseRequest> => {
  const request = db.purchaseRequests.find((r) => r.id === requestId);
  if (!request) return err({ _form: 'درخواست یافت نشد.' });
  if (request.buyerId !== buyerId) return err({ _form: 'این درخواست به حساب شما تعلق ندارد.' });
  if (!canTransition(REQUEST_TRANSITIONS, request.status, 'withdrawn'))
    return err({ _form: 'این درخواست در وضعیت قابل انصراف نیست.' });

  const next: PurchaseRequest = { ...request, status: 'withdrawn', updatedAt: now() };
  return { ok: true, data: next, db: { ...db, purchaseRequests: upsert(db.purchaseRequests, next) } };
};

/* ========================================================================== */
/* ثبت مصاحبه میدانی (ابزار بخش الف — گزارش اعتبارسنجی)                        */
/* ========================================================================== */

export const addInterview = (
  db: DatabaseShape,
  input: Omit<FieldInterview, 'id' | 'provenance'>,
): ServiceResult<FieldInterview> => {
  const e: FieldErrors = {};
  if (!input.alias.trim()) e.alias = 'کد مستعار مصاحبه‌شونده را وارد کنید.';
  if (!input.businessType.trim()) e.businessType = 'نوع کسب‌وکار را وارد کنید.';
  if (!input.city.trim()) e.city = 'شهر را وارد کنید.';
  if (input.hoursPerDeal !== null && (!Number.isFinite(input.hoursPerDeal) || input.hoursPerDeal < 0))
    e.hoursPerDeal = 'زمان صرف‌شده باید عددی نامنفی باشد.';
  if (Object.keys(e).length) return err(e);

  const record: FieldInterview = { ...input, id: uid('itv'), provenance: 'field-recorded' };
  return { ok: true, data: record, db: { ...db, interviews: [record, ...db.interviews] } };
};

export const removeInterview = (db: DatabaseShape, id: ID): ServiceResult<ID> => ({
  ok: true,
  data: id,
  db: { ...db, interviews: db.interviews.filter((i) => i.id !== id) },
});
