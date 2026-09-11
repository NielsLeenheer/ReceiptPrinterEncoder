import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import LineComposer from '../src/line-composer.js';
import { assert, expect } from 'chai';

/* A table wider than the paper crashed with a RangeError when centered and
   overflowed silently when left aligned, see #62 and #59 */

describe('Table width', function() {
    const CODEPAGE = [ 27, 116, 0 ];
    const NL = [ 10, 13 ];
    const spaces = (n) => new Array(n).fill(32);

    describe('table() as wide as the paper', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 });
        let result = encoder.table([ { width: 20, align: 'left' }, { width: 22, align: 'right' } ], [ [ 'a', 'b' ] ]).encode();

        it('should fill the line', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...spaces(19), ...spaces(21), 98, ...NL ]), result);
        });
    });

    describe('table() with margins as wide as the paper', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 });
        let result = encoder.table([ { width: 20, marginRight: 2, align: 'left' }, { width: 18, marginLeft: 2, align: 'right' } ], [ [ 'a', 'b' ] ]).encode();

        it('should fill the line', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...spaces(19), ...spaces(2), ...spaces(2), ...spaces(17), 98, ...NL ]), result);
        });
    });

    describe('align(center).bold(true).line(...).table() wider than the paper, as in #62', function () {
        it('should throw a descriptive error instead of a RangeError', function () {
            expect(function () {
                new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 })
                    .align('center').bold(true).line('--------')
                    .table([
                        { width: 20, align: 'left' },
                        { width: 6, align: 'left' },
                        { width: 20, align: 'right' },
                    ], [ [ 'a', 'b', 'c' ] ]);
            }).to.throw('Table is too wide');
        });
    });

    describe('table() one column wider than the paper, left aligned', function () {
        it('should throw instead of overflowing silently', function () {
            expect(function () {
                new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 })
                    .table([ { width: 20, align: 'left' }, { width: 23, align: 'right' } ], [ [ 'a', 'b' ] ]);
            }).to.throw('Table is too wide');
        });
    });

    describe('table() with margins wider than the paper', function () {
        it('should include the margins in the width', function () {
            expect(function () {
                new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 })
                    .table([ { width: 20, marginRight: 3, align: 'left' }, { width: 20, align: 'right' } ], [ [ 'a', 'b' ] ]);
            }).to.throw('Table is too wide');
        });
    });

    describe('size(2).table() wider than half the paper, as in #59', function () {
        it('should include the character width in the width', function () {
            expect(function () {
                new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 })
                    .size(2)
                    .table([ { width: 16, align: 'left' }, { width: 6, align: 'right' } ], [ [ 'a', 'b' ] ]);
            }).to.throw('Table is too wide');
        });
    });

    describe('size(2).table() that fits half the paper', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 });
        let result = encoder.size(2).table([ { width: 15, align: 'left' }, { width: 6, align: 'right' } ], [ [ 'a', 'b' ] ]).encode();

        it('should print the table at double width, padded with single width spaces', function () {
            assert.deepEqual(new Uint8Array([
                29, 33, 17, ...CODEPAGE, 97, 29, 33, 1, ...spaces(28), ...spaces(10), 29, 33, 17, 98, 29, 33, 0, ...NL,
            ]), result);
        });
    });

    describe('width(2).table() that fits half the paper', function () {
        it('should use the character width, not the height', function () {
            expect(function () {
                new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 })
                    .height(2)
                    .table([ { width: 20, align: 'left' }, { width: 22, align: 'right' } ], [ [ 'a', 'b' ] ]);
            }).to.not.throw();
        });
    });
});

describe('Character width inside table cells', function() {
    const CODEPAGE = [ 27, 116, 0 ];
    const SIZE2 = [ 29, 33, 17 ];
    const WIDTH2 = [ 29, 33, 16 ];
    const HEIGHT2 = [ 29, 33, 1 ];
    const RESET = [ 29, 33, 0 ];
    const NL = [ 10, 13 ];
    const spaces = (n) => new Array(n).fill(32);
    const text = (s) => Array.from(s).map((c) => c.charCodeAt(0));

    describe('size(2) inside a cell of width 10', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
        let result = encoder.table(
            [ { width: 10, align: 'left' }, { width: 2, align: 'left' }, { width: 20, align: 'left' } ],
            [ [ (cell) => cell.size(2).text('abcdefghijkl'), '', 'next column' ] ],
        ).encode();

        it('should wrap after 5 characters and keep the other columns aligned', function () {
            assert.deepEqual(new Uint8Array([
                ...SIZE2, ...CODEPAGE, ...text('abcde'), ...RESET, ...spaces(2), ...text('next column'), ...spaces(9), ...NL,
                ...SIZE2, ...text('fghij'), ...RESET, ...spaces(22), ...NL,
                ...SIZE2, ...text('kl'), ...RESET, ...spaces(6), ...spaces(22), ...NL,
            ]), result);
        });
    });

    describe('size(2) inside a right aligned cell of width 10', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
        let result = encoder.table(
            [ { width: 10, align: 'right' }, { width: 22, align: 'left' } ],
            [ [ (cell) => cell.size(2).text('abc'), 'next' ] ],
        ).encode();

        it('should pad with single width spaces', function () {
            assert.deepEqual(new Uint8Array([
                ...spaces(4), ...SIZE2, ...CODEPAGE, ...text('abc'), ...RESET, ...text('next'), ...spaces(18), ...NL,
            ]), result);
        });
    });

    describe('width(2) inside a centered cell of width 10', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
        let result = encoder.table(
            [ { width: 10, align: 'center' }, { width: 22, align: 'left' } ],
            [ [ (cell) => cell.width(2).text('abc'), 'next' ] ],
        ).encode();

        it('should pad with single width spaces on both sides', function () {
            assert.deepEqual(new Uint8Array([
                ...spaces(2), ...WIDTH2, ...CODEPAGE, ...text('abc'), ...RESET, ...spaces(2), ...text('next'), ...spaces(18), ...NL,
            ]), result);
        });
    });

    describe('mixed widths inside a cell of width 10', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
        let result = encoder.table(
            [ { width: 10, align: 'left' }, { width: 22, align: 'left' } ],
            [ [ (cell) => cell.text('ab').size(2).text('cde').size(1).text('fghij'), 'next' ] ],
        ).encode();

        it('should count every character at its own width', function () {
            assert.deepEqual(new Uint8Array([
                ...CODEPAGE, ...text('ab'), ...SIZE2, ...text('cde'), ...RESET, ...spaces(2), ...text('next'), ...spaces(18), ...NL,
                ...text('fghij'), ...spaces(5), ...spaces(22), ...NL,
            ]), result);
        });
    });

    describe('height(2) inside a cell of width 10', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
        let result = encoder.table(
            [ { width: 10, align: 'left' }, { width: 22, align: 'left' } ],
            [ [ (cell) => cell.height(2).text('abcdefghijkl'), 'next' ] ],
        ).encode();

        it('should wrap after 10 characters, height does not affect the width', function () {
            assert.deepEqual(new Uint8Array([
                ...HEIGHT2, ...CODEPAGE, ...text('abcdefghij'), ...RESET, ...text('next'), ...spaces(18), ...NL,
                ...HEIGHT2, ...text('kl'), ...RESET, ...spaces(8), ...spaces(22), ...NL,
            ]), result);
        });
    });

    describe('size(2) before the table, columns of 5 and 11 characters on 32 columns', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
        let result = encoder.size(2).table(
            [ { width: 5, align: 'left' }, { width: 11, align: 'right' } ],
            [ [ 'abcdefg', '10,00' ] ],
        ).encode();

        it('should wrap after 5 characters and print the row at double width', function () {
            assert.deepEqual(new Uint8Array([
                ...SIZE2, ...CODEPAGE, ...text('abcde'), ...HEIGHT2, ...spaces(12), ...SIZE2, ...text('10,00'), ...RESET, ...NL,
                ...SIZE2, ...text('fg'), ...HEIGHT2, ...spaces(6), ...spaces(22), ...RESET, ...NL,
            ]), result);
        });
    });
});

describe('LineComposer with content wider than the line', function() {
    for (const align of [ 'left', 'center', 'right' ]) {
        describe(`align ${align}, embedded`, function () {
            const lines = [];
            const composer = new LineComposer({ embedded: true, columns: 10, align, size: 1, callback: (line) => lines.push(line) });
            composer.add({ type: 'text', value: 'x'.repeat(12), codepage: null }, 12);
            composer.flush();

            it('should not produce negative padding', function () {
                assert.equal(lines.length, 1);
                assert.deepEqual(lines[0], [ { type: 'text', value: 'x'.repeat(12), codepage: null } ]);
            });
        });

        describe(`align ${align}, not embedded`, function () {
            const lines = [];
            const composer = new LineComposer({ embedded: false, columns: 10, align, size: 1, callback: (line) => lines.push(line) });
            composer.add({ type: 'text', value: 'x'.repeat(12), codepage: null }, 12);
            composer.flush();

            it('should not produce negative padding', function () {
                assert.equal(lines.length, 1);
                assert.deepEqual(lines[0], [ { type: 'text', value: 'x'.repeat(12), codepage: null } ]);
            });
        });
    }
});
