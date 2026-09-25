"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { convert, type Parsed } from "@/lib/designer";
import { fill, valuesFor } from "@/lib/stamp";
import { asset } from "@/lib/paths";
import { IconCheck, IconCross, IconUpload } from "@/components/Icons";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/** Данные для примерки: длинные, чтобы сразу видеть, где не хватает места. */
const SAMPLE = {
  org: "Ромашка",
  city: "Оренбург",
  inn: "5610100213",
  ogrn: "1105658001239",
};

/**
 * Приёмка макета печати от дизайнера.
 *
 * Работает целиком в браузере: файл никуда не уходит. Проверяем разметку
 * по документу с требованиями, собираем шаблон и тут же примеряем на нём
 * реальные реквизиты — так сразу видно, что не влезает.
 */
export default function DesignerPage() {
  const [res, setRes] = useState<Parsed | null>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<{ html: string; box: string } | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  async function take(file: File) {
    setName(file.name);
    if (/\.ai$/i.test(file.name)) {
      setRes({
        svg: "", fields: [], diameterMm: 0, meta: {},
        issues: [{
          level: "error",
          text: "Это .ai — исходник Illustrator, прочитать его в браузере нельзя. " +
                "Экспортируйте из него SVG (File → Export → Export As → SVG) и перетащите сюда.",
        }],
      });
      setPreview(null);
      return;
    }
    const parsed = convert(await file.text());
    setRes(parsed);
    if (!parsed.svg) { setPreview(null); return; }
    try {
      const values = valuesFor("ooo", SAMPLE);
      const filled = fill(parsed.svg, values, "var(--ink)");
      setPreview({ html: filled.svg.innerHTML, box: filled.svg.getAttribute("viewBox") || "" });
      setNotes(filled.notes);
    } catch {
      setPreview(null);
      setNotes(["Шаблон собрался, но примерить данные не вышло — посмотрите замечания выше."]);
    }
  }

  useEffect(() => {
    const stop = (e: DragEvent) => { e.preventDefault(); };
    const drop = (e: DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f) void take(f);
    };
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", drop);
    return () => { window.removeEventListener("dragover", stop); window.removeEventListener("drop", drop); };
  }, []);

  const download = () => {
    if (!res?.svg) return;
    const blob = new Blob([res.svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name.replace(/\.svg$/i, "") + "-шаблон.svg";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full flex-1" style={{ maxWidth: 1080, padding: "0 clamp(18px,4vw,56px) clamp(40px,5vw,64px)" }}>
        <h1 className="mb-2 mt-8 font-semibold" style={{ fontSize: "clamp(26px,3.4vw,38px)", letterSpacing: "-0.02em" }}>
          Приёмка макета печати
        </h1>
        <p className="mb-6 mt-0 max-w-[62ch] text-[15px]" style={{ color: muted(70) }}>
          Перетащите SVG-экспорт из Illustrator — проверим разметку полей, соберём
          шаблон и примерим на нём настоящие реквизиты. Файл остаётся у вас в
          браузере и никуда не отправляется. Требования — в{" "}
          <a href={asset("/docs/шаблоны-печатей-для-дизайнера.md")} style={{ color: "var(--color-accent)" }}>
            документе для дизайнера
          </a>.
        </p>

        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2.5 rounded-[13px] border-[1.5px] border-dashed p-8"
          style={{ borderColor: "color-mix(in srgb, var(--color-accent) 55%, transparent)" }}
        >
          <span style={{ color: "var(--color-accent)" }}><IconUpload size={34} width={1.4} /></span>
          <b className="text-[15px]">{name || "Выбрать или перетащить файл"}</b>
          <span className="text-[12.5px]" style={{ color: muted(58) }}>SVG из Illustrator · .ai прочитать нельзя</span>
        </button>
        <input ref={input} type="file" accept=".svg,image/svg+xml,.ai" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void take(f); }} />

        {res && (
          <div className="two-col mt-5">
            <section className="panel">
              <h2 className="m-0 mb-3 text-[17px] font-semibold">Что с разметкой</h2>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {res.issues.map((i, n) => (
                  <li key={n} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5]">
                    <span className="mt-0.5 flex-none" style={{
                      color: i.level === "error" ? "var(--warn)" : i.level === "warn" ? "var(--warn)" : "var(--ok)",
                    }}>
                      {i.level === "ok" ? <IconCheck size={16} width={2} /> : <IconCross size={13} width={2.4} />}
                    </span>
                    <span>{i.text}</span>
                  </li>
                ))}
              </ul>

              {res.fields.length > 0 && (
                <>
                  <h3 className="mb-2 mt-5 text-[15px] font-semibold">Поля</h3>
                  <div className="flex flex-col gap-2">
                    {res.fields.map((f) => (
                      <div key={f.key} className="flex items-baseline justify-between gap-3 border-b border-[var(--color-divider)] pb-2 text-[13px]">
                        <span className="font-semibold">f_{f.key}</span>
                        <span style={{ color: muted(62) }}>
                          {f.kind === "arc" ? `дуга R${f.radiusMm} мм · ${f.spanDeg}°` : `строка y=${f.y}`} · {f.size} мм
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {res.svg && (
                <button type="button" className="btn btn-primary mt-5 px-[22px] py-3 text-[15px]" onClick={download}>
                  Скачать шаблон
                </button>
              )}
            </section>

            <section className="panel flex flex-col">
              <h2 className="m-0 mb-3 text-[17px] font-semibold">Примерка на реквизитах</h2>
              <div className="stamp-paper grid flex-1 place-items-center p-4">
                {preview ? (
                  <svg viewBox={preview.box} style={{ width: "min(320px, 92%)", height: "auto" }}
                    dangerouslySetInnerHTML={{ __html: preview.html }} />
                ) : (
                  <span className="text-[13px]" style={{ color: "#5b6070" }}>
                    Пока нечего показать
                  </span>
                )}
              </div>
              {notes.length > 0 && (
                <ul className="m-0 mt-3 list-none p-0 text-[12.5px]" style={{ color: muted(62) }}>
                  {notes.map((n) => <li key={n}>— {n}</li>)}
                </ul>
              )}
              <p className="mb-0 mt-3 text-[12px]" style={{ color: muted(55) }}>
                Подставлены: ООО «Ромашка», Оренбург, ИНН {SAMPLE.inn}, ОГРН {SAMPLE.ogrn}.
              </p>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
