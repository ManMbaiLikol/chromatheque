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

const SOURCES = require("../src/sources-data.js").WADA_SOURCES;
const Scenes = require("../src/scenes.js");

test("sources : kasane à 2 couleurs, traditions africaines de 2 à 4, hex valides", () => {
  assert.equal(SOURCES.kasane.length, 16);
  SOURCES.kasane.forEach((e) => { assert.equal(e.colors.length, 2); assert.ok(e.jp && e.fr && e.en && e.g.fr); });
  assert.equal(SOURCES.afrique.length, 20);
  for (const e of SOURCES.kasane.concat(SOURCES.afrique)) {
    assert.ok(e.colors.length >= 2 && e.colors.length <= 4, e.fr);
    e.colors.forEach((c) => assert.equal(C.parseHex(c), c, e.fr + " " + c));
  }
  const r = C.createSearch(SOURCES.kasane.map((e) => e.colors))("#db6d8a", 0)[0];
  assert.equal(r.n, 1, "kōbai en tête pour son propre endroit");
});

test("règles : la couleur de départ reste exacte, tailles 2 à 4", () => {
  const rules = C.ruleCombos("#1448c8");
  assert.deepEqual(rules.map((r) => r.k), C.RULES);
  rules.forEach((r) => { assert.equal(r.colors[0], "#1448c8"); r.colors.forEach((c) => assert.ok(C.parseHex(c))); });
  assert.deepEqual(rules.map((r) => r.colors.length), [2, 3, 4, 3, 3, 4]);
  assert.equal(C.ruleCombos("#808080")[0].colors.length, 2, "gris : une teinte par défaut");
});

test("métiers : 15 métiers, 4 analyses chacun, niveaux connus", () => {
  assert.equal(C.JOB_IDS.length, 15);
  for (const j of C.JOB_IDS) {
    assert.ok(C.FAMILIES.includes(C.JOBS[j].f));
    for (const cs of [["#d94d99", "#ffffff"], ["#6c2b11", "#f2ad78", "#0057ba"], ["#000000", "#ffffff", "#e2a72e", "#1e7b45"]]) {
      const out = C.jobChecks(j, cs);
      assert.equal(out.length, 4, j);
      out.forEach((c) => assert.ok(["ok", "warn", "info"].includes(c.lv), j + " " + c.k));
    }
  }
  assert.equal(C.jobChecks("ui", ["#000000", "#ffffff"])[1].lv, "ok", "21:1 suffit pour le texte");
  assert.equal(C.jobChecks("motion", ["#000000", "#ffffff"])[1].lv, "warn", "noir et blanc purs hors plage vidéo");
  assert.equal(C.harmonyOf(["#ff0000", "#00b0b0"]), "complementaire");
  assert.equal(C.harmonyOf(["#ffffff", "#000000"]), "neutre");
  assert.equal(C.tempOf(["#c3283f", "#e2a72e"]), "chaud");
  assert.equal(C.opticalMix(["#ffffff", "#ffffff"]), "#ffffff");
});

test("scènes : un SVG par métier, avec les couleurs de l'accord", () => {
  assert.deepEqual(Scenes.JOBS.slice().sort(), C.JOB_IDS.slice().sort());
  const cs = ["#6c2b11", "#f2ad78", "#0057ba", "#e8dcc0"];
  for (const j of C.JOB_IDS) {
    const svg = Scenes.render(j, cs, { aria: "a<b", label: "n° 1" });
    assert.match(svg, /^<svg viewBox="0 0 480 340"/, j);
    assert.ok(svg.includes(cs[0]), j + " : dominante présente");
    assert.ok(!svg.includes("a<b"), j + " : texte échappé");
  }
});

test("lien : source et métier, rétrocompatibles", () => {
  const h = "#c=db6d8a&n=1&sc=ui&s=kasane";
  assert.equal(C.hashOf(C.readHash(h)), h);
  assert.equal(C.readHash("#c=d94d99&n=55").source, "wada");
  assert.equal(C.readHash("#c=d94d99&n=55&s=inconnu").source, "wada");
  assert.equal(C.readHash("#c=d94d99&sc=graphisme").scene, "graphisme", "anciennes scènes toujours valides");
  assert.notEqual(C.keyOf("#c=db6d8a&n=1&s=kasane"), C.keyOf("#c=db6d8a&n=1"));
  assert.equal(C.cleanItems([{ hash: h, colors: ["#db6d8a", "#8e354a"] }])[0].source, "kasane");
});

test("exports : titre et préfixe d'une autre source", () => {
  const items = [{ hex: "#db6d8a", role: "Endroit", slug: "dominante", pct: 65, name: "rose" }, { hex: "#8e354a", role: "Envers", slug: "contraste", pct: 35, name: "bordeaux" }];
  const meta = { key: "kasane-1", title: "Kasane no irome · 紅梅", prefix: "kasane", note: "Interprétation MML." };
  assert.equal(JSON.parse(C.tokensText(meta, items, "fr"))["kasane-1"].dominante.$value, "#db6d8a");
  assert.match(C.tailwindText(meta, items, "fr"), /--color-kasane-dominante: #db6d8a/);
  assert.match(C.gplText(meta, items), /Name: Kasane no irome · 紅梅/);
});

test("couleurs imposées : k=1 pour une, c2 pour deux, anciens liens inchangés", () => {
  assert.equal(C.readHash("#c=1448c8&n=3").locked, 0);
  assert.equal(C.readHash("#c=1448c8&k=1&n=3").locked, 1);
  assert.equal(C.readHash("#c=d94d99&c2=ffffff&n=55").locked, 2);
  assert.equal(C.hashOf(C.readHash("#c=1448c8&k=1&n=3")), "#c=1448c8&k=1&n=3");
  assert.equal(C.hashOf(C.readHash("#c=d94d99&c2=ffffff&n=55")), "#c=d94d99&c2=ffffff&n=55");
  assert.equal(C.keyOf("#c=1448c8&k=1&n=3"), C.keyOf("#c=1448c8&n=3"));
});

test("règles à deux couleurs : les deux restent exactes, 1 ou 2 compagnes", () => {
  const r = C.ruleCombos2("#1448c8", "#e2a72e");
  assert.deepEqual(r.map((x) => x.k), C.RULES2);
  r.forEach((x) => {
    assert.deepEqual(x.colors.slice(0, 2), ["#1448c8", "#e2a72e"]);
    assert.ok(x.colors.length === 3 || x.colors.length === 4);
    x.colors.forEach((c) => assert.ok(C.parseHex(c)));
  });
  C.ruleCombos2("#808080", "#ffffff").forEach((x) => x.colors.forEach((c) => assert.ok(C.parseHex(c))));
});

test("deux couleurs imposées dans Wada : des accords de 3 ou 4 couleurs les contiennent", () => {
  const r = search("#d94d99", 0, "#ffffff").filter((x) => x.colors.length >= 3);
  assert.ok(r.length > 0);
  assert.ok(r[0].idx !== r[0].idx2);
});

test("gamme : 11 paliers du plus clair au plus foncé, la couleur d'origine exacte", () => {
  for (const hex of ["#1448c8", "#d94d99", "#808080", "#f2ad78", "#1c1a17"]) {
    const sc = C.scaleOf(hex);
    assert.deepEqual(sc.map((s) => s.step), C.SCALE_STEPS);
    assert.equal(sc.filter((s) => s.base).length, 1);
    assert.equal(sc.find((s) => s.base).hex, hex);
    for (let i = 1; i < sc.length; i++) assert.ok(C.lab(sc[i].hex)[0] < C.lab(sc[i - 1].hex)[0] + 1e-6, hex + " palier " + sc[i].step);
  }
  const tw = C.scaleText("tailwind", [{ slug: "accent", hex: "#1448c8" }], "kasane");
  assert.match(tw, /^@theme \{\n  --color-kasane-accent-50: #/);
  assert.equal(JSON.parse(C.scaleText("tokens", [{ slug: "accent", hex: "#1448c8" }], "wada")).wada.accent["700"].$value, "#1448c8");
});

test("recoloration : intensité 0 = original, 1 = cible au pixel moyen", () => {
  const px = [0.6, 0.05, -0.02], mean = [0.5, 0.04, -0.01], target = [0.7, -0.1, 0.1];
  assert.deepEqual(C.recolorLab(px, mean, target, 0), px);
  assert.deepEqual(C.recolorLab(mean, mean, target, 1), target);
  const r = C.recolorLab(px, mean, target, 1);
  assert.ok(Math.abs(r[0] - 0.8) < 1e-9, "le relief de lumière est gardé");
});

test("proposition client : liens revalidés, textes bornés, 3 pistes au plus", () => {
  const p = C.cleanProposal({ id: "abc", t: "Hôtel <b>", cl: "x".repeat(300), i: [
    { h: "#c=D94D99&n=55&zz=1", c: ["#D94D99", "#fff"], p: "A", x: "Note" },
    { h: "#c=nope", c: ["#000000", "#ffffff"], p: "B" },
    { h: "#c=1448c8&n=161", c: ["#1448c8", "#6c2b11", "#f2ad78"], p: "Z" },
    { h: "#c=1448c8&n=2", c: ["#000000", "#ffffff"] }, { h: "#c=1448c8&n=3", c: ["#000000", "#ffffff"] }] });
  assert.equal(p.i.length, 3);
  assert.equal(p.i[0].h, "#c=d94d99&n=55");
  assert.deepEqual(p.i[0].c, ["#d94d99", "#ffffff"]);
  assert.equal(p.i[1].p, "");
  assert.equal(p.cl.length, 80);
  assert.equal(C.cleanProposal({ i: [] }), null);
  const back = C.cleanProposal(C.unpackLink(C.packLink(p)));
  assert.deepEqual(back, p);
  assert.deepEqual(C.cleanResponse({ id: "abc", p: "B", c: "ok" }), { id: "abc", p: "B", c: "ok", n: "", d: "" });
  assert.equal(C.cleanResponse({ p: "D" }), null);
  assert.equal(C.unpackLink("%E0%A4%A"), null);
});

test("import : piste, statut et note d'intention conservés et bornés", () => {
  const it = C.cleanItems([{ hash: "#c=d94d99&n=55", colors: ["#d94d99", "#ffffff"], piste: "B", status: "valide", intent: "y".repeat(3000) }])[0];
  assert.equal(it.piste, "B"); assert.equal(it.status, "valide"); assert.equal(it.intent.length, 1500);
  assert.equal(C.cleanItems([{ hash: "#c=d94d99&n=55", colors: ["#d94d99", "#ffffff"], piste: "X", status: "??" }])[0].piste, "");
});
