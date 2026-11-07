#!/usr/bin/env node
/* Génère une page HTML statique par combinaison (FR et EN) + les deux index, à partir de data/wada-348.json.
   Les pages sont commitées : l'app reste sans étape de build, ce script ne sert qu'à les régénérer.

     node tools/generate-pages.js
     node tools/generate-pages.js --base=https://exemple.github.io/accords-wada/

   Avec --base (URL publique du site, terminée par /) : liens canoniques, hreflang, sitemap.xml et robots.txt. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const C = require("../src/core.js");

const ROOT = path.join(__dirname, "..");
const arg = process.argv.find((a) => a.startsWith("--base="));
const BASE = arg ? arg.slice(7).replace(/\/?$/, "/") : null;
const COMBOS = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "wada-348.json"), "utf8")).combinaisons.map((c) => c.couleurs);

const T = {
  fr: {
    num: "n° ", home: "La Chromathèque", dict: "Les 348 combinaisons", colors: (k) => k + " couleurs",
    kicker: (k) => "Sanzo Wada · 1933 · " + k + " couleurs",
    title: (n, names) => "Sanzo Wada n° " + n + " · " + names + " · La Chromathèque de Man Mbaï Likol",
    desc: (n, hexes, p) => "Combinaison n° " + n + " du Dictionary of Color Combinations de Sanzo Wada : " + hexes + ". Proportions " + p + ", valeurs RGB, CMJN, LRV et accords voisins.",
    intro: (k, parts) => "Combinaison à " + k + " couleurs du <i>Dictionary of Color Combinations</i>. Proportions conseillées (convention MML) : " + parts + ".",
    caption: "Valeurs pour la fabrication", capHint: "CMJN sans profil ICC et LRV estimé depuis l'écran : à confirmer sur nuancier.",
    col: "Couleur", cmyk: "CMJN ≈",
    legible: (c, r, low) => "Texte lisible sur la dominante : " + c + " " + r + ":1" + (low ? " (titres seulement)" : "") + ".",
    white: "blanc", black: "noir",
    cvdOk: "Daltonisme : toutes les couleurs restent distinctes en protanopie, deutéranopie et tritanopie.",
    cvdWarn: (list) => "Attention au daltonisme : " + list + ".", cvdIn: (v, p) => "en " + v + ", " + p + " se confondent", and: " et ",
    cvd: { protan: "protanopie", deutan: "deutéranopie", tritan: "tritanopie" },
    open: "Ouvrir dans l'outil", openHint: "Mises en situation, planche client, exports Adobe, Figma, Tailwind.",
    also: (name, hex) => "Autres accords avec " + name + " " + hex,
    prev: "Précédent", next: "Suivant",
    note: "Les valeurs hex viennent de la conversion CMJN → HEX de HexPot : ce sont des cibles à vérifier sur ton support réel (tissu, peinture, impression).",
    crumbs: "Fil d'Ariane", other: "English", indexTitle: "Les 348 combinaisons de Sanzo Wada · La Chromathèque de Man Mbaï Likol",
    indexDesc: "Les 348 combinaisons du Dictionary of Color Combinations de Sanzo Wada, avec valeurs, proportions et accords voisins.",
    indexLede: "Chaque fiche donne les valeurs (HEX, RGB, HSL, OKLCH, CMJN, LRV), les proportions et les accords qui partagent une couleur.",
    by: "La Chromathèque de Man Mbaï Likol — Manso Olivier"
  },
  en: {
    num: "No. ", home: "La Chromathèque", dict: "The 348 combinations", colors: (k) => k + " colors",
    kicker: (k) => "Sanzo Wada · 1933 · " + k + " colors",
    title: (n, names) => "Sanzo Wada No. " + n + " · " + names + " · La Chromathèque de Man Mbaï Likol",
    desc: (n, hexes, p) => "Combination No. " + n + " from Sanzo Wada's Dictionary of Color Combinations: " + hexes + ". Proportions " + p + ", RGB, CMYK and LRV values, related combinations.",
    intro: (k, parts) => k + "-color combination from the <i>Dictionary of Color Combinations</i>. Suggested proportions (MML convention): " + parts + ".",
    caption: "Values for production", capHint: "CMYK without ICC profile and LRV estimated from screen: confirm with a physical swatch.",
    col: "Color", cmyk: "CMYK ≈",
    legible: (c, r, low) => "Legible text on the dominant: " + c + " " + r + ":1" + (low ? " (headings only)" : "") + ".",
    white: "white", black: "black",
    cvdOk: "Color blindness: all colors stay distinct with protanopia, deuteranopia and tritanopia.",
    cvdWarn: (list) => "Color blindness warning: " + list + ".", cvdIn: (v, p) => "with " + v + ", " + p + " look alike", and: " and ",
    cvd: { protan: "protanopia", deutan: "deuteranopia", tritan: "tritanopia" },
    open: "Open in the tool", openHint: "Mockups, client sheet, Adobe, Figma and Tailwind exports.",
    also: (name, hex) => "Other combinations with " + name + " " + hex,
    prev: "Previous", next: "Next",
    note: "Hex values come from HexPot's CMYK → HEX conversion: they are targets to check on your real material (fabric, paint, print).",
    crumbs: "Breadcrumb", other: "Français", indexTitle: "The 348 combinations by Sanzo Wada · La Chromathèque de Man Mbaï Likol",
    indexDesc: "All 348 combinations from Sanzo Wada's Dictionary of Color Combinations, with values, proportions and related combinations.",
    indexLede: "Each sheet gives the values (HEX, RGB, HSL, OKLCH, CMYK, LRV), the proportions and the combinations sharing a color.",
    by: "La Chromathèque de Man Mbaï Likol — Manso Olivier"
  }
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Chemins : FR sous accord/N/, EN sous en/accord/N/.
const dir = (lang, n) => (lang === "en" ? "en/" : "") + "accord/" + (n ? n + "/" : "");
const up = (lang, n) => "../".repeat((lang === "en" ? 1 : 0) + 1 + (n ? 1 : 0));
const abs = (rel) => (BASE ? BASE + rel : null);

// Index des combinaisons qui contiennent chaque hex (Wada réutilise 159 couleurs).
const byHex = {};
COMBOS.forEach((c, i) => c.forEach((h) => (byHex[h] = byHex[h] || []).push(i + 1)));

function head(lang, n, title, desc) {
  const links = BASE
    ? `<link rel="canonical" href="${abs(dir(lang, n))}">
<link rel="alternate" hreflang="fr" href="${abs(dir("fr", n))}">
<link rel="alternate" hreflang="en" href="${abs(dir("en", n))}">
<link rel="alternate" hreflang="x-default" href="${abs(dir("fr", n))}">
<meta property="og:url" content="${abs(dir(lang, n))}">
`
    : "";
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${links}<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta name="theme-color" content="#f1f1ef">
<link rel="manifest" href="${up(lang, n)}manifest.webmanifest">
<link rel="icon" href="${up(lang, n)}icons/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Shippori+Mincho:wght@600&display=swap">
<link rel="stylesheet" href="${up(lang, n)}src/styles.css">
</head>
<body>
<div class="wrap page">`;
}

function swatchLink(lang, from, m) {
  const c = COMBOS[m - 1];
  return `<li><a href="${up(lang, from)}${dir(lang, m)}"><span class="sw">${c.map((h) => `<i style="background:${h}"></i>`).join("")}</span><span>${T[lang].num}${m}</span></a></li>`;
}

function fiche(lang, n) {
  const L = T[lang], cs = COMBOS[n - 1], k = cs.length, parts = C.PROPS[k], roles = C.rolesOf(k, lang);
  const names = cs.map((h) => C.nameOf(h, lang)), r = up(lang, n), other = lang === "fr" ? "en" : "fr";
  const title = L.title(n, names.join(" · ")), desc = L.desc(n, cs.map((h) => h.toUpperCase()).join(", "), parts.join("/"));
  const rd = C.readableOn(cs[0]);
  const conf = C.confusions(cs), byType = {};
  conf.forEach((x) => (byType[x.k] = byType[x.k] || []).push(C.nameOf(x.a, lang) + " " + x.a.toUpperCase() + L.and + C.nameOf(x.b, lang) + " " + x.b.toUpperCase()));
  const cvd = conf.length ? L.cvdWarn(Object.keys(byType).map((t) => L.cvdIn(L.cvd[t], byType[t].join(" ; "))).join(". ")) : L.cvdOk;
  const tool = r + "#" + C.hashOf({ seed: cs[0], n, substitute: true, lang }).slice(1);
  const also = cs.map((h) => {
    const others = byHex[h].filter((m) => m !== n);
    if (!others.length) return "";
    return `<section class="also"><h2 class="label">${esc(L.also(C.nameOf(h, lang), h.toUpperCase()))}</h2><ul class="dict-grid">${others.slice(0, 12).map((m) => swatchLink(lang, n, m)).join("")}</ul></section>`;
  }).join("\n");
  return `${head(lang, n, title, desc)}
  <div class="topbar"><a class="btn ghost" href="${r}${dir(other, n)}" hreflang="${other}" lang="${other}">${L.other}</a></div>
  <nav class="crumbs" aria-label="${L.crumbs}"><a href="${r}#lg=${lang}">${L.home}</a> › <a href="../">${L.dict}</a> › ${L.num}${n}</nav>
  <header>
    <p class="label">${esc(L.kicker(k))}</p>
    <h1>${L.num}${n} · ${esc(names.join(" · "))}</h1>
    <p class="lede">${L.intro(k, cs.map((h, i) => parts[i] + " % " + esc(names[i])).join(", "))}</p>
  </header>
  <div class="bigsw" role="img" aria-label="${esc(cs.map((h, i) => names[i] + " " + h.toUpperCase() + " " + parts[i] + " %").join(", "))}">${cs.map((h, i) => `<div style="background:${h};color:${C.readableOn(h).c};flex:${parts[i]}">${parts[i]} %</div>`).join("")}</div>
  <div class="tablewrap" role="region" aria-labelledby="cap" tabindex="0">
    <table class="vals">
      <caption id="cap">${L.caption} <span class="hint">${L.capHint}</span></caption>
      <thead><tr><th scope="col">${L.col}</th><th scope="col">HEX</th><th scope="col">RGB</th><th scope="col">HSL</th><th scope="col">OKLCH</th><th scope="col">${L.cmyk}</th><th scope="col">LRV ≈</th></tr></thead>
      <tbody>${cs.map((h, i) => { const v = C.values(h); return `<tr><th scope="row"><span class="vdot" style="background:${h}"></span>${roles[i]} ${parts[i]} % · ${esc(names[i])}</th><td>${v.hex}</td><td>${v.rgb}</td><td>${v.hsl}</td><td>${v.oklch}</td><td>${v.cmjn}</td><td>${v.lrv}</td></tr>`; }).join("")}</tbody>
    </table>
  </div>
  <p class="hint">${esc(L.legible(L[rd.c === "#ffffff" ? "white" : "black"], rd.r.toFixed(1), rd.r < 4.5))} ${esc(cvd)}</p>
  <div class="actions"><a class="btn" href="${tool}">${L.open}</a><span class="hint">${L.openHint}</span></div>
${also}
  <nav class="pager" aria-label="${L.prev} / ${L.next}">${n > 1 ? `<a class="btn ghost" rel="prev" href="../${n - 1}/">← ${L.num}${n - 1}</a>` : "<span></span>"}${n < 348 ? `<a class="btn ghost" rel="next" href="../${n + 1}/">${L.num}${n + 1} →</a>` : ""}</nav>
  <p class="note">${L.note}</p>
  <p class="note">${L.by}</p>
</div>
</body>
</html>
`;
}

function index(lang) {
  const L = T[lang], other = lang === "fr" ? "en" : "fr", r = up(lang, 0);
  const groups = [2, 3, 4].map((k) => `<section class="also"><h2>${L.colors(k)}</h2><ul class="dict-grid">${COMBOS.map((c, i) => (c.length === k ? swatchLink(lang, 0, i + 1) : "")).join("")}</ul></section>`).join("\n");
  return `${head(lang, 0, L.indexTitle, L.indexDesc)}
  <div class="topbar"><a class="btn ghost" href="${r}${dir(other, 0)}" hreflang="${other}" lang="${other}">${L.other}</a></div>
  <nav class="crumbs" aria-label="${L.crumbs}"><a href="${r}#lg=${lang}">${L.home}</a> › ${L.dict}</nav>
  <header>
    <p class="label">Sanzo Wada · 配色総鑑 · 1933</p>
    <h1>${L.dict}</h1>
    <p class="lede">${L.indexLede}</p>
  </header>
${groups}
  <p class="note">${L.note}</p>
  <p class="note">${L.by}</p>
</div>
</body>
</html>
`;
}

function write(rel, html) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

let count = 0;
for (const lang of ["fr", "en"]) {
  write(dir(lang, 0) + "index.html", index(lang)); count++;
  for (let n = 1; n <= 348; n++) { write(dir(lang, n) + "index.html", fiche(lang, n)); count++; }
}
if (BASE) {
  const urls = ["", "accord/", "en/accord/"];
  for (let n = 1; n <= 348; n++) urls.push(dir("fr", n), dir("en", n));
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${BASE + u}</loc></url>`).join("\n")}\n</urlset>\n`);
  write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
}
console.log(count + " pages écrites" + (BASE ? " + sitemap.xml et robots.txt pour " + BASE : " (sans --base : pas de liens canoniques ni de sitemap)"));
