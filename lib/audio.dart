import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'data.dart';

/// قارئ ومصحفه الصوتي من mp3quran.net (سور كاملة).
class Reciter {
  const Reciter(this.id, this.name, this.moshaf, this.server, this.surahs);
  final int id; // معرّف المصحف الصوتي
  final String name;
  final String moshaf;
  final String server;
  final Set<int> surahs;
  String urlFor(int surah) => '$server${surah.toString().padLeft(3, '0')}.mp3';

  Map<String, Object> toJson() =>
      {'id': id, 'name': name, 'moshaf': moshaf, 'server': server, 'surahs': surahs.toList()};
  static Reciter fromJson(Map j) =>
      Reciter(j['id'], j['name'], j['moshaf'], j['server'], Set<int>.from(j['surahs']));
}

/// تشغيل التلاوة: سورة كاملة بصوت قارئ من الرواية المختارة، أو آية واحدة (حفص) بصوت العفاسي.
class Audio extends ChangeNotifier {
  Audio._() {
    player.playerStateStream.listen((_) => notifyListeners());
  }
  static final Audio instance = Audio._();

  final player = AudioPlayer();
  final Map<Riwaya, List<Reciter>> reciters = {};
  String? error;
  bool loadingList = false;

  // ما يُشغَّل الآن
  Riwaya? riwaya;
  int? surah;
  Reciter? reciter;
  int? ayah; // عند تشغيل آية واحدة

  bool get playing => player.playing;
  bool get active => surah != null;
  bool get buffering =>
      player.processingState == ProcessingState.loading || player.processingState == ProcessingState.buffering;

  /// قائمة القرّاء لكل رواية، من واجهة mp3quran (وتُحفظ للمرة القادمة).
  Future<List<Reciter>> load(Riwaya r) async {
    if (reciters[r]?.isNotEmpty == true) return reciters[r]!;
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString('reciters_v1');
    if (cached != null) {
      _fill(jsonDecode(cached) as Map);
      if (reciters[r]?.isNotEmpty == true) {
        _refresh(prefs); // تحديث في الخلفية
        return reciters[r]!;
      }
    }
    await _refresh(prefs);
    return reciters[r] ?? const [];
  }

  Future<void> _refresh(SharedPreferences prefs) async {
    loadingList = true;
    notifyListeners();
    try {
      final res = await http
          .get(Uri.parse('https://mp3quran.net/api/v3/reciters?language=ar'))
          .timeout(const Duration(seconds: 20));
      if (res.statusCode != 200) throw 'HTTP ${res.statusCode}';
      final list = (jsonDecode(utf8.decode(res.bodyBytes)) as Map)['reciters'] as List;
      final out = {'hafs': <Map>[], 'warsh': <Map>[]};
      for (final rc in list) {
        for (final m in (rc['moshaf'] as List? ?? const [])) {
          final name = (m['name'] ?? '').toString();
          final key = name.contains('ورش')
              ? 'warsh'
              : (name.contains('حفص') && name.contains('مرتل'))
                  ? 'hafs'
                  : null;
          if (key == null) continue;
          final surahs = (m['surah_list'] ?? '')
              .toString()
              .split(',')
              .map((s) => int.tryParse(s.trim()))
              .whereType<int>()
              .toList();
          out[key]!.add(Reciter(m['id'], rc['name'].toString().trim(), name, m['server'].toString(), surahs.toSet())
              .toJson());
        }
      }
      for (final l in out.values) {
        l.sort((a, b) => (b['surahs'] as List).length.compareTo((a['surahs'] as List).length));
      }
      await prefs.setString('reciters_v1', jsonEncode(out));
      _fill(out);
      error = null;
    } catch (e) {
      if (reciters.values.every((l) => l.isEmpty)) error = 'تعذّر تحميل قائمة القرّاء. تأكد من اتصالك بالإنترنت.';
    }
    loadingList = false;
    notifyListeners();
  }

  void _fill(Map j) {
    for (final r in Riwaya.values) {
      reciters[r] = [for (final x in (j[r.name] as List? ?? const [])) Reciter.fromJson(x as Map)];
    }
  }

  /// القارئ الافتراضي: المحفوظ، وإلا العفاسي لحفص، وإلا أول قارئ يتلو السورة كاملة.
  Reciter? pick(Riwaya r, int? savedId, int surah) {
    final list = reciters[r] ?? const [];
    final have = list.where((x) => x.surahs.contains(surah)).toList();
    if (have.isEmpty) return null;
    return have.firstWhere((x) => x.id == savedId,
        orElse: () => r == Riwaya.hafs
            ? have.firstWhere((x) => x.name.contains('العفاسي'), orElse: () => have.first)
            : have.first);
  }

  Future<void> playSurah(Riwaya r, int s, Reciter rc) async {
    riwaya = r;
    surah = s;
    reciter = rc;
    ayah = null;
    error = null;
    notifyListeners();
    try {
      await player.setUrl(rc.urlFor(s));
      player.play();
    } catch (_) {
      error = 'تعذّر تشغيل التلاوة. تأكد من اتصالك بالإنترنت.';
      notifyListeners();
    }
  }

  /// آية واحدة بعدّ حفص (EveryAyah: مشاري العفاسي).
  Future<void> playAyah(int s, int a) async {
    riwaya = Riwaya.hafs;
    surah = s;
    ayah = a;
    reciter = null;
    error = null;
    notifyListeners();
    final f = '${s.toString().padLeft(3, '0')}${a.toString().padLeft(3, '0')}';
    try {
      await player.setUrl('https://everyayah.com/data/Alafasy_128kbps/$f.mp3');
      player.play();
    } catch (_) {
      error = 'تعذّر تشغيل الآية. تأكد من اتصالك بالإنترنت.';
      notifyListeners();
    }
  }

  void toggle() => player.playing ? player.pause() : player.play();

  Future<void> stop() async {
    await player.stop();
    surah = null;
    ayah = null;
    reciter = null;
    notifyListeners();
  }
}
