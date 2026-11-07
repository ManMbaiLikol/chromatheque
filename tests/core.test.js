// Tests des fonctions pures : node --test tests/
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const C = require("../src/core.js");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "wada-348.json"), "utf8")).combinaisons;
const COMBOS = DATA.map((c) => c.couleurs);
const search = C.createSearch(COMBOS);

test("dictionnaire : 348 combinaisons, numérotation 2 / 3 / 4 couleurs", () => {
  assert.equal(COMBOS.length, 348);
  COMBOS.forEach((c, i) => {
    const n = i + 1, want = n <= 120 ? 2 : n <= 240 ? 3 : 4;
    assert.equal(c.length, want, "n° " + n);
    assert.equal(DATA[i].numero, n);
  });
  assert.deepEqual(COMBOS[54], ["#d94d99", "#ffffff"], "n° 55 sans gris de contour");
});

test("wada-data.js et wada-348.json décrivent le même dictionnaire", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "src", "wada-data.js"), "utf8");
  const sandbox = { window: {} };
  require("node:vm").runInNewContext(src, sandbox);
  // JSON pour sortir les tableaux du contexte vm (autre prototype Array).
  assert.deepEqual(JSON.parse(JSON.stringify(C.unpack(sandbox.window.WADA_DATA))), COMBOS);
});

test("conversions : blanc, noir, aller-retour OKLab", () => {
  assert.ok(Math.abs(C.lab("#ffffff")[0] - 1) < 1e-6);
  assert.ok(Math.abs(C.lab("#000000")[0]) < 1e-6);
  for (const hex of ["#d94d99", "#1448c8", "#6c2b11", "#29bdad"]) {
    assert.equal(C.toHex(C.linFromLab(C.lab(hex)).map(C.delin)), hex);
  }
  assert.equal(C.parseHex("ABC"), "#aabbcc");
  assert.equal(C.parseHex("#12345"), null);
});

test("contraste et valeurs pro", () => {
  assert.ok(Math.abs(C.contrast("#000000", "#ffffff") - 21) < 1e-9);
  assert.deepEqual(C.cmykOf("#ff0000"), [0, 100, 100, 0]);
  assert.deepEqual(C.cmykOf("#000000"), [0, 0, 0, 100]);
  assert.equal(C.lrvOf("#ffffff"), 100);
  assert.equal(C.lrvOf("#000000"), 0);
  assert.deepEqual(C.hslOf("#ff0000"), [0, 100, 50]);
  assert.equal(C.values("#d94d99").rgb, "217 77 153");
});

test("fidélité : seuils 0.06 et 0.12", () => {
  assert.equal(C.fid(0.06), "fidele");
  assert.equal(C.fid(0.0601), "proche");
  assert.equal(C.fid(0.12), "proche");
  assert.equal(C.fid(0.13), "libre");
});

test("recherche : couleur exacte en tête, tri 3 > 4 > 2 à égalité", () => {
  const r = search("#d94d99", 0);
  assert.equal(r[0].d, 0);
  const tied = r.filter((x) => x.d === 0).map((x) => x.colors.length);
  const rank = { 3: 0, 4: 1, 2: 2 };
  for (let i = 1; i < tied.length; i++) assert.ok(rank[tied[i - 1]] <= rank[tied[i]]);
  assert.ok(search("#d94d99", 2).every((x) => x.colors.length === 2));
});

test("recherche à deux couleurs : rose + blanc → n° 55, cases distinctes", () => {
  const r = search("#d94d99", 0, "#ffffff");
  assert.equal(r[0].n, 55);
  assert.equal(r[0].d, 0);
  assert.notEqual(r[0].idx, r[0].idx2);
  const a = C.build(r[0], "#d94d99", { substitute: true, transpose: false, seed2: "#ffffff" });
  assert.deepEqual(a.colors, ["#d94d99", "#ffffff"]);
});

test("les compagnes restent exactement celles du dictionnaire sans transposition", () => {
  const r = search("#123456", 0)[0];
  const a = C.build(r, "#123456", { substitute: true, transpose: false });
  const others = r.colors.filter((_, j) => j !== r.idx);
  assert.deepEqual(a.colors.slice(1), others);
  assert.equal(a.colors[0], "#123456");
});

test("noms FR / EN", () => {
  assert.equal(C.nameOf("#ffffff"), "blanc");
  assert.equal(C.nameOf("#ffffff", "en"), "white");
  assert.equal(C.nameOf("#d94d99"), "rose");
  assert.equal(C.nameOf("#0d2b52", "en"), "deep blue");
  assert.equal(C.nameOf("#0d2b52", "fr"), "bleu profond");
});

test("simulations : identité au jour, lampe chaude réchauffe le blanc", () => {
  assert.equal(C.simulate("#d94d99", 6500, "normale"), "#d94d99");
  const w = C.rgb(C.simulate("#ffffff", 2700, "normale"));
  assert.ok(w[0] > w[2], "rouge > bleu sous 2700 K");
  assert.equal(C.confusions(["#000000", "#ffffff"]).length, 0);
});

test("lien : aller-retour readHash / hashOf, langue ignorée par keyOf", () => {
  const h = "#c=d94d99&c2=ffffff&n=55&o=1.0&t=2&ex=0&tr=1&sc=mode&lg=en";
  assert.equal(C.hashOf(C.readHash(h)), h);
  assert.equal(C.readHash("#n=3"), null);
  assert.equal(C.keyOf("#c=d94d99&n=55&lg=en"), C.keyOf("#c=d94d99&n=55&sc=mode"));
});

test("import : liens resérialisés, données invalides écartées", () => {
  const out = C.cleanItems([
    { hash: "#c=D94D99&n=55&zz=<b>", colors: ["#D94D99", "#fff"], note: "x".repeat(500) },
    { hash: "#c=zzzzzz&n=3", colors: ["#000000", "#ffffff"] },
    { hash: "#c=ff0000&n=12", colors: ["#ff0000"] },
    null
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].hash, "#c=d94d99&n=55");
  assert.deepEqual(out[0].colors, ["#d94d99", "#ffffff"]);
  assert.equal(out[0].note.length, 160);
});

test("exports : en-tête ASE, tokens, GPL", () => {
  const items = [{ hex: "#d94d99", role: "Dominante", slug: "dominante", pct: 65, name: "rose" }, { hex: "#ffffff", role: "Contraste", slug: "contraste", pct: 35, name: "blanc" }];
  const ase = C.aseBytes("Sanzo Wada n° 55", items), dv = new DataView(ase.buffer);
  assert.equal(String.fromCharCode(...ase.slice(0, 4)), "ASEF");
  assert.equal(dv.getUint32(8), 4);
  const tokens = JSON.parse(C.tokensText(55, items, "fr"));
  assert.equal(tokens["wada-55"].dominante.$value, "#d94d99");
  assert.match(C.gplText(55, items), /^GIMP Palette\n/);
  assert.match(C.gplText(55, items, "en"), /No\. 55/);
});
