/**
 * آزمون دود رندر — همه مسیرها را بدون مرورگر رندر می‌کند تا خطاهای اجرایی
 * کامپوننت‌ها (ایمپورت نادرست، دسترسی به مقدار تعریف‌نشده، خطای هوک) پیش از
 * استقرار پیدا شود.
 *
 * اجرا: npm run test:render
 */

import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../src/lib/store/StoreProvider.tsx';
import { App } from '../src/App.tsx';
import { buildSeedDatabase } from '../src/lib/store/seed.ts';

/* ------- شبیه‌سازی حداقلی محیط مرورگر برای رندر سمت سرور ------- */
const store = new Map<string, string>();
const g = globalThis as unknown as Record<string, unknown>;

class FakeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

g.window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  scrollTo() {},
  setTimeout: () => 0,
  requestAnimationFrame: () => 0,
  addEventListener() {},
  removeEventListener() {},
  IntersectionObserver: FakeObserver,
  innerWidth: 1280,
  innerHeight: 900,
};
g.localStorage = (g.window as Record<string, unknown>).localStorage;
g.IntersectionObserver = FakeObserver;
g.ResizeObserver = FakeObserver;
g.requestAnimationFrame = (cb: (t: number) => void) => {
  void cb;
  return 0;
};
g.cancelAnimationFrame = () => {};
g.matchMedia = (g.window as Record<string, unknown>).matchMedia;

const ROUTES = [
  '/',
  '/dossier',
  '/report',
  '/mvp',
  '/mvp/login',
  '/mvp/listing/lst_1',
  '/mvp/listing/lst_9',
  '/mvp/seller',
  '/mvp/seller/new',
  '/mvp/seller/requests',
  '/mvp/buyer/requests',
  '/mvp/buyer/orders',
  '/mvp/admin',
  '/mvp/unknown-path',
];

/** نشست کاربر را در حافظه ساختگی مرورگر می‌نشاند تا صفحه‌های نقش‌محور رندر شوند. */
const setSession = (userId: string | null) => {
  const db = buildSeedDatabase();
  store.set('tarno.db.v1', JSON.stringify({ ...db, session: { userId } }));
};

let failed = 0;
let total = 0;

const render = (route: string, label: string) => {
  total += 1;
  try {
    const html = renderToString(
      <MemoryRouter initialEntries={[route]}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </MemoryRouter>,
    );
    if (html.length < 200) throw new Error(`خروجی رندر بسیار کوتاه است (${html.length} نویسه)`);
    console.log(`  \u2713 ${label} — ${html.length.toLocaleString('en-US')} نویسه`);
  } catch (e) {
    failed += 1;
    console.log(
      `  \u00d7 ${label}\n      ${
        e instanceof Error ? e.stack?.split('\n').slice(0, 4).join('\n      ') : String(e)
      }`,
    );
  }
};

console.log('\n=== آزمون دود رندر مسیرها ===\n');

console.log('— بدون ورود (مهمان)');
setSession(null);
for (const route of ROUTES) render(route, route);

console.log('\n— با نقش فروشنده');
setSession('usr_seller_1');
for (const route of ['/mvp/seller', '/mvp/seller/new', '/mvp/seller/requests', '/mvp/listing/lst_1'])
  render(route, `${route} (فروشنده)`);

console.log('\n— با نقش خریدار');
setSession('usr_buyer_1');
for (const route of ['/mvp', '/mvp/buyer/requests', '/mvp/buyer/orders', '/mvp/listing/lst_1'])
  render(route, `${route} (خریدار)`);

console.log('\n— با نقش مدیر سامانه');
setSession('usr_admin');
for (const route of ['/mvp/admin', '/mvp/listing/lst_9']) render(route, `${route} (مدیر)`);

console.log(`\n=== ${total - failed} رندر سالم از ${total} ===\n`);
if (failed > 0) process.exit(1);
