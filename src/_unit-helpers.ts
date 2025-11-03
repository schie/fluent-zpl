// src/_unit-helpers.ts
// unit helpers for @schie/fluent-zpl

import { DPI, Units } from './_types.js'

/* =====================================
 *  Unit Helpers
 * ===================================== */

/**
 * Convert a value in dots to the equivalent value in dots.
 * @param n The value in dots.
 * @returns The value in dots.
 */
export const dot = (n: number) => n

/**
 * Convert a value in millimeters to the equivalent value in dots.
 * @param n The value in millimeters.
 * @param dpi The printer DPI setting (default: 203).
 * @returns The value in dots.
 */
export const mm = (n: number, dpi: DPI = 203) => Math.round((n * dpi) / 25.4)

/**
 * Convert a value in inches to the equivalent value in dots.
 * @param n The value in inches.
 * @param dpi The printer DPI setting (default: 203).
 * @returns The value in dots.
 */
export const inch = (n: number, dpi: DPI = 203) => Math.round(n * dpi)

/**
 * Convert a value in the specified units to the equivalent value in dots.
 * @param n The value to convert.
 * @param dpi The printer DPI setting.
 * @param units The units of the input value.
 * @returns The value in dots.
 */
export const toDots = (n: number, dpi: DPI, units: Units): number => {
  switch (units) {
    case 'dot':
      return dot(n)
    case 'mm':
      return mm(n, dpi)
    case 'in':
      return inch(n, dpi)
    default:
      return n
  }
}
