# إنفوجرافيك الرواية

فيديوهات إنفوجرافيك بلا تعليق صوتي، على خلفية بيضاء بألوان الرواية: الكحلي والأخضر، والأحمر بقلة.
الشعار بحجم يناسب الإطار أعلى اليسار داخل المنطقة الآمنة.
تستعمل خط AL-Quds والشعار وبيانات الخريطة والموسيقى من القالب (`assets/` و`src/map-data.js` و`src/icons.js`) دون تعديلها.

```bash
node infographics/render.js --name camels-maghreb                  # فيسبوك طولي 1080x1350
node infographics/render.js --name camels-maghreb --format story   # ستوري/ريلز 1080x1920
node infographics/render.js --name camels-maghreb --stills 3,20,45 # صور للمراجعة في output/stills/
```

- `donkeys-maghreb/`: إنفوجرافيك الحمير (بلا صور: خرائط ورموز؛ الرمز من Health Icons برخصة MIT)، يُصيَّر بالأمرين نفسيهما مع `--name donkeys-maghreb`.
- `gold-mauritania/`: إنفوجرافيك الذهب في موريتانيا (الاحتياطات، الاستخراج، البنك المركزي، العوائق؛ خرائط ورمز سبيكة)، `--name gold-mauritania`.
- `camels-maghreb/data.js`: الأرقام والمصادر والصور. `camels-maghreb/app.js`: المشاهد والانتقالات (انتقال مختلف لكل قطع).
- `camels-maghreb/timeline.js`: التوقيت على شبكة موسيقية (96 نبضة في الدقيقة، كل قطع على بداية مازورة)،
  يقرؤه `app.js` و`score.py` معاً.
- `camels-maghreb/score.py`: موسيقى أصلية ومؤثرات صوتية مركّبة برمجياً على التوقيت نفسه -> `score.wav`
  (يُعاد توليده تلقائياً عند التصيير إذا تغيّر التوقيت؛ يحتاج numpy وscipy).
- المخرجات: `output/erriwaya-infographic-<name>[-story].mp4` مع غلاف `-cover.jpg` مدمج في الفيديو.
- `aman-hydrogen/`: إنفوجرافيك مشروع «أمان» للهيدروجين الأخضر في موريتانيا (12 نوفمبر 2026) بقالب الإبل وصور من ويكيميديا كومنز، مع موسيقى عصرية 120 نبضة (future-house)، `--name aman-hydrogen`.
