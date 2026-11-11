/**
 * آزمون یکپارچه رابط کاربری — اجرای واقعی سناریوها روی DOM.
 *
 * این آزمون‌ها جایگزین بخشی از «آزمون دستی مرورگر» هستند: کامپوننت‌ها در یک DOM
 * واقعی (jsdom) سوار می‌شوند، کلیک و تایپ انجام می‌شود و نتیجه هم در رابط کاربری
 * و هم در لایه داده بررسی می‌گردد.
 *
 * اجرا: npm run test:ui
 */

import './support/jsdom-setup.ts'; // باید نخستین ایمپورت باشد

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../src/App.tsx';
import { StoreProvider } from '../src/lib/store/StoreProvider.tsx';
import { buildSeedDatabase } from '../src/lib/store/seed.ts';
import type { DatabaseShape } from '../src/lib/domain/types.ts';
import { blurField, click, exactButton, fill, hasText, mustButton, mustFind } from './support/dom-helpers.ts';

const STORAGE_KEY = 'tarno.db.v1';

let passed = 0;
let failed = 0;

/** وضعیت ذخیره‌شده در حافظه مرورگر ساختگی */
const readDb = (): DatabaseShape => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
const writeDb = (db: DatabaseShape) => localStorage.setItem(STORAGE_KEY, JSON.stringify(db));

const seedWithSession = (userId: string | null) => {
  writeDb({ ...buildSeedDatabase(), session: { userId } });
};

let container: HTMLElement;
let root: Root;

/** سوار کردن برنامه روی یک مسیر مشخص */
const mount = async (route: string) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[route]}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </MemoryRouter>,
    );
  });
};

const unmount = async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
};

/** هر تعامل باید درون act انجام شود تا React وضعیت را اعمال کند. */
const interact = async (fn: () => void) => {
  await act(async () => {
    fn();
  });
};

const test = async (id: string, title: string, fn: () => Promise<void>) => {
  // هر آزمون با حافظه و DOM تازه شروع می‌شود
  localStorage.clear();
  document.body.innerHTML = '';
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${id} — ${title}`);
  } catch (e) {
    failed += 1;
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  × ${id} — ${title}\n      ${msg}`);
  }
};

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

console.log('\n=== آزمون یکپارچه رابط کاربری (jsdom) ===\n');

/* ========================================================================== */
/* UI-01 — ورود با حساب دمو                                                   */
/* ========================================================================== */

await test('UI-01', 'ورود سریع با حساب فروشنده و نمایش داشبورد', async () => {
  seedWithSession(null);
  await mount('/mvp/login');
  assert(hasText('ورود سریع با حساب‌های دمو'), 'صفحه ورود نمایش داده نشد');

  const buttons = [...document.querySelectorAll('button')].filter((b) =>
    (b.textContent ?? '').includes('ورود با این حساب'),
  );
  assert(buttons.length >= 5, 'دکمه‌های ورود سریع برای همه حساب‌ها وجود ندارد');
  await interact(() => click(buttons[0])); // seller@tarno.ir

  assert(readDb().session.userId === 'usr_seller_1', 'نشست فروشنده ثبت نشد');
  assert(hasText('نساجی رستگار'), 'داشبورد فروشنده پس از ورود نمایش داده نشد');
  await unmount();
});

/* ========================================================================== */
/* UI-02 — ورود نامعتبر                                                       */
/* ========================================================================== */

await test('UI-02', 'ورود با گذرواژه نادرست پیام خطا می‌دهد و نشست نمی‌سازد', async () => {
  seedWithSession(null);
  await mount('/mvp/login');
  await interact(() => fill('login-email', 'seller@tarno.ir'));
  await interact(() => fill('login-pass', 'wrong-password'));
  const submit = document.querySelector('form button[type="submit"]');
  assert(!!submit, 'دکمه ارسال فرم ورود پیدا نشد');
  await interact(() => click(submit!));
  assert(hasText('ایمیل یا گذرواژه نادرست است'), 'پیام خطای ورود نمایش داده نشد');
  assert(readDb().session.userId === null, 'نشست نباید ساخته شود');
  await unmount();
});

/* ========================================================================== */
/* UI-03 — حالت خالی نتایج جستجو (جایگزین آزمون دستی T-10)                     */
/* ========================================================================== */

await test('UI-03', 'فیلتر بیش از حد محدودکننده، حالت خالی معنادار نشان می‌دهد', async () => {
  seedWithSession(null);
  await mount('/mvp');
  assert(hasText('آگهی یافت شد'), 'شمارنده نتایج نمایش داده نشد');

  await interact(() => click(mustButton('فیلتر فنی')));
  await interact(() => fill('f-minq', '999999'));

  assert(hasText('هیچ آگهی‌ای با این معیارها پیدا نشد'), 'حالت خالی نمایش داده نشد');
  assert(
    hasText('محدودکننده‌ترین معیار'),
    'پیام راهنمای حالت خالی (پیشنهاد حذف محدودکننده‌ترین فیلتر) نمایش داده نشد',
  );

  // بازنشانی فیلترها باید کادر عددی را هم خالی کند
  await interact(() => click(mustButton('بازنشانی فیلترها')));
  const minq = document.getElementById('f-minq') as HTMLInputElement | null;
  assert(!minq || minq.value === '', 'کادر فیلتر عددی پس از بازنشانی خالی نشد');
  assert(!hasText('هیچ آگهی‌ای با این معیارها پیدا نشد'), 'نتایج پس از بازنشانی برنگشت');
  await unmount();
});

/* ========================================================================== */
/* UI-04 — ثبت آگهی از طریق فرم + اعتبارسنجی                                   */
/* ========================================================================== */

await test('UI-04', 'ثبت آگهی از فرم: ابتدا رد با خطا، سپس ثبت موفق', async () => {
  seedWithSession('usr_seller_1');
  await mount('/mvp/seller/new');
  assert(hasText('ثبت شناسنامه فنی موجودی مازاد'), 'فرم ثبت آگهی نمایش داده نشد');

  // انتخاب دسته «پارچه مبلمان» تا فیلد «چرخه سایش» الزامی شود
  await interact(() => click(mustFind('پارچه مبلمان', 'button')));
  assert(
    document.getElementById('spec-rubCycles') !== null,
    'فیلد وابسته به دسته (چرخه سایش مارتیندیل) ساخته نشد',
  );

  // تلاش اول: حداقل سفارش بزرگ‌تر از موجودی + درجه B بدون توصیف ایراد
  const typeInto = async (entries: [string, string][]) => {
    for (const [id, value] of entries) await interact(() => fill(id, value));
  };
  await typeInto([
    ['l-title', 'مخمل مبلی آزمایشی برای سناریوی یکپارچه'],
    ['l-desc', 'موجودی مازاد آزمایشی با توضیح کافی برای گذراندن اعتبارسنجی بیست نویسه.'],
    ['spec-fiber', '۱۰۰٪ پلی‌استر'],
    ['spec-width', '۱۴۰'],
    ['spec-gsm', '۳۴۰'],
    ['spec-color', 'خاکی'],
    ['spec-rubCycles', '۴۵۰۰۰'],
    ['l-total', '۱۰۰'],
    ['l-moq', '۵۰۰'],
    ['l-price', '۳۹۵۰۰۰'],
    ['l-prov', 'یزد'],
    ['l-city', 'یزد'],
  ]);
  await interact(() => click(mustFind('درجه B', 'button')));
  await interact(() => click(exactButton('ثبت آگهی')));

  assert(readDb().listings.length === 10, 'آگهی نامعتبر نباید ثبت شود');
  assert(
    hasText('حداقل سفارش نمی‌تواند از موجودی کل بیشتر باشد'),
    'خطای حداقل سفارش نمایش داده نشد',
  );
  assert(
    hasText('برای درجه کیفی B و C، توصیف ایراد'),
    'خطای الزام توصیف ایراد برای درجه B نمایش داده نشد',
  );

  // اصلاح ورودی‌ها و ثبت موفق
  await typeInto([
    ['l-total', '۱۲۰۰'],
    ['l-moq', '۵۰'],
    ['l-defects', 'اختلاف نیم شید رنگ در دو طاقه؛ بافت سالم است.'],
  ]);
  await interact(() => blurField('l-defects'));
  await interact(() => click(exactButton('ثبت آگهی')));

  const db = readDb();
  assert(db.listings.length === 11, 'آگهی معتبر ثبت نشد');
  const created = db.listings[0];
  assert(created.status === 'pending', 'آگهی باید در وضعیت «در انتظار تأیید» باشد');
  assert(created.totalQuantity === 1200, 'موجودی کل درست ثبت نشد');
  assert(created.availableQuantity === 1200, 'موجودی قابل عرضه باید برابر موجودی کل باشد');
  assert(created.specs.rubCycles === 45000, 'مشخصه فنی وابسته به دسته ثبت نشد');
  assert(
    db.inventoryTransactions.some((t) => t.listingId === created.id && t.kind === 'initial'),
    'تراکنش موجودی اولیه ثبت نشد',
  );
  await unmount();
});

/* ========================================================================== */
/* UI-05 — چرخه کامل معامله از رابط کاربری                                    */
/* ========================================================================== */

await test('UI-05', 'چرخه کامل: پذیرش فروشنده ← تأیید خریدار ← پرداخت موفق', async () => {
  /*
   * درخواست هدف این آزمون REQ-10202 است: تازه‌ترین درخواست داده پایه و بنابراین
   * نخستین کارت صفحه فروشنده. مربوط به آگهی TRN-1001 (lst_1) و خریدار آوین است.
   */
  seedWithSession('usr_seller_1');
  await mount('/mvp/seller/requests');
  assert(hasText('REQ-10202'), 'درخواست داده پایه در صفحه فروشنده دیده نشد');

  await interact(() => click(mustButton('پذیرش و پیشنهاد قیمت')));
  const priceField = [...document.querySelectorAll('input')].find((i) =>
    i.id.startsWith('of-price-'),
  );
  assert(!!priceField, 'فرم پیشنهاد قیمت باز نشد');
  assert(priceField!.id.endsWith('req_seed_2'), 'فرم پیشنهاد روی درخواست مورد انتظار باز نشد');
  await interact(() => fill(priceField!.id, '۱۴۰۰۰۰'));
  await interact(() => click(mustButton('ثبت پیشنهاد و ارسال به خریدار')));

  let db = readDb();
  const request = db.purchaseRequests.find((r) => r.code === 'REQ-10202')!;
  assert(request.status === 'awaiting_buyer', 'وضعیت درخواست به «در انتظار تأیید خریدار» نرفت');
  const listingAfterAccept = db.listings.find((l) => l.id === 'lst_1')!;
  assert(listingAfterAccept.reservedQuantity === 0, 'پذیرش فروشنده نباید رزرو ایجاد کند');
  await unmount();

  // گام ۲ — خریدار پیشنهاد را تأیید می‌کند و سفارش ساخته می‌شود
  writeDb({ ...readDb(), session: { userId: 'usr_buyer_1' } });
  await mount('/mvp/buyer/requests');
  assert(hasText('پیشنهاد نهایی فروشنده'), 'پیشنهاد فروشنده برای خریدار نمایش داده نشد');

  const availableBefore = readDb().listings.find((l) => l.id === 'lst_1')!.availableQuantity;
  await interact(() => click(mustButton('تأیید پیشنهاد و ایجاد سفارش')));

  db = readDb();
  const order = db.orders[0];
  assert(!!order, 'سفارش ایجاد نشد');
  assert(order.status === 'awaiting_payment', 'وضعیت سفارش «در انتظار پرداخت» نیست');
  assert(order.unitPrice === 140000, 'قیمت پیشنهادی فروشنده در سفارش اعمال نشد');
  assert(order.quantity === 300, 'مقدار سفارش درست نیست');
  const afterReserve = db.listings.find((l) => l.id === 'lst_1')!;
  assert(
    afterReserve.availableQuantity === availableBefore - 300,
    'موجودی قابل عرضه پس از رزرو کاهش نیافت',
  );
  assert(afterReserve.reservedQuantity === 300, 'مقدار رزروشده درست به‌روز نشد');

  // گام ۳ — پرداخت موفق
  await interact(() => click(mustButton('پرداخت شبیه‌سازی‌شده')));
  assert(hasText('درگاه ساختگی'), 'درگاه شبیه‌سازی‌شده باز نشد');
  await interact(() => click(mustButton('پرداخت موفق — انتقال رزرو به فروخته‌شده')));

  db = readDb();
  const paidOrder = db.orders.find((o) => o.id === order.id)!;
  const finalListing = db.listings.find((l) => l.id === 'lst_1')!;
  assert(paidOrder.status === 'paid', 'وضعیت سفارش به «پرداخت‌شده» نرفت');
  assert(finalListing.soldQuantity === 720, 'مقدار فروخته‌شده درست به‌روز نشد (۴۲۰ + ۳۰۰)');
  assert(finalListing.reservedQuantity === 0, 'مقدار رزروشده پس از قطعی‌سازی باید صفر باشد');
  assert(
    Math.abs(
      finalListing.totalQuantity -
        (finalListing.availableQuantity + finalListing.reservedQuantity + finalListing.soldQuantity),
    ) < 1e-6,
    'ناوردای دفتر موجودی نقض شد',
  );
  assert(db.payments[0]?.status === 'success', 'رکورد پرداخت موفق ثبت نشد');
  await unmount();
});

/* ========================================================================== */
/* UI-06 — پرداخت ناموفق، رزرو را آزاد می‌کند                                  */
/* ========================================================================== */

await test('UI-06', 'پرداخت ناموفق از رابط کاربری، رزرو را آزاد می‌کند', async () => {
  const db = buildSeedDatabase();
  const listing = db.listings.find((l) => l.id === 'lst_2')!;
  const availableBefore = listing.availableQuantity;

  // آماده‌سازی: درخواست پذیرفته‌شده و سفارش، با سرویس‌های دامنه ساخته می‌شود
  const { respondToRequest, confirmOfferAndCreateOrder } = await import(
    '../src/lib/domain/services.ts'
  );
  const accepted = respondToRequest(db, 'usr_seller_1', 'req_seed_1', {
    kind: 'accept',
    unitPrice: 380000,
    quantity: 150,
    note: '',
  });
  assert(accepted.ok, 'آماده‌سازی: پذیرش فروشنده ناموفق بود');
  if (!accepted.ok) return;
  const ordered = confirmOfferAndCreateOrder(accepted.db, 'usr_buyer_2', 'req_seed_1');
  assert(ordered.ok, 'آماده‌سازی: ایجاد سفارش ناموفق بود');
  if (!ordered.ok) return;
  writeDb({ ...ordered.db, session: { userId: 'usr_buyer_2' } });

  await mount('/mvp/buyer/orders');
  assert(hasText('در انتظار پرداخت'), 'سفارش در انتظار پرداخت نمایش داده نشد');
  await interact(() => click(mustButton('پرداخت شبیه‌سازی‌شده')));
  await interact(() => click(mustButton('پرداخت ناموفق — آزادسازی رزرو')));

  const after = readDb();
  const finalListing = after.listings.find((l) => l.id === 'lst_2')!;
  assert(after.orders[0].status === 'payment_failed', 'وضعیت سفارش «پرداخت ناموفق» نشد');
  assert(
    finalListing.availableQuantity === availableBefore,
    'موجودی قابل عرضه به مقدار پیش از رزرو برنگشت',
  );
  assert(finalListing.soldQuantity === listing.soldQuantity, 'مقدار فروخته‌شده نباید تغییر کند');
  assert(
    after.inventoryTransactions.some((t) => t.kind === 'release'),
    'تراکنش آزادسازی رزرو ثبت نشد',
  );
  await unmount();
});

/* ========================================================================== */
/* UI-07 — داوری آگهی توسط مدیر سامانه                                        */
/* ========================================================================== */

await test('UI-07', 'مدیر سامانه آگهی در انتظار را تأیید می‌کند و در بازارگاه ظاهر می‌شود', async () => {
  seedWithSession('usr_admin');
  await mount('/mvp/admin');
  assert(hasText('صف داوری آگهی‌ها'), 'پنل داوری نمایش داده نشد');
  assert(hasText('TRN-1009'), 'آگهی در انتظار تأیید در صف دیده نشد');
  assert(hasText('ناوردا در همه'), 'پنل پایش ناوردا نمایش داده نشد');

  await interact(() => click(mustButton('تأیید و انتشار')));
  const approved = readDb().listings.find((l) => l.code === 'TRN-1009')!;
  assert(approved.status === 'active', 'وضعیت آگهی پس از تأیید «فعال» نشد');
  await unmount();

  // بررسی نمایش در بازارگاه
  await mount('/mvp');
  assert(hasText('TRN-1009') || hasText('پارچه صندلی ضد شعله'), 'آگهی تأییدشده در بازارگاه دیده نشد');
  await unmount();
});

/* ========================================================================== */
/* UI-08 — رد آگهی بدون دلیل مسدود می‌شود                                      */
/* ========================================================================== */

await test('UI-08', 'رد آگهی بدون ذکر دلیل از رابط کاربری مسدود می‌شود', async () => {
  seedWithSession('usr_admin');
  await mount('/mvp/admin');
  await interact(() => click(mustButton('رد آگهی')));
  await interact(() => click(mustButton('ثبت رد آگهی')));
  assert(hasText('ذکر دلیل رد آگهی'), 'پیام الزام ذکر دلیل نمایش داده نشد');
  assert(
    readDb().listings.find((l) => l.code === 'TRN-1009')!.status === 'pending',
    'وضعیت آگهی نباید تغییر کند',
  );
  await unmount();
});

/* ========================================================================== */
/* UI-09 — پایداری داده پس از بازخوانی صفحه (جایگزین آزمون دستی T-26)          */
/* ========================================================================== */

await test('UI-09', 'داده پس از بازخوانی صفحه حفظ می‌شود', async () => {
  seedWithSession('usr_admin');
  await mount('/mvp/admin');
  await interact(() => click(mustButton('تأیید و انتشار')));
  assert(readDb().listings.find((l) => l.code === 'TRN-1009')!.status === 'active', 'تأیید اعمال نشد');
  await unmount();

  // «بازخوانی صفحه»: سوار کردن دوباره برنامه بدون دست زدن به حافظه
  await mount('/mvp/admin');
  assert(
    readDb().listings.find((l) => l.code === 'TRN-1009')!.status === 'active',
    'وضعیت پس از بازخوانی حفظ نشد',
  );
  assert(hasText('صف داوری خالی است'), 'صف داوری پس از بازخوانی درست بازسازی نشد');
  await unmount();
});

/* ========================================================================== */
/* UI-10 — بازنشانی داده پایه (جایگزین آزمون دستی T-27)                        */
/* ========================================================================== */

await test('UI-10', 'بازنشانی داده پایه همه تغییرها را برمی‌گرداند', async () => {
  seedWithSession('usr_admin');
  await mount('/mvp/admin');
  await interact(() => click(mustButton('تأیید و انتشار')));
  assert(readDb().listings.find((l) => l.code === 'TRN-1009')!.status === 'active', 'تأیید اعمال نشد');

  await interact(() => click(mustButton('ابزار داده و سلامت')));
  await interact(() => click(mustButton('بازنشانی داده پایه')));

  const db = readDb();
  assert(
    db.listings.find((l) => l.code === 'TRN-1009')!.status === 'pending',
    'داده به وضعیت پایه برنگشت',
  );
  assert(db.orders.length === 0, 'سفارش‌ها پس از بازنشانی باید خالی باشند');
  assert(db.session.userId === null, 'نشست پس از بازنشانی باید پاک شود');
  await unmount();
});

/* ========================================================================== */
/* UI-11 — ثبت مصاحبه در ابزار اعتبارسنجی (جایگزین آزمون دستی T-29)            */
/* ========================================================================== */

await test('UI-11', 'ثبت مصاحبه میدانی، وضعیت فرضیه‌ها را بازمحاسبه می‌کند', async () => {
  seedWithSession(null);
  await mount('/dossier');
  assert(hasText('مصاحبه میدانی هنوز اجرا نشده است'), 'اعلان وضعیت اعتبارسنجی نمایش داده نشد');
  assert(hasText('نمونه قالب'), 'رکوردهای نمونه قالب برچسب‌گذاری نشده‌اند');

  await interact(() => click(mustButton('مصاحبه جدید')));
  for (const [id, value] of [
    ['itv-alias', 'ف-۰۱'],
    ['itv-type', 'کارخانه نساجی'],
    ['itv-city', 'یزد'],
    ['itv-hours', '۱۴'],
  ] as [string, string][]) {
    await interact(() => fill(id, value));
  }

  // پاسخ «تأیید» به نخستین فرضیه
  const supportButtons = [...document.querySelectorAll('button')].filter(
    (b) => (b.textContent ?? '').trim() === 'تأیید',
  );
  assert(supportButtons.length >= 9, 'دکمه‌های پاسخ به فرضیه‌ها ساخته نشدند');
  await interact(() => click(supportButtons[0]));
  await interact(() => click(mustButton('ثبت مصاحبه')));

  const db = readDb();
  const recorded = db.interviews.filter((i) => i.provenance === 'field-recorded');
  assert(recorded.length === 1, 'رکورد مصاحبه میدانی ثبت نشد');
  assert(recorded[0].alias === 'ف-۰۱', 'کد مستعار درست ثبت نشد');
  assert(recorded[0].hoursPerDeal === 14, 'ارقام فارسی ورودی به عدد تبدیل نشد');
  assert(recorded[0].verdicts.H1 === 'support', 'پاسخ فرضیه ثبت نشد');
  assert(hasText('یافته میدانی'), 'برچسب «یافته میدانی» نمایش داده نشد');
  await unmount();
});

/* ========================================================================== */
/* UI-12 — ثبت مصاحبه بدون فیلدهای الزامی                                     */
/* ========================================================================== */

await test('UI-12', 'ثبت مصاحبه بدون کد مستعار، با خطا رد می‌شود', async () => {
  seedWithSession(null);
  await mount('/dossier');
  await interact(() => click(mustButton('مصاحبه جدید')));
  await interact(() => click(mustButton('ثبت مصاحبه')));
  assert(hasText('کد مستعار مصاحبه‌شونده را وارد کنید'), 'خطای فیلد کد مستعار نمایش داده نشد');
  assert(
    readDb().interviews.filter((i) => i.provenance === 'field-recorded').length === 0,
    'رکورد نامعتبر نباید ثبت شود',
  );
  await unmount();
});

/* ========================================================================== */
/* UI-13 — حذف رکوردهای نمونه قالب                                            */
/* ========================================================================== */

await test('UI-13', 'حذف یک‌جای رکوردهای «نمونه قالب» هر سه رکورد را پاک می‌کند', async () => {
  seedWithSession(null);
  await mount('/dossier');
  assert(
    readDb().interviews.filter((i) => i.provenance === 'template-sample').length === 3,
    'آماده‌سازی: سه رکورد نمونه قالب باید وجود داشته باشد',
  );
  await interact(() => click(mustButton('حذف نمونه‌های قالب')));
  assert(
    readDb().interviews.length === 0,
    'هر سه رکورد نمونه قالب باید در یک اقدام حذف شوند (آزمون نقص وضعیت کهنه)',
  );
  await unmount();
});

/* ========================================================================== */
/* UI-14 — بازسازی کنترل‌شده داده خراب (جایگزین آزمون دستی T-32)                */
/* ========================================================================== */

await test('UI-14', 'داده خراب در حافظه مرورگر، به جای خطا بازسازی می‌شود', async () => {
  localStorage.setItem(STORAGE_KEY, '{این یک JSON معتبر نیست');
  await mount('/mvp');
  const db = readDb();
  assert(db.listings?.length === 10, 'داده پایه بازسازی نشد');
  assert(db.schemaVersion === 1, 'نسخه اسکیما درست ثبت نشد');
  assert(hasText('آگهی یافت شد'), 'بازارگاه پس از بازسازی داده رندر نشد');
  await unmount();

  // ناسازگاری نسخه اسکیما
  writeDb({ ...buildSeedDatabase(), schemaVersion: 99 } as DatabaseShape);
  await mount('/mvp');
  assert(readDb().schemaVersion === 1, 'ناسازگاری نسخه اسکیما به بازسازی داده منتهی نشد');
  await unmount();
});

/* ========================================================================== */
/* UI-15 — قاعده تضاد منافع در رابط کاربری                                     */
/* ========================================================================== */

await test('UI-15', 'فروشنده روی آگهی خودش فرم درخواست خرید نمی‌بیند', async () => {
  seedWithSession('usr_seller_1');
  await mount('/mvp/listing/lst_1');
  assert(hasText('تضاد منافع'), 'پیام تضاد منافع نمایش داده نشد');
  assert(!hasText('ثبت درخواست خرید') || !document.getElementById('req-qty'), 'فرم درخواست نباید در دسترس باشد');
  await unmount();

  // همان آگهی برای خریدار فرم فعال دارد
  seedWithSession('usr_buyer_2');
  await mount('/mvp/listing/lst_1');
  assert(document.getElementById('req-qty') !== null, 'فرم درخواست خرید برای خریدار نمایش داده نشد');
  await unmount();
});

/* ========================================================================== */
/* UI-16 — اعتبارسنجی مقدار درخواست خرید در رابط کاربری                        */
/* ========================================================================== */

await test('UI-16', 'مقدار کمتر از حداقل سفارش در فرم درخواست رد می‌شود', async () => {
  seedWithSession('usr_buyer_2');
  await mount('/mvp/listing/lst_1');
  await interact(() => fill('req-qty', '۵۰'));
  assert(hasText('کمتر از حداقل سفارش'), 'پیام خطای حداقل سفارش به صورت زنده نمایش داده نشد');
  await interact(() => click(mustButton('ثبت درخواست خرید')));
  assert(readDb().purchaseRequests.length === 2, 'درخواست نامعتبر نباید ثبت شود');

  // مقدار معتبر: مبلغ تقریبی محاسبه و درخواست ثبت می‌شود
  await interact(() => fill('req-qty', '۳۰۰'));
  assert(hasText('مبلغ تقریبی این درخواست'), 'پیش‌نمایش مبلغ نمایش داده نشد');
  await interact(() => click(mustButton('ثبت درخواست خرید')));
  const db = readDb();
  assert(db.purchaseRequests.length === 3, 'درخواست معتبر ثبت نشد');
  assert(db.purchaseRequests[0].quantity === 300, 'مقدار درخواست درست ثبت نشد');
  assert(
    db.listings.find((l) => l.id === 'lst_1')!.reservedQuantity === 0,
    'ثبت درخواست نباید موجودی را رزرو کند',
  );
  await unmount();
});

/* ========================================================================== */
/* UI-17 — ماشین‌حساب مدل اتلاف                                                */
/* ========================================================================== */

await test('UI-17', 'تغییر پارامتر ماشین‌حساب اتلاف، خروجی را بازمحاسبه می‌کند', async () => {
  seedWithSession(null);
  await mount('/dossier');
  const slider = document.getElementById('wp-suppliersContacted') as HTMLInputElement | null;
  assert(!!slider, 'اسلایدر پارامتر مدل اتلاف پیدا نشد');
  assert(slider!.value === '7', 'مقدار پیش‌فرض پارامتر درست نیست');

  const before = document.body.textContent ?? '';
  await interact(() => fill('wp-suppliersContacted', '20'));
  const after = document.body.textContent ?? '';
  assert(before !== after, 'تغییر پارامتر، خروجی مدل را بازمحاسبه نکرد');
  assert(
    (document.getElementById('wp-suppliersContacted') as HTMLInputElement).value === '20',
    'مقدار اسلایدر اعمال نشد',
  );
  await unmount();
});

/* ========================================================================== */
/* UI-18 — ناوبری دوگانه و دسترسی به هر دو بخش                                 */
/* ========================================================================== */

await test('UI-18', 'ناوبری دوگانه هر دو بخش پرونده و محصول را در دسترس می‌گذارد', async () => {
  seedWithSession(null);
  await mount('/');
  assert(hasText('بخش الف — پرونده تحلیلی'), 'پیوند بخش الف در ناوبری نیست');
  assert(hasText('بخش ب — محصول'), 'پیوند بخش ب در ناوبری نیست');
  assert(hasText('موجودی مازاد، فرصت یک معامله جدید'), 'شعار کسب‌وکار در صفحه فرود نیست');
  assert(hasText('بازارگاه تخصصی مدیریت و فروش موجودی مازاد پارچه'), 'عنوان کسب‌وکار نمایش داده نشد');

  await interact(() => click(mustButton('مرور پرونده تحلیلی کسب‌وکار')));
  assert(hasText('این پرونده چه چیزی را ثابت می‌کند'), 'پیمایش به پرونده تحلیلی انجام نشد');
  await unmount();
});

/* ========================================================================== */
/* UI-19 — پیمایش ریل فهرست پرونده (آزمون بازگشتی باگ هدایت به صفحه نخست)      */
/* ========================================================================== */

await test('UI-19', 'کلیک روی هر مورد فهرست پرونده، به همان لوح می‌رود و نه به صفحه نخست', async () => {
  seedWithSession(null);
  await mount('/dossier');

  const rail = document.querySelector('nav[aria-label="فهرست لوح‌های پرونده"]');
  assert(!!rail, 'ریل ناوبری پرونده پیدا نشد');
  const items = [...rail!.querySelectorAll('a')];
  assert(items.length === 10, `ریل باید ۱۰ مورد داشته باشد، ${items.length} مورد پیدا شد`);

  /*
   * ریشه باگ: پیوندها به شکل href="#waste" بودند. سامانه روی HashRouter کار
   * می‌کند و کل مسیر در هش نشانی است؛ پس لنگر خام، مسیر را به «/waste» تبدیل
   * می‌کرد و مسیر ناشناخته به صفحه نخست هدایت می‌شد.
   */
  for (const item of items) {
    const href = item.getAttribute('href') ?? '';
    assert(
      href.startsWith('#/dossier#'),
      `پیوند ریل باید مسیرِ آگاه به HashRouter باشد، ولی «${href}» است`,
    );
  }

  // کلیک روی چند لوح مختلف: هر بار باید در پرونده بمانیم و هش هم‌زمان شود
  const expectHashAfterClick = async (index: number, id: string, headline: string) => {
    await interact(() => click(items[index]));
    assert(
      hasText('فهرست پرونده'),
      `پس از کلیک روی «${id}» ریل پرونده ناپدید شد — احتمالاً به صفحه دیگری هدایت شده‌ایم`,
    );
    assert(
      !hasText('موجودی مازاد، فرصت یک معامله جدید'),
      `کلیک روی «${id}» به صفحه نخست هدایت شد (شعار صفحه فرود نمایش داده شد)`,
    );
    assert(document.getElementById(id) !== null, `لوح «${id}» در صفحه موجود نیست`);
    assert(hasText(headline), `محتوای لوح «${id}» نمایش داده نشد`);
  };

  await expectHashAfterClick(2, 'waste', 'زمان و پولی که در مسیر سنتی خرج می‌شود');
  await expectHashAfterClick(4, 'validation', 'چارچوب و ابزار اعتبارسنجی');
  await expectHashAfterClick(9, 'revenue', 'فرضیه‌های درآمدی و آنچه عامدانه ساخته نشده است');
  await expectHashAfterClick(1, 'problem', 'هشت اصطکاک وضع موجود');

  // کلیک دوباره روی همان مورد نباید وضعیت را خراب کند
  await expectHashAfterClick(1, 'problem', 'هشت اصطکاک وضع موجود');
  await unmount();
});

/* ========================================================================== */
/* UI-20 — پیمایش به لوح پرونده از بیرون و رفت‌وبرگشت میان بخش‌ها               */
/* ========================================================================== */

await test('UI-20', 'پیوند مستقیم به یک لوح و بازگشت از بخش ب، درست کار می‌کند', async () => {
  seedWithSession(null);

  // پیوند عمیق مستقیم به یک لوح
  await mount('/dossier');
  assert(hasText('فهرست پرونده'), 'پرونده بارگذاری نشد');
  assert(document.getElementById('journey') !== null, 'لوح نقشه سفر در صفحه نیست');
  await unmount();

  // رفتن به بخش ب و بازگشت به بخش الف، سپس کلیک روی ریل
  await mount('/mvp');
  assert(hasText('محیط عملیاتی تارنو'), 'بخش ب بارگذاری نشد');
  const dossierLink = [...document.querySelectorAll('a')].find((a) =>
    (a.textContent ?? '').includes('بخش الف'),
  );
  assert(!!dossierLink, 'پیوند بخش الف در ناوبری پیدا نشد');
  await interact(() => click(dossierLink!));
  assert(hasText('فهرست پرونده'), 'بازگشت به بخش الف انجام نشد');

  const rail = document.querySelector('nav[aria-label="فهرست لوح‌های پرونده"]')!;
  const items = [...rail.querySelectorAll('a')];
  await interact(() => click(items[3]));
  assert(hasText('سفر کنونی خریدار، بدون تارنو'), 'کلیک ریل پس از جابه‌جایی بین بخش‌ها کار نکرد');
  assert(
    !hasText('موجودی مازاد، فرصت یک معامله جدید'),
    'کلیک ریل پس از جابه‌جایی بین بخش‌ها به صفحه نخست هدایت شد',
  );
  await unmount();
});

/* --------------------------------- گزارش --------------------------------- */

console.log(`\n=== نتیجه: ${passed} موفق، ${failed} ناموفق از ${passed + failed} مورد ===\n`);
if (failed > 0) process.exit(1);
