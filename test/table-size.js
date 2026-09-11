import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert } from 'chai';

/* Column widths are in characters of the size active when the table is created.
   Cells inherit that size, a size change inside a cell changes how many
   characters fit, and padding is always printed in single width spaces. */

describe('Size inheritance in tables and boxes', function() {
    const NL = [ 10, 13 ];
    const CODEPAGE = [ 27, 116, 0 ];
    const SIZE2 = [ 29, 33, 17 ];
    const SIZE1 = [ 29, 33, 0 ];
    const WIDTH1_HEIGHT2 = [ 29, 33, 1 ];
    const spaces = (n) => new Array(n).fill(32);
    const text = (s) => Array.from(s).map((c) => c.charCodeAt(0));
    const encode = (fn, columns = 32) => fn(new ReceiptPrinterEncoder({ language: 'esc-pos', columns })).encode();

    describe('size(2), a centered column of 9 with 8 characters', function () {
        it('should pad with one single width space on each side', function () {
            assert.deepEqual(new Uint8Array([
                ...WIDTH1_HEIGHT2, 32, ...SIZE2, ...CODEPAGE, ...text('12345678'), ...WIDTH1_HEIGHT2, 32,
                ...SIZE2, 120, ...WIDTH1_HEIGHT2, ...spaces(12), ...SIZE1, ...NL,
            ]), encode((e) => e.size(2).table([ { width: 9, align: 'center' }, { width: 7, align: 'left' } ], [ [ '12345678', 'x' ] ])));
        });
    });

    describe('size(2), a column of 10 with 10 characters', function () {
        it('should fit 10 double width characters', function () {
            assert.deepEqual(new Uint8Array([
                ...SIZE2, ...CODEPAGE, ...text('abcdefghij'), 120, ...WIDTH1_HEIGHT2, ...spaces(10), ...SIZE1, ...NL,
            ]), encode((e) => e.size(2).table([ { width: 10, align: 'left' }, { width: 6, align: 'left' } ], [ [ 'abcdefghij', 'x' ] ])));
        });
    });

    describe('size(2), a column of 10 with a cell that sets size(1)', function () {
        it('should fit 20 single width characters', function () {
            assert.deepEqual(new Uint8Array([
                ...CODEPAGE, ...text('abcdefghijklmnopqrst'), ...SIZE2, 120, ...WIDTH1_HEIGHT2, ...spaces(10), ...SIZE1, ...NL,
            ]), encode((e) => e.size(2).table([ { width: 10, align: 'left' }, { width: 6, align: 'left' } ], [ [ (cell) => cell.size(1).text('abcdefghijklmnopqrst'), 'x' ] ])));
        });
    });

    describe('size(2), a cell with double and single width text', function () {
        it('should count every character at its own width', function () {
            assert.deepEqual(new Uint8Array([
                ...SIZE2, ...CODEPAGE, ...text('ab'), ...SIZE1, ...text('cd'), ...WIDTH1_HEIGHT2, ...spaces(12),
                ...SIZE2, 120, ...WIDTH1_HEIGHT2, ...spaces(12), ...SIZE1, ...NL,
            ]), encode((e) => e.size(2).table([ { width: 9, align: 'left' }, { width: 7, align: 'left' } ], [ [ (cell) => cell.text('ab').size(1).text('cd'), 'x' ] ])));
        });
    });

    describe('size(2).align(center), a table of 20 characters on 42 columns', function () {
        it('should center the row by its width in paper columns', function () {
            assert.deepEqual(new Uint8Array([
                32, ...SIZE2, ...CODEPAGE, 97, ...WIDTH1_HEIGHT2, ...spaces(18), ...SIZE2, 98, ...WIDTH1_HEIGHT2, ...spaces(18), ...SIZE1, ...NL,
            ]), encode((e) => e.size(2).align('center').table([ { width: 10, align: 'left' }, { width: 10, align: 'left' } ], [ [ 'a', 'b' ] ]), 42));
        });
    });

    describe('size(2), a shorter cell next to a two line cell', function () {
        it('should pad the shorter cell in single width spaces', function () {
            assert.deepEqual(new Uint8Array([
                ...SIZE2, ...CODEPAGE, 97, ...WIDTH1_HEIGHT2, ...spaces(14), ...SIZE2, 120, ...WIDTH1_HEIGHT2, ...spaces(14), ...SIZE1, ...NL,
                ...SIZE2, 98, ...WIDTH1_HEIGHT2, ...spaces(30), ...SIZE1, ...NL,
            ]), encode((e) => e.size(2).table([ { width: 8, align: 'left' }, { width: 8, align: 'left' } ], [ [ (cell) => cell.text('a\nb'), 'x' ] ])));
        });
    });

    describe('size(2), a table wider than the paper', function () {
        it('should still throw', function () {
            assert.throws(() => encode((e) => e.size(2).table([ { width: 17, align: 'left' } ], [ [ 'a' ] ])), 'Table is too wide');
        });
    });

    describe('size(2), a box of 16 with a border', function () {
        it('should draw the borders at double width and pad the content in single width', function () {
            let result = encode((e) => e.size(2).box({ width: 16, style: 'none', align: 'left' }, 'hi'));

            assert.deepEqual(new Uint8Array([
                ...SIZE2, ...CODEPAGE, ...text('hi'), ...WIDTH1_HEIGHT2, ...spaces(28), ...SIZE1, ...NL,
            ]), result);
        });
    });

    describe('size(2), a box wider than the paper', function () {
        it('should still throw', function () {
            assert.throws(() => encode((e) => e.size(2).box({ width: 17, style: 'none', align: 'left' }, 'a')), 'Box is too wide');
        });
    });

    describe('a table at size 1 with a centered column', function () {
        it('should pad with plain spaces, without size commands', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...text('12345678'), 32, 120, ...spaces(6), ...NL ]),
                encode((e) => e.table([ { width: 9, align: 'center' }, { width: 7, align: 'left' } ], [ [ '12345678', 'x' ] ])));
        });
    });
});
