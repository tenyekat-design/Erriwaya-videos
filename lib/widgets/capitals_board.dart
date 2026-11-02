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

/// لوحة العواصم: الساعة في كل عاصمة وفارقها عن نواكشوط، وطقسها الآن والعظمى والصغرى.
class CapitalsBoard extends StatelessWidget {
  const CapitalsBoard({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([WeatherService.instance, minuteTick]),
      builder: (context, _) {
        final ws = WeatherService.instance;
        final nkc = ws.of('mr');
        return Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(children: [
                const Icon(Icons.schedule, size: 17, color: Brand.green),
                const SizedBox(width: 6),
                Expanded(
                  child: Text('نواكشوط | ${nouakchottNow()}${nkc != null ? ' | ${nkc.temp}°' : ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Brand.ink, fontSize: 14.5)),
                ),
              ]),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 150,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: capitals.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) => _CityCard(capitals[i], ws.of(capitals[i].portal)),
              ),
            ),
          ]),
        );
      },
    );
  }
}

class _CityCard extends StatelessWidget {
  final Capital c;
  final CityWeather? w;
  const _CityCard(this.c, this.w);

  @override
  Widget build(BuildContext context) {
    final diff = c.utcOffset - capitals.first.utcOffset;
    final portal = portals.where((p) => p.id == c.portal).firstOrNull;
    const white = TextStyle(color: Colors.white);
    return Material(
      color: Brand.green,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: portal == null
            ? null
            : () =>
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => PortalScreen(portal: portal))),
        // يتصغّر المحتوى إن كبّر المستخدم خط الهاتف، بدل أن يُقصّ
        child: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.topCenter,
          child: Container(
            width: 132,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
            child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(
                        child: Text(c.city,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: white.copyWith(fontSize: 15))),
                    if (diff != 0)
                      Text('${diff > 0 ? '+' : '−'}${diff.abs()}',
                          textDirection: TextDirection.ltr,
                          style: const TextStyle(color: Colors.white60, fontSize: 12)),
                  ]),
                  Text(hhmm(c.now),
                      textDirection: TextDirection.ltr,
                      style: white.copyWith(fontSize: 22, fontWeight: FontWeight.w600, height: 1.3)),
                  const SizedBox(height: 8),
                  if (w != null) ...[
                    Row(children: [
                      Icon(weatherIcon(w!), size: 20, color: _tone(w!)),
                      const SizedBox(width: 6),
                      Text('${w!.temp}°', style: white.copyWith(fontSize: 17)),
                      const SizedBox(width: 6),
                      Expanded(
                          child: Text(w!.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.white70, fontSize: 12))),
                    ]),
                    if (w!.max != null)
                      Text('العظمى ${w!.max}° · الصغرى ${w!.min}°',
                          maxLines: 1, style: const TextStyle(color: Colors.white60, fontSize: 11.5)),
                  ] else
                    const Text('الطقس غير متاح', style: TextStyle(color: Colors.white60, fontSize: 12)),
                ]),
          ),
        ),
      ),
    );
  }
}
