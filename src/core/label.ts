// src/core/label.ts
// @schie/fluent-zpl – Label class (fluent, immutable)
/* eslint-disable camelcase -- GS1 naming uses underscores per spec */

import type {
  AddressBlockOpts,
  BarcodeOpts,
  BoxOpts,
  CircleOpts,
  CaptionOpts,
  CharacterSetOptions,
  DPI,
  DiagonalLineOpts,
  EllipseOpts,
  EPCOpts,
  GS1_128Opts,
  LabelOptions,
  QRCodeOpts,
  RFIDOpts,
  RFIDReadOpts,
  TextOpts,
  Token,
} from '../_types.js';
import {
  Barcode,
  Code128Mode,
  DiagonalOrientation,
  Fill,
  FontFamily,
  Justify,
  Orientation,
  RFIDBank,
  Units,
} from '../_types.js';
import { toDots } from '../_unit-helpers.js';
import {
  buildImageCachedTokens,
  buildImageInlineTokens,
  ImageCachedOpts,
  ImageInlineOpts,
} from '../image/api.js';
import { emit } from './emit.js';
import { findLastXZ, tokenizeZPL } from './parse.js';
import { buildRFIDReadTokens, buildRFIDWriteTokens } from './rfid.js';

/**
 * ZPL Label class
 *
 * @remarks
 * The `Label` class provides a fluent, immutable API for constructing ZPL (Zebra Programming Language) labels.
 * It supports adding text, barcodes, boxes, images, and RFID fields, as well as parsing existing ZPL strings.
 * Each method returns a new `Label` instance with the added elements, allowing for method chaining.
 */
export class Label {
  /** Lossless token stream is the single source of truth for this Label */
  private readonly tokens: Token[];
  /** Public so advanced users (and your own components) can read cfg if needed */
  public readonly cfg: { dpi: DPI; units: Units };

  private constructor(tokens: Token[], cfg: { dpi: DPI; units: Units }) {
    this.tokens = tokens;
    this.cfg = cfg;
  }

  // ---------------------------------------------------------------------------
  // Factories
  // ---------------------------------------------------------------------------

  /** Create a fresh label (^XA … ^XZ) with basic page setup */
  static create(opts: LabelOptions): Label {
    const dpi: DPI = (opts.dpi ?? 203) as DPI;
    const units: Units = opts.units ?? Units.Dot;

    const head: string[] = ['^XA'];
    if (opts.mirror) head.push(`^PM${opts.mirror}`);
    if (opts.orientation) head.push(`^PO${opts.orientation}`);
    if (opts.origin)
      head.push(`^LH${toDots(opts.origin.x, dpi, units)},${toDots(opts.origin.y, dpi, units)}`);
    head.push(`^PW${toDots(opts.w, dpi, units)}`);
    head.push(`^LL${toDots(opts.h, dpi, units)}`);

    const tokens = tokenizeZPL(head.join('') + '^XZ');
    return new Label(tokens, { dpi, units });
  }

  /** Parse an existing ZPL string/bytes into a fluent Label instance */
  static parse(zpl: string | Uint8Array, dpi: DPI = 203 as DPI, units: Units = Units.Dot): Label {
    const tokens = tokenizeZPL(zpl);
    return new Label(tokens, { dpi, units });
  }

  /** Back-compat alias if you like the old name */
  static fromZPL = Label.parse;

  // ---------------------------------------------------------------------------
  // Core building blocks (primitive fluent methods)
  // ---------------------------------------------------------------------------

  /**
   * Add a text field.
   *
   * @remarks
   * Font height/width are rounded to integers with a minimum of 1. Wrap spacing and hanging indent
   * are rounded to integers with a minimum of 0.
   */
  text(o: TextOpts): Label {
    const { dpi, units } = this.cfg;

    const parts: string[] = [];
    parts.push(`^FO${toDots(o.at.x, dpi, units)},${toDots(o.at.y, dpi, units)}`);

    const fam = o.font?.family ?? FontFamily.A;
    const rot: Orientation = o.rotate ?? Orientation.Normal;
    // Use reasonable defaults for font size if not specified (ZPL requires these parameters)
    const h = o.font?.h != null ? clamp1(o.font.h) : 28;
    const w = o.font?.w != null ? clamp1(o.font.w) : 28;

    parts.push(`^A${fam}${rot},${h},${w}`);

    if (o.wrap) {
      const width = toDots(o.wrap.width, dpi, units);
      const lines = o.wrap.lines ?? 10;
      const spacing = clamp0(o.wrap.spacing ?? 0);
      const just = o.wrap.justify ?? 'L';
      const hangingIndent = clamp0(o.wrap.hangingIndent ?? 0);
      parts.push(`^FB${width},${lines},${spacing},${just},${hangingIndent}`);
    }

    const hexIndicator = Label.buildHexIndicator(o.hexIndicator);
    parts.push(`${hexIndicator}^FD${Label.escFD(o.text)}^FS`);

    return this._insertBeforeXZ(tokenizeZPL(parts.join('')));
  }

  /** Add a barcode field */
  barcode(o: BarcodeOpts): Label {
    const { dpi, units } = this.cfg;
    const x = toDots(o.at.x, dpi, units);
    const y = toDots(o.at.y, dpi, units);
    const m = o.module ?? 2;
    const ratio = o.ratio ?? 3; // Default 3:1 ratio for better scan reliability
    const h = o.height ?? 100;
    const r: Orientation = o.rotate ?? Orientation.Normal;
    const line = o.line ?? true;
    const lineAboveDefault = o.type === Barcode.Code128 && o.code128Mode === Code128Mode.UCCCase;
    const lineAbove = o.lineAbove ?? lineAboveDefault;
    const checkDigit = o.checkDigit ?? false;

    // Add ^BY command for module width and ratio control
    const byCmd = `^BY${m},${ratio},${h}`;

    let spec = '';
    switch (o.type) {
      case 'Code128': {
        const mode = o.code128Mode ? `,${o.code128Mode}` : '';
        spec = `^BC${r},${h},${yn(line)},${yn(lineAbove)},${yn(checkDigit)}${mode}`;
        break;
      }
      case 'Code39':
        spec = `^B3${r},${h},${yn(line)},${yn(lineAbove)},${yn(checkDigit)}`;
        break;
      case 'EAN13':
        spec = `^BE${r},${h},${yn(line)},${yn(lineAbove)}`;
        break;
      case 'UPCA':
        spec = `^B8${r},${h},${yn(line)},${yn(lineAbove)},${yn(checkDigit)}`;
        break;
      case 'ITF':
        spec = `^BI${r},${h},${yn(line)},${yn(lineAbove)}`;
        break;
      case 'PDF417':
        spec = `^B7${r},${h},${clampRange(o.pdf417SecurityLevel ?? 0, 0, 8)},${clampRange(
          o.pdf417Columns ?? 3,
          1,
          30,
        )},${clampRange(o.pdf417Rows ?? 3, 3, 90)},${yn(o.pdf417Truncate ?? false)}`;
        break;
      case 'QRCode': {
        // ^BQ orientation,model,magnification,errorCorrection,mask
        // orientation: N only (backward compatibility)
        // model: 1 (original) or 2 (enhanced, default)
        // magnification: 1-100 (default depends on DPI)
        // errorCorrection: H/Q/M/L (default Q)
        // mask: 0-7 (default 7)
        const model = o.qrModel ?? 2; // Default to enhanced model 2
        const errorCorrection = o.qrErrorCorrection ?? 'Q'; // Default to high reliability
        const mask = o.qrMask ?? 7; // Default mask pattern
        spec = `^BQ${r},${model},${m},${errorCorrection},${mask}`;
        break;
      }
      case 'DataMatrix':
        spec = `^BX${r},${m},${clampRange(o.dataMatrixQuality ?? 200, 1, 99999)}`;
        break;
    }

    const hexIndicator = Label.buildHexIndicator(o.hexIndicator);
    const chunk = `^FO${x},${y}${byCmd}${spec}${hexIndicator}^FD${Label.escFD(o.data)}^FS`;
    return this._insertBeforeXZ(tokenizeZPL(chunk));
  }

  /**
   * Draw a box/line.
   *
   * @remarks
   * Border thickness is rounded to an integer with a minimum of 1. Corner radius is rounded and
   * clamped between 0 and 8 to match ZPL limits.
   */
  box(o: BoxOpts): Label {
    const { dpi, units } = this.cfg;
    const x = toDots(o.at.x, dpi, units);
    const y = toDots(o.at.y, dpi, units);
    const w = toDots(o.size.w, dpi, units);
    const h = toDots(o.size.h, dpi, units);
    const t = clamp1(o.border ?? 1);
    const fill = o.fill ?? Fill.Black;
    const radius = Math.max(0, Math.min(8, Math.round(o.cornerRadius ?? 0))); // ZPL supports 0-8
    const reverse = o.reverse ? '^FR' : '';
    const chunk = `^FO${x},${y}${reverse}^GB${w},${h},${t},${fill},${radius}^FS`;
    return this._insertBeforeXZ(tokenizeZPL(chunk));
  }

  /**
   * Draw a circle.
   *
   * @remarks
   * Border thickness is rounded to an integer with a minimum of 1.
   */
  circle(o: CircleOpts): Label {
    const { dpi, units } = this.cfg;
    const x = toDots(o.at.x, dpi, units);
    const y = toDots(o.at.y, dpi, units);
    const diameter = toDots(o.diameter, dpi, units);
    const thickness = clamp1(o.thickness ?? 1);
    const fill = o.fill ?? Fill.Black;
    const reverse = o.reverse ? '^FR' : '';
    const chunk = `^FO${x},${y}${reverse}^GC${diameter},${thickness},${fill}^FS`;
    return this._insertBeforeXZ(tokenizeZPL(chunk));
  }

  /**
   * Draw an ellipse.
   *
   * @remarks
   * Border thickness is rounded to an integer with a minimum of 1.
   */
  ellipse(o: EllipseOpts): Label {
    const { dpi, units } = this.cfg;
    const x = toDots(o.at.x, dpi, units);
    const y = toDots(o.at.y, dpi, units);
    const w = toDots(o.size.w, dpi, units);
    const h = toDots(o.size.h, dpi, units);
    const thickness = clamp1(o.thickness ?? 1);
    const fill = o.fill ?? Fill.Black;
    const reverse = o.reverse ? '^FR' : '';
    const chunk = `^FO${x},${y}${reverse}^GE${w},${h},${thickness},${fill}^FS`;
    return this._insertBeforeXZ(tokenizeZPL(chunk));
  }

  /**
   * Draw a diagonal line.
   *
   * @remarks
   * Line thickness is rounded to an integer with a minimum of 1.
   */
  diagonalLine(o: DiagonalLineOpts): Label {
    const { dpi, units } = this.cfg;
    const x = toDots(o.at.x, dpi, units);
    const y = toDots(o.at.y, dpi, units);
    const w = toDots(o.size.w, dpi, units);
    const h = toDots(o.size.h, dpi, units);
    const thickness = clamp1(o.thickness ?? 1);
    const fill = o.fill ?? Fill.Black;
    const orientation = o.orientation ?? DiagonalOrientation.Right;
    const reverse = o.reverse ? '^FR' : '';
    const chunk = `^FO${x},${y}${reverse}^GD${w},${h},${thickness},${fill},${orientation}^FS`;
    return this._insertBeforeXZ(tokenizeZPL(chunk));
  }

  // ---------------------------------------------------------------------------
  // DX sugar (former "components" as fluent methods)
  // ---------------------------------------------------------------------------

  /** Caption text with symmetric h/w and optional wrap width (size rounded to min 1) */
  caption(o: CaptionOpts): Label {
    const { dpi, units } = this.cfg;
    const size = clamp1(o.size ?? 24);
    const wrap =
      o.wrapWidth != null
        ? { width: toDots(o.wrapWidth, dpi, units), lines: 10, spacing: 0, justify: Justify.Left }
        : undefined;

    return this.text({
      at: o.at,
      text: o.text,
      rotate: o.rotate ?? Orientation.Normal,
      font: { family: o.family ?? FontFamily.A, h: size, w: size },
      wrap,
    });
  }

  /** Convenience QR method using ^BQ under the hood */
  qr(o: QRCodeOpts): Label {
    // Handle backward compatibility: magnification overrides module
    const magnification = o.magnification ?? o.module ?? 3;

    return this.barcode({
      at: o.at,
      type: Barcode.QRCode,
      data: o.text,
      module: magnification,
      rotate: o.rotate ?? Orientation.Normal,
      qrErrorCorrection: o.errorCorrection,
      qrMask: o.mask,
      qrModel: o.model,
    });
  }

  /** Pragmatic GS1-128 helper rendered via Code128 */
  gs1_128(o: GS1_128Opts): Label {
    const data = Label.gs1Data(o.ai);
    return this.barcode({
      at: o.at,
      type: Barcode.Code128,
      data,
      height: o.height ?? 100,
      rotate: o.rotate ?? Orientation.Normal,
    });
  }

  /** Multiline text block for addresses/blocks (size and lineHeight rounded to min 1) */
  addressBlock(o: AddressBlockOpts): Label {
    const lh = clamp1(o.lineHeight ?? 24);
    const size = clamp1(o.size ?? 24);
    const fam = o.family ?? FontFamily.A;
    let y = o.at.y;
    let acc: Label = this;

    for (const line of o.lines) {
      if (!line) {
        y += lh;
        continue;
      }
      acc = acc.caption({
        at: { x: o.at.x, y },
        text: line,
        size,
        family: fam,
        rotate: o.rotate ?? Orientation.Normal,
      });
      y += lh;
    }
    return acc;
  }

  /** Inline bitmap (^GF) — fully self-contained */
  imageInline(o: ImageInlineOpts): Label {
    const toks = buildImageInlineTokens(this.cfg, o);
    return this._insertBeforeXZ(toks);
  }

  /** RFID field for EPC encoding */
  rfid(o: RFIDOpts): Label {
    return this._insertBeforeXZ(buildRFIDWriteTokens(o));
  }

  /** Read RFID tag data */
  rfidRead(o: RFIDReadOpts): Label {
    return this._insertBeforeXZ(buildRFIDReadTokens(o));
  }

  /** EPC encoding convenience method */
  epc(o: EPCOpts): Label {
    return this.rfid({
      epc: o.epc,
      position: o.position,
      password: o.password,
      bank: RFIDBank.EPC,
    });
  }

  /** Cached asset (~DG + ^XG). Consider pairing with a registry for dedupe. */
  image(o: ImageCachedOpts): Label {
    const toks = buildImageCachedTokens(this.cfg, o);
    return this._insertBeforeXZ(toks);
  }

  // ---------------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------------

  /** Emit the final ZPL string. Untouched tokens re-emit byte-identical. */
  toZPL(): string {
    return emit(this.tokens);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /** Insert a token chunk immediately before the last ^XZ in the stream */
  private _insertBeforeXZ(newTokens: Token[]): Label {
    const idx = findLastXZ(this.tokens);
    const next = [...this.tokens];
    next.splice(idx, 0, ...newTokens);
    return new Label(next, this.cfg);
  }

  /** Escape carets inside ^FD payloads per ZPL rules */
  private static escFD(s: string): string {
    return String(s).replace(/\^/g, '^^');
  }

  /** Build optional ^FH hex indicator prefix */
  private static buildHexIndicator(hexIndicator?: string): string {
    if (hexIndicator == null) return '';
    const indicator = String(hexIndicator);
    if (indicator.length === 0) return '^FH';

    if (indicator.length !== 1 || indicator.charCodeAt(0) > 127) {
      throw new Error('hexIndicator must be a single ASCII character.');
    }

    if (/^[a-z]$/.test(indicator)) {
      throw new Error('hexIndicator cannot be a lowercase letter (a-z).');
    }

    if (/[\^~,]/.test(indicator)) {
      throw new Error('hexIndicator cannot be a ZPL command or parameter delimiter (^, ~, ,).');
    }

    const code = indicator.charCodeAt(0);
    if (code < 32) {
      throw new Error('hexIndicator must be a printable ASCII character.');
    }

    return `^FH${indicator}`;
  }

  /** Minimal GS1 helper: inserts GS between variable-length AIs */
  private static gs1Data(aiMap: Record<string, string | number>): string {
    const GS = String.fromCharCode(29);
    const variableLenAIs = new Set([
      '10',
      '21',
      '240',
      '241',
      '242',
      '250',
      '251',
      '253',
      '254',
      '400',
      '401',
      '402',
      '403',
      '410',
      '411',
      '412',
      '413',
      '414',
      '415',
      '416',
      '420',
      '421',
      '422',
      '423',
    ]);

    const pairs = Object.entries(aiMap);
    let out = '';
    for (let i = 0; i < pairs.length; i++) {
      const [ai, valueRaw] = pairs[i];
      const value = String(valueRaw);
      // HRI-friendly composition. ZPL will encode FNC1 with GS char inside ^FD.
      out += `(${ai})${value}`;
      if (i < pairs.length - 1 && variableLenAIs.has(ai)) out += GS;
    }
    return out;
  }

  /** Add a ZPL comment (^FX) - useful for debugging and documentation */
  comment(text: string): Label {
    const newTokens = [...this.tokens];
    const insertIndex = findLastXZ(newTokens);

    newTokens.splice(insertIndex, 0, {
      k: 'Cmd',
      mark: '^',
      name: 'FX',
      params: ` ${text}`,
    });

    return new Label(newTokens, this.cfg);
  }

  /** Add metadata as ZPL comments (^FX) for debugging and traceability */
  withMetadata(meta: Record<string, string | number>): Label {
    let result: Label = this;

    Object.entries(meta).forEach(([key, value]) => {
      result = result.comment(`${key}: ${value}`);
    });

    return result;
  }

  /**
   * Set the active character set (^CI).
   *
   * @remarks
   * Use charset 28 (UTF-8) when possible. Custom mappings are provided as pairs of integers for
   * Code Page 850 variants (charset 0-13).
   */
  setCharacterSet(opts: CharacterSetOptions): Label {
    const charset = clampRange(opts.charset, 0, 36);
    const mappings = opts.customMappings;

    if (mappings?.length) {
      if (mappings.length % 2 !== 0) {
        throw new Error('customMappings must be provided as pairs of integers.');
      }
      const values = mappings.map((value) => clampRange(value, 0, 255));
      const chunk = `^CI${charset},${values.join(',')}`;
      return this._insertBeforeXZ(tokenizeZPL(chunk));
    }

    return this._insertBeforeXZ(tokenizeZPL(`^CI${charset}`));
  }

  /** Set global default font (^CF) - height/width rounded to ints with a minimum of 1. */
  setDefaultFont(opts: { family?: FontFamily; height?: number; width?: number }): Label {
    const family = opts.family ?? FontFamily.Zero;
    const height = clamp1(opts.height ?? 28);
    const width = opts.width != null ? clamp1(opts.width) : height;

    const chunk = `^CF${family},${height},${width}`;
    return this._insertBeforeXZ(tokenizeZPL(chunk));
  }

  /**
   * Set global barcode module settings (^BY) - affects all subsequent barcodes.
   *
   * @remarks
   * Module width, ratio, and height are rounded to integers with a minimum of 1 when provided.
   */
  setBarcodeDefaults(opts: {
    moduleWidth?: number;
    wideToNarrowRatio?: number;
    height?: number;
  }): Label {
    const moduleWidth = clamp1(opts.moduleWidth ?? 2);
    const ratio = clamp1(opts.wideToNarrowRatio ?? 3);
    const height = opts.height != null ? clamp1(opts.height) : '';

    const chunk = `^BY${moduleWidth},${ratio}${height ? ',' + height : ''}`;
    return this._insertBeforeXZ(tokenizeZPL(chunk));
  }
}

/* local helpers */
const clampRange = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(n)));
const clamp1 = (n: number) => Math.max(1, Math.round(n));
const clamp0 = (n: number) => Math.max(0, Math.round(n));
const yn = (b: boolean) => (b ? 'Y' : 'N');
