// src/index.ts
// Public API for @schie/fluent-zpl
/* eslint-disable camelcase -- exposed GS1 type retains spec naming */

// Core API
export { Label } from './core/label.js';
export { ZPLProgram } from './core/program.js';
export type { ProgramOptions } from './core/program.js';
export { PrinterConfig } from './core/printer-config.js';
export type { PrinterConfigBuilderOptions } from './core/printer-config.js';

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
  Mirror,
  Orientation,
  PrinterConfiguration,
  PrinterMode,
  QRErrorCorrection,
  RFIDBank,
  Units,
  DiagonalOrientation,
} from './_types.js';

// Essential types for public API
export type {
  AddressBlockOpts,
  BarcodeOpts,
  BoxOpts,
  CaptionOpts,
  DiagonalLineOpts,
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
