"use client";

import { useEffect, useState } from "react";
import home from "@/content/home.json";
import { IconCat } from "@/components/Icons";

/**
 * «Не знаю — помогите»: кнопка-спасательный круг в углу и карточка с
 * контактами — из макета «Конструктор.dc.html». На телефоне круг не
 * показывается: там помощь зовут кнопкой из нижней панели.
 */
export default function HelpCard({ openOnMount = false, openSignal = 0 }: {
  openOnMount?: boolean;
  /** Счётчик нажатий снаружи: на телефоне помощь зовут из нижней панели. */
  openSignal?: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (openOnMount) setOpen(true);
  }, [openOnMount]);

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[22px] right-[22px] z-[60] inline-flex items-center gap-[9px] rounded-full border border-[var(--color-divider)] px-4 py-[11px] text-[14px] max-[860px]:hidden"
        style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-lg)" }}
      >
        <span style={{ color: "var(--color-accent)" }}>
          <IconCat name="help" size={18} />
        </span>
        Не знаю — помогите
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[70] grid p-[22px]"
          style={{ background: "rgba(10,11,18,.5)", placeItems: "end", animation: "fadeIn .2s ease" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-5"
            style={{ width: "min(340px, 90vw)", background: "var(--color-surface)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="text-[18px] font-semibold">Подскажем и соберём за вас</div>
            <p className="mb-[15px] mt-[7px] text-[13.5px] leading-[1.55] text-[color-mix(in_srgb,var(--color-text)_66%,transparent)]">
              Не уверены, что выбрать, — назовите ИНН или пришлите старый оттиск,
              остальное сделаем сами.
            </p>
            <a href={home.phoneHref} className="btn btn-primary btn-block mb-[9px]">
              Позвонить · {home.phone}
            </a>
            <a href="https://t.me/" className="btn btn-secondary btn-block">
              Написать в чат / WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}
