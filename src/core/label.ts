// src/core/label.ts
// @schie/fluent-zpl – Label class (fluent, immutable)

import type {
  BarcodeOpts,
  BoxOpts,
  DPI,
  LabelOptions,
  Orientation,
  RFIDOpts,
  TextOpts,
  Token,
  Units
} from '../_types.js'
import { toDots } from '../_unit-helpers.js'
import {
  buildImageCachedTokens,
  buildImageInlineTokens,
  ImageCachedOpts,
  ImageInlineOpts
} from '../image/api.js'
import { emit } from './emit.js'
import { findLastXZ, tokenizeZPL } from './parse.js'

export class Label {
  /** Lossless token stream is the single source of truth for this Label */
  private readonly tokens: Token[]
  /** Public so advanced users (and your own components) can read cfg if needed */
  public readonly cfg: { dpi: DPI; units: Units }

  private constructor(tokens: Token[], cfg: { dpi: DPI; units: Units }) {
    this.tokens = tokens
    this.cfg = cfg
  }

  // ---------------------------------------------------------------------------
  // Factories
  // ---------------------------------------------------------------------------

  /** Create a fresh label (^XA … ^XZ) with basic page setup */
  static create(opts: LabelOptions): Label {
    const dpi: DPI = (opts.dpi ?? 203) as DPI
    const units: Units = opts.units ?? 'dot'

    const head: string[] = ['^XA']
    if (opts.orientation) head.push(`^PO${opts.orientation}`)
    if (opts.origin)
      head.push(`^LH${toDots(opts.origin.x, dpi, units)},${toDots(opts.origin.y, dpi, units)}`)
    head.push(`^LL${toDots(opts.h, dpi, units)}`)

    // If you want to store width explicitly later, you can add ^PW here as well.

    const tokens = tokenizeZPL(head.join('') + '^XZ')
    return new Label(tokens, { dpi, units })
  }

  /** Parse an existing ZPL string/bytes into a fluent Label instance */
  static parse(zpl: string | Uint8Array, dpi: DPI = 203 as DPI, units: Units = 'dot'): Label {
    const tokens = tokenizeZPL(zpl)
    return new Label(tokens, { dpi, units })
  }

  /** Back-compat alias if you like the old name */
  static fromZPL = Label.parse

  // ---------------------------------------------------------------------------
  // Core building blocks (primitive fluent methods)
  // ---------------------------------------------------------------------------

  /** Add a text field */
  text(o: TextOpts): Label {
    const { dpi, units } = this.cfg

    const parts: string[] = []
    parts.push(`^FO${toDots(o.at.x, dpi, units)},${toDots(o.at.y, dpi, units)}`)

    const fam = o.font?.family ?? 'A'
    const rot: Orientation = o.rotate ?? 'N'
    // Use reasonable defaults for font size if not specified (ZPL requires these parameters)
    const h = o.font?.h != null ? clamp1(o.font.h) : 28
    const w = o.font?.w != null ? clamp1(o.font.w) : 28

    parts.push(`^A${fam}${rot}${h},${w}`)

    if (o.wrap) {
      const width = toDots(o.wrap.width, dpi, units)
      const lines = o.wrap.lines ?? 10
      const spacing = clamp0(o.wrap.spacing ?? 0)
      const just = o.wrap.justify ?? 'L'
      parts.push(`^FB${width},${lines},${spacing},${just},0`)
    }

    parts.push(`^FD${Label.escFD(o.text)}^FS`)

    return this._insertBeforeXZ(tokenizeZPL(parts.join('')))
  }

  /** Add a barcode field */
  barcode(o: BarcodeOpts): Label {
    const { dpi, units } = this.cfg
    const x = toDots(o.at.x, dpi, units)
    const y = toDots(o.at.y, dpi, units)
    const m = o.module ?? 2
    const h = o.height ?? 100
    const r = o.rotate ?? 'N'

    let spec = ''
    switch (o.type) {
      case 'Code128':
        spec = `^BC${r},${h},Y,N,N`
        break
      case 'Code39':
        spec = `^B3${r},${m},Y,N`
        break
      case 'EAN13':
        spec = `^BE${r},${h},Y`
        break
      case 'UPCA':
        spec = `^B8${r},${h},Y,N,N`
        break
      case 'ITF':
        spec = `^BI${r},${h},Y,N`
        break
      case 'PDF417':
        spec = `^B7${r},${m},${m},3,N,N,N`
        break
      case 'QRCode':
        spec = `^BQ${r},2,${m}`
        break
      case 'DataMatrix':
        spec = `^BX${r},${m},200`
        break
    }

    const chunk = `^FO${x},${y}${spec}^FD${Label.escFD(o.data)}^FS`
    return this._insertBeforeXZ(tokenizeZPL(chunk))
  }

  /** Draw a box/line */
  box(o: BoxOpts): Label {
    const { dpi, units } = this.cfg
    const x = toDots(o.at.x, dpi, units)
    const y = toDots(o.at.y, dpi, units)
    const w = toDots(o.size.w, dpi, units)
    const h = toDots(o.size.h, dpi, units)
    const t = clamp1(o.border ?? 1)
    const fill = o.fill ?? 'B'
    const chunk = `^FO${x},${y}^GB${w},${h},${t},${fill},0^FS`
    return this._insertBeforeXZ(tokenizeZPL(chunk))
  }

  // ---------------------------------------------------------------------------
  // DX sugar (former "components" as fluent methods)
  // ---------------------------------------------------------------------------

  /** Caption text with symmetric h/w and optional wrap width */
  caption(o: {
    at: { x: number; y: number }
    text: string
    size?: number // dots
    family?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | '0'
    rotate?: Orientation
    wrapWidth?: number // in current units
  }): Label {
    const { dpi, units } = this.cfg
    const size = clamp1(o.size ?? 24)
    const wrap =
      o.wrapWidth != null
        ? { width: toDots(o.wrapWidth, dpi, units), lines: 10, spacing: 0, justify: 'L' as const }
        : undefined

    return this.text({
      at: o.at,
      text: o.text,
      rotate: o.rotate ?? 'N',
      font: { family: o.family ?? 'A', h: size, w: size },
      wrap
    })
  }

  /** Convenience QR method using ^BQ under the hood */
  qr(o: {
    at: { x: number; y: number }
    text: string
    module?: number
    rotate?: Orientation
  }): Label {
    return this.barcode({
      at: o.at,
      type: 'QRCode',
      data: o.text,
      module: o.module ?? 3,
      rotate: o.rotate ?? 'N'
    })
  }

  /** Pragmatic GS1-128 helper rendered via Code128 */
  gs1_128(o: {
    at: { x: number; y: number }
    ai: Record<string, string | number>
    height?: number
    rotate?: Orientation
  }): Label {
    const data = Label.gs1Data(o.ai)
    return this.barcode({
      at: o.at,
      type: 'Code128',
      data,
      height: o.height ?? 100,
      rotate: o.rotate ?? 'N'
    })
  }

  /** Multiline text block for addresses/blocks */
  addressBlock(o: {
    at: { x: number; y: number }
    lines: Array<string | undefined | null>
    lineHeight?: number // dots between lines
    size?: number // font size in dots
    family?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | '0'
    rotate?: Orientation
  }): Label {
    const lh = clamp1(o.lineHeight ?? 24)
    const size = clamp1(o.size ?? 24)
    const fam = o.family ?? 'A'
    let y = o.at.y
    let acc: Label = this

    for (const line of o.lines) {
      if (!line) {
        y += lh
        continue
      }
      acc = acc.caption({
        at: { x: o.at.x, y },
        text: line,
        size,
        family: fam,
        rotate: o.rotate ?? 'N'
      })
      y += lh
    }
    return acc
  }

  /** Inline bitmap (^GF) — fully self-contained */
  imageInline(o: ImageInlineOpts): Label {
    const toks = buildImageInlineTokens(this.cfg, o)
    return this._insertBeforeXZ(toks)
  }

  /** RFID field for EPC encoding */
  rfid(o: RFIDOpts): Label {
    const { dpi, units } = this.cfg
    const x = toDots(o.at.x, dpi, units)
    const y = toDots(o.at.y, dpi, units)
    const bank = o.bank ?? 'EPC'
    const offset = o.offset ?? 0
    const length = o.length ?? o.epc.length / 2 // hex pairs to words

    // ^RF command: ^RFw,h,protocol,read,password
    // Basic RFID field positioning and EPC write
    const rfCmd = `^RF${x},${y},0,1,${o.password ?? '00000000'}`

    // EPC write command based on memory bank
    let writeCmd = ''
    switch (bank) {
      case 'EPC':
        writeCmd = `^RFW,E,${offset},${length},${o.epc}`
        break
      case 'USER':
        writeCmd = `^RFW,U,${offset},${length},${o.epc}`
        break
      case 'TID':
        // TID is typically read-only, but include for completeness
        writeCmd = `^RFW,T,${offset},${length},${o.epc}`
        break
    }

    const chunk = `${rfCmd}^FD${writeCmd}^FS`
    return this._insertBeforeXZ(tokenizeZPL(chunk))
  }

  /** Read RFID tag data */
  rfidRead(o: {
    at: { x: number; y: number }
    bank?: 'EPC' | 'TID' | 'USER'
    offset?: number
    length?: number
    password?: string
  }): Label {
    const { dpi, units } = this.cfg
    const x = toDots(o.at.x, dpi, units)
    const y = toDots(o.at.y, dpi, units)
    const bank = o.bank ?? 'EPC'
    const offset = o.offset ?? 0
    const length = o.length ?? 8

    const rfCmd = `^RF${x},${y},0,0,${o.password ?? '00000000'}`
    const readCmd = `^RFR,${bank.charAt(0)},${offset},${length}`

    const chunk = `${rfCmd}^FD${readCmd}^FS`
    return this._insertBeforeXZ(tokenizeZPL(chunk))
  }

  /** EPC encoding convenience method */
  epc(o: {
    at: { x: number; y: number }
    epc: string
    position?: number
    password?: string
  }): Label {
    return this.rfid({
      at: o.at,
      epc: o.epc,
      position: o.position,
      password: o.password,
      bank: 'EPC'
    })
  }

  /** Cached asset (~DG + ^XG). Consider pairing with a registry for dedupe. */
  image(o: ImageCachedOpts): Label {
    const toks = buildImageCachedTokens(this.cfg, o)
    return this._insertBeforeXZ(toks)
  }

  // ---------------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------------

  /** Emit the final ZPL string. Untouched tokens re-emit byte-identical. */
  toZPL(): string {
    return emit(this.tokens)
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /** Insert a token chunk immediately before the last ^XZ in the stream */
  private _insertBeforeXZ(newTokens: Token[]): Label {
    const idx = findLastXZ(this.tokens)
    const next = [...this.tokens]
    next.splice(idx, 0, ...newTokens)
    return new Label(next, this.cfg)
  }

  /** Escape carets inside ^FD payloads per ZPL rules */
  private static escFD(s: string): string {
    return String(s).replace(/\^/g, '^^')
  }

  /** Minimal GS1 helper: inserts GS between variable-length AIs */
  private static gs1Data(aiMap: Record<string, string | number>): string {
    const GS = String.fromCharCode(29)
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
      '423'
    ])

    const pairs = Object.entries(aiMap)
    let out = ''
    for (let i = 0; i < pairs.length; i++) {
      const [ai, valueRaw] = pairs[i]
      const value = String(valueRaw)
      // HRI-friendly composition. ZPL will encode FNC1 with GS char inside ^FD.
      out += `(${ai})${value}`
      if (i < pairs.length - 1 && variableLenAIs.has(ai)) out += GS
    }
    return out
  }

  /** Add a ZPL comment (^FX) - useful for debugging and documentation */
  comment(text: string): Label {
    const newTokens = [...this.tokens]
    const insertIndex = findLastXZ(newTokens)

    newTokens.splice(insertIndex, 0, {
      k: 'Cmd',
      mark: '^',
      name: 'FX',
      params: ` ${text}`
    })

    return new Label(newTokens, this.cfg)
  }

  /** Add metadata as ZPL comments (^FX) for debugging and traceability */
  withMetadata(meta: Record<string, string | number>): Label {
    let result: Label = this

    Object.entries(meta).forEach(([key, value]) => {
      result = result.comment(`${key}: ${value}`)
    })

    return result
  }
}

/* local helpers */
const clamp1 = (n: number) => Math.max(1, Math.round(n))
const clamp0 = (n: number) => Math.max(0, Math.round(n))
