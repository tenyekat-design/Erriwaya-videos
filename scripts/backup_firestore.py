"""نسخة احتياطية يومية لأخبار الرواية من Firestore إلى فرع backup في GitHub.

تشغيل: python3 scripts/backup_firestore.py <مجلد فرع backup>

- articles/<id>.json : المستند كما هو في قاعدة البيانات (صيغة Firestore REST، تصلح للاسترجاع حرفياً)،
  مع updateTime ووصف الصور (دون بياناتها).
- articles/<id>/<i>.jpg : صور الخبر.
- site-info.json : معلومات «من نحن» والاتصال.
- index.json : فهرس كل الأخبار المحفوظة، ومنها ما حُذف من قاعدة البيانات (deleted_at) — لا يُمحى أي خبر من النسخة.

لا تُقرأ صور خبر إلا إذا كان جديداً أو عُدّل منذ آخر نسخة، فتبقى القراءات ضمن الخطة المجانية.
رسائل القراء لا تُنسخ هنا لأن المستودع عام.
"""
import base64
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

PROJECT = "erriwaya-68022"
FS = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"
NOW = datetime.now(timezone.utc).isoformat(timespec="seconds")


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url), timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def all_docs(path):
    docs, token = [], ""
    while True:
        raw = get(f"{FS}/{path}?pageSize=300" + (f"&pageToken={token}" if token else ""))
        docs += raw.get("documents", [])
        token = raw.get("nextPageToken")
        if not token:
            return docs


def write_json(path, obj):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1, sort_keys=True)
        fh.write("\n")


def main(out):
    idx_path = os.path.join(out, "index.json")
    try:
        with open(idx_path, encoding="utf-8") as fh:
            index = json.load(fh)
    except (OSError, ValueError):
        index = {}

    docs = all_docs("articles")
    if not docs and index:
        sys.exit("قاعدة البيانات أعادت صفراً من الأخبار؛ لم تُغيَّر النسخة الاحتياطية.")
    live, new, changed = set(), 0, 0
    for d in docs:
        aid = d["name"].rsplit("/", 1)[1]
        live.add(aid)
        old = index.get(aid, {})
        title = d.get("fields", {}).get("title", {}).get("stringValue", "")
        if old.get("updateTime") == d.get("updateTime") and not old.get("deleted_at"):
            continue
        images = []
        for im in sorted(all_docs(f"articles/{aid}/images"),
                         key=lambda x: int(x.get("fields", {}).get("i", {}).get("integerValue", 0))):
            f = im.get("fields", {})
            i = int(f.get("i", {}).get("integerValue", len(images)))
            data = f.get("data", {}).get("stringValue")
            if data:
                p = os.path.join(out, "articles", aid, f"{i}.jpg")
                os.makedirs(os.path.dirname(p), exist_ok=True)
                with open(p, "wb") as fh:
                    fh.write(base64.b64decode(data))
            images.append({"i": i, "file": f"articles/{aid}/{i}.jpg",
                           "fields": {k: v for k, v in f.items() if k != "data"}})
        write_json(os.path.join(out, "articles", f"{aid}.json"),
                   {"name": d["name"], "createTime": d.get("createTime"), "updateTime": d.get("updateTime"),
                    "fields": d.get("fields", {}), "images": images})
        new, changed = (new + 1, changed) if not old else (new, changed + 1)
        index[aid] = {"title": title, "updateTime": d.get("updateTime"), "images": len(images),
                      "first_backup": old.get("first_backup", NOW), "last_backup": NOW}

    gone = 0
    for aid, meta in index.items():
        if aid not in live and not meta.get("deleted_at"):
            meta["deleted_at"] = NOW
            gone += 1

    try:
        write_json(os.path.join(out, "site-info.json"), get(f"{FS}/site/info"))
    except Exception as e:  # noqa: BLE001
        print("site/info:", e)
    write_json(idx_path, index)
    with open(os.path.join(out, "README.md"), "w", encoding="utf-8") as fh:
        fh.write(f"# نسخة احتياطية لأخبار الرواية\n\nآخر نسخة: {NOW}\n\n"
                 f"- الأخبار في قاعدة البيانات الآن: {len(live)}\n"
                 f"- كل الأخبار المحفوظة (ومنها المحذوفة من اللوحة): {len(index)}\n\n"
                 "كل خبر في `articles/<id>.json` وصوره في `articles/<id>/`. الفهرس في `index.json`.\n")
    print(f"live={len(live)} new={new} changed={changed} deleted={gone} total={len(index)}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "backup")
