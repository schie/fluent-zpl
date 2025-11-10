// __tests__/image-registry.test.ts
// Tests for image registry functionality

import { ImageRegistry } from '../../src/image/registry.js'

describe('ImageRegistry', () => {
  let registry: ImageRegistry

  beforeEach(() => {
    registry = new ImageRegistry()
  })

  test('should start empty', () => {
    expect(registry.has('test-hash')).toBe(false)
    expect(registry.get('test-hash')).toBeUndefined()
  })

  test('should store and retrieve hash-to-name mappings', () => {
    const hash = 'sha256abc123'
    const grfName = 'R:LOGO.GRF'

    registry.put(hash, grfName)

    expect(registry.has(hash)).toBe(true)
    expect(registry.get(hash)).toBe(grfName)
  })

  test('should handle multiple entries', () => {
    registry.put('hash1', 'R:LOGO1.GRF')
    registry.put('hash2', 'R:LOGO2.GRF')
    registry.put('hash3', 'R:LOGO3.GRF')

    expect(registry.has('hash1')).toBe(true)
    expect(registry.has('hash2')).toBe(true)
    expect(registry.has('hash3')).toBe(true)
    expect(registry.has('hash4')).toBe(false)

    expect(registry.get('hash1')).toBe('R:LOGO1.GRF')
    expect(registry.get('hash2')).toBe('R:LOGO2.GRF')
    expect(registry.get('hash3')).toBe('R:LOGO3.GRF')
  })

  test('should overwrite existing entries', () => {
    const hash = 'duplicate-hash'

    registry.put(hash, 'R:FIRST.GRF')
    expect(registry.get(hash)).toBe('R:FIRST.GRF')

    registry.put(hash, 'R:SECOND.GRF')
    expect(registry.get(hash)).toBe('R:SECOND.GRF')
  })

  test('should generate recall tokens', () => {
    const tokens = registry.recallAt('R:LOGO.GRF', { x: 100, y: 200 })

    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toEqual({ k: 'Cmd', mark: '^', name: 'FO', params: '100,200' })
    expect(tokens[1]).toEqual({ k: 'Cmd', mark: '^', name: 'XG', params: 'R:LOGO.GRF,1,1' })
    expect(tokens[2]).toEqual({ k: 'Cmd', mark: '^', name: 'FS', params: '' })
  })

  test('should handle zero coordinates in recall', () => {
    const tokens = registry.recallAt('R:TEST.GRF', { x: 0, y: 0 })

    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toEqual({ k: 'Cmd', mark: '^', name: 'FO', params: '0,0' })
    expect(tokens[1]).toEqual({ k: 'Cmd', mark: '^', name: 'XG', params: 'R:TEST.GRF,1,1' })
    expect(tokens[2]).toEqual({ k: 'Cmd', mark: '^', name: 'FS', params: '' })
  })
})
