// Tests for src/image/api.ts helpers

import type { DPI } from '../../src/_types.js'
import { Units } from '../../src/_types.js'
import { emit } from '../../src/core/emit.js'
import { buildImageCachedTokens, buildImageInlineTokens } from '../../src/image/api.js'

const baseRGBA = new Uint8Array([
  255,
  255,
  255,
  255,
  0,
  0,
  0,
  255,
  128,
  128,
  128,
  255,
  255,
  255,
  255,
  255
])

describe('buildImageInlineTokens()', () => {
  const cfg = { dpi: 203 as DPI, units: Units.Dot }

  test('emits ^FO and ^GF commands', () => {
    const tokens = buildImageInlineTokens(cfg, {
      at: { x: 50, y: 100 },
      rgba: baseRGBA,
      width: 2,
      height: 2
    })
    const zpl = emit(tokens)

    expect(zpl).toContain('^FO50,100')
    expect(zpl).toContain('^GFA,')
    expect(zpl).toContain('^FS')
  })

  test('respects unit conversion when cfg uses millimeters', () => {
    const mmCfg = { dpi: 203 as DPI, units: Units.Millimeter }
    const tokens = buildImageInlineTokens(mmCfg, {
      at: { x: 10, y: 5 },
      rgba: baseRGBA,
      width: 2,
      height: 2
    })
    const zpl = emit(tokens)

    expect(zpl).toMatch(/\^FO8\d,4\d/) // 10mm ≈ 80 dots, 5mm ≈ 40 dots
  })
})

describe('buildImageCachedTokens()', () => {
  const cfg = { dpi: 203 as DPI, units: Units.Dot }

  test('emits ~DG payload and ^XG recall', () => {
    const tokens = buildImageCachedTokens(cfg, {
      name: 'R:LOGO.GRF',
      at: { x: 25, y: 30 },
      rgba: baseRGBA,
      width: 2,
      height: 2
    })
    const zpl = emit(tokens)

    expect(zpl).toContain('~DGR:LOGO.GRF')
    expect(zpl).toContain('^FO25,30')
    expect(zpl).toContain('^XGR:LOGO.GRF,1,1')
    expect(zpl).toContain('^FS')
  })

  test('normalizes device/name casing before encoding', () => {
    const tokens = buildImageCachedTokens(cfg, {
      name: 'e:m y logo.grf',
      at: { x: 0, y: 0 },
      rgba: baseRGBA,
      width: 2,
      height: 2
    })
    const zpl = emit(tokens)

    expect(zpl).toContain('~DGE:M Y LOGO.GRF')
    expect(zpl).toContain('^XGE:M Y LOGO.GRF,1,1')
  })
})
