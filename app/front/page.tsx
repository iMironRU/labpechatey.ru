"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import front from "@/content/front.json";
import FrontBlueprint from "@/components/FrontBlueprint";
import { asset } from "@/lib/paths";

/**
 * Первый экран по макету дизайнера (page-front.pdf), отдельной страницей.
 *
 * Собран как показ: основная главная не тронута. Оформление здесь не зависит
 * от светлой и тёмной темы — по задумке эти две секции входные и всегда
 * одинаковые, а темы начинаются дальше, на экранах заказа.
 */
export default function FrontPage() {
  const kinds = useRef<HTMLElement>(null);
  return (
    <div style={{ color: "#fff", fontFamily: "Inter, sans-serif" }}>
      <Hero onDown={() => kinds.current?.scrollIntoView({ behavior: "smooth" })} />
      <Kinds innerRef={kinds} />
    </div>
  );
}

/* ——— секция 1 ——— */

function Hero({ onDown }: { onDown: () => void }) {
  const t = front.hero;
  return (
    <section
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 95% at 42% 58%, rgba(52,0,150,.45), transparent 68%)," +
          "linear-gradient(28deg, #5a1ec0 0%, #5e007c 48%, #9a004b 100%)",
      }}
    >
      <FrontBlueprint />

      <div
        className="relative mx-auto flex w-full flex-1 flex-col"
        style={{ maxWidth: 1240, padding: "clamp(22px,3.4vw,52px) clamp(18px,4.2vw,64px) clamp(56px,6vw,84px)" }}
      >
        <Logo />

        <h1
          className="m-0 font-black uppercase"
          style={{ fontSize: "clamp(46px,8.6vw,118px)", lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          {t.title.map((line) => (
            <span key={line} className="block">{line}</span>
          ))}
        </h1>

        <div className="mt-[clamp(20px,2.6vw,34px)] flex flex-wrap items-start gap-[clamp(16px,2.4vw,34px)]">
          <div className="flex flex-col items-start gap-[7px]">
            {t.badges.map((b) => (
              <span
                key={b.t}
                className="inline-block font-black uppercase leading-none"
                style={{
                  background: b.bg,
                  padding: "clamp(7px,1vw,13px) clamp(10px,1.4vw,18px)",
                  fontSize: "clamp(22px,3.4vw,46px)",
                  letterSpacing: "-0.01em",
                }}
              >
                {b.t}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-[clamp(10px,1.6vw,22px)] pt-[6px]">
            <CursorIcon />
            <p
              className="m-0 font-bold uppercase"
              style={{ fontSize: "clamp(13px,1.55vw,21px)", lineHeight: 1.3, letterSpacing: "0.01em" }}
            >
              {t.pitch.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
            </p>
          </div>
        </div>

        <ul className="m-0 mt-auto flex list-none flex-col gap-[clamp(10px,1.4vw,18px)] p-0 pt-[clamp(28px,5vw,64px)]">
          {t.bullets.map((b) => (
            <li key={b.t} className="flex items-center gap-[clamp(10px,1.3vw,18px)]">
              <BulletIcon name={b.icon} />
              <span style={{ fontSize: "clamp(15px,1.75vw,24px)" }}>{b.t}</span>
              {"hint" in b && b.hint && <Popover text={b.hint} />}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onDown}
        aria-label="К видам печатей"
        className="absolute bottom-[clamp(16px,2.4vw,30px)] left-1/2 grid h-[42px] w-[42px] -translate-x-1/2 place-items-center rounded-full"
        style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.3)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"
             strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
    </section>
  );
}

/* ——— секция 2 ——— */

function Kinds({ innerRef }: { innerRef: React.RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={innerRef}
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(205deg, #40006d 0%, #5a1ebe 55%, #7244ff 100%)" }}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: 1240, padding: "clamp(40px,6vw,96px) clamp(18px,4.2vw,64px) clamp(56px,7vw,104px)" }}
      >
        <h2
          className="m-0 mb-[clamp(22px,3vw,44px)] font-black uppercase"
          style={{ fontSize: "clamp(28px,5vw,66px)", lineHeight: 0.95, letterSpacing: "-0.015em" }}
        >
          {front.kindsTitle}
        </h2>

        <div className="grid gap-[clamp(12px,1.6vw,22px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))]">
          {front.kinds.map((k, i) => (
            <KindCard key={k.title} k={k} big={i < 3} />
          ))}
        </div>
      </div>
    </section>
  );
}

type Kind = (typeof front.kinds)[number];

function KindCard({ k, big }: { k: Kind; big: boolean }) {
  const badge = "badge" in k ? k.badge : undefined;
  const foot = "footBadge" in k ? k.footBadge : undefined;
  const icon = "icon" in k ? k.icon : undefined;
  const price = "price" in k ? k.price : undefined;

  return (
    <Link
      href={k.href}
      className="relative flex flex-col overflow-hidden no-underline"
      style={{
        color: "#fff",
        background: "tint" in k && k.tint ? k.tint : "rgba(255,255,255,.15)",
        borderRadius: "clamp(14px,1.5vw,22px)",
        padding: big
          ? "clamp(14px,1.5vw,22px) clamp(16px,1.7vw,26px) clamp(16px,1.7vw,24px)"
          : "clamp(14px,1.5vw,20px) clamp(16px,1.7vw,24px) clamp(14px,1.5vw,20px)",
        minHeight: big ? "clamp(230px,24vw,330px)" : "clamp(150px,15vw,200px)",
      }}
    >
      {icon && big && <CardIcon name={icon} />}

      {big && (
        <div className="mb-[clamp(14px,2vw,30px)] flex" style={{ minHeight: "clamp(20px,1.9vw,26px)" }}>
          {badge && <Tag t={badge.t} bg={badge.bg} />}
        </div>
      )}

      <div>
        <div
          className="font-bold"
          style={{ fontSize: big ? "clamp(20px,2.3vw,31px)" : "clamp(17px,1.9vw,25px)", lineHeight: 1.1 }}
        >
          {k.title.split("\n").map((line) => (
            <span key={line} className="block">{line}</span>
          ))}
        </div>
        <p
          className="m-0 mt-[clamp(8px,1vw,14px)]"
          style={{
            color: "rgba(255,255,255,.82)",
            fontSize: big ? "clamp(14px,1.45vw,20px)" : "clamp(13px,1.3vw,17px)",
            lineHeight: 1.35,
          }}
        >
          {k.desc}
        </p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-[clamp(14px,2vw,28px)]">
        {price ? (
          <span className="leading-none">
            <span style={{ color: "rgba(255,255,255,.6)", fontSize: "clamp(13px,1.3vw,18px)" }}>от </span>
            <b style={{ fontSize: "clamp(22px,2.6vw,36px)" }}>{price}</b>
            <span style={{ color: "rgba(255,255,255,.6)", fontSize: "clamp(15px,1.6vw,22px)" }}> ₽</span>
          </span>
        ) : foot ? (
          <Tag t={foot.t} bg={foot.bg} />
        ) : (
          <span />
        )}
        <span
          className="grid flex-none place-items-center rounded-full"
          style={{
            background: "rgba(255,255,255,.28)",
            width: big ? "clamp(34px,3.4vw,48px)" : "clamp(28px,2.8vw,38px)",
            height: big ? "clamp(34px,3.4vw,48px)" : "clamp(28px,2.8vw,38px)",
          }}
        >
          <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"
               strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
        </span>
      </div>
    </Link>
  );
}

function Tag({ t, bg, className = "" }: { t: string; bg: string; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full font-bold uppercase leading-none ${className}`}
      style={{ background: bg, fontSize: "clamp(9.5px,0.85vw,12px)", letterSpacing: "0.04em", padding: "5px 10px" }}
    >
      {t}
    </span>
  );
}

/* ——— мелочи ——— */

function Logo() {
  return (
    <div className="mb-[clamp(18px,3vw,44px)] flex justify-end">
      <img
        src={asset("/logo-mark.svg")}
        alt="Лаборатория печатей"
        style={{ height: "clamp(54px,5.6vw,88px)", filter: "brightness(0) invert(1)" }}
      />
    </div>
  );
}

function Popover({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  return (
    <span ref={box} className="relative inline-flex">
      <button
        type="button"
        aria-label="Что это значит"
        onClick={() => setOpen((v) => !v)}
        className="grid place-items-center rounded-full font-bold"
        style={{
          width: "clamp(22px,2.1vw,30px)", height: "clamp(22px,2.1vw,30px)",
          background: "rgba(255,255,255,.2)", fontSize: "clamp(12px,1.2vw,16px)",
        }}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          // на узком экране выноска не влезает рядом с кнопкой — прижимаем её
          // к низу окна во всю ширину, иначе половина уезжает за край
          className="absolute left-[calc(100%+12px)] top-1/2 z-20 block w-[min(430px,70vw)] -translate-y-1/2 rounded-[10px] p-[14px] max-[760px]:fixed max-[760px]:inset-x-4 max-[760px]:bottom-[92px] max-[760px]:left-4 max-[760px]:top-auto max-[760px]:w-auto max-[760px]:translate-y-0"
          style={{ background: "#352d3c", fontSize: "clamp(12.5px,1.1vw,15px)", lineHeight: 1.45 }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function CursorIcon() {
  return (
    <svg width="clamp(28px,3vw,44px)" viewBox="0 0 48 52" fill="none" className="w-[clamp(28px,3vw,46px)] flex-none">
      <g stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
        <path d="M13 9 L10 3 M24 7 L25 1 M34 11 L38 6" />
      </g>
      <path
        d="M16 16v16l-3-3a4 4 0 00-6 5l9 13a9 9 0 007 5h11a7 7 0 007-7V29a3 3 0 00-6 0 3 3 0 00-6 0 3 3 0 00-6 0V16a3 3 0 00-6 0z"
        fill="#fff"
      />
    </svg>
  );
}

function BulletIcon({ name }: { name: string }) {
  const common = { width: "clamp(20px,2.1vw,30px)", height: "clamp(20px,2.1vw,30px)" } as const;
  if (name === "shield") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="#fff" className="flex-none">
        <path d="M12 2l8 3.5v5.8c0 5-3.4 8.8-8 10.7-4.6-1.9-8-5.7-8-10.7V5.5L12 2z" />
        <path d="M8.6 11.8l2.3 2.3 4.4-4.4" stroke="#6b0f8c" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="#fff" className="flex-none">
        <path d="M12 3a9 9 0 109 9 9 9 0 00-9-9zm1 9.6l3.1 1.8-.9 1.6-4.2-2.4V6.6h2z" />
      </svg>
    );
  }
  return (
    <svg style={common} viewBox="0 0 26 24" fill="#fff" className="flex-none">
      <path d="M2 7h9v8H8.9a3 3 0 00-5.8 0H2zM13 9h5l4 4v2h-1.1a3 3 0 00-5.8 0H13z" />
      <circle cx="6" cy="17.5" r="2.6" /><circle cx="17" cy="17.5" r="2.6" />
    </svg>
  );
}

function CardIcon({ name }: { name: string }) {
  const style = {
    position: "absolute" as const,
    right: "-6%",
    top: "4%",
    width: "46%",
    opacity: 0.17,
    pointerEvents: "none" as const,
  };
  if (name === "case") {
    return (
      <svg style={style} viewBox="0 0 24 24" fill="#fff">
        <path d="M9 4h6a2 2 0 012 2v1h-2V6H9v1H7V6a2 2 0 012-2z" />
        <rect x="2" y="7" width="20" height="13" rx="2.5" />
      </svg>
    );
  }
  if (name === "person") {
    return (
      <svg style={style} viewBox="0 0 24 24" fill="#fff">
        <circle cx="12" cy="12" r="11" fillOpacity=".55" />
        <circle cx="12" cy="9.3" r="3.6" />
        <path d="M5.2 19.4a7 7 0 0113.6 0A11 11 0 0112 21.9a11 11 0 01-6.8-2.5z" />
      </svg>
    );
  }
  return (
    <svg style={style} viewBox="0 0 24 24" fill="#fff">
      <rect x="2" y="2" width="20" height="20" rx="6" fillOpacity=".55" />
      <path d="M10.6 6h2.8v3.6H17v2.8h-3.6V16h-2.8v-3.6H7V9.6h3.6z" />
    </svg>
  );
}
