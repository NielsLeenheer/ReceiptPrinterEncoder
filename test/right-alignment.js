import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert } from 'chai';

/* A right aligned line drops one trailing space of the text, so that the text
   ends at the edge of the paper. The padding of table cells and boxes is part
   of the layout and is never trimmed. */

describe('Right alignment', function() {
    const NL = [ 10, 13 ];
    const CODEPAGE = [ 27, 116, 0 ];
    const SIZE2 = [ 29, 33, 17 ];
    const SIZE1 = [ 29, 33, 0 ];
    const WIDTH1_HEIGHT2 = [ 29, 33, 1 ];
    const spaces = (n) => new Array(n).fill(32);
    const encode = (fn, columns = 32) => fn(new ReceiptPrinterEncoder({ language: 'esc-pos', columns })).encode();

    describe("align(right).line('ab ')", function () {
        it('should trim the trailing space of the text', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...spaces(30), 97, 98, ...NL ]), encode((e) => e.align('right').line('ab ')));
        });
    });

    describe('align(right).table() as wide as the paper', function () {
        it('should not shift the row, the padding of the last cell is kept', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...spaces(15), 98, ...spaces(15), ...NL ]),
                encode((e) => e.align('right').table([ { width: 16, align: 'left' }, { width: 16, align: 'left' } ], [ [ 'a', 'b' ] ])));
        });
    });

    describe('align(right).table() of 20 characters on 32 columns', function () {
        it('should pad the row on the left by the remaining columns', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...spaces(12), 97, ...spaces(9), 98, ...spaces(9), ...NL ]),
                encode((e) => e.align('right').table([ { width: 10, align: 'left' }, { width: 10, align: 'left' } ], [ [ 'a', 'b' ] ])));
        });
    });

    describe('size(2).align(right).table() of 20 characters on 42 columns', function () {
        it('should pad the row on the left by the remaining columns of the paper', function () {
            assert.deepEqual(new Uint8Array([
                ...spaces(2), ...SIZE2, ...CODEPAGE, 97, ...WIDTH1_HEIGHT2, ...spaces(18), ...SIZE2, 98, ...WIDTH1_HEIGHT2, ...spaces(18), ...SIZE1, ...NL,
            ]), encode((e) => e.size(2).align('right').table([ { width: 10, align: 'left' }, { width: 10, align: 'left' } ], [ [ 'a', 'b' ] ]), 42));
        });
    });

    describe('align(right).box() with a right margin', function () {
        it('should keep the margin', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...spaces(20), 104, 105, ...spaces(8), ...spaces(2), ...NL ]),
                encode((e) => e.align('right').box({ width: 10, style: 'none', align: 'left', marginRight: 2 }, 'hi')));
        });
    });

    describe("align(right).line('ab ').table()", function () {
        it('should trim the text line and not the table row', function () {
            assert.deepEqual(new Uint8Array([
                ...CODEPAGE, ...spaces(30), 97, 98, ...NL,
                ...spaces(22), 99, ...spaces(9), ...NL,
            ]), encode((e) => e.align('right').line('ab ').table([ { width: 10, align: 'left' } ], [ [ 'c' ] ])));
        });
    });
});
