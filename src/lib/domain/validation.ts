/**
 * لایه اعتبارسنجی — کاملاً مستقل از UI و قابل آزمون با Node.
 * هر تابع یک نتیجه ساختاریافته برمی‌گرداند؛ کامپوننت‌ها فقط آن را نمایش می‌دهند.
 */

import type { FabricCategory, FabricListing, QualityGrade, SpecKey } from './types';

export type FieldErrors = Record<string, string>;

export interface ValidationResult {
  ok: boolean;
  errors: FieldErrors;
}

export const ok = (): ValidationResult => ({ ok: true, errors: {} });
export const fail = (errors: FieldErrors): ValidationResult => ({
  ok: Object.keys(errors).length === 0,
  errors,
});

/* --------------------------- ورودی فرم ثبت آگهی --------------------------- */

export interface ListingDraftInput {
  title: string;
  categoryId: string;
  description: string;
  totalQuantity: number;      // NaN اگر ورودی عددی نامعتبر باشد
  minOrderQuantity: number;
  pricePerUnit: number;
  qualityGrade: QualityGrade | '';
  defects: string;
  province: string;
  city: string;
  negotiable: boolean;
  specs: Record<string, string | number | boolean | undefined>;
  imageCount: number;
}

export const SPEC_LABELS: Record<SpecKey, string> = {
  fiber: 'ترکیب الیاف',
  width: 'عرض (سانتی‌متر)',
  gsm: 'گراماژ (گرم بر مترمربع)',
  color: 'رنگ',
  pattern: 'طرح',
  finish: 'تکمیل/فینیش',
  application: 'کاربرد پیشنهادی',
  rollLength: 'متراژ هر طاقه',
  fireRetardant: 'ضد شعله',
  rubCycles: 'چرخه سایش مارتیندیل',
};

/** حد بالای منطقی برای جلوگیری از داده‌های بی‌معنا (مثلاً عرض ۵۰۰۰ سانتی‌متر). */
const SPEC_RANGE: Partial<Record<SpecKey, [number, number]>> = {
  width: [20, 400],
  gsm: [20, 1200],
  rollLength: [1, 2000],
  rubCycles: [1000, 200000],
};

export const validateListingDraft = (
  input: ListingDraftInput,
  category: FabricCategory | undefined,
): ValidationResult => {
  const e: FieldErrors = {};

  if (input.title.trim().length < 5) e.title = 'عنوان آگهی باید حداقل ۵ نویسه باشد.';
  if (input.title.trim().length > 90) e.title = 'عنوان آگهی حداکثر ۹۰ نویسه است.';

  if (!input.categoryId) e.categoryId = 'انتخاب دسته پارچه الزامی است.';
  else if (!category) e.categoryId = 'دسته انتخاب‌شده معتبر نیست.';

  if (input.description.trim().length < 20)
    e.description = 'توضیح موجودی باید حداقل ۲۰ نویسه باشد تا برای خریدار قابل ارزیابی شود.';

  if (!Number.isFinite(input.totalQuantity)) e.totalQuantity = 'مقدار موجودی را به صورت عدد وارد کنید.';
  else if (input.totalQuantity <= 0) e.totalQuantity = 'موجودی کل باید بزرگ‌تر از صفر باشد.';
  else if (input.totalQuantity > 1_000_000) e.totalQuantity = 'موجودی کل از حد مجاز سامانه بیشتر است.';

  if (!Number.isFinite(input.minOrderQuantity)) e.minOrderQuantity = 'حداقل سفارش را به صورت عدد وارد کنید.';
  else if (input.minOrderQuantity <= 0) e.minOrderQuantity = 'حداقل سفارش باید بزرگ‌تر از صفر باشد.';
  else if (Number.isFinite(input.totalQuantity) && input.minOrderQuantity > input.totalQuantity)
    e.minOrderQuantity = 'حداقل سفارش نمی‌تواند از موجودی کل بیشتر باشد.';

  if (!Number.isFinite(input.pricePerUnit)) e.pricePerUnit = 'قیمت واحد را به صورت عدد وارد کنید.';
  else if (input.pricePerUnit <= 0) e.pricePerUnit = 'قیمت واحد باید بزرگ‌تر از صفر باشد.';
  else if (input.pricePerUnit > 100_000_000) e.pricePerUnit = 'قیمت واردشده خارج از دامنه منطقی است.';

  if (!input.qualityGrade) e.qualityGrade = 'تعیین درجه کیفی الزامی است.';

  // قاعده شفافیت تارنو: درجه B یا C باید توضیح ایراد داشته باشد.
  if ((input.qualityGrade === 'B' || input.qualityGrade === 'C') && input.defects.trim().length < 10)
    e.defects = 'برای درجه کیفی B و C، توصیف ایراد (حداقل ۱۰ نویسه) الزامی است.';

  if (!input.province.trim()) e.province = 'استان محل تحویل را وارد کنید.';
  if (!input.city.trim()) e.city = 'شهر محل تحویل را وارد کنید.';

  if (input.imageCount < 1) e.images = 'حداقل یک تصویر از پارچه الزامی است.';

  // فیلدهای فنی وابسته به دسته
  if (category) {
    for (const key of category.requiredSpecs) {
      const raw = input.specs[key];
      if (key === 'fireRetardant') continue; // بولین؛ مقدار پیش‌فرض «خیر» معتبر است
      if (raw === undefined || raw === '' || raw === null) {
        e[`specs.${key}`] = `${SPEC_LABELS[key]} برای این دسته الزامی است.`;
        continue;
      }
      const range = SPEC_RANGE[key];
      if (range) {
        const num = typeof raw === 'number' ? raw : Number(raw);
        if (!Number.isFinite(num)) e[`specs.${key}`] = `${SPEC_LABELS[key]} باید عدد باشد.`;
        else if (num < range[0] || num > range[1])
          e[`specs.${key}`] = `${SPEC_LABELS[key]} باید بین ${range[0]} و ${range[1]} باشد.`;
      }
    }
    for (const key of category.optionalSpecs) {
      const raw = input.specs[key];
      if (raw === undefined || raw === '' || raw === null) continue;
      const range = SPEC_RANGE[key];
      if (range) {
        const num = typeof raw === 'number' ? raw : Number(raw);
        if (!Number.isFinite(num)) e[`specs.${key}`] = `${SPEC_LABELS[key]} باید عدد باشد.`;
        else if (num < range[0] || num > range[1])
          e[`specs.${key}`] = `${SPEC_LABELS[key]} باید بین ${range[0]} و ${range[1]} باشد.`;
      }
    }
  }

  return fail(e);
};

/* ------------------------- ورودی ثبت درخواست خرید ------------------------- */

export interface PurchaseRequestInput {
  quantity: number;
  message: string;
}

export const validatePurchaseRequest = (
  input: PurchaseRequestInput,
  listing: FabricListing,
  buyerId: string,
): ValidationResult => {
  const e: FieldErrors = {};

  if (listing.status !== 'active') {
    e.listing = 'این آگهی در حال حاضر فعال نیست و امکان ثبت درخواست وجود ندارد.';
    return fail(e);
  }

  // قاعده کسب‌وکار: فروشنده نمی‌تواند خریدار آگهی خودش باشد.
  if (listing.sellerId === buyerId) {
    e.listing = 'فروشنده نمی‌تواند برای آگهی خودش درخواست خرید ثبت کند.';
    return fail(e);
  }

  if (!Number.isFinite(input.quantity)) {
    e.quantity = 'مقدار درخواستی را به صورت عدد وارد کنید.';
  } else if (input.quantity <= 0) {
    e.quantity = 'مقدار درخواستی باید بزرگ‌تر از صفر باشد.';
  } else if (input.quantity < listing.minOrderQuantity) {
    e.quantity = `مقدار درخواستی کمتر از حداقل سفارش این آگهی است (حداقل ${listing.minOrderQuantity}).`;
  } else if (input.quantity > listing.availableQuantity) {
    e.quantity = `مقدار درخواستی از موجودی قابل عرضه بیشتر است (موجود: ${listing.availableQuantity}).`;
  }

  if (input.message.trim().length > 500) e.message = 'متن پیام حداکثر ۵۰۰ نویسه است.';

  return fail(e);
};

/* ------------------------------ ورود به سامانه ----------------------------- */

export const validateLogin = (email: string, password: string): ValidationResult => {
  const e: FieldErrors = {};
  if (!email.trim()) e.email = 'ایمیل را وارد کنید.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'قالب ایمیل معتبر نیست.';
  if (!password) e.password = 'گذرواژه را وارد کنید.';
  return fail(e);
};

/* ---------------------------- رد درخواست خرید ---------------------------- */

export const validateRejection = (reason: string): ValidationResult => {
  const e: FieldErrors = {};
  if (reason.trim().length < 5) e.reason = 'ذکر دلیل رد درخواست (حداقل ۵ نویسه) الزامی است.';
  return fail(e);
};

/* --------------------------- پیشنهاد قیمت فروشنده ------------------------- */

export const validatePriceOffer = (
  unitPrice: number,
  quantity: number,
  listing: FabricListing,
): ValidationResult => {
  const e: FieldErrors = {};
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) e.unitPrice = 'قیمت پیشنهادی باید عددی بزرگ‌تر از صفر باشد.';
  if (!Number.isFinite(quantity) || quantity <= 0) e.quantity = 'مقدار پیشنهادی باید بزرگ‌تر از صفر باشد.';
  else if (quantity > listing.availableQuantity)
    e.quantity = `مقدار پیشنهادی از موجودی قابل عرضه بیشتر است (موجود: ${listing.availableQuantity}).`;
  else if (quantity < listing.minOrderQuantity)
    e.quantity = `مقدار پیشنهادی کمتر از حداقل سفارش آگهی است (حداقل ${listing.minOrderQuantity}).`;
  return fail(e);
};
