import ReceiptPrinterEncoder from "../../src/receipt-printer-encoder.js";
import pixels from 'image-pixels';

let imageData = await pixels('image.png');

let encoder = new ReceiptPrinterEncoder();

let result = encoder
    .initialize()
    .image(imageData, 64, 64, 'atkinson')
    .encode();

console.log(result);