"""هوية الرواية الموحّدة: الألوان، الحسابات، ورأس الصفحة وتذييلها لكل صفحات الموقع.

مصدر واحد تستعمله الصفحات الثابتة (pages/*.html) وصفحات الأخبار (news_pages.py)،
فإذا تغيّر لون أو حساب تغيّر في كل مكان دفعة واحدة. يطابق ما في index.html والتطبيق.

تشغيل: python3 scripts/brand.py pages _site   ← ينسخ الصفحات الثابتة مع الرأس والتذييل الموحّدين.
"""
import os
import json
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
         ("corrections.html", "سياسة التصحيحات"), ("privacy.html", "سياسة الخصوصية"),
         ("advertise.html", "أعلن معنا")]

# ── إعلانات جوجل (AdSense) ──
# بعد إنشاء حساب AdSense، ضع هنا معرّف الناشر كما يظهر في الحساب (مثل "pub-1234567890123456")،
# فيُضاف كود الإعلانات التلقائية إلى كل صفحات الموقع ويُنشأ ملف ads.txt تلقائياً. فارغ = لا إعلانات.
ADSENSE = "pub-4454683949094441"

# أرقام «الوحدات الإعلانية» من AdSense (Ads ← By ad unit ← Display ads) لكل خانة في الموقع.
# ما دامت فارغة تعرض الخانة إعلان «أعلن معنا» الداخلي؛ وعند وضع الرقم تعرض إعلانات جوجل فيها.
AD_SLOTS = {"top": "", "mid": "", "article": ""}

AD_CSS = """
.adbox { margin:22px 0; text-align:center }
.adbox .ad-l { display:block; font-size:12px; color:var(--muted); letter-spacing:.5px; margin-bottom:6px }
.adbox ins { display:block; min-height:90px }
.adhouse { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;
  padding:18px 22px; border:1px dashed var(--line); border-radius:14px; background:var(--surface);
  text-decoration:none; color:var(--ink); text-align:start; min-height:90px }
.adhouse strong { display:block; font-size:19px; color:var(--brand, #004A49) }
.adhouse span.s { color:var(--muted); font-size:15px }
.adhouse .go { background:var(--brand, #004A49); color:#fff; border-radius:999px; padding:9px 20px; font-size:15px; white-space:nowrap }
:root[data-theme="dark"] .adhouse strong { color:#7FD1C7 }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .adhouse strong { color:#7FD1C7 } }
/* الخانة الإعلانية المتحركة */
.adhouse { position:relative; overflow:hidden; isolation:isolate }
.adhouse::before { content:""; position:absolute; inset:0; z-index:-1;
  background:linear-gradient(110deg, transparent 30%, rgba(0,74,73,.10) 45%, rgba(208,16,43,.08) 55%, transparent 70%);
  background-size:250% 100%; animation:adSweep 4.5s ease-in-out infinite }
.adhouse { border-style:solid; border-width:2px; border-color:transparent;
  background:linear-gradient(var(--surface),var(--surface)) padding-box,
    linear-gradient(90deg,#004A49,#D0102B,#004A49) border-box; background-size:auto, 300% 100%; animation:adBorder 6s linear infinite }
.adhouse .rot { position:relative; display:block; height:2.9em; overflow:hidden; margin-top:4px }
.adhouse .rot span { position:absolute; inset:0; color:var(--muted); font-size:15px; line-height:1.45; opacity:0; animation:adRot 9s infinite }
.adhouse .rot span:nth-child(2) { animation-delay:3s } .adhouse .rot span:nth-child(3) { animation-delay:6s }
.adhouse .go { animation:adPulse 2.4s ease-in-out infinite }
@keyframes adSweep { 0% { background-position:150% 0 } 100% { background-position:-100% 0 } }
@keyframes adBorder { 0% { background-position:0 0, 0 0 } 100% { background-position:0 0, 300% 0 } }
@keyframes adRot { 0% { opacity:0; transform:translateY(60%) } 5%,30% { opacity:1; transform:none } 35%,100% { opacity:0; transform:translateY(-60%) } }
@keyframes adPulse { 0%,100% { transform:scale(1); box-shadow:0 0 0 0 rgba(0,74,73,.45) } 50% { transform:scale(1.05); box-shadow:0 0 0 10px rgba(0,74,73,0) } }
@media (prefers-reduced-motion: reduce) { .adhouse, .adhouse::before, .adhouse .go { animation:none }
  .adhouse .rot span { animation:none } .adhouse .rot span:first-child { opacity:1 } }

"""


def ad_slot(pos, prefix=""):
    """خانة إعلانية: وحدة AdSense إن ضُبط رقمها، وإلا إعلان «أعلن معنا» الداخلي."""
    sid = AD_SLOTS.get(pos, "")
    if ADSENSE and sid:
        pub = "ca-" + ADSENSE.removeprefix("ca-")
        inner = (f'<ins class="adsbygoogle" data-ad-client="{pub}" data-ad-slot="{sid}" '
                 'data-ad-format="auto" data-full-width-responsive="true"></ins>'
                 '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>')
    else:
        inner = (f'<a class="adhouse" href="{prefix}advertise.html"><div><strong>مساحتك الإعلانية هنا</strong>'
                 '<span class="rot"><span>اعرض علامتك أمام قرّاء الرواية في المنطقة المغاربية والساحل</span><span>في الموقع والتطبيق وعلى يوتيوب وفيسبوك وتيك توك</span><span>مساحات إعلانية ومحتوى ممول ورعاية فيديوهات</span></span></div>'
                 '<span class="go">أعلن معنا</span></a>')
    return f'<aside class="adbox" aria-label="إعلان"><span class="ad-l">إعلان</span>{inner}</aside>'


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
.ew-head {{ background:{GREEN}; color:#F2F7F6; border-bottom:3px solid {RED}; box-shadow:0 6px 20px rgb(0 0 0 / .12) }}
.ew-head .wrap {{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding-block:10px }}
.ew-brand {{ display:flex; align-items:center; gap:12px; color:inherit; text-decoration:none }}
.ew-brand img {{ height:44px; width:auto }}
.ew-brand b {{ font-size:20px; font-weight:normal; opacity:.95 }}
.ew-head nav a {{ color:#F2F7F6; text-decoration:none; font-size:15px; padding:7px 14px; border-radius:10px; border:1px solid rgb(255 255 255 / .28) }}
.ew-head nav a:hover {{ background:rgb(255 255 255 / .12) }}
@media (max-width:420px) {{ .ew-brand img {{ height:38px }} .ew-brand b {{ font-size:16px }} }}
.ew-foot {{ background:#002524; border-top:3px solid {RED}; color:#F2F7F6; padding-block:22px; font-size:14px; text-align:center }}
.ew-foot .soc {{ display:flex; justify-content:center; gap:12px; margin-bottom:12px }}
.ew-foot .soc a {{ width:40px; height:40px; display:grid; place-items:center; border-radius:50%;
  border:1px solid rgb(255 255 255 / .3); border-radius:12px; color:#F2F7F6 }}
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
            f'<link rel="manifest" href="{prefix}manifest.webmanifest">' + GA + ads_head())


def ads_head():
    """كود AdSense (تحقق الملكية + الإعلانات التلقائية)، أو لا شيء إن لم يُضبط المعرّف."""
    if not ADSENSE:
        return ""
    pub = "ca-" + ADSENSE.removeprefix("ca-")
    return (f'<meta name="google-adsense-account" content="{pub}">'
            f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={pub}" '
            'crossorigin="anonymous"></script>')


def ads_txt():
    """محتوى ملف ads.txt الذي تطلبه جوجل في جذر الموقع."""
    return f"google.com, {ADSENSE.removeprefix('ca-')}, DIRECT, f08c47fec0942fa0\n" if ADSENSE else ""


# إحصاءات Google Analytics نفسها التي في الصفحة الرئيسية، لتُحسب زيارات صفحات الأخبار الثابتة والصفحات التعريفية
# (روابط المشاركة ونتائج البحث تفتح هذه الصفحات). لا تُحمَّل في المعاينات.
GA = ('<script>if(!/^(localhost|127\\.|$)|claude/i.test(location.hostname)){var s=document.createElement("script");'
      's.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=G-MPEY193JSN";document.head.appendChild(s);'
      'window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};'
      'gtag("js",new Date());gtag("config","G-MPEY193JSN")}</script>')


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
    # الصفحة الرئيسية (تُجمَّع قبل هذا الأمر) وملف ads.txt
    idx = os.path.join(out, "index.html")
    if ADSENSE and os.path.exists(idx):
        h = open(idx, encoding="utf-8").read()
        if "adsbygoogle.js" not in h:
            h = h.replace("<style>", ads_head() + "\n<style>", 1)
        # أرقام الخانات الإعلانية من AD_SLOTS أعلاه
        h = re.sub(r"const AD_SLOTS = \{[^}]*\};", lambda _: "const AD_SLOTS = " + json.dumps(AD_SLOTS) + ";", h, count=1)
        open(idx, "w", encoding="utf-8").write(h)
        open(os.path.join(out, "ads.txt"), "w", encoding="utf-8").write(ads_txt())
        print("adsense", ADSENSE)
