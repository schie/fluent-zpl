import { label as labelTemplate } from '../src/label-template.js'

describe('Label Tagged Template', () => {
  test('should parse simple ZPL template literal', () => {
    const label = labelTemplate`
      ^XA
      ^FO50,100^A0N,28,28^FDHello World^FS
      ^XZ
    `

    const output = label.toZPL()
    expect(output).toContain('^XA')
    expect(output).toContain('^FO50,100')
    expect(output).toContain('^FDHello World^FS')
    expect(output).toContain('^XZ')
  })

  test('should handle template interpolation', () => {
    const text = 'Dynamic Text'
    const x = 75
    const y = 125

    const label = labelTemplate`
      ^XA
      ^FO${x},${y}^A0N,28,28^FD${text}^FS
      ^XZ
    `

    const output = label.toZPL()
    expect(output).toContain('^FO75,125')
    expect(output).toContain('^FDDynamic Text^FS')
  })

  test('should allow chaining fluent methods after label template', () => {
    const label = labelTemplate`
      ^XA
      ^FO50,50^A0N,28,28^FDOriginal Text^FS
      ^XZ
    `
      .text({ at: { x: 50, y: 100 }, text: 'Added Text' })
      .box({ at: { x: 10, y: 10 }, size: { w: 200, h: 150 } })

    const output = label.toZPL()
    expect(output).toContain('^FDOriginal Text^FS')
    expect(output).toContain('^FDAdded Text^FS')
    expect(output).toContain('^GB200,150,1,B,0^FS')
  })

  test('should handle complex ZPL with multiple interpolations', () => {
    const companyName = 'ACME Corp'
    const address1 = '123 Main Street'
    const address2 = 'Anytown, NY 12345'
    const trackingNumber = 'TRK123456789'

    const label = labelTemplate`
      ^XA
      ^CF0,30
      ^FO50,50^FD${companyName}^FS
      ^FO50,90^FD${address1}^FS  
      ^FO50,130^FD${address2}^FS
      ^BY3,2,100
      ^FO50,200^BCN,80,Y,N,N^FD${trackingNumber}^FS
      ^XZ
    `

    const output = label.toZPL()
    expect(output).toContain('^CF0,30')
    expect(output).toContain('^FDACME Corp^FS')
    expect(output).toContain('^FD123 Main Street^FS')
    expect(output).toContain('^FDAnytown, NY 12345^FS')
    expect(output).toContain('^BY3,2,100')
    expect(output).toContain('^FDTRK123456789^FS')
  })

  test('should support withOptions syntax for DPI and units', () => {
    const label = labelTemplate.withOptions({ dpi: 300, units: 'mm' })`
      ^XA
      ^FO10,10^A0N,28,28^FDHigh DPI^FS
      ^XZ
    `

    expect(label.cfg.dpi).toBe(300)
    expect(label.cfg.units).toBe('mm')

    const output = label.toZPL()
    expect(output).toContain('^FDHigh DPI^FS')
  })

  test('should handle empty template', () => {
    const label = labelTemplate`^XA^XZ`

    const output = label.toZPL()
    expect(output).toContain('^XA')
    expect(output).toContain('^XZ')
  })

  test('should normalize line endings and whitespace', () => {
    const label = labelTemplate`
      
      ^XA
      
      ^FO50,50^A0N,28,28^FDTest^FS
      
      ^XZ
      
    `

    const output = label.toZPL()
    expect(output).toContain('^XA')
    expect(output).toContain('^FDTest^FS')
    expect(output).toContain('^XZ')
  })

  test('should handle number interpolations', () => {
    const width = 400
    const height = 600
    const fontSize = 28

    const label = labelTemplate`
      ^XA
      ^LL${height}
      ^FO50,50^A0N,${fontSize},${fontSize}^FDSize: ${width}x${height}^FS
      ^XZ
    `

    const output = label.toZPL()
    expect(output).toContain('^LL600')
    expect(output).toContain('^A0N,28,28')
    expect(output).toContain('^FDSize: 400x600^FS')
  })

  test('should work with existing ZPL from real-world examples', () => {
    const trackingNumber = '1Z999AA1234567890'
    const recipientName = 'John Smith'

    const label = labelTemplate`
      ^XA
      ^FX Shipping label example
      ^CF0,60
      ^FO50,50^GB100,100,100^FS
      ^FO75,75^FR^GB100,100,100^FS
      ^FO220,50^FDIntershipping, Inc.^FS
      ^CF0,30
      ^FO50,300^FD${recipientName}^FS
      ^BY5,2,270
      ^FO100,550^BC^FD${trackingNumber}^FS
      ^XZ
    `
      .comment('Added via fluent API')
      .text({ at: { x: 50, y: 800 }, text: 'Processed via fluent-zpl' })

    const output = label.toZPL()

    // Should match the exact expected ZPL output format (compacted with spaces preserved in content)
    const expectedZPL = `^XA^FX Shipping label example^CF0,60^FO50,50^GB100,100,100^FS^FO75,75^FR^GB100,100,100^FS^FO220,50^FDIntershipping, Inc.^FS^CF0,30^FO50,300^FD${recipientName}^FS^BY5,2,270^FO100,550^BC^FD${trackingNumber}^FS^FX Added via fluent API^FO50,800^AAN,28,28^FDProcessed via fluent-zpl^FS^XZ`

    expect(output).toEqual(expectedZPL)
  })
})
