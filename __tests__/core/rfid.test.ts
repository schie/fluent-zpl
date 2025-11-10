// Tests for src/core/rfid.ts helpers

import { emit } from '../../src/core/emit.js'
import { buildRFIDReadTokens, buildRFIDWriteTokens } from '../../src/core/rfid.js'
import { RFIDBank } from '../../src/_types.js'

describe('buildRFIDWriteTokens()', () => {
  test('builds EPC bank write by default', () => {
    const tokens = buildRFIDWriteTokens({ epc: '3014257BF7194E4000001A85' })
    expect(emit(tokens)).toBe('^RFW,H^FD3014257BF7194E4000001A85^FS')
  })

  test('builds USER bank write with offsets', () => {
    const tokens = buildRFIDWriteTokens({
      epc: 'USERDATA123456',
      bank: RFIDBank.USER,
      offset: 4,
      length: 7
    })
    expect(emit(tokens)).toBe('^RFW,U,4,7^FDUSERDATA123456^FS')
  })

  test('infers length from EPC payload when not provided', () => {
    const tokens = buildRFIDWriteTokens({ epc: 'ABCD', bank: RFIDBank.USER })
    // length inferred from epc length / 2 = 2
    expect(emit(tokens)).toBe('^RFW,U,0,2^FDABCD^FS')
  })

  test('throws when attempting HostBuffer write', () => {
    expect(() =>
      buildRFIDWriteTokens({ epc: 'AA', bank: RFIDBank.HostBuffer })
    ).toThrow('HostBuffer is read-only')
  })
})

describe('buildRFIDReadTokens()', () => {
  test('builds EPC read with defaults', () => {
    const tokens = buildRFIDReadTokens()
    expect(emit(tokens)).toBe('^RFR,E,0,8^FD^FS')
  })

  test('builds USER read with custom offsets', () => {
    const tokens = buildRFIDReadTokens({
      bank: RFIDBank.USER,
      offset: 4,
      length: 12
    })
    expect(emit(tokens)).toBe('^RFR,U,4,12^FD^FS')
  })

  test('builds TID read with defaults when length omitted', () => {
    const tokens = buildRFIDReadTokens({
      bank: RFIDBank.TID,
      offset: 2
    })
    expect(emit(tokens)).toBe('^RFR,T,2,8^FD^FS')
  })

  test('returns host buffer read tokens', () => {
    const tokens = buildRFIDReadTokens({ bank: RFIDBank.HostBuffer })
    expect(emit(tokens)).toBe('^RFR,H^FD^FS')
  })

  test('throws on unsupported bank codes', () => {
    expect(() =>
      buildRFIDReadTokens({
        bank: 'INVALID' as RFIDBank
      })
    ).toThrow('Unsupported RFID bank')
  })
})
