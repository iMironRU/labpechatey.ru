"use client";

import MountsCatalog from "@/components/MountsCatalog";
import SiteHeader from "@/components/SiteHeader";

/**
 * Тестовая страница каталога оснасток.
 *
 * В макетах её нет: на главной остался только якорь #tools, а сам раздел
 * заказчик просил убрать. Страница нужна, чтобы посмотреть подбор по
 * размерам на реальных фото, пока не сняли свои.
 */
export default function OsnastkiPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full flex-1" style={{ maxWidth: 1200, padding: "0 clamp(18px,4vw,56px) clamp(40px,5vw,64px)" }}>
        <div
          className="mt-6 rounded-[12px] border border-dashed border-[var(--color-divider)] px-4 py-3 text-[12.5px]"
          style={{ color: "color-mix(in srgb, var(--color-text) 62%, transparent)" }}
        >
          Тестовая страница. Фотографии — временные, взяты у поставщиков как
          референс и помечены их водяными знаками; в продакшене заменим своей
          съёмкой. 104 фото на 116 позиций прайса.
        </div>
        <MountsCatalog />
      </main>
    </>
  );
}
