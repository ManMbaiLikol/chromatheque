/* La Chromathèque de Man Mbaï Likol — sources d'accords autres que Sanzo Wada (window.WADA_SOURCES).
   Ces palettes sont des INTERPRÉTATIONS MML : les teintes historiques n'ont pas de valeur hex exacte et les sources
   varient d'un texte à l'autre. Chaque accord : { jp?, fr, en, g (groupe), colors }. Wada reste la source par défaut. */
(function (root) {
  "use strict";
  // Kasane no irome : superposition endroit (omote) / envers (ura) des vêtements de cour de l'époque Heian.
  var K = {
    shiro: "#f4f1e8", kurenai: "#c3283f", suo: "#8e354a", kobai: "#db6d8a", moegi: "#8ea83a", ao: "#4d7f5e",
    koiao: "#2b5444", ki: "#e8c23a", usukuchiba: "#d9a85c", kuchiba: "#b0782f", usuiro: "#b8a2c6", murasaki: "#6b4a8c",
    futaai: "#6e5f94", koikurenai: "#8f1730", torinoko: "#efe2c6", aoki: "#bcb245"
  };
  var S = { p: { fr: "Printemps", en: "Spring" }, e: { fr: "Été", en: "Summer" }, a: { fr: "Automne", en: "Autumn" }, h: { fr: "Hiver", en: "Winter" } };
  function k(jp, fr, en, g, a, b) { return { jp: jp, fr: fr, en: en, g: S[g], colors: [K[a], K[b]] }; }
  var kasane = [
    k("紅梅", "Kōbai · prunier rouge", "Kōbai · red plum", "p", "kobai", "suo"),
    k("桜", "Sakura · cerisier", "Sakura · cherry", "p", "shiro", "kurenai"),
    k("柳", "Yanagi · saule", "Yanagi · willow", "p", "shiro", "moegi"),
    k("山吹", "Yamabuki · kerria", "Yamabuki · kerria", "p", "usukuchiba", "ki"),
    k("藤", "Fuji · glycine", "Fuji · wisteria", "p", "usuiro", "moegi"),
    k("椿", "Tsubaki · camélia", "Tsubaki · camellia", "p", "suo", "kurenai"),
    k("卯の花", "Unohana · deutzia", "Unohana · deutzia", "e", "shiro", "ao"),
    k("菖蒲", "Shōbu · iris des marais", "Shōbu · sweet flag", "e", "ao", "kobai"),
    k("女郎花", "Ominaeshi · patrinia", "Ominaeshi · patrinia", "a", "aoki", "ao"),
    k("萩", "Hagi · lespédèze", "Hagi · bush clover", "a", "suo", "ao"),
    k("桔梗", "Kikyō · campanule", "Kikyō · balloon flower", "a", "futaai", "koiao"),
    k("紅葉", "Momiji · érable rouge", "Momiji · red maple", "a", "kurenai", "koikurenai"),
    k("朽葉", "Kuchiba · feuilles mortes", "Kuchiba · fallen leaves", "a", "kuchiba", "ki"),
    k("松重", "Matsugasane · pin", "Matsugasane · pine", "h", "ao", "murasaki"),
    k("雪の下", "Yuki no shita · sous la neige", "Yuki no shita · under the snow", "h", "shiro", "kobai"),
    k("氷重", "Kōrigasane · glace", "Kōrigasane · ice", "h", "torinoko", "shiro")
  ];

  // Traditions africaines : palettes d'après des pratiques textiles et murales documentées.
  var G = {
    kente: { fr: "Kente (Ghana)", en: "Kente (Ghana)" }, ndebele: { fr: "Peinture ndebele (Afrique du Sud)", en: "Ndebele painting (South Africa)" },
    bogolan: { fr: "Bogolan (Mali)", en: "Bogolan (Mali)" }, yoruba: { fr: "Yoruba (Nigeria)", en: "Yoruba (Nigeria)" }
  };
  function a(g, fr, en, colors) { return { fr: fr, en: en, g: G[g], colors: colors }; }
  var afrique = [
    a("kente", "Kente · or, vert, noir", "Kente · gold, green, black", ["#e2a72e", "#1e7b45", "#1c1a17"]),
    a("kente", "Kente · or, rouge, vert, noir", "Kente · gold, red, green, black", ["#e2a72e", "#c1272d", "#1e7b45", "#1c1a17"]),
    a("kente", "Kente · bleu, or, blanc", "Kente · blue, gold, white", ["#1f4e9a", "#e2a72e", "#f3efe4"]),
    a("kente", "Kente · bordeaux, or, noir", "Kente · maroon, gold, black", ["#6e1f2a", "#e2a72e", "#1c1a17"]),
    a("kente", "Kente · vert, or, bleu, rouge", "Kente · green, gold, blue, red", ["#1e7b45", "#e2a72e", "#1f4e9a", "#c1272d"]),
    a("ndebele", "Ndebele · rouge et jaune", "Ndebele · red and yellow", ["#f5f3ec", "#1b1b19", "#c62f2a", "#f2b31c"]),
    a("ndebele", "Ndebele · bleu ciel et jaune", "Ndebele · sky blue and yellow", ["#f5f3ec", "#1b1b19", "#3d8fd1", "#f2b31c"]),
    a("ndebele", "Ndebele · vert et rouge", "Ndebele · green and red", ["#f5f3ec", "#1b1b19", "#2f8a4e", "#c62f2a"]),
    a("ndebele", "Ndebele · rose et bleu", "Ndebele · pink and blue", ["#f5f3ec", "#1b1b19", "#e58aa9", "#3d8fd1"]),
    a("ndebele", "Ndebele · terres anciennes", "Ndebele · early earth pigments", ["#f5f3ec", "#b8752f", "#6e4127", "#1b1b19"]),
    a("bogolan", "Bogolan · noir de boue sur écru", "Bogolan · mud black on ecru", ["#2b2420", "#ece2cc"]),
    a("bogolan", "Bogolan · noir, rouille, écru", "Bogolan · black, rust, ecru", ["#2b2420", "#8b4a2b", "#ece2cc"]),
    a("bogolan", "Bogolan · jaune n'galama et noir", "Bogolan · n'galama yellow and black", ["#c9a248", "#2b2420"]),
    a("bogolan", "Bogolan · noir, rouille, jaune, écru", "Bogolan · black, rust, yellow, ecru", ["#2b2420", "#8b4a2b", "#c9a248", "#ece2cc"]),
    a("bogolan", "Bogolan · brun, écru, noir", "Bogolan · brown, ecru, black", ["#5e3a26", "#ece2cc", "#2b2420"]),
    a("yoruba", "Yoruba · funfun, pupa, dudu", "Yoruba · funfun, pupa, dudu", ["#f4f1e6", "#b3362c", "#24242a"]),
    a("yoruba", "Adire · indigo et blanc", "Adire · indigo and white", ["#1e3560", "#f4f1e6"]),
    a("yoruba", "Adire · gamme d'indigo", "Adire · indigo range", ["#1e3560", "#3e5f8f", "#9fb3cf", "#f4f1e6"]),
    a("yoruba", "Perles · corail et blanc", "Beads · coral and white", ["#d8573c", "#f4f1e6"]),
    a("yoruba", "Yoruba · indigo, pupa, funfun", "Yoruba · indigo, pupa, funfun", ["#1e3560", "#b3362c", "#f4f1e6"])
  ];

  root.WADA_SOURCES = { kasane: kasane, afrique: afrique };
})(typeof self !== "undefined" ? self : this);
