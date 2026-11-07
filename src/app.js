/* Accords Wada — interface. Les fonctions pures (couleur, recherche, exports, liens) sont dans core.js,
   les textes FR/EN dans i18n.js. Ce fichier gère l'état, le DOM, l'image, la planche, les projets et la PWA. */
(function () {
  "use strict";
  var C = window.WadaCore, I18N = window.WADA_I18N;
  var rgb = C.rgb, toHex = C.toHex, lab = C.lab, labFromRgb = C.labFromRgb, linFromLab = C.linFromLab, delin = C.delin,
    lch = C.lch, dist = C.dist, contrast = C.contrast, readableOn = C.readableOn, towards = C.towards, shade = C.shade,
    parseHex = C.parseHex, values = C.values, PROPS = C.PROPS, readHash = C.readHash, hashOf = C.hashOf, keyOf = C.keyOf;
  var WADA = C.unpack(window.WADA_DATA), search = C.createSearch(WADA);

  /* ---------- langue ---------- */
  var LANG_KEY = "accords-wada-lang", lang = "fr";
  function t(key, vars) {
    var s = I18N[lang] && I18N[lang][key]; if (s == null) s = I18N.fr[key]; if (s == null) s = key;
    return vars ? s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : s;
  }
  function nameOf(hex) { return C.nameOf(hex, lang); }
  function rolesOf(n) { return C.rolesOf(n, lang); }
  function slugsOf(n) { return C.slugsOf(n, lang); }
  function num(n) { return t("num") + n; }
  function initialLang(k) {
    if (k && k.lang) return k.lang;
    var only = /(?:^#|&)lg=(fr|en)\b/.exec(location.hash);  // « #lg=en » seul, depuis les fiches anglaises
    if (only) return only[1];
    try { var s = localStorage.getItem(LANG_KEY); if (s === "fr" || s === "en") return s; } catch (e) {}
    return /^fr\b/i.test(navigator.language || "fr") ? "fr" : "en";
  }

  /* ---------- état ---------- */
  var state = { seed: "#1448c8", seed2: null, multi: false, target: 2, size: 0, substitute: true, transpose: false, sel: 0, order: null, scene: "interieur", dictSize: 0, list: [], wantN: 0, wantOrder: null, light: 6500, vision: "normale" };
  try {
    var saved = JSON.parse(localStorage.getItem("accords-wada") || "null");
    if (saved && /^#[0-9a-f]{6}$/i.test(saved.seed)) { state.seed = saved.seed.toLowerCase(); state.size = saved.size || 0; state.scene = C.SCENES.indexOf(saved.scene) >= 0 ? saved.scene : "interieur"; }
    if (saved && /^#[0-9a-f]{6}$/i.test(saved.seed2)) { state.seed2 = saved.seed2.toLowerCase(); state.multi = !!saved.multi; }
  } catch (e) {}
  function save() { try { localStorage.setItem("accords-wada", JSON.stringify({ seed: state.seed, seed2: state.seed2, multi: state.multi, size: state.size, scene: state.scene })); } catch (e) {} }
  // Un lien partagé passe avant la mémoire du navigateur.
  function takeLink(k) {
    state.seed = k.seed; state.multi = !!k.seed2; if (k.seed2) state.seed2 = k.seed2;
    state.size = k.size; state.substitute = k.substitute; state.transpose = k.transpose; state.scene = k.scene;
    state.wantN = k.n; state.wantOrder = k.order;
    if (k.lang) lang = k.lang;
  }
  var link = readHash(location.hash);
  lang = initialLang(link);
  if (link) takeLink(link);
  function shareHash() {
    var cur = current();
    return hashOf({ seed: state.seed, seed2: state.multi ? state.seed2 : null, n: cur ? cur.a.n : 0, order: state.order, size: state.size, substitute: state.substitute, transpose: state.transpose, scene: state.scene, lang: lang });
  }
  function shareUrl() { return location.href.split("#")[0] + shareHash(); }
  function updateLink() { try { history.replaceState(null, "", shareHash()); } catch (e) {} }

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, attrs, kids) { var e = document.createElement(tag); if (attrs) for (var k in attrs) { if (k === "style") e.style.cssText = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } (kids || []).forEach(function (c) { e.appendChild(c); }); return e; }
  function toast(msg) { $("toast").textContent = msg; }
  function smooth() { return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"; }

  /* Textes fixes de la page : le français est lu dans index.html, l'anglais vient de i18n.js.
     Les chaînes « html » sont des constantes de i18n.js (jamais des données saisies). */
  var originals = new Map();
  function orig(e, slot, read) { var o = originals.get(e); if (!o) { o = {}; originals.set(e, o); } if (!(slot in o)) o[slot] = read(); return o[slot]; }
  function applyStatic() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    document.querySelector('meta[name="description"]').setAttribute("content", t("meta.desc"));
    document.querySelectorAll("[data-i18n]").forEach(function (e) {
      var fr = orig(e, "text", function () { return e.textContent; });
      e.textContent = lang === "fr" ? fr : t(e.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (e) {
      var fr = orig(e, "html", function () { return e.innerHTML; });
      e.innerHTML = lang === "fr" ? fr : t(e.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (e) {
      e.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var p = pair.split("="), attr = p[0], fr = orig(e, "@" + attr, function () { return e.getAttribute(attr) || ""; });
        e.setAttribute(attr, lang === "fr" ? fr : t(p[1]));
      });
    });
  }

  function setSeed(hex, keepImageChip) {
    hex = hex.toLowerCase(); state.seed = hex; state.sel = 0; state.order = null;
    $("picker").value = hex; $("hex").value = hex.toUpperCase(); $("hex").setAttribute("aria-invalid", "false");
    if (!keepImageChip) document.querySelectorAll(".chip.on").forEach(function (c) { c.classList.remove("on"); });
    var root = document.documentElement.style;
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
    state.list = all.slice(0, 12).map(function (r) { return C.build(r, state.seed, state); });
    if (state.wantN) {
      // Accord demandé par un lien, un projet ou le dictionnaire : on l'ajoute s'il n'est pas dans les 12 premiers.
      var j = state.list.findIndex(function (a) { return a.n === state.wantN; });
      if (j < 0) { var r = all.find(function (x) { return x.n === state.wantN; }); if (r) { state.list.push(C.build(r, state.seed, state)); j = state.list.length - 1; } }
      if (j >= 0) {
        state.sel = j; var o = state.wantOrder, len = state.list[j].colors.length;
        state.order = o && o.length === len && o.slice().sort().join() === Object.keys(o).join() ? o : null;
      }
      state.wantN = 0; state.wantOrder = null;
    }
    var exact = all.filter(function (r) { return r.d <= 0.06; }).length, pre = two ? "res.two." : "res.";
    $("resultHint").textContent = t(pre + (exact === 0 ? "none" : exact === 1 ? "one" : "many"), { n: exact });
    var ul = $("cards"); ul.textContent = "";
    state.list.forEach(function (a, i) {
      var parts = PROPS[a.colors.length], f = t("fid." + a.fid);
      var sw = el("span", { class: "sw" }, a.colors.map(function (c, j) { return el("i", { style: "background:" + c + ";flex:" + parts[j] }); }));
      var b = el("button", { type: "button", class: "card", "aria-pressed": String(i === state.sel), "aria-label": t("card.aria", { n: a.n, fid: f }) }, [
        sw,
        el("span", { class: "meta" }, [el("span", { class: "num", text: num(a.n) }), el("span", { class: "tag " + a.fid, text: f })]),
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
  function textOn(r) { return t("text.on", { c: t(r.c === "#ffffff" ? "white" : "black"), r: r.r.toFixed(1) }) + (r.r < 4.5 ? t("titles.only") : ""); }

  function renderDetail() {
    var cur = current(); if (!cur) return;
    var a = cur.a, cs = cur.colors, parts = PROPS[cs.length];
    $("detailLabel").textContent = t("detail.label", { n: a.n, fid: t("fid." + a.fid) }) +
      (a.two ? t("detail.gaps", { a: (a.d1 * 100).toFixed(1), b: (a.d2 * 100).toFixed(1) }) : t("detail.gap", { d: (a.d * 100).toFixed(1) }));
    $("detailTitle").textContent = cs.map(nameOf).join(" · ");
    var big = $("bigsw"); big.textContent = "";
    cs.forEach(function (c, i) { var s = sim(c), r = readableOn(s); big.appendChild(el("div", { style: "background:" + s + ";color:" + r.c + ";flex:" + parts[i] }, [document.createTextNode(parts[i] + " %")])); });
    var roles = rolesOf(cs.length);
    var rows = $("rows"); rows.textContent = "";
    cs.forEach(function (c, i) {
      var lc = c.toLowerCase(), r = readableOn(c), mine = state.substitute && (lc === state.seed || (a.two && lc === state.seed2));
      var copy = el("button", { type: "button", class: "mini", text: t("copy") });
      copy.addEventListener("click", function () { doCopy(c.toUpperCase(), t("copied", { x: c.toUpperCase() })); });
      rows.appendChild(el("div", { class: "row" }, [
        el("span", { class: "dot", style: "background:" + c + ";color:" + r.c, title: t("contrast.title", { r: r.r.toFixed(1) }), text: "Aa" }),
        el("span", { class: "what" }, [el("b", { text: c.toUpperCase() }), document.createTextNode("  " + roles[i] + " · " + parts[i] + " %" + (mine ? t("yours") : "")),
          el("small", { text: nameOf(c) + " · " + textOn(r) })]),
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
    updateFav(); recordHistory();
  }
  function sim(c) { return state.light === 6500 && state.vision === "normale" ? c : C.simulate(c, state.light, state.vision); }
  function renderSimNotes(cs) {
    var bits = [];
    if (state.light !== 6500) bits.push(t("sim.light", { l: t("light." + state.light) }));
    if (state.vision !== "normale") bits.push(t("sim.vision", { v: t("cvd." + state.vision) }));
    if (bits.length) bits.push(t("sim.keep"));
    $("simHint").textContent = bits.join(" ");
    var conf = C.confusions(cs), byType = {};
    conf.forEach(function (x) { (byType[x.k] = byType[x.k] || []).push(t("cvd.pair", { a: nameOf(x.a) + " " + x.a.toUpperCase(), b: nameOf(x.b) + " " + x.b.toUpperCase() })); });
    $("cvdHint").textContent = conf.length
      ? t("cvd.warn", { list: Object.keys(byType).map(function (k) { return t("cvd.in", { v: t("cvd." + k), pairs: byType[k].join(" ; ") }); }).join(". ") })
      : t("cvd.ok");
  }

  function exportText(kind) {
    var cur = current(), cs = cur.colors, parts = PROPS[cs.length], n = cur.a.n;
    if (kind === "hex") return cs.map(function (c) { return c.toUpperCase(); }).join(", ");
    if (kind === "prompt") return t("exp.prompt", { k: cs.length, list: cs.join(", "), n: n, p: parts.join("/") });
    if (kind === "link") return shareUrl();
    if (kind === "table") {
      var roles = rolesOf(cs.length);
      return t("table.head") + "\n" +
        cs.map(function (c, i) { var v = values(c); return [roles[i], parts[i], v.hex, v.rgb, v.hsl, v.oklch, v.cmjn, v.lrv, nameOf(c)].join("\t"); }).join("\n") +
        "\n\n" + t("table.note", { n: n });
    }
    var names = slugsOf(cs.length);
    return "/* Sanzo Wada " + num(n) + " — " + parts.join("/") + " */\n:root {\n" + cs.map(function (c, i) { return "  --wada-" + names[i] + ": " + c + ";"; }).join("\n") + "\n}";
  }
  function doCopy(text, msg) {
    try {
      navigator.clipboard.writeText(text).then(function () { toast(msg); }, fallback);
    } catch (e) { fallback(); }
    function fallback() { var o = $("out"); o.textContent = text; var r = document.createRange(); r.selectNodeContents(o); var s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(t("copy.fallback")); }
  }
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-copy"), txt = exportText(k); $("out").textContent = txt;
      doCopy(txt, k === "link" ? t(location.protocol === "file:" ? "toast.link.file" : "toast.link") : t("toast." + k));
    });
  });
  $("rotate").addEventListener("click", function () { var cur = current(); if (!cur) return; var o = cur.order.slice(); o.push(o.shift()); state.order = o; toast(t("dominant", { x: nameOf(cur.a.colors[o[0]]) })); renderDetail(); });

  /* ---------- mises en situation ---------- */
  function sceneOf(scene, cs, n, labels) {
    var A = cs[0], B = cs[1], Cc = cs[2] || cs[1], D = cs[3] || cs[2] || cs[0], svg, aria = t("scene.aria." + scene);
    if (scene === "interieur") {
      svg = '<svg viewBox="0 0 480 340" role="img" aria-label="' + aria + '">' +
        '<rect width="480" height="250" fill="' + A + '"/>' +
        '<rect y="250" width="480" height="90" fill="' + shade(A, -0.22) + '"/>' +
        '<rect x="300" y="44" width="120" height="150" fill="' + shade(A, 0.12) + '"/><rect x="310" y="54" width="100" height="130" fill="' + D + '"/><circle cx="360" cy="110" r="30" fill="' + Cc + '"/>' +
        '<ellipse cx="200" cy="300" rx="190" ry="26" fill="' + D + '" opacity=".85"/>' +
        '<rect x="60" y="170" width="250" height="70" rx="10" fill="' + B + '"/><rect x="48" y="150" width="40" height="110" rx="10" fill="' + shade(B, -0.06) + '"/><rect x="282" y="150" width="40" height="110" rx="10" fill="' + shade(B, -0.06) + '"/>' +
        '<rect x="70" y="140" width="230" height="44" rx="10" fill="' + shade(B, 0.05) + '"/>' +
        '<rect x="96" y="124" width="54" height="44" rx="8" fill="' + Cc + '" transform="rotate(-8 123 146)"/><rect x="214" y="126" width="54" height="44" rx="8" fill="' + D + '" transform="rotate(7 241 148)"/>' +
        '<rect x="70" y="240" width="10" height="26" fill="' + shade(B, -0.25) + '"/><rect x="290" y="240" width="10" height="26" fill="' + shade(B, -0.25) + '"/>' +
        '<rect x="388" y="214" width="56" height="52" rx="4" fill="' + shade(A, -0.3) + '"/><path d="M406 214 q10 -60 0 -110 M416 214 q22 -50 30 -96 M412 214 q-20 -40 -34 -70" stroke="' + Cc + '" stroke-width="5" fill="none" stroke-linecap="round"/></svg>';
    } else if (scene === "mode") {
      svg = '<svg viewBox="0 0 480 340" role="img" aria-label="' + aria + '">' +
        '<rect width="480" height="340" fill="#e4e3de"/><rect y="300" width="480" height="40" fill="#d6d5cf"/>' +
        '<path d="M180 70 L300 70 L330 210 L150 210 Z" fill="' + B + '"/>' +
        '<path d="M170 240 L310 240 L300 330 L250 330 L240 270 L230 330 L180 330 Z" fill="' + Cc + '"/>' +
        '<path d="M150 60 L210 54 L240 120 L270 54 L330 60 L360 300 L290 300 L280 210 L200 210 L190 300 L120 300 Z" fill="' + A + '"/>' +
        '<path d="M210 54 L240 120 L270 54 L262 48 L240 92 L218 48 Z" fill="' + shade(A, -0.12) + '"/>' +
        '<path d="M222 40 Q240 30 258 40 L256 60 Q240 70 224 60 Z" fill="' + D + '"/><path d="M226 58 L222 130 L236 128 Z" fill="' + D + '"/>' +
        '<rect x="368" y="200" width="70" height="56" rx="6" fill="' + D + '"/><path d="M382 200 Q403 168 424 200" stroke="' + D + '" stroke-width="6" fill="none"/>' +
        '<rect x="170" y="210" width="140" height="10" fill="' + shade(A, -0.2) + '"/></svg>';
    } else {
      var tc = readableOn(A).c, best = cs.slice(1).map(function (c) { return [c, contrast(c, A)]; }).sort(function (x, y) { return y[1] - x[1]; })[0];
      var title = best[1] >= 3 ? best[0] : tc;
      svg = '<svg viewBox="0 0 480 340" role="img" aria-label="' + aria + '">' +
        '<rect width="480" height="340" fill="' + A + '"/>' +
        '<circle cx="360" cy="120" r="92" fill="' + B + '"/>' +
        '<rect x="300" y="160" width="150" height="150" fill="' + Cc + '"/>' +
        '<rect x="300" y="160" width="60" height="60" fill="' + D + '"/>' +
        '<text x="32" y="210" font-family="Shippori Mincho, Georgia, serif" font-weight="700" font-size="58" fill="' + title + '">配色</text>' +
        '<text x="32" y="252" font-family="Zen Kaku Gothic New, sans-serif" font-weight="700" font-size="22" fill="' + title + '">' + t("scene.poster", { n: n }) + '</text>' +
        '<text x="32" y="300" font-family="IBM Plex Mono, monospace" font-size="12" fill="' + tc + '">' + (labels || cs).join("  ").toUpperCase() + '</text></svg>';
    }
    return { svg: svg, hint: t("scene." + scene) };
  }
  function renderScene() {
    var cur = current(), s = sceneOf(state.scene, cur.colors.map(sim), cur.a.n, cur.colors);
    $("scene").innerHTML = s.svg; $("sceneHint").textContent = s.hint;
    renderSimNotes(cur.colors);
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
    words.forEach(function (w) { var s = line ? line + " " + w : w; if (ctx.measureText(s).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = s; });
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
      x.fillText((t("sheet.head", { n: a.n, fid: t("fid." + a.fid) }) + (state.transpose ? t("sheet.transposed") : "")).toUpperCase(), M, M);
      if ("letterSpacing" in x) x.letterSpacing = "0px";
      var title = cs.map(nameOf).join(" · "), size = 54;
      do { x.font = "700 " + size + "px " + FONT.display; size -= 2; } while (x.measureText(title).width > S.w - 2 * M && size > 26);
      x.fillStyle = S.ink; x.fillText(title, M, M + 36);

      // Bande de proportions
      var top = 220, bandH = 380, bx = M;
      cs.forEach(function (c, i) {
        var w = LW * parts[i] / 100, r = readableOn(c);
        x.fillStyle = c; x.fillRect(bx, top, w, bandH);
        x.fillStyle = r.c; x.font = "500 16px " + FONT.mono; x.fillText(parts[i] + " %", bx + 14, top + bandH - 32);
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
        [["HEX", v.hex], ["RGB", v.rgb], ["HSL", v.hsl], ["OKLCH", v.oklch], [t("cmyk"), v.cmjn], ["LRV ≈", v.lrv]].forEach(function (r) {
          x.font = "400 13px " + FONT.mono; x.fillStyle = S.muted; x.fillText(r[0], cx, y);
          x.font = "400 17px " + FONT.mono; x.fillStyle = S.ink; x.fillText(fitText(x, r[1], maxW), cx, y + 17); y += 46;
        });
      });

      // Mise en situation
      var sh = RW * 340 / 480;
      if (img) x.drawImage(img, RX, top, RW, sh);
      x.strokeStyle = S.line; x.strokeRect(RX + 0.5, top + 0.5, RW - 1, sh - 1);
      x.fillStyle = S.muted; x.font = "400 15px " + FONT.body;
      var hy = wrapText(x, sc.hint, RX, top + sh + 16, RW, 22), rd = readableOn(cs[0]);
      wrapText(x, t("sheet.legible", { c: t(rd.c === "#ffffff" ? "white" : "black"), r: rd.r.toFixed(1), t: rd.r < 4.5 ? t("titles.only") : "" }), RX, hy + 8, RW, 22);

      // Pied de planche
      var fy = S.h - M - 58;
      x.fillStyle = S.line; x.fillRect(M, fy, S.w - 2 * M, 1);
      x.fillStyle = S.muted; x.font = "400 13px " + FONT.body;
      x.fillText(t("sheet.foot"), M, fy + 14);
      x.font = "400 12px " + FONT.mono;
      var date = new Date().toLocaleDateString(t("locale")), right = "Accords Wada — Manso Olivier · MAN MBAÏ LIKOL", rw = x.measureText(right).width;
      x.fillText(fitText(x, t("sheet.date", { d: date }) + " · " + shareUrl(), S.w - 2 * M - rw - 40), M, fy + 38);
      x.fillText(right, S.w - M - rw, fy + 38);
      return cv;
    });
  }
  $("sheetPng").addEventListener("click", function () {
    var n = current().a.n; toast(t("sheet.preparing"));
    makeSheet().then(function (cv) {
      cv.toBlob(function (b) {
        if (!b) { toast(t("sheet.fail")); return; }
        download("accord-wada-" + n + ".png", b, "image/png");
        toast(t("sheet.png"));
      }, "image/png");
    }).catch(function () { toast(t("sheet.fail")); });
  });
  $("sheetPrint").addEventListener("click", function () {
    toast(t("sheet.preparing"));
    makeSheet().then(function (cv) {
      var img = $("printSheet");
      img.onload = function () { document.documentElement.classList.add("has-sheet"); toast(t("sheet.pdf")); window.print(); };
      img.src = cv.toDataURL("image/png");
    }).catch(function () { toast(t("sheet.printfail")); });
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
  seg("lightSeg", "light", renderDetail);
  seg("visionSeg", "vision", renderDetail);
  seg("dictSeg", "dictSize", renderDict);
  seg("targetSeg", "target", function () {});
  $("langSeg").querySelectorAll("button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.v === lang) return;
      lang = b.dataset.v; try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
      var cur = current(); if (cur) { state.wantN = cur.a.n; state.wantOrder = state.order; }  // garder l'accord affiché
      toast(""); applyLang();
    });
  });

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
    if (!f || !/^image\//.test(f.type)) { toast(t("img.notimage")); return; }
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var max = 640, s = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * s); canvas.height = Math.round(img.height * s);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
      $("imgbox").hidden = false; extract();
    };
    img.onerror = function () { toast(t("img.unreadable")); };
    img.src = url;
  }
  function extract() {
    var w = canvas.width, h = canvas.height, step = Math.max(1, Math.floor(Math.sqrt(w * h / 6000))), data = ctx.getImageData(0, 0, w, h).data, pts = [];
    for (var y = 0; y < h; y += step) for (var x = 0; x < w; x += step) { var i = (y * w + x) * 4; if (data[i + 3] > 128) pts.push(labFromRgb([data[i], data[i + 1], data[i + 2]])); }
    var k = 6, cent = [pts[Math.floor(pts.length / 2)]], counts = [];
    while (cent.length < k) { var far = 0, pick = pts[0]; for (var p = 0; p < pts.length; p += 3) { var dm = Math.min.apply(null, cent.map(function (c) { return dist(c, pts[p]); })); if (dm > far) { far = dm; pick = pts[p]; } } cent.push(pick); }
    for (var it = 0; it < 10; it++) {
      var sums = cent.map(function () { return [0, 0, 0, 0]; });
      pts.forEach(function (pt) { var b = 0, bd = Infinity; cent.forEach(function (c, j) { var d = dist(c, pt); if (d < bd) { bd = d; b = j; } }); var s = sums[b]; s[0] += pt[0]; s[1] += pt[1]; s[2] += pt[2]; s[3]++; });
      cent = cent.map(function (c, j) { var s = sums[j]; return s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : c; });
      counts = sums.map(function (s) { return s[3]; });
    }
    var clusters = cent.map(function (c, j) { return { hex: toHex(linFromLab(c).map(delin)), n: counts[j], C: Math.hypot(c[1], c[2]) }; }).filter(function (c) { return c.n > 0; }).sort(function (a, b) { return b.n - a.n; });
    var chips = $("chips"); chips.textContent = "";
    clusters.forEach(function (c) {
      var b = el("button", { type: "button", class: "chip", style: "background:" + c.hex, title: t("img.chip", { hex: c.hex.toUpperCase(), p: Math.round(c.n / pts.length * 100) }), "aria-label": nameOf(c.hex) + " " + c.hex.toUpperCase() });
      b.addEventListener("click", function () { pickFromImage(c.hex, b); });
      chips.appendChild(b);
    });
    var lead = clusters.find(function (c) { return c.C > 0.04; }) || clusters[0];
    imgClusters = clusters; imgClusters.lead = lead;
    var second = state.multi ? secondCluster(lead) : null;
    if (second) { state.seed2 = second.hex; showSeed2(); save(); markChip(second, "on2"); }
    setSeed(lead.hex); markChip(lead, "on");
    toast(second ? t("img.two", { a: nameOf(lead.hex), b: nameOf(second.hex) }) : t("img.one", { a: nameOf(lead.hex) }));
  }
  canvas.addEventListener("click", function (e) {
    var r = canvas.getBoundingClientRect(), x = Math.round((e.clientX - r.left) / r.width * canvas.width), y = Math.round((e.clientY - r.top) / r.height * canvas.height);
    var d = ctx.getImageData(Math.max(0, x - 2), Math.max(0, y - 2), 5, 5).data, s = [0, 0, 0], n = 0;
    for (var i = 0; i < d.length; i += 4) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; n++; }
    pickFromImage(toHex(s.map(function (v) { return v / n; })));
  });
  $("file").addEventListener("change", function (e) { loadFile(e.target.files[0]); e.target.value = ""; });
  var drop = $("drop");
  ["dragenter", "dragover"].forEach(function (k) { drop.addEventListener(k, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (k) { drop.addEventListener(k, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { loadFile(e.dataTransfer.files[0]); });
  document.addEventListener("paste", function (e) { var it = Array.prototype.find.call(e.clipboardData.items || [], function (i) { return i.type.indexOf("image") === 0; }); if (it) loadFile(it.getAsFile()); });

  /* ---------- dictionnaire ---------- */
  function renderDict() {
    var g = $("dictGrid"); g.textContent = "";
    WADA.forEach(function (c, i) {
      if (state.dictSize && c.length !== state.dictSize) return;
      var b = el("button", { type: "button", "aria-label": t(state.multi ? "dict.aria2" : "dict.aria", { n: i + 1, list: c.join(", ") }) }, [
        el("span", { class: "sw" }, c.map(function (x) { return el("i", { style: "background:" + x }); })), el("span", { text: num(i + 1) })]);
      b.addEventListener("click", function () {
        if (state.multi) { state.seed2 = c[1]; showSeed2(); document.querySelectorAll(".chip.on2").forEach(function (x) { x.classList.remove("on2"); }); }
        state.wantN = i + 1;
        setSeed(c[0]);
        $("detail").scrollIntoView({ behavior: smooth() });
      });
      g.appendChild(el("li", null, [b]));
    });
  }

  /* ---------- exports logiciels ---------- */
  function download(name, data, type) {
    var b = data instanceof Blob ? data : new Blob([data], { type: type || "text/plain;charset=utf-8" }), u = URL.createObjectURL(b), l = el("a", { href: u, download: name });
    document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  function exportItems() {
    var cs = current().colors, roles = rolesOf(cs.length), slugs = slugsOf(cs.length), parts = PROPS[cs.length];
    return cs.map(function (c, i) { return { hex: c.toLowerCase(), role: roles[i], slug: slugs[i], pct: parts[i], name: nameOf(c) }; });
  }
  document.querySelectorAll("[data-export]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-export"), n = current().a.n, items = exportItems(), base = "accord-wada-" + n;
      if (k === "ase") download(base + ".ase", C.aseBytes("Sanzo Wada " + num(n), items), "application/octet-stream");
      if (k === "tokens") download(base + ".tokens.json", C.tokensText(n, items, lang), "application/json");
      if (k === "tailwind") download(base + ".tailwind.css", C.tailwindText(n, items, lang), "text/css");
      if (k === "gpl") download(base + ".gpl", C.gplText(n, items, lang));
      toast(t("exp." + k));
    });
  });

  /* ---------- projets, favoris, historique ----------
     localStorage "accords-wada-projets" ; export/import JSON pour changer de poste ou archiver. */
  var STORE_KEY = "accords-wada-projets", storeOk = true;
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function freshStore() { var id = newId(); return { v: 1, current: id, projects: [{ id: id, name: t("proj.first"), items: [] }], history: [] }; }
  var store = (function () {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (s && s.v === 1 && Array.isArray(s.projects) && s.projects.length) { if (!Array.isArray(s.history)) s.history = []; return s; }
    } catch (e) { storeOk = false; }
    return freshStore();
  })();
  function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); storeOk = true; } catch (e) { storeOk = false; } }
  function project() { return store.projects.find(function (p) { return p.id === store.current; }) || store.projects[0]; }
  // Les accords gardés ne mémorisent pas la langue : un projet s'ouvre dans la langue de l'interface.
  function snapshot() { var cur = current(), h = C.readHash(shareHash()); h.lang = null; return { hash: hashOf(h), n: cur.a.n, colors: cur.colors.slice() }; }
  function inProject() { var key = keyOf(shareHash()); return project().items.findIndex(function (it) { return keyOf(it.hash) === key; }); }
  function updateFav() { $("fav").setAttribute("aria-pressed", String(inProject() >= 0)); }
  var histTimer = 0;
  function recordHistory() {
    clearTimeout(histTimer);
    histTimer = setTimeout(function () {
      if (!current()) return;
      var s = snapshot(), key = keyOf(s.hash);
      store.history = [s].concat(store.history.filter(function (h) { return keyOf(h.hash) !== key; })).slice(0, 12);
      persist(); renderHistory();
    }, 1500);
  }
  function openHash(h) {
    var k = readHash(h); if (!k) return;
    k.lang = lang; h = hashOf(k);
    if (location.hash !== h) location.hash = h;
    $("detail").scrollIntoView({ behavior: smooth() });
  }
  function accordItem(it, opts) {
    var parts = PROPS[it.colors.length] || [];
    var open = el("button", { type: "button", class: "saved-open", "aria-label": t("proj.open", { n: it.n, list: it.colors.join(", ") }) }, [
      el("span", { class: "sw" }, it.colors.map(function (c, j) { return el("i", { style: "background:" + c + ";flex:" + (parts[j] || 1) }); })),
      el("span", { class: "num", text: num(it.n) })]);
    open.addEventListener("click", function () { openHash(it.hash); });
    var kids = [open];
    if (opts.note) {
      var note = el("input", { class: "textin", type: "text", maxlength: "160", placeholder: t("proj.note"), "aria-label": t("proj.note.aria", { n: it.n }) });
      note.value = it.note || "";
      note.addEventListener("change", function () { it.note = note.value.trim(); persist(); });
      kids.push(note);
    }
    if (opts.remove) { var rm = el("button", { type: "button", class: "mini", text: t("proj.remove"), "aria-label": t("proj.remove.aria", { n: it.n }) }); rm.addEventListener("click", opts.remove); kids.push(rm); }
    return el("li", { class: "saved-item" }, kids);
  }
  function renderProjects() {
    var sel = $("projSel"), p = project(); sel.textContent = "";
    store.projects.forEach(function (q) { var o = el("option", { value: q.id, text: q.name + " (" + q.items.length + ")" }); if (q.id === p.id) o.selected = true; sel.appendChild(o); });
    $("projName").value = p.name;
    var ul = $("saved"); ul.textContent = "";
    p.items.forEach(function (it, i) { ul.appendChild(accordItem(it, { note: true, remove: function () { p.items.splice(i, 1); persist(); renderProjects(); updateFav(); } })); });
    $("savedHint").textContent = (p.items.length ? "" : t("proj.empty")) + (storeOk ? "" : t("proj.nostore"));
  }
  function renderHistory() {
    var ul = $("history"); ul.textContent = "";
    store.history.forEach(function (it) { ul.appendChild(accordItem(it, {})); });
    $("historyCount").textContent = store.history.length;
  }
  function slug(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "projet"; }

  $("fav").addEventListener("click", function () {
    var p = project(), i = inProject();
    if (i >= 0) { p.items.splice(i, 1); toast(t("proj.out", { p: p.name })); }
    else { var s = snapshot(); s.note = ""; s.added = new Date().toISOString(); p.items.unshift(s); toast(t("proj.in", { p: p.name })); }
    persist(); updateFav(); renderProjects();
  });
  $("projSel").addEventListener("change", function (e) { store.current = e.target.value; persist(); renderProjects(); updateFav(); });
  $("projName").addEventListener("change", function (e) {
    var v = e.target.value.trim(); if (!v) { e.target.value = project().name; return; }
    project().name = v.slice(0, 60); persist(); renderProjects();
  });
  $("projNew").addEventListener("click", function () {
    var id = newId(); store.projects.push({ id: id, name: t("proj.n", { n: store.projects.length + 1 }), items: [] }); store.current = id;
    persist(); renderProjects(); updateFav(); $("projName").focus(); $("projName").select();
  });
  $("projDelete").addEventListener("click", function () {
    var p = project();
    if (!confirm(t("proj.confirm", { p: p.name, k: p.items.length }))) return;
    store.projects = store.projects.filter(function (q) { return q !== p; });
    if (!store.projects.length) store.projects = freshStore().projects;
    store.current = store.projects[0].id; persist(); renderProjects(); updateFav();
    toast(t("proj.deleted", { p: p.name }));
  });
  $("projExport").addEventListener("click", function () {
    var p = project();
    download(slug(p.name) + ".accords-wada.json", JSON.stringify({ format: "accords-wada-projet", version: 1, name: p.name, exported: new Date().toISOString(), items: p.items }, null, 2) + "\n", "application/json");
    toast(t("proj.exported", { p: p.name }));
  });
  $("projImport").addEventListener("change", function (e) {
    var f = e.target.files[0]; e.target.value = ""; if (!f) return;
    f.text().then(function (txt) {
      var d = JSON.parse(txt); if (!d || d.format !== "accords-wada-projet") throw new Error("format");
      var items = C.cleanItems(d.items); if (!items.length) throw new Error("vide");
      var name = typeof d.name === "string" && d.name.trim() ? d.name.trim().slice(0, 60) : t("proj.importname");
      if (store.projects.some(function (q) { return q.name === name; })) name = (name + " (import)").slice(0, 60);
      var id = newId(); store.projects.push({ id: id, name: name, items: items }); store.current = id;
      persist(); renderProjects(); updateFav();
      toast(t(items.length > 1 ? "proj.imported.many" : "proj.imported.one", { p: name, k: items.length }));
    }).catch(function () { toast(t("proj.bad")); });
  });

  /* ---------- PWA : hors ligne et installation ---------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  var installPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installPrompt = e; $("install").hidden = false; });
  $("install").addEventListener("click", function () {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(function () { installPrompt = null; $("install").hidden = true; });
  });
  window.addEventListener("appinstalled", function () { $("install").hidden = true; toast(t("install.done")); });

  /* ---------- démarrage ---------- */
  function applyLang() {
    applyStatic(); setPressed("langSeg", lang);
    if (state.seed2) showSeed2();
    renderDict(); renderProjects(); renderHistory();
    setSeed(state.seed, true);
  }
  function start() {
    $("substitute").checked = state.substitute; $("transpose").checked = state.transpose;
    setPressed("sizeSeg", state.size); setPressed("sceneSeg", state.scene);
    applyMulti();
    applyLang();  // setSeed → refresh() sélectionne l'accord demandé par le lien (state.wantN)
  }
  // Lien collé dans un onglet déjà ouvert, ou accord rouvert depuis un projet
  window.addEventListener("hashchange", function () {
    if (location.hash === shareHash()) return;
    var k = readHash(location.hash); if (!k) return;
    takeLink(k); document.querySelectorAll(".chip.on, .chip.on2").forEach(function (c) { c.classList.remove("on", "on2"); }); start();
  });
  start();
})();
