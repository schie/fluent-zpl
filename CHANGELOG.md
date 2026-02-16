# Changelog

## [0.12.0](https://github.com/schie/fluent-zpl/compare/v0.11.2...v0.12.0) (2026-02-16)


### Features

* **label:** adding `.barcodeCentered(...)` ([263f7e8](https://github.com/schie/fluent-zpl/commit/263f7e8047d79e01f6d6c92e93555b48105b6b8a))

## [0.11.2](https://github.com/schie/fluent-zpl/compare/v0.11.1...v0.11.2) (2026-01-06)


### Bug Fixes

* **printer-config:** clamping print, slew, and backfeed speed between 1 and 14 ([13c75a7](https://github.com/schie/fluent-zpl/commit/13c75a703c0cc3b982015cbec97d3a44ab102dd3))

## [0.11.1](https://github.com/schie/fluent-zpl/compare/v0.11.0...v0.11.1) (2025-12-11)


### Bug Fixes

* **index:** exporting `Code128Mode` ([9612a36](https://github.com/schie/fluent-zpl/commit/9612a364f2da9935559845a353f198ffc0699df1))

## [0.11.0](https://github.com/schie/fluent-zpl/compare/v0.10.0...v0.11.0) (2025-12-11)


### Features

* **label:** adding `.circle()` ([7ea9103](https://github.com/schie/fluent-zpl/commit/7ea9103356e973feee7dbfe20432e6a246258df5))
* **label:** adding `.diagonalLine()` ([2aac1ca](https://github.com/schie/fluent-zpl/commit/2aac1ca78e7453eb94773f2507fe5b38eaa52caf))
* **label:** adding `.ellipse()` ([ab6a99d](https://github.com/schie/fluent-zpl/commit/ab6a99d19afc43cdbebadb76216aaea76be2f43c))
* **label:** adding `.setCharacterSet(...)` ([4ff5524](https://github.com/schie/fluent-zpl/commit/4ff55240bd4e41d8c6e844e8f901191a0b11fee6))
* **label:** adding hex indicator ([5f3bfe0](https://github.com/schie/fluent-zpl/commit/5f3bfe0396bf4abc9c23bc5c99f5df5444cd26be))
* **label:** expanding functionality of `.barcode()` ([8f81a33](https://github.com/schie/fluent-zpl/commit/8f81a33073bf5c5fbc68b762809cf75862a372f0))
* **printerconfig:** adding `.mirror()` and `.orientation()` ([918dafe](https://github.com/schie/fluent-zpl/commit/918dafef59ef92c477462d02ffa14b72a56a7cd8))

## [0.10.0](https://github.com/schie/fluent-zpl/compare/v0.9.1...v0.10.0) (2025-12-03)


### Features

* **printer-config:** adding tearOff ([b1ea3c3](https://github.com/schie/fluent-zpl/commit/b1ea3c330c7f04f64c9d5cd23ec7ceb733a35897))

## [0.9.1](https://github.com/schie/fluent-zpl/compare/v0.9.0...v0.9.1) (2025-12-01)


### Bug Fixes

* wrapping printer-config jazz with `^XA/^XZ` block ([ce24e0f](https://github.com/schie/fluent-zpl/commit/ce24e0f493d190b0a6f2f3592a01cf2b0573e38d))

## [0.9.0](https://github.com/schie/fluent-zpl/compare/v0.8.0...v0.9.0) (2025-11-26)


### Features

* adding PrinterConfig ([7b41e2f](https://github.com/schie/fluent-zpl/commit/7b41e2f7a8dff18a0a2b0cd1635617dd23ad6fcb))

## [0.8.0](https://github.com/schie/fluent-zpl/compare/v0.7.0...v0.8.0) (2025-11-26)


### Features

* **zplprogram:** adding load/save configuration to printer config ([7ee51cb](https://github.com/schie/fluent-zpl/commit/7ee51cb46084f53a97125d450d9bcd59d96c813d))

## [0.7.0](https://github.com/schie/fluent-zpl/compare/v0.6.0...v0.7.0) (2025-11-25)


### Features

* support hanging indent in text wrapping ([de8118c](https://github.com/schie/fluent-zpl/commit/de8118c181d9ccd832a56ab08262ea2056b16a03))

## [0.6.0](https://github.com/schie/fluent-zpl/compare/v0.5.1...v0.6.0) (2025-11-16)


### Features

* replacing `type DiterMode` with `enum DitherMode` ([341c1fe](https://github.com/schie/fluent-zpl/commit/341c1fe6f1eef79a14c8f1a94fd49f1ef1a65bba))

## [0.5.1](https://github.com/schie/fluent-zpl/compare/v0.5.0...v0.5.1) (2025-11-12)


### Bug Fixes

* **label-template:** preserving whitespace verbatim ([30e1a39](https://github.com/schie/fluent-zpl/commit/30e1a393728d14cba64f9d86af07a913749a68bd))
* removing CLI vestiges ([9441e3c](https://github.com/schie/fluent-zpl/commit/9441e3cc622d030d6638123e1db1c4a3c5a50137))

## [0.5.0](https://github.com/schie/fluent-zpl/compare/v0.4.0...v0.5.0) (2025-11-10)

### ⚠ BREAKING CHANGES

- renames `zpl` tagged template literal to `label`
- String literals like 'A', 'B', 'Code128', 'mm' are now enums (FontFamily.A, Barcode.Code128, Units.Millimeter)

### Features

- adding `ZPLProgram`, renaming `zpl` tagged template, some updates to label, etc ([7a5d6dc](https://github.com/schie/fluent-zpl/commit/7a5d6dc479dca45e985dc952b44b01276a85145f))
- adding comprehensive ZPL enhancements, type-safety improvements ([65a28d9](https://github.com/schie/fluent-zpl/commit/65a28d986070c3e05c2a5383bd796096f76bd369))

### Miscellaneous Chores

- v0.5.0 ([6658999](https://github.com/schie/fluent-zpl/commit/6658999715805daffbb7ad66accf0ad1986721bf))

## [0.4.0](https://github.com/schie/fluent-zpl/compare/v0.3.0...v0.4.0) (2025-11-03)

<!-- markdownlint-disable-next-line MD024 -->
### Features

- **label:** adding `.setDefaultFont(...)` and `.setBarcodeDefaults(...)` ([abc0923](https://github.com/schie/fluent-zpl/commit/abc092373d7d810d2ed1caba8d9046cbb79f74d6))
- **label:** adding support for a Reverse Box ([288e68e](https://github.com/schie/fluent-zpl/commit/288e68e60522f8752e5cb1401a5ef82bf6978bee))

## [0.3.0](https://github.com/schie/fluent-zpl/compare/v0.2.0...v0.3.0) (2025-11-03)

<!-- markdownlint-disable-next-line MD024 -->
### Features

- exporting union types for enhanced typescript support ([8f15031](https://github.com/schie/fluent-zpl/commit/8f150317e13a2cd36417255953e594e2c5598fd3))

## [0.2.0](https://github.com/schie/fluent-zpl/compare/v0.1.0...v0.2.0) (2025-11-03)

<!-- markdownlint-disable-next-line MD024 -->
### Features

- **core/label:** addubg ZPL comment and metadata support ([778a6b8](https://github.com/schie/fluent-zpl/commit/778a6b8b6a871f109cd86c7e7f1caa61cf02c611))
- **image/encoder.ts:** exporting clamp255 utility fn for easier testing ([0a3287f](https://github.com/schie/fluent-zpl/commit/0a3287f7b10f387a199b204cbe6abe19f1edd5de))

### Bug Fixes

- resolving ESM import paths and cleaning exports ([f74dbab](https://github.com/schie/fluent-zpl/commit/f74dbabf6934b7b94ebf05fa3e42afae13b7aaca))

## [0.1.0](https://github.com/schie/fluent-zpl/compare/v0.0.1...v0.1.0) (2025-11-03)

<!-- markdownlint-disable-next-line MD024 -->
### Miscellaneous Chores

- release 0.1.0 ([caa3afc](https://github.com/schie/fluent-zpl/commit/caa3afc2b159e0bfc6f7ed0866a3db783b67be40))
