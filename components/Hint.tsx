"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Контекстная справка: кружок с вопросом, по нажатию — выноска с текстом.
 *
 * Закрывается от любого следующего действия — клика мимо, Esc, прокрутки:
 * так описал поведение дизайнер. Абзацы разделяем переводом строки в тексте,
 * чтобы содержимое целиком жило в content/*.json, а не в разметке.
 */
export default function Hint({ text, label = "Что это" }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", () => setOpen(false), { once: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <span ref={box} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-[17px] w-[17px] flex-none place-items-center rounded-full border text-[11px] leading-none"
        style={{
          borderColor: open ? "var(--color-accent)" : "var(--color-divider)",
          color: open ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 55%, transparent)",
        }}
      >
        ?
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute z-[70] block w-[min(320px,78vw)] rounded-[10px] p-3 text-[12.5px] leading-[1.5]"
          style={{
            top: "calc(100% + 7px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-text)",
            color: "var(--color-bg)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {text.split("\n").map((line, i) => (
            <span key={i} className="block" style={{ marginTop: i ? 7 : 0 }}>
              {line}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
