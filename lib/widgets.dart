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

/// شريط اسم السورة في الصفحة: إطار مزخرف بذهبي خفيف.
class SurahBanner extends StatelessWidget {
  const SurahBanner({super.key, required this.surah, required this.riwaya, required this.colors});
  final Surah surah;
  final Riwaya riwaya;
  final PageColors colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 6, bottom: 4),
      padding: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: colors.frame, width: 1.2),
        borderRadius: BorderRadius.circular(6),
        gradient: LinearGradient(colors: [
          colors.frame.withValues(alpha: .05),
          colors.frame.withValues(alpha: .16),
          colors.frame.withValues(alpha: .05),
        ]),
      ),
      child: Row(children: [
        const SizedBox(width: 10),
        _Diamond(color: colors.frame),
        Expanded(
          child: Column(children: [
            Text('سُورَةُ ${surah.name}',
                textAlign: TextAlign.center,
                style: TextStyle(fontFamily: riwaya.font, fontSize: 24, color: colors.ink, height: 1.7)),
            Text('${surah.makki ? 'مكية' : 'مدنية'} · آياتها ${ar(surah.count(riwaya))}',
                style: TextStyle(fontSize: 12.5, color: colors.muted, height: 1.2)),
          ]),
        ),
        _Diamond(color: colors.frame),
        const SizedBox(width: 10),
      ]),
    );
  }
}

class _Diamond extends StatelessWidget {
  const _Diamond({required this.color});
  final Color color;
  @override
  Widget build(BuildContext context) => Transform.rotate(
        angle: math.pi / 4,
        child: Container(width: 10, height: 10, decoration: BoxDecoration(border: Border.all(color: color, width: 1.4))),
      );
}
