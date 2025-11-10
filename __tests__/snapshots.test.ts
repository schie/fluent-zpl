// __tests__/snapshots.test.ts
// Snapshot testing for ZPL output consistency - ensures changes don't break format

import { Label } from '../src/index.js'

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
        units: 'in',
        dpi: 300,
        orientation: 'R',
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
        font: { family: 'B', h: 32, w: 32 },
        rotate: 'R'
      })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('wrapped text field', () => {
      const label = Label.create({ w: 400, h: 600 }).text({
        at: { x: 50, y: 100 },
        text: 'This is a long text that should wrap across multiple lines automatically',
        font: { family: 'A', h: 24, w: 24 },
        wrap: { width: 300, lines: 3, spacing: 5, justify: 'J' }
      })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })

  describe('Barcodes', () => {
    test('Code128 barcode', () => {
      const label = Label.create({ w: 400, h: 600 }).barcode({
        at: { x: 50, y: 200 },
        type: 'Code128',
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
        rotate: 'N'
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
        fill: 'B'
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
      const label = Label.create({ w: 100, h: 60, units: 'mm', dpi: 300 })
        .text({ at: { x: 10, y: 15 }, text: 'Metric Label' })
        .box({ at: { x: 5, y: 5 }, size: { w: 90, h: 50 } })
      expect(label.toZPL()).toMatchSnapshot()
    })

    test('inch units at 600 DPI', () => {
      const label = Label.create({ w: 4, h: 2.5, units: 'in', dpi: 600 })
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
        .text({ at: { x: 50, y: 100 }, text: 'Symbols: © ® ™ €' })
        .text({ at: { x: 50, y: 150 }, text: 'Math: 2+2=4, 10×5=50' })
      expect(label.toZPL()).toMatchSnapshot()
    })
  })
})
