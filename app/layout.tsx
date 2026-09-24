import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OrderProvider } from "@/components/OrderState";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Конструктор печати — Лаборатория печатей",
  description:
    "Печати и штампы для ИП и ООО в Оренбурге: реквизиты по ИНН, выбор макета и оснастки, изготовление за час.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      {/* Sticky footer: контент тянется, футер не всплывает на коротких страницах */}
      <body className="flex min-h-screen flex-col">
        {/* состояние заказа над маршрутами: переход между экранами его не теряет */}
        <OrderProvider>{children}</OrderProvider>
      </body>
    </html>
  );
}
