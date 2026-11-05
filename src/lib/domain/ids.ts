/** تولید شناسه و کد انسانی. در فاز ۱ نیازی به UUID رمزنگارانه نیست. */

export const uid = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** کد انسانی افزایشی: TRN-1042 / REQ-10231 / ORD-5571 */
export const humanCode = (prefix: string, seq: number): string => `${prefix}-${seq}`;

export const nextSeq = (items: { code: string }[], prefix: string, start: number): number => {
  const nums = items
    .map((i) => i.code)
    .filter((c) => c.startsWith(`${prefix}-`))
    .map((c) => Number(c.split('-')[1]))
    .filter((n) => Number.isFinite(n));
  return nums.length ? Math.max(...nums) + 1 : start;
};
