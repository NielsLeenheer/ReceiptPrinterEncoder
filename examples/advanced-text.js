import ReceiptPrinterEncoder from "../src/receipt-printer-encoder.js";
import { createCanvas } from 'canvas';
import { drawText } from 'canvas-txt';

/* Create an oversized canvas */

let canvas = createCanvas(320, 320);
let ctx = canvas.getContext('2d');

/* White background */

ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

/* Draw text */

let line = "The quick brown... אני יכול לאכול זכוכית וזה לא מזיק לי .أنا قادر على أكل الزجاج و هذا لا يؤلمني. ";

ctx.fillStyle = "#000";

let { height } = drawText(ctx, line, {
    x: 0,
    y: 0,
    width: 320,
    height: 320,
    fontSize: 16,
    lineHeight: 20,
    align: 'left',
    vAlign: 'top'
});

/* Make sure the height is a multiple of 8 */

height = (height + 8) >> 3 << 3;

/* 
    Get image data for the text 
    
    The reason why we're not using the canvas directly 
    is because the canvas may be oversized and we
    want to crop it to the actual text height.
*/

let imageData = ctx.getImageData(0, 0, 320, height);

/* Encode the image data */

let encoder = new ReceiptPrinterEncoder();
let result = encoder
    .image(imageData, 320, height, 'threshold')
    .encode();

console.log(result);
