"use client";

import { IconCat } from "@/components/Icons";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

export type SourceId = "req" | "image" | "gallery";

/**
 * Строка «Источник данных: … сменить» с карточкой выбора — из макета
 * «Конструктор.dc.html». В макете источников четыре, четвёртый — «Свой
 * текст» для штампов; прямоугольных шаблонов штампов в библиотеке пока
 * нет, поэтому он не показывается, чтобы не вести в тупик.
 */
const SOURCES: { id: SourceId; title: string; desc: string; icon: string }[] = [
  { id: "req", title: "Ввести реквизиты", desc: "по ИНН", icon: "lines" },
  { id: "image", title: "Загрузить картинку", desc: "фото/скан оттиска", icon: "upload" },
  { id: "gallery", title: "Из галереи", desc: "готовые шаблоны", icon: "gallery" },
];

const LABEL: Record<SourceId, string> = {
  req: "ввод реквизитов",
  image: "загрузка картинки",
  gallery: "из галереи",
};

export default function SourceLine({
  value, open, onToggle, onPick,
}: {
  value: SourceId;
  open: boolean;
  onToggle: () => void;
  onPick: (id: SourceId) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-[10px] text-[12.5px]" style={{ color: muted(60) }}>
        <IconCat name="lines" size={15} />
        Источник данных:
        <b className="font-semibold" style={{ color: "var(--color-text)" }}>{LABEL[value]}</b>
        <button type="button" onClick={onToggle} className="text-[12.5px]" style={{ color: "var(--color-accent)" }}>
          сменить
        </button>
      </div>

      {open && (
        <div className="card grid gap-2 p-3" style={{ gridTemplateColumns: "1fr 1fr", boxShadow: "var(--shadow-sm)" }}>
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s.id)}
              className="flex items-center gap-[10px] rounded-[10px] border px-3 py-[11px] text-left"
              style={{
                borderColor: s.id === value ? "var(--color-accent)" : "var(--color-divider)",
                background: s.id === value ? "color-mix(in srgb, var(--color-accent) 9%, transparent)" : "transparent",
              }}
            >
              <span className="flex-none" style={{ color: "var(--color-accent)" }}>
                <IconCat name={s.icon} size={18} />
              </span>
              <span className="flex flex-col gap-px">
                <b className="text-[13.5px] font-semibold">{s.title}</b>
                <span className="text-[11.5px]" style={{ color: muted(60) }}>{s.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
