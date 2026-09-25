"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import catalog from "@/content/catalog.json";
import { checkInn, checkOgrn, type Registry } from "@/lib/inn";
import { lookupInn } from "@/lib/api";
import { valuesFor, type Kind, type Scored, type TemplateIndex } from "@/lib/stamp";
import { forDiameter } from "@/lib/mounts";
import { asset } from "@/lib/paths";

/**
 * Состояние заказа живёт над маршрутами.
 *
 * Экраны разнесены по адресам (/, /konstruktor, /oformlenie), чтобы
 * работала кнопка «назад» и ссылку можно было отправить. При переходе
 * между ними React-состояние сохраняется только если провайдер стоит в
 * layout — поэтому он здесь, а не на странице.
 */
function useOrderState() {
  // состояние конструктора — см. design-ref/README.md, раздел State Management
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
  // оснастка, выбранная в каталоге: индекс в ленте зависит от диаметра,
  // поэтому храним артикул и ищем его в подходящих
  const [mountId, setMountId] = useState<string | null>(null);
  const [tpl, setTpl] = useState<string | null>(null);
  const [index, setIndex] = useState<TemplateIndex[]>([]);
  const [variants, setVariants] = useState<Scored[]>([]);

  const kindItem = catalog.kinds.find((k) => k.id === sel) ?? catalog.kinds[0];
  // «свой макет»: либо ситуация-копия, либо человек сам нажал загрузку
  const [ownPicked, setOwnPicked] = useState(false);
  const ownLayout = kindItem.copy || ownPicked;
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

  const diameter = (variants.find((v) => v.tpl.id === tpl) ?? variants[0])?.tpl.diameterMm ?? 40;
  const fitting = forDiameter(diameter);
  const byId = mountId ? fitting.findIndex((m) => m.id === mountId) : -1;
  const mountItem = fitting[byId >= 0 ? byId : mount] ?? fitting[0];
  // самая дешёвая подходящая входит в цену печати, остальные — доплатой к ней
  const mountExtra = mountItem && fitting[0] ? mountItem.price - fitting[0].price : 0;
  const total =
    catalog.prices.stamp +
    mountExtra +
    (urgency === "rush" ? catalog.prices.rush : 0) +
    (ownLayout ? catalog.prices.ownLayout : 0);

  const currentTemplate = variants.find((v) => v.tpl.id === tpl) ?? variants[0];
  const money = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

  const onChoose = useCallback((id: string) => { setTpl(id); setMount(0); }, []);
  const onVariants = useCallback((list: Scored[]) => setVariants(list), []);


  const pick = useCallback((kind: string, sit: string, mountFromCatalog?: string) => {
    setSel(kind);
    setSituation(sit);
    setTpl(null);
    setOwnPicked(false);
    setMountId(mountFromCatalog ?? null);
    setMount(0);
  }, []);

  const reset = useCallback(() => {
    setInn(""); setOrg(""); setCity(""); setOgrn(""); setManual(false);
    setReg({ status: "idle" }); setTpl(null); setSituation(null); setOwnPicked(false);
  }, []);

  return {
    situation, sel, setSel, inn, setInn, reg, manual, setManual, org, setOrg, city, setCity,
    ogrn, setOgrn, urgency, setUrgency, mount, setMount, mountId, setMountId, tpl, setTpl, index, variants,
    ownPicked, setOwnPicked,
    kindItem, ownLayout, sealKind, innCheck, ogrnCheck, editable, filled, values,
    diameter, mountItem, mountExtra, total, currentTemplate, money, onChoose, onVariants,
    pick, reset,
  };
}

type Order = ReturnType<typeof useOrderState>;
const Ctx = createContext<Order | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={useOrderState()}>{children}</Ctx.Provider>;
}

export function useOrder() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOrder вне OrderProvider");
  return v;
}
