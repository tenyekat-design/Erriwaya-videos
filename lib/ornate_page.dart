import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'oualata.dart';
import 'theme.dart';

/// هندسة لوحة الفاتحة وأول البقرة: إطار جصّي أبيض بقوس علوي مفصّص يلتقي في رأس مدبّب،
/// وجانبين منتفخين قليلاً، وقوس سفلي مقابل، على جدار طيني كواجهات بيوت ولاتة.
/// كل شكل داخلي هو الشكل نفسه مُزاحاً إلى الداخل بمقدار d.
class Medallion {
  Medallion(Size s)
      : w = s.width,
        h = s.height {
    b = Rect.fromLTRB(w * .08, h * .05, w * .92, h * .95);
    aH = b.height * .13;
    bul = b.width * .06;
    bandW = b.width * .085;
  }
  final double w, h;
  late final Rect b;
  late final double aH, bul, bandW;
  double get cx => b.center.dx;

  /// حافة اللوحة الورقية، وإزاحة منطقة النصّ.
  double get panelInset => bandW * 1.17;
  double get textInset => bandW * 1.3 + 8;

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
    final t = b.top + d, r = b.right - d, bt = b.bottom - d;
    final bw = r - (b.left + d), a = _a(d), c = cx;
    final rr = r0(d), top = ts(d), bot = bs(d);
    double mx(double x) => 2 * c - x;
    final p = Path()..moveTo(c, t);
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

  /// خرطوشة اسم السورة تحت الرأس العلوي، والدائرتان الملوّنتان على الرأسين.
  Offset get cartoucheCenter => Offset(cx, b.top + aH * .95);
  Size get cartoucheSize => Size(b.width * .46, aH * .42);
  double get crownR => w * .085;

  /// حدود منطقة النصّ عمودياً.
  double get textTop => math.max(ts(textInset), cartoucheCenter.dy + cartoucheSize.height / 2 + 6);
  double get textBottom => math.min(bs(textInset), b.bottom - crownR - 6);
}

class MedallionPainter extends CustomPainter {
  MedallionPainter(
      {required this.colors, required this.title, required this.titleFont, required this.page});
  final PageColors colors;
  final String title, titleFont;
  final int page;

  bool get _dark => colors == PageColors.dark;

  @override
  void paint(Canvas canvas, Size size) {
    final m = Medallion(size);
    final p = _dark ? OualataPalette.dark : OualataPalette.light;
    final bw = m.bandW;
    Paint line(Color c, double w) => Paint()
      ..color = c
      ..style = PaintingStyle.stroke
      ..strokeWidth = w;

    // الجدار الطيني ونقوشه الجصّية
    paintWall(canvas, Offset.zero & size, p);
    final lr = size.width * .1;
    for (final o in [
      Offset(size.width * .1, size.height * .085),
      Offset(size.width * .9, size.height * .085),
      Offset(size.width * .1, size.height * .915),
      Offset(size.width * .9, size.height * .915),
    ]) {
      paintLaceDiamond(canvas, o, lr, p.lime, p.wall);
    }
    for (var i = 0; i < 5; i++) {
      final y = size.height * (.3 + i * .1);
      paintStamp(canvas, Offset(size.width * .035, y), 6, p.lime, p.wall);
      paintStamp(canvas, Offset(size.width * .965, y), 6, p.lime, p.wall);
    }

    // الإطار الجصّي الأبيض كإطار باب ولاتيّ
    final s0 = m.shape(0);
    canvas.drawShadow(s0, const Color(0xFF280A00), 6, false);
    canvas.drawPath(s0, Paint()..color = p.lime);
    canvas.drawPath(s0, line(p.ink, 2));
    canvas.drawPath(m.shape(bw * .12), line(p.ink, .8));
    canvas.drawPath(m.shape(bw * .72), line(p.ink, .8));
    // أختام بنّية على الإطار تتخلّلها نقاط
    final metric = m.shape(bw * .42).computeMetrics().first;
    final n = (metric.length / (bw * .62)).round();
    for (var k = 0; k < n; k++) {
      final pos = metric.getTangentForOffset(k * metric.length / n)!.position;
      if ((pos.dx - m.cx).abs() < m.crownR * 1.2) continue; // تحت الدائرتين
      k.isEven
          ? paintStamp(canvas, pos, bw * .19, p.ink, p.lime)
          : canvas.drawCircle(pos, bw * .06, Paint()..color = p.red);
    }

    // اللوحة الورقية بخطوط الألوان الأربعة
    canvas.drawPath(m.shape(m.panelInset), Paint()..color = colors.paper);
    for (final (dd, cc, ww) in [
      (bw * .86, p.ink, 1.4),
      (bw * .92, p.yellow, 2.2),
      (bw * .98, p.red, 2.2),
      (bw * 1.04, p.green, 2.2),
      (bw * 1.10, p.blue, 2.2),
      (bw * 1.16, p.ink, 1.4),
    ]) {
      canvas.drawPath(m.shape(dd), line(cc, ww));
    }
    canvas.drawPath(m.shape(bw * 1.3), line(p.wall.withValues(alpha: .45), .8));

    // الدائرتان الملوّنتان على الرأسين، والسفلى تحمل رقم الصفحة
    paintColorMedallion(canvas, Offset(m.cx, m.b.top + 4), m.crownR, p);
    paintColorMedallion(canvas, Offset(m.cx, m.b.bottom - 4), m.crownR, p, label: _ar(page), font: Brand.ui);

    // خرطوشة اسم السورة بين ختمين
    final c = m.cartoucheCenter, cs = m.cartoucheSize;
    for (final dir in [-1.0, 1.0]) {
      paintStamp(canvas, Offset(c.dx + dir * (cs.width / 2 + cs.height * .55), c.dy), cs.height * .32, p.ink, p.lime);
    }
    RRect rr(double d) => RRect.fromRectAndRadius(
        Rect.fromCenter(center: c, width: cs.width - 2 * d, height: cs.height - 2 * d),
        Radius.circular(cs.height / 2 - d));
    canvas.drawRRect(rr(0), Paint()..color = p.lime);
    canvas.drawRRect(rr(0), line(p.ink, 1.6));
    canvas.drawRRect(rr(3), line(p.red, 1.3));
    canvas.drawRRect(rr(5), line(p.yellow, 1.3));
    final tp = TextPainter(
      text: TextSpan(
          text: title,
          style: TextStyle(fontFamily: titleFont, fontSize: cs.height * .5, height: 1.15, color: p.ink)),
      textDirection: TextDirection.rtl,
    )..layout(maxWidth: cs.width - cs.height);
    tp.paint(canvas, c - Offset(tp.width / 2, tp.height / 2));
    tp.dispose();
  }

  static String _ar(int n) => n.toString().split('').map((d) => '٠١٢٣٤٥٦٧٨٩'[int.parse(d)]).join();

  @override
  bool shouldRepaint(MedallionPainter old) => old.colors != colors || old.title != title || old.page != page;
}
