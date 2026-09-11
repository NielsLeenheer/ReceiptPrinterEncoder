import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import ImageData from '@canvas/image-data';
import { assert } from 'chai';

/* Lines that only change the state of the printer, such as style, font,
   alignment or raw commands, should not feed the paper, see #63 */

describe('Blank lines caused by state-only lines', function() {
    const image = new ImageData(8, 8);
    image.data.fill(255);

    const CODEPAGE = [ 27, 116, 0 ];
    const HELLO = [ ...CODEPAGE, 104, 101, 108, 108, 111 ];
    const IMAGE = [ 29, 118, 48, 0, 1, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    const CUT = [ 29, 86, 0 ];
    const BOLD_ON = [ 27, 69, 1 ];
    const BOLD_OFF = [ 27, 69, 0 ];
    const NL = [ 10, 13 ];

    describe('bold(true).line(hello).bold(false).image(...)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster' });
        let result = encoder.bold(true).line('hello').bold(false).image(image, 8, 8).encode();

        it('should not have an empty line between the text and the image', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...HELLO, ...BOLD_OFF, ...NL, ...IMAGE, ...NL ]), result);
        });
    });

    describe('bold(true).line(hello).image(...)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster' });
        let result = encoder.bold(true).line('hello').image(image, 8, 8).encode();

        it('should not have empty lines before the image or at the end', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...HELLO, ...BOLD_OFF, ...NL, ...IMAGE, ...NL ]), result);
        });
    });

    describe('size(2).line(hello).size(1).qrcode(...)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.size(2).line('hello').size(1).qrcode('x').encode();

        it('should not have an empty line between the text and the qr code', function () {
            let feeds = Array.from(result).filter((b) => b === 10).length;
            assert.equal(feeds, 2);
        });
    });

    describe('bold(true).line(hello).cut()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.bold(true).line('hello').cut().encode();

        it('should not have an empty line before the cut', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...HELLO, ...BOLD_OFF, ...NL, ...CUT, ...NL ]), result);
        });
    });

    describe('line(hello).bold(true)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.line('hello').bold(true).encode();

        it('should not have an empty line at the end', function () {
            assert.deepEqual(new Uint8Array([ ...HELLO, ...NL ]), result);
        });
    });

    describe('line(hello).font(B).image(...)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster' });
        let result = encoder.line('hello').font('B').image(image, 8, 8).encode();

        it('should not have an empty line between the text and the image', function () {
            assert.deepEqual(new Uint8Array([ ...HELLO, ...NL, 27, 77, 1, ...IMAGE, ...NL ]), result);
        });
    });

    describe('initialize().image(...)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster' });
        let result = encoder.initialize().image(image, 8, 8).encode();

        it('should not have an empty line before the image', function () {
            assert.deepEqual(new Uint8Array([ 27, 64, 28, 46, 27, 77, 0, ...IMAGE, ...NL ]), result);
        });
    });

    describe('line(hello).raw(...).image(...)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster' });
        let result = encoder.line('hello').raw([ 27, 97, 1 ]).image(image, 8, 8).encode();

        it('should not have an empty line after the raw command', function () {
            assert.deepEqual(new Uint8Array([ ...HELLO, ...NL, 27, 97, 1, ...IMAGE, ...NL ]), result);
        });
    });

    describe('raw(...).newline()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.raw([ 104, 105 ]).newline().encode();

        it('should feed when the user adds the newline', function () {
            assert.deepEqual(new Uint8Array([ 104, 105, ...NL ]), result);
        });
    });

    describe('initialize().codepage(cp437).pulse()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.initialize().codepage('cp437').pulse().encode();

        it('should not feed the paper when opening the drawer', function () {
            assert.deepEqual(new Uint8Array([ 27, 64, 28, 46, 27, 77, 0, 27, 112, 0, 50, 250 ]), result);
        });
    });

    describe('initialize().codepage(star/standard).pulse() on star-prnt', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt' });
        let result = encoder.initialize().codepage('star/standard').pulse().encode();

        it('should not feed the paper when opening the drawer', function () {
            assert.deepEqual(new Uint8Array([ 27, 64, 24, 27, 7, 20, 20, 7 ]), result);
        });
    });

    describe('line(hello).newline().line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.line('hello').newline().line('hello').encode();

        it('should still have an explicit empty line', function () {
            assert.deepEqual(new Uint8Array([ ...HELLO, ...NL, ...NL, 104, 101, 108, 108, 111, ...NL ]), result);
        });
    });

    describe('bold(true).newline().bold(false)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.bold(true).newline().bold(false).encode();

        it('should still feed for an explicit newline', function () {
            assert.deepEqual(new Uint8Array([ ...NL ]), result);
        });
    });

    describe('bold(true).line(hello).bold(false) on star-prnt', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.bold(true).line('hello').bold(false).encode();

        it('should not have an empty line at the end', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 27, 29, 116, 0, 104, 101, 108, 108, 111, 27, 70, ...NL ]), result);
        });
    });
});
