"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import MountPhoto from "@/components/MountPhoto";
import { MOUNTS, KIND_LABEL, sizeLabel, forDiameter } from "@/lib/mounts";
import { IconArrowLeft, IconArrowRight } from "@/components/Icons";

const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;
const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
const money = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

/**
 * Страница одной оснастки: снимок, характеристики и переход в конструктор
 * с уже выбранной оснасткой. Для круглых зовём собирать печать, для
 * прямоугольных — штамп: круглого клише в такой корпус не поставить.
 */
export default function MountCard({ id }: { id: string }) {
  const m = MOUNTS.find((x) => slug(x.id) === id) ?? MOUNTS[0];
  const round = m.shape === "round";
  const fitting = round && m.diameterMm ? forDiameter(m.diameterMm) : [];
  const base = fitting[0]?.price ?? 0;
  const extra = base && m.price > base ? m.price - base : 0;
  const order = `/konstruktor?s=${round ? "ip" : "stamp"}&k=ip&mount=${encodeURIComponent(m.id)}`;
  const same = MOUNTS.filter((x) => x.id !== m.id && x.shape === m.shape && x.brand === m.brand)
    .sort((a, b) => Math.abs((a.diameterMm ?? a.lengthMm ?? 0) - (m.diameterMm ?? m.lengthMm ?? 0))
      - Math.abs((b.diameterMm ?? b.lengthMm ?? 0) - (m.diameterMm ?? m.lengthMm ?? 0)))
    .slice(0, 4);

  const specs: [string, string][] = [
    ["Бренд", m.brand],
    ["Серия", m.series],
    ["Тип", KIND_LABEL[m.kind]],
    ["Форма", round ? "Круглая" : "Прямоугольная"],
    ["Поле под клише", sizeLabel(m)],
    ...(m.material ? ([["Материал", m.material]] as [string, string][]) : []),
    ...(m.colors ? ([["Цвета корпуса", m.colors]] as [string, string][]) : []),
    ...(m.kit ? ([["Комплектация", m.kit]] as [string, string][]) : []),
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full flex-1" style={{ maxWidth: 1200, padding: "0 clamp(18px,4vw,56px) clamp(40px,5vw,64px)" }}>
        <Link href="/osnastki" className="mt-5 inline-flex items-center gap-[6px] text-[13px] leading-[1.2] no-underline"
          style={{ color: "var(--color-accent)" }}>
          <IconArrowLeft />
          Все оснастки
        </Link>

        <div className="two-col mt-4">
          <section className="panel">
            <MountPhoto m={m} className="mount-photo--card" />
          </section>

          <section className="panel flex flex-col">
            <span className="text-[12.5px] uppercase tracking-[0.06em]" style={{ color: "var(--color-accent-300)" }}>
              {m.brand} · {KIND_LABEL[m.kind].toLowerCase()}
            </span>
            <h1 className="m-0 mt-2 font-semibold" style={{ fontSize: "clamp(26px,3.4vw,38px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              {m.model}
            </h1>
            {m.note && (
              <p className="mb-0 mt-2 text-[14px] leading-[1.5]" style={{ color: muted(70) }}>{m.note}</p>
            )}

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-[28px] font-semibold leading-[1.1]">{money(m.price)}</span>
              <span className="text-[13px]" style={{ color: muted(60) }}>с изготовлением клише</span>
            </div>
            {round && extra > 0 && (
              <span className="mt-1 text-[12.5px]" style={{ color: muted(58) }}>
                Самая доступная оснастка под Ø{m.diameterMm} мм — {money(base)}, эта дороже на {money(extra)}.
              </span>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={order} className="btn btn-primary px-[22px] py-3 text-[15px] no-underline">
                {round ? "Заказать печать на этой оснастке" : "Заказать штамп на этой оснастке"}
                <IconArrowRight />
              </Link>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-[var(--color-divider)] pt-5 sm:grid-cols-2">
              {specs.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-[3px]">
                  <dt className="text-[11.5px]" style={{ color: muted(52) }}>{k}</dt>
                  <dd className="m-0 text-[14.5px] font-semibold">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-[12.5px] leading-[1.5]" style={{ color: muted(58) }}>
              Размер в характеристиках — поле под клише. Печать Ø{round ? m.diameterMm : "—"} мм
              {round ? " встанет в эту оснастку" : " в прямоугольный корпус не встанет"}: клише меньше поля
              поставить можно, больше — нет.
            </p>
          </section>
        </div>

        {same.length > 0 && (
          <section className="mt-[clamp(40px,5vw,64px)]">
            <h2 className="m-0 mb-4 font-semibold" style={{ fontSize: "clamp(20px,2.3vw,26px)", letterSpacing: "-0.01em" }}>
              Похожие по размеру
            </h2>
            <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 210px), 1fr))" }}>
              {same.map((x) => (
                <Link key={x.id} href={`/osnastki/${slug(x.id)}`}
                  className="card flex flex-col gap-3 p-4 no-underline"
                  style={{ color: "inherit", boxShadow: "var(--shadow-sm)" }}>
                  <MountPhoto m={x} className="mount-photo--card" />
                  <span className="text-[14.5px] font-semibold">{x.model}</span>
                  <span className="text-[12.5px]" style={{ color: muted(65) }}>
                    {KIND_LABEL[x.kind]} · {sizeLabel(x)}
                  </span>
                  <span className="mt-auto text-[15px] font-semibold">{money(x.price)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
