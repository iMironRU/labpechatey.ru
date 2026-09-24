"use client";

import home from "@/content/home.json";
import HeroStamp from "@/components/HeroStamp";
import { IconArrowRight, IconCat } from "@/components/Icons";
import { asset } from "@/lib/paths";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/** Главная страница: герой, шаги заказа, ситуации, доверие, услуги, отзывы, футер. */
export default function Home({ onPick, onStart }: {
  onPick: (kind: string, situation: string) => void;
  onStart: () => void;
}) {
  return (
    <>
      <div id="top" className="mx-auto w-full" style={{ maxWidth: 1200, padding: "0 clamp(18px,4vw,56px)" }}>
        {/* ——— герой ——— */}
        <section
          // колонки классом, а не в style: скрытая правая колонка всё равно
          // держала трек, и на телефоне текст жался в половину ширины
          className="grid items-center grid-cols-1 min-[861px]:grid-cols-[1.05fr_.95fr]"
          style={{
            gap: "clamp(28px,4vw,64px)",
            padding: "clamp(40px,6vw,84px) 0 clamp(30px,4vw,56px)",
          }}
          data-hero
        >
          <div>
            <span
              className="mb-5 inline-flex items-center gap-[9px] text-[12.5px] uppercase tracking-[0.06em]"
              style={{ color: "var(--color-accent-300)" }}
            >
              <span className="h-px w-[26px] bg-current" />
              {home.hero.kicker}
            </span>
            <h1
              className="m-0 font-semibold"
              style={{ fontSize: "clamp(36px,5vw,60px)", lineHeight: 1.04, letterSpacing: "-0.02em", textWrap: "balance" }}
            >
              {home.hero.title}
            </h1>
            <p className="mt-[22px] text-[17px] leading-[1.6]" style={{ maxWidth: "46ch", color: muted(78) }}>
              {home.hero.lead}
            </p>
            <div className="mt-7 flex flex-wrap gap-3 max-[860px]:hidden">
              <button type="button" className="btn btn-primary px-[22px] py-3 text-[15px]" onClick={onStart}>
                {home.hero.cta}
                <IconArrowRight />
              </button>
            </div>
          </div>

          <div className="hidden place-items-center min-[861px]:grid">
            <div className="relative aspect-square" style={{ width: "min(340px, 80vw)" }}>
              <div
                className="absolute rounded-full"
                style={{
                  inset: "-6%",
                  background:
                    "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--ink) 16%, transparent), transparent 62%)",
                }}
              />
              <div className="relative animate-[stampIn_.9s_cubic-bezier(.2,.8,.2,1)_both]" style={{ color: "var(--ink)" }}>
                <HeroStamp />
              </div>
            </div>
          </div>
        </section>

        {/* ——— как проходит заказ ——— */}
        <section
          id="steps"
          className="rounded-2xl"
          style={{
            background: "var(--color-surface)",
            boxShadow: "var(--shadow-sm)",
            padding: "clamp(22px,3vw,32px) clamp(24px,3vw,38px)",
          }}
        >
          <span className="text-[12.5px] uppercase tracking-[0.06em]" style={{ color: "var(--color-accent-300)" }}>
            {home.stepsTitle}
          </span>
          <div
            className="mt-[18px] grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" }}
          >
            {home.steps.map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <span
                  className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-[14px] font-semibold"
                  style={{ color: "var(--ink)", border: "1px solid var(--ink)" }}
                >
                  {s.n}
                </span>
                <div className="flex flex-col gap-[3px]">
                  <span className="text-[14.5px] font-semibold">{s.t}</span>
                  <span className="text-[12.5px] leading-[1.45]" style={{ color: muted(65) }}>
                    {s.d}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-0 border-t border-[var(--color-divider)]" style={{ margin: "clamp(30px,4vw,54px) 0" }} />

        {/* ——— ситуации ——— */}
        <section id="cat" className="mt-[clamp(40px,5vw,64px)]" style={{ scrollMarginTop: 80 }}>
          <p className="m-0 mb-[22px] text-[15px]" style={{ color: muted(66) }}>
            {home.catsLead}
          </p>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 258px), 1fr))" }}>
            {home.cats.map((c) => (
              <button
                key={c.sit}
                type="button"
                onClick={() => onPick(c.kind, c.sit)}
                className="card flex w-full cursor-pointer flex-col items-start gap-3 border-0 p-[18px] text-left transition-transform hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <span
                  className="grid h-[38px] w-[38px] place-items-center rounded-[9px]"
                  style={{ background: "var(--color-accent-800)", color: "var(--color-accent-100)" }}
                >
                  <IconCat name={c.icon} />
                </span>
                <span className="text-[17px] font-semibold leading-[1.15]">{c.title}</span>
                <span className="flex-1 text-[13px] leading-[1.5]" style={{ color: muted(70) }}>
                  {c.desc}
                </span>
                <span className="flex w-full items-center justify-between text-[12.5px]" style={{ color: muted(60) }}>
                  <span>{c.price}</span>
                  <span className="inline-flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
                    Собрать
                    <IconArrowRight size={13} width={2} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ——— почему мы ——— */}
        <section
          className="mt-[clamp(46px,6vw,72px)] rounded-2xl"
          style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-sm)", padding: "clamp(24px,3vw,38px)" }}
        >
          <div className="grid gap-[22px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))" }}>
            {home.badges.map((b) => (
              <div key={b.title} className="flex flex-col gap-[9px]">
                <span
                  className="grid h-[42px] w-[42px] place-items-center rounded-[11px] border border-[var(--color-divider)]"
                  style={{ color: "var(--ink)" }}
                >
                  <IconCat name={b.icon} />
                </span>
                <span className="text-[16px] font-semibold">{b.title}</span>
                <span className="text-[13px] leading-[1.5]" style={{ color: muted(68) }}>
                  {b.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ——— услуги ——— */}
        {/* ——— услуги ——— */}
        <section id="services" className="mt-[clamp(46px,6vw,72px)]" style={{ scrollMarginTop: 80 }}>
          <h2 className="m-0 mb-1.5 font-semibold" style={{ fontSize: "clamp(24px,3vw,34px)", letterSpacing: "-0.015em" }}>
            {home.servicesTitle}
          </h2>
          <p className="mb-6 mt-0 text-[15px]" style={{ color: muted(66) }}>
            {home.servicesLead}
          </p>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))" }}>
            {home.services.map((s) => (
              <div
                key={s.title}
                className="flex flex-col gap-2.5 rounded-[12px] border border-[var(--color-divider)] p-[18px] transition-colors hover:border-[var(--color-accent)]"
              >
                <span style={{ color: "var(--ink)" }}>
                  <IconCat name={s.icon} />
                </span>
                <span className="text-[15.5px] font-semibold">{s.title}</span>
                <span className="text-[12.5px] leading-[1.45]" style={{ color: muted(66) }}>
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ——— отзывы ——— */}
        <section className="mt-[clamp(46px,6vw,72px)]">
          <div className="grid items-stretch gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
            <div
              className="flex flex-col justify-center gap-2 rounded-[14px] p-6"
              style={{ background: "var(--color-accent-800)", color: "var(--color-accent-100)" }}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[46px] font-semibold leading-none">{home.rating.value}</span>
                <span className="inline-flex gap-[2px]">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={15} />
                  ))}
                </span>
              </div>
              <span className="text-[13.5px] opacity-90">{home.rating.note}</span>
            </div>
            {home.reviews.map((r) => (
              <div key={r.who} className="card flex flex-col gap-3 p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
                <span className="inline-flex gap-[2px]" style={{ color: "var(--ink)" }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={13} />
                  ))}
                </span>
                <span className="text-[14px] leading-[1.55]" style={{ color: muted(82) }}>
                  {r.text}
                </span>
                <span className="mt-auto text-[12.5px]" style={{ color: muted(58) }}>
                  {r.who}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ——— финальный призыв ——— */}
        <section
          className="mt-[clamp(46px,6vw,72px)] text-center"
          style={{
            borderRadius: 18,
            background: "linear-gradient(180deg, color-mix(in srgb, var(--ink) 10%, var(--color-surface)), var(--color-surface))",
            boxShadow: "var(--shadow-sm)",
            padding: "clamp(30px,5vw,54px)",
          }}
        >
          <h2 className="m-0 mb-2.5 font-semibold" style={{ fontSize: "clamp(24px,3.2vw,36px)", letterSpacing: "-0.015em" }}>
            {home.final.title}
          </h2>
          <p className="mx-auto mb-6 mt-0 max-w-[52ch] text-[15.5px]" style={{ color: muted(70) }}>
            {home.final.lead}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-primary px-[22px] py-3 text-[15px]" onClick={onStart}>
              {home.final.cta}
            </button>
            <a href={home.phoneHref} className="btn btn-secondary px-[22px] py-3 text-[15px] no-underline">
              {home.final.callPrefix} {home.phone}
            </a>
          </div>
        </section>
      </div>

      {/* ——— футер ——— */}
      <footer
        id="footer"
        className="mt-[clamp(46px,6vw,72px)] border-t border-[var(--color-divider)] max-[860px]:pb-[calc(76px+env(safe-area-inset-bottom))]"
        style={{ scrollMarginTop: 80, background: "color-mix(in srgb, var(--color-text) 3%, var(--color-bg))" }}
      >
        <div
          className="mx-auto grid gap-7"
          style={{
            maxWidth: 1200,
            padding: "clamp(30px,4vw,52px) clamp(18px,4vw,56px) 30px",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
          }}
        >
          <div className="flex flex-col gap-3">
            <img
              src={asset(home.logo)}
              alt={home.brand}
              className="dark-invert"
              style={{ height: 38, width: "auto", maxWidth: 210, objectFit: "contain" }}
            />
            <span className="text-[13px] leading-[1.55]" style={{ color: muted(60) }}>
              {home.footer.about}
            </span>
          </div>

          {home.footer.cols.map((col) => (
            <div key={col.title} className="flex flex-col gap-2">
              <span
                className="mb-0.5 text-[11px] uppercase tracking-[0.08em]"
                style={{ color: muted(50) }}
              >
                {col.title}
              </span>
              {/* «Каталог» — ссылки полным цветом, «Как заказать» — просто текст */}
              {col.items.map((it) =>
                col.title === "Каталог" ? (
                  <a key={it} href="#cat" className="text-[13.5px] no-underline" style={{ color: "inherit" }}>
                    {it}
                  </a>
                ) : (
                  <span key={it} className="text-[13.5px]" style={{ color: muted(72) }}>
                    {it}
                  </span>
                ),
              )}
            </div>
          ))}

          <div className="flex flex-col gap-2.5">
            <span className="mb-0.5 text-[11px] uppercase tracking-[0.08em]" style={{ color: muted(50) }}>
              {home.footer.contactsTitle}
            </span>
            <a href={home.phoneHref} className="text-[18px] font-semibold no-underline" style={{ color: "inherit" }}>
              {home.phone}
            </a>
            <div className="flex gap-2">
              {home.footer.messengers.map((m) => (
                <a key={m} href="https://t.me/" className="btn btn-secondary px-3 py-2 text-[13px] no-underline">
                  {m}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mx-auto flex flex-wrap justify-between gap-x-5 gap-y-2.5 border-t border-[var(--color-divider)] text-[12px]"
          style={{ maxWidth: 1200, padding: "16px clamp(18px,4vw,56px)", color: muted(52) }}
        >
          <span>{home.footer.legal}</span>
          <span className="flex flex-wrap gap-[18px]">
            {home.footer.links.map((l) => (
              <a key={l} href="#footer" className="underline" style={{ color: "inherit" }}>
                {l}
              </a>
            ))}
          </span>
        </div>
      </footer>

      {/* ——— нижняя панель на телефоне (макет «Главная», ≤860px):
          позвонить · «Заказать за 1 час» · конструктор · Telegram ——— */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 grid items-center gap-2 border-t border-[var(--color-divider)] min-[861px]:hidden"
        style={{
          gridTemplateColumns: "auto 1fr auto auto",
          padding: "9px 12px calc(9px + env(safe-area-inset-bottom))",
          background: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
          backdropFilter: "blur(10px)",
        }}
      >
        <a href={home.phoneHref} aria-label="Позвонить" className="btn btn-secondary h-11 w-11 p-0">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M6 3h3l2 5-2 1a12 12 0 006 6l1-2 5 2v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z" />
          </svg>
        </a>
        <button type="button" className="btn btn-primary h-11 text-[14.5px]" onClick={onStart}>
          {home.stickyCta}
        </button>
        <button
          type="button"
          aria-label="Конструктор"
          className="btn btn-secondary h-11 w-11 p-0"
          onClick={onStart}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="3.4" />
          </svg>
        </button>
        <a href="https://t.me/" aria-label="Telegram" className="btn btn-secondary h-11 w-11 p-0">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M21 4L3 11l5.4 2.2L18 6.5l-7 8.2v4l3-3.4 3.4 2.5z" />
          </svg>
        </a>
      </div>
    </>
  );
}

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.6 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
    </svg>
  );
}
