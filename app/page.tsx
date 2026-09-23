"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import KindSelector from "@/components/KindSelector";
import Mounts from "@/components/Mounts";
import StampPreview from "@/components/StampPreview";
import Checkout from "@/components/Checkout";
import StartScreen from "@/components/StartScreen";
import catalog from "@/content/catalog.json";
import texts from "@/content/constructor.json";
import startTexts from "@/content/start.json";
import { checkInn, checkOgrn, lookupInn, type Registry } from "@/lib/inn";
import { valuesFor, type Kind, type Scored, type TemplateIndex } from "@/lib/stamp";
import { asset } from "@/lib/paths";

export default function Page() {
  // состояние конструктора — см. design-ref/README.md, раздел State Management
  // стартовый экран — первый: человек приходит с ситуацией, а не с типом печати
  const [screen, setScreen] = useState<"start" | "build" | "checkout">("start");
  const [situation, setSituation] = useState<string | null>(null);
  const [sel, setSel] = useState("ip");
  const [inn, setInn] = useState("");
  const [reg, setReg] = useState<Registry>({ status: "idle" });
  const [manual, setManual] = useState(false);
  const [org, setOrg] = useState("");
  const [city, setCity] = useState("");
  const [ogrn, setOgrn] = useState("");
  const [urgency, setUrgency] = useState<"rush" | "calm">("calm");
  const [mount, setMount] = useState(0);
  const [tpl, setTpl] = useState<string | null>(null);
  const [index, setIndex] = useState<TemplateIndex[]>([]);
  const [variants, setVariants] = useState<Scored[]>([]);

  const kindItem = catalog.kinds.find((k) => k.id === sel) ?? catalog.kinds[0];
  const ownLayout = kindItem.copy;
  const sealKind: Kind = kindItem.ent === "ООО" ? "ooo" : "ip";

  useEffect(() => {
    fetch(asset("/templates/index.json"))
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex([]));
  }, []);

  // поиск в реестре: запрос уходит, когда цифр хватает на ИНН
  useEffect(() => {
    if (inn.length < 10) {
      setReg({ status: "idle" });
      return;
    }
    const ctrl = new AbortController();
    setReg({ status: "searching" });
    lookupInn(inn, ctrl.signal)
      .then((r) => {
        setReg(r);
        setManual(r.status === "notfound");
        if (r.org) setOrg(r.org);
        if (r.city) setCity(r.city);
        if (r.ogrn) setOgrn(r.ogrn);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [inn]);

  const innCheck = inn.length >= 10 ? checkInn(inn) : null;
  const ogrnCheck = ogrn ? checkOgrn(ogrn) : null;
  const editable = manual || reg.status === "found";
  const filled = Boolean(org && (reg.status === "found" || manual));

  const values = useMemo(
    () => valuesFor(sealKind, { org: org || "Наименование", city: city || "Город", inn, ogrn }),
    [sealKind, org, city, inn, ogrn],
  );

  const mountItem = catalog.mounts[mount];
  const total =
    catalog.prices.stamp +
    (mountItem.mode === "included" ? 0 : mountItem.cost) +
    (urgency === "rush" ? catalog.prices.rush : 0) +
    (ownLayout ? catalog.prices.ownLayout : 0);

  const currentTemplate = variants.find((v) => v.tpl.id === tpl) ?? variants[0];
  const money = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

  const onChoose = useCallback((id: string) => setTpl(id), []);
  const onVariants = useCallback((list: Scored[]) => setVariants(list), []);

  if (screen === "start") {
    return (
      <StartScreen
        onPick={(kind, sit) => {
          setSel(kind);
          setSituation(sit);
          setTpl(null);
          setScreen("build");
        }}
      />
    );
  }

  if (screen === "checkout") {
    return (
      <Checkout
        kindTitle={kindItem.title}
        layoutTitle={currentTemplate?.tpl.title ?? "Макет"}
        total={total}
        ownLayout={ownLayout}
        mountName={mountItem.name}
        mountCost={mountItem.mode === "included" ? 0 : mountItem.cost}
        urgency={urgency}
        onBack={() => setScreen("build")}
      />
    );
  }

  return (
    <main
      className="mx-auto flex w-full flex-1 flex-col gap-4"
      style={{ maxWidth: 1180, padding: "clamp(20px,4vw,40px) clamp(16px,4vw,48px)" }}
    >
      {/* ——— шапка ——— */}
      <section className="card">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setInn(""); setOrg(""); setCity(""); setOgrn(""); setManual(false);
              setReg({ status: "idle" }); setTpl(null); setScreen("start");
            }}
            className="text-[13px] text-[var(--color-accent)]"
          >
            {texts.breadcrumbRestart}
          </button>
          <span className="h-[14px] w-px bg-[var(--color-divider)]" />
          <span className="text-[12.5px] text-[color-mix(in_srgb,var(--color-text)_50%,transparent)]">
            Печать · {kindItem.ent}
          </span>
          {situation && (startTexts.bring as Record<string, string>)[situation] && (
            <>
              <span className="h-[14px] w-px bg-[var(--color-divider)]" />
              <span className="min-w-0 truncate text-[12.5px] text-[color-mix(in_srgb,var(--color-text)_50%,transparent)]">
                Понадобится: {(startTexts.bring as Record<string, string>)[situation]}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
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
                className="rounded-full px-[13px] py-[6px] text-[12.5px]"
                style={
                  urgency === u
                    ? { background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }
                    : { color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }
                }
              >
                {u === "rush" ? texts.urgency.rush : texts.urgency.calm}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-[14px] flex flex-wrap items-end justify-between gap-4 border-t border-[var(--color-divider)] pt-4">
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            <PriceRow label={`${texts.price.stampRow} · ${currentTemplate?.tpl.title ?? "макет"}`} value={money(catalog.prices.stamp)} />
            <PriceRow
              label={`${texts.price.mountRow} · ${mountItem.name}`}
              value={mountItem.mode === "included" ? texts.price.included : `+ ${money(mountItem.cost)}`}
              muted={mountItem.mode === "included"}
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

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11.5px] text-[color-mix(in_srgb,var(--color-text)_52%,transparent)]">
                {texts.price.total}
              </div>
              <div className="text-[26px] font-semibold leading-tight">
                {ownLayout ? "от " : ""}
                {money(total)}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary px-5 py-3 text-[15px]"
              disabled={!filled}
              onClick={() => setScreen("checkout")}
            >
              {texts.price.cta}
            </button>
          </div>
        </div>
      </section>

      {/* ——— реквизиты и превью ——— */}
      <div className="two-col">
        <section className="card">
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
              <div className="text-[12px] font-semibold uppercase" style={{ color: "var(--ok)" }}>
                ✓ {texts.requisites.foundBadge}
              </div>
              <div className="mt-1 text-[16px] font-semibold">{org}</div>
              <div className="text-[13px] text-[color-mix(in_srgb,var(--color-text)_72%,transparent)]">
                ИНН {inn} / {ogrn.length === 15 ? "ОГРНИП" : "ОГРН"} {ogrn} · {city}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[13px]">{texts.requisites.foundAsk}</span>
                <button type="button" className="btn btn-ghost px-3 py-1.5 text-[13px]" onClick={() => setManual(true)}>
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
          className="card"
          style={{
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
          />
          <Mounts value={mount} onChange={setMount} />
        </section>
      </div>
    </main>
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
    <div className="flex items-center gap-2">
      <div>
        <div className="text-[11.5px] text-[color-mix(in_srgb,var(--color-text)_52%,transparent)]">{label}</div>
        <div
          className="text-[15px] font-semibold"
          style={muted ? { color: "color-mix(in srgb, var(--color-text) 55%, transparent)" } : undefined}
        >
          {value}
        </div>
      </div>
      {onClear && (
        <button
          type="button"
          aria-label="Убрать срочность"
          onClick={onClear}
          className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
          style={{ background: "color-mix(in srgb, var(--color-text) 9%, transparent)" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
