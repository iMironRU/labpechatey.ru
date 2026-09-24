"use client";

import { useState } from "react";
import Link from "next/link";
import services from "@/content/services.json";
import home from "@/content/home.json";
import SiteHeader from "@/components/SiteHeader";
import { IconArrowRight, IconCat, IconCheck, IconChevronDown } from "@/components/Icons";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

type Service = (typeof services)[keyof typeof services];

/**
 * Страница услуги — по макетам «Услуга — …».
 *
 * Все пять услуг лежат в одном файле данных, как в прототипе: отличаются
 * только содержимым, поэтому страница одна, а маршруты разные.
 */
export default function ServicePage({ slug }: { slug: string }) {
  const list = Object.values(services) as Service[];
  const s = list.find((x) => x.slug === slug) ?? list[0];
  const others = list.filter((x) => x.slug !== s.slug);

  const [faq, setFaq] = useState(0);
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [file, setFile] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full flex-1" style={{ maxWidth: 1200, padding: "0 clamp(18px,4vw,56px)" }}>
        {/* ——— переключатель услуг ——— */}
        <div className="rail flex gap-2 pt-[18px]">
          {list.map((t) => (
            <Link
              key={t.slug}
              href={`/uslugi/${t.slug}`}
              className="flex flex-none items-center gap-2 rounded-full border px-[14px] py-2 text-[13.5px] no-underline transition-colors hover:border-[var(--color-accent)]"
              style={{
                borderColor: t.slug === s.slug ? "var(--color-accent)" : "var(--color-divider)",
                background: t.slug === s.slug ? "color-mix(in srgb, var(--color-accent) 8%, transparent)" : "transparent",
                color: t.slug === s.slug ? "var(--color-accent)" : "inherit",
              }}
            >
              <IconCat name={t.slug} size={16} />
              {t.title}
            </Link>
          ))}
        </div>

        {/* ——— герой ——— */}
        <section
          className="grid items-center grid-cols-1 min-[861px]:grid-cols-[1.1fr_.9fr]"
          style={{ gap: "clamp(28px,4vw,64px)", padding: "clamp(34px,5vw,64px) 0 clamp(30px,4vw,52px)" }}
        >
          <div>
            <span
              className="mb-[18px] inline-flex items-center gap-[9px] text-[12.5px] uppercase tracking-[0.06em]"
              style={{ color: "var(--color-accent-300)" }}
            >
              <span className="h-px w-[26px] bg-current" />
              {s.eyebrow}
            </span>
            <h1
              className="m-0 font-semibold"
              style={{ fontSize: "clamp(32px,4.4vw,52px)", lineHeight: 1.06, letterSpacing: "-0.02em", textWrap: "balance" }}
            >
              {s.h1}
            </h1>
            <p className="mt-5 max-w-[48ch] text-[17px] leading-[1.6]" style={{ color: muted(78) }}>
              {s.lead}
            </p>

            <div className="mt-[26px] flex flex-wrap gap-7">
              {s.facts.map((f) => (
                <div key={f.l} className="flex flex-col gap-0.5">
                  <span className="text-[20px] font-semibold">{f.v}</span>
                  <span className="text-[12.5px]" style={{ color: muted(62) }}>{f.l}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#order" className="btn btn-primary px-[22px] py-3 text-[15px] no-underline">
                {s.cta}
                <IconArrowRight />
              </a>
              <a href="#prices" className="btn btn-secondary px-[22px] py-3 text-[15px] no-underline">
                Цены
              </a>
            </div>
          </div>

          <div
            className="hidden flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-[var(--color-divider)] min-[861px]:flex"
            style={{ aspectRatio: "5 / 4", background: "color-mix(in srgb, var(--color-surface) 70%, transparent)", color: muted(50) }}
          >
            <span style={{ color: "var(--ink)", opacity: 0.7 }}>
              <IconCat name={s.slug} size={34} />
            </span>
            <span className="text-[13px]">{s.photo}</span>
          </div>
        </section>

        {/* ——— что можно заказать ——— */}
        <section id="prices" style={{ scrollMarginTop: 80 }}>
          <h2 className="m-0 mb-1.5 font-semibold" style={{ fontSize: "clamp(22px,2.6vw,30px)", letterSpacing: "-0.015em" }}>
            Что можно заказать
          </h2>
          <p className="mb-5 mt-0 text-[15px]" style={{ color: muted(66) }}>{s.pricesNote}</p>

          <div className="overflow-hidden rounded-[14px]" style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }}>
            {s.options.map((o, i) => (
              <div
                key={o.t}
                className="grid items-center gap-x-6 gap-y-1.5 px-[22px] py-4"
                style={{
                  gridTemplateColumns: "minmax(0,1fr) auto auto",
                  borderTop: i ? "1px solid var(--color-divider)" : "none",
                }}
              >
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <span className="text-[15.5px] font-semibold">{o.t}</span>
                  <span className="text-[13px] leading-[1.45]" style={{ color: muted(64) }}>{o.d}</span>
                </div>
                <span className="whitespace-nowrap text-[13px] max-[860px]:hidden" style={{ color: muted(60) }}>
                  {o.term}
                </span>
                <span className="whitespace-nowrap text-right text-[16px] font-semibold">{o.p}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ——— как работаем ——— */}
        <section
          className="mt-[clamp(40px,5vw,64px)] rounded-2xl"
          style={{
            background: "var(--color-surface)",
            boxShadow: "var(--shadow-sm)",
            padding: "clamp(22px,3vw,32px) clamp(24px,3vw,38px)",
          }}
        >
          <span className="text-[12.5px] uppercase tracking-[0.06em]" style={{ color: "var(--color-accent-300)" }}>
            Как работаем
          </span>
          <div className="mt-[18px] grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" }}>
            {s.steps.map((st) => (
              <div key={st.n} className="flex items-start gap-3">
                <span
                  className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-[14px] font-semibold"
                  style={{ color: "var(--ink)", border: "1px solid var(--ink)" }}
                >
                  {st.n}
                </span>
                <div className="flex flex-col gap-[3px]">
                  <span className="text-[14.5px] font-semibold">{st.t}</span>
                  <span className="text-[12.5px] leading-[1.45]" style={{ color: muted(65) }}>{st.d}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ——— что нужно от вас · вопросы ——— */}
        <section
          className="mt-[clamp(40px,5vw,64px)] grid grid-cols-1 items-start min-[861px]:grid-cols-2"
          style={{ gap: "clamp(24px,4vw,56px)" }}
        >
          <div>
            <h2 className="m-0 mb-4 font-semibold" style={{ fontSize: "clamp(20px,2.3vw,26px)", letterSpacing: "-0.01em" }}>
              {s.needTitle}
            </h2>
            <div className="flex flex-col gap-3">
              {s.need.map((n) => (
                <div key={n} className="flex items-start gap-3 text-[14.5px] leading-[1.5]">
                  <span className="mt-0.5 flex-none" style={{ color: "var(--ink)" }}>
                    <IconCheck size={18} width={1.8} />
                  </span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="m-0 mb-2.5 font-semibold" style={{ fontSize: "clamp(20px,2.3vw,26px)", letterSpacing: "-0.01em" }}>
              Частые вопросы
            </h2>
            {s.faq.map((q, i) => (
              <div key={q.q} className="border-b border-[var(--color-divider)]">
                <button
                  type="button"
                  onClick={() => setFaq(faq === i ? -1 : i)}
                  aria-expanded={faq === i}
                  className="flex w-full items-center justify-between gap-4 py-[14px] text-left text-[15px] font-semibold"
                >
                  {q.q}
                  <span
                    className="flex-none transition-transform duration-200"
                    style={{ transform: faq === i ? "rotate(180deg)" : "none" }}
                  >
                    <IconChevronDown size={16} width={1.8} />
                  </span>
                </button>
                {faq === i && (
                  <p className="mb-4 mt-0 text-[14px] leading-[1.6]" style={{ color: muted(74) }}>
                    {q.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ——— заявка ——— */}
        <section
          id="order"
          className="mt-[clamp(40px,5vw,64px)]"
          style={{
            scrollMarginTop: 80,
            borderRadius: 18,
            background: "linear-gradient(180deg, color-mix(in srgb, var(--ink) 10%, var(--color-surface)), var(--color-surface))",
            boxShadow: "var(--shadow-sm)",
            padding: "clamp(26px,4vw,44px)",
          }}
        >
          {sent ? (
            <div className="flex items-start gap-4">
              <span
                className="grid h-[42px] w-[42px] flex-none place-items-center rounded-full"
                style={{ border: "1px solid var(--ink)", color: "var(--ink)" }}
              >
                <IconCheck size={20} width={1.8} />
              </span>
              <div>
                <h2 className="m-0 mb-1.5 text-[24px] font-semibold">Заявка принята</h2>
                <p className="m-0 text-[15px]" style={{ color: muted(72) }}>
                  Перезвоним на {tel} в течение 15 минут.{" "}
                  <button type="button" className="underline" style={{ color: "var(--color-accent)" }}
                    onClick={() => { setSent(false); setName(""); setTel(""); setFile(""); }}>
                    Отправить ещё одну
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="m-0 mb-2 font-semibold" style={{ fontSize: "clamp(22px,2.8vw,32px)", letterSpacing: "-0.015em" }}>
                {s.formTitle}
              </h2>
              <p className="mb-[22px] mt-0 max-w-[56ch] text-[15px]" style={{ color: muted(70) }}>
                Перезвоним в течение 15 минут в рабочее время, уточним детали и назовём точную цену.
              </p>

              <form
                onSubmit={(e) => { e.preventDefault(); if (tel.trim()) setSent(true); }}
                className="grid items-end gap-3.5"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}
              >
                <label className="field m-0">
                  <span>Имя</span>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Как к вам обращаться" />
                </label>
                <label className="field m-0">
                  <span>Телефон</span>
                  <input className="input" type="tel" required value={tel} onChange={(e) => setTel(e.target.value)}
                    placeholder="+7 (___) ___-__-__" />
                </label>
                <label
                  className="flex h-10 cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg border border-dashed border-[var(--color-divider)] px-3.5 text-[13.5px]"
                  style={{ color: muted(72) }}
                >
                  <IconCat name="clip" size={16} />
                  <span className="truncate">{file || s.fileHint}</span>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />
                </label>
                <button type="submit" className="btn btn-primary h-10 text-[14.5px]">
                  Отправить заявку
                </button>
              </form>

              <p className="m-0 mt-3.5 text-[12px]" style={{ color: muted(55) }}>
                Нажимая «Отправить», вы соглашаетесь с политикой конфиденциальности.
              </p>
            </>
          )}
        </section>

        {/* ——— другие услуги ——— */}
        <section className="mt-[clamp(40px,5vw,64px)]">
          <h2 className="m-0 mb-4 font-semibold" style={{ fontSize: "clamp(20px,2.3vw,26px)", letterSpacing: "-0.01em" }}>
            Другие услуги
          </h2>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))" }}>
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/uslugi/${o.slug}`}
                className="flex flex-col gap-2.5 rounded-[12px] border border-[var(--color-divider)] p-[18px] no-underline transition-colors hover:border-[var(--color-accent)]"
                style={{ color: "inherit" }}
              >
                <span style={{ color: "var(--ink)" }}>
                  <IconCat name={o.slug} size={22} />
                </span>
                <span className="text-[15.5px] font-semibold">{o.title}</span>
                <span className="text-[12.5px] leading-[1.45]" style={{ color: muted(66) }}>{o.desc}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer
        id="footer"
        className="mt-[clamp(46px,6vw,72px)] border-t border-[var(--color-divider)]"
        style={{ background: "color-mix(in srgb, var(--color-text) 3%, var(--color-bg))" }}
      >
        <div
          className="mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[13px]"
          style={{ maxWidth: 1200, padding: "24px clamp(18px,4vw,56px)", color: muted(60) }}
        >
          <span>© 2010–2026 Лаборатория печатей · Оренбург · 13 пунктов выдачи</span>
          <a href={home.phoneHref} className="text-[16px] font-semibold no-underline" style={{ color: "var(--color-text)" }}>
            {home.phone}
          </a>
        </div>
      </footer>
    </>
  );
}
