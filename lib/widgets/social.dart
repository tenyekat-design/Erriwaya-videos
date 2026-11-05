import 'package:flutter/material.dart';

import '../models.dart';
import '../services/firebase_boot.dart';
import '../services/social_service.dart';
import '../theme.dart';

String _n(int n) => n >= 1000 ? '${(n / 1000).toStringAsFixed(n >= 10000 ? 0 : 1)} ألف' : '$n';

// ── الحركة ──

/// ظهور تدريجي من الأسفل عند أول بناء للعنصر.
class FadeSlideIn extends StatelessWidget {
  final Widget child;
  final int delayMs;
  const FadeSlideIn({super.key, required this.child, this.delayMs = 0});

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.of(context).disableAnimations) return child;
    final total = 420 + delayMs;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: total),
      curve: Interval(delayMs / total, 1, curve: Curves.easeOutCubic),
      builder: (context, t, c) => Opacity(
        opacity: t,
        child: Transform.translate(offset: Offset(0, (1 - t) * 18), child: c),
      ),
      child: child,
    );
  }
}

/// ينكمش العنصر قليلاً عند لمسه ثم يعود، دون أن يأخذ اللمسة من InkWell بداخله.
class PressScale extends StatefulWidget {
  final Widget child;
  const PressScale({super.key, required this.child});
  @override
  State<PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<PressScale> {
  bool _down = false;
  void _set(bool v) {
    if (_down != v) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) => Listener(
        onPointerDown: (_) => _set(true),
        onPointerUp: (_) => _set(false),
        onPointerCancel: (_) => _set(false),
        child: AnimatedScale(
          scale: _down ? 0.97 : 1,
          duration: const Duration(milliseconds: 140),
          curve: Curves.easeOut,
          child: widget.child,
        ),
      );
}

// ── التفاعلات ──

class ReactionsBar extends StatefulWidget {
  final String articleId;
  const ReactionsBar({super.key, required this.articleId});
  @override
  State<ReactionsBar> createState() => _ReactionsBarState();
}

class _ReactionsBarState extends State<ReactionsBar> {
  String? _popped;

  @override
  void initState() {
    super.initState();
    SocialService.instance.loadReactions(widget.articleId);
  }

  @override
  Widget build(BuildContext context) {
    final s = SocialService.instance;
    return ListenableBuilder(
      listenable: s,
      builder: (context, _) {
        final counts = s.reactionCounts(widget.articleId);
        final mine = s.myReaction(widget.articleId);
        final total = counts?.values.fold<int>(0, (a, b) => a + b) ?? 0;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Brand.green.withValues(alpha: 0.12)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text.rich(TextSpan(children: [
              TextSpan(
                  text: mine != null ? 'شكراً لتفاعلك' : 'ما رأيك في الخبر؟',
                  style: const TextStyle(fontSize: 16, color: Brand.ink, fontWeight: FontWeight.w600)),
              if (total > 0)
                TextSpan(
                    text: '  ·  ${_n(total)} تفاعل',
                    style: const TextStyle(fontSize: 14, color: Brand.muted)),
            ])),
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final r in reactionTypes)
                _ReactChip(
                  emoji: r.$3,
                  label: r.$2,
                  count: counts?[r.$1] ?? 0,
                  selected: mine == r.$1,
                  enabled: mine == null,
                  pop: _popped == r.$1,
                  onTap: () {
                    setState(() => _popped = r.$1);
                    s.react(widget.articleId, r.$1);
                  },
                ),
            ]),
          ]),
        );
      },
    );
  }
}

class _ReactChip extends StatelessWidget {
  final String emoji, label;
  final int count;
  final bool selected, enabled, pop;
  final VoidCallback onTap;
  const _ReactChip({
    required this.emoji,
    required this.label,
    required this.count,
    required this.selected,
    required this.enabled,
    required this.pop,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final fg = selected ? Colors.white : Brand.ink;
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: Opacity(
        opacity: enabled || selected ? 1 : 0.6,
        child: Material(
          color: selected ? Brand.green : Brand.green.withValues(alpha: 0.06),
          shape: StadiumBorder(
              side: BorderSide(color: selected ? Brand.green : Brand.green.withValues(alpha: 0.15))),
          child: InkWell(
            customBorder: const StadiumBorder(),
            onTap: enabled ? onTap : null,
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 44),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  pop
                      ? TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: 1),
                          duration: const Duration(milliseconds: 600),
                          builder: (_, t, c) {
                            final k = t < .35 ? 1 + t / .35 * .7 : t < .7 ? 1.7 - (t - .35) / .35 * .8 : .9 + (t - .7) / .3 * .1;
                            return Transform.scale(scale: k, child: c);
                          },
                          child: Text(emoji, style: const TextStyle(fontSize: 20)),
                        )
                      : Text(emoji, style: const TextStyle(fontSize: 20)),
                  if (count > 0) ...[
                    const SizedBox(width: 6),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 250),
                      transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                      child: Text(_n(count),
                          key: ValueKey(count), style: TextStyle(fontSize: 14, color: fg)),
                    ),
                  ],
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── التعليقات ──

class CommentsSection extends StatefulWidget {
  final String articleId;
  const CommentsSection({super.key, required this.articleId});
  @override
  State<CommentsSection> createState() => _CommentsSectionState();
}

class _CommentsSectionState extends State<CommentsSection> {
  final _name = TextEditingController();
  final _text = TextEditingController();
  late final Stream<List<ReaderComment>> _stream =
      SocialService.instance.approvedComments(widget.articleId);
  final List<(String, String)> _pending = [];
  bool _sending = false;
  String? _status;
  bool _err = false;

  @override
  void initState() {
    super.initState();
    _name.text = SocialService.instance.savedName;
  }

  @override
  void dispose() {
    _name.dispose();
    _text.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final name = _name.text.trim(), text = _text.text.trim();
    if (name.isEmpty || text.length < 2) {
      setState(() {
        _status = 'اكتب اسمك وتعليقك.';
        _err = true;
      });
      return;
    }
    setState(() {
      _sending = true;
      _status = 'جارٍ الإرسال…';
      _err = false;
    });
    try {
      await SocialService.instance.addComment(widget.articleId, name, text);
      _text.clear();
      FocusScope.of(context).unfocus();
      setState(() {
        _pending.add((name, text));
        _status = 'وصل تعليقك، وسيظهر بعد المراجعة. شكراً لك.';
      });
    } catch (_) {
      setState(() {
        _status = 'تعذّر الإرسال الآن. أعد المحاولة بعد قليل.';
        _err = true;
      });
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!FirebaseBoot.ready) return const SizedBox.shrink();
    return StreamBuilder<List<ReaderComment>>(
      stream: _stream,
      builder: (context, snap) {
        final list = snap.data ?? const <ReaderComment>[];
        final pend = _pending.where((p) => !list.any((c) => c.name == p.$1 && c.text == p.$2)).toList();
        return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            const Text('التعليقات', style: TextStyle(fontSize: 21, color: Brand.ink)),
            if (list.isNotEmpty)
              Text('  ${list.length}', style: const TextStyle(fontSize: 15, color: Brand.muted)),
          ]),
          const SizedBox(height: 10),
          if (!snap.hasData && !snap.hasError)
            const Text('جارٍ تحميل التعليقات…', style: TextStyle(color: Brand.muted))
          else if (list.isEmpty && pend.isEmpty)
            const Text('لا تعليقات بعد. كن أول من يعلّق.', style: TextStyle(color: Brand.muted)),
          for (final c in list) FadeSlideIn(child: _CommentTile(name: c.name, text: c.text, meta: timeAgo(c.time))),
          for (final p in pend)
            Opacity(opacity: .65, child: _CommentTile(name: p.$1, text: p.$2, meta: 'قيد المراجعة')),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Brand.green.withValues(alpha: 0.12)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              TextField(
                controller: _name,
                maxLength: 40,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                    labelText: 'اسمك', counterText: '', border: OutlineInputBorder(), isDense: true),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _text,
                maxLength: 600,
                minLines: 2,
                maxLines: 6,
                decoration: const InputDecoration(
                    labelText: 'اكتب تعليقك…', border: OutlineInputBorder(), isDense: true),
              ),
              Row(children: [
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: Text(
                      _status ?? 'تظهر التعليقات بعد مراجعة فريق الرواية.',
                      key: ValueKey(_status),
                      style: TextStyle(fontSize: 13, color: _err ? Brand.red : Brand.muted),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: _sending ? null : _send,
                  icon: const Icon(Icons.send_rounded, size: 18),
                  label: const Text('إرسال'),
                ),
              ]),
            ]),
          ),
        ]);
      },
    );
  }
}

class _CommentTile extends StatelessWidget {
  final String name, text, meta;
  const _CommentTile({required this.name, required this.text, required this.meta});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          CircleAvatar(
            radius: 19,
            backgroundColor: Brand.green,
            child: Text(name.trim().isEmpty ? '؟' : name.trim().characters.first,
                style: const TextStyle(color: Colors.white, fontSize: 16)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Flexible(
                    child: Text(name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 15, color: Brand.ink, fontWeight: FontWeight.w600))),
                const SizedBox(width: 8),
                Text(meta, style: const TextStyle(fontSize: 12, color: Brand.muted)),
              ]),
              const SizedBox(height: 2),
              Text(text, style: const TextStyle(fontSize: 15, height: 1.7, color: Brand.ink)),
            ]),
          ),
        ]),
      );
}

// ── استطلاع الرأي ──

class PollCard extends StatefulWidget {
  const PollCard({super.key});
  @override
  State<PollCard> createState() => _PollCardState();
}

class _PollCardState extends State<PollCard> {
  Poll? _poll;
  bool _grow = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final p = await SocialService.instance.activePoll();
      if (p == null || !mounted) return;
      await SocialService.instance.loadVotes(p);
      if (mounted) setState(() => _poll = p);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final p = _poll;
    if (p == null) return const SizedBox.shrink();
    final s = SocialService.instance;
    return ListenableBuilder(
      listenable: s,
      builder: (context, _) {
        final my = s.myVote(p.id);
        final ns = s.voteCounts(p.id) ?? List.filled(p.options.length, 0);
        final total = ns.fold<int>(0, (a, b) => a + b);
        return FadeSlideIn(
          child: Container(
            margin: const EdgeInsets.fromLTRB(12, 6, 12, 6),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  begin: Alignment.topRight, end: Alignment.bottomLeft, colors: [Brand.greenLight, Brand.green]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const Row(children: [
                Icon(Icons.bar_chart_rounded, color: Colors.white70, size: 18),
                SizedBox(width: 6),
                Text('استطلاع الرأي', style: TextStyle(color: Colors.white70, fontSize: 13)),
              ]),
              const SizedBox(height: 8),
              Text(p.question, style: const TextStyle(color: Colors.white, fontSize: 19, height: 1.5)),
              const SizedBox(height: 12),
              for (var i = 0; i < p.options.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: my == null
                      ? PressScale(
                          child: Material(
                            color: Colors.white.withValues(alpha: 0.1),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                                side: BorderSide(color: Colors.white.withValues(alpha: 0.25))),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(10),
                              onTap: () {
                                setState(() => _grow = false);
                                s.vote(p, i);
                                Future.delayed(const Duration(milliseconds: 40),
                                    () => mounted ? setState(() => _grow = true) : null);
                              },
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                                child: Text(p.options[i],
                                    style: const TextStyle(color: Colors.white, fontSize: 16)),
                              ),
                            ),
                          ),
                        )
                      : _ResultBar(
                          label: p.options[i],
                          pct: total == 0 ? 0 : ns[i] / total,
                          mine: my == i,
                          grow: _grow,
                        ),
                ),
              Text(my == null ? 'اختر إجابة لترى النتائج' : '${_n(total)} صوت',
                  style: const TextStyle(color: Colors.white70, fontSize: 13)),
            ]),
          ),
        );
      },
    );
  }
}

class _ResultBar extends StatelessWidget {
  final String label;
  final double pct;
  final bool mine, grow;
  const _ResultBar({required this.label, required this.pct, required this.mine, required this.grow});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          border: Border.all(color: mine ? Colors.white : Colors.white.withValues(alpha: 0.25)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Stack(children: [
          Positioned.fill(
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              child: AnimatedFractionallySizedBox(
                duration: const Duration(milliseconds: 900),
                curve: Curves.easeOutCubic,
                widthFactor: grow ? pct : 0,
                heightFactor: 1,
                child: Container(color: mine ? Brand.red : Colors.white.withValues(alpha: 0.2)),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            child: Row(children: [
              Expanded(
                child: Text(mine ? '$label  ·  اختيارك' : label,
                    style: const TextStyle(color: Colors.white, fontSize: 16)),
              ),
              Text('${(pct * 100).round()}%',
                  style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
            ]),
          ),
        ]),
      ),
    );
  }
}
