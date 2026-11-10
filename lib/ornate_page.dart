import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'illumination.dart';
import 'theme.dart';

/// هندسة لوحة الفاتحة وأول البقرة: إطار مذهّب بقوس علوي مفصّص يلتقي في رأس مدبّب،
/// وجانبين منتفخين قليلاً، وقوس سفلي مقابل، على أرضية لازوردية.
/// كل شكل داخلي هو الشكل نفسه مُزاحاً إلى الداخل بمقدار d.
class Medallion {
  Medallion(Size s)
      : w = s.width,
        h = s.height {
    b = Rect.fromLTRB(w * .07, h * .045, w * .93, h * .955);
    aH = b.height * .12;
    bul = b.width * .05;
    bandW = b.width * .075;
  }
  final double w, h;
  late final Rect b;
  late final double aH, bul, bandW;
  double get cx => b.center.dx;

  /// حافة اللوحة الورقية، وإزاحة منطقة النصّ.
  double get panelInset => bandW + 3;
  double get textInset => bandW + 12;

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
  Offset get cartoucheCenter => Offset(cx, b.top + aH * .98);
  Size get cartoucheSize => Size(b.width * .5, aH * .42);
  double get crownR => w * .075;

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

  @override
  void paint(Canvas canvas, Size size) {
    final m = Medallion(size);
    final bw = m.bandW;
    final full = Offset.zero & size;
    final gold = Illum.goldShader(m.b);
    Paint goldFill() => Paint()..shader = gold;

    // أرضية لازوردية بشبكة نجوم، وإطار ذهبي للصفحة، وزوايا مفصّصة
    paintLapisGround(canvas, full);
    canvas.drawRect(
        full.deflate(5),
        Paint()
          ..shader = Illum.goldShader(full)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.5);
    canvas.drawRect(
        full.deflate(9),
        Paint()
          ..color = Illum.gold
          ..style = PaintingStyle.stroke
          ..strokeWidth = .8);
    final cr = size.width * .19;
    paintCornerPiece(canvas, const Offset(10, 10), 1, 1, cr);
    paintCornerPiece(canvas, Offset(size.width - 10, 10), -1, 1, cr);
    paintCornerPiece(canvas, Offset(10, size.height - 10), 1, -1, cr);
    paintCornerPiece(canvas, Offset(size.width - 10, size.height - 10), -1, -1, cr);

    // أهداب ذهبية حول اللوحة
    final s0 = m.shape(0);
    paintFringe(canvas, s0, m.b.center, 9, 11);
    // الإطار: ذهب، ثم شريط لازوردي يجري فيه غصن مزهر، ثم ذهب وفيروز وذهب
    canvas.drawShadow(s0, Colors.black, 8, false);
    canvas.drawPath(s0, goldFill());
    canvas.drawPath(
        s0,
        Paint()
          ..color = Illum.goldDark
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1);
    canvas.drawPath(m.shape(3.5), Paint()..color = Illum.lapis);
    paintVine(canvas, m.shape(3.5 + (bw - 7) / 2), (bw - 7) * .28, 34, 1.3,
        const [Illum.crimson, Illum.turquoise, Illum.orange]);
    canvas.drawPath(m.shape(bw - 3.5), goldFill());
    canvas.drawPath(m.shape(bw), Paint()..color = Illum.turquoise);
    canvas.drawPath(m.shape(bw + 1.6), goldFill());
    canvas.drawPath(m.shape(m.panelInset), Paint()..color = colors.paper);
    canvas.drawPath(
        m.shape(bw + 7),
        Paint()
          ..color = Illum.gold.withValues(alpha: .6)
          ..style = PaintingStyle.stroke
          ..strokeWidth = .7);

    // شمستان على الرأسين، والسفلى تحمل رقم الصفحة
    paintShamsa(canvas, Offset(m.cx, m.b.top + 2), m.crownR, colors.paper);
    paintShamsa(canvas, Offset(m.cx, m.b.bottom - 2), m.crownR, colors.paper, label: _ar(page), font: Brand.ui);

    // خرطوشة اسم السورة
    final c = m.cartoucheCenter, cs = m.cartoucheSize;
    paintCartouche(canvas, c, cs.width, cs.height);
    final tp = TextPainter(
      text: TextSpan(
          text: title,
          style: TextStyle(fontFamily: titleFont, fontSize: cs.height * .52, height: 1.15, color: Illum.goldLight)),
      textDirection: TextDirection.rtl,
    )..layout(maxWidth: cs.width - cs.height);
    tp.paint(canvas, c - Offset(tp.width / 2, tp.height / 2));
    tp.dispose();
  }

  static String _ar(int n) => n.toString().split('').map((d) => '٠١٢٣٤٥٦٧٨٩'[int.parse(d)]).join();

  @override
  bool shouldRepaint(MedallionPainter old) => old.colors != colors || old.title != title || old.page != page;
}
