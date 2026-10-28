# موقع الرواية (Erriwaya website)

- `index.html`: الموقع كاملاً (صفحة واحدة، عربي RTL، خط القدس، أخضر #004A49).
- الأخبار المكتوبة تُقرأ مباشرة من Firestore (`erriwaya-68022`) فتظهر فور نشرها من لوحة التطبيق؛ «عاجل» لنصف ساعة.
- فيديوهات يوتيوب: `scripts/build_data.py` يقرأ قناة @ERRIWAYA ويكتب `data.json` (+ صور الأخبار في `img/`).
- النشر: `.github/workflows/website.yml` يبني الموقع ويدفعه إلى فرع `gh-pages` (GitHub Pages) عند كل دفع لهذا الفرع، وكل نصف ساعة
  عبر `website-refresh.yml` في الفرع الافتراضي. مرة واحدة: Settings ← Pages ← Deploy from a branch ← gh-pages.
- نطاق خاص: أضف ملف `CNAME` فيه اسم النطاق (مثل erriwaya.mr) ثم اضبط DNS.
