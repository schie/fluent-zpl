// import './App.css'
import { Barcode, DitherMode, FontFamily, Justify, Label } from '@schie/fluent-zpl';
import { Jimp } from 'jimp';
import { useEffect, useState, type FC } from 'react';
import rfidImage from './rfid.png';

import {
  barcode,
  curryInch,
  curryMm,
  dimension1,
  dimension2,
  epc,
  itemDescription,
  retail,
} from '../_shared';
import { TagCard, type TagCardProps } from './TagCard';

const wInch = 1.81;
const hInch = 0.87;

// For now, let's create a simple version without the actual image
const w = curryInch(wInch);
const h = curryInch(hInch);

const label = Label.create({ w, h })
  .barcode({
    at: { x: 20, y: 20 },
    height: 50,
    type: Barcode.Code128,
    data: barcode,
  })
  .text({
    at: { x: 20, y: Math.floor(h / 2) },
    wrap: {
      width: Math.floor(w * 0.75),
      lines: 2,
      justify: Justify.Left,
    },
    font: { family: FontFamily.A, h: curryMm(1.5), w: curryMm(1.4) },
    text: itemDescription,
    // text: 'Sample Product Name .........X.........X.........X',
  })
  .text({
    at: { x: 20, y: 160 },
    font: { family: FontFamily.A, h: curryMm(1.2), w: curryMm(1.1) },
    text: dimension1,
    wrap: { width: Math.floor(w / 2 - 20), lines: 1 },
  })
  .text({
    at: { x: 20, y: 180 },
    font: { family: FontFamily.A, h: curryMm(1.2), w: curryMm(1.1) },
    text: dimension2,
    wrap: { width: Math.floor(w / 2 - 20), lines: 1 },
  })
  .text({
    at: { x: Math.floor(w / 2), y: 170 },
    font: { family: FontFamily.A, h: curryMm(1.5), w: curryMm(1.5) },
    text: retail,
    wrap: { width: Math.floor(w / 2 - 20), justify: Justify.Right },
  })
  .text({
    at: { x: 20, y: Math.floor(h - 30) },
    font: { family: FontFamily.A, h: curryMm(1.2), w: curryMm(1) },
    text: epc,
  })
  .epc({
    epc,
  });

type Props = Pick<TagCardProps, 'onDetailClick'>;

export const Label181x087: FC<Props> = (props) => {
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
          at: { x: 410, y: 20 + index * 100 },
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
      {...props}
      title={`${wInch}" x ${hInch}" Label`}
      description="A small product label with barcode, description, dimensions, retail price, and EPC."
      zpl={leBelle}
      widthInInches={wInch}
      heightInInches={hInch}
    />
  );
};
