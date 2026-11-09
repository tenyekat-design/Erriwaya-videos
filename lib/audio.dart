import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:path_provider/path_provider.dart';
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
      final f = await fileFor(rc, s);
      if (await f.exists()) {
        await player.setFilePath(f.path);
      } else {
        await player.setUrl(rc.urlFor(s));
      }
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

  // ── التحميل للاستماع دون إنترنت ──
  final Map<String, double> progress = {}; // مفتاح القارئ/السورة → 0..1 أثناء التحميل
  final Set<String> _done = {};
  static String key(Reciter rc, int s) => '${rc.id}/$s';

  Future<Directory> _dir() async {
    final d = Directory('${(await getApplicationDocumentsDirectory()).path}/recitations');
    if (!await d.exists()) await d.create(recursive: true);
    return d;
  }

  Future<File> fileFor(Reciter rc, int s) async =>
      File('${(await _dir()).path}/${rc.id}_${s.toString().padLeft(3, '0')}.mp3');

  bool isDownloaded(Reciter rc, int s) => _done.contains(key(rc, s));

  /// يقرأ ما حُمّل من قبل (يُستدعى عند فتح قائمة القرّاء).
  Future<void> scanDownloads() async {
    final d = await _dir();
    _done.clear();
    await for (final e in d.list()) {
      final m = RegExp(r'(\d+)_(\d{3})\.mp3$').firstMatch(e.path);
      if (m != null) _done.add('${int.parse(m[1]!)}/${int.parse(m[2]!)}');
    }
    notifyListeners();
  }

  Future<void> download(Reciter rc, int s) async {
    final k = key(rc, s);
    if (progress.containsKey(k) || _done.contains(k)) return;
    progress[k] = 0;
    notifyListeners();
    final f = await fileFor(rc, s);
    final tmp = File('${f.path}.part');
    final client = http.Client();
    try {
      final res = await client.send(http.Request('GET', Uri.parse(rc.urlFor(s))));
      if (res.statusCode != 200) throw 'HTTP ${res.statusCode}';
      final total = res.contentLength ?? 0;
      final sink = tmp.openWrite();
      var got = 0;
      var last = DateTime.now();
      await for (final chunk in res.stream) {
        sink.add(chunk);
        got += chunk.length;
        if (total > 0 && DateTime.now().difference(last).inMilliseconds > 250) {
          progress[k] = got / total;
          last = DateTime.now();
          notifyListeners();
        }
      }
      await sink.close();
      await tmp.rename(f.path);
      _done.add(k);
      error = null;
    } catch (_) {
      if (await tmp.exists()) await tmp.delete();
      error = 'تعذّر تحميل التلاوة. تأكد من اتصالك بالإنترنت.';
    } finally {
      client.close();
      progress.remove(k);
      notifyListeners();
    }
  }

  /// حجم التلاوات المحمّلة بالميغابايت، وحذفها.
  Future<double> downloadedMb() async {
    var n = 0;
    await for (final e in (await _dir()).list()) {
      if (e is File) n += await e.length();
    }
    return n / (1024 * 1024);
  }

  Future<void> deleteDownloads() async {
    final d = await _dir();
    await for (final e in d.list()) {
      await e.delete();
    }
    _done.clear();
    notifyListeners();
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
