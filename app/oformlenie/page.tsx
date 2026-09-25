"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Checkout from "@/components/Checkout";
import SiteHeader from "@/components/SiteHeader";
import { useOrder } from "@/components/OrderState";

/** Оформление заказа. Прямой заход без данных возвращает в конструктор. */
export default function CheckoutPage() {
  const router = useRouter();
  const o = useOrder();

  useEffect(() => {
    if (!o.situation) router.replace("/konstruktor");
  }, [o.situation, router]);
  if (!o.situation) return null;

  return (
    <>
      <SiteHeader onHome={() => router.push("/")} />
      <Checkout
        kindTitle={o.kindItem.title}
        layoutTitle={o.currentTemplate?.tpl.title ?? "Макет"}
        total={o.total}
        ownLayout={o.ownLayout}
        mountName={o.mountItem ? `${o.mountItem.brand} ${o.mountItem.model}` : "подберём вручную"}
        mountCost={o.mountExtra}
        urgency={o.urgency}
        thumbFile={o.currentTemplate?.tpl.file}
        thumbValues={o.currentTemplate?.values}
        onBack={() => router.push("/konstruktor")}
        onSubmit={(sent) => {
          o.place({
            kindTitle: o.kindItem.title,
            layoutTitle: o.currentTemplate?.tpl.title ?? "Макет",
            ownLayout: o.ownLayout,
            mountName: o.mountItem ? `${o.mountItem.brand} ${o.mountItem.model}` : "подберём вручную",
            mountCost: o.mountExtra,
            urgency: o.urgency,
            thumbFile: o.currentTemplate?.tpl.file,
            thumbValues: o.currentTemplate?.values,
            ...sent,
          });
          router.push("/zakaz");
        }}
      />
    </>
  );
}
