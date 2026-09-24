"use client";

import { useEffect, useState } from "react";
import catalog from "@/content/catalog.json";
import { IconChevronDown } from "@/components/Icons";

type KindItem = (typeof catalog.kinds)[number];

/**
 * Селектор типа печати: заголовок экрана + список.
 *
 * На десктопе список раскрывается под заголовком, на телефоне — нижним
 * листом, как в макете «Конструктор — реквизиты (моб)»: выпадашка шириной
 * 86vw на 390 px перекрывала пол-экрана и упиралась в края.
 */
export default function KindSelector({
  value, onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  const current = catalog.kinds.find((k) => k.id === value) ?? catalog.kinds[0];

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 560px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const items = catalog.kinds.filter((k) =>
    `${k.label} ${k.ent} ${k.note}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const groups = ["ИП", "ООО"].map((ent) => ({ ent, list: items.filter((i) => i.ent === ent) }));

  const pick = (k: KindItem) => {
    onChange(k.id);
    setOpen(false);
    setQuery("");
  };

  const panel = (
    <>
      <input
        className="input mb-2"
        placeholder="Поиск: ИП, ООО, копия…"
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-[320px] overflow-auto">
        {groups.map(({ ent, list }) =>
          list.length ? (
            <div key={ent} className="mb-1">
              <div className="px-2 py-1 text-[11px] uppercase tracking-[0.06em] text-[color-mix(in_srgb,var(--color-text)_48%,transparent)]">
                {ent}
              </div>
              {list.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => pick(k)}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left"
                  style={{
                    background:
                      k.id === value
                        ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
                        : "transparent",
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[13px] font-semibold"
                    style={{ background: "var(--color-accent-800)", color: "var(--color-accent-100)" }}
                  >
                    {k.ent === "ИП" ? "ИП" : "ОО"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{k.label}</span>
                    <span className="block truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)]">
                      {k.note}
                    </span>
                  </span>
                  {k.id === value && <span className="text-[var(--color-accent)]">✓</span>}
                </button>
              ))}
            </div>
          ) : null,
        )}
      </div>
    </>
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <h1
          className="m-0 font-semibold"
          style={{ fontSize: "clamp(26px,3.4vw,40px)", lineHeight: 1.04, letterSpacing: "-0.02em" }}
        >
          {current.title}
        </h1>
        <button
          type="button"
          aria-label="Выбрать тип печати"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-divider)] text-[var(--color-accent)]"
        >
          <IconChevronDown />
        </button>
      </div>

      {open && (mobile ? (
        <>
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet" role="dialog" aria-label="Тип печати">
            <div className="sheet-handle" />
            {panel}
          </div>
        </>
      ) : (
        <>
          {/* клик вне закрывает: прозрачный слой во весь экран */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute z-20 rounded-[14px] border border-[var(--color-divider)] bg-[var(--color-surface)] p-3"
            style={{ top: "calc(100% + 10px)", width: "min(420px, 86vw)", boxShadow: "var(--shadow-lg)" }}
          >
            {panel}
          </div>
        </>
      ))}
    </div>
  );
}
