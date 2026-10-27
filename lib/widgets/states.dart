import 'package:flutter/material.dart';

import '../theme.dart';

class LoadingState extends StatelessWidget {
  const LoadingState({super.key});
  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: Brand.green));
}

class ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const ErrorState({super.key, required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.wifi_off_rounded, size: 48, color: Brand.muted),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Brand.muted)),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('إعادة المحاولة'),
            ),
          ]),
        ),
      );
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String text;
  const EmptyState({super.key, required this.icon, required this.text});
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 48, color: Brand.muted),
            const SizedBox(height: 12),
            Text(text, textAlign: TextAlign.center, style: const TextStyle(color: Brand.muted)),
          ]),
        ),
      );
}

class OfflineNote extends StatelessWidget {
  final String message;
  const OfflineNote({super.key, required this.message});
  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 10),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF4E5),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          const Icon(Icons.cloud_off, size: 18, color: Color(0xFF9A6200)),
          const SizedBox(width: 8),
          Expanded(
              child: Text(message,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF9A6200)))),
        ]),
      );
}
