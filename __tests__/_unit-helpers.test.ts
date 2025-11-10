// Unit helpers tests - comprehensive coverage for unit conversion functions

import type { DPI, Units } from '../src/_types.js'
import { dot, inch, mm, toDots } from '../src/_unit-helpers.js'

describe('Unit Helper Functions', () => {
  describe('dot()', () => {
    test('should return input unchanged for positive values', () => {
      expect(dot(100)).toBe(100)
      expect(dot(1)).toBe(1)
      expect(dot(999999)).toBe(999999)
    })

    test('should handle zero and negative values', () => {
      expect(dot(0)).toBe(0)
      expect(dot(-50)).toBe(-50)
    })

    test('should handle decimal values', () => {
      expect(dot(10.5)).toBe(10.5)
      expect(dot(0.1)).toBe(0.1)
    })
  })

  describe('mm()', () => {
    test('should convert millimeters to dots at 203 DPI', () => {
      expect(mm(25.4, 203)).toBe(203) // 1 inch = 25.4mm
      expect(mm(0, 203)).toBe(0)
      expect(mm(12.7, 203)).toBeCloseTo(102, 0) // 0.5 inch
    })

    test('should convert millimeters to dots at 300 DPI', () => {
      expect(mm(25.4, 300)).toBe(300) // 1 inch at 300 DPI
      expect(mm(10, 300)).toBeCloseTo(118, 0) // 10mm at 300 DPI
    })

    test('should convert millimeters to dots at 600 DPI', () => {
      expect(mm(25.4, 600)).toBe(600) // 1 inch at 600 DPI
      expect(mm(1, 600)).toBeCloseTo(24, 0) // 1mm at 600 DPI
    })

    test('should use default 203 DPI when not specified', () => {
      expect(mm(25.4)).toBe(203)
      expect(mm(10)).toBeCloseTo(80, 0)
    })

    test('should handle edge cases', () => {
      expect(mm(0.1, 203)).toBeCloseTo(1, 0)
      expect(mm(100, 203)).toBeCloseTo(799, 0) // 100mm ≈ 799 dots at 203 DPI
    })
  })

  describe('inch()', () => {
    test('should convert inches to dots at 203 DPI', () => {
      expect(inch(1, 203)).toBe(203)
      expect(inch(0, 203)).toBe(0)
      expect(inch(0.5, 203)).toBeCloseTo(102, 0)
      expect(inch(2, 203)).toBe(406)
    })

    test('should convert inches to dots at 300 DPI', () => {
      expect(inch(1, 300)).toBe(300)
      expect(inch(0.5, 300)).toBe(150)
      expect(inch(2, 300)).toBe(600)
    })

    test('should convert inches to dots at 600 DPI', () => {
      expect(inch(1, 600)).toBe(600)
      expect(inch(0.25, 600)).toBe(150)
    })

    test('should use default 203 DPI when not specified', () => {
      expect(inch(1)).toBe(203)
      expect(inch(0.5)).toBeCloseTo(102, 0)
    })

    test('should handle fractional inches', () => {
      expect(inch(1.5, 203)).toBeCloseTo(305, 0)
      expect(inch(0.1, 203)).toBeCloseTo(20, 0)
    })
  })

  describe('toDots()', () => {
    const testCases: Array<{
      value: number
      dpi: DPI
      units: Units
      expected: number
      description: string
    }> = [
      // Dot conversions
      { value: 100, dpi: 203, units: 'dot', expected: 100, description: 'dots at 203 DPI' },
      { value: 50, dpi: 300, units: 'dot', expected: 50, description: 'dots at 300 DPI' },
      { value: 0, dpi: 600, units: 'dot', expected: 0, description: 'zero dots' },

      // MM conversions
      {
        value: 25.4,
        dpi: 203,
        units: 'mm',
        expected: 203,
        description: '25.4mm at 203 DPI (1 inch)'
      },
      { value: 10, dpi: 203, units: 'mm', expected: 80, description: '10mm at 203 DPI' },
      { value: 25.4, dpi: 300, units: 'mm', expected: 300, description: '25.4mm at 300 DPI' },
      { value: 1, dpi: 600, units: 'mm', expected: 24, description: '1mm at 600 DPI' },

      // Inch conversions
      { value: 1, dpi: 203, units: 'in', expected: 203, description: '1 inch at 203 DPI' },
      { value: 0.5, dpi: 203, units: 'in', expected: 102, description: '0.5 inch at 203 DPI' },
      { value: 1, dpi: 300, units: 'in', expected: 300, description: '1 inch at 300 DPI' },
      { value: 2, dpi: 600, units: 'in', expected: 1200, description: '2 inches at 600 DPI' }
    ]

    testCases.forEach(({ value, dpi, units, expected, description }) => {
      test(`should convert ${description}`, () => {
        expect(toDots(value, dpi, units)).toBeCloseTo(expected, 0)
      })
    })

    test('should handle edge cases', () => {
      expect(toDots(0, 203, 'mm')).toBe(0)
      expect(toDots(0, 203, 'in')).toBe(0)
      expect(toDots(0, 203, 'dot')).toBe(0)
    })

    test('should handle very small values', () => {
      expect(toDots(0.1, 203, 'mm')).toBeGreaterThan(0)
      expect(toDots(0.01, 203, 'in')).toBeGreaterThan(0)
    })

    test('should handle large values', () => {
      expect(toDots(1000, 203, 'mm')).toBeGreaterThan(1000)
      expect(toDots(100, 203, 'in')).toBe(20300)
    })

    test('should handle unknown units (default case)', () => {
      // Test the default case in the switch statement
      // @ts-expect-error Testing invalid units for coverage
      expect(toDots(50, 203, 'invalid' as any)).toBe(50)
    })
  })
})
