"use client";

import { useRouter } from "next/navigation";
import Home from "@/components/Home";
import SiteHeader from "@/components/SiteHeader";
import { useOrder } from "@/components/OrderState";

export default function Page() {
  const router = useRouter();
  const { pick } = useOrder();

  return (
    <>
      <SiteHeader onConstructor={() => router.push("/konstruktor")} />
      <Home
        onPick={(kind, sit) => { pick(kind, sit); router.push(`/konstruktor?s=${sit}&k=${kind}`); }}
        onStart={() => router.push("/konstruktor")}
      />
    </>
  );
}
