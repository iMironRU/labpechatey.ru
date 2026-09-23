"use client";

import start from "@/content/start.json";

/**
 * Стартовый экран: выбор ситуации.
 *
 * Человек приходит не за «печатью ООО на 40 мм», а с ситуацией — открыл
 * фирму, потерял печать, нужен штамп. Ситуация и определяет, какой тип
 * печати и какие поля показывать дальше.
 */
export default function StartScreen({
  onPick,
}: {
  onPick: (kind: string, situation: string) => void;
}) {
  return (
    <main
      className="mx-auto flex w-full flex-1 flex-col"
      style={{ maxWidth: 1180, padding: "clamp(20px,4vw,40px) clamp(16px,4vw,48px)" }}
    >
      <span
        className="text-[12.5px] uppercase tracking-[0.06em]"
        style={{ color: "var(--color-accent-300)" }}
      >
        {start.kicker}
      </span>
      <h1
        className="m-0 mt-2.5 font-semibold"
        style={{
          fontSize: "clamp(30px,4.4vw,52px)",
          lineHeight: 1.03,
          letterSpacing: "-0.02em",
          maxWidth: "16ch",
        }}
      >
        {start.title}
      </h1>
      <p
        className="mb-7 mt-3.5 text-[15.5px]"
        style={{ maxWidth: "56ch", color: "color-mix(in srgb, var(--color-text) 64%, transparent)" }}
      >
        {start.lead}
      </p>

      <div
        className="grid gap-3.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}
      >
        {start.cats.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.kind, c.id)}
            className="card flex w-full cursor-pointer flex-col items-start gap-3 border-0 p-5 text-left transition-transform hover:-translate-y-0.5"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-[10px] text-[15px] font-semibold"
              style={{ background: "var(--color-accent-800)", color: "var(--color-accent-100)" }}
            >
              {c.title.slice(0, 1)}
            </span>
            <span className="text-[18px] font-semibold leading-[1.14]">{c.title}</span>
            <span
              className="flex-1 text-[13px] leading-[1.5]"
              style={{ color: "color-mix(in srgb, var(--color-text) 68%, transparent)" }}
            >
              {c.desc}
            </span>
            <span
              className="flex w-full items-center justify-between text-[12.5px]"
              style={{ color: "color-mix(in srgb, var(--color-text) 58%, transparent)" }}
            >
              <span>{c.price}</span>
              <span style={{ color: "var(--color-accent)" }}>Начать →</span>
            </span>
          </button>
        ))}
      </div>

      {/* тихие варианты: для тех, кто не опознал свою ситуацию в карточках */}
      <div className="mt-4 flex flex-wrap gap-3">
        {start.quiet.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => onPick(q.kind, q.id)}
            className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-[var(--color-divider)] px-4 py-3 text-left"
            style={{ background: "transparent" }}
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-[8px] text-[13px]"
              style={{ background: "var(--color-accent-800)", color: "var(--color-accent-100)" }}
            >
              ?
            </span>
            <span>
              <span className="block text-[14px] font-semibold">{q.title}</span>
              <span
                className="block text-[12px]"
                style={{ color: "color-mix(in srgb, var(--color-text) 58%, transparent)" }}
              >
                {q.desc}
              </span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
