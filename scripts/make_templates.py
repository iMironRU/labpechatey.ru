#!/usr/bin/env python3
"""Шаблоны печатей по макету «Конструктор — реквизиты».

    python3 scripts/make_templates.py

В прототипе оттиск нарисован простыми окружностями (метод roundSvg в
«Главная.dc.html»): внешнее кольцо, тонкое внутреннее, круг в центре,
микротекст по кольцу, наименование по верхней дуге, город по нижней.
Отсюда и берём геометрию, пересчитав 300 единиц макета в миллиметры:
внешний радиус 146 → 19.5 мм, тонкий 139 → 18.57, центр 66 → 8.82.

Четыре раскладки — те же, что в макете: «Стандарт ГОСТ», «Компактный»,
«Расширенный», «С двойным кольцом». Кегли подняты до производственного
минимума 1.8 мм (в макете нижняя дуга 1.47 мм — для эскиза годится, для
лазера нет), микротекст оставлен 0.8 мм по ГОСТ Р 51511.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "templates"

K = 19.5 / 146          # масштаб макета в миллиметры
R_OUT = 146 * K         # внешнее кольцо
R_THIN = 139 * K        # тонкое кольцо
R_MICRO = 133 * K       # микротекст
# верхняя дуга чуть ниже макетной (118): при 2.1 мм буквы доставали до
# кольца микротекста и пересекали его
R_TOP = 114 * K
R_BOT = 112 * K         # нижняя дуга
# в макете круг в центре r=66 (8.8 мм). При минимально читаемых 1.8 мм
# туда не влезает ни «ИНН 5610100213», ни «ООО «Ромашка»» — расширили до
# 11.2 мм; верхняя дуга по той же причине раскрыта до 215°, иначе полная
# форма «Общество с ограниченной ответственностью …» не помещается
R_CENTER = 11.2

MICRO = "· лаборатория печатей · оренбург · гост · лазер 1000 dpi "


def arc(r: float, span_deg: float, top: bool) -> str:
    """Путь дуги вокруг центра, текст читается слева направо.

    Дуга режется на две половины: у одной команды A при размахе больше
    180° два подходящих центра, и браузер выбирает не тот — текст уезжал
    выше рисунка. Половинами неоднозначности нет.
    """
    a = math.radians(span_deg / 2)
    x, y = r * math.sin(a), r * math.cos(a)
    if top:
        # слева-вверх → верх → справа-вверх, по часовой стрелке
        return (f"M {-x:.2f} {-y:.2f} A {r:.2f} {r:.2f} 0 0 1 0 {-r:.2f}"
                f" A {r:.2f} {r:.2f} 0 0 1 {x:.2f} {-y:.2f}")
    # слева-вниз → низ → справа-вниз, против часовой
    return (f"M {-x:.2f} {y:.2f} A {r:.2f} {r:.2f} 0 0 0 0 {r:.2f}"
            f" A {r:.2f} {r:.2f} 0 0 0 {x:.2f} {y:.2f}")


def field(key: str, *, arc_id: str | None = None, y: float = 0.0, size: float = 2.0,
          tracking: float = 0.0) -> str:
    """Группа поля: движок ищет f_<ключ> и подставляет текст."""
    ls = f' letter-spacing="{tracking:.2f}"' if tracking else ""
    if arc_id:
        return (f'  <g id="f_{key}">\n'
                f'    <text font-size="{size}"{ls} text-anchor="middle" fill="currentColor">\n'
                f'      <textPath href="#{arc_id}" startOffset="50%"></textPath>\n'
                f'    </text>\n  </g>')
    return (f'  <g id="f_{key}">\n'
            f'    <text x="0" y="{y}" font-size="{size}"{ls} text-anchor="middle"'
            f' fill="currentColor"></text>\n  </g>')


def micro_ring() -> str:
    text = (MICRO * 3).strip()
    return ('  <g id="s_micro">\n'
            f'    <text font-size="0.8" letter-spacing="0.06" fill="currentColor">\n'
            f'      <textPath href="#b_micro" startOffset="0">{text}</textPath>\n'
            '    </text>\n  </g>')


def rings(variant: str) -> str:
    out = ['  <g id="s_frame" fill="none" stroke="currentColor">']
    out.append(f'    <circle cx="0" cy="0" r="{R_OUT:.2f}" stroke-width="0.4"/>')
    if variant == "double":
        out.append(f'    <circle cx="0" cy="0" r="{R_OUT - 0.75:.2f}" stroke-width="0.3"/>')
    if variant != "compact":
        out.append(f'    <circle cx="0" cy="0" r="{R_THIN:.2f}" stroke-width="0.15"/>')
        out.append(f'    <circle cx="0" cy="0" r="{R_CENTER:.2f}" stroke-width="0.18"/>')
    out.append("  </g>")
    return "\n".join(out)


# раскладки: заголовок, что на верхней дуге, нижняя дуга, строки в центре,
# микротекст, круг в центре. «full» — полное наименование, ему нужна дуга
# пошире: «Общество с ограниченной ответственностью «…»» это под 50 знаков.
VARIANTS = {
    "gost":     ("Стандарт ГОСТ", "full", "city", ["name_line", "inn"], True, True),
    "compact":  ("Компактный", "short", "city", ["inn"], False, False),
    "extended": ("Расширенный", "full", "ogrn", ["name_line", "inn", "city"], True, True),
    "double":   ("С двойным кольцом", "full", "city", ["name_line", "inn"], True, True),
}
TOP_SPAN = {"full": 250, "short": 215}

KINDS = {
    # у ИП «шапка» дуги одна и та же, у организации — полная и краткая форма
    "ip": {"full": "label_ip", "short": "label_ip", "line": "fio"},
    "ooo": {"full": "name", "short": "name_short", "line": "name_short"},
}

CENTER_Y = {
    2: [(-0.6, 2.0), (2.6, 1.8)],
    3: [(-2.6, 1.9), (0.6, 1.8), (3.8, 1.8)],
    1: [(0.8, 2.4)],
}


def build(kind: str, variant: str) -> tuple[str, str]:
    title, top_form, bottom, center_keys, micro, has_center = VARIANTS[variant]
    k = KINDS[kind]
    top = k[top_form]
    tid = f"{kind}-{variant}-40"
    keys = [c for c in center_keys if not (c == "name_line" and k["line"] == top)]
    keys = [k["line"] if c == "name_line" else c for c in keys]
    ys = CENTER_Y[len(keys)]

    fields: dict[str, dict] = {
        top: {"role": "top-arc", "kind": "arc", "size": 2.1, "minSize": 1.8, "maxSize": 2.4},
        bottom: {"role": bottom, "kind": "arc", "size": 1.9, "minSize": 1.8, "maxSize": 2.1},
    }
    if bottom == "ogrn":
        fields["ogrn"]["prefix"] = "ОГРН "
    for key, (y, size) in zip(keys, ys):
        spec = {"role": key, "kind": "line", "size": size, "minSize": 1.8, "maxSize": size + 0.3}
        if key == "inn":
            spec["prefix"] = "ИНН "
        if key == "ogrn":
            spec["prefix"] = "ОГРН "
        fields[key] = spec

    meta = {
        "version": 2,
        "id": tid,
        "title": title,
        "kinds": [kind],
        "diameterMm": 40,
        "frame": {
            "asset": "прототип «Главная.dc.html», метод roundSvg",
            "freeRadiusMm": round(R_THIN - 0.6, 2),
            # строки в центре ограничены кругом, а без круга — свободным полем
            "innerRadiusMm": round(R_CENTER - 0.5 if has_center else R_TOP - 2.0, 2),
        },
        "defaults": {"font": "PT Sans", "case": "upper", "tracking": 0.06,
                     "align": "middle", "overflow": "shrink"},
        "fields": fields,
    }

    defs = [f'    <path id="b_{top}" d="{arc(R_TOP, TOP_SPAN[top_form], True)}"/>',
            f'    <path id="b_{bottom}" d="{arc(R_BOT, 125, False)}"/>']
    if micro:
        defs.append(f'    <path id="b_micro" d="{arc(R_MICRO, 359.9, True)}"/>')

    body = [rings(variant)]
    if micro:
        body.append(micro_ring())
    body.append(field(top, arc_id=f"b_{top}", size=2.1, tracking=0.12))
    body.append(field(bottom, arc_id=f"b_{bottom}", size=1.9, tracking=0.1))
    for key, (y, size) in zip(keys, ys):
        body.append(field(key, y=y, size=size))

    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:seal="https://rpk-seal.local/ns/1"
     viewBox="-21.0 -21.0 42.0 42.0" width="42.0mm" height="42.0mm">

  <title>{title}</title>
  <desc>Геометрия из прототипа «Главная.dc.html» (roundSvg), пересчитана в миллиметры под Ø40.</desc>

  <metadata><seal:template version="2">{json.dumps(meta, ensure_ascii=False, indent=1)}</seal:template></metadata>

  <defs>
{chr(10).join(defs)}
  </defs>

{chr(10).join(body)}
</svg>
"""
    return tid, svg


def main() -> int:
    made = []
    for kind in KINDS:
        for variant in VARIANTS:
            tid, svg = build(kind, variant)
            (OUT / f"{tid}.svg").write_text(svg, encoding="utf-8")
            made.append(tid)
    print("собрано:", ", ".join(made))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
