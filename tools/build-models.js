#!/usr/bin/env node
/* Construit src/models-data.js depuis data/modeles-60.json (catalogue MML « 60 modèles pour 15 métiers »).
   Chaque métier a 4 supports SVG 800 × 540, recolorés par les rôles --chroma-primary, -secondary, -accent, -accent-2
   (et leurs variantes -text). Les identifiants de métier du catalogue sont ramenés à ceux de l'outil (JOBS de core.js).
   Usage : node tools/build-models.js */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const src = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "modeles-60.json"), "utf8"));

const JOB = {
  graphiste: "graphisme", "motion-designer": "motion", "directeur-artistique": "da", "designer-packaging": "packaging",
  "ux-designer": "ux", "ui-designer": "ui", webdesigner: "web", "game-designer": "jeu",
  "architecte-interieur": "interieur", "designer-retail": "retail", scenographe: "scenographie",
  "designer-produit": "produit", "designer-transport": "transport", styliste: "mode", "designer-textile": "textile"
};

// Titres anglais (le français vient du catalogue).
const EN = {
  "graphiste-1": "Poster and business card", "graphiste-2": "Book cover and digital publication", "graphiste-3": "Stationery: letter and envelope", "graphiste-4": "Social media: square post and story",
  "motion-designer-1": "Logo storyboard", "motion-designer-2": "Video titles and lower third", "motion-designer-3": "Product spot", "motion-designer-4": "Vertical kinetic type",
  "directeur-artistique-1": "Campaign moodboard", "directeur-artistique-2": "Advertising triptych", "directeur-artistique-3": "Visual identity system", "directeur-artistique-4": "Editorial direction",
  "designer-packaging-1": "Packaging: box and container", "designer-packaging-2": "On the shelf: among competitors", "designer-packaging-3": "Cosmetics: bottles and labels", "designer-packaging-4": "Food: pouch and cup",
  "ux-designer-1": "Checkout flow", "ux-designer-2": "Onboarding", "ux-designer-3": "Booking a time slot", "ux-designer-4": "Confirmation and tracking",
  "ui-designer-1": "Light interface: desktop and mobile", "ui-designer-2": "Dark interface: fields and states", "ui-designer-3": "E-commerce: product page", "ui-designer-4": "Form: input and selection",
  "webdesigner-1": "Shop home page", "webdesigner-2": "Creative portfolio", "webdesigner-3": "Restaurant website", "webdesigner-4": "Online magazine",
  "game-designer-1": "Platformer and HUD", "game-designer-2": "Map and objectives", "game-designer-3": "Character select", "game-designer-4": "Pause menu",
  "architecte-interieur-1": "Living room: walls, sofa and accessories", "architecte-interieur-2": "Bedroom: walls, headboard and linen", "architecte-interieur-3": "Office: furniture and accessories", "architecte-interieur-4": "Kitchen: fronts, backsplash and island",
  "designer-retail-1": "Cosmetics store", "designer-retail-2": "Clothing store", "designer-retail-3": "Grocery and counter", "designer-retail-4": "Furniture showroom",
  "scenographe-1": "Theater set", "scenographe-2": "Conference stage", "scenographe-3": "Exhibition route", "scenographe-4": "Concert stage",
  "designer-produit-1": "Armchair and upholstery", "designer-produit-2": "Lamp and diffuser", "designer-produit-3": "Headphones", "designer-produit-4": "Coffee machine",
  "designer-transport-1": "Car and bodywork", "designer-transport-2": "Bus and livery", "designer-transport-3": "Scooter and trim", "designer-transport-4": "Train and signage",
  "styliste-1": "Corporate: men's and women's suits", "styliste-2": "Dress: cut, belt and finishes", "styliste-3": "Sneaker: panels and sole", "styliste-4": "Sport: training and running outfits",
  "designer-textile-1": "Fabric: weave, patterns and borders", "designer-textile-2": "Curtains: weave and stripes", "designer-textile-3": "Cushions: patterns and seams", "designer-textile-4": "Rug: field, borders and fringes"
};

const out = {};
src.jobs.forEach(function (j) {
  const id = JOB[j.id];
  if (!id) throw new Error("Métier inconnu : " + j.id);
  out[id] = j.models.map(function (m) {
    if (/<script|\son[a-z]+=|href=|<image|<foreignObject/i.test(m.svg)) throw new Error("SVG refusé (contenu actif) : " + m.id);
    if (!EN[m.id]) throw new Error("Titre anglais manquant : " + m.id);
    // Le SVG garde ses variables CSS ; scenes.js les remplace par les couleurs de l'accord.
    return { id: m.id, fr: m.title.replace(/’/g, "'"), en: EN[m.id], svg: m.svg };
  });
});
Object.keys(JOB).forEach(function (k) { if (!out[JOB[k]] || out[JOB[k]].length !== 4) throw new Error("4 modèles attendus pour " + JOB[k]); });

const body = "/* Généré par tools/build-models.js depuis data/modeles-60.json — ne pas modifier à la main.\n" +
  "   60 supports SVG (800 × 540) pour 15 métiers, dessins MML, version " + src.version + ". */\n" +
  "(function (root, data) {\n  if (typeof module === \"object\" && module.exports) module.exports = data; else root.WADA_MODELS = data;\n" +
  "})(typeof self !== \"undefined\" ? self : this, " + JSON.stringify({ version: src.version, w: 800, h: 540, jobs: out }) + ");\n";
fs.writeFileSync(path.join(ROOT, "src", "models-data.js"), body);
console.log("src/models-data.js : " + Object.keys(out).length + " métiers, " + Object.keys(out).length * 4 + " modèles, " + Math.round(body.length / 1024) + " Ko");
