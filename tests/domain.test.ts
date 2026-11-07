/**
 * آزمون لایه دامنه — بدون مرورگر و بدون React.
 * اجرا:  npm run test:domain      (Node 22 با --experimental-strip-types)
 *
 * این آزمون‌ها همان قواعدی را می‌سنجند که در فهرست موارد آزمون پرونده آمده است.
 */

import assert from 'node:assert/strict';
import { buildSeedDatabase } from '../src/lib/store/seed.ts';
import type { DatabaseShape } from '../src/lib/domain/types.ts';
import * as svc from '../src/lib/domain/services.ts';
import { checkInvariant, ledgerOf } from '../src/lib/domain/inventory.ts';
import { filterListings, EMPTY_FILTER, auditInventory } from '../src/lib/domain/queries.ts';

let passed = 0;
let failed = 0;
const results: { id: string; title: string; ok: boolean; error?: string }[] = [];

const test = (id: string, title: string, fn: () => void) => {
  try {
    fn();
    passed += 1;
    results.push({ id, title, ok: true });
    console.log(`  ✓ ${id} — ${title}`);
  } catch (e) {
    failed += 1;
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ id, title, ok: false, error: msg });
    console.log(`  × ${id} — ${title}\n      ${msg}`);
  }
};

/** ناوردا باید پس از هر عملیات و برای هر آگهی برقرار باشد. */
const assertInvariant = (db: DatabaseShape, label: string) => {
  for (const l of db.listings) {
    assert.ok(
      checkInvariant(ledgerOf(l)),
      `نقض ناوردا در ${l.code} (${label}): ${l.totalQuantity} != ${l.availableQuantity}+${l.reservedQuantity}+${l.soldQuantity}`,
    );
  }
  assert.ok(auditInventory(db).every((a) => a.ok), `حسابرسی موجودی ناموفق (${label})`);
};

const SELLER = 'usr_seller_1';
const SELLER2 = 'usr_seller_2';
const BUYER = 'usr_buyer_1';
const BUYER2 = 'usr_buyer_2';
const ADMIN = 'usr_admin';

const validListing = (over: Partial<svc.CreateListingInput> = {}): svc.CreateListingInput => ({
  title: 'کرپ ویسکوز آزمایشی برای سناریو',
  categoryId: 'cat_apparel',
  description: 'موجودی مازاد آزمایشی با توضیح کافی برای گذراندن اعتبارسنجی حداقل بیست نویسه.',
  totalQuantity: 1000,
  minOrderQuantity: 100,
  pricePerUnit: 150000,
  qualityGrade: 'A',
  defects: '',
  province: 'یزد',
  city: 'یزد',
  negotiable: true,
  specs: { fiber: '۱۰۰٪ ویسکوز', width: 150, gsm: 135, color: 'نیلی', application: 'مانتو' },
  specsTyped: { fiber: '۱۰۰٪ ویسکوز', width: 150, gsm: 135, color: 'نیلی', application: 'مانتو' },
  images: [{ src: 'data:image/svg+xml;utf8,<svg/>', caption: 'نمونه', isDefectEvidence: false }],
  imageCount: 1,
  submitForReview: true,
  ...over,
});

console.log('\n=== آزمون لایه دامنه تارنو ===\n');

/* ---------------------------------- SC-01 --------------------------------- */

test('T-01', 'ثبت آگهی با داده معتبر', () => {
  const db = buildSeedDatabase();
  const res = svc.createListing(db, SELLER, validListing());
  assert.ok(res.ok, 'ثبت آگهی باید موفق باشد');
  if (!res.ok) return;
  assert.equal(res.data.status, 'pending');
  assert.equal(res.data.availableQuantity, 1000);
  assert.equal(res.data.reservedQuantity, 0);
  assert.equal(res.data.soldQuantity, 0);
  const tx = res.db.inventoryTransactions.find((t) => t.listingId === res.data.id && t.kind === 'initial');
  assert.ok(tx, 'تراکنش موجودی اولیه باید ثبت شود');
  assertInvariant(res.db, 'T-01');
});

test('T-02', 'رد آگهی با حداقل سفارش بزرگ‌تر از موجودی', () => {
  const db = buildSeedDatabase();
  const res = svc.createListing(db, SELLER, validListing({ totalQuantity: 100, minOrderQuantity: 500 }));
  assert.ok(!res.ok);
  if (res.ok) return;
  assert.ok(res.errors.minOrderQuantity, 'خطای فیلد حداقل سفارش باید اعلام شود');
});

test('T-03', 'رد آگهی درجه B بدون توصیف ایراد', () => {
  const db = buildSeedDatabase();
  const res = svc.createListing(db, SELLER, validListing({ qualityGrade: 'B', defects: '' }));
  assert.ok(!res.ok);
  if (res.ok) return;
  assert.ok(res.errors.defects);
});

test('T-04', 'رد مقادیر فنی خارج از دامنه صنعتی', () => {
  const db = buildSeedDatabase();
  const res = svc.createListing(
    db,
    SELLER,
    validListing({
      specs: { fiber: 'پنبه', width: 900, gsm: 5000, color: 'آبی', application: 'پیراهن' },
    }),
  );
  assert.ok(!res.ok);
  if (res.ok) return;
  assert.ok(res.errors['specs.width'], 'عرض خارج از بازه باید رد شود');
  assert.ok(res.errors['specs.gsm'], 'گراماژ خارج از بازه باید رد شود');
});

test('T-04ب', 'رد آگهی بدون تصویر و با قیمت منفی', () => {
  const db = buildSeedDatabase();
  const res = svc.createListing(db, SELLER, validListing({ images: [], imageCount: 0, pricePerUnit: -10 }));
  assert.ok(!res.ok);
  if (res.ok) return;
  assert.ok(res.errors.images);
  assert.ok(res.errors.pricePerUnit);
});

/* ---------------------------------- SC-02 --------------------------------- */

test('T-05', 'تأیید آگهی توسط مدیر سامانه', () => {
  const db = buildSeedDatabase();
  const created = svc.createListing(db, SELLER, validListing());
  assert.ok(created.ok);
  if (!created.ok) return;
  const res = svc.moderateListing(created.db, ADMIN, created.data.id, 'approve', 'بررسی شد');
  assert.ok(res.ok);
  if (!res.ok) return;
  assert.equal(res.data.status, 'active');
  const inMarket = filterListings(res.db.listings, EMPTY_FILTER, 'newest').some((l) => l.id === res.data.id);
  assert.ok(inMarket, 'آگهی تأییدشده باید در بازارگاه دیده شود');
});

test('T-06', 'رد آگهی بدون ذکر دلیل مسدود می‌شود', () => {
  const db = buildSeedDatabase();
  const res = svc.moderateListing(db, ADMIN, 'lst_9', 'reject', '');
  assert.ok(!res.ok);
  if (res.ok) return;
  assert.ok(res.errors.note);
});

test('T-07', 'کاربر غیرمدیر مجاز به داوری نیست', () => {
  const db = buildSeedDatabase();
  const res = svc.moderateListing(db, SELLER, 'lst_9', 'approve', 'تأیید');
  assert.ok(!res.ok);
});

/* ---------------------------------- SC-03 --------------------------------- */

test('T-08', 'فیلتر چندمعیاره', () => {
  const db = buildSeedDatabase();
  const out = filterListings(
    db.listings,
    { ...EMPTY_FILTER, categoryId: 'cat_upholstery', grades: ['A'], minAvailable: 500 },
    'newest',
  );
  assert.ok(out.length > 0, 'باید حداقل یک نتیجه برگردد');
  for (const l of out) {
    assert.equal(l.categoryId, 'cat_upholstery');
    assert.equal(l.qualityGrade, 'A');
    assert.ok(l.availableQuantity >= 500);
  }
  // آگهی در وضعیت «در انتظار تأیید» نباید در بازارگاه دیده شود
  assert.ok(!out.some((l) => l.status === 'pending'));
});

test('T-09', 'اصلاح خودکار بازه قیمت معکوس', () => {
  const db = buildSeedDatabase();
  const normal = filterListings(db.listings, { ...EMPTY_FILTER, minPrice: 100000, maxPrice: 500000 }, 'newest');
  const reversed = filterListings(db.listings, { ...EMPTY_FILTER, minPrice: 500000, maxPrice: 100000 }, 'newest');
  assert.deepEqual(
    reversed.map((l) => l.id),
    normal.map((l) => l.id),
    'بازه معکوس باید همان نتیجه بازه درست را بدهد',
  );
});

test('T-09ب', 'مرتب‌سازی بر اساس قیمت', () => {
  const db = buildSeedDatabase();
  const asc = filterListings(db.listings, EMPTY_FILTER, 'price-asc');
  for (let i = 1; i < asc.length; i += 1) assert.ok(asc[i].pricePerUnit >= asc[i - 1].pricePerUnit);
});

/* ---------------------------------- SC-04 --------------------------------- */

test('T-11', 'ثبت درخواست خرید معتبر', () => {
  const db = buildSeedDatabase();
  // آگهی lst_3 انتخاب شده است چون داده پایه هیچ درخواست بازی روی آن ندارد.
  const before = db.listings.find((l) => l.id === 'lst_3')!.availableQuantity;
  const res = svc.submitPurchaseRequest(db, BUYER, 'lst_3', { quantity: 300, message: 'آزمون' });
  assert.ok(res.ok);
  if (!res.ok) return;
  assert.equal(res.data.status, 'pending');
  const after = res.db.listings.find((l) => l.id === 'lst_3')!.availableQuantity;
  assert.equal(after, before, 'ثبت درخواست نباید موجودی را تغییر دهد');
  assertInvariant(res.db, 'T-11');
});

test('T-11ب', 'داده پایه، درخواست باز تکراری را روی همان آگهی مسدود می‌کند', () => {
  const db = buildSeedDatabase();
  // در داده پایه، REQ-10202 یک درخواست باز از همین خریدار روی lst_1 است.
  const res = svc.submitPurchaseRequest(db, BUYER, 'lst_1', { quantity: 300, message: '' });
  assert.ok(!res.ok, 'درخواست دوم روی آگهی با درخواست باز باید رد شود');
  if (res.ok) return;
  assert.ok(res.errors._form?.includes('REQ-10202'));
});

test('T-12', 'رد مقدار کمتر از حداقل سفارش', () => {
  const db = buildSeedDatabase();
  const res = svc.submitPurchaseRequest(db, BUYER, 'lst_1', { quantity: 50, message: '' });
  assert.ok(!res.ok);
  if (res.ok) return;
  assert.ok(res.errors.quantity);
});

test('T-13', 'رد مقدار بیشتر از موجودی قابل عرضه', () => {
  const db = buildSeedDatabase();
  const listing = db.listings.find((l) => l.id === 'lst_1')!;
  const res = svc.submitPurchaseRequest(db, BUYER, 'lst_1', {
    quantity: listing.availableQuantity + 1,
    message: '',
  });
  assert.ok(!res.ok);
  if (res.ok) return;
  assert.ok(res.errors.quantity);
});

test('T-13ب', 'رد مقدار صفر و منفی', () => {
  const db = buildSeedDatabase();
  assert.ok(!svc.submitPurchaseRequest(db, BUYER, 'lst_1', { quantity: 0, message: '' }).ok);
  assert.ok(!svc.submitPurchaseRequest(db, BUYER, 'lst_1', { quantity: -5, message: '' }).ok);
  assert.ok(!svc.submitPurchaseRequest(db, BUYER, 'lst_1', { quantity: NaN, message: '' }).ok);
});

test('T-14', 'فروشنده نمی‌تواند آگهی خودش را بخرد', () => {
  const db = buildSeedDatabase();
  const res = svc.submitPurchaseRequest(db, SELLER, 'lst_1', { quantity: 300, message: '' });
  assert.ok(!res.ok);
});

test('T-15', 'جلوگیری از درخواست تکراری باز', () => {
  const db = buildSeedDatabase();
  const first = svc.submitPurchaseRequest(db, BUYER, 'lst_3', { quantity: 300, message: '' });
  assert.ok(first.ok);
  if (!first.ok) return;
  const second = svc.submitPurchaseRequest(first.db, BUYER, 'lst_3', { quantity: 200, message: '' });
  assert.ok(!second.ok);
  if (second.ok) return;
  assert.ok(second.errors._form?.includes('REQ'), 'پیام باید کد درخواست باز را اعلام کند');
});

test('T-15ب', 'درخواست روی آگهی غیرفعال رد می‌شود', () => {
  const db = buildSeedDatabase();
  const res = svc.submitPurchaseRequest(db, BUYER, 'lst_9', { quantity: 200, message: '' });
  assert.ok(!res.ok, 'آگهی در انتظار تأیید نباید درخواست بپذیرد');
});

/* ---------------------------------- SC-05 --------------------------------- */

test('T-16', 'پذیرش درخواست با پیشنهاد قیمت', () => {
  const db = buildSeedDatabase();
  const listingBefore = db.listings.find((l) => l.id === 'lst_2')!;
  const res = svc.respondToRequest(db, SELLER, 'req_seed_1', {
    kind: 'accept',
    unitPrice: 380000,
    quantity: 150,
    note: 'تحویل از انبار یزد',
  });
  assert.ok(res.ok);
  if (!res.ok) return;
  assert.equal(res.data.status, 'awaiting_buyer');
  assert.ok(res.data.priceOfferId, 'رکورد پیشنهاد قیمت باید ساخته شود');
  const listingAfter = res.db.listings.find((l) => l.id === 'lst_2')!;
  assert.equal(
    listingAfter.availableQuantity,
    listingBefore.availableQuantity,
    'پذیرش فروشنده نباید موجودی را رزرو کند',
  );
  assertInvariant(res.db, 'T-16');
});

test('T-17', 'رد درخواست بدون دلیل مسدود می‌شود', () => {
  const db = buildSeedDatabase();
  const res = svc.respondToRequest(db, SELLER, 'req_seed_1', { kind: 'reject', reason: '' });
  assert.ok(!res.ok);
  if (res.ok) return;
  assert.ok(res.errors.reason);
});

test('T-17ب', 'رد درخواست با دلیل معتبر', () => {
  const db = buildSeedDatabase();
  const res = svc.respondToRequest(db, SELLER, 'req_seed_1', {
    kind: 'reject',
    reason: 'این متراژ برای مشتری دیگری رزرو شده است.',
  });
  assert.ok(res.ok);
  if (!res.ok) return;
  assert.equal(res.data.status, 'rejected');
  assert.ok(res.data.rejectionReason);
});

test('T-17ج', 'پذیرش مقدار بیشتر از موجودی رد می‌شود', () => {
  const db = buildSeedDatabase();
  const res = svc.respondToRequest(db, SELLER, 'req_seed_1', {
    kind: 'accept',
    unitPrice: 380000,
    quantity: 999999,
    note: '',
  });
  assert.ok(!res.ok);
});

test('T-17د', 'فروشنده دیگر نمی‌تواند به این درخواست پاسخ دهد', () => {
  const db = buildSeedDatabase();
  const res = svc.respondToRequest(db, SELLER2, 'req_seed_1', {
    kind: 'accept',
    unitPrice: 380000,
    quantity: 150,
    note: '',
  });
  assert.ok(!res.ok);
});

/* ---------------------------------- SC-06 --------------------------------- */

const acceptedChain = () => {
  const db = buildSeedDatabase();
  const accepted = svc.respondToRequest(db, SELLER, 'req_seed_1', {
    kind: 'accept',
    unitPrice: 380000,
    quantity: 150,
    note: '',
  });
  assert.ok(accepted.ok);
  if (!accepted.ok) throw new Error('زنجیره آزمون ساخته نشد');
  return accepted.db;
};

test('T-18', 'تأیید خریدار، ایجاد سفارش و رزرو موجودی', () => {
  const db = acceptedChain();
  const before = db.listings.find((l) => l.id === 'lst_2')!;
  const res = svc.confirmOfferAndCreateOrder(db, BUYER2, 'req_seed_1');
  assert.ok(res.ok);
  if (!res.ok) return;
  const after = res.db.listings.find((l) => l.id === 'lst_2')!;
  assert.equal(res.data.status, 'awaiting_payment');
  assert.equal(after.availableQuantity, before.availableQuantity - 150);
  assert.equal(after.reservedQuantity, before.reservedQuantity + 150);
  assert.equal(after.soldQuantity, before.soldQuantity);
  assert.equal(res.data.totalAmount, 150 * 380000);
  const tx = res.db.inventoryTransactions.find((t) => t.kind === 'reserve' && t.refId === res.data.id);
  assert.ok(tx, 'تراکنش رزرو باید ثبت شود');
  assertInvariant(res.db, 'T-18');
});

test('T-19', 'نگهبان بیش‌فروشی در لحظه تأیید', () => {
  const db = acceptedChain();
  // کاهش دستی موجودی قابل عرضه برای شبیه‌سازی مصرف شدن آن توسط معامله دیگر
  const idx = db.listings.findIndex((l) => l.id === 'lst_2');
  const l = db.listings[idx];
  const shrunk: DatabaseShape = {
    ...db,
    listings: db.listings.map((x, i) =>
      i === idx
        ? {
            ...x,
            availableQuantity: 10,
            soldQuantity: x.soldQuantity + (l.availableQuantity - 10),
          }
        : x,
    ),
  };
  assertInvariant(shrunk, 'T-19 pre');
  const res = svc.confirmOfferAndCreateOrder(shrunk, BUYER2, 'req_seed_1');
  assert.ok(!res.ok, 'تأیید باید رد شود');
  const after = shrunk.listings.find((x) => x.id === 'lst_2')!;
  assert.equal(after.availableQuantity, 10, 'دفتر موجودی نباید تغییر کند');
});

test('T-19ب', 'تأیید درخواست کاربر دیگر مجاز نیست', () => {
  const db = acceptedChain();
  const res = svc.confirmOfferAndCreateOrder(db, BUYER, 'req_seed_1');
  assert.ok(!res.ok);
});

test('T-19ج', 'تأیید دوباره یک درخواست تبدیل‌شده رد می‌شود', () => {
  const db = acceptedChain();
  const first = svc.confirmOfferAndCreateOrder(db, BUYER2, 'req_seed_1');
  assert.ok(first.ok);
  if (!first.ok) return;
  const second = svc.confirmOfferAndCreateOrder(first.db, BUYER2, 'req_seed_1');
  assert.ok(!second.ok);
});

/* ---------------------------------- SC-07 --------------------------------- */

const orderedChain = () => {
  const db = acceptedChain();
  const order = svc.confirmOfferAndCreateOrder(db, BUYER2, 'req_seed_1');
  assert.ok(order.ok);
  if (!order.ok) throw new Error('زنجیره سفارش ساخته نشد');
  return { db: order.db, order: order.data };
};

test('T-20', 'پرداخت موفق — انتقال رزرو به فروخته‌شده', () => {
  const { db, order } = orderedChain();
  const before = db.listings.find((l) => l.id === 'lst_2')!;
  const res = svc.settlePayment(db, BUYER2, order.id, 'success');
  assert.ok(res.ok);
  if (!res.ok) return;
  const after = res.db.listings.find((l) => l.id === 'lst_2')!;
  assert.equal(res.data.order.status, 'paid');
  assert.equal(res.data.payment.status, 'success');
  assert.equal(after.reservedQuantity, before.reservedQuantity - 150);
  assert.equal(after.soldQuantity, before.soldQuantity + 150);
  assert.equal(after.availableQuantity, before.availableQuantity);
  assert.ok(res.db.inventoryTransactions.some((t) => t.kind === 'commit' && t.refId === order.id));
  assertInvariant(res.db, 'T-20');
});

test('T-21', 'پرداخت ناموفق — آزادسازی رزرو', () => {
  const { db, order } = orderedChain();
  const before = db.listings.find((l) => l.id === 'lst_2')!;
  const res = svc.settlePayment(db, BUYER2, order.id, 'failure');
  assert.ok(res.ok);
  if (!res.ok) return;
  const after = res.db.listings.find((l) => l.id === 'lst_2')!;
  assert.equal(res.data.order.status, 'payment_failed');
  assert.equal(after.availableQuantity, before.availableQuantity + 150);
  assert.equal(after.reservedQuantity, before.reservedQuantity - 150);
  assert.equal(after.soldQuantity, before.soldQuantity);
  assert.ok(res.db.inventoryTransactions.some((t) => t.kind === 'release' && t.refId === order.id));
  assertInvariant(res.db, 'T-21');
});

test('T-22', 'انصراف از پرداخت — آزادسازی رزرو و لغو سفارش', () => {
  const { db, order } = orderedChain();
  const before = db.listings.find((l) => l.id === 'lst_2')!;
  const res = svc.settlePayment(db, BUYER2, order.id, 'cancel');
  assert.ok(res.ok);
  if (!res.ok) return;
  assert.equal(res.data.order.status, 'cancelled');
  const after = res.db.listings.find((l) => l.id === 'lst_2')!;
  assert.equal(after.availableQuantity, before.availableQuantity + 150);
  assertInvariant(res.db, 'T-22');
});

test('T-23', 'پرداخت مجدد سفارش پرداخت‌شده رد می‌شود', () => {
  const { db, order } = orderedChain();
  const paid = svc.settlePayment(db, BUYER2, order.id, 'success');
  assert.ok(paid.ok);
  if (!paid.ok) return;
  const again = svc.settlePayment(paid.db, BUYER2, order.id, 'success');
  assert.ok(!again.ok, 'گذار دوباره نباید مجاز باشد');
  const after = again.ok ? null : paid.db.listings.find((l) => l.id === 'lst_2')!;
  assert.ok(after && after.soldQuantity === 450, 'موجودی فروخته‌شده نباید دوباره افزایش یابد');
});

test('T-23ب', 'پرداخت سفارش کاربر دیگر رد می‌شود', () => {
  const { db, order } = orderedChain();
  const res = svc.settlePayment(db, BUYER, order.id, 'success');
  assert.ok(!res.ok);
});

/* ------------------------------- یکپارچگی ------------------------------- */

test('T-24', 'ناوردای موجودی در سراسر چرخه کامل', () => {
  let db = buildSeedDatabase();
  assertInvariant(db, 'گام ۰ — داده پایه');

  const created = svc.createListing(db, SELLER, validListing({ totalQuantity: 500, minOrderQuantity: 50 }));
  assert.ok(created.ok);
  if (!created.ok) return;
  db = created.db;
  assertInvariant(db, 'گام ۱ — ثبت آگهی');

  const approved = svc.moderateListing(db, ADMIN, created.data.id, 'approve', 'ok');
  assert.ok(approved.ok);
  if (!approved.ok) return;
  db = approved.db;
  assertInvariant(db, 'گام ۲ — تأیید');

  const req = svc.submitPurchaseRequest(db, BUYER, created.data.id, { quantity: 200, message: '' });
  assert.ok(req.ok);
  if (!req.ok) return;
  db = req.db;
  assertInvariant(db, 'گام ۳ — درخواست');

  const acc = svc.respondToRequest(db, SELLER, req.data.id, {
    kind: 'accept',
    unitPrice: 140000,
    quantity: 200,
    note: '',
  });
  assert.ok(acc.ok);
  if (!acc.ok) return;
  db = acc.db;
  assertInvariant(db, 'گام ۴ — پذیرش');

  const ord = svc.confirmOfferAndCreateOrder(db, BUYER, req.data.id);
  assert.ok(ord.ok);
  if (!ord.ok) return;
  db = ord.db;
  assertInvariant(db, 'گام ۵ — رزرو');

  const pay = svc.settlePayment(db, BUYER, ord.data.id, 'success');
  assert.ok(pay.ok);
  if (!pay.ok) return;
  db = pay.db;
  assertInvariant(db, 'گام ۶ — پرداخت');

  const final = db.listings.find((l) => l.id === created.data.id)!;
  assert.equal(final.totalQuantity, 500);
  assert.equal(final.soldQuantity, 200);
  assert.equal(final.availableQuantity, 300);
  assert.equal(final.reservedQuantity, 0);
});

test('T-25', 'فروش جزئی به دو خریدار مستقل بدون بیش‌فروشی', () => {
  let db = buildSeedDatabase();
  const created = svc.createListing(db, SELLER, validListing({ totalQuantity: 300, minOrderQuantity: 50 }));
  assert.ok(created.ok);
  if (!created.ok) return;
  db = created.db;
  const approved = svc.moderateListing(db, ADMIN, created.data.id, 'approve', 'ok');
  assert.ok(approved.ok);
  if (!approved.ok) return;
  db = approved.db;
  const lid = created.data.id;

  const run = (buyer: string, quantity: number) => {
    const r = svc.submitPurchaseRequest(db, buyer, lid, { quantity, message: '' });
    if (!r.ok) return r;
    db = r.db;
    const a = svc.respondToRequest(db, SELLER, r.data.id, {
      kind: 'accept',
      unitPrice: 150000,
      quantity,
      note: '',
    });
    if (!a.ok) return a;
    db = a.db;
    const o = svc.confirmOfferAndCreateOrder(db, buyer, r.data.id);
    if (!o.ok) return o;
    db = o.db;
    const p = svc.settlePayment(db, buyer, o.data.id, 'success');
    if (!p.ok) return p;
    db = p.db;
    return p;
  };

  assert.ok(run(BUYER, 200).ok, 'خرید اول باید موفق باشد');
  assertInvariant(db, 'T-25 پس از خرید اول');
  assert.ok(run(BUYER2, 100).ok, 'خرید دوم باید موفق باشد');
  assertInvariant(db, 'T-25 پس از خرید دوم');

  const l = db.listings.find((x) => x.id === lid)!;
  assert.equal(l.soldQuantity, 300);
  assert.equal(l.availableQuantity, 0);
  assert.equal(l.status, 'sold_out', 'با صفر شدن موجودی، وضعیت باید «موجودی تمام» شود');

  // تلاش سوم باید رد شود چون موجودی قابل عرضه صفر است
  const third = svc.submitPurchaseRequest(db, BUYER, lid, { quantity: 50, message: '' });
  assert.ok(!third.ok, 'درخواست پس از تمام شدن موجودی باید رد شود');
});

test('T-25ب', 'ابزار ثبت مصاحبه، رکورد را با برچسب میدانی ذخیره می‌کند', () => {
  const db = buildSeedDatabase();
  const res = svc.addInterview(db, {
    alias: 'ف-۰۱',
    side: 'seller',
    businessType: 'کارخانه نساجی',
    city: 'یزد',
    date: new Date().toISOString(),
    verdicts: { H1: 'support', H3: 'reject' },
    hoursPerDeal: 12,
    notes: 'آزمون',
  });
  assert.ok(res.ok);
  if (!res.ok) return;
  assert.equal(res.data.provenance, 'field-recorded');
  assert.equal(res.db.interviews.filter((i) => i.provenance === 'field-recorded').length, 1);
});

test('T-25ج', 'داده پایه از ابتدا ناوردا را رعایت می‌کند', () => {
  const db = buildSeedDatabase();
  assertInvariant(db, 'seed');
  assert.ok(db.listings.length >= 10, 'داده پایه باید حداقل ۱۰ آگهی داشته باشد');
  assert.ok(db.users.length >= 5, 'حساب‌های دمو برای هر سه نقش باید موجود باشد');
});

/* --------------------------------- گزارش --------------------------------- */

console.log(`\n=== نتیجه: ${passed} موفق، ${failed} ناموفق از ${passed + failed} مورد ===\n`);
if (failed > 0) process.exit(1);
