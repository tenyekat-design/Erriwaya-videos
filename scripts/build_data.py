"""يبني data.json لموقع الرواية: فيديوهات يوتيوب + نسخة من الأخبار المكتوبة (Firestore) + طقس العواصم.

يعمل داخل GitHub Actions كل نصف ساعة. المتصفح لا يستطيع قراءة يوتيوب مباشرة،
فهذا السكربت يقرأ صفحة القناة العامة (بلا مفاتيح) ويحفظ النتيجة مع الموقع.
الأخبار المكتوبة يقرؤها الموقع مباشرة من Firestore أيضاً، وهذه النسخة احتياطية.

الاستعمال: python scripts/build_data.py <مجلد الإخراج>
"""
import base64
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

CHANNEL = "UCI5O5rxscjt_t1S1gSbLAEg"
PROJECT = "erriwaya-68022"
FS = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
NOW = datetime.now(timezone.utc)


def get(url, headers=None, timeout=30):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


# ───────────── يوتيوب ─────────────

def yt_page(url):
    body = get(url, {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.8",
                     "Cookie": "CONSENT=YES+1; SOCS=CAI"})
    marker = "var ytInitialData = "
    s = body.find(marker)
    if s < 0:
        raise RuntimeError("no ytInitialData")
    e = body.find(";</script>", s)
    return json.loads(body[s + len(marker):e])


def find(o, key, out):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == key and isinstance(v, dict):
                out.append(v)
            else:
                find(v, key, out)
    elif isinstance(o, list):
        for x in o:
            find(x, key, out)
    return out


def at(o, *path):
    for k in path:
        if isinstance(o, dict) and isinstance(k, str):
            o = o.get(k)
        elif isinstance(o, list) and isinstance(k, int) and k < len(o):
            o = o[k]
        else:
            return None
    return o


def num(n, suffix):
    try:
        v = float(n.replace(",", ""))
    except ValueError:
        return 0
    return int(v * {"K": 1e3, "M": 1e6, "B": 1e9}.get((suffix or "").upper(), 1))


def parse_ago(s):
    m = re.search(r"(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago", s)
    if not m:
        return None
    n = int(m.group(1))
    days = {"second": n / 86400, "minute": n / 1440, "hour": n / 24, "day": n,
            "week": 7 * n, "month": 30 * n, "year": 365 * n}[m.group(2)]
    return NOW - timedelta(days=days)


def videos():
    data = yt_page(f"https://www.youtube.com/channel/{CHANNEL}/videos?hl=en&gl=MR")
    out = []
    for i, l in enumerate(find(data, "lockupViewModel", [])):
        vid = l.get("contentId")
        if not isinstance(vid, str) or len(vid) != 11:
            continue
        md = at(l, "metadata", "lockupMetadataViewModel")
        title = at(md, "title", "content") or ""
        parts = []
        for r in at(md, "metadata", "contentMetadataViewModel", "metadataRows") or []:
            for p in (r or {}).get("metadataParts") or []:
                lab = at(p, "accessibilityLabel") or at(p, "text", "content")
                if isinstance(lab, str):
                    parts.append(lab)
        published = NOW - timedelta(minutes=i)
        views = 0
        for s in parts:
            published = parse_ago(s) or published
            vm = re.search(r"([\d,.]+)\s*([KMB])?\s*views?", s, re.I)
            if vm:
                views = num(vm.group(1), vm.group(2))
        out.append({"id": vid, "title": title.strip(), "published": published.isoformat(),
                    "views": views, "short": False})
    return out


def shorts():
    try:
        data = yt_page(f"https://www.youtube.com/channel/{CHANNEL}/shorts?hl=en&gl=MR")
    except Exception as e:  # noqa: BLE001
        print("shorts:", e)
        return []
    out = []
    for l in find(data, "shortsLockupViewModel", []):
        vid = at(l, "onTap", "innertubeCommand", "reelWatchEndpoint", "videoId") or \
            (l.get("entityId") or "").replace("shorts-shelf-item-", "")
        if not isinstance(vid, str) or len(vid) != 11:
            continue
        title = at(l, "overlayMetadata", "primaryText", "content") or ""
        vt = at(l, "overlayMetadata", "secondaryText", "content") or ""
        vm = re.search(r"([\d,.]+)\s*([KMB])?", vt, re.I)
        out.append({"id": vid, "title": title.strip(), "published": None,
                    "views": num(vm.group(1), vm.group(2)) if vm else 0, "short": True})
    return out


# ───────────── Firestore ─────────────

def fs_value(v):
    if "stringValue" in v:
        return v["stringValue"]
    if "booleanValue" in v:
        return v["booleanValue"]
    if "integerValue" in v:
        return int(v["integerValue"])
    if "doubleValue" in v:
        return v["doubleValue"]
    if "timestampValue" in v:
        return v["timestampValue"]
    if "arrayValue" in v:
        return [fs_value(x) for x in v["arrayValue"].get("values", [])]
    if "mapValue" in v:
        return {k: fs_value(x) for k, x in v["mapValue"].get("fields", {}).items()}
    return None


def fs_doc(d):
    f = {k: fs_value(v) for k, v in d.get("fields", {}).items()}
    f["id"] = d["name"].rsplit("/", 1)[1]
    return f


def all_article_docs(limit=2000):
    docs, token = [], ""
    while len(docs) < limit:
        url = f"{FS}/articles?pageSize=300&orderBy=createdAt%20desc" + (f"&pageToken={token}" if token else "")
        raw = json.loads(get(url))
        docs += raw.get("documents", [])
        token = raw.get("nextPageToken")
        if not token:
            break
    return docs


def articles(out_dir):
    os.makedirs(os.path.join(out_dir, "img"), exist_ok=True)
    out = []
    for d in all_article_docs():
        a = fs_doc(d)
        imgs = []
        if a.get("imageCount"):
            try:
                sub = json.loads(get(f"{FS}/articles/{a['id']}/images?pageSize=20"))
                docs = sorted((fs_doc(x) for x in sub.get("documents", [])),
                              key=lambda x: x.get("i", 0))
                for x in docs:
                    name = f"img/{a['id']}-{x.get('i', 0)}.jpg"
                    with open(os.path.join(out_dir, name), "wb") as fh:
                        fh.write(base64.b64decode(x["data"]))
                    imgs.append(name)
            except Exception as e:  # noqa: BLE001
                print("images", a["id"], e)
        if not imgs and a.get("thumb"):
            try:
                name = f"img/{a['id']}-t.jpg"
                with open(os.path.join(out_dir, name), "wb") as fh:
                    fh.write(base64.b64decode(a["thumb"]))
                imgs.append(name)
            except Exception as e:  # noqa: BLE001
                print("thumb", a["id"], e)
        out.append({
            "id": a["id"], "title": a.get("title", ""), "body": a.get("body", ""),
            "category": a.get("category", ""), "breaking": bool(a.get("breaking")),
            "thumb": a.get("thumb", ""), "images": imgs,
            "portals": a.get("portals") or [], "createdAt": a.get("createdAt"),
        })
    return out


# ───────────── الطقس ─────────────
# Open-Meteo (مجاني، بلا مفتاح): الطقس الحالي وأعلى/أدنى حرارة اليوم في عواصم البوابات.
# طلب واحد لكل المدن كل نصف ساعة، فلا يتصل المتصفح بالخدمة.
CITIES = [  # رمز البوابة، المدينة، خط العرض، خط الطول
    ("mr", "نواكشوط", 18.0858, -15.9785), ("ma", "الرباط", 34.0209, -6.8416),
    ("dz", "الجزائر", 36.7538, 3.0588), ("tn", "تونس", 36.8065, 10.1815),
    ("ly", "طرابلس", 32.8872, 13.1913), ("eh", "العيون", 27.1536, -13.2033),
    ("sn", "داكار", 14.7167, -17.4677), ("ml", "باماكو", 12.6392, -8.0029),
    ("ne", "نيامي", 13.5116, 2.1254), ("td", "انجامينا", 12.1348, 15.0557),
    ("gm", "بانجول", 13.4549, -16.5790),
]


def weather():
    q = ("latitude=" + ",".join(str(c[2]) for c in CITIES)
         + "&longitude=" + ",".join(str(c[3]) for c in CITIES)
         + "&current=temperature_2m,weather_code,is_day,wind_speed_10m,relative_humidity_2m"
         + "&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1")
    raw = json.loads(get("https://api.open-meteo.com/v1/forecast?" + q))
    if isinstance(raw, dict):
        raw = [raw]
    out = []
    for (code, name, _, _), w in zip(CITIES, raw):
        cur, day = w["current"], w.get("daily", {})
        out.append({
            "portal": code, "city": name,
            "temp": round(cur["temperature_2m"]), "wmo": cur["weather_code"], "day": bool(cur.get("is_day", 1)),
            "wind": round(cur.get("wind_speed_10m", 0)), "hum": cur.get("relative_humidity_2m"),
            "max": round(day["temperature_2m_max"][0]) if day.get("temperature_2m_max") else None,
            "min": round(day["temperature_2m_min"][0]) if day.get("temperature_2m_min") else None,
        })
    return {"updated": NOW.isoformat(), "cities": out}


def site_info():
    try:
        return fs_doc(json.loads(get(f"{FS}/site/info")))
    except Exception as e:  # noqa: BLE001
        print("site info:", e)
        return {}


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out_dir, exist_ok=True)
    prev = {}
    try:
        with open(os.path.join(out_dir, "data.json"), encoding="utf-8") as fh:
            prev = json.load(fh)
    except Exception:  # noqa: BLE001
        pass

    data = {"updated": NOW.isoformat()}
    try:
        vids = videos() + shorts()
        seen = set()
        data["videos"] = [v for v in vids if not (v["id"] in seen or seen.add(v["id"]))]
    except Exception as e:  # noqa: BLE001
        print("videos:", e)
        data["videos"] = prev.get("videos", [])
    try:
        arts = articles(out_dir)
        data["articles"] = arts[:60]
    except Exception as e:  # noqa: BLE001
        print("articles:", e)
        arts = data["articles"] = prev.get("articles", [])
    try:
        import news_pages
        print("news pages=%d recent=%d" % news_pages.build(out_dir, arts, NOW))
    except Exception as e:  # noqa: BLE001
        print("news pages:", e)
    data["site"] = site_info() or prev.get("site", {})
    try:
        data["weather"] = weather()
    except Exception as e:  # noqa: BLE001
        print("weather:", e)
        data["weather"] = prev.get("weather", {})

    with open(os.path.join(out_dir, "data.json"), "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False)
    print(f"videos={len(data['videos'])} articles={len(data['articles'])} "
          f"weather={len(data['weather'].get('cities', []))}")


if __name__ == "__main__":
    main()
