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

        it('should print the table at double width', function () {
            assert.deepEqual(new Uint8Array([ 29, 33, 17, ...CODEPAGE, 97, ...spaces(14), ...spaces(5), 98, 29, 33, 0, ...NL, 29, 33, 0 ]), result);
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
