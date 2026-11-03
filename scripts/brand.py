"""هوية الرواية الموحّدة: الألوان، الحسابات، ورأس الصفحة وتذييلها لكل صفحات الموقع.

مصدر واحد تستعمله الصفحات الثابتة (pages/*.html) وصفحات الأخبار (news_pages.py)،
فإذا تغيّر لون أو حساب تغيّر في كل مكان دفعة واحدة. يطابق ما في index.html والتطبيق.

تشغيل: python3 scripts/brand.py pages _site   ← ينسخ الصفحات الثابتة مع الرأس والتذييل الموحّدين.
"""
import os
import re
import sys

NAME = "شبكة الرواية الإعلامية"
SITE = "https://erriwaya.com"

# ── الألوان (انظر brand.html) ──
GREEN = "#004A49"       # اللون الأساسي: الشعار، الرأس، الأزرار، أيقونة التطبيق
GREEN_DEEP = "#00302F"  # الشريط العلوي والتذييل
RED = "#C8102E"         # لون التمييز: «عاجل»، خط العنوان، كلمة مفتاحية واحدة
PAPER = "#F4F7F6"

SOCIAL = [  # (المنصة، الاسم العربي، الرابط، المعرّف الظاهر)
    ("youtube", "يوتيوب", "https://www.youtube.com/@ERRIWAYA", "ERRIWAYA"),
    ("facebook", "فيسبوك", "https://www.facebook.com/ERRIWAYA", "ERRIWAYA"),
    ("tiktok", "تيك توك", "https://www.tiktok.com/@erriwaya", "ERRIWAYA"),
    ("instagram", "إنستغرام", "https://www.instagram.com/erriwaya.mr/", "ERRIWAYA.MR"),
]
EMAIL = "contact@erriwaya.com"
PAGES = [("about.html", "من نحن"), ("editorial-policy.html", "السياسة التحريرية"),
         ("corrections.html", "سياسة التصحيحات"), ("privacy.html", "سياسة الخصوصية")]

_HERE = os.path.dirname(os.path.abspath(__file__))


def _icons():
    """أيقونات المنصات نفسها المستعملة في الصفحة الرئيسية."""
    try:
        src = open(os.path.join(_HERE, "..", "index.html"), encoding="utf-8").read()
        return {k: (vb, d) for k, vb, d in re.findall(
            r'<symbol id="s-(\w+)" viewBox="([^"]+)"><path fill="currentColor" d="([^"]+)"/></symbol>', src)}
    except OSError:
        return {}


ICONS = _icons()

CSS = f"""
.ew-head {{ background:{GREEN}; color:#F2F7F6; border-bottom:3px solid {RED} }}
.ew-head .wrap {{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding-block:10px }}
.ew-brand {{ display:flex; align-items:center; gap:12px; color:inherit; text-decoration:none }}
.ew-brand img {{ height:44px; width:auto }}
.ew-brand b {{ font-size:20px; font-weight:normal; opacity:.95 }}
.ew-head nav a {{ color:#F2F7F6; text-decoration:none; font-size:15px }}
@media (max-width:420px) {{ .ew-brand img {{ height:38px }} .ew-brand b {{ font-size:16px }} }}
.ew-foot {{ background:{GREEN_DEEP}; color:#F2F7F6; padding-block:22px; font-size:14px; text-align:center }}
.ew-foot .soc {{ display:flex; justify-content:center; gap:12px; margin-bottom:12px }}
.ew-foot .soc a {{ width:40px; height:40px; display:grid; place-items:center; border-radius:50%;
  border:1px solid rgb(255 255 255 / .3); color:#F2F7F6 }}
.ew-foot .soc a:hover {{ background:#F2F7F6; color:{GREEN_DEEP} }}
.ew-foot .soc svg {{ width:17px; height:17px }}
.ew-foot .links {{ display:flex; flex-wrap:wrap; justify-content:center; gap:6px 16px; margin-bottom:8px }}
.ew-foot .links a {{ color:#F2F7F6; opacity:.85; text-decoration:none }}
.ew-foot .links a:hover {{ opacity:1; text-decoration:underline }}
h1.ew-t::after {{ content:""; display:block; width:56px; height:4px; background:{RED}; border-radius:2px; margin-top:12px }}
"""


def header(prefix=""):
    return (f'<header class="ew-head"><div class="wrap"><a class="ew-brand" href="{prefix}./" aria-label="{NAME} — الرئيسية">'
            f'<img src="{prefix}assets/logo.png" alt=""><b>{NAME}</b></a>'
            f'<nav><a href="{prefix}./">الرئيسية</a></nav></div></header>')


def footer(prefix="", year_html='<span id="yr"></span>'):
    soc = "".join(
        f'<a href="{url}" target="_blank" rel="noopener" aria-label="{ar}: {handle}" title="{ar}">'
        + (f'<svg viewBox="{ICONS[k][0]}" aria-hidden="true"><path fill="currentColor" d="{ICONS[k][1]}"/></svg>'
           if k in ICONS else ar) + "</a>" for k, ar, url, handle in SOCIAL)
    links = "".join(f'<a href="{prefix}{p}">{t}</a>' for p, t in PAGES)
    links += f'<a href="mailto:{EMAIL}" dir="ltr">{EMAIL}</a>'
    yr = '<script>document.getElementById("yr").textContent=new Date().getFullYear()</script>' if 'id="yr"' in year_html else ""
    return (f'<footer class="ew-foot"><div class="wrap"><nav class="soc" aria-label="منصات الرواية">{soc}</nav>'
            f'<nav class="links" aria-label="صفحات الشبكة">{links}</nav>'
            f'<small>© 2022–{year_html} {NAME}</small></div></footer>{yr}')


def head_links(prefix=""):
    """أيقونة الهاتف وملف التثبيت على الشاشة الرئيسية."""
    return (f'<link rel="apple-touch-icon" href="{prefix}assets/apple-touch-icon.png">'
            f'<link rel="manifest" href="{prefix}manifest.webmanifest">')


def apply(src_html, prefix=""):
    """يستبدل رأس الصفحة وتذييلها بالموحّدين، ويضيف أنماطهما وخط العنوان الأحمر."""
    s = re.sub(r"<header>.*?</header>", lambda _: header(prefix), src_html, count=1, flags=re.S)
    s = re.sub(r"<footer>.*?</footer>(\s*<script>[^<]*yr[^<]*</script>)?", lambda _: footer(prefix), s, count=1, flags=re.S)
    s = re.sub(r"<nav class=\"pages\".*?</nav>\s*", "", s, count=1, flags=re.S)  # الروابط صارت في التذييل
    s = s.replace("<h1>", '<h1 class="ew-t">', 1)
    s = s.replace("</style>", CSS + "</style>", 1)
    extra = head_links(prefix)
    if "og:image" not in s:
        t = re.search(r"<title>(.*?)</title>", s)
        extra += (f'<meta property="og:site_name" content="{NAME}"><meta property="og:locale" content="ar_AR">'
                  f'<meta property="og:title" content="{t.group(1) if t else NAME}">'
                  f'<meta property="og:image" content="{SITE}/assets/og.png"><meta name="twitter:card" content="summary_large_image">')
    s = s.replace("<style>", extra + "\n<style>", 1)
    return s


if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    for f in sorted(os.listdir(src)):
        if f.endswith(".html"):
            html = open(os.path.join(src, f), encoding="utf-8").read()
            with open(os.path.join(out, f), "w", encoding="utf-8") as fh:
                fh.write(apply(html))
            print("page", f)
