"""ملفات الرواية: صفحة لكل قضية متواصلة، فيها «ما تحتاج معرفته» والمحطات الرئيسية وخط زمني بكل ما نُشر عنها.

المصدر: dossiers.json في جذر الفرع (يكتبه المحرر): العنوان والملخص والمحطات، وكلمات `match` التي تُلحق بالملف
كل خبر (العنوان أو النص) وكل فيديو (العنوان) منشور منذ `since` يذكر إحداها، و`include` / `exclude` لمواد بعينها،
و`key` للمحطات البارزة (معرّف المادة ← وصفها). حقل `dossier` في الخبر (إن أضافته لوحة التطبيق لاحقاً) يُلحقه أيضاً.
الناتج: files/index.json (يقرؤه الموقع) وصفحة ثابتة files/<id>.html لكل ملف (لمحركات البحث والمشاركة).
"""
import html
import json
import os
import re
from datetime import datetime, timezone

import brand

SITE = "https://erriwaya.com"
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dossiers.json")
PORTALS = {"mr": "موريتانيا", "ma": "المغرب", "dz": "الجزائر", "tn": "تونس", "ly": "ليبيا", "eh": "الصحراء",
           "az": "أزواد", "sn": "السنغال", "ml": "مالي", "ne": "النيجر", "td": "تشاد", "gm": "غامبيا"}
AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
AR_DAYS = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
e = lambda x: html.escape(str(x or ""), quote=True)


def fold(t):
    """التطبيع نفسه في بحث الموقع: بلا تشكيل ولا تطويل، الهمزات ألفاً، التاء المربوطة هاءً، الألف المقصورة ياءً."""
    t = re.sub(r"[ً-ْٰـ]", "", str(t or "").lower())
    for a, b in (("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ٱ", "ا"), ("ة", "ه"), ("ى", "ي"), ("ؤ", "و"), ("ئ", "ي"), ("_", " ")):
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t)


def _date(s):
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except Exception:  # noqa: BLE001
        return None


def _summary(body, n=220):
    t = " ".join((body or "").split())
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0].rstrip("،,.؛") + "…"


def _day(d):
    return f"{AR_DAYS[d.weekday()]} {d.day} {AR_MONTHS[d.month - 1]}"


def _long(iso):
    d = datetime.fromisoformat(iso)
    return f"{d.day} {AR_MONTHS[d.month - 1]} {d.year}"


def members(dz, arts, videos):
    """مواد الملف، الأحدث أولاً: [(نوع، المادة، التاريخ)]."""
    words = [fold(w) for w in dz.get("match", []) if w.strip()]
    since = _date(dz.get("since", "2000-01-01") + "T00:00:00+00:00")
    inc, exc = set(dz.get("include", [])), set(dz.get("exclude", []))
    out = []
    for a in arts:
        d = _date(a.get("createdAt"))
        if a["id"] in exc or not d:
            continue
        t = fold(f"{a.get('title', '')} {a.get('body', '')}")
        if a["id"] in inc or a.get("dossier") == dz["id"] or (d >= since and any(w in t for w in words)):
            out.append(("a", a, d))
    for v in videos:
        d = _date(v.get("published"))
        if v["id"] in exc or not d or v.get("short"):
            continue
        if v["id"] in inc or (d >= since and any(w in fold(v.get("title")) for w in words)):
            out.append(("v", v, d))
    return sorted(out, key=lambda x: x[2], reverse=True)


PAGE = """<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ملف: {title} | الرواية</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="شبكة الرواية الإعلامية">
<meta property="og:locale" content="ar_AR">
<meta property="og:title" content="ملف: {title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#004A49">
<link rel="icon" href="../assets/icon.png">
{head_links}
<script type="application/ld+json">{ld}</script>
<style>
@font-face {{ font-family: "Al Quds"; src: url("../assets/al-quds.otf") format("opentype"); font-display: swap;
  unicode-range: U+0020, U+0025, U+0027-0029, U+002C-0039, U+003F, U+0041-005A, U+0061-007A, U+00A0, U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+2010-2015; }}
:root {{ --brand:#004A49; --brand-deep:#00302F; --on-brand:#F2F7F6; --red:#C8102E; --paper:#F4F7F6; --surface:#fff; --ink:#0F1E1D; --muted:#586A68; --line:#DAE3E1; --link:#00605E; --chip:#E6EEEC }}
@media (prefers-color-scheme: dark) {{ :root {{ --paper:#071514; --surface:#0D201F; --ink:#E6EFED; --muted:#93A7A4; --line:#1D3432; --link:#6CC5C0; --chip:#15302E; --brand-deep:#002423; color-scheme: dark }} }}
* {{ box-sizing: border-box }}
body {{ margin:0; background:var(--paper); color:var(--ink); font:17px/1.9 "Al Quds","Segoe UI",Tahoma,sans-serif }}
a {{ color:var(--link) }}
img {{ max-width:100%; display:block }}
.wrap {{ max-width:900px; margin-inline:auto; padding-inline:16px }}
{css}
{brand_css}
</style>
</head>
<body>
{header}
<main class="wrap">{body}</main>
{footer}
</body>
</html>
"""

# مشترك بين الصفحة الثابتة والموقع (الموقع يضيف نسخة منه في index.html)
CSS = """
.dz-sh { display: flex; flex-wrap: wrap; align-items: center; gap: 10px }
.dz-sh .share-l { color: var(--muted); font-size: 15px; margin-inline-end: 4px }
.sh { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; color: #fff; text-decoration: none }
.sh:hover { filter: brightness(1.08) }
.sh svg { width: 20px; height: 20px }
.sh.wa { background: #25D366 } .sh.fb { background: #1877F2 } .sh.tg { background: #229ED9 } .sh.xx { background: #000 }
.dz { padding-block: 22px 36px; display: grid; gap: 20px }
.dz-crumb { font-size: 14px; color: var(--muted) } .dz-crumb a { color: var(--link); text-decoration: none }
.dz h1 { margin: 0; font-size: 36px; line-height: 1.35; text-wrap: balance }
.dz-lede { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; color: var(--muted); font-size: 14px }
.dz-live { display: inline-flex; align-items: center; gap: 6px; color: var(--red); font-weight: 600 }
.dz-live::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--red) }
.dz-live.done { color: var(--muted) } .dz-live.done::before { background: var(--muted) }
.dz-por { display: flex; gap: 6px; flex-wrap: wrap }
.dz-por a { background: var(--chip); color: var(--link); border-radius: 999px; padding: 1px 10px; font-size: 13px; text-decoration: none }
.dz-know { background: var(--surface); border: 1px solid var(--line); border-inline-start: 4px solid var(--brand); border-radius: 8px; padding: 16px 20px; display: grid; gap: 8px }
.dz-know h2 { margin: 0; font-size: 21px; line-height: 1.3 }
.dz-know ul { margin: 0; padding-inline-start: 20px; display: grid; gap: 6px; line-height: 1.8 }
.dz-steps { display: grid; grid-template-columns: repeat(var(--n, 4), minmax(0, 1fr)); position: relative; margin: 4px 0 0; padding: 0; list-style: none }
.dz-steps::before { content: ""; position: absolute; top: 9px; inset-inline: calc(50% / var(--n, 4)); height: 2px; background: var(--line) }
.dz-steps li { display: grid; justify-items: center; text-align: center; gap: 2px; position: relative; padding-inline: 6px }
.dz-steps i { width: 14px; height: 14px; border-radius: 50%; background: var(--brand); outline: 4px solid var(--paper); margin-top: 2px }
.dz-steps .next i { background: var(--paper); border: 2px dashed var(--brand) }
.dz-steps b { font-size: 16px; line-height: 1.3; margin-top: 4px } .dz-steps span { font-size: 13px; color: var(--muted); line-height: 1.5 }
.dz-h { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid var(--ink); padding-bottom: 6px }
.dz-h h2 { margin: 0; font-size: 26px; line-height: 1.2 } .dz-h span { color: var(--link); font-size: 14px }
.dz-tl { list-style: none; margin: 0; padding: 0; position: relative }
.dz-tl::before { content: ""; position: absolute; top: 6px; bottom: 6px; inset-inline-start: 7px; width: 2px; background: var(--line) }
.dz-day h3 { margin: 0; font-size: 18px; line-height: 1; color: var(--link); padding: 18px 30px 8px; position: relative }
.dz-day h3::before { content: ""; position: absolute; inset-inline-start: 1px; top: 16px; width: 14px; height: 14px; border-radius: 3px; background: var(--brand) }
.dz-ev { position: relative; padding-inline-start: 30px; padding-block: 6px }
.dz-ev::before { content: ""; position: absolute; inset-inline-start: 3px; top: 26px; width: 10px; height: 10px; border-radius: 50%; background: var(--surface); border: 2px solid var(--link); box-sizing: border-box; width: 12px; height: 12px }
.dz-ev > a { display: grid; grid-template-columns: minmax(0, 1fr) 160px; gap: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; align-items: start; color: var(--ink); text-decoration: none }
.dz-ev > a:hover { border-color: var(--link) } .dz-ev > a:hover h4 { color: var(--link) }
.dz-m { display: flex; gap: 10px; align-items: center; font-size: 13px; color: var(--muted) }
.dz-kind { background: var(--chip); color: var(--link); padding: 0 8px; border-radius: 4px; font-weight: 600 }
.dz-kind.v { background: rgb(200 16 46 / .1); color: var(--red) }
.dz-new { background: #F6D365; color: #13201F; padding: 0 8px; border-radius: 4px; font-weight: 600 }
.dz-ev h4 { margin: 4px 0 2px; font-size: 17px; font-weight: 600; line-height: 1.6 }
.dz-ev p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden }
.dz-th { aspect-ratio: 16/10; border-radius: 6px; overflow: hidden; background: var(--brand); position: relative; display: grid; place-items: center }
.dz-th img { width: 100%; height: 100%; object-fit: cover } .dz-th img.logo { width: 34%; height: auto; object-fit: contain }
.dz-play { position: absolute; inset-inline-start: 8px; bottom: 8px; background: rgb(0 0 0 / .65); color: #fff; border-radius: 999px; font-size: 12px; padding: 2px 10px }
.dz-ev.key::before { inset-inline-start: 1px; width: 16px; height: 16px; background: var(--red); border-color: var(--red); box-shadow: 0 0 0 4px rgb(200 16 46 / .15) }
.dz-ev.key > a { border-color: var(--red); grid-template-columns: minmax(0, 1fr) 250px }
.dz-ev.key h4 { font-size: 21px; line-height: 1.45 }
.dz-flag { display: inline-block; background: var(--red); color: #fff; font-size: 14px; line-height: 1; padding: 5px 9px 3px; border-radius: 3px; margin-bottom: 6px }
.dz-end { text-align: center; color: var(--muted); font-size: 14px; margin: 8px 0 0 }
@media (max-width: 640px) {
  .dz h1 { font-size: 28px }
  .dz-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 14px } .dz-steps::before { display: none }
  .dz-ev > a, .dz-ev.key > a { grid-template-columns: minmax(0, 1fr) } .dz-th { order: -1 }
  .dz-ev.key h4 { font-size: 19px }
}
"""


def _page(dz, items, now):
    from urllib.parse import quote
    url = f"{SITE}/files/{dz['id']}.html"
    desc = " ".join(dz.get("summary", []))[:300] or dz["title"]
    first_img = next((x[1]["images"][0] for x in items if x[0] == "a" and x[1].get("images")), None)
    image = f"{SITE}/{first_img}" if first_img else f"{SITE}/assets/og.png"
    rows, day = [], None
    for k, it, d in items:
        if d.date() != day:
            day = d.date()
            rows.append(f'<li class="dz-day"><h3>{_day(d)}</h3></li>')
        key = dz.get("key", {}).get(it["id"])
        if k == "a":
            href = f"../news/{e(it['id'])}.html"
            img = (it.get("images") or [None])[0]
            th = f'<div class="dz-th"><img src="../{e(img)}" alt="" loading="lazy"></div>' if img else ""
            kind, ex = '<span class="dz-kind">خبر</span>', _summary(it.get("body"))
        else:
            href = f"https://www.youtube.com/watch?v={e(it['id'])}"
            th = (f'<div class="dz-th"><img src="https://i.ytimg.com/vi/{e(it["id"])}/hqdefault.jpg" alt="" loading="lazy">'
                  '<span class="dz-play">فيديو</span></div>')
            kind, ex = '<span class="dz-kind v">فيديو</span>', "تقرير مصور على قناة الرواية في يوتيوب."
        rows.append(f'<li class="dz-ev{" key" if key else ""}"><a href="{href}"><div>'
                    + (f'<span class="dz-flag">محطة بارزة: {e(key)}</span>' if key else "")
                    + f'<div class="dz-m">{kind}<time datetime="{d.isoformat()}">{d:%H:%M}</time></div>'
                    f'<h4>{e(it.get("title"))}</h4><p>{e(ex)}</p></div>{th}</a></li>')
    body = view_html(dz, len(items), "".join(rows), "../", url)
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": dz["title"], "description": desc,
          "url": url, "inLanguage": "ar", "dateModified": dz.get("updated"),
          "publisher": {"@type": "NewsMediaOrganization", "name": "شبكة الرواية الإعلامية", "url": SITE + "/"},
          "hasPart": [{"@type": "NewsArticle" if k == "a" else "VideoObject", "headline" if k == "a" else "name": it.get("title", "")[:110],
                       "url": f"{SITE}/news/{it['id']}.html" if k == "a" else f"https://www.youtube.com/watch?v={it['id']}",
                       "datePublished" if k == "a" else "uploadDate": d.isoformat()} for k, it, d in items[:30]]}
    return PAGE.format(title=e(dz["title"]), desc=e(desc), url=e(url), image=e(image), css=CSS, brand_css=brand.CSS,
                       head_links=brand.head_links("../"), header=brand.header("../"), footer=brand.footer("../", str(now.year)),
                       ld=json.dumps(ld, ensure_ascii=False).replace("</", "<\\/"), body=body.replace("{share}", quote(url, safe="")))



def _icon(k):
    vb, d = brand.ICONS.get(k, ("0 0 1 1", ""))
    return f'<svg viewBox="{vb}" aria-hidden="true"><path fill="currentColor" d="{d}"/></svg>'


def _share(dz, url):
    """أيقونات مشاركة الملف (كما تحت الأخبار)."""
    from urllib.parse import quote as q
    u, t = q(url, safe=""), q(dz["title"], safe="")
    wa = q(f'{dz["title"]} — {url}', safe="")
    links = [("wa", "واتساب", "whatsapp", f"https://wa.me/?text={wa}"),
             ("fb", "فيسبوك", "facebook", f"https://www.facebook.com/sharer/sharer.php?u={u}"),
             ("tg", "تيليغرام", "telegram", f"https://t.me/share/url?url={u}&text={t}"),
             ("xx", "إكس", "x", f"https://x.com/intent/post?url={u}&text={t}")]
    return ('<div class="share dz-sh"><span class="share-l">شارك الملف</span>' + "".join(
        f'<a class="sh {c}" href="{e(h)}" target="_blank" rel="noopener" aria-label="مشاركة الملف على {ar}" title="{ar}">{_icon(k)}</a>'
        for c, ar, k, h in links) + "</div>")

def view_html(dz, n, rows, prefix, url):
    """جسم صفحة الملف. الموقع يبني الجسم نفسه في index.html (dossierView) من files/index.json."""
    steps = dz.get("steps", [])
    live = dz.get("status", "active") == "active"
    por = "".join(f'<a href="{prefix}#p-{p}">{e(PORTALS.get(p, p))}</a>' for p in dz.get("portals", []))
    return f"""<article class="dz">
  <div class="dz-crumb"><a href="{prefix}">الرئيسية</a> ‹ <a href="{prefix}#files">ملفات الرواية</a></div>
  <h1>{e(dz["title"])}</h1>
  <div class="dz-lede"><span class="dz-live{"" if live else " done"}">{"ملف متواصل" if live else "ملف مغلق"}</span>
    {f'<span>آخر تحديث: {_long(dz["updated"])}</span>' if dz.get("updated") else ""}<span>{n} مادة</span><span class="dz-por">{por}</span></div>
  {_share(dz, url)}
  {f'''<section class="dz-know"><h2>ما تحتاج معرفته</h2><ul>{"".join(f"<li>{e(s)}</li>" for s in dz["summary"])}</ul></section>''' if dz.get("summary") else ""}
  {f'<ol class="dz-steps" style="--n:{len(steps)}" aria-label="المحطات الرئيسية">' + "".join(
      f'<li class="{"next" if s.get("next") else ""}"><i></i><b>{_long(s["d"]).rsplit(" ", 1)[0]}</b><span>{e(s["t"])}{" (قادمة)" if s.get("next") else ""}</span></li>'
      for s in steps) + "</ol>" if steps else ""}
  <section aria-label="الخط الزمني"><div class="dz-h"><h2>الخط الزمني</h2><span>الأحدث أولاً</span></div>
    <ol class="dz-tl">{rows}</ol>
    {f'<p class="dz-end">بداية الملف: {_long(dz["since"])}</p>' if dz.get("since") else ""}</section>
</article>"""


def build(out_dir, arts, videos, now=None):
    """يكتب files/index.json وصفحات الملفات، ويعيد صفوف خريطة الموقع."""
    now = now or datetime.now(timezone.utc)
    try:
        with open(SRC, encoding="utf-8") as fh:
            src = json.load(fh)
    except FileNotFoundError:
        src = []
    arts = [a for a in arts if a.get("id") and a.get("title")]
    os.makedirs(os.path.join(out_dir, "files"), exist_ok=True)
    index, rows = [], []
    for dz in src:
        items = members(dz, arts, videos)
        with open(os.path.join(out_dir, "files", f"{dz['id']}.html"), "w", encoding="utf-8") as fh:
            fh.write(_page(dz, items, now))
        index.append({**dz, "items": [[k, it["id"]] for k, it, _ in items],
                      "latest": items[0][2].isoformat() if items else None})
        lm = f"<lastmod>{items[0][2].strftime('%Y-%m-%dT%H:%M:%SZ')}</lastmod>" if items else ""
        rows.append(f"  <url><loc>{SITE}/files/{e(dz['id'])}.html</loc>{lm}<changefreq>daily</changefreq><priority>0.9</priority></url>")
    with open(os.path.join(out_dir, "files", "index.json"), "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, separators=(",", ":"))
    return rows
