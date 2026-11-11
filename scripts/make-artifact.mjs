/**
 * تولید نسخه قابل انتشار روی بستر Artifact از خروجی ساخت Vite.
 *
 * تفاوت با dist/index.html: بستر Artifact خودش اسکلت سند را اضافه می‌کند،
 * بنابراین اینجا فقط «محتوای صفحه» (title، لینک قلم، استایل، ریشه و اسکریپت)
 * تولید می‌شود. دارایی‌ها بدون تغییر از dist/assets خوانده می‌شوند.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const OUT = 'artifact';

const html = readFileSync(join(DIST, 'index.html'), 'utf8');

const css = [...html.matchAll(/href="\.\/(assets\/[^"]+\.css)"/g)].map((m) => m[1]);
const js = [...html.matchAll(/src="\.\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]);

if (js.length === 0) throw new Error('هیچ فایل اسکریپتی در خروجی ساخت پیدا نشد.');

mkdirSync(join(OUT, 'assets'), { recursive: true });
for (const f of readdirSync(join(DIST, 'assets'))) {
  copyFileSync(join(DIST, 'assets', f), join(OUT, 'assets', f));
}

const fragment = `<title>بازارگاه پارچه تارنو</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&family=Markazi+Text:wght@500;600;700&display=swap"
  rel="stylesheet"
/>
${css.map((f) => `<link rel="stylesheet" href="${f}" />`).join('\n')}
<style>
  /* سند راست‌به‌چپ؛ بستر Artifact اسکلت سند را خودش می‌سازد.
     توکن‌های رنگ و color-scheme در شیوه‌نامه خود پروژه تعریف شده‌اند و اینجا
     بازنویسی نمی‌شوند تا تم تاریک از کار نیفتد. */
  html, body { direction: rtl; }
  body { margin: 0; font-family: 'Vazirmatn', Tahoma, system-ui, sans-serif; }
</style>
<div id="root" dir="rtl" lang="fa"></div>
<script>
  // جهت و زبان سند برای بستر میزبان تنظیم می‌شود.
  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.setAttribute('lang', 'fa');
</script>
${js.map((f) => `<script type="module" src="${f}"></script>`).join('\n')}
`;

writeFileSync(join(OUT, 'index.html'), fragment, 'utf8');

console.log('artifact/index.html ساخته شد');
console.log('دارایی‌ها:', [...css, ...js].join('  '));
