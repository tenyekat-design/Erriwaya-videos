import 'package:flutter/material.dart';

class Brand {
  static const green = Color(0xFF004A49);
  static const greenDeep = Color(0xFF00302F);
  static const red = Color(0xFFC8102E);
  static const gold = Color(0xFFB08D3C); // لون إطارات السور والزخارف
  static const ui = 'AlQuds';
}

/// ألوان صفحة المصحف: ورق فاتح دافئ نهاراً، وداكن هادئ ليلاً.
class PageColors {
  const PageColors(this.paper, this.ink, this.frame, this.muted, this.highlight);
  final Color paper, ink, frame, muted, highlight; // frame: لون الطين لإطارات السور وخطوط اللوحة
  static const light = PageColors(Color(0xFFFBF7EC), Color(0xFF1B1A17), Color(0xFF9A4426), Color(0xFF6E6656), Color(0x3326A69A));
  static const dark = PageColors(Color(0xFF111A19), Color(0xFFE9E3D2), Color(0xFFD48A62), Color(0xFF9AA7A3), Color(0x4426A69A));
  static PageColors of(BuildContext c) => Theme.of(c).brightness == Brightness.dark ? dark : light;
}

ThemeData buildTheme(Brightness b) {
  final dark = b == Brightness.dark;
  final scheme = ColorScheme.fromSeed(seedColor: Brand.green, brightness: b, primary: dark ? const Color(0xFF6CC5C0) : Brand.green);
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    fontFamily: Brand.ui,
    scaffoldBackgroundColor: dark ? const Color(0xFF0B1413) : const Color(0xFFF4F6F5),
    appBarTheme: const AppBarTheme(
      backgroundColor: Brand.green,
      foregroundColor: Colors.white,
      centerTitle: true,
      titleTextStyle: TextStyle(fontFamily: Brand.ui, fontSize: 21, color: Colors.white),
    ),
    tabBarTheme: const TabBarThemeData(
      labelColor: Colors.white,
      unselectedLabelColor: Color(0xB3FFFFFF),
      indicatorColor: Colors.white,
      labelStyle: TextStyle(fontFamily: Brand.ui, fontSize: 17),
    ),
  );
}
