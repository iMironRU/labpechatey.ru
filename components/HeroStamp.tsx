"use client";

import home from "@/content/home.json";
import HeroMark from "@/components/HeroMark";

/**
 * Оттиск в герое — ровно тот, что в прототипе главной: три кольца,
 * наименование по верхней дуге, город по нижней, микротекст по внешнему
 * кольцу и логотип в центре.
 *
 * Конструктор рисует оттиск по-другому — там наш движок шаблонов с подбором
 * под длину. Здесь же фиксированная картинка бренда, ей подбор не нужен.
 */
export default function HeroStamp() {
  const micro = home.hero.micro.repeat(3);
  const org = home.hero.stampOrg.toUpperCase();

  return (
    <svg viewBox="0 0 300 300" width="100%" height="100%" aria-label="Оттиск печати">
      <defs>
        <path id="heroArcTop" d="M39.1,190.4 A118,118 0 1 1 260.9,190.4" />
        <path id="heroArcBot" d="M44,205 A112,112 0 0 0 256,205" />
        <path id="heroMicro" d="M150,17 A133,133 0 1 1 149.9,17" />
      </defs>

      <g fill="none" stroke="currentColor">
        <circle cx="150" cy="150" r="146" strokeWidth="3" />
        <circle cx="150" cy="150" r="139" strokeWidth="1.1" />
        <circle cx="150" cy="150" r="66" strokeWidth="1.3" />
      </g>

      <text fontSize="6.5" letterSpacing="0.5" fill="currentColor" fontFamily="Inter, sans-serif">
        <textPath href="#heroMicro" startOffset="0">{micro}</textPath>
      </text>

      <text
        fontSize="15.5"
        fontWeight="600"
        letterSpacing="0.4"
        fill="currentColor"
        fontFamily="Inter, sans-serif"
        textAnchor="middle"
      >
        <textPath href="#heroArcTop" startOffset="50%">{org}</textPath>
      </text>

      <text
        fontSize="11"
        letterSpacing="0.6"
        fill="currentColor"
        fontFamily="Inter, sans-serif"
        textAnchor="middle"
      >
        <textPath href="#heroArcBot" startOffset="50%">{home.hero.stampCity}</textPath>
      </text>

      <g fill="currentColor">
        <circle cx="34" cy="150" r="2.2" />
        <circle cx="266" cy="150" r="2.2" />
      </g>

      {/* знак в центре — тем же цветом, что и краска оттиска */}
      <HeroMark x={124} y={128} size={52} />
    </svg>
  );
}
