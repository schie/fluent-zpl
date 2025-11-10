// @schie/fluent-zpl - Label-focused Test Suite

import { Label } from '../../src/core/label.js'
import {
  Barcode,
  Fill,
  FontFamily,
  Justify,
  Orientation,
  RFIDBank,
  Units
} from '../../src/_types.js'

describe('Label Factory Methods', () => {
  test('Label.create() should create basic label with defaults', () => {
    const label = Label.create({ w: 400, h: 600 })
    const zpl = label.toZPL()

    expect(zpl).toContain('^XA')
    expect(zpl).toContain('^LL600')
    expect(zpl).toContain('^XZ')
    expect(label.cfg.dpi).toBe(203)
    expect(label.cfg.units).toBe(Units.Dot)
  })

  test('Label.create() should handle custom DPI and units', () => {
    const label = Label.create({
      w: 100,
      h: 150,
      dpi: 300,
      units: Units.Millimeter
    })
    const zpl = label.toZPL()

    expect(label.cfg.dpi).toBe(300)
    expect(label.cfg.units).toBe(Units.Millimeter)
    expect(zpl).toContain('^LL177') // 150mm at 300 DPI ≈ 177 dots
  })

  test('Label.create() should handle orientation and origin', () => {
    const label = Label.create({
      w: 400,
      h: 600,
      orientation: Orientation.Rotated90,
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
    const label = Label.parse(zplInput, 300, Units.Millimeter)

    expect(label.cfg.dpi).toBe(300)
    expect(label.cfg.units).toBe(Units.Millimeter)
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
    expect(zpl).toContain('^AAN,28,28')
    expect(zpl).toContain('^FDHello World^FS')
  })

  test('text() should handle font configuration', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'Test',
      font: { family: FontFamily.B, h: 20, w: 15 }
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^ABN,20,15')
  })

  test('text() should handle rotation', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'Test',
      rotate: Orientation.Rotated90
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^AAR,28,28')
  })

  test('text() should handle text wrapping', () => {
    const result = label.text({
      at: { x: 50, y: 100 },
      text: 'This is a long text that should wrap',
      wrap: {
        width: 200,
        lines: 5,
        spacing: 2,
        justify: Justify.Center
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
    const labelMM = Label.create({ w: 100, h: 150, units: Units.Millimeter, dpi: 300 })
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
      type: Barcode.Code128,
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
      type: Barcode.QRCode,
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
      type: Barcode.EAN13,
      data: '1234567890123',
      height: 80
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^BEN,80,Y')
  })

  test('barcode() should handle rotation', () => {
    const result = label.barcode({
      at: { x: 50, y: 100 },
      type: Barcode.Code39,
      data: 'TEST123',
      rotate: Orientation.Inverted180
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^B3I,2,Y,N')
  })

  test('barcode() should handle all barcode types', () => {
    const types = [
      Barcode.Code128,
      Barcode.Code39,
      Barcode.EAN13,
      Barcode.UPCA,
      Barcode.ITF,
      Barcode.PDF417,
      Barcode.QRCode,
      Barcode.DataMatrix
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
      fill: Fill.White
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^GB200,100,3,W,0^FS')
  })

  test('box() should honor reverse drawing flag', () => {
    const result = label.box({
      at: { x: 60, y: 120 },
      size: { w: 150, h: 60 },
      border: 2,
      fill: Fill.White,
      reverse: true
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FR^GB150,60,2,W,0^FS')
  })

  test('box() should handle unit conversion', () => {
    const labelMM = Label.create({ w: 100, h: 150, units: Units.Millimeter, dpi: 203 })
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
      family: FontFamily.B
    })
    const zpl = result.toZPL()

    expect(zpl).toContain('^FO50,100')
    expect(zpl).toContain('^ABN,32,32')
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

    expect(zpl).toContain('^AAN,24,24') // Default font: family=A, size=24
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
    const labelMM = Label.create({ w: 100, h: 150, units: Units.Millimeter, dpi: 203 })
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
      units: Units.Dot
    })
      .caption({
        at: { x: 50, y: 50 },
        text: 'PRIORITY MAIL',
        size: 32,
        family: FontFamily.B
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
        type: Barcode.Code128,
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
      units: Units.Millimeter,
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
        font: { family: FontFamily.B, h: 28, w: 28 }
      })
      .box({
        at: { x: 40, y: 80 },
        size: { w: 320, h: 2 },
        border: 2
      })
      .barcode({
        at: { x: 50, y: 100 },
        type: Barcode.QRCode,
        data: 'QR Data'
      })
      .barcode({
        at: { x: 200, y: 100 },
        type: Barcode.Code128,
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
    const withBarcode = withText.barcode({
      at: { x: 50, y: 150 },
      type: Barcode.Code128,
      data: '123'
    })

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
    const dotLabel = Label.create({ w: 400, h: 600, units: Units.Dot, dpi: 203 })
    const mmLabel = Label.create({ w: 100, h: 150, units: Units.Millimeter, dpi: 203 })
    const inchLabel = Label.create({ w: 2, h: 3, units: Units.Inch, dpi: 203 })

    // All should produce similar label heights when converted
    const dotZPL = dotLabel.toZPL()
    const mmZPL = mmLabel.toZPL()
    const inchZPL = inchLabel.toZPL()

    expect(dotZPL).toContain('^LL600')
    expect(mmZPL).toMatch(/\^LL\d+/) // Should be converted from mm
    expect(inchZPL).toMatch(/\^LL\d+/) // Should be converted from inches
  })
})

describe('Real-world ZPL Examples', () => {
  test('should generate valid shipping label ZPL', () => {
    const label = Label.create({ w: 400, h: 600, dpi: 203, units: Units.Dot })
      .text({
        at: { x: 50, y: 50 },
        text: 'FEDEX GROUND',
        font: { family: FontFamily.B, h: 28, w: 28 }
      })
      .box({
        at: { x: 10, y: 10 },
        size: { w: 380, h: 580 },
        border: 2
      })
      .text({
        at: { x: 50, y: 100 },
        text: 'SHIP TO:',
        font: { family: FontFamily.A, h: 20, w: 20 }
      })
      .addressBlock({
        at: { x: 50, y: 130 },
        lines: ['JOHN DOE', '123 MAIN STREET', 'ANYTOWN NY 12345-6789'],
        lineHeight: 25,
        size: 20
      })
      .barcode({
        at: { x: 50, y: 250 },
        type: Barcode.Code128,
        data: '1234567890123',
        height: 80
      })
      .text({
        at: { x: 50, y: 350 },
        text: 'Tracking: 1234567890123',
        font: { family: FontFamily.A, h: 16, w: 16 }
      })

    const zpl = label.toZPL()

    expect(zpl).toMatch(/^\^XA.*\^XZ$/)
    expect(zpl).toContain('^LL600')
    expect(zpl).toContain('FEDEX GROUND')
    expect(zpl).toContain('SHIP TO:')
    expect(zpl).toContain('JOHN DOE')
    expect(zpl).toContain('123 MAIN STREET')
    expect(zpl).toContain('ANYTOWN NY 12345-6789')
    expect(zpl).toContain('Tracking: 1234567890123')
    expect(zpl).toContain('^GB380,580,2,B,0')
    expect(zpl).toContain('^BCN,80,Y,N,N')
    expect(zpl).toContain('^FD1234567890123^FS')

    const fieldOrigins = zpl.match(/\^FO\d+,\d+/g) || []
    expect(fieldOrigins.length).toBeGreaterThan(0)

    const fdBlocks = zpl.match(/\^FD[^]*?\^FS/g) || []
    expect(fdBlocks.length).toBeGreaterThan(0)
  })

  test('should generate valid product label with QR code', () => {
    const label = Label.create({ w: 300, h: 200, units: Units.Millimeter, dpi: 203 })
      .caption({
        at: { x: 10, y: 10 },
        text: 'PRODUCT LABEL',
        size: 24,
        family: FontFamily.B
      })
      .text({
        at: { x: 10, y: 40 },
        text: 'SKU: ABC-123-XYZ',
        font: { family: FontFamily.A, h: 16, w: 16 }
      })
      .qr({
        at: { x: 180, y: 40 },
        text: 'https://example.com/product/ABC-123-XYZ',
        module: 3
      })
      .box({
        at: { x: 5, y: 5 },
        size: { w: 290, h: 190 },
        border: 1
      })
      .text({
        at: { x: 10, y: 160 },
        text: 'Price: $29.99',
        font: { family: FontFamily.B, h: 20, w: 20 }
      })

    const zpl = label.toZPL()

    expect(zpl).toMatch(/^\^XA.*\^XZ$/)
    expect(zpl).toContain('^LL1598') // 200mm at 203 DPI ≈ 1598 dots
    expect(zpl).toContain('PRODUCT LABEL')
    expect(zpl).toContain('SKU: ABC-123-XYZ')
    expect(zpl).toContain('Price: $29.99')
    expect(zpl).toContain('^BQN,2,3')
    expect(zpl).toContain('https://example.com/product/ABC-123-XYZ')
    expect(zpl).toContain('^GB')
  })
})

describe('Global Settings Functionality', () => {
  test('setDefaultFont() should generate CF command with all parameters', () => {
    const label = Label.create({ w: 400, h: 600 }).setDefaultFont({
      family: FontFamily.B,
      height: 32,
      width: 24
    })

    const zpl = label.toZPL()
    expect(zpl).toContain('^CFB,32,24')
  })

  test('setDefaultFont() should use height as width when width not specified', () => {
    const label = Label.create({ w: 400, h: 600 }).setDefaultFont({
      family: FontFamily.F,
      height: 60
    })

    const zpl = label.toZPL()
    expect(zpl).toContain('^CFF,60,60')
  })

  test('setDefaultFont() should handle undefined width parameter', () => {
    const label = Label.create({ w: 400, h: 600 }).setDefaultFont({
      family: FontFamily.A,
      height: 28,
      width: undefined
    })

    const zpl = label.toZPL()
    expect(zpl).toContain('^CFA,28,28') // width defaults to height when undefined
  })

  test('setDefaultFont() should use defaults when parameters omitted', () => {
    const label = Label.create({ w: 400, h: 600 }).setDefaultFont({})

    const zpl = label.toZPL()
    expect(zpl).toContain('^CF0,28,28') // family='0', height=28, width=height
  })

  test('setBarcodeDefaults() should generate BY command with all parameters', () => {
    const label = Label.create({ w: 400, h: 600 }).setBarcodeDefaults({
      moduleWidth: 5,
      wideToNarrowRatio: 2,
      height: 270
    })

    const zpl = label.toZPL()
    expect(zpl).toContain('^BY5,2,270')
  })

  test('setBarcodeDefaults() should omit height when not specified', () => {
    const label = Label.create({ w: 400, h: 600 }).setBarcodeDefaults({
      moduleWidth: 3,
      wideToNarrowRatio: 4
    })

    const zpl = label.toZPL()
    expect(zpl).toContain('^BY3,4') // No height parameter
    expect(zpl).not.toContain('^BY3,4,')
  })

  test('setBarcodeDefaults() should handle undefined height parameter', () => {
    const label = Label.create({ w: 400, h: 600 }).setBarcodeDefaults({
      moduleWidth: 2,
      wideToNarrowRatio: 3,
      height: undefined
    })

    const zpl = label.toZPL()
    expect(zpl).toContain('^BY2,3') // height omitted when undefined
    expect(zpl).not.toContain('^BY2,3,')
  })

  test('setBarcodeDefaults() should use defaults when parameters omitted', () => {
    const label = Label.create({ w: 400, h: 600 }).setBarcodeDefaults({})

    const zpl = label.toZPL()
    expect(zpl).toContain('^BY2,3') // moduleWidth=2, ratio=3, no height
  })

  test('setBarcodeDefaults() should handle zero height (treated as falsy)', () => {
    const label = Label.create({ w: 400, h: 600 }).setBarcodeDefaults({
      moduleWidth: 4,
      wideToNarrowRatio: 2,
      height: 0
    })

    const zpl = label.toZPL()
    expect(zpl).toContain('^BY4,2') // height=0 is falsy, so omitted
    expect(zpl).not.toContain('^BY4,2,0')
  })

  test('global settings should chain properly with other methods', () => {
    const label = Label.create({ w: 400, h: 600 })
      .setDefaultFont({ family: FontFamily.B, height: 32 })
      .text({ at: { x: 50, y: 50 }, text: 'Hello' })
      .setBarcodeDefaults({ moduleWidth: 5, height: 100 })
      .barcode({ at: { x: 50, y: 100 }, type: Barcode.Code128, data: '12345' })

    const zpl = label.toZPL()

    // Should contain both global settings
    expect(zpl).toContain('^CFB,32,32')
    expect(zpl).toContain('^BY5,3,100')

    // Should contain the field elements
    expect(zpl).toContain('^FDHello^FS')
    expect(zpl).toContain('^FD12345^FS')
  })
})

describe('RFID Fields', () => {
  test('should create basic RFID field', () => {
    const result = Label.create({ w: 400, h: 600 }).rfid({
      epc: '3014257BF7194E4000001A85'
    })
    expect(result.toZPL()).toContain('^RFW,H^FD3014257BF7194E4000001A85^FS')
  })

  test('should create RFID field with custom parameters', () => {
    const result = Label.create({ w: 400, h: 600 }).rfid({
      epc: 'USERDATA123456',
      bank: RFIDBank.USER,
      offset: 4,
      length: 7
    })
    expect(result.toZPL()).toContain('^RFW,U,4,7^FDUSERDATA123456^FS')
  })

  test('should create RFID field with TID bank', () => {
    const result = Label.create({ w: 400, h: 600 }).rfid({
      epc: 'TID123456789',
      bank: RFIDBank.TID,
      offset: 2,
      length: 6
    })
    expect(result.toZPL()).toContain('^RFW,T,2,6^FDTID123456789^FS')
  })

  test('should reject HostBuffer writes', () => {
    expect(() =>
      Label.create({ w: 400, h: 600 }).rfid({
        epc: 'AA',
        bank: RFIDBank.HostBuffer
      })
    ).toThrow('HostBuffer is read-only')
  })

  test('should create RFID read command', () => {
    const result = Label.create({ w: 400, h: 600 }).rfidRead({
      bank: RFIDBank.EPC,
      offset: 0,
      length: 8
    })
    expect(result.toZPL()).toContain('^RFR,E,0,8^FD^FS')
  })

  test('should create RFID read command for USER bank', () => {
    const result = Label.create({ w: 400, h: 600 }).rfidRead({
      bank: RFIDBank.USER,
      offset: 4,
      length: 12
    })
    expect(result.toZPL()).toContain('^RFR,U,4,12^FD^FS')
  })

  test('should create RFID read command for TID bank', () => {
    const result = Label.create({ w: 400, h: 600 }).rfidRead({
      bank: RFIDBank.TID,
      offset: 0,
      length: 6
    })
    expect(result.toZPL()).toContain('^RFR,T,0,6^FD^FS')
  })

  test('should create RFID read command with default parameters', () => {
    const result = Label.create({ w: 400, h: 600 }).rfidRead({})
    expect(result.toZPL()).toContain('^RFR,E,0,8^FD^FS')
  })

  test('rfidRead() emits host buffer command', () => {
    const label = Label.create({ w: 400, h: 600 }).rfidRead({ bank: RFIDBank.HostBuffer })
    expect(label.toZPL()).toContain('^RFR,H^FD^FS')
  })

  test('rfidRead() still works when called without arguments', () => {
    const label = Label.create({ w: 400, h: 600 }) as any
    const result = label.rfidRead()
    expect(result.toZPL()).toContain('^RFR,E,0,8^FD^FS')
  })

  test('should create RFID host buffer read command', () => {
    const result = Label.create({ w: 400, h: 600 }).rfidRead({ bank: RFIDBank.HostBuffer })
    expect(result.toZPL()).toContain('^RFR,H^FD^FS')
  })

  test('should create RFID read command with partial defaults', () => {
    const result = Label.create({ w: 400, h: 600 }).rfidRead({
      bank: RFIDBank.USER
    })
    expect(result.toZPL()).toContain('^RFR,U,0,8^FD^FS')
  })

  test('should create EPC convenience method', () => {
    const result = Label.create({ w: 400, h: 600 }).epc({
      epc: '3014257BF7194E4000001A85'
    })
    expect(result.toZPL()).toContain('^RFW,H^FD3014257BF7194E4000001A85^FS')
  })

  test('should maintain ZPL structure for RFID writes', () => {
    const zpl = Label.create({ w: 400, h: 600 })
      .rfid({ epc: '1234567890ABCDEF' })
      .toZPL()
    expect(zpl).toMatch(/^\^XA.*\^XZ$/)
    expect(zpl).toMatch(/\^RFW,H\^FD[A-F0-9]+\^FS/)
  })

  test('rfidRead() should fail on unsupported bank', () => {
    expect(() =>
      Label.create({ w: 400, h: 600 }).rfidRead({
        bank: 'INVALID' as RFIDBank
      })
    ).toThrow('Unsupported RFID bank')
  })
})

describe('ZPL Validation', () => {
  function validateBasicZPLStructure(zpl: string) {
    expect(zpl).toMatch(/^\^XA.*\^XZ$/)

    const commandPattern = /[\^~][A-Z][A-Z0-9]*(?=[^A-Z]|$)/g
    const commands = zpl.match(commandPattern) || []
    commands.forEach((cmd) => {
      expect(cmd).toMatch(/^[\^~][A-Z][A-Z0-9]*$/)
    })

    expect(zpl).not.toMatch(/\^A[A-Z0-9][NRI],\^/)

    const fdMatches = zpl.match(/\^FD[^]*?\^FS/g)
    if (fdMatches) {
      fdMatches.forEach((match) => {
        expect(match).toMatch(/^\^FD.*\^FS$/)
      })
    }

    const orphanedFD = zpl.match(/\^FD(?![^]*?\^FS)/g)
    expect(orphanedFD).toBeNull()
  }

  function validateFieldOrigins(zpl: string) {
    const foMatches = zpl.match(/\^FO\d+,\d+/g)
    if (foMatches) {
      foMatches.forEach((match) => {
        expect(match).toMatch(/^\^FO\d+,\d+$/)
      })
    }
  }

  describe('Basic Label Structure', () => {
    test('should generate valid ZPL structure for empty label', () => {
      const label = Label.create({ w: 400, h: 600 })
      const zpl = label.toZPL()

      validateBasicZPLStructure(zpl)
      expect(zpl).toBe('^XA^LL600^XZ')
    })

    test('should generate valid ZPL with proper label setup commands', () => {
      const label = Label.create({
        w: 400,
        h: 600,
        dpi: 203,
        units: Units.Dot,
        orientation: Orientation.Rotated90,
        origin: { x: 10, y: 20 }
      })
      const zpl = label.toZPL()

      validateBasicZPLStructure(zpl)
      expect(zpl).toContain('^POR')
      expect(zpl).toContain('^LH10,20')
      expect(zpl).toContain('^LL600')
    })
  })

  describe('Text Field Validation', () => {
    test('should generate valid text fields with proper font commands', () => {
      const label = Label.create({ w: 400, h: 600 }).text({
        at: { x: 50, y: 100 },
        text: 'Hello World',
        font: { family: FontFamily.A, h: 28, w: 28 }
      })
      const zpl = label.toZPL()

      validateBasicZPLStructure(zpl)
      validateFieldOrigins(zpl)

      expect(zpl).toContain('^FO50,100')
      expect(zpl).toContain('^AAN,28,28')
      expect(zpl).toContain('^FDHello World^FS')
    })

    test('should handle text rotation properly', () => {
      ;(['N', 'R', 'I', 'B'] as const).forEach((rotation) => {
        const label = Label.create({ w: 400, h: 600 }).text({
          at: { x: 50, y: 100 },
          text: 'Test',
          rotate: rotation,
          font: { family: FontFamily.A, h: 20, w: 20 }
        })
        const zpl = label.toZPL()

        validateBasicZPLStructure(zpl)
        expect(zpl).toContain(`^AA${rotation},20,20`)
      })
    })

    test('should properly escape carets in text data', () => {
      const label = Label.create({ w: 400, h: 600 }).text({
        at: { x: 50, y: 100 },
        text: 'Text with ^caret and ^^double'
      })
      const zpl = label.toZPL()

      validateBasicZPLStructure(zpl)
      expect(zpl).toContain('^FDText with ^^caret and ^^^^double^FS')
    })

    test('should generate valid text wrapping commands', () => {
      const label = Label.create({ w: 400, h: 600 }).text({
        at: { x: 50, y: 100 },
        text: 'Long text that wraps',
        wrap: {
          width: 200,
          lines: 5,
          spacing: 2,
          justify: Justify.Center
        }
      })
      const zpl = label.toZPL()

      validateBasicZPLStructure(zpl)
      expect(zpl).toContain('^FB200,5,2,C,0')
    })
  })

  describe('Barcode Validation', () => {
    const barcodeTypes = [
      Barcode.Code128,
      Barcode.Code39,
      Barcode.EAN13,
      Barcode.UPCA,
      Barcode.ITF,
      Barcode.PDF417,
      Barcode.QRCode,
      Barcode.DataMatrix
    ] as const

    barcodeTypes.forEach((type) => {
      test(`should generate valid ${type} barcode`, () => {
        const label = Label.create({ w: 400, h: 600 }).barcode({
          at: { x: 50, y: 100 },
          type,
          data: 'TEST123'
        })
        const zpl = label.toZPL()

        validateBasicZPLStructure(zpl)
        validateFieldOrigins(zpl)
        expect(zpl).toContain('^FDTEST123^FS')
      })
    })
  })

  describe('Graphics Validation', () => {
    test('should generate valid box commands', () => {
      const label = Label.create({ w: 400, h: 600 }).box({
        at: { x: 10, y: 10 },
        size: { w: 380, h: 580 },
        border: 3,
        fill: Fill.Black
      })
      const zpl = label.toZPL()

      validateBasicZPLStructure(zpl)
      expect(zpl).toContain('^GB380,580,3,B,0')
    })

    test('should generate valid comment commands', () => {
      const label = Label.create({ w: 400, h: 600 }).comment('This is a comment')
      const zpl = label.toZPL()

      validateBasicZPLStructure(zpl)
      expect(zpl).toContain('^FX This is a comment')
    })
  })

  describe('Units and DPI Validation', () => {
    test('should convert millimeter units correctly', () => {
      const label = Label.create({ w: 100, h: 60, units: Units.Millimeter, dpi: 300 }).text({
        at: { x: 10, y: 15 },
        text: 'Metric Label'
      })
      const zpl = label.toZPL()

      validateBasicZPLStructure(zpl)
      expect(zpl).toContain('^FO118,177') // 10mm & 15mm at 300 DPI
    })

    test('should convert inch units correctly', () => {
      const label = Label.create({ w: 4, h: 2.5, units: Units.Inch, dpi: 600 }).text({
        at: { x: 0.5, y: 0.5 },
        text: 'High DPI Label'
      })
      const zpl = label.toZPL()

      validateBasicZPLStructure(zpl)
      expect(zpl).toContain('^FO300,300')
    })
  })
})

describe('ZPL Output Snapshots', () => {
  describe('Basic Labels', () => {
    test('empty label with defaults', () => {
      const label = Label.create({ w: 400, h: 600 })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('empty label with custom settings', () => {
      const label = Label.create({
        w: 4,
        h: 6,
        units: Units.Inch,
        dpi: 300,
        orientation: Orientation.Rotated90,
        origin: { x: 10, y: 20 }
      })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })

  describe('Text and Fonts', () => {
    test('simple text with default font', () => {
      const label = Label.create({ w: 400, h: 600 }).text({
        at: { x: 50, y: 100 },
        text: 'Hello World'
      })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('text with custom font and rotation', () => {
      const label = Label.create({ w: 400, h: 600 }).text({
        at: { x: 50, y: 100 },
        text: 'Rotated Text',
        font: { family: FontFamily.B, h: 32, w: 32 },
        rotate: Orientation.Rotated90
      })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('wrapped text field', () => {
      const label = Label.create({ w: 400, h: 600 }).text({
        at: { x: 50, y: 100 },
        text: 'This is a long text that should wrap across multiple lines automatically',
        font: { family: FontFamily.A, h: 24, w: 24 },
        wrap: { width: 300, lines: 3, spacing: 5, justify: 'J' }
      })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })

  describe('Barcodes', () => {
    test('Code128 barcode', () => {
      const label = Label.create({ w: 400, h: 600 }).barcode({
        at: { x: 50, y: 200 },
        type: Barcode.Code128,
        data: '123456789',
        height: 100
      })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('QR code with options', () => {
      const label = Label.create({ w: 400, h: 600 }).qr({
        at: { x: 100, y: 100 },
        text: 'https://example.com/product/12345',
        module: 4,
        rotate: Orientation.Normal
      })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })

  describe('Graphics and Boxes', () => {
    test('simple box', () => {
      const label = Label.create({ w: 400, h: 600 }).box({
        at: { x: 10, y: 10 },
        size: { w: 380, h: 580 },
        border: 2
      })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('filled box', () => {
      const label = Label.create({ w: 400, h: 600 }).box({
        at: { x: 50, y: 50 },
        size: { w: 300, h: 100 },
        border: 3,
        fill: Fill.Black
      })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })

  describe('RFID Labels', () => {
    test('basic RFID write', () => {
      const label = Label.create({ w: 400, h: 600 })
        .text({ at: { x: 50, y: 50 }, text: 'RFID Enabled' })
        .rfid({
          epc: '3034257BF7194E4000000001'
        })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('EPC encoding convenience', () => {
      const label = Label.create({ w: 400, h: 600 }).epc({
        epc: 'FEDCBA0987654321'
      })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })

  describe('Comments and Metadata', () => {
    test('label with comments', () => {
      const label = Label.create({ w: 400, h: 600 })
        .comment('This is a test label')
        .text({ at: { x: 50, y: 100 }, text: 'Test Label' })
        .comment('End of content')
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('label with metadata', () => {
      const label = Label.create({ w: 400, h: 600 })
        .text({ at: { x: 50, y: 100 }, text: 'Test Label' })
        .withMetadata({
          generator: '@schie/fluent-zpl',
          version: '1.0.0',
          created: '2025-01-01T00:00:00.000Z'
        })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })

  describe('Units and DPI', () => {
    test('millimeter units at 300 DPI', () => {
      const label = Label.create({ w: 100, h: 60, units: Units.Millimeter, dpi: 300 })
        .text({ at: { x: 10, y: 15 }, text: 'Metric Label' })
        .box({ at: { x: 5, y: 5 }, size: { w: 90, h: 50 } })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('inch units at 600 DPI', () => {
      const label = Label.create({ w: 4, h: 2.5, units: Units.Inch, dpi: 600 })
        .text({ at: { x: 0.5, y: 0.5 }, text: 'High DPI Label' })
        .qr({ at: { x: 2.5, y: 0.5 }, text: 'HIGH-RES' })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })

  describe('Special Characters and Escaping', () => {
    test('text with caret characters', () => {
      const label = Label.create({ w: 400, h: 600 }).text({
        at: { x: 50, y: 100 },
        text: 'Price: $29.99 ^includes tax^'
      })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('text with special symbols', () => {
      const label = Label.create({ w: 400, h: 600 })
        .text({
          at: { x: 50, y: 100 },
          text: 'Symbols: © ® ™ €'
        })
        .text({
          at: { x: 50, y: 150 },
          text: 'Math: 2+2=4, 10×5=50'
        })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('text with multiline content', () => {
      const label = Label.create({ w: 400, h: 600 }).text({
        at: { x: 50, y: 100 },
        text: 'Line 1\nLine 2\nLine 3'
      })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })
})
