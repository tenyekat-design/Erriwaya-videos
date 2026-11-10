import 'dart:math' as math;
import 'package:flutter/material.dart';

/// مفردات زخرفة ولاتة (موريتانيا) مرسومة بالكود:
/// جدار الطين الأحمر، والمعيّن الجصّي الأبيض المخرّم، والدائرة الملوّنة التي تحفّ الأبواب،
/// والختم البنّي الصغير، والأسنان البيضاء على حواف الجدار.
class OualataPalette {
  const OualataPalette(
      {required this.wall,
      required this.wallLight,
      required this.lime,
      required this.ink,
      required this.paper,
      required this.yellow,
      required this.red,
      required this.green,
      required this.blue,
      required this.navy});
  final Color wall, wallLight, lime, ink, paper, yellow, red, green, blue, navy;

  static const light = OualataPalette(
    wall: Color(0xFFB4532E),
    wallLight: Color(0xFFCF7446),
    lime: Color(0xFFFBF3E2),
    ink: Color(0xFF5A2414),
    paper: Color(0xFFFFFBF2),
    yellow: Color(0xFFF0B429),
    red: Color(0xFFCC3B22),
    green: Color(0xFF22866F),
    blue: Color(0xFF1F57A8),
    navy: Color(0xFF14306A),
  );
  static const dark = OualataPalette(
    wall: Color(0xFF6A2C17),
    wallLight: Color(0xFF8A4024),
    lime: Color(0xFFE6D8BE),
    ink: Color(0xFF4A1C10),
    paper: Color(0xFF111A19),
    yellow: Color(0xFFD9A22A),
    red: Color(0xFFB8402A),
    green: Color(0xFF2A9A80),
    blue: Color(0xFF3A6CC0),
    navy: Color(0xFF1A3570),
  );
  List<Color> get four => [yellow, red, green, blue];
}

Paint _fill(Color c) => Paint()..color = c;
Paint _stroke(Color c, double w) => Paint()
  ..color = c
  ..style = PaintingStyle.stroke
  ..strokeWidth = w
  ..strokeCap = StrokeCap.round
  ..strokeJoin = StrokeJoin.round;

/// جدار الطين: تدرّج دافئ وحبيبات خفيفة.
void paintWall(Canvas canvas, Rect r, OualataPalette p) {
  canvas.drawRect(
      r,
      Paint()
        ..shader = RadialGradient(colors: [p.wallLight, p.wall], radius: .8)
            .createShader(Rect.fromCircle(center: r.center, radius: r.longestSide * .7)));
  final rnd = math.Random(7);
  final light = _fill(const Color(0x1AFFDCBE)), dark = _fill(const Color(0x1A5A1E0A));
  final n = (r.width * r.height / 40).round();
  for (var i = 0; i < n; i++) {
    canvas.drawRect(Rect.fromLTWH(r.left + rnd.nextDouble() * r.width, r.top + rnd.nextDouble() * r.height, 1.2, 1.2),
        rnd.nextBool() ? light : dark);
  }
}

/// ختم ولاتيّ صغير: أربع فصوص حول مربع، ونقاط على الأقطار.
void paintStamp(Canvas canvas, Offset c, double r, Color col, Color hole) {
  final f = _fill(col);
  for (var k = 0; k < 4; k++) {
    final a = k * math.pi / 2;
    canvas.drawCircle(c + Offset(math.cos(a), math.sin(a)) * r * .62, r * .34, f);
  }
  canvas.save();
  canvas.translate(c.dx, c.dy);
  canvas.rotate(math.pi / 4);
  canvas.drawRect(Rect.fromCenter(center: Offset.zero, width: r * .72, height: r * .72), f);
  canvas.restore();
  for (var k = 0; k < 4; k++) {
    final a = k * math.pi / 2 + math.pi / 4;
    canvas.drawCircle(c + Offset(math.cos(a), math.sin(a)) * r * .9, r * .12, f);
  }
  canvas.drawCircle(c, r * .16, _fill(hole));
}

Path squircle(Offset c, double r, [double n = 3.2]) {
  final p = Path();
  for (var i = 0; i <= 96; i++) {
    final t = i / 96 * 2 * math.pi, co = math.cos(t), si = math.sin(t);
    final x = c.dx + r * co.sign * math.pow(co.abs(), 2 / n);
    final y = c.dy + r * si.sign * math.pow(si.abs(), 2 / n);
    i == 0 ? p.moveTo(x, y) : p.lineTo(x, y);
  }
  return p..close();
}

/// الدائرة الملوّنة التي تحفّ أبواب ولاتة: إطار بنّي، وحلقة مثلثات بالألوان الأربعة،
/// وصليب أصفر بأطراف ثلاثية، وأوراق خضراء، وفي القلب مربّع أزرق (يحمل رقم الصفحة إن وُجد).
void paintColorMedallion(Canvas canvas, Offset c, double r, OualataPalette p, {String? label, String? font}) {
  final shape = squircle(c, r);
  canvas.drawShadow(shape, Colors.black, 2.5, false);
  canvas.drawPath(shape, _fill(p.lime));
  canvas.drawPath(shape, _stroke(p.ink, r * .08));
  const n = 28;
  final cols = p.four;
  for (var i = 0; i < n; i++) {
    final a0 = i / n * 2 * math.pi, a1 = (i + 1) / n * 2 * math.pi, am = (a0 + a1) / 2;
    final ro = r * .86, ri = r * .66;
    canvas.drawPath(
        Path()
          ..moveTo(c.dx + math.cos(a0) * ro, c.dy + math.sin(a0) * ro)
          ..lineTo(c.dx + math.cos(a1) * ro, c.dy + math.sin(a1) * ro)
          ..lineTo(c.dx + math.cos(am) * ri, c.dy + math.sin(am) * ri)
          ..close(),
        _fill(cols[i % 4]));
  }
  canvas.drawCircle(c, r * .62, _stroke(p.ink, r * .035));
  canvas.save();
  canvas.translate(c.dx, c.dy);
  for (var k = 0; k < 4; k++) {
    canvas.save();
    canvas.rotate(k * math.pi / 2 + math.pi / 4);
    canvas.drawPath(
        Path()
          ..moveTo(r * .12, 0)
          ..quadraticBezierTo(r * .32, -r * .13, r * .52, 0)
          ..quadraticBezierTo(r * .32, r * .13, r * .12, 0),
        _fill(p.green));
    canvas.restore();
  }
  for (var k = 0; k < 4; k++) {
    canvas.save();
    canvas.rotate(k * math.pi / 2);
    final w = r * .13;
    final arm = Path()
      ..moveTo(r * .1, -w)
      ..lineTo(r * .42, -w)
      ..arcTo(Rect.fromCircle(center: Offset(r * .5, -r * .1), radius: r * .1), math.pi, math.pi, false)
      ..arcTo(Rect.fromCircle(center: Offset(r * .58, 0), radius: r * .1), -math.pi / 2, math.pi, false)
      ..arcTo(Rect.fromCircle(center: Offset(r * .5, r * .1), radius: r * .1), 0, math.pi, false)
      ..lineTo(r * .42, w)
      ..lineTo(r * .1, w)
      ..close();
    canvas.drawPath(arm, _fill(p.yellow));
    canvas.drawPath(arm, _stroke(p.red, r * .035));
    canvas.drawCircle(Offset(r * .52, 0), r * .045, _fill(p.red));
    canvas.restore();
  }
  canvas.restore();
  // القلب الأزرق، ويتّسع لرقم الصفحة
  TextPainter? tp;
  if (label != null) {
    tp = TextPainter(
      text: TextSpan(
          text: label, style: TextStyle(fontFamily: font, fontSize: r * .36, height: 1.1, color: Colors.white)),
      textDirection: TextDirection.rtl,
    )..layout();
  }
  final s = r * .27;
  final hw = math.max(s, (tp?.width ?? 0) / 2 + r * .08);
  canvas.drawRect(Rect.fromCenter(center: c, width: 2 * hw + r * .08, height: 2 * s + r * .08), _fill(p.lime));
  canvas.drawRect(Rect.fromCenter(center: c, width: 2 * hw, height: 2 * s), _fill(p.navy));
  canvas.drawRect(Rect.fromCenter(center: c, width: 2 * hw - s * .44, height: s * 1.56), _fill(p.blue));
  if (tp != null) {
    tp.paint(canvas, c - Offset(tp.width / 2, tp.height / 2));
    tp.dispose();
  }
}

void _spiral(Canvas canvas, Offset c, double r, double a0, double dir, Paint paint, [double turns = 1.4]) {
  final path = Path();
  for (var i = 0; i <= 40; i++) {
    final t = i / 40, a = a0 + dir * t * turns * 2 * math.pi, rr = r * (1 - .85 * t);
    final pt = c + Offset(math.cos(a), math.sin(a)) * rr;
    i == 0 ? path.moveTo(pt.dx, pt.dy) : path.lineTo(pt.dx, pt.dy);
  }
  canvas.drawPath(path, paint);
}

/// المعيّن الجصّي المخرّم (كنقوش جدران ولاتة البيضاء): حافة مفصّصة وأطراف مدبّبة،
/// ولفائف على هيئة حرف S، ومعيّن داخلي، ووردة ثمانية في القلب.
void paintLaceDiamond(Canvas canvas, Offset c, double r, Color col, Color bg) {
  canvas.save();
  canvas.translate(c.dx, c.dy);
  final lw = r * .055;
  final line = _stroke(col, lw), thin = _stroke(col, lw * .8), f = _fill(col);
  final tips = [Offset(0, -r), Offset(r * .78, 0), Offset(0, r), Offset(-r * .78, 0)];
  for (var e = 0; e < 4; e++) {
    final t0 = tips[e], t1 = tips[(e + 1) % 4];
    const n = 3;
    for (var i = 0; i < n; i++) {
      final a = Offset.lerp(t0, t1, i / n)!, b = Offset.lerp(t0, t1, (i + 1) / n)!;
      final m = (a + b) / 2, l = (b - a).distance, ang = (b - a).direction;
      canvas.drawArc(Rect.fromCircle(center: m, radius: l / 2), ang + math.pi, math.pi, false, line);
    }
  }
  for (final t in tips) {
    final u = t / t.distance;
    canvas.drawCircle(t + u * r * .1, r * .07, f);
    canvas.drawLine(t, t - u * r * .12, line);
  }
  final inner = Path()..addPolygon([for (final t in tips) t * .66], true);
  canvas.drawPath(inner, line);
  for (var e = 0; e < 4; e++) {
    final t0 = tips[e], t1 = tips[(e + 1) % 4];
    final m = (t0 + t1) / 2 * .83, ang = (t1 - t0).direction;
    final d = Offset(math.cos(ang), math.sin(ang)) * r * .13;
    _spiral(canvas, m + d, r * .1, ang + math.pi, 1, thin);
    _spiral(canvas, m - d, r * .1, ang, -1, thin);
  }
  for (final t in tips) {
    final u = t * .46, a = t.direction;
    final side = Offset(math.cos(a + math.pi / 2), math.sin(a + math.pi / 2)) * r * .07;
    _spiral(canvas, u + side, r * .07, a, 1, thin, 1.2);
    _spiral(canvas, u - side, r * .07, a, -1, thin, 1.2);
  }
  canvas.drawCircle(Offset.zero, r * .26, line);
  for (var k = 0; k < 8; k++) {
    canvas.save();
    canvas.rotate(k * math.pi / 4);
    canvas.drawOval(Rect.fromCenter(center: Offset(r * .15, 0), width: r * .18, height: r * .09), f);
    canvas.restore();
  }
  canvas.drawCircle(Offset.zero, r * .06, _fill(bg));
  canvas.restore();
}

/// أسنان مثلثة بيضاء على خط مستقيم (من a إلى b)، تتّجه نحو nrm.
void paintTeeth(Canvas canvas, Offset a, Offset b, Offset nrm, double size, Color col) {
  final n = math.max(1, ((b - a).distance / (size * 2)).round());
  final f = _fill(col);
  for (var i = 0; i < n; i++) {
    final p0 = Offset.lerp(a, b, i / n)!, p1 = Offset.lerp(a, b, (i + 1) / n)!;
    canvas.drawPath(
        Path()
          ..moveTo(p0.dx, p0.dy)
          ..lineTo(p1.dx, p1.dy)
          ..lineTo((p0.dx + p1.dx) / 2 + nrm.dx * size, (p0.dy + p1.dy) / 2 + nrm.dy * size)
          ..close(),
        f);
  }
}
