import data from "@/content/mounts.json";

export type Mount = {
  id: string;
  brand: string;
  family: string;
  series: string;
  model: string;
  shape: "round" | "rect";
  kind: "auto" | "pocket" | "manual";
  kindLabel: string;
  diameterMm: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  material: string | null;
  colors: string | null;
  kit: string | null;
  price: number;
  /** цена до скидки — в прайсе её пока нет, поле под будущие акции */
  priceOld?: number | null;
  note: string | null;
};

export const MOUNTS = data.items as Mount[];
export const ROUND_SIZES = data.roundSizes as number[];

/** Размер поля под клише строкой: Ø42 или 38×14 мм. */
export function sizeLabel(m: Mount): string {
  if (m.diameterMm) return `Ø${m.diameterMm} мм`;
  if (m.lengthMm && m.widthMm) return `${m.lengthMm}×${m.widthMm} мм`;
  return "размер уточняется";
}

export const KIND_LABEL: Record<Mount["kind"], string> = {
  auto: "Автоматическая",
  pocket: "Карманная",
  manual: "Ручная",
};

/**
 * Оснастки под печать заданного диаметра.
 *
 * Размер в прайсе — поле под клише. Клише меньше поля поставить можно,
 * больше — нет, поэтому берём оснастки с полем не меньше печати и не более
 * чем на пару миллиметров больше. Правило не умозрительное: круглых Trodat
 * с полем ровно Ø40 в прайсе нет, их классика 4642 — это поле Ø42,
 * и при строгом равенстве под печать Ø40 не нашлось бы ни одной Trodat.
 */
export function forDiameter(diameterMm: number, slack = 2.5): Mount[] {
  return MOUNTS
    .filter((m) => m.shape === "round" && m.diameterMm !== null
      && m.diameterMm >= diameterMm - 0.6
      && m.diameterMm <= diameterMm + slack)
    .sort((a, b) => a.price - b.price);
}

/** Ближайшие размеры, если точного совпадения нет — чтобы было что предложить. */
export function nearestSizes(diameterMm: number, count = 2): number[] {
  return [...ROUND_SIZES]
    .sort((a, b) => Math.abs(a - diameterMm) - Math.abs(b - diameterMm))
    .slice(0, count)
    .sort((a, b) => a - b);
}
