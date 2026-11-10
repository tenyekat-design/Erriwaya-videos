import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'data.dart';
import 'theme.dart';

/// هندسة الميدالية المفصّصة في صفحتي الفاتحة وأول البقرة:
/// قوس علوي بفصّين يلتقيان في رأس مدبّب، وجانبان منتفخان قليلاً، وقوس سفلي مقابل.
/// كل شكل داخلي هو الشكل نفسه مُزاحاً إلى الداخل بمقدار d.
class Medallion {
  Medallion(Size s)
      : w = s.width,
        h = s.height {
    b = Rect.fromLTRB(w * .075, h * .038, w * .925, h * .962);
    aH = b.height * .125;
    bul = b.width * .065;
    bandW = b.width * .062;
  }
  final double w, h;
  late final Rect b;
  late final double aH, bul, bandW;
  double get cx => b.center.dx;

  /// إزاحة منطقة النصّ من الحافة الخارجية.
  double get textInset => bandW + b.width * .045;

  double _a(double d) => aH - d * .55;
  double ts(double d) => b.top + d + _a(d);
  double bs(double d) => b.bottom - d - _a(d);
  double r0(double d) => b.right - d - bul;

  /// نصف عرض الشكل عند الارتفاع y (بين الكتفين).
  double halfW(double y, double d) {
    final u = ((y - ts(d)) / (bs(d) - ts(d))).clamp(0.0, 1.0);
    return r0(d) + bul * 4 * u * (1 - u) - cx;
  }

  Path shape(double d) {
    final l = b.left + d, t = b.top + d, r = b.right - d, bt = b.bottom - d;
    final bw = r - l, a = _a(d), c = cx;
    final rr = r0(d), top = ts(d), bot = bs(d);
    double mx(double x) => 2 * c - x;
    final p = Path()..moveTo(c, t);
    // القوس العلوي الأيمن: فصّ صغير عند الرأس ثم فصّ أكبر إلى الكتف
    p.cubicTo(c + .09 * bw, t + .02 * a, c + .13 * bw, t + .42 * a, c + .24 * bw, t + .40 * a);
    p.cubicTo(c + .36 * bw, t + .36 * a, rr + bul * .15, top - .6 * a, rr, top);
    for (var i = 1; i <= 32; i++) {
      final u = i / 32;
      p.lineTo(rr + bul * 4 * u * (1 - u), top + u * (bot - top));
    }
    p.cubicTo(rr + bul * .15, bot + .6 * a, c + .36 * bw, bt - .36 * a, c + .24 * bw, bt - .40 * a);
    p.cubicTo(c + .13 * bw, bt - .42 * a, c + .09 * bw, bt - .02 * a, c, bt);
    p.cubicTo(mx(c + .09 * bw), bt - .02 * a, mx(c + .13 * bw), bt - .42 * a, mx(c + .24 * bw), bt - .40 * a);
    p.cubicTo(mx(c + .36 * bw), bt - .36 * a, mx(rr + bul * .15), bot + .6 * a, mx(rr), bot);
    for (var i = 1; i <= 32; i++) {
      final u = i / 32;
      p.lineTo(mx(rr + bul * 4 * u * (1 - u)), bot - u * (bot - top));
    }
    p.cubicTo(mx(rr + bul * .15), top - .6 * a, mx(c + .36 * bw), t + .36 * a, mx(c + .24 * bw), t + .40 * a);
    p.cubicTo(mx(c + .13 * bw), t + .42 * a, mx(c + .09 * bw), t + .02 * a, c, t);
    return p..close();
  }

  /// موضع خرطوشة اسم السورة في القوس العلوي، وموضع العقدة في القوس السفلي.
  Offset get cartoucheCenter => Offset(cx, b.top + aH * .64);
  Size get cartoucheSize => Size(b.width * .44, aH * .5);
  Offset get knotCenter => Offset(cx, b.bottom - aH * .6);
  double get knotSize => aH * .34;
}

/// ألوان الزخرفة الفاخرة: بنفسجي فاتح وورديّ وذهبيّ وأخضر زيتي، ونسخة أهدأ لليل.
class _Pal {
  const _Pal(this.lav, this.lavD, this.rose, this.roseD, this.gold, this.goldD, this.teal, this.tealL, this.navy,
      this.orange, this.panel, this.strap);
  final Color lav, lavD, rose, roseD, gold, goldD, teal, tealL, navy, orange, panel, strap;
  static const light = _Pal(Color(0xFFCDBFE3), Color(0xFF8E78B8), Color(0xFFE9B4B0), Color(0xFFC47F79),
      Color(0xFFC49A3C), Color(0xFF8C6A22), Color(0xFF2F7D6D), Color(0xFF5FA392), Color(0xFF2D3F7C),
      Color(0xFFD98A3A), Color(0xFFFFFDF8), Color(0xFFFFFFFF));
  static const dark = _Pal(Color(0xFF51466E), Color(0xFF8E78B8), Color(0xFF8A5753), Color(0xFFC47F79),
      Color(0xFFC9A04A), Color(0xFFA9822F), Color(0xFF3E9C88), Color(0xFF4F8F80), Color(0xFF6C80C8),
      Color(0xFFD98A3A), Color(0xFF121C1B), Color(0xFFE6DDF3));
}

class MedallionPainter extends CustomPainter {
  MedallionPainter({required this.colors, required this.title, required this.titleFont, required this.page});
  final PageColors colors;
  final String title, titleFont;
  final int page;

  bool get _dark => colors == PageColors.dark;

  @override
  void paint(Canvas canvas, Size size) {
    final m = Medallion(size);
    final p = _dark ? _Pal.dark : _Pal.light;
    final bw = m.bandW;
    Paint fill(Color c) => Paint()..color = c;
    Paint line(Color c, double w) => Paint()
      ..color = c
      ..style = PaintingStyle.stroke
      ..strokeWidth = w
      ..strokeJoin = StrokeJoin.round;

    // إطار رفيع للصفحة
    final edge = Rect.fromLTWH(0, 0, size.width, size.height);
    canvas.drawRect(edge.deflate(5), line(p.gold.withValues(alpha: .8), 1));
    canvas.drawRect(edge.deflate(8), line(p.gold.withValues(alpha: .5), .5));

    // زخارف الأركان النباتية
    final cs = math.min(size.width * .07, m.b.top + m.aH * .5);
    for (final o in [
      Offset(size.width * .095, size.height * .062),
      Offset(size.width * .905, size.height * .062),
      Offset(size.width * .095, size.height * .938),
      Offset(size.width * .905, size.height * .938),
    ]) {
      _corner(canvas, o, cs, p);
    }

    // الشريط البنفسجي الخارجي
    final s0 = m.shape(0);
    canvas.drawShadow(s0, Colors.black, 3, false);
    canvas.drawPath(s0, fill(p.lav));
    _braid(canvas, m, p);
    canvas.drawPath(s0, line(p.goldD, 1.6));
    canvas.drawPath(m.shape(bw * .06), line(p.gold.withValues(alpha: .7), .6));

    // شريط وردي، ثم خيط ذهبي، ثم اللوحة
    final s1 = m.shape(bw);
    canvas.drawPath(s1, fill(p.rose));
    canvas.drawPath(s1, line(p.lavD, 1));
    _roseDots(canvas, m, p);
    canvas.drawPath(m.shape(bw + 4), fill(p.gold));
    canvas.drawPath(m.shape(bw + 6), fill(p.panel));
    canvas.drawPath(m.shape(bw + 10), line(p.tealL.withValues(alpha: .8), .8));

    // رأسا الميدالية
    for (final (y, dir) in [(m.b.top, -1.0), (m.b.bottom, 1.0)]) {
      final f = Path()
        ..moveTo(m.cx, y + dir * 17)
        ..quadraticBezierTo(m.cx + 7, y + dir * 5, m.cx, y - dir * 2)
        ..quadraticBezierTo(m.cx - 7, y + dir * 5, m.cx, y + dir * 17);
      canvas.drawPath(f, fill(p.gold));
      canvas.drawCircle(Offset(m.cx, y + dir * 20), 2.6, fill(p.rose));
    }

    _cartouche(canvas, m, p);
    _knot(canvas, m.knotCenter, m.knotSize, p);
  }

  /// ضفيرة بيضاء من خيطين متقاطعين تسير على طول الشريط البنفسجي.
  void _braid(Canvas canvas, Medallion m, _Pal p) {
    final bw = m.bandW;
    final metric = m.shape(bw * .5).computeMetrics().first;
    final len = metric.length;
    final n = (len / (bw * 1.7)).round();
    final period = len / n;
    final amp = bw * .27;
    final strands = <Path>[Path(), Path()];
    for (var k = 0; k < 2; k++) {
      for (var sDist = 0.0; sDist <= len; sDist += 1.5) {
        final t = metric.getTangentForOffset(sDist)!;
        final v = t.vector;
        final nrm = Offset(-v.dy, v.dx);
        final off = amp * math.sin(2 * math.pi * sDist / period + k * math.pi);
        final pt = t.position + nrm * off;
        sDist == 0 ? strands[k].moveTo(pt.dx, pt.dy) : strands[k].lineTo(pt.dx, pt.dy);
      }
    }
    final under = Paint()
      ..color = p.lavD
      ..style = PaintingStyle.stroke
      ..strokeWidth = bw * .2;
    final over = Paint()
      ..color = p.strap
      ..style = PaintingStyle.stroke
      ..strokeWidth = bw * .11;
    for (final s in strands) {
      canvas.drawPath(s, under);
      canvas.drawPath(s, over);
    }
    // تشابك فوق/تحت: عند كل تقاطع ثانٍ يُعاد رسم الخيط الأول فوق الثاني
    for (var k = 0; k < n * 2; k += 2) {
      final c = metric.getTangentForOffset(k * period / 2)!.position;
      canvas.save();
      canvas.clipPath(Path()..addOval(Rect.fromCircle(center: c, radius: bw * .2)));
      canvas.drawPath(strands[0], under);
      canvas.drawPath(strands[0], over);
      canvas.restore();
    }
    // نقاط وردية في قلب كل عروة
    for (var k = 0; k < n * 2; k++) {
      final c = metric.getTangentForOffset((k + .5) * period / 2)!.position;
      canvas.drawCircle(c, bw * .085, Paint()..color = p.roseD);
      canvas.drawCircle(c, bw * .04, Paint()..color = p.gold);
    }
  }

  /// حبّات صغيرة على الشريط الوردي.
  void _roseDots(Canvas canvas, Medallion m, _Pal p) {
    final metric = m.shape(m.bandW + 2).computeMetrics().first;
    final n = (metric.length / 9).round();
    final paint = Paint()..color = p.panel.withValues(alpha: .85);
    for (var k = 0; k < n; k++) {
      canvas.drawCircle(metric.getTangentForOffset(k * metric.length / n)!.position, .9, paint);
    }
  }

  void _cartouche(Canvas canvas, Medallion m, _Pal p) {
    final c = m.cartoucheCenter, s = m.cartoucheSize;
    final r = RRect.fromRectAndRadius(Rect.fromCenter(center: c, width: s.width, height: s.height),
        Radius.circular(s.height / 2));
    // جناحان صغيران على طرفي الخرطوشة
    for (final dir in [-1.0, 1.0]) {
      final x = c.dx + dir * s.width / 2;
      final wing = Path()
        ..moveTo(x, c.dy - s.height * .28)
        ..quadraticBezierTo(x + dir * s.height * .55, c.dy, x, c.dy + s.height * .28)
        ..close();
      canvas.drawPath(wing, Paint()..color = p.gold);
      canvas.drawCircle(Offset(x + dir * s.height * .42, c.dy), s.height * .09, Paint()..color = p.teal);
    }
    canvas.drawRRect(r, Paint()..color = p.panel);
    canvas.drawRRect(
        r,
        Paint()
          ..color = p.goldD
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.6);
    canvas.drawRRect(
        r.deflate(3.2),
        Paint()
          ..color = p.rose
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1);
    final tp = TextPainter(
      text: TextSpan(
          text: title,
          style: TextStyle(fontFamily: titleFont, fontSize: s.height * .5, height: 1.15, color: colors.ink)),
      textDirection: TextDirection.rtl,
    )..layout(maxWidth: s.width - s.height);
    tp.paint(canvas, c - Offset(tp.width / 2, tp.height / 2));
    tp.dispose();
  }

  /// عقدة متشابكة: معيّن أزرق ومربّع برتقالي يتداخلان، وفي قلبها رقم الصفحة.
  void _knot(Canvas canvas, Offset c, double s, _Pal p) {
    final q = s * .62;
    canvas.save();
    canvas.translate(c.dx, c.dy);
    final dia = Path()
      ..moveTo(0, -s)
      ..lineTo(s, 0)
      ..lineTo(0, s)
      ..lineTo(-s, 0)
      ..close();
    final sq = Path()..addRect(Rect.fromLTRB(-q, -q, q, q));
    void band(Path path, Color col) {
      canvas.drawPath(
          path,
          Paint()
            ..color = p.panel
            ..style = PaintingStyle.stroke
            ..strokeWidth = s * .27
            ..strokeJoin = StrokeJoin.round);
      canvas.drawPath(
          path,
          Paint()
            ..color = col
            ..style = PaintingStyle.stroke
            ..strokeWidth = s * .17
            ..strokeJoin = StrokeJoin.round);
    }

    band(dia, p.navy);
    band(sq, p.orange);
    for (final o in [Offset(q, -(s - q)), Offset(-q, s - q), Offset(s - q, q), Offset(-(s - q), -q)]) {
      canvas.save();
      canvas.clipPath(Path()..addOval(Rect.fromCircle(center: o, radius: s * .2)));
      band(dia, p.navy);
      canvas.restore();
    }
    canvas.drawCircle(Offset.zero, s * .38, Paint()..color = p.panel);
    canvas.drawCircle(
        Offset.zero,
        s * .38,
        Paint()
          ..color = p.gold
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2);
    final tp = TextPainter(
      text: TextSpan(text: ar(page), style: TextStyle(fontFamily: Brand.ui, fontSize: s * .42, color: colors.ink)),
      textDirection: TextDirection.rtl,
    )..layout();
    tp.paint(canvas, Offset(-tp.width / 2, -tp.height / 2));
    tp.dispose();
    canvas.restore();
  }

  void _corner(Canvas canvas, Offset c, double s, _Pal p) {
    for (var k = 0; k < 4; k++) {
      _leaf(canvas, c, k * math.pi / 2 + math.pi / 4, s, s * .32, p);
    }
    for (var k = 0; k < 4; k++) {
      final a = k * math.pi / 2;
      final pc = c + Offset(math.cos(a), math.sin(a)) * s * .55;
      _curl(canvas, pc, s * .22, a, k.isOdd ? 1 : -1, p);
      canvas.drawCircle(c + Offset(math.cos(a), math.sin(a)) * s * .95, s * .08, Paint()..color = p.rose);
    }
    canvas.drawCircle(c, s * .2, Paint()..color = p.rose);
    canvas.drawCircle(
        c,
        s * .2,
        Paint()
          ..color = p.gold
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2);
    canvas.drawCircle(c, s * .07, Paint()..color = p.gold);
  }

  void _leaf(Canvas canvas, Offset c, double ang, double l, double wid, _Pal p) {
    canvas.save();
    canvas.translate(c.dx, c.dy);
    canvas.rotate(ang);
    final path = Path()
      ..moveTo(0, 0)
      ..cubicTo(l * .35, -wid, l * .8, -wid * .8, l, 0)
      ..cubicTo(l * .8, wid * .8, l * .35, wid, 0, 0);
    canvas.drawPath(path, Paint()..color = p.teal);
    canvas.drawPath(
        path,
        Paint()
          ..color = p.gold
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1);
    canvas.drawPath(
        Path()
          ..moveTo(l * .15, 0)
          ..quadraticBezierTo(l * .55, -wid * .25, l * .85, 0),
        Paint()
          ..color = p.tealL
          ..style = PaintingStyle.stroke
          ..strokeWidth = .8);
    canvas.restore();
  }

  void _curl(Canvas canvas, Offset c, double r, double ang, int dir, _Pal p) {
    final path = Path();
    for (var i = 0; i <= 30; i++) {
      final t = i / 30, a = ang + dir * t * 1.7 * 2 * math.pi, rr = r * (1 - .8 * t);
      final pt = c + Offset(math.cos(a), math.sin(a)) * rr;
      i == 0 ? path.moveTo(pt.dx, pt.dy) : path.lineTo(pt.dx, pt.dy);
    }
    canvas.drawPath(
        path,
        Paint()
          ..color = p.gold
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.3
          ..strokeCap = ui.StrokeCap.round);
  }

  @override
  bool shouldRepaint(MedallionPainter old) => old.colors != colors || old.title != title || old.page != page;
}
