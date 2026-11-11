/**
 * ابزارهای کمکی تعامل با DOM در آزمون‌های یکپارچه.
 *
 * نکته فنی: برای تغییر مقدار ورودی‌ها از `Simulate.change` خود React استفاده
 * می‌شود. ارسال رویداد خام `input` در jsdom به سامانه رویداد React نمی‌رسد،
 * در حالی که کلیک خام می‌رسد؛ بنابراین کلیک با رویداد واقعی و تغییر مقدار با
 * ابزار رسمی React انجام می‌گیرد.
 */

import { Simulate } from 'react-dom/test-utils';

/** همه عناصر منطبق با گزینشگر */
export const all = (selector: string, root: ParentNode = document): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(selector)];

/** نخستین عنصری که متن آن شامل رشته داده‌شده است */
export const byText = (
  text: string,
  selector = 'button, a, h1, h2, h3, h4, p, span, div, li, td, th',
  root: ParentNode = document,
): HTMLElement | null =>
  all(selector, root).find((el) => (el.textContent ?? '').includes(text)) ?? null;

/** دقیق‌تر: عنصری که خودش (و نه فرزندانش) متن را حمل می‌کند */
export const leafByText = (text: string, selector = 'button, a', root: ParentNode = document) =>
  all(selector, root).find((el) => (el.textContent ?? '').trim().includes(text)) ?? null;

export const mustFind = (text: string, selector?: string): HTMLElement => {
  const el = byText(text, selector);
  if (!el) throw new Error(`عنصری با متن «${text}» پیدا نشد.`);
  return el;
};

export const mustButton = (text: string): HTMLElement => {
  const el = leafByText(text, 'button, a');
  if (!el) throw new Error(`دکمه‌ای با متن «${text}» پیدا نشد.`);
  return el;
};

/**
 * دکمه‌ای که متن آن **دقیقاً** برابر رشته داده‌شده است.
 * لازم است چون برخی متن‌ها زیررشته یکدیگرند؛ مثلاً پیوند ناوبری «ثبت آگهی جدید»
 * و دکمه ارسال فرم «ثبت آگهی».
 */
export const exactButton = (text: string): HTMLElement => {
  const el = all('button, a').find((e) => (e.textContent ?? '').trim() === text.trim());
  if (!el) throw new Error(`دکمه‌ای با متن دقیق «${text}» پیدا نشد.`);
  return el;
};

export const hasText = (text: string): boolean => (document.body.textContent ?? '').includes(text);

/** کلیک واقعی روی عنصر تا React رویداد را دریافت کند */
export const click = (el: Element): void => {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
};

/** خواندن props واقعی که React روی گره DOM گذاشته است */
const reactProps = (el: Element): Record<string, unknown> | null => {
  const key = Object.keys(el).find((k) => k.startsWith('__reactProps$'));
  return key ? ((el as unknown as Record<string, Record<string, unknown>>)[key] ?? null) : null;
};

/**
 * تغییر مقدار ورودی به شکلی که React آن را ببیند.
 *
 * ابتدا مقدار با setter نمونه‌ساز نوشته می‌شود تا `event.target.value` درست
 * باشد، سپس `onChange` همان کامپوننت از props ثبت‌شده روی گره فراخوانی می‌گردد.
 * دلیل این انتخاب: در jsdom رویداد خام `input` به سامانه رویداد React نمی‌رسد و
 * `Simulate.change` هم روی همه ورودی‌ها قابل اتکا نیست؛ فراخوانی مستقیم
 * `onChange` همان مسیر منطقی کامپوننت را اجرا می‌کند و قطعی است.
 */
export const setValue = (el: HTMLElement, value: string): void => {
  const proto =
    el instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : el instanceof window.HTMLSelectElement
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (!setter) throw new Error('setter مقدار برای این نوع ورودی پیدا نشد.');
  setter.call(el, value);

  const props = reactProps(el);
  const onChange = props?.onChange as ((e: unknown) => void) | undefined;
  if (onChange) {
    onChange({ target: el, currentTarget: el, preventDefault() {}, stopPropagation() {} });
    return;
  }
  Simulate.change(el);
};

/** زدن تیک یا برداشتن تیک یک چک‌باکس */
export const toggleCheckbox = (id: string, checked: boolean): void => {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) throw new Error(`چک‌باکسی با شناسه «${id}» پیدا نشد.`);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')?.set;
  setter?.call(el, checked);
  Simulate.change(el);
};

export const fill = (id: string, value: string): void => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`فیلدی با شناسه «${id}» پیدا نشد.`);
  setValue(el as HTMLElement, value);
};

export const blurField = (id: string): void => {
  const el = document.getElementById(id);
  el?.dispatchEvent(new window.Event('blur', { bubbles: true }));
};
