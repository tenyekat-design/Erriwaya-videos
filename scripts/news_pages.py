"""صفحات الأخبار الثابتة لموقع الرواية: صفحة لكل خبر في news/<id>.html، وخريطة الموقع، وخريطة أخبار جوجل.

الموقع يعرض الأخبار من Firestore داخل الصفحة الرئيسية، فلا تجد محركات البحث لكل خبر رابطاً مستقلاً.
هذه الصفحات تُبنى كل نصف ساعة مع data.json، وفيها العنوان والنص والصورة وبيانات NewsArticle،
فيظهر كل خبر في نتائج البحث ويعرض بطاقة صحيحة عند مشاركته على واتساب وفيسبوك.
"""
import html

import brand
import json
import os
from datetime import datetime, timedelta, timezone

SITE = "https://erriwaya.com"
NAME = "شبكة الرواية الإعلامية"
STATIC = ["about.html", "editorial-policy.html", "corrections.html", "privacy.html"]
PORTALS = {"mr": "موريتانيا", "ma": "المغرب", "dz": "الجزائر", "tn": "تونس", "ly": "ليبيا", "eh": "الصحراء",
           "az": "أزواد", "sn": "السنغال", "ml": "مالي", "ne": "النيجر", "td": "تشاد", "gm": "غامبيا"}

e = lambda x: html.escape(str(x or ""), quote=True)


def _date(a):
    try:
        return datetime.fromisoformat(a["createdAt"].replace("Z", "+00:00"))
    except Exception:  # noqa: BLE001
        return None


def _summary(body, n=160):
    t = " ".join((body or "").split())
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0] + "…"


AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]

PAGE = """<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | الرواية</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="{name}">
<meta property="og:locale" content="ar_AR">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image">
{published_meta}
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
body {{ margin:0; background:var(--paper); color:var(--ink); font:18px/1.95 "Al Quds","Segoe UI",Tahoma,sans-serif }}
a {{ color:var(--link) }}
img {{ max-width:100%; display:block }}
.wrap {{ max-width:760px; margin-inline:auto; padding-inline:16px }}
article {{ background:var(--surface); margin-block:24px; padding:24px 20px; border-radius:10px; border:1px solid var(--line) }}
.meta {{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; color:var(--muted); font-size:14px; margin-bottom:10px }}
.kicker {{ background:var(--chip); color:var(--ink); padding:1px 10px; border-radius:4px; text-decoration:none }}
.kicker.red {{ background:var(--red); color:#fff }}
h1 {{ margin:0 0 18px; font-size:28px; line-height:1.5; text-wrap:balance }}
.gallery {{ display:grid; gap:10px; margin-bottom:18px }}
.gallery img {{ width:100%; border-radius:8px }}
.body p {{ margin:0 0 14px }}
.tools {{ display:flex; flex-wrap:wrap; gap:10px; margin-top:20px }}
.btn {{ display:inline-flex; padding:8px 16px; border-radius:6px; background:var(--brand); color:var(--on-brand); text-decoration:none; font-size:15px }}
.btn.alt {{ background:var(--chip); color:var(--ink) }}
.more h2 {{ font-size:20px; margin:8px 0 }}
.more ul {{ list-style:none; padding:0; margin:0 0 28px }}
.more li {{ border-bottom:1px solid var(--line); padding-block:10px }}
.more a {{ color:var(--ink); text-decoration:none }}
{brand_css}
</style>
</head>
<body>
{header}
<div class="wrap">
<article>
  <div class="meta">{kickers}{time}</div>
  <h1 class="ew-t">{title}</h1>
  {gallery}
  <div class="body">{paras}</div>
  <div class="tools">
    <a class="btn" href="https://wa.me/?text={wa}" target="_blank" rel="noopener">مشاركة على واتساب</a>
    <a class="btn alt" href="https://www.facebook.com/sharer/sharer.php?u={url_q}" target="_blank" rel="noopener">مشاركة على فيسبوك</a>
  </div>
</article>
{more}
</div>
{footer}
</body>
</html>
"""


def _page(a, others, now):
    from urllib.parse import quote
    url = f"{SITE}/news/{a['id']}.html"
    d = _date(a)
    desc = _summary(a.get("body")) or a.get("title", "")
    imgs = a.get("images") or []
    image = f"{SITE}/{imgs[0]}" if imgs else f"{SITE}/assets/og.png"
    sections = [x for x in [a.get("category")] + [PORTALS.get(p, "") for p in a.get("portals") or []] if x]
    breaking = a.get("breaking") and d and now - d < timedelta(minutes=30)
    kickers = ('<span class="kicker red">عاجل</span>' if breaking else "") + "".join(
        f'<span class="kicker">{e(x)}</span>' for x in dict.fromkeys(sections))
    time = ""
    if d:
        local = d.astimezone(timezone.utc)
        time = f'<time datetime="{d.isoformat()}">{local.day} {AR_MONTHS[local.month - 1]} {local.year}</time>'
    paras = "".join(f"<p>{e(p.strip())}</p>" for p in (a.get("body") or "").split("\n") if p.strip())
    gallery = (f'<div class="gallery">' + "".join(f'<img src="../{e(s)}" alt="{e(a.get("title"))}">' for s in imgs)
               + "</div>") if imgs else ""
    ld = {"@context": "https://schema.org", "@type": "NewsArticle", "headline": a.get("title", "")[:110],
          "description": desc, "image": [image], "mainEntityOfPage": url, "inLanguage": "ar",
          "author": {"@type": "Organization", "name": NAME, "url": SITE + "/"},
          "publisher": {"@type": "NewsMediaOrganization", "name": NAME,
                        "logo": {"@type": "ImageObject", "url": f"{SITE}/assets/icon.png"}}}
    if d:
        ld["datePublished"] = ld["dateModified"] = d.isoformat()
    if sections:
        ld["articleSection"] = sections[0]
    more = ""
    if others:
        more = '<section class="more"><h2>أخبار أخرى</h2><ul>' + "".join(
            f'<li><a href="{e(o["id"])}.html">{e(o.get("title"))}</a></li>' for o in others) + "</ul></section>"
    return PAGE.format(
        title=e(a.get("title")), desc=e(desc), url=e(url), url_q=quote(url, safe=""), image=e(image), name=NAME,
        published_meta=f'<meta property="article:published_time" content="{d.isoformat()}">' if d else "",
        ld=json.dumps(ld, ensure_ascii=False).replace("</", "<\\/"), kickers=kickers, time=time, gallery=gallery,
        paras=paras, header=brand.header("../"), footer=brand.footer("../", str(now.year)),
        brand_css=brand.CSS, head_links=brand.head_links("../"), wa=quote(f"{a.get('title', '')} — {url}", safe=""), more=more, year=now.year)


def build(out_dir, arts, now=None):
    now = now or datetime.now(timezone.utc)
    arts = [a for a in arts if a.get("id") and a.get("title")]
    os.makedirs(os.path.join(out_dir, "news"), exist_ok=True)
    for i, a in enumerate(arts):
        others = [o for o in arts[:8] if o["id"] != a["id"]][:6]
        with open(os.path.join(out_dir, "news", f"{a['id']}.html"), "w", encoding="utf-8") as fh:
            fh.write(_page(a, others, now))

    stamp = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = [f"  <url><loc>{SITE}/</loc><lastmod>{stamp}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>"]
    rows += [f"  <url><loc>{SITE}/{p}</loc><priority>0.5</priority></url>" for p in STATIC]
    for a in arts:
        d = _date(a)
        lm = f"<lastmod>{d.strftime('%Y-%m-%dT%H:%M:%SZ')}</lastmod>" if d else ""
        rows.append(f"  <url><loc>{SITE}/news/{e(a['id'])}.html</loc>{lm}<priority>0.8</priority></url>")
    with open(os.path.join(out_dir, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                 + "\n".join(rows) + "\n</urlset>\n")

    # خريطة أخبار جوجل: أخبار آخر يومين فقط (حدّ جوجل)، حتى 1000 خبر.
    recent = [a for a in arts if _date(a) and now - _date(a) < timedelta(days=2)][:1000]
    news_rows = [
        f"  <url><loc>{SITE}/news/{e(a['id'])}.html</loc><news:news><news:publication><news:name>{NAME}</news:name>"
        f"<news:language>ar</news:language></news:publication><news:publication_date>{_date(a).isoformat()}"
        f"</news:publication_date><news:title>{e(a['title'])}</news:title></news:news></url>" for a in recent]
    with open(os.path.join(out_dir, "news-sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                 'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n' + "\n".join(news_rows) + "\n</urlset>\n")

    # موجز RSS: آخر 30 خبراً، لقارئات الأخبار ومجمّعاتها (ومنها Google News).
    from email.utils import format_datetime
    items = []
    for a in arts[:30]:
        d = _date(a)
        url = f"{SITE}/news/{e(a['id'])}.html"
        img = (a.get("images") or [None])[0]
        items.append(
            f"<item><title>{e(a['title'])}</title><link>{url}</link><guid isPermaLink=\"true\">{url}</guid>"
            + (f"<pubDate>{format_datetime(d)}</pubDate>" if d else "")
            + (f"<category>{e(a.get('category'))}</category>" if a.get("category") else "")
            + f"<description>{e(_summary(a.get('body'), 300))}</description>"
            + (f'<enclosure url="{SITE}/{e(img)}" type="image/jpeg" length="0"/>' if img else "") + "</item>")
    with open(os.path.join(out_dir, "feed.xml"), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>'
                 f"<title>{NAME}</title><link>{SITE}/</link><language>ar</language>"
                 f"<description>أخبار موريتانيا والمغرب العربي والساحل</description>"
                 f'<atom:link href="{SITE}/feed.xml" rel="self" type="application/rss+xml"/>'
                 f"<lastBuildDate>{format_datetime(now)}</lastBuildDate>"
                 f"<image><url>{SITE}/assets/icon.png</url><title>{NAME}</title><link>{SITE}/</link></image>"
                 + "".join(items) + "</channel></rss>\n")

    # خبر نُشر للتو ولم تُبنَ صفحته بعد: صفحة 404 تحوّل news/<id>.html إلى عرضه في الصفحة الرئيسية.
    with open(os.path.join(out_dir, "404.html"), "w", encoding="utf-8") as fh:
        fh.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
                 '<title>الرواية</title><script>(function(){var m=location.pathname.match(/\\/news\\/([\\w-]+)\\.html$/);'
                 'location.replace("/"+(m?"#a-"+m[1]:""));})();</script></head><body></body></html>\n')
    return len(arts), len(recent)
