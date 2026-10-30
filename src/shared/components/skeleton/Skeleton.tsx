import type { CSSProperties, ReactNode } from 'react';
import './skeleton.css';

/**
 * Loading skeletons shaped like the content they stand in for. Pages keep their
 * header and filters on screen and put one of these where the data will appear,
 * so nothing jumps when it arrives.
 */

type Size = number | string;
const px = (value: Size | undefined) => (typeof value === 'number' ? `${value}px` : value);
// Varied line widths so stacked rows don't look like a barcode.
const WIDTHS = ['72%', '54%', '64%', '46%', '80%', '58%'];
const widthAt = (index: number) => WIDTHS[index % WIDTHS.length];

/** One shimmering block. */
export function Skeleton({ w = '100%', h = 12, round, style, className = '' }: { w?: Size; h?: Size; round?: boolean; style?: CSSProperties; className?: string }) {
  return <span className={`eb-skel${round ? ' round' : ''} ${className}`.trim()} style={{ width: px(w), height: px(h), ...style }} />;
}

/** Announces loading once to screen readers and hides the shapes from them. */
export function SkeletonRegion({ label = 'Loading', children, className = '', style }: { label?: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`eb-skel-region ${className}`.trim()} style={style} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}…</span>
      <div aria-hidden="true" style={{ display: 'contents' }}>{children}</div>
    </div>
  );
}

/** A few lines of text, the last one shorter. */
export function SkeletonText({ lines = 2, h = 10 }: { lines?: number; h?: number }) {
  return (
    <div className="eb-skel-stack">
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} h={h} w={i === lines - 1 && lines > 1 ? '45%' : widthAt(i + 4)} />)}
    </div>
  );
}

/** A row of stat tiles: small label over a big number. */
export function SkeletonStats({ count = 4, min = 150 }: { count?: number; min?: number }) {
  return (
    <div className="eb-skel-grid" style={{ ['--skel-min' as string]: `${min}px` }}>
      {Array.from({ length: count }, (_, i) => (
        <div className="eb-skel-card" key={i}><Skeleton w="45%" h={9} /><Skeleton w="38%" h={24} /></div>
      ))}
    </div>
  );
}

/**
 * A table: a header strip and rows with an optional avatar/logo, a two-line
 * name cell, further columns and a trailing pill. `bare` drops the border
 * when the page already draws the card.
 */
export function SkeletonTable({ rows = 8, columns = 3, avatar = true, pill = true, bare }: { rows?: number; columns?: number; avatar?: boolean; pill?: boolean; bare?: boolean }) {
  return (
    <div className={bare ? '' : 'eb-skel-card flush'}>
      <div className="eb-skel-table-head">
        <Skeleton w={avatar ? 140 : 110} h={9} />
        {Array.from({ length: columns }, (_, c) => <Skeleton key={c} w={70} h={9} className={c > 0 ? 'eb-skel-hide-sm' : ''} style={{ marginLeft: c === 0 ? 'auto' : undefined }} />)}
        {pill && <Skeleton w={56} h={9} />}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div className="eb-skel-table-row" key={r}>
          {avatar && <Skeleton w={34} h={34} round />}
          <div className="eb-skel-stack" style={{ maxWidth: 260 }}><Skeleton w={widthAt(r)} h={11} /><Skeleton w={widthAt(r + 3)} h={9} /></div>
          {Array.from({ length: columns }, (_, c) => <Skeleton key={c} w={60 + ((r + c) % 3) * 12} h={10} className={c > 0 ? 'eb-skel-hide-sm' : ''} style={{ marginLeft: c === 0 ? 'auto' : undefined }} />)}
          {pill && <Skeleton w={56} h={20} round />}
        </div>
      ))}
    </div>
  );
}

/** A list of entries, e.g. messages or notifications: avatar, two lines, a time. */
export function SkeletonList({ rows = 6, avatar = true, bare }: { rows?: number; avatar?: boolean; bare?: boolean }) {
  return (
    <div className={bare ? '' : 'eb-skel-card flush'}>
      {Array.from({ length: rows }, (_, r) => (
        <div className="eb-skel-table-row" key={r} style={{ alignItems: 'flex-start' }}>
          {avatar && <Skeleton w={32} h={32} round />}
          <div className="eb-skel-stack"><Skeleton w={widthAt(r + 1)} h={11} /><Skeleton w={widthAt(r + 4)} h={9} /></div>
          <Skeleton w={44} h={9} />
        </div>
      ))}
    </div>
  );
}

/** A grid of cards: optional media block, a title, two lines and a footer of chips. */
export function SkeletonCards({ count = 6, min = 260, media = 0, footer = true }: { count?: number; min?: number; media?: number; footer?: boolean }) {
  return (
    <div className="eb-skel-grid" style={{ ['--skel-min' as string]: `${min}px` }}>
      {Array.from({ length: count }, (_, i) => (
        <div className={`eb-skel-card${media ? ' flush' : ''}`} key={i}>
          {media > 0 && <Skeleton h={media} style={{ borderRadius: 0 }} />}
          <div className="eb-skel-stack" style={media ? { padding: '12px 16px 16px', gap: 9 } : { gap: 9 }}>
            <Skeleton w={widthAt(i)} h={15} />
            <Skeleton w={widthAt(i + 2)} h={9} />
            <Skeleton w={widthAt(i + 4)} h={9} />
            {footer && <div className="eb-skel-row" style={{ marginTop: 6 }}><Skeleton w={54} h={20} round /><Skeleton w={70} h={20} round /></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A bordered panel with a heading and either text lines or label-and-field pairs. */
export function SkeletonPanel({ lines = 3, fields = 0, height }: { lines?: number; fields?: number; height?: number }) {
  return (
    <div className="eb-skel-card" style={height ? { minHeight: height, alignContent: 'start' } : undefined}>
      <Skeleton w={150} h={13} />
      {fields > 0
        ? Array.from({ length: fields }, (_, i) => <div className="eb-skel-stack" key={i}><Skeleton w={90} h={9} /><Skeleton h={36} style={{ borderRadius: 8 }} /></div>)
        : <SkeletonText lines={lines} />}
    </div>
  );
}

/** The top of a page: eyebrow, title and a line of text, with an action button on the right. */
export function SkeletonHeader({ action = true }: { action?: boolean }) {
  return (
    <div className="eb-skel-row" style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div className="eb-skel-stack" style={{ maxWidth: 420 }}><Skeleton w={90} h={9} /><Skeleton w="70%" h={28} /><Skeleton w="85%" h={10} /></div>
      {action && <Skeleton w={130} h={36} style={{ borderRadius: 9 }} />}
    </div>
  );
}

/** A record's page: hero with logo/photo and title, tab strip, then main and side columns. */
export function SkeletonDetail({ tabs = 4, avatar = true }: { tabs?: number; avatar?: boolean }) {
  return (
    <>
      <div className="eb-skel-card">
        <div className="eb-skel-row">
          {avatar && <Skeleton w={64} h={64} style={{ borderRadius: 14 }} />}
          <div className="eb-skel-stack" style={{ maxWidth: 420 }}><Skeleton w={80} h={9} /><Skeleton w="75%" h={26} /><Skeleton w="55%" h={10} /></div>
        </div>
        <div className="eb-skel-row" style={{ marginTop: 4 }}>{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} w={84} h={40} style={{ borderRadius: 9 }} />)}</div>
      </div>
      {tabs > 0 && <div className="eb-skel-tabs">{Array.from({ length: tabs }, (_, i) => <Skeleton key={i} w={70} h={11} />)}</div>}
      <div className="eb-skel-split">
        <div className="eb-skel-region"><SkeletonPanel lines={4} /><SkeletonPanel lines={3} /></div>
        <SkeletonPanel lines={5} />
      </div>
    </>
  );
}

/** An edit form: main column of field panels and a side column. */
export function SkeletonForm({ panels = 2, aside = true }: { panels?: number; aside?: boolean }) {
  const main = <div className="eb-skel-region">{Array.from({ length: panels }, (_, i) => <SkeletonPanel key={i} fields={i === 0 ? 3 : 2} />)}</div>;
  return aside ? <div className="eb-skel-split">{main}<div className="eb-skel-region"><SkeletonPanel fields={2} /><SkeletonPanel lines={2} /></div></div> : main;
}
