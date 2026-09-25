#!/usr/bin/env python3
"""Шаблоны печатей — из метода stampSvg прототипа «Конструктор — реквизиты».

    python3 scripts/make_templates.py

Все четыре раскладки заданы в самом прототипе, отличаются только
кольцами; подписи у них одинаковые. Здесь ровно те же числа, переведённые
из 300 единиц макета в миллиметры: внешний край оттиска (r=146 плюс
половина обводки) ложится на Ø40, отсюда масштаб.

    std      146/3 · 139/1.1 · 66/1.3            + микротекст
    compact  146/3 · 74/1.3
    full     146/3 · 141/1 · 122/0.9 · 62/1.3    + микротекст
    ring     146/4 · 138/4 · 66/1.3

Поля прототипа: наименование по верхней дуге (R=118, 15px), город по
нижней (R=112, 11px), в центре наименование (12px) и ИНН (9.5px), точки
по бокам. Кегли в миллиметрах выходят мельче производственного минимума
1.8 мм — это сознательное следование макету, а не недосмотр.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "templates"

# 146 + половина самой толстой обводки (4/2) = 148 единиц ↔ радиус Ø40
K = 20.0 / 148
MM = lambda u: round(u * K, 2)          # noqa: E731 — короткая запись читается лучше

MICRO = "· лаборатория печатей · оренбург · гост · лазер 1000 dpi "

# кольца каждой раскладки: (радиус, толщина) в единицах макета
RINGS = {
    "std": [(146, 3), (139, 1.1), (66, 1.3)],
    "compact": [(146, 3), (74, 1.3)],
    "full": [(146, 3), (141, 1), (122, 0.9), (62, 1.3)],
    "ring": [(146, 4), (138, 4), (66, 1.3)],
}
TITLES = {"std": "Стандарт ГОСТ", "compact": "Компактный",
          "full": "Расширенный", "ring": "С двойным кольцом"}
MICRO_IN = {"std", "full"}              # микротекст только у этих двух

# радиус внутреннего круга — последнее кольцо раскладки
INNER = {k: v[-1][0] for k, v in RINGS.items()}

KINDS = {
    "ip": {"arc": "label_ip", "line": "fio"},
    "ooo": {"arc": "name", "line": "name_short"},
}


def arc(r_u: float, span_deg: float, top: bool) -> str:
    """Дуга двумя половинами: у одной команды A при размахе >180° два центра."""
    r = r_u * K
    a = math.radians(span_deg / 2)
    x, y = r * math.sin(a), r * math.cos(a)
    if top:
        return (f"M {-x:.2f} {-y:.2f} A {r:.2f} {r:.2f} 0 0 1 0 {-r:.2f}"
                f" A {r:.2f} {r:.2f} 0 0 1 {x:.2f} {-y:.2f}")
    return (f"M {-x:.2f} {y:.2f} A {r:.2f} {r:.2f} 0 0 0 0 {r:.2f}"
            f" A {r:.2f} {r:.2f} 0 0 0 {x:.2f} {y:.2f}")


def build(kind: str, variant: str) -> tuple[str, str]:
    k = KINDS[kind]
    tid = f"{kind}-{variant}-40"
    inner_mm = MM(INNER[variant])

    # размеры из прототипа: 15 / 11 / 12 / 9.5 единиц и трекинг 0.4 / 0.6
    fields = {
        k["arc"]: {"role": "top-arc", "kind": "arc", "size": MM(15), "minSize": MM(15) - 0.3},
        "city": {"role": "city", "kind": "arc", "size": MM(11), "minSize": MM(11) - 0.2},
        k["line"]: {"role": "center-name", "kind": "line", "size": MM(12), "minSize": MM(12) - 0.3},
        "inn": {"role": "inn", "kind": "line", "size": MM(9.5), "minSize": MM(9.5) - 0.2,
                "prefix": "ИНН "},
    }

    meta = {
        "version": 2,
        "id": tid,
        "title": TITLES[variant],
        "kinds": [kind],
        "diameterMm": 40,
        "frame": {
            "asset": "прототип «Конструктор — реквизиты», метод stampSvg",
            "freeRadiusMm": MM(RINGS[variant][-2][0] if len(RINGS[variant]) > 2 else 139),
            "innerRadiusMm": round(inner_mm - 0.4, 2),
        },
        "defaults": {"font": "PT Sans", "case": "upper", "tracking": 0.03,
                     "align": "middle", "overflow": "shrink"},
        "fields": fields,
    }

    defs = [f'    <path id="b_{k["arc"]}" d="{arc(118, 220, True)}"/>',
            f'    <path id="b_city" d="{arc(112, 125, False)}"/>']
    if variant in MICRO_IN:
        defs.append(f'    <path id="b_micro" d="{arc(133, 359.9, True)}"/>')

    body = ['  <g id="s_frame" fill="none" stroke="currentColor">']
    for r_u, w_u in RINGS[variant]:
        body.append(f'    <circle cx="0" cy="0" r="{MM(r_u)}" stroke-width="{MM(w_u)}"/>')
    body.append("  </g>")
    # точки по бокам — как в прототипе (x=34 и 266 при центре 150)
    body.append(f'  <g id="s_dots" fill="currentColor">\n'
                f'    <circle cx="{-MM(116)}" cy="0" r="{MM(2.2)}"/>\n'
                f'    <circle cx="{MM(116)}" cy="0" r="{MM(2.2)}"/>\n  </g>')
    if variant in MICRO_IN:
        body.append('  <g id="s_micro">\n'
                    f'    <text font-size="{MM(6.5)}" letter-spacing="{MM(0.5)}" fill="currentColor">\n'
                    f'      <textPath xlink:href="#b_micro" href="#b_micro" startOffset="0">{(MICRO * 3).strip()}</textPath>\n'
                    '    </text>\n  </g>')

    def arc_field(key: str, path: str, size: float, tracking: float) -> str:
        return (f'  <g id="f_{key}">\n'
                f'    <text font-size="{size}" letter-spacing="{tracking}" text-anchor="middle"'
                f' fill="currentColor">\n'
                f'      <textPath xlink:href="#{path}" href="#{path}" startOffset="50%"></textPath>\n'
                f'    </text>\n  </g>')

    def line_field(key: str, y: float, size: float, weight: str = "") -> str:
        w = f' font-weight="{weight}"' if weight else ""
        return (f'  <g id="f_{key}">\n'
                f'    <text x="0" y="{y}" font-size="{size}"{w} text-anchor="middle"'
                f' fill="currentColor"></text>\n  </g>')

    body.append(arc_field(k["arc"], f'b_{k["arc"]}', MM(15), MM(0.4)))
    body.append(arc_field("city", "b_city", MM(11), MM(0.6)))
    body.append(line_field(k["line"], MM(146 - 150), MM(12), "600"))
    body.append(line_field("inn", MM(163 - 150), MM(9.5)))

    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:seal="https://rpk-seal.local/ns/1"
     viewBox="-21.0 -21.0 42.0 42.0" width="42.0mm" height="42.0mm">

  <title>{TITLES[variant]}</title>
  <desc>Раскладка {variant} из метода stampSvg прототипа «Конструктор — реквизиты», в миллиметрах.</desc>

  <metadata><seal:template version="2">{json.dumps(meta, ensure_ascii=False, indent=1)}</seal:template></metadata>

  <defs>
{chr(10).join(defs)}
  </defs>

{chr(10).join(body)}
</svg>
"""
    return tid, svg


def main() -> int:
    for f in OUT.glob("*-40.svg"):
        f.unlink()
    made = []
    for kind in KINDS:
        for variant in RINGS:
            tid, svg = build(kind, variant)
            (OUT / f"{tid}.svg").write_text(svg, encoding="utf-8")
            made.append(tid)
    print("собрано:", ", ".join(made))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
