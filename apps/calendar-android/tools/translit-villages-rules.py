import re,unicodedata
def fold(s):
    s=s.replace('ﬁ','fi').replace('ﬂ','fl')
    s=''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn')
    return s.lower().replace('’',"'").replace('`',"'")
V='aeiouy'
RED=[True]
DG=[('tch','تش'),('ch','ش'),('kh','خ'),('gh','ق'),('dh','ظ'),('dj','ج'),('sh','ش'),('ph','ف'),('gn','ني'),('ny','ني')]
C1={'b':'ب','c':'ك','d':'د','f':'ف','g':'گ','h':'ح','j':'ج','k':'ك','l':'ل','m':'م','n':'ن','p':'پ','q':'ق','r':'ر','s':'س','t':'ت','v':'ف','w':'و','x':'كس','z':'ز'}
def units(t):
    """split into (kind, text) units: C consonant (arabic), V vowel group (latin)"""
    u=[];i=0
    while i<len(t):
        c=t[i]
        if c=="'": i+=1; continue
        if t.startswith('th',i):
            u.append(('C','ت' if t[i+2:i+3]=='i' else 'ث')); i+=2; continue
        if t.startswith('di',i) and t[i+2:i+3] in ('a','e','o') and t[i+2:i+3]:
            u.append(('C','چ')); i+=2; continue
        if t.startswith('gu',i) and t[i+2:i+3] in ('e','i','a') and t[i+2:i+3]:
            u.append(('C','گ')); i+=2; continue
        if t.startswith('qu',i): u.append(('C','ك')); i+=2; continue
        for a,b in DG:
            if a=='gn' and RED[0]: continue
            if t.startswith(a,i):
                u.append(('C',b)); i+=len(a); break
        else:
            if c in C1:
                if c=='y' : pass
                u.append(('C',C1[c])); i+=1
            elif c in V:
                j=i
                while j<len(t) and t[j] in V: j+=1
                u.append(('V',t[i:j])); i=j
            else: u.append(('C',c)); i+=1
    # collapse doubled consonants
    o=[]
    for k in u:
        if o and k[0]=='C' and o[-1]==k: continue
        o.append(k)
    return o
def vow(v,first,last,nxt_final_n):
    # v latin vowel group
    if first:
        m={'a':'آ','e':'ا','i':'إ','o':'أو','ou':'أو','ai':'عي','ae':'اع','ei':'إي','ou':'أو','oua':'وا','oue':'و','y':'ي','ya':'يا','you':'يو','ye':'ي','yi':'يي','yo':'يو','aou':'آو','aa':'آ','eu':'أو','oui':'وي','ay':'آي','ey':'إي','ao':'آو','io':'إيو','ia':'إيا','aoui':'آوي','aouei':'آوي','aoue':'آو','oue':'وي','ouei':'وي','ie':'إي','eya':'إيا'}
        if v in m: return m[v]
    if last:
        m={'a':'ه','e':'ه','i':'ي','o':'و','ou':'و','ey':'ي','ay':'اي','ya':'يه','ye':'يه','iya':'يه','ia':'يه','ae':'ع','ea':'ع','aa':'اع','y':'ي','oua':'وه','ie':'ي','ee':'ي','ei':'ي','ai':'ي','io':'يو','aya':'ايه','eya':'يه','oye':'ويه','eye':'يه','aye':'ايه','oya':'ويه','iye':'يه','ayi':'ايي','ao':'او','oi':'وي','oy':'وي','eou':'يو','eo':'يو','ue':'ه','ui':'وي','aou':'او','uya':'ويه','oy':'وي'}
        if v in m: return m[v]
    m={'a':'ا','e':'','i':'ي','o':'و','u':'و','ou':'و','ei':'ي','ey':'ي','ai':'ي','ay':'اي','oi':'ي','oy':'وي','ae':'ع','ea':'عا','aa':'عا','y':'ي','ee':'ي','ie':'ي','eu':'و','au':'و','eau':'و','ia':'يا','io':'يو','ya':'يا','yi':'يي','ye':'ي','yo':'يو','you':'يو','oua':'وا','oue':'و','oui':'وي','ouei':'وي','aou':'او','aoua':'اوا','aye':'اي','aya':'ايا','eya':'يا','iya':'يا','iye':'ي','eye':'ي','eyi':'ي','ayi':'اي','oye':'وي','oya':'ويا','aoui':'اوي','ui':'وي','ue':'و','ua':'وا','oo':'و','ii':'ي','eo':'يو','eou':'يو','aei':'عي','aeou':'عو','aea':'عا','eae':'ع','eai':'عي','aee':'عي','eaa':'عا','aai':'عي','aae':'ع','eia':'يا','aia':'يا','eiya':'يا','aiya':'يا','oia':'يا','oiya':'ويا','oyi':'ويي','aeo':'عو','aoue':'او','ouy':'وي','ouya':'ويا','iou':'يو','ieu':'يو','aie':'ي','eie':'ي','iyi':'ي','uy':'وي','oe':'و','oei':'وي','oai':'وي','oie':'وي','aeya':'عيا','eyo':'يو','ayo':'ايو','ayou':'ايو','eyou':'يو','iyou':'يو','aw':'او'}
    if v in m: return m[v]
    return ''.join(m.get(c,'') for c in v)
def word(t):
    u=units(t); out=[]
    n=len(u)
    # prosthetic alif for initial cluster
    if n>=2 and u[0][0]=='C' and u[1][0]=='C': out.append('ا')
    for i,(k,x) in enumerate(u):
        if k=='C': out.append(x)
        else:
            last=(i==n-1)
            # silent final e after vowel+n: ine/ane/oune
            if last and x=='e' and i>=2 and u[i-1]==('C','ن') and u[i-2][0]=='V': continue
            if last and x=='e' and i>=2 and u[i-1][1] in('ت','ر','ل','س','ك','د','م','ب','ز','ش') and u[i-2][0]=='V' and u[i-2][1] in('i','ou','ei','a','o','e'): 
                continue
            if RED[0] and i>0 and not last and x in('a','ou','i','o'):
                nv=sum(1 for q in u if q[0]=='V'); firstv=all(q[0]=='C' for q in u[:i])
                two=(i+2<n and u[i+1][0]=='C' and u[i+2][0]=='C')
                fin=(i+2==n)
                if x=='a' and not fin and (two or (firstv and nv>=2)) and not (firstv and t.startswith('ta') and not t.startswith('talh')): continue
                if x in('ou','i','o') and two and not fin: continue
            out.append(vow(x,i==0,last,False))
    s=''.join(out)
    return s
HAS=re.compile(r"ei|oi|ae|ea|kh|gh|dh|tt$|^el|^l[ea]?[bcdfghjkmnqrstvwz]|^(tw|gw|sw|chw|jr|kr|gr|zr|tl|hs|zb|sb|br|dr|tr|gl|zm|mz|chr|chk|jh|kw|nb|nm|mr|md|mh|rm|rw|rg|lw)")
def tok(t,river=False):
    RED[0]=not(river and not HAS.search(t))
    return tok0(t)
def tok0(t):
    if t.isdigit(): return t
    m=re.fullmatch(r'([a-z\']+?)(\d+)',t)
    if m: return tok0(m.group(1))+' '+m.group(2)
    # article
    m=re.fullmatch(r'e(ss|ch|tt|dd|rr|zz|nn|dh|th)([a-z\']{2,})',t)
    if m:
        g=m.group(1); c=g if g in('ch','dh','th') else g[0]
        return 'ال'+word(c+m.group(2)).lstrip('ا') if False else 'ال'+word2(c+m.group(2))
    m=re.fullmatch(r'e(ch|dh|th|[tdrzsnl])([aeiou][a-z\']{2,})',t)
    if m and RED[0]: return 'ال'+word2(m.group(1)+m.group(2))
    m=re.fullmatch(r'el([a-z\']{3,})',t)
    if m: return 'ال'+word2(m.group(1))
    m=re.fullmatch(r'bou([bcdfghjkmnqrstvwz][a-z\']{3,})',t)
    if m and RED[0]:
        r=word(m.group(1)); return 'بو '+r if r.startswith('ا') else 'بو'+r
    m=re.fullmatch(r'l[ea]([bcdfghjkmnqrstvwz][a-z\']{2,})',t)
    if m: return 'ل'+word2(m.group(1))
    return word(t)
def word2(t):
    s=word(t)
    if s.startswith('ا') and len(units(t))>1 and units(t)[0][0]=='C': s=s[1:]
    if s[:1]=='آ': s='ع'+s[1:]
    elif s[:1]=='إ': s='إ'+s[1:]
    return s
