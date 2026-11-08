/** ورود با حساب‌های دمو — نقش‌های فروشنده، خریدار و مدیر سامانه. */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store/StoreProvider';
import { Badge, Button, Field, FormError, Input, Note } from '../../components/ui/primitives';

const DEMO = [
  {
    email: 'seller@tarno.ir',
    role: 'فروشنده',
    desc: 'نساجی رستگار — یزد؛ دارای آگهی فعال و درخواست خرید باز',
    to: '/mvp/seller',
  },
  { email: 'seller2@tarno.ir', role: 'فروشنده', desc: 'پارچه‌سرای کریمی — تهران', to: '/mvp/seller' },
  { email: 'buyer@tarno.ir', role: 'خریدار', desc: 'تولیدی پوشاک آوین — تهران', to: '/mvp' },
  { email: 'buyer2@tarno.ir', role: 'خریدار', desc: 'مبلمان و کالای خواب نگار — اصفهان', to: '/mvp' },
  {
    email: 'admin@tarno.ir',
    role: 'مدیر سامانه',
    desc: 'داوری آگهی‌های در انتظار تأیید',
    to: '/mvp/admin',
  },
];

export const Login = () => {
  const { login, notify } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const doLogin = (mail: string, pass: string, to: string) => {
    const res = login(mail, pass);
    if (!res.ok) {
      setErrors(res.errors);
      notify({ tone: 'error', title: 'ورود انجام نشد', detail: res.errors._form });
      return;
    }
    setErrors({});
    notify({ tone: 'success', title: 'ورود موفق' });
    navigate(to);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <div className="rounded-card border border-line bg-surface p-5">
        <h2 className="mb-1 text-[17px] font-bold text-ink">ورود به سامانه</h2>
        <p className="mb-5 text-[12.5px] leading-7 text-muted">
          گذرواژه همه حساب‌های دمو: <span className="num font-medium text-ink">tarno1234</span>
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            doLogin(email, password, '/mvp');
          }}
        >
          <FormError message={errors._form} />
          <Field label="ایمیل" htmlFor="login-email" required error={errors.email}>
            <Input
              id="login-email"
              type="email"
              dir="ltr"
              value={email}
              invalid={!!errors.email}
              placeholder="seller@tarno.ir"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="گذرواژه" htmlFor="login-pass" required error={errors.password}>
            <Input
              id="login-pass"
              type="password"
              dir="ltr"
              value={password}
              invalid={!!errors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg">
            ورود
          </Button>
        </form>
        <div className="mt-5">
          <Note kind="warn" title="داده هویتی واقعی ثبت نمی‌شود">
            این حساب‌ها ساختگی و فقط برای آزمون سناریوها هستند. گذرواژه‌ها در داده نمونه به صورت
            متن ساده نگه داشته شده‌اند چون هیچ کاربر واقعی در سامانه وجود ندارد؛ در یک محصول واقعی
            این کار مجاز نیست و باید درهم‌سازی (Hashing) انجام شود.
          </Note>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-ink">ورود سریع با حساب‌های دمو</h3>
        {DEMO.map((d) => (
          <div
            key={d.email}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="num text-[13px] font-medium text-ink" dir="ltr">
                  {d.email}
                </span>
                <Badge tone={d.role === 'مدیر سامانه' ? 'madder' : 'indigo'}>{d.role}</Badge>
              </div>
              <p className="mt-1 text-[12px] text-muted">{d.desc}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => doLogin(d.email, 'tarno1234', d.to)}>
              ورود با این حساب
            </Button>
          </div>
        ))}
        <Note kind="info" title="مسیر پیشنهادی آزمون سناریوی کامل">
          ۱) با <span className="num">seller@tarno.ir</span> وارد شوید و یک آگهی ثبت کنید. ۲) با{' '}
          <span className="num">admin@tarno.ir</span> آن را تأیید کنید. ۳) با{' '}
          <span className="num">buyer@tarno.ir</span> درخواست خرید بدهید. ۴) با حساب فروشنده قیمت
          نهایی را پیشنهاد کنید. ۵) با حساب خریدار تأیید و پرداخت شبیه‌سازی‌شده را انجام دهید.
        </Note>
      </div>
    </div>
  );
};
