import 'dart:async';

import 'package:flutter/material.dart';

import '../models.dart';
import '../portals.dart';
import '../screens/portals_screen.dart';
import '../services/weather_service.dart';
import '../theme.dart';

const _days = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const _months = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];
String _two(int n) => n.toString().padLeft(2, '0');
String hhmm(DateTime t) => '${_two(t.hour)}:${_two(t.minute)}';

/// التاريخ والساعة في نواكشوط، كما في أعلى الموقع: «السبت 1 نوفمبر 2026 | 22:20».
String nouakchottNow() {
  final t = capitals.first.now;
  return '${_days[t.weekday - 1]} ${t.day} ${_months[t.month - 1]} ${t.year} | ${hhmm(t)}';
}

IconData weatherIcon(CityWeather w) {
  final c = w.wmo;
  if (c <= 1) return w.day ? Icons.wb_sunny_outlined : Icons.nightlight_outlined;
  if (c == 2) return w.day ? Icons.wb_cloudy_outlined : Icons.nights_stay_outlined;
  if (c == 3 || c == 45 || c == 48) return Icons.cloud_outlined;
  if (c >= 95) return Icons.thunderstorm_outlined;
  if ((c >= 71 && c <= 77) || c == 85 || c == 86) return Icons.ac_unit;
  if (c >= 51) return Icons.water_drop_outlined;
  return Icons.cloud_outlined;
}

Color _tone(CityWeather w) {
  final c = w.wmo;
  if (c <= 2) return w.day ? const Color(0xFFF2B33D) : const Color(0xFFB9C7E6);
  if (c >= 95) return const Color(0xFFFFC94D);
  if (c >= 51 && c <= 82) return const Color(0xFF7CC4F2);
  return Colors.white70;
}

/// لوحة العواصم (كما في الموقع): كبسولات صغيرة، كل واحدة تعرض ساعة عاصمة ثم طقسها ثم تنتقل إلى العاصمة التالية.
class CapitalsBoard extends StatelessWidget {
  const CapitalsBoard({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([WeatherService.instance, minuteTick]),
      builder: (context, _) {
        final nkc = WeatherService.instance.of('mr');
        return Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.schedule, size: 15, color: Brand.green),
              const SizedBox(width: 5),
              Expanded(
                child: Text('نواكشوط | ${nouakchottNow()}${nkc != null ? ' | ${nkc.temp}°' : ''}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Brand.muted, fontSize: 13)),
              ),
            ]),
            const SizedBox(height: 6),
            LayoutBuilder(builder: (context, box) {
              const gap = 6.0;
              final n = ((box.maxWidth + gap) / 112).floor().clamp(1, 5);
              final w = (box.maxWidth - gap * (n - 1)) / n;
              return Row(children: [
                for (var i = 0; i < n; i++) ...[
                  if (i > 0) const SizedBox(width: gap),
                  SizedBox(width: w, child: _Flap(index: i, count: n)),
                ],
              ]);
            }),
          ]),
        );
      },
    );
  }
}

/// وجه واحد للكبسولة: ساعة عاصمة أو طقسها.
class _Face {
  final Capital c;
  final bool weather;
  const _Face(this.c, this.weather);
}

class _Flap extends StatefulWidget {
  final int index, count;
  const _Flap({required this.index, required this.count});
  @override
  State<_Flap> createState() => _FlapState();
}

class _FlapState extends State<_Flap> {
  static const _every = Duration(milliseconds: 3500);
  int _k = 0;
  Timer? _start, _timer;

  @override
  void initState() {
    super.initState();
    // تتابع الكبسولات بفارق صغير، كلوحة المطار
    _start = Timer(Duration(milliseconds: 180 * widget.index), () {
      _timer = Timer.periodic(_every, (_) {
        if (mounted) setState(() => _k++);
      });
    });
  }

  @override
  void dispose() {
    _start?.cancel();
    _timer?.cancel();
    super.dispose();
  }

  List<_Face> get _steps {
    final ws = WeatherService.instance;
    return [
      for (var k = 0; k < capitals.length; k++)
        if (k % widget.count == widget.index) ...[
          _Face(capitals[k], false),
          if (ws.of(capitals[k].portal) != null) _Face(capitals[k], true),
        ],
    ];
  }

  @override
  Widget build(BuildContext context) {
    final steps = _steps;
    final f = steps[_k % steps.length];
    final portal = portals.where((p) => p.id == f.c.portal).firstOrNull;
    final still = MediaQuery.of(context).disableAnimations;
    return Material(
      color: Brand.green,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: portal == null
            ? null
            : () =>
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => PortalScreen(portal: portal))),
        child: SizedBox(
          height: 38,
          child: AnimatedSwitcher(
            duration: still ? Duration.zero : const Duration(milliseconds: 450),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, anim) => ClipRect(
              child: SlideTransition(
                position: Tween(begin: const Offset(0, .6), end: Offset.zero).animate(anim),
                child: FadeTransition(opacity: anim, child: child),
              ),
            ),
            layoutBuilder: (cur, prev) =>
                Stack(alignment: Alignment.center, children: [...prev, if (cur != null) cur]),
            child: KeyedSubtree(
              key: ValueKey('${f.c.portal}-${f.weather}'),
              child: _face(f),
            ),
          ),
        ),
      ),
    );
  }

  Widget _face(_Face f) {
    const city = TextStyle(color: Colors.white70, fontSize: 12.5);
    const big = TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600);
    final children = <Widget>[];
    if (!f.weather) {
      final diff = f.c.utcOffset - capitals.first.utcOffset;
      children.addAll([
        const Icon(Icons.schedule, size: 14, color: Colors.white60),
        const SizedBox(width: 5),
        Text(f.c.city, maxLines: 1, style: city),
        const SizedBox(width: 6),
        Text(hhmm(f.c.now), textDirection: TextDirection.ltr, style: big),
        if (diff != 0) ...[
          const SizedBox(width: 4),
          Text('${diff > 0 ? '+' : '−'}${diff.abs()}',
              textDirection: TextDirection.ltr, style: const TextStyle(color: Colors.white54, fontSize: 11)),
        ],
      ]);
    } else {
      final w = WeatherService.instance.of(f.c.portal)!;
      children.addAll([
        Icon(weatherIcon(w), size: 16, color: _tone(w)),
        const SizedBox(width: 5),
        Text(f.c.city, maxLines: 1, style: city),
        const SizedBox(width: 6),
        Text('${w.temp}°', style: big),
        const SizedBox(width: 5),
        Text(w.label, maxLines: 1, style: const TextStyle(color: Colors.white60, fontSize: 11)),
      ]);
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Row(mainAxisSize: MainAxisSize.min, children: children),
      ),
    );
  }
}
