/* @ds-bundle: {"format":4,"namespace":"MML","components":[{"name":"AccordWada"},{"name":"Nuancier"},{"name":"EnTete"},{"name":"ModeOperatoire"},{"name":"FicheCommande"},{"name":"BlocPrompt"},{"name":"TableauParametres"},{"name":"Bouton"}]} */
(function () {
  "use strict";
  var React = window.React;
  var h = React.createElement;

  /* ---------- Dictionnaire Wada : 348 combinaisons (n° = index + 1) ---------- */
  var WADA = [["#de4500","#29bdad"],["#ff8c00","#0d2b52"],["#b85e00","#fff59e"],["#c3a55c","#3400a3"],["#328e13","#003e83"],["#ff616b","#000831"],["#ff5200","#b3e8c2"],["#c2612c","#b8b8ff"],["#3d0079","#6e66d4"],["#c2612c","#7e8743"],["#ebd999","#9fc2b2"],["#c3a55c","#2dbc94"],["#b85e00","#7e3075"],["#ff4dc9","#faed8f"],["#00d973","#b8b8ff"],["#740909","#abf5ed"],["#e62e73","#33ff7d"],["#d1b0b3","#2d0060"],["#522000","#7aff00"],["#80ffcc","#cc85d1"],["#ff616b","#33ff7d"],["#ffff00","#0024cc"],["#ffbf6e","#9161f2"],["#503d00","#7e3075"],["#c9303e","#bfffe6"],["#fa9442","#5e4017"],["#ffa6d9","#1b3644"],["#651300","#000831"],["#759243","#96bfe6"],["#a90636","#9fc2b2"],["#e81900","#fff59e"],["#d99e73","#7aff00"],["#b85e00","#1b3644"],["#ff5ec4","#b5d1cc"],["#b08699","#a10b2b"],["#baa600","#b5ffc2"],["#a32100","#3400a3"],["#1b8e13","#0024cc"],["#d60036","#0057ba"],["#c74300","#a6d40d"],["#7e8743","#80ffcc"],["#e0b81f","#2619d1"],["#ffa6d9","#9c52f2"],["#23c17c","#4f8fe6"],["#ffcfc4","#f2ff26"],["#ff5200","#000000"],["#c9303e","#bfabcc"],["#b319ab","#0057ba"],["#abf5ed","#0d75ff"],["#ebd999","#2d0060"],["#a10b2b","#0d75ff"],["#f5f5b8","#000000"],["#ff8c00","#2d0060"],["#00d973","#a6e6db"],["#d94d99","#ffffff"],["#bfabcc","#2619d1"],["#6b2e63","#1b3644"],["#681916","#33ff7d"],["#ff5ec4","#a3ad00"],["#fff59e","#0d2b52"],["#bdf226","#340059"],["#ffff00","#000000"],["#5c2c45","#29bdad"],["#9c52f2","#4d52de"],["#baa600","#80ffcc"],["#d1bd19","#58771e"],["#4f8fe6","#0d2b52"],["#b08699","#ffff00"],["#9cb29e","#000000"],["#b85e00","#405416"],["#a90636","#d99e73"],["#f5f5b8","#abf5ed"],["#5e4017","#85b857"],["#b5ffc2","#2dbc94"],["#abf5ed","#202d85"],["#fff59e","#9cb29e"],["#e62e73","#003e83"],["#f2ad78","#6bffb3"],["#651300","#2dbc94"],["#f5f5b8","#9161f2"],["#fa9442","#9cb29e"],["#681916","#2d0060"],["#bcd382","#202d85"],["#ffcfc4","#0f261f"],["#c74300","#008aa1"],["#b85e00","#33ff7d"],["#ffa6d9","#a6d40d"],["#ffcfc4","#0d75ff"],["#ff8c00","#202d85"],["#ff5ec4","#9c52f2"],["#5c2c45","#c05200"],["#ff7399","#00d973"],["#a3ad00","#a6e6db"],["#ebd999","#00592e"],["#681916","#06004f"],["#e0b81f","#718600"],["#ffa6d9","#c9303e"],["#651300","#202d85"],["#fff59e","#29bdad"],["#888d2a","#6e66d4"],["#e6adcf","#0024cc"],["#ebd999","#c05200"],["#c2612c","#2d0060"],["#a10b2b","#f5f5b8"],["#e6adcf","#66ab56"],["#008aa1","#06004f"],["#ffe600","#76844e"],["#ff5ec4","#a32100"],["#fff59e","#324e2a"],["#6c2b11","#362304"],["#fff59e","#a6ff47"],["#ff616b","#000000"],["#ffcfc4","#362304"],["#ffab00","#008aa1"],["#faed8f","#ff3319"],["#e6adcf","#4733ff"],["#d60036","#000000"],["#e0b81f","#362304"],["#a6e6db","#0d2b52"],["#e6adcf","#a90636"],["#6c2b11","#d99e73","#405416"],["#d60036","#ffb852","#00d973"],["#ff7399","#f2ff26","#6b2e63"],["#730f1f","#e0b81f","#99b333"],["#d1b0b3","#29bdad","#202d85"],["#ebd999","#e0b81f","#0024cc"],["#ffbf6e","#56aa69","#4d52de"],["#ffa6d9","#6bffb3","#9161f2"],["#ffe600","#b68400","#96bfe6"],["#b85e00","#a10b2b","#2619d1"],["#b85e00","#de4500","#00cf91"],["#f5f5b8","#fa9442","#a3ad00"],["#740909","#a3ad00","#33ff7d"],["#ff5ec4","#9161f2","#3400a3"],["#f5f5b8","#328e13","#96bfe6"],["#d50c42","#19cc33","#3400a3"],["#c9303e","#ffbf6e","#56aa69"],["#fa9442","#f2ff26","#6bffb3"],["#96bfe6","#000831","#b5d1cc"],["#fa9442","#008aa1","#1b3644"],["#ff5200","#a6ff47","#0d2b52"],["#9e194d","#baa600","#96bfe6"],["#0d75ff","#b875eb","#9cb29e"],["#b319ab","#ff5200","#000000"],["#6c2b11","#a6d40d","#06004f"],["#b68400","#505423","#1b8e13"],["#ff4dc9","#740909","#b5ffc2"],["#d1bd19","#ffab00","#29bdad"],["#d1bd19","#ff5200","#0f261f"],["#ffcfc4","#a6d40d","#b3e8c2"],["#f5f5b8","#ff8c00","#003e83"],["#c9303e","#681916","#a6e6db"],["#ff5ec4","#ffab00","#a6d40d"],["#d60036","#ffff00","#0d75ff"],["#fa2b00","#00d973","#000831"],["#d1bd19","#94ff94","#2619d1"],["#6f0043","#d1bd19","#4f8fe6"],["#f2ff26","#c2612c","#7aff00"],["#b68400","#80ffcc","#b8b8ff"],["#baa600","#5e4017","#417777"],["#6c2b11","#f2ad78","#0057ba"],["#d94d99","#85b857","#b875eb"],["#ffe600","#b5ffc2","#008aa1"],["#e81900","#ffab00","#2619d1"],["#e6adcf","#ff4dc9","#5c2c45"],["#ff616b","#faed8f","#0f261f"],["#c0b490","#abf5ed","#003e83"],["#f2ff26","#003e83","#7e3075"],["#ffa6d9","#fff59e","#9cb29e"],["#b319ab","#ffab00","#3400a3"],["#730f1f","#ff8c00","#b3e8c2"],["#c2612c","#008aa1","#3400a3"],["#f2ff26","#651300","#b5ffc2"],["#ffa6d9","#bfabcc","#6b2e63"],["#f2ad78","#bcd382","#4733ff"],["#ffb3f0","#ffcfc4","#80ffcc"],["#730f1f","#888d2a","#b8b8ff"],["#ebd999","#a6e6db","#2dbc94"],["#e81900","#fa9442","#0024cc"],["#ffbf6e","#9161f2","#b5d1cc"],["#a10b2b","#2619d1","#340059"],["#b85e00","#362304","#000831"],["#5c7287","#7e3075","#3400a3"],["#ff4dc9","#ebd999","#76844e"],["#b08699","#c9303e","#fff59e"],["#681916","#d99e73","#0d75ff"],["#0057ba","#bfabcc","#9c52f2"],["#85b857","#96bfe6","#94ff94"],["#f2ff26","#172713","#6bffb3"],["#ebd999","#de4500","#000000"],["#b08699","#e0b81f","#0d75ff"],["#ffb852","#362304","#5c7287"],["#ff616b","#faed8f","#23c17c"],["#fa2b00","#ffcfc4","#4f8fe6"],["#ff4dc9","#fff59e","#b5d1cc"],["#a6d40d","#abf5ed","#4733ff"],["#ff5ec4","#4d52de","#b5d1cc"],["#a93400","#ffe600","#40c945"],["#a7374b","#706934","#0024cc"],["#a10b2b","#bcd382","#66ab56"],["#ff616b","#718600","#94ff94"],["#b5ffc2","#94ff94","#1b3644"],["#fff59e","#f59994","#405416"],["#b319ab","#c2612c","#a6e6db"],["#730f1f","#f59994","#2619d1"],["#ffa6d9","#fa9442","#c2612c"],["#9b5348","#b3e8c2","#000000"],["#f5f5b8","#2dbc94","#008aa1"],["#ebd999","#ff8c00","#96bfe6"],["#ffbf6e","#f2ff26","#405416"],["#ff7340","#99b333","#000831"],["#a90636","#8c6510","#96bfe6"],["#f59994","#ffe600","#abf5ed"],["#ebd999","#9b5348","#2619d1"],["#ffb852","#0d75ff","#bf36e0"],["#fa2b00","#40c945","#000000"],["#730f1f","#d99e73","#1b8e13"],["#0057ba","#b8b8ff","#5c7287"],["#fa2b00","#66ab56","#00592e"],["#b90078","#d99e73","#9c52f2"],["#a10b2b","#b5d1cc","#000000"],["#e0b81f","#ff8c00","#c05200"],["#b08699","#d99e73","#b5ffc2"],["#ff4dc9","#417777","#6b2e63"],["#d60036","#00592e","#53225c"],["#5c2c45","#ffb852","#2619d1"],["#ffb3f0","#a6e6db","#29bdad"],["#a10b2b","#fff59e","#b5d1cc"],["#fa9442","#172713","#b5d1cc"],["#ff616b","#b5ffc2","#94ff94"],["#e6adcf","#681916","#4f8fe6"],["#d60036","#f2ad78","#000831"],["#a10b2b","#888d2a","#202d85"],["#ffbf6e","#5e4017","#abf5ed"],["#ebd999","#ff8c00","#bfabcc"],["#b68400","#0024cc","#754260"],["#a10b2b","#651300","#96bfe6"],["#d99e73","#340059","#9cb29e"],["#b08699","#c4bf33","#b3e8c2"],["#ff788c","#ffff00","#29bdad"],["#e81900","#fff59e","#c3a55c","#417777"],["#ff5ec4","#a93400","#1b8e13","#000000"],["#b85e00","#ebd999","#58771e","#1b3644"],["#b08699","#c74300","#5c8a73","#008aa1"],["#a10b2b","#6ea900","#0d2b52","#1b3644"],["#ffa6d9","#a32100","#f5f5b8","#ffbf6e"],["#b85e00","#ffe600","#00d973","#0024cc"],["#ff5ec4","#b68400","#b8b8ff","#53225c"],["#681916","#c0b490","#d1bd19","#417777"],["#c4bf33","#ff3319","#33ff7d","#bfffe6"],["#a10045","#ffff00","#1b8e13","#1b3644"],["#e62e73","#b85e00","#baa600","#2dbc94"],["#f2ff26","#ff7340","#340059","#1b3644"],["#ffa6d9","#f5f5b8","#718600","#cc85d1"],["#b85e00","#c4bf33","#80ffcc","#000000"],["#f59994","#ff5200","#19cc33","#000000"],["#f20000","#ffab00","#0d75ff","#9c52f2"],["#730f1f","#f2ad78","#718600","#008aa1"],["#f2ff26","#2dbc94","#0057ba","#9cb29e"],["#d94d99","#f59994","#b3e8c2","#33ff7d"],["#a10045","#fff59e","#80ffcc","#9cb29e"],["#e62e73","#ebd999","#a3ad00","#328e13"],["#a93400","#f2ad78","#b5ffc2","#1b3644"],["#ffa6d9","#e81900","#b3d9a3","#29bdad"],["#d94d99","#ffe600","#99b333","#06004f"],["#f20000","#ebd999","#85b857","#00d973"],["#ffb852","#ff8c00","#00d973","#0d75ff"],["#b08699","#b85e00","#172713","#bfffe6"],["#b85e00","#730f1f","#9c52f2","#000000"],["#e62e73","#f5f5b8","#58771e","#328e13"],["#b90078","#94ff94","#2dbc94","#0f261f"],["#fff59e","#ff5200","#b5ffc2","#96bfe6"],["#ffb3f0","#6f0043","#9b5348","#b5d1cc"],["#ff3319","#7e8743","#4f8fe6","#9161f2"],["#c9303e","#c0b490","#651300","#6b2e63"],["#ff5ec4","#ffcfc4","#a6ff47","#000000"],["#ff4dc9","#b319ab","#718600","#06004f"],["#ffb852","#d1bd19","#328e13","#00592e"],["#b85e00","#f59994","#c0b490","#0d2b52"],["#e62e73","#405416","#cc85d1","#6b2e63"],["#fff59e","#00d973","#94ff94","#008aa1"],["#e62e73","#c2975a","#94ff94","#b875eb"],["#a7374b","#730f1f","#66ab56","#6bffb3"],["#ed3d66","#ffe600","#33ff7d","#00592e"],["#b08699","#a93400","#ff3319","#b5ffc2"],["#a93400","#ffab00","#00cf91","#202d85"],["#ff5ec4","#c4bf33","#abf5ed","#80ffcc"],["#ff8c00","#503d00","#6b2e63","#000000"],["#f2ff26","#bdf226","#202d85","#06004f"],["#5c2c45","#fff59e","#405416","#94ff94"],["#bdf226","#33ff7d","#94ff94","#80ffcc"],["#fff59e","#f2ad78","#c3a55c","#c0b490"],["#b85e00","#b5ffc2","#65a98f","#40c945"],["#f5f5b8","#ffb852","#328e13","#96bfe6"],["#ffb852","#ffff00","#0d75ff","#06004f"],["#f5f5b8","#d99e73","#5e4017","#1b3644"],["#a93400","#ff8c00","#58771e","#202d85"],["#b85e00","#f2ff26","#ff3319","#000000"],["#cc1a97","#f59994","#6ea900","#008aa1"],["#ff616b","#ffb852","#b5ffc2","#80ffcc"],["#f20000","#ebd999","#85b857","#9c52f2"],["#ffb852","#c0b490","#bfffe6","#008aa1"],["#faed8f","#ff3319","#172713","#b5d1cc"],["#681916","#ffb852","#7e8743","#00d973"],["#f2ad78","#ffe600","#a6d40d","#b5ffc2"],["#f2ff26","#00d973","#19cc33","#bfffe6"],["#d60036","#b8b8ff","#9c52f2","#340059"],["#d1b0b3","#d50c42","#de4500","#94ff94"],["#fa9442","#ff7340","#202d85","#003e83"],["#f5f5b8","#f2ad78","#718600","#172713"],["#a90636","#ffb852","#b3d9a3","#bdf226"],["#a93400","#ff8c00","#65a98f","#0057ba"],["#d60036","#ffff00","#1b8e13","#000000"],["#ff5ec4","#681916","#0024cc","#2d0060"],["#ff616b","#f5f5b8","#fa9442","#bf36e0"],["#740909","#19cc33","#2619d1","#3400a3"],["#ffbf99","#c0b490","#f2ff26","#b5ffc2"],["#706934","#324e2a","#00592e","#0f261f"],["#b85e00","#ffe600","#ff8c00","#328e13"],["#ff7399","#f5f5b8","#6ea900","#a6e6db"],["#b08699","#f5f5b8","#172713","#96bfe6"],["#f20000","#a32100","#bf36e0","#4733ff"],["#ffbf6e","#a6d40d","#651300","#000000"],["#a90636","#4f8fe6","#9c52f2","#b5d1cc"],["#e62e73","#faed8f","#e0b81f","#0f261f"],["#f5f5b8","#ff3319","#a6ff47","#7aff00"],["#ff5ec4","#b85e00","#c0b490","#bfabcc"],["#a32100","#ff7340","#362304","#23c17c"],["#ffb852","#bfabcc","#340059","#1b3644"],["#bcd382","#bfffe6","#96bfe6","#2dbc94"],["#cc1a97","#06004f","#9161f2","#2619d1"],["#ff7399","#d50c42","#172713","#00592e"],["#a93400","#f2ff26","#94ff94","#0d75ff"],["#ffcfc4","#718600","#a6ff47","#008aa1"],["#740909","#ff8c00","#2619d1","#1b3644"],["#ff5ec4","#681916","#fff59e","#324e2a"],["#5c2c45","#cc85d1","#531745","#000000"],["#a10b2b","#ffab00","#00592e","#bfabcc"],["#d99e73","#de4500","#a6e6db","#202d85"],["#ff3319","#33ff7d","#b5d1cc","#000000"],["#ff616b","#328e13","#172713","#a6e6db"],["#ffa6d9","#ffb852","#8c6510","#172713"],["#a93400","#ebd999","#505423","#003e83"],["#ffbf6e","#0024cc","#9c52f2","#000000"],["#681916","#bfffe6","#6bffb3","#4733ff"],["#b319ab","#b5ffc2","#bdf226","#5c8a73"],["#99b333","#33ff7d","#0057ba","#b875eb"],["#bcd382","#328e13","#172713","#340059"]];

  /* ---------- Couleur : sRGB <-> OKLab / OKLCH ---------- */
  function hexToRgb(hex) {
    var s = String(hex).replace("#", "").trim();
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function delin(c) { var v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, v)) * 255); }
  function rgbToOklab(rgb) {
    var r = lin(rgb[0]), g = lin(rgb[1]), b = lin(rgb[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function oklabToLinear(lab) {
    var l = Math.pow(lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2], 3);
    var m = Math.pow(lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2], 3);
    var s = Math.pow(lab[0] - 0.0894841775 * lab[1] - 1.291485548 * lab[2], 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  }
  function toLch(hex) { var o = rgbToOklab(hexToRgb(hex)); return [o[0], Math.hypot(o[1], o[2]), (Math.atan2(o[2], o[1]) * 180 / Math.PI + 360) % 360]; }
  function inGamut(c) { return c.every(function (v) { return v >= -0.0005 && v <= 1.0005; }); }
  function fromLch(L, C, H) {
    var hr = H * Math.PI / 180, lo = 0, hi = C, best = 0;
    if (inGamut(oklabToLinear([L, C * Math.cos(hr), C * Math.sin(hr)]))) best = C;
    else { for (var i = 0; i < 24; i++) { var mid = (lo + hi) / 2; if (inGamut(oklabToLinear([L, mid * Math.cos(hr), mid * Math.sin(hr)]))) { best = mid; lo = mid; } else hi = mid; } }
    var c = oklabToLinear([L, best * Math.cos(hr), best * Math.sin(hr)]);
    return "#" + c.map(function (v) { return ("0" + delin(v).toString(16)).slice(-2); }).join("");
  }
  function luminance(hex) { var c = hexToRgb(hex).map(lin); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contraste(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function ecart(a, b) { var p = rgbToOklab(hexToRgb(a)), q = rgbToOklab(hexToRgb(b)); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); }
  function normalise(hex) { var r = hexToRgb(hex); return "#" + r.map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join(""); }

  /* Assombrit (fond clair) ou éclaircit (fond sombre) une couleur jusqu'au contraste visé, teinte conservée. */
  function lisible(hex, fond, cible) {
    var lch = toLch(hex), out = normalise(hex), sombre = luminance(fond) < 0.2, L = lch[0];
    for (var i = 0; i < 60 && contraste(out, fond) < cible; i++) { L += sombre ? 0.012 : -0.012; out = fromLch(Math.max(0, Math.min(1, L)), lch[1], lch[2]); }
    return out;
  }

  /* ---------- Règles Wada ---------- */
  var SEUILS = { fidele: 0.06, proche: 0.12 };
  function qualifier(e) { return e <= SEUILS.fidele ? "fidèle" : e <= SEUILS.proche ? "proche" : "libre"; }

  /* Classe les 348 combinaisons selon la couleur la plus proche de la couleur de départ. */
  function chercherAccords(depart, options) {
    options = options || {};
    var seed = normalise(depart), taille = options.taille || 0, limite = options.limite || 6, res = [];
    WADA.forEach(function (combo, i) {
      if (taille && combo.length !== taille) return;
      var best = Infinity, idx = 0;
      combo.forEach(function (c, j) { var e = ecart(seed, c); if (e < best) { best = e; idx = j; } });
      res.push({ numero: i + 1, couleurs: combo.slice(), indexCorrespondance: idx, ecart: best });
    });
    var pref = { 3: 0, 4: 1, 2: 2 };
    res.sort(function (a, b) { return (a.ecart - b.ecart) || (pref[a.couleurs.length] - pref[b.couleurs.length]) || (a.numero - b.numero); });
    return res.slice(0, limite).map(function (r) { return construireAccord(seed, r, options.transposer); });
  }

  /* La couleur de départ prend la place de sa correspondante dans la combinaison ;
     les autres couleurs restent celles de Wada (ou sont transposées de l'écart de teinte si demandé). */
  function construireAccord(seed, r, transposer) {
    var match = r.couleurs[r.indexCorrespondance], dH = toLch(seed)[2] - toLch(match)[2];
    var autres = r.couleurs.filter(function (_, j) { return j !== r.indexCorrespondance; }).map(function (c) {
      if (!transposer) return c;
      var l = toLch(c); return fromLch(l[0], l[1], (l[2] + dH + 360) % 360);
    });
    var parts = autres.length === 1 ? [65, 35] : autres.length === 2 ? [60, 30, 10] : [50, 25, 15, 10];
    return { numero: r.numero, wada: r.couleurs, depart: seed, correspondance: match, ecart: Math.round(r.ecart * 1000) / 10,
             fidelite: qualifier(r.ecart), transpose: !!transposer, base: seed, accords: autres, proportions: parts };
  }

  /* Dérive tous les rôles (clair + sombre) à partir d'un accord. */
  function deriverRoles(accord) {
    var s = toLch(accord.base), H = s[2], C = s[1], ac = accord.accords;
    function neutre(L, k) { return fromLch(L, Math.min(k, C * 0.15), H); }
    var clair = { papier: neutre(0.965, 0.014), "papier-clair": neutre(0.985, 0.008), filet: neutre(0.87, 0.02), encre: neutre(0.2, 0.02), "encre-douce": neutre(0.43, 0.02),
                  teinte: fromLch(0.925, Math.min(C * 0.35, 0.045), H), "teinte-douce": fromLch(0.955, Math.min(C * 0.2, 0.025), H) };
    var sombre = { papier: neutre(0.19, 0.012), "papier-clair": neutre(0.23, 0.012), filet: neutre(0.34, 0.016), encre: neutre(0.94, 0.012), "encre-douce": neutre(0.8, 0.014),
                   teinte: fromLch(0.29, Math.min(C * 0.35, 0.045), H), "teinte-douce": fromLch(0.245, Math.min(C * 0.2, 0.025), H) };
    function roles(t, enSombre) {
      var base = enSombre && luminance(accord.base) < 0.06 ? lisible(accord.base, t.papier, 3) : accord.base;
      var o = Object.assign({}, t);
      o.base = base;
      o["base-texte"] = lisible(base, t.papier, 4.5);
      o["base-survol"] = fromLch(Math.max(0, Math.min(1, toLch(base)[0] + (enSombre ? 0.08 : -0.08))), toLch(base)[1], H);
      o["sur-base"] = contraste("#ffffff", base) >= contraste(clair.encre, base) ? "#ffffff" : clair.encre;
      ["accord-1", "accord-2", "accord-3"].forEach(function (k, i) { o[k] = ac[i] || ac[ac.length - 1] || base; });
      o["accord-texte"] = lisible(o["accord-1"], t.papier, 4.5);
      o["sur-accord"] = contraste("#ffffff", o["accord-1"]) >= contraste(clair.encre, o["accord-1"]) ? "#ffffff" : clair.encre;
      o["texte-tableau"] = lisible(base, t.teinte, 4.5);
      var chaud = [accord.base].concat(ac).map(function (c) { var l = toLch(c); return { c: c, d: Math.min(Math.abs(l[2] - 35), 360 - Math.abs(l[2] - 35)), C: l[1] }; })
        .filter(function (x) { return x.C > 0.08; }).sort(function (a, b) { return a.d - b.d; })[0];
      o["alerte-texte"] = lisible(chaud && chaud.d < 45 ? chaud.c : "#b3261e", t.papier, 4.5);
      return o;
    }
    return { papier: roles(clair, false), encre: roles(sombre, true) };
  }

  /* Applique l'accord : à tout le document (les deux thèmes) ou à un seul élément. */
  function appliquerAccord(accord, cible) {
    var r = deriverRoles(accord);
    function decl(o) { return Object.keys(o).map(function (k) { return "--" + k + ":" + o[k]; }).join(";"); }
    if (cible && cible !== document.documentElement) {
      var th = (document.documentElement.getAttribute("data-theme") === "encre") ? r.encre : r.papier;
      Object.keys(th).forEach(function (k) { cible.style.setProperty("--" + k, th[k]); });
      return r;
    }
    var el = document.getElementById("mml-accord");
    if (!el) { el = document.createElement("style"); el.id = "mml-accord"; document.head.appendChild(el); }
    el.textContent = "html:root,html[data-theme=\"papier\"]{" + decl(r.papier) + "}html[data-theme=\"encre\"]{" + decl(r.encre) + "}";
    return r;
  }

  /* Texte prêt à coller dans un prompt (paramètre Palette du manuel). */
  function palettePrompt(accord) {
    var cs = [accord.base].concat(accord.accords);
    return cs.length + " couleurs " + cs.join(", ") + " (Sanzo Wada n° " + accord.numero + ", proportions " + accord.proportions.join("/") + ")";
  }

  /* ---------- Composants ---------- */
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }

  function Bouton(p) {
    var variante = p.variante || "plein";
    var rest = Object.assign({}, p); delete rest.variante; delete rest.className;
    return h("button", Object.assign({ type: "button" }, rest, { className: cx("mml-bouton", "mml-bouton--" + variante, p.className) }), p.children);
  }

  function Nuancier(p) {
    var a = p.accord, items = [{ nom: "base", c: a.base }].concat(a.accords.map(function (c, i) { return { nom: "accord-" + (i + 1), c: c }; }));
    return h("div", { className: "mml-nuancier" },
      h("div", { className: "mml-nuancier__bande" }, items.map(function (it, i) {
        return h("div", { key: i, className: "mml-nuancier__plage", style: { background: it.c, flexGrow: a.proportions[i] || 10 } });
      })),
      p.legende === false ? null : h("div", { className: "mml-nuancier__legende" }, items.map(function (it, i) {
        return h("span", { key: i }, h("b", null, it.nom), " ", it.c.toUpperCase(), " · ", (a.proportions[i] || 10) + " %");
      })),
      p.legende === false ? null : h("p", { className: "mml-nuancier__source" }, "Sanzo Wada n° " + a.numero + " · correspondance " + a.fidelite + " (écart " + a.ecart + ")" + (a.transpose ? " · transposé" : "")));
  }

  function AccordWada(p) {
    var st = React.useState(p.depart || "#1448c8"), depart = st[0], setDepart = st[1];
    var tt = React.useState(p.taille || 0), taille = tt[0], setTaille = tt[1];
    var tr = React.useState(false), transposer = tr[0], setTransposer = tr[1];
    var props = React.useMemo(function () { return chercherAccords(depart, { taille: taille, limite: p.limite || 6, transposer: transposer }); }, [depart, taille, transposer]);
    var sel = React.useState(0), choix = sel[0], setChoix = sel[1];
    var actif = props[Math.min(choix, props.length - 1)];
    React.useEffect(function () {
      if (!actif) return;
      if (p.appliquer !== false) appliquerAccord(actif, p.cible || null);
      if (p.onChange) p.onChange(actif, deriverRoles(actif));
    }, [actif && actif.numero, actif && actif.depart, transposer]);
    return h("div", { className: "mml-accord" },
      h("div", { className: "mml-accord__saisie" },
        h("label", { className: "mml-accord__couleur" },
          h("input", { type: "color", value: depart, onChange: function (e) { setDepart(e.target.value); setChoix(0); }, "aria-label": "Couleur de départ" }),
          h("span", null, h("span", { className: "mml-surtitre" }, "Couleur de départ"), h("input", { className: "mml-accord__hex", value: depart, onChange: function (e) { var v = e.target.value; if (/^#?[0-9a-f]{6}$/i.test(v)) { setDepart(v[0] === "#" ? v : "#" + v); setChoix(0); } } }))),
        h("div", { className: "mml-accord__filtres", role: "group", "aria-label": "Nombre de couleurs" },
          [[0, "Tous"], [2, "2"], [3, "3"], [4, "4"]].map(function (f) {
            return h("button", { key: f[0], type: "button", "aria-pressed": taille === f[0], className: cx("mml-puce", taille === f[0] && "is-on"), onClick: function () { setTaille(f[0]); setChoix(0); } }, f[1]);
          }),
          h("label", { className: "mml-accord__transposer" }, h("input", { type: "checkbox", checked: transposer, onChange: function (e) { setTransposer(e.target.checked); } }), "Transposer"))),
      h("ul", { className: "mml-accord__liste" }, props.map(function (a, i) {
        return h("li", { key: a.numero },
          h("button", { type: "button", className: cx("mml-accord__item", i === choix && "is-on"), onClick: function () { setChoix(i); }, "aria-pressed": i === choix },
            h("span", { className: "mml-accord__num" }, "n° " + a.numero),
            h("span", { className: cx("mml-accord__fid", "is-" + a.fidelite.replace("è", "e")) }, a.fidelite),
            h("span", { className: "mml-accord__mini" }, [a.base].concat(a.accords).map(function (c, j) { return h("i", { key: j, style: { background: c } }); }))));
      })),
      actif ? h(Nuancier, { accord: actif }) : null,
      actif ? h(BlocPrompt, { titre: "Palette pour le prompt", code: palettePrompt(actif) }) : null);
  }

  function EnTete(p) {
    return h("header", { className: "mml-entete" },
      h("div", { className: "mml-entete__marque" },
        h("span", { className: "mml-entete__bloc" }, p.monogramme || "MML"),
        h("span", { className: "mml-entete__filet", "aria-hidden": "true" }),
        h("span", { className: "mml-entete__nom" }, h("b", null, p.nom || "MAN MBAÏ LIKOL"), h("small", null, p.signature || "CRÉATION / IMAGE / DESIGN"))),
      h("span", { className: "mml-surtitre mml-entete__courant" }, p.courant || "RETOUCHEUR / CODES IMAGE"));
  }

  function ModeOperatoire(p) {
    var etapes = p.etapes || ["Source", "Structure", "Lumière", "Style", "Formats"];
    return h("ol", { className: "mml-mode" }, etapes.map(function (e, i) {
      var bout = i === 0 || i === etapes.length - 1;
      return h(React.Fragment, { key: i },
        i > 0 ? h("li", { className: "mml-mode__fleche", "aria-hidden": "true" }, "➜") : null,
        h("li", { className: cx("mml-mode__etape", bout && "is-bout") }, e));
    }));
  }

  function BlocPrompt(p) {
    var c = React.useState(false), copie = c[0], setCopie = c[1];
    function copier() {
      try { navigator.clipboard.writeText(p.code).then(function () { setCopie(true); setTimeout(function () { setCopie(false); }, 1400); }, function () {}); } catch (e) {}
    }
    return h("figure", { className: "mml-prompt" },
      p.titre ? h("figcaption", { className: "mml-surtitre" }, p.titre) : null,
      h("pre", { className: "mml-prompt__code" }, p.code),
      p.copiable === false ? null : h("button", { type: "button", className: "mml-prompt__copier", onClick: copier }, copie ? "Copié" : "Copier"));
  }

  function FicheCommande(p) {
    var lignes = [["Statut et entrée", p.statut], ["Paramètres", p.parametres]];
    var apres = [["Réglage et options", p.reglage], ["Combinaison", p.combinaison], ["À éviter", p.aEviter], ["Exemple", p.exemple]];
    return h("article", { className: "mml-fiche" },
      h("h3", { className: "mml-fiche__titre" }, h("span", null, p.numero), h("code", null, p.code), " ", p.titre),
      lignes.filter(function (l) { return l[1]; }).map(function (l, i) { return h("p", { key: "a" + i, className: "mml-fiche__ligne" }, h("b", null, l[0]), " ", l[1]); }),
      p.prompt ? h("div", { className: "mml-fiche__prompt" }, p.prompt) : null,
      apres.filter(function (l) { return l[1]; }).map(function (l, i) { return h("p", { key: "b" + i, className: "mml-fiche__ligne" }, h("b", null, l[0]), " ", l[1]); }),
      p.validation ? h("p", { className: "mml-fiche__validation" }, h("b", null, "Validation"), " ", p.validation) : null);
  }

  function TableauParametres(p) {
    return h("table", { className: "mml-tableau" },
      h("thead", null, h("tr", null, p.colonnes.map(function (c, i) { return h("th", { key: i, scope: "col" }, c); }))),
      h("tbody", null, p.lignes.map(function (l, i) {
        return h("tr", { key: i }, l.map(function (c, j) { return j === 0 ? h("th", { key: j, scope: "row" }, c) : h("td", { key: j }, c); }));
      })));
  }

  window.MML = {
    AccordWada: AccordWada, Nuancier: Nuancier, EnTete: EnTete, ModeOperatoire: ModeOperatoire, FicheCommande: FicheCommande,
    BlocPrompt: BlocPrompt, TableauParametres: TableauParametres, Bouton: Bouton,
    WADA: WADA, chercherAccords: chercherAccords, deriverRoles: deriverRoles, appliquerAccord: appliquerAccord, palettePrompt: palettePrompt,
    couleur: { toLch: toLch, fromLch: fromLch, contraste: contraste, ecart: ecart, lisible: lisible }
  };
})();
