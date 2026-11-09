import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'theme.dart';

/// زخارف صفحات المصحف، مرسومة بالكود (تتكيّف مع حجم الشاشة والوضع الليلي).
///
/// - كل صفحة: إطار ذهبي مزدوج بينهما شريط فيه سلسلة معيّنات، وفي كل زاوية نجمة ثمانية.
/// - صفحتا الفاتحة وأول البقرة (١ و٢): إطار عريض أخضر مذهّب كما في المصاحف المطبوعة،
///   وفي وسطه لوحة النصّ بقوسين مفصّصين أعلاها وأسفلها، ووردات في الزوايا.
class PageFrame extends StatelessWidget {
  const PageFrame({super.key, required this.colors, required this.ornate, required this.child});
  final PageColors colors;
  final bool ornate;
  final Widget child;

  /// المسافة بين حافة الصفحة والنصّ.
  static EdgeInsets inset(bool ornate) =>
      ornate ? const EdgeInsets.fromLTRB(60, 84, 60, 80) : const EdgeInsets.fromLTRB(26, 24, 26, 22);

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _FramePainter(colors, ornate, Theme.of(context).brightness == Brightness.dark),
      child: Padding(padding: inset(ornate), child: child),
    );
  }
}

class _FramePainter extends CustomPainter {
  _FramePainter(this.c, this.ornate, this.dark);
  final PageColors c;
  final bool ornate;
  final bool dark;

  Color get gold => c.frame;
  Color get band => ornate ? (dark ? const Color(0xFF0E3B39) : Brand.green) : gold.withValues(alpha: .10);

  @override
  void paint(Canvas canvas, Size size) {
    final outer = (Offset.zero & size).deflate(ornate ? 8 : 7);
    final w = ornate ? 26.0 : 11.0; // عرض الشريط الزخرفي
    final inner = outer.deflate(w);

    final line = Paint()
      ..color = gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = ornate ? 2.0 : 1.4;
    final thin = Paint()
      ..color = gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = .9;

    // الشريط
    final bandPath = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(outer)
      ..addRect(inner);
    canvas.drawPath(bandPath, Paint()..color = band);
    canvas.drawRect(outer, line);
    canvas.drawRect(inner, line);
    canvas.drawRect(outer.deflate(3), thin);
    canvas.drawRect(inner.inflate(3), thin);
    if (!ornate) canvas.drawRect(inner.deflate(4), thin..color = gold.withValues(alpha: .55));

    // سلسلة معيّنات (وفي الإطار المزخرف: معيّن تتوسطه نقطة، ووردة صغيرة بين كل معيّنين)
    _chain(canvas, outer, w);

    // الزوايا: مربع فيه نجمة ثمانية
    for (final p in [outer.topLeft, outer.topRight, outer.bottomLeft, outer.bottomRight]) {
      final cx = p.dx + (p.dx == outer.left ? w / 2 : -w / 2);
      final cy = p.dy + (p.dy == outer.top ? w / 2 : -w / 2);
      final sq = Rect.fromCenter(center: Offset(cx, cy), width: w, height: w);
      canvas.drawRect(sq, Paint()..color = ornate ? gold : (dark ? const Color(0xFF1B2826) : c.paper));
      canvas.drawRect(sq, line);
      _star(canvas, Offset(cx, cy), w * .36, ornate ? band : gold, fill: ornate);
    }

    if (ornate) _medallion(canvas, inner.deflate(14));
  }

  void _chain(Canvas canvas, Rect outer, double w) {
    final step = ornate ? 30.0 : 18.0;
    final r = ornate ? w * .30 : w * .26;
    final stroke = Paint()
      ..color = gold
      ..style = PaintingStyle.stroke
      ..strokeWidth = ornate ? 1.4 : 1.0;
    final fill = Paint()..color = gold;

    void along(Offset a, Offset b) {
      final len = (b - a).distance;
      final n = (len / step).floor();
      if (n <= 0) return;
      final gap = len / n;
      final dir = (b - a) / len;
      for (var i = 0; i < n; i++) {
        final p = a + dir * (gap * (i + .5));
        final d = Path()
          ..moveTo(p.dx, p.dy - r)
          ..lineTo(p.dx + r, p.dy)
          ..lineTo(p.dx, p.dy + r)
          ..lineTo(p.dx - r, p.dy)
          ..close();
        canvas.drawPath(d, stroke);
        if (ornate) {
          canvas.drawCircle(p, 2.2, fill);
          final q = a + dir * (gap * (i + 1));
          if (i < n - 1) _rosette(canvas, q, 4.2, gold, petals: 6);
        }
      }
    }

    final h = w / 2;
    along(Offset(outer.left + w, outer.top + h), Offset(outer.right - w, outer.top + h));
    along(Offset(outer.left + w, outer.bottom - h), Offset(outer.right - w, outer.bottom - h));
    along(Offset(outer.left + h, outer.top + w), Offset(outer.left + h, outer.bottom - w));
    along(Offset(outer.right - h, outer.top + w), Offset(outer.right - h, outer.bottom - w));
  }

  /// لوحة النصّ في الصفحتين الأوليين: مستطيل بقوس مفصّص أعلاه وأسفله، ووردات في زواياه.
  void _medallion(Canvas canvas, Rect r) {
    final archW = r.width * .44;
    final archH = 26.0;
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
          ..color = gold
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.8);
    // خطّ داخلي رفيع يتبع اللوحة
    canvas.save();
    canvas.translate(cx, r.center.dy);
    canvas.scale((r.width - 12) / r.width, (r.height - 12) / r.height);
    canvas.translate(-cx, -r.center.dy);
    canvas.drawPath(
        p,
        Paint()
          ..color = gold.withValues(alpha: .6)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.0);
    canvas.restore();

    for (final o in [Offset(r.left, top), Offset(r.right, top), Offset(r.left, bottom), Offset(r.right, bottom)]) {
      _rosette(canvas, o, 11, gold, petals: 8);
      canvas.drawCircle(o, 3.2, Paint()..color = band);
    }
    // ورود صغيرة على منتصف الجانبين
    for (final o in [Offset(r.left, r.center.dy), Offset(r.right, r.center.dy)]) {
      _rosette(canvas, o, 8, gold, petals: 8);
    }
    // تاج القوسين
    _rosette(canvas, Offset(cx, r.top - 2), 9, gold, petals: 8);
    _rosette(canvas, Offset(cx, r.bottom + 2), 9, gold, petals: 8);
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

  void _rosette(Canvas canvas, Offset o, double r, Color color, {int petals = 8}) {
    final pr = r * .42;
    final paint = Paint()..color = color;
    for (var i = 0; i < petals; i++) {
      final a = i * 2 * math.pi / petals;
      canvas.drawCircle(o + Offset(math.cos(a), math.sin(a)) * (r - pr), pr, paint);
    }
    canvas.drawCircle(o, r * .38, Paint()..color = c.paper);
    canvas.drawCircle(o, r * .2, paint);
  }

  void _star(Canvas canvas, Offset o, double r, Color color, {bool fill = false}) {
    final paint = Paint()
      ..color = color
      ..style = fill ? PaintingStyle.fill : PaintingStyle.stroke
      ..strokeWidth = 1.1;
    for (final rot in [0.0, math.pi / 4]) {
      final path = Path();
      for (var i = 0; i < 4; i++) {
        final a = rot + i * math.pi / 2;
        final pt = o + Offset(math.cos(a), math.sin(a)) * r;
        i == 0 ? path.moveTo(pt.dx, pt.dy) : path.lineTo(pt.dx, pt.dy);
      }
      path.close();
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _FramePainter old) => old.c != c || old.ornate != ornate || old.dark != dark;
}
