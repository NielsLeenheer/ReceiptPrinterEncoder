import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import ImageData from '@canvas/image-data';
import { assert } from 'chai';

/* Text styles only apply to text, spaces and raw data. Lines with a cut, a
   pulse, an image or only pending state changes are not wrapped in style
   commands, and a cut or pulse is always the first command after a line feed */

describe('Styles around cuts, pulses and blocks', function() {
    const NL = [ 10, 13 ];
    const CODEPAGE = [ 27, 116, 0 ];
    const STAR_CODEPAGE = [ 27, 29, 116, 0 ];
    const HELLO = [ 104, 101, 108, 108, 111 ];
    const CUT = [ 29, 86, 0 ];
    const PULSE = [ 27, 112, 0, 50, 250 ];
    const STAR_CUT = [ 27, 100, 0 ];
    const STAR_PULSE = [ 27, 7, 20, 20, 7 ];
    const STAR_FLUSH = [ 27, 29, 80, 48, 27, 29, 80, 49 ];

    const image = new ImageData(8, 8);
    image.data.fill(255);

    describe('bold(true).line(hello).pulse()', function () {
        let plain = new ReceiptPrinterEncoder({ language: 'esc-pos' }).line('hello').pulse().encode();
        let styled = new ReceiptPrinterEncoder({ language: 'esc-pos' }).bold(true).line('hello').pulse().encode();

        it('should not feed after the pulse, like an unstyled receipt', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...HELLO, ...NL, ...PULSE ]), plain);
            assert.deepEqual(new Uint8Array([ 27, 69, 1, ...CODEPAGE, ...HELLO, 27, 69, 0, ...NL, ...PULSE ]), styled);
        });
    });

    describe('bold(true).line(hello).cut()', function () {
        let styled = new ReceiptPrinterEncoder({ language: 'esc-pos' }).bold(true).line('hello').cut().encode();

        it('should send the cut directly after the line feed, without style commands', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 1, ...CODEPAGE, ...HELLO, 27, 69, 0, ...NL, ...CUT, ...NL ]), styled);
        });
    });

    describe('bold(true).text(hello).cut()', function () {
        let styled = new ReceiptPrinterEncoder({ language: 'esc-pos' }).bold(true).text('hello').cut().encode();

        it('should end the pending text with a feed before the cut', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 1, ...CODEPAGE, ...HELLO, 27, 69, 0, ...NL, ...CUT, ...NL ]), styled);
        });
    });

    describe('bold(true).line(hello).pulse() on star-prnt', function () {
        let plain = new ReceiptPrinterEncoder({ language: 'star-prnt' }).line('hello').pulse().encode();
        let styled = new ReceiptPrinterEncoder({ language: 'star-prnt' }).bold(true).line('hello').pulse().encode();

        it('should not append the flush command after the pulse, like an unstyled receipt', function () {
            assert.deepEqual(new Uint8Array([ ...STAR_CODEPAGE, ...HELLO, ...NL, ...STAR_PULSE ]), plain);
            assert.deepEqual(new Uint8Array([ 27, 69, ...STAR_CODEPAGE, ...HELLO, 27, 70, ...NL, ...STAR_PULSE ]), styled);
        });
    });

    describe('bold(true).line(hello).cut() on star-prnt', function () {
        let plain = new ReceiptPrinterEncoder({ language: 'star-prnt' }).line('hello').cut().encode();
        let styled = new ReceiptPrinterEncoder({ language: 'star-prnt' }).bold(true).line('hello').cut().encode();

        it('should not append the flush command after the cut, like an unstyled receipt', function () {
            assert.deepEqual(new Uint8Array([ ...STAR_CODEPAGE, ...HELLO, ...NL, ...STAR_CUT, ...NL ]), plain);
            assert.deepEqual(new Uint8Array([ 27, 69, ...STAR_CODEPAGE, ...HELLO, 27, 70, ...NL, ...STAR_CUT, ...NL ]), styled);
        });
    });

    describe('bold(true).line(hello) on star-prnt', function () {
        let styled = new ReceiptPrinterEncoder({ language: 'star-prnt' }).bold(true).line('hello').encode();

        it('should still append the flush command when the receipt does not end in a cut or pulse', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, ...STAR_CODEPAGE, ...HELLO, 27, 70, ...NL, ...STAR_FLUSH, ...NL ]), styled);
        });
    });

    describe('bold(true).image(...).line(hello)', function () {
        let result = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster' }).bold(true).image(image, 8, 8).line('hello').encode();

        it('should not wrap the image in style commands, but style the text after it', function () {
            assert.deepEqual(new Uint8Array([
                29, 118, 48, 0, 1, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...NL,
                27, 69, 1, ...CODEPAGE, ...HELLO, 27, 69, 0, ...NL,
            ]), result);
        });
    });

    describe('bold(true).qrcode(x).line(hello)', function () {
        let plain = new ReceiptPrinterEncoder({ language: 'esc-pos' }).qrcode('x').encode();
        let result = new ReceiptPrinterEncoder({ language: 'esc-pos' }).bold(true).qrcode('x').line('hello').encode();

        it('should not wrap the qr code in style commands, but style the text after it', function () {
            assert.deepEqual(new Uint8Array([ ...plain, 27, 69, 1, ...CODEPAGE, ...HELLO, 27, 69, 0, ...NL ]), result);
        });
    });

    describe('bold(true).raw(...)', function () {
        let result = new ReceiptPrinterEncoder({ language: 'esc-pos' }).bold(true).raw([ 104, 105 ]).encode();

        it('should still wrap raw data in style commands', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 1, 104, 105, 27, 69, 0 ]), result);
        });
    });

    describe('bold(true).table(...)', function () {
        let result = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 }).bold(true).table([ { width: 32, align: 'left' } ], [ [ 'a' ] ]).encode();

        it('should still wrap table rows in style commands', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 1, ...CODEPAGE, 97, ...new Array(31).fill(32), 27, 69, 0, ...NL ]), result);
        });
    });

    describe('bold(true).line(hello).bold(false).line(hello)', function () {
        let result = new ReceiptPrinterEncoder({ language: 'esc-pos' }).bold(true).line('hello').bold(false).line('hello').encode();

        it('should carry the style state to the next text line without a state-only line in between', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 1, ...CODEPAGE, ...HELLO, 27, 69, 0, ...NL, ...HELLO, ...NL ]), result);
        });
    });
});
