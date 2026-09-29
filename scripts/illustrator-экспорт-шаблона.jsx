// Экспорт шаблона печати из Illustrator сразу в наш формат.
//
// Запуск: открыть макет и выбрать «Файл → Сценарии → illustrator-экспорт-шаблона»
// (или положить файл в Illustrator/Presets/ru_RU/Сценарии). Из командной строки:
//   osascript -e 'tell application "Adobe Illustrator" to do javascript (POSIX file "…/illustrator-экспорт-шаблона.jsx")'
//
// Зачем это, если есть экспорт в SVG. Illustrator не умеет записывать в SVG
// текст по контуру: он разбирает строку на отдельные буквы, и дугу потом
// приходится восстанавливать по их положению — с неизбежной погрешностью.
// Изнутри же документа виден живой объект: у текстового фрейма есть kind
// PATHTEXT и свойство textPath с настоящим контуром. Отсюда мы берём дугу
// точно, а не угадываем.
//
// Что получается: <имя макета>-шаблон.svg рядом с исходником. Оригинал не
// меняется — скрипт только читает.

#target illustrator

(function () {
  var PT_MM = 25.4 / 72;

  // Конечный словарь полей — тот же, что в lib/designer.ts и в документе
  // docs/шаблоны-печатей-для-дизайнера.md.
  var DICT = {
    name: "полное наименование",
    name_2: "продолжение наименования",
    name_short: "краткое наименование",
    name_bare: "наименование без формы",
    label_ooo: "надпись с организационно-правовой формой",
    label_ip: "надпись «Индивидуальный предприниматель»",
    fio: "ФИО",
    inn: "ИНН",
    ogrn: "ОГРН или ОГРНИП",
    kpp: "КПП",
    city: "город",
    address: "адрес",
    position: "должность",
    speciality: "специальность",
    license: "номер лицензии"
  };
  // Имена из первого присланного макета — понимаем, но просим переименовать.
  var LEGACY = { tip: "label_ooo", region: "city", name: "name_bare" };

  var PREFIX = { inn: "ИНН ", ogrn: "ОГРН " };

  if (app.documents.length === 0) {
    alert("Откройте макет печати — скрипт работает с активным документом.");
    return;
  }

  var doc = app.activeDocument;
  var issues = [];
  var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
  var cx = (ab[0] + ab[2]) / 2;
  var cy = (ab[1] + ab[3]) / 2;

  function n(v, digits) {
    var k = Math.pow(10, digits === undefined ? 2 : digits);
    var r = Math.round(v * k) / k;
    return String(r);
  }
  /** Точка Illustrator (пункты, ось Y вверх) → наши миллиметры с центром 0,0. */
  function xy(pt) {
    return [(pt[0] - cx) * PT_MM, (cy - pt[1]) * PT_MM];
  }
  function mm(pt) {
    var v = xy(pt);
    return n(v[0]) + " " + n(v[1]);
  }
  var DEG = 180 / Math.PI;
  function radius(pt) {
    var v = xy(pt);
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  }

  /** Центр и радиус замкнутого контура — по его якорям. */
  function circleOf(p) {
    var pts = p.pathPoints, sx = 0, sy = 0, i, v;
    for (i = 0; i < pts.length; i++) { v = xy(pts[i].anchor); sx += v[0]; sy += v[1]; }
    var ox = sx / pts.length, oy = sy / pts.length, r = 0;
    for (i = 0; i < pts.length; i++) {
      v = xy(pts[i].anchor);
      r += Math.sqrt((v[0] - ox) * (v[0] - ox) + (v[1] - oy) * (v[1] - oy));
    }
    return { x: ox, y: oy, r: r / pts.length };
  }

  /** Все якоря кривых внутри объекта — так читаем, где на самом деле буквы. */
  function anchors(it, out) {
    if (it.typename === "PathItem") {
      for (var i = 0; i < it.pathPoints.length; i++) out.push(xy(it.pathPoints[i].anchor));
    } else if (it.typename === "CompoundPathItem") {
      for (var j = 0; j < it.pathItems.length; j++) anchors(it.pathItems[j], out);
    } else if (it.typename === "GroupItem") {
      for (var k = 0; k < it.pageItems.length; k++) anchors(it.pageItems[k], out);
    }
    return out;
  }

  /**
   * Базовая линия первой строки.
   *
   * У площадного текста её никто не отдаёт: anchor есть только у точечного,
   * а position и bounds показывают верх рамки — это на целый кегль выше.
   * Поэтому переводим копию в кривые и смотрим, где стоят сами буквы:
   * у большинства из них низ и есть базовая линия, выносные элементы
   * оказываются в меньшинстве и на медиану не влияют.
   */
  function baseline(t, sizePt) {
    var dup = t.duplicate();
    var outline = dup.createOutline();
    var g = [], i;
    for (i = 0; i < outline.pageItems.length; i++) g.push(outline.pageItems[i].geometricBounds);
    outline.remove();
    if (!g.length) return null;

    // буквы группируем в строки по низу: разные строки разводит интерлиньяж
    var rows = [];
    for (i = 0; i < g.length; i++) {
      var put = false;
      for (var k = 0; k < rows.length; k++) {
        if (Math.abs(rows[k].y - g[i][3]) < sizePt * 0.6) {
          rows[k].bottoms.push(g[i][3]);
          if (g[i][0] < rows[k].left) rows[k].left = g[i][0];
          if (g[i][2] > rows[k].right) rows[k].right = g[i][2];
          put = true;
          break;
        }
      }
      if (!put) rows.push({ y: g[i][3], bottoms: [g[i][3]], left: g[i][0], right: g[i][2] });
    }
    rows.sort(function (a, b) { return b.y - a.y; });    // сверху вниз: у растёт вверх
    var out = [];
    for (i = 0; i < rows.length; i++) {
      rows[i].bottoms.sort(function (a, b) { return a - b; });
      out.push({
        y: rows[i].bottoms[Math.floor(rows[i].bottoms.length / 2)],
        width: (rows[i].right - rows[i].left) * PT_MM
      });
    }
    return { y: out[0].y, width: out[0].width, rows: out };
  }

  /**
   * Где на окружности стоит строка. Illustrator не отдаёт ни размах текста по
   * контуру, ни его начало, поэтому переводим копию строки в кривые и смотрим
   * на углы её точек. Копию тут же удаляем — документ не меняется, но окажется
   * помечен изменённым: сохранять его не нужно.
   */
  function arcOf(t, o) {
    var dup = t.duplicate();
    var outline = dup.createOutline();
    var pts = anchors(outline, []);
    outline.remove();
    if (!pts.length) return null;
    var angs = [], i, sx = 0, sy = 0;
    for (i = 0; i < pts.length; i++) {
      var a = Math.atan2(pts[i][1] - o.y, pts[i][0] - o.x);
      angs.push((a * DEG + 360) % 360);
      sx += Math.cos(a); sy += Math.sin(a);
    }
    angs.sort(function (p1, p2) { return p1 - p2; });
    var gap = 0;
    for (i = 0; i < angs.length; i++) {
      var d = (angs[(i + 1) % angs.length] - angs[i] + 360) % 360;
      if (d > gap) gap = d;
    }
    return { span: 360 - gap, mid: Math.atan2(sy, sx) * DEG };
  }

  /** Дуга двумя половинами: у одной команды A при размахе >180° два центра. */
  function arcPath(o, r, span, top) {
    var a = (span / 2) * Math.PI / 180;
    var dx = r * Math.sin(a), dy = r * Math.cos(a);
    var f = function (v) { return n(v); };
    if (top) {
      return "M " + f(o.x - dx) + " " + f(o.y - dy) +
             " A " + f(r) + " " + f(r) + " 0 0 1 " + f(o.x) + " " + f(o.y - r) +
             " A " + f(r) + " " + f(r) + " 0 0 1 " + f(o.x + dx) + " " + f(o.y - dy);
    }
    return "M " + f(o.x - dx) + " " + f(o.y + dy) +
           " A " + f(r) + " " + f(r) + " 0 0 0 " + f(o.x) + " " + f(o.y + r) +
           " A " + f(r) + " " + f(r) + " 0 0 0 " + f(o.x + dx) + " " + f(o.y + dy);
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /**
   * Контур как есть: якоря и управляющие точки, без упрощения в дуги.
   *
   * k — коэффициент раздувания относительно собственного центра фигуры.
   * Нужен там, где обводка в макете выровнена внутрь или наружу: в SVG
   * такого выравнивания нет, и кольцо приходится подвинуть самим.
   */
  function pathData(p, k, o) {
    var pts = p.pathPoints, d = "", i;
    if (!pts || pts.length === 0) return "";
    var put = function (raw) {
      var v = xy(raw);
      if (k && k !== 1) { v = [o.x + (v[0] - o.x) * k, o.y + (v[1] - o.y) * k]; }
      return n(v[0]) + " " + n(v[1]);
    };
    for (i = 0; i < pts.length; i++) {
      if (i === 0) d += "M " + put(pts[i].anchor);
      else d += " C " + put(pts[i - 1].rightDirection) + " " + put(pts[i].leftDirection) + " " + put(pts[i].anchor);
    }
    if (p.closed && pts.length > 1) {
      d += " C " + put(pts[pts.length - 1].rightDirection) + " " + put(pts[0].leftDirection) + " " + put(pts[0].anchor) + " Z";
    }
    return d;
  }

  /**
   * Выравнивание обводки. Illustrator умеет класть её по центру контура,
   * внутрь и наружу, но в DOM этого свойства нет — зато видно по габаритам
   * с обводкой и без. В SVG выравнивания нет вовсе, поэтому невыровненную
   * обводку переводим в центральную, сдвигая сам контур.
   */
  function strokeShift(p) {
    if (!p.stroked) return 0;
    var g = p.geometricBounds, v = p.visibleBounds;
    var half = p.strokeWidth / 2;
    var out = ((v[2] - v[0]) - (g[2] - g[0])) / 2;     // насколько обводка вылезла
    var shift = out - half;                            // 0 — по центру
    return Math.abs(shift) < 0.05 ? 0 : shift * PT_MM; // 0.05 pt — шум округления
  }

  function named(items, out) {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.name) out.push(it);
      if (it.typename === "GroupItem") named(it.pageItems, out);
    }
    return out;
  }
  function firstText(it) {
    if (it.typename === "TextFrame") return it;
    if (it.typename === "GroupItem") {
      for (var i = 0; i < it.pageItems.length; i++) {
        var t = firstText(it.pageItems[i]);
        if (t) return t;
      }
    }
    return null;
  }
  function texts(it, out) {
    if (it.typename === "TextFrame") out.push(it);
    else if (it.typename === "GroupItem") {
      for (var i = 0; i < it.pageItems.length; i++) texts(it.pageItems[i], out);
    }
    return out;
  }
  function shapes(it, out) {
    if (it.typename === "PathItem") out.push(it);
    else if (it.typename === "CompoundPathItem") {
      for (var i = 0; i < it.pathItems.length; i++) out.push(it.pathItems[i]);
    } else if (it.typename === "GroupItem") {
      for (var j = 0; j < it.pageItems.length; j++) shapes(it.pageItems[j], out);
    }
    return out;
  }

  /** Ключ поля: и f_inn, и f_<inn> из первых макетов — угловые скобки убираем. */
  function keyOf(name, prefix) {
    var raw = name.substring(prefix.length + 1);
    raw = raw.replace(/</g, "").replace(/>/g, "");
    return LEGACY[raw] || raw;
  }

  // doc.pageItems в Illustrator плоский и уже включает вложенные — обходим
  // по слоям, иначе объекты внутри групп посчитаются дважды
  var all = [];
  for (var l = 0; l < doc.layers.length; l++) {
    // спрятанный слой — это заметки для себя, в шаблон им не надо
    if (!doc.layers[l].visible) { issues.push("Слой «" + doc.layers[l].name + "» скрыт — пропускаю."); continue; }
    named(doc.layers[l].pageItems, all);
  }
  var defs = [], body = [], meta = [], fields = 0, faces = {};
  var innerMm = 1e9, ringMm = 0;

  // ——— статика: рамка, звёздочки, микротекст ———
  body.push('  <g id="s_frame">');
  for (var i = 0; i < all.length; i++) {
    var it = all[i];
    if (it.name.indexOf("s_") !== 0) continue;
    var tag = it.name.replace(/[<>]/g, "");
    // направляющие «не показывать для лазера» рисуют не оттиск, а поля
    // у слоя это visible, у объекта — hidden; перепутать легко
    if (/не показывать/i.test(it.name) || it.hidden) {
      issues.push("«" + tag + "» — служебная разметка, в шаблон не беру.");
      continue;
    }
    var sh = shapes(it, []);
    for (var s = 0; s < sh.length; s++) {
      var p = sh[s], paint;
      if (p.stroked && !p.filled) {
        paint = 'fill="none" stroke="currentColor" stroke-width="' + n(p.strokeWidth * PT_MM, 3) + '"';
      } else if (p.stroked) {
        paint = 'fill="currentColor" stroke="currentColor" stroke-width="' + n(p.strokeWidth * PT_MM, 3) + '"';
      } else {
        paint = 'fill="currentColor"';
      }
      var k = 1, o1 = { x: 0, y: 0 };
      var shift = strokeShift(p);
      if (shift) {
        o1 = circleOf(p);
        if (o1.r > 0.01) {
          k = (o1.r + shift) / o1.r;
          issues.push("«" + tag + "»: обводка выровнена не по центру контура — подвинул кольцо на " +
                      n(shift, 3) + " мм, чтобы в SVG оно легло туда же.");
        }
      }
      var d = pathData(p, k, o1);
      if (!d) continue;
      body.push('    <path d="' + d + '" ' + paint + "/>   <!-- " + tag + " -->");
      for (var q = 0; q < p.pathPoints.length; q++) ringMm = Math.max(ringMm, radius(p.pathPoints[q].anchor));
    }
    // звёздочки и микротекст — тоже статика, но текстом
    var tt = texts(it, []);
    for (var w = 0; w < tt.length; w++) {
      var tx = tt[w], ta = tx.textRange.characterAttributes, pos = xy(tx.anchor);
      body.push('    <text x="' + n(pos[0]) + '" y="' + n(pos[1]) +
                '" font-size="' + n(ta.size * PT_MM) + '" text-anchor="middle" fill="currentColor">' +
                esc(tx.contents) + "</text>   <!-- " + tag + " -->");
    }
  }
  body.push("  </g>");

  // ——— поля ———
  for (var f = 0; f < all.length; f++) {
    var item = all[f];
    if (item.name.indexOf("f_") !== 0) continue;
    var key = keyOf(item.name, "f");
    if (!DICT[key]) {
      issues.push("f_" + key + ": такого ключа нет в словаре — поле не попадёт в шаблон.");
      continue;
    }
    var t = firstText(item);
    if (!t) {
      issues.push("f_" + key + ": внутри нет живого текста — похоже, переведён в кривые.");
      continue;
    }
    var attrs = t.textRange.characterAttributes;
    var size = attrs.size * PT_MM;
    var squeeze = attrs.horizontalScale / 100;
    var track = attrs.tracking / 1000;                 // 1/1000 em → доли кегля
    // шрифт лежит не на фрейме, а в атрибутах символов; имя берём
    // постскриптовое — по нему браузер находит установленный файл
    var font = "";
    try { font = attrs.textFont.name; } catch (e) {}
    if (font) { faces[font] = (faces[font] || 0) + 1; }
    if (size < 1.8) issues.push("f_" + key + ": кегль " + n(size) + " мм — меньше производственного минимума 1.8 мм.");

    var spec = '  "' + key + '": { "role": "' + key + '", ';
    if (t.kind === TextType.PATHTEXT) {
      var base = null;
      try { base = t.textPath; } catch (e2) {}
      if (!base) {
        issues.push("f_" + key + ": текст по контуру, но сам контур недоступен — проверьте, не в группе ли он с маской.");
        continue;
      }
      // дизайнер кладёт строку на целую окружность — в шаблон берём только
      // ту дугу, которую он ей отвёл, иначе движок решит, что места 360°
      var d2, fit = "";
      if (base.closed) {
        var o = circleOf(base);
        var arc = arcOf(t, o);
        if (!arc) { issues.push("f_" + key + ": не смог измерить строку на окружности."); continue; }
        d2 = arcPath(o, o.r, arc.span, arc.mid < 0);
        // рыбу в файле держим в тех же границах, по которым обмеряли дугу:
        // так шаблон и сам по себе открывается похожим на макет
        fit = ' textLength="' + n(arc.span / DEG * o.r) + '" lengthAdjust="spacingAndGlyphs"';
        issues.push("f_" + key + ": строка лежит на целой окружности — взял дугу R" +
                    n(o.r) + " мм, размах " + n(arc.span, 0) + "°. Надёжнее сразу резать окружность ножницами.");
      } else {
        d2 = pathData(base);
      }
      defs.push('    <path id="b_' + key + '" d="' + d2 + '"/>');
      body.push('  <g id="f_' + key + '">   <!-- ' + DICT[key] + " -->\n" +
                '    <text font-size="' + n(size) + '" letter-spacing="' + n(track * size, 3) +
                '" text-anchor="middle" fill="currentColor">\n' +
                '      <textPath xlink:href="#b_' + key + '" href="#b_' + key + '" startOffset="50%"' + fit + ">" +
                esc(t.contents) + "</textPath>\n    </text>\n  </g>");
      spec += '"kind": "arc", ';
      for (var r2 = 0; r2 < base.pathPoints.length; r2++) {
        innerMm = Math.min(innerMm, radius(base.pathPoints[r2].anchor));
      }
    } else {
      var base1 = baseline(t, attrs.size);
      if (base1 === null) { issues.push("f_" + key + ": не смог найти базовую линию."); continue; }
      var y0 = (cy - base1.y) * PT_MM;
      var rows = t.lines.length;
      var lead = attrs.leading * PT_MM;
      if (!lead || lead <= 0) lead = size * 1.2;
      var inner = esc(t.contents);
      if (rows > 1) {
        inner = "";
        for (var L = 0; L < rows; L++) {
          var rw = base1.rows[L] ? ' textLength="' + n(base1.rows[L].width) + '" lengthAdjust="spacingAndGlyphs"' : "";
          inner += '<tspan x="0" y="' + n(y0 + L * lead) + '"' + rw + ">" + esc(t.lines[L].contents) + "</tspan>";
        }
      }
      body.push('  <g id="f_' + key + '">   <!-- ' + DICT[key] + " -->\n" +
                '    <text x="0" y="' + n(y0) + '" font-size="' + n(size) +
                '" text-anchor="middle" fill="currentColor"' +
                (rows > 1 ? "" : ' textLength="' + n(base1.width) + '" lengthAdjust="spacingAndGlyphs"') +
                ">" + inner + "</text>\n  </g>");
      spec += '"kind": "line", ';
      if (rows > 1) spec += '"lines": ' + rows + ', "lineHeight": ' + n(lead) + ", ";
    }
    spec += '"size": ' + n(size) + ', "squeeze": ' + n(squeeze, 3) +
            ', "minSize": 1.8, "maxSize": ' + n(size + 0.3);
    if (font) spec += ', "font": "' + esc(font) + '"';
    if (PREFIX[key]) spec += ', "prefix": "' + PREFIX[key] + '"';
    spec += " }";
    meta.push(spec);
    fields++;


  }

  var docFont = "", best = 0;
  for (var ff in faces) if (faces[ff] > best) { best = faces[ff]; docFont = ff; }
  for (var bi = 0; bi < body.length; bi++) {
    var m2 = /<g id="f_(\w+)">/.exec(body[bi]);
    if (!m2) continue;
    var own = /"font": "([^"]+)"/.exec(meta.join("\n").split('"' + m2[1] + '":')[1] || "");
    if (own && own[1] !== docFont) {
      body[bi] = body[bi].replace("<text ", '<text font-family="' + own[1] + '" ');
    }
  }

  if (!fields) {
    // тупик без подсказки бесполезен: показываем, что скрипт вообще увидел
    var seen = [];
    for (var v = 0; v < all.length; v++) seen.push("«" + all[v].name + "»");
    var why = "Не нашлось ни одного поля f_… в документе «" + doc.name + "».\n\n";
    why += seen.length
      ? "Имена, которые я вижу:\n· " + seen.join("\n· ") +
        "\n\nПоле — это объект, названный f_<ключ> из словаря: f_name, f_city, f_inn…\n" +
        "Имя правится двойным щелчком по строке объекта в палитре «Слои»."
      : "Именованных объектов в документе нет вовсе. Имя задаётся в палитре «Слои»:\n" +
        "двойной щелчок по строке объекта — и вписать f_name, f_city и так далее.";
    if (issues.length) why += "\n\nЕщё по пути:\n· " + issues.join("\n· ");
    if (typeof LP_SILENT === "undefined" || !LP_SILENT) alert(why);
    return why;
  }
  if (innerMm > 1e8) innerMm = ringMm - 2.4;
  var inner2 = Math.min(innerMm - 2.4, ringMm - 1);
  var half = Math.round((ringMm + 1.1) * 10) / 10;
  var diameter = Math.round(ringMm * 2);

  var head =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"\n' +
    '     xmlns:seal="https://rpk-seal.local/ns/1"\n' +
    '     viewBox="' + n(-half) + " " + n(-half) + " " + n(half * 2) + " " + n(half * 2) + '"' +
    ' width="' + n(half * 2) + 'mm" height="' + n(half * 2) + 'mm"\n' +
    '     font-family="' + esc(docFont || "PT Sans") + ', sans-serif">\n\n' +
    "  <title>" + esc(doc.name) + "</title>\n" +
    "  <desc>Выгружено из Illustrator скриптом illustrator-экспорт-шаблона.jsx:\n" +
    "        дуги взяты из textPath, а не восстановлены по положению букв.</desc>\n\n" +
    '  <metadata><seal:template version="2">{\n' +
    ' "version": 2,\n' +
    ' "id": "tpl-' + diameter + '",\n' +
    ' "title": "' + esc(doc.name.replace(/\.ai$/i, "")) + '",\n' +
    ' "kinds": ["ooo"],\n' +
    ' "diameterMm": ' + diameter + ",\n" +
    ' "frame": { "asset": "' + esc(doc.name) + '", "freeRadiusMm": ' + n(ringMm - 0.6) +
    ', "innerRadiusMm": ' + n(inner2) + " },\n" +
    ' "defaults": { "font": "' + esc(docFont || "PT Sans") + '", "case": "upper", "align": "middle", "overflow": "shrink" },\n' +
    ' "fields": {\n' + meta.join(",\n") + "\n }\n}</seal:template></metadata>\n\n" +
    "  <defs>\n" + defs.join("\n") + "\n  </defs>\n\n";

  var out = head + body.join("\n") + "\n</svg>\n";

  var dir = doc.fullName.parent;
  var file = new File(dir + "/" + doc.name.replace(/\.[^.]+$/, "") + "-шаблон.svg");
  file.encoding = "UTF-8";
  file.lineFeed = "Unix";        // иначе ExtendScript кладёт на макоси CR
  file.open("w");
  file.write(out);
  file.close();

  var report = "Шаблон собран: Ø" + diameter + " мм, полей " + fields + ".\n" + file.fsName;
  if (issues.length) report += "\n\nНа что посмотреть:\n· " + issues.join("\n· ");
  // при пакетном прогоне окно ждать некому: ставим LP_SILENT и читаем ответ
  if (typeof LP_SILENT === "undefined" || !LP_SILENT) alert(report);
  return report;
})();
