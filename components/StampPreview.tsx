"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fill, rank, type Scored, type TemplateIndex, type Values, type Kind } from "@/lib/stamp";
import { asset } from "@/lib/paths";
import { IconChevronLeft, IconChevronRight } from "@/components/Icons";

type Props = {
  index: TemplateIndex[];
  kind: Kind;
  values: Values;
  chosen: string | null;
  onChoose: (id: string) => void;
  onVariants?: (list: Scored[]) => void;
  filled: boolean;
};

const cache = new Map<string, string>();
async function templateSvg(file: string) {
  const name = file.split("/").pop()!;
  if (!cache.has(name)) {
    const res = await fetch(asset(`/templates/${name}`), { cache: "no-cache" });
    cache.set(name, await res.text());
  }
  return cache.get(name)!;
}

/**
 * Живое превью оттиска.
 *
 * Показываются только те макеты, куда данные реально легли: вердикт по
 * индексу — предварительный отсев, окончательно решает фактическая
 * отрисовка. Иначе в ленте висят варианты с обрезанным текстом.
 */
export default function StampPreview({
  index, kind, values, chosen, onChoose, onVariants, filled,
}: Props) {
  const [usable, setUsable] = useState<Scored[]>([]);
  const [markup, setMarkup] = useState<{ html: string; box: string } | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const token = useRef(0);

  const ranked = useMemo(() => rank(index, kind, values), [index, kind, values]);

  useEffect(() => {
    const my = ++token.current;
    (async () => {
      const list: Scored[] = [];
      for (const cand of ranked) {
        if (cand.verdict === "bad") continue;
        const text = await templateSvg(cand.tpl.file);
        if (my !== token.current) return;
        const res = fill(text, cand.values, "var(--ink)");
        if (res.grade === "bad") continue;
        list.push(cand);
      }
      if (my !== token.current) return;
      setUsable(list);
      onVariants?.(list);

      const pick = list.find((x) => x.tpl.id === chosen) || list[0];
      if (!pick) {
        setMarkup(null);
        setNotes([]);
        return;
      }
      if (pick.tpl.id !== chosen) onChoose(pick.tpl.id);
      const text = await templateSvg(pick.tpl.file);
      if (my !== token.current) return;
      const res = fill(text, pick.values, "var(--ink)");
      setMarkup({ html: res.svg.innerHTML, box: res.svg.getAttribute("viewBox") || "" });
      setNotes([...pick.notes, ...res.notes, ...(pick.dropped.length
        ? [`в этот макет не входит: ${pick.dropped.join(", ")}`] : [])]);
    })();
  }, [ranked, chosen, onChoose, onVariants]);

  const current = usable.find((x) => x.tpl.id === chosen) || usable[0];
  const position = current ? usable.indexOf(current) + 1 : 0;

  const step = (dir: number) => {
    if (!usable.length) return;
    const i = (usable.indexOf(current!) + dir + usable.length) % usable.length;
    onChoose(usable[i].tpl.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold">{current?.tpl.title ?? "Макет"}</span>
        <span className="text-[12px] text-[color-mix(in_srgb,var(--color-text)_48%,transparent)]">
          {usable.length ? `${position} / ${usable.length}` : "—"}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3" style={{ minHeight: 330 }}>
        <button
          type="button"
          aria-label="Предыдущий макет"
          onClick={() => step(-1)}
          disabled={usable.length < 2}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-divider)] disabled:opacity-40"
          style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}
        >
          <IconChevronLeft />
        </button>

        {markup ? (
          <svg
            viewBox={markup.box}
            style={{ width: "min(300px, 92%)", height: "auto", color: "var(--ink)", opacity: filled ? 1 : 0.42 }}
            dangerouslySetInnerHTML={{ __html: markup.html }}
          />
        ) : (
          <p className="max-w-[260px] text-center text-[13px] text-[color-mix(in_srgb,var(--color-text)_58%,transparent)]">
            Ни один макет не подходит под эти данные. Сократите наименование или
            выберите печать большего диаметра.
          </p>
        )}

        <button
          type="button"
          aria-label="Следующий макет"
          onClick={() => step(1)}
          disabled={usable.length < 2}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-divider)] disabled:opacity-40"
          style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}
        >
          <IconChevronRight />
        </button>
      </div>

      {notes.length > 0 && (
        <ul className="m-0 list-none p-0 text-[12px] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)]">
          {notes.map((n) => (
            <li key={n}>— {n}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-divider)] pt-3">
        {usable.map((v) => (
          <button
            key={v.tpl.id}
            type="button"
            title={`${v.tpl.title} · Ø${v.tpl.diameterMm} мм`}
            onClick={() => onChoose(v.tpl.id)}
            aria-pressed={v.tpl.id === chosen}
            className="grid h-[54px] w-[54px] place-items-center rounded-[10px] border-[1.5px] p-[6px]"
            style={{
              borderColor: v.tpl.id === chosen ? "var(--color-accent)" : "var(--color-divider)",
              background: "var(--color-surface)",
            }}
          >
            <StampThumb file={v.tpl.file} values={v.values} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function StampThumb({ file, values }: { file: string; values: Values }) {
  const [html, setHtml] = useState<{ html: string; box: string } | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const text = await templateSvg(file);
      if (!alive) return;
      const res = fill(text, values, "currentColor");
      setHtml({ html: res.svg.innerHTML, box: res.svg.getAttribute("viewBox") || "" });
    })();
    return () => { alive = false; };
  }, [file, values]);
  if (!html) return null;
  return (
    <svg viewBox={html.box} className="h-full w-full" style={{ color: "var(--ink)" }}
      dangerouslySetInnerHTML={{ __html: html.html }} />
  );
}
