import 'dart:async';
import 'package:flutter/material.dart';
import '../data.dart';
import '../settings.dart';
import 'home_screen.dart';

/// البحث في آيات القرآن (بلا حاجة إلى كتابة التشكيل أو الهمزات).
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _c = TextEditingController();
  Timer? _t;
  List<Ayah> _res = const [];
  String _q = '';

  void _onChanged(String v) {
    _t?.cancel();
    _t = Timer(const Duration(milliseconds: 250), () {
      setState(() {
        _q = v;
        _res = Quran.instance.search(v);
      });
    });
  }

  @override
  void dispose() {
    _t?.cancel();
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = Quran.instance;
    final r = Settings.instance.riwaya;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _c,
          autofocus: true,
          onChanged: _onChanged,
          cursorColor: Colors.white,
          style: const TextStyle(color: Colors.white, fontSize: 18),
          decoration: const InputDecoration(
            hintText: 'ابحث في القرآن…',
            hintStyle: TextStyle(color: Colors.white70),
            border: InputBorder.none,
          ),
        ),
        actions: [
          if (_c.text.isNotEmpty)
            IconButton(
              tooltip: 'مسح',
              icon: const Icon(Icons.close),
              onPressed: () {
                _c.clear();
                _onChanged('');
              },
            ),
        ],
      ),
      body: _q.trim().length < 2
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Text('اكتب كلمتين أو جزءاً من آية، مثل: الصبر، أو: وما توفيقي إلا بالله',
                    textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: scheme.onSurfaceVariant)),
              ),
            )
          : _res.isEmpty
              ? const Center(child: Text('لا نتائج', style: TextStyle(fontSize: 17)))
              : ListView.separated(
                  itemCount: _res.length + 1,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    if (i == 0) {
                      return Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                        child: Text(
                            '${ar(_res.length)}${_res.length >= 300 ? '+' : ''} نتيجة · تُفتح في رواية ${r.label}',
                            style: TextStyle(color: scheme.onSurfaceVariant)),
                      );
                    }
                    final h = _res[i - 1];
                    final a = q.locate(r, h.surah, h.number);
                    return ListTile(
                      title: Text(a.text,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontFamily: r.font, fontSize: 20, height: 1.9)),
                      subtitle: Text('سورة ${q.surah(a.surah).name} · آية ${ar(a.number)} · ص ${ar(a.page)}',
                          style: TextStyle(color: scheme.primary)),
                      onTap: () => HomeScreen.openPage(context, a.page, focus: a),
                    );
                  },
                ),
    );
  }
}
