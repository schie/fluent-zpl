// src/index.ts
// Public API for @schie/fluent-zpl

// Core API
export { Label } from './core/label.js';
export { ZPLProgram } from './core/program.js';
export type { ProgramOptions } from './core/program.js';

// Unit helpers
export { dot, inch, mm, toDots } from './_unit-helpers.js';

// Tagged template for parsing labels
export { label } from './label-template.js';

// Enums for values (not just types)
export {
  Barcode,
  Fill,
  FontFamily,
  Justify,
  MediaTracking,
  Orientation,
  PrinterConfiguration,
  PrinterMode,
  QRErrorCorrection,
  RFIDBank,
  Units,
} from './_types.js';

// Essential types for public API
export type {
  AddressBlockOpts,
  BarcodeOpts,
  BoxOpts,
  CaptionOpts,
  DPI,
  EPCOpts,
  GS1_128Opts,
  LabelOptions,
  PrinterConfigOpts,
  Position,
  QRCodeOpts,
  RFIDOpts,
  RFIDReadOpts,
  TextOpts,
} from './_types.js';

// Image-related types
export type { ImageCachedOpts, ImageInlineOpts } from './image/api.js';
export { DitherMode } from './image/encoder.js';
