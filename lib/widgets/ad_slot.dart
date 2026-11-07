import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../theme.dart';

/// خانة إعلانية متحركة («أعلن معنا»)، مثل خانات الموقع: إطار متدرج يدور، لمعة تعبر الخانة،
/// عبارات تتناوب كل 3 ثوانٍ، وزر نابض. الضغط يفتح صفحة الإعلان في الموقع.
class AdSlot extends StatefulWidget {
  const AdSlot({super.key, this.margin = const EdgeInsets.fromLTRB(14, 12, 14, 12)});
  final EdgeInsets margin;

  @override
  State<AdSlot> createState() => _AdSlotState();
}

class _AdSlotState extends State<AdSlot> with SingleTickerProviderStateMixin {
  static const _lines = [
    'اعرض علامتك أمام قرّاء الرواية في المنطقة المغاربية والساحل',
    'في الموقع والتطبيق وعلى يوتيوب وفيسبوك وتيك توك',
    'مساحات إعلانية ومحتوى ممول ورعاية فيديوهات',
  ];
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(seconds: 9))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  void _open() => launchUrl(Uri.parse('${AppConfig.siteUrl}/advertise.html'),
      mode: LaunchMode.externalApplication);

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.of(context).disableAnimations;
    return Padding(
      padding: widget.margin,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Center(
            child: Text('إعلان', style: TextStyle(fontSize: 11, color: Brand.muted, letterSpacing: .5))),
        const SizedBox(height: 6),
        AnimatedBuilder(
          animation: _c,
          builder: (context, _) {
            final t = reduce ? 0.0 : _c.value; // 0..1 كل 9 ثوانٍ
            final idx = (t * 3).floor() % 3;
            final local = (t * 3) % 1; // داخل كل عبارة
            final pulse = reduce ? 1.0 : 1 + 0.05 * math.sin(t * 2 * math.pi * 3.75);
            final sweep = (t * 2) % 1; // لمعة مرتين في الدورة
            return GestureDetector(
              onTap: _open,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: SweepGradient(
                    colors: const [Brand.green, Brand.red, Brand.green],
                    transform: GradientRotation(t * 2 * math.pi * 1.5),
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(children: [
                    Positioned.fill(child: Container(color: Colors.white)),
                    if (!reduce)
                      Positioned.fill(
                        child: FractionalTranslation(
                          translation: Offset(1.5 - sweep * 3, 0),
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(colors: [
                                Colors.transparent,
                                Brand.green.withOpacity(.10),
                                Brand.red.withOpacity(.08),
                                Colors.transparent,
                              ]),
                            ),
                          ),
                        ),
                      ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                      child: Row(children: [
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const Text('مساحتك الإعلانية هنا',
                                style: TextStyle(fontSize: 18, color: Brand.green, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            SizedBox(
                              height: 44,
                              child: Opacity(
                                opacity: reduce ? 1 : _fade(local),
                                child: Transform.translate(
                                  offset: Offset(0, reduce ? 0 : _slide(local)),
                                  child: Text(_lines[idx],
                                      maxLines: 2,
                                      style: const TextStyle(fontSize: 14, height: 1.5, color: Brand.muted)),
                                ),
                              ),
                            ),
                          ]),
                        ),
                        const SizedBox(width: 12),
                        Transform.scale(
                          scale: pulse,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                            decoration: BoxDecoration(
                              color: Brand.green,
                              borderRadius: BorderRadius.circular(999),
                              boxShadow: [
                                BoxShadow(
                                    color: Brand.green.withOpacity(.35 * (pulse - 1) / .05),
                                    blurRadius: 12,
                                    spreadRadius: 2),
                              ],
                            ),
                            child: const Text('أعلن معنا', style: TextStyle(color: Colors.white, fontSize: 15)),
                          ),
                        ),
                      ]),
                    ),
                  ]),
                ),
              ),
            );
          },
        ),
      ]),
    );
  }

  // ظهور العبارة ثم اختفاؤها داخل الثواني الثلاث
  static double _fade(double x) => x < .12 ? x / .12 : (x > .88 ? (1 - x) / .12 : 1.0);
  static double _slide(double x) => x < .12 ? 10 * (1 - x / .12) : (x > .88 ? -10 * (x - .88) / .12 : 0.0);
}
