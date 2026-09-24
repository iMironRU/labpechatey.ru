"use client";

import { useState } from "react";
import { forDiameter, nearestSizes, sizeLabel, KIND_LABEL, type Mount } from "@/lib/mounts";
import MountPhoto from "@/components/MountPhoto";

/** Иконки характеристик: линейные 24×24, как в хендоффе (стиль Phosphor). */
const ICONS: Record<string, React.ReactNode> = {
  auto: (
    <>
      <path d="M12 4v7" />
      <path d="M8 11h8l1 4H7z" />
      <path d="M6 19h12" />
    </>
  ),
  pocket: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="3" />
      <path d="M9 4v3h6V4" />
    </>
  ),
  manual: (
    <>
      <path d="M10 3h4v5h-4z" />
      <path d="M7 8h10l1 5H6z" />
    </>
  ),
  round: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  size: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M5 19L19 5" />
    </>
  ),
};

function Chip({ name, icon }: { name: string; icon: keyof typeof ICONS }) {
  return (
    <span
      title={name}
      className="grid h-6 w-6 place-items-center rounded-[7px]"
      // плашка фото белая в обеих темах, поэтому цвета значков заданы явно
      style={{ background: "#eceef4", color: "#3b4050" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
        {ICONS[icon]}
      </svg>
    </span>
  );
}

/**
 * Подходящие оснастки под выбранный макет.
 *
 * Подбор идёт по размеру поля под клише: печать Ø40 мм встаёт только в
 * оснастку с полем Ø40 мм. Самая дешёвая подходящая входит в стоимость,
 * остальные показываются доплатой к ней — так цена не пугает числом 890 ₽
 * там, где человек уже видел «печать 690 ₽».
 */
export default function Mounts({
  diameterMm, value, onChange,
}: {
  diameterMm: number;
  value: number;
  onChange: (i: number) => void;
}) {
  const list = forDiameter(diameterMm);
  const base = list[0]?.price ?? 0;
  const [sheet, setSheet] = useState(false);

  if (!list.length) {
    const near = nearestSizes(diameterMm);
    return (
      <div className="mt-4 border-t border-[var(--color-divider)] pt-4">
        <span className="text-[15px] font-semibold">Подходящие оснастки</span>
        <p className="mt-2 text-[13px]" style={{ color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}>
          Под Ø{diameterMm} мм готовых оснасток в каталоге нет. Ближайшие размеры:{" "}
          {near.map((n) => `Ø${n} мм`).join(", ")} — подберём вручную.
        </p>
      </div>
    );
  }

  const current = list[value] ?? list[0];
  const priceLabel = current.price === base
    ? "включена в стоимость"
    : `+ ${(current.price - base).toLocaleString("ru-RU")} ₽`;

  const tiles = (onPick?: () => void) =>
    list.map((m, i) => (
      <Tile key={m.id} m={m} extra={m.price - base} base={base} active={i === value}
        onClick={() => { onChange(i); onPick?.(); }} />
    ));

  return (
    <>
      {/* на телефоне лента не помещается: строка с выбранной и лист по кнопке */}
      <div className="mt-4 hidden items-center gap-3 border-t border-[var(--color-divider)] pt-4 max-[560px]:flex">
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px]" style={{ color: "color-mix(in srgb, var(--color-text) 52%, transparent)" }}>
            Оснастка
          </div>
          <div className="truncate text-[14.5px] font-semibold">
            {current.brand} {current.model} · {priceLabel}
          </div>
        </div>
        <button type="button" className="btn btn-secondary whitespace-nowrap px-[14px] py-[9px] text-[13px]"
          onClick={() => setSheet(true)}>
          Изменить
        </button>
      </div>

      {sheet && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheet(false)} />
          <div className="sheet" role="dialog" aria-label="Подходящие оснастки">
            <div className="sheet-handle" />
            <div className="mb-[13px] text-[18px] font-semibold">Подходящие оснастки</div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">{tiles(() => setSheet(false))}</div>
          </div>
        </>
      )}

    <div className="mt-4 min-w-0 border-t border-[var(--color-divider)] pt-4 max-[560px]:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[15px] font-semibold">
          Подходящие оснастки{" "}
          <span className="font-normal" style={{ color: "color-mix(in srgb, var(--color-text) 52%, transparent)" }}>
            · Ø{diameterMm} мм
          </span>
        </span>
        <a href="#tools" className="text-[13px] no-underline" style={{ color: "var(--color-accent)" }}>
          Посмотреть все
        </a>
      </div>

      <div className="flex min-w-0 gap-3 overflow-x-auto pb-1">{tiles()}</div>
    </div>
    </>
  );
}

function Tile({
  m, extra, base, active, onClick,
}: {
  m: Mount;
  extra: number;
  base: number;
  active: boolean;
  onClick: () => void;
}) {
  const tag = m.kind === "pocket" ? "Дорожная" : extra === 0 ? "Оптимально" : m.material?.includes("Металл") ? "Металл" : "Для офиса";
  const tagStyle =
    extra === 0
      ? { background: "var(--color-accent-800)", color: "var(--color-accent-100)" }
      : {
          background: "color-mix(in srgb, var(--color-text) 8%, transparent)",
          color: "color-mix(in srgb, var(--color-text) 62%, transparent)",
        };

  return (
    <button
      type="button"
      onClick={onClick}
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
        }}
      >
        <MountPhoto m={m} className="mount-photo--tile" />

        <span
          className="absolute left-2 top-2 rounded-full px-2 py-[3px] text-[10.5px] font-semibold transition-all duration-[380ms] group-hover:-translate-x-3 group-hover:-translate-y-3.5 group-hover:opacity-0"
          style={tagStyle}
        >
          {tag}
        </span>

        <span
          className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 py-[7px] transition-opacity duration-[380ms] group-hover:opacity-0"
          // значки лежат поверх снимка — без подложки они тонут в предмете
          style={{ background: "rgba(255,255,255,.78)", backdropFilter: "blur(4px)" }}
        >
          <Chip name={KIND_LABEL[m.kind]} icon={m.kind} />
          <Chip name="Круглая" icon="round" />
          <Chip name={sizeLabel(m)} icon="size" />
        </span>
      </div>

      <div className="p-2 transition-opacity duration-300 group-hover:opacity-0">
        <div className="truncate text-[13px] font-semibold" title={`${m.brand} ${m.model}`}>
          {m.brand} {m.model}
        </div>
        {/* три вида цены из макета: входит в стоимость, со скидкой, обычная */}
        <div className="mt-1">
          {extra === 0 ? (
            <span className="text-[12px] font-semibold" style={{ color: "var(--ok)" }}>
              Включена в стоимость
            </span>
          ) : m.priceOld ? (
            <span className="flex items-baseline gap-1.5">
              <span
                className="text-[12px] line-through"
                style={{ color: "color-mix(in srgb, var(--color-text) 45%, transparent)" }}
              >
                + {(m.priceOld - base).toLocaleString("ru-RU")} ₽
              </span>
              <span className="text-[14px] font-semibold" style={{ color: "var(--color-accent)" }}>
                + {extra.toLocaleString("ru-RU")} ₽
              </span>
            </span>
          ) : (
            <span className="text-[14px] font-semibold">+ {extra.toLocaleString("ru-RU")} ₽</span>
          )}
        </div>
      </div>
    </button>
  );
}
