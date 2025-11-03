// src/_types.ts
// Shared types & unit helpers for @schie/fluent-zpl

/* =====================================
 *  Core Label Configuration
 * ===================================== */
/**
 * Represents the orientation of text or graphics in ZPL commands.
 *
 * @remarks
 * This type defines the four possible orientations supported by ZPL (Zebra Programming Language):
 * - 'N': Normal orientation (0 degrees)
 * - 'R': Rotated 90 degrees clockwise
 * - 'I': Inverted/rotated 180 degrees
 * - 'B': Bottom-up/rotated 270 degrees clockwise (or 90 degrees counter-clockwise)
 */
export type Orientation = 'N' | 'R' | 'I' | 'B'

/**
 * Units of measurement for label dimensions and positions.
 *
 * @remarks
 * This type defines the three supported units in ZPL:
 * - 'dot': Measurement in printer dots (pixels)
 * - 'mm': Measurement in millimeters
 * - 'in': Measurement in inches
 */
export type Units = 'dot' | 'mm' | 'in'

/**
 * Printer resolution in dots per inch (DPI).
 *
 * @remarks
 * This type defines the three standard DPI settings supported by ZPL:
 * - 203 DPI: Standard resolution for most label printers
 * - 300 DPI: High resolution for smaller text and barcodes
 * - 600 DPI: Ultra-high resolution for detailed graphics and images
 */
export type DPI = 203 | 300 | 600

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
  w: number
  /** Height of the label (in units or dots) */
  h: number
  /** Units for width/height values. Default: 'dot' */
  units?: Units
  /** Printer resolution. Default: 203 */
  dpi?: DPI
  /** Label home/origin (maps to ^LH) */
  origin?: { x: number; y: number }
  /** Print orientation (maps to ^PO) */
  orientation?: Orientation
}

/* =====================================
 *  Field / Element Types
 * ===================================== */

/**
 * Barcode types supported in ZPL.
 *
 * @remarks
 * This type defines the various barcode symbologies supported by ZPL:
 * - 'Code128': Code 128 barcode
 * - 'Code39': Code 39 barcode
 * - 'EAN13': EAN-13 barcode
 * - 'UPCA': UPC-A barcode
 * - 'ITF': Interleaved 2 of 5 barcode
 * - 'PDF417': PDF417 2D barcode
 * - 'QRCode': QR Code 2D barcode
 * - 'DataMatrix': Data Matrix 2D barcode
 */
export type Barcode =
  | 'Code128'
  | 'Code39'
  | 'EAN13'
  | 'UPCA'
  | 'ITF'
  | 'PDF417'
  | 'QRCode'
  | 'DataMatrix'

/**
 * Options for text fields on the label.
 *
 * @remarks
 * This interface defines the configuration options for adding text to a label:
 * - `at`: Specifies the x and y coordinates for the text position.
 * - `text`: The actual text string to be printed.
 * - `font`: Optional font settings including family, height, and width.
 * - `rotate`: Optional orientation of the text (N, R, I, B).
 * - `wrap`: Optional text wrapping settings including width, number of lines, spacing, and justification.
 */
export interface TextOpts {
  at: { x: number; y: number }
  text: string
  font?: { family?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | '0'; h?: number; w?: number }
  rotate?: Orientation
  wrap?: { width: number; lines?: number; spacing?: number; justify?: 'L' | 'C' | 'R' | 'J' }
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
 * - `rotate`: Optional orientation of the barcode (N, R, I, B).
 */
export interface BarcodeOpts {
  at: { x: number; y: number }
  type: Barcode
  data: string
  height?: number
  module?: number
  rotate?: Orientation
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
 */
export interface BoxOpts {
  at: { x: number; y: number }
  size: { w: number; h: number }
  border?: number
  fill?: 'B' | 'W'
}

/**
 * Options for RFID fields on the label.
 *
 * @remarks
 * This interface defines the configuration options for adding RFID fields to a label:
 * - `at`: Specifies the x and y coordinates for the RFID field position.
 * - `epc`: The EPC data to encode, provided as a hexadecimal string.
 * - `position`: Optional distance from the label edge in dots.
 * - `password`: Optional password for protected operations, provided as a hexadecimal string.
 * - `bank`: Optional memory bank to write to, which can be 'EPC', 'TID', or 'USER'.
 * - `offset`: Optional offset within the specified memory bank.
 * - `length`: Optional length of data to write.
 */
export interface RFIDOpts {
  at: { x: number; y: number }
  /** EPC data to encode (hex string) */
  epc: string
  /** RFID positioning - distance from label edge in dots */
  position?: number
  /** Password for protected operations (hex string) */
  password?: string
  /** Memory bank to write to: EPC, TID, USER */
  bank?: 'EPC' | 'TID' | 'USER'
  /** Offset within memory bank */
  offset?: number
  /** Length of data to write */
  length?: number
}

export type CommandMark = '^' | '~'

/* =====================================
 *  Tokens (Lossless Intermediate Rep)
 * ===================================== */
export type Token =
  | { k: 'Cmd'; mark: CommandMark; name: string; params: string }
  | { k: 'FD'; data: string }
  | { k: 'FS' }
  | { k: 'Bytes'; buf: Uint8Array }
  | { k: 'Raw'; text: string }
