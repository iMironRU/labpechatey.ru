#!/usr/bin/env python3
"""Перевод макета дизайнера в наш формат шаблона.

    python3 scripts/convert_designer_svg.py ~/Downloads/O_01.svg

Дизайнер отдаёт файл из Illustrator: единицы в пунктах, центр в углу,
цвет классами, а текст по дуге разобран на отдельные буквы. Скрипт
достаёт из него геометрию как есть и пересобирает в наш вид:

  — координаты переводятся в миллиметры, центр в 0,0;
  — статика (кольца, звёзды) остаётся контурами, но красится currentColor;
  — дуги восстанавливаются по положению букв: через точки их привязки
    проводится окружность, из неё получается базовая линия b_<ключ>;
  — поля становятся одним <text>, куда движок подставит данные.

Результат — образец: дизайнеру видно на своём же макете, чего мы ждём.
"""
from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

PT_MM = 25.4 / 72          # экспорт Illustrator в пунктах
OUT = Path(__file__).resolve().parent.parent / "docs" / "образец-шаблона-O_01.svg"

# что в макете дизайнера соответствует нашим ключам
# рыба вместо исходной там, где у дизайнера текст был многострочным:
# движок подставляет строку целиком и переносов не делает
SAMPLE_OVERRIDE = {"name_bare": "«РОМАШКА»", "name_short": "ООО «РОМАШКА»"}

# ключи словаря: как поле названо в макете, так и называется у нас.
# По дуге оно или строкой — видно по разметке, по имени не гадаем.
DICT_KEYS = {
    "name": "полное наименование",
    "name_2": "продолжение наименования",
    "name_short": "краткое наименование",
    "fio": "ФИО",
    "label_ip": "надпись «Индивидуальный предприниматель»",
    "label_ooo": "надпись с организационно-правовой формой",
    "name_bare": "наименование без формы",
    "inn": "ИНН",
    "ogrn": "ОГРН или ОГРНИП",
    "kpp": "КПП",
    "city": "город",
    "address": "адрес",
    "position": "должность",
    "speciality": "специальность",
    "license": "номер лицензии",
}
# первый макет дизайнера назван по-своему — понимаем и его
LEGACY = {"tip": "label_ooo", "region": "city", "name": "name_bare"}


def groups(svg: str, prefix: str) -> dict[str, str]:
    """Куски разметки по id вида f__tip_ / s__stars_.

    Элемент бывает и самозакрывающимся (<path id="s_…"/>), и группой —
    иначе поиск закрывающего тега проглатывал полдокумента.
    """
    out = {}
    for m in re.finditer(rf'id="{prefix}__(\w+)_"', svg):
        key = m.group(1)
        start = svg.rfind("<", 0, m.start())
        tag = re.match(r"<(\w+)", svg[start:]).group(1)
        open_end = svg.index(">", start) + 1
        if svg[open_end - 2] == "/":
            out[key] = svg[start:open_end]
            continue
        depth, i = 0, start
        while i < len(svg):
            if svg.startswith(f"<{tag}", i):
                depth += 1
                i = svg.index(">", i)
                if svg[i - 1] == "/":
                    depth -= 1
            elif svg.startswith(f"</{tag}", i):
                depth -= 1
                if depth == 0:
                    i = svg.index(">", i) + 1
                    break
            i += 1
        out[key] = svg[start:i]
    return out


FONT = Path.home() / "Library/Fonts/PT_Sans-Web-Regular.ttf"
_widths: dict[str, float] = {}


def text_mm(text: str, size: float, tracking: float) -> float:
    """Ширина строки в миллиметрах по метрикам PT Sans."""
    if not _widths:
        from fontTools.ttLib import TTFont

        font = TTFont(FONT)
        cmap, hmtx, upm = font.getBestCmap(), font["hmtx"], font["head"].unitsPerEm
        for code, name in cmap.items():
            _widths[chr(code)] = hmtx[name][0] / upm
    return sum((_widths.get(c, 0.55) + tracking) * size for c in text)


def fit_size(text: str, room: float, size: float, tracking: float, floor: float = 1.8) -> float:
    """Кегль, при котором рыба влезает: тем же способом, что и движок."""
    while size > floor and text_mm(text, size, tracking) > room:
        size = round(size - 0.05, 2)
    return size


def sample_text(chunk: str, key: str = "") -> str:
    """Текст поля из макета — оставляем рыбой, движок её заменит."""
    if key in SAMPLE_OVERRIDE:
        return SAMPLE_OVERRIDE[key]
    parts = re.findall(r"<tspan[^>]*>([^<]*)</tspan>", chunk)
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def letters(chunk: str) -> list[tuple[float, float]]:
    return [(float(m.group(1)), float(m.group(2)))
            for m in re.finditer(r"translate\(([-\d.]+) ([-\d.]+)\)", chunk)]


def fit_circle(pts: list[tuple[float, float]]) -> tuple[float, float, float]:
    n = len(pts)
    Sx = sum(p[0] for p in pts); Sy = sum(p[1] for p in pts)
    Sxx = sum(p[0] ** 2 for p in pts); Syy = sum(p[1] ** 2 for p in pts)
    Sxy = sum(p[0] * p[1] for p in pts)
    A = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, n]]
    b = [-(sum(p[0] ** 3 for p in pts) + sum(p[0] * p[1] ** 2 for p in pts)),
         -(sum(p[1] ** 3 for p in pts) + sum(p[0] ** 2 * p[1] for p in pts)),
         -(Sxx + Syy)]

    def det(M):
        return (M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
                - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
                + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]))

    D0 = det(A)
    D, E, F = [det([[b[r] if k == c else A[r][c] for c in range(3)] for r in range(3)]) / D0
               for k in range(3)]
    cx, cy = -D / 2, -E / 2
    return cx, cy, math.sqrt(cx * cx + cy * cy - F)


def span_deg(pts, cx, cy) -> float:
    """Угловой размах дуги с разворотом через 180°."""
    angs = sorted(math.degrees(math.atan2(y - cy, x - cx)) % 360 for x, y in pts)
    gaps = [(angs[(i + 1) % len(angs)] - a) % 360 for i, a in enumerate(angs)]
    return 360 - max(gaps)


def arc_path(r: float, span: float, top: bool) -> str:
    """Дуга двумя половинами — иначе браузер выбирает не тот центр."""
    a = math.radians(span / 2)
    x, y = r * math.sin(a), r * math.cos(a)
    if top:
        return (f"M {-x:.2f} {-y:.2f} A {r:.2f} {r:.2f} 0 0 1 0 {-r:.2f}"
                f" A {r:.2f} {r:.2f} 0 0 1 {x:.2f} {-y:.2f}")
    return (f"M {-x:.2f} {y:.2f} A {r:.2f} {r:.2f} 0 0 0 0 {r:.2f}"
            f" A {r:.2f} {r:.2f} 0 0 0 {x:.2f} {y:.2f}")


def squeeze_of(chunk: str) -> float:
    """Сжатие по горизонтали: Illustrator пишет его как scale(.85 1)."""
    for sx, sy in re.findall(r"scale\(\s*([\d.]+)[\s,]+([\d.]+)\s*\)", chunk):
        if float(sy) == 1 and float(sx) != 1:
            return round(float(sx), 3)
    return 1.0


def fit_to(text: str, size: float, tracking: float, squeeze: float) -> str:
    """Сжатие для рыбы в файле: у живого текста это textLength, не scale."""
    if squeeze == 1:
        return ""
    pen = text_mm(text, size, tracking)
    return f' textLength="{pen * squeeze:.2f}" lengthAdjust="spacingAndGlyphs"'


def main() -> int:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() / "Downloads/O_01.svg")
    svg = src.read_text(encoding="utf-8", errors="ignore")
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
    cx0, cy0 = vb[2] / 2, vb[3] / 2          # центр монтажной области

    statics = groups(svg, "s")
    fields = groups(svg, "f")

    # геометрия дуг из положения букв
    arcs = {}
    for key in ("tip", "region"):
        pts = letters(fields[key])
        cx, cy, r = fit_circle(pts)
        arcs[key] = (r * PT_MM, span_deg(pts, cx, cy))

    # кегли: берём из классов, переводим в миллиметры
    css = re.search(r"(?s)<style>(.*?)</style>", svg).group(1)
    # правило перечисляет несколько классов через запятую — свойства у всех
    rules: dict[str, dict[str, str]] = {}
    for sel, decl in re.findall(r"(?s)([^{}]+)\{([^}]*)\}", css):
        props = dict(d.split(":", 1) for d in decl.split(";") if ":" in d)
        props = {k.strip(): v.strip() for k, v in props.items()}
        for cls in re.findall(r"\.([\w-]+)", sel):
            rules.setdefault(cls, {}).update(props)
    sizes = {c: float(p["font-size"].rstrip("px")) * PT_MM
             for c, p in rules.items() if "font-size" in p}
    default_size = round(min(sizes.values()) if sizes else 2.3, 2)

    defs, body, meta_fields = [], [], {}

    # статика: контуры как есть, только в миллиметры и currentColor
    body.append(f'  <g id="s_frame" fill="currentColor" '
                f'transform="scale({PT_MM:.6f}) translate({-cx0} {-cy0})">')
    for name, chunk in statics.items():
        for tag, attrs in re.findall(r"<(path|circle|ellipse|rect|polygon|polyline)([^>]*)>", chunk):
            a = dict(re.findall(r'([\w-]+)="([^"]*)"', attrs))
            # краска бывает и классом: тонкое кольцо у дизайнера — .cls-1
            cls = rules.get(a.get("class", ""), {})
            fill = a.get("fill", cls.get("fill"))
            stroke = a.get("stroke", cls.get("stroke"))
            width = a.get("stroke-width", cls.get("stroke-width", "")).rstrip("px")
            if (stroke and stroke != "none") or fill == "none":
                paint = 'fill="none" stroke="currentColor"'
                if width:
                    paint += f' stroke-width="{float(width) * PT_MM:.3f}"'
            else:
                paint = 'fill="currentColor"'
            geom = " ".join(f'{k}="{v}"' for k, v in a.items()
                            if k not in ("fill", "stroke", "stroke-width", "style", "class", "id"))
            body.append(f'    <{tag} {geom} {paint}/>   <!-- {name} -->')
        # статика бывает и текстом — например звёздочки по бокам
        for t in re.findall(r"<text[^>]*>.*?</text>", chunk, re.S):
            # класс уносит кегль: без него звёздочки рисуются умолчанием в 16
            cls = rules.get((re.search(r'<text[^>]*class="([^"]*)"', t) or [None, ""])[1], {})
            if "font-size" in cls:
                t = t.replace("<text", f'<text font-size="{cls["font-size"].rstrip("px")}"', 1)
            t = re.sub(r'\sclass="[^"]*"', "", t)
            t = re.sub(r"\s+", " ", t).strip()
            body.append(f'    {t}   <!-- {name} -->')
    body.append("  </g>")

    legacy = "tip" in fields          # старая схема имён целиком
    for src_key, chunk in fields.items():
        key = LEGACY.get(src_key, src_key) if legacy else src_key
        if key not in DICT_KEYS:
            print(f"   пропущено: f_{src_key} — нет такого ключа в словаре")
            continue
        human = DICT_KEYS[key]
        kind = "arc" if src_key in arcs else "line"
        if kind == "arc":
            r, span = arcs[src_key]
            top = src_key == "tip"
            room = math.radians(span) * r
            squeeze = squeeze_of(chunk)
            sample = sample_text(chunk, key)
            size = fit_size(sample, room / squeeze, default_size, 0.05)
            defs.append(f'    <path id="b_{key}" d="{arc_path(r, span, top)}"/>')
            body.append(
                f'  <g id="f_{key}">   <!-- {human} -->\n'
                f'    <text font-size="{size}" letter-spacing="0.05" text-anchor="middle"'
                f' fill="currentColor">\n'
                f'      <textPath xlink:href="#b_{key}" href="#b_{key}" startOffset="50%"'
                f'{fit_to(sample, size, 0.05, squeeze)}>{sample}</textPath>\n'
                f"    </text>\n  </g>")
            meta_fields[key] = {"role": key, "kind": "arc", "size": size, "squeeze": squeeze,
                                "minSize": 1.8, "maxSize": round(size + 0.3, 2)}
        else:
            m = re.search(r"translate\(([-\d.]+) ([-\d.]+)\)", chunk)
            y = round((float(m.group(2)) - cy0) * PT_MM, 2)
            inner = arcs["tip"][0] - 2.4
            room = 2 * math.sqrt(max(0.01, inner ** 2 - y ** 2)) * 0.92
            squeeze = squeeze_of(chunk)
            sample = sample_text(chunk, key)
            # сколько строк отведено полю и с каким интервалом — по y у tspan-ов
            ys = sorted({float(v) for v in re.findall(r'<tspan[^>]*\sy="([-\d.]+)"', chunk)})
            lines = max(1, len(ys))
            step = round((ys[1] - ys[0]) * PT_MM, 2) if lines > 1 else 0
            size = fit_size(sample, room / squeeze, default_size, 0.05)
            if lines > 1:
                words = sample.split()
                per = math.ceil(len(words) / lines)
                rows = [" ".join(words[i:i + per]) for i in range(0, len(words), per)]
                inner = "".join(f'<tspan x="0" y="{y + i * step:.2f}">{r}</tspan>'
                                for i, r in enumerate(rows))
                tail = ""
            else:
                inner, tail = sample, fit_to(sample, size, 0, squeeze)
            body.append(
                f'  <g id="f_{key}">   <!-- {human} -->\n'
                f'    <text x="0" y="{y}" font-size="{size}" text-anchor="middle"'
                f' fill="currentColor"{tail}>{inner}</text>\n  </g>')
            spec = {"role": key, "kind": "line", "size": size, "squeeze": squeeze,
                    "minSize": 1.8, "maxSize": round(size + 0.3, 2)}
            if lines > 1:
                spec["lines"] = lines
                spec["lineHeight"] = step
            if key == "inn":
                spec["prefix"] = "ИНН "
            if key == "ogrn":
                spec["prefix"] = "ОГРН "
            meta_fields[key] = spec

    ring = max(float(x) for x in re.findall(r"a?(\d{2}\.\d+),\1", svg)) * PT_MM
    meta = {
        "version": 2,
        "id": "ooo-o01-38",
        "title": "Образец дизайнера O_01",
        "kinds": ["ooo"],
        "diameterMm": round(ring * 2),
        "frame": {"asset": "O_01.svg, макет дизайнера",
                  "freeRadiusMm": round(ring - 0.6, 2),
                  "innerRadiusMm": round(arcs["tip"][0] - 2.4, 2)},
        "defaults": {"font": "PT Sans", "case": "upper", "tracking": 0.05,
                     "align": "middle", "overflow": "shrink",
                     "squeeze": squeeze_of(svg)},
        "fields": meta_fields,
    }

    half = round(ring + 1.1, 1)
    out = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:seal="https://rpk-seal.local/ns/1"
     viewBox="{-half} {-half} {half * 2} {half * 2}" width="{half * 2}mm" height="{half * 2}mm"
     font-family="PT Sans, sans-serif">

  <title>{meta["title"]}</title>
  <desc>Макет O_01 дизайнера, переведён в формат шаблона: миллиметры, центр 0,0,
        дуги восстановлены по положению букв, поля — по словарю ключей.</desc>

  <metadata><seal:template version="2">{json.dumps(meta, ensure_ascii=False, indent=1)}</seal:template></metadata>

  <defs>
{chr(10).join(defs)}
  </defs>

{chr(10).join(body)}
</svg>
"""
    OUT.write_text(out, encoding="utf-8")
    print(f"{OUT.name}: Ø{meta['diameterMm']} мм, полей {len(meta_fields)}, кегль {default_size} мм")
    for k, (r, sp) in arcs.items():
        print(f"   дуга {k}: радиус {r:.2f} мм, размах {sp:.0f}°")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
