// Tests for src/core/printer-config.ts

import { MediaTracking, PrinterConfiguration, PrinterMode, Units } from '../../src/_types.js';
import { inch } from '../../src/_unit-helpers.js';
import { PrinterConfig } from '../../src/core/printer-config.js';
import { ZPLProgram } from '../../src/core/program.js';

describe('PrinterConfig builder', () => {
  test('builds ZPL with fluent helpers', () => {
    const zpl = PrinterConfig.create()
      .mode(PrinterMode.TearOff)
      .mediaTracking(MediaTracking.NonContinuous)
      .printWidth(801)
      .printSpeed(4)
      .darkness(10)
      .tearOff(25)
      .labelHome({ x: 0, y: 0 })
      .save()
      .toZPL();

    expect(zpl).toBe('^XA^MMT^MNY^PW801^PR4^MD10~TA25^LH0,0^JUS^XZ');
  });

  test('build() feeds ZPLProgram.printerConfig()', () => {
    const builder = PrinterConfig.create()
      .mode(PrinterMode.Applicator)
      .mediaTracking(MediaTracking.Mark)
      .printSpeed(3)
      .configuration(PrinterConfiguration.ReloadSaved);

    const zpl = ZPLProgram.create().printerConfig(builder.build()).toZPL();
    expect(zpl).toBe('^XA^MMA^MNZ^PR3^JUR^XZ');
  });

  test('covers speeds, unit conversion, additional commands, and reload helpers', () => {
    const zpl = PrinterConfig.create()
      .printWidth(inch(3, 300))
      .printSpeed(10)
      .slewSpeed(5)
      .backfeedSpeed(2)
      .additionalCommands(['  ^IDR:LOGO.GRF  '])
      .raw('  ^HH  ')
      .additionalCommands(['^HH', '   ', '^XZ'])
      .reloadFactoryNetwork()
      .toZPL();

    expect(zpl).toBe('^XA^PW900^PR10,5,2^IDR:LOGO.GRF^HH^XZ^JUN^XZ');

    const reloadSaved = PrinterConfig.create().reloadSaved().toZPL();
    const reloadFactory = PrinterConfig.create().reloadFactory().toZPL();

    expect(reloadSaved).toBe('^XA^JUR^XZ');
    expect(reloadFactory).toBe('^XA^JUF^XZ');
  });

  test('labelHomeOrigin sets ^LH0,0 and preserves immutability', () => {
    const base = PrinterConfig.create();
    const withOrigin = base.labelHomeOrigin();
    expect(base.toZPL()).toBe('');
    expect(withOrigin.toZPL()).toBe('^XA^LH0,0^XZ');
  });

  test('additionalCommands merges and dedupes across calls', () => {
    const config = PrinterConfig.create()
      .additionalCommands([' ^XA ', ' ^XZ '])
      .additionalCommands(['^XZ', ' ', '^XA', '^HH']);

    expect(config.toZPL()).toBe('^XA^XA^XZ^HH^XZ');
  });

  test('raw ignores empty strings and trims input', () => {
    const base = PrinterConfig.create();
    const same = base.raw('   ');
    const updated = base.raw('  ^HH ');

    expect(same).toBe(base);
    expect(updated.toZPL()).toBe('^XA^HH^XZ');
  });

  test('additionalCommands ignores empty payloads without cloning', () => {
    const base = PrinterConfig.create();
    const same = base.additionalCommands(['   ', '']);
    expect(same).toBe(base);
  });

  test('toZPL does not double-wrap when commands are pre-wrapped', () => {
    const prewrapped = PrinterConfig.create().additionalCommands(['^XA^PR5^XZ']);
    expect(prewrapped.toZPL()).toBe('^XA^PR5^XZ');
  });

  test('immutability is preserved when chaining', () => {
    const base = PrinterConfig.create().printSpeed(5);
    const tweaked = base.darkness(15);

    expect(base.toZPL()).toBe('^XA^PR5^XZ');
    expect(tweaked.toZPL()).toBe('^XA^PR5^MD15^XZ');
  });
  test('labelHomeOrigin sets label home to origin (0,0)', () => {
    const zpl = PrinterConfig.create().labelHomeOrigin().toZPL();

    expect(zpl).toBe('^XA^LH0,0^XZ');
  });

  test('labelHomeOrigin overwrites existing labelHome position', () => {
    const zpl = PrinterConfig.create().labelHome({ x: 100, y: 200 }).labelHomeOrigin().toZPL();

    expect(zpl).toBe('^XA^LH0,0^XZ');
  });

  test('labelHomeOrigin works with unit conversion', () => {
    const zpl = PrinterConfig.create({ units: Units.Inch, dpi: 300 })
      .labelHome({ x: inch(1, 300), y: inch(0.5, 300) })
      .labelHomeOrigin()
      .toZPL();

    expect(zpl).toBe('^XA^LH0,0^XZ');
  });

  test('labelHomeOrigin preserves immutability', () => {
    const base = PrinterConfig.create().labelHome({ x: 50, y: 75 });
    const origin = base.labelHomeOrigin();

    expect(base.toZPL()).toBe('^XA^LH50,75^XZ');
    expect(origin.toZPL()).toBe('^XA^LH0,0^XZ');
  });

  test('supports tear-off adjustment with unit conversion and clamping', () => {
    const converted = PrinterConfig.create({ units: Units.Inch, dpi: 203 }).tearOff(1).toZPL();
    expect(converted).toBe('^XA~TA120^XZ');

    const clampedHigh = PrinterConfig.create().tearOff(5000).toZPL();
    const clampedLow = PrinterConfig.create().tearOff(-5000).toZPL();

    expect(clampedHigh).toBe('^XA~TA120^XZ');
    expect(clampedLow).toBe('^XA~TA-120^XZ');
  });
});
