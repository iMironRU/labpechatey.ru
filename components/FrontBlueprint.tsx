"use client";

/**
 * Фон первого экрана: чертёж печати.
 *
 * В макете это растровая подложка, вектора от дизайнера пока нет (вопрос 3.3),
 * поэтому чертёж собран здесь: оттиск с текстом по дугам, размерные линии,
 * выноски и монтажные метки. Зато он векторный и его можно двигать — заказчик
 * просил зацикленную анимацию. При «уменьшить движение» всё замирает.
 */
export default function FrontBlueprint() {
  const ink = "rgba(255,255,255,.22)";
  const faint = "rgba(255,255,255,.13)";
  const text = "rgba(255,255,255,.16)";

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1400 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <path id="bp-arc-top" d="M 930 -110 A 450 450 0 0 1 1380 340" />
        <path id="bp-arc-out" d="M 450 340 A 480 480 0 0 1 930 -140" />
        <path id="bp-arc-name" d="M 700 585 A 330 330 0 0 1 700 95" />
        <path id="bp-arc-num" d="M 1160 95 A 330 330 0 0 1 1160 585" />
      </defs>

      {/* ——— размерная сетка ——— */}
      <g stroke={faint} fill="none" strokeWidth="1">
        <path d="M 60 60 H 1340 M 60 60 V 920" strokeDasharray="2 10" />
        <path d="M 150 120 h 120 m 0 0 l -12 -6 m 12 6 l -12 6" />
        <path d="M 150 860 H 980" strokeDasharray="14 9" />
        <path d="M 1120 140 v 240 m 0 0 l -6 -12 m 6 12 l 6 -12" />
        <rect x="1060" y="620" width="150" height="110" strokeDasharray="4 7" />
        <rect x="1240" y="620" width="120" height="110" strokeDasharray="4 7" />
        <path d="M 1180 60 l 90 90 M 1270 60 l -90 90" strokeDasharray="3 8" />
        <circle cx="1255" cy="705" r="46" strokeDasharray="5 9" />
        <path d="M 1209 705 h 92 M 1255 659 v 92" strokeDasharray="5 9" />
      </g>

      <g fill={text} fontSize="19" letterSpacing="4" fontFamily="Inter, sans-serif">
        <text x="150" y="150">NS15</text>
        <text x="1180" y="430">NS16</text>
        <text x="1180" y="480">UK16</text>
        <text x="150" y="845">FQ56</text>
        <text x="900" y="845">FQ48</text>
      </g>

      {/* ——— оттиск ——— */}
      <g className="bp-seal" style={{ transformOrigin: "930px 340px" }}>
        <g stroke={ink} fill="none">
          <circle cx="930" cy="340" r="420" strokeWidth="3" />
          <circle cx="930" cy="340" r="396" strokeWidth="1.5" />
          <circle cx="930" cy="340" r="236" strokeWidth="1.5" />
          <circle cx="930" cy="340" r="214" strokeWidth="1" strokeDasharray="3 9" />
        </g>
        <g fill={text} fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="3">
          <text fontSize="34" textAnchor="middle">
            <textPath href="#bp-arc-name" startOffset="50%">ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ</textPath>
          </text>
          <text fontSize="34" textAnchor="middle">
            <textPath href="#bp-arc-num" startOffset="50%">ОГРН 0123456789 ✻ НАИМЕНОВАНИЕ</textPath>
          </text>
          <text fontSize="22" letterSpacing="6" textAnchor="middle" x="930" y="350">ДЛЯ ДОКУМЕНТОВ</text>
        </g>
      </g>

      {/* ——— подписи полей ——— */}
      <g fill={text} fontSize="21" letterSpacing="6" fontFamily="Inter, sans-serif">
        <text textAnchor="middle">
          <textPath href="#bp-arc-top" startOffset="50%">MARGIN AREA</textPath>
        </text>
        <text textAnchor="middle">
          <textPath href="#bp-arc-out" startOffset="50%">MINIMAL MARGIN AREA</textPath>
        </text>
      </g>

      <style>{`
        .bp-seal { animation: bp-spin 160s linear infinite; }
        @keyframes bp-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .bp-seal { animation: none; } }
      `}</style>
    </svg>
  );
}
