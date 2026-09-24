// src/core/printer-config.ts
// Fluent builder for printer configuration (shared with ZPLProgram)

import type {
  DPI,
  MediaTracking,
  Mirror,
  Orientation,
  PrinterConfigOpts,
  PrinterMode,
  Token,
} from '../_types.js';
import { PrinterConfiguration, Units } from '../_types.js';
import { toDots } from '../_unit-helpers.js';
import { emit } from './emit.js';
import { tokenizeZPL } from './parse.js';

// Clamp a numeric value into an inclusive range (rounding to integer).
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, Math.round(value)));
};

const defaultPrintSpeed = 2;
const defaultSlewSpeed = 6;
const defaultBackfeedSpeed = 2;

export const buildPrinterConfigTokens = (
  cfg: { dpi: DPI; units: Units },
  opts: PrinterConfigOpts,
) => {
  const commands: string[] = [];

  if (opts.mode) commands.push(`^MM${opts.mode}`);
  if (opts.mediaTracking) commands.push(`^MN${opts.mediaTracking}`);
  if (opts.mirror) commands.push(`^PM${opts.mirror}`);
  if (opts.orientation) commands.push(`^PO${opts.orientation}`);
  if (opts.printWidth != null) {
    commands.push(`^PW${toDots(opts.printWidth, cfg.dpi, cfg.units)}`);
  }

  if (opts.printSpeed != null || opts.slewSpeed != null || opts.backfeedSpeed != null) {
    const parts = [
      opts.printSpeed ?? defaultPrintSpeed,
      opts.slewSpeed ?? defaultSlewSpeed,
      opts.backfeedSpeed ?? defaultBackfeedSpeed,
    ].map((value) => clamp(value, 1, 14).toString());
    commands.push(`^PR${parts.join(',')}`);
  }

  if (opts.darkness != null) commands.push(`^MD${clamp(opts.darkness, -30, 30)}`);

  if (opts.tearOff != null) {
    const dots = toDots(opts.tearOff, cfg.dpi, cfg.units);
    commands.push(`~TA${clamp(dots, -120, 120)}`);
  }

  if (opts.additionalCommands?.length) {
    for (const cmd of opts.additionalCommands) {
      if (cmd && cmd.trim().length) commands.push(cmd.trim());
    }
  }

  if (opts.configuration) commands.push(`^JU${opts.configuration}`);

  return commands.length ? tokenizeZPL(commands.join('')) : [];
};

export const wrapPrinterConfigTokensInFormat = (tokens: Token[]): Token[] => {
  if (!tokens.length) return tokens;

  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const alreadyWrapped =
    first.k === 'Cmd' && first.name === 'XA' && last.k === 'Cmd' && last.name === 'XZ';
  if (alreadyWrapped) return tokens;

  return tokenizeZPL(`^XA${emit(tokens)}^XZ`);
};

/**
 * Optional context for converting measurements when building printer config.
 *
 * @remarks
 * `dpi`/`units` only matter for options measured in distance — `printWidth` (`^PW`) and
 * `tearOff` (`~TA`) — which are converted to dots using this context. Non-measurement options
 * such as `printSpeed`/`slewSpeed`/`backfeedSpeed` (`^PR`) and `darkness` (`^MD`) are unaffected
 * by `dpi`/`units`, so omit them entirely if you're only configuring device-level settings.
 */
export interface PrinterConfigBuilderOptions {
  dpi?: DPI;
  units?: Units;
}

/**
 * Fluent, immutable builder for printer configuration commands.
 *
 * @remarks
 * Use this when you want a readable, chainable way to assemble ^MM/^MN/^PW/^PR/^MD/^JU
 * without mutating state. You can pass dots directly or preconvert measurements with `inch()`
 * / `mm()`. The result can be consumed by `ZPLProgram.printerConfig(...)` via `.build()`, or
 * serialized on its own with `.toZPL()`.
 */
export class PrinterConfig {
  private constructor(
    private readonly cfg: { dpi: DPI; units: Units },
    private readonly opts: PrinterConfigOpts,
  ) {}

  /**
   * Start a new printer configuration builder (defaults to dots @ 203 dpi).
   *
   * @remarks
   * `dpi`/`units` are only used to convert `printWidth`/`tearOff` from inches or millimeters
   * into dots. If you're only setting device-level, non-measurement options like `printSpeed`,
   * `slewSpeed`, `backfeedSpeed`, or `darkness` (e.g. `^PR`/`^MD`), you can omit them entirely:
   * `PrinterConfig.create().printSpeed(8).toZPL()`.
   */
  static create({ dpi, units }: PrinterConfigBuilderOptions = {}): PrinterConfig {
    return new PrinterConfig({ dpi: (dpi ?? 203) as DPI, units: units ?? Units.Dot }, {});
  }

  /** Set printer mode (^MM). */
  mode(mode: PrinterMode): PrinterConfig {
    return this.with({ mode });
  }

  /** Set media tracking / sensor strategy (^MN). */
  mediaTracking(mediaTracking: MediaTracking): PrinterConfig {
    return this.with({ mediaTracking });
  }

  /** Mirror label content across the vertical axis (^PM). */
  mirror(mirror: Mirror): PrinterConfig {
    return this.with({ mirror });
  }

  /** Set inverted/normal print orientation (^PO). */
  orientation(orientation: Orientation): PrinterConfig {
    return this.with({ orientation });
  }

  /** Set print width (^PW). Converted to dots using the builder's `dpi`/`units` context. */
  printWidth(printWidth: number): PrinterConfig {
    return this.with({ printWidth });
  }

  /**
   * Set print speed component (^PR). Rounded to an integer and clamped between 1 and 14.
   * Setting any ^PR speed emits all three components, filling unset ones with print 2, slew 6,
   * and backfeed 2 (so this one is written as 2 when unset). Not a measurement — independent
   * of `dpi`/`units`.
   */
  printSpeed(printSpeed: number): PrinterConfig {
    return this.with({ printSpeed });
  }

  /**
   * Set slew speed component (^PR). Rounded to an integer and clamped between 1 and 14.
   * Setting any ^PR speed emits all three components, filling unset ones with print 2, slew 6,
   * and backfeed 2 (so this one is written as 6 when unset). Not a measurement — independent
   * of `dpi`/`units`.
   */
  slewSpeed(slewSpeed: number): PrinterConfig {
    return this.with({ slewSpeed });
  }

  /**
   * Set backfeed speed component (^PR). Rounded to an integer and clamped between 1 and 14.
   * Setting any ^PR speed emits all three components, filling unset ones with print 2, slew 6,
   * and backfeed 2 (so this one is written as 2 when unset). Not a measurement — independent
   * of `dpi`/`units`.
   */
  backfeedSpeed(backfeedSpeed: number): PrinterConfig {
    return this.with({ backfeedSpeed });
  }

  /**
   * Set darkness (^MD). Rounded to an integer and clamped between -30 and 30. Not a
   * measurement — independent of `dpi`/`units`.
   */
  darkness(darkness: number): PrinterConfig {
    return this.with({ darkness });
  }

  /**
   * Set tear-off adjustment (~TA). Provide dots or preconverted values; rounded and clamped
   * between -120 and 120. Converted to dots using the builder's `dpi`/`units` context.
   */
  tearOff(tearOff: number): PrinterConfig {
    return this.with({ tearOff });
  }

  /** Merge and dedupe additional passthrough commands. */
  additionalCommands(additionalCommands: string[]): PrinterConfig {
    const cleaned = additionalCommands.map((cmd) => cmd.trim()).filter((cmd) => cmd.length);
    if (!cleaned.length) return this;
    const merged = [...(this.opts.additionalCommands ?? []), ...cleaned];
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const cmd of merged) {
      if (seen.has(cmd)) continue;
      seen.add(cmd);
      deduped.push(cmd);
    }
    return this.with({ additionalCommands: deduped });
  }

  /** Set printer configuration save/reload (^JU). */
  configuration(configuration: PrinterConfiguration): PrinterConfig {
    return this.with({ configuration });
  }

  /** Append a single raw command (trimmed; ignored if empty). */
  raw(command: string): PrinterConfig {
    const trimmed = command.trim();
    if (!trimmed.length) return this;
    return this.additionalCommands([trimmed]);
  }

  /** Save current settings (^JUS). */
  save(): PrinterConfig {
    return this.configuration(PrinterConfiguration.Save);
  }

  /** Reload last saved settings (^JUR). */
  reloadSaved(): PrinterConfig {
    return this.configuration(PrinterConfiguration.ReloadSaved);
  }

  /** Reload factory defaults (^JUF). */
  reloadFactory(): PrinterConfig {
    return this.configuration(PrinterConfiguration.ReloadFactory);
  }

  /** Reload factory network defaults (^JUN). */
  reloadFactoryNetwork(): PrinterConfig {
    return this.configuration(PrinterConfiguration.ReloadFactoryNetwork);
  }

  /** Return the accumulated options object. */
  build(): PrinterConfigOpts {
    return { ...this.opts };
  }

  /** Emit the current configuration block as ZPL. */
  toZPL(): string {
    const tokens = wrapPrinterConfigTokensInFormat(buildPrinterConfigTokens(this.cfg, this.opts));
    return emit(tokens);
  }

  private with(next: Partial<PrinterConfigOpts>): PrinterConfig {
    return new PrinterConfig(this.cfg, { ...this.opts, ...next });
  }
}
