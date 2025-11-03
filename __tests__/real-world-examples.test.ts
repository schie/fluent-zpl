// Real-world ZPL validation examples
import { Label } from '../src/index.js'

describe('Real-world ZPL Examples', () => {
  test('should generate valid shipping label ZPL', () => {
    const label = Label.create({ w: 400, h: 600, dpi: 203, units: 'dot' })
      .text({
        at: { x: 50, y: 50 },
        text: 'FEDEX GROUND',
        font: { family: 'B', h: 28, w: 28 }
      })
      .box({
        at: { x: 10, y: 10 },
        size: { w: 380, h: 580 },
        border: 2
      })
      .text({
        at: { x: 50, y: 100 },
        text: 'SHIP TO:',
        font: { family: 'A', h: 20, w: 20 }
      })
      .addressBlock({
        at: { x: 50, y: 130 },
        lines: ['JOHN DOE', '123 MAIN STREET', 'ANYTOWN NY 12345-6789'],
        lineHeight: 25,
        size: 20
      })
      .barcode({
        at: { x: 50, y: 250 },
        type: 'Code128',
        data: '1234567890123',
        height: 80
      })
      .text({
        at: { x: 50, y: 350 },
        text: 'Tracking: 1234567890123',
        font: { family: 'A', h: 16, w: 16 }
      })

    const zpl = label.toZPL()

    // Basic ZPL structure validation
    expect(zpl).toMatch(/^\^XA.*\^XZ$/)

    // Should contain proper label setup
    expect(zpl).toContain('^LL600')

    // Should contain all text elements
    expect(zpl).toContain('FEDEX GROUND')
    expect(zpl).toContain('SHIP TO:')
    expect(zpl).toContain('JOHN DOE')
    expect(zpl).toContain('123 MAIN STREET')
    expect(zpl).toContain('ANYTOWN NY 12345-6789')
    expect(zpl).toContain('Tracking: 1234567890123')

    // Should contain graphics box
    expect(zpl).toContain('^GB380,580,2,B,0')

    // Should contain barcode
    expect(zpl).toContain('^BCN,80,Y,N,N')
    expect(zpl).toContain('^FD1234567890123^FS')

    // Validate all field origins are present
    const fieldOrigins = zpl.match(/\^FO\d+,\d+/g) || []
    expect(fieldOrigins.length).toBeGreaterThan(0)

    // Validate all field data blocks are properly terminated
    const fdBlocks = zpl.match(/\^FD[^]*?\^FS/g) || []
    expect(fdBlocks.length).toBeGreaterThan(0)
  })

  test('should generate valid product label with QR code', () => {
    const label = Label.create({ w: 300, h: 200, units: 'mm', dpi: 203 })
      .caption({
        at: { x: 10, y: 10 },
        text: 'PRODUCT LABEL',
        size: 24,
        family: 'B'
      })
      .text({
        at: { x: 10, y: 40 },
        text: 'SKU: ABC-123-XYZ',
        font: { family: 'A', h: 16, w: 16 }
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
        font: { family: 'B', h: 20, w: 20 }
      })

    const zpl = label.toZPL()

    // Basic structure validation
    expect(zpl).toMatch(/^\^XA.*\^XZ$/)

    // Should handle unit conversions (mm to dots)
    expect(zpl).toContain('^LL1598') // 200mm at 203 DPI ≈ 1598 dots

    // Should contain all elements
    expect(zpl).toContain('PRODUCT LABEL')
    expect(zpl).toContain('SKU: ABC-123-XYZ')
    expect(zpl).toContain('Price: $29.99')

    // Should contain QR code
    expect(zpl).toContain('^BQN,2,3')
    expect(zpl).toContain('https://example.com/product/ABC-123-XYZ')

    // Should contain border box
    expect(zpl).toContain('^GB') // Graphics box command
  })

  test('should handle complex text with special characters', () => {
    const label = Label.create({ w: 400, h: 300 })
      .text({
        at: { x: 50, y: 50 },
        text: 'Special chars: ^caret "quotes" & <brackets>',
        font: { family: 'A', h: 20, w: 20 }
      })
      .text({
        at: { x: 50, y: 100 },
        text: 'Accented: café résumé naïve',
        font: { family: 'A', h: 20, w: 20 }
      })
      .text({
        at: { x: 50, y: 150 },
        text: 'Numbers: $1,234.56 (100%)',
        font: { family: 'A', h: 20, w: 20 }
      })

    const zpl = label.toZPL()

    // Should properly escape carets
    expect(zpl).toContain('^^caret')

    // Should preserve other special characters
    expect(zpl).toContain('"quotes"')
    expect(zpl).toContain('&')
    expect(zpl).toContain('<brackets>')
    expect(zpl).toContain('café')
    expect(zpl).toContain('$1,234.56')
    expect(zpl).toContain('(100%)')
  })

  test('should generate complex shipping label with new ZPL features', () => {
    const label = Label.create({ w: 800, h: 1200, dpi: 203, units: 'dot' })
      .comment('Top section with logo, name and address.')
      .setDefaultFont({ family: 'F', height: 60 })
      .box({ at: { x: 50, y: 50 }, size: { w: 100, h: 100 }, border: 100 })
      .box({ at: { x: 75, y: 75 }, size: { w: 100, h: 100 }, border: 100, reverse: true })
      .box({ at: { x: 93, y: 93 }, size: { w: 40, h: 40 }, border: 40 })
      .text({ at: { x: 220, y: 50 }, text: 'Intershipping, Inc.' })

      .setDefaultFont({ family: 'F', height: 30 })
      .text({ at: { x: 220, y: 115 }, text: '1000 Shipping Lane' })
      .text({ at: { x: 220, y: 155 }, text: 'Shelbyville TN 38102' })
      .text({ at: { x: 220, y: 195 }, text: 'United States (USA)' })

      .box({ at: { x: 50, y: 250 }, size: { w: 700, h: 3 }, border: 3 })

      .comment('Second section with recipient address and permit information.')
      .setDefaultFont({ family: 'A', height: 30 })
      .text({ at: { x: 50, y: 300 }, text: 'John Doe' })
      .text({ at: { x: 50, y: 340 }, text: '100 Main Street' })
      .text({ at: { x: 50, y: 380 }, text: 'Springfield TN 39021' })
      .text({ at: { x: 50, y: 420 }, text: 'United States (USA)' })

      .setDefaultFont({ family: 'A', height: 15 })
      .box({ at: { x: 600, y: 300 }, size: { w: 150, h: 150 }, border: 3 })
      .text({ at: { x: 638, y: 340 }, text: 'Permit' })
      .text({ at: { x: 638, y: 390 }, text: '123456' })

      .box({ at: { x: 50, y: 500 }, size: { w: 700, h: 3 }, border: 3 })

      .comment('Third section with bar code.')
      .setBarcodeDefaults({ moduleWidth: 5, wideToNarrowRatio: 2, height: 270 })
      .barcode({ at: { x: 100, y: 550 }, type: 'Code128', data: '12345678' })

      .comment('Fourth section (the two boxes on the bottom).')
      .box({ at: { x: 50, y: 900 }, size: { w: 700, h: 250 }, border: 3 })
      .box({ at: { x: 400, y: 900 }, size: { w: 3, h: 250 }, border: 3 })

      .setDefaultFont({ family: 'F', height: 40 })
      .text({ at: { x: 100, y: 960 }, text: 'Ctr. X34B-1' })
      .text({ at: { x: 100, y: 1010 }, text: 'REF1 F00B47' })
      .text({ at: { x: 100, y: 1060 }, text: 'REF2 BL4H8' })

      .setDefaultFont({ family: 'F', height: 190 })
      .text({ at: { x: 470, y: 955 }, text: 'CA' })

    const actualZpl = label.toZPL()

    // Should contain the new features
    expect(actualZpl).toContain('^FX') // Comments
    expect(actualZpl).toContain('^CF') // Global font changes
    expect(actualZpl).toContain('^BY') // Global barcode settings
    expect(actualZpl).toContain('^FR') // Field reverse

    // Should contain basic structure
    expect(actualZpl).toMatch(/^\^XA.*\^XZ$/)
    expect(actualZpl).toContain('^LL1200')

    // Should contain all text content
    expect(actualZpl).toContain('Intershipping, Inc.')
    expect(actualZpl).toContain('John Doe')
    expect(actualZpl).toContain('CA')
  })

  test('should generate complex shipping label with logo and multiple sections', () => {
    const label = Label.create({ w: 800, h: 1200, dpi: 203, units: 'dot' })
      // Logo section - nested boxes to create a logo effect
      .box({ at: { x: 50, y: 50 }, size: { w: 100, h: 100 }, border: 100 })
      .box({ at: { x: 75, y: 75 }, size: { w: 100, h: 100 }, border: 100, fill: 'W' })
      .box({ at: { x: 93, y: 93 }, size: { w: 40, h: 40 }, border: 40 })

      // Company name and address section
      .text({
        at: { x: 220, y: 50 },
        text: 'Intershipping, Inc.',
        font: { family: 'F', h: 60, w: 60 }
      })
      .text({
        at: { x: 220, y: 115 },
        text: '1000 Shipping Lane',
        font: { family: 'F', h: 30, w: 30 }
      })
      .text({
        at: { x: 220, y: 155 },
        text: 'Shelbyville TN 38102',
        font: { family: 'F', h: 30, w: 30 }
      })
      .text({
        at: { x: 220, y: 195 },
        text: 'United States (USA)',
        font: { family: 'F', h: 30, w: 30 }
      })

      // Horizontal separator line
      .box({ at: { x: 50, y: 250 }, size: { w: 700, h: 3 }, border: 3 })

      // Recipient address section
      .text({
        at: { x: 50, y: 300 },
        text: 'John Doe',
        font: { family: 'A', h: 30, w: 30 }
      })
      .text({
        at: { x: 50, y: 340 },
        text: '100 Main Street',
        font: { family: 'A', h: 30, w: 30 }
      })
      .text({
        at: { x: 50, y: 380 },
        text: 'Springfield TN 39021',
        font: { family: 'A', h: 30, w: 30 }
      })
      .text({
        at: { x: 50, y: 420 },
        text: 'United States (USA)',
        font: { family: 'A', h: 30, w: 30 }
      })

      // Permit box
      .box({ at: { x: 600, y: 300 }, size: { w: 150, h: 150 }, border: 3 })
      .text({
        at: { x: 638, y: 340 },
        text: 'Permit',
        font: { family: 'A', h: 15, w: 15 }
      })
      .text({
        at: { x: 638, y: 390 },
        text: '123456',
        font: { family: 'A', h: 15, w: 15 }
      })

      // Second horizontal separator
      .box({ at: { x: 50, y: 500 }, size: { w: 700, h: 3 }, border: 3 })

      // Barcode section
      .barcode({
        at: { x: 100, y: 550 },
        type: 'Code128',
        data: '12345678',
        height: 270,
        module: 5
      })

      // Bottom section with boxes
      .box({ at: { x: 50, y: 900 }, size: { w: 700, h: 250 }, border: 3 })
      .box({ at: { x: 400, y: 900 }, size: { w: 3, h: 250 }, border: 3 })

      // Reference information
      .text({
        at: { x: 100, y: 960 },
        text: 'Ctr. X34B-1',
        font: { family: 'F', h: 40, w: 40 }
      })
      .text({
        at: { x: 100, y: 1010 },
        text: 'REF1 F00B47',
        font: { family: 'F', h: 40, w: 40 }
      })
      .text({
        at: { x: 100, y: 1060 },
        text: 'REF2 BL4H8',
        font: { family: 'F', h: 40, w: 40 }
      })

      // Large "CA" text
      .text({
        at: { x: 470, y: 955 },
        text: 'CA',
        font: { family: 'F', h: 190, w: 190 }
      })

    const actualZpl = label.toZPL()

    // Basic structure validation
    expect(actualZpl).toMatch(/^\^XA.*\^XZ$/)
    expect(actualZpl).toContain('^LL1200')

    // Validate all text content is present
    expect(actualZpl).toContain('Intershipping, Inc.')
    expect(actualZpl).toContain('1000 Shipping Lane')
    expect(actualZpl).toContain('Shelbyville TN 38102')
    expect(actualZpl).toContain('United States (USA)')
    expect(actualZpl).toContain('John Doe')
    expect(actualZpl).toContain('100 Main Street')
    expect(actualZpl).toContain('Springfield TN 39021')
    expect(actualZpl).toContain('Permit')
    expect(actualZpl).toContain('123456')
    expect(actualZpl).toContain('Ctr. X34B-1')
    expect(actualZpl).toContain('REF1 F00B47')
    expect(actualZpl).toContain('REF2 BL4H8')
    expect(actualZpl).toContain('CA')

    // Validate barcode
    expect(actualZpl).toContain('^BCN,270,Y,N,N')
    expect(actualZpl).toContain('^FD12345678^FS')

    // Validate key structural elements - logo boxes
    expect(actualZpl).toContain('^GB100,100,100,B,0^FS') // Outer logo box
    expect(actualZpl).toContain('^GB100,100,100,W,0^FS') // Middle reversed box
    expect(actualZpl).toContain('^GB40,40,40,B,0^FS') // Inner logo box

    // Validate separator lines
    expect(actualZpl).toContain('^GB700,3,3,B,0^FS') // Horizontal separator lines

    // Validate permit box
    expect(actualZpl).toContain('^GB150,150,3,B,0^FS') // Permit box

    // Validate bottom section boxes
    expect(actualZpl).toContain('^GB700,250,3,B,0^FS') // Bottom large box
    expect(actualZpl).toContain('^GB3,250,3,B,0^FS') // Vertical divider

    // Validate all field data blocks are properly terminated
    const fdBlocks = actualZpl.match(/\^FD[^]*?\^FS/g) || []
    expect(fdBlocks.length).toBeGreaterThan(10) // Should have many text fields

    // Validate fonts are used correctly
    expect(actualZpl).toContain('^AF') // Font F for company info
    expect(actualZpl).toContain('^AA') // Font A for addresses
  })

  test('should generate exact ZPL matching original specification using new features', () => {
    // This test uses the new global settings features to match the original ZPL structure exactly
    const label = Label.create({ w: 800, h: 1200, dpi: 203, units: 'dot' })
      .comment('Top section with logo, name and address.')
      .setDefaultFont({ family: '0', height: 60 })
      .box({ at: { x: 50, y: 50 }, size: { w: 100, h: 100 }, border: 100 })
      .box({ at: { x: 75, y: 75 }, size: { w: 100, h: 100 }, border: 100, reverse: true })
      .box({ at: { x: 93, y: 93 }, size: { w: 40, h: 40 }, border: 40 })
      .text({
        at: { x: 220, y: 50 },
        text: 'Intershipping, Inc.',
        // Use empty font to rely on global ^CF settings
        font: { family: undefined, h: undefined, w: undefined }
      })

      .setDefaultFont({ family: '0', height: 30 })
      .text({ at: { x: 220, y: 115 }, text: '1000 Shipping Lane' })
      .text({ at: { x: 220, y: 155 }, text: 'Shelbyville TN 38102' })
      .text({ at: { x: 220, y: 195 }, text: 'United States (USA)' })

      .box({ at: { x: 50, y: 250 }, size: { w: 700, h: 3 }, border: 3 })

      .comment('Second section with recipient address and permit information.')
      .setDefaultFont({ family: 'A', height: 30 })
      .text({ at: { x: 50, y: 300 }, text: 'John Doe' })
      .text({ at: { x: 50, y: 340 }, text: '100 Main Street' })
      .text({ at: { x: 50, y: 380 }, text: 'Springfield TN 39021' })
      .text({ at: { x: 50, y: 420 }, text: 'United States (USA)' })

      .setDefaultFont({ family: 'A', height: 15 })
      .box({ at: { x: 600, y: 300 }, size: { w: 150, h: 150 }, border: 3 })
      .text({ at: { x: 638, y: 340 }, text: 'Permit' })
      .text({ at: { x: 638, y: 390 }, text: '123456' })

      .box({ at: { x: 50, y: 500 }, size: { w: 700, h: 3 }, border: 3 })

      .comment('Third section with bar code.')
      .setBarcodeDefaults({ moduleWidth: 5, wideToNarrowRatio: 2, height: 270 })
      .barcode({
        at: { x: 100, y: 550 },
        type: 'Code128',
        data: '12345678'
        // height will come from global ^BY setting
      })

      .comment('Fourth section (the two boxes on the bottom).')
      .box({ at: { x: 50, y: 900 }, size: { w: 700, h: 250 }, border: 3 })
      .box({ at: { x: 400, y: 900 }, size: { w: 3, h: 250 }, border: 3 })

      .setDefaultFont({ family: '0', height: 40 })
      .text({ at: { x: 100, y: 960 }, text: 'Ctr. X34B-1' })
      .text({ at: { x: 100, y: 1010 }, text: 'REF1 F00B47' })
      .text({ at: { x: 100, y: 1060 }, text: 'REF2 BL4H8' })

      .setDefaultFont({ family: '0', height: 190 })
      .text({ at: { x: 470, y: 955 }, text: 'CA' })

    const actualZpl = label.toZPL()

    // Test that the new features are present
    expect(actualZpl).toContain('^FX Top section with logo, name and address.')
    expect(actualZpl).toContain('^FX Second section with recipient address and permit information.')
    expect(actualZpl).toContain('^FX Third section with bar code.')
    expect(actualZpl).toContain('^FX Fourth section (the two boxes on the bottom).')

    // Test global font changes
    expect(actualZpl).toContain('^CF0,60')
    expect(actualZpl).toContain('^CF0,30')
    expect(actualZpl).toContain('^CFA,30')
    expect(actualZpl).toContain('^CFA,15')
    expect(actualZpl).toContain('^CF0,40')
    expect(actualZpl).toContain('^CF0,190')

    // Test field reverse
    expect(actualZpl).toContain('^FO75,75^FR^GB100,100,100')

    // Test global barcode settings
    expect(actualZpl).toContain('^BY5,2,270')

    // Test all content is present
    expect(actualZpl).toContain('Intershipping, Inc.')
    expect(actualZpl).toContain('1000 Shipping Lane')
    expect(actualZpl).toContain('John Doe')
    expect(actualZpl).toContain('12345678')
    expect(actualZpl).toContain('Ctr. X34B-1')
    expect(actualZpl).toContain('CA')

    // Basic structure validation
    expect(actualZpl).toMatch(/^\^XA.*\^XZ$/)
    expect(actualZpl).toContain('^LL1200')
  })
})
