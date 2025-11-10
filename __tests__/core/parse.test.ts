// Tests for src/core/parse.ts

import { findLastXZ, tokenizeZPL } from '../../src/core/parse.js'
import type { Token } from '../../src/_types.js'

describe('tokenizeZPL()', () => {
  test('should parse empty input', () => {
    expect(tokenizeZPL('')).toEqual([])
    expect(tokenizeZPL(new Uint8Array())).toEqual([])
  })

  test('should parse single command', () => {
    const tokens = tokenizeZPL('^XA')
    expect(tokens).toEqual([{ k: 'Cmd', mark: '^', name: 'XA', params: '' }])
  })

  test('should parse command with parameters', () => {
    const tokens = tokenizeZPL('^LL600')
    expect(tokens).toEqual([{ k: 'Cmd', mark: '^', name: 'LL', params: '600' }])
  })

  test('should parse complex parameters', () => {
    const tokens = tokenizeZPL('^FO50,100')
    expect(tokens).toEqual([{ k: 'Cmd', mark: '^', name: 'FO', params: '50,100' }])
  })

  test('should parse FD...FS blocks', () => {
    const tokens = tokenizeZPL('^FDHello World^FS')
    expect(tokens).toEqual([{ k: 'FD', data: 'Hello World' }, { k: 'FS' }])
  })

  test('should handle empty FD block', () => {
    const tokens = tokenizeZPL('^FD^FS')
    expect(tokens).toEqual([{ k: 'FD', data: '' }, { k: 'FS' }])
  })

  test('should handle FD with special characters', () => {
    const tokens = tokenizeZPL('^FDText with "quotes" and symbols!@#$%^FS')
    expect(tokens).toEqual([
      { k: 'FD', data: 'Text with "quotes" and symbols!@#$%' },
      { k: 'FS' }
    ])
  })

  test('should handle multiline FD content', () => {
    const tokens = tokenizeZPL('^FDLine 1\\nLine 2\\nLine 3^FS')
    expect(tokens).toEqual([{ k: 'FD', data: 'Line 1\\nLine 2\\nLine 3' }, { k: 'FS' }])
  })

  test('should handle unterminated FD', () => {
    const tokens = tokenizeZPL('^FDUnterminated')
    expect(tokens).toEqual([{ k: 'FD', data: 'Unterminated' }])
  })

  test('should parse tilde commands', () => {
    const tokens = tokenizeZPL('~DGR:LOGO.GRF,100,10,ABC')
    expect(tokens).toEqual([{ k: 'Cmd', mark: '~', name: 'DG', params: 'R:LOGO.GRF,100,10,ABC' }])
  })

  test('should handle mixed ^ and ~ commands', () => {
    const tokens = tokenizeZPL('^XA~DGR:LOGO.GRF,10,1,FF^XZ')
    expect(tokens).toEqual([
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Cmd', mark: '~', name: 'DG', params: 'R:LOGO.GRF,10,1,FF' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' }
    ])
  })

  test('should handle raw text between commands', () => {
    const tokens = tokenizeZPL('Some raw text^XAMore text^XZ')
    expect(tokens).toEqual([
      { k: 'Raw', text: 'Some raw text' },
      { k: 'Cmd', mark: '^', name: 'XA', params: 'More text' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' }
    ])
  })

  test('should handle commands at start of parameters', () => {
    const tokens = tokenizeZPL('^LL600^FO50,100')
    expect(tokens).toEqual([
      { k: 'Cmd', mark: '^', name: 'LL', params: '600' },
      { k: 'Cmd', mark: '^', name: 'FO', params: '50,100' }
    ])
  })

  test('should handle edge cases with command detection', () => {
    const tokens = tokenizeZPL('No commands here')
    expect(tokens).toEqual([{ k: 'Raw', text: 'No commands here' }])
  })

  test('should parse complex real-world ZPL', () => {
    const zpl = '^XA^FO50,100^A0N,28,28^FDHello^FS^FO50,150^BCN,100,Y,N,N^FD123456^FS^XZ'
    const tokens = tokenizeZPL(zpl)

    expect(tokens).toHaveLength(10)
    expect(tokens[0]).toEqual({ k: 'Cmd', mark: '^', name: 'XA', params: '' })
    expect(tokens[1]).toEqual({ k: 'Cmd', mark: '^', name: 'FO', params: '50,100' })
    expect(tokens[2]).toEqual({ k: 'Cmd', mark: '^', name: 'A', params: '0N,28,28' })
    expect(tokens[3]).toEqual({ k: 'FD', data: 'Hello' })
    expect(tokens[4]).toEqual({ k: 'FS' })
    expect(tokens[5]).toEqual({ k: 'Cmd', mark: '^', name: 'FO', params: '50,150' })
    expect(tokens[6]).toEqual({ k: 'Cmd', mark: '^', name: 'BC', params: 'N,100,Y,N,N' })
    expect(tokens[7]).toEqual({ k: 'FD', data: '123456' })
    expect(tokens[8]).toEqual({ k: 'FS' })
    expect(tokens[9]).toEqual({ k: 'Cmd', mark: '^', name: 'XZ', params: '' })
  })

  test('should handle Uint8Array input', () => {
    const input = new TextEncoder().encode('^XA^LL600^XZ')
    const tokens = tokenizeZPL(input)

    expect(tokens).toEqual([
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Cmd', mark: '^', name: 'LL', params: '600' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' }
    ])
  })
})

describe('findLastXZ()', () => {
  test('should find last ^XZ command', () => {
    const tokens: Token[] = [
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Cmd', mark: '^', name: 'LL', params: '600' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' }
    ]

    expect(findLastXZ(tokens)).toBe(2)
  })

  test('should find last ^XZ when multiple exist', () => {
    const tokens: Token[] = [
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' },
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' }
    ]

    expect(findLastXZ(tokens)).toBe(3)
  })

  test('should return array length when no ^XZ found', () => {
    const tokens: Token[] = [
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Cmd', mark: '^', name: 'LL', params: '600' }
    ]

    expect(findLastXZ(tokens)).toBe(2)
  })

  test('should return 0 for empty array', () => {
    expect(findLastXZ([])).toBe(0)
  })

  test('should ignore ~XZ commands', () => {
    const tokens: Token[] = [
      { k: 'Cmd', mark: '~', name: 'XZ', params: '' },
      { k: 'Cmd', mark: '^', name: 'XA', params: '' },
      { k: 'Cmd', mark: '^', name: 'XZ', params: '' }
    ]

    expect(findLastXZ(tokens)).toBe(2)
  })
})
