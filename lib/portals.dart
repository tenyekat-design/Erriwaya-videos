import 'models.dart';

/// بوابة دولة أو منطقة: تجمع كل ما يخصها من أخبار مكتوبة وفيديوهات.
class Portal {
  final String id;
  final String name;
  final String latin;
  final String group; // المغرب العربي / الجوار
  /// كلمات تُبحث في العنوان والنص والوسوم. ما يبدأ بـ re: تعبير نمطي.
  final List<String> keywords;
  const Portal(this.id, this.name, this.latin, this.group, this.keywords);
}

const _w = r'(?<![\p{L}])'; // بداية كلمة
const _we = r'(?![\p{L}])'; // نهاية كلمة

/// يمكن تعديل هذه القائمة بحرية (إضافة دولة أو كلمات).
const portals = <Portal>[
  Portal('mr', 'موريتانيا', 'Mauritanie', 'المغرب العربي', [
    'موريتاني', 'نواكشوط', 'انواكشوط', 'نواذيبو', 'انواذيبو', 'ولد الغزواني', 'روصو', 'كيفة',
  ]),
  Portal('ma', 'المغرب', 'Maroc', 'المغرب العربي', [
    're:${_w}(و|ب|ل)?المغرب$_we(?!\\s*(العربي|الكبير))',
    'مغربي', 'مغربية', 'المغاربة', 'الرباط', 'الدار البيضاء', 'مراكش', 'طنجة',
  ]),
  Portal('dz', 'الجزائر', 'Algérie', 'المغرب العربي', [
    'الجزائر', 'جزائري', 'تبون', 'وهران', 'قسنطينة',
  ]),
  Portal('tn', 'تونس', 'Tunisie', 'المغرب العربي', [
    'تونس', 'تونسي', 'قيس سعيد', 'صفاقس',
  ]),
  Portal('ly', 'ليبيا', 'Libye', 'المغرب العربي', [
    'ليبيا', 'ليبي', 'بنغازي', 'مصراتة', 'الدبيبة', 'حفتر', 'المنفي',
  ]),
  Portal('eh', 'الصحراء', 'Sahara', 'الصحراء وأزواد', [
    'الصحراء الغربية', 'البوليساريو', 'بوليساريو', 'تندوف', 'العيون', 'الداخلة', 'الكركرات',
    'المينورسو', 'الصحراوي',
  ]),
  Portal('az', 'أزواد', 'Azawad', 'الصحراء وأزواد', [
    'أزواد', 'ازواد', 'كيدال', 'تمبكتو', 'تينبكتو', 'غاو', 'الطوارق', 'الأزواد',
  ]),
  Portal('sn', 'السنغال', 'Sénégal', 'الجوار', [
    'السنغال', 'السنگال', 'السينغال', 'سنغالي', 'داكار', 'دكار', 'سونكو', 'فاي',
  ]),
  Portal('ml', 'مالي', 'Mali', 'الجوار', [
    're:$_w(و|ب|ل)?مالي$_we', 'باماكو', 'غويتا', 'ماليين',
  ]),
  Portal('ne', 'النيجر', 'Niger', 'الجوار', [
    're:$_w(و|ب|ل)?النيجر$_we(?!يا)', 'نيامي', 'تياني',
  ]),
  Portal('td', 'تشاد', 'Tchad', 'الجوار', [
    'تشاد', 'انجامينا', 'نجامينا',
  ]),
  Portal('gm', 'غامبيا', 'Gambie', 'الجوار', [
    'غامبيا', 'بانجول',
  ]),
];

final _cache = <String, RegExp>{};

/// تطابق نص مع قائمة كلمات (نص عادي أو تعبير نمطي يبدأ بـ re:).
bool matchesAny(String text, List<String> keywords) {
  for (final k in keywords) {
    if (k.startsWith('re:')) {
      final r = _cache.putIfAbsent(k, () => RegExp(k.substring(3), unicode: true));
      if (r.hasMatch(text)) return true;
    } else if (text.contains(k)) {
      return true;
    }
  }
  return false;
}

String _textOf(Object o) {
  if (o is Article) return '${o.title} ${o.body}'.replaceAll('_', ' ');
  final v = o as VideoItem;
  return '${v.title} ${v.description}'.replaceAll('_', ' ');
}

bool inPortal(Portal p, Object o) {
  if (o is Article && o.portals.contains(p.id)) return true;
  return matchesAny(_textOf(o), p.keywords);
}

/// البوابات التي يظهر فيها عنصر.
List<Portal> portalsOf(Object o) => portals.where((p) => inPortal(p, o)).toList();
