/**
 * مورد مزیت‌بخش ۲ — مدل اتلاف زمان و هزینه کاربران در وضعیت سنتی
 *
 * این یک «مدل پارامتری» است، نه گزارش آماری. همه مقادیر پیش‌فرض، پارامترهای
 * قابل تغییر کاربرند و در رابط کاربری با اسلایدر تنظیم می‌شوند؛ هیچ عددی به
 * عنوان آمار بازار ادعا نمی‌شود. فرمول‌ها صریح و قابل بازرسی‌اند تا ارزیاب
 * بتواند مفروضات را جداگانه نقد کند.
 */

export interface WasteParam {
  id: keyof WasteInputs;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** منبع این پیش‌فرض و میزان اطمینان آن */
  basis: string;
  side: 'buyer' | 'seller' | 'shared';
}

export interface WasteInputs {
  dealsPerMonth: number;
  suppliersContacted: number;
  minutesPerContact: number;
  followUpRounds: number;
  comparisonHours: number;
  negotiationHours: number;
  sampleShipments: number;
  sampleCost: number;
  marketTrips: number;
  tripHours: number;
  tripCost: number;
  hourlyCost: number;
  avgDealValue: number;
  mismatchRate: number;
  mismatchLossShare: number;
  idleStockValue: number;
  capitalCostRate: number;
  idleMonths: number;
}

export const WASTE_PARAMS: WasteParam[] = [
  {
    id: 'dealsPerMonth',
    label: 'تعداد معامله تأمین پارچه در ماه',
    unit: 'معامله',
    min: 1,
    max: 20,
    step: 1,
    default: 3,
    basis: 'پارامتر ورودی کاربر — به کسب‌وکار خودش بستگی دارد.',
    side: 'buyer',
  },
  {
    id: 'suppliersContacted',
    label: 'تعداد فروشنده‌ای که برای هر معامله استعلام می‌شود',
    unit: 'فروشنده',
    min: 1,
    max: 25,
    step: 1,
    default: 7,
    basis: 'فرض مدل‌سازی برگرفته از مرحله ۳ نقشه سفر — نیازمند اعتبارسنجی میدانی.',
    side: 'buyer',
  },
  {
    id: 'minutesPerContact',
    label: 'زمان هر تماس استعلام',
    unit: 'دقیقه',
    min: 3,
    max: 45,
    step: 1,
    default: 12,
    basis: 'فرض مدل‌سازی؛ شامل توضیح نیاز، پرسش مشخصات و یادداشت پاسخ.',
    side: 'buyer',
  },
  {
    id: 'followUpRounds',
    label: 'دفعات پیگیری مجدد هر فروشنده',
    unit: 'بار',
    min: 0,
    max: 6,
    step: 1,
    default: 2,
    basis: 'فرض مدل‌سازی؛ تماس بی‌پاسخ، ارسال عکس و پرسش تکمیلی.',
    side: 'buyer',
  },
  {
    id: 'comparisonHours',
    label: 'زمان ساختن جدول مقایسه برای هر معامله',
    unit: 'ساعت',
    min: 0,
    max: 8,
    step: 0.5,
    default: 2,
    basis: 'مرحله ۵ نقشه سفر (مقایسه دستی).',
    side: 'buyer',
  },
  {
    id: 'negotiationHours',
    label: 'زمان مذاکره و تأیید نهایی',
    unit: 'ساعت',
    min: 0,
    max: 10,
    step: 0.5,
    default: 3.5,
    basis: 'مجموع مراحل ۶ و ۷ نقشه سفر.',
    side: 'buyer',
  },
  {
    id: 'sampleShipments',
    label: 'تعداد نمونه‌ای که برای هر معامله جابه‌جا می‌شود',
    unit: 'نمونه',
    min: 0,
    max: 10,
    step: 1,
    default: 2,
    basis: 'فرض مدل‌سازی — مرحله ارزیابی حسی که ماهیت فیزیکی دارد.',
    side: 'buyer',
  },
  {
    id: 'sampleCost',
    label: 'هزینه ارسال هر نمونه',
    unit: 'تومان',
    min: 0,
    max: 500_000,
    step: 10_000,
    default: 90_000,
    basis: 'پارامتر ورودی کاربر (پیک یا باربری).',
    side: 'buyer',
  },
  {
    id: 'marketTrips',
    label: 'تعداد سفر به بازار یا انبار فروشنده',
    unit: 'سفر',
    min: 0,
    max: 8,
    step: 1,
    default: 1,
    basis: 'فرض مدل‌سازی؛ برای معاملات بزرگ‌تر اغلب ضروری است.',
    side: 'buyer',
  },
  {
    id: 'tripHours',
    label: 'زمان هر سفر (رفت، گشت، برگشت)',
    unit: 'ساعت',
    min: 0,
    max: 14,
    step: 0.5,
    default: 5,
    basis: 'پارامتر ورودی کاربر — به شهر و فاصله بستگی دارد.',
    side: 'buyer',
  },
  {
    id: 'tripCost',
    label: 'هزینه مستقیم هر سفر',
    unit: 'تومان',
    min: 0,
    max: 3_000_000,
    step: 50_000,
    default: 350_000,
    basis: 'پارامتر ورودی کاربر (حمل، سوخت، پارکینگ، صرف وقت همراه).',
    side: 'buyer',
  },
  {
    id: 'hourlyCost',
    label: 'هزینه هر ساعت کار نیروی تأمین/مدیر خرید',
    unit: 'تومان بر ساعت',
    min: 50_000,
    max: 1_500_000,
    step: 25_000,
    default: 250_000,
    basis: 'پارامتر ورودی کاربر؛ معادل هزینه فرصت زمان مدیر یا کارشناس خرید.',
    side: 'shared',
  },
  {
    id: 'avgDealValue',
    label: 'ارزش متوسط هر معامله',
    unit: 'تومان',
    min: 5_000_000,
    max: 2_000_000_000,
    step: 5_000_000,
    default: 120_000_000,
    basis: 'پارامتر ورودی کاربر.',
    side: 'shared',
  },
  {
    id: 'mismatchRate',
    label: 'نرخ معاملاتی که کالا با انتظار نمی‌خواند',
    unit: 'درصد',
    min: 0,
    max: 50,
    step: 1,
    default: 12,
    basis: 'فرض مدل‌سازی (ریسک عدم تطابق) — مهم‌ترین عددی که باید اعتبارسنجی شود.',
    side: 'buyer',
  },
  {
    id: 'mismatchLossShare',
    label: 'سهم زیان در صورت عدم تطابق',
    unit: 'درصد ارزش معامله',
    min: 0,
    max: 60,
    step: 1,
    default: 15,
    basis: 'فرض مدل‌سازی؛ شامل دوباره‌کاری، تأخیر تولید یا فروش با زیان.',
    side: 'buyer',
  },
  {
    id: 'idleStockValue',
    label: 'ارزش موجودی مازاد راکد فروشنده',
    unit: 'تومان',
    min: 0,
    max: 20_000_000_000,
    step: 100_000_000,
    default: 1_500_000_000,
    basis: 'پارامتر ورودی کاربر (سمت فروشنده).',
    side: 'seller',
  },
  {
    id: 'capitalCostRate',
    label: 'نرخ هزینه سالانه سرمایه در گردش',
    unit: 'درصد در سال',
    min: 0,
    max: 60,
    step: 1,
    default: 24,
    basis: 'پارامتر ورودی کاربر؛ هزینه فرصت قفل شدن سرمایه.',
    side: 'seller',
  },
  {
    id: 'idleMonths',
    label: 'مدت راکد ماندن موجودی',
    unit: 'ماه',
    min: 1,
    max: 36,
    step: 1,
    default: 8,
    basis: 'پارامتر ورودی کاربر.',
    side: 'seller',
  },
];

export const DEFAULT_WASTE_INPUTS: WasteInputs = WASTE_PARAMS.reduce((acc, p) => {
  acc[p.id] = p.default;
  return acc;
}, {} as WasteInputs);

/**
 * فرض بهبود تارنو برای هر جزء هزینه.
 * این ضرایب «هدف طراحی» هستند، نه نتیجه اندازه‌گیری؛ در رابط کاربری با همین
 * برچسب نمایش داده می‌شوند و کاربر می‌تواند آن‌ها را رد کند.
 */
export const TARNO_REDUCTION = {
  search: 0.7,        // جستجو: فیلتر متمرکز جای گشتن چندکاناله
  contact: 0.6,       // تماس: فقط با گزینه‌های واجد شرایط
  followUp: 0.65,     // پیگیری: اطلاعات فنی از قبل در آگهی است
  comparison: 0.75,   // مقایسه: داده ساختاریافته و قابل فیلتر
  negotiation: 0.3,   // مذاکره: کمتر کاهش می‌یابد؛ چانه‌زنی باقی می‌ماند
  sample: 0.35,       // نمونه: تصویر و مشخصات، تعداد نمونه را کم می‌کند نه حذف
  trip: 0.4,          // سفر: بخشی از سفرهای اکتشافی حذف می‌شود
  mismatch: 0.45,     // عدم تطابق: شفافیت کیفی ریسک را کم می‌کند نه صفر
  idleTime: 0.3,      // مدت راکد ماندن: کوتاه‌تر شدن مسیر رسیدن به خریدار
} as const;

export interface WasteBreakdownItem {
  id: string;
  label: string
  hours: number;
  money: number;
  kind: 'search' | 'communication' | 'verification' | 'decision' | 'logistics' | 'risk';
  /** مقدار پس از اعمال فرض بهبود تارنو */
  hoursWithTarno: number;
  moneyWithTarno: number;
}

export interface WasteResult {
  perDeal: WasteBreakdownItem[];
  totals: {
    hoursPerDeal: number;
    hoursPerDealTarno: number;
    moneyPerDeal: number;
    moneyPerDealTarno: number;
    hoursPerYear: number;
    hoursPerYearTarno: number;
    moneyPerYear: number;
    moneyPerYearTarno: number;
  };
  seller: {
    capitalCost: number;
    capitalCostTarno: number;
    monthsSaved: number;
  };
}

/** محاسبه مدل اتلاف — تابعی خالص و قابل آزمون. */
export const computeWaste = (i: WasteInputs): WasteResult => {
  const h = (minutes: number) => minutes / 60;

  // ساعت‌های صرف‌شده برای هر معامله، به تفکیک نوع فعالیت
  const searchHours = h(i.suppliersContacted * 4); // زمان یافتن و فهرست کردن هر گزینه
  const contactHours = h(i.suppliersContacted * i.minutesPerContact);
  const followUpHours = h(i.suppliersContacted * i.followUpRounds * 6);
  const comparisonHours = i.comparisonHours;
  const negotiationHours = i.negotiationHours;
  const tripHours = i.marketTrips * i.tripHours;

  const money = (hours: number) => hours * i.hourlyCost;

  const sampleMoney = i.sampleShipments * i.sampleCost;
  const tripMoney = i.marketTrips * i.tripCost;
  const mismatchMoney = (i.mismatchRate / 100) * (i.mismatchLossShare / 100) * i.avgDealValue;

  const r = TARNO_REDUCTION;

  const perDeal: WasteBreakdownItem[] = [
    {
      id: 'w_search',
      label: 'جستجو و فهرست‌سازی تأمین‌کننده',
      hours: searchHours,
      money: money(searchHours),
      kind: 'search',
      hoursWithTarno: searchHours * (1 - r.search),
      moneyWithTarno: money(searchHours * (1 - r.search)),
    },
    {
      id: 'w_contact',
      label: 'تماس و استعلام اولیه',
      hours: contactHours,
      money: money(contactHours),
      kind: 'communication',
      hoursWithTarno: contactHours * (1 - r.contact),
      moneyWithTarno: money(contactHours * (1 - r.contact)),
    },
    {
      id: 'w_followup',
      label: 'پیگیری و دریافت اطلاعات فنی',
      hours: followUpHours,
      money: money(followUpHours),
      kind: 'verification',
      hoursWithTarno: followUpHours * (1 - r.followUp),
      moneyWithTarno: money(followUpHours * (1 - r.followUp)),
    },
    {
      id: 'w_compare',
      label: 'مقایسه دستی گزینه‌ها',
      hours: comparisonHours,
      money: money(comparisonHours),
      kind: 'decision',
      hoursWithTarno: comparisonHours * (1 - r.comparison),
      moneyWithTarno: money(comparisonHours * (1 - r.comparison)),
    },
    {
      id: 'w_negotiate',
      label: 'مذاکره و تأیید نهایی',
      hours: negotiationHours,
      money: money(negotiationHours),
      kind: 'communication',
      hoursWithTarno: negotiationHours * (1 - r.negotiation),
      moneyWithTarno: money(negotiationHours * (1 - r.negotiation)),
    },
    {
      id: 'w_sample',
      label: 'جابه‌جایی نمونه فیزیکی',
      hours: 0,
      money: sampleMoney,
      kind: 'logistics',
      hoursWithTarno: 0,
      moneyWithTarno: sampleMoney * (1 - r.sample),
    },
    {
      id: 'w_trip',
      label: 'سفر به بازار یا انبار',
      hours: tripHours,
      money: money(tripHours) + tripMoney,
      kind: 'logistics',
      hoursWithTarno: tripHours * (1 - r.trip),
      moneyWithTarno: money(tripHours * (1 - r.trip)) + tripMoney * (1 - r.trip),
    },
    {
      id: 'w_mismatch',
      label: 'زیان مورد انتظار عدم تطابق کالا',
      hours: 0,
      money: mismatchMoney,
      kind: 'risk',
      hoursWithTarno: 0,
      moneyWithTarno: mismatchMoney * (1 - r.mismatch),
    },
  ];

  const sum = (f: (x: WasteBreakdownItem) => number) => perDeal.reduce((a, b) => a + f(b), 0);

  const hoursPerDeal = sum((x) => x.hours);
  const hoursPerDealTarno = sum((x) => x.hoursWithTarno);
  const moneyPerDeal = sum((x) => x.money);
  const moneyPerDealTarno = sum((x) => x.moneyWithTarno);
  const yearly = i.dealsPerMonth * 12;

  // سمت فروشنده: هزینه فرصت قفل شدن سرمایه در موجودی راکد
  const capitalCost = i.idleStockValue * (i.capitalCostRate / 100) * (i.idleMonths / 12);
  const monthsTarno = i.idleMonths * (1 - TARNO_REDUCTION.idleTime);
  const capitalCostTarno = i.idleStockValue * (i.capitalCostRate / 100) * (monthsTarno / 12);

  return {
    perDeal,
    totals: {
      hoursPerDeal,
      hoursPerDealTarno,
      moneyPerDeal,
      moneyPerDealTarno,
      hoursPerYear: hoursPerDeal * yearly,
      hoursPerYearTarno: hoursPerDealTarno * yearly,
      moneyPerYear: moneyPerDeal * yearly,
      moneyPerYearTarno: moneyPerDealTarno * yearly,
    },
    seller: {
      capitalCost,
      capitalCostTarno,
      monthsSaved: i.idleMonths - monthsTarno,
    },
  };
};

export const WASTE_KIND_LABEL: Record<WasteBreakdownItem['kind'], string> = {
  search: 'جستجو',
  communication: 'ارتباط و مذاکره',
  verification: 'راستی‌آزمایی اطلاعات',
  decision: 'تصمیم‌گیری',
  logistics: 'جابه‌جایی فیزیکی',
  risk: 'ریسک و زیان',
};

export const WASTE_DISCLAIMER =
  'این نمودار یک مدل است، نه یک گزارش آماری. همه مقادیر ورودی را خودتان تغییر می‌دهید و خروجی بلافاصله بازمحاسبه می‌شود. ضریب‌های بهبود تارنو «هدف طراحی» هستند و تا اندازه‌گیری روی کاربران واقعی، اثبات‌شده تلقی نمی‌شوند. ارزش این مدل در نشان دادن «ساختار اتلاف» است: اینکه بیشترین زمان کجا می‌رود، نه اینکه دقیقاً چند ساعت.';
