import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../theme.dart';
import 'admin_screen.dart';

/// يفتح لوحة التحرير مباشرة إن كان المحرر مسجلاً، وإلا شاشة الدخول.
Route<void> editorRoute() {
  final signedIn = FirebaseAuth.instance.currentUser != null;
  return MaterialPageRoute(
    builder: (_) => signedIn ? const AdminScreen() : const LoginScreen(),
  );
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _pass = TextEditingController();
  bool _busy = false;
  bool _showPass = false;
  bool _remember = true;
  String? _error;

  static const _store = FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true));

  @override
  void initState() {
    super.initState();
    _loadSaved();
  }

  Future<void> _loadSaved() async {
    try {
      final email = await _store.read(key: 'editor_email');
      final pass = await _store.read(key: 'editor_pass');
      if (!mounted) return;
      setState(() {
        if (email != null) _email.text = email;
        if (pass != null) _pass.text = pass;
      });
    } catch (_) {}
  }

  Future<void> _saveOrClear() async {
    try {
      if (_remember) {
        await _store.write(key: 'editor_email', value: _email.text.trim());
        await _store.write(key: 'editor_pass', value: _pass.text);
      } else {
        await _store.delete(key: 'editor_email');
        await _store.delete(key: 'editor_pass');
      }
    } catch (_) {}
  }

  Future<void> _login() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
          email: _email.text.trim(), password: _pass.text);
      await _saveOrClear();
      TextInput.finishAutofillContext();
      if (!mounted) return;
      Navigator.of(context)
          .pushReplacement(MaterialPageRoute(builder: (_) => const AdminScreen()));
    } on FirebaseAuthException catch (e) {
      setState(() => _error = switch (e.code) {
            'invalid-credential' || 'wrong-password' || 'user-not-found' =>
              'البريد أو كلمة السر غير صحيحة.',
            'invalid-email' => 'صيغة البريد غير صحيحة.',
            'too-many-requests' => 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.',
            'network-request-failed' => 'لا يوجد اتصال بالإنترنت.',
            _ => 'تعذر الدخول (${e.code}).',
          });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('دخول المحرر')),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        const SizedBox(height: 12),
        Center(
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: const BoxDecoration(color: Brand.green, shape: BoxShape.circle),
            child: Image.asset('assets/images/logo_white.png', height: 70),
          ),
        ),
        const SizedBox(height: 24),
        AutofillGroup(
          child: Column(children: [
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              textDirection: TextDirection.ltr,
              autofillHints: const [AutofillHints.email, AutofillHints.username],
              decoration: const InputDecoration(
                  labelText: 'البريد الإلكتروني', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _pass,
              obscureText: !_showPass,
              enableSuggestions: false,
              autocorrect: false,
              textDirection: TextDirection.ltr,
              autofillHints: const [AutofillHints.password],
              onSubmitted: (_) => _login(),
              decoration: InputDecoration(
                labelText: 'كلمة السر',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  tooltip: _showPass ? 'إخفاء كلمة السر' : 'إظهار كلمة السر',
                  icon: Icon(_showPass ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _showPass = !_showPass),
                ),
              ),
            ),
          ]),
        ),
        CheckboxListTile(
          value: _remember,
          onChanged: (v) => setState(() => _remember = v ?? false),
          title: const Text('حفظ البريد وكلمة السر'),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          activeColor: Brand.green,
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: Brand.red)),
        ],
        const SizedBox(height: 20),
        FilledButton(
          onPressed: _busy ? null : _login,
          style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
          child: _busy
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('دخول', style: TextStyle(fontSize: 17)),
        ),
      ]),
    );
  }
}
