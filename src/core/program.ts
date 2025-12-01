// src/core/program.ts
// Immutable builder that orchestrates printer setup, labels, and advanced commands

import type {
  DPI,
  LabelOptions,
  PrinterConfigOpts,
  RFIDOpts,
  RFIDReadOpts,
  Token,
} from '../_types.js';
import { Units } from '../_types.js';
import { emit } from './emit.js';
import { Label } from './label.js';
import { tokenizeZPL } from './parse.js';
import { buildPrinterConfigTokens, wrapPrinterConfigTokensInFormat } from './printer-config.js';
import { buildRFIDReadTokens, buildRFIDWriteTokens } from './rfid.js';

export interface ProgramOptions {
  dpi?: DPI;
  units?: Units;
}

export class ZPLProgram {
  private constructor(
    private readonly tokens: Token[],
    private readonly cfg: { dpi: DPI; units: Units },
  ) {}

  static create(opts: ProgramOptions = {}): ZPLProgram {
    const dpi: DPI = (opts.dpi ?? 203) as DPI;
    const units: Units = opts.units ?? Units.Dot;
    return new ZPLProgram([], { dpi, units });
  }

  /** Append arbitrary ZPL (printer control, downloads, etc.) */
  raw(zpl: string | Uint8Array): ZPLProgram {
    const chunk = tokenizeZPL(zpl);
    if (!chunk.length) return this;
    return this.append(chunk);
  }

  /** Human-friendly comment (^FX) for program level context */
  comment(text: string): ZPLProgram {
    const token: Token = { k: 'Cmd', mark: '^', name: 'FX', params: ` ${text}` };
    return this.append([token]);
  }

  /** Add a label format (^XA…^XZ) constructed with the fluent Label API */
  label(labelOrFactory: Label | ((label: Label) => Label), opts?: LabelOptions): ZPLProgram {
    const nextLabel = this.resolveLabel(labelOrFactory, opts);
    const tokens = tokenizeZPL(nextLabel.toZPL());
    return this.append(tokens);
  }

  /** Typed helpers for common printer/media configuration commands */
  printerConfig(opts: PrinterConfigOpts): ZPLProgram {
    const tokens = wrapPrinterConfigTokensInFormat(buildPrinterConfigTokens(this.cfg, opts));
    if (!tokens.length) return this;
    return this.append(tokens);
  }

  /** Emit an RFID write command outside of a label format */
  rfid(opts: RFIDOpts): ZPLProgram {
    return this.append(buildRFIDWriteTokens(opts));
  }

  /** Emit an RFID read command (^RFR, including HostBuffer reads) */
  rfidRead(opts: RFIDReadOpts): ZPLProgram {
    return this.append(buildRFIDReadTokens(opts));
  }

  /** Serialize the accumulated token stream */
  toZPL(): string {
    return emit(this.tokens);
  }

  private append(newTokens: Token[]): ZPLProgram {
    if (!newTokens.length) return this;
    return new ZPLProgram([...this.tokens, ...newTokens], this.cfg);
  }

  private resolveLabel(
    labelOrFactory: Label | ((label: Label) => Label),
    opts?: LabelOptions,
  ): Label {
    if (labelOrFactory instanceof Label) return labelOrFactory;
    if (!opts) throw new Error('Label options are required when supplying a factory function.');
    return labelOrFactory(Label.create(opts));
  }
}
