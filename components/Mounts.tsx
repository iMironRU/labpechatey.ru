"use client";

import catalog from "@/content/catalog.json";

const TAG_STYLE: Record<string, { bg: string; color: string }> = {
  accent: { bg: "var(--color-accent-800)", color: "var(--color-accent-100)" },
  sale: { bg: "var(--ok-bg)", color: "var(--ok)" },
  neutral: {
    bg: "color-mix(in srgb, var(--color-text) 8%, transparent)",
    color: "color-mix(in srgb, var(--color-text) 62%, transparent)",
  },
};

/** Лента оснасток. Фото пока плейсхолдеры — реальных снимков нет. */
export default function Mounts({
  value, onChange,
}: {
  value: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="mt-4 min-w-0 border-t border-[var(--color-divider)] pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[15px] font-semibold">Подходящие оснастки</span>
        <button type="button" className="text-[13px] text-[var(--color-accent)]">
          Посмотреть все
        </button>
      </div>

      <div className="flex min-w-0 gap-3 overflow-x-auto pb-1">
        {catalog.mounts.map((m, i) => {
          const active = i === value;
          const tag = TAG_STYLE[m.kind] ?? TAG_STYLE.neutral;
          return (
            <button
              key={m.name}
              type="button"
              onClick={() => onChange(i)}
              aria-pressed={active}
              className="group shrink-0 overflow-hidden rounded-[12px] border-[1.5px] text-left"
              style={{
                width: 152,
                height: 214,
                borderColor: active ? "var(--color-accent)" : "var(--color-divider)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="relative overflow-hidden transition-[height] duration-[400ms] group-hover:h-full"
                style={{
                  height: 126,
                  transitionTimingFunction: "cubic-bezier(.2,.75,.2,1)",
                  background:
                    "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-text) 6%, transparent) 0 1px, transparent 1px 9px)",
                }}
              >
                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-[3px] text-[10.5px] font-semibold transition-all duration-[380ms] group-hover:-translate-x-3 group-hover:-translate-y-3.5 group-hover:opacity-0"
                  style={{ background: tag.bg, color: tag.color }}
                >
                  {m.tag}
                </span>
                <span className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 transition-opacity duration-[380ms] group-hover:opacity-0">
                  {m.chars.map((c) => (
                    <span
                      key={c}
                      title={c}
                      className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[10px]"
                      style={{ background: "color-mix(in srgb, var(--color-surface) 90%, transparent)" }}
                    >
                      {c.slice(0, 1)}
                    </span>
                  ))}
                </span>
              </div>

              <div className="p-2 transition-opacity duration-300 group-hover:opacity-0">
                <div className="truncate text-[13px] font-semibold">{m.name}</div>
                <div className="mt-1 text-[12px]">
                  {m.mode === "included" ? (
                    <span style={{ color: "var(--ok)" }}>Включена в стоимость</span>
                  ) : m.mode === "discount" ? (
                    <>
                      <span className="mr-1 line-through opacity-50">+ {m.costOld} ₽</span>
                      <span style={{ color: "var(--color-accent)" }}>+ {m.cost} ₽</span>
                    </>
                  ) : (
                    <span>+ {m.cost} ₽</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
