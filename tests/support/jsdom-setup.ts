/**
 * آماده‌سازی محیط DOM برای آزمون‌های یکپارچه رابط کاربری.
 *
 * این فایل باید **نخستین ایمپورت** فایل آزمون باشد؛ چون متغیرهای جهانی مرورگر
 * را پیش از بارگذاری React و کامپوننت‌ها می‌سازد.
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="fa" dir="rtl"><body><div id="app"></div></body></html>', {
  url: 'https://tarno.test/',
  pretendToBeVisual: true,
});

const g = globalThis as unknown as Record<string, unknown>;

/** برخی متغیرهای جهانی Node فقط getter دارند و باید با defineProperty جایگزین شوند. */
const defineGlobal = (name: string, value: unknown) => {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
};

g.window = dom.window;
g.document = dom.window.document;
defineGlobal('navigator', dom.window.navigator);
g.localStorage = dom.window.localStorage;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
g.HTMLSelectElement = dom.window.HTMLSelectElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
g.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);

/** jsdom این دو ناظر را پیاده نکرده است؛ بدل بی‌اثر کافی است. */
class StubObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [] as unknown[];
  }
}
g.IntersectionObserver = StubObserver;
g.ResizeObserver = StubObserver;

/** jsdom متد پیمایش به عنصر را پیاده نکرده است؛ بدل بی‌اثر کافی است. */
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.scrollTo = () => {};
(dom.window as unknown as Record<string, unknown>).IntersectionObserver = StubObserver;
(dom.window as unknown as Record<string, unknown>).ResizeObserver = StubObserver;

/** پاسخ ثابت به پرسش «کاهش حرکت»، تا framer-motion در آزمون قابل پیش‌بینی بماند. */
const matchMedia = () => ({
  matches: false,
  media: '',
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
});
g.matchMedia = matchMedia;
(dom.window as unknown as Record<string, unknown>).matchMedia = matchMedia;

/** React 18 در حالت آزمون این پرچم را می‌خواهد. */
(g as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

export const jsdomWindow = dom.window;
