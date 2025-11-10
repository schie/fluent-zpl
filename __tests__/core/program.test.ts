// Tests for src/core/program.ts (ZPLProgram)

import { Label } from '../../src/core/label.js'
import { ZPLProgram } from '../../src/core/program.js'
import { MediaTracking, PrinterMode, RFIDBank } from '../../src/_types.js'

describe('ZPLProgram', () => {
  test('printerConfig builds typed setup block', () => {
    const program = ZPLProgram.create()
      .printerConfig({
        mode: PrinterMode.TearOff,
        mediaTracking: MediaTracking.NonContinuous,
        printWidth: 801,
        printSpeed: 4,
        darkness: 10,
        labelHome: { x: 0, y: 0 }
      })
      .raw('^JUS')

    expect(program.toZPL()).toBe('^MMT^MNY^PW801^PR4^MD10^LH0,0^JUS')
  })

  test('label() factory composes label formats', () => {
    const program = ZPLProgram.create().label(
      (label) => label.text({ at: { x: 40, y: 60 }, text: 'Program Label' }),
      { w: 400, h: 600 }
    )

    const zpl = program.toZPL()
    expect(zpl).toContain('^XA')
    expect(zpl).toContain('^FDProgram Label^FS')
    expect(zpl).toContain('^XZ')
  })

  test('label() accepts existing Label instances', () => {
    const baseLabel = Label.create({ w: 400, h: 600 }).text({
      at: { x: 10, y: 10 },
      text: 'Existing'
    })

    const zpl = ZPLProgram.create().label(baseLabel).toZPL()
    expect(zpl).toContain('^FDExisting^FS')
  })

  test('label() factory requires options', () => {
    expect(() =>
      ZPLProgram.create().label((label) => label.text({ at: { x: 0, y: 0 }, text: 'oops' }))
    ).toThrow('Label options are required')
  })

  test('rfidRead() can be emitted outside labels', () => {
    const zpl = ZPLProgram.create().rfidRead({ bank: RFIDBank.HostBuffer }).toZPL()
    expect(zpl).toBe('^RFR,H^FD^FS')
  })

  test('rfid() can be emitted outside labels', () => {
    const zpl = ZPLProgram.create().rfid({ epc: 'DEADBEEF' }).toZPL()
    expect(zpl).toBe('^RFW,H^FDDEADBEEF^FS')
  })

  test('comment() injects ^FX tokens in sequence', () => {
    const zpl = ZPLProgram.create().comment('Job note').toZPL()
    expect(zpl).toBe('^FX Job note')
  })

  test('printerConfig additionalCommands are trimmed and filtered', () => {
    const zpl = ZPLProgram.create()
      .printerConfig({ additionalCommands: ['^JUS', '   ', '  ^IDR:LOGO.GRF  '] })
      .toZPL()

    expect(zpl).toBe('^JUS^IDR:LOGO.GRF')
  })

  test('raw() ignores empty payloads without cloning', () => {
    const program = ZPLProgram.create()
    const result = program.raw('')
    expect(result).toBe(program)
    expect(result.toZPL()).toBe('')
  })

  test('printerConfig() without commands is a no-op', () => {
    const program = ZPLProgram.create()
    const result = program.printerConfig({})
    expect(result).toBe(program)
    expect(result.toZPL()).toBe('')
  })

  test('internal append() short-circuits on empty arrays', () => {
    const program = ZPLProgram.create()
    const result = (program as any).append([])
    expect(result).toBe(program)
  })
})
