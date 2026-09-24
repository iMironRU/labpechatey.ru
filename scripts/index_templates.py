#!/usr/bin/env python3
"""Индекс шаблонов: сколько текста влезает в каждое поле.

    python3 scripts/index_templates.py            # нужен fonttools

Ёмкость в шаблонах не хранится — считается из геометрии и метрик шрифта,
поэтому индекс всегда можно пересобрать и он не разойдётся с разметкой.
Дуги меряются по длине пути, прямые строки — по хорде круга, в который
они вписаны: для раскладок с центральным кругом это он (innerRadiusMm),
иначе свободное поле рамки. Ровно так же считает движок в браузере
(lib/stamp.ts), поэтому индекс и рендер не спорят друг с другом.
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path
from xml.etree import ElementTree as ET

SVG_NS = "http://www.w3.org/2000/svg"
SEAL_NS = "https://rpk-seal.local/ns/1"
ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / "public" / "templates"

FONTS = {"PT Sans": Path.home() / "Library/Fonts/PT_Sans-Web-Regular.ttf"}
# длина этих полей задана данными, остальные плавают
FIXED_LEN = {"inn": 12, "ogrn": 15, "kpp": 9}
VARIABLE = {"name", "name_2", "name_short", "fio", "city", "address", "speciality"}
SAMPLE = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ ОБЩЕСТВО С ОГРАНИЧЕННОЙ"

_cache: dict[str, float] = {}


def avg_char_em(family: str) -> float:
    """Средняя ширина символа в долях кегля — по кириллице верхнего регистра."""
    if family not in _cache:
        from fontTools.ttLib import TTFont

        font = TTFont(FONTS.get(family, FONTS["PT Sans"]))
        cmap, hmtx, upm = font.getBestCmap(), font["hmtx"], font["head"].unitsPerEm
        widths = [hmtx[cmap[ord(c)]][0] / upm for c in SAMPLE if ord(c) in cmap]
        _cache[family] = sum(widths) / len(widths)
    return _cache[family]


def arc_length(d: str) -> float:
    """Длина дуги из двух половин: складываем углы start→mid и mid→end."""
    n = [float(v) for v in re.findall(r"-?\d+\.?\d*", d)]
    if len(n) < 16:
        return 0.0
    r = n[2]
    pts = [(n[0], n[1]), (n[7], n[8]), (n[14], n[15])]
    angs = [math.atan2(y, x) for x, y in pts]

    def step(a: float, b: float) -> float:
        d = abs(b - a) % (2 * math.pi)
        return min(d, 2 * math.pi - d)

    return (step(angs[0], angs[1]) + step(angs[1], angs[2])) * r


def index_one(path: Path) -> dict | None:
    root = ET.parse(path).getroot()
    md = root.find(f".//{{{SEAL_NS}}}template")
    if md is None or not md.text:
        return None
    meta = json.loads(md.text)
    frame = meta.get("frame") or {}
    defaults = meta.get("defaults") or {}
    font = defaults.get("font", "PT Sans")
    tracking = float(defaults.get("tracking") or 0)
    inner = float(frame.get("innerRadiusMm") or frame.get("freeRadiusMm") or meta["diameterMm"] / 2)
    by_id = {el.get("id"): el for el in root.iter() if el.get("id")}

    fields = {}
    for key, spec in (meta.get("fields") or {}).items():
        group = by_id.get(f"f_{key}")
        if group is None:
            continue
        text_el = next(iter(group.iter(f"{{{SVG_NS}}}text")), None)
        if text_el is None:
            continue
        base = by_id.get(f"b_{key}")
        if base is not None:
            room = arc_length(base.get("d", ""))
        else:
            y = float(text_el.get("y") or 0)
            if abs(y) >= inner:
                continue
            # та же формула, что в lib/stamp.ts: хорда с запасом 8%
            room = 2 * math.sqrt(inner ** 2 - y ** 2) * 0.92

        size = float(spec.get("size") or 0)
        min_size = float(spec.get("minSize") or size)
        per_char = avg_char_em(font)

        def chars(at: float) -> int:
            return max(0, int(room / (per_char * at + tracking * at)))

        fields[key] = {
            "kind": "arc" if base is not None else "line",
            "roomMm": round(room, 2),
            "sizeMm": size,
            "minSizeMm": min_size,
            "comfort": chars(size),
            "tight": chars(min_size),
            "variable": key in VARIABLE,
            "fixedLen": FIXED_LEN.get(key),
        }

    return {
        "id": meta["id"],
        "title": meta["title"],
        "file": f"templates/{path.name}",
        "kinds": meta.get("kinds") or [],
        "diameterMm": meta["diameterMm"],
        "font": font,
        "fields": fields,
    }


def main() -> int:
    items = [it for it in (index_one(p) for p in sorted(DIR.glob("*.svg"))) if it]
    (DIR / "index.json").write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
    for it in items:
        print(f"\n{it['id']} — {it['title']}")
        for key, f in it["fields"].items():
            print(f"   {key:11} {f['kind']:5} {f['roomMm']:6.1f} мм  "
                  f"{f['comfort']:3} симв. при {f['sizeMm']} мм, {f['tight']:3} при {f['minSizeMm']} мм")
    print(f"\nшаблонов: {len(items)} → {(DIR / 'index.json').relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
