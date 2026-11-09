/**
 * ناوبری دوگانه — الزام ۲ بخش ب فاز ۱.
 * دسترسی مجزا و همیشه‌در‌دسترس به «پرونده تحلیلی» و «محیط MVP».
 */

import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BRAND } from '../../lib/content/brand';
import { useStore } from '../../lib/store/StoreProvider';
import { Badge, Button, cx } from '../ui/primitives';

const Logo = () => (
  <span className="flex items-center gap-2.5">
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden className="shrink-0">
      {/* نشان تارنو: تار و پود — چهار نخ عمودی و دو نخ افقی */}
      <rect x="1" y="1" width="30" height="30" rx="7" fill="var(--indigo-900)" />
      <g stroke="var(--surface)" strokeWidth="1.7" strokeLinecap="round" opacity="0.92">
        <path d="M9 7.5 V24.5" />
        <path d="M14.33 7.5 V24.5" />
        <path d="M19.66 7.5 V24.5" />
        <path d="M25 7.5 V24.5" />
      </g>
      <g stroke="var(--madder-600)" strokeWidth="2.6" strokeLinecap="round">
        <path d="M6.5 13 H25.5" />
        <path d="M6.5 19.5 H25.5" />
      </g>
    </svg>
    <span className="flex flex-col leading-none">
      <span className="font-display text-[22px] font-bold text-ink">{BRAND.name}</span>
      <span className="text-[9.5px] tracking-[.2em] text-muted">{BRAND.latin}</span>
    </span>
  </span>
);

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors',
    isActive ? 'bg-indigo-100 text-indigo-900' : 'text-body hover:bg-raised',
  );

export const TopNav = () => {
  const { currentUser, logout } = useStore();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const inMvp = location.pathname.startsWith('/mvp');

  return (
    <header
      className="no-print sticky z-40 border-b border-line bg-surface/92 backdrop-blur"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-2.5">
        <Link to="/" className="shrink-0" aria-label="صفحه نخست تارنو">
          <Logo />
        </Link>

        {/* سوئیچ دوگانه بخش الف / بخش ب */}
        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 rounded-xl border border-line bg-raised p-1 md:flex">
          <NavLink to="/dossier" className={navItemClass}>
            بخش الف — پرونده تحلیلی
          </NavLink>
          <NavLink to="/mvp" className={({ isActive }) => navItemClass({ isActive: isActive || inMvp })}>
            بخش ب — محصول (MVP)
          </NavLink>
        </nav>

        <div className="ms-auto hidden items-center gap-2 lg:flex">
          <NavLink to="/report" className={navItemClass}>
            گزارش فنی
          </NavLink>
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Badge tone="indigo">
                {currentUser.fullName} ·{' '}
                {currentUser.role === 'seller' ? 'فروشنده' : currentUser.role === 'buyer' ? 'خریدار' : 'مدیر سامانه'}
              </Badge>
              <Button variant="quiet" size="sm" onClick={logout}>
                خروج
              </Button>
            </div>
          ) : (
            <Link to="/mvp/login">
              <Button size="sm">ورود به سامانه</Button>
            </Link>
          )}
        </div>

        <button
          type="button"
          className="ms-auto rounded-lg border border-line-strong p-2 lg:hidden"
          aria-expanded={open}
          aria-label="فهرست ناوبری"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
            <g stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 6h14M3 10h14M3 14h14" />
            </g>
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-3 lg:hidden">
          <nav aria-label="ناوبری همراه" className="flex flex-col gap-1">
            <NavLink to="/dossier" className={navItemClass}>
              بخش الف — پرونده تحلیلی کسب‌وکار
            </NavLink>
            <NavLink to="/mvp" className={navItemClass}>
              بخش ب — محصول کمینه پذیرفتنی
            </NavLink>
            <NavLink to="/report" className={navItemClass}>
              گزارش فنی و سناریوها
            </NavLink>
            {currentUser ? (
              <button type="button" onClick={logout} className="mt-1 text-start text-[13.5px] text-danger">
                خروج از حساب {currentUser.fullName}
              </button>
            ) : (
              <NavLink to="/mvp/login" className={navItemClass}>
                ورود به سامانه
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
