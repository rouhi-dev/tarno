/** SC-04 — صفحه آگهی: شناسنامه فنی، گالری، دفتر موجودی و ثبت درخواست خرید. */

import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../lib/store/StoreProvider';
import { imagesOfListing, txOfListing } from '../../lib/domain/queries';
import { submitPurchaseRequest } from '../../lib/domain/services';
import { validatePurchaseRequest } from '../../lib/domain/validation';
import { SpecTable } from '../../components/mvp/SpecTable';
import { GradeBadge, StatusBadge } from '../../components/mvp/ListingCard';
import { LedgerBar } from '../../components/charts/LedgerBar';
import {
  Badge,
  Button,
  Field,
  FormError,
  Input,
  Note,
  Textarea,
  cx,
} from '../../components/ui/primitives';
import { faAgo, faDateTime, faNum, parseNum, qty, toman } from '../../lib/format';

const TX_LABEL = {
  initial: 'ثبت موجودی اولیه',
  reserve: 'رزرو موجودی',
  release: 'آزادسازی رزرو',
  commit: 'قطعی‌سازی فروش',
  adjust: 'اصلاح موجودی',
} as const;

export const ListingDetail = () => {
  const { id = '' } = useParams();
  const { db, currentUser, run, notify } = useStore();
  const navigate = useNavigate();

  const listing = db.listings.find((l) => l.id === id);
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);

  if (!listing)
    return (
      <div className="rounded-card border border-line bg-surface p-8 text-center">
        <p className="text-[14px] text-ink">این آگهی یافت نشد.</p>
        <Link to="/mvp" className="mt-3 inline-block text-[13px] text-indigo-700 underline">
          بازگشت به بازارگاه
        </Link>
      </div>
    );

  const category = db.categories.find((c) => c.id === listing.categoryId) ?? null;
  const profile = db.businessProfiles.find((p) => p.ownerUserId === listing.sellerId);
  const images = imagesOfListing(db, listing.id);
  const txs = txOfListing(db, listing.id);
  const isOwner = currentUser?.id === listing.sellerId;
  const canRequest = !!currentUser && currentUser.role === 'buyer' && listing.status === 'active';

  const openRequest = db.purchaseRequests.find(
    (r) =>
      r.listingId === listing.id &&
      r.buyerId === currentUser?.id &&
      (r.status === 'pending' || r.status === 'awaiting_buyer'),
  );

  /** پیش‌نمایش زنده اعتبارسنجی و مبلغ تقریبی */
  const preview = useMemo(() => {
    const n = parseNum(quantity);
    if (!Number.isFinite(n)) return null;
    const v = validatePurchaseRequest({ quantity: n, message }, listing, currentUser?.id ?? 'guest');
    return { n, amount: n * listing.pricePerUnit, valid: v.ok, error: v.errors.quantity };
  }, [quantity, message, listing, currentUser?.id]);

  const submit = () => {
    if (!currentUser) {
      notify({ tone: 'error', title: 'برای ثبت درخواست باید وارد شوید' });
      navigate('/mvp/login');
      return;
    }
    const res = run((current) =>
      submitPurchaseRequest(current, currentUser.id, listing.id, {
        quantity: parseNum(quantity),
        message,
      }),
    );
    if (!res.ok) {
      setErrors(res.errors);
      notify({
        tone: 'error',
        title: 'درخواست ثبت نشد',
        detail: res.errors._form ?? res.errors.quantity ?? 'ورودی‌ها را بررسی کنید.',
      });
      return;
    }
    setErrors({});
    setQuantity('');
    setMessage('');
    notify({
      tone: 'success',
      title: `درخواست ${res.data.code} ثبت شد`,
      detail: 'تا پاسخ فروشنده، موجودی رزرو نمی‌شود. وضعیت را در «درخواست‌های من» ببینید.',
    });
    navigate('/mvp/buyer/requests');
  };

  return (
    <div className="flex flex-col gap-5">
      <Link to="/mvp" className="text-[12.5px] text-indigo-700 hover:underline">
        ← بازگشت به بازارگاه
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* ستون اصلی */}
        <div className="flex flex-col gap-5">
          <div className="rounded-card border border-line bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="num text-[12px] text-muted">{listing.code}</span>
              <StatusBadge status={listing.status} />
              <GradeBadge grade={listing.qualityGrade} />
              {category && <Badge tone="indigo">{category.title}</Badge>}
              {listing.negotiable && <Badge tone="outline">قیمت قابل مذاکره</Badge>}
              <span className="ms-auto text-[11.5px] text-muted">
                ثبت {faAgo(listing.createdAt)}
              </span>
            </div>
            <h1 className="font-display text-[28px] font-bold leading-tight text-ink">
              {listing.title}
            </h1>
            <p className="mt-3 max-w-reading text-[13px] leading-8 text-body">{listing.description}</p>

            {/* گالری */}
            {images.length > 0 && (
              <div className="mt-5">
                <img
                  src={images[activeImage]?.src}
                  alt={images[activeImage]?.caption}
                  className="h-[230px] w-full rounded-lg border border-line object-cover"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={cx(
                        'relative h-14 w-20 overflow-hidden rounded border transition-colors',
                        i === activeImage ? 'border-indigo-700' : 'border-line hover:border-line-strong',
                      )}
                    >
                      <img src={img.src} alt={img.caption} className="h-full w-full object-cover" />
                      {img.isDefectEvidence && (
                        <span className="absolute inset-x-0 bottom-0 bg-madder-600 text-center text-[8.5px] text-white">
                          مستند ایراد
                        </span>
                      )}
                    </button>
                  ))}
                  <span className="ms-auto text-[11px] text-muted">
                    {images[activeImage]?.caption} — تصویر شبیه‌سازی‌شده
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* شناسنامه فنی */}
          <div className="rounded-card border border-line bg-surface p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-bold text-ink">شناسنامه فنی پارچه</h2>
              {category && (
                <span className="text-[11.5px] text-muted">
                  فیلدهای الزامی دسته «{category.title}»: {faNum(category.requiredSpecs.length)} مورد
                </span>
              )}
            </div>
            <SpecTable listing={listing} category={category} />
          </div>

          {/* وضعیت کیفی و ایراد */}
          <div
            className={cx(
              'rounded-card border p-5',
              listing.defects
                ? 'border-madder-600/30 bg-madder-100'
                : 'border-ok/30 bg-[color-mix(in_srgb,var(--ok)_6%,transparent)]',
            )}
          >
            <h2 className="mb-2 text-[15px] font-bold text-ink">وضعیت کیفی و ایرادهای اعلام‌شده</h2>
            {listing.defects ? (
              <p className="text-[13px] leading-8 text-body">{listing.defects}</p>
            ) : (
              <p className="text-[13px] leading-8 text-body">
                فروشنده ایرادی برای این موجودی اعلام نکرده است (درجه A). این اعلام، تعهد فروشنده
                است و در صورت مغایرت در تحویل، مرجع ارجاع محسوب می‌شود.
              </p>
            )}
          </div>

          {/* دفتر تراکنش موجودی */}
          <div className="rounded-card border border-line bg-surface p-5">
            <h2 className="mb-3 text-[16px] font-bold text-ink">دفتر تراکنش‌های موجودی</h2>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[520px] text-[12px]">
                <thead>
                  <tr className="border-b border-line text-start text-muted">
                    <th scope="col" className="p-2 text-start font-medium">نوع تراکنش</th>
                    <th scope="col" className="p-2 text-start font-medium">مقدار</th>
                    <th scope="col" className="p-2 text-start font-medium">قابل عرضه</th>
                    <th scope="col" className="p-2 text-start font-medium">رزرو</th>
                    <th scope="col" className="p-2 text-start font-medium">فروخته</th>
                    <th scope="col" className="p-2 text-start font-medium">زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => (
                    <tr key={t.id} className="border-b border-line last:border-0">
                      <td className="p-2 text-ink">{TX_LABEL[t.kind]}</td>
                      <td className="num p-2">{faNum(t.quantity)}</td>
                      <td className="num p-2">{faNum(t.snapshot.available)}</td>
                      <td className="num p-2">{faNum(t.snapshot.reserved)}</td>
                      <td className="num p-2">{faNum(t.snapshot.sold)}</td>
                      <td className="num p-2 text-muted">{faDateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] leading-6 text-muted">
              هر سطر، وضعیت دفتر را پس از همان تراکنش ثبت می‌کند؛ بنابراین ناوردای موجودی در هر
              لحظه از تاریخ قابل حسابرسی است.
            </p>
          </div>
        </div>

        {/* ستون کنار: موجودی و درخواست خرید */}
        <div className="flex flex-col gap-5">
          <div className="sticky top-24 flex flex-col gap-5">
            <div className="rounded-card border border-line bg-surface p-5">
              <p className="num text-[22px] font-bold text-ink">{toman(listing.pricePerUnit)}</p>
              <p className="mb-4 text-[12px] text-muted">
                برای هر {listing.unit === 'meter' ? 'متر' : 'کیلوگرم'}
              </p>

              <LedgerBar
                total={listing.totalQuantity}
                available={listing.availableQuantity}
                reserved={listing.reservedQuantity}
                sold={listing.soldQuantity}
                unit={listing.unit}
              />

              <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-3 text-[12.5px]">
                <div className="flex justify-between">
                  <dt className="text-muted">حداقل سفارش</dt>
                  <dd className="num font-medium text-ink">
                    {qty(listing.minOrderQuantity, listing.unit)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">محل تحویل</dt>
                  <dd className="font-medium text-ink">
                    {listing.province} — {listing.city}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">فروشنده</dt>
                  <dd className="font-medium text-ink">{profile?.businessName ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">نوع کسب‌وکار</dt>
                  <dd className="text-body">{profile?.businessType ?? '—'}</dd>
                </div>
                {profile?.verified && (
                  <div className="flex justify-between">
                    <dt className="text-muted">احراز کسب‌وکار</dt>
                    <dd>
                      <Badge tone="ok">تأییدشده (نمایشی)</Badge>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* فرم درخواست خرید */}
            <div className="rounded-card border border-line bg-surface p-5">
              <h2 className="mb-3 text-[15px] font-bold text-ink">ثبت درخواست خرید</h2>

              {isOwner ? (
                <Note kind="warn" title="تضاد منافع">
                  این آگهی به حساب شما تعلق دارد؛ فروشنده نمی‌تواند برای آگهی خودش درخواست خرید ثبت
                  کند. این قاعده در لایه سرویس اعمال می‌شود، نه فقط در رابط کاربری.
                </Note>
              ) : openRequest ? (
                <Note kind="info" title={`درخواست باز: ${openRequest.code}`}>
                  شما یک درخواست باز روی این آگهی دارید. برای ثبت درخواست جدید، ابتدا آن را در
                  صفحه «درخواست‌های من» تعیین تکلیف کنید.
                  <Link to="/mvp/buyer/requests" className="mt-2 block text-indigo-700 underline">
                    رفتن به درخواست‌های من
                  </Link>
                </Note>
              ) : listing.status !== 'active' ? (
                <Note kind="warn" title="آگهی فعال نیست">
                  تنها آگهی‌های با وضعیت «فعال» قابل استعلام هستند.
                </Note>
              ) : !currentUser ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[12.5px] leading-7 text-muted">
                    برای ثبت درخواست خرید باید با حساب خریدار وارد شوید.
                  </p>
                  <Link to="/mvp/login">
                    <Button className="w-full">ورود با حساب خریدار</Button>
                  </Link>
                </div>
              ) : currentUser.role !== 'buyer' ? (
                <Note kind="warn" title="نقش نامناسب">
                  این اقدام تنها برای نقش خریدار مجاز است. نقش فعال شما:{' '}
                  {currentUser.role === 'admin' ? 'مدیر سامانه' : 'فروشنده'}.
                </Note>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <FormError message={errors._form} />
                  <Field
                    label={`مقدار درخواستی (${listing.unit === 'meter' ? 'متر' : 'کیلوگرم'})`}
                    htmlFor="req-qty"
                    required
                    error={errors.quantity ?? (quantity ? preview?.error : undefined)}
                    hint={`بین ${listing.minOrderQuantity} و ${listing.availableQuantity}`}
                  >
                    <Input
                      id="req-qty"
                      inputMode="numeric"
                      value={quantity}
                      invalid={!!errors.quantity || (!!quantity && !!preview?.error)}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={String(listing.minOrderQuantity)}
                    />
                  </Field>

                  {preview && preview.valid && (
                    <div className="rounded-lg border border-ok/35 bg-[color-mix(in_srgb,var(--ok)_7%,transparent)] p-3">
                      <p className="text-[12px] text-muted">مبلغ تقریبی این درخواست</p>
                      <p className="num text-[17px] font-bold text-ok">{toman(preview.amount)}</p>
                      <p className="mt-1 text-[11px] leading-6 text-muted">
                        قیمت نهایی را فروشنده در پاسخ به درخواست تعیین می‌کند؛ این مبلغ بر پایه
                        قیمت فعلی آگهی است.
                      </p>
                    </div>
                  )}

                  <Field label="پیام به فروشنده" htmlFor="req-msg" error={errors.message}>
                    <Textarea
                      id="req-msg"
                      value={message}
                      invalid={!!errors.message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="مثلاً: امکان ارسال نمونه ۳۰ سانتی‌متری پیش از خرید وجود دارد؟"
                    />
                  </Field>

                  <Button size="lg" onClick={submit} disabled={!canRequest}>
                    ثبت درخواست خرید
                  </Button>
                  <p className="text-[11px] leading-6 text-muted">
                    با ثبت درخواست، موجودی رزرو نمی‌شود. رزرو تنها پس از پذیرش فروشنده و تأیید شما
                    انجام می‌گیرد.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
