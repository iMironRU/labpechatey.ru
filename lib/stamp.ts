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
    const need = widthMm(str, f.sizeMm, tpl.font);
    const needMin = widthMm(str, f.minSizeMm, tpl.font);

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
    let room: number;
    if (base) room = base.getTotalLength();
    else {
      const y = parseFloat(textEl.getAttribute("y") || "0");
      const limit =
        meta.frame?.innerRadiusMm || meta.frame?.freeRadiusMm || meta.diameterMm / 2;
      room = 2 * Math.sqrt(Math.max(0.01, limit * limit - y * y)) * 0.92;
    }

    let size: number = spec.size;
    const min: number = spec.minSize || size;
    textEl.setAttribute("font-size", String(size));
    while (textEl.getComputedTextLength() > room && size > min) {
      size = Math.round((size - 0.05) * 100) / 100;
      textEl.setAttribute("font-size", String(size));
    }
    if (textEl.getComputedTextLength() > room) {
      for (let tr = -0.01; tr >= -0.03; tr -= 0.01) {
        textEl.setAttribute("letter-spacing", (tr * size).toFixed(3));
        if (textEl.getComputedTextLength() <= room) break;
      }
    }
    if (textEl.getComputedTextLength() > room) {
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
