import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert } from 'chai';

/* Calls to text() continue on the same line. A newline character in the text
   ends the current line, text after it continues on the next line. An empty
   text does nothing. */

describe('Newlines in text()', function() {
    const CODEPAGE = [ 27, 116, 0 ];
    const NL = [ 10, 13 ];
    const encode = (fn) => fn(new ReceiptPrinterEncoder({ language: 'esc-pos' })).encode();

    describe("text('')", function () {
        it('should print nothing', function () {
            assert.deepEqual(new Uint8Array([]), encode((e) => e.text('')));
        });
    });

    describe("line('')", function () {
        it('should print a single empty line', function () {
            assert.deepEqual(new Uint8Array([ ...NL ]), encode((e) => e.line('')));
        });
    });

    describe("line('a').line('').line('b')", function () {
        it('should print one empty line between a and b', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...NL, ...NL, 98, ...NL ]), encode((e) => e.line('a').line('').line('b')));
        });
    });

    describe("text('\\n')", function () {
        it('should feed once', function () {
            assert.deepEqual(new Uint8Array([ ...NL ]), encode((e) => e.text('\n')));
        });
    });

    describe("text('a\\n')", function () {
        it('should end the line after a', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...NL ]), encode((e) => e.text('a\n')));
        });
    });

    describe("text('a\\n').text('b')", function () {
        it('should continue on the next line', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...NL, 98, ...NL ]), encode((e) => e.text('a\n').text('b')));
        });
    });

    describe("text('a\\nb')", function () {
        it('should be the same as text(a).newline().text(b)', function () {
            assert.deepEqual(encode((e) => e.text('a').newline().text('b')), encode((e) => e.text('a\nb')));
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...NL, 98, ...NL ]), encode((e) => e.text('a\nb')));
        });
    });

    describe("text('a\\n\\nb')", function () {
        it('should keep the empty line in the middle', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...NL, ...NL, 98, ...NL ]), encode((e) => e.text('a\n\nb')));
        });
    });

    describe("text('a\\r\\nb')", function () {
        it('should treat a carriage return and newline as one line break', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...NL, 98, ...NL ]), encode((e) => e.text('a\r\nb')));
        });
    });

    describe("text('a').text('b\\nc').text('d')", function () {
        it('should print ab on the first line and cd on the second', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, 98, ...NL, 99, 100, ...NL ]), encode((e) => e.text('a').text('b\nc').text('d')));
        });
    });

    describe("text('a').text('b').text('\\n').text('c').text('d')", function () {
        it('should print ab on the first line and cd on the second', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, 98, ...NL, 99, 100, ...NL ]), encode((e) => e.text('a').text('b').text('\n').text('c').text('d')));
        });
    });

    describe("text('a').text('\\nb')", function () {
        it('should print a on the first line and b on the second', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, 97, ...NL, 98, ...NL ]), encode((e) => e.text('a').text('\nb')));
        });
    });

    describe("size(2).line('x').size(1).text('').table(...), the workaround from #30", function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 42 });
        let result = encoder.size(2).line('x').size(1).text('').table([ { width: 42, align: 'left' } ], [ [ 'y' ] ]).encode();

        it('should apply the style change without printing anything for the empty text', function () {
            assert.deepEqual(new Uint8Array([
                29, 33, 17, ...CODEPAGE, 120, 29, 33, 0, ...NL,
                121, ...new Array(41).fill(32), ...NL,
            ]), result);
        });
    });
});
