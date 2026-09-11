import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert, expect } from 'chai';

/* The overflow property of a column decides what happens with text that does
   not fit on one line of the cell: wrap it (the default), clip it at the edge
   of the column, or clip it and end the line with an ellipsis */

describe('Cell overflow in tables', function() {
    const CODEPAGE = [ 27, 116, 0 ];
    const NL = [ 10, 13 ];
    const spaces = (n) => new Array(n).fill(32);
    const text = (s) => Array.from(s).map((c) => c.charCodeAt(0));
    const encode = (fn, options = {}) => fn(new ReceiptPrinterEncoder(Object.assign({ language: 'esc-pos', columns: 32 }, options))).encode();

    const columns = (overflow) => [ { width: 12, align: 'left', overflow }, { width: 20, align: 'right' } ];
    const same = (overflow, actual, expected) => assert.deepEqual(encode((e) => e.table(columns(overflow), [ actual ])), encode((e) => e.table(columns('wrap'), [ expected ])));

    describe('text that fits the column', function () {
        it('should be the same for every overflow mode', function () {
            for (const overflow of [ undefined, 'wrap', 'clip', 'ellipsis' ]) {
                assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...text('Cappuccino'), ...spaces(2), ...spaces(16), ...text('3,50'), ...NL ]),
                    encode((e) => e.table(columns(overflow), [ [ 'Cappuccino', '3,50' ] ])), String(overflow));
            }
        });
    });

    describe('overflow wrap, the default', function () {
        it('should wrap the text onto a second line', function () {
            assert.deepEqual(new Uint8Array([
                ...CODEPAGE, ...text('Cappuccino'), ...spaces(2), ...spaces(16), ...text('3,50'), ...NL,
                ...text('large'), ...spaces(7), ...spaces(20), ...NL,
            ]), encode((e) => e.table(columns(undefined), [ [ 'Cappuccino large', '3,50' ] ])));
        });
    });

    describe('overflow clip', function () {
        it('should cut the text off at the edge of the column', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...text('Cappuccino l'), ...spaces(16), ...text('3,50'), ...NL ]),
                encode((e) => e.table(columns('clip'), [ [ 'Cappuccino large', '3,50' ] ])));
        });

        it('should drop text that is added after the cut', function () {
            same('clip', [ (c) => c.text('Cappuccino large').text(' and more'), '3,50' ], [ 'Cappuccino l', '3,50' ]);
        });

        it('should drop text that is added when the line is full', function () {
            same('clip', [ (c) => c.text('Cappuccino l').text('arge'), '3,50' ], [ 'Cappuccino l', '3,50' ]);
        });

        it('should still end the line at a newline', function () {
            same('clip', [ 'Cappuccino large\nxy', '3,50' ], [ 'Cappuccino l\nxy', '3,50' ]);
        });

        it('should clip spaces at the edge of the column', function () {
            same('clip', [ 'abc' + ' '.repeat(20) + 'x', '3,50' ], [ 'abc         ', '3,50' ]);
        });

        it('should keep the alignment of the column', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...text('Cappuccino l'), ...spaces(16), ...text('3,50'), ...NL ]),
                encode((e) => e.table([ { width: 12, align: 'right', overflow: 'clip' }, { width: 20, align: 'right' } ], [ [ 'Cappuccino large', '3,50' ] ])));
        });
    });

    describe('overflow ellipsis', function () {
        it('should cut the text off and end with an ellipsis', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...text('Cappuccin...'), ...spaces(16), ...text('3,50'), ...NL ]),
                encode((e) => e.table(columns('ellipsis'), [ [ 'Cappuccino large', '3,50' ] ])));
        });

        it('should not leave a space before the ellipsis', function () {
            same('ellipsis', [ 'The quick brown fox', '3,50' ], [ 'The quick...', '3,50' ]);
            same('ellipsis', [ 'Espresso  doppio', '3,50' ], [ 'Espresso...', '3,50' ]);
        });

        it('should remove characters added before to make room for the ellipsis', function () {
            same('ellipsis', [ (c) => c.text('Cappuccino').text(' large'), '3,50' ], [ 'Cappuccin...', '3,50' ]);
        });

        it('should keep the style of the text that overflows', function () {
            same('ellipsis', [ (c) => c.text('Cappuccino').bold().text(' large'), '3,50' ], [ (c) => c.text('Cappuccin').bold().text('...'), '3,50' ]);
        });

        it('should only add one ellipsis', function () {
            same('ellipsis', [ (c) => c.text('Cappuccino large').text(' and more'), '3,50' ], [ 'Cappuccin...', '3,50' ]);
        });

        it('should not keep spaces before the ellipsis', function () {
            same('ellipsis', [ 'abc' + ' '.repeat(20) + 'x', '3,50' ], [ 'abc...', '3,50' ]);
        });

        it('should still end the line at a newline', function () {
            same('ellipsis', [ 'Cappuccino large\nxy', '3,50' ], [ 'Cappuccin...\nxy', '3,50' ]);
        });

        it('should clip instead when the column is narrower than the ellipsis', function () {
            assert.deepEqual(
                encode((e) => e.table([ { width: 2, overflow: 'ellipsis' }, { width: 30 } ], [ [ 'abc', 'x' ] ])),
                encode((e) => e.table([ { width: 2, overflow: 'clip' }, { width: 30 } ], [ [ 'abc', 'x' ] ])));
        });

        it('should print only the ellipsis when the column is as wide as the ellipsis', function () {
            assert.deepEqual(
                encode((e) => e.table([ { width: 3, overflow: 'ellipsis' }, { width: 29 } ], [ [ 'abcd', 'x' ] ])),
                encode((e) => e.table([ { width: 3 }, { width: 29 } ], [ [ '...', 'x' ] ])));
        });
    });

    describe('overflow at double size', function () {
        it('should measure the text in characters of the current size', function () {
            assert.deepEqual(
                encode((e) => e.size(2).table([ { width: 6, overflow: 'clip' }, { width: 10 } ], [ [ 'abcdefgh', 'x' ] ])),
                encode((e) => e.size(2).table([ { width: 6 }, { width: 10 } ], [ [ 'abcdef', 'x' ] ])));

            assert.deepEqual(
                encode((e) => e.size(2).table([ { width: 6, overflow: 'ellipsis' }, { width: 10 } ], [ [ 'abcdefgh', 'x' ] ])),
                encode((e) => e.size(2).table([ { width: 6 }, { width: 10 } ], [ [ 'abc...', 'x' ] ])));
        });

        it('should make room for the ellipsis when the size changes inside the cell', function () {
            assert.deepEqual(
                encode((e) => e.table([ { width: 12, overflow: 'ellipsis' }, { width: 20 } ], [ [ (c) => c.text('abcdefghij').size(2).text('klm'), 'x' ] ])),
                encode((e) => e.table([ { width: 12 }, { width: 20 } ], [ [ (c) => c.text('abcdef').size(2).text('...'), 'x' ] ])));
        });
    });

    describe('overflow with a fill column', function () {
        it('should clip at the resolved width', function () {
            assert.deepEqual(
                encode((e) => e.table([ { overflow: 'ellipsis' }, { width: 10, align: 'right' } ], [ [ 'The quick brown fox jumps over', '3,50' ] ])),
                encode((e) => e.table([ { width: 22 }, { width: 10, align: 'right' } ], [ [ 'The quick brown fox...', '3,50' ] ])));
        });
    });

    describe('an invalid overflow', function () {
        it('should throw', function () {
            expect(function () {
                encode((e) => e.table([ { width: 12, overflow: 'hidden' }, { width: 20 } ], [ [ 'a', 'b' ] ]));
            }).to.throw('Column overflow must be wrap, clip or ellipsis');
        });
    });
});
