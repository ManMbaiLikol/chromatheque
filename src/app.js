/* La Chromathèque de Man Mbaï Likol — interface. Les fonctions pures (couleur, recherche, analyses, exports, liens) sont dans core.js,
   les mises en situation dans scenes.js, les textes FR/EN dans i18n.js, les sources autres que Wada dans
   sources-data.js. Ce fichier gère l'état, le DOM, l'image, la planche, les projets et la PWA. */
(function () {
  "use strict";
  var C = window.WadaCore, I18N = window.WADA_I18N, SCENES = window.WadaScenes, EXT = window.ChromaExt || [];
  function hook(name) { var args = Array.prototype.slice.call(arguments, 1); EXT.forEach(function (x) { if (x[name]) try { x[name].apply(x, args); } catch (e) { if (window.console) console.error(e); } }); }
  var toHex = C.toHex, lab = C.lab, labFromRgb = C.labFromRgb, linFromLab = C.linFromLab, delin = C.delin,
    dist = C.dist, readableOn = C.readableOn, towards = C.towards, shade = C.shade,
    parseHex = C.parseHex, values = C.values, PROPS = C.PROPS, readHash = C.readHash, hashOf = C.hashOf, keyOf = C.keyOf;

  /* ---------- sources : Wada (défaut), kasane, traditions africaines, règles calculées ---------- */
  var WADA = C.unpack(window.WADA_DATA), EXTRA = window.WADA_SOURCES || {};
  var SRC = { wada: { combos: WADA }, kasane: { list: EXTRA.kasane || [] }, afrique: { list: EXTRA.afrique || [] }, regles: { rules: true } };
  Object.keys(SRC).forEach(function (k) {
    var s = SRC[k]; if (s.list) s.combos = s.list.map(function (e) { return e.colors; });
    if (s.combos) s.search = C.createSearch(s.combos);
  });

  /* ---------- langue ---------- */
  var LANG_KEY = "accords-wada-lang", lang = "fr";
  function t(key, vars) {
    var s = I18N[lang] && I18N[lang][key]; if (s == null) s = I18N.fr[key]; if (s == null) s = key;
    return vars ? s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : s;
  }
  function nameOf(hex) { return C.nameOf(hex, lang); }
  function slugsOf(n) { return C.slugsOf(n, lang); }
  function num(n) { return t("num") + n; }
  function initialLang(k) {
    if (k && k.lang) return k.lang;
    var only = /(?:^#|&)lg=(fr|en)\b/.exec(location.hash);  // « #lg=en » seul, depuis les fiches anglaises
    if (only) return only[1];
    try { var s = localStorage.getItem(LANG_KEY); if (s === "fr" || s === "en") return s; } catch (e) {}
    return /^fr\b/i.test(navigator.language || "fr") ? "fr" : "en";
  }
  function srcName(src) { return t("src." + src + ".name"); }
  function entryOf(src, n) { var l = SRC[src].list; return l ? l[n - 1] : null; }
  // Règles : à une couleur (rule.*) ou à deux couleurs imposées (rule2.*).
  function ruleName(n, two) { var L = two ? C.RULES2 : C.RULES; return t((two ? "rule2." : "rule.") + (L[n - 1] || L[0])); }
  function twoLocked() { return state.locked.length === 2; }
  // Nom court d'un accord : « n° 55 », « 紅梅 », « Kente · or, vert, noir », « Triade · Itten ».
  function shortLabel(src, n, two) {
    if (src === "regles") return ruleName(n, two == null ? twoLocked() : two);
    var e = entryOf(src, n); if (!e) return num(n);
    return src === "kasane" ? e.jp : e[lang] || e.fr;
  }
  function longLabel(src, n, two) {
    if (src === "wada") return "Sanzo Wada " + num(n);
    if (src === "regles") return ruleName(n, two == null ? twoLocked() : two);
    var e = entryOf(src, n); if (!e) return num(n);
    return src === "kasane" ? e.jp + " " + (e[lang] || e.fr) : e[lang] || e.fr;
  }
  function rolesFor(src, k) { return src === "kasane" && k === 2 ? [t("role.kasane.0"), t("role.kasane.1")] : C.rolesOf(k, lang); }

  /* ---------- état ---------- */
  var state = { source: "wada", seed: "#1448c8", seed2: null, multi: false, draft: "#1448c8", locked: [], size: 0, substitute: true, transpose: false, sel: 0, order: null, scene: "interieur", dictSize: 0, list: [], wantN: 0, wantOrder: null, light: 6500, vision: "normale" };
  try {
    var saved = JSON.parse(localStorage.getItem("accords-wada") || "null");
    var hexOk = function (h) { return typeof h === "string" && /^#[0-9a-f]{6}$/i.test(h); };
    if (saved && hexOk(saved.seed)) { state.draft = (hexOk(saved.draft) ? saved.draft : saved.seed).toLowerCase(); state.size = saved.size || 0; state.scene = C.SCENES.indexOf(saved.scene) >= 0 ? saved.scene : "interieur"; }
    if (saved && Array.isArray(saved.locked)) state.locked = saved.locked.filter(hexOk).map(function (h) { return h.toLowerCase(); }).slice(0, 2);
    else if (saved && saved.multi && hexOk(saved.seed) && hexOk(saved.seed2)) state.locked = [saved.seed.toLowerCase(), saved.seed2.toLowerCase()];  // ancienne « 2e couleur »
    if (saved && SRC[saved.source]) state.source = saved.source;
  } catch (e) {}
  // seed / seed2 / multi sont dérivés : couleurs imposées d'abord, sinon la couleur à essayer.
  function sync() { state.seed = state.locked[0] || state.draft; state.seed2 = state.locked[1] || null; state.multi = state.locked.length === 2; }
  sync();
  function save() { try { localStorage.setItem("accords-wada", JSON.stringify({ seed: state.seed, draft: state.draft, locked: state.locked, size: state.size, scene: state.scene, source: state.source })); } catch (e) {} }
  // Un lien partagé passe avant la mémoire du navigateur.
  function takeLink(k) {
    state.draft = k.seed; state.locked = k.locked === 2 ? [k.seed, k.seed2] : k.locked === 1 ? [k.seed] : []; sync();
    state.size = k.size; state.substitute = k.substitute; state.transpose = k.transpose; state.scene = k.scene; state.source = k.source || "wada";
    state.wantN = k.n; state.wantOrder = k.order; state.wantParts = k.parts;
    if (k.lang) lang = k.lang;
  }
  var link = readHash(location.hash);
  lang = initialLang(link);
  if (link) takeLink(link);
  function shareHash() {
    var cur = current();
    return hashOf({ seed: state.seed, seed2: state.multi ? state.seed2 : null, locked: state.locked.length, n: cur ? cur.a.n : 0, order: state.order, parts: state.parts, size: state.size, substitute: state.substitute, transpose: state.transpose, scene: state.scene, source: state.source, lang: lang });
  }
  function shareUrl() { return location.href.split("#")[0] + shareHash(); }
  // Sections : la destination (go=) est séparée des réglages ; un lien « #metier » garde la palette mémorisée.
  var SECTIONS = [].map.call(document.querySelectorAll('a[href^="#"], section[id]'), function (a) { return a.tagName === "A" ? a.getAttribute("href").slice(1) : a.id; })
    .filter(function (id, i, all) { return id && all.indexOf(id) === i && document.getElementById(id); });
  var section = C.sectionOf(location.hash, SECTIONS);
  function stateHash() { return C.withSection(shareHash(), section); }
  function goSection(id, how) {
    var e = document.getElementById(id); if (!e) return;
    e.scrollIntoView({ behavior: how || smooth() });
    if (!e.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) e.setAttribute("tabindex", "-1");
    try { e.focus({ preventScroll: true }); } catch (x) {}
  }
  function updateLink() { if (/^#[pr]=/.test(location.hash)) return; try { history.replaceState(null, "", stateHash()); } catch (e) {} }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var id = a.getAttribute("href").slice(1); if (SECTIONS.indexOf(id) < 0 || /^#[pr]=/.test(location.hash)) return;
    e.preventDefault(); section = id;
    try { history.pushState(null, "", stateHash()); } catch (x) {}
    goSection(id);
  });

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, attrs, kids) { var e = document.createElement(tag); if (attrs) for (var k in attrs) { if (k === "style") e.style.cssText = attrs[k]; else if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } (kids || []).forEach(function (c) { e.appendChild(c); }); return e; }
  var toastTimer = 0;
  function toast(msg) { var e = $("toast"); e.textContent = msg; clearTimeout(toastTimer); if (msg) toastTimer = setTimeout(function () { e.textContent = ""; }, 5000); }
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

  function applyAccent() {
    var root = document.documentElement.style;
    root.setProperty("--accent-l", towards(state.seed, "#f1f1ef", 3));
    root.setProperty("--accent-d", towards(state.seed, "#161615", 3));
  }
  function showDraft() {
    var hex = state.draft;
    $("picker").value = hex; $("hex").value = hex.toUpperCase(); $("hex").setAttribute("aria-invalid", "false");
    $("seedname").textContent = nameOf(hex);
  }
  // Couleur à essayer : tant qu'aucune couleur n'est imposée, elle pilote la recherche en direct ;
  // ensuite elle ne fait que préparer la prochaine validation.
  function setSeed(hex, keepImageChip) {
    state.draft = hex.toLowerCase(); showDraft();
    if (!keepImageChip) document.querySelectorAll(".chip.on").forEach(function (c) { c.classList.remove("on"); });
    renderLocks();
    if (state.locked.length) { save(); return; }
    sync(); state.sel = 0; state.order = null; state.parts = null; applyAccent(); save(); refresh();
  }
  function relock(msg) {
    state.sel = 0; state.order = null; state.parts = null; state.wantN = 0;
    if (twoLocked() && state.size === 2) { state.size = 0; setPressed("sizeSeg", 0); }
    sync(); applyAccent(); save(); renderLocks(); renderSources(); applySourceUI(); refresh(); if (msg) toast(msg);
  }
  function lockDraft() {
    var h = state.draft;
    if (state.locked.length >= 2) { toast(t("lock.full")); return; }
    if (state.locked.indexOf(h) >= 0) { toast(t("lock.same")); return; }
    state.locked.push(h); relock(t("lock.added", { x: nameOf(h) + " " + h.toUpperCase() }));
    if (state.locked.length === 1) {
      // 2e couleur : on propose d'emblée une compagne de l'accord en tête, à valider ou à remplacer.
      var top = state.list[0], sug = top && top.colors.filter(function (c) { return c.toLowerCase() !== h; })[0];
      if (sug) {
        state.draft = sug.toLowerCase(); showDraft(); renderLocks(); save();
        toast(t("lock.added1", { x: nameOf(h) + " " + h.toUpperCase(), y: nameOf(sug) + " " + sug.toUpperCase() }));
      }
    }
  }
  function unlock(i) {
    var h = state.locked[i]; state.locked.splice(i, 1);
    relock(t("lock.removed", { x: nameOf(h) + " " + h.toUpperCase() }));
  }
  function renderLocks() {
    var ul = $("lockedList"), n = state.locked.length; ul.textContent = "";
    state.locked.forEach(function (h, i) {
      var rm = el("button", { type: "button", class: "mini", "aria-label": t("lock.remove.aria", { x: nameOf(h) + " " + h.toUpperCase() }), text: "×" });
      rm.addEventListener("click", function () { unlock(i); });
      ul.appendChild(el("li", { class: "locked-item" }, [
        el("span", { class: "locked-sw", "aria-hidden": "true", style: "background:" + h + ";color:" + readableOn(h).c }),
        el("span", { class: "locked-what" }, [el("b", { text: h.toUpperCase() }), el("small", { text: t("lock.n", { i: i + 1 }) + " · " + nameOf(h) })]),
        rm]));
    });
    if (n === 1) {
      // Case vide de la 2e couleur : rappelle qu'on peut en imposer une seconde.
      var slot = el("button", { type: "button", class: "locked-slot" }, [el("span", { class: "slot-sw", "aria-hidden": "true", style: "background:" + state.draft }), el("span", { text: t("lock.slot2") })]);
      slot.addEventListener("click", function () { var pk = $("picker"); try { pk.showPicker(); } catch (e) { pk.click(); } });
      ul.appendChild(el("li", null, [slot]));
    }
    var full = n >= 2, same = state.locked.indexOf(state.draft) >= 0, btn = $("lockBtn");
    btn.disabled = full || same;
    $("lockBtnText").textContent = full ? t("lock.btn.full") : same ? t("lock.btn.same") : n === 1 ? t("lock.btn2") : t("lock.btn");
    var lab = t(n === 1 ? "lock.label2" : "lock.label1"); $("seedLabel").textContent = lab; $("picker").setAttribute("aria-label", lab);
    $("lockedHint").textContent = t("lock.hint" + n);
    $("panel").classList.toggle("has-locks", n > 0);
    var two = $("sizeSeg").querySelector('[data-v="2"]'); two.disabled = full; two.title = full ? t("lock.no2") : "";
  }
  function setPressed(id, v) { $(id).querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === String(v))); }); }

  /* ---------- sources ---------- */
  function renderSources() {
    var box = $("sourceList"); box.textContent = "";
    C.SOURCES.forEach(function (id) {
      var sample = id === "regles" ? C.ruleCombos(state.seed).slice(0, 4).map(function (r) { return r.colors; }) : SRC[id].combos.filter(function (_, i) { return i % Math.max(1, Math.floor(SRC[id].combos.length / 4)) === 0; }).slice(0, 4);
      var b = el("button", { type: "button", class: "source", "aria-pressed": String(state.source === id), "data-v": id }, [
        el("span", { class: "source-sw", "aria-hidden": "true" }, sample.map(function (cs) { return el("span", null, cs.map(function (c) { return el("i", { style: "background:" + c }); })); })),
        el("span", { class: "source-name", text: srcName(id) }),
        el("span", { class: "source-meta", text: t("src." + id + ".meta") }),
        el("span", { class: "source-desc", text: t("src." + id + ".desc") }),
        el("span", { class: "card-foot" }, [el("span", { class: "score", text: t("src.pick", { s: "" }).trim() }), el("span", { class: "arrow", "aria-hidden": "true", text: "→" })])
      ]);
      b.addEventListener("click", function () { var was = state.source; setSource(id); if (was !== id) goSection("suggestions"); });
      box.appendChild(b);
    });
    $("sourceNote").innerHTML = t("src.soon");
    // Sélecteur compact au-dessus des accords : la source se choisit en chemin, sans décision préalable.
    var seg = $("srcSeg"); seg.textContent = "";
    C.SOURCES.forEach(function (id) {
      var b = el("button", { type: "button", "data-v": id, "aria-pressed": String(state.source === id), text: t("src." + id + ".short") });
      b.addEventListener("click", function () { setSource(id); });
      seg.appendChild(b);
    });
  }
  function setSource(id) {
    if (!SRC[id] || id === state.source) return;
    state.source = id; state.sel = 0; state.order = null; state.parts = null; state.wantN = 0;
    applySourceUI(); save(); refresh(); renderDict();
    toast(t("src.pick", { s: srcName(id) }));
  }
  function applySourceUI() {
    setPressed("sourceList", state.source); setPressed("srcSeg", state.source);
    $("dictOpts").hidden = state.source === "regles";
    $("resultsKicker").textContent = t("res.kicker", { s: srcName(state.source) });
  }

  /* ---------- recherche et cartes ---------- */
  function computeAll() {
    var two = twoLocked(), src = state.source, noSize = false, all;
    if (src === "regles") {
      all = (two ? C.ruleCombos2(state.locked[0], state.locked[1]) : C.ruleCombos(state.seed)).map(function (r) { return { n: r.n, colors: r.colors, idx: 0, d: 0, sum: 0 }; });
      var f = all.filter(function (r) { return !state.size || r.colors.length === state.size; });
      if (f.length) all = f; else noSize = true;
      return { all: all, noSize: noSize, two: two };
    }
    // Deux couleurs imposées : seuls les accords de 3 ou 4 couleurs apportent des compagnes.
    var s = SRC[src].search, keep = function (r) { return !two || r.colors.length >= 3; };
    var full = s(state.seed, state.size, two ? state.seed2 : null);
    all = full.filter(keep);
    if (!all.length && state.size) { full = s(state.seed, 0, two ? state.seed2 : null); all = full.filter(keep); noSize = true; }
    return { all: all, full: full, noSize: noSize, two: two };
  }
  function build(r) {
    if (state.source === "regles") return { n: r.n, wada: r.colors, d: 0, two: twoLocked(), fid: "fidele", match: state.seed, colors: r.colors.slice(), rule: true };
    return C.build(r, state.seed, state);
  }
  function refresh() {
    var res = computeAll(), all = res.all;
    state.list = all.slice(0, 12).map(build);
    if (state.wantN) {
      // Accord demandé par un lien, un projet ou le dictionnaire : on l'ajoute s'il n'est pas dans les 12 premiers.
      var j = state.list.findIndex(function (a) { return a.n === state.wantN; });
      // Un ancien lien à deux couleurs peut viser un accord à 2 couleurs (n° 55) : on le rouvre tel quel.
      if (j < 0) { var r = all.find(function (x) { return x.n === state.wantN; }) || (res.full || []).find(function (x) { return x.n === state.wantN; }); if (r) { state.list.push(build(r)); j = state.list.length - 1; } }
      if (j >= 0) {
        state.sel = j; var o = state.wantOrder, len = state.list[j].colors.length;
        state.order = o && o.length === len && o.slice().sort().join() === Object.keys(o).join() ? o : null;
        state.parts = state.wantParts && state.wantParts.length === len ? state.wantParts : null;
      }
      state.wantN = 0; state.wantOrder = null; state.wantParts = null;
    }
    var hint;
    if (state.source === "regles") hint = t(res.two ? "res.rules2" : "res.rules", { n: all.length });
    else { var exact = all.filter(function (r) { return r.d <= 0.06; }).length, pre = res.two ? "res.two." : "res."; hint = t(pre + (exact === 0 ? "none" : exact === 1 ? "one" : "many"), { n: exact }); }
    if (res.noSize) hint = t("res.nosize") + " " + hint;
    if (state.source !== "wada" && state.source !== "regles") hint = hint.replace(/ dans le dictionnaire| in the dictionary/, "");
    if (!all.length) hint = t(res.two && state.source === "kasane" ? "res.kasane2" : "res.empty");
    $("resultHint").textContent = hint;
    $("accord").hidden = $("livrer").hidden = !state.list.length;
    var ul = $("cards"); ul.textContent = "";
    state.list.forEach(function (a, i) {
      var parts = PROPS[a.colors.length], f = a.rule ? t("tag.rule") : t("fid." + a.fid), src = state.source;
      var sw = el("span", { class: "sw" }, a.colors.map(function (c, j) { return el("i", { style: "background:" + c + ";flex:" + parts[j] }); }));
      var e = entryOf(src, a.n), sub = src === "kasane" && e ? e[lang] || e.fr : src === "afrique" && e ? e.g[lang] : "";
      var b = el("button", { type: "button", class: "card" + (src === "kasane" ? " jp" : ""), "aria-pressed": String(i === state.sel),
        "aria-label": (src === "wada" ? t("card.aria", { n: a.n, fid: f }) : t("card.aria.src", { name: longLabel(src, a.n), fid: f })) + ". " + whyText(a.colors) }, [
        sw,
        el("span", { class: "meta" }, [el("span", { class: "num", text: shortLabel(src, a.n) }), el("span", { class: "tag " + (a.rule ? "rule" : a.fid), text: f })]),
        sub ? el("span", { class: "sub", text: sub }) : null,
        el("span", { class: "hexes", text: a.colors.join("  ").toUpperCase() }),
        el("span", { class: "why", text: whyText(a.colors) }),
        el("span", { class: "card-foot" }, [el("span", { class: "score", text: a.rule ? t("tag.rule") : t("card.gap", { d: (a.d * 100).toFixed(1) }) }), el("span", { class: "arrow", "aria-hidden": "true", text: "→" })])
      ].filter(Boolean));
      b.addEventListener("click", function () { state.sel = i; state.order = null; state.parts = null; refreshCards(); renderDetail(); });
      var li = el("li", { class: "card-li" }, [b]);
      hook("card", a, li);
      ul.appendChild(li);
    });
    updateRuleSample();
    renderArt();
    renderDetail();
  }
  // L'aperçu de la carte « Règles » suit la couleur de départ.
  function updateRuleSample() {
    var b = document.querySelector('.source[data-v="regles"] .source-sw'); if (!b) return;
    b.textContent = "";
    C.ruleCombos(state.seed).slice(0, 4).forEach(function (r) { b.appendChild(el("span", null, r.colors.map(function (c) { return el("i", { style: "background:" + c }); }))); });
  }
  function refreshCards() { document.querySelectorAll(".card").forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === state.sel)); }); }

  // Composition de l'en-tête et marque : les couleurs de l'accord en cours, en aplats (à la manière des planches Wada).
  function renderArt() {
    var cur = current(), cs = cur ? cur.colors : [state.seed], art = $("heroArt"); art.textContent = "";
    var pick = function (i) { return cs[i % cs.length]; };
    [["1/1/5/4", 0], ["1/4/3/7", 1], ["3/4/5/6", 2], ["3/6/7/7", 3], ["5/1/7/3", 1], ["5/3/7/6", 0]].forEach(function (b, i) {
      art.appendChild(el("i", { style: "grid-area:" + b[0] + ";background:" + (i === 5 ? shade(pick(0), -0.12) : pick(b[1])) }));
    });
    art.appendChild(el("b", { style: "background:" + pick(2) }));
    var rs = document.documentElement.style; for (var c = 0; c < 4; c++) rs.setProperty("--c" + (c + 1), pick(c));
    ["brandMark", "dockMark"].forEach(function (id) { var mk = $(id).children; for (var i = 0; i < mk.length; i++) mk[i].style.background = pick(i); });
    $("heroCardT").textContent = cur ? (state.source === "wada" ? "Sanzo Wada " + num(cur.a.n) : longLabel(state.source, cur.a.n)) + " — " + cs.map(nameOf).join(", ") : "";
    updateToolbar();
  }

  // Barre de réglages (couleur, source, métier) et bandeau défilant, à la manière d'une barre de filtres.
  function updateToolbar() {
    $("tbSeed").style.background = state.seed; $("tbSeedV").textContent = state.seed.toUpperCase();
    $("tbSrc").textContent = srcName(state.source); $("tbJob").textContent = t("job." + state.scene);
  }
  function renderTicker() {
    var tr = $("ticker"), items = t("ticker").split("|"); tr.textContent = "";
    for (var k = 0; k < 2; k++) items.forEach(function (x) { tr.appendChild(el("span", { text: x })); tr.appendChild(el("i", { text: "✳" })); });
  }
  function current() {
    var a = state.list[state.sel]; if (!a) return null;
    var order = state.order || a.colors.map(function (_, i) { return i; });
    return { a: a, colors: order.map(function (i) { return a.colors[i]; }), order: order };
  }
  // Seuils WCAG 2.2 (1.4.3) sur la valeur non arrondie : 4,5:1 texte courant, 3:1 grand texte, en dessous rien.
  function useShort(r) { var u = C.textUse(r); return u === "body" ? "" : t("use.short." + u); }
  function textOn(r) { return t("text.on", { c: t(r.c === "#ffffff" ? "white" : "black"), r: C.ratioText(r.r) }) + useShort(r.r); }
  function gapText(a) { return a.rule ? "" : a.two ? t("detail.gaps", { a: (a.d1 * 100).toFixed(1), b: (a.d2 * 100).toFixed(1) }) : t("detail.gap", { d: (a.d * 100).toFixed(1) }); }

  // Fidélité à la référence : original ou adapté, couleur d'origine remplacée, et méthode de l'écart.
  function hexName(h) { return nameOf(h) + " " + h.toUpperCase(); }
  function renderFid(a, src) {
    var box = $("detailFid"), kind = C.kindOf(a), ref = t(src === "wada" ? "fidref.wada" : "fidref.src", { s: srcName(src) }), bits = [];
    box.textContent = "";
    if (kind === "rule") { box.appendChild(el("span", { text: t("fid.rule") })); return; }
    var pairs = [[state.seed, a.match, a.two ? a.d1 : a.d]]; if (a.two) pairs.push([state.seed2, a.match2, a.d2]);
    box.appendChild(el("b", { class: "fid-kind " + kind, text: t("fidkind." + kind) }));
    pairs.forEach(function (p) {
      var same = p[0].toLowerCase() === p[1].toLowerCase(), g = (p[2] * 100).toFixed(1);
      var line = el("span", { class: "fid-line" }, [
        el("i", { class: "fid-sw", style: "background:" + p[0], "aria-hidden": "true" }), el("span", { text: hexName(p[0]) }),
        el("span", { class: "fid-arrow", "aria-hidden": "true", text: same ? "=" : "↔" }),
        el("i", { class: "fid-sw", style: "background:" + p[1], "aria-hidden": "true" }), el("span", { text: hexName(p[1]) }),
        el("small", { text: same ? t("fid.same", { ref: ref }) : t(state.substitute ? "fid.replaces" : "fid.nearest", { ref: ref, g: g }) })]);
      bits.push(line);
    });
    bits.forEach(function (b) { box.appendChild(b); });
    var tail = [t(kind === "adapte" ? (state.transpose ? "fid.tr" : "fid.others") : "fid.exact", { ref: ref })];
    tail.push(t("fid.method"));
    box.appendChild(el("span", { class: "fid-method", text: tail.join(" ") }));
  }
  // Proportions réglables : un curseur par couleur, les autres s'ajustent (somme 100). Gardées dans le lien (p=) et le projet.
  function partsNow(n) { return C.partsOf(n, state.parts); }
  // Justification courte d'un accord suggéré : uniquement des mesures (voir C.whyOf).
  function whyText(cs) {
    var w = C.whyOf(cs, state.locked), bits = [t("why.contrast." + w.use, { r: w.r }), w.close ? t("why.close", { a: nameOf(w.close[0]), b: nameOf(w.close[1]) }) : t("why.distinct")];
    if (w.locked) bits.push(t(w.kept === w.locked ? "why.kept" : "why.notkept", { n: w.locked }));
    return bits.join(" · ");
  }
  function renderParts(cs, parts, roles) {
    var box = $("parts"), sig = cs.join() + "|" + lang;
    $("partsReset").disabled = !state.parts;
    if (box.dataset.sig === sig) { [].forEach.call(box.querySelectorAll("input"), function (inp, i) { inp.value = parts[i]; inp.nextSibling.textContent = parts[i] + " %"; }); return; }
    box.dataset.sig = sig; box.textContent = "";
    cs.forEach(function (c, i) {
      var id = "part" + i, inp = el("input", { type: "range", id: id, min: "5", max: String(100 - 5 * (cs.length - 1)), step: "1", value: String(parts[i]) });
      inp.addEventListener("input", function () {
        var p = C.setPart(partsNow(cs.length), i, +inp.value);
        state.parts = C.sameParts(p, C.PROPS[cs.length]) ? null : p;
        var k = inProject(); renderDetail(); if (k >= 0) { var it = project().items[k]; it.hash = snapshot().hash; persist(); }
      });
      box.appendChild(el("div", { class: "part" }, [
        el("label", { for: id }, [el("i", { class: "vdot", style: "background:" + c, "aria-hidden": "true" }), document.createTextNode(roles[i])]),
        inp, el("output", { for: id, text: parts[i] + " %" })]));
    });
  }
  function renderDetail() {
    var cur = current(); if (!cur) return;
    var a = cur.a, cs = cur.colors, parts = partsNow(cs.length), src = state.source, f = t("fid." + a.fid);
    $("detailLabel").textContent = src === "wada" ? t("detail.label", { n: a.n, fid: f }) + gapText(a)
      : a.rule ? t("detail.rule", { s: srcName(src) }) : t("detail.src", { s: srcName(src), fid: f }) + gapText(a);
    $("detailTitle").textContent = src === "wada" ? cs.map(nameOf).join(" · ") : longLabel(src, a.n);
    var e = entryOf(src, a.n);
    $("detailSource").textContent = src === "wada" ? "" : (e ? e.g[lang] + " · " : "") + cs.map(nameOf).join(" · ");
    renderFid(a, src);
    renderParts(cs, parts, rolesFor(src, cs.length));
    var big = $("bigsw"); big.textContent = "";
    cs.forEach(function (c, i) { var s = sim(c), r = readableOn(s); big.appendChild(el("div", { style: "background:" + s + ";color:" + r.c + ";flex:" + parts[i] }, [document.createTextNode(parts[i] + " %")])); });
    var roles = rolesFor(src, cs.length);
    var rows = $("rows"); rows.textContent = "";
    cs.forEach(function (c, i) {
      var lc = c.toLowerCase(), r = readableOn(c), mine = (state.substitute || a.rule) && (lc === state.seed || (a.two && lc === state.seed2)), imposed = state.locked.indexOf(lc) >= 0;
      var copy = el("button", { type: "button", class: "mini", text: t("copy") });
      copy.addEventListener("click", function () { doCopy(c.toUpperCase(), t("copied", { x: c.toUpperCase() })); });
      rows.appendChild(el("div", { class: "row" }, [
        el("span", { class: "dot", style: "background:" + c + ";color:" + r.c, title: t("contrast.title", { r: r.r.toFixed(1) }), text: "Aa" }),
        el("span", { class: "what" }, [el("b", { text: c.toUpperCase() }), document.createTextNode("  " + roles[i] + " · " + parts[i] + " %" + (imposed ? t("yours.locked") : mine ? t("yours") : "")),
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
    renderArt();
    renderScene();
    updateFav(); recordHistory();
    hook("detail", cur);
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

  /* ---------- métiers : mise en situation et analyse ---------- */
  function renderJobs() {
    var box = $("jobList"); box.textContent = "";
    C.FAMILIES.forEach(function (fam) {
      var ids = C.JOB_IDS.filter(function (j) { return C.JOBS[j].f === fam; }), lab2 = "fam-" + fam;
      var g = el("div", { class: "jobfam", role: "group", "aria-labelledby": lab2 }, [el("p", { class: "label", id: lab2, text: t("fam." + fam) })]);
      var row = el("div", { class: "jobrow" });
      ids.forEach(function (j) {
        var b = el("button", { type: "button", class: "job", "data-v": j, "aria-pressed": String(state.scene === j), title: t("job." + j + ".d"), text: t("job." + j) });
        b.addEventListener("click", function () { state.scene = j; save(); setPressed("jobList", j); renderScene(); });
        row.appendChild(b);
      });
      g.appendChild(row); box.appendChild(g);
    });
  }
  // Variables d'une analyse → texte : un hex devient « nom HEX », une liste de hex est jointe.
  function fmtVars(v) {
    var o = {};
    Object.keys(v).forEach(function (k) {
      var x = v[k];
      if (Array.isArray(x)) o[k] = x.map(function (h) { return nameOf(h) + " " + h.toUpperCase(); }).join(", ");
      else if (typeof x === "string" && /^#[0-9a-f]{6}$/.test(x)) o[k] = nameOf(x) + " " + x.toUpperCase();
      else o[k] = x;
    });
    return o;
  }
  var TYPE_PREFIX = { harmony: "harm.", temp: "temp.", contrastlvl: "cl." };
  function checkText(c) {
    var v = fmtVars(c.v);
    if (TYPE_PREFIX[c.k]) v.type = t(TYPE_PREFIX[c.k] + c.v.type);
    if (c.k === "cvd" && c.v.t) v.t = t("cvd." + c.v.t);
    if (c.k === "text" && c.lv === "warn") { v.use = t("use." + c.v.use); v.adj = c.v.adj ? t("chk.text.adj", { a: v.adj }) : ""; }
    return t("chk." + (/^light/.test(c.k) ? "light" : c.k) + "." + c.lv, v);
  }
  function jobLines(cs) { return C.jobChecks(state.scene, cs).map(function (c) { return { lv: c.lv, text: checkText(c) }; }); }
  function sceneSvg(cs, n) {
    return SCENES.render(state.scene, cs, { aria: t("scene.aria", { j: t("job." + state.scene) }), label: shortLabel(state.source, n), webTitle: t("scene.web.title") });
  }
  function renderScene() {
    var cur = current(); if (!cur) return;
    $("jobDesc").textContent = t("job." + state.scene + ".d");
    $("scene").innerHTML = sceneSvg(cur.colors.map(sim), cur.a.n);
    $("sceneHint").textContent = t("scene." + state.scene);
    updateToolbar();
    var ul = $("impact"); ul.textContent = "";
    jobLines(cur.colors).forEach(function (l) { ul.appendChild(el("li", { class: "chk " + l.lv }, [el("span", { class: "ico", "aria-hidden": "true", text: l.lv === "ok" ? "✓" : l.lv === "warn" ? "!" : "i" }), el("span", { text: l.text })])); });
    ul.appendChild(el("li", { class: "chk note", text: t("chk.approx") }));
    renderSimNotes(cur.colors);
    updateLink();
    hook("scene", cur);
  }

  /* ---------- copies et exports ---------- */
  function exportMeta() {
    var cur = current(), n = cur.a.n, src = state.source;
    if (src === "wada") return n;
    return { key: src + "-" + n, title: srcName(src) + " · " + longLabel(src, n), prefix: src, note: t("exp.note.src") };
  }
  function exportText(kind) {
    var cur = current(), cs = cur.colors, parts = partsNow(cs.length), n = cur.a.n, src = state.source;
    if (kind === "hex") return cs.map(function (c) { return c.toUpperCase(); }).join(", ");
    if (kind === "prompt") return src === "wada" ? t("exp.prompt", { k: cs.length, list: cs.join(", "), n: n, p: parts.join("/") }) : t("exp.prompt.src", { k: cs.length, list: cs.join(", "), s: srcName(src), name: longLabel(src, n), p: parts.join("/") });
    if (kind === "link") return shareUrl();
    if (kind === "table") {
      var roles = rolesFor(src, cs.length);
      return t("table.head") + "\n" +
        cs.map(function (c, i) { var v = values(c); return [roles[i], parts[i], v.hex, v.rgb, v.hsl, v.oklch, v.cmjn, v.lrv, nameOf(c)].join("\t"); }).join("\n") +
        "\n\n" + (src === "wada" ? t("table.note", { n: n }) : t("table.note.src", { s: srcName(src), name: longLabel(src, n) }));
    }
    var names = slugsOf(cs.length), pre = src === "wada" ? "wada" : src;
    return "/* " + (src === "wada" ? "Sanzo Wada " + num(n) : srcName(src) + " · " + longLabel(src, n)) + " — " + parts.join("/") + " */\n:root {\n" + cs.map(function (c, i) { return "  --" + pre + "-" + names[i] + ": " + c + ";"; }).join("\n") + "\n}";
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
  $("partsReset").addEventListener("click", function () { state.parts = null; var k = inProject(); renderDetail(); if (k >= 0) { project().items[k].hash = snapshot().hash; persist(); } });
  $("rotate").addEventListener("click", function () { var cur = current(); if (!cur) return; var o = cur.order.slice(); o.push(o.shift()); state.order = o; toast(t("dominant", { x: nameOf(cur.a.colors[o[0]]) })); renderDetail(); });

  /* ---------- planche client : A4 paysage, 300 dpi (dessinée en unités de 1754 × 1240, puis ×2) ---------- */
  var SHEET = { w: 1754, h: 1240, scale: 2, m: 72, bg: "#f4f4f2", ink: "#1b1b19", muted: "#5d5d58", line: "#d9d9d5" };
  var FONT = { display: '"Bricolage Grotesque", "Shippori Mincho", "Segoe UI", sans-serif', body: '"Plus Jakarta Sans", "Segoe UI", sans-serif', mono: '"IBM Plex Mono", Consolas, monospace' };
  // Mise en situation en <img> (data URL) : aucune insertion de HTML, même avec des couleurs venues d'un projet.
  function svgSrc(svg) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')); }
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
  // Texte sur maxLines lignes au plus, la dernière coupée par « … ».
  function wrapMax(ctx, text, x, y, maxW, lh, maxLines) {
    var words = String(text).split(/\s+/), lines = [], line = "";
    words.forEach(function (w) { var s2 = line ? line + " " + w : w; if (ctx.measureText(s2).width > maxW && line) { lines.push(line); line = w; } else line = s2; });
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = fitText(ctx, lines[maxLines - 1] + " …", maxW); }
    lines.forEach(function (l, i) { ctx.fillText(l, x, y + i * lh); });
    return y + lines.length * lh;
  }
  function fitText(ctx, text, maxW) { if (ctx.measureText(text).width <= maxW) return text; while (text.length > 4 && ctx.measureText(text + "…").width > maxW) text = text.slice(0, -1); return text + "…"; }
  function sheetHead(a) {
    var src = state.source, f = t("fid." + a.fid), tr = state.transpose && !a.rule ? t(src === "wada" ? "sheet.transposed" : "sheet.transposed.src") : "";
    if (src === "wada") return t("sheet.head", { n: a.n, fid: f }) + tr;
    return (a.rule ? t("sheet.head.rule", { s: srcName(src), name: longLabel(src, a.n) }) : t("sheet.head.src", { s: srcName(src), name: longLabel(src, a.n), fid: f })) + tr;
  }
  function makeSheet() {
    var cur = current(), cs = cur.colors, a = cur.a, parts = partsNow(cs.length), roles = rolesFor(state.source, cs.length), S = SHEET;
    var wanted = ["700 40px " + FONT.display, "400 16px " + FONT.body, "700 16px " + FONT.body, "400 14px " + FONT.mono];
    var fontsReady = document.fonts ? Promise.all(wanted.map(function (f) { return document.fonts.load(f).catch(function () {}); })) : Promise.resolve();
    return Promise.all([fontsReady, svgImage(sceneSvg(cs, a.n)).catch(function () { return null; })]).then(function (res) {
      var img = res[1], cv = document.createElement("canvas"); cv.width = S.w * S.scale; cv.height = S.h * S.scale;
      var x = cv.getContext("2d"); x.scale(S.scale, S.scale); x.textBaseline = "top";
      x.fillStyle = S.bg; x.fillRect(0, 0, S.w, S.h);
      var M = S.m, LW = 900, RX = M + LW + 56, RW = S.w - M - RX;

      x.fillStyle = S.muted; x.font = "700 14px " + FONT.body; if ("letterSpacing" in x) x.letterSpacing = "2px";
      x.fillText(fitText(x, sheetHead(a).toUpperCase(), S.w - 2 * M), M, M);
      if ("letterSpacing" in x) x.letterSpacing = "0px";
      var title = state.source === "wada" ? cs.map(nameOf).join(" · ") : longLabel(state.source, a.n), size = 54;
      do { x.font = "700 " + size + "px " + FONT.display; size -= 2; } while (x.measureText(title).width > S.w - 2 * M && size > 26);
      x.fillStyle = S.ink; x.fillText(title, M, M + 36);
      var ST = window.ChromaStudio, studio = ST ? ST.get() : {}, logo = ST ? ST.logo() : null;
      if (logo) { var lh = 64, lw = Math.min(260, logo.width * lh / logo.height); x.drawImage(logo, S.w - M - lw, M - 8, lw, lh); }
      else if (studio.name) { x.font = "800 22px " + FONT.display; x.fillStyle = S.ink; var sw2 = x.measureText(studio.name).width; x.fillText(studio.name, S.w - M - sw2, M); }
      var intent = ST ? ST.intent() : "";
      if (intent) { x.fillStyle = S.muted; x.font = "italic 400 15px " + FONT.body; wrapMax(x, intent, M, M + 98, S.w - 2 * M, 20, 2); }

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
        x.fillStyle = S.ink; x.font = "700 18px " + FONT.body; x.fillText(fitText(x, roles[i] + " · " + parts[i] + " %" + (state.locked.indexOf(c.toLowerCase()) >= 0 ? t("sheet.locked") : ""), maxW), cx, y); y += 26;
        x.fillStyle = S.muted; x.font = "400 16px " + FONT.body; x.fillText(fitText(x, nameOf(c), maxW), cx, y); y += 34;
        [["HEX", v.hex], ["RGB", v.rgb], ["HSL", v.hsl], ["OKLCH", v.oklch], [t("cmyk"), v.cmjn], ["LRV ≈", v.lrv]].forEach(function (r) {
          x.font = "400 13px " + FONT.mono; x.fillStyle = S.muted; x.fillText(r[0], cx, y);
          x.font = "400 17px " + FONT.mono; x.fillStyle = S.ink; x.fillText(fitText(x, r[1], maxW), cx, y + 17); y += 46;
        });
      });

      // Mise en situation et analyse pour le métier choisi
      var sh = RW * 340 / 480;
      if (img) x.drawImage(img, RX, top, RW, sh);
      x.strokeStyle = S.line; x.strokeRect(RX + 0.5, top + 0.5, RW - 1, sh - 1);
      x.fillStyle = S.ink; x.font = "700 15px " + FONT.body;
      var hy = wrapText(x, t("sheet.job", { j: t("job." + state.scene) }), RX, top + sh + 16, RW, 22);
      x.fillStyle = S.muted; x.font = "400 14px " + FONT.body;
      hy = wrapText(x, t("scene." + state.scene), RX, hy + 2, RW, 20);
      var rd = readableOn(cs[0]);
      hy = wrapText(x, t("sheet.legible", { c: t(rd.c === "#ffffff" ? "white" : "black"), r: C.ratioText(rd.r), t: useShort(rd.r) }), RX, hy + 6, RW, 20);
      jobLines(cs).forEach(function (l) { if (hy < S.h - M - 110) hy = wrapText(x, (l.lv === "ok" ? "✓ " : l.lv === "warn" ? "! " : "· ") + l.text, RX, hy + 6, RW, 20); });

      // Pied de planche
      var fy = S.h - M - 78;
      x.fillStyle = S.line; x.fillRect(M, fy, S.w - 2 * M, 1);
      x.fillStyle = S.muted; x.font = "400 13px " + FONT.body;
      x.fillText(fitText(x, t(state.source === "wada" ? "sheet.foot" : "sheet.foot.src"), S.w - 2 * M), M, fy + 14);
      x.font = "400 12px " + FONT.mono;
      var date = new Date().toLocaleDateString(t("locale")), pj = project(), who = [pj.client ? t("sheet.client", { c: pj.client }) : "", pj.name].filter(Boolean).join(" · ");
      var right = [studio.name, studio.contact].filter(Boolean).join(" · "), rw = right ? x.measureText(right).width : 0;
      x.fillText(fitText(x, t("sheet.date", { d: date }) + (who ? " · " + who : ""), S.w - 2 * M - rw - 40), M, fy + 38);
      if (right) x.fillText(right, S.w - M - rw, fy + 38);
      x.fillStyle = S.muted; x.font = "400 11px " + FONT.body;
      x.fillText(fitText(x, t("sheet.credit") + " · " + shareUrl(), S.w - 2 * M), M, fy + 60);
      return cv;
    });
  }
  function fileBase() { var cur = current(); return "accord-" + state.source + "-" + cur.a.n; }
  $("sheetPng").addEventListener("click", function () {
    var base = fileBase(); toast(t("sheet.preparing"));
    makeSheet().then(function (cv) {
      cv.toBlob(function (b) {
        if (!b) { toast(t("sheet.fail")); return; }
        download(base + ".png", b, "image/png");
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
  seg("sizeSeg", "size", function () { state.sel = 0; state.order = null; state.parts = null; refresh(); });
  seg("lightSeg", "light", renderDetail);
  seg("visionSeg", "vision", renderDetail);
  seg("dictSeg", "dictSize", renderDict);
  $("langSeg").querySelectorAll("button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.v === lang) return;
      lang = b.dataset.v; try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
      var cur = current(); if (cur) { state.wantN = cur.a.n; state.wantOrder = state.order; state.wantParts = state.parts; }  // garder l'accord affiché
      toast(""); applyLang();
    });
  });

  /* ---------- saisie couleur ---------- */
  $("picker").addEventListener("input", function (e) { setSeed(e.target.value); });
  $("hex").addEventListener("input", function (e) { var v = parseHex(e.target.value); if (v) setSeed(v); else e.target.setAttribute("aria-invalid", "true"); });
  $("hex").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); lockDraft(); } });
  $("lockBtn").addEventListener("click", lockDraft);
  $("substitute").addEventListener("change", function (e) { state.substitute = e.target.checked; refresh(); });
  $("transpose").addEventListener("change", function (e) { state.transpose = e.target.checked; refresh(); });

  /* ---------- image : extraction des couleurs (k-moyennes en OKLab) ---------- */
  var canvas = $("canvas"), ctx = canvas.getContext("2d", { willReadFrequently: true }), imgClusters = [];
  function pickFromImage(hex, chip) { setSeed(hex); if (chip) chip.classList.add("on"); }
  function markChip(cluster, cls) { var i = imgClusters.indexOf(cluster), ch = $("chips").children[i]; if (ch) ch.classList.add(cls); }
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
    setSeed(lead.hex); markChip(lead, "on");
    toast(t("img.one", { a: nameOf(lead.hex) }));
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

  /* ---------- répertoire de la source choisie ---------- */
  function renderDict() {
    var g = $("dictGrid"), src = state.source, rules = src === "regles"; g.textContent = "";
    $("dictKicker").textContent = src === "wada" ? t("dict.kicker.wada") : rules ? srcName(src) : t("dict.kicker.src", { k: SRC[src].combos.length });
    $("dictTitle").textContent = t("dict.title", { s: srcName(src) });
    $("dictNote").innerHTML = rules ? t("dict.rules") + " " + t("src.regles.note") : t("src." + src + ".note");
    $("dictPages").hidden = src !== "wada"; $("dictSeg").hidden = rules;
    if (rules) return;
    SRC[src].combos.forEach(function (c, i) {
      if (state.dictSize && c.length !== state.dictSize) return;
      var n = i + 1, aria = src === "wada" ? t("dict.aria", { n: n, list: c.join(", ") }) : t("dict.aria.src", { name: longLabel(src, n), list: c.join(", ") });
      var b = el("button", { type: "button", "aria-label": aria }, [
        el("span", { class: "sw" }, c.map(function (x) { return el("i", { style: "background:" + x }); })), el("span", { text: shortLabel(src, n) })]);
      b.addEventListener("click", function () {
        state.wantN = n;
        if (state.locked.length) refresh(); else setSeed(c[0]);  // les couleurs imposées restent
        $("accord").scrollIntoView({ behavior: smooth() });
      });
      g.appendChild(el("li", src === "wada" ? null : { class: "wide" }, [b]));
    });
  }

  /* ---------- exports logiciels ---------- */
  function download(name, data, type) {
    var b = data instanceof Blob ? data : new Blob([data], { type: type || "text/plain;charset=utf-8" }), u = URL.createObjectURL(b), l = el("a", { href: u, download: name });
    document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  function exportItems() {
    var cs = current().colors, roles = rolesFor(state.source, cs.length), slugs = slugsOf(cs.length), parts = partsNow(cs.length);
    return cs.map(function (c, i) { return { hex: c.toLowerCase(), role: roles[i], slug: slugs[i], pct: parts[i], name: nameOf(c) }; });
  }
  document.querySelectorAll("[data-export]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-export"), meta = exportMeta(), items = exportItems(), base = fileBase();
      if (k === "ase") download(base + ".ase", C.aseBytes(C.metaOf(meta, lang).title, items), "application/octet-stream");
      if (k === "tokens") download(base + ".tokens.json", C.tokensText(meta, items, lang), "application/json");
      if (k === "tailwind") download(base + ".tailwind.css", C.tailwindText(meta, items, lang), "text/css");
      if (k === "gpl") download(base + ".gpl", C.gplText(meta, items, lang));
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
  function updateFav() { var on = String(inProject() >= 0); $("fav").setAttribute("aria-pressed", on); $("dockFav").setAttribute("aria-pressed", on); }
  $("dockFav").addEventListener("click", function () { $("fav").click(); });
  // Fond neutre : préférence d'affichage mémorisée (pas dans le lien).
  // Mode Simple / Expert : n'affiche que l'essentiel ; ne touche ni au projet, ni aux couleurs, ni au lien (CSS seulement).
  var MODE_KEY = "accords-wada-mode";
  function setMode(m, say) {
    document.documentElement.classList.toggle("simple", m === "simple"); setPressed("modeSeg", m);
    try { localStorage.setItem(MODE_KEY, m); } catch (e) {}
    if (say) toast(t("mode." + m));
  }
  (function () {
    var m = null; try { m = localStorage.getItem(MODE_KEY); } catch (e) {}
    if (m !== "simple" && m !== "expert") m = saved || store.projects.some(function (p) { return p.items.length; }) ? "expert" : "simple";  // nouveau visiteur : Simple
    setMode(m);
  })();
  $("modeSeg").querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { setMode(b.dataset.v, true); }); });
  var CALM_KEY = "accords-wada-calme";
  function setCalm(on) { document.documentElement.classList.toggle("calm", on); $("dockCalm").setAttribute("aria-pressed", String(on)); try { localStorage.setItem(CALM_KEY, on ? "1" : "0"); } catch (e) {} }
  try { if (localStorage.getItem(CALM_KEY) === "1") setCalm(true); } catch (e) {}
  $("dockCalm").addEventListener("click", function () { setCalm(!document.documentElement.classList.contains("calm")); });
  // Apparition des sections au défilement
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (s) { io.observe(s); });
  } else document.querySelectorAll(".reveal").forEach(function (s) { s.classList.add("in"); });
  $("dockSheet").addEventListener("click", function () { $("sheetPng").click(); });
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
    $("accord").scrollIntoView({ behavior: smooth() });
  }
  function itemLabel(it) { var k = readHash(it.hash), src = k ? k.source : "wada"; return src === "wada" ? num(it.n) : srcName(src) + " · " + shortLabel(src, it.n, !!(k && k.seed2)); }
  function accordItem(it, opts) {
    var ik = readHash(it.hash), parts = C.partsOf(it.colors.length, ik && ik.parts), label = itemLabel(it);
    var open = el("button", { type: "button", class: "saved-open", "aria-label": t("proj.open", { n: label, list: it.colors.join(", ") }) }, [
      el("span", { class: "sw" }, it.colors.map(function (c, j) { return el("i", { style: "background:" + c + ";flex:" + (parts[j] || 1) }); })),
      el("span", { class: "num", text: label })]);
    open.addEventListener("click", function () { openHash(it.hash); });
    var kids = [open];
    if (opts.note) {
      var note = el("input", { class: "textin", type: "text", maxlength: "160", placeholder: t("proj.note"), "aria-label": t("proj.note.aria", { n: label }) });
      note.value = it.note || "";
      note.addEventListener("change", function () { it.note = note.value.trim(); persist(); });
      kids.push(note);
    }
    if (opts.remove) { var rm = el("button", { type: "button", class: "mini", text: t("proj.remove"), "aria-label": t("proj.remove.aria", { n: label }) }); rm.addEventListener("click", opts.remove); kids.push(rm); }
    var li = el("li", { class: "saved-item" + (it.piste ? " has-piste" : "") }, kids);
    if (opts.note) hook("item", it, li, label);
    return li;
  }
  function renderProjects() {
    var sel = $("projSel"), p = project(); sel.textContent = "";
    store.projects.forEach(function (q) { var o = el("option", { value: q.id, text: q.name + " (" + q.items.length + ")" }); if (q.id === p.id) o.selected = true; sel.appendChild(o); });
    $("projName").value = p.name; $("projClient").value = p.client || "";
    var ul = $("saved"); ul.textContent = "";
    p.items.forEach(function (it, i) { ul.appendChild(accordItem(it, { note: true, remove: function () { p.items.splice(i, 1); persist(); renderProjects(); updateFav(); } })); });
    $("savedHint").textContent = (p.items.length ? "" : t("proj.empty")) + (storeOk ? "" : t("proj.nostore"));
    hook("projects", p);
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
    else { var s = snapshot(); s.note = ""; s.added = new Date().toISOString(); var ST = window.ChromaStudio; s.intent = ST ? ST.edited(s.hash) : ""; p.items.unshift(s); toast(t("proj.in", { p: p.name })); }
    persist(); updateFav(); renderProjects();
  });
  $("projSel").addEventListener("change", function (e) { store.current = e.target.value; persist(); renderProjects(); updateFav(); });
  $("projName").addEventListener("change", function (e) {
    var v = e.target.value.trim(); if (!v) { e.target.value = project().name; return; }
    project().name = v.slice(0, 60); persist(); renderProjects();
  });
  $("projClient").addEventListener("change", function (e) { project().client = e.target.value.trim().slice(0, 80); persist(); });
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
    download(slug(p.name) + ".chromatheque.json", JSON.stringify({ format: "accords-wada-projet", version: 1, name: p.name, client: p.client || "", exported: new Date().toISOString(), items: p.items }, null, 2) + "\n", "application/json");
    toast(t("proj.exported", { p: p.name }));
  });
  $("projImport").addEventListener("change", function (e) {
    var f = e.target.files[0]; e.target.value = ""; if (!f) return;
    f.text().then(function (txt) {
      var d = JSON.parse(txt); if (!d || d.format !== "accords-wada-projet") throw new Error("format");
      var items = C.cleanItems(d.items).map(function (it) { delete it.source; return it; }); if (!items.length) throw new Error("vide");
      var name = typeof d.name === "string" && d.name.trim() ? d.name.trim().slice(0, 60) : t("proj.importname");
      if (store.projects.some(function (q) { return q.name === name; })) name = (name + " (import)").slice(0, 60);
      var id = newId(); store.projects.push({ id: id, name: name, client: typeof d.client === "string" ? d.client.trim().slice(0, 80) : "", items: items }); store.current = id;
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
    renderTicker(); renderSources(); renderJobs(); applySourceUI();
    renderDict(); renderProjects(); renderHistory();
    showDraft(); renderLocks(); sync(); applyAccent(); refresh();
    hook("lang");
  }
  function start() {
    $("substitute").checked = state.substitute; $("transpose").checked = state.transpose;
    setPressed("sizeSeg", state.size);
    applyLang();  // setSeed → refresh() sélectionne l'accord demandé par le lien (state.wantN)
  }
  // Lien collé dans un onglet déjà ouvert, ou accord rouvert depuis un projet
  window.addEventListener("hashchange", function () {
    var h = location.hash, sec = C.sectionOf(h, SECTIONS), k = readHash(h);
    if (/^#[pr]=/.test(h)) return;
    section = sec;
    if (k && h !== stateHash() && h !== shareHash()) { takeLink(k); document.querySelectorAll(".chip.on").forEach(function (c) { c.classList.remove("on"); }); start(); }
    else if (!k && sec) updateLink();
    if (sec) goSection(sec);
  });
  // Informations d'un accord gardé (dossier, vue client) : libellés, fidélité, analyses du métier de son lien.
  function itemInfo(it) {
    var k = readHash(it.hash) || {}, src = SRC[k.source] ? k.source : "wada", two = !!k.seed2, cs = it.colors, scene = k.scene || "interieur", fid = "";
    if (src === "regles") fid = t("tag.rule");
    else { var r = k.seed ? SRC[src].search(k.seed, 0, k.seed2 || null).find(function (x) { return x.n === it.n; }) : null; if (r) fid = t("fid." + C.fid(r.d)); }
    var e = entryOf(src, it.n);
    return { hash: it.hash, n: it.n, src: src, two: two, colors: cs, scene: scene, seed: k.seed, srcName: srcName(src), fid: fid,
      title: src === "wada" ? "Sanzo Wada " + num(it.n) : longLabel(src, it.n, two), group: e ? e.g[lang] : "", roles: rolesFor(src, cs.length), parts: C.partsOf(cs.length, k.parts),
      checks: C.jobChecks(scene, cs).map(function (c) { return { lv: c.lv, text: checkText(c) }; }), piste: it.piste || "", intent: it.intent || "" };
  }
  window.ChromaApp = {
    C: C, t: t, lang: function () { return lang; }, nameOf: nameOf, num: num, el: el, $: $, toast: toast, download: download, doCopy: doCopy,
    svgImage: svgImage, svgSrc: svgSrc, wrapText: wrapText, wrapMax: wrapMax, fitText: fitText, SHEET: SHEET, FONT: FONT, SCENES: SCENES,
    state: state, current: current, shareHash: shareHash, sim: sim, checkText: checkText, itemInfo: itemInfo,
    project: project, itemLabel: itemLabel, store: function () { return store; }, persist: persist, renderProjects: renderProjects, newId: newId, slug: slug,
    // Garder un accord des suggestions (sans l'ouvrir) : même lien que s'il était affiché, ordre par défaut.
    keepAccord: function (a) {
      var p = project(), h = readHash(shareHash()); h.n = a.n; h.order = null; h.lang = null;
      var hash = hashOf(h), key = keyOf(hash), it = p.items.find(function (o) { return keyOf(o.hash) === key; });
      if (!it) { var ST = window.ChromaStudio; it = { hash: hash, n: a.n, colors: a.colors.slice(), note: "", added: new Date().toISOString(), intent: ST ? ST.edited(hash) : "" }; p.items.unshift(it); persist(); updateFav(); }
      return it;
    },
    findAccord: function (a) { var h = readHash(shareHash()); h.n = a.n; h.order = null; var key = keyOf(hashOf(h)); return project().items.find(function (o) { return keyOf(o.hash) === key; }) || null; },
    openHash: openHash,
    keepCurrent: function () {
      var p = project(), i = inProject();
      if (i < 0) { var s = snapshot(), ST = window.ChromaStudio; s.note = ""; s.added = new Date().toISOString(); s.intent = ST ? ST.edited(s.hash) : ""; p.items.unshift(s); i = 0; persist(); updateFav(); }
      return p.items[i];
    },
    currentItem: function () { var i = inProject(); return i < 0 ? null : project().items[i]; },
    currentInfo: function () { var cur = current(); if (!cur) return null; var h = shareHash(), i = itemInfo({ hash: h, n: cur.a.n, colors: cur.colors }); i.fid = cur.a.rule ? t("tag.rule") : t("fid." + cur.a.fid); return i; }
  };
  EXT.forEach(function (x) { if (x.init) x.init(window.ChromaApp); });
  start();
  // Lien vers une section (#metier ou go=metier) : y aller une fois la page dessinée.
  if (section) {
    // Deux passages : tout de suite, puis une fois les polices chargées (la mise en page bouge) — sauf si l'utilisateur a déjà défilé.
    var goNow = section, moved = false, mark = function () { moved = true; };
    ["wheel", "touchstart", "keydown"].forEach(function (k) { window.addEventListener(k, mark, { once: true, passive: true }); });
    setTimeout(function () { goSection(goNow, "instant"); }, 60);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(function () { if (!moved && section === goNow) goSection(goNow, "instant"); }, 120); });
  }
})();
