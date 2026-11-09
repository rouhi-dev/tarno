/** داشبورد فروشنده — مدیریت چرخه عمر موجودی مازاد (تمایز ۳). */

import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store/StoreProvider';
import { listingsOfSeller, ordersOfSeller, requestsForSeller, sellerInventoryStats } from '../../lib/domain/queries';
import { toggleListingPause } from '../../lib/domain/services';
import { LISTING_STATUS_LABEL, ORDER_STATUS_LABEL } from '../../lib/domain/transitions';
import { LedgerBar } from '../../components/charts/LedgerBar';
import { StatusBadge } from '../../components/mvp/ListingCard';
import { Badge, Button, EmptyState, Note, Stat } from '../../components/ui/primitives';
import { faAgo, faNum, qty, toman, tomanShort } from '../../lib/format';

export const SellerDashboard = () => {
  const { db, currentUser, run, notify } = useStore();

  if (!currentUser || currentUser.role !== 'seller')
    return (
      <Note kind="warn" title="دسترسی محدود">
        این صفحه تنها برای نقش فروشنده در دسترس است.{' '}
        <Link to="/mvp/login" className="text-indigo-700 underline">
          ورود با حساب فروشنده
        </Link>
      </Note>
    );

  const mine = listingsOfSeller(db, currentUser.id);
  const stats = sellerInventoryStats(db, currentUser.id);
  const openRequests = requestsForSeller(db, currentUser.id).filter((r) => r.status === 'pending');
  const myOrders = ordersOfSeller(db, currentUser.id);
  const profile = db.businessProfiles.find((p) => p.ownerUserId === currentUser.id);

  const togglePause = (listingId: string) => {
    const res = run((current) => toggleListingPause(current, currentUser.id, listingId));
    if (!res.ok) {
      notify({ tone: 'error', title: 'تغییر وضعیت انجام نشد', detail: res.errors._form });
      return;
    }
    notify({
      tone: 'success',
      title: `وضعیت آگهی به «${LISTING_STATUS_LABEL[res.data.status]}» تغییر کرد`,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* خلاصه */}
      <div className="rounded-card border border-line bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-bold text-ink">{profile?.businessName}</h2>
            <p className="text-[12px] text-muted">
              {profile?.businessType} · {profile?.province} — {profile?.city}
            </p>
          </div>
          <Link to="/mvp/seller/new">
            <Button>ثبت آگهی موجودی مازاد</Button>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="آگهی ثبت‌شده" value={faNum(stats.listingCount)} />
          <Stat label="آگهی فعال" value={faNum(stats.activeCount)} tone="indigo" />
          <Stat label="موجودی قابل عرضه" value={faNum(stats.available)} sub="متر/کیلوگرم" />
          <Stat label="رزروشده" value={faNum(stats.reserved)} tone="warn" />
          <Stat label="فروخته‌شده" value={faNum(stats.sold)} tone="ok" />
          <Stat label="ارزش فروش قطعی" value={tomanShort(stats.soldValue)} tone="ok" />
        </div>
      </div>

      {openRequests.length > 0 && (
        <Note kind="info" title={`${faNum(openRequests.length)} درخواست خرید در انتظار پاسخ شما`}>
          تا زمانی که به درخواست‌ها پاسخ ندهید، موجودی رزرو نمی‌شود و معامله پیش نمی‌رود.{' '}
          <Link to="/mvp/seller/requests" className="font-medium text-indigo-700 underline">
            بررسی درخواست‌ها
          </Link>
        </Note>
      )}

      {/* فهرست آگهی‌ها */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-ink">موجودی‌های من</h3>
        {mine.length === 0 ? (
          <EmptyState
            title="هنوز آگهی‌ای ثبت نکرده‌اید"
            body="برای عرضه موجودی مازاد، شناسنامه فنی پارچه را ثبت کنید. فیلدهای الزامی بر اساس دسته انتخابی تغییر می‌کنند."
            action={
              <Link to="/mvp/seller/new">
                <Button size="sm">ثبت نخستین آگهی</Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {mine.map((l) => {
              const requests = db.purchaseRequests.filter((r) => r.listingId === l.id);
              return (
                <li key={l.id}>
                  <div className="rounded-card border border-line bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-[220px] flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span className="num text-[11.5px] text-muted">{l.code}</span>
                          <StatusBadge status={l.status} />
                          <Badge tone="outline">درجه {l.qualityGrade}</Badge>
                          {l.moderationNote && l.status === 'rejected' && (
                            <Badge tone="danger">دلیل رد: {l.moderationNote}</Badge>
                          )}
                        </div>
                        <Link
                          to={`/mvp/listing/${l.id}`}
                          className="text-[14px] font-semibold text-ink hover:text-indigo-700"
                        >
                          {l.title}
                        </Link>
                        <p className="mt-1 text-[11.5px] text-muted">
                          قیمت واحد {toman(l.pricePerUnit)} · حداقل سفارش{' '}
                          {qty(l.minOrderQuantity, l.unit)} · به‌روزرسانی {faAgo(l.updatedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="num text-[12px] text-muted">
                          {faNum(requests.length)} درخواست دریافتی
                        </span>
                        {(l.status === 'active' || l.status === 'paused') && (
                          <Button variant="quiet" size="sm" onClick={() => togglePause(l.id)}>
                            {l.status === 'active' ? 'توقف موقت آگهی' : 'فعال‌سازی مجدد'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 border-t border-line pt-3">
                      <LedgerBar
                        total={l.totalQuantity}
                        available={l.availableQuantity}
                        reserved={l.reservedQuantity}
                        sold={l.soldQuantity}
                        unit={l.unit}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* سفارش‌های دریافتی */}
      {myOrders.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-[15px] font-bold text-ink">سفارش‌های ثبت‌شده روی موجودی من</h3>
          <div className="thin-scroll overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[640px] text-[12.5px]">
              <thead>
                <tr className="border-b border-line bg-raised text-muted">
                  <th scope="col" className="p-3 text-start font-medium">کد سفارش</th>
                  <th scope="col" className="p-3 text-start font-medium">آگهی</th>
                  <th scope="col" className="p-3 text-start font-medium">مقدار</th>
                  <th scope="col" className="p-3 text-start font-medium">مبلغ</th>
                  <th scope="col" className="p-3 text-start font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map((o) => {
                  const l = db.listings.find((x) => x.id === o.listingId);
                  return (
                    <tr key={o.id} className="border-b border-line last:border-0">
                      <td className="num p-3 text-ink">{o.code}</td>
                      <td className="p-3 text-body">{l?.title ?? '—'}</td>
                      <td className="num p-3">{faNum(o.quantity)}</td>
                      <td className="num p-3">{toman(o.totalAmount)}</td>
                      <td className="p-3">
                        <Badge
                          tone={
                            o.status === 'paid'
                              ? 'ok'
                              : o.status === 'awaiting_payment'
                                ? 'warn'
                                : 'danger'
                          }
                        >
                          {ORDER_STATUS_LABEL[o.status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
