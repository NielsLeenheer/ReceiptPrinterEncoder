import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert, expect } from 'chai';

/* Looking up a font by its size (font('9x17')) dereferenced the result of a
   failed search and crashed with a TypeError when no font had that size */

describe('font() by size', function() {
    describe('font() with a size no font has', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });

        it('should not throw a TypeError', function () {
            expect(() => encoder.font('9x17')).to.not.throw();
        });

        it('should leave the number of columns unchanged', function () {
            assert.equal(encoder.columns, 42);
        });
    });

    describe('font() with a size a font has', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', printerModel: 'epson-tm-t88v' });
        encoder.font('9x17');

        it('should resolve to the font with that size', function () {
            assert.equal(encoder.columns, 56);
        });
    });
});

describe('Alignment padding after a font change', function () {
    let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 });

    describe('font(B).align(center).line(hello)', function () {
        let result = encoder.font('B').align('center').line('hello').encode();

        it('should send the font command before the padding, so the spaces print in font B', function () {
            let font = Array.from(result).findIndex((b, i) => b === 0x1b && result[i + 1] === 0x4d && result[i + 2] === 0x01);
            let space = Array.from(result).indexOf(0x20);

            assert.notEqual(font, -1);
            assert.ok(font < space, 'ESC M 1 must come before the first space');
        });

        it('should pad to the centre in font B columns', function () {
            let spaces = Array.from(result).filter((b) => b === 0x20).length;

            assert.equal(spaces, (56 - 5) >> 1);
        });
    });
});
