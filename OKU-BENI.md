# Kanıt sayfası (yerel prototip)

Plan ve kurallar: `00-beyin/kanit-sayfasi.md`. Durum: yerel prototip, yayınlanmadı.

## Dosyalar
- `veri/kaynaklar.json` — tek veri kaynağı. Sadece Kaynak Kaydı'nda "Evet" olan kayıtlar buraya girer.
- `olustur.mjs` — veriden `index.html` üretir. Doğrulanmamış veya eksik kayıt görürse sayfayı üretmez.
- `dil.js` — tarayıcı dilini (EN/DE/TR) seçer, dil düğmesini çalıştırır. Çerez veya kayıt yok.
- `stil.css` — görünüm (gorsel-dil.md renkleri, IBM Plex Sans).
- `yazi/` — IBM Plex Sans dosyaları, sayfayla birlikte sunulur (Google Fonts'a istek gitmez). Lisans: `yazi/OFL-LICENSE.txt`.

## Sayfayı üretmek
```
node olustur.mjs
```

Giriş metni ve düğme yazıları veride değil, `olustur.mjs` içindeki `METIN` bölümünde (EN/DE/TR).

## Veri biçimi
```json
{
  "gonderiler": [
    {
      "numara": "001",
      "tarih": "yyyy-aa-gg",
      "konu": "isteğe bağlı kısa konu satırı",
      "kaynaklar": [
        {
          "kisi": "Kaynak Kaydı: Kişi",
          "soz": "Kaynak Kaydı: Söz / görüş (orijinal dil)",
          "sozDili": "de / en / la ... (dil kodu)",
          "ceviriEn": "Kaynak Kaydı: EN çeviri (söz İngilizce değilse zorunlu)",
          "ceviriDe": "isteğe bağlı DE çeviri (yoksa EN çeviri gösterilir)",
          "ceviriTr": "isteğe bağlı TR çeviri (yoksa EN çeviri gösterilir)",
          "kunye": "Kaynak Kaydı: Kaynak (eser, yıl, sayfa)",
          "baglanti": "Kaynak Kaydı: Bağlantı (isteğe bağlı, http/https)",
          "dogrulandi": "Evet"
        }
      ]
    }
  ]
}
```

Arama kutusu (`dil.js`): gönderi varsa görünür; numara veya kelimeyle gönderileri süzer.
