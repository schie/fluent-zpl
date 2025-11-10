// Image functionality tests - comprehensive coverage for image encoding

import {
  buildDGAndRecall,
  buildGFAt,
  clamp255,
  encodeDG,
  encodeGF,
  monoFromImageData,
  monoFromRGBA,
  type DitherMode,
  type MonoBitmap
} from '../../src/image/encoder.js'

describe('Image Encoder', () => {
  describe('monoFromRGBA()', () => {
    test('should convert RGBA to monochrome with threshold mode', () => {
      // Create a 2x2 RGBA image: white, black, gray, white
      const rgba = new Uint8Array([
        255,
        255,
        255,
        255, // White pixel
        0,
        0,
        0,
        255, // Black pixel
        128,
        128,
        128,
        255, // Gray pixel
        255,
        255,
        255,
        255 // White pixel
      ])

      const mono = monoFromRGBA({
        rgba,
        width: 2,
        height: 2,
        mode: 'threshold',
        threshold: 200
      })

      expect(mono.width).toBe(2)
      expect(mono.height).toBe(2)
      expect(mono.bytesPerRow).toBe(1) // ceil(2/8) = 1
      expect(mono.bytes.length).toBe(2) // 1 byte per row * 2 rows
    })

    test('should handle different dither modes', () => {
      const rgba = new Uint8Array([
        128,
        128,
        128,
        255,
        128,
        128,
        128,
        255, // Gray pixels
        128,
        128,
        128,
        255,
        128,
        128,
        128,
        255 // Gray pixels
      ])

      const modes: DitherMode[] = ['none', 'threshold', 'fs', 'ordered']

      modes.forEach((mode) => {
        const mono = monoFromRGBA({
          rgba,
          width: 2,
          height: 2,
          mode,
          threshold: 128
        })

        expect(mono.width).toBe(2)
        expect(mono.height).toBe(2)
        expect(mono.bytesPerRow).toBe(1)
      })
    })

    test('should handle inversion', () => {
      // Create black and white pixels
      const rgba = new Uint8Array([
        0,
        0,
        0,
        255, // Black pixel
        255,
        255,
        255,
        255 // White pixel
      ])

      const normal = monoFromRGBA({
        rgba,
        width: 2,
        height: 1,
        invert: false
      })

      const inverted = monoFromRGBA({
        rgba,
        width: 2,
        height: 1,
        invert: true
      })

      // Inverted should be different from normal
      expect(normal.bytes[0]).not.toBe(inverted.bytes[0])
    })

    test('should handle different image sizes', () => {
      // Test various sizes to ensure proper byte packing
      const testSizes = [
        { width: 1, height: 1 },
        { width: 8, height: 1 },
        { width: 9, height: 1 },
        { width: 16, height: 1 },
        { width: 17, height: 2 }
      ]

      testSizes.forEach(({ width, height }) => {
        const rgba = new Uint8Array(width * height * 4).fill(255) // All white

        const mono = monoFromRGBA({
          rgba,
          width,
          height
        })

        expect(mono.width).toBe(width)
        expect(mono.height).toBe(height)
        expect(mono.bytesPerRow).toBe(Math.ceil(width / 8))
        expect(mono.bytes.length).toBe(mono.bytesPerRow * height)
      })
    })

    test('should handle edge case with empty image', () => {
      const rgba = new Uint8Array(0)

      const mono = monoFromRGBA({
        rgba,
        width: 0,
        height: 0
      })

      expect(mono.width).toBe(0)
      expect(mono.height).toBe(0)
      expect(mono.bytesPerRow).toBe(0)
      expect(mono.bytes.length).toBe(0)
    })

    test('should handle various threshold values', () => {
      const rgba = new Uint8Array([
        100,
        100,
        100,
        255, // Dark gray
        150,
        150,
        150,
        255 // Light gray
      ])

      const lowThreshold = monoFromRGBA({
        rgba,
        width: 2,
        height: 1,
        threshold: 50
      })

      const highThreshold = monoFromRGBA({
        rgba,
        width: 2,
        height: 1,
        threshold: 200
      })

      // Different thresholds should potentially produce different results
      expect(lowThreshold.bytes).toBeDefined()
      expect(highThreshold.bytes).toBeDefined()
    })
  })

  describe('encodeGF()', () => {
    test('should encode monochrome bitmap to ^GF command', () => {
      const mono: MonoBitmap = {
        width: 8,
        height: 2,
        bytesPerRow: 1,
        bytes: new Uint8Array([0xff, 0x00]) // First row all black, second row all white
      }

      const result = encodeGF(mono)

      expect(result.hex).toBe('FF00')
      expect(result.totalBytes).toBe(2)
      expect(result.bytesPerRow).toBe(1)
      expect(result.gfCommand).toBe('^GFA,2,2,1,FF00')
    })

    test('should handle single pixel', () => {
      const mono: MonoBitmap = {
        width: 1,
        height: 1,
        bytesPerRow: 1,
        bytes: new Uint8Array([0x80]) // Single black pixel (MSB)
      }

      const result = encodeGF(mono)

      expect(result.hex).toBe('80')
      expect(result.gfCommand).toBe('^GFA,1,1,1,80')
    })

    test('should handle empty bitmap', () => {
      const mono: MonoBitmap = {
        width: 0,
        height: 0,
        bytesPerRow: 0,
        bytes: new Uint8Array(0)
      }

      const result = encodeGF(mono)

      expect(result.hex).toBe('')
      expect(result.totalBytes).toBe(0)
      expect(result.gfCommand).toBe('^GFA,0,0,0,')
    })

    test('should handle various bitmap sizes', () => {
      // Test different sizes to ensure proper hex encoding
      const testCases = [
        { bytes: new Uint8Array([0x00]), expected: '00' },
        { bytes: new Uint8Array([0xff]), expected: 'FF' },
        { bytes: new Uint8Array([0x0f, 0xf0]), expected: '0FF0' },
        { bytes: new Uint8Array([0xab, 0xcd, 0xef]), expected: 'ABCDEF' }
      ]

      testCases.forEach(({ bytes, expected }) => {
        const mono: MonoBitmap = {
          width: bytes.length * 8,
          height: 1,
          bytesPerRow: bytes.length,
          bytes
        }

        const result = encodeGF(mono)
        expect(result.hex).toBe(expected)
      })
    })
  })

  describe('encodeDG()', () => {
    test('should encode monochrome bitmap to ~DG and ^XG commands', () => {
      const mono: MonoBitmap = {
        width: 8,
        height: 2,
        bytesPerRow: 1,
        bytes: new Uint8Array([0xff, 0x00])
      }

      const result = encodeDG('R:LOGO.GRF', mono)

      expect(result.hex).toBe('FF00')
      expect(result.totalBytes).toBe(2)
      expect(result.bytesPerRow).toBe(1)
      expect(result.dgCommand).toBe('~DGR:LOGO.GRF,2,1,FF00')
      expect(result.xgCommand).toBe('^XGR:LOGO.GRF,1,1')
    })

    test('should handle different asset names', () => {
      const mono: MonoBitmap = {
        width: 4,
        height: 1,
        bytesPerRow: 1,
        bytes: new Uint8Array([0xf0])
      }

      const names = ['R:TEST.GRF', 'E:LOGO.GRF', 'B:ICON.GRF']

      names.forEach((name) => {
        const result = encodeDG(name, mono)
        expect(result.dgCommand).toContain(name)
        expect(result.xgCommand).toContain(name)
      })
    })

    test('should handle empty asset name', () => {
      const mono: MonoBitmap = {
        width: 4,
        height: 1,
        bytesPerRow: 1,
        bytes: new Uint8Array([0xf0])
      }

      const result = encodeDG('', mono)

      // The encoder adds a default name format when empty
      expect(result.dgCommand).toMatch(/~DG.*,1,1,F0/)
      expect(result.xgCommand).toMatch(/\^XG.*,1,1/)
    })

    test('should produce consistent results with encodeGF for hex', () => {
      const mono: MonoBitmap = {
        width: 16,
        height: 2,
        bytesPerRow: 2,
        bytes: new Uint8Array([0xab, 0xcd, 0xef, 0x01])
      }

      const gfResult = encodeGF(mono)
      const dgResult = encodeDG('R:TEST.GRF', mono)

      expect(dgResult.hex).toBe(gfResult.hex)
      expect(dgResult.totalBytes).toBe(gfResult.totalBytes)
      expect(dgResult.bytesPerRow).toBe(gfResult.bytesPerRow)
    })
  })

  describe('Helper Functions', () => {
    test('monoFromImageData should work as alias', () => {
      const rgba = new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255])
      const mono = monoFromImageData(rgba, 2, 1)

      expect(mono.width).toBe(2)
      expect(mono.height).toBe(1)
      expect(mono.bytes.length).toBe(1)
    })

    test('should handle extreme RGBA values for clamp255 function', () => {
      // Test values that would trigger clamp255 branches: < 0, > 255, and normal values
      const rgba = new Uint8Array([
        // Pixel 1: normal values (should pass through)
        128, 128, 128, 255,
        // Pixel 2: values that might get clamped during processing
        0, 255, 127, 255
      ])

      const mono = monoFromRGBA({
        rgba,
        width: 2,
        height: 1,
        mode: 'fs' // Floyd-Steinberg dithering can create values outside 0-255 range
      })

      // Should handle the input without errors and produce valid output
      expect(mono.width).toBe(2)
      expect(mono.height).toBe(1)
      expect(mono.bytes).toBeInstanceOf(Uint8Array)
    })

    test('buildGFAt should create complete ZPL block', () => {
      const mono = {
        width: 8,
        height: 1,
        bytesPerRow: 1,
        bytes: new Uint8Array([0xaa])
      }

      const zpl = buildGFAt({ x: 100, y: 200 }, mono)
      expect(zpl).toMatch(/^\^FO100,200\^GF/)
      expect(zpl).toMatch(/\^FS$/)
    })

    test('buildDGAndRecall should create DG and recall commands', () => {
      const mono = {
        width: 8,
        height: 1,
        bytesPerRow: 1,
        bytes: new Uint8Array([0xff])
      }

      const result = buildDGAndRecall('R:TEST.GRF', { x: 50, y: 75 }, mono)

      expect(result.dg).toMatch(/^~DGR:TEST.GRF/)
      expect(result.recall).toMatch(/^\^FO50,75\^XGR:TEST.GRF/)
      expect(result.recall).toMatch(/\^FS$/)
    })

    test('buildDGAndRecall should handle null position', () => {
      const mono = {
        width: 8,
        height: 1,
        bytesPerRow: 1,
        bytes: new Uint8Array([0x00])
      }

      const result = buildDGAndRecall('R:NULL.GRF', null, mono)

      expect(result.dg).toMatch(/^~DGR:NULL.GRF/)
      expect(result.recall).toMatch(/^\^XGR:NULL.GRF/)
      expect(result.recall).not.toMatch(/\^FO/)
    })

    describe('clamp255 Utility Function', () => {
      test('should clamp negative values to 0', () => {
        expect(clamp255(-1)).toBe(0)
        expect(clamp255(-100)).toBe(0)
        expect(clamp255(-0.5)).toBe(0)
      })

      test('should clamp values over 255 to 255', () => {
        expect(clamp255(256)).toBe(255)
        expect(clamp255(300)).toBe(255)
        expect(clamp255(1000)).toBe(255)
      })

      test('should pass through normal values unchanged', () => {
        expect(clamp255(0)).toBe(0)
        expect(clamp255(128)).toBe(128)
        expect(clamp255(255)).toBe(255)
        expect(clamp255(127.8)).toBe(127) // Should floor the value
      })
    })
  })
})

describe('clamp255 edge cases', () => {
  test('handles invalid RGBA ranges', () => {
    const rgba = new Uint8Array([
      255,
      255,
      255,
      255,
      0,
      0,
      0,
      255
    ])

    const mono = monoFromRGBA({
      rgba,
      width: 2,
      height: 1,
      mode: 'threshold',
      threshold: 128
    })

    expect(mono.width).toBe(2)
    expect(mono.bytes).toBeInstanceOf(Uint8Array)
  })

  test('handles extreme luminance values with Floyd-Steinberg', () => {
    const rgba = new Uint8Array([
      255,
      255,
      255,
      255,
      0,
      0,
      0,
      255,
      255,
      255,
      255,
      255,
      0,
      0,
      0,
      255,
      127,
      127,
      127,
      255,
      128,
      128,
      128,
      255,
      129,
      129,
      129,
      255,
      126,
      126,
      126,
      255
    ])

    const mono = monoFromRGBA({
      rgba,
      width: 4,
      height: 2,
      mode: 'fs',
      threshold: 127
    })

    expect(mono.width).toBe(4)
    expect(mono.height).toBe(2)
    expect(mono.bytesPerRow).toBe(1)
    expect(mono.bytes.length).toBe(2)
  })

  test('handles checkerboard error diffusion', () => {
    const size = 8
    const rgba = new Uint8Array(size * size * 4)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        const isWhite = (x + y) % 2 === 0
        const value = isWhite ? 255 : 0
        rgba[i] = value
        rgba[i + 1] = value
        rgba[i + 2] = value
        rgba[i + 3] = 255
      }
    }

    const mono = monoFromRGBA({
      rgba,
      width: size,
      height: size,
      mode: 'fs'
    })

    expect(mono.width).toBe(size)
    expect(mono.height).toBe(size)
    expect(mono.bytes.length).toBe(size)
  })

  test('handles gradient across all clamp branches', () => {
    const width = 16
    const height = 1
    const rgba = new Uint8Array(width * height * 4)

    for (let x = 0; x < width; x++) {
      const i = x * 4
      const value = Math.floor((x / (width - 1)) * 255)
      rgba[i] = value
      rgba[i + 1] = value
      rgba[i + 2] = value
      rgba[i + 3] = 255
    }

    const modes: DitherMode[] = ['fs', 'ordered', 'threshold']

    for (const mode of modes) {
      const mono = monoFromRGBA({
        rgba,
        width,
        height,
        mode,
        threshold: 128
      })

      expect(mono.width).toBe(width)
      expect(mono.height).toBe(height)
      expect(mono.bytes).toBeInstanceOf(Uint8Array)
    }
  })

  test('handles negative overflow cases', () => {
    const rgba = new Uint8Array([
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      255,
      1,
      1,
      1,
      255,
      2,
      2,
      2,
      255,
      3,
      3,
      3,
      255,
      4,
      4,
      4,
      255
    ])

    const mono = monoFromRGBA({
      rgba,
      width: 8,
      height: 2,
      mode: 'fs',
      threshold: 127
    })

    expect(mono.width).toBe(8)
    expect(mono.height).toBe(2)
    expect(mono.bytes.length).toBe(2)
  })
})
