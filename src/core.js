/* La Chromathèque de Man Mbaï Likol — fonctions pures : couleur, valeurs, recherche Wada, simulations, exports, liens.
   Aucune dépendance au DOM. Dans le navigateur : window.WadaCore. Dans Node : require("./src/core.js")
   (tests dans tests/, génération des pages par accord dans tools/). */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api; else root.WadaCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------- couleur : sRGB ↔ OKLab / OKLCH ---------- */
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function toHex(r) { return "#" + r.map(function (v) { return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(""); }
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function delin(c) { var v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.max(0, Math.min(1, v)) * 255; }
  function labFromRgb(p) {
    var r = lin(p[0]), g = lin(p[1]), b = lin(p[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function lab(hex) { return labFromRgb(rgb(hex)); }
  function linFromLab(L) {
    var l = Math.pow(L[0] + 0.3963377774 * L[1] + 0.2158037573 * L[2], 3), m = Math.pow(L[0] - 0.1055613458 * L[1] - 0.0638541728 * L[2], 3), s = Math.pow(L[0] - 0.0894841775 * L[1] - 1.291485548 * L[2], 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  }
  function lch(hex) { var o = lab(hex); return [o[0], Math.hypot(o[1], o[2]), (Math.atan2(o[2], o[1]) * 180 / Math.PI + 360) % 360]; }
  function fromLch(L, C, H) {
    var hr = H * Math.PI / 180, ok = function (c) { var v = linFromLab([L, c * Math.cos(hr), c * Math.sin(hr)]); return v.every(function (x) { return x >= -0.0005 && x <= 1.0005; }); };
    var best = C; if (!ok(C)) { var lo = 0, hi = C; best = 0; for (var i = 0; i < 22; i++) { var mid = (lo + hi) / 2; if (ok(mid)) { best = mid; lo = mid; } else hi = mid; } }
    return toHex(linFromLab([L, best * Math.cos(hr), best * Math.sin(hr)]).map(delin));
  }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
  function lum(hex) { var c = rgb(hex).map(lin); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function readableOn(bg) { var w = contrast("#ffffff", bg), k = contrast("#141413", bg); return w >= k ? { c: "#ffffff", r: w } : { c: "#141413", r: k }; }
  // Ratio affiché tronqué (jamais arrondi au-dessus d'un seuil : 4.46 → « 4.4 »). Usage d'un contraste pour du texte (WCAG 2.2, 1.4.3).
  function ratioText(r) { return (Math.floor(r * 10 + 1e-9) / 10).toFixed(1); }
  function textUse(r) { return r >= 4.5 ? "body" : r >= 3 ? "large" : "none"; }
  function towards(hex, bg, target) { var l = lch(hex), out = hex, dark = lum(bg) < 0.2, L = l[0]; for (var i = 0; i < 70 && contrast(out, bg) < target; i++) { L += dark ? 0.012 : -0.012; out = fromLch(Math.max(0, Math.min(1, L)), l[1], l[2]); } return out; }
  function shade(hex, dL) { var l = lch(hex); return fromLch(Math.max(0, Math.min(1, l[0] + dL)), l[1], l[2]); }
  function parseHex(v) {
    v = String(v).trim(); if (v[0] !== "#") v = "#" + v;
    if (/^#[0-9a-f]{3}$/i.test(v)) v = "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null;
  }

  /* ---------- noms de couleur (FR / EN) ---------- */
  var NAMES = {
    fr: { white: "blanc", black: "noir", lightgrey: "gris clair", darkgrey: "gris foncé", grey: "gris", pink: "rose", red: "rouge", orange: "orange", ochre: "ocre", yellow: "jaune", yellowgreen: "vert-jaune", green: "vert", seafoam: "vert d'eau", teal: "bleu-vert", blue: "bleu", blueviolet: "bleu violet", violet: "violet", magenta: "magenta", brown: "brun", olivebrown: "brun olive", olive: "olive", burgundy: "bordeaux", pale: "pâle", deep: "profond", muted: "grisé" },
    en: { white: "white", black: "black", lightgrey: "light grey", darkgrey: "dark grey", grey: "grey", pink: "pink", red: "red", orange: "orange", ochre: "ochre", yellow: "yellow", yellowgreen: "yellow-green", green: "green", seafoam: "seafoam", teal: "teal", blue: "blue", blueviolet: "blue violet", violet: "violet", magenta: "magenta", brown: "brown", olivebrown: "olive brown", olive: "olive", burgundy: "burgundy", pale: "pale", deep: "deep", muted: "muted" }
  };
  function nameOf(hex, lang) {
    var N = NAMES[lang] || NAMES.fr, l = lch(hex), L = l[0], C = l[1], H = l[2];
    if (C < 0.03) return N[L > 0.92 ? "white" : L < 0.25 ? "black" : L > 0.7 ? "lightgrey" : L < 0.45 ? "darkgrey" : "grey"];
    var hues = [[20, "pink"], [35, "red"], [60, "orange"], [85, "ochre"], [105, "yellow"], [130, "yellowgreen"], [165, "green"], [195, "seafoam"], [230, "teal"], [265, "blue"], [290, "blueviolet"], [320, "violet"], [350, "magenta"], [361, "pink"]];
    var k = hues.find(function (h) { return H < h[0]; })[1];
    if (k === "orange" && L < 0.55) k = "brown"; if (k === "ochre" && L < 0.5) k = "olivebrown"; if (k === "yellow" && L < 0.6) k = "olive"; if (k === "red" && L < 0.4) k = "burgundy";
    var mod = L > 0.82 ? "pale" : L < 0.38 && k !== "brown" && k !== "olivebrown" && k !== "burgundy" ? "deep" : C < 0.08 ? "muted" : "";
    if (!mod) return N[k];
    return lang === "en" ? N[mod] + " " + N[k] : N[k] + " " + N[mod];
  }

  /* ---------- valeurs pour les pros ----------
     CMJN : conversion naïve, sans profil ICC. LRV : luminance relative Y (D65) × 100, estimée depuis le sRGB.
     Les deux sont des estimations, à présenter comme telles. */
  function hslOf(hex) {
    var p = rgb(hex).map(function (v) { return v / 255; }), mx = Math.max.apply(null, p), mn = Math.min.apply(null, p), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = 60 * (mx === p[0] ? ((p[1] - p[2]) / d + 6) % 6 : mx === p[1] ? (p[2] - p[0]) / d + 2 : (p[0] - p[1]) / d + 4); }
    return [Math.round(h) % 360, Math.round(s * 100), Math.round(l * 100)];
  }
  function cmykOf(hex) {
    var p = rgb(hex).map(function (v) { return v / 255; }), k = 1 - Math.max.apply(null, p);
    if (k >= 1) return [0, 0, 0, 100];
    return p.map(function (v) { return Math.round((1 - v - k) / (1 - k) * 100); }).concat(Math.round(k * 100));
  }
  function lrvOf(hex) { return Math.round(lum(hex) * 1000) / 10; }
  function values(hex) {
    var l = lch(hex), h = hslOf(hex);
    return { hex: hex.toUpperCase(), rgb: rgb(hex).join(" "), hsl: h[0] + "° " + h[1] + "% " + h[2] + "%",
      oklch: (l[0] * 100).toFixed(1) + "% " + l[1].toFixed(3) + " " + (l[1] < 0.002 ? 0 : Math.round(l[2])) + "°", cmjn: cmykOf(hex).join(" "), lrv: lrvOf(hex).toFixed(1) };
  }

  /* ---------- règles Wada ---------- */
  var PROPS = { 2: [65, 35], 3: [60, 30, 10], 4: [50, 25, 15, 10] };
  // Proportions réglables (convention MML) : entiers ≥ 1, somme 100, une par couleur ; sinon la proportion par défaut.
  var PART_MIN = 5;
  function cleanParts(a) {
    if (!Array.isArray(a) || a.length < 2 || a.length > 4) return null;
    var ok = a.every(function (x) { return x === Math.round(x) && x >= 1 && x <= 99; }) && a.reduce(function (s, x) { return s + x; }, 0) === 100;
    return ok ? a.slice() : null;
  }
  function partsOf(n, parts) { return parts && parts.length === n && cleanParts(parts) ? parts.slice() : PROPS[n].slice(); }
  // Régler la part i à v : les autres se partagent le reste au prorata de leurs valeurs, en entiers, somme 100.
  function setPart(parts, i, v) {
    var n = parts.length, lo = PART_MIN, hi = 100 - PART_MIN * (n - 1);
    v = Math.max(lo, Math.min(hi, Math.round(+v || 0)));
    var rest = 100 - v, others = parts.map(function (x, j) { return j === i ? 0 : Math.max(x, 0.0001); }), tot = others.reduce(function (s, x) { return s + x; }, 0);
    var raw = others.map(function (x, j) { return j === i ? v : Math.max(lo, rest * x / tot); });
    var out = raw.map(function (x, j) { return j === i ? v : Math.floor(x); }), diff = 100 - out.reduce(function (s, x) { return s + x; }, 0);
    var order = out.map(function (_, j) { return j; }).filter(function (j) { return j !== i; }).sort(function (a, b) { return (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])); });
    for (var k = 0; diff !== 0 && k < 400; k++) { var j = order[k % order.length], step = diff > 0 ? 1 : -1; if (out[j] + step >= lo) { out[j] += step; diff -= step; } }
    return out;
  }
  function sameParts(a, b) { return !!a && !!b && a.join() === b.join(); }
  var ROLES = {
    fr: { 2: ["Dominante", "Contraste"], 3: ["Dominante", "Secondaire", "Accent"], 4: ["Dominante", "Secondaire", "Complément", "Accent"] },
    en: { 2: ["Dominant", "Contrast"], 3: ["Dominant", "Secondary", "Accent"], 4: ["Dominant", "Secondary", "Complement", "Accent"] }
  };
  var SLUGS = {
    fr: { 2: ["dominante", "contraste"], 3: ["dominante", "secondaire", "accent"], 4: ["dominante", "secondaire", "complement", "accent"] },
    en: { 2: ["dominant", "contrast"], 3: ["dominant", "secondary", "accent"], 4: ["dominant", "secondary", "complement", "accent"] }
  };
  function rolesOf(n, lang) { return (ROLES[lang] || ROLES.fr)[n]; }
  function slugsOf(n, lang) { return (SLUGS[lang] || SLUGS.fr)[n]; }
  // Clé de fidélité ("fidele" | "proche" | "libre") ; le libellé affiché vient des traductions.
  function fid(d) { return d <= 0.06 ? "fidele" : d <= 0.12 ? "proche" : "libre"; }

  /* Recherche : distance OKLab euclidienne. Tri par écart croissant, puis 3, 4, 2 couleurs, puis numéro.
     Avec seed2 : chaque couleur prend une case différente ; l'écart retenu est le pire des deux, départagé par la somme. */
  function createSearch(combos) {
    var LAB = combos.map(function (c) { return c.map(lab); }), pref = { 3: 0, 4: 1, 2: 2 };
    return function search(seed, size, seed2) {
      var s = lab(seed), s2 = seed2 ? lab(seed2) : null, res = [];
      combos.forEach(function (combo, i) {
        if (size && combo.length !== size) return;
        var L = LAB[i];
        if (!s2) {
          var best = Infinity, idx = 0;
          L.forEach(function (c, j) { var d = dist(s, c); if (d < best) { best = d; idx = j; } });
          res.push({ n: i + 1, colors: combo, idx: idx, d: best, sum: best });
          return;
        }
        var top = null;
        for (var a = 0; a < L.length; a++) for (var b = 0; b < L.length; b++) {
          if (a === b) continue;
          var d1 = dist(s, L[a]), d2 = dist(s2, L[b]), m = Math.max(d1, d2), sum = d1 + d2;
          if (!top || m < top.d || (m === top.d && sum < top.sum)) top = { n: i + 1, colors: combo, idx: a, idx2: b, d: m, sum: sum, d1: d1, d2: d2 };
        }
        res.push(top);
      });
      res.sort(function (a, b) { return (a.d - b.d) || (a.sum - b.sum) || (pref[a.colors.length] - pref[b.colors.length]) || (a.n - b.n); });
      return res;
    };
  }
  // La couleur de départ remplace sa correspondante ; les compagnes restent celles du dictionnaire (sauf transposition, option MML).
  function build(r, seed, opts) {
    var two = r.idx2 != null, match = r.colors[r.idx], match2 = two ? r.colors[r.idx2] : null, dH = lch(seed)[2] - lch(match)[2], useSeed = opts.substitute;
    var others = r.colors.filter(function (_, j) { return j !== r.idx && j !== r.idx2; }).map(function (c) { if (!opts.transpose) return c; var l = lch(c); return l[1] < 0.03 ? c : fromLch(l[0], l[1], (l[2] + dH + 360) % 360); });
    var head = [useSeed ? seed : match]; if (two) head.push(useSeed ? opts.seed2 : match2);
    return { n: r.n, wada: r.colors, d: r.d, d1: r.d1, d2: r.d2, two: two, fid: fid(r.d), match: match, match2: match2, colors: head.concat(others) };
  }
  // Nature de l'accord affiché : « original » (couleurs exactes de la source), « adapte » (ta couleur à la place
  // de sa voisine, ou compagnes transposées), « rule » (règle calculée, sans référence à reproduire).
  function kindOf(a) {
    if (a.rule) return "rule";
    var orig = (a.wada || []).map(function (c) { return c.toLowerCase(); });
    return a.colors.every(function (c) { return orig.indexOf(c.toLowerCase()) >= 0; }) ? "original" : "adapte";
  }

  /* ---------- simulations d'affichage ----------
     Éclairage : adaptation de Bradford, en gardant KEEP de la teinte de la lampe (l'œil n'en compense qu'une partie).
     Daltonisme : matrices de Machado, Oliveira et Fernandes (2009), sévérité 1, appliquées en RGB linéaire. */
  var SRGB_XYZ = [[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.072175], [0.0193339, 0.119192, 0.9503041]];
  var XYZ_SRGB = [[3.2404542, -1.5371385, -0.4985314], [-0.969266, 1.8760108, 0.041556], [0.0556434, -0.2040259, 1.0572252]];
  var BRAD = [[0.8951, 0.2664, -0.1614], [-0.7502, 1.7135, 0.0367], [0.0389, -0.0685, 1.0296]];
  var BRAD_INV = [[0.9869929, -0.1470543, 0.1599627], [0.4323053, 0.5183603, 0.0492912], [-0.0085287, 0.0400428, 0.9684867]];
  function mul(M, v) { return M.map(function (r) { return r[0] * v[0] + r[1] * v[1] + r[2] * v[2]; }); }
  function whiteXYZ(x, y) { return [x / y, 1, (1 - x - y) / y]; }
  var LIGHTS = { 4000: whiteXYZ(0.3805, 0.3768), 2700: whiteXYZ(0.4599, 0.4106) }, D65_LMS = mul(BRAD, whiteXYZ(0.3127, 0.329)), KEEP = 0.5;
  var CVD = {
    protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
    tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]
  };
  function simulate(hex, light, vision) {
    var v = rgb(hex).map(lin);
    if (LIGHTS[light]) {
      var W = mul(BRAD, LIGHTS[light]);
      v = mul(XYZ_SRGB, mul(BRAD_INV, mul(BRAD, mul(SRGB_XYZ, v)).map(function (c, i) { return c * (1 + (W[i] / D65_LMS[i] - 1) * KEEP); })));
    }
    if (CVD[vision]) v = mul(CVD[vision], v);
    return toHex(v.map(delin));
  }
  // Paires que chaque type de daltonisme rend difficiles à distinguer (écart OKLab simulé < 0.04).
  function confusions(cs) {
    var out = [];
    Object.keys(CVD).forEach(function (k) {
      var s = cs.map(function (c) { return lab(simulate(c, 6500, k)); });
      for (var i = 0; i < cs.length; i++) for (var j = i + 1; j < cs.length; j++) if (dist(s[i], s[j]) < 0.04) out.push({ k: k, a: cs[i], b: cs[j] });
    });
    return out;
  }

  /* ---------- exports logiciels : items = [{ hex, role, slug, pct, name }] ---------- */
  var EXPORT_TXT = {
    fr: { num: "n° ", conv: "convention MML", hex: "Hex : cibles HexPot, à vérifier sur le support réel.", tw4: "Tailwind CSS v4 : colle ce bloc dans ton CSS principal, puis utilise", tw3: "Tailwind CSS v3 : dans tailwind.config.js, theme.extend.colors =" },
    en: { num: "No. ", conv: "MML convention", hex: "Hex: HexPot targets, check them on the real material.", tw4: "Tailwind CSS v4: paste this block into your main CSS, then use", tw3: "Tailwind CSS v3: in tailwind.config.js, theme.extend.colors =" }
  };
  function tx(lang) { return EXPORT_TXT[lang] || EXPORT_TXT.fr; }
  function aseBytes(title, items) {
    var chunks = [];
    function utf16(s) { var b = new Uint8Array((s.length + 1) * 2); for (var i = 0; i < s.length; i++) { b[i * 2] = s.charCodeAt(i) >> 8; b[i * 2 + 1] = s.charCodeAt(i) & 255; } return b; }
    function named(name, extra) { var s = utf16(name), b = new Uint8Array(2 + s.length + extra.length); new DataView(b.buffer).setUint16(0, name.length + 1); b.set(s, 2); b.set(extra, 2 + s.length); return b; }
    function block(type, body) { var h = new DataView(new ArrayBuffer(6)); h.setUint16(0, type); h.setUint32(2, body.length); chunks.push(new Uint8Array(h.buffer), body); }
    block(0xC001, named(title, new Uint8Array(0)));
    items.forEach(function (it) {
      var e = new DataView(new ArrayBuffer(18));
      "RGB ".split("").forEach(function (ch, i) { e.setUint8(i, ch.charCodeAt(0)); });
      rgb(it.hex).forEach(function (v, i) { e.setFloat32(4 + i * 4, v / 255); });
      e.setUint16(16, 2); // couleur « normale » (ni globale ni ton direct)
      block(0x0001, named(it.role + " " + it.hex.toUpperCase(), new Uint8Array(e.buffer)));
    });
    block(0xC002, new Uint8Array(0));
    var head = new DataView(new ArrayBuffer(12));
    "ASEF".split("").forEach(function (ch, i) { head.setUint8(i, ch.charCodeAt(0)); });
    head.setUint16(4, 1); head.setUint16(6, 0); head.setUint32(8, items.length + 2);
    chunks.unshift(new Uint8Array(head.buffer));
    var size = chunks.reduce(function (s, c) { return s + c.length; }, 0), out = new Uint8Array(size), at = 0;
    chunks.forEach(function (c) { out.set(c, at); at += c.length; });
    return out;
  }
  // meta : { key: "wada-55", title: "Sanzo Wada n° 55", prefix: "wada", note } ; un numéro seul = accord Wada.
  function metaOf(n, lang) {
    if (n && typeof n === "object") return n;
    var T = tx(lang); return { key: "wada-" + n, title: "Sanzo Wada " + T.num + n, prefix: "wada", note: T.hex };
  }
  function tokensText(n, items, lang) {
    var T = tx(lang), m = metaOf(n, lang), g = { $description: m.title + " — " + items.map(function (it) { return it.pct; }).join("/") + " (" + T.conv + "). " + (m.note || "") };
    items.forEach(function (it) { g[it.slug] = { $type: "color", $value: it.hex, $description: it.role + " · " + it.pct + " % · " + it.name }; });
    var root = {}; root[m.key] = g;
    return JSON.stringify(root, null, 2) + "\n";
  }
  function tailwindText(n, items, lang) {
    var T = tx(lang), m = metaOf(n, lang), p = m.prefix || "wada";
    return "/* " + m.title + " — " + items.map(function (it) { return it.pct; }).join("/") + " */\n" +
      "/* " + T.tw4 + " bg-" + p + "-" + items[0].slug + ", text-" + p + "-… */\n" +
      "@theme {\n" + items.map(function (it) { return "  --color-" + p + "-" + it.slug + ": " + it.hex + ";"; }).join("\n") + "\n}\n\n" +
      "/* " + T.tw3 + "\n   { " + p + ": { " + items.map(function (it) { return it.slug + ": '" + it.hex + "'"; }).join(", ") + " } } */\n";
  }
  function gplText(n, items, lang) {
    var pad = function (v) { return ("  " + v).slice(-3); };
    return "GIMP Palette\nName: " + metaOf(n, lang).title + "\nColumns: " + items.length + "\n#\n" +
      items.map(function (it) { var p = rgb(it.hex); return pad(p[0]) + " " + pad(p[1]) + " " + pad(p[2]) + "\t" + it.role + " (" + it.pct + " %) " + it.hex.toUpperCase(); }).join("\n") + "\n";
  }

  /* ---------- règles d'harmonie (générateurs MML) ----------
     Lecture en OKLCH des harmonies de Chevreul (1839) et des accords d'Itten : la couleur de départ est gardée
     telle quelle, les autres tournent autour du cercle des teintes. Ce ne sont pas des accords d'un dictionnaire. */
  var RULES = ["complementaire", "analogues", "camaieu", "triade", "voisines", "tetrade"];
  function ruleCombos(seed) {
    var l = lch(seed), L = l[0], C = Math.max(l[1], 0.1), H = l[1] < 0.03 ? 250 : l[2];
    var at = function (dh, dL) { return fromLch(Math.max(0.12, Math.min(0.96, L + (dL || 0))), C, (H + dh + 360) % 360); };
    var ladder = [0.95, 0.78, 0.58, 0.4, 0.24].filter(function (x) { return Math.abs(x - L) > 0.1; });
    var tones = [ladder[0], ladder[Math.floor(ladder.length / 2)], ladder[ladder.length - 1]].map(function (x) { return fromLch(x, C * (x > 0.85 ? 0.35 : 0.9), H); });
    var out = {
      complementaire: [seed, at(180)],
      analogues: [seed, at(30, 0.05), at(-30, -0.05)],
      camaieu: [seed].concat(tones),
      triade: [seed, at(120), at(240)],
      voisines: [seed, at(150), at(210)],
      tetrade: [seed, at(90), at(180), at(270)]
    };
    return RULES.map(function (k, i) { return { n: i + 1, k: k, colors: out[k] }; });
  }
  /* Deux couleurs imposées : elles restent exactes, les compagnes sont calculées à partir du duo.
     médiane (harmonie d'analogues de Chevreul : la teinte intermédiaire), contrepoint (complémentaire de la
     teinte moyenne), clair-obscur (harmonie de gamme : clair de l'une, foncé de l'autre), neutres accordés. */
  var RULES2 = ["mediane", "contrepoint", "clairobscur", "neutres"];
  function ruleCombos2(a, b) {
    var A = lch(a), B = lch(b), wa = A[1] >= 0.03, wb = B[1] >= 0.03;
    var ha = wa ? A[2] : B[2], hb = wb ? B[2] : A[2], d = ((hb - ha + 540) % 360) - 180, mid = (ha + d / 2 + 360) % 360;
    var C = Math.max(A[1], B[1], 0.06), L = (A[0] + B[0]) / 2, la = lab(a), lb = lab(b);
    var out = {
      mediane: [a, b, toHex(linFromLab(la.map(function (v, i) { return (v + lb[i]) / 2; })).map(delin)), fromLch(Math.min(0.94, L + 0.25), C * 0.45, mid)],
      contrepoint: [a, b, fromLch(Math.max(0.3, Math.min(0.8, L)), C, (mid + 180) % 360)],
      clairobscur: [a, b, fromLch(0.94, Math.min(A[1], 0.05), A[2]), fromLch(0.24, Math.min(B[1], 0.08), B[2])],
      neutres: [a, b, fromLch(0.93, 0.012, ha), fromLch(0.28, 0.018, hb)]
    };
    return RULES2.map(function (k, i) { return { n: i + 1, k: k, colors: out[k] }; });
  }

  /* ---------- analyses par métier ----------
     Chaque contrôle rend { k, lv: "ok" | "warn" | "info", v } ; les textes sont dans i18n.js (chk.<k>.<lv>).
     Les hex de v sont affichés avec leur nom par l'interface. Seuils : WCAG 2.2 (4.5:1 texte, 3:1 éléments
     graphiques), 30 points de LRV entre surfaces voisines (repère d'accessibilité courant), plage vidéo 16–235. */
  var JOBS = {
    graphisme: { f: "image", c: ["text", "grey", "cmyk", "harmony"] },
    motion: { f: "image", c: ["text", "video", "cvd", "temp"] },
    da: { f: "image", c: ["harmony", "temp", "pop", "grey"] },
    packaging: { f: "image", c: ["pop", "cmyk", "text", "light4000"] },
    ux: { f: "numerique", c: ["text", "nontext", "cvd", "semantic"] },
    ui: { f: "numerique", c: ["roles", "text", "nontext", "cvd"] },
    web: { f: "numerique", c: ["roles", "text", "dark", "cvd"] },
    jeu: { f: "numerique", c: ["popout", "cvd", "temp", "harmony"] },
    interieur: { f: "espace", c: ["lrv", "lrvdiff", "light2700", "temp"] },
    retail: { f: "espace", c: ["light4000", "pop", "text", "lrvdiff"] },
    scenographie: { f: "espace", c: ["light2700", "lrv", "popout", "harmony"] },
    produit: { f: "objet", c: ["heat", "nontext", "lrvdiff", "temp"] },
    transport: { f: "objet", c: ["heat", "road", "pop", "grey"] },
    mode: { f: "mode", c: ["temp", "contrastlvl", "harmony", "light2700"] },
    textile: { f: "mode", c: ["mix", "count", "grey", "light4000"] }
  };
  var JOB_IDS = Object.keys(JOBS), FAMILIES = ["image", "numerique", "espace", "objet", "mode"];
  function hueGap(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
  function harmonyOf(cs) {
    var h = cs.map(lch).filter(function (l) { return l[1] >= 0.04; }).map(function (l) { return l[2]; });
    if (!h.length) return "neutre";
    if (h.length === 1) return "mono";
    var gaps = []; for (var i = 0; i < h.length; i++) for (var j = i + 1; j < h.length; j++) gaps.push(hueGap(h[i], h[j]));
    if (Math.max.apply(null, gaps) <= 40) return "analogue";
    if (h.length >= 3 && Math.min.apply(null, gaps) >= 70) return "triade";
    if (gaps.some(function (g) { return g >= 150; })) return "complementaire";
    return "contraste";
  }
  // Chaud / froid, pondéré par les proportions : les neutres ne comptent pas.
  function tempOf(cs) {
    var parts = PROPS[cs.length], s = 0;
    cs.forEach(function (c, i) { var l = lch(c); if (l[1] < 0.04) return; var H = l[2]; s += (H < 100 || H >= 330 ? 1 : H >= 150 && H < 300 ? -1 : 0) * parts[i] / 100; });
    return s > 0.2 ? "chaud" : s < -0.2 ? "froid" : "equilibre";
  }
  // Estimation : couleurs écran très saturées, souvent hors de la gamme d'une impression quadri sur couché.
  function cmykRisk(hex) { var l = lch(hex); return l[1] > 0.2 || (l[1] > 0.15 && l[2] >= 140 && l[2] <= 300); }
  function videoUnsafe(hex) { return rgb(hex).some(function (v) { return v < 16 || v > 235; }); }
  // Mélange optique (motif vu de loin) : moyenne en RGB linéaire, pondérée par les proportions.
  function opticalMix(cs) {
    var parts = PROPS[cs.length], acc = [0, 0, 0];
    cs.forEach(function (c, i) { rgb(c).map(lin).forEach(function (v, j) { acc[j] += v * parts[i] / 100; }); });
    return toHex(acc.map(delin));
  }
  function pairs(cs) { var o = []; for (var i = 0; i < cs.length; i++) for (var j = i + 1; j < cs.length; j++) o.push([cs[i], cs[j]]); return o; }
  function byDesc(list, f) { return list.map(function (c) { return [c, f(c)]; }).sort(function (x, y) { return y[1] - x[1]; })[0]; }
  function lightCheck(cs, K) {
    var s = cs.map(function (c) { return lab(simulate(c, K, "normale")); });
    for (var i = 0; i < cs.length; i++) for (var j = i + 1; j < cs.length; j++) if (dist(s[i], s[j]) < 0.04 && dist(lab(cs[i]), lab(cs[j])) >= 0.04) return { lv: "warn", v: { a: cs[i], b: cs[j], K: K } };
    var most = byDesc(cs, function (c) { return dist(lab(c), lab(simulate(c, K, "normale"))); });
    return { lv: "ok", v: { a: most[0], K: K } };
  }
  var CHECKS = {
    text: function (cs) {
      var b = pairs(cs).map(function (p) { return [p[0], p[1], contrast(p[0], p[1])]; }).sort(function (x, y) { return y[2] - x[2]; })[0];
      if (b[2] >= 4.5) return { lv: "ok", v: { a: b[0], b: b[1], r: ratioText(b[2]) } };
      // Sous 4,5:1 : grand texte seulement (≥ 3:1) ou rien ; correction proposée : blanc ou noir, ou la couleur ajustée sur ce fond.
      var fix = readableOn(b[1]), adj = towards(b[0], b[1], 4.5);
      return { lv: "warn", v: { a: b[0], b: b[1], r: ratioText(b[2]), use: textUse(b[2]), fix: fix.c, fr: ratioText(fix.r), adj: contrast(adj, b[1]) >= 4.5 && adj !== b[0] ? adj : "" } };
    },
    nontext: function (cs) { var a = cs[cs.length - 1], r = contrast(cs[0], a); return { lv: r >= 3 ? "ok" : "warn", v: { a: a, b: cs[0], r: ratioText(r) } }; },
    cvd: function (cs) { var c = confusions(cs); return c.length ? { lv: "warn", v: { a: c[0].a, b: c[0].b, t: c[0].k } } : { lv: "ok", v: {} }; },
    grey: function (cs) { var p = pairs(cs).find(function (x) { return contrast(x[0], x[1]) < 1.25; }); return p ? { lv: "warn", v: { a: p[0], b: p[1] } } : { lv: "ok", v: {} }; },
    cmyk: function (cs) { var r = cs.filter(cmykRisk); return r.length ? { lv: "warn", v: { list: r } } : { lv: "ok", v: {} }; },
    video: function (cs) { var r = cs.filter(videoUnsafe); return r.length ? { lv: "warn", v: { list: r } } : { lv: "ok", v: {} }; },
    harmony: function (cs) { return { lv: "info", v: { type: harmonyOf(cs) } }; },
    temp: function (cs) { return { lv: "info", v: { type: tempOf(cs) } }; },
    pop: function (cs) { var b = byDesc(cs.slice(1), function (c) { return lch(c)[1]; }); return { lv: b[1] >= 0.12 ? "ok" : "warn", v: { a: b[0] } }; },
    lrv: function (cs) { var l = lrvOf(cs[0]); return { lv: l < 20 ? "warn" : l > 60 ? "ok" : "info", v: { a: cs[0], l: l.toFixed(0) } }; },
    lrvdiff: function (cs) { var b = byDesc(cs.slice(1), function (c) { return Math.abs(lrvOf(c) - lrvOf(cs[0])); }); return { lv: b[1] >= 30 ? "ok" : "warn", v: { a: cs[0], b: b[0], d: b[1].toFixed(0) } }; },
    light2700: function (cs) { return lightCheck(cs, 2700); },
    light4000: function (cs) { return lightCheck(cs, 4000); },
    heat: function (cs) { var l = lrvOf(cs[0]); return { lv: l < 25 ? "warn" : l > 55 ? "ok" : "info", v: { a: cs[0], l: l.toFixed(0) } }; },
    road: function (cs) { var l = lrvOf(cs[0]); return { lv: l >= 30 ? "ok" : "warn", v: { a: cs[0], l: l.toFixed(0) } }; },
    semantic: function (cs) {
      var H = cs.map(lch), red = H.some(function (l) { return l[1] > 0.08 && (l[2] < 45 || l[2] > 345); }), green = H.some(function (l) { return l[1] > 0.06 && l[2] >= 120 && l[2] <= 170; });
      return { lv: red && green ? "warn" : "ok", v: {} };
    },
    // UI / web : fond = dominante, couleur d'action = la plus saturée, texte = la plus contrastée (ou blanc / noir).
    roles: function (cs) {
      var bg = cs[0], p = byDesc(cs.slice(1), function (c) { return lch(c)[1]; })[0], r = contrast(p, bg), tt = byDesc(cs.slice(1), function (c) { return contrast(c, bg); });
      return { lv: r >= 3 ? "ok" : "warn", v: { bg: bg, p: p, r: ratioText(r), t: tt[1] >= 4.5 ? tt[0] : readableOn(bg).c } };
    },
    dark: function (cs) { var d = cs.slice().sort(function (x, y) { return lum(x) - lum(y); })[0], o = byDesc(cs.filter(function (c) { return c !== d; }), function (c) { return contrast(c, d); }); return { lv: o[1] >= 4.5 ? "ok" : "info", v: { bg: d, a: o[0], r: ratioText(o[1]) } }; },
    popout: function (cs) { var a = cs[cs.length - 1]; return { lv: dist(lab(a), lab(cs[0])) >= 0.25 ? "ok" : "warn", v: { a: a, b: cs[0] } }; },
    contrastlvl: function (cs) { var L = cs.map(function (c) { return lch(c)[0]; }), r = Math.max.apply(null, L) - Math.min.apply(null, L); return { lv: "info", v: { type: r < 0.25 ? "doux" : r < 0.5 ? "moyen" : "fort" } }; },
    mix: function (cs) { return { lv: "info", v: { a: opticalMix(cs) } }; },
    count: function (cs) { return { lv: "info", v: { n: cs.length } }; }
  };
  // Pourquoi cet accord : mesures vérifiables (contraste maximal, couleurs trop proches, couleurs imposées gardées), sans note d'harmonie.
  function whyOf(cs, locked) {
    var best = 0, close = null, minD = Infinity;
    pairs(cs).forEach(function (p) { var r = contrast(p[0], p[1]), d = dist(lab(p[0]), lab(p[1])); if (r > best) best = r; if (d < minD) { minD = d; close = p; } });
    var low = cs.map(function (c) { return c.toLowerCase(); }), lk = (locked || []).map(function (c) { return c.toLowerCase(); });
    return { r: ratioText(best), use: textUse(best), close: minD < 0.08 ? close : null, locked: lk.length, kept: lk.filter(function (c) { return low.indexOf(c) >= 0; }).length };
  }
  function jobChecks(job, cs) {
    var j = JOBS[job] || JOBS.interieur;
    return j.c.map(function (k) { var r = CHECKS[k](cs); return { k: k, lv: r.lv, v: r.v }; });
  }

  /* ---------- gamme : clairs et foncés d'une couleur (charte, interface, déclinaisons) ----------
     11 paliers façon 50…950 en OKLCH : même teinte, chroma atténué aux extrêmes ; le palier le plus proche
     de la couleur d'origine prend sa valeur exacte (base). */
  var SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  var SCALE_L = [0.975, 0.94, 0.88, 0.8, 0.71, 0.62, 0.53, 0.45, 0.37, 0.29, 0.22];
  function scaleOf(hex) {
    var l = lch(hex), L = l[0], Cc = l[1], H = l[2], best = 0;
    SCALE_L.forEach(function (x, i) { if (Math.abs(x - L) < Math.abs(SCALE_L[best] - L)) best = i; });
    return SCALE_STEPS.map(function (step, i) {
      if (i === best) return { step: step, hex: hex.toLowerCase(), base: true };
      var x = SCALE_L[i], k = Math.max(0.15, 1 - Math.abs(x - L) / 0.9) * (x > 0.9 ? 0.55 : 1);
      return { step: step, hex: fromLch(x, Cc < 0.03 ? Cc : Cc * k, H), base: false };
    });
  }
  // items : [{ slug, hex }] → texte CSS, Tailwind v4 ou tokens W3C de toutes les gammes.
  function scaleText(kind, items, prefix) {
    var p = prefix || "wada", rows = items.map(function (it) { return { slug: it.slug, scale: scaleOf(it.hex) }; });
    if (kind === "tokens") {
      var root = {}; root[p] = {};
      rows.forEach(function (r) { var g = root[p][r.slug] = {}; r.scale.forEach(function (s) { g[s.step] = { $type: "color", $value: s.hex }; }); });
      return JSON.stringify(root, null, 2) + "\n";
    }
    var lines = []; rows.forEach(function (r) { r.scale.forEach(function (s) { lines.push("  --" + (kind === "tailwind" ? "color-" : "") + p + "-" + r.slug + "-" + s.step + ": " + s.hex + ";"); }); });
    return (kind === "tailwind" ? "@theme {\n" : ":root {\n") + lines.join("\n") + "\n}\n";
  }

  /* ---------- recoloration d'une photo ----------
     Chaque pixel garde son écart à la moyenne de sa zone (relief, ombres, texture) et prend la couleur cible :
     lumière conservée à 100 %, nuances de teinte à 30 %. strength : 0 = original, 1 = recoloration complète. */
  function recolorLab(px, mean, target, strength) {
    var s = strength == null ? 1 : strength;
    var out = [target[0] + (px[0] - mean[0]), target[1] + (px[1] - mean[1]) * 0.3, target[2] + (px[2] - mean[2]) * 0.3];
    return [px[0] + (out[0] - px[0]) * s, px[1] + (out[1] - px[1]) * s, px[2] + (out[2] - px[2]) * s];
  }

  /* ---------- note d'intention : les faits, les mots viennent de i18n.js ---------- */
  function intentFacts(cs, job) {
    var checks = jobChecks(job, cs), L = cs.map(function (c) { return lch(c)[0]; }), r = Math.max.apply(null, L) - Math.min.apply(null, L);
    return { harmony: harmonyOf(cs), temp: tempOf(cs), contrast: r < 0.25 ? "doux" : r < 0.5 ? "moyen" : "fort",
      ok: checks.filter(function (c) { return c.lv === "ok"; }).length, warn: checks.filter(function (c) { return c.lv === "warn"; }), checks: checks };
  }

  /* ---------- proposition client et réponse (dans le lien, sans serveur) ----------
     Tout est revalidé à la lecture : liens relus puis resérialisés, hex vérifiés, textes bornés. */
  function str(v, max) { return typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : ""; }
  function cleanProposal(o) {
    if (!o || typeof o !== "object") return null;
    var items = (Array.isArray(o.i) ? o.i : []).map(function (it) {
      var k = it && typeof it.h === "string" ? readHash(it.h) : null; if (!k || !k.n) return null;
      var colors = Array.isArray(it.c) ? it.c.map(function (c) { return typeof c === "string" ? parseHex(c) : null; }) : [];
      if (colors.length < 2 || colors.length > 4 || colors.indexOf(null) >= 0) return null;
      k.lang = null;
      return { h: hashOf(k), c: colors, p: ["A", "B", "C"].indexOf(it.p) >= 0 ? it.p : "", x: str(it.x, 1500), l: str(it.l, 120) };
    }).filter(Boolean).slice(0, 3);
    if (!items.length) return null;
    return { id: str(o.id, 40), t: str(o.t, 80), cl: str(o.cl, 80), s: str(o.s, 80), m: str(o.m, 120), d: str(o.d, 40), i: items };
  }
  function cleanResponse(o) {
    if (!o || typeof o !== "object" || ["A", "B", "C"].indexOf(o.p) < 0) return null;
    return { id: str(o.id, 40), p: o.p, c: str(o.c, 800), n: str(o.n, 80), d: str(o.d, 40) };
  }
  function packLink(o) { return encodeURIComponent(JSON.stringify(o)); }
  function unpackLink(s) { try { return JSON.parse(decodeURIComponent(s)); } catch (e) { return null; } }

  /* ---------- lien partageable : l'état tient dans le hash ----------
     #c=1448c8&c2=e8b04a&n=55&o=1.0.2&t=3&ex=0&tr=1&sc=mode&s=kasane&lg=en — format à garder rétrocompatible.
     sc = métier (les anciennes scènes interieur, mode, graphisme en sont restées les identifiants) ; s = source, absente pour Wada. */
  var SCENES = JOB_IDS, SOURCES = ["wada", "kasane", "afrique", "regles"];
  function readHash(h) {
    var q = {};
    String(h || "").replace(/^#/, "").split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) { try { q[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); } catch (e) {} } });
    var c = q.c ? parseHex(q.c) : null; if (!c) return null;
    return { seed: c, seed2: q.c2 ? parseHex(q.c2) : null, n: Math.max(0, Math.min(999, parseInt(q.n, 10) || 0)),
      order: q.o ? q.o.split(".").map(Number) : null, parts: q.p ? cleanParts(q.p.split(".").map(Number)) : null, size: [2, 3, 4].indexOf(+q.t) >= 0 ? +q.t : 0,
      substitute: q.ex !== "0", transpose: q.tr === "1", scene: SCENES.indexOf(q.sc) >= 0 ? q.sc : "interieur",
      source: SOURCES.indexOf(q.s) > 0 ? q.s : "wada",
      locked: q.c2 && parseHex(q.c2) ? 2 : q.k === "1" ? 1 : 0,
      lang: q.lg === "en" || q.lg === "fr" ? q.lg : null };
  }
  function hashOf(k) {
    var p = ["c=" + k.seed.slice(1)];
    if (k.seed2) p.push("c2=" + k.seed2.slice(1));
    else if (k.locked === 1) p.push("k=1");
    if (k.n) p.push("n=" + k.n);
    if (k.n && k.order) p.push("o=" + k.order.join("."));
    if (k.n && k.parts && cleanParts(k.parts)) p.push("p=" + k.parts.join("."));
    if (k.size) p.push("t=" + k.size);
    if (!k.substitute) p.push("ex=0");
    if (k.transpose) p.push("tr=1");
    if (k.scene && k.scene !== "interieur") p.push("sc=" + k.scene);
    if (k.source && k.source !== "wada") p.push("s=" + k.source);
    if (k.lang === "en") p.push("lg=en");
    return "#" + p.join("&");
  }
  // Deux liens désignent le même accord s'ils ne diffèrent que par la scène, le filtre ou la langue.
  // Section visée par un lien : « #metier » seul, ou « go=metier » ajouté aux réglages. Séparée des données de l'accord (keyOf l'ignore).
  function sectionOf(hash, ids) {
    var h = String(hash || "").replace(/^#/, ""), m = /^([A-Za-z][A-Za-z0-9-]*)$/.exec(h) || /(?:^|&)go=([A-Za-z][A-Za-z0-9-]*)(?:&|$)/.exec(h);
    return m && (ids || []).indexOf(m[1]) >= 0 ? m[1] : null;
  }
  function withSection(hash, id) { return id ? hash + "&go=" + id : hash; }
  function keyOf(hash) { var k = readHash(hash); return k ? [k.source, k.seed, k.seed2 || "", k.n, (k.order || []).join("."), k.transpose ? 1 : 0, k.substitute ? 1 : 0].join("|") : hash; }
  // Import de projet : ne garder que des données vérifiées (liens relus et resérialisés, hex valides, textes bornés).
  function cleanItems(arr) {
    return (Array.isArray(arr) ? arr : []).map(function (it) {
      var k = it && typeof it.hash === "string" ? readHash(it.hash) : null; if (!k || !k.n) return null;
      var colors = Array.isArray(it.colors) ? it.colors.map(function (c) { return typeof c === "string" ? parseHex(c) : null; }) : [];
      if (colors.length < 2 || colors.length > 4 || colors.indexOf(null) >= 0) return null;
      k.lang = null;
      return { hash: hashOf(k), n: k.n, source: k.source, colors: colors, note: typeof it.note === "string" ? it.note.slice(0, 160) : "", added: typeof it.added === "string" ? it.added.slice(0, 40) : "",
        piste: ["A", "B", "C"].indexOf(it.piste) >= 0 ? it.piste : "", status: ["propose", "valide", "refuse"].indexOf(it.status) >= 0 ? it.status : "",
        statusDate: str(it.statusDate, 40), intent: str(it.intent, 1500) };
    }).filter(Boolean);
  }
  // Données compactes de wada-data.js ("d94d99ffffff") → tableaux de hex.
  function unpack(list) { return list.map(function (s) { var o = []; for (var i = 0; i < s.length; i += 6) o.push("#" + s.slice(i, i + 6)); return o; }); }

  return {
    rgb: rgb, toHex: toHex, lin: lin, delin: delin, labFromRgb: labFromRgb, lab: lab, linFromLab: linFromLab, lch: lch, fromLch: fromLch,
    dist: dist, lum: lum, contrast: contrast, ratioText: ratioText, textUse: textUse, readableOn: readableOn, towards: towards, shade: shade, parseHex: parseHex,
    nameOf: nameOf, hslOf: hslOf, cmykOf: cmykOf, lrvOf: lrvOf, values: values,
    PROPS: PROPS, cleanParts: cleanParts, partsOf: partsOf, setPart: setPart, sameParts: sameParts, rolesOf: rolesOf, slugsOf: slugsOf, fid: fid, createSearch: createSearch, build: build, kindOf: kindOf,
    simulate: simulate, confusions: confusions, CVD_TYPES: Object.keys(CVD),
    aseBytes: aseBytes, metaOf: metaOf, tokensText: tokensText, tailwindText: tailwindText, gplText: gplText,
    whyOf: whyOf, RULES: RULES, ruleCombos: ruleCombos, RULES2: RULES2, ruleCombos2: ruleCombos2, JOBS: JOBS, JOB_IDS: JOB_IDS, FAMILIES: FAMILIES, jobChecks: jobChecks,
    SCALE_STEPS: SCALE_STEPS, scaleOf: scaleOf, scaleText: scaleText, recolorLab: recolorLab, intentFacts: intentFacts,
    cleanProposal: cleanProposal, cleanResponse: cleanResponse, packLink: packLink, unpackLink: unpackLink,
    harmonyOf: harmonyOf, tempOf: tempOf, opticalMix: opticalMix, cmykRisk: cmykRisk, videoUnsafe: videoUnsafe,
    SCENES: SCENES, SOURCES: SOURCES, readHash: readHash, hashOf: hashOf, keyOf: keyOf, sectionOf: sectionOf, withSection: withSection, cleanItems: cleanItems, unpack: unpack
  };
});
