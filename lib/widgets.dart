import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'data.dart';
import 'illumination.dart';
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
/// خرطوشة مذهّبة لازوردية، وفي طرفيها نجمتان ذهبيتان، ومعلومات السورة صغيرة على الجانبين.
class SurahBanner extends StatelessWidget {
  const SurahBanner({super.key, required this.surah, required this.riwaya, required this.colors, this.height = 44});
  final Surah surah;
  final Riwaya riwaya;
  final PageColors colors;
  final double height;

  @override
  Widget build(BuildContext context) {
    final h = height * .82;
    final small = TextStyle(fontSize: (h * .26).clamp(9, 12.5).toDouble(), color: Illum.goldLight.withValues(alpha: .85), height: 1);
    return Center(
      child: SizedBox(
        height: h,
        child: CustomPaint(
          painter: _CartouchePainter(),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: h * 1.05),
            child: Row(children: [
              Text(surah.makki ? 'مكية' : 'مدنية', style: small),
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text('سُورَةُ ${surah.name}',
                      style: TextStyle(fontFamily: riwaya.font, fontSize: h * .52, color: Illum.goldLight, height: 1.25)),
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
  @override
  void paint(Canvas canvas, Size size) {
    final h = size.height;
    // خرطوشة مذهّبة لازوردية، وفي طرفيها نجمتان ذهبيتان
    paintCartouche(canvas, size.center(Offset.zero), size.width - h * .5, h, wings: false);
    for (final cx in [h * .62, size.width - h * .62]) {
      final c = Offset(cx, h / 2);
      canvas.drawPath(star8(c, h * .36, h * .25), Paint()..shader = Illum.goldShader(Rect.fromCircle(center: c, radius: h * .36)));
      canvas.drawPath(star8(c, h * .24, h * .17), Paint()..color = Illum.lapis);
      paintFlower(canvas, c, h * .12, Illum.crimson);
    }
  }

  @override
  bool shouldRepaint(covariant _CartouchePainter old) => false;
}
