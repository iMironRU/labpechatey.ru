"use client";

import Link from "next/link";
import catalog from "@/content/catalog.json";
import home from "@/content/home.json";
import texts from "@/content/done.json";
import { StampThumb } from "@/components/StampPreview";
import { IconCheck, IconShield } from "@/components/Icons";
import type { Placed } from "@/components/OrderState";

const money = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;
const muted = (pct: number) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

/**
 * «Заказ принят»: последний экран воронки.
 *
 * Показываем то, за чем сюда возвращаются: номер, что и почём заказано,
 * куда придёт и что будет дальше. Оплата пока не подключена, поэтому
 * про неё говорим честно — ссылку пришлём, счёт вышлем.
 */
export default function OrderDone({ order }: { order: Placed }) {
  const delivery = catalog.delivery.find((d) => d.id === order.delivery);
  const pay = catalog.pay.find((p) => p.id === order.pay);
  const payNote = (texts.payNote as Record<string, string>)[order.pay];

  return (
    <main className="w-full flex-1" style={{ padding: "clamp(20px,4vw,40px) clamp(16px,4vw,48px)" }}>
      <div className="mx-auto flex w-full flex-col gap-4" style={{ maxWidth: 1180 }}>
        <section className="panel" style={{ padding: "clamp(20px,2.4vw,28px)" }}>
          <div className="flex items-start gap-4">
            <span
              className="grid h-12 w-12 flex-none place-items-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--ok) 14%, transparent)", color: "var(--ok)" }}
            >
              <IconCheck size={22} width={2.4} />
            </span>
            <div className="min-w-0">
              <h1 className="m-0 font-semibold" style={{ fontSize: "clamp(24px,3vw,34px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                {texts.title}
              </h1>
              <p className="mb-0 mt-1.5 max-w-[56ch] text-[14px]" style={{ color: muted(68) }}>
                {texts.lead}
              </p>
            </div>
            <div className="ml-auto hidden flex-none text-right min-[720px]:block">
              <div className="text-[12px]" style={{ color: muted(55) }}>{texts.numberLabel}</div>
              <div className="mt-0.5 text-[19px] font-semibold tabular-nums">{order.number}</div>
            </div>
          </div>
          <div className="mt-3 text-[13px] min-[720px]:hidden" style={{ color: muted(55) }}>
            {texts.numberLabel} · <b className="text-[var(--color-text)]">{order.number}</b>
          </div>
        </section>

        <div className="two-col">
          <div className="flex flex-col gap-4">
            <section className="panel" style={{ padding: "clamp(16px,2vw,22px)" }}>
              <h2 className="m-0 mb-4 text-[16px] font-semibold">{texts.nextTitle}</h2>
              <ol className="m-0 flex list-none flex-col gap-4 p-0">
                {texts.steps.map((s, i) => (
                  <li key={s.t} className="flex items-start gap-3">
                    <span
                      className="grid h-7 w-7 flex-none place-items-center rounded-full text-[12.5px] font-semibold"
                      style={i === 0
                        ? { background: "var(--color-accent)", color: "#fff" }
                        : { border: "1px solid var(--color-divider)", color: muted(55) }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold">{s.t}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-[1.5]" style={{ color: muted(62) }}>
                        {s.d}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="panel" style={{ padding: "clamp(16px,2vw,22px)" }}>
              <h2 className="m-0 mb-1 text-[16px] font-semibold">{texts.helpTitle}</h2>
              <p className="mb-3 mt-0 text-[13px]" style={{ color: muted(65) }}>{texts.helpLead}</p>
              <div className="flex flex-wrap gap-2">
                <a href={home.phoneHref} className="btn btn-primary px-[18px] py-2.5 text-[14px] no-underline">
                  {home.phone}
                </a>
                <a href="https://t.me/" className="btn btn-secondary px-[18px] py-2.5 text-[14px] no-underline">
                  Telegram
                </a>
              </div>
            </section>
          </div>

          <section className="panel self-start" style={{ padding: "clamp(16px,2vw,22px)" }}>
            <h2 className="m-0 mb-3 text-[16px] font-semibold">{texts.summaryTitle}</h2>
            <div className="mb-3 flex items-center gap-3">
              <div
                className="grid h-16 w-16 flex-none place-items-center rounded-[12px] border border-[var(--color-divider)] p-[7px]"
                style={{ color: "var(--ink)" }}
              >
                {order.thumbFile && order.thumbValues && (
                  <StampThumb file={order.thumbFile} values={order.thumbValues} />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{order.kindTitle}</div>
                <div className="truncate text-[12px]" style={{ color: muted(52) }}>
                  Макет · {order.layoutTitle}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[11px] border-t border-[var(--color-divider)] pt-3">
              <Row label="Печать" value={money(catalog.prices.stamp)} />
              {order.ownLayout && <Row label="Свой макет" value={`от ${money(catalog.prices.ownLayout)}`} />}
              <Row
                label="Оснастка"
                sub={order.mountName}
                value={order.mountCost ? `+ ${money(order.mountCost)}` : "включена"}
                muted={!order.mountCost}
              />
              <Row
                label="Срочность"
                value={order.urgency === "rush" ? `+ ${money(catalog.prices.rush)}` : "бесплатно"}
                muted={order.urgency === "calm"}
              />
              <Row
                label={texts.deliveryLabel}
                sub={order.address || delivery?.eta}
                value={delivery?.cost ? `+ ${money(delivery.cost)}` : "бесплатно"}
                muted={!delivery?.cost}
              />
              <Row label={texts.payLabel} sub={pay?.note} value={pay?.name ?? ""} />
            </div>

            <div className="mt-3 flex items-end justify-between border-t border-[var(--color-divider)] pt-3">
              <span className="text-[13px]" style={{ color: muted(60) }}>{texts.grandTotal}</span>
              <span className="text-[26px] font-semibold">
                {order.ownLayout ? "от " : ""}
                {money(order.total)}
              </span>
            </div>

            <p className="mt-3 flex items-start gap-[7px] text-[11.5px] leading-[1.45]" style={{ color: muted(55) }}>
              <span className="mt-0.5 flex-none"><IconShield /></span>
              {payNote}
            </p>

            <Link href="/konstruktor" className="btn btn-primary btn-block mt-4 px-5 py-[13px] text-[15px] no-underline">
              {texts.again}
            </Link>
            <Link href="/" className="btn btn-secondary btn-block mt-2 px-5 py-[13px] text-[15px] no-underline">
              {texts.home}
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

function Row({ label, sub, value, muted: dim }: { label: string; sub?: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-[13px]">{label}</span>
        {sub && (
          <span className="block truncate text-[11.5px]" style={{ color: muted(52) }}>{sub}</span>
        )}
      </span>
      <span className="shrink-0 text-[13.5px] font-semibold" style={dim ? { color: muted(55) } : undefined}>
        {value}
      </span>
    </div>
  );
}
