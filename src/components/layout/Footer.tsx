import { Link } from 'react-router-dom';
import { BRAND } from '../../lib/content/brand';

export const Footer = () => (
  <footer className="no-print mt-16 border-t border-line bg-surface">
    <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2">
        <p className="font-display text-[20px] font-bold text-ink">{BRAND.name}</p>
        <p className="text-[12.5px] leading-7 text-muted">{BRAND.businessTitle}</p>
        <p className="text-[12px] leading-6 text-muted">{BRAND.nameNote}</p>
      </div>
      <nav className="flex flex-col gap-1.5 text-[13px]" aria-label="بخش‌های پرونده">
        <p className="label-eyebrow mb-1">بخش الف</p>
        <Link to="/dossier#problem" className="text-body hover:text-indigo-700">صورت‌بندی مسئله</Link>
        <Link to="/dossier#waste" className="text-body hover:text-indigo-700">مدل اتلاف زمان و هزینه</Link>
        <Link to="/dossier#journey" className="text-body hover:text-indigo-700">نقشه سفر مشتری</Link>
        <Link to="/dossier#validation" className="text-body hover:text-indigo-700">اعتبارسنجی میدانی</Link>
      </nav>
      <nav className="flex flex-col gap-1.5 text-[13px]" aria-label="بخش محصول">
        <p className="label-eyebrow mb-1">بخش ب</p>
        <Link to="/mvp" className="text-body hover:text-indigo-700">بازارگاه</Link>
        <Link to="/mvp/seller" className="text-body hover:text-indigo-700">داشبورد فروشنده</Link>
        <Link to="/mvp/buyer/requests" className="text-body hover:text-indigo-700">درخواست‌های خریدار</Link>
        <Link to="/report" className="text-body hover:text-indigo-700">گزارش فنی و سناریوها</Link>
      </nav>
      <div className="flex flex-col gap-2 text-[12px] leading-6 text-muted">
        <p className="label-eyebrow mb-1">درباره این تحویل</p>
        <p>
          پروژه درس تجارت الکترونیکی — دانشگاه یزد، دانشکده مهندسی کامپیوتر. تحویل فاز ۱:
          پرونده تحلیلی کسب‌وکار و محصول کمینه پذیرفتنی.
        </p>
        <p>
          همه تراکنش‌های مالی در این سامانه شبیه‌سازی‌شده‌اند؛ هیچ درگاه پرداخت واقعی یا داده
          بانکی و هویتی در آن وجود ندارد.
        </p>
      </div>
    </div>
  </footer>
);
