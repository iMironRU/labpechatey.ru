"use client";

import { useMemo, useState } from "react";
import { KIND_LABEL, MOUNTS, ROUND_SIZES, sizeLabel, type Mount } from "@/lib/mounts";
import MountPhoto from "@/components/MountPhoto";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

type Shape = "all" | "round" | "rect";
type Kind = "all" | Mount["kind"];

/**
 * Каталог оснасток с подбором по размеру.
 *
 * Размер в прайсе — поле под клише, поэтому фильтр по диаметру отвечает на
 * главный вопрос покупателя: «в какую оснастку встанет моя печать Ø40».
 */
export default function MountsCatalog() {
  const [shape, setShape] = useState<Shape>("round");
  const [kind, setKind] = useState<Kind>("all");
  const [brand, setBrand] = useState<"all" | string>("all");
  const [size, setSize] = useState<"all" | number>(40);
  const [limit, setLimit] = useState(8);

  const brands = useMemo(() => [...new Set(MOUNTS.map((m) => m.brand))], []);

  const list = useMemo(() => {
    return MOUNTS.filter((m) => {
      if (shape !== "all" && m.shape !== shape) return false;
      if (kind !== "all" && m.kind !== kind) return false;
      if (brand !== "all" && m.brand !== brand) return false;
      if (size !== "all" && shape === "round" && m.diameterMm !== size) return false;
      return true;
    });
  }, [shape, kind, brand, size]);

  const shown = list.slice(0, limit);

  return (
    <section id="tools" className="mt-[clamp(46px,6vw,72px)]">
      <h2 className="m-0 text-[clamp(22px,2.6vw,30px)] font-semibold">Оснастки</h2>
      <p className="mb-4 mt-2 max-w-[62ch] text-[15px]" style={{ color: muted(68) }}>
        Корпус, в который ставится клише. Размер в карточке — поле под клише:
        печать Ø40 мм встанет только в оснастку с полем Ø40 мм.
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Chips
          value={shape}
          onChange={(v) => { setShape(v as Shape); if (v !== "round") setSize("all"); }}
          items={[
            { v: "round", label: "Круглые" },
            { v: "rect", label: "Прямоугольные" },
            { v: "all", label: "Все формы" },
          ]}
        />
        <Chips
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          items={[
            { v: "all", label: "Любой тип" },
            { v: "auto", label: "Автоматические" },
            { v: "pocket", label: "Карманные" },
          ]}
        />
        <Select value={String(brand)} onChange={setBrand} label="Бренд">
          <option value="all">Все бренды</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </Select>
        {shape === "round" && (
          <Select
            value={String(size)}
            onChange={(v) => setSize(v === "all" ? "all" : Number(v))}
            label="Диаметр поля под клише"
          >
            <option value="all">Любой диаметр</option>
            {ROUND_SIZES.map((s) => (
              <option key={s} value={s}>Ø{s} мм</option>
            ))}
          </Select>
        )}
        <span className="ml-auto text-[12.5px]" style={{ color: muted(55) }}>
          найдено: {list.length}
        </span>
      </div>

      {list.length === 0 ? (
        <p className="text-[14px]" style={{ color: muted(62) }}>
          Под такие условия ничего нет — снимите часть фильтров.
        </p>
      ) : (
        <>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 210px), 1fr))" }}>
            {shown.map((m) => (
              <MountCard key={m.id} m={m} />
            ))}
          </div>
          {shown.length < list.length && (
            <div className="mt-4 flex justify-center">
              <button type="button" className="btn btn-secondary px-5 py-2.5 text-[14px]" onClick={() => setLimit((l) => l + 12)}>
                Показать ещё {Math.min(12, list.length - shown.length)}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MountCard({ m }: { m: Mount }) {
  return (
    <div className="card flex flex-col gap-3 p-4" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="relative">
        <MountPhoto m={m} className="mount-photo--card" />
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-[3px] text-[10.5px] font-semibold"
          style={{ background: "color-mix(in srgb, #10121c 8%, transparent)", color: "#5b6070" }}
        >
          {m.brand}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[14.5px] font-semibold">{m.model}</span>
        <span className="text-[12.5px]" style={{ color: muted(65) }}>
          {KIND_LABEL[m.kind]} · {sizeLabel(m)}
        </span>
        {m.material && (
          <span className="text-[12px]" style={{ color: muted(52) }}>
            {m.material}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-semibold">{m.price.toLocaleString("ru-RU")} ₽</span>
        <span className="text-[11.5px]" style={{ color: muted(52) }}>
          с клише
        </span>
      </div>
    </div>
  );
}

/** Селект в стиле набора: пилюля со своим шевроном вместо системного. */
function Select({
  value, onChange, label, children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="select-wrap">
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {children}
      </select>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

function Chips<T extends string>({
  value, onChange, items,
}: {
  value: string;
  onChange: (v: T) => void;
  items: { v: T; label: string }[];
}) {
  return (
    <div
      className="flex gap-1 rounded-full border border-[var(--color-divider)] p-[3px]"
      style={{ background: "color-mix(in srgb, var(--color-text) 3%, transparent)" }}
    >
      {items.map((i) => (
        <button
          key={i.v}
          type="button"
          onClick={() => onChange(i.v)}
          aria-pressed={value === i.v}
          className="rounded-full px-[13px] py-[6px] text-[12.5px]"
          style={
            value === i.v
              ? { background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }
              : { color: muted(60) }
          }
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
