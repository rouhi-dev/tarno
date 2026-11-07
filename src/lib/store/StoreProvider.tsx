/**
 * مخزن وضعیت برنامه.
 *
 * نقش این لایه فقط «اتصال» است: سرویس‌های دامنه را فراخوانی می‌کند، نتیجه را
 * در حافظه مرورگر پایدار می‌سازد و وضعیت تازه را به کامپوننت‌ها می‌دهد. هیچ
 * قاعده کسب‌وکاری در این فایل نوشته نشده است.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { DatabaseShape, ID, User } from '../domain/types';
import type { FieldErrors } from '../domain/validation';
import { validateLogin } from '../domain/validation';
import * as svc from '../domain/services';
import { loadDatabase, resetDatabase, saveDatabase } from './repository';

export interface Toast {
  id: string;
  tone: 'success' | 'error' | 'info';
  title: string;
  detail?: string;
}

interface StoreValue {
  db: DatabaseShape;
  currentUser: User | null;
  toasts: Toast[];
  notify: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  login: (email: string, password: string) => { ok: boolean; errors: FieldErrors };
  loginAs: (userId: ID) => void;
  logout: () => void;
  /** اجرای یک سرویس دامنه و پایدارسازی نتیجه */
  run: <T>(fn: (db: DatabaseShape) => svc.ServiceResult<T>) => svc.ServiceResult<T>;
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<DatabaseShape>(() => loadDatabase());
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * آخرین وضعیت پایگاه داده بیرون از چرخه رندر نگه داشته می‌شود.
   * دلیل: چند سرویس ممکن است در یک رویداد پشت‌سرهم اجرا شوند (مثلاً حذف چند
   * رکورد). اگر هر فراخوانی از مقدار `db` همان رندر بخواند، همه روی وضعیت کهنه
   * کار می‌کنند و تنها آخرین تغییر باقی می‌ماند. با این ارجاع، هر فراخوانی روی
   * نتیجه فراخوانی قبلی اعمال می‌شود.
   */
  const latest = useRef(db);

  const commit = useCallback((next: DatabaseShape) => {
    latest.current = next;
    setDb(next);
  }, []);

  useEffect(() => {
    saveDatabase(db);
  }, [db]);

  const notify = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `t_${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      const v = validateLogin(email, password);
      if (!v.ok) return { ok: false, errors: v.errors };
      const user = latest.current.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
      );
      if (!user) return { ok: false, errors: { _form: 'ایمیل یا گذرواژه نادرست است.' } };
      commit({ ...latest.current, session: { userId: user.id } });
      return { ok: true, errors: {} };
    },
    [commit],
  );

  const loginAs = useCallback(
    (userId: ID) => commit({ ...latest.current, session: { userId } }),
    [commit],
  );

  const logout = useCallback(
    () => commit({ ...latest.current, session: { userId: null } }),
    [commit],
  );

  const run = useCallback(
    <T,>(fn: (current: DatabaseShape) => svc.ServiceResult<T>) => {
      const result = fn(latest.current);
      if (result.ok) commit(result.db);
      return result;
    },
    [commit],
  );

  const reset = useCallback(() => commit(resetDatabase()), [commit]);

  const currentUser = useMemo(
    () => db.users.find((u) => u.id === db.session.userId) ?? null,
    [db.users, db.session.userId],
  );

  const value = useMemo<StoreValue>(
    () => ({ db, currentUser, toasts, notify, dismissToast, login, loginAs, logout, run, reset }),
    [db, currentUser, toasts, notify, dismissToast, login, loginAs, logout, run, reset],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreValue => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore باید درون StoreProvider استفاده شود.');
  return ctx;
};
