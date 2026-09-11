import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert } from 'chai';

/* Table cells and boxes inherit the bold, italic, underline and invert styles
   that are active when they are created. Style changes inside a cell only
   apply to that cell. */

describe('Style inheritance in tables and boxes', function() {
    const NL = [ 10, 13 ];
    const CODEPAGE = [ 27, 116, 0 ];
    const BOLD_ON = [ 27, 69, 1 ];
    const BOLD_OFF = [ 27, 69, 0 ];
    const UNDERLINE_ON = [ 27, 45, 1 ];
    const UNDERLINE_OFF = [ 27, 45, 0 ];
    const PAD = new Array(7).fill(32);
    const columns = [ { width: 8, align: 'left' }, { width: 8, align: 'left' }, { width: 8, align: 'left' } ];
    const table = (row, prepare = (e) => e) => prepare(new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 })).table(columns, [ row ]).encode();

    describe('bold(true).table() with plain cells', function () {
        it('should print the whole row in bold', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...CODEPAGE, 97, ...PAD, 98, ...PAD, 99, ...PAD, ...BOLD_OFF, ...NL ]),
                table([ 'a', 'b', 'c' ], (e) => e.bold(true)));
        });
    });

    describe('bold(true).table() with a cell that sets bold(true)', function () {
        it('should be a no-op, the whole row stays bold', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...CODEPAGE, 97, ...PAD, 98, ...PAD, 99, ...PAD, ...BOLD_OFF, ...NL ]),
                table([ 'a', (cell) => cell.bold(true).text('b'), 'c' ], (e) => e.bold(true)));
        });
    });

    describe('bold(true).table() with a cell that sets bold(false)', function () {
        it('should turn bold off for that cell only', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...CODEPAGE, 97, ...PAD, ...BOLD_OFF, 98, ...BOLD_ON, ...PAD, 99, ...PAD, ...BOLD_OFF, ...NL ]),
                table([ 'a', (cell) => cell.bold(false).text('b'), 'c' ], (e) => e.bold(true)));
        });
    });

    describe('bold(true).table() with a cell that toggles bold()', function () {
        it('should toggle relative to the inherited style, so bold is off for that cell only', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...CODEPAGE, 97, ...PAD, ...BOLD_OFF, 98, ...BOLD_ON, ...PAD, 99, ...PAD, ...BOLD_OFF, ...NL ]),
                table([ 'a', (cell) => cell.bold().text('b'), 'c' ], (e) => e.bold(true)));
        });
    });

    describe('bold(true).table() with a cell that sets underline(true)', function () {
        it('should underline that cell and keep the whole row bold', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...CODEPAGE, 97, ...PAD, ...UNDERLINE_ON, 98, ...UNDERLINE_OFF, ...PAD, 99, ...PAD, ...BOLD_OFF, ...NL ]),
                table([ 'a', (cell) => cell.underline(true).text('b'), 'c' ], (e) => e.bold(true)));
        });
    });

    describe('table() without an outer style, with a cell that sets bold(true)', function () {
        it('should print only that cell in bold', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...PAD, ...BOLD_ON, 98, ...BOLD_OFF, ...PAD, 99, ...PAD, ...NL ]),
                table([ 'a', (cell) => cell.bold(true).text('b'), 'c' ]));
        });
    });

    describe('bold(true).table().bold(false).line(x)', function () {
        it('should not leak the style of a cell into the text after the table', function () {
            let result = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 })
                .bold(true).table(columns, [ [ 'a', (cell) => cell.bold(false).text('b'), 'c' ] ]).bold(false).line('x').encode();

            assert.deepEqual(new Uint8Array([
                ...BOLD_ON, ...CODEPAGE, 97, ...PAD, ...BOLD_OFF, 98, ...BOLD_ON, ...PAD, 99, ...PAD, ...BOLD_OFF, ...NL,
                120, ...NL,
            ]), result);
        });
    });

    describe('bold(true).box() with plain content', function () {
        it('should print the box content in bold', function () {
            let result = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 })
                .bold(true).box({ width: 12, style: 'none', align: 'left' }, 'x').encode();

            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...CODEPAGE, 120, ...new Array(11).fill(32), ...BOLD_OFF, ...NL ]), result);
        });
    });

    describe('bold(true).box() with content that sets bold(false)', function () {
        it('should print the content plain and the padding after it bold', function () {
            let result = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 })
                .bold(true).box({ width: 12, style: 'none', align: 'left' }, (box) => box.bold(false).text('x')).encode();

            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 120, ...BOLD_ON, ...new Array(11).fill(32), ...BOLD_OFF, ...NL ]), result);
        });
    });
});
