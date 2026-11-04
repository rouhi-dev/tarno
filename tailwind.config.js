/**
 * پیکربندی Tailwind — رنگ‌ها از توکن‌های CSS خوانده می‌شوند تا تم روشن/تاریک
 * در یک نقطه عوض شود.
 *
 * نکته فنی: توکن‌ها مقدار هگز دارند و نه سه‌گانه کانال رنگ؛ بنابراین برای آنکه
 * پیشوندهای شفافیت (مثل border-danger/40) هم کار کنند، هر رنگ به صورت تابع
 * تعریف شده و در صورت وجود شفافیت، از color-mix استفاده می‌کند.
 */

/** @param {string} varName */
const token = (varName) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `var(${varName})`
    : `color-mix(in srgb, var(${varName}) calc(${opacityValue} * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: token('--ink'),
        body: token('--text-body'),
        muted: token('--text-muted'),
        ground: token('--ground'),
        surface: token('--surface'),
        raised: token('--surface-raised'),
        line: token('--line'),
        'line-strong': token('--line-strong'),
        indigo: {
          900: token('--indigo-900'),
          700: token('--indigo-700'),
          500: token('--indigo-500'),
          100: token('--indigo-100'),
        },
        madder: {
          600: token('--madder-600'),
          100: token('--madder-100'),
        },
        ok: token('--ok'),
        warn: token('--warn'),
        danger: token('--danger'),
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'system-ui', 'sans-serif'],
        display: ['"Markazi Text"', 'Vazirmatn', 'serif'],
      },
      borderRadius: { card: '14px' },
      boxShadow: {
        plate: '0 1px 2px rgba(16,26,40,.06), 0 8px 24px -16px rgba(16,26,40,.22)',
        pop: '0 12px 40px -12px rgba(16,26,40,.3)',
      },
      maxWidth: { reading: '68ch' },
    },
  },
  plugins: [],
};
