import 'package:flutter/foundation.dart';

import '../models.dart';
import 'youtube_service.dart';

class VideosController extends ChangeNotifier {
  VideosController._();
  static final instance = VideosController._();

  final _yt = YoutubeService();
  List<VideoItem> items = [];
  bool loading = false;
  String? error;

  Future<void> start() async {
    items = await _yt.cached();
    notifyListeners();
    await refresh();
  }

  Future<void> refresh() async {
    if (loading) return;
    loading = true;
    error = null;
    notifyListeners();
    try {
      items = await _yt.fetch();
    } catch (e) {
      error = 'تعذر تحميل الجديد. تحقق من الاتصال بالإنترنت.';
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}
