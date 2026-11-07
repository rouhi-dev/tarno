/**
 * داده‌های پایه (Seed) — فاز ۱
 *
 * مشخصات فنی پارچه‌ها بر اساس بازه‌های متعارف صنعت نساجی انتخاب شده‌اند
 * (عرض ۹۰–۳۲۰ سانتی‌متر، گراماژ ۶۰–۵۰۰ گرم بر مترمربع، سایش مارتیندیل برای
 * پارچه مبلمان). این داده‌ها «ساختگی اما واقع‌نما» هستند و هدفشان امکان آزمون
 * سناریوهاست؛ هیچ کسب‌وکار واقعی در آن‌ها نام‌برده نشده است.
 */

import type {
  BusinessProfile,
  DatabaseShape,
  FabricCategory,
  FabricListing,
  ListingImage,
  User,
} from '../domain/types';
import { fabricSwatch, defectSwatch, type WeavePattern } from './swatch';
import { HYPOTHESES, SAMPLE_INTERVIEWS } from '../content/validation';

export const SCHEMA_VERSION = 1;

const iso = (daysAgo: number, hour = 10): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};

/* -------------------------------- دسته‌بندی -------------------------------- */

export const CATEGORIES: FabricCategory[] = [
  {
    id: 'cat_apparel',
    slug: 'apparel',
    title: 'پارچه پوشاک',
    description: 'پارچه مناسب تولید پوشاک زنانه، مردانه و بچگانه؛ از کرپ و ویسکوز تا کتان و جین.',
    unit: 'meter',
    requiredSpecs: ['fiber', 'width', 'gsm', 'color', 'application'],
    optionalSpecs: ['pattern', 'finish', 'rollLength'],
  },
  {
    id: 'cat_upholstery',
    slug: 'upholstery',
    title: 'پارچه مبلمان',
    description: 'پارچه رویه مبل، صندلی و کالای خواب با الزام مقاومت سایش.',
    unit: 'meter',
    requiredSpecs: ['fiber', 'width', 'gsm', 'color', 'rubCycles'],
    optionalSpecs: ['pattern', 'finish', 'fireRetardant', 'rollLength'],
  },
  {
    id: 'cat_curtain',
    slug: 'curtain',
    title: 'پارچه پرده‌ای',
    description: 'پارچه پرده و والان؛ از تور و وال سبک تا مخمل و بلک‌اوت.',
    unit: 'meter',
    requiredSpecs: ['fiber', 'width', 'color', 'application'],
    optionalSpecs: ['gsm', 'pattern', 'finish', 'fireRetardant', 'rollLength'],
  },
  {
    id: 'cat_decor',
    slug: 'decor',
    title: 'پارچه تزئینی و رومیزی',
    description: 'پارچه رومیزی، کوسن، دیوارپوش پارچه‌ای و مصنوعات دکوراتیو.',
    unit: 'meter',
    requiredSpecs: ['fiber', 'width', 'color'],
    optionalSpecs: ['gsm', 'pattern', 'finish', 'rollLength'],
  },
  {
    id: 'cat_industrial',
    slug: 'industrial',
    title: 'پارچه صنعتی و فنی',
    description: 'پارچه پوشش، چادری، فیلتر، آستری صنعتی و منسوجات فنی.',
    unit: 'kilogram',
    requiredSpecs: ['fiber', 'width', 'gsm', 'application'],
    optionalSpecs: ['finish', 'fireRetardant', 'color'],
  },
  {
    id: 'cat_lining',
    slug: 'lining',
    title: 'آستری و لایی',
    description: 'آستری ساتن و حریر، لایی چسب‌دار و نچسب برای صنعت پوشاک.',
    unit: 'meter',
    requiredSpecs: ['fiber', 'width', 'color'],
    optionalSpecs: ['gsm', 'finish', 'rollLength'],
  },
];

/* ---------------------------------- کاربران -------------------------------- */

export const USERS: User[] = [
  {
    id: 'usr_seller_1',
    role: 'seller',
    fullName: 'مهدی رستگار',
    email: 'seller@tarno.ir',
    password: 'tarno1234',
    phone: '۰۹۱۳۱۲۳۴۵۶۷',
    businessProfileId: 'bp_1',
    createdAt: iso(120),
  },
  {
    id: 'usr_seller_2',
    role: 'seller',
    fullName: 'سمیرا کریمی',
    email: 'seller2@tarno.ir',
    password: 'tarno1234',
    phone: '۰۹۱۲۲۲۲۳۳۴۴',
    businessProfileId: 'bp_2',
    createdAt: iso(95),
  },
  {
    id: 'usr_buyer_1',
    role: 'buyer',
    fullName: 'علی موسوی',
    email: 'buyer@tarno.ir',
    password: 'tarno1234',
    phone: '۰۹۱۲۳۴۵۶۷۸۹',
    businessProfileId: 'bp_3',
    createdAt: iso(80),
  },
  {
    id: 'usr_buyer_2',
    role: 'buyer',
    fullName: 'نگار حیدری',
    email: 'buyer2@tarno.ir',
    password: 'tarno1234',
    phone: '۰۹۳۵۱۱۱۲۲۳۳',
    businessProfileId: 'bp_4',
    createdAt: iso(60),
  },
  {
    id: 'usr_admin',
    role: 'admin',
    fullName: 'ناظر سامانه تارنو',
    email: 'admin@tarno.ir',
    password: 'tarno1234',
    phone: '۰۲۱۳۳۳۳۴۴۵۵',
    businessProfileId: null,
    createdAt: iso(150),
  },
];

export const PROFILES: BusinessProfile[] = [
  {
    id: 'bp_1',
    ownerUserId: 'usr_seller_1',
    businessName: 'نساجی رستگار (واحد بافندگی و تکمیل)',
    businessType: 'کارخانه نساجی',
    province: 'یزد',
    city: 'یزد',
    registrationNo: '۱۱۷۴۵۲',
    verified: true,
    createdAt: iso(120),
  },
  {
    id: 'bp_2',
    ownerUserId: 'usr_seller_2',
    businessName: 'پارچه‌سرای کریمی',
    businessType: 'عمده‌فروش و واردکننده',
    province: 'تهران',
    city: 'تهران',
    registrationNo: '۲۰۹۸۳۱',
    verified: true,
    createdAt: iso(95),
  },
  {
    id: 'bp_3',
    ownerUserId: 'usr_buyer_1',
    businessName: 'تولیدی پوشاک آوین',
    businessType: 'کارگاه تولید پوشاک',
    province: 'تهران',
    city: 'تهران',
    registrationNo: '۳۳۴۵۱۲',
    verified: true,
    createdAt: iso(80),
  },
  {
    id: 'bp_4',
    ownerUserId: 'usr_buyer_2',
    businessName: 'مبلمان و کالای خواب نگار',
    businessType: 'تولیدکننده مبلمان',
    province: 'اصفهان',
    city: 'اصفهان',
    registrationNo: '۴۵۱۲۰۹',
    verified: false,
    createdAt: iso(60),
  },
];

/* ---------------------------------- آگهی‌ها -------------------------------- */

interface SeedListing {
  id: string;
  code: string;
  seller: string;
  cat: string;
  title: string;
  description: string;
  specs: FabricListing['specs'];
  total: number;
  reserved: number;
  sold: number;
  moq: number;
  price: number;
  grade: FabricListing['qualityGrade'];
  defects: string;
  province: string;
  city: string;
  status: FabricListing['status'];
  negotiable: boolean;
  days: number;
  swatch: [string, string, WeavePattern];
  defectImage?: 'stain' | 'shade' | 'snag';
}

const SEED_LISTINGS: SeedListing[] = [
  {
    id: 'lst_1',
    code: 'TRN-1001',
    seller: 'usr_seller_1',
    cat: 'cat_apparel',
    title: 'کرپ ویسکوز نیلی — باقی‌مانده سفارش تولید',
    description:
      'باقی‌مانده سفارش تولید مانتو بهاره؛ یک شید رنگ، بافت یکنواخت و بدون ایراد اعلام‌شده. در ۹ طاقه ۳۰ تا ۴۵ متری موجود است و تحویل از انبار یزد انجام می‌شود.',
    specs: {
      fiber: '۱۰۰٪ ویسکوز',
      width: 150,
      gsm: 135,
      color: 'نیلی تیره',
      pattern: 'ساده',
      finish: 'سافت‌فینیش',
      application: 'مانتو و پیراهن زنانه',
      rollLength: 38,
    },
    total: 3200,
    reserved: 0,
    sold: 420,
    moq: 100,
    price: 148000,
    grade: 'A',
    defects: '',
    province: 'یزد',
    city: 'یزد',
    status: 'active',
    negotiable: true,
    days: 18,
    swatch: ['#2c3b63', '#1b2745', 'plain'],
  },
  {
    id: 'lst_2',
    code: 'TRN-1002',
    seller: 'usr_seller_1',
    cat: 'cat_upholstery',
    title: 'مخمل مبلی ضد لک — توقف تولید طرح',
    description:
      'پارچه رویه مبل با مقاومت سایش ۴۵٬۰۰۰ چرخه مارتیندیل. تولید این طرح متوقف شده و کل موجودی انبار یک‌جا یا به صورت بخشی عرضه می‌شود. گواهی سایش آزمایشگاه همراه کالا تحویل داده می‌شود.',
    specs: {
      fiber: '۱۰۰٪ پلی‌استر',
      width: 140,
      gsm: 340,
      color: 'خاکی روشن',
      pattern: 'ساده',
      finish: 'ضد لک (Easy Clean)',
      rubCycles: 45000,
      fireRetardant: false,
      rollLength: 50,
    },
    total: 1800,
    reserved: 150,
    sold: 300,
    moq: 50,
    price: 395000,
    grade: 'A',
    defects: '',
    province: 'یزد',
    city: 'یزد',
    status: 'active',
    negotiable: false,
    days: 12,
    swatch: ['#b9a88c', '#8d7a5e', 'dobby'],
  },
  {
    id: 'lst_3',
    code: 'TRN-1003',
    seller: 'usr_seller_2',
    cat: 'cat_apparel',
    title: 'جین کشی ۱۰ اونس — اختلاف شید در دو طاقه',
    description:
      'پارچه جین کشی وارداتی، باقی‌مانده یک محموله. دو طاقه از مجموع ۶ طاقه نسبت به بقیه نیم شید روشن‌تر است؛ تصویر مقایسه شید در گالری پیوست شده و قیمت با لحاظ همین موضوع تعیین شده است.',
    specs: {
      fiber: '۹۸٪ پنبه، ۲٪ الاستان',
      width: 148,
      gsm: 330,
      color: 'آبی تیره (ایندیگو)',
      pattern: 'ساده',
      finish: 'شسته (Rinse Wash)',
      application: 'شلوار جین و سرهمی',
      rollLength: 42,
    },
    total: 1450,
    reserved: 0,
    sold: 0,
    moq: 150,
    price: 262000,
    grade: 'B',
    defects:
      'اختلاف نیم شید رنگ در ۲ طاقه (حدود ۴۸۰ متر)؛ بافت و کشش سالم است و ایراد دیگری گزارش نشده.',
    province: 'تهران',
    city: 'تهران',
    status: 'active',
    negotiable: true,
    days: 9,
    swatch: ['#2a3a55', '#16233a', 'twill'],
    defectImage: 'shade',
  },
  {
    id: 'lst_4',
    code: 'TRN-1004',
    seller: 'usr_seller_2',
    cat: 'cat_curtain',
    title: 'وال پرده‌ای عرض ۳۰۰ — ته‌طاقه انبار',
    description:
      'ته‌طاقه‌های وال پرده‌ای عرض ۳۰۰ سانتی‌متر در متراژهای ۱۲ تا ۲۵ متر. مناسب پروژه‌های کوچک، نمونه‌سازی و دوخت والان. متراژ هر طاقه در زمان بارگیری اعلام می‌شود.',
    specs: {
      fiber: '۱۰۰٪ پلی‌استر',
      width: 300,
      gsm: 70,
      color: 'شکسته (Off-White)',
      pattern: 'ساده',
      application: 'پرده حریر و والان',
      rollLength: 18,
    },
    total: 760,
    reserved: 0,
    sold: 160,
    moq: 30,
    price: 96000,
    grade: 'B',
    defects: 'متراژ طاقه‌ها نامنظم است (۱۲ تا ۲۵ متر) و امکان انتخاب طاقه خاص وجود ندارد.',
    province: 'تهران',
    city: 'تهران',
    status: 'active',
    negotiable: true,
    days: 25,
    swatch: ['#efeae0', '#d8d0c2', 'rib'],
  },
  {
    id: 'lst_5',
    code: 'TRN-1005',
    seller: 'usr_seller_1',
    cat: 'cat_lining',
    title: 'آستری ساتن ۷۵ دنیر — مازاد خرید',
    description:
      'خرید بیش از نیاز خط تولید؛ آستری ساتن در سه رنگ مشکی، سرمه‌ای و شیری. هر رنگ به صورت جداگانه قابل خریداری است و حداقل سفارش روی هر رنگ اعمال می‌شود.',
    specs: {
      fiber: '۱۰۰٪ پلی‌استر (۷۵D)',
      width: 150,
      gsm: 68,
      color: 'مشکی / سرمه‌ای / شیری',
      finish: 'آنتی‌استاتیک',
      rollLength: 100,
    },
    total: 5400,
    reserved: 0,
    sold: 1200,
    moq: 200,
    price: 54000,
    grade: 'A',
    defects: '',
    province: 'یزد',
    city: 'یزد',
    status: 'active',
    negotiable: false,
    days: 30,
    swatch: ['#1d2026', '#2f343d', 'flat'],
  },
  {
    id: 'lst_6',
    code: 'TRN-1006',
    seller: 'usr_seller_2',
    cat: 'cat_industrial',
    title: 'پارچه چادری پوشش — موجودی راکد انبار',
    description:
      'پارچه پوشش ضد آب برای چادر، سایبان و کاور. موجودی راکد سه سال گذشته انبار که به صورت کیلویی عرضه می‌شود. آزمون نفوذ آب روی نمونه انجام شده و نتیجه آن قابل ارائه است.',
    specs: {
      fiber: 'پلی‌استر با پوشش PVC',
      width: 200,
      gsm: 480,
      color: 'سبز زیتونی',
      finish: 'ضد آب',
      application: 'چادر، سایبان و کاور صنعتی',
      fireRetardant: true,
    },
    total: 2600,
    reserved: 0,
    sold: 0,
    moq: 100,
    price: 118000,
    grade: 'C',
    defects:
      'انبارش طولانی‌مدت؛ در لبه بیرونی چند طاقه آثار گرد و غبار و کمی سختی دست وجود دارد. پوشش PVC در دو طاقه ترک‌های سطحی ریز دارد.',
    province: 'تهران',
    city: 'شهریار',
    status: 'active',
    negotiable: true,
    days: 40,
    swatch: ['#5c6b4a', '#44502f', 'plain'],
    defectImage: 'stain',
  },
  {
    id: 'lst_7',
    code: 'TRN-1007',
    seller: 'usr_seller_1',
    cat: 'cat_decor',
    title: 'گوبلن رومیزی طرح سنتی — تغییر کالکشن',
    description:
      'پارچه گوبلن با طرح سنتی که از کالکشن سال جاری حذف شده است. مناسب رومیزی، کوسن و دیوارکوب. طرح تکرارشو با رپورت ۳۲ سانتی‌متر.',
    specs: {
      fiber: '۶۰٪ پنبه، ۴۰٪ پلی‌استر',
      width: 160,
      gsm: 290,
      color: 'کرم / لاکی',
      pattern: 'گوبلن سنتی (رپورت ۳۲ سانتی‌متر)',
      finish: 'بدون تکمیل اضافه',
      rollLength: 30,
    },
    total: 980,
    reserved: 0,
    sold: 310,
    moq: 40,
    price: 215000,
    grade: 'A',
    defects: '',
    province: 'یزد',
    city: 'مهریز',
    status: 'active',
    negotiable: true,
    days: 22,
    swatch: ['#e3d6bd', '#a8402f', 'stripe'],
  },
  {
    id: 'lst_8',
    code: 'TRN-1008',
    seller: 'usr_seller_2',
    cat: 'cat_apparel',
    title: 'فلانل پشمی ملانژ — باقی‌مانده کالکشن پاییز',
    description:
      'فلانل پشمی ملانژ مناسب پالتو و کت. باقی‌مانده کالکشن پاییز سال گذشته با متراژ محدود. تحویل از انبار تهران یا ارسال با باربری انتخابی خریدار.',
    specs: {
      fiber: '۷۰٪ پشم، ۳۰٪ پلی‌استر',
      width: 150,
      gsm: 420,
      color: 'طوسی ملانژ',
      pattern: 'ملانژ',
      finish: 'شرینک‌فری',
      application: 'پالتو، کت و دامن',
      rollLength: 35,
    },
    total: 620,
    reserved: 0,
    sold: 0,
    moq: 60,
    price: 486000,
    grade: 'A',
    defects: '',
    province: 'تهران',
    city: 'تهران',
    status: 'active',
    negotiable: false,
    days: 6,
    swatch: ['#8d9196', '#5f646b', 'melange'],
  },
  {
    id: 'lst_9',
    code: 'TRN-1009',
    seller: 'usr_seller_1',
    cat: 'cat_upholstery',
    title: 'پارچه صندلی ضد شعله — مازاد پروژه اداری',
    description:
      'مازاد یک پروژه مبلمان اداری؛ پارچه رویه صندلی با گواهی ضد شعله و سایش ۸۰٬۰۰۰ چرخه. حداقل سفارش بالاست چون پارچه در طاقه‌های ۶۰ متری بسته‌بندی شده است.',
    specs: {
      fiber: '۹۵٪ پلی‌استر، ۵٪ نایلون',
      width: 145,
      gsm: 380,
      color: 'آبی نفتی',
      pattern: 'ساده',
      finish: 'ضد شعله',
      rubCycles: 80000,
      fireRetardant: true,
      rollLength: 60,
    },
    total: 1200,
    reserved: 0,
    sold: 0,
    moq: 120,
    price: 452000,
    grade: 'A',
    defects: '',
    province: 'یزد',
    city: 'یزد',
    status: 'pending',
    negotiable: true,
    days: 2,
    swatch: ['#1f4a58', '#143541', 'rib'],
  },
  {
    id: 'lst_10',
    code: 'TRN-1010',
    seller: 'usr_seller_2',
    cat: 'cat_curtain',
    title: 'مخمل پرده‌ای زرشکی — دو طاقه با ایراد تاب',
    description:
      'مخمل پرده‌ای با رنگ زرشکی؛ دو طاقه دارای تاب‌خوردگی لبه است. برای پرده‌های کوتاه و والان قابل استفاده است و قیمت به همین دلیل پایین‌تر از نرخ بازار تعیین شده.',
    specs: {
      fiber: '۱۰۰٪ پلی‌استر',
      width: 280,
      gsm: 260,
      color: 'زرشکی',
      pattern: 'ساده',
      application: 'پرده و والان',
      fireRetardant: false,
      rollLength: 28,
    },
    total: 540,
    reserved: 0,
    sold: 0,
    moq: 30,
    price: 176000,
    grade: 'C',
    defects:
      'تاب‌خوردگی لبه در دو طاقه (حدود ۲۰۰ متر) که تا ۴ سانتی‌متر از کناره را غیرقابل استفاده می‌کند.',
    province: 'تهران',
    city: 'تهران',
    status: 'active',
    negotiable: true,
    days: 15,
    swatch: ['#7a2230', '#51151f', 'plain'],
    defectImage: 'snag',
  },
];

const buildListings = (): { listings: FabricListing[]; images: ListingImage[] } => {
  const listings: FabricListing[] = [];
  const images: ListingImage[] = [];

  for (const s of SEED_LISTINGS) {
    listings.push({
      id: s.id,
      code: s.code,
      sellerId: s.seller,
      categoryId: s.cat,
      title: s.title,
      description: s.description,
      specs: s.specs,
      unit: CATEGORIES.find((c) => c.id === s.cat)!.unit,
      totalQuantity: s.total,
      availableQuantity: s.total - s.reserved - s.sold,
      reservedQuantity: s.reserved,
      soldQuantity: s.sold,
      minOrderQuantity: s.moq,
      pricePerUnit: s.price,
      negotiable: s.negotiable,
      qualityGrade: s.grade,
      defects: s.defects,
      province: s.province,
      city: s.city,
      status: s.status,
      moderationNote: s.status === 'pending' ? null : 'تأییدشده در بازبینی اولیه',
      createdAt: iso(s.days),
      updatedAt: iso(Math.max(0, s.days - 2)),
    });

    images.push({
      id: `${s.id}_img1`,
      listingId: s.id,
      src: fabricSwatch(s.swatch[0], s.swatch[1], s.swatch[2]),
      caption: 'نمونه بافت و شید رنگ',
      isDefectEvidence: false,
      order: 0,
    });
    images.push({
      id: `${s.id}_img2`,
      listingId: s.id,
      src: fabricSwatch(s.swatch[1], s.swatch[0], s.swatch[2]),
      caption: 'نمای نزدیک بافت',
      isDefectEvidence: false,
      order: 1,
    });
    if (s.defectImage) {
      images.push({
        id: `${s.id}_img3`,
        listingId: s.id,
        src: defectSwatch(s.swatch[0], s.swatch[1], s.defectImage),
        caption: 'مستندسازی ایراد اعلام‌شده',
        isDefectEvidence: true,
        order: 2,
      });
    }
  }

  return { listings, images };
};

/* ------------------------------ وضعیت اولیه کل ----------------------------- */

export const buildSeedDatabase = (): DatabaseShape => {
  const { listings, images } = buildListings();

  // دفتر تراکنش موجودی اولیه برای هر آگهی تا ناوردا از ابتدا قابل حسابرسی باشد.
  const inventoryTransactions = listings.map((l, idx) => ({
    id: `itx_seed_${idx}`,
    listingId: l.id,
    kind: 'initial' as const,
    quantity: l.totalQuantity,
    snapshot: {
      total: l.totalQuantity,
      available: l.availableQuantity,
      reserved: l.reservedQuantity,
      sold: l.soldQuantity,
    },
    refType: 'listing' as const,
    refId: l.id,
    actorId: l.sellerId,
    note: 'بارگذاری داده پایه — وضعیت موجودی ابتدای ارزیابی',
    createdAt: l.createdAt,
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    users: USERS,
    businessProfiles: PROFILES,
    categories: CATEGORIES,
    listings,
    listingImages: images,
    purchaseRequests: [
      {
        id: 'req_seed_1',
        code: 'REQ-10201',
        listingId: 'lst_2',
        buyerId: 'usr_buyer_2',
        sellerId: 'usr_seller_1',
        quantity: 150,
        quotedUnitPrice: 395000,
        message:
          'برای پروژه مبلمان اداری نیاز به ۱۵۰ متر داریم. امکان ارسال نمونه ۳۰ سانتی‌متری قبل از خرید وجود دارد؟',
        status: 'pending',
        rejectionReason: null,
        priceOfferId: null,
        orderId: null,
        createdAt: iso(3, 11),
        updatedAt: iso(3, 11),
      },
      {
        id: 'req_seed_2',
        code: 'REQ-10202',
        listingId: 'lst_1',
        buyerId: 'usr_buyer_1',
        sellerId: 'usr_seller_1',
        quantity: 300,
        quotedUnitPrice: 148000,
        message: 'اگر ۳۰۰ متر یک‌جا برداریم، تخفیف حجمی لحاظ می‌شود؟',
        status: 'pending',
        rejectionReason: null,
        priceOfferId: null,
        orderId: null,
        createdAt: iso(1, 16),
        updatedAt: iso(1, 16),
      },
    ],
    priceOffers: [],
    orders: [],
    payments: [],
    inventoryTransactions,
    orderHistory: [],
    interviews: SAMPLE_INTERVIEWS,
    session: { userId: null },
  };
};

export const HYPOTHESIS_LIST = HYPOTHESES;
