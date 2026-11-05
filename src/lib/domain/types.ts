/**
 * مدل داده دامنه تارنو — فاز ۱
 * ---------------------------------------------------------------------------
 * این فایل «قرارداد داده» سامانه است و هیچ وابستگی‌ای به React یا لایه ذخیره‌سازی
 * ندارد؛ بنابراین در فازهای بعدی می‌توان درایور LocalStorage را با Supabase عوض کرد
 * بدون آنکه این تایپ‌ها تغییر کنند.
 */

export type ID = string;
export type ISODate = string;

/* ---------------------------------- کاربر --------------------------------- */

export type UserRole = 'seller' | 'buyer' | 'admin';

export interface User {
  id: ID;
  /** نقش اصلی حساب. در فاز ۱ هر حساب یک نقش دارد (نقش دوگانه خارج از محدوده است). */
  role: UserRole;
  fullName: string;
  email: string;
  /** رمز عبور نمونه فقط برای حساب‌های دمو؛ هیچ داده واقعی هویتی ذخیره نمی‌شود. */
  password: string;
  phone: string;
  businessProfileId: ID | null;
  createdAt: ISODate;
}

export interface BusinessProfile {
  id: ID;
  ownerUserId: ID;
  businessName: string;
  /** نوع فعالیت: کارخانه نساجی، عمده‌فروش، کارگاه تولیدی و … */
  businessType: string;
  province: string;
  city: string;
  /** شماره ثبت/جواز کسب — در فاز ۱ فقط متن نمایشی و بدون استعلام واقعی است. */
  registrationNo: string;
  verified: boolean;
  createdAt: ISODate;
}

/* --------------------------------- دسته‌بندی -------------------------------- */

/** کلید فیلدهای فنی که بر اساس دسته پارچه، نمایش/الزام آن‌ها تغییر می‌کند. */
export type SpecKey =
  | 'fiber'
  | 'width'
  | 'gsm'
  | 'color'
  | 'pattern'
  | 'finish'
  | 'application'
  | 'rollLength'
  | 'fireRetardant'
  | 'rubCycles';

export interface FabricCategory {
  id: ID;
  slug: string;
  title: string;
  description: string;
  /** واحد پیش‌فرض معامله در این دسته */
  unit: 'meter' | 'kilogram';
  /** فیلدهای فنی الزامی این دسته */
  requiredSpecs: SpecKey[];
  /** فیلدهای فنی اختیاری این دسته */
  optionalSpecs: SpecKey[];
}

/* ---------------------------------- آگهی ---------------------------------- */

export type QualityGrade = 'A' | 'B' | 'C';

export type ListingStatus =
  | 'draft'        // پیش‌نویس فروشنده
  | 'pending'      // در انتظار تأیید مدیر سامانه
  | 'active'       // منتشرشده و قابل خرید
  | 'paused'       // موقتاً متوقف‌شده توسط فروشنده
  | 'rejected'     // ردشده توسط مدیر سامانه
  | 'sold_out';    // موجودی قابل عرضه صفر شده است

export interface ListingImage {
  id: ID;
  listingId: ID;
  /** در فاز ۱ تصاویر به صورت dataURL در لایه داده مرورگر نگهداری می‌شوند. */
  src: string;
  caption: string;
  /** تصویری که عیب/ایراد پارچه را مستند می‌کند (الزام شفافیت کیفی تارنو). */
  isDefectEvidence: boolean;
  order: number;
}

export interface FabricSpecs {
  fiber?: string;
  width?: number;          // سانتی‌متر
  gsm?: number;            // گرم بر مترمربع
  color?: string;
  pattern?: string;
  finish?: string;
  application?: string;
  rollLength?: number;     // متر در هر طاقه
  fireRetardant?: boolean;
  rubCycles?: number;      // چرخه سایش مارتیندیل (پارچه مبلمان)
}

export interface FabricListing {
  id: ID;
  code: string;                 // شناسه انسانی: TRN-1042
  sellerId: ID;
  categoryId: ID;
  title: string;
  description: string;
  specs: FabricSpecs;
  unit: 'meter' | 'kilogram';

  /** --- دفتر موجودی: همیشه total = available + reserved + sold --- */
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;

  minOrderQuantity: number;
  pricePerUnit: number;         // ریال/تومان — واحد نمایش: تومان
  negotiable: boolean;

  qualityGrade: QualityGrade;
  defects: string;              // توصیف شفاف ایرادها؛ خالی = «بدون ایراد اعلام‌شده»
  province: string;
  city: string;

  status: ListingStatus;
  moderationNote: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------ درخواست خرید ------------------------------ */

export type PurchaseRequestStatus =
  | 'pending'                   // ثبت‌شده، در انتظار بررسی فروشنده
  | 'rejected'                  // ردشده توسط فروشنده (با ذکر دلیل)
  | 'awaiting_buyer'            // فروشنده پذیرفته/پیشنهاد قیمت داده؛ نوبت تأیید خریدار
  | 'converted'                 // به سفارش تبدیل شد
  | 'withdrawn';                // انصراف خریدار

export interface PurchaseRequest {
  id: ID;
  code: string;                 // REQ-10231
  listingId: ID;
  buyerId: ID;
  sellerId: ID;
  quantity: number;
  /** قیمت لحظه ثبت درخواست؛ برای ردگیری تغییر قیمت آگهی نگه داشته می‌شود. */
  quotedUnitPrice: number;
  message: string;
  status: PurchaseRequestStatus;
  rejectionReason: string | null;
  priceOfferId: ID | null;
  orderId: ID | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface PriceOffer {
  id: ID;
  requestId: ID;
  /** سازنده پیشنهاد: در فاز ۱ فقط فروشنده پیشنهاد نهایی می‌دهد. */
  byUserId: ID;
  unitPrice: number;
  quantity: number;
  note: string;
  createdAt: ISODate;
}

/* ---------------------------------- سفارش --------------------------------- */

export type OrderStatus =
  | 'awaiting_payment'          // موجودی رزرو شده، منتظر پرداخت شبیه‌سازی‌شده
  | 'paid'                      // پرداخت موفق؛ موجودی به «فروخته‌شده» منتقل شد
  | 'cancelled'                 // لغو/انصراف؛ رزرو آزاد شد
  | 'payment_failed';           // پرداخت ناموفق؛ رزرو آزاد شد

export interface Order {
  id: ID;
  code: string;                 // ORD-5571
  requestId: ID;
  listingId: ID;
  buyerId: ID;
  sellerId: ID;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type PaymentStatus = 'initiated' | 'success' | 'failed';

export interface Payment {
  id: ID;
  orderId: ID;
  amount: number;
  /** درگاه شبیه‌سازی‌شده؛ هیچ اتصال بانکی واقعی وجود ندارد. */
  gateway: 'mock-gateway';
  status: PaymentStatus;
  reference: string;
  failureReason: string | null;
  createdAt: ISODate;
}

/* ------------------------- دفتر تراکنش‌های موجودی ------------------------- */

export type InventoryTxKind =
  | 'initial'    // ثبت موجودی اولیه هنگام ایجاد آگهی
  | 'reserve'    // قابل‌عرضه → رزرو
  | 'release'    // رزرو → قابل‌عرضه
  | 'commit'     // رزرو → فروخته‌شده
  | 'adjust';    // اصلاح دستی موجودی توسط فروشنده

export interface InventoryTransaction {
  id: ID;
  listingId: ID;
  kind: InventoryTxKind;
  quantity: number;
  /** وضعیت دفتر موجودی بلافاصله پس از این تراکنش (برای حسابرسی). */
  snapshot: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
  };
  refType: 'order' | 'request' | 'listing';
  refId: ID;
  actorId: ID;
  note: string;
  createdAt: ISODate;
}

export interface OrderHistory {
  id: ID;
  orderId: ID;
  from: OrderStatus | null;
  to: OrderStatus;
  actorId: ID;
  note: string;
  createdAt: ISODate;
}

/* --------------------------- گزارش اعتبارسنجی --------------------------- */

/**
 * رکورد مصاحبه میدانی (بخش «الف» پرونده).
 * توجه: این داده‌ها توسط دانشجو و پس از انجام مصاحبه واقعی وارد می‌شوند؛
 * داده‌های پیش‌فرض سامانه با برچسب «نمونه قالب» مشخص شده‌اند.
 */
export interface FieldInterview {
  id: ID;
  /** کد مستعار مصاحبه‌شونده (بدون داده هویتی واقعی) */
  alias: string;
  side: 'seller' | 'buyer' | 'both';
  businessType: string;
  city: string;
  /** وضعیت رکورد: قالب نمونه یا داده واقعی ثبت‌شده توسط دانشجو */
  provenance: 'template-sample' | 'field-recorded';
  date: ISODate;
  /** پاسخ به فرضیه‌ها: کلید = شناسه فرضیه، مقدار = تأیید/رد/نامشخص */
  verdicts: Record<string, 'support' | 'reject' | 'unclear'>;
  /** تخمین خود مصاحبه‌شونده از زمان صرف‌شده برای یک معامله (ساعت) */
  hoursPerDeal: number | null;
  notes: string;
}

export interface ValidationHypothesis {
  id: string;
  statement: string;
  /** نوع گزاره بر اساس «زبان تردید» درس */
  kind: 'hypothesis' | 'observation' | 'assumption';
  side: 'seller' | 'buyer' | 'both';
  /** پرسش مصاحبه‌ای که این فرضیه را می‌سنجد */
  probe: string;
  /** معیار پذیرش: حداقل نسبت تأیید برای «تأییدشده» تلقی شدن */
  acceptThreshold: number;
}

/* ------------------------------ وضعیت کل داده ----------------------------- */

export interface DatabaseShape {
  schemaVersion: number;
  users: User[];
  businessProfiles: BusinessProfile[];
  categories: FabricCategory[];
  listings: FabricListing[];
  listingImages: ListingImage[];
  purchaseRequests: PurchaseRequest[];
  priceOffers: PriceOffer[];
  orders: Order[];
  payments: Payment[];
  inventoryTransactions: InventoryTransaction[];
  orderHistory: OrderHistory[];
  interviews: FieldInterview[];
  session: { userId: ID | null };
}
