"use client";

import { useState } from "react";
import catalog from "@/content/catalog.json";
import texts from "@/content/checkout.json";
import { StampThumb } from "@/components/StampPreview";
import { IconArrowLeft, IconChevronRight, IconPin, IconShield } from "@/components/Icons";
import type { Values } from "@/lib/stamp";

type Props = {
  kindTitle: string;
  layoutTitle: string;
  total: number;
  ownLayout: boolean;
  mountName: string;
  mountCost: number;
  urgency: "rush" | "calm";
  /** макет и данные для миниатюры в «Вашем заказе» — как в макете */
  thumbFile?: string;
  thumbValues?: Values;
  onBack: () => void;
};

const money = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

export default function Checkout({
  kindTitle, layoutTitle, total, ownLayout, mountName, mountCost, urgency, thumbFile, thumbValues, onBack,
}: Props) {
  const [delivery, setDelivery] = useState("courier");
  const [addr, setAddr] = useState("");
  const [service, setService] = useState("cdek");
  const [pvz, setPvz] = useState<number | null>(null);
  const [pay, setPay] = useState("online");

  const deliveryItem = catalog.delivery.find((d) => d.id === delivery)!;
  const grand = total + deliveryItem.cost;

  // кнопку держим неактивной, пока не ясно, куда везти
  const ready =
    delivery === "pickup" ||
    (delivery === "courier" && addr.trim().length > 5) ||
    (delivery === "post" && pvz !== null);

  return (
    <main className="w-full flex-1" style={{ padding: "clamp(20px,4vw,40px) clamp(16px,4vw,48px)" }}>
      <div className="mx-auto flex w-full flex-col gap-4" style={{ maxWidth: 1180 }}>
      <section className="panel" style={{ padding: "clamp(16px,2vw,22px)" }}>
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-[6px] text-[13px] leading-[1.2] text-[var(--color-accent)]"
          >
            <IconArrowLeft />
            {texts.back.replace(/^←\s*/, "")}
          </button>
          <span className="h-[14px] w-px bg-[var(--color-divider)]" />
          <span className="text-[12.5px] text-[color-mix(in_srgb,var(--color-text)_50%,transparent)]">
            {kindTitle} · {layoutTitle}
          </span>
        </div>
        <h1 className="m-0 font-semibold" style={{ fontSize: "clamp(24px,3vw,34px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          {texts.title}
        </h1>
        <p className="mt-1 text-[13px] text-[color-mix(in_srgb,var(--color-text)_62%,transparent)]">
          {texts.subtitle}
        </p>
      </section>

      <div className="two-col">
        <div className="flex flex-col gap-4">
          <section className="panel flex-1" style={{ padding: "clamp(16px,2vw,22px)" }}>
            <h2 className="m-0 mb-3 text-[16px] font-semibold">{texts.deliveryTitle}</h2>
            <div className="grid grid-cols-3 gap-[10px]">
              {catalog.delivery.map((d) => (
                <Tile
                  key={d.id}
                  active={delivery === d.id}
                  onClick={() => setDelivery(d.id)}
                  name={d.name}
                  note={d.eta}
                  price={d.cost ? `+ ${money(d.cost)}` : "бесплатно"}
                  free={d.cost === 0}
                />
              ))}
            </div>

            <div className="mt-[15px]">
              {delivery === "pickup" && (
                <div className="flex items-center gap-3 rounded-[11px] border border-[var(--color-divider)] p-3">
                  <span style={{ color: "var(--color-accent)" }}>
                    <IconPin />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold">{texts.pickup.name}</div>
                    <div className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-text)_62%,transparent)]">
                      {texts.pickup.address}
                    </div>
                  </div>
                </div>
              )}

              {delivery === "courier" && (
                <div className="field">
                  <label htmlFor="addr">{texts.courierAddressLabel}</label>
                  <input
                    id="addr"
                    className="input"
                    placeholder={texts.courierAddressPlaceholder}
                    value={addr}
                    onChange={(e) => setAddr(e.target.value)}
                  />
                </div>
              )}

              {delivery === "post" && (
                <div className="flex flex-col gap-3">
                  <div className="text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-text)_55%,transparent)]">
                    {texts.serviceLabel}
                  </div>
                  <div className="grid grid-cols-3 gap-[10px]">
                    {catalog.courierServices.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setService(s.id); setPvz(null); }}
                        aria-pressed={service === s.id}
                        className="rounded-[12px] border-[1.5px] px-2 py-3 text-center text-[13px] font-semibold"
                        style={{
                          borderColor: service === s.id ? "var(--color-accent)" : "var(--color-divider)",
                          background: service === s.id
                            ? "color-mix(in srgb, var(--color-accent) 7%, transparent)"
                            : "transparent",
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                  {/* в проде здесь модалка с картой и списком ПВЗ службы */}
                  <button
                    type="button"
                    onClick={() => setPvz(((pvz ?? -1) + 1) % catalog.pvz.length)}
                    className="flex w-full items-center justify-between rounded-[11px] border-[1.5px] border-[var(--color-divider)] p-3 text-left hover:border-[var(--color-accent)]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span style={{ color: "var(--color-accent)" }}>
                        <IconPin />
                      </span>
                      <span className="min-w-0">
                      <span
                        className="block text-[13.5px]"
                        style={{ color: pvz === null ? "var(--color-accent)" : "var(--color-text)" }}
                      >
                        {pvz === null ? texts.pvzChoose : catalog.pvz[pvz].addr}
                      </span>
                      {pvz !== null && (
                        <span className="block text-[11.5px] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)]">
                          {catalog.pvz[pvz].note}
                        </span>
                      )}
                      </span>
                    </span>
                    <span className="text-[color-mix(in_srgb,var(--color-text)_45%,transparent)]">
                      <IconChevronRight size={16} />
                    </span>
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="panel" style={{ padding: "clamp(16px,2vw,22px)" }}>
            <h2 className="m-0 mb-3 text-[16px] font-semibold">{texts.payTitle}</h2>
            <div className="grid grid-cols-3 gap-[10px]">
              {catalog.pay.map((p) => (
                <Tile
                  key={p.id}
                  active={pay === p.id}
                  onClick={() => setPay(p.id)}
                  name={p.name}
                  note={p.note}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="panel sticky top-5 self-start" style={{ padding: "clamp(16px,2vw,22px)" }}>
          <h2 className="m-0 mb-3 text-[16px] font-semibold">{texts.summaryTitle}</h2>
          <div className="mb-3 flex items-center gap-3">
            <div
              className="grid h-16 w-16 flex-none place-items-center rounded-[12px] border border-[var(--color-divider)] p-[7px]"
              style={{ color: "var(--ink)" }}
            >
              {thumbFile && thumbValues && <StampThumb file={thumbFile} values={thumbValues} />}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold">{kindTitle}</div>
              <div className="truncate text-[12px] text-[color-mix(in_srgb,var(--color-text)_52%,transparent)]">
                {texts.summaryLayout} · {layoutTitle}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[11px] border-t border-[var(--color-divider)] pt-3">
            <Row label="Печать" value={money(catalog.prices.stamp)} />
            {ownLayout && <Row label="Свой макет" value={`от ${money(catalog.prices.ownLayout)}`} />}
            <Row label="Оснастка" sub={mountName} value={mountCost ? `+ ${money(mountCost)}` : "включена"} muted={!mountCost} />
            <Row
              label="Срочность"
              value={urgency === "rush" ? `+ ${money(catalog.prices.rush)}` : "бесплатно"}
              muted={urgency === "calm"}
            />
            <Row
              label="Доставка"
              sub={deliveryItem.eta}
              value={deliveryItem.cost ? `+ ${money(deliveryItem.cost)}` : "бесплатно"}
              muted={deliveryItem.cost === 0}
            />
          </div>

          <div className="mt-3 flex items-end justify-between border-t border-[var(--color-divider)] pt-3">
            <span className="text-[13px]" style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
              {texts.grandTotal}
            </span>
            <span className="text-[26px] font-semibold">
              {ownLayout ? "от " : ""}
              {money(grand)}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block mt-3 px-5 py-[13px] text-[15px]"
            disabled={!ready}
          >
            {texts.cta} · {money(grand)}
          </button>
          <p className="mt-3 flex items-center gap-[7px] text-[11.5px] leading-[1.45] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)]">
            <IconShield />
            {texts.legal}
          </p>
        </section>
      </div>
      </div>
    </main>
  );
}

function Tile({
  active, onClick, name, note, price, free,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  note: string;
  price?: string;
  free?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex flex-col gap-1.5 rounded-[12px] border-[1.5px] px-3 py-[13px] text-left"
      style={{
        minHeight: 104,
        borderColor: active ? "var(--color-accent)" : "var(--color-divider)",
        background: active ? "color-mix(in srgb, var(--color-accent) 7%, transparent)" : "transparent",
      }}
    >
      <span className="text-[13.5px] font-semibold">{name}</span>
      <span className="text-[11.5px] text-[color-mix(in_srgb,var(--color-text)_55%,transparent)]">{note}</span>
      {price && (
        <span className="mt-auto text-[12.5px] font-semibold" style={free ? { color: "var(--ok)" } : undefined}>
          {price}
        </span>
      )}
    </button>
  );
}

function Row({ label, sub, value, muted }: { label: string; sub?: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-[13px]">{label}</span>
        {sub && (
          <span className="block truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-text)_52%,transparent)]">
            {sub}
          </span>
        )}
      </span>
      <span
        className="shrink-0 text-[13.5px] font-semibold"
        style={muted ? { color: "color-mix(in srgb, var(--color-text) 55%, transparent)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
