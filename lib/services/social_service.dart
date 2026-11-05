import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'firebase_boot.dart';

/// أنواع التفاعل (مطابقة للموقع ولقواعد الأمان في Firestore).
const reactionTypes = <(String, String, String)>[
  ('like', 'أعجبني', '👍'),
  ('love', 'أحببته', '❤️'),
  ('wow', 'مدهش', '😮'),
  ('sad', 'محزن', '😢'),
  ('angry', 'مستفز', '😠'),
];

class ReaderComment {
  final String id, articleId, name, text;
  final bool approved;
  final DateTime time;
  const ReaderComment(this.id, this.articleId, this.name, this.text, this.approved, this.time);

  factory ReaderComment.fromDoc(DocumentSnapshot<Map<String, dynamic>> d) {
    final m = d.data() ?? const {};
    final t = m['t'];
    return ReaderComment(d.id, '${m['a'] ?? ''}', '${m['name'] ?? ''}', '${m['text'] ?? ''}',
        m['ok'] == true, t is Timestamp ? t.toDate() : DateTime.now());
  }
}

class Poll {
  final String id, question;
  final List<String> options;
  final bool active;
  final DateTime time;
  const Poll(this.id, this.question, this.options, this.active, this.time);

  factory Poll.fromDoc(DocumentSnapshot<Map<String, dynamic>> d) {
    final m = d.data() ?? const {};
    final t = m['t'];
    return Poll(d.id, '${m['q'] ?? ''}', [for (final o in (m['options'] as List? ?? const [])) '$o'],
        m['active'] == true, t is Timestamp ? t.toDate() : DateTime.fromMillisecondsSinceEpoch(0));
  }
}

/// تفاعل القراء: التفاعلات والتعليقات والاستطلاعات، بلا تسجيل دخول.
/// لكل جهاز معرّف عشوائي (cid) يمنع تكرار التفاعل والتصويت: معرّف المستند = <الخبر أو الاستطلاع>_<cid>،
/// وقواعد الأمان لا تسمح إلا بإنشائه مرة واحدة. التعليقات لا تظهر إلا بعد موافقة المحرر.
class SocialService extends ChangeNotifier {
  SocialService._();
  static final instance = SocialService._();

  FirebaseFirestore get _db => FirebaseFirestore.instance;
  SharedPreferences? _prefs;
  String _cid = '';
  final Map<String, Map<String, int>> _reacts = {};
  final Map<String, List<int>> _votes = {};

  Future<void> _init() async {
    if (_prefs != null) return;
    _prefs = await SharedPreferences.getInstance();
    _cid = _prefs!.getString('social.cid') ?? '';
    if (!RegExp(r'^[0-9a-f]{16}$').hasMatch(_cid)) {
      final r = Random.secure();
      _cid = List.generate(8, (_) => r.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
      await _prefs!.setString('social.cid', _cid);
    }
  }

  // ── التفاعلات ──
  Map<String, int>? reactionCounts(String articleId) => _reacts[articleId];
  String? myReaction(String articleId) => _prefs?.getString('social.r.$articleId');

  Future<void> loadReactions(String articleId, {bool force = false}) async {
    await _init();
    if (!FirebaseBoot.ready || (!force && _reacts.containsKey(articleId))) return;
    try {
      final col = _db.collection('reactions').where('a', isEqualTo: articleId);
      final ns = await Future.wait(reactionTypes
          .map((r) => col.where('r', isEqualTo: r.$1).count().get().then((s) => s.count ?? 0)));
      _reacts[articleId] = {for (var i = 0; i < reactionTypes.length; i++) reactionTypes[i].$1: ns[i]};
      notifyListeners();
    } catch (e) {
      debugPrint('reactions: $e');
    }
  }

  Future<void> react(String articleId, String type) async {
    await _init();
    if (myReaction(articleId) != null) return;
    await _prefs!.setString('social.r.$articleId', type);
    final m = _reacts.putIfAbsent(articleId, () => {for (final r in reactionTypes) r.$1: 0});
    m[type] = (m[type] ?? 0) + 1;
    notifyListeners();
    if (!FirebaseBoot.ready) return;
    try {
      await _db.collection('reactions').doc('${articleId}_$_cid').set(
          {'a': articleId, 'r': type, 't': FieldValue.serverTimestamp()});
    } catch (e) {
      debugPrint('react: $e');
    }
  }

  // ── التعليقات ──
  Stream<List<ReaderComment>> approvedComments(String articleId) => _db
      .collection('comments')
      .where('a', isEqualTo: articleId)
      .where('ok', isEqualTo: true)
      .limit(100)
      .snapshots()
      .map((s) => s.docs.map(ReaderComment.fromDoc).toList()..sort((x, y) => x.time.compareTo(y.time)));

  String get savedName => _prefs?.getString('social.name') ?? '';

  Future<void> addComment(String articleId, String name, String text) async {
    await _init();
    await _db.collection('comments').add({
      'a': articleId,
      'name': name.trim().substring(0, min(40, name.trim().length)),
      'text': text.trim().substring(0, min(600, text.trim().length)),
      'ok': false,
      't': FieldValue.serverTimestamp(),
    });
    await _prefs!.setString('social.name', name.trim());
  }

  /// للمحرر: التعليقات التي تنتظر المراجعة (والأحدث أولاً).
  Stream<List<ReaderComment>> pendingComments() => _db
      .collection('comments')
      .where('ok', isEqualTo: false)
      .limit(200)
      .snapshots()
      .map((s) => s.docs.map(ReaderComment.fromDoc).toList()..sort((x, y) => y.time.compareTo(x.time)));

  /// للمحرر: آخر التعليقات المنشورة.
  Stream<List<ReaderComment>> publishedComments() => _db
      .collection('comments')
      .where('ok', isEqualTo: true)
      .limit(200)
      .snapshots()
      .map((s) => s.docs.map(ReaderComment.fromDoc).toList()..sort((x, y) => y.time.compareTo(x.time)));

  Future<void> approve(String id) => _db.collection('comments').doc(id).update({'ok': true});
  Future<void> deleteComment(String id) => _db.collection('comments').doc(id).delete();

  // ── الاستطلاعات ──
  Future<Poll?> activePoll() async {
    await _init();
    if (!FirebaseBoot.ready) return null;
    final s = await _db.collection('polls').where('active', isEqualTo: true).limit(5).get();
    final ps = s.docs.map(Poll.fromDoc).where((p) => p.options.length >= 2).toList()
      ..sort((x, y) => y.time.compareTo(x.time));
    return ps.isEmpty ? null : ps.first;
  }

  int? myVote(String pollId) => _prefs?.getInt('social.v.$pollId');
  List<int>? voteCounts(String pollId) => _votes[pollId];

  Future<void> loadVotes(Poll p) async {
    await _init();
    try {
      final col = _db.collection('votes').where('p', isEqualTo: p.id);
      _votes[p.id] = await Future.wait([
        for (var i = 0; i < p.options.length; i++)
          col.where('o', isEqualTo: i).count().get().then((s) => s.count ?? 0)
      ]);
      notifyListeners();
    } catch (e) {
      debugPrint('votes: $e');
    }
  }

  Future<void> vote(Poll p, int option) async {
    await _init();
    if (myVote(p.id) != null) return;
    await _prefs!.setInt('social.v.${p.id}', option);
    final v = _votes.putIfAbsent(p.id, () => List.filled(p.options.length, 0));
    v[option]++;
    notifyListeners();
    try {
      await _db.collection('votes').doc('${p.id}_$_cid').set(
          {'p': p.id, 'o': option, 't': FieldValue.serverTimestamp()});
    } catch (e) {
      debugPrint('vote: $e');
    }
  }

  /// للمحرر: كل الاستطلاعات.
  Stream<List<Poll>> allPolls() => _db.collection('polls').snapshots().map(
      (s) => s.docs.map(Poll.fromDoc).toList()..sort((x, y) => y.time.compareTo(x.time)));

  Future<void> createPoll(String question, List<String> options) async {
    // استطلاع واحد مفتوح في كل مرة: يُغلق ما قبله
    final open = await _db.collection('polls').where('active', isEqualTo: true).get();
    final b = _db.batch();
    for (final d in open.docs) {
      b.update(d.reference, {'active': false});
    }
    b.set(_db.collection('polls').doc(), {
      'q': question.trim(),
      'options': options.map((o) => o.trim()).where((o) => o.isNotEmpty).toList(),
      'active': true,
      't': FieldValue.serverTimestamp(),
    });
    await b.commit();
  }

  Future<void> setPollActive(String id, bool active) =>
      _db.collection('polls').doc(id).update({'active': active});
  Future<void> deletePoll(String id) => _db.collection('polls').doc(id).delete();
}
