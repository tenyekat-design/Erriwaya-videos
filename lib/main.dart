import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'data.dart';
import 'settings.dart';
import 'theme.dart';
import 'screens/home_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Settings.instance.load();
  runApp(const MushafApp());
}

class MushafApp extends StatelessWidget {
  const MushafApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Settings.instance,
      builder: (context, _) => MaterialApp(
        title: 'مصحف الرواية',
        debugShowCheckedModeBanner: false,
        locale: const Locale('ar'),
        supportedLocales: const [Locale('ar')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: buildTheme(Brightness.light),
        darkTheme: buildTheme(Brightness.dark),
        themeMode: Settings.instance.themeMode,
        home: const _Boot(),
      ),
    );
  }
}

/// شاشة البدء: شعار الرواية على الأخضر حتى تُحمَّل بيانات المصحف.
class _Boot extends StatefulWidget {
  const _Boot();
  @override
  State<_Boot> createState() => _BootState();
}

class _BootState extends State<_Boot> {
  late final Future<void> _f = Quran.instance.load();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: _f,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.done && !snap.hasError) return const HomeScreen();
        return Scaffold(
          backgroundColor: Brand.green,
          body: Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Image.asset('assets/images/logo_white.png', height: 110),
              const SizedBox(height: 18),
              const Text('مصحف الرواية', style: TextStyle(color: Colors.white, fontSize: 26)),
              const SizedBox(height: 24),
              if (snap.hasError)
                Text('تعذّر فتح المصحف: ${snap.error}', style: const TextStyle(color: Colors.white70))
              else
                const SizedBox(width: 26, height: 26, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5)),
            ]),
          ),
        );
      },
    );
  }
}
