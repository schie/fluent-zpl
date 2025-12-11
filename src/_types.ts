// src/_types.ts
// Shared types & unit helpers for @schie/fluent-zpl

/* =====================================
 *  Core Label Configuration
 * ===================================== */

/**
 * Orientation of text or graphics in ZPL commands.
 *
 * @remarks
 * This enum defines the four possible orientations supported by ZPL (Zebra Programming Language):
 * - N: Normal orientation (0 degrees) - default horizontal text
 * - R: Rotated 90 degrees clockwise - vertical text reading upward
 * - I: Inverted/rotated 180 degrees - upside-down text
 * - B: Bottom-up/rotated 270 degrees clockwise - vertical text reading downward
 *
 * Most applications use Normal (N) orientation for standard horizontal text.
 * Rotation is commonly used for vertical labels or to fit text in tight spaces.
 */
export enum Orientation {
  Normal = 'N',
  Rotated90 = 'R',
  Inverted180 = 'I',
  Rotated270 = 'B',
}

/**
 * Units of measurement for label dimensions and positions.
 *
 * @remarks
 * This enum defines the three supported units in ZPL:
 * - dot: Measurement in printer dots (pixels) - most precise, printer-native
 * - mm: Measurement in millimeters - common metric unit
 * - inch: Measurement in inches - common imperial unit
 *
 * Dots provide the most precise control as they map directly to printer resolution.
 * Millimeters and inches are converted to dots based on the printer's DPI setting.
 */
export enum Units {
  Dot = 'dot',
  Millimeter = 'mm',
  Inch = 'in',
}

/**
 * Represents a position with x and y coordinates.
 *
 * @remarks
 * This type is used throughout the library for positioning elements on labels.
 * Coordinates are typically in the units specified by the label configuration (dots, mm, or inches).
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Printer resolution in dots per inch (DPI).
 *
 * @remarks
 * This type defines the three standard DPI settings supported by ZPL:
 * - 203 DPI: Standard resolution for most label printers
 * - 300 DPI: High resolution for smaller text and barcodes
 * - 600 DPI: Ultra-high resolution for detailed graphics and images
 */
export type DPI = 203 | 300 | 600;

/**
 * Options for creating a label.
 *
 * @remarks
 * This interface defines the configuration options for a label:
 * - `w`: Width of the label (in units or dots)
 * - `h`: Height of the label (in units or dots)
 * - `units`: Units for width/height values. Default: 'dot'
 * - `dpi`: Printer resolution. Default: 203
 * - `origin`: Label home/origin (maps to ^LH)
 * - `orientation`: Print orientation (maps to ^PO)
 */
export interface LabelOptions {
  /** Width of the label (in units or dots) */
  w: number;
  /** Height of the label (in units or dots) */
  h: number;
  /** Units for width/height values. Default: 'dot' */
  units?: Units;
  /** Printer resolution. Default: 203 */
  dpi?: DPI;
  /** Label home/origin (maps to ^LH) */
  origin?: { x: number; y: number };
  /** Mirror label content across the vertical axis (maps to ^PM) */
  mirror?: Mirror;
  /** Print orientation (maps to ^PO) */
  orientation?: Orientation;
}

/**
 * Character set values for the ^CI command.
 */
export type CharacterSet =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36;

/**
 * Options for the ^CI command.
 */
export interface CharacterSetOptions {
  /** Character set code (0-36). Use 28 (UTF-8) unless you need a specific code page. */
  charset: CharacterSet;
  /** Optional pairs of integers (0-255) for Code Page 850 variants (charset 0-13). */
  customMappings?: number[];
}

/* =====================================
 *  Printer / Job Configuration
 * ===================================== */

/**
 * Supported printer modes for the ^MM command.
 */
export enum PrinterMode {
  TearOff = 'T',
  PeelOff = 'P',
  Rewind = 'R',
  Applicator = 'A',
  Cutter = 'C',
}

/**
 * Media tracking strategies for the ^MN command.
 */
export enum MediaTracking {
  Continuous = 'N',
  NonContinuous = 'Y',
  Mark = 'Z',
}

/**
 * Mirror mode for label content (^PM).
 */
export enum Mirror {
  Off = 'N',
  On = 'Y',
}

/**
 * Printer configuration save/load actions for the ^JU command.
 *
 * @remarks
 * - S: Save the current settings
 * - R: Reload the last saved settings
 * - F: Reload factory defaults
 * - N: Reload factory network defaults
 *
 * There is no default; the caller must supply an explicit action.
 */
export enum PrinterConfiguration {
  Save = 'S',
  ReloadSaved = 'R',
  ReloadFactory = 'F',
  ReloadFactoryNetwork = 'N',
}

/**
 * Options for building printer configuration blocks outside of label formats.
 */
export interface PrinterConfigOpts {
  /** Print mode selection (^MM) */
  mode?: PrinterMode;
  /** Media tracking / sensor strategy (^MN) */
  mediaTracking?: MediaTracking;
  /** Print width (^PW). Uses the current unit context. */
  printWidth?: number;
  /** Print speed component (^PR). Rounded to an integer and clamped between 0 and 30. */
  printSpeed?: number;
  /** Slew speed component (^PR). Rounded to an integer and clamped between 0 and 30. */
  slewSpeed?: number;
  /** Backfeed speed component (^PR). Rounded to an integer and clamped between 0 and 30. */
  backfeedSpeed?: number;
  /** Mirror label content across the vertical axis (^PM). */
  mirror?: Mirror;
  /** Inverted/normal print orientation (^PO). Defaults to N on the printer. */
  orientation?: Orientation;
  /** Darkness setting (^MD). Rounded to an integer and clamped between -30 and 30. */
  darkness?: number;
  /** Tear-off adjustment (~TA). Uses the current unit context, rounded and clamped between -120 and 120. */
  tearOff?: number;
  /** Printer configuration save/load action (^JU) */
  configuration?: PrinterConfiguration;
  /** Label home offset (^LH) */
  labelHome?: Position;
  /** Pass-through commands appended after the typed options. */
  additionalCommands?: string[];
}

/* =====================================
 *  Field / Element Types
 * ===================================== */

/**
 * Barcode types supported in ZPL.
 *
/**
 * Supported barcode types in ZPL.
 *
 * @remarks
 * This enum defines the barcode formats supported by the fluent-zpl library:
 * - Code128: Code 128 linear barcode
 * - Code39: Code 39 linear barcode  
 * - EAN13: EAN-13 linear barcode
 * - UPCA: UPC-A linear barcode
 * - ITF: Interleaved 2 of 5 linear barcode
 * - PDF417: PDF417 2D barcode
 * - QRCode: QR Code 2D barcode
 * - DataMatrix: Data Matrix 2D barcode
 */
export enum Barcode {
  Code128 = 'Code128',
  Code39 = 'Code39',
  EAN13 = 'EAN13',
  UPCA = 'UPCA',
  ITF = 'ITF',
  PDF417 = 'PDF417',
  QRCode = 'QRCode',
  DataMatrix = 'DataMatrix',
}

/**
 * Font families available in ZPL.
 *
 * @remarks
 * This enum defines the built-in font families supported by ZPL printers:
 * - A: 9×5 dot U.S. resident scalable font (default)
 * - B: 11×7 dot U.S. resident scalable font
 * - C: 18×10 dot U.S. resident scalable font
 * - D: 18×11 dot U.S. resident scalable font
 * - E: 28×15 dot OCR-B resident scalable font
 * - F: 26×13 dot U.S. resident scalable font
 * - G: 60×40 dot U.S. resident scalable font
 * - H: 21×13 dot OCR-A resident scalable font
 * - Zero: Default printer font (printer-specific, often same as A)
 *
 * Font A is the most commonly used for general text.
 * Font B is slightly larger and good for headings.
 * Fonts E and H are OCR fonts for machine-readable text.
 * Font G is very large and suitable for big labels or signage.
 */
export enum FontFamily {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
  Zero = '0',
}

/**
 * Text justification options for wrapped text fields.
 *
 * @remarks
 * This enum defines how text should be aligned within text blocks:
 * - L: Left justified (default) - text aligns to the left edge
 * - C: Center justified - text is centered within the field width
 * - R: Right justified - text aligns to the right edge
 * - J: Justified - text is stretched to fill the entire width (except last line)
 */
export enum Justify {
  Left = 'L',
  Center = 'C',
  Right = 'R',
  Justified = 'J',
}

/**
 * Fill patterns for graphic boxes and lines.
 *
 * @remarks
 * This enum defines the fill style for box elements:
 * - B: Black fill - solid black interior
 * - W: White fill - solid white interior (creates outlined box)
 *
 * Black fill creates a solid rectangle, while white fill creates
 * an outlined rectangle with transparent/white interior.
 */
export enum Fill {
  Black = 'B',
  White = 'W',
}

/**
 * Orientation for diagonal line graphics (^GD).
 *
 * @remarks
 * - R: Right-leaning line (bottom-left to top-right)
 * - L: Left-leaning line (top-left to bottom-right)
 */
export enum DiagonalOrientation {
  Right = 'R',
  Left = 'L',
}

/**
 * RFID memory banks for read/write operations.
 *
 * @remarks
 * This enum defines the available memory banks on RFID tags:
 * - EPC: Electronic Product Code bank - stores the main product identifier
 * - TID: Tag Identifier bank - contains unique tag information (read-only)
 * - USER: User memory bank - available for custom application data
 * - HostBuffer: Volatile buffer returned by ^RFR,H (read-only convenience)
 *
 * EPC is the most commonly used bank for product identification.
 * TID contains manufacturer and model information.
 * USER bank can store additional application-specific data.
 */
export enum RFIDBank {
  EPC = 'EPC',
  TID = 'TID',
  USER = 'USER',
  HostBuffer = 'HOST',
}

/**
 * Options for text fields on the label.
 *
 * @remarks
 * This interface defines the configuration options for adding text to a label:
 * - `at`: Specifies the x and y coordinates for the text position.
 * - `text`: The actual text string to be printed.
 * - `font`: Optional font settings including family, height, and width.
 * - `rotate`: Optional orientation of the text (N, R, I, B).
 * - `wrap`: Optional text wrapping settings including width, number of lines, spacing, justification, and hanging indent.
 */
export interface TextOpts {
  at: Position;
  text: string;
  /** Optional ^FH hex indicator for embedding hex escapes inside the field data. */
  hexIndicator?: string;
  font?: {
    family?: FontFamily;
    /** Font height in dots; rounded to an integer with a minimum of 1. */
    h?: number;
    /** Font width in dots; rounded to an integer with a minimum of 1 (defaults to height when omitted). */
    w?: number;
  };
  rotate?: Orientation;
  wrap?: {
    width: number;
    lines?: number;
    /** Inter-line spacing in dots; rounded to an integer with a minimum of 0. */
    spacing?: number;
    justify?: Justify;
    /** Hanging indent in dots; rounded to an integer with a minimum of 0. */
    hangingIndent?: number;
  };
}

/**
 * Options for barcode fields on the label.
 *
 * @remarks
 * This interface defines the configuration options for adding a barcode to a label:
 * - `at`: Specifies the x and y coordinates for the barcode position.
 * - `type`: The type of barcode to print.
 * - `data`: The data string to encode in the barcode.
 * - `height`: Optional height of the barcode.
 * - `module`: Optional module width for the barcode.
 * - `ratio`: Optional module width ratio for the ^BY command.
 * - `rotate`: Optional orientation of the barcode (N, R, I, B).
 *
 * QR Code specific options (only used when type is QRCode):
 * - `qrErrorCorrection`: Error correction level for QR codes.
 * - `qrMask`: Mask pattern for QR codes (0-7).
 * - `qrModel`: QR model (1 or 2).
 */
export interface BarcodeOpts {
  at: Position;
  type: Barcode;
  data: string;
  /** Optional ^FH hex indicator for embedding hex escapes inside the field data. */
  hexIndicator?: string;
  height?: number;
  module?: number;
  ratio?: number; // Module width ratio for ^BY command
  rotate?: Orientation;

  // QR Code specific parameters (only used when type is QRCode)
  /** QR Code error correction level (only for QRCode type) */
  qrErrorCorrection?: QRErrorCorrection;
  /** QR Code mask pattern 0-7 (only for QRCode type) */
  qrMask?: number;
  /** QR Code model 1 or 2 (only for QRCode type) */
  qrModel?: 1 | 2;
}

/**
 * Options for box/graphic fields on the label.
 *
 * @remarks
 * This interface defines the configuration options for adding a box or graphic to a label:
 * - `at`: Specifies the x and y coordinates for the box position.
 * - `size`: Specifies the width and height of the box.
 * - `border`: Optional border thickness of the box.
 * - `fill`: Optional fill color of the box, either black ('B') or white ('W').
 * - `reverse`: Optional field reverse (^FR) - reverses the field colors within the box area.
 * - `cornerRadius`: Optional corner rounding (0-8) for rounded rectangle corners.
 */
export interface BoxOpts {
  at: Position;
  size: { w: number; h: number };
  /** Border thickness in dots; rounded to an integer with a minimum of 1. */
  border?: number;
  fill?: Fill;
  reverse?: boolean;
  /** Corner rounding in dots; rounded to an integer and clamped between 0 and 8. */
  cornerRadius?: number;
}

/**
 * Options for graphic circles (^GC).
 */
export interface CircleOpts {
  at: Position;
  /** Diameter in current units; converted to dots. */
  diameter: number;
  /** Border thickness in dots; rounded to an integer with a minimum of 1. */
  thickness?: number;
  /** Fill color; black by default. */
  fill?: Fill;
  /** Apply field reverse (^FR) to invert colors. */
  reverse?: boolean;
}

/**
 * Options for graphic ellipses (^GE).
 */
export interface EllipseOpts {
  at: Position;
  /** Width and height in current units; converted to dots. */
  size: { w: number; h: number };
  /** Border thickness in dots; rounded to an integer with a minimum of 1. */
  thickness?: number;
  /** Fill color; black by default. */
  fill?: Fill;
  /** Apply field reverse (^FR) to invert colors. */
  reverse?: boolean;
}

/**
 * Options for diagonal line graphics (^GD).
 */
export interface DiagonalLineOpts {
  at: Position;
  /** Width and height in current units; converted to dots. */
  size: { w: number; h: number };
  /** Line thickness in dots; rounded to an integer with a minimum of 1. */
  thickness?: number;
  /** Line color; black by default. */
  fill?: Fill;
  /** Orientation of the diagonal line; defaults to right-leaning ('R'). */
  orientation?: DiagonalOrientation;
  /** Apply field reverse (^FR) to invert colors. */
  reverse?: boolean;
}

/**
 * Options for RFID fields on the label.
 *
 * @remarks
 * This interface defines the configuration options for adding RFID fields to a label:
 * - `epc`: The EPC data to encode, provided as a hexadecimal string.
 * - `position`: Optional distance from the label edge in dots.
 * - `password`: Optional password for protected operations, provided as a hexadecimal string.
 * - `bank`: Optional memory bank to write to, which can be 'EPC', 'TID', or 'USER'.
 * - `offset`: Optional offset within the specified memory bank.
 * - `length`: Optional length of data to write.
 */
export interface RFIDOpts {
  /** EPC data to encode (hex string) */
  epc: string;
  position?: number;
  /** Password for protected operations (hex string) */
  password?: string;
  /** Memory bank to write to: EPC, TID, USER */
  bank?: RFIDBank;
  /** Offset within memory bank */
  offset?: number;
  /** Length of data to write */
  length?: number;
}

/**
 * Options for caption text fields (convenience method for simple text with symmetric font sizing).
 *
 * @remarks
 * This interface defines the configuration options for adding caption text to a label:
 * - `at`: Specifies the x and y coordinates for the caption position.
 * - `text`: The caption text string to be printed.
 * - `size`: Optional font size in dots (applies to both height and width).
 * - `family`: Optional font family.
 * - `rotate`: Optional orientation of the text.
 * - `wrapWidth`: Optional width for text wrapping in current units.
 */
export interface CaptionOpts {
  at: Position;
  text: string;
  /** Font size in dots; rounded to an integer with a minimum of 1. */
  size?: number; // dots
  family?: FontFamily;
  rotate?: Orientation;
  wrapWidth?: number; // in current units
}

/**
 * QR Code error correction levels for ZPL ^BQ command.
 */
export enum QRErrorCorrection {
  /** Lower reliability */
  L = 'L',
  /** Medium reliability */
  M = 'M',
  /** High reliability (default) */
  Q = 'Q',
  /** Highest reliability */
  H = 'H',
}

/**
 * Options for QR code fields (convenience method for QR codes).
 *
 * @remarks
 * This interface defines the configuration options for adding QR codes to a label:
 * - `at`: Specifies the x and y coordinates for the QR code position.
 * - `text`: The text data to encode in the QR code.
 * - `module`: Optional module width for the QR code (1-100, maps to magnification).
 * - `magnification`: Optional magnification factor (1-100). If provided, overrides `module`.
 * - `errorCorrection`: Optional error correction level (L/M/Q/H, default Q).
 * - `mask`: Optional mask pattern (0-7, default 7).
 * - `model`: Optional QR model (1 or 2, default 2 - enhanced).
 * - `rotate`: Optional orientation of the QR code (Note: ZPL ^BQ only supports N).
 */
export interface QRCodeOpts {
  at: Position;
  text: string;
  /** @deprecated Use magnification instead. Module width (1-100) - kept for backward compatibility */
  module?: number;
  /** Magnification factor (1-100). If provided, overrides module parameter */
  magnification?: number;
  /** Error correction level (default: Q - high reliability) */
  errorCorrection?: QRErrorCorrection;
  /** Mask pattern (0-7, default: 7) */
  mask?: number;
  /** QR model (1=original, 2=enhanced, default: 2) */
  model?: 1 | 2;
  /** @deprecated ZPL ^BQ only supports Normal orientation. Kept for API compatibility */
  rotate?: Orientation;
}

/**
 * Options for GS1-128 barcode fields (convenience method for GS1 barcodes).
 *
 * @remarks
 * This interface defines the configuration options for adding GS1-128 barcodes to a label:
 * - `at`: Specifies the x and y coordinates for the barcode position.
 * - `ai`: Application Identifier data as key-value pairs.
 * - `height`: Optional height of the barcode.
 * - `rotate`: Optional orientation of the barcode.
 */
export interface GS1_128Opts {
  at: Position;
  ai: Record<string, string | number>;
  height?: number;
  rotate?: Orientation;
}

/**
 * Options for address block text fields (convenience method for multi-line text).
 *
 * @remarks
 * This interface defines the configuration options for adding address blocks to a label:
 * - `at`: Specifies the x and y coordinates for the address block position.
 * - `lines`: Array of text lines (null/undefined lines are skipped).
 * - `lineHeight`: Optional spacing between lines in dots.
 * - `size`: Optional font size in dots.
 * - `family`: Optional font family.
 * - `rotate`: Optional orientation of the text.
 */
export interface AddressBlockOpts {
  at: Position;
  lines: Array<string | undefined | null>;
  /** Line spacing in dots; rounded to an integer with a minimum of 1. */
  lineHeight?: number; // dots between lines
  /** Font size in dots; rounded to an integer with a minimum of 1. */
  size?: number; // font size in dots
  family?: FontFamily;
  rotate?: Orientation;
}

/**
 * Options for EPC encoding (convenience method for RFID EPC fields).
 *
 * @remarks
 * This interface defines the configuration options for EPC encoding:
 * - `epc`: The EPC data string to encode.
 * - `position`: Optional distance from label edge.
 * - `password`: Optional password for protected operations.
 */
export interface EPCOpts {
  epc: string;
  position?: number;
  password?: string;
}

/**
 * Options for RFID read operations.
 *
 * @remarks
 * This interface defines the configuration options for reading RFID tag data:
 * - `bank`: Optional memory bank to read from. Use `HostBuffer` to emit `^RFR,H`.
 * - `offset`: Optional offset within the memory bank (ignored for HostBuffer).
 * - `length`: Optional length of data to read (ignored for HostBuffer).
 * - `password`: Optional password for protected operations.
 */
export interface RFIDReadOpts {
  bank?: RFIDBank;
  offset?: number;
  length?: number;
  password?: string;
}

export type CommandMark = '^' | '~';

/* =====================================
 *  Tokens (Lossless Intermediate Rep)
 * ===================================== */
export type Token =
  | { k: 'Cmd'; mark: CommandMark; name: string; params: string }
  | { k: 'FD'; data: string }
  | { k: 'FS' }
  | { k: 'Bytes'; buf: Uint8Array }
  | { k: 'Raw'; text: string };
