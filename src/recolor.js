/* La Chromathèque de Man Mbaï Likol — gamme et recoloration d'une photo client.
   Gamme : 11 paliers par couleur de l'accord (scaleOf dans core.js), copiables en CSS, Tailwind ou tokens.
   Photo : découpée en zones par k-moyennes en OKLab ; chaque zone prend une couleur de l'accord en gardant
   son relief (recolorLab). La photo ne quitte jamais le navigateur. Extension de app.js (window.ChromaExt). */
(function () {
  "use strict";
  var A, C, t, $, el;

  /* ---------- gamme ---------- */
  function scaleItems() {
    var cur = A.current(); if (!cur) return [];
    var slugs = C.slugsOf(cur.colors.length, A.lang());
    return cur.colors.map(function (c, i) { return { slug: slugs[i], hex: c.toLowerCase() }; });
  }
  function prefix() { return A.state.source === "wada" ? "wada" : A.state.source; }
  function renderScales() {
    var box = $("scales"), cur = A.current(); box.textContent = ""; if (!cur) return;
    var roles = C.rolesOf(cur.colors.length, A.lang());
    cur.colors.forEach(function (c, i) {
      var row = el("div", { class: "scale-row", role: "group", "aria-label": roles[i] + " " + c.toUpperCase() }, [el("span", { class: "scale-name", text: roles[i] })]);
      C.scaleOf(c).forEach(function (s) {
        var r = C.readableOn(s.hex), b = el("button", { type: "button", class: "scale-sw" + (s.base ? " base" : ""), style: "background:" + s.hex + ";color:" + r.c,
          title: s.step + " · " + s.hex.toUpperCase() + " · " + t("contrast.title", { r: r.r.toFixed(1) }), "aria-label": s.step + " " + s.hex.toUpperCase() }, [
          el("span", { text: (s.base ? "● " : "") + s.step }), el("small", { text: s.hex.toUpperCase() })]);
        b.addEventListener("click", function () { A.doCopy(s.hex.toUpperCase(), t("copied", { x: s.hex.toUpperCase() })); });
        row.appendChild(b);
      });
      box.appendChild(row);
    });
  }
  function exportScale(kind) {
    var txt = C.scaleText(kind, scaleItems(), prefix()), base = "gamme-" + A.state.source + "-" + A.current().a.n;
    if (kind === "css") { $("out").textContent = txt; A.doCopy(txt, t("scale.copied")); return; }
    if (kind === "tailwind") A.download(base + ".tailwind.css", txt, "text/css");
    if (kind === "tokens") A.download(base + ".tokens.json", txt, "application/json");
    A.toast(t("scale.dl"));
  }

  /* ---------- photo ---------- */
  var LIN = new Float32Array(256); for (var i = 0; i < 256; i++) LIN[i] = 0;  // rempli à l'init (C.lin)
  var ph = null, zones = 0, strength = 0.85, before = false, raf = 0;
  function labOf(r, g, b) {
    var R = LIN[r], G = LIN[g], B = LIN[b];
    var l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  // Distance pour le découpage : la lumière compte moins que la teinte (une même surface a ombres et reflets).
  function d2(L, j, c) { var dl = (L[j] - c[0]) * 0.55, da = L[j + 1] - c[1], db = L[j + 2] - c[2]; return dl * dl + da * da + db * db; }
  function loadPhoto(f) {
    if (!f || !/^image\//.test(f.type)) { A.toast(t("img.notimage")); return; }
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var max = 1000, s = Math.min(1, max / Math.max(img.width, img.height)), w = Math.round(img.width * s), h = Math.round(img.height * s);
      var cv = $("photoCanvas"); cv.width = w; cv.height = h;
      var ctx = cv.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
      var src = ctx.getImageData(0, 0, w, h), n = w * h, L = new Float32Array(n * 3);
      for (var p = 0; p < n; p++) { var o = labOf(src.data[p * 4], src.data[p * 4 + 1], src.data[p * 4 + 2]); L[p * 3] = o[0]; L[p * 3 + 1] = o[1]; L[p * 3 + 2] = o[2]; }
      ph = { w: w, h: h, n: n, src: src, L: L, labels: new Uint8Array(n), means: [], assign: [] };
      $("photoBox").hidden = false;
      setZones(Math.max(2, Math.min(6, A.current() ? A.current().colors.length : 3)));
      A.toast(t("photo.ok"));
    };
    img.onerror = function () { A.toast(t("img.unreadable")); };
    img.src = url;
  }
  function cluster(k) {
    var L = ph.L, n = ph.n, step = Math.max(1, Math.floor(n / 24000)), idx = [];
    for (var p = 0; p < n; p += step) idx.push(p * 3);
    var cent = [[L[idx[idx.length >> 1]], L[idx[idx.length >> 1] + 1], L[idx[idx.length >> 1] + 2]]];
    while (cent.length < k) {  // initialisation par le point le plus éloigné
      var far = -1, pick = idx[0];
      for (var q = 0; q < idx.length; q += 4) { var j = idx[q], dm = Infinity; cent.forEach(function (c) { dm = Math.min(dm, d2(L, j, c)); }); if (dm > far) { far = dm; pick = j; } }
      cent.push([L[pick], L[pick + 1], L[pick + 2]]);
    }
    for (var it = 0; it < 12; it++) {
      var sums = cent.map(function () { return [0, 0, 0, 0]; });
      idx.forEach(function (j) { var b = 0, bd = Infinity; for (var c = 0; c < k; c++) { var d = d2(L, j, cent[c]); if (d < bd) { bd = d; b = c; } } var s = sums[b]; s[0] += L[j]; s[1] += L[j + 1]; s[2] += L[j + 2]; s[3]++; });
      cent = cent.map(function (c, i) { var s = sums[i]; return s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : c; });
    }
    var count = cent.map(function () { return 0; }), sum = cent.map(function () { return [0, 0, 0]; });
    for (var p2 = 0; p2 < n; p2++) {
      var j2 = p2 * 3, b2 = 0, bd2 = Infinity;
      for (var c2 = 0; c2 < k; c2++) { var dd = d2(L, j2, cent[c2]); if (dd < bd2) { bd2 = dd; b2 = c2; } }
      ph.labels[p2] = b2; count[b2]++; sum[b2][0] += L[j2]; sum[b2][1] += L[j2 + 1]; sum[b2][2] += L[j2 + 2];
    }
    ph.means = sum.map(function (s, i) { return count[i] ? [s[0] / count[i], s[1] / count[i], s[2] / count[i]] : cent[i]; });
    ph.count = count;
  }
  // Par défaut, la plus grande zone prend la dominante, la suivante la secondaire, etc. (comme les proportions).
  function defaultAssign() {
    var cs = A.current().colors, order = ph.count.map(function (c, i) { return i; }).sort(function (a, b) { return ph.count[b] - ph.count[a]; });
    ph.assign = []; order.forEach(function (z, r) { ph.assign[z] = r % cs.length; });
  }
  function setZones(k) {
    zones = k; [].forEach.call($("zonesSeg").querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", String(+b.dataset.v === k)); });
    cluster(k); defaultAssign(); render();
  }
  function render() {
    if (!ph) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var cv = $("photoCanvas"), ctx = cv.getContext("2d"), cur = A.current(); if (!cur) return;
      if (before) { ctx.putImageData(ph.src, 0, 0); renderZones(); return; }
      var cs = cur.colors, T = cs.map(function (c) { return C.lab(A.sim(c)); }), out = ctx.createImageData(ph.w, ph.h), L = ph.L, d = out.data, sd = ph.src.data;
      for (var p = 0; p < ph.n; p++) {
        var z = ph.labels[p], j = p * 3, r = C.recolorLab([L[j], L[j + 1], L[j + 2]], ph.means[z], T[ph.assign[z] % cs.length], strength), rgb = C.linFromLab(r);
        d[p * 4] = C.delin(rgb[0]); d[p * 4 + 1] = C.delin(rgb[1]); d[p * 4 + 2] = C.delin(rgb[2]); d[p * 4 + 3] = sd[p * 4 + 3];
      }
      ctx.putImageData(out, 0, 0); renderZones();
    });
  }
  function renderZones() {
    var ul = $("photoZones"), cur = A.current(); ul.textContent = ""; if (!ph || !cur) return;
    var cs = cur.colors, roles = C.rolesOf(cs.length, A.lang()), tot = ph.n;
    ph.means.forEach(function (m, z) {
      var from = C.toHex(C.linFromLab(m).map(C.delin)), to = cs[ph.assign[z] % cs.length];
      var b = el("button", { type: "button", class: "zone", "aria-label": t("photo.zone.aria", { i: z + 1, a: A.nameOf(from), b: roles[ph.assign[z] % cs.length] + " " + to.toUpperCase() }) }, [
        el("span", { class: "zsw", style: "background:" + from }), el("span", { class: "zarrow", "aria-hidden": "true", text: "→" }), el("span", { class: "zsw", style: "background:" + to }),
        el("small", { text: Math.round(ph.count[z] / tot * 100) + " %" })]);
      b.addEventListener("click", function () { cycle(z); });
      ul.appendChild(el("li", null, [b]));
    });
  }
  function cycle(z) { var n = A.current().colors.length; ph.assign[z] = (ph.assign[z] + 1) % n; render(); }

  (window.ChromaExt = window.ChromaExt || []).push({
    init: function (api) {
      A = api; C = api.C; t = api.t; $ = api.$; el = api.el;
      for (var i = 0; i < 256; i++) LIN[i] = C.lin(i);
      [].forEach.call(document.querySelectorAll("[data-scale]"), function (b) { b.addEventListener("click", function () { exportScale(b.getAttribute("data-scale")); }); });
      $("photoFile").addEventListener("change", function (e) { loadPhoto(e.target.files[0]); e.target.value = ""; });
      var drop = $("photoDrop");
      ["dragenter", "dragover"].forEach(function (k) { drop.addEventListener(k, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
      ["dragleave", "drop"].forEach(function (k) { drop.addEventListener(k, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
      drop.addEventListener("drop", function (e) { loadPhoto(e.dataTransfer.files[0]); });
      [].forEach.call($("zonesSeg").querySelectorAll("button"), function (b) { b.addEventListener("click", function () { if (ph) setZones(+b.dataset.v); }); });
      $("photoStrength").addEventListener("input", function (e) { strength = e.target.value / 100; render(); });
      $("photoBefore").addEventListener("click", function (e) { before = !before; e.currentTarget.setAttribute("aria-pressed", String(before)); render(); });
      $("photoReset").addEventListener("click", function () { if (ph) { defaultAssign(); render(); } });
      $("photoClear").addEventListener("click", function () { ph = null; $("photoBox").hidden = true; $("photoZones").textContent = ""; });
      $("photoPng").addEventListener("click", function () {
        if (!ph) return; var cur = A.current();
        $("photoCanvas").toBlob(function (b) { if (b) { A.download("photo-" + A.state.source + "-" + cur.a.n + ".png", b, "image/png"); A.toast(t("photo.dl")); } }, "image/png");
      });
      $("photoCanvas").addEventListener("click", function (e) {
        if (!ph) return; var r = e.currentTarget.getBoundingClientRect();
        var x = Math.min(ph.w - 1, Math.max(0, Math.round((e.clientX - r.left) / r.width * ph.w))), y = Math.min(ph.h - 1, Math.max(0, Math.round((e.clientY - r.top) / r.height * ph.h)));
        cycle(ph.labels[y * ph.w + x]);
      });
    },
    detail: function () { renderScales(); if (ph) { if (ph.assign.some(function (a) { return a >= A.current().colors.length; })) defaultAssign(); render(); } },
    lang: function () { renderScales(); renderZones(); }
  });
})();
