"use client";

import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/** Узкий экран: там карточки ложатся в ленту, а не в столбик. */
export function useCompact(max = 560) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${max}px)`);
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [max]);
  return compact;
}

/**
 * Ряд карточек: на широком экране сетка, на телефоне — лента с прилипанием
 * и точками под ней.
 *
 * Столбик из пяти-шести карточек на 390 занимает три экрана: человек
 * долистывает до конца и не находит, что было дальше по странице. Лента
 * держит блок в один экран, а край следующей карточки показывает, что
 * ряд продолжается.
 */
export default function Rail({
  grid,
  gridStyle,
  bleed = "clamp(18px,4vw,56px)",
  width = "86%",
  dots = true,
  onIndex,
  children,
}: {
  /** Классы сетки для широкого экрана. */
  grid?: string;
  gridStyle?: CSSProperties;
  /** Отступ контейнера, на который лента выходит за поля. */
  bleed?: string;
  /** Доля ширины экрана под карточку — остальное отдано краю следующей. */
  width?: string;
  dots?: boolean;
  /** Номер карточки по центру — нужен там, где лента заменяет выбор. */
  onIndex?: (i: number) => void;
  children: ReactNode;
}) {
  const compact = useCompact();
  const rail = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const items = Children.toArray(children);
  // колбэк обычно задают стрелкой на месте: в зависимостях эффекта он менял
  // бы себя на каждый рендер, и подписка уходила в бесконечный цикл
  const report = useRef(onIndex);
  report.current = onIndex;

  useEffect(() => {
    const el = rail.current;
    if (!el || !compact) return;
    let last = -1;
    const sync = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const step = card.offsetWidth + 12;
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollLeft / step)));
      if (i === last) return;
      last = i;
      setAt(i);
      report.current?.(i);
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, [compact, items.length]);

  if (!compact) {
    return <div className={grid} style={gridStyle}>{children}</div>;
  }

  return (
    <>
      <div
        ref={rail}
        className="rail snap-rail"
        style={{
          marginInline: `calc(-1 * ${bleed})`,
          ["--rail-pad" as string]: bleed,
          ["--rail-card" as string]: width,
        }}
      >
        {children}
      </div>
      {dots && items.length > 1 && (
        <div className="mt-3.5 flex justify-center gap-[6px]" aria-hidden>
          {items.map((_, i) => (
            <span
              key={i}
              className="h-[6px] rounded-full transition-all"
              style={{ width: i === at ? 18 : 6, background: i === at ? "var(--color-accent)" : muted(22) }}
            />
          ))}
        </div>
      )}
    </>
  );
}
