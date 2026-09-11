import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert, expect } from 'chai';

/* A column without a width, or with a width of 'auto', is a fill column that
   takes the space left over by the fixed columns and the margins */

describe('Fill columns in tables', function() {
    const CODEPAGE = [ 27, 116, 0 ];
    const NL = [ 10, 13 ];
    const spaces = (n) => new Array(n).fill(32);
    const encode = (fn, options = {}) => fn(new ReceiptPrinterEncoder(Object.assign({ language: 'esc-pos', columns: 42 }, options))).encode();

    describe('table() with a column without a width and a column of 10', function () {
        it('should give the first column the remaining 32 characters', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...spaces(31), ...spaces(9), 98, ...NL ]),
                encode((e) => e.table([ { align: 'left' }, { width: 10, align: 'right' } ], [ [ 'a', 'b' ] ])));
        });
    });

    describe('table() with a column with width auto and a column of 10', function () {
        it('should be the same as a column without a width', function () {
            assert.deepEqual(
                encode((e) => e.table([ { width: 'auto', align: 'left' }, { width: 10, align: 'right' } ], [ [ 'a', 'b' ] ])),
                encode((e) => e.table([ { width: 32, align: 'left' }, { width: 10, align: 'right' } ], [ [ 'a', 'b' ] ])));
        });
    });

    describe('table() with a fill column with a margin', function () {
        it('should subtract the margins of all columns from the fill column', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...spaces(29), ...spaces(2), ...spaces(9), 98, ...NL ]),
                encode((e) => e.table([ { width: 'auto', marginRight: 2, align: 'left' }, { width: 10, align: 'right' } ], [ [ 'a', 'b' ] ])));
        });
    });

    describe('table() with a fill column and a fixed column with margins', function () {
        it('should be the same as the explicit width', function () {
            assert.deepEqual(
                encode((e) => e.table([ { align: 'left' }, { width: 10, marginLeft: 1, marginRight: 1, align: 'right' } ], [ [ 'a', 'b' ] ])),
                encode((e) => e.table([ { width: 30, align: 'left' }, { width: 10, marginLeft: 1, marginRight: 1, align: 'right' } ], [ [ 'a', 'b' ] ])));
        });
    });

    describe('table() with two fill columns and a column of 5 on 32 columns', function () {
        it('should divide the remaining 27 characters as 14 and 13', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...spaces(13), 98, ...spaces(12), 99, ...spaces(4), ...NL ]),
                encode((e) => e.table([ {}, {}, { width: 5 } ], [ [ 'a', 'b', 'c' ] ]), { columns: 32 }));
        });
    });

    describe('table() with only fill columns', function () {
        it('should divide the whole paper evenly', function () {
            assert.deepEqual(
                encode((e) => e.table([ {}, {}, {} ], [ [ 'a', 'b', 'c' ] ])),
                encode((e) => e.table([ { width: 14 }, { width: 14 }, { width: 14 } ], [ [ 'a', 'b', 'c' ] ])));
        });
    });

    describe('table() with a fill column that wraps', function () {
        it('should wrap the text at the resolved width', function () {
            assert.deepEqual(
                encode((e) => e.table([ { align: 'left' }, { width: 10, align: 'right' } ], [ [ 'The quick brown fox jumps over the lazy dog', 'b' ] ])),
                encode((e) => e.table([ { width: 32, align: 'left' }, { width: 10, align: 'right' } ], [ [ 'The quick brown fox jumps over the lazy dog', 'b' ] ])));
        });
    });

    describe('size(2).table() with a fill column', function () {
        it('should measure the fill column in characters of the current size', function () {
            assert.deepEqual(
                encode((e) => e.size(2).table([ { align: 'left' }, { width: 6, align: 'right' } ], [ [ 'a', 'b' ] ])),
                encode((e) => e.size(2).table([ { width: 15, align: 'left' }, { width: 6, align: 'right' } ], [ [ 'a', 'b' ] ])));
        });
    });

    describe('font(B).table() with a fill column', function () {
        it('should use the number of columns of the current font', function () {
            assert.deepEqual(
                encode((e) => e.font('B').table([ { align: 'left' }, { width: 10, align: 'right' } ], [ [ 'a', 'b' ] ])),
                encode((e) => e.font('B').table([ { width: 46, align: 'left' }, { width: 10, align: 'right' } ], [ [ 'a', 'b' ] ])));
        });
    });

    describe('table() with a fill column inside a box', function () {
        it('should fill the inner width of the box', function () {
            assert.deepEqual(
                encode((e) => e.box({ width: 30, align: 'left' }, (b) => b.table([ { align: 'left' }, { width: 8, align: 'right' } ], [ [ 'a', 'b' ] ]))),
                encode((e) => e.box({ width: 30, align: 'left' }, (b) => b.table([ { width: 20, align: 'left' }, { width: 8, align: 'right' } ], [ [ 'a', 'b' ] ]))));
        });
    });

    describe('table() with a fill column and fixed columns that leave one character', function () {
        it('should give the fill column one character', function () {
            assert.deepEqual(
                encode((e) => e.table([ { width: 41, align: 'left' }, {} ], [ [ 'a', 'b' ] ])),
                encode((e) => e.table([ { width: 41, align: 'left' }, { width: 1 } ], [ [ 'a', 'b' ] ])));
        });
    });

    describe('table() with a fill column and fixed columns that fill the paper', function () {
        it('should throw, a fill column needs at least one character', function () {
            expect(function () {
                encode((e) => e.table([ { width: 42, align: 'left' }, {} ], [ [ 'a', 'b' ] ]));
            }).to.throw('Table is too wide');
        });
    });

    describe('table() with two fill columns and fixed columns that leave one character', function () {
        it('should throw, every fill column needs at least one character', function () {
            expect(function () {
                encode((e) => e.table([ { width: 41, align: 'left' }, {}, {} ], [ [ 'a', 'b', 'c' ] ]));
            }).to.throw('Table is too wide');
        });
    });

    describe('table() with a fill column and fixed columns wider than the paper', function () {
        it('should throw', function () {
            expect(function () {
                encode((e) => e.table([ { width: 30, align: 'left' }, {}, { width: 20 } ], [ [ 'a', 'b', 'c' ] ]));
            }).to.throw('Table is too wide');
        });
    });

    describe('table() with an invalid width', function () {
        it('should still throw for widths that are not a positive integer or auto', function () {
            for (const width of [ 0, -1, 1.5, NaN, 'wide', null ]) {
                expect(function () {
                    encode((e) => e.table([ { width }, { width: 10 } ], [ [ 'a', 'b' ] ]));
                }, `width ${width}`).to.throw('Column width must be a positive integer, or auto');
            }
        });
    });

    describe('table() without columns', function () {
        it('should throw', function () {
            expect(function () {
                encode((e) => e.table([], [ [] ]));
            }).to.throw('A table needs at least one column');
        });
    });
});
