# مصحف المحظرة (Mahdhara Mushaf)

تطبيق أندرويد مستقل (Flutter) للقرآن الكريم بروايتي **حفص عن عاصم** و**ورش عن نافع**.

- النصّ والخطّان: مجمّع الملك فهد لطباعة المصحف الشريف (حفص v18، ورش v10) عن
  [quran-data-kfgqpc](https://github.com/thetruetruth/quran-data-kfgqpc). ٦٠٤ صفحات كما في المصحف المطبوع.
- التفسير الميسّر (مجمّع الملك فهد، عن tanzil.net) وتفسير الجلالين، عن [quran-api](https://github.com/fawazahmed0/quran-api).
  التفسير مرتّب بعدّ حفص؛ آيات ورش تُربط بآيات حفص المقابلة بمحاذاة الكلمات داخل السورة (`tools/build_data.py`).
- التلاوة: سور كاملة من mp3quran.net (قائمة القرّاء تُجلب حسب الرواية)، وآية واحدة لحفص من everyayah.com (العفاسي).

البناء: الدفع إلى فرع `mushaf-app` يشغّل `.github/workflows/build-mushaf.yml` (إصدارات `mushaf-v1.0.N`، لا تُعلَّم «الأحدث»
حتى لا تختلط بتحديثات تطبيق الرواية). إعادة بناء البيانات: `python3 tools/build_data.py <مجلد المصادر> assets/data`.
