"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Builder from "@/components/Builder";
import SituationPicker from "@/components/SituationPicker";
import SiteHeader from "@/components/SiteHeader";
import HelpCard from "@/components/HelpCard";
import { useOrder } from "@/components/OrderState";

/**
 * Конструктор. Ситуация живёт в адресе (?s=ip&k=ip), поэтому «назад» из
 * сборки возвращает к выбору ситуации, а ссылку можно переслать.
 */
function Screen() {
  const router = useRouter();
  const params = useSearchParams();
  const sit = params.get("s");
  const kind = params.get("k");
  const mount = params.get("mount");
  const { situation, pick } = useOrder();
  // помощь на телефоне зовут из нижней панели — счётчик нажатий
  const [help, setHelp] = useState(0);

  // адрес — источник правды: при заходе по ссылке состояние берём из него
  useEffect(() => {
    if (sit && kind && sit !== situation) pick(kind, sit, mount ?? undefined);
  }, [sit, kind, mount, situation, pick]);

  if (!sit) {
    return (
      <>
        <SiteHeader onHome={() => router.push("/")} />
        <SituationPicker
          onPick={(k, s) => router.push(`/konstruktor?s=${s}&k=${k}`)}
          onHelp={() => setHelp((n) => n + 1)}
        />
        <HelpCard openSignal={help} />
      </>
    );
  }
  if (!situation) return null;   // ждём, пока состояние подхватит адрес
  return <Builder />;
}

export default function ConstructorPage() {
  return (
    <Suspense>
      <Screen />
    </Suspense>
  );
}
