import 'dart:math' as math;
import 'dart:ui' show Tangent;
import 'package:flutter/material.dart';
import 'theme.dart';

/// زخرفة على طريقة مصحف المدينة: لوحة مفصّصة بشريط بنفسجي تجري فيه ضفيرة بيضاء،
/// وشريط ورديّ، وزوايا نباتية خضراء بحواف ذهبية، وعقدة متشابكة، وأشرطة سور بالألوان نفسها.
/// الرسم كله بالكود (تصميم خاص بالتطبيق على هذا الطراز).
class Md {
  static const lav = Color(0xFFC7B6E2);
  static const lavLight = Color(0xFFE4DAF2);
  static const lavDark = Color(0xFF6E54A0);
  static const rose = Color(0xFFF2C4C0);
  static const roseDark = Color(0xFFC9837D);
  static const gold = Color(0xFFC9A040);
  static const goldDark = Color(0xFF8E6B1E);
  static const green = Color(0xFF3E8E5E);
  static const greenLight = Color(0xFF7DBE8E);
  static const navy = Color(0xFF26408B);
  static const orange = Color(0xFFE08A3C);
  static const cream = Color(0xFFFFF6E8);
  static const white = Color(0xFFFFFFFF);
  static const surahFont = 'SurahNames';

  /// رسم اسم السورة في خطّ أسماء السور (يشمل كلمة «سورة»).
  static String surahGlyph(int n) => String.fromCharCode(0xE000 + n);
}

Paint _f(Color c) => Paint()..color = c;
Paint _s(Color c, double w) => Paint()
  ..color = c
  ..style = PaintingStyle.stroke
  ..strokeWidth = w
  ..strokeCap = StrokeCap.round
  ..strokeJoin = StrokeJoin.round;

/// هندسة لوحة الفاتحة وأول البقرة: جسم مستطيل بجانبين مستقيمين، وقوس مفصّص مدبّب أعلاه وأسفله.
class Medallion {
  Medallion(Size s)
      : w = s.width,
        h = s.height {
    final bw = w * .88;
    final bh = math.min(h * .93, bw * 2.2);
    b = Rect.fromCenter(center: Offset(w / 2, h / 2 - h * .005), width: bw, height: bh);
    aH = b.height * .16;
    bandW = b.width * .075;
  }
  final double w, h;
  late final Rect b;
  late final double aH, bandW;
  double get cx => b.center.dx;

  double get textInset => bandW + 14;
  double halfW(double y, double d) => b.width / 2 - d;

  Offset get cartoucheCenter => Offset(cx, b.top + aH * .64);
  Size get cartoucheSize => Size(b.width * .42, aH * .5);
  Offset get knotCenter => Offset(cx, b.bottom - aH * .6);
  double get knotSize => aH * .27;

  double get textTop => cartoucheCenter.dy + cartoucheSize.height * .75;
  double get textBottom => knotCenter.dy - knotSize * 1.25;

  List<Offset> _points(double d) {
    final l = b.left + d, t = b.top + d, r = b.right - d, bt = b.bottom - d;
    final bw = r - l, a = aH - d * .35, c = cx;
    final sh = t + a, sb = bt - a;
    final p = <Offset>[Offset(c, t)];
    void cub(Offset p1, Offset p2, Offset p3, int n) {
      final p0 = p.last;
      for (var i = 1; i <= n; i++) {
        final s = i / n, u = 1 - s;
        p.add(p0 * (u * u * u) + p1 * (3 * u * u * s) + p2 * (3 * u * s * s) + p3 * (s * s * s));
      }
    }

    cub(Offset(c + bw * .05, t + a * .05), Offset(c + bw * .07, t + a * .25), Offset(c + bw * .14, t + a * .28), 12);
    cub(Offset(c + bw * .24, t + a * .30), Offset(c + bw * .30, t + a * .05), Offset(c + bw * .40, t + a * .18), 14);
    cub(Offset(c + bw * .48, t + a * .28), Offset(r, t + a * .40), Offset(r, sh), 14);
    for (var i = 1; i <= 30; i++) {
      p.add(Offset(r, sh + i / 30 * (sb - sh)));
    }
    cub(Offset(r, bt - a * .40), Offset(c + bw * .48, bt - a * .28), Offset(c + bw * .40, bt - a * .18), 14);
    cub(Offset(c + bw * .30, bt - a * .05), Offset(c + bw * .24, bt - a * .30), Offset(c + bw * .14, bt - a * .28), 14);
    cub(Offset(c + bw * .07, bt - a * .25), Offset(c + bw * .05, bt - a * .05), Offset(c, bt), 12);
    final n = p.length;
    for (var i = n - 2; i >= 1; i--) {
      p.add(Offset(2 * c - p[i].dx, p[i].dy));
    }
    return p;
  }

  Path shape(double d) => Path()..addPolygon(_points(d), true);
}

/// لوحة الفاتحة وأول البقرة كاملة (دون النصّ).
class MedallionPainter extends CustomPainter {
  MedallionPainter({required this.colors, required this.surah, required this.page});
  final PageColors colors;
  final int surah, page;

  @override
  void paint(Canvas canvas, Size size) {
    final m = Medallion(size);
    final bw = m.bandW;
    final center = m.b.center;

    // الزوايا النباتية
    final cr = math.min(size.width * .2, m.b.top + m.aH * .9);
    paintCornerArabesque(canvas, const Offset(6, 6), 1, 1, cr);
    paintCornerArabesque(canvas, Offset(size.width - 6, 6), -1, 1, cr);
    paintCornerArabesque(canvas, Offset(6, size.height - 6), 1, -1, cr);
    paintCornerArabesque(canvas, Offset(size.width - 6, size.height - 6), -1, -1, cr);

    // حافة ذهبية مفصّصة، ثم الشريط البنفسجي بضفيرته
    final s0 = m.shape(0);
    _scallops(canvas, s0, center, 7, 2.6, Md.gold, outward: true);
    canvas.drawShadow(s0, const Color(0xFF503278), 4, false);
    canvas.drawPath(s0, _f(Md.lav));
    _braid(canvas, m.shape(bw * .5), bw * .27);
    canvas.drawPath(s0, _s(Md.goldDark, 1.6));
    canvas.drawPath(m.shape(2.5), _s(Md.gold, .8));

    // خيط ذهبي، ثم الشريط الوردي بحبّاته البيضاء، ثم خيط ذهبي واللوحة
    canvas.drawPath(m.shape(bw), _f(Md.goldDark));
    canvas.drawPath(m.shape(bw + .8), _f(Md.gold));
    final rose = m.shape(bw + 2.2);
    canvas.drawPath(rose, _f(Md.rose));
    _scallops(canvas, rose, center, 6, 1.6, Md.white, outward: false);
    canvas.drawPath(m.shape(bw + 5.5), _s(Md.roseDark, .7));
    canvas.drawPath(m.shape(bw + 8), _f(Md.gold));
    canvas.drawPath(m.shape(bw + 9.2), _f(colors.paper));
    canvas.drawPath(m.shape(bw + 13), _s(Md.greenLight, .6));

    // رأسان ذهبيان
    for (final (y, d) in [(m.b.top, -1.0), (m.b.bottom, 1.0)]) {
      canvas.drawPath(
          Path()
            ..moveTo(m.cx, y + d * 14)
            ..quadraticBezierTo(m.cx + 6, y + d * 4, m.cx, y - d * 2)
            ..quadraticBezierTo(m.cx - 6, y + d * 4, m.cx, y + d * 14),
          _f(Md.gold));
      canvas.drawCircle(Offset(m.cx, y + d * 16.5), 2.3, _f(Md.roseDark));
    }

    // خرطوشة اسم السورة، والعقدة
    final c = m.cartoucheCenter, cs = m.cartoucheSize;
    final cp = lobedCartouche(c, cs.width, cs.height);
    canvas.drawPath(cp, _f(Md.cream));
    canvas.drawPath(cp, _s(Md.lavDark, 1.4));
    canvas.save();
    canvas.translate(c.dx, c.dy);
    canvas.scale(.9, .8);
    canvas.translate(-c.dx, -c.dy);
    canvas.drawPath(cp, _s(Md.roseDark, .9));
    canvas.restore();
    paintSurahName(canvas, c, surah, cs.height * .95, const Color(0xFF1A1A1A));
    paintKnot(canvas, m.knotCenter, m.knotSize);

    // رقم الصفحة تحت اللوحة
    final tp = TextPainter(
      text: TextSpan(
          text: _ar(page), style: TextStyle(fontFamily: Brand.ui, fontSize: 12, color: colors.muted, height: 1)),
      textDirection: TextDirection.rtl,
    )..layout();
    tp.paint(canvas, Offset(m.cx - tp.width / 2, math.min(size.height - 15, m.b.bottom + 20)));
    tp.dispose();
  }

  /// ضفيرة بيضاء من خيطين متشابكين، وفي عراها براعم وردية ولفائف.
  void _braid(Canvas canvas, Path center, double amp) {
    for (final metric in center.computeMetrics()) {
      final len = metric.length;
      final n = math.max(4, (len / 30).round());
      final per = len / n;
      final strands = [Path(), Path()];
      for (var k = 0; k < 2; k++) {
        for (var s = 0.0; s <= len; s += 1.2) {
          final t = metric.getTangentForOffset(s)!;
          final pt = t.position + _nrm(t) * (amp * math.sin(2 * math.pi * s / per + k * math.pi));
          s == 0 ? strands[k].moveTo(pt.dx, pt.dy) : strands[k].lineTo(pt.dx, pt.dy);
        }
      }
      final under = _s(Md.lavDark, 3.6), over = _s(Md.white, 2);
      for (final s in strands) {
        canvas.drawPath(s, under);
        canvas.drawPath(s, over);
      }
      for (var k = 0; k < n; k++) {
        final c = metric.getTangentForOffset(k * per)!.position;
        canvas.save();
        canvas.clipPath(Path()..addOval(Rect.fromCircle(center: c, radius: amp * .55)));
        canvas.drawPath(strands[0], under);
        canvas.drawPath(strands[0], over);
        canvas.restore();
      }
      final curl = _s(Md.white, 1.1);
      for (var k = 0; k < n * 2; k++) {
        final s = (k + .5) * per / 2;
        final t = metric.getTangentForOffset(s)!;
        final q = t.position;
        canvas.drawCircle(q, amp * .32, _f(k.isOdd ? Md.rose : Md.white));
        canvas.drawCircle(q, amp * .32, _s(Md.lavDark, .6));
        canvas.drawCircle(q, amp * .12, _f(k.isOdd ? Md.roseDark : Md.gold));
        final side = math.sin(2 * math.pi * s / per) > 0 ? 1.0 : -1.0;
        final crest = q + _nrm(t) * (amp * side) + t.vector * (amp * .45);
        _spiral(canvas, crest, amp * .32, t.vector.direction + math.pi, side, 1.1, curl);
      }
    }
  }

  void _scallops(Canvas canvas, Path path, Offset center, double every, double r, Color col, {required bool outward}) {
    final paint = _f(col);
    for (final metric in path.computeMetrics()) {
      final n = (metric.length / every).round();
      for (var k = 0; k < n; k++) {
        final t = metric.getTangentForOffset(k * metric.length / n)!;
        var nr = _nrm(t);
        final away = (t.position - center).dx * nr.dx + (t.position - center).dy * nr.dy > 0;
        if (away != outward) nr = -nr;
        final a = nr.direction;
        canvas.drawArc(Rect.fromCircle(center: t.position, radius: r), a - math.pi / 2, math.pi, true, paint);
      }
    }
  }

  static String _ar(int n) => n.toString().split('').map((d) => '٠١٢٣٤٥٦٧٨٩'[int.parse(d)]).join();

  @override
  bool shouldRepaint(MedallionPainter old) => old.colors != colors || old.surah != surah || old.page != page;
}

Offset _nrm(Tangent t) => Offset(-t.vector.dy, t.vector.dx);

void _spiral(Canvas canvas, Offset c, double r, double a0, double dir, double turns, Paint paint) {
  final p = Path();
  for (var j = 0; j <= 30; j++) {
    final t = j / 30, an = a0 + dir * t * turns * 2 * math.pi, rr = r * (1 - .8 * t);
    final q = c + Offset(math.cos(an), math.sin(an)) * rr;
    j == 0 ? p.moveTo(q.dx, q.dy) : p.lineTo(q.dx, q.dy);
  }
  canvas.drawPath(p, paint);
}

/// اسم السورة بخطّ أسماء السور، في وسط النقطة c.
void paintSurahName(Canvas canvas, Offset c, int surah, double fontSize, Color color) {
  final tp = TextPainter(
    text: TextSpan(
        text: Md.surahGlyph(surah),
        style: TextStyle(fontFamily: Md.surahFont, fontSize: fontSize, height: 1, color: color)),
    textDirection: TextDirection.rtl,
  )..layout();
  tp.paint(canvas, c - Offset(tp.width / 2, tp.height / 2 - fontSize * .06));
  tp.dispose();
}

/// خرطوشة مفصّصة كالسحاب: فصوص صغيرة أعلاها وأسفلها، ونصف دائرة على كل جانب.
Path lobedCartouche(Offset c, double w, double h) {
  final r = h / 2;
  final p = Path()..moveTo(c.dx - w / 2 + r, c.dy - h / 2);
  const n = 5;
  for (var i = 0; i < n; i++) {
    final x0 = c.dx - w / 2 + r + (w - 2 * r) * i / n, x1 = c.dx - w / 2 + r + (w - 2 * r) * (i + 1) / n;
    p.quadraticBezierTo((x0 + x1) / 2, c.dy - h / 2 - h * .12, x1, c.dy - h / 2);
  }
  p.arcTo(Rect.fromCircle(center: Offset(c.dx + w / 2 - r, c.dy), radius: r), -math.pi / 2, math.pi, false);
  for (var i = 0; i < n; i++) {
    final x0 = c.dx + w / 2 - r - (w - 2 * r) * i / n, x1 = c.dx + w / 2 - r - (w - 2 * r) * (i + 1) / n;
    p.quadraticBezierTo((x0 + x1) / 2, c.dy + h / 2 + h * .12, x1, c.dy + h / 2);
  }
  p.arcTo(Rect.fromCircle(center: Offset(c.dx - w / 2 + r, c.dy), radius: r), math.pi / 2, math.pi, false);
  return p..close();
}

/// عقدة متشابكة: مربّع برتقالي ومعيّن أزرق يتداخلان فوق وردة رباعية، وفي القلب زهرة.
void paintKnot(Canvas canvas, Offset c, double s) {
  canvas.save();
  canvas.translate(c.dx, c.dy);
  final q = s * .66;
  for (var k = 0; k < 4; k++) {
    final a = k * math.pi / 2;
    canvas.drawCircle(Offset(math.cos(a), math.sin(a)) * s * .55, s * .62, _f(Md.lavLight));
  }
  final dia = Path()
    ..moveTo(0, -s)
    ..lineTo(s, 0)
    ..lineTo(0, s)
    ..lineTo(-s, 0)
    ..close();
  final sq = Path()..addRect(Rect.fromLTRB(-q, -q, q, q));
  void band(Path p, Color col) {
    canvas.drawPath(p, _s(Md.white, s * .26));
    canvas.drawPath(p, _s(col, s * .16));
    canvas.drawPath(p, _s(const Color(0x40000000), .6));
  }

  band(sq, Md.orange);
  band(dia, Md.navy);
  for (final o in [Offset(q, -(s - q)), Offset(-q, s - q), Offset(s - q, q), Offset(-(s - q), -q)]) {
    canvas.save();
    canvas.clipPath(Path()..addOval(Rect.fromCircle(center: o, radius: s * .17)));
    band(sq, Md.orange);
    canvas.restore();
  }
  canvas.drawCircle(Offset.zero, s * .3, _f(Md.rose));
  canvas.drawCircle(Offset.zero, s * .3, _s(Md.gold, 1.2));
  for (var k = 0; k < 8; k++) {
    final a = k * math.pi / 4;
    canvas.save();
    canvas.rotate(a);
    canvas.drawOval(Rect.fromCenter(center: Offset(s * .17, 0), width: s * .16, height: s * .08), _f(Md.white));
    canvas.restore();
  }
  canvas.drawCircle(Offset.zero, s * .07, _f(Md.gold));
  canvas.restore();
}

/// زخرفة ركن نباتية: سعفة خضراء كبيرة بقلب وردي نحو داخل الصفحة،
/// وورقتان معقوفتان على الحافتين بلفائف ذهبية. (sx, sy) اتجاه الركن.
void paintCornerArabesque(Canvas canvas, Offset at, double sx, double sy, double r) {
  canvas.save();
  canvas.translate(at.dx, at.dy);
  canvas.scale(sx, sy);
  canvas.rotate(math.pi / 4);
  void shape(Path p, Color fill, Color stroke) {
    canvas.drawPath(p, _f(fill));
    canvas.drawPath(p, _s(stroke, 1.2));
  }

  Path leaf(double x0, double x1, double w) => Path()
    ..moveTo(x0, 0)
    ..cubicTo(x0 + (x1 - x0) * .2, -w, x0 + (x1 - x0) * .75, -w * .95, x1, 0)
    ..cubicTo(x0 + (x1 - x0) * .75, w * .95, x0 + (x1 - x0) * .2, w, x0, 0);
  // غصنان رفيعان على امتداد الحافتين، عليهما أوراق صغيرة وبرعم وردي، وينتهيان بلفيفة
  for (final sd in [-1.0, 1.0]) {
    canvas.save();
    canvas.rotate(sd * math.pi / 4);
    final stem = Path()
      ..moveTo(r * .08, 0)
      ..cubicTo(r * .35, sd * r * .02, r * .7, sd * r * .16, r * 1.0, sd * r * .1);
    canvas.drawPath(stem, _s(Md.gold, 1.6));
    _spiral(canvas, Offset(r * 1.06, sd * r * .02), r * .1, sd > 0 ? math.pi * .6 : -math.pi * .6, -sd, 1.3,
        _s(Md.gold, 1.4));
    for (final (x, up) in [(.32, 1.0), (.5, -1.0), (.68, 1.0), (.84, -1.0)]) {
      final y = sd * r * (.02 + .14 * x * x);
      final leafPath = Path()
        ..moveTo(0, 0)
        ..cubicTo(r * .05, -r * .07, r * .15, -r * .06, r * .2, 0)
        ..cubicTo(r * .15, r * .06, r * .05, r * .07, 0, 0);
      canvas.save();
      canvas.translate(r * x, y);
      canvas.rotate(-sd * up * .9 + (up < 0 ? 0 : 0));
      canvas.drawPath(leafPath, _f(Md.green));
      canvas.drawPath(leafPath, _s(Md.gold, .8));
      canvas.restore();
    }
    canvas.drawCircle(Offset(r * .6, sd * r * .07), r * .045, _f(Md.rose));
    canvas.drawCircle(Offset(r * .6, sd * r * .07), r * .045, _s(Md.goldDark, .7));
    canvas.restore();
  }
  // السعفة الوسطى
  shape(leaf(r * .12, r * .8, r * .2), Md.green, Md.gold);
  shape(leaf(r * .22, r * .7, r * .11), Md.rose, Md.goldDark);
  shape(leaf(r * .32, r * .58, r * .045), Md.greenLight, Md.goldDark);
  canvas.drawLine(Offset(r * .8, 0), Offset(r * .95, 0), _s(Md.gold, 1.4));
  canvas.drawCircle(Offset(r * .97, 0), r * .04, _f(Md.gold));
  canvas.drawCircle(Offset(r * .1, 0), r * .07, _f(Md.gold));
  canvas.restore();
}

/// شريط اسم السورة في الصفحات: إطار بنفسجي بخيوط بيضاء متموّجة،
/// وفي وسطه خرطوشة عاجية فيها الاسم، وعلى جانبيه دائرتان ورديتان.
class SurahHeaderPainter extends CustomPainter {
  SurahHeaderPainter(this.surah, this.ink);
  final int surah;
  final Color ink;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width, h = size.height, c = size.center(Offset.zero);
    final r = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(h * .18));
    canvas.drawRRect(r, _f(Md.lav));
    final wave = _s(Md.white, 1);
    for (final y in [h * .2, h * .8]) {
      final p = Path()..moveTo(4, y);
      for (var x = 4.0; x <= w - 4; x += 1) {
        p.lineTo(x, y + math.sin(x / 7) * h * .07);
      }
      canvas.drawPath(p, wave);
    }
    canvas.drawRRect(r, _s(Md.goldDark, 1.2));
    canvas.drawRRect(r.deflate(2.2), _s(Md.gold, .6));
    for (final d in [-1.0, 1.0]) {
      final o = Offset(c.dx + d * w * .37, c.dy);
      canvas.drawCircle(o, h * .26, _f(Md.rose));
      canvas.drawCircle(o, h * .26, _s(Md.gold, 1));
      canvas.drawCircle(o, h * .1, _f(Md.green));
      for (final e in [-1.0, 1.0]) {
        paintLeafAt(canvas, o + Offset(e * h * .3, 0), e > 0 ? 0 : math.pi, h * .5, h * .14);
      }
    }
    final cw = math.min(w * .5, h * 5.2), ch = h * .8;
    final cp = lobedCartouche(c, cw, ch);
    canvas.drawPath(cp, _f(Md.cream));
    canvas.drawPath(cp, _s(Md.lavDark, 1.2));
    paintSurahName(canvas, c, surah, ch * .95, ink);
  }

  @override
  bool shouldRepaint(SurahHeaderPainter old) => old.surah != surah || old.ink != ink;
}

void paintLeafAt(Canvas canvas, Offset at, double angle, double l, double w) {
  canvas.save();
  canvas.translate(at.dx, at.dy);
  canvas.rotate(angle);
  final p = Path()
    ..moveTo(0, 0)
    ..cubicTo(l * .3, -w, l * .75, -w * .7, l, 0)
    ..cubicTo(l * .75, w * .7, l * .3, w, 0, 0);
  canvas.drawPath(p, _f(Md.green));
  canvas.drawPath(p, _s(Md.gold, .8));
  canvas.restore();
}

/// ورق الصفحة العادية: لون الورق، وظلّ خفيف على حافة الكعب كالمصحف المطبوع.
class PaperPainter extends CustomPainter {
  PaperPainter(this.colors, this.page);
  final PageColors colors;
  final int page;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, _f(colors.paper));
    // الصفحات الفردية كعبها على اليمين، والزوجية على اليسار
    final right = page.isOdd;
    final edge = Rect.fromLTWH(right ? size.width - 16 : 0, 0, 16, size.height);
    canvas.drawRect(
        edge,
        Paint()
          ..shader = LinearGradient(
            begin: right ? Alignment.centerLeft : Alignment.centerRight,
            end: right ? Alignment.centerRight : Alignment.centerLeft,
            colors: [colors.ink.withValues(alpha: 0), colors.ink.withValues(alpha: .09)],
          ).createShader(edge));
  }

  @override
  bool shouldRepaint(PaperPainter old) => old.colors != colors || old.page != page;
}
