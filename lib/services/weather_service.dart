import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// عاصمة في لوحة «العواصم» (كما في الموقع): البوابة، المدينة، فارق التوقيت عن غرينتش، الإحداثيات.
/// كل هذه الدول بلا توقيت صيفي، والمغرب (والعيون) على غرينتش.
class Capital {
  final String portal;
  final String city;
  final int utcOffset;
  final double lat, lon;
  const Capital(this.portal, this.city, this.utcOffset, this.lat, this.lon);

  DateTime get now => DateTime.now().toUtc().add(Duration(hours: utcOffset));
}

const capitals = <Capital>[
  Capital('mr', 'نواكشوط', 0, 18.0735, -15.9582),
  Capital('ma', 'الرباط', 0, 34.0209, -6.8416),
  Capital('dz', 'الجزائر', 1, 36.7538, 3.0588),
  Capital('tn', 'تونس', 1, 36.8065, 10.1815),
  Capital('ly', 'طرابلس', 2, 32.8872, 13.1913),
  Capital('eh', 'العيون', 0, 27.1536, -13.2033),
  Capital('sn', 'داكار', 0, 14.7167, -17.4677),
  Capital('ml', 'باماكو', 0, 12.6392, -8.0029),
  Capital('ne', 'نيامي', 1, 13.5116, 2.1254),
  Capital('td', 'انجامينا', 1, 12.1348, 15.0557),
  Capital('gm', 'بانجول', 0, 13.4549, -16.5790),
];

class CityWeather {
  final String portal;
  final int temp, wmo, wind;
  final bool day;
  final int? hum, max, min;
  const CityWeather(this.portal, this.temp, this.wmo, this.day, this.wind, this.hum, this.max, this.min);

  Map<String, dynamic> toJson() =>
      {'p': portal, 't': temp, 'w': wmo, 'd': day, 'wi': wind, 'h': hum, 'mx': max, 'mn': min};
  factory CityWeather.fromJson(Map<String, dynamic> j) => CityWeather(j['p'], j['t'], j['w'], j['d'],
      j['wi'] ?? 0, j['h'], j['mx'], j['mn']);

  /// الوصف بالعربية (نفس تصنيف الموقع).
  String get label {
    final c = wmo;
    if (c <= 1) return c == 0 ? (day ? 'مشمس' : 'صافٍ') : (day ? 'مشمس غالباً' : 'صافٍ غالباً');
    if (c == 2) return 'غائم جزئياً';
    if (c == 3) return 'غائم';
    if (c == 45 || c == 48) return 'ضباب';
    if (c >= 51 && c <= 57) return 'رذاذ';
    if (c == 61 || c == 80) return 'أمطار خفيفة';
    if (c == 65 || c == 82) return 'أمطار غزيرة';
    if ((c >= 61 && c <= 67) || c == 81) return 'أمطار';
    if ((c >= 71 && c <= 77) || c == 85 || c == 86) return 'ثلوج';
    if (c >= 95) return c == 95 ? 'عاصفة رعدية' : 'عاصفة رعدية وبرَد';
    return '—';
  }
}

/// طقس العواصم من Open-Meteo (المصدر نفسه الذي يستعمله الموقع)، يُحدَّث كل نصف ساعة.
class WeatherService extends ChangeNotifier {
  WeatherService._();
  static final instance = WeatherService._();
  static const _kCache = 'weather_cache';
  static const _maxAge = Duration(hours: 3); // لا نعرض طقساً أقدم من 3 ساعات، كما في الموقع

  Map<String, CityWeather> cities = {};
  DateTime? updated;
  Timer? _timer;

  bool get fresh => updated != null && DateTime.now().difference(updated!) < _maxAge;
  CityWeather? of(String portal) => fresh ? cities[portal] : null;

  Future<void> start() async {
    try {
      final p = await SharedPreferences.getInstance();
      final raw = p.getString(_kCache);
      if (raw != null) {
        final j = jsonDecode(raw) as Map<String, dynamic>;
        updated = DateTime.parse(j['u']);
        cities = {
          for (final c in (j['c'] as List)) (c['p'] as String): CityWeather.fromJson(Map<String, dynamic>.from(c))
        };
        notifyListeners();
      }
    } catch (_) {}
    refresh();
    _timer ??= Timer.periodic(const Duration(minutes: 30), (_) => refresh());
  }

  Future<void> refresh() async {
    try {
      final q = 'latitude=${capitals.map((c) => c.lat).join(',')}'
          '&longitude=${capitals.map((c) => c.lon).join(',')}'
          '&current=temperature_2m,weather_code,is_day,wind_speed_10m,relative_humidity_2m'
          '&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1';
      final r = await http
          .get(Uri.parse('https://api.open-meteo.com/v1/forecast?$q'))
          .timeout(const Duration(seconds: 15));
      if (r.statusCode != 200) return;
      var raw = jsonDecode(r.body);
      if (raw is Map) raw = [raw];
      final list = raw as List;
      final out = <String, CityWeather>{};
      for (var i = 0; i < capitals.length && i < list.length; i++) {
        final w = list[i] as Map;
        final cur = w['current'] as Map;
        final d = (w['daily'] ?? const {}) as Map;
        int? first(String k) {
          final v = d[k];
          return v is List && v.isNotEmpty && v.first != null ? (v.first as num).round() : null;
        }

        out[capitals[i].portal] = CityWeather(
          capitals[i].portal,
          (cur['temperature_2m'] as num).round(),
          (cur['weather_code'] as num).toInt(),
          (cur['is_day'] ?? 1) == 1,
          ((cur['wind_speed_10m'] ?? 0) as num).round(),
          (cur['relative_humidity_2m'] as num?)?.round(),
          first('temperature_2m_max'),
          first('temperature_2m_min'),
        );
      }
      if (out.isEmpty) return;
      cities = out;
      updated = DateTime.now();
      notifyListeners();
      final p = await SharedPreferences.getInstance();
      await p.setString(_kCache,
          jsonEncode({'u': updated!.toIso8601String(), 'c': out.values.map((c) => c.toJson()).toList()}));
    } catch (_) {}
  }
}
