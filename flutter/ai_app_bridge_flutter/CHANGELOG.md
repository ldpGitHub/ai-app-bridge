# Changelog

## 0.1.5

- Automatically includes the Android debug runtime from the Flutter plugin's Android debug variant.
- Lowers the Android runtime minimum SDK to 21.
- Broadens the package SDK constraint to Dart 3.0+ / Flutter 3.10+.
- Documents that Flutter apps should call `WidgetsFlutterBinding.ensureInitialized()` before bridge initialization.

## 0.1.4

- Aligns the Flutter package version with the Android bridge and desktop CLI 0.1.4 release.
- Updates package metadata for the public 0.1.4 release.

## 0.1.0

- Initial Flutter plugin release for AI App Bridge.
- Adds widget snapshot, runtime action, log, network, state, event, and H5 adapter bridge APIs.
