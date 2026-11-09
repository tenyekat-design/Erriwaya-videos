import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'data.dart';
import 'theme.dart';

/// اختيار الرواية: حفص أو ورش.
class RiwayaSwitch extends StatelessWidget {
  const RiwayaSwitch({super.key, required this.value, required this.onChanged});
  final Riwaya value;
  final ValueChanged<Riwaya> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: .12), borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        for (final r in Riwaya.values)
          Expanded(
            child: GestureDetector(
              onTap: () => onChanged(r),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOut,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: r == value ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text('رواية ${r.label}',
                    style: TextStyle(fontSize: 15.5, color: r == value ? Brand.green : Colors.white)),
              ),
            ),
          ),
      ]),
    );
  }
}

/// رقم داخل نجمة ثمانية (زخرفة المصاحف).
class NumberBadge extends StatelessWidget {
  const NumberBadge(this.n, {super.key, this.size = 40});
  final int n;
  final double size;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final c = dark ? const Color(0xFF6CC5C0) : Brand.green;
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _StarPainter(c),
        child: Center(child: Text(ar(n), style: TextStyle(fontSize: size * .36, color: c, height: 1))),
      ),
    );
  }
}

class _StarPainter extends CustomPainter {
  _StarPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final c = size.center(Offset.zero);
    final r = size.width / 2 - 2;
    for (final rot in [0.0, math.pi / 4]) {
      final path = Path();
      for (var i = 0; i < 4; i++) {
        final a = rot + i * math.pi / 2 + math.pi / 4;
        final pt = c + Offset(math.cos(a), math.sin(a)) * r;
        i == 0 ? path.moveTo(pt.dx, pt.dy) : path.lineTo(pt.dx, pt.dy);
      }
      path.close();
      canvas.drawPath(path, p);
    }
  }

  @override
  bool shouldRepaint(covariant _StarPainter old) => old.color != color;
}

/// شريط اسم السورة في الصفحة: يشغل سطراً واحداً كما في المصحف المطبوع.
/// خرطوشة مستطيلة بحدّين رفيعين بلون الطين، وفي طرفيها نجمتان ثمانيتان، ومعلومات السورة صغيرة على الجانبين.
class SurahBanner extends StatelessWidget {
  const SurahBanner({super.key, required this.surah, required this.riwaya, required this.colors, this.height = 44});
  final Surah surah;
  final Riwaya riwaya;
  final PageColors colors;
  final double height;

  @override
  Widget build(BuildContext context) {
    final h = height * .82;
    final small = TextStyle(fontSize: (h * .26).clamp(9, 12.5).toDouble(), color: colors.muted, height: 1);
    return Center(
      child: SizedBox(
        height: h,
        child: CustomPaint(
          painter: _CartouchePainter(colors.frame),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: h * .9),
            child: Row(children: [
              Text(surah.makki ? 'مكية' : 'مدنية', style: small),
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text('سُورَةُ ${surah.name}',
                      style: TextStyle(fontFamily: riwaya.font, fontSize: h * .52, color: colors.ink, height: 1.25)),
                ),
              ),
              Text('آياتها ${ar(surah.count(riwaya))}', style: small),
            ]),
          ),
        ),
      ),
    );
  }
}

class _CartouchePainter extends CustomPainter {
  _CartouchePainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final h = size.height;
    final r = Rect.fromLTWH(h * .5, 0, size.width - h, h);
    final rr = RRect.fromRectAndRadius(r, Radius.circular(h * .22));
    canvas.drawRRect(rr, Paint()..color = color.withValues(alpha: .07));
    canvas.drawRRect(
        rr,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2);
    canvas.drawRRect(
        rr.deflate(3),
        Paint()
          ..color = color.withValues(alpha: .45)
          ..style = PaintingStyle.stroke
          ..strokeWidth = .7);
    // نجمتان ثمانيتان على الطرفين
    for (final cx in [h * .5, size.width - h * .5]) {
      final c = Offset(cx, h / 2);
      final s = h * .34;
      canvas.drawCircle(c, s * 1.05, Paint()..color = color);
      _star(canvas, c, s * .78, Paint()..color = const Color(0xFFFBF4E6));
      canvas.drawCircle(c, s * .22, Paint()..color = color);
    }
  }

  void _star(Canvas canvas, Offset o, double r, Paint p) {
    final path = Path();
    for (var i = 0; i < 16; i++) {
      final a = i * math.pi / 8 - math.pi / 2;
      final rr = i.isEven ? r : r * .62;
      final pt = o + Offset(math.cos(a), math.sin(a)) * rr;
      i == 0 ? path.moveTo(pt.dx, pt.dy) : path.lineTo(pt.dx, pt.dy);
    }
    canvas.drawPath(path..close(), p);
  }

  @override
  bool shouldRepaint(covariant _CartouchePainter old) => old.color != color;
}
