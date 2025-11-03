// src/images/encoder.ts
// Image → Monochrome → ZPL (^GF inline, or ~DG + ^XG asset)
// No external deps. Callers provide RGBA pixels (Uint8Array/Uint8ClampedArray).

/* =========================
 * Public types
 * ========================= */

export type DitherMode = 'none' | 'threshold' | 'fs' | 'ordered'

export interface MonoOptions {
  /** Dithering / quantization strategy. Default: "threshold" */
  mode?: DitherMode
  /** 0..255 threshold used when mode="threshold" (default 200) */
  threshold?: number
  /** Invert final monochrome (useful for negative logos) */
  invert?: boolean
}

export interface MonoBitmap {
  /** Width in pixels (dots) */
  width: number
  /** Height in pixels (dots) */
  height: number
  /** 1-bit packed rows, MSB leftmost; length = bytesPerRow * height */
  bytes: Uint8Array
  /** ceil(width/8) */
  bytesPerRow: number
}

export interface FromRGBAParams extends MonoOptions {
  /** Interleaved RGBA bytes (len = width*height*4) */
  rgba: Uint8Array | Uint8ClampedArray
  width: number
  height: number
}

export interface EncodeGFResult {
  /** ASCII hex payload (uppercase), continuous (no newlines) */
  hex: string
  /** Total bytes in payload (equals mono.bytes.length) */
  totalBytes: number
  /** Bytes per row */
  bytesPerRow: number
  /** Convenience: full ^GF line (type A = ASCII hex, no compression) */
  gfCommand: string // e.g. ^GFA,<total>,<total>,<bpr>,<hex>
}

export interface EncodeDGResult {
  /** ASCII hex payload (uppercase), continuous (no newlines) */
  hex: string
  /** Total bytes in payload (equals mono.bytes.length) */
  totalBytes: number
  /** Bytes per row */
  bytesPerRow: number
  /** Convenience: the ~DG header + payload (no line breaks) */
  dgCommand: string // e.g. ~DG{NAME},{total},{bpr},<hex>
  /** Convenience: recall command for use in a field */
  xgCommand: string // e.g. ^XG{NAME},1,1
}

/* =========================
 * Public API
 * ========================= */

/**
 * Convert interleaved RGBA → monochrome 1-bit bitmap (packed).
 * - MSB is the leftmost pixel in each byte
 * - Dithering options supported via MonoOptions
 */
export function monoFromRGBA(params: FromRGBAParams): MonoBitmap {
  const { rgba, width, height, threshold = 200, invert = false } = params
  const mode: DitherMode = params.mode ?? 'threshold'

  // 1) Grayscale luminance (0..255) into a temp buffer
  const lum = new Uint8Array(width * height)
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    const r = rgba[i]
    const g = rgba[i + 1]
    const b = rgba[i + 2]
    // ITU-R BT.601 luma
    lum[j] = clamp255((r * 299 + g * 587 + b * 114) / 1000)
  }

  // 2) Dither / threshold to binary (0/1) into temp boolean-ish buffer
  const monoBits = new Uint8Array(width * height)
  switch (mode) {
    case 'none':
    case 'threshold':
      binarizeThreshold(lum, monoBits, width, height, threshold)
      break
    case 'fs':
      ditherFloydSteinberg(lum, monoBits, width, height, threshold)
      break
    case 'ordered':
      ditherOrdered4x4(lum, monoBits, width, height, threshold)
      break
  }

  if (invert) {
    for (let i = 0; i < monoBits.length; i++) monoBits[i] ^= 1
  }

  // 3) Pack 1bpp rows (MSB-left)
  const bytesPerRow = Math.ceil(width / 8)
  const bytes = new Uint8Array(bytesPerRow * height)
  for (let y = 0; y < height; y++) {
    const rowOff = y * width
    const outOff = y * bytesPerRow
    packRowMSB(monoBits.subarray(rowOff, rowOff + width), bytes, outOff)
  }

  return { width, height, bytes, bytesPerRow }
}

/**
 * Build a ^GF payload (ASCII hex, type A) from a monochrome bitmap.
 * Caller can then embed it like:
 *   ^FOx,y
 *   {result.gfCommand}
 *   ^FS
 */
export function encodeGF(mono: MonoBitmap): EncodeGFResult {
  const hex = toHex(mono.bytes)
  const totalBytes = mono.bytes.length
  const gfCommand = `^GFA,${totalBytes},${totalBytes},${mono.bytesPerRow},${hex}`
  return { hex, totalBytes, bytesPerRow: mono.bytesPerRow, gfCommand }
}

/**
 * Build a ~DG payload (GRF) for cached assets, with accompanying ^XG recall.
 * Typical usage:
 *   // at job/session start (or once):
 *   ~DG{NAME},{totalBytes},{bytesPerRow},{hex}
 *   // later in fields:
 *   ^FOx,y^XG{NAME},1,1^FS
 */
export function encodeDG(name: string, mono: MonoBitmap): EncodeDGResult {
  const safeName = normalizeGrfName(name)
  const hex = toHex(mono.bytes)
  const totalBytes = mono.bytes.length
  const dgCommand = `~DG${safeName},${totalBytes},${mono.bytesPerRow},${hex}`
  const xgCommand = `^XG${safeName},1,1`
  return { hex, totalBytes, bytesPerRow: mono.bytesPerRow, dgCommand, xgCommand }
}

/* =========================
 * Helpers: binarization / dithering
 * ========================= */

function binarizeThreshold(lum: Uint8Array, outBits: Uint8Array, w: number, h: number, t: number) {
  for (let i = 0; i < lum.length; i++) outBits[i] = lum[i] >= t ? 0 : 1
  // Convention: 1 = black dot; 0 = white. This matches typical ZPL expectations.
}

function ditherFloydSteinberg(
  lum: Uint8Array,
  outBits: Uint8Array,
  w: number,
  h: number,
  t: number
) {
  // Error diffusion on copy to avoid altering input
  const buf = new Float32Array(lum.length)
  for (let i = 0; i < lum.length; i++) buf[i] = lum[i]

  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      const idx = row + x
      const old = buf[idx]
      const newVal = old >= t ? 255 : 0
      const err = old - newVal
      outBits[idx] = newVal === 0 ? 1 : 0 // 0->black? careful: we keep convention 1=black
      // Distribute error
      // Right
      if (x + 1 < w) buf[idx + 1] += (err * 7) / 16
      // Down-left
      if (y + 1 < h && x - 1 >= 0) buf[idx + w - 1] += (err * 3) / 16
      // Down
      if (y + 1 < h) buf[idx + w] += (err * 5) / 16
      // Down-right
      if (y + 1 < h && x + 1 < w) buf[idx + w + 1] += (err * 1) / 16
    }
  }
}

function ditherOrdered4x4(lum: Uint8Array, outBits: Uint8Array, w: number, h: number, t: number) {
  // 4x4 Bayer threshold map (0..15)
  const M = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      const m = M[(y & 3) * 4 + (x & 3)] // pattern value 0..15
      const thresh = ((m + 0.5) * 255) / 16 // distribute across 0..255
      const decide = lum[idx] + (t - 127) >= thresh ? 0 : 1
      outBits[idx] = decide
    }
  }
}

/* =========================
 * Helpers: packing / hex
 * ========================= */

function packRowMSB(rowBits: Uint8Array, out: Uint8Array, outOffset: number) {
  let byte = 0
  let bit = 7
  let outIdx = outOffset
  for (let i = 0; i < rowBits.length; i++) {
    if (rowBits[i]) byte |= 1 << bit
    bit--
    if (bit < 0) {
      out[outIdx++] = byte
      byte = 0
      bit = 7
    }
  }
  if (bit !== 7) out[outIdx++] = byte // flush any partial
}

function toHex(bytes: Uint8Array): string {
  // Uppercase hex, no separators
  const lut = HEX_LUT
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    out += lut[(b >>> 4) & 0xf] + lut[b & 0xf]
  }
  return out
}
const HEX_LUT = '0123456789ABCDEF'

/* =========================
 * Helpers: GRF name & clamps
 * ========================= */

function normalizeGrfName(name: string): string {
  // Expect something like "R:LOGO.GRF" or "E:IMG0001.GRF"
  // If caller passes bare "LOGO", map to RAM device + GRF extension.
  let n = name.trim()
  if (!/^[A-Z]:/i.test(n)) n = `R:${n}`
  if (!/\.GRF$/i.test(n)) n = `${n}.GRF`
  // Zebra is case-insensitive; we’ll uppercase for neatness.
  return n.toUpperCase()
}

export const clamp255 = (n: number) => (n < 0 ? 0 : n > 255 ? 255 : n | 0)

/* =========================
 * Convenience: end-to-end helpers
 * ========================= */

/**
 * High-level: RGBA → MonoBitmap (with optional scaling)
 * If you need scaling, do it prior to calling this (or add a simple nearest-neighbor here).
 */
export function monoFromImageData(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  opts?: MonoOptions
): MonoBitmap {
  return monoFromRGBA({ rgba, width, height, ...opts })
}

/**
 * Build full inline ZPL block (with ^FO) for ^GF
 * Example:
 *   const mono = monoFromImageData(rgba, w, h, { mode:"fs" });
 *   const zpl = buildGFAt({ x: 120, y: 40 }, mono);
 */
export function buildGFAt(at: { x: number; y: number }, mono: MonoBitmap): string {
  const { gfCommand } = encodeGF(mono)
  return `^FO${at.x},${at.y}${gfCommand}^FS`
}

/**
 * Build full cached ZPL block (~DG + optional ^FO/^XG)
 * You typically emit ~DG once (e.g., at start), then reuse ^XG many times.
 * Example:
 *   const mono = monoFromImageData(rgba, w, h);
 *   const { dg, xg } = buildDGAndRecall("R:LOGO.GRF", { x: 50, y: 30 }, mono);
 */
export function buildDGAndRecall(
  name: string,
  at: { x: number; y: number } | null,
  mono: MonoBitmap
): { dg: string; recall: string } {
  const res = encodeDG(name, mono)
  const recall = at ? `^FO${at.x},${at.y}${res.xgCommand}^FS` : res.xgCommand
  return { dg: res.dgCommand, recall }
}
