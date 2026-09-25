// Подготовка макета печати в Illustrator по нашим правилам.
//   osascript -e 'tell application "Adobe Illustrator" to do javascript (POSIX file "…/illustrator-подготовка.jsx")'
//
// Переименовывает поля по словарю (f_<tip> → f_name и т.д.), помечает
// служебный слой и сохраняет копию рядом с исходником. Оригинал не
// меняется. Экспортированный SVG пригоден только как сырьё для
// scripts/convert_designer_svg.py: текст по контуру Illustrator всё
// равно разбирает на отдельные буквы.
// служебные слои выключены, экспорт SVG рядом. Оригинал не трогаем.
var src = File(Folder.myDocuments.parent + "/Downloads/O_01.ai");
var doc = app.open(src);

var MAP = { "f_<tip>": "f_name", "f_<region>": "f_city", "f_<name>": "f_name_short",
            "f_<inn>": "f_inn", "f_<ogrn>": "f_ogrn",
            "s_<circle1>": "s_circle1", "s_<circle2>": "s_circle2", "s_<stars>": "s_stars" };
var log = [];

function rename(list) {
  for (var i = 0; i < list.length; i++) {
    var it = list[i];
    if (it.name) {
      var target = MAP[it.name];
      log.push(it.name + (target ? " → " + target : " (нет в словаре)"));
      if (target) it.name = target;
    }
    if (it.typename === "GroupItem") rename(it.pageItems);
  }
}
for (var L = 0; L < doc.layers.length; L++) rename(doc.layers[L].pageItems);

// слой со служебными кругами «не показывать для лазера» — прячем и помечаем
for (var L2 = 0; L2 < doc.layers.length; L2++) {
  var lay = doc.layers[L2];
  for (var j = 0; j < lay.pageItems.length; j++) {
    var it2 = lay.pageItems[j];
    if (it2.name && it2.name.indexOf("Не показывать") >= 0) {
      it2.name = "s_service";           // слой бывает заблокирован — прятать не пытаемся
      log.push("служебные круги помечены s_service");
    }
  }
}

var outAi = File(Folder.myDocuments.parent + "/Downloads/O_01-наш-формат.ai");
var opts = new IllustratorSaveOptions();
opts.compatibility = Compatibility.ILLUSTRATOR17;
doc.saveAs(outAi, opts);

var svgOpts = new ExportOptionsSVG();
svgOpts.embedRasterImages = false;
svgOpts.fontType = SVGFontType.SVGFONT;          // текст остаётся текстом
svgOpts.fontSubsetting = SVGFontSubsetting.GLYPHSUSED;   // без этого в файл лезет весь шрифт
svgOpts.documentEncoding = SVGDocumentEncoding.UTF8;
svgOpts.coordinatePrecision = 3;
svgOpts.cssProperties = SVGCSSPropertyLocation.PRESENTATIONATTRIBUTES;
doc.exportFile(File(Folder.myDocuments.parent + "/Downloads/O_01-наш-формат.svg"), ExportType.SVG, svgOpts);

doc.close(SaveOptions.DONOTSAVECHANGES);
"переименовано: " + log.join("; ");
