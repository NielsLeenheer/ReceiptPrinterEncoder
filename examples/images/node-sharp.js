import ReceiptPrinterEncoder from "../../src/receipt-printer-encoder.js";
import sharp from "sharp";

let buffer = await sharp('image.png')
  .raw()
  .toBuffer({ resolveWithObject: true });

let encoder = new ReceiptPrinterEncoder();

let result = encoder
    .initialize()
    .image(buffer, 64, 64, 'atkinson')
    .encode();

console.log(result);