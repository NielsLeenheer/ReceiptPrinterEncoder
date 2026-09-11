import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert } from 'chai';

/* Style commands that set a property to the value the printer already has are
   left out. Every line starts in the default style. */

describe('Redundant style commands', function() {
    const NL = [ 10, 13 ];
    const CODEPAGE = [ 27, 116, 0 ];
    const BOLD_ON = [ 27, 69, 1 ];
    const BOLD_OFF = [ 27, 69, 0 ];
    const UNDERLINE_ON = [ 27, 45, 1 ];
    const UNDERLINE_OFF = [ 27, 45, 0 ];
    const SIZE2 = [ 29, 33, 17 ];
    const SIZE1 = [ 29, 33, 0 ];
    const encode = (fn) => fn(new ReceiptPrinterEncoder({ language: 'esc-pos' })).encode();

    describe("bold(true).line(x).bold(false).line(y)", function () {
        it('should not restore and reset bold at the start of the second line', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...CODEPAGE, 120, ...BOLD_OFF, ...NL, 121, ...NL ]),
                encode((e) => e.bold(true).line('x').bold(false).line('y')));
        });
    });

    describe("size(2).line(x).size(1).line(y)", function () {
        it('should not send the default size at the start of the second line', function () {
            assert.deepEqual(new Uint8Array([ ...SIZE2, ...CODEPAGE, 120, ...SIZE1, ...NL, 121, ...NL ]),
                encode((e) => e.size(2).line('x').size(1).line('y')));
        });
    });

    describe("bold(true).line(x).underline(true).line(y)", function () {
        it('should restore bold and set underline on the second line', function () {
            assert.deepEqual(new Uint8Array([
                ...BOLD_ON, ...CODEPAGE, 120, ...BOLD_OFF, ...NL,
                ...BOLD_ON, ...UNDERLINE_ON, 121, ...BOLD_OFF, ...UNDERLINE_OFF, ...NL,
            ]), encode((e) => e.bold(true).line('x').underline(true).line('y')));
        });
    });

    describe("text(a).bold(true).bold(false).text(b)", function () {
        it('should not send style commands that cancel each other', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, 98, ...NL ]),
                encode((e) => e.text('a').bold(true).bold(false).text('b')));
        });
    });

    describe("bold(true).text(a).bold(false).text(b)", function () {
        it('should keep style changes between text', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...CODEPAGE, 97, ...BOLD_OFF, 98, ...NL ]),
                encode((e) => e.bold(true).text('a').bold(false).text('b')));
        });
    });

    describe("size(2).text(a).size(1).text(b)", function () {
        it('should keep size changes between text', function () {
            assert.deepEqual(new Uint8Array([ ...SIZE2, ...CODEPAGE, 97, ...SIZE1, 98, ...NL ]),
                encode((e) => e.size(2).text('a').size(1).text('b')));
        });
    });

    describe("width(2).height(2).text(a)", function () {
        it('should collapse consecutive size changes into one', function () {
            assert.deepEqual(new Uint8Array([ ...SIZE2, ...CODEPAGE, 97, ...SIZE1, ...NL ]),
                encode((e) => e.width(2).height(2).text('a')));
        });
    });

    describe("bold(true).bold(false).bold(true).text(a)", function () {
        it('should collapse consecutive bold changes into the last one', function () {
            assert.deepEqual(new Uint8Array([ ...BOLD_ON, ...CODEPAGE, 97, ...BOLD_OFF, ...NL ]),
                encode((e) => e.bold(true).bold(false).bold(true).text('a')));
        });
    });

    describe("bold(true).table(...) with a bold cell", function () {
        let result = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 })
            .bold(true)
            .table([ { width: 16, align: 'left' }, { width: 16, align: 'left' } ], [ [ (cell) => cell.bold(true).text('a'), 'b' ] ])
            .encode();

        it('should not repeat bold inside the cell, the cell inherits it', function () {
            assert.deepEqual(new Uint8Array([
                ...BOLD_ON, ...CODEPAGE, 97, ...new Array(15).fill(32), 98, ...new Array(15).fill(32), ...BOLD_OFF, ...NL,
            ]), result);
        });
    });
});
