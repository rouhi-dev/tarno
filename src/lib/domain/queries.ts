/** توابع پرس‌وجو و فیلتر — خالص، بدون وابستگی به UI. */

import type { DatabaseShape, FabricListing, ID, QualityGrade } from './types';

export interface ListingFilter {
  text: string;
  categoryId: string | 'all';
  grades: QualityGrade[];
  province: string | 'all';
  minPrice: number | null;
  maxPrice: number | null;
  minAvailable: number | null;
  minWidth: number | null;
  maxGsm: number | null;
  onlyNegotiable: boolean;
  /** فقط آگهی‌هایی که ایراد اعلام‌شده ندارند */
  onlyFlawless: boolean;
}

export const EMPTY_FILTER: ListingFilter = {
  text: '',
  categoryId: 'all',
  grades: [],
  province: 'all',
  minPrice: null,
  maxPrice: null,
  minAvailable: null,
  minWidth: null,
  maxGsm: null,
  onlyNegotiable: false,
  onlyFlawless: false,
};

export type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'available-desc';

export const SORT_LABEL: Record<SortKey, string> = {
  newest: 'تازه‌ترین',
  'price-asc': 'ارزان‌ترین',
  'price-desc': 'گران‌ترین',
  'available-desc': 'بیشترین موجودی',
};

const matchesText = (l: FabricListing, q: string): boolean => {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  const haystack = [
    l.title,
    l.description,
    l.code,
    l.city,
    l.province,
    l.specs.fiber ?? '',
    l.specs.color ?? '',
    l.specs.pattern ?? '',
    l.specs.application ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
};

/** فیلتر چندمعیاره — بازه قیمت معکوس به صورت خودکار اصلاح می‌شود. */
export const filterListings = (
  listings: FabricListing[],
  filter: ListingFilter,
  sort: SortKey,
): FabricListing[] => {
  let min = filter.minPrice;
  let max = filter.maxPrice;
  if (min !== null && max !== null && min > max) [min, max] = [max, min];

  const out = listings.filter((l) => {
    if (l.status !== 'active' && l.status !== 'sold_out') return false;
    if (!matchesText(l, filter.text)) return false;
    if (filter.categoryId !== 'all' && l.categoryId !== filter.categoryId) return false;
    if (filter.grades.length && !filter.grades.includes(l.qualityGrade)) return false;
    if (filter.province !== 'all' && l.province !== filter.province) return false;
    if (min !== null && l.pricePerUnit < min) return false;
    if (max !== null && l.pricePerUnit > max) return false;
    if (filter.minAvailable !== null && l.availableQuantity < filter.minAvailable) return false;
    if (filter.minWidth !== null && (l.specs.width ?? 0) < filter.minWidth) return false;
    if (filter.maxGsm !== null && (l.specs.gsm ?? 0) > filter.maxGsm) return false;
    if (filter.onlyNegotiable && !l.negotiable) return false;
    if (filter.onlyFlawless && l.defects.trim() !== '') return false;
    return true;
  });

  const sorted = [...out];
  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
      break;
    case 'available-desc':
      sorted.sort((a, b) => b.availableQuantity - a.availableQuantity);
      break;
    default:
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  return sorted;
};

/** تعداد فیلترهای فعال — برای نمایش برچسب‌های قابل حذف. */
export const activeFilterCount = (f: ListingFilter): number => {
  let n = 0;
  if (f.text.trim()) n += 1;
  if (f.categoryId !== 'all') n += 1;
  if (f.grades.length) n += 1;
  if (f.province !== 'all') n += 1;
  if (f.minPrice !== null) n += 1;
  if (f.maxPrice !== null) n += 1;
  if (f.minAvailable !== null) n += 1;
  if (f.minWidth !== null) n += 1;
  if (f.maxGsm !== null) n += 1;
  if (f.onlyNegotiable) n += 1;
  if (f.onlyFlawless) n += 1;
  return n;
};

/* ----------------------------- پرس‌وجوهای کمکی ----------------------------- */

export const listingsOfSeller = (db: DatabaseShape, sellerId: ID): FabricListing[] =>
  db.listings.filter((l) => l.sellerId === sellerId);

export const requestsForSeller = (db: DatabaseShape, sellerId: ID) =>
  db.purchaseRequests.filter((r) => r.sellerId === sellerId);

export const requestsOfBuyer = (db: DatabaseShape, buyerId: ID) =>
  db.purchaseRequests.filter((r) => r.buyerId === buyerId);

export const ordersOfBuyer = (db: DatabaseShape, buyerId: ID) =>
  db.orders.filter((o) => o.buyerId === buyerId);

export const ordersOfSeller = (db: DatabaseShape, sellerId: ID) =>
  db.orders.filter((o) => o.sellerId === sellerId);

export const imagesOfListing = (db: DatabaseShape, listingId: ID) =>
  db.listingImages.filter((i) => i.listingId === listingId).sort((a, b) => a.order - b.order);

export const txOfListing = (db: DatabaseShape, listingId: ID) =>
  db.inventoryTransactions.filter((t) => t.listingId === listingId);

export const userById = (db: DatabaseShape, id: ID | null) =>
  id ? db.users.find((u) => u.id === id) ?? null : null;

export const profileOfUser = (db: DatabaseShape, userId: ID) =>
  db.businessProfiles.find((p) => p.ownerUserId === userId) ?? null;

export const categoryById = (db: DatabaseShape, id: ID) =>
  db.categories.find((c) => c.id === id) ?? null;

export const listingById = (db: DatabaseShape, id: ID) =>
  db.listings.find((l) => l.id === id) ?? null;

/** آمار سبد موجودی فروشنده */
export const sellerInventoryStats = (db: DatabaseShape, sellerId: ID) => {
  const mine = listingsOfSeller(db, sellerId);
  const sum = (f: (l: FabricListing) => number) => mine.reduce((a, l) => a + f(l), 0);
  return {
    listingCount: mine.length,
    activeCount: mine.filter((l) => l.status === 'active').length,
    total: sum((l) => l.totalQuantity),
    available: sum((l) => l.availableQuantity),
    reserved: sum((l) => l.reservedQuantity),
    sold: sum((l) => l.soldQuantity),
    soldValue: db.orders
      .filter((o) => o.sellerId === sellerId && o.status === 'paid')
      .reduce((a, o) => a + o.totalAmount, 0),
    openRequests: requestsForSeller(db, sellerId).filter((r) => r.status === 'pending').length,
  };
};

/** بررسی ناوردای موجودی برای همه آگهی‌ها — برای پنل سلامت داده */
export const auditInventory = (db: DatabaseShape) =>
  db.listings.map((l) => {
    const sum = l.availableQuantity + l.reservedQuantity + l.soldQuantity;
    return {
      listingId: l.id,
      code: l.code,
      total: l.totalQuantity,
      sum,
      ok: Math.abs(sum - l.totalQuantity) < 1e-6 &&
        l.availableQuantity >= 0 &&
        l.reservedQuantity >= 0 &&
        l.soldQuantity >= 0,
    };
  });
