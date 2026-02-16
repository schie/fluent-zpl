# @schie/fluent-zpl

[![npm version](https://badge.fury.io/js/@schie%2Ffluent-zpl.svg)](https://www.npmjs.com/package/@schie/fluent-zpl)
[![CI](https://github.com/schie/fluent-zpl/actions/workflows/ci.yml/badge.svg)](https://github.com/schie/fluent-zpl/actions/workflows/ci.yml)
[![CodeQL](https://github.com/schie/fluent-zpl/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/schie/fluent-zpl/actions/workflows/github-code-scanning/codeql)
[![Super-Linter](https://github.com/schie/fluent-zpl/actions/workflows/super-linter.yml/badge.svg)](https://github.com/schie/fluent-zpl/actions/workflows/super-linter.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![codecov](https://codecov.io/gh/schie/fluent-zpl/branch/main/graph/badge.svg)](https://codecov.io/gh/schie/fluent-zpl)
[![code style: prettier][prettier-badge]][prettier]
[![Commitizen friendly][commitizen-badge]][commitizen]

A modern, type-safe TypeScript library for generating **ZPL (Zebra Programming Language)** commands using a fluent, immutable API. Perfect for creating shipping labels, product tags, inventory stickers, and any other Zebra printer output.

> **⚠️ Early Development Notice**  
> This library is under active early development. Until v1.0.0 is released, consider all releases potentially breaking. The API may change significantly between versions as we refine the design based on user feedback and real-world usage patterns.

## ✨ Features

- 🔗 **Fluent API** - Chain methods for intuitive label building
- 🛡️ **Type Safe** - Full TypeScript support with comprehensive types
- 🔄 **Immutable** - All operations return new instances (safe chaining)
- 📏 **Unit Aware** - Support for dots, millimeters, and inches with DPI conversion
- ✅ **ZPL Compliant** - Generates valid ZPL according to specification
- ⚙️ **Global Settings** - Support for `^CF`, `^BY`, `^FR` commands and ZPL comments
- 🧪 **Thoroughly Tested** - Comprehensive test suite with high coverage
- 🖍️ **Shapes & Lines** - Circles, ellipses, and diagonals for richer layouts
- 🌐 **UTF-8 Ready** - `^CI28` plus inline hex escapes for international text
- 📱 **Tree Shakeable** - Import only what you need
- 🖼️ **Image Support** - Convert RGBA images to ZPL bitmaps
- 📡 **RFID/EPC Support** - Encode and read RFID tags with EPC data
- 🏗️ **Program Builder** - Compose printer setup, diagnostics, labels, and RFID commands into one payload
- ✂️ **Tear-Off Calibration** - Adjust `~TA` with unit conversion and clamping
- 📦 **Zero Dependencies** - Lightweight and fast

## 🚀 Quick Start

### Installation

```bash
npm install @schie/fluent-zpl
```

### Basic Usage

```typescript
import { Label, FontFamily, Barcode, Units, Orientation, Justify, Fill } from '@schie/fluent-zpl';

// Create a shipping label
const label = Label.create({ w: 400, h: 600, dpi: 203 })
  .text({
    at: { x: 50, y: 50 },
    text: 'PRIORITY MAIL',
    font: { family: FontFamily.B, h: 32, w: 32 },
  })
  .addressBlock({
    at: { x: 50, y: 120 },
    lines: ['John Doe', '123 Main Street', 'Anytown, NY 12345'],
    lineHeight: 25,
  })
  .barcode({
    at: { x: 50, y: 300 },
    type: Barcode.Code128,
    data: '1Z999AA1234567890',
    height: 100,
  });

// Generate ZPL
const zpl = label.toZPL();
console.log(zpl);
// Output: ^XA^LL600^FO50,50^ABN32,32^FDPRIORITY MAIL^FS...^XZ
```

### Printer / Job Orchestration

Use `ZPLProgram` when you need more than a single label format. It lets you compose printer/media configuration, label formats, downloads, diagnostics, and RFID commands into one immutable payload.

```typescript
import {
  ZPLProgram,
  PrinterMode,
  MediaTracking,
  Mirror,
  Orientation,
  PrinterConfig,
  PrinterConfiguration,
  Label,
  FontFamily,
  Barcode,
  RFIDBank,
} from '@schie/fluent-zpl';

const program = ZPLProgram.create()
  .printerConfig({
    mode: PrinterMode.TearOff,
    mediaTracking: MediaTracking.NonContinuous,
    mirror: Mirror.On,
    orientation: Orientation.Inverted180,
    printWidth: 801,
    printSpeed: 4,
    darkness: 10,
    tearOff: -12,
    labelHome: { x: 0, y: 0 },
    configuration: PrinterConfiguration.Save,
  })
  .label(
    (label) =>
      label
        .text({
          at: { x: 40, y: 60 },
          text: 'Config + Label + RFID',
          font: { family: FontFamily.B, h: 32, w: 32 },
        })
        .barcode({
          at: { x: 40, y: 140 },
          type: Barcode.Code128,
          data: '1234567890',
          height: 100,
        })
        .rfid({ epc: '300833B2DDD9014000000000' }),
    { w: 400, h: 600 },
  )
  .rfidRead({ bank: RFIDBank.HostBuffer }); // emits ^RFR,H (read last write)

// Mix in downloads, diagnostics, or templates with .raw()
const payload = program
  .raw('^XA^HH^XZ') // printer status block
  .comment('End of job')
  .toZPL();

console.log(payload);
```

Use `tearOff` when you need to fine-tune the liner break point: pass dots, millimeters, or inches and the builder will convert to dots using the current DPI/units context, rounding and clamping to ±120 before emitting `~TA`.

Or use the fluent printer config builder when you want to compose setup steps:

```typescript
const config = PrinterConfig.create()
  .mode(PrinterMode.TearOff)
  .mediaTracking(MediaTracking.NonContinuous)
  .mirror(Mirror.On)
  .orientation(Orientation.Inverted180)
  .printWidth(inch(3, 300))
  .printSpeed(4)
  .darkness(10)
  .tearOff(25)
  .labelHome({ x: 0, y: 0 })
  .save(); // ^JUS

const zpl = ZPLProgram.create().printerConfig(config.build()).toZPL();
// => ^XA^MMT^MNY^PW900^PR4,6,2^MD10~TA25^LH0,0^JUS^XZ
// Or send config.toZPL() directly if you only need the setup block (it wraps ^XA/^XZ for you)
```

When you set any ^PR speed, missing components default to print 2, slew 6, and backfeed 2 per ZPL.

`ZPLProgram` keeps track of the same DPI/unit context as your labels, so printer/media measurements (`^PW`, `^LH`, `~TA`, etc.) stay consistent. Pass `{ dpi, units }` to `ZPLProgram.create` when you need to match a different printer resolution—every downstream helper (including `.label(...)`) inherits those settings. A single program can now cover:

- Label formats and layout (`.label(...)`)
- Printer/media configuration (`.printerConfig(...)`)
- Control, status, or diagnostics commands (`.raw(...)`, `.comment(...)`)
- Variable/templated data via regular JavaScript functions (pass a factory into `.label`)
- Graphics/downloads (`.raw('~DG...')`, `.imageInline(...)` inside labels)
- Advanced RFID/EPC flows (`.rfid(...)`, `.rfidRead(...)`, including HostBuffer reads)

## 📖 Documentation

### Label Creation

```typescript
// Create with dots (default)
const label1 = Label.create({ w: 400, h: 600 });

// Create with millimeters
const label2 = Label.create({
  w: 100,
  h: 150,
  units: Units.Millimeter,
  dpi: 203,
});

// Create with inches
const label3 = Label.create({
  w: 4,
  h: 6,
  units: Units.Inch,
  dpi: 203,
  orientation: Orientation.Rotated90, // Rotate 90°
});

// Parse existing ZPL
const existing = Label.parse('^XA^FO50,100^FDHello^FS^XZ');
```

### Text and Fonts

```typescript
label
  // Simple text
  .text({
    at: { x: 50, y: 100 },
    text: 'Hello World',
    font: { family: FontFamily.A, h: 28, w: 28 },
  })

  // Text with rotation
  .text({
    at: { x: 100, y: 200 },
    text: 'Rotated Text',
    rotate: Orientation.Rotated90, // 90° clockwise
    font: { family: FontFamily.B, h: 20, w: 20 },
  })

  // Text with wrapping
  .text({
    at: { x: 50, y: 300 },
    text: 'This is a long text that will wrap to multiple lines',
    wrap: {
      width: 200,
      lines: 3,
      justify: Justify.Center, // Center justified
      spacing: 2, // Add 2 dots between lines
      hangingIndent: 10, // Indent 2nd+ lines by 10 dots
    },
  })

  // Convenience method for simple text
  .caption({
    at: { x: 50, y: 400 },
    text: 'Simple Caption',
    size: 24,
  })

  // Text with ^FH to embed hex escapes (e.g., line breaks or delimiters)
  .text({
    at: { x: 50, y: 480 },
    text: 'Line1_0A0DLine2',
    hexIndicator: '_', // Emits ^FH_ before the ^FD block
  });
```

**Hex escapes (^FH)** – add `hexIndicator` to emit `^FH` before a text or barcode field when you need inline hex codes (e.g., line breaks or reserved characters). Any printable ASCII except lowercase a–z and `^`, `~`, `,` is allowed; an empty string uses the default caret indicator. Example with CRLF and literal `>`/`^`:

```typescript
.text({
  at: { x: 40, y: 120 },
  text: 'Line1_0D_0ALine2 _3E _5E caret',
  hexIndicator: '_',
})
// => ^FH_^FDLine1_0D_0ALine2 _3E _5E caret^FS
```
Note: some renderers (e.g., zpl-renderer-js) may not process ^FH escapes even though printers do.

Set `hexIndicator` to emit `^FH` for fields that need inline hex escapes; it works for both text and barcodes.

**UTF-8 and special characters** – switch to the UTF-8 code page with `^CI28` to render accented text, then use `hexIndicator` when you need inline control codes (line breaks, reserved characters):

```typescript
Label.create({ w: 400, h: 250 })
  .setCharacterSet({ charset: 28 })
  .text({
    at: { x: 40, y: 40 },
    text: 'Café crème · São Paulo',
    font: { family: FontFamily.B, h: 28, w: 26 },
  })
  .text({
    at: { x: 40, y: 90 },
    text: 'Line1_0D_0ALine2 _3E _5E caret',
    hexIndicator: '_',
    wrap: { width: 320, lines: 2, spacing: 2 },
  });
```

### Barcodes

```typescript
label
  // Code 128 barcode
  .barcode({
    at: { x: 50, y: 100 },
    type: Barcode.Code128,
    data: '1234567890',
    height: 80,
  })

  // Centered barcode helper (uses explicit width, or auto-estimates when omitted)
  .barcodeCentered({
    y: 220,
    // width: 180,
    type: Barcode.Code128,
    data: 'CENTERED-123',
  })

  // QR Code
  .qr({
    at: { x: 200, y: 100 },
    text: 'https://example.com',
    module: 4,
  })

  // Other supported barcodes
  .barcode({ at: { x: 50, y: 200 }, type: Barcode.Code39, data: 'ABC123' })
  .barcode({ at: { x: 50, y: 250 }, type: Barcode.EAN13, data: '1234567890123' })
  .barcode({ at: { x: 50, y: 300 }, type: Barcode.DataMatrix, data: 'Data' });

// GS1-128 helper converts AI maps into the right ^BC payload (FNC1 + GS handling)
label.gs1_128({
  at: { x: 50, y: 360 },
  ai: {
    '01': '09506000134352', // GTIN (fixed-length)
    '10': 'BATCH-42', // Lot/batch (variable-length)
    '17': '250101', // Expiration date (YYMMDD)
  },
  height: 120,
});
```

### Graphics and Layout

```typescript
label
  // Boxes and borders
  .box({
    at: { x: 10, y: 10 },
    size: { w: 380, h: 580 },
    border: 2,
    fill: Fill.Black, // Black fill
  })

  // Lines (thin boxes)
  .box({
    at: { x: 50, y: 200 },
    size: { w: 300, h: 1 }, // Horizontal line
    border: 1,
  })

  // Circles, ellipses, and diagonals
  .circle({
    at: { x: 40, y: 240 },
    diameter: 120,
    thickness: 4,
    fill: Fill.Black,
  })
  .ellipse({
    at: { x: 200, y: 240 },
    size: { w: 140, h: 80 },
    thickness: 3,
    fill: Fill.Black,
  })
  .diagonalLine({
    at: { x: 50, y: 360 },
    size: { w: 260, h: 90 },
    thickness: 4,
    fill: Fill.Black,
  })

  // Multi-line address blocks
  .addressBlock({
    at: { x: 50, y: 250 },
    lines: ['Ship To:', 'Jane Smith', '456 Oak Avenue', 'Somewhere, CA 90210'],
    lineHeight: 25,
    size: 20,
  });
```

### Images

```typescript
import { DitherMode, type ImageInlineOpts, type ImageCachedOpts } from '@schie/fluent-zpl';

// Inline image (^GF command)
const inlineLogo: ImageInlineOpts = {
  at: { x: 50, y: 100 },
  rgba: imageData, // Uint8Array of RGBA pixels
  width: 100,
  height: 100,
  mode: DitherMode.FloydSteinberg,
  threshold: 180, // Optional threshold overrides
  invert: false, // Flip black/white if needed
};

label.imageInline(inlineLogo);

// Cached image (~DG + ^XG commands) inherits all ImageInlineOpts fields
const cachedStamp: ImageCachedOpts = {
  ...inlineLogo,
  at: { x: 200, y: 100 },
  mode: DitherMode.Ordered,
  name: 'R:LOGO.GRF', // Printer storage name
};

label.image(cachedStamp);
```

Both helpers accept RGBA input and offer multiple dithering strategies via the `DitherMode` enum (`Threshold`, `FloydSteinberg`, `Ordered`, or `None`) plus optional `threshold` and `invert` controls so you can tune contrast for the target media. Because `ImageCachedOpts` extends `ImageInlineOpts`, every inline option (including `mode`) carries over to cached assets automatically.

### RFID and EPC

```typescript
// EPC encoding (convenience method)
label.epc({
  epc: '3014257BF7194E4000001A85', // 96-bit EPC in hex
  password: 'DEADBEEF', // Access password (optional)
});

// RFID field with specific memory bank
label.rfid({
  epc: '1234567890ABCDEF',
  bank: RFIDBank.USER,
  offset: 0,
  length: 8,
  password: '00000000',
});

// Read RFID tag data
label.rfidRead({
  bank: RFIDBank.EPC,
  offset: 0,
  length: 12,
});

// Read the volatile HostBuffer (^RFR,H) after a write
label.rfidRead({
  bank: RFIDBank.HostBuffer,
});
```

`RFIDBank.HostBuffer` maps directly to `^RFR,H`, which instructs the printer to return the contents of the last write buffer—perfect for verifying recently encoded tags before moving on.

### Comments and Metadata

```typescript
// Add comments for debugging (generates ^FX commands)
label
  .comment('This is a shipping label for Order #12345')
  .text({ at: { x: 50, y: 100 }, text: 'Hello World' })
  .comment('End of content');

// Add structured metadata
label.withMetadata({
  generator: '@schie/fluent-zpl',
  version: '1.0.0',
  orderNumber: 'ORD-12345',
  customer: 'ACME Corp',
});

// Metadata is embedded as ZPL comments (^FX) for debugging
```

### Global Settings

Control global ZPL settings that affect subsequent commands:

```typescript
label
  // Character set (^CI) - UTF-8 is recommended
  .setCharacterSet({ charset: 28 })

  // Set global default font (^CF command)
  .setDefaultFont({
    family: FontFamily.F,
    height: 60,
    width: 60,
  })
  .text({ at: { x: 50, y: 50 }, text: 'Uses global font' })

  // Set global barcode defaults (^BY command)
  .setBarcodeDefaults({
    moduleWidth: 5,
    wideToNarrowRatio: 2,
    height: 270,
  })
  .barcode({
    at: { x: 50, y: 150 },
    type: Barcode.Code128,
    data: '12345678', // Uses global height setting
  })

  // Field reverse effect (^FR command)
  .box({
    at: { x: 100, y: 200 },
    size: { w: 200, h: 100 },
    reverse: true, // Reverses colors within field
  });
```

Custom mappings for Code Page 850 variants can be supplied as pairs of integers (`customMappings`) when using charset values 0-13:

```typescript
label.setCharacterSet({
  charset: 0,
  customMappings: [34, 67, 89, 61, 129, 232],
});
```

These global settings generate the exact ZPL commands (`^CI`, `^CF`, `^BY`, `^FR`) found in complex label specifications, enabling precise control over printer behavior and optimized ZPL output.

### Label Tagged Template

Parse existing ZPL strings directly into Label instances using the `label` tagged template:

```typescript
import { label } from '@schie/fluent-zpl';

// Parse ZPL with template interpolation
const trackingNumber = '1Z999AA1234567890';
const customerName = 'John Doe';

const parsedLabel = label`
  ^XA
  ^FX Shipping label from existing ZPL
  ^CF0,60
  ^FO50,50^FDShipping Label^FS
  ^FO50,100^FD${customerName}^FS
  ^BY5,2,270
  ^FO50,200^BC^FD${trackingNumber}^FS
  ^XZ
`;

// Continue with fluent API
parsedLabel
  .comment('Added via fluent API')
  .text({ at: { x: 50, y: 350 }, text: 'Processed by fluent-zpl' })
  .toZPL();
```

Alternative syntax with explicit options:

```typescript
const parsedLabel = label.withOptions({ dpi: 300, units: Units.Millimeter })`
  ^XA
  ^FO10,10^A0N,28,28^FDHigh Resolution^FS
  ^XZ
`;
```

### Unit Conversion

```typescript
import { dot, mm, inch, toDots } from '@schie/fluent-zpl';

// Convert units to dots
const x = mm(25.4, 203); // 25.4mm at 203 DPI = 203 dots
const y = inch(1, 203); // 1 inch at 203 DPI = 203 dots
const spacing = dot(40); // Explicit dots helper for readability

// Generic conversion
const pos = toDots(50, 203, Units.Millimeter); // 50mm to dots at 203 DPI
```

## 🏷️ Real-World Examples

### Shipping Label

```typescript
const shippingLabel = Label.create({ w: 4, h: 6, units: Units.Inch, dpi: 203 })
  .text({
    at: { x: 0.5, y: 0.5 },
    text: 'FEDEX GROUND',
    font: { family: FontFamily.B, h: 28, w: 28 },
  })
  .box({
    at: { x: 0.25, y: 0.25 },
    size: { w: 3.5, h: 5.5 },
    border: 2,
  })
  .addressBlock({
    at: { x: 0.5, y: 1.5 },
    lines: ['SHIP TO:', 'John Doe', '123 Main St', 'Anytown, NY 12345'],
    lineHeight: 25,
  })
  .barcode({
    at: { x: 0.5, y: 3.5 },
    type: Barcode.Code128,
    data: trackingNumber,
    height: 80,
  });
```

### Product Label

```typescript
const productLabel = Label.create({ w: 100, h: 75, units: Units.Millimeter, dpi: 300 })
  .caption({
    at: { x: 5, y: 5 },
    text: productName,
    size: 16,
  })
  .text({
    at: { x: 5, y: 25 },
    text: `SKU: ${sku}`,
    font: { family: FontFamily.A, h: 12, w: 12 },
  })
  .qr({
    at: { x: 60, y: 25 },
    text: productUrl,
    module: 2,
  })
  .text({
    at: { x: 5, y: 60 },
    text: `$${price}`,
    font: { family: FontFamily.B, h: 20, w: 20 },
  });
```

### RFID Asset Tag

```typescript
const assetTag = Label.create({ w: 4, h: 2, units: Units.Inch, dpi: 203 })
  .text({
    at: { x: 0.25, y: 0.25 },
    text: 'ASSET TAG',
    font: { family: FontFamily.B, h: 20, w: 20 },
  })
  .text({
    at: { x: 0.25, y: 0.75 },
    text: `ID: ${assetId}`,
    font: { family: FontFamily.A, h: 16, w: 16 },
  })
  .barcode({
    at: { x: 2.5, y: 0.5 },
    type: Barcode.Code128,
    data: assetId,
    height: 60,
  })
  .epc({
    epc: epcData, // 96-bit EPC hex string
    password: accessPassword,
  })
  .text({
    at: { x: 0.25, y: 1.25 },
    text: 'RFID ENABLED',
    font: { family: FontFamily.A, h: 12, w: 12 },
  });
```

### Complex Shipping Label with Global Settings

```typescript
const complexLabel = Label.create({ w: 800, h: 1200, units: Units.Dot, dpi: 203 })
  .comment('Top section with logo and company info')
  .setDefaultFont({ family: FontFamily.F, height: 60 })

  // Logo with field reverse effect
  .box({ at: { x: 50, y: 50 }, size: { w: 100, h: 100 }, border: 100 })
  .box({ at: { x: 75, y: 75 }, size: { w: 100, h: 100 }, border: 100, reverse: true })
  .box({ at: { x: 93, y: 93 }, size: { w: 40, h: 40 }, border: 40 })

  // Company name uses global font setting
  .text({ at: { x: 220, y: 50 }, text: 'Intershipping, Inc.' })

  .comment('Recipient address section')
  .setDefaultFont({ family: FontFamily.A, height: 30 })
  .text({ at: { x: 50, y: 300 }, text: 'John Doe' })
  .text({ at: { x: 50, y: 340 }, text: '100 Main Street' })
  .text({ at: { x: 50, y: 380 }, text: 'Springfield TN 39021' })

  .comment('Barcode with global settings')
  .setBarcodeDefaults({ moduleWidth: 5, wideToNarrowRatio: 2, height: 270 })
  .barcode({
    at: { x: 100, y: 550 },
    type: Barcode.Code128,
    data: '12345678',
    // Height comes from global ^BY setting
  })

  .setDefaultFont({ family: FontFamily.F, height: 190 })
  .text({ at: { x: 470, y: 955 }, text: 'CA' });
```

### Complex Shipping Label with Global Settings (string literal helpers)

```typescript
const complexLabel = Label.create({ w: 800, h: 1200, units: 'dot', dpi: 203 })
  .comment('Top section with logo and company info')
  .setDefaultFont({ family: 'F', height: 60 })

  // Logo with field reverse effect
  .box({ at: { x: 50, y: 50 }, size: { w: 100, h: 100 }, border: 100 })
  .box({ at: { x: 75, y: 75 }, size: { w: 100, h: 100 }, border: 100, reverse: true })
  .box({ at: { x: 93, y: 93 }, size: { w: 40, h: 40 }, border: 40 })

  // Company name uses global font setting
  .text({ at: { x: 220, y: 50 }, text: 'Intershipping, Inc.' })

  .comment('Recipient address section')
  .setDefaultFont({ family: 'A', height: 30 })
  .text({ at: { x: 50, y: 300 }, text: 'John Doe' })
  .text({ at: { x: 50, y: 340 }, text: '100 Main Street' })
  .text({ at: { x: 50, y: 380 }, text: 'Springfield TN 39021' })

  .comment('Barcode with global settings')
  .setBarcodeDefaults({ moduleWidth: 5, wideToNarrowRatio: 2, height: 270 })
  .barcode({
    at: { x: 100, y: 550 },
    type: 'Code128',
    data: '12345678',
    // Height comes from global ^BY setting
  })

  .setDefaultFont({ family: 'F', height: 190 })
  .text({ at: { x: 470, y: 955 }, text: 'CA' });
```

## 🧪 Testing and Validation

This library includes comprehensive ZPL validation to ensure all generated output works with Zebra printers:

```typescript
import { Label } from '@schie/fluent-zpl';

const label = Label.create({ w: 400, h: 600 }).text({ at: { x: 50, y: 100 }, text: 'Test' });

const zpl = label.toZPL();

// All output is validated to ensure:
// ✅ Proper ^XA...^XZ structure
// ✅ Valid command formatting
// ✅ Required parameters included
// ✅ Special characters escaped
// ✅ Field blocks properly terminated
```

## 📏 Supported Units and DPI

| Unit  | Description            | Conversion            |
| ----- | ---------------------- | --------------------- |
| `dot` | Printer dots (default) | 1:1                   |
| `mm`  | Millimeters            | 25.4mm = 1 inch       |
| `in`  | Inches                 | Direct DPI conversion |

| DPI | Description          | Common Use          |
| --- | -------------------- | ------------------- |
| 203 | Standard resolution  | Most labels         |
| 300 | High resolution      | Small text/barcodes |
| 600 | Very high resolution | Detailed graphics   |

## 🔧 API Reference

### Core Classes

- **`Label`** - Main fluent interface
  - `Label.create(options)` - Create new label
  - `Label.parse(zpl)` - Parse existing ZPL
  - `.text(opts)` - Add text field
  - `.barcode(opts)` - Add barcode
  - `.barcodeCentered(opts)` - Center barcode horizontally using ^PW
  - `.box(opts)` - Add graphics box (supports `reverse: true` for ^FR)
  - `.circle(opts)` - Add graphic circle (^GC)
  - `.ellipse(opts)` - Add graphic ellipse (^GE)
  - `.diagonalLine(opts)` - Add diagonal line (^GD)
  - `.caption(opts)` - Add simple text
  - `.qr(opts)` - Add QR code
  - `.gs1_128(opts)` - Emit GS1-128 via Code 128 with automatic FNC1 handling
  - `.addressBlock(opts)` - Add multi-line text
  - `.imageInline(opts)` - Add inline image
  - `.image(opts)` - Add cached image
  - `.rfid(opts)` - Add RFID field with EPC encoding
  - `.rfidRead(opts)` - Add RFID read command
  - `.epc(opts)` - Add EPC encoding (convenience method)
  - `.comment(text)` - Add ZPL comment (^FX)
  - `.withMetadata(meta)` - Add structured metadata as comments
  - `.setCharacterSet(opts)` - Set the active character set (^CI)
  - `.setDefaultFont(opts)` - Set global default font (^CF)
  - `.setBarcodeDefaults(opts)` - Set global barcode settings (^BY)
  - `.toZPL()` - Generate ZPL string

- **`ZPLProgram`** - Compose printer setup + formats
  - `ZPLProgram.create(opts)` - Start a new program (sets DPI/units context)
  - `.raw(zpl)` - Append arbitrary commands (diagnostics, downloads, etc.)
  - `.comment(text)` - Insert ^FX comments between sections
  - `.printerConfig(opts)` - Emit typed ^MM/^MN/^PW/^PR/^MD/~TA/^JU/^LH blocks
  - `.label(labelOrFactory, options?)` - Append a fluent `Label` (^XA…^XZ)
  - `.rfid(opts)` / `.rfidRead(opts)` - Emit RFID commands outside labels
  - `.toZPL()` - Serialize the final job payload

- **`label` (tagged template)** - Parse ZPL strings with interpolation
  - `label\`...\`` - Parse ZPL template literal
  - `label.withOptions(opts)\`...\`` - Parse with explicit DPI/units

### Utilities

- **`toDots(value, dpi, units)`** - Convert to dots
- **`dot(n)`** - Pass-through for dots
- **`mm(n, dpi)`** - Convert mm to dots
- **`inch(n, dpi)`** - Convert inches to dots

## 📦 Package Information

- **ES Modules**: Full ESM support with tree shaking
- **CommonJS**: CJS builds included for compatibility
- **TypeScript**: Complete type definitions included
- **Node.js**: Requires Node.js 20+
- **Size**: ~15KB minified

## 🌐 Docs & Examples

- **Live site**: https://schie.github.io/fluent-zpl/ (API docs) and https://schie.github.io/fluent-zpl/examples/ (interactive labels)
- **Cross-links**: Typedoc navigation includes an Examples link; the playground header links back to the docs
- **Local build**: `npm ci --prefix examples` once, then `npm run docs:pages` to emit Typedoc HTML plus the Vite app to `docs/examples/` for GitHub Pages
- **New demos**: Shapes (`^GC`, `^GE`, `^GD`), UTF-8 (`^CI28`), and `^FH` hex-escape handling are available in the examples app

## 🤝 Contributing

Contributions are welcome! This project uses:

- **TypeScript** for type safety
- **Jest** for testing
- **ESLint + Prettier** for code quality
- **Commitizen** for conventional commits

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Build
npm run build

# Lint
npm run lint
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@schie/fluent-zpl)
- [GitHub Repository](https://github.com/schie/fluent-zpl)
- [ZPL Programming Guide](https://www.zebra.com/content/dam/zebra/manuals/printers/common/programming/zpl-zbi2-pm-en.pdf)

---

Made with ❤️ by [@schie](https://github.com/schie)

[prettier-badge]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg
[prettier]: https://github.com/prettier/prettier
[commitizen-badge]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen]: http://commitizen.github.io/cz-cli/
