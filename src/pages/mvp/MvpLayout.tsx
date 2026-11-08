/**
 * پوسته محیط MVP — ناوبری وابسته به نقش + ابزارهای داده.
 * قاعده: هر نقش فقط اقدام‌های مجاز خودش را می‌بیند.
 */

import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../../lib/store/StoreProvider';
import { auditInventory } from '../../lib/domain/queries';
import { storageFootprintKb, isStorageAvailable } from '../../lib/store/repository';
import { Badge, Button, Note, cx } from '../../components/ui/primitives';
import { faNum } from '../../lib/format';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors whitespace-nowrap',
    isActive ? 'bg-indigo-900 text-white' : 'bg-surface text-body border border-line hover:bg-raised',
  );

export const MvpLayout = () => {
  const { db, currentUser, reset, notify } = useStore();
  const [showTools, setShowTools] = useState(false);
  const location = useLocation();

  const audit = auditInventory(db);
  const broken = audit.filter((a) => !a.ok);
  const onLogin = location.pathname.endsWith('/login');

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="label-eyebrow">بخش ب — محصول کمینه پذیرفتنی</span>
            <h1 className="mt-1.5 font-display text-[30px] font-bold leading-tight text-ink">
              محیط عملیاتی تارنو
            </h1>
            <p className="mt-1.5 max-w-reading text-[13px] leading-7 text-muted">
              سناریوهای این محیط واقعی‌اند: ورودی اعتبارسنجی می‌شود، قواعد کسب‌وکار اعمال می‌گردد،
              وضعیت داده تغییر می‌کند و نتیجه در حافظه مرورگر پایدار می‌ماند.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {currentUser ? (
              <Badge tone="indigo">
                نقش فعال:{' '}
                {currentUser.role === 'seller'
                  ? 'فروشنده'
                  : currentUser.role === 'buyer'
                    ? 'خریدار'
                    : 'مدیر سامانه'}
              </Badge>
            ) : (
              <Badge tone="warn">مهمان — برای اقدام باید وارد شوید</Badge>
            )}
            <Button variant="quiet" size="sm" onClick={() => setShowTools((v) => !v)}>
              {showTools ? 'بستن ابزار داده' : 'ابزار داده و سلامت'}
            </Button>
          </div>
        </div>

        <nav aria-label="ناوبری محیط محصول" className="thin-scroll flex gap-2 overflow-x-auto pb-1">
          <NavLink to="/mvp" end className={linkClass}>
            بازارگاه و جستجو
          </NavLink>
          {currentUser?.role === 'seller' && (
            <>
              <NavLink to="/mvp/seller" className={linkClass}>
                داشبورد موجودی من
              </NavLink>
              <NavLink to="/mvp/seller/new" className={linkClass}>
                ثبت آگهی جدید
              </NavLink>
              <NavLink to="/mvp/seller/requests" className={linkClass}>
                درخواست‌های خرید
              </NavLink>
            </>
          )}
          {currentUser?.role === 'buyer' && (
            <>
              <NavLink to="/mvp/buyer/requests" className={linkClass}>
                درخواست‌های من
              </NavLink>
              <NavLink to="/mvp/buyer/orders" className={linkClass}>
                سفارش‌ها و پرداخت
              </NavLink>
            </>
          )}
          {currentUser?.role === 'admin' && (
            <NavLink to="/mvp/admin" className={linkClass}>
              پنل داوری سامانه
            </NavLink>
          )}
          {!currentUser && !onLogin && (
            <NavLink to="/mvp/login" className={linkClass}>
              ورود با حساب دمو
            </NavLink>
          )}
        </nav>

        {showTools && (
          <div className="grid gap-4 rounded-card border border-line bg-surface p-4 lg:grid-cols-3">
            <div>
              <p className="label-eyebrow mb-2">سلامت ناوردای موجودی</p>
              {broken.length === 0 ? (
                <p className="text-[12.5px] leading-7 text-ok">
                  ✓ ناوردا در همه {faNum(audit.length)} آگهی برقرار است: کل = قابل عرضه + رزرو +
                  فروخته‌شده
                </p>
              ) : (
                <p className="text-[12.5px] leading-7 text-danger">
                  × نقض ناوردا در {faNum(broken.length)} آگهی: {broken.map((b) => b.code).join('، ')}
                </p>
              )}
            </div>
            <div>
              <p className="label-eyebrow mb-2">لایه ذخیره‌سازی</p>
              <ul className="flex flex-col gap-1 text-[12px] text-body">
                <li>درایور: LocalStorage مرورگر (کلید tarno.db.v1)</li>
                <li className="num">حجم داده: {faNum(storageFootprintKb(db), 1)} کیلوبایت</li>
                <li>
                  وضعیت دسترسی:{' '}
                  {isStorageAvailable() ? (
                    <span className="text-ok">فعال — داده با بازخوانی صفحه حفظ می‌شود</span>
                  ) : (
                    <span className="text-warn">مسدود — داده فقط تا پایان این نشست می‌ماند</span>
                  )}
                </li>
              </ul>
            </div>
            <div>
              <p className="label-eyebrow mb-2">بازنشانی برای تکرار آزمون</p>
              <p className="mb-2 text-[12px] leading-6 text-muted">
                همه داده‌ها به وضعیت پایه برمی‌گردد؛ آگهی‌ها، درخواست‌ها و سفارش‌های ساخته‌شده حذف
                می‌شوند.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  reset();
                  notify({ tone: 'info', title: 'داده سامانه به وضعیت پایه بازگشت' });
                }}
              >
                بازنشانی داده پایه
              </Button>
            </div>
          </div>
        )}

        {!currentUser && !onLogin && (
          <Note kind="info" title="برای اجرای سناریوها وارد شوید">
            مرور بازارگاه بدون ورود ممکن است، اما ثبت آگهی، درخواست خرید و پرداخت نیازمند حساب
            است.{' '}
            <Link to="/mvp/login" className="font-medium text-indigo-700 underline">
              ورود با حساب‌های دمو
            </Link>
          </Note>
        )}
      </div>

      <Outlet />
    </main>
  );
};
