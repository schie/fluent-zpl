# @schie/fluent-zpl

[![npm version](https://badge.fury.io/js/@schie%2Ffluent-zpl.svg)](https://www.npmjs.com/package/@schie/fluent-zpl)
[![CI](https://github.com/schie/fluent-zpl/actions/workflows/ci.yml/badge.svg)](https://github.com/schie/fluent-zpl/actions/workflows/ci.yml)
[![Super-Linter](https://github.com/schie/fluent-zpl/actions/workflows/super-linter.yml/badge.svg)](https://github.com/schie/fluent-zpl/actions/workflows/super-linter.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-97.58%25-brightgreen)](https://github.com/schie/fluent-zpl)
[![code style: prettier][prettier-badge]][prettier]
[![Commitizen friendly][commitizen-badge]][commitizen]

A modern, type-safe TypeScript library for generating **ZPL (Zebra Programming Language)** commands using a fluent, immutable API. Perfect for creating shipping labels, product tags, inventory stickers, and any other Zebra printer output.

## ✨ Features

- 🔗 **Fluent API** - Chain methods for intuitive label building
- 🛡️ **Type Safe** - Full TypeScript support with comprehensive types
- 🔄 **Immutable** - All operations return new instances (safe chaining)
- 📏 **Unit Aware** - Support for dots, millimeters, and inches with DPI conversion
- ✅ **ZPL Compliant** - Generates valid ZPL according to specification
- 🧪 **Thoroughly Tested** - 166 tests with 97.58% coverage
- 📱 **Tree Shakeable** - Import only what you need
- 🖼️ **Image Support** - Convert RGBA images to ZPL bitmaps
- 📡 **RFID/EPC Support** - Encode and read RFID tags with EPC data
- 📦 **Zero Dependencies** - Lightweight and fast

## 🚀 Quick Start

### Installation

```bash
npm install @schie/fluent-zpl
```

### Basic Usage

```typescript
import { Label } from '@schie/fluent-zpl'

// Create a shipping label
const label = Label.create({ w: 400, h: 600, dpi: 203 })
  .text({
    at: { x: 50, y: 50 },
    text: 'PRIORITY MAIL',
    font: { family: 'B', h: 32, w: 32 }
  })
  .addressBlock({
    at: { x: 50, y: 120 },
    lines: ['John Doe', '123 Main Street', 'Anytown, NY 12345'],
    lineHeight: 25
  })
  .barcode({
    at: { x: 50, y: 300 },
    type: 'Code128',
    data: '1Z999AA1234567890',
    height: 100
  })

// Generate ZPL
const zpl = label.toZPL()
console.log(zpl)
// Output: ^XA^LL600^FO50,50^ABN32,32^FDPRIORITY MAIL^FS...^XZ
```

## 📖 Documentation

### Label Creation

```typescript
// Create with dots (default)
const label1 = Label.create({ w: 400, h: 600 })

// Create with millimeters
const label2 = Label.create({
  w: 100,
  h: 150,
  units: 'mm',
  dpi: 203
})

// Create with inches
const label3 = Label.create({
  w: 4,
  h: 6,
  units: 'in',
  dpi: 203,
  orientation: 'R' // Rotate 90°
})

// Parse existing ZPL
const existing = Label.parse('^XA^FO50,100^FDHello^FS^XZ')
```

### Text and Fonts

```typescript
label
  // Simple text
  .text({
    at: { x: 50, y: 100 },
    text: 'Hello World',
    font: { family: 'A', h: 28, w: 28 }
  })

  // Text with rotation
  .text({
    at: { x: 100, y: 200 },
    text: 'Rotated Text',
    rotate: 'R', // 90° clockwise
    font: { family: 'B', h: 20, w: 20 }
  })

  // Text with wrapping
  .text({
    at: { x: 50, y: 300 },
    text: 'This is a long text that will wrap to multiple lines',
    wrap: {
      width: 200,
      lines: 3,
      justify: 'C' // Center justified
    }
  })

  // Convenience method for simple text
  .caption({
    at: { x: 50, y: 400 },
    text: 'Simple Caption',
    size: 24
  })
```

### Barcodes

```typescript
label
  // Code 128 barcode
  .barcode({
    at: { x: 50, y: 100 },
    type: 'Code128',
    data: '1234567890',
    height: 80
  })

  // QR Code
  .qr({
    at: { x: 200, y: 100 },
    text: 'https://example.com',
    module: 4
  })

  // Other supported barcodes
  .barcode({ type: 'Code39', data: 'ABC123' })
  .barcode({ type: 'EAN13', data: '1234567890123' })
  .barcode({ type: 'DataMatrix', data: 'Data' })
```

### Graphics and Layout

```typescript
label
  // Boxes and borders
  .box({
    at: { x: 10, y: 10 },
    size: { w: 380, h: 580 },
    border: 2,
    fill: 'B' // Black fill
  })

  // Lines (thin boxes)
  .box({
    at: { x: 50, y: 200 },
    size: { w: 300, h: 1 }, // Horizontal line
    border: 1
  })

  // Multi-line address blocks
  .addressBlock({
    at: { x: 50, y: 250 },
    lines: ['Ship To:', 'Jane Smith', '456 Oak Avenue', 'Somewhere, CA 90210'],
    lineHeight: 25,
    size: 20
  })
```

### Images

```typescript
// Inline image (^GF command)
label.imageInline({
  at: { x: 50, y: 100 },
  rgba: imageData, // Uint8Array of RGBA pixels
  width: 100,
  height: 100,
  threshold: 128 // Monochrome conversion threshold
})

// Cached image (~DG + ^XG commands)
label.image({
  at: { x: 200, y: 100 },
  rgba: logoData,
  width: 50,
  height: 50,
  name: 'R:LOGO.GRF' // Printer storage name
})
```

### RFID and EPC

```typescript
// EPC encoding (convenience method)
label.epc({
  at: { x: 50, y: 100 },
  epc: '3014257BF7194E4000001A85', // 96-bit EPC in hex
  password: 'DEADBEEF' // Access password (optional)
})

// RFID field with specific memory bank
label.rfid({
  at: { x: 50, y: 100 },
  epc: '1234567890ABCDEF',
  bank: 'USER', // EPC, TID, or USER
  offset: 0,
  length: 8,
  password: '00000000'
})

// Read RFID tag data
label.rfidRead({
  at: { x: 50, y: 100 },
  bank: 'EPC',
  offset: 0,
  length: 12
})
```

### Unit Conversion

```typescript
import { mm, inch, toDots } from '@schie/fluent-zpl'

// Convert units to dots
const x = mm(25.4, 203) // 25.4mm at 203 DPI = 203 dots
const y = inch(1, 203) // 1 inch at 203 DPI = 203 dots

// Generic conversion
const pos = toDots(50, 203, 'mm') // 50mm to dots at 203 DPI
```

## 🏷️ Real-World Examples

### Shipping Label

```typescript
const shippingLabel = Label.create({ w: 4, h: 6, units: 'in', dpi: 203 })
  .text({
    at: { x: 0.5, y: 0.5 },
    text: 'FEDEX GROUND',
    font: { family: 'B', h: 28, w: 28 }
  })
  .box({
    at: { x: 0.25, y: 0.25 },
    size: { w: 3.5, h: 5.5 },
    border: 2
  })
  .addressBlock({
    at: { x: 0.5, y: 1.5 },
    lines: ['SHIP TO:', 'John Doe', '123 Main St', 'Anytown, NY 12345'],
    lineHeight: 25
  })
  .barcode({
    at: { x: 0.5, y: 3.5 },
    type: 'Code128',
    data: trackingNumber,
    height: 80
  })
```

### Product Label

```typescript
const productLabel = Label.create({ w: 100, h: 75, units: 'mm', dpi: 300 })
  .caption({
    at: { x: 5, y: 5 },
    text: productName,
    size: 16
  })
  .text({
    at: { x: 5, y: 25 },
    text: `SKU: ${sku}`,
    font: { family: 'A', h: 12, w: 12 }
  })
  .qr({
    at: { x: 60, y: 25 },
    text: productUrl,
    module: 2
  })
  .text({
    at: { x: 5, y: 60 },
    text: `$${price}`,
    font: { family: 'B', h: 20, w: 20 }
  })
```

### RFID Asset Tag

```typescript
const assetTag = Label.create({ w: 4, h: 2, units: 'in', dpi: 203 })
  .text({
    at: { x: 0.25, y: 0.25 },
    text: 'ASSET TAG',
    font: { family: 'B', h: 20, w: 20 }
  })
  .text({
    at: { x: 0.25, y: 0.75 },
    text: `ID: ${assetId}`,
    font: { family: 'A', h: 16, w: 16 }
  })
  .barcode({
    at: { x: 2.5, y: 0.5 },
    type: 'Code128',
    data: assetId,
    height: 60
  })
  .epc({
    at: { x: 0.25, y: 1.5 },
    epc: epcData, // 96-bit EPC hex string
    password: accessPassword
  })
  .text({
    at: { x: 0.25, y: 1.25 },
    text: 'RFID ENABLED',
    font: { family: 'A', h: 12, w: 12 }
  })
```

## 🧪 Testing and Validation

This library includes comprehensive ZPL validation to ensure all generated output works with Zebra printers:

```typescript
import { Label } from '@schie/fluent-zpl'

const label = Label.create({ w: 400, h: 600 }).text({ at: { x: 50, y: 100 }, text: 'Test' })

const zpl = label.toZPL()

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
  - `.box(opts)` - Add graphics box
  - `.caption(opts)` - Add simple text
  - `.qr(opts)` - Add QR code
  - `.addressBlock(opts)` - Add multi-line text
  - `.imageInline(opts)` - Add inline image
  - `.image(opts)` - Add cached image
  - `.rfid(opts)` - Add RFID field with EPC encoding
  - `.rfidRead(opts)` - Add RFID read command
  - `.epc(opts)` - Add EPC encoding (convenience method)
  - `.toZPL()` - Generate ZPL string

### Utilities

- **`toDots(value, dpi, units)`** - Convert to dots
- **`dot(n)`** - Pass-through for dots
- **`mm(n, dpi)`** - Convert mm to dots
- **`inch(n, dpi)`** - Convert inches to dots
- **`tokenizeZPL(zpl)`** - Parse ZPL to tokens
- **`emit(tokens)`** - Convert tokens to ZPL

## 📦 Package Information

- **ES Modules**: Full ESM support with tree shaking
- **CommonJS**: CJS builds included for compatibility
- **TypeScript**: Complete type definitions included
- **Node.js**: Requires Node.js 20+
- **Size**: ~15KB minified

## 🤝 Contributing

Contributions are welcome! This project uses:

- **TypeScript** for type safety
- **Jest** for testing (153 tests, 97.58% coverage)
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

Built with ❤️ for the Zebra printer community

[prettier-badge]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg
[prettier]: https://github.com/prettier/prettier
[commitizen-badge]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen]: http://commitizen.github.io/cz-cli/
