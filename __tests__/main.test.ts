// @schie/fluent-zpl - Comprehensive Test Suite

import type { Token } from '../src/_types.js'
import { emit } from '../src/core/emit.js'
import { tokenizeZPL } from '../src/core/parse.js'
import { Label, dot, inch, mm, toDots } from '../src/index.js'

describe('Label Factory Methods', () => {
  test('Label.create() should create basic label with defaults', () => {
    const label = Label.create({ w: 400, h: 600 })
    const zpl = label.toZPL()

    expect(zpl).toContain('^XA')
    expect(zpl).toContain('^LL600')
    expect(zpl).toContain('^XZ')
    expect(label.cfg.dpi).toBe(203)
    expect(label.cfg.units).toBe('dot')
  })

  test('Label.create() should handle custom DPI and units', () => {
    const label = Label.create({
      w: 100,
      h: 150,
      dpi: 300,
      units: 'mm'
    })
    const zpl = label.toZPL()

    expect(label.cfg.dpi).toBe(300)
    expect(label.cfg.units).toBe('mm')
    expect(zpl).toContain('^LL177') // 150mm at 300 DPI ≈ 177 dots
  })

  test('Label.create() should handle orientation and origin', () => {
    const label = Label.create({
      w: 400,
      h: 600,
      orientation: 'R',
      origin: { x: 10, y: 20 }
    })
    const zpl = label.toZPL()

    expect(zpl).toContain('^POR')
    expect(zpl).toContain('^LH10,20')
  })

  test('Label.parse() should parse existing ZPL', () => {
    const zplInput = '^XA^FO50,100^A0N,28,28^FDHello World^FS^XZ'
    const label = Label.parse(zplInput)
    const zplOutput = label.toZPL()

    expect(zplOutput).toBe(zplInput)
  })

  test('Label.parse() should handle custom DPI and units', () => {
    const zplInput = '^XA^LL600^XZ'
    const label = Label.parse(zplInput, 300, 'mm')

    expect(label.cfg.dpi).toBe(300)
    expect(label.cfg.units).toBe('mm')
  })

  test('Label should be immutable', () => {
    const label1 = Label.create({ w: 400, h: 600 })
    const label2 = label1.text({
      at: { x: 50, y: 100 },
      text: 'Test'
    })

    expect(label1).not.toBe(label2)
    expect(label1.toZPL()).not.toEqual(label2.toZPL())
  })
})

describe('Text Functionality', () => {
  let label: Label

  beforeEach(() => {
    label = Label.create({ w: 400, h: 600 })
  })

  test('text() should add basic text field', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'Hello World'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FO50,100')
    expect(zpl).toContain('^AAN28,28')
    expect(zpl).toContain('^FDHello World^FS')
  })

  test('text() should handle font configuration', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'Test',
      font: { family: 'B', h: 20, w: 15 }
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^ABN20,15')
  })

  test('text() should handle rotation', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'Test',
      rotate: 'R'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^AAR28,28')
  })

  test('text() should handle text wrapping', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'This is a long text that should wrap',
      wrap: {
        width: 200,
        lines: 5,
        spacing: 2,
        justify: 'C'
      }
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FB200,5,2,C,0')
  })

  test('text() should handle wrap with undefined optional properties', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'Text with minimal wrap',
      wrap: {
        width: 150
        // lines, spacing, justify are undefined - should use defaults
      }
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FB150,10,0,L,0') // defaults: lines=10, spacing=0, justify=L
  })

  test('text() should handle wrap with null spacing and justify', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'Text with null properties',
      wrap: {
        width: 100,
        lines: 3,
        spacing: null as any, // Should use 0 as default
        justify: null as any // Should use 'L' as default
      }
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FB100,3,0,L,0')
  })

  test('text() should escape carets in text', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'Text with ^caret'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FDText with ^^caret^FS')
  })

  test('text() should handle unit conversion', () => {
    const labelMM = Label.create({ w: 100, h: 150, units: 'mm', dpi: 300 })
    const result = labelMM.text({
      at: { x: 10, y: 15 }, // 10mm, 15mm
      text: 'Test'
    })
    const zpl = result.toZPL()

    // 10mm at 300 DPI ≈ 118 dots, 15mm ≈ 177 dots
    expect(zpl).toContain('^FO118,177')
  })
})

describe('Barcode Functionality', () => {
  let label: Label

  beforeEach(() => {
    label = Label.create({ w: 400, h: 600 })
  })

  test('barcode() should create Code128 barcode', () => {
    const result = label.barcode({
      at: { x: 50, y: 100 },
      type: 'Code128',
      data: '1234567890'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FO50,100')
    expect(zpl).toContain('^BCN,100,Y,N,N')
    expect(zpl).toContain('^FD1234567890^FS')
  })

  test('barcode() should create QRCode', () => {
    const result = label.barcode({
      at: { x: 50, y: 100 },
      type: 'QRCode',
      data: 'https://example.com',
      module: 4
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^BQN,2,4')
    expect(zpl).toContain('^FDhttps://example.com^FS')
  })

  test('barcode() should create EAN13', () => {
    const result = label.barcode({
      at: { x: 50, y: 100 },
      type: 'EAN13',
      data: '1234567890123',
      height: 80
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^BEN,80,Y')
  })

  test('barcode() should handle rotation', () => {
    const result = label.barcode({
      at: { x: 50, y: 100 },
      type: 'Code39',
      data: 'TEST123',
      rotate: 'I'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^B3I,2,Y,N')
  })

  test('barcode() should handle all barcode types', () => {
    const types = [
      'Code128',
      'Code39',
      'EAN13',
      'UPCA',
      'ITF',
      'PDF417',
      'QRCode',
      'DataMatrix'
    ] as const

    types.forEach((type) => {
      const result = label.barcode({
        at: { x: 50, y: 100 },
        type,
        data: 'TEST123'
      })
      const zpl = result.toZPL()

      expect(zpl).toContain('^FO50,100')
      expect(zpl).toContain('^FD')
      expect(zpl).toContain('^FS')
    })
  })
})

describe('Box/Graphics Functionality', () => {
  let label: Label

  beforeEach(() => {
    label = Label.create({ w: 400, h: 600 })
  })

  test('box() should create basic box', () => {
    const result = label.box({
      at: { x: 50, y: 100 },
      size: { w: 200, h: 100 }
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FO50,100')
    expect(zpl).toContain('^GB200,100,1,B,0^FS')
  })

  test('box() should handle custom border and fill', () => {
    const result = label.box({
      at: { x: 50, y: 100 },
      size: { w: 200, h: 100 },
      border: 3,
      fill: 'W'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^GB200,100,3,W,0^FS')
  })

  test('box() should handle unit conversion', () => {
    const labelMM = Label.create({ w: 100, h: 150, units: 'mm', dpi: 203 })
    const result = labelMM.box({
      at: { x: 10, y: 15 },
      size: { w: 20, h: 25 }
    })
    const zpl = result.toZPL()

    // Convert mm to dots at 203 DPI
    expect(zpl).toMatch(/\^FO\d+,\d+/)
    expect(zpl).toMatch(/\^GB\d+,\d+,1,B,0\^FS/)
  })
})

describe('Convenience Methods', () => {
  let label: Label

  beforeEach(() => {
    label = Label.create({ w: 400, h: 600 })
  })

  test('caption() should create text with symmetric font size', () => {
    const result = label.caption({
      at: { x: 50, y: 100 },
      text: 'Caption Text',
      size: 32,
      family: 'B'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FO50,100')
    expect(zpl).toContain('^ABN32,32')
    expect(zpl).toContain('^FDCaption Text^FS')
  })

  test('caption() should handle text wrapping', () => {
    const result = label.caption({
      at: { x: 50, y: 100 },
      text: 'Long caption text',
      wrapWidth: 150
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FB150,10,0,L,0')
  })

  test('qr() should create QR code with convenience method', () => {
    const result = label.qr({
      at: { x: 100, y: 200 },
      text: 'https://example.com'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FO100,200')
    expect(zpl).toContain('^BQN,2,3')
    expect(zpl).toContain('^FDhttps://example.com^FS')
  })

  test('gs1_128() should use default values for optional parameters', () => {
    const result = label.gs1_128({
      at: { x: 50, y: 100 },
      ai: { '01': '12345678901234', '21': 'ABC123' }
      // height and rotate are undefined - should use defaults
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FO50,100')
    expect(zpl).toContain('^BCN,100,Y,N,N') // Default height=100, rotate=N
  })

  test('gs1_128() should handle explicit null values for optional parameters', () => {
    const result = label.gs1_128({
      at: { x: 25, y: 50 },
      ai: { '01': '12345678901234' },
      height: null as any, // Should use default 100
      rotate: null as any // Should use default 'N'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^BCN,100,Y,N,N')
  })

  test('gs1_128() should create GS1-128 barcode', () => {
    const result = label.gs1_128({
      at: { x: 50, y: 100 },
      ai: { '01': '12345678901234', '21': 'ABC123' },
      height: 80
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^BCN,80,Y,N,N')
    expect(zpl).toContain('(01)12345678901234')
    expect(zpl).toContain('(21)ABC123')
  })

  test('addressBlock() should create multi-line text', () => {
    const result = label.addressBlock({
      at: { x: 50, y: 100 },
      lines: ['John Doe', '123 Main St', null, 'Anytown, ST 12345'],
      lineHeight: 30,
      size: 20
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FO50,100') // First line
    expect(zpl).toContain('^FO50,130') // Second line (100 + 30)
    expect(zpl).toContain('^FO50,190') // Fourth line (skipped null)
    expect(zpl).toContain('^FDJohn Doe^FS')
    expect(zpl).toContain('^FD123 Main St^FS')
    expect(zpl).toContain('^FDAnytown, ST 12345^FS')
  })

  test('addressBlock() should use default values when optional params are undefined', () => {
    const result = label.addressBlock({
      at: { x: 10, y: 20 },
      lines: ['Line 1', 'Line 2']
      // lineHeight, size, family, rotate are undefined - should use defaults
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^AAN24,24') // Default font: family=A, size=24
    expect(zpl).toContain('^FO10,20') // First line
    expect(zpl).toContain('^FO10,44') // Second line (20 + default lineHeight=24)
  })

  test('addressBlock() should handle empty and null lines', () => {
    const result = label.addressBlock({
      at: { x: 0, y: 0 },
      lines: ['Valid line', '', null, undefined, 'Another valid line'],
      lineHeight: 25
    })
    const zpl = result.toZPL()

    // Should only render non-empty lines
    expect(zpl).toContain('^FDValid line^FS')
    expect(zpl).toContain('^FDAnother valid line^FS')
    expect(zpl).toContain('^FO0,0') // First line
    expect(zpl).toContain('^FO0,100') // Second valid line (skipped empty ones: 0 + 25*4)
  })
})

describe('ZPL Parsing/Tokenization', () => {
  test('tokenizeZPL() should parse basic commands', () => {
    const tokens = tokenizeZPL('^XA^LL600^XZ')

    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toEqual({ k: 'Cmd', mark: '^', name: 'XA', params: '' })
    expect(tokens[1]).toEqual({ k: 'Cmd', mark: '^', name: 'LL', params: '600' })
    expect(tokens[2]).toEqual({ k: 'Cmd', mark: '^', name: 'XZ', params: '' })
  })

  test('tokenizeZPL() should parse FD...FS blocks', () => {
    const tokens = tokenizeZPL('^FDHello World^FS')

    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toEqual({ k: 'FD', data: 'Hello World' })
    expect(tokens[1]).toEqual({ k: 'FS' })
  })

  test('tokenizeZPL() should handle multiline FD blocks', () => {
    const tokens = tokenizeZPL('^FDLine 1\nLine 2^FS')

    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toEqual({ k: 'FD', data: 'Line 1\nLine 2' })
    expect(tokens[1]).toEqual({ k: 'FS' })
  })

  test('tokenizeZPL() should handle raw text between commands', () => {
    const tokens = tokenizeZPL('Some text^XA^LL600More text^XZ')

    expect(tokens[0]).toEqual({ k: 'Raw', text: 'Some text' })
    expect(tokens[1]).toEqual({ k: 'Cmd', mark: '^', name: 'XA', params: '' })
    expect(tokens[2]).toEqual({ k: 'Cmd', mark: '^', name: 'LL', params: '600More text' })
    expect(tokens[3]).toEqual({ k: 'Cmd', mark: '^', name: 'XZ', params: '' })
  })

  test('tokenizeZPL() should handle tilde commands', () => {
    const tokens = tokenizeZPL('~DGR:LOGO.GRF,100,10,ABC')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toEqual({ k: 'Cmd', mark: '~', name: 'DG', params: 'R:LOGO.GRF,100,10,ABC' })
  })

  test('tokenizeZPL() should handle unterminated FD', () => {
    const tokens = tokenizeZPL('^FDUnterminated text')

    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toEqual({ k: 'FD', data: 'Unterminated text' })
  })

  test('tokenizeZPL() should handle Uint8Array input', () => {
    const input = new TextEncoder().encode('^XA^LL600^XZ')
    const tokens = tokenizeZPL(input)

    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toEqual({ k: 'Cmd', mark: '^', name: 'XA', params: '' })
  })
})

describe('ZPL Emission', () => {
  test('emit() should reconstruct ZPL from tokens', () => {
    const tokens: Token[] = [
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Cmd', mark: '^', name: 'FO', params: '50,100' },
      { k: 'FD', data: 'Hello World' },
      { k: 'FS' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' }
    ]

    const zpl = emit(tokens)
    expect(zpl).toBe('^XA^FO50,100^FDHello World^FS^XZ')
  })

  test('emit() should handle raw text tokens', () => {
    const tokens: Token[] = [
      { k: 'Raw', text: 'Some text' },
      { k: 'Cmd', mark: '^', name: 'XA', params: '' }
    ]

    const zpl = emit(tokens)
    expect(zpl).toBe('Some text^XA')
  })

  test('emit() should handle byte tokens', () => {
    const tokens: Token[] = [{ k: 'Bytes', buf: new TextEncoder().encode('Test bytes') }]

    const zpl = emit(tokens)
    expect(zpl).toBe('Test bytes')
  })

  test('toZPL() should produce consistent output', () => {
    const originalZPL = '^XA^FO50,100^A0N,28,28^FDTest^FS^XZ'
    const label = Label.parse(originalZPL)
    const reproduced = label.toZPL()

    expect(reproduced).toBe(originalZPL)
  })
})

describe('Unit Helpers', () => {
  test('dot() should return input unchanged', () => {
    expect(dot(100)).toBe(100)
    expect(dot(0)).toBe(0)
    expect(dot(999)).toBe(999)
  })

  test('mm() should convert millimeters to dots', () => {
    expect(mm(25.4, 203)).toBe(203) // 1 inch = 25.4mm at 203 DPI
    expect(mm(10, 203)).toBeCloseTo(80, 0) // 10mm ≈ 80 dots at 203 DPI
    expect(mm(50, 300)).toBeCloseTo(591, 0) // 50mm at 300 DPI
  })

  test('inch() should convert inches to dots', () => {
    expect(inch(1, 203)).toBe(203)
    expect(inch(0.5, 203)).toBeCloseTo(102, 0)
    expect(inch(2, 300)).toBe(600)
  })

  test('toDots() should convert based on units', () => {
    expect(toDots(100, 203, 'dot')).toBe(100)
    expect(toDots(25.4, 203, 'mm')).toBe(203)
    expect(toDots(1, 203, 'in')).toBe(203)
  })

  test('toDots() should handle different DPI values', () => {
    expect(toDots(1, 203, 'in')).toBe(203)
    expect(toDots(1, 300, 'in')).toBe(300)
    expect(toDots(1, 600, 'in')).toBe(600)
  })
})

describe('Image Functionality', () => {
  let label: Label
  let mockRGBA: Uint8Array

  beforeEach(() => {
    label = Label.create({ w: 400, h: 600 })
    // Create a simple 4x4 RGBA image (black square with white border)
    mockRGBA = new Uint8Array([
      // Row 1: white pixels
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
      // Row 2: white-black-black-white
      255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255,
      // Row 3: white-black-black-white
      255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255,
      // Row 4: white pixels
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255
    ])
  })

  test('imageInline() should create ^GF inline image', () => {
    const result = label.imageInline({
      at: { x: 50, y: 100 },
      rgba: mockRGBA,
      width: 4,
      height: 4
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FO50,100')
    expect(zpl).toContain('^GFA,')
    expect(zpl).toContain('^FS')
  })

  test('imageInline() should handle inversion', () => {
    const result = label.imageInline({
      at: { x: 50, y: 100 },
      rgba: mockRGBA,
      width: 4,
      height: 4,
      invert: true
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^GFA,')
    // Should contain inverted bitmap data
  })

  test('image() should create cached image with ~DG and ^XG', () => {
    const result = label.image({
      at: { x: 50, y: 100 },
      rgba: mockRGBA,
      width: 4,
      height: 4,
      name: 'R:LOGO.GRF'
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('~DGR:LOGO.GRF,')
    expect(zpl).toContain('^FO50,100')
    expect(zpl).toContain('^XGR:LOGO.GRF,1,1')
  })

  test('imageInline() should handle unit conversion', () => {
    const labelMM = Label.create({ w: 100, h: 150, units: 'mm', dpi: 203 })
    const result = labelMM.imageInline({
      at: { x: 10, y: 15 }, // 10mm, 15mm
      rgba: mockRGBA,
      width: 4,
      height: 4
    })
    const zpl = result.toZPL()

    // Should convert mm to dots
    expect(zpl).toMatch(/\^FO\d+,\d+/)
  })

  test('image() should handle different threshold values', () => {
    // Create image with gray pixels that will be affected by threshold
    const grayRGBA = new Uint8Array([
      // Row 1: gray pixels (128, 128, 128) - between thresholds
      128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255,
      // Row 2-4: same gray pixels
      128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128,
      255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255, 128, 128,
      128, 255, 128, 128, 128, 255, 128, 128, 128, 255
    ])

    const result1 = label.imageInline({
      at: { x: 50, y: 100 },
      rgba: grayRGBA,
      width: 4,
      height: 4,
      threshold: 100 // Gray pixels (128) should be white
    })

    const result2 = label.imageInline({
      at: { x: 50, y: 100 },
      rgba: grayRGBA,
      width: 4,
      height: 4,
      threshold: 150 // Gray pixels (128) should be black
    })

    // Different thresholds should produce different results with gray pixels
    expect(result1.toZPL()).not.toBe(result2.toZPL())
  })
})

describe('Integration Scenarios', () => {
  test('should create complete shipping label', () => {
    const label = Label.create({
      w: 400,
      h: 600,
      dpi: 203,
      units: 'dot'
    })
      .caption({
        at: { x: 50, y: 50 },
        text: 'PRIORITY MAIL',
        size: 32,
        family: 'B'
      })
      .addressBlock({
        at: { x: 50, y: 120 },
        lines: ['From:', 'John Sender', '123 Origin St', 'Sender City, ST 12345'],
        lineHeight: 25,
        size: 20
      })
      .addressBlock({
        at: { x: 50, y: 280 },
        lines: ['To:', 'Jane Recipient', '456 Destination Ave', 'Recipient City, ST 67890'],
        lineHeight: 25,
        size: 20
      })
      .barcode({
        at: { x: 50, y: 450 },
        type: 'Code128',
        data: '1234567890123',
        height: 100
      })

    const zpl = label.toZPL()

    expect(zpl).toContain('^XA')
    expect(zpl).toContain('PRIORITY MAIL')
    expect(zpl).toContain('John Sender')
    expect(zpl).toContain('Jane Recipient')
    expect(zpl).toContain('^BCN,100,Y,N,N')
    expect(zpl).toContain('^XZ')
  })

  test('should create product label with QR code', () => {
    const label = Label.create({
      w: 300,
      h: 200,
      units: 'mm',
      dpi: 300
    })
      .caption({
        at: { x: 10, y: 10 },
        text: 'Product: ABC-123',
        size: 24
      })
      .qr({
        at: { x: 10, y: 40 },
        text: 'https://example.com/product/ABC-123',
        module: 3
      })
      .box({
        at: { x: 5, y: 5 },
        size: { w: 290, h: 190 },
        border: 2
      })

    const zpl = label.toZPL()

    expect(zpl).toContain('Product: ABC-123')
    expect(zpl).toContain('^BQN,2,3')
    expect(zpl).toContain('https://example.com/product/ABC-123')
    expect(zpl).toContain('^GB') // Box command
  })

  test('should handle complex multi-element label', () => {
    let label = Label.create({ w: 400, h: 600 })

    // Add multiple elements in sequence
    label = label
      .text({
        at: { x: 50, y: 50 },
        text: 'Header Text',
        font: { family: 'B', h: 28, w: 28 }
      })
      .box({
        at: { x: 40, y: 80 },
        size: { w: 320, h: 2 },
        border: 2
      })
      .barcode({
        at: { x: 50, y: 100 },
        type: 'QRCode',
        data: 'QR Data'
      })
      .barcode({
        at: { x: 200, y: 100 },
        type: 'Code128',
        data: 'BARCODE123'
      })
      .caption({
        at: { x: 50, y: 250 },
        text: 'Footer Caption'
      })

    const zpl = label.toZPL()

    // Check that all elements are present
    expect(zpl).toContain('Header Text')
    expect(zpl).toContain('^GB320,2,2')
    expect(zpl).toContain('^BQN')
    expect(zpl).toContain('^BCN')
    expect(zpl).toContain('Footer Caption')

    // Should have proper structure
    expect(zpl.startsWith('^XA')).toBe(true)
    expect(zpl.endsWith('^XZ')).toBe(true)
  })

  test('should preserve immutability through chaining', () => {
    const baseLabel = Label.create({ w: 400, h: 600 })
    const withText = baseLabel.text({ at: { x: 50, y: 100 }, text: 'Test' })
    const withBarcode = withText.barcode({ at: { x: 50, y: 150 }, type: 'Code128', data: '123' })

    // Each step should create a new instance
    expect(baseLabel).not.toBe(withText)
    expect(withText).not.toBe(withBarcode)

    // Previous instances should be unchanged
    expect(baseLabel.toZPL()).not.toContain('Test')
    expect(withText.toZPL()).toContain('Test')
    expect(withText.toZPL()).not.toContain('^BC')
    expect(withBarcode.toZPL()).toContain('Test')
    expect(withBarcode.toZPL()).toContain('^BC')
  })

  test('should handle edge cases gracefully', () => {
    // Empty text
    const withEmptyText = Label.create({ w: 400, h: 600 }).text({ at: { x: 0, y: 0 }, text: '' })

    expect(withEmptyText.toZPL()).toContain('^FD^FS')

    // Zero dimensions
    const withZeroBox = Label.create({ w: 400, h: 600 }).box({
      at: { x: 50, y: 100 },
      size: { w: 0, h: 0 }
    })

    expect(withZeroBox.toZPL()).toContain('^GB0,0,1')

    // Special characters in text
    const withSpecialChars = Label.create({ w: 400, h: 600 }).text({
      at: { x: 50, y: 100 },
      text: 'Text with ^caret and "quotes"'
    })

    expect(withSpecialChars.toZPL()).toContain('^^caret')
  })

  test('should handle different unit systems consistently', () => {
    const dotLabel = Label.create({ w: 400, h: 600, units: 'dot', dpi: 203 })
    const mmLabel = Label.create({ w: 100, h: 150, units: 'mm', dpi: 203 })
    const inchLabel = Label.create({ w: 2, h: 3, units: 'in', dpi: 203 })

    // All should produce similar label heights when converted
    const dotZPL = dotLabel.toZPL()
    const mmZPL = mmLabel.toZPL()
    const inchZPL = inchLabel.toZPL()

    expect(dotZPL).toContain('^LL600')
    expect(mmZPL).toMatch(/\^LL\d+/) // Should be converted from mm
    expect(inchZPL).toMatch(/\^LL\d+/) // Should be converted from inches
  })
})
