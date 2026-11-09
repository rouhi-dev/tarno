/** SC-06 — درخواست‌های خریدار: تأیید پیشنهاد (ایجاد سفارش و رزرو) یا انصراف. */

import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store/StoreProvider';
import { requestsOfBuyer } from '../../lib/domain/queries';
import { confirmOfferAndCreateOrder, withdrawRequest } from '../../lib/domain/services';
import { REQUEST_STATUS_LABEL } from '../../lib/domain/transitions';
import { Badge, Button, EmptyState, Note, cx } from '../../components/ui/primitives';
import { faAgo, faNum, qty, toman } from '../../lib/format';

const STATUS_TONE = {
  pending: 'warn',
  awaiting_buyer: 'indigo',
  converted: 'ok',
  rejected: 'danger',
  withdrawn: 'neutral',
} as const;

export const BuyerRequests = () => {
  const { db, currentUser, run, notify } = useStore();
  const navigate = useNavigate();

  if (!currentUser || currentUser.role !== 'buyer')
    return (
      <Note kind="warn" title="دسترسی محدود">
        این صفحه تنها برای نقش خریدار در دسترس است.{' '}
        <Link to="/mvp/login" className="text-indigo-700 underline">
          ورود با حساب خریدار
        </Link>
      </Note>
    );

  const requests = requestsOfBuyer(db, currentUser.id).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  const confirm = (requestId: string, code: string) => {
    const res = run((current) => confirmOfferAndCreateOrder(current, currentUser.id, requestId));
    if (!res.ok) {
      notify({ tone: 'error', title: `تأیید ${code} انجام نشد`, detail: res.errors._form });
      return;
    }
    notify({
      tone: 'success',
      title: `سفارش ${res.data.code} ایجاد شد`,
      detail: `${faNum(res.data.quantity)} واحد از موجودی رزرو شد. برای تکمیل، پرداخت شبیه‌سازی‌شده را انجام دهید.`,
    });
    navigate('/mvp/buyer/orders');
  };

  const withdraw = (requestId: string, code: string) => {
    const res = run((current) => withdrawRequest(current, currentUser.id, requestId));
    if (!res.ok) {
      notify({ tone: 'error', title: 'انصراف انجام نشد', detail: res.errors._form });
      return;
    }
    notify({ tone: 'info', title: `درخواست ${code} منصرف شد` });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[17px] font-bold text-ink">درخواست‌های خرید من</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          {faNum(requests.length)} درخواست — موجودی تنها در لحظه تأیید پیشنهاد فروشنده رزرو می‌شود.
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="درخواستی ثبت نکرده‌اید"
          body="در بازارگاه، آگهی مناسب را پیدا کنید و مقدار موردنیازتان را به صورت درخواست خرید ثبت کنید."
          action={
            <Link to="/mvp">
              <Button size="sm">رفتن به بازارگاه</Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => {
            const listing = db.listings.find((l) => l.id === r.listingId);
            const offer = db.priceOffers.find((o) => o.id === r.priceOfferId);
            const order = db.orders.find((o) => o.id === r.orderId);
            const sellerProfile = db.businessProfiles.find((p) => p.ownerUserId === r.sellerId);
            const insufficient =
              !!listing && r.status === 'awaiting_buyer' && (offer?.quantity ?? r.quantity) > listing.availableQuantity;

            return (
              <li key={r.id}>
                <article
                  className={cx(
                    'rounded-card border bg-surface p-4',
                    r.status === 'awaiting_buyer' ? 'border-indigo-700/45' : 'border-line',
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
                      <p className="mt-1 text-[12px] text-muted">
                        فروشنده: {sellerProfile?.businessName ?? '—'}
                      </p>

                      {r.status === 'rejected' && r.rejectionReason && (
                        <div className="mt-2 rounded-lg border border-danger/35 bg-madder-100 px-3 py-2">
                          <p className="text-[12px] text-danger">دلیل رد فروشنده: {r.rejectionReason}</p>
                        </div>
                      )}

                      {offer && r.status === 'awaiting_buyer' && (
                        <div className="mt-3 rounded-lg border border-indigo-700/30 bg-indigo-100 p-3">
                          <p className="label-eyebrow mb-1.5">پیشنهاد نهایی فروشنده</p>
                          <p className="num text-[13px] text-ink">
                            {listing ? qty(offer.quantity, listing.unit) : faNum(offer.quantity)} ×{' '}
                            {toman(offer.unitPrice)} ={' '}
                            <span className="font-bold">{toman(offer.quantity * offer.unitPrice)}</span>
                          </p>
                          {offer.note && <p className="mt-1 text-[12px] text-body">{offer.note}</p>}
                          {offer.unitPrice !== r.quotedUnitPrice && (
                            <p className="num mt-1 text-[11.5px] text-madder-600">
                              قیمت پیشنهادی با قیمت زمان درخواست ({toman(r.quotedUnitPrice)}) تفاوت
                              دارد.
                            </p>
                          )}
                        </div>
                      )}

                      {order && (
                        <p className="num mt-2 text-[12px] text-ok">
                          تبدیل شد به سفارش {order.code} —{' '}
                          <Link to="/mvp/buyer/orders" className="underline">
                            مشاهده و پرداخت
                          </Link>
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="num text-[15px] font-bold text-ink">
                        {listing ? qty(r.quantity, listing.unit) : faNum(r.quantity)}
                      </p>
                      {listing && (
                        <p className="num text-[11.5px] text-muted">
                          موجودی قابل عرضه: {faNum(listing.availableQuantity)}
                        </p>
                      )}
                      {r.status === 'awaiting_buyer' && (
                        <div className="flex flex-col items-end gap-1.5">
                          <Button size="sm" onClick={() => confirm(r.id, r.code)}>
                            تأیید پیشنهاد و ایجاد سفارش
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => withdraw(r.id, r.code)}>
                            انصراف
                          </Button>
                        </div>
                      )}
                      {r.status === 'pending' && (
                        <Button size="sm" variant="quiet" onClick={() => withdraw(r.id, r.code)}>
                          انصراف از درخواست
                        </Button>
                      )}
                    </div>
                  </div>

                  {insufficient && (
                    <div className="mt-3 rounded-lg border border-warn/40 bg-[color-mix(in_srgb,var(--warn)_8%,transparent)] px-3 py-2">
                      <p className="text-[12px] leading-6 text-warn">
                        توجه: از زمان پیشنهاد فروشنده، موجودی قابل عرضه کاهش یافته است. تأیید این
                        پیشنهاد توسط نگهبان بیش‌فروشی رد خواهد شد؛ باید درخواست جدیدی با مقدار کمتر
                        ثبت کنید.
                      </p>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
