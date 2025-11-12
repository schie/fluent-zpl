# Copilot Instructions for @schie/fluent-zpl

This repository houses a TypeScript library for generating Zebra Programming Language (ZPL) output via a fluent, immutable API. The ecosystem now covers label design, printer configuration, RFID, and image tooling.

## Project Status (November 2025)

**Latest highlights**

- ✅ `ZPLProgram` orchestrates printer/media setup, diagnostics, and multiple labels in one payload
- ✅ Tagged template helper `label` (invoked as ``label\`...\````, formerly `zpl`) parses existing formats directly into `Label`
- ✅ Shared RFID helpers cover EPC/USER/TID plus HostBuffer reads with validation guards
- ✅ Jest suite: 11 suites / 246 tests / 17 snapshots — 100% statements, branches, functions, lines
- ✅ Documentation updated for program-level workflows and new templating API

**Testing / coverage**

- Run `npm test -- --watchman=false`
- Node 20+, ESM modules (`ts-jest` with `NODE_OPTIONS='--experimental-vm-modules'`)
- Coverage must remain at 100% across `src/**`

## Project Structure

```text
src/
├── index.ts            # Public API surface
├── _types.ts           # Shared enums/types
├── _unit-helpers.ts    # dot/mm/in conversion helpers
├── core/
│   ├── label.ts        # Fluent Label builder
│   ├── program.ts      # ZPLProgram (job orchestration)
│   ├── parse.ts        # Tokenizer
│   └── emit.ts         # Serializer
├── label-template.ts   # `label\`...\`` tagged template helper
└── image/
    ├── api.ts          # Inline/cached image plumbing
    ├── encoder.ts      # RGBA → monochrome conversion
    └── registry.ts     # Asset dedupe utilities
```

## Key Design Principles

1. **Immutable fluent chain** – Every method returns a new `Label`/`ZPLProgram` instance. No mutation allowed.
2. **Unit/DPI awareness** – Accept mm/in/dot inputs, convert via `toDots` and friends.
3. **ZPL correctness first** – Always emit complete parameters, escape `^` inside `^FD`, maintain ^XA/^XZ framing.
4. **Shared token pipeline** – Parse → manipulate → emit without lossy transforms.

## Core APIs

### Label (`src/core/label.ts`)

- Factories: `Label.create`, `Label.parse`
- Fields: `text`, `barcode`, `box`, `caption`, `qr`, `addressBlock`
- Media: `imageInline` (^GF), `image` (~DG/^XG)
- RFID: `rfid`, `rfidRead`, `epc`
- Utilities: `comment`, `withMetadata`, `setDefaultFont`, `setBarcodeDefaults`, `toZPL`

### ZPLProgram (`src/core/program.ts`)

- `ZPLProgram.create({ dpi?, units? })`
- `.printerConfig(opts)` → emits ^MM/^MN/^PW/^PR/^MD/^LH (unit-aware)
- `.label(label | factory, options?)` → appends ^XA…^XZ blocks
- `.rfid(opts)` / `.rfidRead(opts)` → job-level RFID commands (HostBuffer read supported)
- `.raw(zpl)` / `.comment(text)` → arbitrary commands and metadata
- `.toZPL()` → concatenated payload

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
  - `main.test.ts` – Label + ZPLProgram
  - `unit-helpers.test.ts`
  - `parser-emitter.test.ts`
  - `image-encoder.test.ts`
  - `image-registry.test.ts`
  - `rfid.test.ts`
  - `zpl-validation.test.ts`
  - `label-template.test.ts`
  - `real-world-examples.test.ts`
  - `clamp255-edge-case.test.ts`
  - `snapshots.test.ts`
- Every new feature needs targeted tests plus coverage enforcement

## Contribution Guardrails

- TypeScript strict mode everywhere; no `any`
- Keep APIs immutable and side-effect free
- Update `_types.ts` for public options/enums
- Document new functionality (README + docs) and refresh Copilot/agent notes when behavior shifts
- Coordinate with automation/AI agents defined in `AGENTS.md`

## ZPL Tips

- Always wrap content with `^XA`/`^XZ`
- Escape literal `^` as `^^` within `^FD`
- Provide full parameter lists (e.g., `^A` height/width)
- Normalize whitespace when parsing template literals (already handled in `label-template.ts`)
