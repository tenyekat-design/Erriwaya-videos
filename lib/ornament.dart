import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'data.dart';
import 'oualata.dart';
import 'theme.dart';

/// زخارف صفحات المصحف على طراز زخارف ولاتة (موريتانيا)، مرسومة بالكود.
///
/// - كل صفحة: شريط بلون الطين الأحمر يجري فيه خطّ موجيّ أبيض كإطارات أبواب ولاتة،
///   وفي كل زاوية مربع أبيض فيه صليب ولاتيّ بنّي.
/// - صفحتا الفاتحة وأول البقرة (١ و٢): جدار طينيّ عريض تتوالى عليه معيّنات بيضاء مزخرفة
///   (كالنقوش الجصّية على جدران ولاتة)، وفي زواياه دوائر ملوّنة كالتي تحيط بأبوابها،
///   ثم إطار أبيض فيه خطّ موجيّ بنّي، ثم لوحة النصّ بخطّين رفيعين ونجمتين.
/// - رقم الصفحة على الإطار السفلي.
class PageFrame extends StatelessWidget {
  const PageFrame({super.key, required this.colors, required this.ornate, required this.page, required this.child});
  final PageColors colors;
  final bool ornate;
  final int page;
  final Widget child;

  /// المسافة بين حافة الصفحة والنصّ.
  static EdgeInsets inset(bool ornate) =>
      ornate ? const EdgeInsets.fromLTRB(58, 70, 58, 70) : const EdgeInsets.fromLTRB(29, 29, 29, 34);

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final o = dark ? Oualata.dark : Oualata.light;
    return CustomPaint(
      painter: _FramePainter(colors, ornate, dark, page),
      child: Stack(children: [
        Positioned.fill(child: Padding(padding: inset(ornate), child: child)),
        // رقم الصفحة على الإطار السفلي، فلا يزاحم النصّ (في الصفحات العادية يرسمه الإطار)
        if (ornate) Positioned(
          left: 0,
          right: 0,
          bottom: ornate ? 44 : 4,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 1),
              decoration: BoxDecoration(
                color: o.lime,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: o.ink, width: .8),
              ),
              child: Text(ar(page), style: TextStyle(fontSize: 12, height: 1.35, color: o.ink)),
            ),
          ),
        ),
      ]),
    );
  }
}

/// ألوان ولاتة.
class Oualata {
  const Oualata(this.wall, this.wallLight, this.lime, this.ink);
  final Color wall; // الطين الأحمر (أطراف الجدار)
  final Color wallLight; // الطين في وسط الجدار (تدرّج دافئ)
  final Color lime; // الجصّ الأبيض
  final Color ink; // البنّي الداكن للخطوط على الأبيض
  static const light = Oualata(Color(0xFFA9512F), Color(0xFFC67250), Color(0xFFFBF4E6), Color(0xFF5E2617));
  static const dark = Oualata(Color(0xFF5E2B1C), Color(0xFF7B3D28), Color(0xFFE3D5BC), Color(0xFF4A1C10));
  // ألوان الدوائر، متناسقة مع الطين ومع أخضر التطبيق: زعفراني، أحمر طيني، أخضر مزرق، نيلي
  static const yellow = Color(0xFFE7B743);
  static const red = Color(0xFFC24A32);
  static const green = Color(0xFF1E7B73);
  static const blue = Color(0xFF2C4F8F);
}

class _FramePainter extends CustomPainter {
  _FramePainter(this.c, this.ornate, this.dark, this.page);
  final int page;
  final PageColors c;
  final bool ornate;
  final bool dark;

  Oualata get o => dark ? Oualata.dark : Oualata.light;

  @override
  void paint(Canvas canvas, Size size) {
    ornate ? _ornate(canvas, size) : _regular(canvas, size);
  }

  // ───────── الصفحات العادية ─────────
  void _regular(Canvas canvas, Size size) {
    final p = dark ? OualataPalette.dark : OualataPalette.light;
    final full = Offset.zero & size;
    const o = 16.0; // عرض جدار الطين
    // جدار الطين حول الصفحة
    canvas.save();
    canvas.clipPath(Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(full)
      ..addRect(full.deflate(o)));
    paintWall(canvas, full, p);
    canvas.restore();
    // أسنان جصّية بيضاء على حافة الجدار، ونقاط بيضاء على طرفه الخارجي
    final ti = full.deflate(o - 1.5);
    paintTeeth(canvas, ti.topLeft, ti.topRight, const Offset(0, -1), 5, p.lime);
    paintTeeth(canvas, ti.bottomLeft, ti.bottomRight, const Offset(0, 1), 5, p.lime);
    paintTeeth(canvas, ti.topLeft, ti.bottomLeft, const Offset(-1, 0), 5, p.lime);
    paintTeeth(canvas, ti.topRight, ti.bottomRight, const Offset(1, 0), 5, p.lime);
    final dot = Paint()..color = p.lime;
    for (var x = o + 12; x < size.width - o; x += 9) {
      canvas.drawCircle(Offset(x, 4.5), 1.2, dot);
      canvas.drawCircle(Offset(x, size.height - 4.5), 1.2, dot);
    }
    for (var y = o + 12; y < size.height - o; y += 9) {
      canvas.drawCircle(Offset(4.5, y), 1.2, dot);
      canvas.drawCircle(Offset(size.width - 4.5, y), 1.2, dot);
    }
    // خطوط الألوان الأربعة حول النصّ
    for (final (d, col, w) in [
      (o + 1.0, p.ink, 1.2),
      (o + 3.0, p.yellow, 1.8),
      (o + 5.0, p.red, 1.8),
      (o + 7.0, p.green, 1.8),
      (o + 9.0, p.blue, 1.8),
      (o + 10.7, p.ink, .9),
    ]) {
      canvas.drawRRect(
          RRect.fromRectAndRadius(full.deflate(d), const Radius.circular(5)),
          Paint()
            ..color = col
            ..style = PaintingStyle.stroke
            ..strokeWidth = w);
    }
    // دوائر ملوّنة في الزوايا، ومعيّن جصّي أعلى الصفحة، ورقم الصفحة في دائرة أسفلها
    for (final q in [Offset(o, o), Offset(size.width - o, o), Offset(o, size.height - o), Offset(size.width - o, size.height - o)]) {
      paintColorMedallion(canvas, q, 15, p);
    }
    paintLaceDiamond(canvas, Offset(size.width / 2, o / 2 + 1), 9, p.lime, p.wall);
    paintColorMedallion(canvas, Offset(size.width / 2, size.height - o + 1), 17, p,
        label: ar(page), font: Brand.ui);
  }

  // ───────── الفاتحة وأول البقرة ─────────
  void _ornate(Canvas canvas, Size size) {
    final outer = (Offset.zero & size).deflate(5);
    const wallW = 30.0, limeW = 11.0;
    final mid = outer.deflate(wallW);
    final inner = mid.deflate(limeW);

    const ro = 30.0, rm = 16.0, ri = 10.0;
    // الجدار الطيني
    _band(canvas, outer, mid, o.wall, ro: ro, ri: rm, wall: true);
    // معيّنات بيضاء على الجدار
    _diamondsAlong(canvas, outer, wallW);

    // الإطار الأبيض بخطه الموجيّ البنّي (كإطار الباب)
    _band(canvas, mid, inner, o.lime, ro: rm, ri: ri);
    final brown = Paint()
      ..color = o.ink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.3;
    canvas.drawRRect(RRect.fromRectAndRadius(mid, const Radius.circular(rm)), brown);
    canvas.drawRRect(RRect.fromRectAndRadius(inner, const Radius.circular(ri)), brown);
    _waveAround(canvas, mid.deflate(limeW / 2), rm + 4, 2.6, 13,
        brown..strokeCap = StrokeCap.round, dots: o.ink);

    // دوائر ملوّنة في زوايا الجدار، داخل حدود الشاشة
    for (final p in _corners(outer, wallW, inset: 4)) {
      _medallion(canvas, p, wallW * .64);
    }

    // لوحة النصّ
    _panel(canvas, inner.deflate(7));
  }

  // ───────── أدوات الرسم ─────────

  List<Offset> _corners(Rect r, double w, {double inset = 0}) {
    final d = w / 2 + inset;
    return [
      Offset(r.left + d, r.top + d),
      Offset(r.right - d, r.top + d),
      Offset(r.left + d, r.bottom - d),
      Offset(r.right - d, r.bottom - d),
    ];
  }

  /// شريط بين مستطيلين مستديري الزوايا؛ الجدار يتدرّج من وسطه الأفتح إلى أطرافه.
  void _band(Canvas canvas, Rect outer, Rect inner, Color color, {double ro = 0, double ri = 0, bool wall = false}) {
    final paint = Paint()..color = color;
    if (wall) {
      paint.shader = RadialGradient(colors: [o.wallLight, o.wall], radius: .75).createShader(outer);
    }
    canvas.drawPath(
        Path()
          ..fillType = PathFillType.evenOdd
          ..addRRect(RRect.fromRectAndRadius(outer, Radius.circular(ro)))
          ..addRRect(RRect.fromRectAndRadius(inner, Radius.circular(ri))),
        paint);
  }

  /// خطّ موجيّ يجري على الجوانب الأربعة لمستطيل (r هو مسار منتصف الشريط)، مع نقاط في بطون الموج.
  void _waveAround(Canvas canvas, Rect r, double cornerGap, double amp, double period, Paint p, {Color? dots}) {
    final dot = Paint()..color = dots ?? p.color;
    void side(Offset a, Offset b) {
      final len = (b - a).distance;
      final n = math.max(1, (len / period).round());
      final per = len / n;
      final dir = (b - a) / len;
      final nor = Offset(-dir.dy, dir.dx);
      final path = Path()..moveTo(a.dx, a.dy);
      const steps = 10;
      for (var i = 0; i < n * steps; i++) {
        final t = (i + 1) / steps * per;
        final y = amp * math.sin(2 * math.pi * t / per);
        final q = a + dir * t + nor * y;
        path.lineTo(q.dx, q.dy);
      }
      canvas.drawPath(path, p);
      if (dots != null) {
        for (var k = 0; k < n; k++) {
          final t1 = per * (k + .25), t2 = per * (k + .75);
          canvas.drawCircle(a + dir * t1 - nor * (amp + 1.2), .9, dot);
          canvas.drawCircle(a + dir * t2 + nor * (amp + 1.2), .9, dot);
        }
      }
    }

    final g = cornerGap; // نترك الزوايا المقوّسة للأقراص والدوائر
    side(Offset(r.left + g, r.top), Offset(r.right - g, r.top));
    side(Offset(r.left + g, r.bottom), Offset(r.right - g, r.bottom));
    side(Offset(r.left, r.top + g), Offset(r.left, r.bottom - g));
    side(Offset(r.right, r.top + g), Offset(r.right, r.bottom - g));
  }

  /// معيّنات بيضاء مزخرفة تتوالى على الجدار، بعيداً عن الزوايا.
  void _diamondsAlong(Canvas canvas, Rect outer, double w) {
    final h = w * .40;
    void side(Offset a, Offset b, bool vertical) {
      final len = (b - a).distance;
      final n = math.max(1, (len / (h * 4.2)).floor());
      final gap = len / n;
      final dir = (b - a) / len;
      for (var i = 0; i < n; i++) {
        final p = a + dir * (gap * (i + .5));
        _arabesque(canvas, p, h, o.lime, o.wall, sideways: vertical);
      }
    }

    final m = w / 2, g = w * 1.45;
    side(Offset(outer.left + g, outer.top + m), Offset(outer.right - g, outer.top + m), false);
    side(Offset(outer.left + g, outer.bottom - m), Offset(outer.right - g, outer.bottom - m), false);
    side(Offset(outer.left + m, outer.top + g), Offset(outer.left + m, outer.bottom - g), true);
    side(Offset(outer.right - m, outer.top + g), Offset(outer.right - m, outer.bottom - g), true);
  }

  /// معيّن ولاتيّ: حوافّ مفصّصة، رأسان بكرتين، ووردة في الوسط تحيط بها لفائف.
  /// fg لون المعيّن، bg لون الخطوط المقطوعة فيه. sideways: يُرسم بعرضه على الجوانب العمودية.
  void _arabesque(Canvas canvas, Offset o0, double h, Color fg, Color bg, {bool sideways = false}) {
    canvas.save();
    canvas.translate(o0.dx, o0.dy);
    if (sideways) canvas.rotate(math.pi / 2);
    final w = h * 1.25; // نصف العرض (المعيّن أعرض من ارتفاعه كما في الجدار)
    final fill = Paint()..color = fg;

    // الحدّ المفصّص
    final pts = [Offset(0, -h), Offset(w, 0), Offset(0, h), Offset(-w, 0)];
    final path = Path()..moveTo(pts[0].dx, pts[0].dy);
    for (var s = 0; s < 4; s++) {
      final a = pts[s], b = pts[(s + 1) % 4];
      const lobes = 3;
      for (var k = 0; k < lobes; k++) {
        final q = Offset.lerp(a, b, (k + 1) / lobes)!;
        path.arcToPoint(q, radius: Radius.circular((b - a).distance / lobes / 1.7), clockwise: true);
      }
    }
    path.close();
    canvas.drawPath(path, fill);
    // كرتان على الرأسين، وذيلان صغيران على الجانبين
    canvas.drawCircle(Offset(0, -h - h * .14), h * .14, fill);
    canvas.drawCircle(Offset(0, h + h * .14), h * .14, fill);
    canvas.drawCircle(Offset(-w - h * .1, 0), h * .1, fill);
    canvas.drawCircle(Offset(w + h * .1, 0), h * .1, fill);

    final cut = Paint()
      ..color = bg
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(.9, h * .07)
      ..strokeCap = StrokeCap.round;
    // معيّن داخلي
    final ins = Path()
      ..moveTo(0, -h * .7)
      ..lineTo(w * .7, 0)
      ..lineTo(0, h * .7)
      ..lineTo(-w * .7, 0)
      ..close();
    canvas.drawPath(ins, cut);
    // وردة الوسط: ثماني بتلات مقطوعة ونقطة
    for (var i = 0; i < 8; i++) {
      final a = i * math.pi / 4;
      canvas.drawCircle(Offset(math.cos(a), math.sin(a)) * h * .2, h * .075, Paint()..color = bg);
    }
    canvas.drawCircle(Offset.zero, h * .08, Paint()..color = bg);
    // لفائف على المحورين بين الوردة والرؤوس
    for (final p in [Offset(0, -h * .47), Offset(0, h * .47), Offset(-w * .47, 0), Offset(w * .47, 0)]) {
      _curl(canvas, p, h * .13, cut, p.dx < 0 || p.dy < 0);
    }
    canvas.restore();
  }

  /// لفيفة حلزونية صغيرة.
  void _curl(Canvas canvas, Offset o0, double r, Paint p, bool flip) {
    final path = Path();
    const turns = 1.6;
    const steps = 28;
    for (var i = 0; i <= steps; i++) {
      final t = i / steps;
      final a = (flip ? -1 : 1) * t * turns * 2 * math.pi;
      final rr = r * (1 - .75 * t);
      final q = o0 + Offset(math.cos(a), math.sin(a)) * rr;
      i == 0 ? path.moveTo(q.dx, q.dy) : path.lineTo(q.dx, q.dy);
    }
    canvas.drawPath(path, p);
  }

  /// دائرة ملوّنة كالتي على جانبي أبواب ولاتة: معيّن مستدير الزوايا، حلقات بيضاء وصفراء،
  /// شريط مثلثات حمراء وخضراء وزرقاء، ثم وردة رباعية صفراء ومربع أزرق في القلب.
  void _medallion(Canvas canvas, Offset o0, double r) {
    canvas.save();
    canvas.translate(o0.dx, o0.dy);
    canvas.rotate(math.pi / 4);
    RRect sq(double s) => RRect.fromRectAndRadius(Rect.fromCenter(center: Offset.zero, width: 2 * s, height: 2 * s),
        Radius.circular(s * .42));
    final s = r * .72;
    canvas.drawRRect(sq(s), Paint()..color = o.ink);
    canvas.drawRRect(sq(s * .9), Paint()..color = o.lime);
    canvas.drawRRect(sq(s * .82), Paint()..color = Oualata.yellow);
    // شريط المثلثات
    final outerS = s * .74, innerS = s * .5;
    canvas.drawRRect(sq(outerS), Paint()..color = o.lime);
    const colors = [Oualata.red, Oualata.green, Oualata.blue];
    var ci = 0;
    for (var side = 0; side < 4; side++) {
      canvas.save();
      canvas.rotate(side * math.pi / 2);
      const n = 4;
      for (var k = 0; k < n; k++) {
        final x0 = -outerS * .62 + k * (outerS * 1.24 / n);
        final x1 = x0 + outerS * 1.24 / n;
        final tri = Path()
          ..moveTo(x0, -outerS * .96)
          ..lineTo(x1, -outerS * .96)
          ..lineTo((x0 + x1) / 2, -innerS * 1.02)
          ..close();
        canvas.drawPath(tri, Paint()..color = colors[ci++ % 3]);
      }
      canvas.restore();
    }
    canvas.drawRRect(sq(innerS), Paint()..color = o.lime);
    // وردة رباعية
    final d = innerS * .42;
    for (final p in [Offset(d, 0), Offset(-d, 0), Offset(0, d), Offset(0, -d)]) {
      canvas.drawCircle(p, innerS * .34, Paint()..color = Oualata.red);
      canvas.drawCircle(p, innerS * .26, Paint()..color = Oualata.yellow);
    }
    canvas.restore();
    // مربع أزرق في القلب (قائم كما في الباب)
    final b = r * .2;
    canvas.drawRect(Rect.fromCenter(center: o0, width: 2 * b, height: 2 * b), Paint()..color = o.lime);
    canvas.drawRect(Rect.fromCenter(center: o0, width: 1.5 * b, height: 1.5 * b), Paint()..color = Oualata.blue);
  }

  /// صليب ولاتيّ صغير: ذراعان متقاطعتان بأطراف عرضية، ومعيّن في الوسط، ونقاط بين الأذرع.
  void _cross(Canvas canvas, Offset o0, double s, Color ink, Color ground) {
    final p = Paint()..color = ink;
    final t = s * .26;
    canvas.drawRect(Rect.fromCenter(center: o0, width: 2 * s, height: t), p);
    canvas.drawRect(Rect.fromCenter(center: o0, width: t, height: 2 * s), p);
    for (final e in [Offset(s, 0), Offset(-s, 0)]) {
      canvas.drawRect(Rect.fromCenter(center: o0 + e, width: t, height: s * .8), p);
    }
    for (final e in [Offset(0, s), Offset(0, -s)]) {
      canvas.drawRect(Rect.fromCenter(center: o0 + e, width: s * .8, height: t), p);
    }
    final dia = Path()
      ..moveTo(o0.dx, o0.dy - t * .9)
      ..lineTo(o0.dx + t * .9, o0.dy)
      ..lineTo(o0.dx, o0.dy + t * .9)
      ..lineTo(o0.dx - t * .9, o0.dy)
      ..close();
    canvas.drawPath(dia, Paint()..color = ground);
    for (final e in [Offset(1, 1), Offset(-1, 1), Offset(1, -1), Offset(-1, -1)]) {
      canvas.drawCircle(o0 + e * (s * .55), t * .45, p);
    }
  }

  /// لوحة النصّ في الصفحتين الأوليين: مستطيل مستدير الزوايا بخطّين رفيعين،
  /// ونجمة ثمانية في منتصف الضلع الأعلى (ورقم الصفحة على الأسفل).
  void _panel(Canvas canvas, Rect r) {
    final rr = RRect.fromRectAndRadius(r, const Radius.circular(12));
    canvas.drawRRect(rr, Paint()..color = c.paper);
    canvas.drawRRect(
        rr,
        Paint()
          ..color = c.frame
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.4);
    canvas.drawRRect(
        rr.deflate(4),
        Paint()
          ..color = c.frame.withValues(alpha: .4)
          ..style = PaintingStyle.stroke
          ..strokeWidth = .7);
    for (final y in [r.top]) {
      final p = Offset(r.center.dx, y);
      canvas.drawCircle(p, 9, Paint()..color = c.paper);
      _star8(canvas, p, 8, c.frame);
      canvas.drawCircle(p, 2.4, Paint()..color = c.paper);
    }
  }

  void _star8(Canvas canvas, Offset o0, double r, Color color) {
    final path = Path();
    for (var i = 0; i < 16; i++) {
      final a = i * math.pi / 8 - math.pi / 2;
      final rr = i.isEven ? r : r * .6;
      final pt = o0 + Offset(math.cos(a), math.sin(a)) * rr;
      i == 0 ? path.moveTo(pt.dx, pt.dy) : path.lineTo(pt.dx, pt.dy);
    }
    canvas.drawPath(path..close(), Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _FramePainter old) => old.c != c || old.ornate != ornate || old.dark != dark || old.page != page;
}
