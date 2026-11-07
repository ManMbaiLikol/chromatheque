(function () {
  "use strict";
  var WADA = window.WADA_DATA.map(function (s) { var o = []; for (var i = 0; i < s.length; i += 6) o.push("#" + s.slice(i, i + 6)); return o; });

  /* ---------- couleur ---------- */
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
  /* Valeurs pour les pros. CMJN : conversion naïve, sans profil ICC. LRV : luminance relative Y (D65) × 100,
     estimée depuis le sRGB de l'écran. Les deux sont des estimations, à présenter comme telles. */
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
  function nameOf(hex) {
    var l = lch(hex), L = l[0], C = l[1], H = l[2];
    if (C < 0.03) return L > 0.92 ? "blanc" : L < 0.25 ? "noir" : L > 0.7 ? "gris clair" : L < 0.45 ? "gris foncé" : "gris";
    var hues = [[20, "rose"], [35, "rouge"], [60, "orange"], [85, "ocre"], [105, "jaune"], [130, "vert-jaune"], [165, "vert"], [195, "vert d'eau"], [230, "bleu-vert"], [265, "bleu"], [290, "bleu violet"], [320, "violet"], [350, "magenta"], [361, "rose"]];
    var n = hues.find(function (h) { return H < h[0]; })[1];
    if (n === "orange" && L < 0.55) n = "brun"; if (n === "ocre" && L < 0.5) n = "brun olive"; if (n === "jaune" && L < 0.6) n = "olive"; if (n === "rouge" && L < 0.4) n = "bordeaux";
    return n + (L > 0.82 ? " pâle" : L < 0.38 && n.indexOf("brun") < 0 && n !== "bordeaux" ? " profond" : C < 0.08 ? " grisé" : "");
  }

  /* ---------- recherche Wada ---------- */
  var LAB = WADA.map(function (c) { return c.map(lab); });
  /* Avec seed2 : chaque couleur prend une case différente de l'accord ; l'écart retenu est le pire des deux
     (une seule couleur loin suffit à rendre l'accord « proche » ou « libre »), départagé par la somme. */
  function search(seed, size, seed2) {
    var s = lab(seed), s2 = seed2 ? lab(seed2) : null, res = [];
    WADA.forEach(function (combo, i) {
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
    var pref = { 3: 0, 4: 1, 2: 2 };
    res.sort(function (a, b) { return (a.d - b.d) || (a.sum - b.sum) || (pref[a.colors.length] - pref[b.colors.length]) || (a.n - b.n); });
    return res;
  }
  function fid(d) { return d <= 0.06 ? "fidèle" : d <= 0.12 ? "proche" : "libre"; }
  function build(r, seed, opts) {
    var two = r.idx2 != null, match = r.colors[r.idx], match2 = two ? r.colors[r.idx2] : null, dH = lch(seed)[2] - lch(match)[2], useSeed = opts.substitute;
    var others = r.colors.filter(function (_, j) { return j !== r.idx && j !== r.idx2; }).map(function (c) { if (!opts.transpose) return c; var l = lch(c); return l[1] < 0.03 ? c : fromLch(l[0], l[1], (l[2] + dH + 360) % 360); });
    var head = [useSeed ? seed : match]; if (two) head.push(useSeed ? opts.seed2 : match2);
    return { n: r.n, wada: r.colors, d: r.d, d1: r.d1, d2: r.d2, two: two, fid: fid(r.d), match: match, colors: head.concat(others) };
  }
  function parseHex(v) {
    v = v.trim(); if (v[0] !== "#") v = "#" + v;
    if (/^#[0-9a-f]{3}$/i.test(v)) v = "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null;
  }
  var PROPS = { 2: [65, 35], 3: [60, 30, 10], 4: [50, 25, 15, 10] };
  function rolesOf(n) { return n === 2 ? ["Dominante", "Contraste"] : n === 3 ? ["Dominante", "Secondaire", "Accent"] : ["Dominante", "Secondaire", "Complément", "Accent"]; }
  var SCENES = ["interieur", "mode", "graphisme"];

  /* ---------- lien partageable : l'état tient dans le hash ----------
     #c=1448c8&c2=e8b04a&n=55&o=1.0.2&t=3&ex=0&tr=1&sc=mode */
  function readHash(h) {
    var q = {};
    (h || "").replace(/^#/, "").split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) { try { q[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); } catch (e) {} } });
    var c = q.c ? parseHex(q.c) : null; if (!c) return null;
    return { seed: c, seed2: q.c2 ? parseHex(q.c2) : null, n: Math.max(0, Math.min(348, parseInt(q.n, 10) || 0)),
      order: q.o ? q.o.split(".").map(Number) : null, size: [2, 3, 4].indexOf(+q.t) >= 0 ? +q.t : 0,
      substitute: q.ex !== "0", transpose: q.tr === "1", scene: SCENES.indexOf(q.sc) >= 0 ? q.sc : "interieur" };
  }

  /* ---------- état ---------- */
  var state = { seed: "#1448c8", seed2: null, multi: false, target: 2, size: 0, substitute: true, transpose: false, sel: 0, order: null, scene: "interieur", dictSize: 0, list: [], wantN: 0, wantOrder: null };
  try {
    var saved = JSON.parse(localStorage.getItem("accords-wada") || "null");
    if (saved && /^#[0-9a-f]{6}$/i.test(saved.seed)) { state.seed = saved.seed.toLowerCase(); state.size = saved.size || 0; state.scene = saved.scene || "interieur"; }
    if (saved && /^#[0-9a-f]{6}$/i.test(saved.seed2)) { state.seed2 = saved.seed2.toLowerCase(); state.multi = !!saved.multi; }
  } catch (e) {}
  function save() { try { localStorage.setItem("accords-wada", JSON.stringify({ seed: state.seed, seed2: state.seed2, multi: state.multi, size: state.size, scene: state.scene })); } catch (e) {} }
  // Un lien partagé passe avant la mémoire du navigateur.
  function takeLink(k) {
    state.seed = k.seed; state.multi = !!k.seed2; if (k.seed2) state.seed2 = k.seed2;
    state.size = k.size; state.substitute = k.substitute; state.transpose = k.transpose; state.scene = k.scene;
    state.wantN = k.n; state.wantOrder = k.order;
  }
  var link = readHash(location.hash); if (link) takeLink(link);
  function shareHash() {
    var cur = current(), p = ["c=" + state.seed.slice(1)];
    if (state.multi && state.seed2) p.push("c2=" + state.seed2.slice(1));
    if (cur) p.push("n=" + cur.a.n);
    if (cur && state.order) p.push("o=" + state.order.join("."));
    if (state.size) p.push("t=" + state.size);
    if (!state.substitute) p.push("ex=0");
    if (state.transpose) p.push("tr=1");
    if (state.scene !== "interieur") p.push("sc=" + state.scene);
    return "#" + p.join("&");
  }
  function shareUrl() { return location.href.split("#")[0] + shareHash(); }
  function updateLink() { try { history.replaceState(null, "", shareHash()); } catch (e) {} }

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, attrs, kids) { var e = document.createElement(tag); if (attrs) for (var k in attrs) { if (k === "style") e.style.cssText = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } (kids || []).forEach(function (c) { e.appendChild(c); }); return e; }

  function setSeed(hex, keepImageChip) {
    hex = hex.toLowerCase(); state.seed = hex; state.sel = 0; state.order = null;
    $("picker").value = hex; $("hex").value = hex.toUpperCase(); $("hex").setAttribute("aria-invalid", "false");
    if (!keepImageChip) document.querySelectorAll(".chip.on").forEach(function (c) { c.classList.remove("on"); });
    var root = document.documentElement.style, l = lch(hex);
    root.setProperty("--accent-l", towards(hex, "#f1f1ef", 3));
    root.setProperty("--accent-d", towards(hex, "#161615", 3));
    $("seedname").textContent = nameOf(hex);
    save(); refresh();
  }
  function showSeed2() {
    var hex = state.seed2;
    $("picker2").value = hex; $("hex2").value = hex.toUpperCase(); $("hex2").setAttribute("aria-invalid", "false");
    $("seedname2").textContent = nameOf(hex);
  }
  function setSeed2(hex, keepImageChip) {
    state.seed2 = hex.toLowerCase(); state.sel = 0; state.order = null; showSeed2();
    if (!keepImageChip) document.querySelectorAll(".chip.on2").forEach(function (c) { c.classList.remove("on2"); });
    save(); if (state.multi) refresh();
  }
  function setPressed(id, v) { $(id).querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === String(v))); }); }
  function applyMulti() {
    $("multi").checked = state.multi; $("seed2").hidden = !state.multi; $("targetBox").hidden = !state.multi;
    state.target = state.multi ? 2 : 1; setPressed("targetSeg", state.target);
  }

  function refresh() {
    var two = state.multi && state.seed2;
    var all = search(state.seed, state.size, two ? state.seed2 : null);
    state.list = all.slice(0, 12).map(function (r) { return build(r, state.seed, state); });
    if (state.wantN) {
      // Accord demandé par un lien ou par le dictionnaire : on l'ajoute s'il n'est pas dans les 12 premiers.
      var j = state.list.findIndex(function (a) { return a.n === state.wantN; });
      if (j < 0) { var r = all.find(function (x) { return x.n === state.wantN; }); if (r) { state.list.push(build(r, state.seed, state)); j = state.list.length - 1; } }
      if (j >= 0) {
        state.sel = j; var o = state.wantOrder, len = state.list[j].colors.length;
        state.order = o && o.length === len && o.slice().sort().join() === Object.keys(o).join() ? o : null;
      }
      state.wantN = 0; state.wantOrder = null;
    }
    var exact = all.filter(function (r) { return r.d <= 0.06; }).length, s = exact > 1 ? "s" : "";
    $("resultHint").textContent = two
      ? (exact ? exact + " combinaison" + s + " fidèle" + s + " contien" + (exact > 1 ? "nent" : "t") + " tes deux couleurs" : "Aucune combinaison ne contient fidèlement les deux : les plus proches sont proposées")
      : (exact ? exact + " combinaison" + s + " fidèle" + s + " dans le dictionnaire" : "Aucune combinaison fidèle : les plus proches sont proposées");
    var ul = $("cards"); ul.textContent = "";
    state.list.forEach(function (a, i) {
      var parts = PROPS[a.colors.length];
      var sw = el("span", { class: "sw" }, a.colors.map(function (c, j) { return el("i", { style: "background:" + c + ";flex:" + parts[j] }); }));
      var b = el("button", { type: "button", class: "card", "aria-pressed": String(i === state.sel), "aria-label": "Combinaison n° " + a.n + ", " + a.fid }, [
        sw,
        el("span", { class: "meta" }, [el("span", { class: "num", text: "n° " + a.n }), el("span", { class: "tag " + a.fid.replace("è", "e"), text: a.fid })]),
        el("span", { class: "hexes", text: a.colors.join("  ").toUpperCase() })
      ]);
      b.addEventListener("click", function () { state.sel = i; state.order = null; refreshCards(); renderDetail(); });
      ul.appendChild(el("li", null, [b]));
    });
    var hs = $("headStrip"); hs.textContent = ""; (state.list[0] ? state.list[0].colors : [state.seed]).forEach(function (c) { hs.appendChild(el("i", { style: "background:" + c })); });
    renderDetail();
  }
  function refreshCards() { document.querySelectorAll(".card").forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === state.sel)); }); }

  function current() {
    var a = state.list[state.sel]; if (!a) return null;
    var order = state.order || a.colors.map(function (_, i) { return i; });
    return { a: a, colors: order.map(function (i) { return a.colors[i]; }), order: order };
  }

  function renderDetail() {
    var cur = current(); if (!cur) return;
    var a = cur.a, cs = cur.colors, parts = PROPS[cs.length];
    $("detailLabel").textContent = "Sanzo Wada n° " + a.n + " · correspondance " + a.fid + (a.two ? " (écarts " + (a.d1 * 100).toFixed(1) + " et " + (a.d2 * 100).toFixed(1) + ")" : " (écart " + (a.d * 100).toFixed(1) + ")");
    $("detailTitle").textContent = cs.map(nameOf).join(" · ");
    var big = $("bigsw"); big.textContent = "";
    cs.forEach(function (c, i) { var t = readableOn(c); big.appendChild(el("div", { style: "background:" + c + ";color:" + t.c + ";flex:" + parts[i] }, [document.createTextNode(parts[i] + " %")])); });
    var roles = rolesOf(cs.length);
    var rows = $("rows"); rows.textContent = "";
    cs.forEach(function (c, i) {
      var lc = c.toLowerCase(), t = readableOn(c), mine = state.substitute && (lc === state.seed || (a.two && lc === state.seed2));
      var copy = el("button", { type: "button", class: "mini", text: "Copier" });
      copy.addEventListener("click", function () { doCopy(c.toUpperCase(), c.toUpperCase() + " copié"); });
      rows.appendChild(el("div", { class: "row" }, [
        el("span", { class: "dot", style: "background:" + c + ";color:" + t.c, title: "Contraste du texte " + t.r.toFixed(1) + ":1", text: "Aa" }),
        el("span", { class: "what" }, [el("b", { text: c.toUpperCase() }), document.createTextNode("  " + roles[i] + " · " + parts[i] + " %" + (mine ? " · ta couleur" : "")),
          el("small", { text: nameOf(c) + " · texte " + (t.c === "#ffffff" ? "blanc" : "noir") + " " + t.r.toFixed(1) + ":1" + (t.r < 4.5 ? " (titres seulement)" : "") })]),
        copy
      ]));
    });
    var tb = $("vals"); tb.textContent = "";
    cs.forEach(function (c, i) {
      var v = values(c);
      tb.appendChild(el("tr", null, [el("th", { scope: "row" }, [el("span", { class: "vdot", style: "background:" + c }), document.createTextNode(roles[i] + " " + parts[i] + " %")])]
        .concat([v.hex, v.rgb, v.hsl, v.oklch, v.cmjn, v.lrv].map(function (x) { return el("td", { text: x }); }))));
    });
    $("out").textContent = exportText("css");
    renderScene();
  }

  function exportText(kind) {
    var cur = current(), cs = cur.colors, parts = PROPS[cs.length], n = cur.a.n;
    if (kind === "hex") return cs.map(function (c) { return c.toUpperCase(); }).join(", ");
    if (kind === "prompt") return cs.length + " couleurs " + cs.join(", ") + " (Sanzo Wada n° " + n + ", proportions " + parts.join("/") + ")";
    if (kind === "link") return shareUrl();
    if (kind === "table") {
      var roles = rolesOf(cs.length);
      return ["Rôle", "%", "HEX", "RGB", "HSL", "OKLCH", "CMJN (approx.)", "LRV (approx.)", "Nom"].join("\t") + "\n" +
        cs.map(function (c, i) { var v = values(c); return [roles[i], parts[i], v.hex, v.rgb, v.hsl, v.oklch, v.cmjn, v.lrv, nameOf(c)].join("\t"); }).join("\n") +
        "\n\nSanzo Wada n° " + n + " · hex : cibles HexPot · CMJN sans profil ICC · LRV estimé depuis l'écran";
    }
    var names = cs.length === 2 ? ["dominante", "contraste"] : cs.length === 3 ? ["dominante", "secondaire", "accent"] : ["dominante", "secondaire", "complement", "accent"];
    return "/* Sanzo Wada n° " + n + " — " + parts.join("/") + " */\n:root {\n" + cs.map(function (c, i) { return "  --wada-" + names[i] + ": " + c + ";"; }).join("\n") + "\n}";
  }
  function doCopy(text, msg) {
    var t = $("toast");
    try {
      navigator.clipboard.writeText(text).then(function () { t.textContent = msg; }, function () { fallback(text); });
    } catch (e) { fallback(text); }
    function fallback() { var o = $("out"); o.textContent = text; var r = document.createRange(); r.selectNodeContents(o); var s = getSelection(); s.removeAllRanges(); s.addRange(r); t.textContent = "Texte sélectionné ci-dessous : copie-le avec Ctrl+C."; }
  }
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () { var k = b.getAttribute("data-copy"), txt = exportText(k); $("out").textContent = txt; doCopy(txt, { hex: "Valeurs hex copiées", css: "Variables CSS copiées", prompt: "Ligne de prompt copiée", table: "Tableau copié : colle-le dans un tableur.",
      link: location.protocol === "file:" ? "Lien copié. Il ne marchera chez ton client qu'une fois le site en ligne." : "Lien copié : ton client verra exactement cet accord." }[k]); });
  });
  $("rotate").addEventListener("click", function () { var cur = current(); if (!cur) return; var o = cur.order.slice(); o.push(o.shift()); state.order = o; $("toast").textContent = "Dominante : " + nameOf(cur.a.colors[o[0]]); renderDetail(); });

  /* ---------- mises en situation ---------- */
  function shade(hex, dL) { var l = lch(hex); return fromLch(Math.max(0, Math.min(1, l[0] + dL)), l[1], l[2]); }
  function sceneOf(scene, cs, n) {
    var A = cs[0], B = cs[1], C = cs[2] || cs[1], D = cs[3] || cs[2] || cs[0], svg, hint;
    if (scene === "interieur") {
      hint = "Mur dans la dominante, canapé en secondaire, coussins et objets en accent.";
      svg = '<svg viewBox="0 0 480 340" role="img" aria-label="Salon mis en couleur">' +
        '<rect width="480" height="250" fill="' + A + '"/>' +
        '<rect y="250" width="480" height="90" fill="' + shade(A, -0.22) + '"/>' +
        '<rect x="300" y="44" width="120" height="150" fill="' + shade(A, 0.12) + '"/><rect x="310" y="54" width="100" height="130" fill="' + D + '"/><circle cx="360" cy="110" r="30" fill="' + C + '"/>' +
        '<ellipse cx="200" cy="300" rx="190" ry="26" fill="' + D + '" opacity=".85"/>' +
        '<rect x="60" y="170" width="250" height="70" rx="10" fill="' + B + '"/><rect x="48" y="150" width="40" height="110" rx="10" fill="' + shade(B, -0.06) + '"/><rect x="282" y="150" width="40" height="110" rx="10" fill="' + shade(B, -0.06) + '"/>' +
        '<rect x="70" y="140" width="230" height="44" rx="10" fill="' + shade(B, 0.05) + '"/>' +
        '<rect x="96" y="124" width="54" height="44" rx="8" fill="' + C + '" transform="rotate(-8 123 146)"/><rect x="214" y="126" width="54" height="44" rx="8" fill="' + D + '" transform="rotate(7 241 148)"/>' +
        '<rect x="70" y="240" width="10" height="26" fill="' + shade(B, -0.25) + '"/><rect x="290" y="240" width="10" height="26" fill="' + shade(B, -0.25) + '"/>' +
        '<rect x="388" y="214" width="56" height="52" rx="4" fill="' + shade(A, -0.3) + '"/><path d="M406 214 q10 -60 0 -110 M416 214 q22 -50 30 -96 M412 214 q-20 -40 -34 -70" stroke="' + C + '" stroke-width="5" fill="none" stroke-linecap="round"/></svg>';
    } else if (scene === "mode") {
      hint = "Manteau dans la dominante, haut en secondaire, pantalon et accessoires en accent.";
      svg = '<svg viewBox="0 0 480 340" role="img" aria-label="Tenue mise en couleur">' +
        '<rect width="480" height="340" fill="#e4e3de"/><rect y="300" width="480" height="40" fill="#d6d5cf"/>' +
        '<path d="M180 70 L300 70 L330 210 L150 210 Z" fill="' + B + '"/>' +
        '<path d="M170 240 L310 240 L300 330 L250 330 L240 270 L230 330 L180 330 Z" fill="' + C + '"/>' +
        '<path d="M150 60 L210 54 L240 120 L270 54 L330 60 L360 300 L290 300 L280 210 L200 210 L190 300 L120 300 Z" fill="' + A + '"/>' +
        '<path d="M210 54 L240 120 L270 54 L262 48 L240 92 L218 48 Z" fill="' + shade(A, -0.12) + '"/>' +
        '<path d="M222 40 Q240 30 258 40 L256 60 Q240 70 224 60 Z" fill="' + D + '"/><path d="M226 58 L222 130 L236 128 Z" fill="' + D + '"/>' +
        '<rect x="368" y="200" width="70" height="56" rx="6" fill="' + D + '"/><path d="M382 200 Q403 168 424 200" stroke="' + D + '" stroke-width="6" fill="none"/>' +
        '<rect x="170" y="210" width="140" height="10" fill="' + shade(A, -0.2) + '"/></svg>';
    } else {
      hint = "Fond dans la dominante, formes en secondaire et accent, texte dans la couleur la plus lisible.";
      var t = readableOn(A).c, best = cs.slice(1).map(function (c) { return [c, contrast(c, A)]; }).sort(function (x, y) { return y[1] - x[1]; })[0];
      var title = best[1] >= 3 ? best[0] : t;
      svg = '<svg viewBox="0 0 480 340" role="img" aria-label="Affiche mise en couleur">' +
        '<rect width="480" height="340" fill="' + A + '"/>' +
        '<circle cx="360" cy="120" r="92" fill="' + B + '"/>' +
        '<rect x="300" y="160" width="150" height="150" fill="' + C + '" style="mix-blend-mode:normal"/>' +
        '<rect x="300" y="160" width="60" height="60" fill="' + D + '"/>' +
        '<text x="32" y="210" font-family="Shippori Mincho, Georgia, serif" font-weight="700" font-size="58" fill="' + title + '">配色</text>' +
        '<text x="32" y="252" font-family="Zen Kaku Gothic New, sans-serif" font-weight="700" font-size="22" fill="' + title + '">Accord n° ' + n + '</text>' +
        '<text x="32" y="300" font-family="IBM Plex Mono, monospace" font-size="12" fill="' + t + '">' + cs.join("  ").toUpperCase() + '</text></svg>';
    }
    return { svg: svg, hint: hint };
  }
  function renderScene() {
    var cur = current(), s = sceneOf(state.scene, cur.colors, cur.a.n);
    $("scene").innerHTML = s.svg; $("sceneHint").textContent = s.hint;
    updateLink();
  }

  /* ---------- planche client : A4 paysage, 300 dpi (dessinée en unités de 1754 × 1240, puis ×2) ---------- */
  var SHEET = { w: 1754, h: 1240, scale: 2, m: 72, bg: "#f4f4f2", ink: "#1b1b19", muted: "#5d5d58", line: "#d9d9d5" };
  var FONT = { display: '"Shippori Mincho", Georgia, serif', body: '"Zen Kaku Gothic New", "Segoe UI", sans-serif', mono: '"IBM Plex Mono", Consolas, monospace' };
  function svgImage(svg) {
    return new Promise(function (ok, ko) {
      var img = new Image(); img.onload = function () { ok(img); }; img.onerror = ko;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
    });
  }
  function wrapText(ctx, text, x, y, maxW, lh) {
    var words = text.split(" "), line = "";
    words.forEach(function (w) { var t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = t; });
    if (line) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }
  function fitText(ctx, text, maxW) { if (ctx.measureText(text).width <= maxW) return text; while (text.length > 4 && ctx.measureText(text + "…").width > maxW) text = text.slice(0, -1); return text + "…"; }
  function makeSheet() {
    var cur = current(), cs = cur.colors, a = cur.a, parts = PROPS[cs.length], roles = rolesOf(cs.length), sc = sceneOf(state.scene, cs, a.n), S = SHEET;
    var wanted = ["700 40px " + FONT.display, "400 16px " + FONT.body, "700 16px " + FONT.body, "400 14px " + FONT.mono];
    var fontsReady = document.fonts ? Promise.all(wanted.map(function (f) { return document.fonts.load(f).catch(function () {}); })) : Promise.resolve();
    return Promise.all([fontsReady, svgImage(sc.svg).catch(function () { return null; })]).then(function (res) {
      var img = res[1], cv = document.createElement("canvas"); cv.width = S.w * S.scale; cv.height = S.h * S.scale;
      var x = cv.getContext("2d"); x.scale(S.scale, S.scale); x.textBaseline = "top";
      x.fillStyle = S.bg; x.fillRect(0, 0, S.w, S.h);
      var M = S.m, LW = 900, RX = M + LW + 56, RW = S.w - M - RX;

      x.fillStyle = S.muted; x.font = "700 14px " + FONT.body; if ("letterSpacing" in x) x.letterSpacing = "2px";
      x.fillText(("Accords Wada · d'après Sanzo Wada, 1933 · n° " + a.n + " · correspondance " + a.fid + (state.transpose ? " · teintes transposées (interprétation, plus du Wada strict)" : "")).toUpperCase(), M, M);
      if ("letterSpacing" in x) x.letterSpacing = "0px";
      var title = cs.map(nameOf).join(" · "), size = 54;
      do { x.font = "700 " + size + "px " + FONT.display; size -= 2; } while (x.measureText(title).width > S.w - 2 * M && size > 26);
      x.fillStyle = S.ink; x.fillText(title, M, M + 36);

      // Bande de proportions
      var top = 220, bandH = 380, bx = M;
      cs.forEach(function (c, i) {
        var w = LW * parts[i] / 100, t = readableOn(c);
        x.fillStyle = c; x.fillRect(bx, top, w, bandH);
        x.fillStyle = t.c; x.font = "500 16px " + FONT.mono; x.fillText(parts[i] + " %", bx + 14, top + bandH - 32);
        bx += w;
      });
      x.strokeStyle = S.line; x.lineWidth = 1; x.strokeRect(M + 0.5, top + 0.5, LW - 1, bandH - 1);

      // Fiches couleur
      var colW = LW / cs.length, y0 = top + bandH + 36;
      cs.forEach(function (c, i) {
        var cx = M + colW * i, v = values(c), y = y0, maxW = colW - 20;
        x.fillStyle = c; x.fillRect(cx, y, 56, 56); x.strokeStyle = S.line; x.strokeRect(cx + 0.5, y + 0.5, 55, 55);
        y += 74;
        x.fillStyle = S.ink; x.font = "700 18px " + FONT.body; x.fillText(fitText(x, roles[i] + " · " + parts[i] + " %", maxW), cx, y); y += 26;
        x.fillStyle = S.muted; x.font = "400 16px " + FONT.body; x.fillText(fitText(x, nameOf(c), maxW), cx, y); y += 34;
        [["HEX", v.hex], ["RGB", v.rgb], ["HSL", v.hsl], ["OKLCH", v.oklch], ["CMJN ≈", v.cmjn], ["LRV ≈", v.lrv]].forEach(function (r) {
          x.font = "400 13px " + FONT.mono; x.fillStyle = S.muted; x.fillText(r[0], cx, y);
          x.font = "400 17px " + FONT.mono; x.fillStyle = S.ink; x.fillText(fitText(x, r[1], maxW), cx, y + 17); y += 46;
        });
      });

      // Mise en situation
      var sh = RW * 340 / 480;
      if (img) x.drawImage(img, RX, top, RW, sh);
      x.strokeStyle = S.line; x.strokeRect(RX + 0.5, top + 0.5, RW - 1, sh - 1);
      x.fillStyle = S.muted; x.font = "400 15px " + FONT.body;
      var hy = wrapText(x, sc.hint, RX, top + sh + 16, RW, 22);
      var rd = readableOn(cs[0]);
      wrapText(x, "Texte lisible sur la dominante : " + (rd.c === "#ffffff" ? "blanc" : "noir") + " " + rd.r.toFixed(1) + ":1" + (rd.r < 4.5 ? " (titres seulement)" : "") + ".", RX, hy + 8, RW, 22);

      // Pied de planche
      var fy = S.h - M - 58;
      x.fillStyle = S.line; x.fillRect(M, fy, S.w - 2 * M, 1);
      x.fillStyle = S.muted; x.font = "400 13px " + FONT.body;
      x.fillText("Hex : cibles issues de la conversion HexPot, à vérifier sur le support réel. CMJN sans profil ICC et LRV estimé depuis l'écran : à confirmer sur nuancier. Proportions : convention MML.", M, fy + 14);
      x.font = "400 12px " + FONT.mono;
      var date = new Date().toLocaleDateString("fr-FR"), right = "Accords Wada — Manso Olivier · MAN MBAÏ LIKOL", rw = x.measureText(right).width;
      x.fillText(fitText(x, "Planche du " + date + " · " + shareUrl(), S.w - 2 * M - rw - 40), M, fy + 38);
      x.fillText(right, S.w - M - rw, fy + 38);
      return cv;
    });
  }
  $("sheetPng").addEventListener("click", function () {
    var t = $("toast"), n = current().a.n; t.textContent = "Préparation de la planche…";
    makeSheet().then(function (cv) {
      cv.toBlob(function (b) {
        if (!b) { t.textContent = "Impossible de générer la planche dans ce navigateur."; return; }
        var u = URL.createObjectURL(b), l = el("a", { href: u, download: "accord-wada-" + n + ".png" });
        document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        t.textContent = "Planche PNG téléchargée (A4 paysage, 300 dpi).";
      }, "image/png");
    }).catch(function () { t.textContent = "Impossible de générer la planche dans ce navigateur."; });
  });
  $("sheetPrint").addEventListener("click", function () {
    var t = $("toast"); t.textContent = "Préparation de la planche…";
    makeSheet().then(function (cv) {
      var img = $("printSheet");
      img.onload = function () { document.documentElement.classList.add("has-sheet"); t.textContent = "Choisis « Enregistrer au format PDF » pour obtenir un PDF."; window.print(); };
      img.src = cv.toDataURL("image/png");
    }).catch(function () { t.textContent = "Impossible de préparer l'impression dans ce navigateur."; });
  });
  window.addEventListener("afterprint", function () { document.documentElement.classList.remove("has-sheet"); });
  function seg(id, key, cb) {
    var g = $(id);
    g.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(String(state[key]) === b.dataset.v));
      b.addEventListener("click", function () {
        var v = b.dataset.v; state[key] = isNaN(+v) ? v : +v;
        g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        save(); cb();
      });
    });
  }
  seg("sizeSeg", "size", function () { state.sel = 0; state.order = null; refresh(); });
  seg("sceneSeg", "scene", renderScene);
  seg("dictSeg", "dictSize", renderDict);
  seg("targetSeg", "target", function () {});

  /* ---------- saisie couleur ---------- */
  $("picker").addEventListener("input", function (e) { setSeed(e.target.value); });
  $("hex").addEventListener("input", function (e) { var v = parseHex(e.target.value); if (v) setSeed(v); else e.target.setAttribute("aria-invalid", "true"); });
  $("picker2").addEventListener("input", function (e) { setSeed2(e.target.value); });
  $("hex2").addEventListener("input", function (e) { var v = parseHex(e.target.value); if (v) setSeed2(v); else e.target.setAttribute("aria-invalid", "true"); });
  $("multi").addEventListener("change", function (e) {
    state.multi = e.target.checked; state.sel = 0; state.order = null;
    document.querySelectorAll(".chip.on2").forEach(function (c) { c.classList.remove("on2"); });
    if (state.multi) {
      // Image chargée : sa 2e couleur marquante ; sinon la première compagne Wada de l'accord en tête.
      var second = imgClusters.length ? secondCluster(imgClusters.lead) : null;
      if (second) { state.seed2 = second.hex; markChip(second, "on2"); }
      else if (!state.seed2) state.seed2 = state.list[0] ? state.list[0].wada.filter(function (c) { return c !== state.list[0].match; })[0] : "#e8dcc0";
      showSeed2();
    }
    applyMulti(); renderDict(); save(); refresh();
  });
  $("substitute").addEventListener("change", function (e) { state.substitute = e.target.checked; refresh(); });
  $("transpose").addEventListener("change", function (e) { state.transpose = e.target.checked; refresh(); });

  /* ---------- image : extraction des couleurs (k-moyennes en OKLab) ---------- */
  var canvas = $("canvas"), ctx = canvas.getContext("2d", { willReadFrequently: true }), imgClusters = [];
  function pickFromImage(hex, chip) {
    if (state.multi && state.target === 2) { setSeed2(hex); if (chip) chip.classList.add("on2"); }
    else { setSeed(hex); if (chip) chip.classList.add("on"); }
  }
  function markChip(cluster, cls) { var i = imgClusters.indexOf(cluster), ch = $("chips").children[i]; if (ch) ch.classList.add(cls); }
  function secondCluster(lead) {
    var L = lab(lead.hex), others = imgClusters.filter(function (c) { return c !== lead; });
    return others.find(function (c) { return dist(lab(c.hex), L) > 0.1; }) || others[0] || null;
  }
  function loadFile(f) {
    if (!f || !/^image\//.test(f.type)) { $("toast").textContent = "Ce fichier n'est pas une image. Essaie un JPG, PNG ou WebP."; return; }
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var max = 640, s = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * s); canvas.height = Math.round(img.height * s);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
      $("imgbox").hidden = false; extract();
    };
    img.onerror = function () { $("toast").textContent = "Impossible de lire cette image."; };
    img.src = url;
  }
  function extract() {
    var w = canvas.width, h = canvas.height, step = Math.max(1, Math.floor(Math.sqrt(w * h / 6000))), data = ctx.getImageData(0, 0, w, h).data, pts = [];
    for (var y = 0; y < h; y += step) for (var x = 0; x < w; x += step) { var i = (y * w + x) * 4; if (data[i + 3] > 128) pts.push(labFromRgb([data[i], data[i + 1], data[i + 2]])); }
    var k = 6, cent = [pts[Math.floor(pts.length / 2)]];
    while (cent.length < k) { var far = 0, pick = pts[0]; for (var p = 0; p < pts.length; p += 3) { var dm = Math.min.apply(null, cent.map(function (c) { return dist(c, pts[p]); })); if (dm > far) { far = dm; pick = pts[p]; } } cent.push(pick); }
    var assign = new Array(pts.length);
    for (var it = 0; it < 10; it++) {
      var sums = cent.map(function () { return [0, 0, 0, 0]; });
      pts.forEach(function (pt, n) { var b = 0, bd = Infinity; cent.forEach(function (c, j) { var d = dist(c, pt); if (d < bd) { bd = d; b = j; } }); assign[n] = b; var s = sums[b]; s[0] += pt[0]; s[1] += pt[1]; s[2] += pt[2]; s[3]++; });
      cent = cent.map(function (c, j) { var s = sums[j]; return s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : c; });
      var counts = sums.map(function (s) { return s[3]; });
    }
    var clusters = cent.map(function (c, j) { return { hex: toHex(linFromLab(c).map(delin)), n: counts[j], C: Math.hypot(c[1], c[2]) }; }).filter(function (c) { return c.n > 0; }).sort(function (a, b) { return b.n - a.n; });
    var chips = $("chips"); chips.textContent = "";
    clusters.forEach(function (c) {
      var b = el("button", { type: "button", class: "chip", style: "background:" + c.hex, title: c.hex.toUpperCase() + " · " + Math.round(c.n / pts.length * 100) + " % de l'image", "aria-label": nameOf(c.hex) + " " + c.hex.toUpperCase() });
      b.addEventListener("click", function () { pickFromImage(c.hex, b); });
      chips.appendChild(b);
    });
    var lead = clusters.find(function (c) { return c.C > 0.04; }) || clusters[0];
    imgClusters = clusters; imgClusters.lead = lead;
    var second = state.multi ? secondCluster(lead) : null;
    if (second) { state.seed2 = second.hex; showSeed2(); save(); markChip(second, "on2"); }
    setSeed(lead.hex); markChip(lead, "on");
    $("toast").textContent = second
      ? "Couleurs de l'image : " + nameOf(lead.hex) + " et " + nameOf(second.hex) + ". Clique une pastille pour changer la couleur 1 ou 2."
      : "Couleur principale de l'image : " + nameOf(lead.hex) + ". Clique une autre pastille pour changer.";
  }
  canvas.addEventListener("click", function (e) {
    var r = canvas.getBoundingClientRect(), x = Math.round((e.clientX - r.left) / r.width * canvas.width), y = Math.round((e.clientY - r.top) / r.height * canvas.height);
    var d = ctx.getImageData(Math.max(0, x - 2), Math.max(0, y - 2), 5, 5).data, s = [0, 0, 0], n = 0;
    for (var i = 0; i < d.length; i += 4) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; n++; }
    pickFromImage(toHex(s.map(function (v) { return v / n; })));
  });
  $("file").addEventListener("change", function (e) { loadFile(e.target.files[0]); e.target.value = ""; });
  var drop = $("drop");
  ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { loadFile(e.dataTransfer.files[0]); });
  document.addEventListener("paste", function (e) { var it = Array.prototype.find.call(e.clipboardData.items || [], function (i) { return i.type.indexOf("image") === 0; }); if (it) loadFile(it.getAsFile()); });

  /* ---------- dictionnaire ---------- */
  function renderDict() {
    var g = $("dictGrid"); g.textContent = "";
    WADA.forEach(function (c, i) {
      if (state.dictSize && c.length !== state.dictSize) return;
      var b = el("button", { type: "button", "aria-label": "Combinaison n° " + (i + 1) + " : " + c.join(", ") + (state.multi ? ". Utiliser ses deux premières couleurs comme départ." : ". Utiliser sa première couleur comme départ.") }, [
        el("span", { class: "sw" }, c.map(function (x) { return el("i", { style: "background:" + x }); })), el("span", { text: "n° " + (i + 1) })]);
      b.addEventListener("click", function () {
        if (state.multi) { state.seed2 = c[1]; showSeed2(); document.querySelectorAll(".chip.on2").forEach(function (x) { x.classList.remove("on2"); }); }
        state.wantN = i + 1;
        setSeed(c[0]);
        $("detail").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
      g.appendChild(el("li", null, [b]));
    });
  }

  function start() {
    $("substitute").checked = state.substitute; $("transpose").checked = state.transpose;
    setPressed("sizeSeg", state.size); setPressed("sceneSeg", state.scene);
    if (state.seed2) showSeed2();
    applyMulti();
    renderDict();
    setSeed(state.seed);  // refresh() sélectionne l'accord demandé par le lien (state.wantN)
  }
  // Lien collé dans un onglet déjà ouvert
  window.addEventListener("hashchange", function () {
    if (location.hash === shareHash()) return;
    var k = readHash(location.hash); if (!k) return;
    takeLink(k); document.querySelectorAll(".chip.on, .chip.on2").forEach(function (c) { c.classList.remove("on", "on2"); }); start();
  });
  start();
})();
