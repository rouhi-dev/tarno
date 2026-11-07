/**
 * تولید «نمونه بافت» به صورت SVG درون‌خطی (data URI).
 *
 * در فاز ۱ تصویر واقعی پارچه در اختیار نداریم و بارگذاری تصاویر از اینترنت هم
 * سامانه را به منابع بیرونی وابسته می‌کند؛ بنابراین برای داده‌های پایه، سوئچ
 * بافت به صورت برنامه‌ای ساخته می‌شود. تصاویری که کاربر در فرم آپلود می‌کند
 * به صورت dataURL واقعی ذخیره می‌شوند.
 *
 * برچسب شفافیت: این تصاویر «شبیه‌سازی‌شده» هستند و در رابط کاربری با نشان
 * «نمونه بافت» مشخص می‌شوند.
 */

export type WeavePattern = 'plain' | 'twill' | 'rib' | 'dobby' | 'melange' | 'stripe' | 'flat';

const svg = (inner: string, bg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" fill="${bg}"/>${inner}</svg>`,
  )}`;

export const fabricSwatch = (
  base: string,
  thread: string,
  pattern: WeavePattern = 'plain',
): string => {
  const defs: Record<WeavePattern, string> = {
    plain: `<pattern id="p" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${base}"/><rect width="3" height="3" fill="${thread}" opacity=".55"/><rect x="3" y="3" width="3" height="3" fill="${thread}" opacity=".55"/></pattern>`,
    twill: `<pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${base}"/><rect width="8" height="3" fill="${thread}" opacity=".5"/></pattern>`,
    rib: `<pattern id="p" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="${base}"/><rect width="2.5" height="7" fill="${thread}" opacity=".5"/></pattern>`,
    dobby: `<pattern id="p" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${base}"/><circle cx="4" cy="4" r="2" fill="${thread}" opacity=".55"/><circle cx="11" cy="11" r="2" fill="${thread}" opacity=".55"/></pattern>`,
    melange: `<pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${base}"/><path d="M0 2 L10 5 M0 7 L10 9 M0 9 L10 1" stroke="${thread}" stroke-width="1" opacity=".45" fill="none"/></pattern>`,
    stripe: `<pattern id="p" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${base}"/><rect width="6" height="18" fill="${thread}" opacity=".6"/></pattern>`,
    flat: `<pattern id="p" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${base}"/></pattern>`,
  };

  // لبه طاقه و سایه ملایم برای آنکه نمونه، «قطعه پارچه» خوانده شود نه مستطیل رنگی
  const inner = `<defs>${defs[pattern]}</defs>
    <rect width="160" height="120" fill="url(#p)"/>
    <path d="M0 0 L160 0 L160 10 Q80 22 0 10 Z" fill="#000" opacity=".06"/>
    <path d="M0 110 Q80 98 160 110 L160 120 L0 120 Z" fill="#000" opacity=".08"/>
    <rect x="0" y="0" width="160" height="120" fill="none" stroke="#000" stroke-opacity=".08"/>`;

  return svg(inner, base);
};

/** نمونه‌ای که یک ایراد مشخص (لکه رنگ، تاب‌خوردگی، اختلاف شید) را نشان می‌دهد. */
export const defectSwatch = (base: string, thread: string, kind: 'stain' | 'shade' | 'snag'): string => {
  const marks: Record<typeof kind, string> = {
    stain: `<ellipse cx="104" cy="62" rx="26" ry="18" fill="#3b2f2a" opacity=".3"/><ellipse cx="98" cy="58" rx="12" ry="8" fill="#3b2f2a" opacity=".35"/>`,
    shade: `<rect x="86" y="0" width="74" height="120" fill="#000" opacity=".12"/><line x1="86" y1="0" x2="86" y2="120" stroke="#000" stroke-opacity=".25" stroke-dasharray="4 3"/>`,
    snag: `<path d="M40 30 C70 50 60 80 100 92" stroke="${thread}" stroke-width="2.5" fill="none" opacity=".8"/><circle cx="100" cy="92" r="4" fill="${thread}" opacity=".8"/>`,
  };
  const inner = `<defs><pattern id="p" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${base}"/><rect width="3" height="3" fill="${thread}" opacity=".5"/><rect x="3" y="3" width="3" height="3" fill="${thread}" opacity=".5"/></pattern></defs>
    <rect width="160" height="120" fill="url(#p)"/>${marks[kind]}
    <rect x="0" y="0" width="160" height="120" fill="none" stroke="#000" stroke-opacity=".08"/>`;
  return svg(inner, base);
};
