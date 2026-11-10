/**
 * نمودارهای نقشه سفر مشتری:
 *  • خط سیر احساسی خریدار در ۸ مرحله
 *  • میله زمان فعال و زمان انتظار هر مرحله
 */

import { EMOTION_LABEL, EMOTION_SCORE, JOURNEY, type JourneyStage } from '../../lib/content/journey';
import { faNum } from '../../lib/format';

const W = 760;
const H = 230;
const PAD = { top: 28, right: 28, bottom: 46, left: 54 };

export const EmotionCurve = ({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
}) => {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (JOURNEY.length - 1)) * innerW;
  const y = (score: number) => PAD.top + innerH - ((score - 1) / 4) * innerH;

  const points = JOURNEY.map((s, i) => ({ s, cx: x(i), cy: y(EMOTION_SCORE[s.emotion]) }));
  const path = points
    .map((p, i) => {
      if (i === 0) return `M ${p.cx} ${p.cy}`;
      const prev = points[i - 1];
      const mx = (prev.cx + p.cx) / 2;
      return `C ${mx} ${prev.cy}, ${mx} ${p.cy}, ${p.cx} ${p.cy}`;
    })
    .join(' ');

  const areaPath = `${path} L ${points[points.length - 1].cx} ${PAD.top + innerH} L ${points[0].cx} ${
    PAD.top + innerH
  } Z`;

  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <div className="overflow-x-auto thin-scroll">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-[640px]"
        role="img"
        aria-label="خط سیر حالت احساسی خریدار در هشت مرحله سفر کنونی"
      >
        <defs>
          <linearGradient id="emoFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-2)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--series-2)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLevels.map((lv) => (
          <g key={lv}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(lv)}
              y2={y(lv)}
              stroke="var(--grid)"
              strokeWidth="1"
            />
            <text
              x={W - PAD.right + 6}
              y={y(lv) + 4}
              style={{ fill: 'var(--text-muted)', fontSize: 9.5 }}
            >
              {faNum(lv)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#emoFill)" />
        <path d={path} fill="none" stroke="var(--series-2)" strokeWidth="2" strokeLinecap="round" />

        {points.map((p) => {
          const active = activeId === p.s.id;
          return (
            <g
              key={p.s.id}
              onClick={() => onSelect(p.s.id)}
              style={{ cursor: 'pointer' }}
              tabIndex={0}
              role="button"
              aria-label={`مرحله ${p.s.index}: ${p.s.title} — ${EMOTION_LABEL[p.s.emotion]}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(p.s.id);
              }}
            >
              <circle cx={p.cx} cy={p.cy} r={active ? 7.5 : 5} fill="var(--series-2)" stroke="var(--surface)" strokeWidth="2" />
              <text
                x={p.cx}
                y={PAD.top + innerH + 20}
                textAnchor="middle"
                style={{
                  fill: active ? 'var(--ink)' : 'var(--text-muted)',
                  fontSize: 10,
                  fontWeight: active ? 700 : 400,
                }}
              >
                {faNum(p.s.index)}
              </text>
              <text
                x={p.cx}
                y={PAD.top + innerH + 34}
                textAnchor="middle"
                style={{ fill: 'var(--text-muted)', fontSize: 8.6 }}
              >
                {EMOTION_LABEL[p.s.emotion]}
              </text>
            </g>
          );
        })}

        <text x={PAD.left - 44} y={PAD.top - 10} style={{ fill: 'var(--text-muted)', fontSize: 9.5 }}>
          شاخص حال کاربر
        </text>
      </svg>
    </div>
  );
};

/** میله زمان فعال و انتظار برای هر مرحله */
export const StageTimeBars = ({ stages }: { stages: JourneyStage[] }) => {
  const max = Math.max(...stages.map((s) => s.activeHours + s.waitingHours), 1);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: 'var(--series-2)' }} />
          زمان کار فعال
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: 'var(--series-4)' }} />
          زمان انتظار (تقویمی)
        </span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {stages.map((s) => (
          <li key={s.id} className="grid grid-cols-[1.4rem_1fr] items-center gap-3 sm:grid-cols-[11rem_1fr]">
            <span className="num hidden text-[12px] text-body sm:block">
              {faNum(s.index)}. {s.title}
            </span>
            <span className="num text-[12px] text-body sm:hidden">{faNum(s.index)}</span>
            <div className="flex items-center gap-2">
              <div className="flex h-3.5 flex-1 gap-[2px] overflow-hidden rounded-[3px]" style={{ background: 'var(--grid)' }}>
                <div
                  style={{ width: `${(s.activeHours / max) * 100}%`, background: 'var(--series-2)' }}
                />
                <div
                  style={{ width: `${(s.waitingHours / max) * 100}%`, background: 'var(--series-4)' }}
                />
              </div>
              <span className="num w-[86px] shrink-0 text-[11px] text-muted">
                {faNum(s.activeHours, 1)} + {faNum(s.waitingHours, 0)} ساعت
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
