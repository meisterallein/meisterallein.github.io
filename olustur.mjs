// Kanıt sayfasını üretir: veri/kaynaklar.json → index.html
// Kullanım: node olustur.mjs [--veri yol] [--cikti yol]
// Sadece "dogrulandi": "Evet" olan kaynaklar kabul edilir; diğerleri hatayla durdurur.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const klasor = dirname(fileURLToPath(import.meta.url));

function arguman(ad, varsayilan) {
  const i = process.argv.indexOf(ad);
  return i === -1 ? varsayilan : process.argv[i + 1];
}

const veriYolu = arguman("--veri", join(klasor, "veri", "kaynaklar.json"));
const ciktiYolu = arguman("--cikti", join(klasor, "index.html"));

const kacis = (metin) =>
  String(metin)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const dolu = (deger) => typeof deger === "string" && deger.trim() !== "";

function denetle(veri) {
  const hatalar = [];
  if (!Array.isArray(veri.gonderiler)) hatalar.push("'gonderiler' bir liste olmalı.");
  const gorulen = new Set();
  for (const g of veri.gonderiler ?? []) {
    const ad = `#${g.numara ?? "?"}`;
    if (!/^\d{3,}$/.test(g.numara ?? "")) hatalar.push(`${ad}: numara 3 haneli olmalı (ör. "001").`);
    if (gorulen.has(g.numara)) hatalar.push(`${ad}: numara iki kez kullanılmış.`);
    gorulen.add(g.numara);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(g.tarih ?? "")) hatalar.push(`${ad}: tarih yyyy-aa-gg olmalı.`);
    if (!Array.isArray(g.kaynaklar) || g.kaynaklar.length === 0) hatalar.push(`${ad}: en az bir kaynak olmalı.`);
    for (const [i, k] of (g.kaynaklar ?? []).entries()) {
      const yer = `${ad} kaynak ${i + 1}`;
      if (k.dogrulandi !== "Evet") hatalar.push(`${yer}: doğrulanmamış (dogrulandi = "${k.dogrulandi ?? ""}"). Sadece "Evet" yayınlanır.`);
      for (const alan of ["kisi", "soz", "sozDili", "kunye"]) {
        if (!dolu(k[alan])) hatalar.push(`${yer}: '${alan}' boş.`);
      }
      if (dolu(k.sozDili) && k.sozDili !== "en" && !dolu(k.ceviriEn)) hatalar.push(`${yer}: söz İngilizce değil, 'ceviriEn' gerekli.`);
      if (dolu(k.baglanti) && !/^https?:\/\//.test(k.baglanti)) hatalar.push(`${yer}: bağlantı http(s):// ile başlamalı.`);
    }
  }
  return hatalar;
}

const DILLER = ["en", "de", "tr"];
const CEVIRI_ALANI = { en: "ceviriEn", de: "ceviriDe", tr: "ceviriTr" };

// Sayfa metinleri (sabit). Sözler ve çeviriler veriden gelir, bunlar arayüzdür.
const METIN = {
  baslik: { en: "Sources", de: "Quellen", tr: "Kaynaklar" },
  sekme: {
    en: "Meister Allein — Sources",
    de: "Meister Allein — Quellen",
    tr: "Meister Allein — Kaynaklar",
  },
  giris: {
    en: [
      "Every post on Instagram names where its words come from. Here you can read each quote, see who said it, and open the original source to check it yourself.",
      "A post's number (for example #001) is in its caption. Look for the same number below.",
    ],
    de: [
      "Jeder Beitrag auf Instagram nennt, woher seine Worte stammen. Hier kannst du jedes Zitat lesen, sehen, wer es gesagt hat, und die Originalquelle öffnen, um es selbst zu prüfen.",
      "Die Nummer eines Beitrags (zum Beispiel #001) steht in seiner Beschreibung. Suche unten dieselbe Nummer.",
    ],
    tr: [
      "Instagram'daki her gönderi, sözlerinin nereden geldiğini belirtir. Burada her sözü okuyabilir, kimin söylediğini görebilir ve doğruluğunu kendin kontrol etmek için asıl kaynağı açabilirsin.",
      "Bir gönderinin numarası (örneğin #001) açıklamasında yazar. Aşağıda aynı numarayı bul.",
    ],
  },
  bos: {
    en: "No sources published yet.",
    de: "Noch keine Quellen veröffentlicht.",
    tr: "Henüz yayınlanmış kaynak yok.",
  },
  ac: { en: "Open source", de: "Quelle öffnen", tr: "Kaynağı aç" },
  ara: { en: "Find a post", de: "Beitrag suchen", tr: "Gönderi ara" },
  araIpucu: {
    en: "Number or word, e.g. 001",
    de: "Nummer oder Wort, z. B. 001",
    tr: "Numara veya kelime, örn. 001",
  },
  sonucYok: {
    en: "Nothing found. Try the number from the caption.",
    de: "Nichts gefunden. Versuche die Nummer aus der Beschreibung.",
    tr: "Bulunamadı. Açıklamadaki numarayı dene.",
  },
};

// Aynı içeriği üç dilde yazar; görünür olanı html[lang] seçer (stil.css).
const uc = (parca, etiket = "span") =>
  DILLER.map((d) => `<${etiket} class="d-${d}" lang="${d}">${parca(d)}</${etiket}>`).join("");

function ceviriHtml(k) {
  return DILLER.map((d) => {
    if (k.sozDili === d) return "";
    const kendi = k[CEVIRI_ALANI[d]];
    const var_ = dolu(kendi);
    const metin = var_ ? kendi : k.sozDili !== "en" ? k.ceviriEn : "";
    if (!dolu(metin)) return "";
    return `
          <p class="ceviri d-${d}" lang="${var_ ? d : "en"}">${kacis(metin)}</p>`;
  }).join("");
}

function kaynakHtml(k) {
  const baglanti = dolu(k.baglanti)
    ? ` · <a href="${kacis(k.baglanti)}" rel="noopener noreferrer">${uc((d) => METIN.ac[d])}</a>`
    : "";
  return `
        <figure class="kaynak">
          <blockquote lang="${kacis(k.sozDili)}"><p>${kacis(k.soz)}</p></blockquote>${ceviriHtml(k)}
          <figcaption class="kunye"><span class="kisi">${kacis(k.kisi)}</span> — ${kacis(k.kunye)}${baglanti}</figcaption>
        </figure>`;
}

// Aramanın taradığı metin: yalnız veriden gelen yazılar (arayüz yazıları değil).
function aramaMetni(g) {
  const parcalar = [g.tarih, g.konu];
  for (const k of g.kaynaklar) parcalar.push(k.kisi, k.soz, k.ceviriEn, k.ceviriDe, k.ceviriTr, k.kunye);
  return parcalar.filter(dolu).join(" ");
}

function gonderiHtml(g) {
  const konu = dolu(g.konu) ? `\n        <p class="konu">${kacis(g.konu)}</p>` : "";
  return `
      <section class="gonderi" id="${kacis(g.numara)}" data-ara="${kacis(aramaMetni(g))}">
        <header>
          <h2 class="numara"><a href="#${kacis(g.numara)}">#${kacis(g.numara)}</a></h2>
          <time datetime="${kacis(g.tarih)}">${kacis(g.tarih)}</time>
        </header>${konu}${g.kaynaklar.map(kaynakHtml).join("")}
      </section>`;
}

const veri = JSON.parse(readFileSync(veriYolu, "utf8"));
const hatalar = denetle(veri);
if (hatalar.length > 0) {
  console.error("Sayfa üretilmedi:\n- " + hatalar.join("\n- "));
  process.exit(1);
}

const gonderiler = [...veri.gonderiler].sort((a, b) => Number(b.numara) - Number(a.numara));

const giris = DILLER.map(
  (d) => `<div class="giris d-${d}" lang="${d}">${METIN.giris[d].map((p) => `<p>${kacis(p)}</p>`).join("")}</div>`
).join("\n      ");

const liste =
  gonderiler.length > 0
    ? gonderiler.map(gonderiHtml).join("\n")
    : `\n      <p class="bos">${uc((d) => METIN.bos[d])}</p>`;

// Arama kutusu: yalnız gönderi varsa; JavaScript açılınca görünür (dil.js).
const arama =
  gonderiler.length > 0
    ? `<div class="arama" hidden>
      <label for="ara">${uc((d) => METIN.ara[d])}</label>
      <input id="ara" type="search" autocomplete="off"${DILLER.map((d) => ` data-ipucu-${d}="${kacis(METIN.araIpucu[d])}"`).join("")}>
      <p class="sonuc-yok" hidden>${uc((d) => METIN.sonucYok[d])}</p>
    </div>`
    : "";

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Meister Allein — Sources</title>
  <meta name="description" content="Sources behind the posts of Meister Allein (@meisterallein).">
  <meta name="theme-color" content="#07090b">
  <link rel="stylesheet" href="stil.css">
</head>
<body>
  <main class="sayfa">
    <header class="ust">
      <span class="cizgi"></span>
      <p class="ad">Meister Allein</p>
      <h1>${uc((d) => METIN.baslik[d])}</h1>
      <nav class="dil" hidden aria-label="Language · Sprache · Dil"${DILLER.map((d) => ` data-baslik-${d}="${kacis(METIN.sekme[d])}"`).join("")}>
        <button type="button" data-dil="en" lang="en">English</button>
        <button type="button" data-dil="de" lang="de">Deutsch</button>
        <button type="button" data-dil="tr" lang="tr">Türkçe</button>
      </nav>
      ${giris}
    </header>

    ${arama}
    <div class="gonderiler">${liste}
    </div>

    <footer class="alt">
      <a href="https://www.instagram.com/meisterallein/" rel="noopener noreferrer">Instagram @meisterallein</a>
    </footer>
  </main>
  <script src="dil.js"></script>
</body>
</html>
`;

writeFileSync(ciktiYolu, html, "utf8");
console.log(`Üretildi: ${ciktiYolu} (${gonderiler.length} gönderi)`);
