import 'package:flutter/material.dart';

class Brand {
  static const green = Color(0xFF004A49);
  static const greenDark = Color(0xFF00302F);
  static const greenLight = Color(0xFF0B6B69);
  static const red = Color(0xFFC8102E);
  static const paper = Color(0xFFF4F6F5);
  static const ink = Color(0xFF13201F);
  static const muted = Color(0xFF66706F);
  static const font = 'AlQuds';
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.green,
    primary: Brand.green,
    secondary: Brand.greenLight,
    error: Brand.red,
    surface: Colors.white,
  );
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    fontFamily: Brand.font,
    scaffoldBackgroundColor: Brand.paper,
  );
  return base.copyWith(
    appBarTheme: const AppBarTheme(
      backgroundColor: Brand.green,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(fontFamily: Brand.font, fontSize: 20, color: Colors.white),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: Brand.green.withValues(alpha: 0.12),
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontFamily: Brand.font, fontSize: 12, color: Brand.ink),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      labelStyle: const TextStyle(fontFamily: Brand.font, fontSize: 14),
      side: BorderSide(color: Brand.green.withValues(alpha: 0.2)),
    ),
    cardTheme: const CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(14))),
    ),
  );
}
