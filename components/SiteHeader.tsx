"use client";

import { useEffect, useState } from "react";
import home from "@/content/home.json";
import texts from "@/content/constructor.json";
import { asset } from "@/lib/paths";
import { IconArrowLeft } from "@/components/Icons";

/** Шапка сайта: липкая, с размытием фона и переключателем темы. */
/**
 * Шапка. На экранах конструктора она короткая — как в макете
 * «Конструктор.dc.html»: логотип, «На главную», телефон и переключатель темы.
 */
export default function SiteHeader({ onHome, onConstructor }: {
  onHome?: () => void;
  onConstructor?: () => void;
} = {}) {
  const [dark, setDark] = useState(false);
  // логотип лежит на стороннем домене: если не отдастся, показываем текст
  const [logoFailed, setLogoFailed] = useState(false);

  // атрибут уже проставлен скриптом в <head> — здесь только читаем его
  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--color-divider)]"
      style={{
        backdropFilter: "saturate(1.4) blur(10px)",
        background: "color-mix(in srgb, var(--color-bg) 82%, transparent)",
      }}
    >
      <div
        className="mx-auto flex items-center gap-3 min-[861px]:gap-[22px]"
        style={{ maxWidth: 1200, padding: "12px clamp(18px,4vw,56px)" }}
      >
        <a href="/" onClick={onHome ? (e) => { e.preventDefault(); onHome(); } : undefined} className="mr-auto flex items-center gap-[11px] no-underline" style={{ color: "var(--color-text)" }}>
          {logoFailed ? (
            <span className="text-[15px] font-semibold leading-[1.1]">
              Лаборатория
              <br />
              Печатей
            </span>
          ) : (
            <img
              src={asset(home.logo)}
              alt={home.brand}
              onError={() => setLogoFailed(true)}
              // на узких экранах логотип и телефон вместе не влезали — логотип уступает
              className="dark-invert"
              style={{ height: 40, width: "auto", maxWidth: "min(42vw, 220px)", objectFit: "contain" }}
            />
          )}
        </a>

        <nav className="hidden items-center gap-5 min-[861px]:flex" hidden={Boolean(onHome)}>
          {home.nav.map((n) =>
            n.href === "#constructor" ? (
              <button key={n.label} type="button" onClick={onConstructor} className="text-[14px]">
                {n.label}
              </button>
            ) : (
              <a key={n.label} href={n.href} className="text-[14px] no-underline" style={{ color: "inherit" }}>
                {n.label}
              </a>
            ),
          )}
        </nav>

        {onHome && (
          <button
            type="button"
            onClick={onHome}
            className="hidden items-center gap-[6px] text-[14px] min-[861px]:inline-flex"
          >
            <IconArrowLeft size={15} width={1.7} />
            {texts.choose.backHome}
          </button>
        )}

        <a
          href="/#footer"
          hidden={Boolean(onHome)}
          className="hidden items-center gap-[5px] whitespace-nowrap rounded-full border border-[var(--color-divider)] px-2.5 py-[5px] text-[12.5px] no-underline min-[861px]:flex"
          style={{ color: "inherit" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.4" />
          </svg>
          {home.pvz}
        </a>

        <a
          href={home.phoneHref}
          className="whitespace-nowrap text-[13.5px] font-semibold no-underline min-[861px]:text-[14.5px]"
          style={{ color: "inherit" }}
        >
          {home.phone}
        </a>

        <a
          href="https://t.me/"
          aria-label="Telegram"
          hidden={Boolean(onHome)}
          className="hidden h-[34px] w-[34px] flex-none place-items-center rounded-[8px] border border-[var(--color-divider)] no-underline min-[861px]:grid"
          style={{ color: "inherit" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M21 4L3 11l5.4 2.2L18 6.5l-7 8.2v4l3-3.4 3.4 2.5z" />
          </svg>
        </a>

        <button
          type="button"
          onClick={toggle}
          aria-label="Сменить тему"
          className="grid h-[34px] w-[34px] flex-none cursor-pointer place-items-center rounded-[8px] border border-[var(--color-divider)] bg-transparent"
          style={{ color: "inherit" }}
        >
          {dark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
