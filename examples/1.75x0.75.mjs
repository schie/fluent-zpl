// Example showing how to load epc.jpeg and use with imageInline()
import { Barcode, Label, inch, mm } from '@schie/fluent-zpl';
// You'll need to install jimp: npm install jimp
import { writeFileSync } from 'fs';
import { Jimp } from 'jimp';

const convertImage = async (path) => {
  const image = await Jimp.read(path);
  // Make square by cropping from longer sides equally, then resize to 100x100
  const { width: origWidth, height: origHeight } = image.bitmap;
  if (origWidth !== origHeight) {
    const minDimension = Math.min(origWidth, origHeight);
    const cropX = Math.floor((origWidth - minDimension) / 2);
    const cropY = Math.floor((origHeight - minDimension) / 2);
    image.crop({ x: cropX, y: cropY, w: minDimension, h: minDimension });
  }
  image.resize({ w: 100, h: 100 });
  const { bitmap } = image;
  const rgba = new Uint8Array(bitmap.data);
  return { rgba, width: bitmap.width, height: bitmap.height };
};

const wInch = 1.75;
const hInch = 0.75;

// For now, let's create a simple version without the actual image
const w = inch(wInch, 300);
const h = inch(hInch, 300);

// const barcode = 'REPLACE__item.sku__'
// const itemDescription = 'REPLACE__item.description__'
// const dimension1 = 'REPLACE__item.dim1.description__'
// const dimension2 = 'REPLACE__item.dim2.description__'
// const epc = 'REPLACE__epcValue__'
// const retail = 'REPLACE__item.retail1__'

const barcode = '123456789012';
const itemDescription = 'Sample Product Name';
const dimension1 = 'Medium';
const dimension2 = 'Red';
const epc = '3000C2D01234567890ABCDEE';
const retail = '$29.99';

// For now, here's how your code would look with image loading:
async function createLabelWithImage() {
  try {
    // Load and process the JPEG image
    const image = await Jimp.read('./epc.jpeg');
    //
    // // Resize if needed (ZPL works better with smaller images)
    image.resize({ w: 100, h: 100 }); // Adjust size as needed

    const epcImage = await convertImage('./epc.jpeg');
    const label = Label.create({ w, h })
      .barcode({
        at: { x: 20, y: 20 },
        height: 50,
        type: Barcode.Code128,
        data: barcode,
      })
      .imageInline({
        at: { x: 410, y: 20 },
        rgba: epcImage.rgba,
        width: epcImage.width,
        height: epcImage.height,
        mode: 'threshold', // or 'floyd-steinberg' or 'ordered'
        threshold: 128, // 0-255, controls black/white threshold
        invert: false, // set to true if image appears inverted
      })
      // .box({
      //   at: { x: 0, y: 0 },
      //   size: {
      //     w,
      //     h
      //   },
      //   border: 2
      // })
      .caption({
        at: { x: 20, y: 100 },
        family: 'A',
        size: mm(2, 300),
        wrapWidth: 400,
        // text: 'Item Description Here That Is Really Long'
        text: itemDescription,
      })
      .text({
        at: { x: 20, y: 160 },
        font: { family: 'A', h: mm(1.5, 300), w: mm(1.5, 300) },
        text: dimension1,
        wrap: { width: 180 },
      })
      .text({
        at: { x: 20, y: 180 },
        font: { family: 'A', h: mm(1.5, 300), w: mm(1.5, 300) },
        text: dimension2,
        wrap: { width: 180 },
      })

      .text({
        at: { x: 20, y: 205 },
        font: { family: 'A', h: mm(1, 300), w: mm(1, 300) },
        text: epc,
      })
      .text({
        at: { x: 200, y: 170 },
        font: { family: 'B', h: mm(1.5, 300), w: mm(1.5, 300) },
        text: retail,
        wrap: { width: 200 },
      })
      .epc({
        epc,
      })
      .toZPL();

    return label;
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
}

createLabelWithImage().then(async (label) => {
  console.log('label');
  console.log(
    label
      .split('^')
      .filter((x) => x.trim().length > 0)
      .map((x) => `^${x}`)
      .join('\n'),
  );
  const url = `https://api.labelary.com/v1/printers/12dpmm/labels/${wInch}x${hInch}/0/${encodeURIComponent(label)}`;

  // Download image and save as label.png
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  writeFileSync(`${wInch}x${hInch}.png`, buffer);
});
