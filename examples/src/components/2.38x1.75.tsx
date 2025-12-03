// import './App.css'
import { Barcode, DitherMode, FontFamily, Justify, Label } from '@schie/fluent-zpl';
import { Jimp } from 'jimp';
import { useEffect, useState, type FC } from 'react';
import epcImage from './epc.jpeg';
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

const wInch = 2.38;
const hInch = 1.75;

// For now, let's create a simple version without the actual image
const w = curryInch(wInch);
const h = curryInch(hInch);

const label = Label.create({ w, h })
  .barcode({
    at: { x: 30, y: Math.floor(h / 1.5) },
    height: 60,
    module: 3,
    type: Barcode.Code128,
    data: barcode,
  })
  .text({
    at: { x: 30, y: Math.floor(h * 0.1) },
    wrap: {
      width: Math.floor(w * 0.75),
      lines: 3,
      justify: Justify.Left,
    },
    font: { family: FontFamily.A, h: curryMm(2), w: curryMm(1.5) },
    text: itemDescription,
    // text: 'Sample Product Name .........X.........X.........X',
  })
  .text({
    at: { x: 30, y: 200 },
    font: { family: FontFamily.A, h: curryMm(1.3), w: curryMm(1.2) },
    text: dimension1,
    wrap: { width: 180 },
  })
  .text({
    at: { x: 30, y: 230 },
    font: { family: FontFamily.A, h: curryMm(1.5), w: curryMm(1.2) },
    text: dimension2,
    wrap: { width: 180 },
  })
  .text({
    at: { x: Math.floor(w / 2), y: 200 },
    font: { family: FontFamily.A, h: curryMm(2), w: curryMm(2) },
    text: retail,
    wrap: { width: 200 },
  })
  .text({
    at: { x: 30, y: h - 30 },
    font: { family: FontFamily.A, h: curryMm(1.2), w: curryMm(1) },
    text: epc,
  })
  .epc({
    epc,
  });
type Props = Pick<TagCardProps, 'onDetailClick'>;
export const Label238x175: FC<Props> = (props) => {
  const [leBelle, setLeBelle] = useState<string>(label.toZPL());

  useEffect(() => {
    Promise.all([Jimp.read(epcImage), Jimp.read(rfidImage)]).then((images) => {
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
          at: { x: w - img.bitmap.width - 40, y: 30 + index * 100 },
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
      title={`${wInch}" x ${hInch}" Label`}
      description="A standard product label with barcode, description, dimensions, retail price, and EPC."
      zpl={leBelle}
      widthInInches={wInch}
      heightInInches={hInch}
      {...props}
    />
  );
};
