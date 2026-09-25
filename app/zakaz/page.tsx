"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import OrderDone from "@/components/OrderDone";
import SiteHeader from "@/components/SiteHeader";
import { useOrder } from "@/components/OrderState";

/** «Заказ принят». Прямой заход без оформленного заказа уводит на главную. */
export default function DonePage() {
  const router = useRouter();
  const o = useOrder();
  // заказ достают из sessionStorage после монтирования — до этого момента
  // «нет заказа» ещё ничего не значит
  useEffect(() => {
    if (o.restored && !o.placed) router.replace("/");
  }, [o.restored, o.placed, router]);

  if (!o.placed) return null;

  return (
    <>
      <SiteHeader onHome={() => router.push("/")} />
      <OrderDone order={o.placed} />
    </>
  );
}
