/** قالب یک «لوح» از پرونده تحلیلی: شماره، عنوان، توضیح و بدنه. */

import type { ReactNode } from 'react';
import { faNum } from '../../lib/format';
import { Reveal } from '../ui/motion';
import { cx } from '../ui/primitives';

export const SectionShell = ({
  id,
  index,
  eyebrow,
  title,
  lead,
  children,
  tone = 'plain',
}: {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  lead?: string;
  children: ReactNode;
  tone?: 'plain' | 'raised';
}) => (
  <section
    id={id}
    className={cx('scroll-mt-24 border-b border-line py-14', tone === 'raised' && 'bg-raised')}
  >
    <div className="mx-auto max-w-[1180px] px-4">
      <Reveal>
        <div className="mb-8 flex items-start gap-4">
          <span
            aria-hidden
            className="num mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface text-[14px] font-bold text-indigo-700"
          >
            {faNum(index)}
          </span>
          <div className="flex flex-col gap-2">
            <span className="label-eyebrow">{eyebrow}</span>
            <h2 className="font-display text-[30px] font-bold leading-[1.25] text-ink sm:text-[34px]">
              {title}
            </h2>
            {lead && <p className="max-w-reading text-[14px] leading-8 text-body">{lead}</p>}
          </div>
        </div>
      </Reveal>
      {children}
    </div>
  </section>
);
