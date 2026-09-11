import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import ImageData from '@canvas/image-data';
import { assert } from 'chai';

/* Images, barcodes and QR codes advance the paper by themselves. The line feed
   that follows them can be disabled with the feedAfterBlock option, see #43 */

describe('feedAfterBlock', function() {
    const NL = [ 10, 13 ];
    const CODEPAGE = [ 27, 116, 0 ];
    const IMAGE = [ 29, 118, 48, 0, 1, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    const STRIP = [ 27, 42, 33, 8, 0, ...new Array(24).fill(0), 10 ];
    const QRCODE = [ 29, 40, 107, 4, 0, 49, 65, 50, 0, 29, 40, 107, 3, 0, 49, 67, 6, 29, 40, 107, 3, 0, 49, 69, 49, 29, 40, 107, 4, 0, 49, 80, 48, 120, 29, 40, 107, 3, 0, 49, 81, 48 ];
    const BARCODE = [ 29, 104, 60, 29, 119, 3, 29, 72, 0, 29, 107, 73, 9, 123, 66, 67, 79, 68, 69, 49, 50, 56 ];

    const image = new ImageData(8, 8);
    image.data.fill(255);

    describe('image() with the default', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster' });
        let result = encoder.image(image, 8, 8).encode();

        it('should still feed after the image', function () {
            assert.deepEqual(new Uint8Array([ ...IMAGE, ...NL ]), result);
        });
    });

    describe('image() in raster mode with feedAfterBlock false', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster', feedAfterBlock: false });
        let result = encoder.image(image, 8, 8).encode();

        it('should not feed after the image', function () {
            assert.deepEqual(new Uint8Array([ ...IMAGE ]), result);
        });
    });

    describe('image() in column mode with feedAfterBlock false', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'column', feedAfterBlock: false });
        let result = encoder.image(image, 8, 8).encode();

        it('should keep the line feed of the strip, but not feed after the image', function () {
            assert.deepEqual(new Uint8Array([ 27, 51, 24, ...STRIP, 27, 50 ]), result);
        });
    });

    describe('image().line(hello) with feedAfterBlock false', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster', feedAfterBlock: false });
        let result = encoder.image(image, 8, 8).line('hello').encode();

        it('should print the text directly below the image', function () {
            assert.deepEqual(new Uint8Array([ ...IMAGE, ...CODEPAGE, 104, 101, 108, 108, 111, ...NL ]), result);
        });
    });

    describe('align(center).image().line(hello) with feedAfterBlock false', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster', feedAfterBlock: false });
        let result = encoder.align('center').image(image, 8, 8).line('hello').encode();

        it('should not feed after the image, even with alignment commands around it', function () {
            assert.deepEqual(new Uint8Array([ 27, 97, 1, ...IMAGE, 27, 97, 0, ...CODEPAGE, ...new Array(18).fill(32), 104, 101, 108, 108, 111, ...NL ]), result);
        });
    });

    describe('image().newline().line(hello) with feedAfterBlock false', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster', feedAfterBlock: false });
        let result = encoder.image(image, 8, 8).newline().line('hello').encode();

        it('should feed when the user adds a newline', function () {
            assert.deepEqual(new Uint8Array([ ...IMAGE, ...NL, ...CODEPAGE, 104, 101, 108, 108, 111, ...NL ]), result);
        });
    });

    describe('qrcode(x) with feedAfterBlock false', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', feedAfterBlock: false });
        let result = encoder.qrcode('x').encode();

        it('should not feed after the qr code', function () {
            assert.deepEqual(new Uint8Array([ ...QRCODE ]), result);
        });
    });

    describe('barcode(CODE128, code128, 60) with feedAfterBlock false', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', feedAfterBlock: false });
        let result = encoder.barcode('CODE128', 'code128', 60).encode();

        it('should not feed after the barcode', function () {
            assert.deepEqual(new Uint8Array([ ...BARCODE ]), result);
        });
    });

    describe('pdf417(x) with feedAfterBlock false', function () {
        let withFeed = new ReceiptPrinterEncoder({ language: 'esc-pos' }).pdf417('x').encode();
        let result = new ReceiptPrinterEncoder({ language: 'esc-pos', feedAfterBlock: false }).pdf417('x').encode();

        it('should not feed after the pdf417 code', function () {
            assert.deepEqual(new Uint8Array([ 10, 13 ]), withFeed.slice(-2));
            assert.deepEqual(new Uint8Array(withFeed.slice(0, -2)), result);
        });
    });

    describe('line(hello).cut() with feedAfterBlock false', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', feedAfterBlock: false });
        let result = encoder.line('hello').cut().encode();

        it('should not affect text lines or cuts', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 104, 101, 108, 108, 111, ...NL, 29, 86, 0, ...NL ]), result);
        });
    });

    describe('image() on star-prnt with feedAfterBlock false', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false, feedAfterBlock: false });
        let result = encoder.image(image, 8, 24).encode();

        it('should not feed after the image', function () {
            assert.deepEqual(new Uint8Array([ 27, 48, 27, 88, 8, 0, ...new Array(24).fill(0), 10, 13, 27, 122, 1 ]), result);
        });
    });
});
