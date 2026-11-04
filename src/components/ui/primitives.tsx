/** اجزای پایه رابط کاربری — سیستم طراحی تارنو. */

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

export const cx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ');

/* --------------------------------- دکمه --------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
type ButtonSize = 'sm' | 'md' | 'lg';

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-45 disabled:cursor-not-allowed select-none';

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-700 text-white hover:bg-indigo-900 border border-transparent',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-raised',
  ghost: 'bg-transparent text-indigo-700 border border-transparent hover:bg-indigo-100',
  danger: 'bg-transparent text-danger border border-line-strong hover:bg-madder-100',
  quiet: 'bg-raised text-body border border-line hover:bg-surface',
};

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'text-[12.5px] px-3 py-1.5',
  md: 'text-[13.5px] px-4 py-2',
  lg: 'text-[15px] px-6 py-3',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cx(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';

/* --------------------------------- نشان --------------------------------- */

type BadgeTone = 'neutral' | 'indigo' | 'ok' | 'warn' | 'danger' | 'madder' | 'outline';

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-raised text-muted border-line',
  indigo: 'bg-indigo-100 text-indigo-900 border-transparent',
  ok: 'bg-transparent text-ok border-current',
  warn: 'bg-transparent text-warn border-current',
  danger: 'bg-transparent text-danger border-current',
  madder: 'bg-madder-100 text-madder-600 border-transparent',
  outline: 'bg-transparent text-body border-line-strong',
};

export const Badge = ({
  children,
  tone = 'neutral',
  className,
  icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: ReactNode;
}) => (
  <span
    className={cx(
      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11.5px] font-medium leading-6 whitespace-nowrap',
      BADGE_TONE[tone],
      className,
    )}
  >
    {icon}
    {children}
  </span>
);

/* -------------------------------- فیلد فرم -------------------------------- */

export const Field = ({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) => (
  <div className={cx('flex flex-col gap-1.5', className)}>
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
      {label}
      {required && <span className="text-madder-600"> *</span>}
    </label>
    {children}
    {error ? (
      <p role="alert" className="text-[12px] leading-5 text-danger">
        {error}
      </p>
    ) : hint ? (
      <p className="text-[12px] leading-5 text-muted">{hint}</p>
    ) : null}
  </div>
);

const CONTROL =
  'w-full rounded-lg border bg-surface px-3 py-2 text-[13.5px] text-ink placeholder:text-muted transition-colors';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...rest }, ref) => (
  <input
    ref={ref}
    className={cx(CONTROL, invalid ? 'border-danger' : 'border-line-strong', className)}
    {...rest}
  />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cx(
      CONTROL,
      'min-h-[90px] leading-7 resize-y',
      invalid ? 'border-danger' : 'border-line-strong',
      className,
    )}
    {...rest}
  />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ className, invalid, children, ...rest }, ref) => (
  <select
    ref={ref}
    className={cx(CONTROL, 'cursor-pointer', invalid ? 'border-danger' : 'border-line-strong', className)}
    {...rest}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export const Checkbox = ({
  id,
  label,
  checked,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) => (
  <div className="flex items-start gap-2">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--indigo-700)]"
    />
    <label htmlFor={id} className="cursor-pointer text-[13px] leading-6 text-body">
      {label}
      {hint && <span className="block text-[11.5px] text-muted">{hint}</span>}
    </label>
  </div>
);

/* ------------------------------ خطای کل فرم ------------------------------ */

export const FormError = ({ message }: { message?: string }) =>
  message ? (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/40 bg-madder-100 px-3 py-2 text-[13px] leading-6 text-danger"
    >
      <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      <span>{message}</span>
    </div>
  ) : null;

/* ------------------------------- حالت خالی ------------------------------- */

export const EmptyState = ({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line-strong bg-raised px-6 py-12 text-center">
    <div aria-hidden className="h-10 w-16 rounded-sm weave border border-line" />
    <h4 className="text-[15px] font-semibold text-ink">{title}</h4>
    <p className="max-w-[46ch] text-[13px] leading-7 text-muted">{body}</p>
    {action}
  </div>
);

/* --------------------------------- آماره --------------------------------- */

export const Stat = ({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: 'neutral' | 'ok' | 'warn' | 'indigo';
}) => {
  const toneClass =
    tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : tone === 'indigo' ? 'text-indigo-700' : 'text-ink';
  return (
    <div className="flex flex-col gap-1 border-s-2 border-line ps-3">
      <span className="text-[11.5px] font-medium text-muted">{label}</span>
      <span className={cx('num text-[19px] font-bold leading-7', toneClass)}>{value}</span>
      {sub && <span className="text-[11.5px] leading-5 text-muted">{sub}</span>}
    </div>
  );
};

/* ------------------------------- جعبه نکته ------------------------------- */

export const Note = ({
  kind = 'info',
  title,
  children,
}: {
  kind?: 'info' | 'warn' | 'honest';
  title?: string;
  children: ReactNode;
}) => {
  const styles = {
    info: 'border-line bg-raised',
    warn: 'border-warn/35 bg-[color-mix(in_srgb,var(--warn)_8%,transparent)]',
    honest: 'border-indigo-700/30 bg-indigo-100',
  }[kind];
  const mark = { info: 'نکته', warn: 'هشدار', honest: 'مرز ادعا' }[kind];
  return (
    <div className={cx('rounded-card border px-4 py-3', styles)}>
      <p className="label-eyebrow mb-1">{title ?? mark}</p>
      <div className="text-[13px] leading-7 text-body">{children}</div>
    </div>
  );
};
