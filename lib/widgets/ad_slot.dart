import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../theme.dart';

/// خانة إعلانية متحركة («أعلن معنا»)، مطابقة لخانة الموقع: إطار متدرج يدور، لمعة تعبر الخانة،
/// مكبّر صوت يهتز وتخرج منه موجات، عنوان يلمع، كلام يجري داخل الخانة، فقاعات تصعد،
/// وزرّان: «أعلن معنا» (صفحة الإعلان في الموقع) و«واتساب» (رقم الإعلانات).
class AdSlot extends StatefulWidget {
  const AdSlot({super.key, this.margin = const EdgeInsets.fromLTRB(14, 12, 14, 12)});
  final EdgeInsets margin;

  static const whatsappNumber = '+222 49 71 12 12';
  static const whatsappUrl =
      'https://wa.me/22249711212?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A5%D8%B9%D9%84%D8%A7%D9%86%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%B1%D9%88%D8%A7%D9%8A%D8%A9';

  @override
  State<AdSlot> createState() => _AdSlotState();
}

class _AdSlotState extends State<AdSlot> with TickerProviderStateMixin {
  static const _marquee =
      'اعرض علامتك أمام قرّاء الرواية في المنطقة المغاربية والساحل   ✦   في الموقع والتطبيق وعلى يوتيوب وفيسبوك وتيك توك   ✦   مساحات إعلانية ومحتوى ممول ورعاية فيديوهات   ✦   ';
  static const _waGreen = Color(0xFF25D366);

  // دورة عامة 12 ثانية تقسّم عليها كل الحركات
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();
  // الشريط: يُضبط طوله بعد قياس النص (≈ 45 بكسل في الثانية)
  late final AnimationController _m =
      AnimationController(vsync: this, duration: const Duration(seconds: 22))..repeat();

  @override
  void dispose() {
    _c.dispose();
    _m.dispose();
    super.dispose();
  }

  void _open(String url) => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

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
            final t = reduce ? 0.0 : _c.value; // 0..1
            final sweep = (t * 4) % 1; // لمعة كل 3 ثوانٍ
            return Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                gradient: SweepGradient(
                  colors: const [Brand.green, Brand.red, Brand.green],
                  transform: GradientRotation(t * 2 * math.pi * 2),
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
                  if (!reduce) Positioned.fill(child: _Bubbles(t: t)),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Row(children: [
                        _Megaphone(t: t),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            _Shine(
                              t: t,
                              child: const Text('مساحتك الإعلانية هنا',
                                  style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(height: 4),
                            reduce
                                ? const Text(
                                    'اعرض علامتك أمام قرّاء الرواية في المنطقة المغاربية والساحل',
                                    maxLines: 2,
                                    style: TextStyle(fontSize: 14, height: 1.5, color: Brand.muted))
                                : _Marquee(text: _marquee, controller: _m),
                          ]),
                        ),
                      ]),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(
                          child: _Button(
                            color: Brand.green,
                            glow: reduce ? 0 : _pulse(t, 0),
                            onTap: () => _open('${AppConfig.siteUrl}/advertise.html'),
                            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                              const Text('أعلن معنا', style: TextStyle(color: Colors.white, fontSize: 15)),
                              const SizedBox(width: 8),
                              Transform.translate(
                                offset: Offset(reduce ? 0 : -5 * (0.5 - 0.5 * math.cos(t * 2 * math.pi * 11)), 0),
                                child: const Icon(Icons.arrow_forward, color: Colors.white, size: 18),
                              ),
                            ]),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _Button(
                            color: _waGreen,
                            glow: reduce ? 0 : _pulse(t, .5),
                            onTap: () => _open(AdSlot.whatsappUrl),
                            child: const FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Row(mainAxisSize: MainAxisSize.min, children: [
                                _WaIcon(),
                                SizedBox(width: 6),
                                Text('واتساب ', style: TextStyle(color: Colors.white, fontSize: 15)),
                                Text(AdSlot.whatsappNumber,
                                    textDirection: TextDirection.ltr,
                                    style: TextStyle(
                                        color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600, fontFamily: 'Roboto')),
                              ]),
                            ),
                          ),
                        ),
                      ]),
                    ]),
                  ),
                ]),
              ),
            );
          },
        ),
      ]),
    );
  }

  // نبض الزرّين متناوب: 0..1 خلال كل 2.4 ثانية تقريباً
  static double _pulse(double t, double phase) => .5 - .5 * math.cos((t * 5 + phase) * 2 * math.pi);
}

/// زر مستدير بنبض ظل.
class _Button extends StatelessWidget {
  const _Button({required this.color, required this.glow, required this.onTap, required this.child});
  final Color color;
  final double glow;
  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Ink(
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(999),
          boxShadow: [BoxShadow(color: color.withOpacity(.45 * glow), blurRadius: 14, spreadRadius: 3 * glow)],
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: onTap,
          child: Padding(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11), child: child),
        ),
      ),
    );
  }
}

/// مكبّر صوت أخضر يهتز، وتخرج منه موجتان حمراوان تتسعان وتختفيان.
class _Megaphone extends StatelessWidget {
  const _Megaphone({required this.t});
  final double t;

  @override
  Widget build(BuildContext context) {
    final p = (t * 5) % 1; // دورة كل 2.4 ثانية
    // اهتزاز في أول 40% من الدورة ثم سكون
    final swing = p < .4 ? math.sin(p / .4 * math.pi * 5) * (1 - p / .4) * .25 : 0.0;
    Widget ring(double q) => Opacity(
          opacity: (1 - q).clamp(0, 1) * .75,
          child: Transform.scale(
            scale: 1 + .65 * q,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Brand.red, width: 2),
              ),
            ),
          ),
        );
    return SizedBox(
      width: 54,
      height: 54,
      child: Stack(clipBehavior: Clip.none, children: [
        Positioned.fill(child: ring(p)),
        Positioned.fill(child: ring((p + .5) % 1)),
        Positioned.fill(
          child: Transform.rotate(
            angle: swing,
            child: Transform.scale(
              scale: 1 + (swing.abs() * .3),
              child: Container(
                decoration: BoxDecoration(color: Brand.green, borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.campaign_outlined, color: Colors.white, size: 30),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}

/// لمعان أحمر يعبر العنوان الأخضر.
class _Shine extends StatelessWidget {
  const _Shine({required this.t, required this.child});
  final double t;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final s = (t * 4) % 1; // كل 3 ثوانٍ
    return ShaderMask(
      blendMode: BlendMode.srcIn,
      shaderCallback: (rect) => LinearGradient(
        begin: Alignment(-1 + s * 4 - 1.5, 0),
        end: Alignment(1 + s * 4 - 1.5, 0),
        colors: const [Brand.green, Brand.green, Brand.red, Brand.green, Brand.green],
        stops: const [0, .38, .5, .62, 1],
      ).createShader(rect),
      child: child,
    );
  }
}

/// فقاعات صغيرة خضراء وحمراء تصعد من أسفل الخانة.
class _Bubbles extends StatelessWidget {
  const _Bubbles({required this.t});
  final double t;
  static const _specs = [
    // (موضع أفقي 0..1، قطر، تأخير 0..1، أحمر؟)
    (.08, 9.0, .0, false), (.22, 6.0, .25, true), (.38, 9.0, .47, false), (.52, 12.0, .13, false),
    (.66, 6.0, .6, true), (.80, 9.0, .36, false), (.92, 7.0, .73, false),
  ];

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: LayoutBuilder(builder: (context, c) {
        return Stack(children: [
          for (final b in _specs)
            () {
              final q = ((t * 2.2) + b.$3) % 1; // كل فقاعة تصعد في ~5.5 ثانية
              final op = q < .15 ? q / .15 : 1 - q;
              return Positioned(
                right: c.maxWidth * b.$1,
                bottom: -12 + q * 150,
                child: Opacity(
                  opacity: op.clamp(0, 1),
                  child: Transform.scale(
                    scale: .6 + .65 * q,
                    child: Container(
                      width: b.$2,
                      height: b.$2,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: (b.$4 ? Brand.red : Brand.green).withOpacity(.25),
                      ),
                    ),
                  ),
                ),
              );
            }(),
        ]);
      }),
    );
  }
}

/// الكلام يجري داخل الخانة كشريط أخبار (من اليسار إلى اليمين، كما في الموقع)، ويختفي بلطف عند الطرفين.
class _Marquee extends StatefulWidget {
  const _Marquee({required this.text, required this.controller});
  final String text;
  final AnimationController controller;

  @override
  State<_Marquee> createState() => _MarqueeState();
}

class _MarqueeState extends State<_Marquee> {
  static const _style = TextStyle(fontSize: 14.5, height: 1.6, color: Brand.muted);
  double? _w;

  @override
  Widget build(BuildContext context) {
    _w ??= _measure(context);
    final w = _w!;
    // سرعة ثابتة تقريباً مهما طال النص
    final want = Duration(milliseconds: (w / 45 * 1000).round());
    if (widget.controller.duration != want) {
      widget.controller.duration = want;
      widget.controller.repeat();
    }
    return SizedBox(
      height: 24,
      child: ShaderMask(
        blendMode: BlendMode.dstIn,
        shaderCallback: (r) => const LinearGradient(
          colors: [Colors.transparent, Colors.black, Colors.black, Colors.transparent],
          stops: [0, .06, .94, 1],
        ).createShader(r),
        child: ClipRect(
          child: AnimatedBuilder(
            animation: widget.controller,
            builder: (context, _) => OverflowBox(
              alignment: AlignmentDirectional.centerStart,
              minWidth: 0,
              maxWidth: double.infinity,
              child: Transform.translate(
                offset: Offset(widget.controller.value * w, 0),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Text(widget.text, maxLines: 1, softWrap: false, style: _style),
                  Text(widget.text, maxLines: 1, softWrap: false, style: _style),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }

  double _measure(BuildContext context) {
    final tp = TextPainter(
      text: TextSpan(text: widget.text, style: DefaultTextStyle.of(context).style.merge(_style)),
      textDirection: Directionality.of(context),
      maxLines: 1,
    )..layout();
    return tp.width;
  }
}

/// شعار واتساب مبسّط: فقاعة حديث دائرية بذيل في أسفلها، وفي داخلها سماعة هاتف.
class _WaIcon extends StatelessWidget {
  const _WaIcon();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(
        painter: _WaBubble(),
        child: const Center(child: Icon(Icons.phone, color: Colors.white, size: 11)),
      ),
    );
  }
}

class _WaBubble extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8
      ..strokeJoin = StrokeJoin.round;
    final c = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2 - 1.5;
    // دائرة مفتوحة عند الزاوية السفلية اليسرى، يكملها ذيل الفقاعة
    final path = Path()
      ..addArc(Rect.fromCircle(center: c, radius: r), math.pi * .78, math.pi * 1.72)
      ..moveTo(c.dx + r * math.cos(math.pi * .78), c.dy + r * math.sin(math.pi * .78))
      ..lineTo(1, size.height - 1)
      ..lineTo(c.dx + r * math.cos(math.pi * .5) - 2, c.dy + r);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
