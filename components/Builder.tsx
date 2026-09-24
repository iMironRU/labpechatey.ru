"use client";

import { useRouter } from "next/navigation";
import KindSelector from "@/components/KindSelector";
import Mounts from "@/components/Mounts";
import StampPreview from "@/components/StampPreview";
import SiteHeader from "@/components/SiteHeader";
import HelpCard from "@/components/HelpCard";
import { IconArrowLeft, IconArrowRight, IconCalendar, IconCheck, IconClock, IconCross } from "@/components/Icons";
import catalog from "@/content/catalog.json";
import texts from "@/content/constructor.json";
import { useOrder } from "@/components/OrderState";

/** Экран сборки печати — реквизиты, живое превью и подбор оснастки. */
export default function Builder() {
  const router = useRouter();
  const o = useOrder();
  const { situation, sel, setSel, inn, setInn, reg, manual, setManual, org, setOrg, city, setCity, ogrn, setOgrn, urgency, setUrgency, mount, setMount, tpl, setTpl, index, variants, ownPicked, setOwnPicked, kindItem, ownLayout, sealKind, innCheck, ogrnCheck, editable, filled, values, diameter, mountItem, mountExtra, total, currentTemplate, money, onChoose, onVariants } = o;

  return (
    <>
    <SiteHeader onHome={() => router.push("/")} />
    <main
      className="w-full flex-1"
      // снизу место под панель с итогом, она перекрывает контент
      style={{ padding: "clamp(20px,4vw,40px) clamp(16px,4vw,48px) max(clamp(20px,4vw,40px), 92px)" }}
    >
      <div className="mx-auto flex w-full flex-col gap-4" style={{ maxWidth: 1180 }}>
      {/* ——— шапка ——— */}
      <section className="panel">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              o.reset();
              router.push("/konstruktor");
            }}
            className="inline-flex items-center gap-[6px] text-[13px] leading-[1.2] text-[var(--color-accent)]"
          >
            <IconArrowLeft />
            {texts.breadcrumbRestart.replace(/^←\s*/, "")}
          </button>
          <span className="h-[14px] w-px bg-[var(--color-divider)]" />
          <span className="text-[12.5px] text-[color-mix(in_srgb,var(--color-text)_50%,transparent)]">
            Печать · {kindItem.ent}
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-[14px]">
          <KindSelector value={sel} onChange={(id) => { setSel(id); setTpl(null); }} />

          <div
            className="flex gap-1 rounded-full border border-[var(--color-divider)] p-[3px]"
            style={{ background: "color-mix(in srgb, var(--color-text) 3%, transparent)" }}
          >
            {(["rush", "calm"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgency(u)}
                aria-pressed={urgency === u}
                className="inline-flex items-center gap-[6px] rounded-full px-[13px] py-[6px] text-[12.5px] leading-[1.2]"
                style={
                  urgency === u
                    ? { background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }
                    : { color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }
                }
              >
                {u === "rush" ? <IconClock /> : <IconCalendar />}
                {u === "rush" ? texts.urgency.rush : texts.urgency.calm}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-[14px] flex flex-wrap items-end justify-between gap-5 border-t border-[var(--color-divider)] pt-4 max-[560px]:hidden">
          <div className="flex min-w-[220px] flex-1 flex-wrap gap-x-7 gap-y-[14px]">
            <PriceRow label={`${texts.price.stampRow} · ${currentTemplate?.tpl.title ?? "макет"}`} value={money(catalog.prices.stamp)} />
            <PriceRow
              label={`${texts.price.mountRow} · ${mountItem ? `${mountItem.brand} ${mountItem.model}` : "подберём"}`}
              value={mountExtra === 0 ? texts.price.included : `+ ${money(mountExtra)}`}
              muted={mountExtra === 0}
            />
            <PriceRow
              label={texts.price.urgencyRow}
              value={urgency === "rush" ? `+ ${money(catalog.prices.rush)}` : texts.price.free}
              muted={urgency === "calm"}
              onClear={urgency === "rush" ? () => setUrgency("calm") : undefined}
            />
            {ownLayout && (
              <PriceRow label={texts.price.ownLayoutRow} value={`от ${money(catalog.prices.ownLayout)}`} />
            )}
          </div>

          <div className="flex items-center gap-[18px] max-[560px]:hidden">
            <div className="text-right">
              <div className="text-[11.5px] text-[color-mix(in_srgb,var(--color-text)_52%,transparent)]">
                {texts.price.total}
              </div>
              <div className="text-[26px] font-semibold leading-[1.1]">
                {ownLayout ? "от " : ""}
                {money(total)}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary px-5 py-3 text-[15px]"
              disabled={!filled}
              onClick={() => router.push("/oformlenie")}
            >
              {texts.price.cta.replace(/\s*→$/, "")}
              <IconArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* ——— реквизиты и превью ——— */}
      <div className="two-col two-col--preview">
        <section className="panel">
          <h2 className="m-0 text-[17px] font-semibold">{texts.requisites.title}</h2>
          <p className="mb-4 mt-1 text-[13px] text-[color-mix(in_srgb,var(--color-text)_62%,transparent)]">
            {texts.requisites.hint}
          </p>

          <div className="field relative">
            <label htmlFor="inn">{texts.requisites.innLabel}</label>
            <input
              id="inn"
              className="input pr-10"
              inputMode="numeric"
              maxLength={12}
              placeholder={texts.requisites.innPlaceholder}
              style={{ fontSize: 16, letterSpacing: "0.04em" }}
              value={inn}
              onChange={(e) => setInn(e.target.value.replace(/\D/g, "").slice(0, 12))}
            />
            <span className="pointer-events-none absolute right-3 top-[34px]">
              {reg.status === "searching" && <span className="spinner block" />}
              {reg.status === "found" && <span style={{ color: "var(--ok)" }}>✓</span>}
            </span>
          </div>

          {reg.status === "searching" && (
            <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-text)_58%,transparent)]">
              {texts.requisites.searching}
            </p>
          )}

          {reg.status === "found" && (
            <div
              className="mt-2 rounded-[11px] p-[14px]"
              style={{ background: "var(--ok-bg)", border: "1px solid color-mix(in srgb, var(--ok) 40%, transparent)" }}
            >
              <div
                className="flex items-center gap-[7px] text-[12px] font-semibold uppercase tracking-[0.05em]"
                style={{ color: "var(--ok)" }}
              >
                <IconCheck />
                {texts.requisites.foundBadge}
              </div>
              <div className="mt-1 text-[16px] font-semibold">{org}</div>
              <div className="text-[13px] text-[color-mix(in_srgb,var(--color-text)_72%,transparent)]">
                ИНН {inn} / {ogrn.length === 15 ? "ОГРНИП" : "ОГРН"} {ogrn} · {city}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[13px]" style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
                  {texts.requisites.foundAsk}
                </span>
                <button type="button" className="btn btn-ghost px-3 py-[7px] text-[13px]" onClick={() => setManual(true)}>
                  {texts.requisites.fixButton}
                </button>
              </div>
            </div>
          )}

          {reg.status === "notfound" && (
            <div
              className="mt-2 rounded-[11px] p-[14px]"
              style={{ background: "var(--warn-bg)", border: "1px solid color-mix(in srgb, var(--warn) 40%, transparent)" }}
            >
              <div className="text-[13px] font-semibold" style={{ color: "var(--warn)" }}>
                {texts.requisites.notFoundTitle}
              </div>
              <div className="mt-1 text-[12.5px]">{texts.requisites.notFoundNote}</div>
            </div>
          )}

          {innCheck && !innCheck.ok && (
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--warn)" }}>
              ИНН: {innCheck.msg}
            </p>
          )}

          {/* Длина ИНН говорит, кто перед нами: 10 цифр — организация, 12 — ИП.
              Если это расходится с выбранным типом печати, предлагаем поправить. */}
          {innCheck?.ok && innCheck.kind !== sealKind && (
            <p className="mt-2 text-[12.5px]" style={{ color: "var(--warn)" }}>
              По ИНН это {innCheck.kind === "ooo" ? "организация" : "ИП"}, а выбрана{" "}
              {kindItem.title.toLowerCase()}.{" "}
              <button
                type="button"
                className="underline"
                style={{ color: "var(--color-accent)" }}
                onClick={() => { setSel(innCheck.kind === "ooo" ? "ooo" : "ip"); setTpl(null); }}
              >
                Переключить на {innCheck.kind === "ooo" ? "печать ООО" : "печать ИП"}
              </button>
            </p>
          )}

          <div className="mt-4 border-t border-[var(--color-divider)] pt-4">
            <div className="field mb-3">
              <label htmlFor="org">{texts.requisites.orgLabel}</label>
              <input id="org" className="input" disabled={!editable} value={org}
                onChange={(e) => setOrg(e.target.value)} />
            </div>
            <div className="ap-2col">
              <div className="field">
                <label htmlFor="city">{texts.requisites.cityLabel}</label>
                <input id="city" className="input" disabled={!editable} value={city}
                  onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="ogrn">{texts.requisites.ogrnLabel}</label>
                <input id="ogrn" className="input" disabled={!editable} value={ogrn}
                  onChange={(e) => setOgrn(e.target.value.replace(/\D/g, "").slice(0, 15))} />
              </div>
            </div>
            {ogrnCheck && !ogrnCheck.ok && (
              <p className="mt-1 text-[12.5px]" style={{ color: "var(--warn)" }}>
                ОГРН: {ogrnCheck.msg}
              </p>
            )}
            {!editable && (
              <p className="mt-2 text-[12px] text-[color-mix(in_srgb,var(--color-text)_50%,transparent)]">
                🔒 {texts.requisites.lockedHint}
              </p>
            )}
          </div>
        </section>

        <section
          className="panel"
          style={{
            padding: "clamp(16px,2vw,22px)",
            background:
              "repeating-linear-gradient(45deg, color-mix(in srgb,var(--color-text) 3%,transparent) 0 1px, transparent 1px 13px), var(--color-surface)",
          }}
        >
          <StampPreview
            index={index}
            kind={sealKind}
            values={values}
            chosen={tpl}
            onChoose={onChoose}
            onVariants={onVariants}
            filled={filled}
            own={ownLayout}
            onOwn={setOwnPicked}
          />
          <Mounts diameterMm={diameter} value={mount} onChange={setMount} />
        </section>
      </div>

      {/* ——— нижняя панель на телефоне (макет «Конструктор — реквизиты (моб)») ——— */}
      <div className="mcta">
        <div className="flex flex-col leading-[1.15]">
          <span className="text-[11px]" style={{ color: "color-mix(in srgb, var(--color-text) 52%, transparent)" }}>
            Итого · оплата при получении
          </span>
          <span className="text-[20px] font-semibold">
            {ownLayout ? "от " : ""}
            {money(total)}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary whitespace-nowrap px-[22px] py-3 text-[15px]"
          disabled={!filled}
          onClick={() => router.push("/oformlenie")}
        >
          Оформить
        </button>
      </div>
      </div>
    </main>
    {/* ситуация «Не знаю, помогите» открывает карточку сразу */}
    <HelpCard openOnMount={situation === "help"} />
    </>
  );
}


function PriceRow({
  label, value, muted, onClear,
}: {
  label: string;
  value: string;
  muted?: boolean;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[11.5px] text-[color-mix(in_srgb,var(--color-text)_52%,transparent)]">{label}</span>
      <span className="inline-flex items-center gap-[7px]">
        <span
          className="text-[15px] font-semibold"
          style={muted ? { color: "color-mix(in srgb, var(--color-text) 55%, transparent)" } : undefined}
        >
          {value}
        </span>
        {onClear && (
          <button
            type="button"
            aria-label="Убрать срочность"
            onClick={onClear}
            className="grid h-5 w-5 flex-none place-items-center rounded-full"
            style={{
              background: "color-mix(in srgb, var(--color-text) 9%, transparent)",
              color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
            }}
          >
            <IconCross />
          </button>
        )}
      </span>
    </div>
  );
}
