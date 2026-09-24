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
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* тему ставим до первой отрисовки: раньше атрибут появлялся в
            useEffect, и при тёмной схеме страница успевала мигнуть белым */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(()=>{try{var s=localStorage.getItem('theme');" +
              "var d=s?s==='dark':matchMedia('(prefers-color-scheme: dark)').matches;" +
              "var e=document.documentElement;e.setAttribute('data-theme',d?'dark':'light');" +
              "e.style.colorScheme=d?'dark':'light';}catch(e){}})()",
          }}
        />
      </head>
      {/* Sticky footer: контент тянется, футер не всплывает на коротких страницах */}
      <body className="flex min-h-screen flex-col">
        {/* состояние заказа над маршрутами: переход между экранами его не теряет */}
        <OrderProvider>{children}</OrderProvider>
      </body>
    </html>
  );
}
