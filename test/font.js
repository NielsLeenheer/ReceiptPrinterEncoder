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
