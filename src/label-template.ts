// src/label-template.ts
// Tagged template for building Label instances from raw ZPL

import type { DPI } from './_types.js';
import { Units } from './_types.js';
import { Label } from './core/label.js';

/**
 * Tagged template literal for parsing ZPL strings into Label instances.
 *
 * @remarks
 * The `label` tagged template allows you to embed ZPL code directly in your TypeScript/JavaScript
 * and get back a fluent Label instance that you can continue to chain methods on.
 *
 * Template literals can include interpolated values using ${} syntax, which will be
 * inserted into the ZPL string before parsing.
 *
  * @note Whitespace (including indentation) is preserved exactly as written. Align your template
  * strings to column 0 if you do not want leading spaces emitted with your ZPL.
  *
 * @example
 * ```typescript
 * import { label } from '@schie/fluent-zpl'
 *
 * const trackingNumber = '1234567890'
 *
 * const myLabel = label`
 *   ^XA
 *   ^FO50,50^A0N,28,28^FDShipping Label^FS
 *   ^FO50,100^BCN,80,Y,N,N^FD${trackingNumber}^FS
 *   ^XZ
 * `
 *
 * // Continue chaining fluent methods
 * myLabel.text({ at: { x: 50, y: 200 }, text: 'Additional text' })
 *        .toZPL()
 * ```
 *
 * @param strings - Template literal string parts
 * @param values - Interpolated values
 * @returns Label instance for continued chaining
 */
export function label(strings: TemplateStringsArray, ...values: (string | number)[]): Label;
export function label(
  strings: TemplateStringsArray,
  ...args: [...(string | number)[], { dpi?: DPI; units?: Units }]
): Label;
export function label(
  strings: TemplateStringsArray,
  ...args: (string | number | { dpi?: DPI; units?: Units })[]
): Label {
  // Check if last argument is options object
  const lastArg = args[args.length - 1];
  const hasOptions = typeof lastArg === 'object' && lastArg !== null && !Array.isArray(lastArg);

  const values = hasOptions
    ? (args.slice(0, -1) as (string | number)[])
    : (args as (string | number)[]);
  const options = hasOptions ? (lastArg as { dpi?: DPI; units?: Units }) : {};

  // Construct the ZPL string by interleaving raw string chunks and interpolated values.
  // We do not trim or reformat the template—whitespace is preserved exactly as provided.
  const templateParts = strings.raw;
  let zplString = templateParts[0];

  for (let i = 0; i < values.length; i++) {
    zplString += String(values[i]) + templateParts[i + 1];
  }

  // Parse the ZPL string into a Label instance
  const dpi: DPI = options.dpi ?? (203 as DPI);
  const units: Units = options.units ?? Units.Dot;

  return Label.parse(zplString, dpi, units);
}

/**
 * Alternative syntax for the label template with explicit options
 *
 * @example
 * ```typescript
 * const myLabel = label.withOptions({ dpi: 300, units: 'mm' })`
 *   ^XA
 *   ^FO50,50^A0N,28,28^FDHigh DPI Label^FS
 *   ^XZ
 * `
 * ```
 */
label.withOptions = function (options: { dpi?: DPI; units?: Units }) {
  return function (strings: TemplateStringsArray, ...values: (string | number)[]): Label {
    return label(strings, ...values, options);
  };
};
