# راهنمای استقرار

خروجی ساخت، یک بسته کاملاً ایستا در `dist/` است: بدون سرور، بدون پایگاه داده و
بدون متغیر محیطی. مسیریابی از نوع `HashRouter` است، پس هیچ قاعده بازنویسی مسیر
(rewrite) لازم نیست و مسیرهای داخلی روی هر میزبانی خطای ۴۰۴ نمی‌دهند.

## ۰. پیش از استقرار

```bash
npm install
npm run test        # ۳۷ آزمون دامنه + ۲۴ رندر مسیر
npm run build       # بررسی تایپ و ساخت خروجی در dist/
npm run preview     # بررسی محلی خروجی ساخت
```

## ۱. Vercel (پیشنهاد اول)

### از طریق رابط وب
1. مخزن را در GitHub قرار دهید.
2. در Vercel گزینه **Add New → Project** و سپس Import همان مخزن.
3. تنظیمات (معمولاً خودکار تشخیص داده می‌شود):
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Deploy** و سپس ثبت نشانی تولیدی در `README.md`.

### از طریق خط فرمان
```bash
npm i -g vercel
vercel login
vercel          # استقرار پیش‌نمایش
vercel --prod   # استقرار تولیدی
```

## ۲. Netlify

```bash
npm i -g netlify-cli
netlify login
netlify deploy --build --prod
# Publish directory: dist
```

یا با فایل پیکربندی در ریشه مخزن:

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

## ۳. GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

سپس در تنظیمات مخزن، بخش Pages، شاخه `gh-pages` را انتخاب کنید.
از آنجا که `base` در `vite.config.ts` روی `'./'` تنظیم شده است، استقرار در
زیرمسیر (`https://user.github.io/tarno/`) هم بدون تغییر کار می‌کند.

## ۴. سرور شخصی (Nginx)

```bash
npm run build
scp -r dist/* user@server:/var/www/tarno/
```

```nginx
server {
    listen 80;
    server_name tarno.example.com;
    root /var/www/tarno;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|svg|woff2)$ {
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

## ۵. خطوط لوله استقرار خودکار (CI/CD)

نمونه گردش‌کار GitHub Actions برای اجرای آزمون‌ها در هر push:

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run test
      - run: npm run build
```

## ۶. چک‌لیست پیش از جلسه تحویل

- [ ] `npm run test` بدون خطا اجرا می‌شود.
- [ ] `npm run build` موفق است.
- [ ] نشانی عمومی سامانه در دسترس و در `README.md` درج شده است.
- [ ] نشانی مخزن گیت‌هاب در `README.md` درج شده و دسترسی تدریسیار فراهم است.
- [x] نام و شماره دانشجویی در `README.md` درج شده است.
- [x] سند `AI_DISCLOSURE.md` تکمیل شده است.
- [ ] برچسب فاز ثبت شده است: `git tag -a v1.0-phase1`.
- [ ] **قانون فریز ۴ ساعته:** آخرین کامیت و استقرار حداکثر ۴ ساعت پیش از نوبت تحویل ثبت شده باشد.
- [ ] سناریوی کامل معامله یک بار روی سامانه مستقرشده اجرا و بی‌خطا بودن آن تأیید شده است.
- [ ] نتیجه آزمون‌های دستی مرورگر در `docs/TEST_RESULTS.md` ثبت شده است.
