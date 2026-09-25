/**
 * Движок шаблонов печати: подбор по длине текста и подстановка данных.
 *
 * Шаблон — SVG фиксированной геометрии (см. docs/template-spec.md):
 * группа `f_<ключ>` — поле, путь `b_<ключ>` — его базовая линия, `s_*` — статика.
 * Параметры полей лежат в метаданных внутри самого файла.
 *
 * Почему измеряем, а не считаем «по средней букве»: у прописных и строчных
 * ширина разная, и на оценке вердикт «влезает» расходился с картинкой.
 */

export const SEAL_NS = "https://rpk-seal.local/ns/1";

export type Kind = "ooo" | "ip" | "doctor";

export type FieldIndex = {
  kind: "arc" | "line";
  roomMm: number;
  sizeMm: number;
  minSizeMm: number;
  comfort: number;
  tight: number;
  variable: boolean;
  /** Сжатие по горизонтали из макета: 0.85 — буквы уже на 15%. */
  squeeze?: number;
};

export type TemplateIndex = {
  id: string;
  title: string;
  file: string;
  kinds: Kind[];
  diameterMm: number;
  font: string;
  fields: Record<string, FieldIndex>;
};

export type Values = Record<string, string | undefined>;

export type Verdict = "ok" | "tight" | "bad";

export type Scored = {
  tpl: TemplateIndex;
  verdict: Verdict;
  slack: number;
  notes: string[];
  dropped: string[];
  values: Values;
};

/** Ширина строки в миллиметрах при данном кегле — по метрикам шрифта. */
let ruler: SVGTextElement | null = null;
export function widthMm(text: string, size: number, font = "PT Sans"): number {
  if (typeof document === "undefined") return 0;
  if (!ruler) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("style", "position:absolute;visibility:hidden;width:10px;height:10px");
    ruler = document.createElementNS("http://www.w3.org/2000/svg", "text");
    svg.appendChild(ruler);
    document.body.appendChild(svg);
  }
  ruler.setAttribute("font-family", font);
  ruler.setAttribute("font-size", "100");
  ruler.textContent = text;
  return (ruler.getComputedTextLength() / 100) * size;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Разбивка на ровно n строк по словам: из всех вариантов берём тот, где самая
 * широкая строка уже. Слова короткие, строк не больше трёх — перебор дешевле
 * жадного алгоритма и заметно ровнее по виду.
 */
export function splitRows(text: string, n: number, size: number, font: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (n <= 1 || words.length <= 1) return [words.join(" ")];
  let best: string[] = [words.join(" ")];
  let bestMax = Infinity;
  const cut = (from: number, left: number, acc: string[]) => {
    if (left === 1) {
      const rows = [...acc, words.slice(from).join(" ")];
      const max = Math.max(...rows.map((r) => widthMm(r, size, font)));
      if (max < bestMax) { bestMax = max; best = rows; }
      return;
    }
    for (let i = from + 1; i <= words.length - left + 1; i++) {
      cut(i, left - 1, [...acc, words.slice(from, i).join(" ")]);
    }
  };
  cut(0, n, []);
  return best;
}

/** Наименование в две дуги: режем по словам, стараясь заполнить первую. */
export function splitTwoArcs(text: string, capFirst: number): [string, string] {
  const words = text.split(/\s+/);
  let first = "";
  const rest: string[] = [];
  for (const w of words) {
    if (!rest.length && `${first} ${w}`.trim().length <= capFirst) first = `${first} ${w}`.trim();
    else rest.push(w);
  }
  return [first, rest.join(" ")];
}

/** Предварительная оценка: влезают ли данные, и сколько теряется. */
export function score(tpl: TemplateIndex, vals: Values): Omit<Scored, "tpl" | "values"> {
  let verdict: Verdict = "ok";
  let slack = Infinity;
  const notes: string[] = [];

  for (const [key, f] of Object.entries(tpl.fields)) {
    if (key === "name_2") continue; // считается вместе с name
    const raw = vals[key];
    if (!raw) continue;
    const str = String(
      key === "name" && tpl.fields.name_2 ? splitTwoArcs(String(raw), f.comfort)[0] : raw,
    ).toUpperCase();
    const squeeze = f.squeeze || 1;
    const need = widthMm(str, f.sizeMm, tpl.font) * squeeze;
    const needMin = widthMm(str, f.minSizeMm, tpl.font) * squeeze;

    if (key === "name" && tpl.fields.name_2) {
      const tail = splitTwoArcs(String(raw), f.comfort)[1];
      if (tail.length > tpl.fields.name_2.tight) {
        verdict = "bad";
        notes.push("наименование не делится на две дуги");
      }
    }

    if (need <= f.roomMm) slack = Math.min(slack, (f.roomMm - need) / f.roomMm);
    else if (needMin <= f.roomMm) {
      if (verdict === "ok") verdict = "tight";
    } else {
      verdict = "bad";
      notes.push(`${LABELS[key] ?? key} не помещается`);
    }
  }

  // молча терять заполненные данные нельзя: такой шаблон должен уступать
  const shown = new Set(Object.keys(tpl.fields));
  const dropped = Object.entries(vals)
    .filter(([k, v]) => v && !shown.has(k) && k !== "name_2" && k !== "name_short")
    .map(([k]) => k);

  return { verdict, slack: slack === Infinity ? 0 : slack, notes, dropped };
}

export type Filled = {
  svg: SVGSVGElement;
  meta: Record<string, any>;
  grade: Verdict;
  notes: string[];
};

/**
 * Подстановка данных в шаблон.
 *
 * Место под текст берётся из геометрии: для дуги — длина базовой линии,
 * для строки — хорда круга на её высоте, ограниченная внутренним краем
 * дугового текста. Если не помещается — снижаем кегль до минимального,
 * потом чуть поджимаем просвет. `textLength` не используем: Chrome
 * игнорирует его на textPath, и лишние буквы просто срезаются по краю.
 */
/** Шрифт шаблонов должен быть загружен до замеров, иначе меряем подстановку. */
export async function ensureFont(family = "PT Sans"): Promise<void> {
  try {
    await document.fonts.load(`16px "${family}"`);
    await document.fonts.ready;
  } catch {
    /* нет FontFaceSet — меряем как есть */
  }
}

/**
 * Разметка для показа: наружу отдаём только содержимое, поэтому шрифт и
 * viewBox с корня шаблона нужно перенести на свой <svg> — иначе оттиск
 * рисуется шрифтом страницы и текст по дуге уезжает за кольцо.
 */
export function rootOf(svg: SVGSVGElement): { html: string; box: string; font: string } {
  return {
    html: svg.innerHTML,
    box: svg.getAttribute("viewBox") || "",
    font: svg.getAttribute("font-family") || "PT Sans, sans-serif",
  };
}

export function fill(svgText: string, vals: Values, color: string): Filled {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const svg = doc.documentElement as unknown as SVGSVGElement;
  const metaNode = svg.getElementsByTagNameNS(SEAL_NS, "template")[0];
  const meta = JSON.parse(metaNode.textContent || "{}");
  const defaults = meta.defaults || {};
  svg.setAttribute("color", color);

  const notes: string[] = [];
  let grade: Verdict = "ok";

  // меряем только в документе: getComputedTextLength вне DOM не работает
  const host = document.createElement("div");
  host.style.cssText = "position:absolute;visibility:hidden;width:600px";
  host.appendChild(svg as unknown as Node);
  document.body.appendChild(host);

  for (const [key, specRaw] of Object.entries(meta.fields as Record<string, any>)) {
    const spec = specRaw as any;
    const g = svg.querySelector(`#f_${key}`);
    if (!g) continue;
    const raw = vals[key];
    if (!raw) {
      g.remove();
      continue;
    }

    const kase = spec.case || defaults.case || "upper";
    let value = String(raw);
    if (kase === "upper") value = value.toUpperCase();
    if (kase === "lower") value = value.toLowerCase();

    // у ИП номер 15-значный и подписывается иначе — зависит от данных
    let prefix = spec.prefix || "";
    if (key === "ogrn" && String(vals.ogrn || "").length === 15) prefix = "ОГРНИП ";

    const textEl = g.querySelector("text") as SVGTextElement;
    const target = (textEl.querySelector("textPath") as SVGTextPathElement) || textEl;
    target.textContent = `${prefix}${value}`.trim();

    const base = svg.querySelector(`#b_${key}`) as SVGPathElement | null;
    // место под строку — хорда круга на её высоте, ограниченная текстом по дуге
    const limit =
      meta.frame?.innerRadiusMm || meta.frame?.freeRadiusMm || meta.diameterMm / 2;
    const chord = (y: number) =>
      2 * Math.sqrt(Math.max(0.01, limit * limit - y * y)) * 0.92;
    const room = base ? base.getTotalLength() : chord(parseFloat(textEl.getAttribute("y") || "0"));

    // сжатие по горизонтали, как в макете: у дизайнера это scale(.85 1),
    // в живом тексте — textLength, иначе на дуге пришлось бы гнуть саму дугу
    const squeeze: number = spec.squeeze || defaults.squeeze || 1;

    // поле, набранное в макете в несколько строк: раскладываем по словам
    const maxLines: number = spec.lines || 1;
    if (!base && maxLines > 1) {
      const step: number = spec.lineHeight || +(spec.size * 1.2).toFixed(2);
      // блок держим по центру отведённого места, сколько бы строк ни вышло
      const middle = parseFloat(textEl.getAttribute("y") || "0") + ((maxLines - 1) * step) / 2;
      const font: string = defaults.font || "PT Sans";
      const text = `${prefix}${value}`.trim();

      const put = (lines: number, pt: number) => {
        const rows = splitRows(text, lines, pt, font);
        const top = middle - ((rows.length - 1) * step) / 2;
        textEl.setAttribute("font-size", String(pt));
        textEl.textContent = "";
        rows.forEach((row, i) => {
          const t = document.createElementNS(SVG_NS, "tspan");
          t.setAttribute("x", "0");
          t.setAttribute("y", (top + i * step).toFixed(2));
          t.textContent = row;
          textEl.appendChild(t);
        });
        // .every обрывается на первой неудаче, а атрибуты нужны всем строкам
        return rows.map((_, i) => {
          const t = textEl.children[i] as unknown as SVGTextContentElement;
          const w = t.getComputedTextLength() * squeeze;
          if (squeeze !== 1) {
            (t as unknown as Element).setAttribute("textLength", w.toFixed(3));
            (t as unknown as Element).setAttribute("lengthAdjust", "spacingAndGlyphs");
          }
          return w <= chord(top + i * step);
        }).every(Boolean);
      };

      let pt: number = spec.size;
      const floor: number = spec.minSize || pt;
      let ok = false;
      while (!ok) {
        for (let n = 1; n <= maxLines && !ok; n++) ok = put(n, pt);
        if (ok || pt <= floor) break;
        pt = Math.round((pt - 0.05) * 100) / 100;
      }
      if (!ok) {
        grade = "bad";
        notes.push(`${LABELS[key] ?? key} не помещается`);
      } else if (pt < spec.size - 0.01 && grade === "ok") {
        grade = "tight";
      }
      continue;
    }

    const width = () => {
      target.removeAttribute("textLength");
      return textEl.getComputedTextLength() * squeeze;
    };

    let size: number = spec.size;
    const min: number = spec.minSize || size;
    textEl.setAttribute("font-size", String(size));
    while (width() > room && size > min) {
      size = Math.round((size - 0.05) * 100) / 100;
      textEl.setAttribute("font-size", String(size));
    }
    if (width() > room) {
      for (let tr = -0.01; tr >= -0.03; tr -= 0.01) {
        textEl.setAttribute("letter-spacing", (tr * size).toFixed(3));
        if (width() <= room) break;
      }
    }
    const fitted = width();
    if (squeeze !== 1) {
      target.setAttribute("textLength", fitted.toFixed(3));
      target.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
    if (fitted > room) {
      grade = "bad";
      notes.push(`${LABELS[key] ?? key} не помещается`);
    } else if (size < spec.size - 0.01) {
      // кегль ужали — для ранжирования это «впритык», человеку говорить нечего
      if (grade === "ok") grade = "tight";
    }
  }

  host.remove();
  return { svg, meta, grade, notes };
}

/** Значения полей из введённых реквизитов. Ключи — те же, что в шаблонах. */
export const LEGAL_FORMS: Record<string, { full: string; short: string }> = {
  ooo: { full: "Общество с ограниченной ответственностью", short: "ООО" },
  ao: { full: "Акционерное общество", short: "АО" },
  pao: { full: "Публичное акционерное общество", short: "ПАО" },
  nko: { full: "Некоммерческая организация", short: "НКО" },
};

/** Поля по-русски: ключи нужны движку, а показывать их человеку незачем. */
export const LABELS: Record<string, string> = {
  name: "полное наименование",
  name_2: "продолжение наименования",
  name_short: "краткое наименование",
  fio: "ФИО",
  label_ip: "надпись «Индивидуальный предприниматель»",
  label_ooo: "надпись с организационно-правовой формой",
  name_bare: "наименование без формы",
  inn: "ИНН",
  ogrn: "ОГРН",
  kpp: "КПП",
  city: "город",
  address: "адрес",
  position: "должность",
  speciality: "специальность",
  license: "номер лицензии",
};

export function valuesFor(
  kind: Kind,
  data: { org: string; city: string; inn: string; ogrn: string; form?: string; speciality?: string },
): Values {
  const v: Values = { city: data.city };
  if (kind !== "doctor") {
    v.inn = data.inn;
    v.ogrn = data.ogrn;
  }
  if (kind === "ooo") {
    const form = LEGAL_FORMS[data.form || "ooo"] || LEGAL_FORMS.ooo;
    v.name = `${form.full} «${data.org}»`;
    v.name_short = `${form.short} «${data.org}»`;
    // форма отдельно от наименования: так набрана классическая печать —
    // «ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ» по дуге, «РОМАШКА» в центре
    v.label_ooo = form.full;
    v.name_bare = `«${data.org}»`;
  } else if (kind === "ip") {
    v.label_ip = "Индивидуальный предприниматель";
    v.fio = data.org;
    v.name_short = `ИП ${data.org}`;
  } else {
    v.fio = data.org;
    v.position = "Врач";
    v.speciality = data.speciality;
  }
  return v;
}

/** Ранжирование: сначала по вердикту, потом по полноте, потом по запасу. */
export function rank(index: TemplateIndex[], kind: Kind, vals: Values): Scored[] {
  const order: Record<Verdict, number> = { ok: 0, tight: 1, bad: 2 };
  return index
    .filter((t) => (t.kinds || []).includes(kind))
    .map((tpl) => {
      const s = score(tpl, vals);
      const values = { ...vals };
      if (tpl.fields.name_2 && vals.name) {
        const [a, b] = splitTwoArcs(String(vals.name), tpl.fields.name.comfort);
        values.name = a;
        values.name_2 = b;
      }
      return { tpl, ...s, values };
    })
    .sort(
      (a, b) =>
        order[a.verdict] - order[b.verdict] ||
        a.dropped.length - b.dropped.length ||
        b.slack - a.slack,
    );
}
