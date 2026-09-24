"use client";

import texts from "@/content/constructor.json";
import { IconArrowRight, IconCat } from "@/components/Icons";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/**
 * Первый экран конструктора — «Что вам нужно изготовить?» из макета
 * «Конструктор.dc.html». Пять карточек ситуаций и два тихих варианта
 * пунктиром для тех, кто не знает, что выбрать.
 */
export default function SituationPicker({
  onPick,
}: {
  onPick: (kind: string, situation: string) => void;
}) {
  const t = texts.choose;

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

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}>
        {t.cats.map((c) => (
          <button
            key={c.sit}
            type="button"
            onClick={() => onPick(c.kind, c.sit)}
            className="card flex w-full cursor-pointer flex-col items-start gap-3 border-0 p-5 text-left transition-transform hover:-translate-y-0.5"
            style={{ boxShadow: "var(--shadow-sm)" }}
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
      </div>

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
    </main>
  );
}
