# إنفوجرافيك الرواية

فيديوهات إنفوجرافيك بلا تعليق صوتي (موسيقى فقط)، بألوان الرواية: الكحلي والأخضر والأبيض، والأحمر بقلة.
تستعمل خط AL-Quds والشعار وبيانات الخريطة والموسيقى من القالب (`assets/` و`src/map-data.js` و`src/icons.js`) دون تعديلها.

```bash
node infographics/render.js --name camels-maghreb                  # فيسبوك طولي 1080x1350
node infographics/render.js --name camels-maghreb --format story   # ستوري/ريلز 1080x1920
node infographics/render.js --name camels-maghreb --stills 3,20,45 # صور للمراجعة في output/stills/
```

- `camels-maghreb/data.js`: الأرقام والمصادر والصور. `camels-maghreb/app.js`: المشاهد والحركة.
- المخرجات: `output/erriwaya-infographic-<name>[-story].mp4` مع غلاف `-cover.jpg` مدمج في الفيديو.
