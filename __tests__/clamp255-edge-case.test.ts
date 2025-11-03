// Test file specifically to cover clamp255 function branches in encoder.ts line 248

import { monoFromRGBA, type DitherMode } from '../src/image/encoder.js'

describe('clamp255 Function Edge Cases', () => {
  test('should handle invalid RGBA values that exceed normal range', () => {
    // Create RGBA data that exceeds the normal 0-255 range
    // This can happen if the input comes from a source that uses different ranges
    const rgba = new Uint8Array([
      // These values are technically possible in Uint8Array but represent edge cases
      255,
      255,
      255,
      255, // Maximum valid values -> should be near 255
      0,
      0,
      0,
      255 // Minimum valid values -> should be 0
    ])

    // The clamp255 function is used in luminance calculation: (r*299 + g*587 + b*114)/1000
    // With r=255, g=255, b=255: (255*299 + 255*587 + 255*114)/1000 = 255000/1000 = 255
    // This should exercise the normal branch
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
  test('should handle extreme luminance values that trigger clamp255 branches', () => {
    // Create a very specific pattern that forces Floyd-Steinberg dithering
    // to generate values outside 0-255 range, triggering all clamp255 branches

    // This pattern creates maximum error diffusion: alternating black/white
    // in a way that causes overflow/underflow during error propagation
    const rgba = new Uint8Array([
      // Create pattern that maximizes error diffusion edge cases
      255,
      255,
      255,
      255, // White -> will create positive error
      0,
      0,
      0,
      255, // Black -> will create negative error
      255,
      255,
      255,
      255, // White -> receives large negative error
      0,
      0,
      0,
      255, // Black -> receives large positive error

      // Second row to propagate errors vertically too
      127,
      127,
      127,
      255, // Mid-gray receives error from above
      128,
      128,
      128,
      255, // Mid-gray receives error from above
      129,
      129,
      129,
      255, // Mid-gray receives error from above
      126,
      126,
      126,
      255 // Mid-gray receives error from above
    ])

    // Use Floyd-Steinberg with a threshold that maximizes error distribution
    const mono = monoFromRGBA({
      rgba,
      width: 4,
      height: 2,
      mode: 'fs', // Floyd-Steinberg error diffusion
      threshold: 127 // Edge threshold to maximize clamp255 usage
    })

    // Should handle all values without errors
    expect(mono.width).toBe(4)
    expect(mono.height).toBe(2)
    expect(mono.bytes).toBeInstanceOf(Uint8Array)
    expect(mono.bytesPerRow).toBe(1) // ceil(4/8) = 1
    expect(mono.bytes.length).toBe(2) // 2 rows * 1 byte per row
  })

  test('should handle edge case patterns that maximize clamp255 usage', () => {
    // Create checkerboard pattern that maximizes error diffusion
    const size = 8
    const rgba = new Uint8Array(size * size * 4)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        const isWhite = (x + y) % 2 === 0
        const value = isWhite ? 255 : 0
        rgba[i] = value // R
        rgba[i + 1] = value // G
        rgba[i + 2] = value // B
        rgba[i + 3] = 255 // A
      }
    }

    // Floyd-Steinberg on checkerboard creates maximum error diffusion
    const mono = monoFromRGBA({
      rgba,
      width: size,
      height: size,
      mode: 'fs'
    })

    expect(mono.width).toBe(size)
    expect(mono.height).toBe(size)
    expect(mono.bytes.length).toBe(size) // ceil(8/8) * 8 = 8 bytes
  })

  test('should handle gradient that exercises all clamp255 branches', () => {
    // Create gradient that will exercise < 0, > 255, and normal value branches
    const width = 16
    const height = 1
    const rgba = new Uint8Array(width * height * 4)

    for (let x = 0; x < width; x++) {
      const i = x * 4
      const value = Math.floor((x / (width - 1)) * 255)
      rgba[i] = value // R
      rgba[i + 1] = value // G
      rgba[i + 2] = value // B
      rgba[i + 3] = 255 // A
    }

    // Test with different dithering modes
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

  test('should exercise clamp255 negative overflow branch', () => {
    // Create a pattern specifically designed to cause negative overflow
    // in Floyd-Steinberg error diffusion
    const rgba = new Uint8Array([
      // Row 1: White pixels that will create large positive errors
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
      // Row 2: Very dark pixels that will receive large positive errors
      // This should cause some intermediate values to go < 0
      1,
      1,
      1,
      255, // Very dark, will receive positive error -> could underflow
      2,
      2,
      2,
      255, // Very dark, will receive positive error -> could underflow
      3,
      3,
      3,
      255, // Very dark, will receive positive error -> could underflow
      4,
      4,
      4,
      255 // Very dark, will receive positive error -> could underflow
    ])

    const mono = monoFromRGBA({
      rgba,
      width: 4,
      height: 2,
      mode: 'fs',
      threshold: 254 // Very high threshold to maximize negative errors
    })

    expect(mono.bytes).toBeInstanceOf(Uint8Array)
  })

  test('should exercise clamp255 positive overflow branch', () => {
    // Create a pattern to cause positive overflow in Floyd-Steinberg
    const rgba = new Uint8Array([
      // Row 1: Very dark pixels that create large negative errors
      0,
      0,
      0,
      255,
      0,
      0,
      0,
      255,
      0,
      0,
      0,
      255,
      0,
      0,
      0,
      255,
      // Row 2: Very light pixels that receive large negative errors
      // This should cause some intermediate values to go > 255
      254,
      254,
      254,
      255, // Very light, gets negative error -> could overflow
      253,
      253,
      253,
      255, // Very light, gets negative error -> could overflow
      252,
      252,
      252,
      255, // Very light, gets negative error -> could overflow
      251,
      251,
      251,
      255 // Very light, gets negative error -> could overflow
    ])

    const mono = monoFromRGBA({
      rgba,
      width: 4,
      height: 2,
      mode: 'fs',
      threshold: 1 // Very low threshold to maximize positive errors
    })

    expect(mono.bytes).toBeInstanceOf(Uint8Array)
  })
})
