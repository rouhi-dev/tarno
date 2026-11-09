/** SC-05 — بررسی درخواست‌های خرید: پذیرش با پیشنهاد قیمت یا رد با ذکر دلیل. */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store/StoreProvider';
import { requestsForSeller } from '../../lib/domain/queries';
import { respondToRequest } from '../../lib/domain/services';
import { REQUEST_STATUS_LABEL } from '../../lib/domain/transitions';
import type { PurchaseRequest } from '../../lib/domain/types';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  FormError,
  Input,
  Note,
  Textarea,
  cx,
} from '../../components/ui/primitives';
import { faAgo, faNum, parseNum, qty, toman } from '../../lib/format';

const STATUS_TONE = {
  pending: 'warn',
  awaiting_buyer: 'indigo',
  converted: 'ok',
  rejected: 'danger',
  withdrawn: 'neutral',
} as const;

export const SellerRequests = () => {
  const { db, currentUser, run, notify } = useStore();
  const [mode, setMode] = useState<{ id: string; kind: 'accept' | 'reject' } | null>(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser || currentUser.role !== 'seller')
    return (
      <Note kind="warn" title="دسترسی محدود">
        این صفحه تنها برای نقش فروشنده در دسترس است.{' '}
        <Link to="/mvp/login" className="text-indigo-700 underline">
          ورود با حساب فروشنده
        </Link>
      </Note>
    );

  const requests = requestsForSeller(db, currentUser.id).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  const pending = requests.filter((r) => r.status === 'pending');

  const openAccept = (r: PurchaseRequest) => {
    const listing = db.listings.find((l) => l.id === r.listingId);
    setMode({ id: r.id, kind: 'accept' });
    setPrice(String(listing?.pricePerUnit ?? ''));
    setQuantity(String(r.quantity));
    setNote('');
    setErrors({});
  };

  const submitAccept = (r: PurchaseRequest) => {
    const res = run((current) =>
      respondToRequest(current, currentUser.id, r.id, {
        kind: 'accept',
        unitPrice: parseNum(price),
        quantity: parseNum(quantity),
        note,
      }),
    );
    if (!res.ok) {
      setErrors(res.errors);
      notify({
        tone: 'error',
        title: 'پذیرش درخواست انجام نشد',
        detail: res.errors._form ?? res.errors.quantity ?? res.errors.unitPrice,
      });
      return;
    }
    notify({
      tone: 'success',
      title: `پیشنهاد قیمت برای ${r.code} ثبت شد`,
      detail: 'در این مرحله موجودی رزرو نشده است؛ رزرو پس از تأیید خریدار انجام می‌شود.',
    });
    setMode(null);
    setErrors({});
  };

  const submitReject = (r: PurchaseRequest) => {
    const res = run((current) =>
      respondToRequest(current, currentUser.id, r.id, { kind: 'reject', reason }),
    );
    if (!res.ok) {
      setErrors(res.errors);
      notify({ tone: 'error', title: 'رد درخواست انجام نشد', detail: res.errors.reason ?? res.errors._form });
      return;
    }
    notify({ tone: 'info', title: `درخواست ${r.code} رد شد`, detail: 'دلیل رد برای خریدار نمایش داده می‌شود.' });
    setMode(null);
    setReason('');
    setErrors({});
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-ink">درخواست‌های خرید دریافتی</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            {faNum(pending.length)} درخواست در انتظار پاسخ از مجموع {faNum(requests.length)} درخواست
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="درخواستی دریافت نکرده‌اید"
          body="وقتی خریداری روی یکی از آگهی‌های شما درخواست خرید ثبت کند، در همین صفحه نمایش داده می‌شود و می‌توانید آن را بپذیرید یا با ذکر دلیل رد کنید."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => {
            const listing = db.listings.find((l) => l.id === r.listingId);
            const buyer = db.users.find((u) => u.id === r.buyerId);
            const buyerProfile = db.businessProfiles.find((p) => p.ownerUserId === r.buyerId);
            const offer = db.priceOffers.find((o) => o.id === r.priceOfferId);
            const isAccepting = mode?.id === r.id && mode.kind === 'accept';
            const isRejecting = mode?.id === r.id && mode.kind === 'reject';

            return (
              <li key={r.id}>
                <article
                  className={cx(
                    'rounded-card border bg-surface p-4',
                    r.status === 'pending' ? 'border-warn/40' : 'border-line',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-[240px] flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="num text-[12px] font-medium text-ink">{r.code}</span>
                        <Badge tone={STATUS_TONE[r.status]}>{REQUEST_STATUS_LABEL[r.status]}</Badge>
                        <span className="text-[11px] text-muted">{faAgo(r.createdAt)}</span>
                      </div>
                      <Link
                        to={`/mvp/listing/${r.listingId}`}
                        className="text-[14px] font-semibold text-ink hover:text-indigo-700"
                      >
                        {listing?.title ?? '—'}
                      </Link>
                      <p className="mt-1.5 text-[12.5px] text-body">
                        <span className="text-muted">خریدار: </span>
                        {buyerProfile?.businessName ?? buyer?.fullName} ({buyerProfile?.city})
                      </p>
                      {r.message && (
                        <p className="mt-2 rounded-lg border border-line bg-raised px-3 py-2 text-[12.5px] leading-7 text-body">
                          «{r.message}»
                        </p>
                      )}
                      {r.rejectionReason && (
                        <p className="mt-2 text-[12px] text-danger">دلیل رد: {r.rejectionReason}</p>
                      )}
                      {offer && (
                        <p className="num mt-2 text-[12px] text-indigo-700">
                          پیشنهاد ثبت‌شده: {faNum(offer.quantity)} واحد × {toman(offer.unitPrice)} ={' '}
                          {toman(offer.quantity * offer.unitPrice)}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="num text-[15px] font-bold text-ink">
                        {listing ? qty(r.quantity, listing.unit) : faNum(r.quantity)}
                      </p>
                      <p className="num text-[11.5px] text-muted">
                        قیمت زمان درخواست: {toman(r.quotedUnitPrice)}
                      </p>
                      {listing && (
                        <p className="num text-[11.5px] text-muted">
                          موجودی قابل عرضه: {faNum(listing.availableQuantity)}
                        </p>
                      )}
                      {r.status === 'pending' && !isAccepting && !isRejecting && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => openAccept(r)}>
                            پذیرش و پیشنهاد قیمت
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setMode({ id: r.id, kind: 'reject' });
                              setReason('');
                              setErrors({});
                            }}
                          >
                            رد درخواست
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* فرم پذیرش */}
                  {isAccepting && listing && (
                    <div className="mt-4 border-t border-line pt-4">
                      <p className="label-eyebrow mb-3">ثبت پیشنهاد نهایی</p>
                      <FormError message={errors._form} />
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field
                          label="قیمت واحد پیشنهادی (تومان)"
                          htmlFor={`of-price-${r.id}`}
                          required
                          error={errors.unitPrice}
                        >
                          <Input
                            id={`of-price-${r.id}`}
                            inputMode="numeric"
                            value={price}
                            invalid={!!errors.unitPrice}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </Field>
                        <Field
                          label="مقدار نهایی"
                          htmlFor={`of-qty-${r.id}`}
                          required
                          error={errors.quantity}
                          hint={`بین ${listing.minOrderQuantity} و ${listing.availableQuantity}`}
                        >
                          <Input
                            id={`of-qty-${r.id}`}
                            inputMode="numeric"
                            value={quantity}
                            invalid={!!errors.quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                          />
                        </Field>
                        <Field label="توضیح پیشنهاد" htmlFor={`of-note-${r.id}`}>
                          <Input
                            id={`of-note-${r.id}`}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="مثلاً: تحویل از انبار یزد، بارگیری با خریدار"
                          />
                        </Field>
                      </div>
                      {Number.isFinite(parseNum(price)) && Number.isFinite(parseNum(quantity)) && (
                        <p className="num mt-2 text-[12.5px] text-indigo-700">
                          مبلغ کل پیشنهاد: {toman(parseNum(price) * parseNum(quantity))}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Button onClick={() => submitAccept(r)}>ثبت پیشنهاد و ارسال به خریدار</Button>
                        <Button variant="quiet" onClick={() => setMode(null)}>
                          انصراف
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* فرم رد */}
                  {isRejecting && (
                    <div className="mt-4 border-t border-line pt-4">
                      <p className="label-eyebrow mb-3">رد درخواست با ذکر دلیل</p>
                      <FormError message={errors._form} />
                      <Field
                        label="دلیل رد"
                        htmlFor={`rj-${r.id}`}
                        required
                        error={errors.reason}
                        hint="حداقل ۵ نویسه — دلیل برای خریدار نمایش داده می‌شود."
                      >
                        <Textarea
                          id={`rj-${r.id}`}
                          value={reason}
                          invalid={!!errors.reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="مثلاً: این متراژ برای مشتری دیگری رزرو شده است."
                        />
                      </Field>
                      <div className="mt-3 flex gap-2">
                        <Button variant="danger" onClick={() => submitReject(r)}>
                          ثبت رد درخواست
                        </Button>
                        <Button variant="quiet" onClick={() => setMode(null)}>
                          انصراف
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <Note kind="info" title="چرا در این مرحله موجودی رزرو نمی‌شود؟">
        اگر با پذیرش فروشنده موجودی رزرو می‌شد، چند درخواست هم‌زمان می‌توانستند موجودی را قفل کنند
        بدون آنکه خریداری تأیید کرده باشد. بنابراین رزرو به لحظه تأیید خریدار و ایجاد سفارش منتقل
        شده است و در همان لحظه، کفایت موجودی دوباره بررسی می‌شود.
      </Note>
    </div>
  );
};
