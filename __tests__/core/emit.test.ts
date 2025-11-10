// Tests for src/core/emit.ts

import { emit } from '../../src/core/emit.js'
import { tokenizeZPL } from '../../src/core/parse.js'
import type { Token } from '../../src/_types.js'

describe('emit()', () => {
  test('should emit empty array as empty string', () => {
    expect(emit([])).toBe('')
  })

  test('should emit single command', () => {
    const tokens: Token[] = [{ k: 'Cmd', mark: '^', name: 'XA', params: '' }]
    expect(emit(tokens)).toBe('^XA')
  })

  test('should emit command with parameters', () => {
    const tokens: Token[] = [{ k: 'Cmd', mark: '^', name: 'LL', params: '600' }]
    expect(emit(tokens)).toBe('^LL600')
  })

  test('should emit FD and FS tokens', () => {
    const tokens: Token[] = [{ k: 'FD', data: 'Hello World' }, { k: 'FS' }]
    expect(emit(tokens)).toBe('^FDHello World^FS')
  })

  test('should emit raw text tokens', () => {
    const tokens: Token[] = [{ k: 'Raw', text: 'Some raw text' }]
    expect(emit(tokens)).toBe('Some raw text')
  })

  test('should emit byte tokens', () => {
    const tokens: Token[] = [{ k: 'Bytes', buf: new TextEncoder().encode('Binary data') }]
    expect(emit(tokens)).toBe('Binary data')
  })

  test('should emit tilde commands', () => {
    const tokens: Token[] = [{ k: 'Cmd', mark: '~', name: 'DG', params: 'R:LOGO.GRF,100,10,FF' }]
    expect(emit(tokens)).toBe('~DGR:LOGO.GRF,100,10,FF')
  })

  test('should emit complex token sequence', () => {
    const tokens: Token[] = [
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Raw', text: 'Comment: Label start\\n' },
      { k: 'Cmd', mark: '^', name: 'FO', params: '50,100' },
      { k: 'FD', data: 'Test Label' },
      { k: 'FS' },
      { k: 'Cmd', mark: '~', name: 'DG', params: 'R:LOGO.GRF,4,1,F0' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' }
    ]

    const expected = '^XAComment: Label start\\n^FO50,100^FDTest Label^FS~DGR:LOGO.GRF,4,1,F0^XZ'
    expect(emit(tokens)).toBe(expected)
  })

  test('should handle empty FD data', () => {
    const tokens: Token[] = [{ k: 'FD', data: '' }, { k: 'FS' }]
    expect(emit(tokens)).toBe('^FD^FS')
  })

  test('should handle empty command parameters', () => {
    const tokens: Token[] = [
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' }
    ]
    expect(emit(tokens)).toBe('^XA^XZ')
  })

  test('should preserve original formatting in round-trip', () => {
    const originalZPL = '^XA^FO50,100^A0N,28,28^FDOriginal Text^FS^XZ'
    const tokens = tokenizeZPL(originalZPL)
    const emittedZPL = emit(tokens)

    expect(emittedZPL).toBe(originalZPL)
  })

  test('should handle unknown token types (default case)', () => {
    // Test the default case in emit function
    // @ts-expect-error Testing invalid token for coverage
    const invalidToken = { k: 'InvalidType', data: 'test' }
    const result = emit([invalidToken as any])
    expect(result).toBe('')
  })
})
