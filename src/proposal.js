/* La Chromathèque de Man Mbaï Likol — proposition client : identité du studio, note d'intention, pistes A/B/C,
   dossier de proposition (PDF par l'impression), vue client partagée (#p=…) et réponse du client (#r=…).
   Extension de app.js (window.ChromaExt) : chargée avant lui, initialisée avec son API interne (window.ChromaApp).
   Aucune donnée ne quitte le navigateur : le dossier s'imprime, la proposition et la réponse voyagent dans le lien. */
(function () {
  "use strict";
  var A, C, t, $, el;
  var STUDIO_KEY = "accords-wada-studio", PISTES = ["A", "B", "C"];

  /* ---------- identité du studio et notes d'intention retouchées (localStorage) ---------- */
  function str(v, max) { return typeof v === "string" ? v.trim().slice(0, max) : ""; }
  var studio = (function () {
    try {
      var s = JSON.parse(localStorage.getItem(STUDIO_KEY) || "null");
      if (s && typeof s === "object") {
        var intents = {};
        if (s.intents && typeof s.intents === "object") Object.keys(s.intents).slice(-300).forEach(function (k) { if (typeof s.intents[k] === "string") intents[k.slice(0, 200)] = s.intents[k].slice(0, 1500); });
        return { name: str(s.name, 80), contact: str(s.contact, 120), intents: intents,
          logo: typeof s.logo === "string" && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s.logo) && s.logo.length < 600000 ? s.logo : "" };
      }
    } catch (e) {}
    return { name: "", contact: "", logo: "", intents: {} };
  })();
  function saveStudio() { try { localStorage.setItem(STUDIO_KEY, JSON.stringify(studio)); } catch (e) { if (A) A.toast(t("studio.nostore")); } }
  var logoImg = null;
  function loadLogo() {
    logoImg = null;
    if (!studio.logo) return;
    var i = new Image(); i.onload = function () { logoImg = i; }; i.src = studio.logo;
  }
  loadLogo();

  /* ---------- note d'intention : générée depuis l'accord, retouchable ---------- */
  function intentText(info) {
    var f = C.intentFacts(info.colors, info.scene), cs = info.colors, p = info.parts, L = [];
    var nm = function (i) { return A.nameOf(cs[i]) + " (" + p[i] + " %)"; };
    if (info.src === "wada") L.push(t("intent.src.wada", { n: info.n }));
    else if (info.src === "regles") L.push(t("intent.src.regles", { name: info.title, seed: A.nameOf(cs[0]) }));
    else L.push(t("intent.src." + info.src, { name: info.title, g: info.group }));
    L.push(t("intent.mood", { h: t("harm." + f.harmony), t: t("temp." + f.temp), c: t("cl." + f.contrast) }));
    var roles = t("intent.roles" + cs.length, { a: nm(0), b: nm(1), c: cs[2] ? nm(2) : "", d: cs[3] ? nm(3) : "" });
    L.push(roles.charAt(0).toUpperCase() + roles.slice(1));
    L.push(f.warn.length ? t("intent.job.warn", { j: t("job." + info.scene), n: f.ok, w: A.checkText(f.warn[0]) }) : t("intent.job.ok", { j: t("job." + info.scene), n: f.ok }));
    return L.join(" ");
  }
  function key(hash) { return C.keyOf(hash); }
  function editedFor(hash) { return studio.intents[key(hash)] || ""; }
  function currentIntent() { var i = A && A.currentInfo(); return i ? editedFor(i.hash) || intentText(i) : ""; }
  function itemIntent(it, info) { return it.intent || editedFor(it.hash) || intentText(info); }

  window.ChromaStudio = {
    get: function () { return studio; }, logo: function () { return logoImg; },
    intent: currentIntent, edited: function (hash) { return editedFor(hash); }
  };

  /* ---------- interface : note d'intention et studio ---------- */
  var intentTimer = 0;
  function showIntent() {
    var ta = $("intent"); if (document.activeElement === ta) return;
    var i = A.currentInfo(); if (!i) return;
    var ed = editedFor(i.hash);
    ta.value = ed || intentText(i);
    ta.classList.toggle("edited", !!ed);
  }
  function onIntentInput() {
    var i = A.currentInfo(); if (!i) return;
    var k = key(i.hash), v = $("intent").value.slice(0, 1500);
    studio.intents[k] = v; $("intent").classList.add("edited");
    A.project().items.forEach(function (it) { if (key(it.hash) === k) it.intent = v; });
    clearTimeout(intentTimer); intentTimer = setTimeout(function () { saveStudio(); A.persist(); }, 500);
  }
  function regenIntent() {
    var i = A.currentInfo(); if (!i) return;
    var k = key(i.hash); delete studio.intents[k];
    A.project().items.forEach(function (it) { if (key(it.hash) === k) it.intent = ""; });
    saveStudio(); A.persist(); $("intent").classList.remove("edited"); $("intent").value = intentText(i);
    A.toast(t("intent.regen.done"));
  }
  function showStudio() {
    $("studioName").value = studio.name; $("studioContact").value = studio.contact;
    var img = $("logoImg"); img.hidden = !studio.logo; if (studio.logo) img.src = studio.logo;
    $("logoEmpty").hidden = !!studio.logo; $("logoRemove").hidden = !studio.logo;
  }
  // Logo : redessiné en PNG (240 px de haut au plus) pour être gardé et imprimé sans surprise.
  function readLogo(f) {
    if (!f || !/^image\//.test(f.type)) { A.toast(t("img.notimage")); return; }
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var h = Math.min(240, img.height || 240), w = Math.round((img.width || 240) * h / (img.height || 240));
      if (w > 720) { h = Math.round(h * 720 / w); w = 720; }
      var cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      studio.logo = cv.toDataURL("image/png"); saveStudio(); loadLogo(); showStudio(); A.toast(t("studio.logo.ok"));
    };
    img.onerror = function () { A.toast(t("img.unreadable")); };
    img.src = url;
  }

  /* ---------- pistes A/B/C et statuts dans le projet ---------- */
  function pistes(p) {
    return PISTES.map(function (l) { return p.items.find(function (it) { return it.piste === l; }); }).filter(Boolean);
  }
  function itemControls(it, li, label) {
    var p = A.project(), row = el("div", { class: "item-pro" });
    var ps = el("select", { class: "textin small", "aria-label": t("piste.aria", { n: label }) });
    [["", t("piste.none")]].concat(PISTES.map(function (l) { return [l, t("piste.x", { x: l })]; })).forEach(function (o) {
      var op = el("option", { value: o[0], text: o[1] }); if ((it.piste || "") === o[0]) op.selected = true; ps.appendChild(op);
    });
    ps.addEventListener("change", function () {
      var v = ps.value;
      if (v) p.items.forEach(function (o) { if (o !== it && o.piste === v) o.piste = ""; });  // une lettre par accord
      it.piste = v; A.persist(); A.renderProjects();
    });
    var st = el("select", { class: "textin small status " + (it.status || "none"), "aria-label": t("status.aria", { n: label }) });
    [["", t("status.none")], ["propose", t("status.propose")], ["valide", t("status.valide")], ["refuse", t("status.refuse")]].forEach(function (o) {
      var op = el("option", { value: o[0], text: o[1] }); if ((it.status || "") === o[0]) op.selected = true; st.appendChild(op);
    });
    st.addEventListener("change", function () { it.status = st.value; it.statusDate = st.value ? new Date().toISOString() : ""; A.persist(); A.renderProjects(); });
    row.appendChild(ps); row.appendChild(st);
    if (it.statusDate && it.status) row.appendChild(el("small", { class: "hint", text: new Date(it.statusDate).toLocaleDateString(t("locale")) }));
    if (it.piste) li.insertBefore(el("span", { class: "piste-badge", "aria-hidden": "true", text: it.piste }), li.firstChild);
    li.appendChild(row);
  }
  // Boutons A · B · C sous chaque accord suggéré.
  function cardPistes(a, li) {
    var it = A.findAccord(a), row = el("div", { class: "card-pistes", role: "group", "aria-label": t("cardpistes.aria", { n: a.n }) });
    PISTES.forEach(function (l) {
      var on = !!(it && it.piste === l), b = el("button", { type: "button", class: "cp", "aria-pressed": String(on), title: t("cardpistes.title", { x: l }), text: l });
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var p = A.project(), cur = A.findAccord(a);
        if (cur && cur.piste === l) { cur.piste = ""; A.toast(t("pistebar.off", { x: l })); }
        else {
          cur = A.keepAccord(a);
          p.items.forEach(function (o) { if (o !== cur && o.piste === l) o.piste = ""; });
          cur.piste = l;
          var n = pistes(p).length; A.toast(t(n < 3 ? "cardpistes.added" : "pistebar.full", { x: l, p: p.name, n: n }));
        }
        A.persist(); A.renderProjects(); refreshCardPistes();
      });
      row.appendChild(b);
    });
    li.appendChild(row);
  }
  function refreshCardPistes() {
    var list = A.state.list;
    [].forEach.call(document.querySelectorAll("#cards .card-li"), function (li, i) {
      var a = list[i]; if (!a) return; var it = A.findAccord(a);
      [].forEach.call(li.querySelectorAll(".cp"), function (b) { b.setAttribute("aria-pressed", String(!!(it && it.piste === b.textContent))); });
    });
  }
  // Comparateur : les 3 pistes côte à côte avec leurs impacts pour le métier.
  function renderSlots() {
    var box = $("pisteSlots"), p = A.project(); box.textContent = "";
    PISTES.forEach(function (l) {
      var it = p.items.find(function (o) { return o.piste === l; });
      if (!it) { box.appendChild(el("div", { class: "slot empty" }, [el("span", { class: "piste-badge", "aria-hidden": "true", text: l }), el("p", { class: "hint", text: t("slot.empty", { x: l }) })])); return; }
      var info = A.itemInfo(it), f = C.intentFacts(info.colors, info.scene);
      var open = el("button", { type: "button", class: "mini", text: t("slot.open") }); open.addEventListener("click", function () { A.openHash(it.hash); });
      var rm = el("button", { type: "button", class: "mini", "aria-label": t("slot.remove", { x: l }), text: "×" }); rm.addEventListener("click", function () { it.piste = ""; A.persist(); A.renderProjects(); refreshCardPistes(); });
      box.appendChild(el("article", { class: "slot" }, [
        el("div", { class: "slot-top" }, [el("span", { class: "piste-badge", "aria-hidden": "true", text: l }), el("div", { class: "slot-title" }, [el("b", { text: info.title }), el("small", { text: info.srcName + (info.fid ? " · " + info.fid : "") })]), rm]),
        el("div", { class: "sw" }, info.colors.map(function (c, j) { return el("i", { style: "background:" + c + ";flex:" + info.parts[j], title: c.toUpperCase() }); })),
        // Même métier, même dessin, même cadrage pour les trois pistes : seules les couleurs changent.
        el("img", { class: "slot-scene", style: (function () { var z = A.SCENES.size(info.scene, info.model); return "aspect-ratio:" + z.w + "/" + z.h; })(), alt: t("slot.scene", { x: l, j: t("job." + info.scene) }), src: A.svgSrc(A.SCENES.render(info.scene, info.colors, { aria: "", label: info.title, webTitle: t("scene.web.title"), model: info.model })) }),
        el("dl", { class: "slot-facts" }, [
          el("dt", { text: t("cmp.harmony") }), el("dd", { text: t("harm." + f.harmony) }),
          el("dt", { text: t("cmp.temp") }), el("dd", { text: t("temp." + f.temp) }),
          el("dt", { text: t("cmp.contrast") }), el("dd", { text: t("cl." + f.contrast) })]),
        el("p", { class: "label slot-job", text: t("job." + info.scene) + " · " + t("cmp.checks.v", { ok: f.ok, w: f.warn.length }) }),
        el("ul", { class: "impact compact" }, info.checks.map(function (c) { return el("li", { class: "chk " + c.lv }, [el("span", { class: "ico", "aria-hidden": "true", text: c.lv === "ok" ? "✓" : c.lv === "warn" ? "!" : "i" }), el("span", { text: c.text })]); })),
        open]));
    });
    // Nombre de couleurs différent d'une piste à l'autre : proportions et rôles ne sont pas les mêmes, on le dit.
    var sizes = PISTES.map(function (l) { var it = p.items.find(function (o) { return o.piste === l; }); return it ? it.colors.length : 0; }).filter(Boolean);
    $("pistesDiff").textContent = sizes.some(function (n) { return n !== sizes[0]; }) ? t("slot.diff") : "";
  }
  // Les pistes suivent le métier choisi : leur lien (sc=) est mis à jour, le dossier montre la bonne mise en situation.
  function syncPisteScenes() {
    var p = A.project(), job = A.state.scene, changed = false;
    p.items.forEach(function (it) {
      if (!it.piste) return; var k = C.readHash(it.hash); if (!k || (k.scene === job && k.model === A.state.model)) return;
      k.scene = job; k.model = A.state.model; it.hash = C.hashOf(k); changed = true;
    });
    if (changed) { A.persist(); A.renderProjects(); }
  }
  // Barre « Proposer au client comme A / B / C » sous l'accord affiché.
  function renderPisteBar() {
    var it = A.currentItem(), p = A.project(), mine = it ? it.piste : "";
    [].forEach.call(document.querySelectorAll("#pisteBar .pbtn"), function (b) {
      var l = b.dataset.piste, other = p.items.find(function (o) { return o.piste === l && o !== it; });
      b.textContent = t("piste.x", { x: l }); b.setAttribute("aria-pressed", String(mine === l));
      b.title = other ? t("pistebar.taken", { x: l, n: A.itemLabel(other) }) : "";
      b.classList.toggle("taken", !!other);
    });
    $("pisteBarHint").textContent = mine ? t("pistebar.is", { x: mine, p: p.name }) : t("pistebar.hint", { p: p.name });
  }
  function setPiste(l) {
    var p = A.project(), it = A.currentItem();
    if (it && it.piste === l) { it.piste = ""; A.persist(); A.renderProjects(); renderPisteBar(); A.toast(t("pistebar.off", { x: l })); return; }
    it = A.keepCurrent();
    p.items.forEach(function (o) { if (o !== it && o.piste === l) o.piste = ""; });
    it.piste = l; A.persist(); A.renderProjects(); renderPisteBar();
    var n = pistes(p).length;
    A.toast(t(n < 3 ? "pistebar.added" : "pistebar.full", { x: l, p: p.name, n: n }));
  }
  function goPick() {
    A.toast(t("pitch.none"));
    var bar = $("pistesStrip"); bar.scrollIntoView({ behavior: "smooth", block: "center" });
    bar.classList.remove("flash"); void bar.offsetWidth; bar.classList.add("flash");
  }
  function renderPitch(p) {
    var list = pistes(p), n = list.length;
    $("pitchHint").textContent = n ? t("pitch.ready", { n: n, list: list.map(function (it) { return it.piste; }).join(", ") }) : t("pitch.none");
    var steps = $("pitchSteps"); steps.textContent = "";
    $("dockPistesN").textContent = n + "/3";
    // Chaque étape mène à un seul endroit, par un lien direct.
    [[n > 0, t("pitch.s1"), "pistesStrip", t("pitch.s1.go")], [!!(studio.name || studio.logo), t("pitch.s2"), "livrer", t("pitch.s2.go")], [false, t("pitch.s3"), "", ""]].forEach(function (s) {
      var kids = [el("span", { class: "ico", "aria-hidden": "true", text: s[0] ? "✓" : "" }), el("span", { text: s[1] })];
      if (s[2]) kids.push(el("a", { href: "#" + s[2], class: "step-go", text: s[3] }));
      steps.appendChild(el("li", { class: s[0] ? "done" : "" }, kids));
    });
    var box = $("pitchPistes"); box.textContent = "";
    PISTES.forEach(function (l) {
      var it = p.items.find(function (o) { return o.piste === l; }), parts = it ? C.partsOf(it.colors.length, (C.readHash(it.hash) || {}).parts) : null;
      box.appendChild(el("div", { class: "pitch-slot" + (it ? "" : " empty") }, [
        el("span", { class: "piste-badge", "aria-hidden": "true", text: l }),
        it ? el("span", { class: "sw" }, it.colors.map(function (c, j) { return el("i", { style: "background:" + c + ";flex:" + parts[j] }); })) : el("span", { class: "sw empty-sw" }),
        el("span", { class: "slot-name", text: it ? A.itemLabel(it) : t("pitch.empty", { x: l }) })]));
    });
    renderPisteBar(); renderSlots(); refreshCardPistes();
    var ul = $("responses"); ul.textContent = "";
    (p.responses || []).slice().reverse().forEach(function (r) {
      ul.appendChild(el("li", { class: "response" }, [
        el("b", { text: t("resp.line", { p: r.p, n: r.n || t("resp.anon"), d: r.d ? new Date(r.d).toLocaleDateString(t("locale")) : "" }) }),
        r.c ? el("q", { text: r.c }) : null].filter(Boolean)));
    });
  }

  /* ---------- dossier de proposition : pages A4 paysage dessinées en canvas, imprimées en PDF ---------- */
  function page(S) {
    var cv = document.createElement("canvas"); cv.width = S.w * S.scale; cv.height = S.h * S.scale;
    var x = cv.getContext("2d"); x.scale(S.scale, S.scale); x.textBaseline = "top"; x.fillStyle = S.bg; x.fillRect(0, 0, S.w, S.h);
    return { cv: cv, x: x };
  }
  function footer(x, S, p, i, n) {
    var F = A.FONT, M = S.m, fy = S.h - M - 30;
    x.fillStyle = S.line; x.fillRect(M, fy, S.w - 2 * M, 1);
    x.font = "400 12px " + F.body; x.fillStyle = S.muted;
    var left = [studio.name, studio.contact].filter(Boolean).join(" · ") || t("sheet.credit");
    x.fillText(A.fitText(x, left, 600), M, fy + 12);
    var mid = [p.client ? t("sheet.client", { c: p.client }) : "", p.name].filter(Boolean).join(" · "), mw = x.measureText(mid).width;
    x.fillText(mid, (S.w - mw) / 2, fy + 12);
    var r = t("dossier.page", { i: i, n: n }), rw = x.measureText(r).width; x.fillText(r, S.w - M - rw, fy + 12);
  }
  function band(x, cs, parts, X, Y, W, H, labels) {
    var bx = X;
    cs.forEach(function (c, i) {
      var w = W * parts[i] / 100; x.fillStyle = c; x.fillRect(bx, Y, w, H);
      if (labels) { x.fillStyle = C.readableOn(c).c; x.font = "500 14px " + A.FONT.mono; x.fillText(parts[i] + " %", bx + 10, Y + H - 26); }
      bx += w;
    });
    x.strokeStyle = A.SHEET.line; x.lineWidth = 1; x.strokeRect(X + 0.5, Y + 0.5, W - 1, H - 1);
  }
  function letter(x, l, X, Y, r) {
    x.fillStyle = A.SHEET.ink; x.beginPath(); x.arc(X + r, Y + r, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = A.SHEET.bg; x.font = "800 " + Math.round(r * 1.1) + "px " + A.FONT.display; var w = x.measureText(l).width; x.fillText(l, X + r - w / 2, Y + r * 0.42);
  }
  function coverPage(S, p, infos) {
    var g = page(S), x = g.x, F = A.FONT, M = S.m;
    if (logoImg) { var lh = 90, lw = Math.min(360, logoImg.width * lh / logoImg.height); x.drawImage(logoImg, M, M, lw, lh); }
    else if (studio.name) { x.fillStyle = S.ink; x.font = "800 34px " + F.display; x.fillText(studio.name, M, M + 20); }
    x.fillStyle = S.muted; x.font = "700 16px " + F.body; if ("letterSpacing" in x) x.letterSpacing = "3px";
    x.fillText(t("dossier.kicker").toUpperCase(), M, 300); if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = S.ink; var size = 92; do { x.font = "800 " + size + "px " + F.display; size -= 4; } while (x.measureText(p.name).width > S.w - 2 * M && size > 40);
    x.fillText(p.name, M, 336);
    x.fillStyle = S.muted; x.font = "italic 400 34px " + F.body;
    x.fillText(A.fitText(x, p.client ? t("dossier.for", { c: p.client }) : t("dossier.title"), S.w - 2 * M), M, 460);
    x.font = "400 18px " + F.body; x.fillText(new Date().toLocaleDateString(t("locale"), { year: "numeric", month: "long", day: "numeric" }) + " · " + t("dossier.count", { n: infos.length }), M, 520);
    var W = (S.w - 2 * M - 40 * (infos.length - 1)) / infos.length;
    infos.forEach(function (info, i) {
      var X = M + i * (W + 40), Y = 640;
      band(x, info.colors, info.parts, X, Y, W, 300, false);
      letter(x, info.piste, X, Y + 324, 24);
      x.fillStyle = S.ink; x.font = "700 20px " + F.display; x.fillText(A.fitText(x, info.title, W - 70), X + 64, Y + 332);
      x.fillStyle = S.muted; x.font = "400 14px " + F.body; x.fillText(A.fitText(x, info.srcName + (info.fid ? " · " + info.fid : ""), W - 70), X + 64, Y + 360);
    });
    return g.cv;
  }
  function pistePage(S, p, info, img) {
    var g = page(S), x = g.x, F = A.FONT, M = S.m, LW = 900, RX = M + LW + 56, RW = S.w - M - RX, cs = info.colors;
    letter(x, info.piste, M, M - 6, 30);
    x.fillStyle = S.muted; x.font = "700 13px " + F.body; if ("letterSpacing" in x) x.letterSpacing = "2px";
    x.fillText(A.fitText(x, (t("piste.x", { x: info.piste }) + " · " + info.srcName + (info.fid ? " · " + info.fid : "")).toUpperCase(), S.w - 2 * M - 80), M + 80, M);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.fillStyle = S.ink; var size = 46; do { x.font = "800 " + size + "px " + F.display; size -= 2; } while (x.measureText(info.title).width > S.w - 2 * M - 80 && size > 24);
    x.fillText(info.title, M + 80, M + 22);
    band(x, cs, info.parts, M, 190, LW, 280, true);
    x.fillStyle = S.ink; x.font = "700 15px " + F.body; x.fillText(t("dossier.intent"), M, 500);
    x.fillStyle = S.ink; x.font = "400 17px " + F.body;
    var y = A.wrapMax(x, info.intent, M, 526, LW, 25, 9) + 18;
    var colW = LW / cs.length;
    cs.forEach(function (c, i) {
      var cx = M + colW * i, v = C.values(c), yy = Math.max(y, 790), mw = colW - 16;
      x.fillStyle = c; x.fillRect(cx, yy, 44, 44); x.strokeStyle = S.line; x.strokeRect(cx + 0.5, yy + 0.5, 43, 43);
      x.fillStyle = S.ink; x.font = "700 15px " + F.body; x.fillText(A.fitText(x, info.roles[i] + " · " + info.parts[i] + " %", mw), cx, yy + 56);
      x.fillStyle = S.muted; x.font = "400 14px " + F.body; x.fillText(A.fitText(x, A.nameOf(c), mw), cx, yy + 78);
      x.font = "400 14px " + F.mono; x.fillStyle = S.ink;
      [v.hex, "CMJN ≈ " + v.cmjn, "LRV ≈ " + v.lrv].forEach(function (s2, j) { x.fillText(A.fitText(x, s2, mw), cx, yy + 104 + j * 22); });
    });
    var sz = A.SCENES.size(info.scene, info.model), sh = RW * sz.h / sz.w;
    if (img) x.drawImage(img, RX, 190, RW, sh);
    x.strokeStyle = S.line; x.strokeRect(RX + 0.5, 190.5, RW - 1, sh - 1);
    x.fillStyle = S.ink; x.font = "700 15px " + F.body;
    var hy = A.wrapText(x, t("sheet.job", { j: t("job." + info.scene) }), RX, 190 + sh + 18, RW, 22);
    x.font = "400 14px " + F.body;
    info.checks.forEach(function (l) { if (hy < S.h - S.m - 80) { x.fillStyle = l.lv === "warn" ? S.ink : S.muted; hy = A.wrapText(x, (l.lv === "ok" ? "✓ " : l.lv === "warn" ? "! " : "· ") + l.text, RX, hy + 6, RW, 20); } });
    return g.cv;
  }
  function comparePage(S, p, infos, scenes) {
    var g = page(S), x = g.x, F = A.FONT, M = S.m;
    x.fillStyle = S.ink; x.font = "800 46px " + F.display; x.fillText(t("dossier.compare"), M, M);
    var W = (S.w - 2 * M - 40 * (infos.length - 1)) / infos.length;
    infos.forEach(function (info, i) {
      var X = M + i * (W + 40), Y = 170, f = C.intentFacts(info.colors, info.scene);
      letter(x, info.piste, X, Y, 22);
      x.fillStyle = S.ink; x.font = "700 20px " + F.display; x.fillText(A.fitText(x, info.title, W - 60), X + 58, Y + 8);
      band(x, info.colors, info.parts, X, Y + 64, W, 110, false);
      var sz = A.SCENES.size(info.scene, info.model), sh = Math.round(W * sz.h / sz.w), img = scenes && scenes[i];
      if (img) x.drawImage(img, X, Y + 194, W, sh); else { x.fillStyle = S.line; x.fillRect(X, Y + 194, W, sh); }
      var rows = [[t("cmp.source"), info.srcName + (info.fid ? " · " + info.fid : "")], [t("cmp.harmony"), t("harm." + f.harmony)], [t("cmp.temp"), t("temp." + f.temp)],
        [t("cmp.contrast"), t("cl." + f.contrast)], [t("cmp.checks"), t("cmp.checks.v", { ok: f.ok, w: f.warn.length })]];
      var yy = Y + 194 + sh + 34;
      rows.forEach(function (r) {
        x.fillStyle = S.muted; x.font = "700 13px " + F.body; x.fillText(r[0].toUpperCase(), X, yy);
        x.fillStyle = S.ink; x.font = "400 18px " + F.body; yy = A.wrapMax(x, r[1], X, yy + 20, W, 24, 2) + 14;
      });
      if (f.warn.length) { x.fillStyle = S.ink; x.font = "400 14px " + F.body; A.wrapMax(x, "! " + A.checkText(f.warn[0]), X, yy + 4, W, 20, 4); }
    });
    return g.cv;
  }
  function valuesPage(S, p, infos) {
    var g = page(S), x = g.x, F = A.FONT, M = S.m, cols = [0, 70, 300, 420, 620, 840, 1080, 1280], heads = ["", t("vals.role"), "HEX", "RGB", t("cmyk"), "LRV ≈", "OKLCH", ""];
    x.fillStyle = S.ink; x.font = "800 46px " + F.display; x.fillText(t("dossier.values"), M, M);
    x.fillStyle = S.muted; x.font = "400 14px " + F.body; x.fillText(A.fitText(x, t("dossier.values.note"), S.w - 2 * M), M, M + 64);
    var y = 190;
    x.font = "700 12px " + F.body; heads.forEach(function (h, i) { x.fillText(h.toUpperCase(), M + cols[i], y); }); y += 28;
    infos.forEach(function (info) {
      x.fillStyle = S.line; x.fillRect(M, y, S.w - 2 * M, 1); y += 12;
      letter(x, info.piste, M, y, 16); x.fillStyle = S.ink; x.font = "700 16px " + F.display; x.fillText(A.fitText(x, info.title, 600), M + cols[1], y + 6); y += 44;
      info.colors.forEach(function (c, i) {
        var v = C.values(c);
        x.fillStyle = c; x.fillRect(M + 8, y, 28, 28); x.strokeStyle = S.line; x.strokeRect(M + 8.5, y + 0.5, 27, 27);
        x.fillStyle = S.ink; x.font = "400 15px " + F.body; x.fillText(A.fitText(x, info.roles[i] + " " + info.parts[i] + " % · " + A.nameOf(c), 220), M + cols[1], y + 6);
        x.font = "400 15px " + F.mono; [v.hex, v.rgb, v.cmjn, v.lrv, v.oklch].forEach(function (s2, j) { x.fillText(s2, M + cols[j + 2], y + 6); });
        y += 38;
      });
      y += 8;
    });
    return g.cv;
  }
  function approvalPage(S, p, infos) {
    var g = page(S), x = g.x, F = A.FONT, M = S.m;
    x.fillStyle = S.ink; x.font = "800 46px " + F.display; x.fillText(t("dossier.approval"), M, M);
    x.fillStyle = S.muted; x.font = "400 17px " + F.body; A.wrapText(x, t("dossier.approval.txt", { p: p.name }), M, M + 70, 1100, 26);
    var y = 260;
    infos.forEach(function (info) {
      x.strokeStyle = S.ink; x.lineWidth = 2; x.strokeRect(M, y, 30, 30); x.lineWidth = 1;
      band(x, info.colors, info.parts, M + 56, y, 180, 30, false);
      x.fillStyle = S.ink; x.font = "700 20px " + F.display; x.fillText(A.fitText(x, t("piste.x", { x: info.piste }) + " — " + info.title, 1100), M + 260, y + 3);
      y += 64;
    });
    y += 20; x.fillStyle = S.ink; x.font = "700 15px " + F.body; x.fillText(t("dossier.remarks"), M, y); y += 34;
    x.fillStyle = S.line; for (var i = 0; i < 4; i++) { x.fillRect(M, y + i * 42, S.w - 2 * M, 1); }
    y += 4 * 42 + 50;
    var colW = (S.w - 2 * M - 80) / 3;
    [t("dossier.date"), t("dossier.sign.client"), t("dossier.sign.studio")].forEach(function (lab, j) {
      var X = M + j * (colW + 40); x.fillStyle = S.muted; x.font = "700 13px " + F.body; x.fillText(lab.toUpperCase(), X, y);
      x.fillStyle = S.line; x.fillRect(X, y + 110, colW, 1);
    });
    x.fillStyle = S.muted; x.font = "400 12px " + F.body; x.fillText(A.fitText(x, t("sheet.foot.src"), S.w - 2 * M), M, S.h - M - 60);
    return g.cv;
  }
  function buildDossier() {
    var p = A.project(), list = pistes(p), S = A.SHEET;
    if (!list.length) { A.toast(t("pitch.none")); return Promise.reject(); }
    var infos = list.map(function (it) { var info = A.itemInfo(it); info.intent = itemIntent(it, info); return info; });
    var wanted = ["800 40px " + A.FONT.display, "400 16px " + A.FONT.body, "700 16px " + A.FONT.body, "italic 400 16px " + A.FONT.body, "400 14px " + A.FONT.mono];
    var fonts = document.fonts ? Promise.all(wanted.map(function (f) { return document.fonts.load(f).catch(function () {}); })) : Promise.resolve();
    var imgs = infos.map(function (info) {
      return A.svgImage(A.SCENES.render(info.scene, info.colors, { aria: "", label: info.title, webTitle: t("scene.web.title"), model: info.model })).catch(function () { return null; });
    });
    return Promise.all([fonts].concat(imgs)).then(function (res) {
      var pages = [coverPage(S, p, infos)].concat(infos.map(function (info, i) { return pistePage(S, p, info, res[i + 1]); }));
      if (infos.length > 1) pages.push(comparePage(S, p, infos, res.slice(1)));
      pages.push(valuesPage(S, p, infos), approvalPage(S, p, infos));
      pages.forEach(function (cv, i) {
        var x = cv.getContext("2d"); x.setTransform(S.scale, 0, 0, S.scale, 0, 0); x.textBaseline = "top";
        if (i > 0) footer(x, S, p, i + 1, pages.length);
      });
      return pages;
    });
  }
  function printDossier() {
    A.toast(t("dossier.preparing"));
    buildDossier().then(function (pages) {
      var box = $("printPages"); box.textContent = "";
      var loaded = 0;
      pages.forEach(function (cv) {
        var img = el("img", { alt: "" });
        img.onload = function () { if (++loaded === pages.length) { document.documentElement.classList.add("has-pages"); A.toast(t("dossier.ready", { n: pages.length })); window.print(); } };
        img.src = cv.toDataURL("image/png"); box.appendChild(img);
      });
      // Statut « proposé » pour les pistes qui n'en ont pas encore.
      pistes(A.project()).forEach(function (it) { if (!it.status) { it.status = "propose"; it.statusDate = new Date().toISOString(); } });
      A.persist(); A.renderProjects();
    }).catch(function (e) { if (e) A.toast(t("sheet.printfail")); });
  }
  window.addEventListener("afterprint", function () { document.documentElement.classList.remove("has-pages"); $("printPages").textContent = ""; });

  /* ---------- vue client : la proposition voyage dans le lien ---------- */
  function clientLink() {
    var p = A.project(), list = pistes(p);
    if (!list.length) { A.toast(t("pitch.none")); return; }
    if (!p.proposalId) p.proposalId = A.newId();
    var payload = { id: p.proposalId, t: p.name, cl: p.client || "", s: studio.name, m: studio.contact, d: new Date().toISOString().slice(0, 10),
      i: list.map(function (it) { var info = A.itemInfo(it); return { h: it.hash, c: it.colors, p: it.piste, x: itemIntent(it, info) }; }) };
    var url = location.href.split("#")[0] + "#p=" + C.packLink(payload) + (A.lang() === "en" ? "&lg=en" : "");
    list.forEach(function (it) { if (!it.status) { it.status = "propose"; it.statusDate = new Date().toISOString(); } });
    A.persist(); A.renderProjects();
    A.doCopy(url, t(url.length > 7000 ? "clientlink.long" : location.protocol === "file:" ? "clientlink.file" : "clientlink.ok"));
  }
  function parseHashPayload(prefix) {
    var m = new RegExp("^#" + prefix + "=([^&]*)").exec(location.hash); if (!m) return null;
    return C.unpackLink(m[1]);
  }
  function exitPresent() {
    document.documentElement.classList.remove("present");
    $("present").hidden = true; $("present").textContent = "";
  }
  function renderPresent(prop) {
    var box = $("present"); box.textContent = ""; box.hidden = false;
    document.documentElement.classList.add("present");
    var head = el("header", { class: "present-head" }, [
      el("p", { class: "kicker", text: [prop.s, prop.m].filter(Boolean).join(" · ") || t("sheet.credit") }),
      el("h1", { id: "presentTitle", text: prop.t || t("dossier.title") }),
      el("p", { class: "tagline", text: prop.cl ? t("dossier.for", { c: prop.cl }) : t("dossier.title") }),
      el("p", { class: "lede", text: t("present.lede", { n: prop.i.length }) })]);
    box.appendChild(head);
    var grid = el("div", { class: "present-grid" }), choice = { p: "" };
    prop.i.forEach(function (it, i) {
      var info = A.itemInfo({ hash: it.h, n: (C.readHash(it.h) || {}).n, colors: it.c }), l = it.p || PISTES[i];
      var sceneBox = el("div", { class: "scene" }); sceneBox.innerHTML = A.SCENES.render(info.scene, it.c, { aria: t("scene.aria", { j: t("job." + info.scene) }), label: info.title, webTitle: t("scene.web.title"), model: info.model });
      var radio = el("input", { type: "radio", name: "pchoice", value: l, id: "pc-" + l });
      radio.addEventListener("change", function () { choice.p = l; grid.querySelectorAll(".piste-card").forEach(function (c) { c.classList.toggle("chosen", c.dataset.p === l); }); });
      grid.appendChild(el("article", { class: "piste-card", "data-p": l }, [
        el("div", { class: "piste-top" }, [el("span", { class: "piste-badge big", text: l }), el("div", null, [el("p", { class: "label", text: info.srcName + (info.fid ? " · " + info.fid : "") }), el("h2", { text: info.title })])]),
        el("div", { class: "bigsw" }, it.c.map(function (c, j) { return el("div", { style: "background:" + c + ";color:" + C.readableOn(c).c + ";flex:" + info.parts[j] }, [document.createTextNode(info.parts[j] + " %")]); })),
        sceneBox,
        it.x ? el("p", { class: "intent-text", text: it.x }) : null,
        el("ul", { class: "impact" }, info.checks.map(function (c) { return el("li", { class: "chk " + c.lv }, [el("span", { class: "ico", "aria-hidden": "true", text: c.lv === "ok" ? "✓" : c.lv === "warn" ? "!" : "i" }), el("span", { text: c.text })]); })),
        el("p", { class: "hexes", text: it.c.map(function (c, j) { return info.roles[j] + " " + c.toUpperCase(); }).join(" · ") }),
        el("label", { class: "btn choose", for: "pc-" + l }, [radio, document.createTextNode(" " + t("present.choose", { x: l }))])
      ].filter(Boolean)));
    });
    box.appendChild(grid);
    var name = el("input", { class: "textin", id: "respName", maxlength: "80", autocomplete: "name" }), comment = el("textarea", { class: "textin", id: "respComment", rows: "4", maxlength: "800" });
    var out = el("div", { class: "resp-out", hidden: "" }), send = el("button", { class: "btn", type: "button", text: t("present.send") });
    send.addEventListener("click", function () {
      if (!choice.p) { A.toast(t("present.pick")); return; }
      var r = C.cleanResponse({ id: prop.id, p: choice.p, c: comment.value, n: name.value, d: new Date().toISOString() });
      var url = location.href.split("#")[0] + "#r=" + C.packLink(r);
      out.textContent = ""; out.hidden = false;
      var mail = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.exec(prop.m || "");
      out.appendChild(el("p", { text: t("present.done", { x: choice.p }) }));
      var copy = el("button", { class: "btn ghost", type: "button", text: t("present.copy") });
      copy.addEventListener("click", function () { A.doCopy(url, t("present.copied")); });
      var kids = [copy];
      if (mail) kids.unshift(el("a", { class: "btn", href: "mailto:" + mail[0] + "?subject=" + encodeURIComponent(t("present.mail.subject", { p: prop.t })) + "&body=" + encodeURIComponent(t("present.mail.body", { x: choice.p, c: comment.value }) + "\n\n" + url), text: t("present.mail") }));
      out.appendChild(el("div", { class: "actions" }, kids));
      A.doCopy(url, t("present.copied"));
    });
    box.appendChild(el("div", { class: "dcard present-form" }, [
      el("h2", { text: t("present.form") }),
      el("div", { class: "field" }, [el("label", { class: "label", for: "respName", text: t("present.name") }), name]),
      el("div", { class: "field" }, [el("label", { class: "label", for: "respComment", text: t("present.comment") }), comment]),
      el("div", { class: "actions" }, [send]), out]));
    var back = el("a", { class: "more", href: location.href.split("#")[0], text: t("present.tool") });
    box.appendChild(el("p", { class: "note" }, [document.createTextNode(t("present.foot") + " "), back]));
    window.scrollTo(0, 0);
  }
  function applyResponse(r) {
    var proj = A.store().projects.find(function (q) { return q.proposalId && q.proposalId === r.id; });
    var msg = t("resp.toast", { p: r.p, n: r.n || t("resp.anon") });
    if (!proj) { A.toast(msg + " " + t("resp.noproject")); return; }
    proj.responses = (proj.responses || []).concat([r]).slice(-20);
    proj.items.forEach(function (it) { if (it.piste) { it.status = it.piste === r.p ? "valide" : "refuse"; it.statusDate = r.d || new Date().toISOString(); } });
    A.store().current = proj.id; A.persist(); A.renderProjects();
    A.toast(msg);
    setTimeout(function () { $("bibliotheque").scrollIntoView(); }, 300);
  }
  function route() {
    var prop = parseHashPayload("p");
    if (prop) { prop = C.cleanProposal(prop); if (prop) { renderPresent(prop); return; } }
    if (document.documentElement.classList.contains("present")) exitPresent();
    var r = parseHashPayload("r");
    if (r) {
      r = C.cleanResponse(r);
      try { history.replaceState(null, "", A.shareHash()); } catch (e) {}
      if (r) applyResponse(r);
    }
  }

  /* ---------- branchement sur app.js ---------- */
  (window.ChromaExt = window.ChromaExt || []).push({
    init: function (api) {
      A = api; C = api.C; t = api.t; $ = api.$; el = api.el;
      $("intent").addEventListener("input", onIntentInput);
      $("intentRegen").addEventListener("click", regenIntent);
      $("studioName").addEventListener("change", function (e) { studio.name = str(e.target.value, 80); saveStudio(); });
      $("studioContact").addEventListener("change", function (e) { studio.contact = str(e.target.value, 120); saveStudio(); });
      $("logoFile").addEventListener("change", function (e) { readLogo(e.target.files[0]); e.target.value = ""; });
      $("logoRemove").addEventListener("click", function () { studio.logo = ""; saveStudio(); loadLogo(); showStudio(); });
      [].forEach.call(document.querySelectorAll("[data-pitch]"), function (b) {
        b.addEventListener("click", function () {
          if (!pistes(A.project()).length) { goPick(); return; }
          if (b.dataset.pitch === "dossier") printDossier(); else clientLink();
        });
      });
      [].forEach.call(document.querySelectorAll("#pisteBar .pbtn"), function (b) { b.addEventListener("click", function () { setPiste(b.dataset.piste); }); });
      window.addEventListener("hashchange", route);
      showStudio();
      setTimeout(route, 0);  // après le premier rendu de app.js
    },
    detail: function () { showIntent(); renderPisteBar(); },
    scene: function () { showIntent(); syncPisteScenes(); renderSlots(); },
    card: cardPistes,
    item: itemControls,
    projects: renderPitch,
    lang: function () { showStudio(); showIntent(); renderPisteBar(); var prop = parseHashPayload("p"); if (prop && (prop = C.cleanProposal(prop))) renderPresent(prop); }
  });
})();
