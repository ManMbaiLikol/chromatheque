/* La Chromathèque de Man Mbaï Likol — mises en situation vectorielles, une par métier (window.WadaScenes).
   Dessins originaux MML (aucun modèle tiers). Chaque scène : SVG 480 × 340, couleurs de l'accord dans l'ordre
   des proportions (A dominante, B secondaire, Cc accent, D complément). Fonctions pures : dans Node, require. */
(function (root, factory) {
  var api = factory(root.WadaCore || (typeof require === "function" ? require("./core.js") : null));
  if (typeof module === "object" && module.exports) module.exports = api; else root.WadaScenes = api;
})(typeof self !== "undefined" ? self : this, function (C) {
  "use strict";
  var N = { bg: "#e7e6e2", floor: "#d6d5d0", line: "#c4c3bd", dark: "#1d1d1b", glass: "#dfe3e4", grey: "#9a9993", paper: "#fbfbf9" };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sh(c, d) { return C.shade(c, d); }
  function ink(bg) { return C.readableOn(bg).c; }
  // Couleur de l'accord la plus lisible sur bg (≥ 3:1), sinon blanc ou noir.
  function title(bg, cs) { var b = cs.filter(function (c) { return c !== bg; }).map(function (c) { return [c, C.contrast(c, bg)]; }).sort(function (x, y) { return y[1] - x[1]; })[0]; return b && b[1] >= 3 ? b[0] : ink(bg); }
  function r(x, y, w, h, f, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"' + (extra || "") + "/>"; }
  function ci(x, y, rr, f, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + rr + '" fill="' + f + '"' + (extra || "") + "/>"; }
  function p(d, f, extra) { return '<path d="' + d + '" fill="' + f + '"' + (extra || "") + "/>"; }
  function tx(x, y, s, size, f, font, extra) { return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + f + '" font-family="' + (font || "Plus Jakarta Sans, sans-serif") + '"' + (extra || "") + ">" + esc(s) + "</text>"; }
  var SERIF = "Fraunces, Shippori Mincho, Georgia, serif", MONO = "IBM Plex Mono, monospace";
  function lines(x, y, w, n, f, gap) { var o = ""; for (var i = 0; i < n; i++) o += r(x, y + i * (gap || 9), i === n - 1 ? w * 0.6 : w, 4, f, ' rx="2" opacity=".75"'); return o; }

  var DRAW = {
    // Identité visuelle : affiche, cartes de visite, pastille
    graphisme: function (A, B, Cc, D, cs, o) {
      var tt = title(A, cs);
      return r(0, 0, 480, 340, N.bg) +
        r(36, 28, 176, 250, A, ' rx="3"') + ci(124, 112, 58, B) + r(150, 140, 52, 52, Cc) +
        tx(54, 232, "配色", 34, tt, SERIF, ' font-weight="700"') + tx(54, 256, o.label, 12, tt, MONO) +
        '<g transform="rotate(-7 330 110)">' + r(238, 58, 180, 104, B, ' rx="4"') + ci(276, 98, 18, Cc) + lines(304, 90, 90, 3, ink(B)) + "</g>" +
        '<g transform="rotate(4 350 190)">' + r(258, 140, 180, 104, N.paper, ' rx="4"') + ci(292, 178, 14, A) + r(300, 182, 14, 14, Cc) + lines(322, 172, 92, 3, N.grey) + lines(276, 214, 120, 2, N.line) + "</g>" +
        ci(402, 284, 36, Cc) + tx(402, 289, "MML", 13, ink(Cc), MONO, ' text-anchor="middle" font-weight="500"') +
        cs.map(function (c, i) { return ci(254 + i * 30, 300, 11, c, ' stroke="' + N.line + '"'); }).join("");
    },
    // Motion design : image vidéo, bandeau de titrage, timeline
    motion: function (A, B, Cc, D) {
      var tk = "";
      for (var i = 0; i < 22; i++) tk += r(36 + i * 19, 240, 1, i % 5 ? 5 : 10, "#5a5a55");
      return r(0, 0, 480, 340, N.dark) + r(30, 20, 420, 200, A, ' rx="4"') +
        ci(250, 100, 20, B, ' opacity=".2"') + ci(290, 100, 26, B, ' opacity=".45"') + ci(340, 100, 34, B) + p("M300 160 l40 -24 l40 24 z", D) +
        r(52, 168, 200, 30, Cc, ' rx="3"') + r(64, 177, 120, 5, ink(Cc), ' opacity=".9"') + r(64, 186, 70, 4, ink(Cc), ' opacity=".6"') +
        tk + r(36, 260, 200, 14, B, ' rx="3"') + r(120, 280, 230, 14, Cc, ' rx="3"') + r(60, 300, 150, 14, D, ' rx="3"') + r(250, 300, 180, 14, A, ' rx="3"') +
        r(196, 234, 2, 92, "#ffffff") + p("M190 232 h14 l-7 8 z", "#ffffff");
    },
    // Direction artistique : planche de tendance
    da: function (A, B, Cc, D, cs, o) {
      var tape = function (x, y, a) { return '<rect x="' + x + '" y="' + y + '" width="46" height="14" fill="#ffffff" opacity=".55" transform="rotate(' + a + " " + (x + 23) + " " + (y + 7) + ')"/>'; };
      return r(0, 0, 480, 340, N.bg) + r(24, 24, 220, 292, A) + tx(44, 150, "Aa", 92, title(A, cs), SERIF, ' font-weight="700"') + lines(46, 200, 150, 3, title(A, cs), 12) + tx(46, 290, o.label, 12, ink(A), MONO) +
        r(256, 24, 200, 140, B) + '<clipPath id="daClip"><rect x="256" y="24" width="200" height="140"/></clipPath><g clip-path="url(#daClip)">' + ci(400, 170, 90, Cc) + ci(400, 170, 50, D) + "</g>" +
        r(256, 176, 96, 140, D) + p("M256 316 Q304 220 352 316 Z", Cc) + r(364, 176, 92, 140, sh(B, -0.12)) + lines(376, 200, 66, 4, ink(sh(B, -0.12)), 12) +
        tape(30, 16, -8) + tape(330, 16, 6) + tape(286, 168, -4);
    },
    // Packaging : boîte en perspective, flacon, linéaire
    packaging: function (A, B, Cc, D) {
      return r(0, 0, 480, 340, N.bg) + r(0, 282, 480, 58, N.floor) + r(0, 280, 480, 4, N.line) +
        p("M70 92 L120 66 L272 66 L222 92 Z", sh(A, 0.08)) + r(70, 92, 152, 190, A) + p("M222 92 L272 66 L272 256 L222 282 Z", sh(A, -0.12)) +
        r(70, 150, 152, 64, B) + p("M222 150 L272 124 L272 188 L222 214 Z", sh(B, -0.12)) + tx(146, 188, "WADA", 22, ink(B), "Bricolage Grotesque, sans-serif", ' text-anchor="middle" font-weight="700"') +
        ci(146, 120, 14, Cc) + r(90, 236, 112, 4, ink(A), ' opacity=".5"') + r(90, 246, 70, 4, ink(A), ' opacity=".5"') +
        r(316, 82, 44, 26, Cc, ' rx="5"') + r(324, 106, 28, 30, sh(B, -0.08)) + r(300, 132, 76, 150, B, ' rx="20"') + r(300, 180, 76, 62, D) + ci(338, 211, 12, Cc) +
        r(396, 210, 56, 72, D, ' rx="6"') + r(396, 210, 56, 18, Cc, ' rx="6"') + r(404, 240, 40, 4, ink(D), ' opacity=".6"');
    },
    // UX : parcours en trois écrans
    ux: function (A, B, Cc, D) {
      var phone = function (x, step) {
        return r(x, 56, 104, 184, N.dark, ' rx="14"') + r(x + 6, 64, 92, 168, A, ' rx="9"') + r(x + 16, 78, 52, 6, ink(A), ' opacity=".7" rx="3"') +
          r(x + 16, 94, 72, step === 1 ? 60 : 36, B, ' rx="6"') + lines(x + 16, step === 1 ? 166 : 142, 70, 3, ink(A)) + r(x + 16, 200, 72, 20, Cc, ' rx="10"') + r(x + 34, 208, 36, 4, ink(Cc), ' rx="2"');
      };
      var arrow = function (x) { return '<path d="M' + x + ' 148 h26" stroke="' + Cc + '" stroke-width="3" fill="none"/>' + p("M" + (x + 26) + " 142 l9 6 l-9 6 z", Cc); };
      return r(0, 0, 480, 340, "#eeeeeb") + phone(30, 0) + phone(188, 1) + phone(346, 2) + arrow(140) + arrow(298) +
        r(30, 268, 420, 2, N.line) + [0, 1, 2].map(function (i) { return ci(82 + i * 158, 269, 9, i === 1 ? Cc : B, ' stroke="' + N.dark + '" stroke-width="1.5"'); }).join("") +
        '<g transform="rotate(-4 420 40)">' + r(388, 14, 64, 40, D) + lines(396, 24, 46, 2, ink(D)) + "</g>";
    },
    // UI : écran d'application et composants
    ui: function (A, B, Cc, D) {
      var tA = ink(A), tB = ink(B);
      return r(0, 0, 480, 340, N.bg) + r(166, 12, 150, 316, N.dark, ' rx="24"') + r(174, 22, 134, 296, A, ' rx="17"') +
        r(186, 40, 58, 7, tA, ' rx="3"') + ci(292, 44, 9, D) + r(186, 62, 110, 86, B, ' rx="12"') +
        '<circle cx="222" cy="105" r="22" fill="none" stroke="' + sh(B, -0.15) + '" stroke-width="7"/><path d="M222 83 A22 22 0 0 1 244 105" fill="none" stroke="' + Cc + '" stroke-width="7"/>' +
        lines(254, 92, 32, 3, tB, 11) +
        [0, 1, 2].map(function (i) { var y = 164 + i * 30; return ci(196, y + 8, 8, i === 0 ? Cc : D) + r(212, y + 3, 70, 5, tA, ' rx="2" opacity=".75"') + r(212, y + 11, 44, 4, tA, ' rx="2" opacity=".45"'); }).join("") +
        r(186, 262, 110, 30, Cc, ' rx="15"') + r(221, 275, 40, 5, ink(Cc), ' rx="2"') + r(208, 304, 66, 4, tA, ' rx="2" opacity=".4"') +
        r(28, 56, 112, 58, N.paper, ' rx="10"') + r(44, 74, 44, 22, Cc, ' rx="11"') + ci(77, 85, 8, "#ffffff") + r(98, 80, 30, 5, N.grey, ' rx="2"') +
        r(28, 128, 112, 46, N.paper, ' rx="10"') + r(40, 142, 40, 18, B, ' rx="9"') + r(86, 142, 44, 18, D, ' rx="9"') +
        r(340, 56, 116, 150, N.paper, ' rx="10"') + [A, B, Cc, D].map(function (c, i) { return ci(360, 82 + i * 32, 10, c, ' stroke="' + N.line + '"') + r(378, 78 + i * 32, 60, 5, N.grey, ' rx="2"'); }).join("");
    },
    // Web : page d'accueil dans un navigateur
    web: function (A, B, Cc, D, cs, o) {
      var tt = title(A, cs);
      return r(0, 0, 480, 340, N.bg) + r(20, 18, 440, 304, N.paper, ' rx="10" stroke="' + N.line + '"') + r(20, 18, 440, 26, "#e2e1dc", ' rx="10"') + r(20, 34, 440, 10, "#e2e1dc") +
        ci(36, 31, 4, "#c7c6c0") + ci(50, 31, 4, "#c7c6c0") + ci(64, 31, 4, "#c7c6c0") + r(140, 25, 200, 12, N.paper, ' rx="6"') +
        r(20, 44, 440, 156, A) + r(40, 58, 40, 6, tt, ' rx="3"') + r(330, 58, 110, 6, ink(A), ' rx="3" opacity=".5"') +
        tx(40, 112, o.webTitle, 26, tt, SERIF, ' font-weight="700"') + lines(40, 128, 170, 2, ink(A)) +
        r(40, 160, 96, 26, Cc, ' rx="13"') + r(62, 171, 52, 5, ink(Cc), ' rx="2"') +
        ci(370, 122, 58, B) + r(330, 140, 70, 52, D, ' rx="6"') + ci(404, 92, 12, Cc) +
        [0, 1, 2].map(function (i) { var x = 40 + i * 140; return r(x, 216, 124, 88, "#ffffff", ' rx="8" stroke="' + N.line + '"') + ci(x + 22, 238, 10, [B, Cc, D][i]) + lines(x + 14, 258, 96, 3, N.grey, 10); }).join("");
    },
    // Jeu vidéo : niveau de plateforme
    jeu: function (A, B, Cc, D) {
      return r(0, 0, 480, 340, A) + ci(388, 72, 30, Cc, ' opacity=".9"') +
        p("M0 230 Q80 150 170 210 T340 190 T480 200 V340 H0 Z", sh(B, 0.14)) + p("M0 270 Q120 220 240 262 T480 250 V340 H0 Z", B) + r(0, 300, 480, 40, sh(B, -0.18)) +
        r(70, 210, 90, 16, D, ' rx="3"') + r(70, 210, 90, 5, sh(D, 0.12), ' rx="2"') + r(250, 170, 110, 16, D, ' rx="3"') + r(250, 170, 110, 5, sh(D, 0.12), ' rx="2"') +
        ci(282, 148, 7, Cc) + ci(304, 148, 7, Cc) + ci(326, 148, 7, Cc) +
        r(104, 172, 26, 34, Cc, ' rx="7"') + ci(117, 164, 13, Cc) + ci(122, 162, 3, "#ffffff") + r(108, 204, 7, 8, sh(Cc, -0.2)) + r(120, 204, 7, 8, sh(Cc, -0.2)) +
        r(16, 14, 120, 24, "#000000", ' rx="6" opacity=".25"') + [0, 1, 2].map(function (i) { return p("M" + (30 + i * 24) + " 22 a5 5 0 0 1 8 0 a5 5 0 0 1 8 0 l-8 10 z", Cc); }).join("") +
        r(402, 16, 62, 22, "#000000", ' rx="6" opacity=".25"') + ci(416, 27, 6, Cc) + r(428, 24, 26, 6, "#ffffff", ' rx="3" opacity=".8"');
    },
    // Architecture intérieure : salon contemporain
    interieur: function (A, B, Cc, D) {
      return r(0, 0, 480, 250, A) + r(0, 250, 480, 90, sh(A, -0.24)) +
        p("M300 236 V110 A50 50 0 0 1 400 110 V236 Z", sh(A, -0.06)) + p("M316 236 V116 A34 34 0 0 1 384 116 V236 Z", sh(A, 0.06)) +
        '<path d="M150 0 V58" stroke="' + sh(A, -0.35) + '" stroke-width="2"/>' + p("M122 82 A28 28 0 0 1 178 82 Z", Cc) + r(146, 56, 8, 6, sh(Cc, -0.2)) +
        r(40, 78, 64, 84, N.paper) + r(46, 84, 52, 72, D) + ci(72, 112, 16, Cc) +
        '<ellipse cx="210" cy="300" rx="190" ry="26" fill="' + D + '" opacity=".9"/>' +
        p("M56 236 V196 Q56 170 82 170 H310 Q336 170 336 196 V236 Z", B) + r(48, 206, 296, 40, sh(B, -0.06), ' rx="18"') +
        r(92, 150, 58, 50, Cc, ' rx="14" transform="rotate(-8 121 175)"') + r(232, 152, 58, 48, D, ' rx="14" transform="rotate(7 261 176)"') +
        r(70, 244, 8, 22, sh(B, -0.3)) + r(312, 244, 8, 22, sh(B, -0.3)) +
        ci(420, 218, 24, sh(D, -0.1)) + r(416, 238, 8, 30, sh(D, -0.3)) +
        '<path d="M432 196 q8 -46 -4 -84 M432 196 q26 -40 30 -78 M430 196 q-24 -30 -34 -60" stroke="' + sh(B, -0.2) + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
    },
    // Retail : façade de boutique et vitrine
    retail: function (A, B, Cc, D, cs) {
      var aw = ""; for (var i = 0; i < 10; i++) aw += p("M" + (30 + i * 42) + " 76 h42 v26 a21 14 0 0 1 -42 0 z", i % 2 ? N.paper : B);
      return r(0, 0, 480, 340, N.bg) + r(0, 300, 480, 40, N.floor) + r(30, 24, 420, 278, A) + r(30, 24, 420, 52, sh(A, -0.16)) +
        tx(240, 60, "WADA", 26, title(sh(A, -0.16), cs), SERIF, ' text-anchor="middle" font-weight="700" letter-spacing="6"') + aw +
        r(56, 126, 236, 158, N.glass) + r(56, 126, 236, 158, "none", ' stroke="' + sh(A, -0.3) + '" stroke-width="6"') +
        r(84, 236, 60, 48, D) + r(170, 216, 54, 68, sh(D, -0.1)) + r(96, 196, 36, 40, Cc, ' rx="4"') + ci(197, 196, 22, B) + r(240, 250, 34, 34, Cc) +
        r(320, 126, 104, 176, sh(A, -0.28)) + r(330, 136, 84, 110, N.glass, ' opacity=".7"') + r(400, 214, 6, 26, Cc, ' rx="3"');
    },
    // Scénographie : scène, rideaux, projecteurs
    scenographie: function (A, B, Cc, D) {
      var cur = function (x, dir) { var o = ""; for (var i = 0; i < 4; i++) o += p("M" + (x + dir * i * 18) + " 0 q" + dir * 10 + " 160 0 300 h" + dir * 18 + " q" + dir * -10 + " -150 0 -300 z", i % 2 ? sh(B, -0.12) : B); return o; };
      return r(0, 0, 480, 340, "#121211") + r(70, 20, 340, 250, A) + r(70, 220, 340, 50, sh(A, -0.18)) +
        p("M180 270 V150 A60 60 0 0 1 300 150 V270 Z", D) + p("M200 270 V156 A40 40 0 0 1 280 156 V270 Z", sh(A, -0.1)) +
        r(40, 270, 400, 70, sh(A, -0.4)) + r(150, 262, 180, 10, sh(D, -0.2)) +
        p("M232 270 l6 -52 q2 -12 10 -12 q8 0 10 12 l6 52 z", Cc) + ci(248, 196, 9, Cc) +
        p("M120 0 L60 270 H200 Z", "#ffffff", ' opacity=".09"') + p("M360 0 L280 270 H420 Z", "#ffffff", ' opacity=".09"') +
        cur(0, 1) + cur(480, -1) + r(0, 0, 480, 22, sh(B, -0.2));
    },
    // Design produit : chaise, lampe, enceinte sur socles
    produit: function (A, B, Cc, D) {
      return r(0, 0, 480, 340, N.bg) + r(0, 286, 480, 54, N.floor) + r(30, 250, 130, 36, "#cfcec8") + r(310, 240, 140, 46, "#cfcec8") +
        r(44, 150, 102, 100, A, ' rx="18"') + ci(76, 200, 22, sh(A, -0.12)) + ci(76, 200, 9, sh(A, -0.25)) + ci(122, 176, 10, sh(A, -0.12)) + ci(122, 222, 6, Cc) +
        r(196, 120, 14, 120, sh(B, -0.08), ' rx="7"') + r(196, 186, 92, 20, B, ' rx="8"') + r(206, 206, 6, 80, D) + r(272, 206, 6, 80, D) + r(240, 204, 6, 76, sh(D, -0.15)) +
        r(372, 140, 6, 100, D) + p("M340 140 Q375 86 410 140 Z", Cc) + '<ellipse cx="375" cy="240" rx="26" ry="6" fill="' + D + '"/>' +
        p("M352 140 Q375 150 398 140", "none", ' stroke="' + sh(Cc, 0.2) + '" stroke-width="3"');
    },
    // Design transport : véhicule de profil
    transport: function (A, B, Cc, D) {
      var dash = ""; for (var i = 0; i < 8; i++) dash += r(10 + i * 64, 312, 34, 4, "#d9d8d2");
      return r(0, 0, 480, 340, N.bg) + r(0, 280, 480, 60, "#4a4a47") + dash +
        p("M48 250 Q46 214 86 206 L150 196 Q196 150 262 148 L330 150 Q384 156 420 200 Q452 206 454 236 L452 252 Z", A) +
        p("M168 198 Q206 164 258 162 L264 198 Z", "#2a2d30", ' opacity=".85"') + p("M276 162 L326 164 Q362 172 384 198 L280 198 Z", "#2a2d30", ' opacity=".85"') +
        p("M60 232 L446 226 L446 234 L60 240 Z", Cc) + p("M48 250 L454 248 L452 256 L52 258 Z", sh(A, -0.25)) + r(430, 212, 18, 8, Cc, ' rx="3"') +
        ci(126, 256, 32, N.dark) + ci(126, 256, 18, B) + ci(126, 256, 6, D) + ci(370, 256, 32, N.dark) + ci(370, 256, 18, B) + ci(370, 256, 6, D);
    },
    // Mode : silhouette et portant
    mode: function (A, B, Cc, D) {
      return r(0, 0, 480, 340, N.bg) + r(0, 300, 480, 40, N.floor) +
        ci(170, 44, 20, "#cfcac2") + r(162, 60, 16, 14, "#cfcac2") +
        p("M138 74 H202 L210 200 H130 Z", B) +
        p("M136 196 H204 L198 300 H176 L170 222 L164 300 H142 Z", Cc) + r(140, 296, 28, 10, D, ' rx="4"') + r(172, 296, 28, 10, D, ' rx="4"') +
        p("M128 70 L158 64 L164 286 L104 286 Z", A) + p("M182 64 L212 70 L236 286 L176 286 Z", A) +
        p("M158 64 L172 120 L164 124 Z", sh(A, -0.14)) + p("M182 64 L168 120 L176 124 Z", sh(A, -0.14)) + r(150, 176, 40, 8, sh(A, -0.2)) +
        r(222, 186, 46, 40, D, ' rx="6"') + '<path d="M232 186 q13 -28 26 0" stroke="' + D + '" stroke-width="5" fill="none"/>' +
        '<path d="M300 40 H460 M310 40 V300 M450 40 V300" stroke="#8f8e88" stroke-width="4"/>' +
        '<path d="M340 40 v10 M400 40 v10" stroke="#8f8e88" stroke-width="2"/>' +
        p("M318 52 L362 52 L372 70 L366 160 L314 160 L308 70 Z", B) + p("M376 52 L424 52 L432 70 L428 200 L372 200 L368 70 Z", A) +
        p("M404 52 l6 0 l-2 170 l-6 0 z", Cc);
    },
    // Design textile : coupon à motif, bobines
    textile: function (A, B, Cc, D) {
      var spool = function (x, c) { return r(x, 82, 34, 8, "#cfc9bd", ' rx="2"') + r(x + 3, 90, 28, 64, c) + r(x, 154, 34, 8, "#cfc9bd", ' rx="2"'); };
      return r(0, 0, 480, 340, N.bg) +
        '<defs><pattern id="wadaTex" width="48" height="48" patternUnits="userSpaceOnUse">' + r(0, 0, 48, 48, A) + ci(12, 12, 8, B) + p("M36 28 l8 8 l-8 8 l-8 -8 z", Cc) + r(0, 22, 48, 3, D) + ci(36, 12, 3, D) + "</pattern>" +
        '<linearGradient id="wadaFold" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#000" stop-opacity=".18"/><stop offset=".7" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>' +
        p("M36 34 H320 V270 Q250 300 180 286 Q110 272 36 300 Z", "url(#wadaTex)") + p("M36 34 H320 V270 Q250 300 180 286 Q110 272 36 300 Z", "url(#wadaFold)") +
        spool(350, B) + spool(398, Cc) + spool(350, D).replace(/y="82"/, 'y="182"').replace(/y="90"/, 'y="190"').replace(/y="154"/, 'y="254"') +
        spool(398, A).replace(/y="82"/, 'y="182"').replace(/y="90"/, 'y="190"').replace(/y="154"/, 'y="254"');
    }
  };

  // cs : couleurs de l'accord (2 à 4), opts : { aria, label, webTitle }
  function render(job, cs, opts) {
    var A = cs[0], B = cs[1], Cc = cs[2] || cs[1], D = cs[3] || cs[2] || cs[0], o = opts || {};
    o.label = o.label || ""; o.webTitle = o.webTitle || "Wada";
    return '<svg viewBox="0 0 480 340" role="img" aria-label="' + esc(o.aria || job) + '">' + (DRAW[job] || DRAW.interieur)(A, B, Cc, D, cs, o) + "</svg>";
  }
  return { render: render, JOBS: Object.keys(DRAW) };
});
