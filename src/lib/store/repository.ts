/**
 * لایه ذخیره‌سازی — درایور LocalStorage.
 *
 * چرا LocalStorage؟ صورت پروژه، استفاده ساختاریافته از حافظه مرورگر را مجاز
 * دانسته است. مزیت آن برای این پروژه، استقرار بدون سرور و امکان آزمون کامل
 * سناریوها در مرورگر ارزیاب است. تمام دسترسی‌ها از همین ماژول عبور می‌کنند؛
 * بنابراین تعویض درایور با Supabase در فازهای بعد، فقط این فایل را تغییر می‌دهد.
 *
 * نکات پایداری:
 *  • همه خواندن/نوشتن‌ها در try/catch هستند (حالت مرور ناشناس یا مسدود بودن
 *    حافظه، نباید برنامه را از کار بیندازد).
 *  • نسخه اسکیما ذخیره می‌شود؛ ناسازگاری نسخه ⇒ بازسازی از داده پایه.
 */

import type { DatabaseShape } from '../domain/types';
import { buildSeedDatabase, SCHEMA_VERSION } from './seed';

const STORAGE_KEY = 'tarno.db.v1';

/** در صورت مسدود بودن حافظه مرورگر، داده در همین حافظه موقت نگه داشته می‌شود. */
let memoryFallback: DatabaseShape | null = null;
let storageAvailable = true;

const safeGet = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    storageAvailable = false;
    return null;
  }
};

const safeSet = (value: string): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    storageAvailable = false;
  }
};

export const isStorageAvailable = (): boolean => storageAvailable;

/** خواندن وضعیت؛ در نخستین اجرا داده پایه ساخته و ذخیره می‌شود. */
export const loadDatabase = (): DatabaseShape => {
  const raw = safeGet();
  if (!raw) {
    const seeded = memoryFallback ?? buildSeedDatabase();
    memoryFallback = seeded;
    safeSet(JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as DatabaseShape;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      const fresh = buildSeedDatabase();
      safeSet(JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch {
    // داده خراب — بازسازی کنترل‌شده به جای خطای اجرایی
    const fresh = buildSeedDatabase();
    safeSet(JSON.stringify(fresh));
    return fresh;
  }
};

export const saveDatabase = (db: DatabaseShape): void => {
  memoryFallback = db;
  safeSet(JSON.stringify(db));
};

/** بازگرداندن سامانه به داده پایه — برای تکرار آزمون سناریوها. */
export const resetDatabase = (): DatabaseShape => {
  const fresh = buildSeedDatabase();
  saveDatabase(fresh);
  return fresh;
};

/** خروجی JSON برای بازرسی داده در جلسه تحویل. */
export const exportDatabase = (db: DatabaseShape): string => JSON.stringify(db, null, 2);

/** اندازه تقریبی داده ذخیره‌شده (کیلوبایت) */
export const storageFootprintKb = (db: DatabaseShape): number =>
  Math.round((JSON.stringify(db).length / 1024) * 10) / 10;
