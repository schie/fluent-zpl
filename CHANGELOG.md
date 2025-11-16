# Changelog

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
