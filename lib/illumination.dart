import 'dart:math' as math;
import 'dart:ui' show Tangent;
import 'package:flutter/material.dart';

/// زخرفة المصحف: تذهيب على أرضية لازوردية، على طريقة المصاحف المذهّبة.
/// ذهب متدرّج لامع، وأغصان ذهبية تتفتّح فيها زهور حمراء وفيروزية، وأهداب ذهبية حول اللوحة،
/// وشمسات (نجوم ثمانية) وزوايا مفصّصة بسعفات (palmettes).
class Illum {
  static const lapis = Color(0xFF14336B);
  static const lapisDeep = Color(0xFF0A1C40);
  static const lapisLight = Color(0xFF22498C);
  static const gold = Color(0xFFD4AF37);
  static const goldLight = Color(0xFFF3DC8A);
  static const goldDark = Color(0xFF8C6418);
  static const turquoise = Color(0xFF1E9C9A);
  static const crimson = Color(0xFFB0263F);
  static const orange = Color(0xFFE58A2E);

  /// ذهب متدرّج كالورق المذهّب.
  static Shader goldShader(Rect r) => const LinearGradient(
        colors: [goldDark, goldLight, gold, goldLight, goldDark],
        stops: [0, .25, .5, .75, 1],
      ).createShader(r);
}

Paint _fill(Color c) => Paint()..color = c;
Paint _goldFill(Rect r) => Paint()..shader = Illum.goldShader(r);

Path star8(Offset c, double r1, double r2) {
  final p = Path();
  for (var i = 0; i < 16; i++) {
    final a = i * math.pi / 8 - math.pi / 2;
    final r = i.isEven ? r1 : r2;
    final pt = c + Offset(math.cos(a), math.sin(a)) * r;
    i == 0 ? p.moveTo(pt.dx, pt.dy) : p.lineTo(pt.dx, pt.dy);
  }
  return p..close();
}

/// زهرة سداسية البتلات بقلب ذهبي.
void paintFlower(Canvas canvas, Offset c, double r, Color col) {
  final f = _fill(col);
  for (var k = 0; k < 6; k++) {
    final a = k * math.pi / 3;
    canvas.save();
    canvas.translate(c.dx + math.cos(a) * r * .55, c.dy + math.sin(a) * r * .55);
    canvas.rotate(a);
    canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: r, height: r * .6), f);
    canvas.restore();
  }
  canvas.drawCircle(c, r * .32, _fill(Illum.goldLight));
}

Path _leafPath(double l, double w) => Path()
  ..moveTo(0, 0)
  ..cubicTo(l * .3, -w, l * .75, -w * .7, l, 0)
  ..cubicTo(l * .75, w * .7, l * .3, w, 0, 0);

void paintLeaf(Canvas canvas, Offset at, double angle, double l, double w, Paint paint) {
  canvas.save();
  canvas.translate(at.dx, at.dy);
  canvas.rotate(angle);
  canvas.drawPath(_leafPath(l, w), paint);
  canvas.restore();
}

void _curl(Canvas canvas, Offset c, double r, double a0, double dir, Paint paint) {
  final p = Path();
  for (var j = 0; j <= 24; j++) {
    final t = j / 24, an = a0 + dir * t * math.pi * 2.2, rr = r * (1 - .75 * t);
    final q = c + Offset(math.cos(an), math.sin(an)) * rr;
    j == 0 ? p.moveTo(q.dx, q.dy) : p.lineTo(q.dx, q.dy);
  }
  canvas.drawPath(p, paint);
}

/// غصن ذهبي متموّج يسير على طول المسار، تتفتّح على جانبيه زهور ملوّنة وأوراق ذهبية ولفائف.
void paintVine(Canvas canvas, Path path, double amp, double period, double lw, List<Color> flowers) {
  final stem = Paint()
    ..color = Illum.gold
    ..style = PaintingStyle.stroke
    ..strokeWidth = lw
    ..strokeCap = StrokeCap.round;
  final thin = Paint()
    ..color = Illum.gold
    ..style = PaintingStyle.stroke
    ..strokeWidth = lw * .7
    ..strokeCap = StrokeCap.round;
  final leaf = _fill(Illum.goldLight);
  for (final m in path.computeMetrics()) {
    final len = m.length;
    final n = math.max(2, (len / period).round());
    final per = len / n;
    final line = Path();
    Offset nrmAt(Tangent t) => Offset(-t.vector.dy, t.vector.dx);
    for (var s = 0.0; s <= len; s += 1) {
      final t = m.getTangentForOffset(s)!;
      final pt = t.position + nrmAt(t) * (amp * math.sin(2 * math.pi * s / per));
      s == 0 ? line.moveTo(pt.dx, pt.dy) : line.lineTo(pt.dx, pt.dy);
    }
    canvas.drawPath(line, stem);
    var k = 0;
    for (var s = per / 4; s < len; s += per / 2, k++) {
      final t = m.getTangentForOffset(s)!;
      final nrm = nrmAt(t);
      final side = math.sin(2 * math.pi * s / per) > 0 ? -1.0 : 1.0;
      final p = t.position + nrm * (amp * -side);
      if (k.isEven) {
        paintFlower(canvas, p + nrm * (side * amp * .9), amp * .62, flowers[(k ~/ 2) % flowers.length]);
      } else {
        paintLeaf(canvas, p, (nrm * side).direction + .5 * side, amp * 1.25, amp * .45, leaf);
      }
      final dir = t.vector;
      _curl(canvas, p + dir * amp * .5, amp * .33, dir.direction, side, thin);
    }
  }
}

/// أهداب ذهبية (أسنان دقيقة متناوبة الطول) تشعّ من حافة الشكل إلى الخارج.
void paintFringe(Canvas canvas, Path path, Offset center, double every, double l) {
  final f = _fill(Illum.gold), dot = _fill(Illum.goldLight);
  for (final m in path.computeMetrics()) {
    final n = (m.length / every).round();
    for (var k = 0; k < n; k++) {
      final t = m.getTangentForOffset(k * m.length / n)!;
      var nrm = Offset(-t.vector.dy, t.vector.dx);
      if ((t.position - center).dx * nrm.dx + (t.position - center).dy * nrm.dy < 0) nrm = -nrm;
      final len = k.isOdd ? l * .55 : l;
      canvas.save();
      canvas.translate(t.position.dx, t.position.dy);
      canvas.rotate(nrm.direction);
      canvas.drawPath(
          Path()
            ..moveTo(0, -len * .22)
            ..quadraticBezierTo(len * .6, -len * .2, len, 0)
            ..quadraticBezierTo(len * .6, len * .2, 0, len * .22)
            ..close(),
          f);
      if (k.isEven) canvas.drawCircle(Offset(len + 2.2, 0), 1.3, dot);
      canvas.restore();
    }
  }
}

/// شبكة نجوم ثمانية ذهبية خافتة على الأرضية اللازوردية.
void paintLattice(Canvas canvas, Rect r, double alpha) {
  final p = Paint()
    ..color = Illum.gold.withValues(alpha: alpha)
    ..style = PaintingStyle.stroke
    ..strokeWidth = .7;
  const s = 30.0;
  var row = 0;
  for (var y = r.top - s; y < r.bottom + s; y += s, row++) {
    for (var x = r.left - s; x < r.right + s; x += s) {
      final o = Offset(x + (row.isOdd ? s / 2 : 0), y);
      canvas.drawPath(star8(o, s * .36, s * .22), p);
      canvas.drawCircle(o, s * .08, p);
    }
  }
}

/// أرضية لازوردية بتدرّج وشبكة نجوم.
void paintLapisGround(Canvas canvas, Rect r) {
  canvas.drawRect(
      r,
      Paint()
        ..shader = const RadialGradient(colors: [Illum.lapisLight, Illum.lapisDeep], radius: .9)
            .createShader(Rect.fromCircle(center: r.center, radius: r.longestSide * .6)));
  paintLattice(canvas, r, .16);
}

/// شمسة: نجمة ذهبية ثمانية فوقها نجمة لازوردية، وأوراق ذهبية، وقلب عاجي يحمل رقم الصفحة.
void paintShamsa(Canvas canvas, Offset c, double r, Color paper, {String? label, String? font}) {
  final outer = star8(c, r, r * .78);
  canvas.drawShadow(outer, Colors.black, 3, false);
  canvas.drawPath(outer, _goldFill(Rect.fromCircle(center: c, radius: r)));
  canvas.save();
  canvas.translate(c.dx, c.dy);
  canvas.rotate(math.pi / 8);
  canvas.drawPath(star8(Offset.zero, r * .86, r * .68), _fill(Illum.lapis));
  canvas.restore();
  final leaf = _fill(Illum.gold);
  for (var k = 0; k < 8; k++) {
    final a = k * math.pi / 4 - math.pi / 2;
    paintLeaf(canvas, c + Offset(math.cos(a), math.sin(a)) * r * .3, a, r * .42, r * .13, leaf);
  }
  canvas.drawCircle(c, r * .42, _fill(paper));
  canvas.drawCircle(
      c,
      r * .42,
      Paint()
        ..shader = Illum.goldShader(Rect.fromCircle(center: c, radius: r))
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.4);
  canvas.drawCircle(
      c,
      r * .36,
      Paint()
        ..color = Illum.turquoise
        ..style = PaintingStyle.stroke
        ..strokeWidth = .8);
  if (label == null) {
    paintFlower(canvas, c, r * .22, Illum.crimson);
    return;
  }
  final tp = TextPainter(
    text: TextSpan(
        text: label,
        style: TextStyle(fontFamily: font, fontSize: r * .36, height: 1.1, color: Illum.lapisDeep)),
    textDirection: TextDirection.rtl,
  )..layout();
  tp.paint(canvas, c - Offset(tp.width / 2, tp.height / 2));
  tp.dispose();
}

Path _lobedQuarter(double r) {
  final p = Path()
    ..moveTo(0, 0)
    ..lineTo(r, 0);
  const n = 4;
  for (var i = 0; i < n; i++) {
    final a1 = (i + 1) / n * math.pi / 2, am = (i + .5) / n * math.pi / 2;
    p.quadraticBezierTo(math.cos(am) * r * 1.12, math.sin(am) * r * 1.12, math.cos(a1) * r * .92, math.sin(a1) * r * .92);
  }
  return p
    ..lineTo(0, r)
    ..close();
}

Path _palmettePath(double l, double w) => Path()
  ..moveTo(0, 0)
  ..cubicTo(l * .15, -w * 1.1, l * .6, -w, l, 0)
  ..cubicTo(l * .6, w, l * .15, w * 1.1, 0, 0);

/// سعفة: ورقة ذهبية مدبّبة في جوفها لون، وفي قلبها عرق ذهبي.
void _palmette(Canvas canvas, double l, double w, Paint outer, Color inner) {
  canvas.drawPath(_palmettePath(l, w), outer);
  canvas.save();
  canvas.translate(l * .12, 0);
  canvas.drawPath(_palmettePath(l * .72, w * .6), _fill(inner));
  canvas.restore();
  canvas.save();
  canvas.translate(l * .25, 0);
  canvas.drawPath(_palmettePath(l * .4, w * .25), outer);
  canvas.restore();
}

/// زاوية مفصّصة ذهبية في ركن الصفحة، فيها سعفة كبيرة وسعفتان ولفيفتان.
/// (sx, sy) يحدّدان اتجاه الركن: (1,1) أعلى اليسار، (-1,1) أعلى اليمين...
void paintCornerPiece(Canvas canvas, Offset at, double sx, double sy, double r) {
  canvas.save();
  canvas.translate(at.dx, at.dy);
  canvas.scale(sx, sy);
  final shape = _lobedQuarter(r);
  canvas.drawShadow(shape, Colors.black, 3, false);
  canvas.drawPath(shape, _goldFill(Rect.fromLTWH(0, 0, r, r)));
  canvas.save();
  canvas.scale(.88);
  canvas.drawPath(shape, _fill(Illum.lapis));
  canvas.restore();
  canvas.save();
  canvas.scale(.8);
  canvas.drawPath(
      shape,
      Paint()
        ..color = Illum.goldLight
        ..style = PaintingStyle.stroke
        ..strokeWidth = .7);
  canvas.restore();
  canvas.save();
  canvas.rotate(math.pi / 4);
  _palmette(canvas, r * .72, r * .17, _goldFill(Rect.fromLTWH(0, -10, r, 20)), Illum.crimson);
  final curl = Paint()
    ..color = Illum.goldLight
    ..style = PaintingStyle.stroke
    ..strokeWidth = 1.1
    ..strokeCap = StrokeCap.round;
  for (final s in [-1.0, 1.0]) {
    canvas.save();
    canvas.rotate(s * .62);
    _palmette(canvas, r * .5, r * .1, _fill(Illum.gold), Illum.turquoise);
    canvas.restore();
    _curl(canvas, Offset(r * .42, s * r * .2), r * .1, s > 0 ? -math.pi / 2 : math.pi / 2, s, curl);
  }
  canvas.restore();
  canvas.drawCircle(Offset(r * .07, r * .07), r * .07, _fill(Illum.goldLight));
  canvas.restore();
}

/// خرطوشة اسم السورة: إطار ذهبي، وجوف لازوردي، وطرفان مدبّبان.
Path cartouchePath(Offset c, double w, double h, [double d = 0]) {
  final x0 = c.dx - w / 2 + d, x1 = c.dx + w / 2 - d, y0 = c.dy - h / 2 + d, y1 = c.dy + h / 2 - d, k = h / 2 - d;
  return Path()
    ..moveTo(x0 + k, y0)
    ..lineTo(x1 - k, y0)
    ..quadraticBezierTo(x1 - k * .2, y0, x1, c.dy)
    ..quadraticBezierTo(x1 - k * .2, y1, x1 - k, y1)
    ..lineTo(x0 + k, y1)
    ..quadraticBezierTo(x0 + k * .2, y1, x0, c.dy)
    ..quadraticBezierTo(x0 + k * .2, y0, x0 + k, y0)
    ..close();
}

void paintCartouche(Canvas canvas, Offset c, double w, double h, {bool wings = true}) {
  if (wings) {
    final leaf = _fill(Illum.gold);
    paintLeaf(canvas, Offset(c.dx + w / 2, c.dy), 0, h * .75, h * .28, leaf);
    paintLeaf(canvas, Offset(c.dx - w / 2, c.dy), math.pi, h * .75, h * .28, leaf);
  }
  final r = Rect.fromCenter(center: c, width: w, height: h);
  final outer = cartouchePath(c, w, h);
  canvas.drawShadow(outer, Colors.black, 2, false);
  canvas.drawPath(outer, _goldFill(r));
  canvas.drawPath(cartouchePath(c, w, h, 2.2), _fill(Illum.lapis));
  canvas.drawPath(
      cartouchePath(c, w, h, 4),
      Paint()
        ..color = Illum.goldLight
        ..style = PaintingStyle.stroke
        ..strokeWidth = .6);
}
