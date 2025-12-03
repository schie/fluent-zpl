# Copilot Instructions for @schie/fluent-zpl

This repository houses a TypeScript library for generating Zebra Programming Language (ZPL) output via a fluent, immutable API. The ecosystem now covers label design, printer configuration, RFID, and image tooling.

## Project Status (December 2025)

**Latest highlights**

- ✅ `ZPLProgram` orchestrates printer/media setup, diagnostics, and multiple labels in one payload
- ✅ `PrinterConfig` fluent builder covers ^MM/^MN/^PW/^PR/^MD/~TA/^LH/^JU with unit-aware conversion, clamping, and ^XA/^XZ wrapping
- ✅ Tagged template helper `label` (invoked as ``label\`...\````, formerly `zpl`) parses existing formats directly into `Label`
- ✅ Text wrapping supports hanging indents; DPI/unit helpers keep conversions consistent across label/program/printer config
- ✅ Jest suite stays at 100% coverage across label/program/printer config/image/RFID paths

**Testing / coverage**

- Run `npm test -- --watchman=false`
- Node 20+, ESM modules (`ts-jest` with `NODE_OPTIONS='--experimental-vm-modules'`)
- Coverage must remain at 100% across `src/**`

## Project Structure

```text
src/
├── index.ts             # Public API surface
├── _types.ts            # Shared enums/types
├── _unit-helpers.ts     # dot/mm/in conversion helpers
├── core/
│   ├── label.ts         # Fluent Label builder
│   ├── program.ts       # ZPLProgram (job orchestration)
│   ├── printer-config.ts  # Fluent printer config builder + ^JU helpers
│   ├── rfid.ts          # RFID token builders
│   ├── parse.ts         # Tokenizer
│   └── emit.ts          # Serializer
├── label-template.ts    # `label\`...\`` tagged template helper
└── image/
    ├── api.ts           # Inline/cached image plumbing
    ├── encoder.ts       # RGBA → monochrome conversion
    └── registry.ts      # Asset dedupe utilities
```

## Key Design Principles

1. **Immutable fluent chain** – Every method returns a new `Label`/`ZPLProgram` instance. No mutation allowed.
2. **Unit/DPI awareness** – Accept mm/in/dot inputs, convert via `toDots` and friends.
3. **ZPL correctness first** – Always emit complete parameters, escape `^` inside `^FD`, maintain ^XA/^XZ framing.
4. **Shared token pipeline** – Parse → manipulate → emit without lossy transforms.
5. **No silent transforms** – Preserve whitespace/binary buffers; avoid reformatting parsed payloads.
6. **Printer config invariants** – Clamp ^PR speeds 0–30, ^MD -30–30, ~TA ±120; wrap standalone config blocks with ^XA/^XZ.

## Core APIs

### Label (`src/core/label.ts`)

- Factories: `Label.create`, `Label.parse`
- Fields: `text`, `barcode`, `box`, `caption`, `qr`, `addressBlock`
- Wrapping: ^FB width/lines/spacing/justification/hangingIndent (second+ lines indent supported)
- Media: `imageInline` (^GF), `image` (~DG/^XG)
- RFID: `rfid`, `rfidRead`, `epc`
- Utilities: `comment`, `withMetadata`, `setDefaultFont`, `setBarcodeDefaults`, `toZPL`

### ZPLProgram (`src/core/program.ts`)

- `ZPLProgram.create({ dpi?, units? })`
- `.printerConfig(opts)` → emits ^MM/^MN/^PW/^PR/^MD/~TA/^LH/^JU (unit-aware, wrapped in ^XA/^XZ if not already)
- `.label(label | factory, options?)` → appends ^XA…^XZ blocks
- `.rfid(opts)` / `.rfidRead(opts)` → job-level RFID commands (HostBuffer read supported)
- `.raw(zpl)` / `.comment(text)` → arbitrary commands and metadata
- `.toZPL()` → concatenated payload
- DPI/units passed to `create` flow through to labels and printer config conversions

### PrinterConfig (`src/core/printer-config.ts`)

- `PrinterConfig.create({ dpi?, units? })` → immutable builder for ^MM/^MN/^PW/^PR/^MD/~TA/^LH/^JU
- Speeds (^PR) clamp to 0–30, darkness (^MD) to -30–30, tear-off (~TA) to ±120 with unit conversion via `toDots`
- `labelHome`/`labelHomeOrigin` helpers, plus `additionalCommands`/`raw` with dedupe
- `configuration`/`save`/`reloadSaved`/`reloadFactory`/`reloadFactoryNetwork` map to ^JU codes
- `.build()` returns options for `ZPLProgram.printerConfig`; `.toZPL()` wraps the block in ^XA/^XZ if needed

### Tagged template (`src/label-template.ts`)

- `label\`...\``parses compacted ZPL into a`Label`
- `label.withOptions({ dpi, units })` overrides parsing context

### Token pipeline (`src/core/parse.ts`, `src/core/emit.ts`)

- Tokenizes commands, FD/FS blocks, raw text, and binary buffers
- Enables round-tripping existing ZPL without reformatting

### Image stack (`src/image/*`)

- Dithering/threshold conversion for inline (`^GF`) or cached (`~DG`/`^XG`) assets
- Registry handles deduplication and identifier reuse

## Testing

- Jest config: `NODE_OPTIONS='--experimental-vm-modules' jest --watchman=false`
- Suites (`__tests__/`):
  - `_unit-helpers.test.ts`
  - `label-template.test.ts`
  - `core/emit.test.ts`
  - `core/label.test.ts`
  - `core/parse.test.ts`
  - `core/printer-config.test.ts`
  - `core/program.test.ts`
  - `core/rfid.test.ts`
  - `image/api.test.ts`
  - `image/encoder.test.ts`
  - `image/registry.test.ts`
- Every new feature needs targeted tests plus 100% coverage enforcement

## Contribution Guardrails

- TypeScript strict mode everywhere; no `any`
- Keep APIs immutable and side-effect free
- Update `_types.ts` for public options/enums
- Preserve printer config clamping/wrapping invariants (PR 0–30, MD -30–30, TA ±120, wrap config blocks in ^XA/^XZ)
- Document new functionality (README + docs) and refresh Copilot/agent notes when behavior shifts

## ZPL Tips

- Always wrap content with `^XA`/`^XZ`
- Escape literal `^` as `^^` within `^FD`
- Provide full parameter lists (e.g., `^A` height/width)
- Normalize whitespace when parsing template literals (already handled in `label-template.ts`)
