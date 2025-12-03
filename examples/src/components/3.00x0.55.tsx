// import './App.css'
import { Barcode, DitherMode, FontFamily, Justify, Label } from '@schie/fluent-zpl';

import { Jimp } from 'jimp';
import { useEffect, useState, type FC } from 'react';
import {
  barcode,
  curryInch,
  curryMm,
  dimension1,
  dimension2,
  epc,
  itemDescription,
} from '../_shared';
import rfidImage from './rfid.png';
import { TagCard, type TagCardProps } from './TagCard';

const wInch = 2.9921;
const hInch = 0.5512;

// For now, let's create a simple version without the actual image
const w = curryInch(wInch);
const h = curryInch(hInch);

const label = Label.create({ w, h })
  // .box({ at: { x: 0, y: 0 }, size: { w: Math.floor(w / 3), h } })
  // .box({ at: { x: Math.floor(w / 3), y: 0 }, size: { w: Math.floor(w / 3), h } })
  // .box({ at: { x: Math.floor((w / 3) * 2), y: 0 }, size: { w: Math.floor(w / 3), h } })
  // .qr({
  //   at: { x: Math.floor(w / 3 + 20), y: 20 },
  //   text: barcode,
  //   magnification: 5,
  // })
  .barcode({
    at: { x: Math.floor(w / 3 + 20), y: 20 },
    height: 60,
    module: 1,
    type: Barcode.Code128,
    data: barcode,
  })
  .text({
    at: { x: 20, y: curryMm(2) },
    wrap: {
      width: Math.floor(w / 3 - 20),
      lines: 3,
      justify: Justify.Left,
    },
    font: { family: FontFamily.A, h: curryMm(1.5), w: curryMm(1.2) },
    text: itemDescription,
  })
  .text({
    at: { x: 20, y: Math.floor(h * 0.6) },
    font: { family: FontFamily.A, h: curryMm(1.2), w: curryMm(1.1) },
    text: dimension1,
    wrap: { width: Math.floor(w / 3 - 20) },
  })
  .text({
    at: { x: 20, y: Math.floor(h * 0.8) },
    font: { family: FontFamily.A, h: curryMm(1.2), w: curryMm(1.1) },
    text: dimension2,
    wrap: { width: Math.floor(w / 3 - 20) },
  })
  .text({
    at: { x: Math.floor(w / 3), y: h - 20 },
    font: { family: FontFamily.A, h: curryMm(1.2), w: curryMm(1) },
    text: epc,
    wrap: { width: Math.floor(w / 3), justify: Justify.Center },
  })
  .epc({
    epc,
  });

// const zpl = label.toZPL();

type Props = Pick<TagCardProps, 'onDetailClick'>;

export const Label300x55: FC<Props> = (props) => {
  const [leBelle, setLeBelle] = useState<string>(label.toZPL());

  useEffect(() => {
    Promise.all([
      // Jimp.read(epcImage),
      Jimp.read(rfidImage),
    ]).then((images) => {
      let leiBull = label;
      images.forEach((img, index) => {
        const { width: originalWidth, height: originalHeight } = img.bitmap;
        if (originalWidth !== originalHeight) {
          const minDimension = Math.min(originalWidth, originalHeight);
          const cropX = Math.floor((originalWidth - minDimension) / 2);
          const cropY = Math.floor((originalHeight - minDimension) / 2);
          img.crop({ x: cropX, y: cropY, w: minDimension, h: minDimension });
        }
        img.resize({ w: 100, h: 100 });
        leiBull = leiBull.imageInline({
          at: { x: Math.floor((w / 3) * 2 - img.bitmap.width), y: 20 + index * 100 },
          rgba: img.bitmap.data,
          width: img.bitmap.width,
          height: img.bitmap.height,
          mode: DitherMode.Threshold,
          threshold: 128,
          invert: false,
        });
      });

      setLeBelle(leiBull.toZPL());
    });
  }, []);
  return (
    <TagCard
      title={`${wInch}" x ${hInch}" - Jewelry Tag`}
      description="A compact jewelry tag label featuring Code128 barcode, multi-line product description with text wrapping, dimension details, EPC code display, and RFID icon. Designed for Zebra's 10038478 RFID tags. Layout accommodates the physical tag's neck/stem structure by positioning content to one side."
      zpl={leBelle}
      {...props}
      widthInInches={wInch}
      heightInInches={hInch}
    />
  );
};
