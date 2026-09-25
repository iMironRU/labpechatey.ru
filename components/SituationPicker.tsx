"use client";

import { useState } from "react";
import home from "@/content/home.json";
import Rail, { useCompact } from "@/components/Rail";
import texts from "@/content/constructor.json";
import { IconArrowRight, IconCat } from "@/components/Icons";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/**
 * Первый экран конструктора — «Что вам нужно изготовить?» из макета
 * «Конструктор.dc.html». Пять карточек ситуаций и два тихих варианта
 * пунктиром для тех, кто не знает, что выбрать.
 *
 * На телефоне внизу стоит панель «позвонить · помощь · Продолжить» — она
 * есть в макете на обоих шагах конструктора. Раз в ней живёт «Продолжить»,
 * карточки там не уводят сразу, а превращаются в ленту с прилипанием:
 * листаешь — выбранная всегда над кнопкой, а не в трёх экранах от неё.
 * На широком, где панели нет, сетка и тап по карточке ведут как раньше.
 */
export default function SituationPicker({
  onPick,
  onHelp,
}: {
  onPick: (kind: string, situation: string) => void;
  onHelp: () => void;
}) {
  const t = texts.choose;
  const [picked, setPicked] = useState<{ kind: string; sit: string } | null>(null);
  const compact = useCompact();

  const choose = (kind: string, sit: string) => {
    if (compact) setPicked({ kind, sit });
    else onPick(kind, sit);
  };

  return (
    <main
      className="mx-auto w-full flex-1"
      style={{ maxWidth: 1080, padding: "clamp(28px,5vw,60px) clamp(16px,4vw,56px) clamp(48px,6vw,80px)" }}
    >
      <span className="text-[12.5px] uppercase tracking-[0.06em]" style={{ color: "var(--color-accent-300)" }}>
        {t.kicker}
      </span>
      <h1
        className="m-0 mt-[10px] max-w-[16ch] font-semibold"
        style={{ fontSize: "clamp(30px,4.4vw,52px)", lineHeight: 1.03, letterSpacing: "-0.02em" }}
      >
        {t.title}
      </h1>
      <p className="mb-[30px] mt-[14px] max-w-[56ch] text-[15.5px]" style={{ color: muted(64) }}>
        {t.lead}
      </p>

      <Rail
        grid="grid gap-3.5"
        gridStyle={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}
        bleed="clamp(16px,4vw,56px)"
        onIndex={(i) => setPicked({ kind: t.cats[i].kind, sit: t.cats[i].sit })}
      >
        {t.cats.map((c) => (
          <button
            key={c.sit}
            type="button"
            onClick={() => choose(c.kind, c.sit)}
            aria-pressed={picked?.sit === c.sit}
            className="card flex w-full cursor-pointer flex-col items-start gap-3 p-5 text-left transition-transform hover:-translate-y-0.5"
            style={{
              boxShadow: "var(--shadow-sm)",
              border: picked?.sit === c.sit ? "1.5px solid var(--color-accent)" : "1.5px solid transparent",
              scrollMarginInline: 0,
            }}
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-[10px]"
              style={{ background: "var(--color-accent-800)", color: "var(--color-accent-100)" }}
            >
              <IconCat name={c.icon} />
            </span>
            <span className="text-[18px] font-semibold leading-[1.14]">{c.title}</span>
            <span className="flex-1 text-[13px] leading-[1.5]" style={{ color: muted(68) }}>
              {c.desc}
            </span>
            <span className="flex w-full items-center justify-between text-[12.5px]" style={{ color: muted(58) }}>
              <span>{c.price}</span>
              <span className="inline-flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
                Начать
                <IconArrowRight size={13} width={2} />
              </span>
            </span>
          </button>
        ))}
      </Rail>

      <div className="mt-4 flex flex-wrap gap-3">
        {t.quiet.map((q) => (
          <button
            key={q.sit}
            type="button"
            onClick={() => onPick(q.kind, q.sit)}
            className="flex min-w-[240px] flex-1 items-center gap-[13px] rounded-[12px] border border-dashed border-[var(--color-divider)] px-[17px] py-[15px] text-left transition-colors hover:border-[var(--color-accent)]"
          >
            <span
              className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[9px]"
              style={{ background: muted(6), color: "var(--color-accent)" }}
            >
              <IconCat name={q.icon} size={18} />
            </span>
            <span className="flex flex-col gap-[2px]">
              <span className="text-[15px] font-semibold">{q.title}</span>
              <span className="text-[12.5px]" style={{ color: muted(62) }}>
                {q.desc}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* ——— нижняя панель на телефоне (макет «Конструктор.dc.html», [data-sticky]) ——— */}
      <div className="mcta mcta-nav">
        <a href={home.phoneHref} aria-label="Позвонить" className="btn btn-secondary h-11 w-11 p-0">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M6 3h3l2 5-2 1a12 12 0 006 6l1-2 5 2v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z" />
          </svg>
        </a>
        <button type="button" onClick={onHelp} aria-label="Помощь" className="btn btn-secondary h-11 w-11 p-0">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M12 17h.01M9.1 9a3 3 0 015.8 1c0 2-3 2.5-3 4" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </button>
        <button
          type="button"
          className="btn btn-primary h-11 text-[14.5px]"
          disabled={!picked}
          onClick={() => picked && onPick(picked.kind, picked.sit)}
        >
          {t.continueCta}
        </button>
      </div>
    </main>
  );
}
