"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fill, rank, type Scored, type TemplateIndex, type Values, type Kind } from "@/lib/stamp";
import { asset } from "@/lib/paths";
import { IconChevronLeft, IconChevronRight, IconGrid, IconUpload } from "@/components/Icons";

type Props = {
  index: TemplateIndex[];
  kind: Kind;
  values: Values;
  chosen: string | null;
  onChoose: (id: string) => void;
  onVariants?: (list: Scored[]) => void;
  filled: boolean;
  /** режим «свой макет» — вместо превью показываем загрузку файла */
  own: boolean;
  onOwn: (v: boolean) => void;
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
  index, kind, values, chosen, onChoose, onVariants, filled, own, onOwn,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState(false);
  const input = useRef<HTMLInputElement>(null);
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
    // в макете блок превью не ниже 430px, иначе карточка «подпрыгивает»
    // при смене макета и выглядит мельче соседней колонки
    <div className="flex min-h-[430px] flex-col gap-3">
      {!own && (
      <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold">{current?.tpl.title ?? "Макет"}</span>
        <span className="text-[12px] text-[color-mix(in_srgb,var(--color-text)_48%,transparent)]">
          {usable.length ? `${position} / ${usable.length}` : "—"}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center gap-3">
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

      {/* ряд миниатюр: макеты, загрузка своего и «посмотреть все» — по макету */}
      <div className="flex items-center gap-2 border-t border-[var(--color-divider)] pt-3">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-[2px]">
          {usable.map((v) => (
            <button
              key={v.tpl.id}
              type="button"
              title={`${v.tpl.title} · Ø${v.tpl.diameterMm} мм`}
              onClick={() => onChoose(v.tpl.id)}
              aria-pressed={v.tpl.id === chosen}
              className="grid h-[54px] w-[54px] flex-none place-items-center rounded-[10px] border-[1.5px] p-[6px]"
              style={{
                borderColor: v.tpl.id === chosen ? "var(--color-accent)" : "var(--color-divider)",
                background: "var(--color-surface)",
              }}
            >
              <StampThumb file={v.tpl.file} values={v.values} />
            </button>
          ))}
          <button
            type="button"
            title="Загрузить свой макет"
            aria-label="Загрузить свой макет"
            onClick={() => onOwn(true)}
            className="grid h-[54px] w-[54px] flex-none place-items-center rounded-[10px] border-[1.5px] border-[var(--color-divider)] hover:border-[var(--color-accent)]"
            style={{ background: "var(--color-surface)", color: "var(--color-accent)" }}
          >
            <IconUpload />
          </button>
        </div>
        <button
          type="button"
          title="Посмотреть все"
          aria-label="Посмотреть все"
          onClick={() => setGallery(true)}
          disabled={!usable.length}
          className="grid h-[54px] w-[54px] flex-none place-items-center rounded-[10px] border-[1.5px] border-[var(--color-divider)] hover:border-[var(--color-accent)] disabled:opacity-40"
          style={{ background: "var(--color-surface)" }}
        >
          <IconGrid />
        </button>
      </div>
      </>
      )}

      {/* режим «свой макет» */}
      {own && (
        <div className="flex flex-1 flex-col">
          <input
            ref={input}
            type="file"
            accept=".pdf,.png,.svg,.cdr,image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files?.[0] ?? null); }}
            className="flex w-full flex-1 flex-col items-center justify-center gap-[9px] rounded-[13px] border-[1.5px] border-dashed p-[18px]"
            style={{ minHeight: 300, borderColor: "color-mix(in srgb, var(--color-accent) 55%, transparent)" }}
          >
            <span style={{ color: "var(--color-accent)" }}>
              <IconUpload size={34} width={1.4} />
            </span>
            {file ? (
              <>
                <b className="max-w-full truncate text-[15px]">{file.name}</b>
                <span className="text-center text-[12.5px] leading-[1.5] text-[color-mix(in_srgb,var(--color-text)_58%,transparent)]">
                  {(file.size / 1024).toFixed(0)} КБ · нажмите, чтобы заменить файл
                </span>
              </>
            ) : (
              <>
                <b className="text-[15px]">Загрузить свой макет</b>
                <span className="text-center text-[12.5px] leading-[1.5] text-[color-mix(in_srgb,var(--color-text)_58%,transparent)]">
                  Готовый файл оттиска — PDF, PNG, SVG или CDR.
                  <br />
                  Перетащите сюда или выберите на устройстве.
                </span>
              </>
            )}
          </button>
          <div className="mt-3 flex items-center justify-between gap-[10px]">
            <span className="text-[12.5px] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)]">
              Хотите готовый шаблон?
            </span>
            <button type="button" className="btn btn-ghost px-3 py-[7px] text-[13px]" onClick={() => onOwn(false)}>
              Выбрать стандартный
            </button>
          </div>
        </div>
      )}

      {/* «Посмотреть все»: те же макеты крупнее */}
      {gallery && (
        <>
          <div className="sheet-backdrop" onClick={() => setGallery(false)} />
          <div className="modal" role="dialog" aria-label="Все макеты">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[17px] font-semibold">Все подходящие макеты</span>
              <button type="button" className="btn btn-ghost px-3 py-[7px] text-[13px]" onClick={() => setGallery(false)}>
                Закрыть
              </button>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              {usable.map((v) => (
                <button
                  key={v.tpl.id}
                  type="button"
                  onClick={() => { onChoose(v.tpl.id); setGallery(false); }}
                  aria-pressed={v.tpl.id === chosen}
                  className="flex flex-col items-center gap-2 rounded-[12px] border-[1.5px] p-3"
                  style={{
                    borderColor: v.tpl.id === chosen ? "var(--color-accent)" : "var(--color-divider)",
                    background: "var(--color-surface)",
                  }}
                >
                  <span className="grid h-[104px] w-[104px] place-items-center">
                    <StampThumb file={v.tpl.file} values={v.values} />
                  </span>
                  <span className="text-center text-[12px] leading-[1.35]">{v.tpl.title}</span>
                  <span className="text-[11.5px] text-[color-mix(in_srgb,var(--color-text)_52%,transparent)]">
                    Ø{v.tpl.diameterMm} мм
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

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
