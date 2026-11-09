"""صفحات الأخبار الثابتة لموقع الرواية: صفحة لكل خبر في news/<id>.html، وخريطة الموقع، وخريطة أخبار جوجل.

الموقع يعرض الأخبار من Firestore داخل الصفحة الرئيسية، فلا تجد محركات البحث لكل خبر رابطاً مستقلاً.
هذه الصفحات تُبنى كل نصف ساعة مع data.json، وفيها العنوان والنص والصورة وبيانات NewsArticle،
فيظهر كل خبر في نتائج البحث ويعرض بطاقة صحيحة عند مشاركته على واتساب وفيسبوك.
"""
import html

import brand
import json
import os
import re
from datetime import datetime, timedelta, timezone

SITE = "https://erriwaya.com"
NAME = "شبكة الرواية الإعلامية"
STATIC = ["about.html", "editorial-policy.html", "corrections.html", "privacy.html", "advertise.html"]
PORTALS = {"mr": "موريتانيا", "ma": "المغرب", "dz": "الجزائر", "tn": "تونس", "ly": "ليبيا", "eh": "الصحراء",
           "az": "أزواد", "sn": "السنغال", "ml": "مالي", "ne": "النيجر", "td": "تشاد", "gm": "غامبيا"}

e = lambda x: html.escape(str(x or ""), quote=True)

_HARAKAT = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")   # تشكيل وتطويل
_NONWORD = re.compile(r"[^0-9A-Za-z\u0621-\u063A\u0641-\u064A\u0660-\u0669\u06F0-\u06F9]+")


def slug(title, words=8, limit=70):
    """كلمات مقروءة من العنوان للرابط: حروف عربية ولاتينية وأرقام، بلا تشكيل، مفصولة بشرطة."""
    t = _NONWORD.sub(" ", _HARAKAT.sub("", title or "")).split()
    out = ""
    for w in t[:words]:
        if len(out) + len(w) + 1 > limit:
            break
        out = f"{out}-{w}" if out else w
    return out.lower()


def path_of(a):
    """اسم صفحة الخبر: <id>-<كلمات من العنوان>. يبدأ دائماً بالمعرّف، فيبقى الرابط فريداً وتعمل الروابط القديمة news/<id>.html."""
    s = slug(a.get("title"))
    return f"{a['id']}-{s}" if s else a["id"]


def url_path(a):
    """path_of مرمّزاً للروابط (خرائط الموقع وRSS وcanonical تشترط روابط مرمّزة)."""
    from urllib.parse import quote
    return quote(path_of(a), safe="-")



def _svg(k, label=""):
    """أيقونة منصة من رموز الصفحة الرئيسية (brand.ICONS)، أو اسمها نصاً إن غابت."""
    if k in brand.ICONS:
        vb, d = brand.ICONS[k]
        return f'<svg viewBox="{vb}" aria-hidden="true"><path fill="currentColor" d="{d}"/></svg>'
    return label or k

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
:root {{ --brand:#004A49; --brand-deep:#00302F; --on-brand:#F2F7F6; --red:#C8102E; --paper:#EEF3F2; --surface:#fff; --ink:#0F1E1D; --muted:#586A68; --line:#DAE3E1; --link:#00605E; --chip:#E6EEEC;
  --shadow:0 1px 2px rgb(0 40 39 / .05), 0 8px 24px rgb(0 40 39 / .07) }}
@media (prefers-color-scheme: dark) {{ :root {{ --paper:#061211; --surface:#0D201F; --ink:#E6EFED; --muted:#93A7A4; --line:#1D3432; --link:#6CC5C0; --chip:#15302E; --brand-deep:#002423; --shadow:none; color-scheme: dark }} }}
* {{ box-sizing: border-box }}
body {{ margin:0; background:var(--paper); color:var(--ink); font:18px/1.95 "Al Quds","Segoe UI",Tahoma,sans-serif; -webkit-font-smoothing:antialiased }}
a {{ color:var(--link) }}
img {{ max-width:100%; display:block }}
.wrap {{ max-width:800px; margin-inline:auto; padding-inline:16px }}
.crumb {{ display:flex; gap:8px; align-items:center; font-size:14px; color:var(--muted); margin-top:22px }}
.crumb a {{ color:var(--link); text-decoration:none }}
article {{ background:var(--surface); margin-block:12px 28px; padding:30px 34px 32px; border-radius:18px; box-shadow:var(--shadow) }}
.meta {{ display:flex; flex-wrap:wrap; gap:8px 12px; align-items:center; color:var(--muted); font-size:14px; margin-bottom:12px }}
.kicker {{ background:var(--chip); color:var(--link); font-weight:600; padding:2px 11px; border-radius:7px; text-decoration:none }}
.kicker.red {{ background:var(--red); color:#fff }}
.by {{ color:var(--ink); font-weight:600 }}
h1 {{ margin:0 0 22px; font-size:34px; line-height:1.5; text-wrap:balance }}
.gallery {{ display:grid; gap:12px; margin:0 -34px 22px }}
.gallery img {{ width:100% }}
.gallery img:first-child {{ aspect-ratio:16/9; object-fit:cover }}
.body {{ font-size:19.5px; line-height:2.05 }}
.body p {{ margin:0 0 1em }}
.tools {{ display:flex; flex-wrap:wrap; gap:10px; margin-top:22px; padding-top:18px; border-top:1px solid var(--line) }}
.btn {{ display:inline-flex; padding:8px 16px; border-radius:10px; background:var(--brand); color:var(--on-brand); text-decoration:none; font-size:15px }}
.btn.alt {{ background:var(--chip); color:var(--ink) }}
.share {{ align-items:center }}
.share-l {{ color:var(--muted); font-size:15px; margin-inline-end:4px }}
.sh {{ width:44px; height:44px; display:grid; place-items:center; border-radius:12px; color:#fff; text-decoration:none; transition:transform .15s }}
.sh:hover {{ transform:translateY(-2px); filter:brightness(1.08) }}
.sh svg {{ width:20px; height:20px }}
.sh.wa {{ background:#25D366 }} .sh.fb {{ background:#1877F2 }} .sh.tg {{ background:#229ED9 }} .sh.xx {{ background:#000 }}
.more {{ background:var(--surface); border-radius:18px; box-shadow:var(--shadow); padding:20px 26px 8px; margin-bottom:36px }}
.more h2 {{ display:flex; align-items:center; gap:10px; font-size:22px; margin:0 0 4px }}
.more h2::before {{ content:""; width:6px; height:1.05em; border-radius:3px; background:linear-gradient(var(--red) 0 35%, var(--brand) 35%) }}
.more ul {{ list-style:none; padding:0; margin:0 }}
.more li {{ border-bottom:1px solid var(--line); padding-block:12px }}
.more li:last-child {{ border-bottom:0 }}
.more a {{ color:var(--ink); text-decoration:none; font-weight:600; font-size:16.5px; line-height:1.7 }}
.more a:hover {{ color:var(--link) }}
@media (max-width:600px) {{ article {{ padding:22px 18px 24px; border-radius:14px }} .gallery {{ margin-inline:-18px }} h1 {{ font-size:27px }} .body {{ font-size:18.5px }} .more {{ padding-inline:18px }} }}
{brand_css}{ad_css}
</style>
</head>
<body>
{header}
<div class="wrap">
<nav class="crumb" aria-label="مسار التصفح"><a href="../">الرئيسية</a><span aria-hidden="true">‹</span><span>{crumb}</span></nav>
<article>
  <div class="meta">{kickers}{time}</div>
  <h1 class="ew-t">{title}</h1>
  {gallery}
  <div class="body">{paras}</div>
  {ad}
  <div class="tools share">
    <span class="share-l">شارك الخبر</span>
    <a class="sh wa" href="https://wa.me/?text={wa}" target="_blank" rel="noopener" aria-label="مشاركة على واتساب" title="واتساب">{ic_wa}</a>
    <a class="sh fb" href="https://www.facebook.com/sharer/sharer.php?u={url_q}" target="_blank" rel="noopener" aria-label="مشاركة على فيسبوك" title="فيسبوك">{ic_fb}</a>
    <a class="sh tg" href="https://t.me/share/url?url={url_q}" target="_blank" rel="noopener" aria-label="مشاركة على تيليغرام" title="تيليغرام">{ic_tg}</a>
    <a class="sh xx" href="https://x.com/intent/post?url={url_q}" target="_blank" rel="noopener" aria-label="مشاركة على إكس" title="إكس">{ic_x}</a>
  </div>
</article>
{more}
</div>
{footer}
</body>
</html>
"""


# أسماء الأقسام كما في الموقع والتطبيق (تصنيفات قديمة محفوظة بأسماء أخرى)
SECTION_NAMES = {"تقارير": "التقارير", "تقرير": "التقارير", "تحقيقات": "التحقيقات", "تحقيق": "التحقيقات",
                 "موجز": "الموجز", "الموجز الإخباري": "الموجز", "رأي": "الرأي الحر", "الرأي": "الرأي الحر",
                 "رأي حر": "الرأي الحر", "مقال رأي": "الرأي الحر", "مقالات": "الرأي الحر"}


def _section(a):
    c = (a.get("category") or "").strip()
    return SECTION_NAMES.get(c, c)


def _page(a, others, now):
    from urllib.parse import quote
    url = f"{SITE}/news/{url_path(a)}.html"
    d = _date(a)
    desc = _summary(a.get("body")) or a.get("title", "")
    imgs = a.get("images") or []
    image = f"{SITE}/{imgs[0]}" if imgs else f"{SITE}/assets/og.png"
    sections = [x for x in [_section(a)] + [PORTALS.get(p, "") for p in a.get("portals") or []] if x]
    breaking = a.get("breaking") and d and now - d < timedelta(minutes=30)
    kickers = ('<span class="kicker red">عاجل</span>' if breaking else "") + "".join(
        f'<span class="kicker">{e(x)}</span>' for x in dict.fromkeys(sections))
    time = ""
    if d:
        local = d.astimezone(timezone.utc)
        time = f'<time datetime="{d.isoformat()}">{local.day} {AR_MONTHS[local.month - 1]} {local.year}</time>'
    writer = (a.get("writer") or "").strip()
    if writer:
        time = f'<span class="by">بقلم: {e(writer)}</span>' + time
    paras = "".join(f"<p>{e(p.strip())}</p>" for p in (a.get("body") or "").split("\n") if p.strip())
    gallery = (f'<div class="gallery">' + "".join(f'<img src="../{e(s)}" alt="{e(a.get("title"))}">' for s in imgs)
               + "</div>") if imgs else ""
    ld = {"@context": "https://schema.org", "@type": "NewsArticle", "headline": a.get("title", "")[:110],
          "description": desc, "image": [image], "mainEntityOfPage": url, "inLanguage": "ar",
          "author": {"@type": "Organization", "name": NAME, "url": SITE + "/"},
          "publisher": {"@type": "NewsMediaOrganization", "name": NAME,
                        "logo": {"@type": "ImageObject", "url": f"{SITE}/assets/icon.png"}}}
    if writer:
        ld["author"] = {"@type": "Person", "name": writer}
    if d:
        ld["datePublished"] = ld["dateModified"] = d.isoformat()
    if sections:
        ld["articleSection"] = sections[0]
    more = ""
    if others:
        more = '<section class="more"><h2>أخبار أخرى</h2><ul>' + "".join(
            f'<li><a href="{e(url_path(o))}.html">{e(o.get("title"))}</a></li>' for o in others) + "</ul></section>"
    return PAGE.format(
        title=e(a.get("title")), desc=e(desc), url=e(url), url_q=quote(url, safe=""), image=e(image), name=NAME,
        published_meta=f'<meta property="article:published_time" content="{d.isoformat()}">' if d else "",
        ld=json.dumps(ld, ensure_ascii=False).replace("</", "<\\/"), kickers=kickers, time=time, gallery=gallery,
        paras=paras, header=brand.header("../"), footer=brand.footer("../", str(now.year)),
        brand_css=brand.CSS, ad_css=brand.AD_CSS, ad=brand.ad_slot("article", "../"), head_links=brand.head_links("../"), wa=quote(f"{a.get('title', '')} — {url}", safe=""), more=more, year=now.year,
        crumb=e(sections[0] if sections else "الأخبار"), ic_wa=_svg("whatsapp"), ic_fb=_svg("facebook"), ic_tg=_svg("telegram"), ic_x=_svg("x"))


REDIRECT = """<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>{title} | الرواية</title>
<link rel="canonical" href="{url}">
<meta http-equiv="refresh" content="0; url={href}">
<meta property="og:type" content="article">
<meta property="og:title" content="{title}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<script>location.replace({href_js} + location.hash);</script>
</head>
<body><p><a href="{href}">{title}</a></p></body>
</html>
"""


def _redirect(a):
    """الرابط القديم news/<id>.html يحوّل إلى الرابط المقروء، فلا تنكسر المنشورات والمشاركات السابقة."""
    href = f"{url_path(a)}.html"
    imgs = a.get("images") or []
    return REDIRECT.format(title=e(a.get("title")), url=e(f"{SITE}/news/{href}"), href=e(href),
                           href_js=json.dumps(href, ensure_ascii=False),
                           image=e(f"{SITE}/{imgs[0]}" if imgs else f"{SITE}/assets/og.png"))


def build(out_dir, arts, now=None, extra_rows=()):
    now = now or datetime.now(timezone.utc)
    arts = [a for a in arts if a.get("id") and a.get("title")]
    os.makedirs(os.path.join(out_dir, "news"), exist_ok=True)
    for i, a in enumerate(arts):
        others = [o for o in arts[:8] if o["id"] != a["id"]][:6]
        with open(os.path.join(out_dir, "news", f"{path_of(a)}.html"), "w", encoding="utf-8") as fh:
            fh.write(_page(a, others, now))
        if path_of(a) != a["id"]:
            with open(os.path.join(out_dir, "news", f"{a['id']}.html"), "w", encoding="utf-8") as fh:
                fh.write(_redirect(a))

    stamp = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = [f"  <url><loc>{SITE}/</loc><lastmod>{stamp}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>"]
    rows += [f"  <url><loc>{SITE}/{p}</loc><priority>0.5</priority></url>" for p in STATIC]
    rows += list(extra_rows)   # ملفات الرواية (dossiers.py)
    for a in arts:
        d = _date(a)
        lm = f"<lastmod>{d.strftime('%Y-%m-%dT%H:%M:%SZ')}</lastmod>" if d else ""
        rows.append(f"  <url><loc>{SITE}/news/{e(url_path(a))}.html</loc>{lm}<priority>0.8</priority></url>")
    with open(os.path.join(out_dir, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                 + "\n".join(rows) + "\n</urlset>\n")

    # خريطة أخبار جوجل: أخبار آخر يومين فقط (حدّ جوجل)، حتى 1000 خبر.
    recent = [a for a in arts if _date(a) and now - _date(a) < timedelta(days=2)][:1000]
    news_rows = [
        f"  <url><loc>{SITE}/news/{e(url_path(a))}.html</loc><news:news><news:publication><news:name>{NAME}</news:name>"
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
        url = f"{SITE}/news/{e(url_path(a))}.html"
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

    # فهرس البحث: كل الأخبار (العنوان ومقتطف وقسم وتاريخ)، يقرؤه الموقع والتطبيق عند أول بحث.
    index = [{"id": a["id"], "t": a.get("title", ""), "s": _summary(a.get("body"), 400), "c": _section(a),
              "d": a.get("createdAt"), "u": url_path(a), "w": (a.get("writer") or "").strip(), "p": a.get("portals") or [],
              "i": (a.get("images") or [None])[0]} for a in arts]
    with open(os.path.join(out_dir, "search.json"), "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, separators=(",", ":"))

    # خبر نُشر للتو ولم تُبنَ صفحته بعد: صفحة 404 تحوّل news/<id>.html إلى عرضه في الصفحة الرئيسية.
    with open(os.path.join(out_dir, "404.html"), "w", encoding="utf-8") as fh:
        fh.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
                 '<title>الرواية</title><script>(function(){var m=location.pathname.match(/\\/news\\/([A-Za-z0-9_]+)(?:-[^\\/]*)?\\.html$/);'
                 'location.replace("/"+(m?"#a-"+m[1]:""));})();</script></head><body></body></html>\n')
    return len(arts), len(recent)
