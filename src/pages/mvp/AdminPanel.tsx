/** SC-02 — پنل داوری مدیر سامانه + پایش سلامت داده. */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../lib/store/StoreProvider';
import { auditInventory } from '../../lib/domain/queries';
import { moderateListing } from '../../lib/domain/services';
import { LISTING_STATUS_LABEL } from '../../lib/domain/transitions';
import { SpecTable } from '../../components/mvp/SpecTable';
import { GradeBadge, StatusBadge } from '../../components/mvp/ListingCard';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  FormError,
  Note,
  Stat,
  Textarea,
} from '../../components/ui/primitives';
import { faAgo, faNum, qty, toman } from '../../lib/format';

export const AdminPanel = () => {
  const { db, currentUser, run, notify } = useStore();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!currentUser || currentUser.role !== 'admin')
    return (
      <Note kind="warn" title="دسترسی محدود">
        این پنل تنها برای مدیر سامانه در دسترس است.{' '}
        <Link to="/mvp/login" className="text-indigo-700 underline">
          ورود با حساب admin@tarno.ir
        </Link>
      </Note>
    );

  const pending = db.listings.filter((l) => l.status === 'pending');
  const audit = auditInventory(db);
  const broken = audit.filter((a) => !a.ok);

  const decide = (listingId: string, code: string, decision: 'approve' | 'reject') => {
    const res = run((current) =>
      moderateListing(current, currentUser.id, listingId, decision, decision === 'approve' ? 'تأییدشده در داوری' : note),
    );
    if (!res.ok) {
      setErrors(res.errors);
      notify({ tone: 'error', title: 'داوری انجام نشد', detail: res.errors.note ?? res.errors._form });
      return;
    }
    setErrors({});
    setRejectId(null);
    setNote('');
    notify({
      tone: decision === 'approve' ? 'success' : 'info',
      title: `آگهی ${code} ${decision === 'approve' ? 'تأیید و منتشر شد' : 'رد شد'}`,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* آماره‌های سامانه */}
      <div className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-4 text-[17px] font-bold text-ink">وضعیت سامانه</h2>
        <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="کل آگهی‌ها" value={faNum(db.listings.length)} />
          <Stat label="در انتظار داوری" value={faNum(pending.length)} tone="warn" />
          <Stat
            label="آگهی فعال"
            value={faNum(db.listings.filter((l) => l.status === 'active').length)}
            tone="indigo"
          />
          <Stat label="درخواست خرید" value={faNum(db.purchaseRequests.length)} />
          <Stat label="سفارش" value={faNum(db.orders.length)} />
          <Stat
            label="پرداخت موفق"
            value={faNum(db.payments.filter((p) => p.status === 'success').length)}
            tone="ok"
          />
        </div>
      </div>

      {/* سلامت ناوردا */}
      <div
        className={
          broken.length === 0
            ? 'rounded-card border border-ok/35 bg-[color-mix(in_srgb,var(--ok)_6%,transparent)] p-5'
            : 'rounded-card border border-danger/45 bg-madder-100 p-5'
        }
      >
        <h2 className="mb-2 text-[15px] font-bold text-ink">پایش ناوردای دفتر موجودی</h2>
        <p className="mb-3 text-[12.5px] leading-7 text-body">
          قاعده‌ای که باید در هر لحظه و برای هر آگهی برقرار باشد:{' '}
          <span className="num font-medium">
            موجودی کل = قابل عرضه + رزروشده + فروخته‌شده
          </span>
        </p>
        {broken.length === 0 ? (
          <p className="text-[13px] font-medium text-ok">
            ✓ ناوردا در همه {faNum(audit.length)} آگهی برقرار است.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {broken.map((b) => (
              <li key={b.listingId} className="num text-[12.5px] text-danger">
                {b.code}: کل {faNum(b.total)} ≠ جمع اجزا {faNum(b.sum)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* صف داوری */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[15px] font-bold text-ink">صف داوری آگهی‌ها</h2>
        {pending.length === 0 ? (
          <EmptyState
            title="صف داوری خالی است"
            body="آگهی تازه‌ای در انتظار تأیید نیست. با حساب فروشنده یک آگهی ثبت کنید تا در این صف ظاهر شود."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((l) => {
              const category = db.categories.find((c) => c.id === l.categoryId) ?? null;
              const profile = db.businessProfiles.find((p) => p.ownerUserId === l.sellerId);
              const images = db.listingImages.filter((i) => i.listingId === l.id);
              return (
                <li key={l.id}>
                  <article className="rounded-card border border-warn/40 bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-[260px] flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <span className="num text-[11.5px] text-muted">{l.code}</span>
                          <StatusBadge status={l.status} />
                          <GradeBadge grade={l.qualityGrade} />
                          <span className="text-[11px] text-muted">{faAgo(l.createdAt)}</span>
                        </div>
                        <h3 className="text-[15px] font-semibold text-ink">{l.title}</h3>
                        <p className="mt-1 text-[12px] text-muted">
                          {profile?.businessName} · {l.province} — {l.city}
                        </p>
                        <p className="mt-2 max-w-reading text-[12.5px] leading-7 text-body">
                          {l.description}
                        </p>
                        {l.defects && (
                          <p className="mt-2 rounded-lg border border-madder-600/30 bg-madder-100 px-3 py-2 text-[12px] leading-7 text-body">
                            ایراد اعلام‌شده: {l.defects}
                          </p>
                        )}
                        <div className="mt-3 border-t border-line pt-3">
                          <p className="label-eyebrow mb-2">شناسنامه فنی</p>
                          <SpecTable listing={l} category={category} />
                        </div>
                      </div>

                      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[220px]">
                        {images[0] && (
                          <img
                            src={images[0].src}
                            alt="نمونه بافت"
                            className="h-24 w-full rounded-lg border border-line object-cover"
                          />
                        )}
                        <dl className="flex flex-col gap-1.5 text-[12px]">
                          <div className="flex justify-between">
                            <dt className="text-muted">موجودی کل</dt>
                            <dd className="num text-ink">{qty(l.totalQuantity, l.unit)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted">حداقل سفارش</dt>
                            <dd className="num text-ink">{qty(l.minOrderQuantity, l.unit)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted">قیمت واحد</dt>
                            <dd className="num text-ink">{toman(l.pricePerUnit)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted">دسته</dt>
                            <dd className="text-ink">{category?.title ?? '—'}</dd>
                          </div>
                        </dl>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" onClick={() => decide(l.id, l.code, 'approve')}>
                            تأیید و انتشار
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setRejectId(rejectId === l.id ? null : l.id);
                              setNote('');
                              setErrors({});
                            }}
                          >
                            رد آگهی
                          </Button>
                        </div>
                      </div>
                    </div>

                    {rejectId === l.id && (
                      <div className="mt-4 border-t border-line pt-4">
                        <FormError message={errors._form} />
                        <Field
                          label="دلیل رد آگهی"
                          htmlFor={`adm-note-${l.id}`}
                          required
                          error={errors.note}
                          hint="حداقل ۵ نویسه — دلیل برای فروشنده نمایش داده می‌شود."
                        >
                          <Textarea
                            id={`adm-note-${l.id}`}
                            value={note}
                            invalid={!!errors.note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="مثلاً: مشخصات فنی با تصویر پیوست همخوانی ندارد."
                          />
                        </Field>
                        <div className="mt-3 flex gap-2">
                          <Button variant="danger" onClick={() => decide(l.id, l.code, 'reject')}>
                            ثبت رد آگهی
                          </Button>
                          <Button variant="quiet" onClick={() => setRejectId(null)}>
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
      </div>

      {/* نمای کلی آگهی‌ها */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[15px] font-bold text-ink">همه آگهی‌های سامانه</h2>
        <div className="thin-scroll overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[760px] text-[12.5px]">
            <thead>
              <tr className="border-b border-line bg-raised text-muted">
                <th scope="col" className="p-3 text-start font-medium">کد</th>
                <th scope="col" className="p-3 text-start font-medium">عنوان</th>
                <th scope="col" className="p-3 text-start font-medium">فروشنده</th>
                <th scope="col" className="p-3 text-start font-medium">کل</th>
                <th scope="col" className="p-3 text-start font-medium">قابل عرضه</th>
                <th scope="col" className="p-3 text-start font-medium">رزرو</th>
                <th scope="col" className="p-3 text-start font-medium">فروخته</th>
                <th scope="col" className="p-3 text-start font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {db.listings.map((l) => {
                const profile = db.businessProfiles.find((p) => p.ownerUserId === l.sellerId);
                return (
                  <tr key={l.id} className="border-b border-line last:border-0">
                    <td className="num p-3 text-ink">{l.code}</td>
                    <td className="p-3">
                      <Link to={`/mvp/listing/${l.id}`} className="text-body hover:text-indigo-700">
                        {l.title}
                      </Link>
                    </td>
                    <td className="p-3 text-muted">{profile?.businessName ?? '—'}</td>
                    <td className="num p-3">{faNum(l.totalQuantity)}</td>
                    <td className="num p-3">{faNum(l.availableQuantity)}</td>
                    <td className="num p-3">{faNum(l.reservedQuantity)}</td>
                    <td className="num p-3">{faNum(l.soldQuantity)}</td>
                    <td className="p-3">
                      <Badge
                        tone={
                          l.status === 'active'
                            ? 'ok'
                            : l.status === 'pending'
                              ? 'warn'
                              : l.status === 'rejected'
                                ? 'danger'
                                : 'neutral'
                        }
                      >
                        {LISTING_STATUS_LABEL[l.status]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
