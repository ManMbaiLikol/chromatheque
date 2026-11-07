/* Accords Wada — fonctions pures : couleur, valeurs, recherche Wada, simulations, exports, liens.
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
    return { n: r.n, wada: r.colors, d: r.d, d1: r.d1, d2: r.d2, two: two, fid: fid(r.d), match: match, colors: head.concat(others) };
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
  function tokensText(n, items, lang) {
    var T = tx(lang), g = { $description: "Sanzo Wada " + T.num + n + " — " + items.map(function (it) { return it.pct; }).join("/") + " (" + T.conv + "). " + T.hex };
    items.forEach(function (it) { g[it.slug] = { $type: "color", $value: it.hex, $description: it.role + " · " + it.pct + " % · " + it.name }; });
    var root = {}; root["wada-" + n] = g;
    return JSON.stringify(root, null, 2) + "\n";
  }
  function tailwindText(n, items, lang) {
    var T = tx(lang);
    return "/* Sanzo Wada " + T.num + n + " — " + items.map(function (it) { return it.pct; }).join("/") + " */\n" +
      "/* " + T.tw4 + " bg-wada-" + items[0].slug + ", text-wada-… */\n" +
      "@theme {\n" + items.map(function (it) { return "  --color-wada-" + it.slug + ": " + it.hex + ";"; }).join("\n") + "\n}\n\n" +
      "/* " + T.tw3 + "\n   { wada: { " + items.map(function (it) { return it.slug + ": '" + it.hex + "'"; }).join(", ") + " } } */\n";
  }
  function gplText(n, items, lang) {
    var pad = function (v) { return ("  " + v).slice(-3); };
    return "GIMP Palette\nName: Sanzo Wada " + tx(lang).num + n + "\nColumns: " + items.length + "\n#\n" +
      items.map(function (it) { var p = rgb(it.hex); return pad(p[0]) + " " + pad(p[1]) + " " + pad(p[2]) + "\t" + it.role + " (" + it.pct + " %) " + it.hex.toUpperCase(); }).join("\n") + "\n";
  }

  /* ---------- lien partageable : l'état tient dans le hash ----------
     #c=1448c8&c2=e8b04a&n=55&o=1.0.2&t=3&ex=0&tr=1&sc=mode&lg=en — format à garder rétrocompatible. */
  var SCENES = ["interieur", "mode", "graphisme"];
  function readHash(h) {
    var q = {};
    String(h || "").replace(/^#/, "").split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) { try { q[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); } catch (e) {} } });
    var c = q.c ? parseHex(q.c) : null; if (!c) return null;
    return { seed: c, seed2: q.c2 ? parseHex(q.c2) : null, n: Math.max(0, Math.min(348, parseInt(q.n, 10) || 0)),
      order: q.o ? q.o.split(".").map(Number) : null, size: [2, 3, 4].indexOf(+q.t) >= 0 ? +q.t : 0,
      substitute: q.ex !== "0", transpose: q.tr === "1", scene: SCENES.indexOf(q.sc) >= 0 ? q.sc : "interieur",
      lang: q.lg === "en" || q.lg === "fr" ? q.lg : null };
  }
  function hashOf(k) {
    var p = ["c=" + k.seed.slice(1)];
    if (k.seed2) p.push("c2=" + k.seed2.slice(1));
    if (k.n) p.push("n=" + k.n);
    if (k.n && k.order) p.push("o=" + k.order.join("."));
    if (k.size) p.push("t=" + k.size);
    if (!k.substitute) p.push("ex=0");
    if (k.transpose) p.push("tr=1");
    if (k.scene && k.scene !== "interieur") p.push("sc=" + k.scene);
    if (k.lang === "en") p.push("lg=en");
    return "#" + p.join("&");
  }
  // Deux liens désignent le même accord s'ils ne diffèrent que par la scène, le filtre ou la langue.
  function keyOf(hash) { var k = readHash(hash); return k ? [k.seed, k.seed2 || "", k.n, (k.order || []).join("."), k.transpose ? 1 : 0, k.substitute ? 1 : 0].join("|") : hash; }
  // Import de projet : ne garder que des données vérifiées (liens relus et resérialisés, hex valides, textes bornés).
  function cleanItems(arr) {
    return (Array.isArray(arr) ? arr : []).map(function (it) {
      var k = it && typeof it.hash === "string" ? readHash(it.hash) : null; if (!k || !k.n) return null;
      var colors = Array.isArray(it.colors) ? it.colors.map(function (c) { return typeof c === "string" ? parseHex(c) : null; }) : [];
      if (colors.length < 2 || colors.length > 4 || colors.indexOf(null) >= 0) return null;
      k.lang = null;
      return { hash: hashOf(k), n: k.n, colors: colors, note: typeof it.note === "string" ? it.note.slice(0, 160) : "", added: typeof it.added === "string" ? it.added.slice(0, 40) : "" };
    }).filter(Boolean);
  }
  // Données compactes de wada-data.js ("d94d99ffffff") → tableaux de hex.
  function unpack(list) { return list.map(function (s) { var o = []; for (var i = 0; i < s.length; i += 6) o.push("#" + s.slice(i, i + 6)); return o; }); }

  return {
    rgb: rgb, toHex: toHex, lin: lin, delin: delin, labFromRgb: labFromRgb, lab: lab, linFromLab: linFromLab, lch: lch, fromLch: fromLch,
    dist: dist, lum: lum, contrast: contrast, readableOn: readableOn, towards: towards, shade: shade, parseHex: parseHex,
    nameOf: nameOf, hslOf: hslOf, cmykOf: cmykOf, lrvOf: lrvOf, values: values,
    PROPS: PROPS, rolesOf: rolesOf, slugsOf: slugsOf, fid: fid, createSearch: createSearch, build: build,
    simulate: simulate, confusions: confusions, CVD_TYPES: Object.keys(CVD),
    aseBytes: aseBytes, tokensText: tokensText, tailwindText: tailwindText, gplText: gplText,
    SCENES: SCENES, readHash: readHash, hashOf: hashOf, keyOf: keyOf, cleanItems: cleanItems, unpack: unpack
  };
});
