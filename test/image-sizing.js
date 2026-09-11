import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import ImageData from '@canvas/image-data';
import { assert, expect } from 'chai';

/* The size of an image on the paper follows from the width, the height, or
   the size of the image itself. Sizes are rounded up to a multiple of 8 dots
   and the image is padded with white dots */

describe('Image sizing', function() {
    const NL = [ 10, 13 ];
    const RASTER = (width, height) => [ 29, 118, 48, 0, (width >> 3) & 0xff, (width >> 3) >> 8, height & 0xff, height >> 8 ];

    const image = (width, height, gray = 255) => {
        const data = new ImageData(width, height);
        data.data.fill(gray);
        for (let i = 3; i < data.data.length; i += 4) {
            data.data[i] = 255;
        }
        return data;
    };

    const rows = (count, ...bytes) => new Array(count).fill(bytes).flat();
    const encode = (fn, options = {}) => fn(new ReceiptPrinterEncoder(Object.assign({ language: 'esc-pos', columns: 42, imageMode: 'raster' }, options))).encode();

    describe('image() without a size', function () {
        it('should print the image at its own size, padded to a multiple of 8', function () {
            assert.deepEqual(new Uint8Array([ ...RASTER(16, 16), ...rows(10, 0xff, 0xc0), ...rows(6, 0, 0), ...NL ]),
                encode((e) => e.image(image(10, 10, 0))));
        });

        it('should scale an image wider than the paper down to the printable width', function () {
            assert.deepEqual(new Uint8Array([ ...RASTER(384, 48), ...rows(48, ...new Array(48).fill(0xff)), ...NL ]),
                encode((e) => e.image(image(768, 96, 0)), { columns: 32 }));
        });
    });

    describe('image() with only a width', function () {
        it('should calculate the height from the aspect ratio', function () {
            assert.deepEqual(new Uint8Array([ ...RASTER(64, 32), ...rows(32, ...new Array(8).fill(0)), ...NL ]),
                encode((e) => e.image(image(100, 50), { width: 64 })));
        });

        it('should pad a width that is not a multiple of 8', function () {
            assert.deepEqual(new Uint8Array([ ...RASTER(64, 32), ...rows(30, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xf0), ...rows(2, 0, 0, 0, 0, 0, 0, 0, 0), ...NL ]),
                encode((e) => e.image(image(100, 50, 0), { width: 60 })));
        });
    });

    describe('image() with only a height', function () {
        it('should calculate the width from the aspect ratio', function () {
            assert.deepEqual(new Uint8Array([ ...RASTER(80, 40), ...rows(40, ...new Array(10).fill(0)), ...NL ]),
                encode((e) => e.image(image(100, 50), { height: 40 })));
        });

        it('should pad a height that is not a multiple of 8', function () {
            assert.deepEqual(
                encode((e) => e.image(image(100, 50, 0), { height: 30 })),
                encode((e) => e.image(image(100, 50, 0), { width: 60 })));
        });
    });

    describe('image() with a width and a height', function () {
        it('should be the same as the positional parameters', function () {
            assert.deepEqual(
                encode((e) => e.image(image(100, 50), { width: 64, height: 16 })),
                encode((e) => e.image(image(100, 50), 64, 16)));
        });

        it('should no longer throw for sizes that are not a multiple of 8', function () {
            assert.deepEqual(
                encode((e) => e.image(image(10, 10, 0), 10, 10)),
                encode((e) => e.image(image(10, 10, 0))));
        });
    });

    describe('image() with dithering options', function () {
        it('should pass the algorithm and threshold', function () {
            assert.deepEqual(new Uint8Array([ ...RASTER(8, 8), ...rows(8, 0xff), ...NL ]),
                encode((e) => e.image(image(100, 50, 128), { width: 8, height: 8, threshold: 200 })));

            assert.deepEqual(new Uint8Array([ ...RASTER(8, 8), ...rows(8, 0), ...NL ]),
                encode((e) => e.image(image(100, 50, 128), { width: 8, height: 8, threshold: 100 })));

            assert.deepEqual(
                encode((e) => e.image(image(100, 50, 128), { width: 8, height: 8, algorithm: 'atkinson' })),
                encode((e) => e.image(image(100, 50, 128), 8, 8, 'atkinson')));
        });
    });

    describe('image() in column mode', function () {
        it('should pad the image to a multiple of 8 as well', function () {
            assert.deepEqual(new Uint8Array([ 27, 51, 24, 27, 42, 33, 16, 0, ...new Array(48).fill(0), 10, 27, 50, ...NL ]),
                encode((e) => e.image(image(10, 10)), { imageMode: 'column' }));
        });
    });

    describe('image() with an invalid size', function () {
        it('should throw', function () {
            for (const width of [ 0, -8, 8.5, NaN, '64' ]) {
                expect(() => encode((e) => e.image(image(10, 10), { width })), `width ${width}`).to.throw('Image width must be a positive integer');
            }

            expect(() => encode((e) => e.image(image(10, 10), { height: 0 }))).to.throw('Image height must be a positive integer');
        });
    });

    describe('printableWidth', function () {
        it('should be the number of columns times the width of font A, rounded down to a multiple of 8', function () {
            assert.equal(new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 }).printableWidth, 504);
            assert.equal(new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 48 }).printableWidth, 576);
            assert.equal(new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 35 }).printableWidth, 416);
            assert.equal(new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 }).printableWidth, 384);
        });

        it('should follow the printer model', function () {
            assert.equal(new ReceiptPrinterEncoder({ printerModel: 'epson-tm-t88vi' }).printableWidth, 504);
            assert.equal(new ReceiptPrinterEncoder({ printerModel: 'epson-tm-m30ii' }).printableWidth, 576);
            assert.equal(new ReceiptPrinterEncoder({ printerModel: 'star-mc-print2' }).printableWidth, 384);
        });

        it('should follow the columns when they override the printer model', function () {
            assert.equal(new ReceiptPrinterEncoder({ printerModel: 'epson-tm-m30ii', columns: 32 }).printableWidth, 384);
        });
    });
});
