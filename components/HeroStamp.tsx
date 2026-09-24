"use client";

import home from "@/content/home.json";
import { MARK_INNER, MARK_VIEWBOX } from "@/components/markInner";

/**
 * Оттиск в герое — разметка один в один из «Главная.dc.html» (метод
 * roundSvg с big=true): радиусы 146/139/66, микротекст 6.5, дуги 15.5 и
 * 11, точки по бокам и фильтр шершавости. В центре — наш знак вместо
 * картинки-логотипа из прототипа.
 */
const MICRO = "· лаборатория печатей · оренбург · гост · лазер 1000 dpi ";

// знак квадратный, а место под логотип в макете 104×62 — держим высоту
const MARK_H = 62;
const MARK_W = +(MARK_H * (294.54 / 255.12)).toFixed(1);

export default function HeroStamp() {
  const org = (home.hero.stampOrg ?? "Лаборатория печатей").toUpperCase();
  const city = home.hero.stampCity ?? "г. Оренбург";

  const html = `
    <filter id="roughH">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1"/>
    </filter>
    <defs>
      <path id="arcTopH" d="M39.1,190.4 A118,118 0 1 1 260.9,190.4"></path>
      <path id="arcBotH" d="M44,205 A112,112 0 0 0 256,205"></path>
      <path id="microH" d="M150,17 A133,133 0 1 1 149.9,17"></path>
    </defs>
    <g fill="none" stroke="currentColor">
      <circle cx="150" cy="150" r="146" stroke-width="3"></circle>
      <circle cx="150" cy="150" r="139" stroke-width="1.1"></circle>
      <circle cx="150" cy="150" r="66" stroke-width="1.3"></circle>
    </g>
    <text font-size="6.5" letter-spacing="0.5" fill="currentColor" font-family="Inter, sans-serif">
      <textPath href="#microH" startOffset="0">${MICRO + MICRO + MICRO}</textPath>
    </text>
    <text font-size="15.5" font-weight="600" letter-spacing="0.4" fill="currentColor" font-family="Inter, sans-serif" text-anchor="middle">
      <textPath href="#arcTopH" startOffset="50%">${org}</textPath>
    </text>
    <text font-size="11" letter-spacing="0.6" fill="currentColor" font-family="Inter, sans-serif" text-anchor="middle">
      <textPath href="#arcBotH" startOffset="50%">${city}</textPath>
    </text>
    <g fill="currentColor">
      <circle cx="34" cy="150" r="2.2"></circle>
      <circle cx="266" cy="150" r="2.2"></circle>
    </g>
    <svg x="${(300 - MARK_W) / 2}" y="${150 - MARK_H / 2}" width="${MARK_W}" height="${MARK_H}"
      viewBox="${MARK_VIEWBOX}" fill="currentColor">${MARK_INNER}</svg>`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 300 300"
      style={{ display: "block", filter: "url(#roughH)" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
