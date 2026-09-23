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

/** Иконки характеристик: линейные 24×24, как в хендоффе (стиль Phosphor). */
const CHAR_ICON: Record<string, React.ReactNode> = {
  Автоматическая: (
    <>
      <path d="M12 4v7" />
      <path d="M8 11h8l1 4H7z" />
      <path d="M6 19h12" />
    </>
  ),
  Карманная: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="3" />
      <path d="M9 4v3h6V4" />
    </>
  ),
  Круглая: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "Ø40": (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M5 19L19 5" />
    </>
  ),
  "Сменная подушка": (
    <>
      <rect x="4" y="9" width="16" height="7" rx="2" />
      <path d="M8 9V6h8v3" />
    </>
  ),
};

function CharIcon({ name }: { name: string }) {
  return (
    <span
      title={name}
      className="grid h-6 w-6 place-items-center rounded-[7px]"
      style={{ background: "color-mix(in srgb, var(--color-surface) 90%, transparent)" }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label={name}
      >
        {CHAR_ICON[name] ?? <circle cx="12" cy="12" r="7" />}
      </svg>
    </span>
  );
}

/**
 * Лента оснасток.
 *
 * Фото — плейсхолдеры: реальных снимков нет, в хендоффе это штриховка со
 * значком. При наведении фотозона раскрывается на всю плитку, тег уезжает,
 * иконки разлетаются — анимация из спецификации.
 */
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
                    "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-text) 7%, transparent) 0 1px, transparent 1px 9px)",
                }}
              >
                {/* вместо фото — силуэт оснастки */}
                <span
                  className="absolute inset-0 grid place-items-center"
                  style={{ color: "color-mix(in srgb, var(--color-text) 28%, transparent)" }}
                >
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 3h4v4h-4z" />
                    <path d="M8 7h8l1.5 6h-11z" />
                    <rect x="5" y="15" width="14" height="4" rx="1.5" />
                  </svg>
                </span>

                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-[3px] text-[10.5px] font-semibold transition-all duration-[380ms] group-hover:-translate-x-3 group-hover:-translate-y-3.5 group-hover:opacity-0"
                  style={{ background: tag.bg, color: tag.color }}
                >
                  {m.tag}
                </span>

                <span className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 transition-opacity duration-[380ms] group-hover:opacity-0">
                  {m.chars.map((c) => (
                    <CharIcon key={c} name={c} />
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
