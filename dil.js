// Dil seçimi ve gönderi arama. Tarayıcı dilini (en/de/tr) seçer; çerez veya kayıt yok.
(function () {
  var kodlar = ["en", "de", "tr"];
  var nav = document.querySelector(".dil");
  if (!nav) return;
  var dugmeler = nav.querySelectorAll("button");
  var kutu = document.getElementById("ara");

  function sec(d) {
    document.documentElement.lang = d;
    document.title = nav.getAttribute("data-baslik-" + d) || document.title;
    for (var i = 0; i < dugmeler.length; i++) {
      dugmeler[i].setAttribute("aria-pressed", dugmeler[i].getAttribute("data-dil") === d ? "true" : "false");
    }
    if (kutu) kutu.setAttribute("placeholder", kutu.getAttribute("data-ipucu-" + d) || "");
  }

  var tercihler = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
  var secilen = "en";
  for (var i = 0; i < tercihler.length; i++) {
    var k = String(tercihler[i]).slice(0, 2).toLowerCase();
    if (kodlar.indexOf(k) > -1) { secilen = k; break; }
  }

  nav.hidden = false;
  nav.addEventListener("click", function (e) {
    var d = e.target && e.target.getAttribute && e.target.getAttribute("data-dil");
    if (d) sec(d);
  });
  sec(secilen);

  // Düğme ve arama kutusu sonradan göründüğü için düzen kayar; #001 gibi bir link açıldıysa hedefe geri dön.
  function hedefeGit() {
    if (!location.hash || location.hash.length < 2) return;
    var hedef = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (hedef && !hedef.hidden) hedef.scrollIntoView();
  }

  // Arama: "#001", "001" ve "1" aynı gönderiyi bulur. Numara bulunmazsa (ör. "2026") veya
  // harf varsa söz, kişi, çeviri, künye ve tarihte aranır. İ/ı, ö, ß gibi harfler farksız sayılır.
  if (!kutu) { hedefeGit(); return; }
  var kap = kutu.parentNode;
  var yok = kap.querySelector(".sonuc-yok");
  var gonderiler = document.querySelectorAll(".gonderi");
  kap.hidden = false;

  function sade(s) {
    return String(s).toLowerCase().replace(/ı/g, "i").replace(/ß/g, "ss")
      .normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  var metinler = [];
  for (var j = 0; j < gonderiler.length; j++) metinler.push(sade(gonderiler[j].getAttribute("data-ara") || ""));

  function ara() {
    var q = sade(kutu.value.trim().replace(/^#/, "")).replace(/\s+/g, " ");
    var uygun = [];
    var bulunan = 0;
    var sayi = /^\d+$/.test(q);
    if (sayi) {
      for (var i = 0; i < gonderiler.length; i++) {
        uygun[i] = Number(gonderiler[i].id) === Number(q);
        if (uygun[i]) bulunan++;
      }
    }
    if (!sayi || bulunan === 0) {
      bulunan = 0;
      for (var m = 0; m < gonderiler.length; m++) {
        uygun[m] = q === "" || (gonderiler[m].id + " " + metinler[m]).indexOf(q) > -1;
        if (uygun[m]) bulunan++;
      }
    }
    for (var n = 0; n < gonderiler.length; n++) gonderiler[n].hidden = !uygun[n];
    yok.hidden = bulunan > 0;
  }
  kutu.addEventListener("input", ara);
  hedefeGit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(hedefeGit);
})();
