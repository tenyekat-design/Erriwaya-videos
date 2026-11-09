import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'theme.dart';

/// زخارف صفحات المصحف على طراز زخارف ولاتة (موريتانيا)، مرسومة بالكود.
///
/// - كل صفحة: شريط بلون الطين الأحمر يجري فيه خطّ موجيّ أبيض كإطارات أبواب ولاتة،
///   وفي كل زاوية مربع أبيض فيه صليب ولاتيّ بنّي.
/// - صفحتا الفاتحة وأول البقرة (١ و٢): جدار طينيّ عريض تتوالى عليه معيّنات بيضاء مزخرفة
///   (كالنقوش الجصّية على جدران ولاتة)، وفي زواياه دوائر ملوّنة كالتي تحيط بأبوابها،
///   ثم إطار أبيض فيه خطّ موجيّ بنّي، ثم لوحة النصّ بقوسين مفصّصين.
class PageFrame extends StatelessWidget {
  const PageFrame({super.key, required this.colors, required this.ornate, required this.child});
  final PageColors colors;
  final bool ornate;
  final Widget child;

  /// المسافة بين حافة الصفحة والنصّ.
  static EdgeInsets inset(bool ornate) =>
      ornate ? const EdgeInsets.fromLTRB(60, 86, 60, 82) : const EdgeInsets.fromLTRB(28, 26, 28, 22);

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _FramePainter(colors, ornate, Theme.of(context).brightness == Brightness.dark),
      child: Padding(padding: inset(ornate), child: child),
    );
  }
}

/// ألوان ولاتة.
class Oualata {
  const Oualata(this.wall, this.lime, this.ink);
  final Color wall; // الطين الأحمر
  final Color lime; // الجصّ الأبيض
  final Color ink; // البنّي الداكن للخطوط على الأبيض
  static const light = Oualata(Color(0xFFB4522F), Color(0xFFF7F0E2), Color(0xFF6E2A1C));
  static const dark = Oualata(Color(0xFF7A3524), Color(0xFFE6DAC3), Color(0xFF5A2316));
  static const yellow = Color(0xFFF2C230);
  static const red = Color(0xFFD2362B);
  static const green = Color(0xFF3E9A4A);
  static const blue = Color(0xFF1F5FB8);
}

class _FramePainter extends CustomPainter {
  _FramePainter(this.c, this.ornate, this.dark);
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
    final outer = (Offset.zero & size).deflate(6);
    const w = 14.0;
    final inner = outer.deflate(w);
    _band(canvas, outer, inner, o.wall);

    // خط موجيّ أبيض في منتصف الشريط
    final wave = Paint()
      ..color = o.lime
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    _waveAround(canvas, outer.deflate(w / 2), w, 3.2, 15, wave, dots: o.lime);

    // خطّ بنّي رفيع داخل الإطار
    canvas.drawRect(
        inner.deflate(3),
        Paint()
          ..color = c.frame.withValues(alpha: .7)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1);

    // الزوايا: مربع أبيض فيه صليب ولاتيّ
    for (final p in _corners(outer, w)) {
      final sq = Rect.fromCenter(center: p, width: w + 4, height: w + 4);
      canvas.drawRect(sq, Paint()..color = o.lime);
      canvas.drawRect(
          sq,
          Paint()
            ..color = o.ink
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1);
      _cross(canvas, p, (w + 4) * .42, o.ink, o.lime);
    }
  }

  // ───────── الفاتحة وأول البقرة ─────────
  void _ornate(Canvas canvas, Size size) {
    final outer = (Offset.zero & size).deflate(5);
    const wallW = 34.0, limeW = 12.0;
    final mid = outer.deflate(wallW);
    final inner = mid.deflate(limeW);

    // الجدار الطيني
    _band(canvas, outer, mid, o.wall);
    // معيّنات بيضاء على الجدار
    _diamondsAlong(canvas, outer, wallW);

    // الإطار الأبيض بخطه الموجيّ البنّي (كإطار الباب)
    _band(canvas, mid, inner, o.lime);
    final brown = Paint()
      ..color = o.ink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.3;
    canvas.drawRect(mid, brown);
    canvas.drawRect(inner, brown);
    _waveAround(canvas, mid.deflate(limeW / 2), limeW, 2.6, 13,
        brown..strokeCap = StrokeCap.round, dots: o.ink);

    // دوائر ملوّنة في زوايا الجدار
    for (final p in _corners(outer, wallW)) {
      _medallion(canvas, p, wallW * .82);
    }

    // لوحة النصّ
    _panel(canvas, inner.deflate(12));
  }

  // ───────── أدوات الرسم ─────────

  List<Offset> _corners(Rect r, double w) => [
        Offset(r.left + w / 2, r.top + w / 2),
        Offset(r.right - w / 2, r.top + w / 2),
        Offset(r.left + w / 2, r.bottom - w / 2),
        Offset(r.right - w / 2, r.bottom - w / 2),
      ];

  void _band(Canvas canvas, Rect outer, Rect inner, Color color) {
    canvas.drawPath(
        Path()
          ..fillType = PathFillType.evenOdd
          ..addRect(outer)
          ..addRect(inner),
        Paint()..color = color);
  }

  /// خطّ موجيّ يجري على الجوانب الأربعة لمستطيل (r هو مسار منتصف الشريط)، مع نقاط في بطون الموج.
  void _waveAround(Canvas canvas, Rect r, double w, double amp, double period, Paint p, {Color? dots}) {
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

    final g = w * .55; // نترك الزوايا للمربعات/الدوائر
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

    final m = w / 2, g = w * 1.25;
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

  /// لوحة النصّ في الصفحتين الأوليين: قوس مفصّص أعلاها وأسفلها، معيّن ولاتيّ على تاج كل قوس،
  /// وصلبان صغيرة في الزوايا.
  void _panel(Canvas canvas, Rect r) {
    final archW = r.width * .44;
    const archH = 24.0;
    final top = r.top + archH, bottom = r.bottom - archH;
    final cx = r.center.dx;
    final p = Path()
      ..moveTo(r.left, top)
      ..lineTo(cx - archW / 2, top);
    _lobes(p, Offset(cx - archW / 2, top), Offset(cx + archW / 2, top), -archH);
    p
      ..lineTo(r.right, top)
      ..lineTo(r.right, bottom)
      ..lineTo(cx + archW / 2, bottom);
    _lobes(p, Offset(cx + archW / 2, bottom), Offset(cx - archW / 2, bottom), archH);
    p
      ..lineTo(r.left, bottom)
      ..close();
    canvas.drawPath(p, Paint()..color = c.paper);
    canvas.drawPath(
        p,
        Paint()
          ..color = c.frame
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.6);

    _arabesque(canvas, Offset(cx, r.top + 6), 9, c.frame, c.paper);
    _arabesque(canvas, Offset(cx, r.bottom - 6), 9, c.frame, c.paper);
    for (final q in [Offset(r.left, top), Offset(r.right, top), Offset(r.left, bottom), Offset(r.right, bottom)]) {
      canvas.drawCircle(q, 8, Paint()..color = c.paper);
      _cross(canvas, q, 6.5, c.frame, c.paper);
    }
  }

  /// قوس مفصّص من ثلاثة فصوص بين نقطتين (h سالبة = إلى الأعلى).
  void _lobes(Path p, Offset a, Offset b, double h) {
    final pts = [for (var i = 0; i <= 3; i++) Offset.lerp(a, b, i / 3)!];
    for (var i = 0; i < 3; i++) {
      final mid = Offset.lerp(pts[i], pts[i + 1], .5)!;
      final lift = i == 1 ? h : h * .62;
      p.quadraticBezierTo(mid.dx, mid.dy + lift * 2 - (pts[i].dy - a.dy), pts[i + 1].dx, pts[i + 1].dy);
    }
  }

  @override
  bool shouldRepaint(covariant _FramePainter old) => old.c != c || old.ornate != ornate || old.dark != dark;
}
