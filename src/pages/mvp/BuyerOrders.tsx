/** SC-07 — سفارش‌ها و پرداخت شبیه‌سازی‌شده با سه نتیجه ممکن. */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store/StoreProvider';
import { ordersOfBuyer } from '../../lib/domain/queries';
import { settlePayment } from '../../lib/domain/services';
import { ORDER_STATUS_LABEL } from '../../lib/domain/transitions';
import { Badge, Button, EmptyState, Note, cx } from '../../components/ui/primitives';
import { faDateTime, faNum, qty, toman } from '../../lib/format';

const STATUS_TONE = {
  awaiting_payment: 'warn',
  paid: 'ok',
  cancelled: 'neutral',
  payment_failed: 'danger',
} as const;

export const BuyerOrders = () => {
  const { db, currentUser, run, notify } = useStore();
  const [payingId, setPayingId] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'buyer')
    return (
      <Note kind="warn" title="دسترسی محدود">
        این صفحه تنها برای نقش خریدار در دسترس است.{' '}
        <Link to="/mvp/login" className="text-indigo-700 underline">
          ورود با حساب خریدار
        </Link>
      </Note>
    );

  const orders = ordersOfBuyer(db, currentUser.id).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  const settle = (orderId: string, code: string, outcome: 'success' | 'failure' | 'cancel') => {
    const res = run((current) => settlePayment(current, currentUser.id, orderId, outcome));
    if (!res.ok) {
      notify({ tone: 'error', title: 'عملیات پرداخت انجام نشد', detail: res.errors._form });
      return;
    }
    setPayingId(null);
    if (outcome === 'success') {
      notify({
        tone: 'success',
        title: `پرداخت سفارش ${code} موفق بود`,
        detail: `مقدار رزروشده به «فروخته‌شده» منتقل شد. مرجع تراکنش: ${res.data.payment.reference}`,
      });
    } else {
      notify({
        tone: 'info',
        title: outcome === 'cancel' ? `سفارش ${code} لغو شد` : `پرداخت سفارش ${code} ناموفق بود`,
        detail: 'مقدار رزروشده آزاد و به موجودی قابل عرضه بازگشت.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[17px] font-bold text-ink">سفارش‌ها و پرداخت</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          {faNum(orders.length)} سفارش — پرداخت در این سامانه کاملاً شبیه‌سازی‌شده است.
        </p>
      </div>

      <Note kind="warn" title="درگاه پرداخت شبیه‌سازی‌شده">
        هیچ اتصال بانکی یا درگاه پرداخت واقعی در این سامانه وجود ندارد و هیچ اطلاعات کارت یا حساب
        دریافت نمی‌شود. شما نتیجه پرداخت را خودتان انتخاب می‌کنید تا هر دو مسیر موفق و ناموفق
        قابل آزمون باشد.
      </Note>

      {orders.length === 0 ? (
        <EmptyState
          title="سفارشی ندارید"
          body="سفارش زمانی ساخته می‌شود که پیشنهاد قیمت فروشنده را تأیید کنید. در همان لحظه، مقدار توافق‌شده از موجودی رزرو می‌شود."
          action={
            <Link to="/mvp/buyer/requests">
              <Button size="sm">مشاهده درخواست‌های من</Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => {
            const listing = db.listings.find((l) => l.id === o.listingId);
            const payments = db.payments.filter((p) => p.orderId === o.id);
            const history = db.orderHistory
              .filter((h) => h.orderId === o.id)
              .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
            const isPaying = payingId === o.id;

            return (
              <li key={o.id}>
                <article
                  className={cx(
                    'rounded-card border bg-surface p-4',
                    o.status === 'awaiting_payment' ? 'border-warn/45' : 'border-line',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-[240px] flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="num text-[12.5px] font-bold text-ink">{o.code}</span>
                        <Badge tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                        <span className="num text-[11px] text-muted">{faDateTime(o.createdAt)}</span>
                      </div>
                      <Link
                        to={`/mvp/listing/${o.listingId}`}
                        className="text-[14px] font-semibold text-ink hover:text-indigo-700"
                      >
                        {listing?.title ?? '—'}
                      </Link>
                      <p className="num mt-1.5 text-[12.5px] text-body">
                        {listing ? qty(o.quantity, listing.unit) : faNum(o.quantity)} ×{' '}
                        {toman(o.unitPrice)}
                      </p>

                      {/* تاریخچه وضعیت */}
                      {history.length > 0 && (
                        <ol className="mt-3 flex flex-col gap-1.5 border-s-2 border-line ps-3">
                          {history.map((h) => (
                            <li key={h.id} className="text-[11.5px] leading-6 text-muted">
                              <span className="font-medium text-ink">
                                {ORDER_STATUS_LABEL[h.to]}
                              </span>{' '}
                              — {h.note}
                            </li>
                          ))}
                        </ol>
                      )}

                      {payments.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1">
                          {payments.map((p) => (
                            <p key={p.id} className="num text-[11.5px] text-muted">
                              تراکنش {p.reference} — {p.status === 'success' ? 'موفق' : 'ناموفق'}
                              {p.failureReason ? ` (${p.failureReason})` : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="num text-[18px] font-bold text-ink">{toman(o.totalAmount)}</p>
                      {o.status === 'awaiting_payment' && !isPaying && (
                        <Button size="sm" onClick={() => setPayingId(o.id)}>
                          پرداخت شبیه‌سازی‌شده
                        </Button>
                      )}
                    </div>
                  </div>

                  {isPaying && (
                    <div className="mt-4 rounded-lg border border-line bg-raised p-4">
                      <p className="label-eyebrow mb-2">درگاه ساختگی (Mock Gateway)</p>
                      <p className="mb-3 text-[12.5px] leading-7 text-body">
                        مبلغ قابل پرداخت: <span className="num font-bold">{toman(o.totalAmount)}</span>
                        <br />
                        نتیجه پرداخت را انتخاب کنید تا اثر آن روی دفتر موجودی را ببینید.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => settle(o.id, o.code, 'success')}>
                          پرداخت موفق — انتقال رزرو به فروخته‌شده
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => settle(o.id, o.code, 'failure')}>
                          پرداخت ناموفق — آزادسازی رزرو
                        </Button>
                        <Button size="sm" variant="quiet" onClick={() => settle(o.id, o.code, 'cancel')}>
                          انصراف از پرداخت
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPayingId(null)}>
                          بستن
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
    </div>
  );
};
