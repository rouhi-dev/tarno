/** توابع قالب‌بندی فارسی — ارقام فارسی، واحد پول و تاریخ شمسی. */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const toFa = (input: string | number): string =>
  String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/** عدد با جداکننده هزارگان و ارقام فارسی */
export const faNum = (n: number, fractionDigits = 0): string =>
  toFa(
    n.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }),
  );

/** مبلغ به تومان */
export const toman = (n: number): string => `${faNum(Math.round(n))} تومان`;

/** مبلغ خلاصه برای نمودارها: ۱٫۲ میلیون */
export const tomanShort = (n: number): string => {
  if (Math.abs(n) >= 1_000_000_000) return `${faNum(n / 1_000_000_000, 1)} میلیارد`;
  if (Math.abs(n) >= 1_000_000) return `${faNum(n / 1_000_000, 1)} میلیون`;
  if (Math.abs(n) >= 1_000) return `${faNum(Math.round(n / 1000))} هزار`;
  return faNum(n);
};

export const UNIT_LABEL: Record<'meter' | 'kilogram', string> = {
  meter: 'متر',
  kilogram: 'کیلوگرم',
};

export const qty = (n: number, unit: 'meter' | 'kilogram'): string =>
  `${faNum(n, Number.isInteger(n) ? 0 : 1)} ${UNIT_LABEL[unit]}`;

/** تاریخ و ساعت شمسی */
export const faDateTime = (iso: string): string => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  return `${date} — ${time}`;
};

export const faDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

/** فاصله زمانی خوانا: «۳ روز پیش» */
export const faAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'لحظه‌ای پیش';
  if (mins < 60) return `${faNum(mins)} دقیقه پیش`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${faNum(hours)} ساعت پیش`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${faNum(days)} روز پیش`;
  return faDate(iso);
};

/** تبدیل ارقام فارسی/عربی ورودی کاربر به عدد انگلیسی قابل پارس */
export const normalizeDigits = (value: string): string =>
  value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[,\s٬]/g, '');

/** پارس عدد از ورودی فرم؛ NaN یعنی ورودی نامعتبر */
export const parseNum = (value: string): number => {
  const normalized = normalizeDigits(value).trim();
  if (normalized === '') return NaN;
  return Number(normalized);
};
