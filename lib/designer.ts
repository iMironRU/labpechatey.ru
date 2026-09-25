/**
 * Приёмка макета печати от дизайнера — целиком в браузере.
 *
 * Тот же перевод, что делает scripts/convert_designer_svg.py, плюс
 * проверки по документу docs/шаблоны-печатей-для-дизайнера.md. Illustrator
 * не умеет отдавать текст по контуру, поэтому дуги восстанавливаем по
 * положению букв: через точки их привязки проводим окружность.
 */

const PT_MM = 25.4 / 72;

/** Конечный словарь полей: как названо в макете, так называется у нас. */
export const DICT: Record<string, string> = {
  name: "полное наименование",
  name_2: "продолжение наименования",
  name_short: "краткое наименование",
  fio: "ФИО",
  label_ip: "надпись «Индивидуальный предприниматель»",
  label_ooo: "надпись с организационно-правовой формой",
  name_bare: "наименование без формы",
  inn: "ИНН",
  ogrn: "ОГРН или ОГРНИП",
  kpp: "КПП",
  city: "город",
  address: "адрес",
  position: "должность",
  speciality: "специальность",
  license: "номер лицензии",
};

/** Имена из первого макета — понимаем, но просим переименовать. */
// в первом макете на дуге стоит форма, а в центре — само наименование
const LEGACY: Record<string, string> = { tip: "label_ooo", region: "city", name: "name_bare" };

export type Issue = { level: "error" | "warn" | "ok"; text: string };
export type Field = {
  key: string;
  kind: "arc" | "line";
  sample: string;
  size: number;
  radiusMm?: number;
  spanDeg?: number;
  y?: number;
};
export type Parsed = {
  svg: string;             // шаблон в нашем формате
  fields: Field[];
  issues: Issue[];
  diameterMm: number;
  meta: Record<string, unknown>;
};

/** Illustrator пишет «_» как «_x5F_», а «<…>» превращает в «__…_». */
function normalizeIds(src: string): string {
  return src.replace(/id="([^"]+)"/g, (_, raw: string) => {
    const fixed = raw.replace(/_x5F_/g, "_").replace(/^([fs])__(\w+?)_$/, "$1_$2");
    return `id="${fixed}"`;
  });
}

function groupOf(doc: Document, prefix: string): Record<string, Element> {
  const out: Record<string, Element> = {};
  doc.querySelectorAll(`[id^="${prefix}_"]`).forEach((el) => {
    const key = (el.getAttribute("id") || "").slice(prefix.length + 1);
    if (key) out[key] = el;
  });
  return out;
}

/** Точки привязки букв: Illustrator пишет их translate или matrix. */
function origins(el: Element): [number, number][] {
  const out: [number, number][] = [];
  // id бывает и на самой <text>, а querySelectorAll её не вернёт
  const nodes = [el, ...Array.from(el.querySelectorAll("text, tspan"))];
  nodes.forEach((t) => {
    const tr = t.getAttribute("transform") || "";
    const m1 = /translate\(([-\d.]+)[ ,]([-\d.]+)\)/.exec(tr);
    if (m1) out.push([+m1[1], +m1[2]]);
    const m2 = /matrix\(([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)\)/.exec(tr);
    if (m2) out.push([+m2[5], +m2[6]]);
  });
  return out;
}

function fitCircle(pts: [number, number][]): { cx: number; cy: number; r: number } {
  const n = pts.length;
  const S = (f: (p: [number, number]) => number) => pts.reduce((a, p) => a + f(p), 0);
  const A = [
    [S((p) => p[0] ** 2), S((p) => p[0] * p[1]), S((p) => p[0])],
    [S((p) => p[0] * p[1]), S((p) => p[1] ** 2), S((p) => p[1])],
    [S((p) => p[0]), S((p) => p[1]), n],
  ];
  const b = [
    -(S((p) => p[0] ** 3) + S((p) => p[0] * p[1] ** 2)),
    -(S((p) => p[1] ** 3) + S((p) => p[0] ** 2 * p[1])),
    -(S((p) => p[0] ** 2) + S((p) => p[1] ** 2)),
  ];
  const det = (M: number[][]) =>
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const d0 = det(A);
  const [D, E, F] = [0, 1, 2].map((k) =>
    det(A.map((row, r) => row.map((v, c) => (c === k ? b[r] : v)))) / d0,
  );
  const cx = -D / 2, cy = -E / 2;
  return { cx, cy, r: Math.sqrt(cx * cx + cy * cy - F) };
}

function spanDeg(pts: [number, number][], cx: number, cy: number): number {
  const angs = pts.map(([x, y]) => ((Math.atan2(y - cy, x - cx) * 180) / Math.PI + 360) % 360).sort((a, b) => a - b);
  const gaps = angs.map((a, i) => ((angs[(i + 1) % angs.length] - a) % 360 + 360) % 360);
  return 360 - Math.max(...gaps);
}

/** Дуга двумя половинами: у одной команды A при размахе >180° два центра. */
function arcPath(r: number, span: number, top: boolean): string {
  const a = ((span / 2) * Math.PI) / 180;
  const x = r * Math.sin(a), y = r * Math.cos(a);
  const f = (v: number) => v.toFixed(2);
  return top
    ? `M ${f(-x)} ${f(-y)} A ${f(r)} ${f(r)} 0 0 1 0 ${f(-r)} A ${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(-y)}`
    : `M ${f(-x)} ${f(y)} A ${f(r)} ${f(r)} 0 0 0 0 ${f(r)} A ${f(r)} ${f(r)} 0 0 0 ${f(x)} ${f(y)}`;
}

const textOf = (el: Element) => (el.textContent || "").replace(/\s+/g, " ").trim();

/**
 * Правила из `<style>`: так Illustrator экспортирует, если не переключить
 * Styling на презентационные атрибуты. Без их разбора у всех полей получается
 * один кегль, а кольцо с обводкой по классу заливается чёрным.
 */
function classRules(doc: Document): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const st of Array.from(doc.querySelectorAll("style"))) {
    for (const rule of (st.textContent || "").matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const decl: Record<string, string> = {};
      for (const d of rule[2].split(";")) {
        const i = d.indexOf(":");
        if (i > 0) decl[d.slice(0, i).trim()] = d.slice(i + 1).trim();
      }
      for (const sel of rule[1].split(",")) {
        const cls = sel.trim().replace(/^\./, "");
        if (cls) out[cls] = { ...out[cls], ...decl };
      }
    }
  }
  return out;
}

/** Значение свойства: свой атрибут важнее класса, класса может и не быть. */
function styleOf(el: Element, prop: string, rules: Record<string, Record<string, string>>): string | null {
  const attr = el.getAttribute(prop);
  if (attr) return attr;
  for (const cls of (el.getAttribute("class") || "").split(/\s+/)) {
    if (rules[cls]?.[prop]) return rules[cls][prop];
  }
  return null;
}

/** Кегль поля: сначала своё значение, потом у вложенных — что найдётся раньше. */
function fontSizePx(el: Element, rules: Record<string, Record<string, string>>): number | null {
  for (const n of [el, ...Array.from(el.querySelectorAll("*"))]) {
    const v = styleOf(n, "font-size", rules);
    if (v) return parseFloat(v);
  }
  return null;
}

export function convert(source: string): Parsed {
  const issues: Issue[] = [];
  const doc = new DOMParser().parseFromString(normalizeIds(source), "image/svg+xml");
  const root = doc.documentElement;
  if (root.nodeName === "parsererror" || !root.getAttribute("viewBox")) {
    return { svg: "", fields: [], diameterMm: 0, meta: {},
             issues: [{ level: "error", text: "Это не похоже на SVG: не нашёлся viewBox." }] };
  }

  const vb = (root.getAttribute("viewBox") || "").split(/\s+/).map(Number);
  const cx0 = vb[2] / 2, cy0 = vb[3] / 2;

  // единицы: Illustrator отдаёт пункты, миллиметры остаются в width
  const w = root.getAttribute("width") || "";
  const mmDeclared = /mm/.test(w);
  if (!mmDeclared) {
    issues.push({ level: "warn", text: "В файле нет размера в миллиметрах — считаю, что экспорт в пунктах. Выключите «Responsive» при экспорте." });
  }

  const statics = groupOf(doc, "s");
  const fieldsRaw = groupOf(doc, "f");
  if (!Object.keys(fieldsRaw).length) {
    issues.push({ level: "error", text: "Не нашлось ни одного поля f_… — проверьте имена слоёв." });
  }
  if (!Object.keys(statics).length) {
    issues.push({ level: "warn", text: "Не нашлось статики s_… — рамка не попадёт в шаблон." });
  }
  if (doc.querySelector("style")) {
    issues.push({ level: "warn", text: "Цвет задан классами в <style>. Экспортируйте со «Styling: Presentation Attributes», иначе оттиск не перекрашивается." });
  }
  if (doc.querySelector("image")) {
    issues.push({ level: "error", text: "В файле есть растровая картинка — её в шаблоне быть не должно." });
  }
  if (doc.querySelector("textPath")) {
    issues.push({ level: "ok", text: "Текст по контуру пришёл как textPath — редкий случай, беру как есть." });
  }

  const legacy = "tip" in fieldsRaw;
  if (legacy) {
    issues.push({ level: "warn", text: "Имена полей из первого макета (tip, region). Понял их, но лучше переименовать по словарю." });
  }

  const fields: Field[] = [];
  const defs: string[] = [];
  const body: string[] = [];
  const metaFields: Record<string, unknown> = {};

  const rules = classRules(doc);

  // статика: контуры как есть, в миллиметры и currentColor
  body.push(`  <g id="s_frame" transform="scale(${PT_MM.toFixed(6)}) translate(${-cx0} ${-cy0})">`);
  const SHAPES = "path, circle, ellipse, rect, polygon, polyline";
  for (const [name, el] of Object.entries(statics)) {
    // имя бывает и на самой фигуре — тонкое кольцо у дизайнера лежит
    // отдельным <circle id="s_circle2">, без обёртки в группу
    const shapes = [...(el.matches(SHAPES) ? [el] : []), ...Array.from(el.querySelectorAll(SHAPES))];
    shapes.forEach((sh) => {
      const stroke = styleOf(sh, "stroke", rules);
      const stroked = stroke && stroke !== "none";
      const noFill = styleOf(sh, "fill", rules) === "none";
      const sw = styleOf(sh, "stroke-width", rules)?.replace("px", "") ?? null;
      const paint = stroked || noFill
        ? `fill="none" stroke="currentColor"${sw ? ` stroke-width="${(+sw * PT_MM).toFixed(3)}"` : ""}`
        : `fill="currentColor"`;
      const geom = Array.from(sh.attributes)
        .filter((a) => !["fill", "stroke", "stroke-width", "style", "class", "id"].includes(a.name))
        .map((a) => `${a.name}="${a.value}"`)
        .join(" ");
      body.push(`    <${sh.nodeName} ${geom} ${paint}/>   <!-- ${name} -->`);
    });
    const texts = [...(el.matches("text") ? [el] : []), ...Array.from(el.querySelectorAll("text"))];
    texts.forEach((t) => {
      // класс уносит с собой кегль — переносим его в атрибут, иначе звёздочки
      // и микротекст рисуются браузерным умолчанием в 16 единиц
      for (const prop of ["font-size", "letter-spacing"]) {
        const v = styleOf(t, prop, rules);
        if (v) t.setAttribute(prop, v.replace("px", ""));
      }
      t.removeAttribute("class");
      t.setAttribute("fill", "currentColor");
      body.push(`    ${new XMLSerializer().serializeToString(t)}   <!-- ${name} -->`);
    });
  }
  body.push("  </g>");

  let innerMm = Infinity;
  for (const [rawKey, el] of Object.entries(fieldsRaw)) {
    const key = legacy ? LEGACY[rawKey] ?? rawKey : rawKey;
    if (!DICT[key]) {
      issues.push({ level: "error", text: `Поле f_${rawKey}: такого ключа нет в словаре — данные в него не подставятся.` });
      continue;
    }
    const pts = origins(el);
    const sample = textOf(el);
    const sizePx = fontSizePx(el, rules);
    const size = sizePx ? +(sizePx * PT_MM).toFixed(2) : 2.3;
    if (size < 1.8) {
      issues.push({ level: "warn", text: `Поле f_${rawKey}: кегль ${size} мм — меньше производственного минимума 1.8 мм.` });
    }

    if (pts.length > 3) {
      const { cx, cy, r } = fitCircle(pts);
      const radiusMm = +(r * PT_MM).toFixed(2);
      const span = +spanDeg(pts, cx, cy).toFixed(0);
      innerMm = Math.min(innerMm, radiusMm - 2.4);
      // сверху дуга или снизу — по тому, где лежат буквы, а не по центру:
      // центр окружности совпадает с центром макета
      const meanY = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      const top = meanY < cy;
      defs.push(`    <path id="b_${key}" d="${arcPath(radiusMm, span, top)}"/>`);
      body.push(
        `  <g id="f_${key}">   <!-- ${DICT[key]} -->\n` +
        `    <text font-size="${size}" letter-spacing="0.05" text-anchor="middle" fill="currentColor">\n` +
        `      <textPath xlink:href="#b_${key}" href="#b_${key}" startOffset="50%">${sample}</textPath>\n` +
        `    </text>\n  </g>`,
      );
      metaFields[key] = { role: key, kind: "arc", size, minSize: 1.8, maxSize: +(size + 0.3).toFixed(2) };
      fields.push({ key, kind: "arc", sample, size, radiusMm, spanDeg: span });
      issues.push({ level: "ok", text: `Дуга f_${rawKey}: радиус ${radiusMm} мм, размах ${span}° — восстановлена по буквам.` });
    } else {
      const y = pts.length ? +((pts[0][1] - cy0) * PT_MM).toFixed(2) : 0;
      body.push(
        `  <g id="f_${key}">   <!-- ${DICT[key]} -->\n` +
        `    <text x="0" y="${y}" font-size="${size}" text-anchor="middle" fill="currentColor">${sample}</text>\n  </g>`,
      );
      const spec: Record<string, unknown> = { role: key, kind: "line", size, minSize: 1.8, maxSize: +(size + 0.3).toFixed(2) };
      if (key === "inn") spec.prefix = "ИНН ";
      if (key === "ogrn") spec.prefix = "ОГРН ";
      metaFields[key] = spec;
      fields.push({ key, kind: "line", sample, size, y });
      // строк несколько, если у tspan-ов разные y — разный трекинг не в счёт
      const ys = new Set(Array.from(el.querySelectorAll("tspan")).map((t) => t.getAttribute("y") || "0"));
      if (ys.size > 1) {
        issues.push({ level: "warn", text: `Поле f_${rawKey} набрано в несколько строк. Движок подставляет строку целиком и переносов не делает.` });
      }
    }
  }

  // диаметр: по самой большой окружности статики
  let ring = 0;
  doc.querySelectorAll("circle, path").forEach((el) => {
    const r = el.getAttribute("r");
    if (r) ring = Math.max(ring, +r);
    const d = el.getAttribute("d") || "";
    for (const m of d.matchAll(/([\d.]{3,}),\1/g)) ring = Math.max(ring, +m[1]);
  });
  const ringMm = ring ? ring * PT_MM : vb[2] * PT_MM / 2 - 1;
  const diameterMm = Math.round(ringMm * 2);
  const half = +(ringMm + 1.1).toFixed(1);
  // внутренний край: по самой нижней дуге, а если дуг нет — с отступом от кольца
  const inner = Math.min(Number.isFinite(innerMm) ? innerMm : ringMm - 2.4, ringMm - 1);

  const meta = {
    version: 2,
    id: `tpl-${diameterMm}`,
    title: "Макет от дизайнера",
    kinds: ["ooo"],
    diameterMm,
    frame: { asset: "макет дизайнера", freeRadiusMm: +(ringMm - 0.6).toFixed(2), innerRadiusMm: +inner.toFixed(2) },
    defaults: { font: "PT Sans", case: "upper", tracking: 0.05, align: "middle", overflow: "shrink" },
    fields: metaFields,
  };

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:seal="https://rpk-seal.local/ns/1"
     viewBox="${-half} ${-half} ${half * 2} ${half * 2}" width="${half * 2}mm" height="${half * 2}mm"
     font-family="PT Sans, sans-serif">

  <title>${meta.title}</title>

  <metadata><seal:template version="2">${JSON.stringify(meta, null, 1)}</seal:template></metadata>

  <defs>
${defs.join("\n")}
  </defs>

${body.join("\n")}
</svg>
`;

  if (!issues.some((i) => i.level === "error")) {
    issues.unshift({ level: "ok", text: `Шаблон собран: Ø${diameterMm} мм, полей ${fields.length}.` });
  }
  return { svg, fields, issues, diameterMm, meta };
}
