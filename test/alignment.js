import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert } from 'chai';

/* The initialize command resets the printer, so it must not be sent after the
   spaces used for alignment, see #57 */

describe('Alignment on the first line', function() {
    const INIT = [ 27, 64, 28, 46, 27, 77, 0 ];
    const CODEPAGE = [ 27, 116, 0 ];
    const HELLO = [ 104, 101, 108, 108, 111 ];
    const NL = [ 10, 13 ];
    const spaces = (n) => new Array(n).fill(32);

    describe('initialize().align(center).line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.initialize().align('center').line('hello').encode();

        it('should send the initialize command before the alignment spaces', function () {
            assert.deepEqual(new Uint8Array([ ...INIT, ...CODEPAGE, ...spaces(18), ...HELLO, ...NL ]), result);
        });
    });

    describe('initialize().align(right).line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.initialize().align('right').line('hello').encode();

        it('should send the initialize command before the alignment spaces', function () {
            assert.deepEqual(new Uint8Array([ ...INIT, ...CODEPAGE, ...spaces(37), ...HELLO, ...NL ]), result);
        });
    });

    describe('initialize().align(center).line(hello).align(right).line(again)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.initialize().align('center').line('hello').align('right').line('again').encode();

        it('should align both lines, as in the report', function () {
            assert.deepEqual(new Uint8Array([ ...INIT, ...CODEPAGE, ...spaces(18), ...HELLO, ...NL, ...spaces(37), 97, 103, 97, 105, 110, ...NL ]), result);
        });
    });

    describe('initialize().align(center).bold(true).line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.initialize().align('center').bold(true).line('hello').encode();

        it('should send the initialize command before the alignment spaces and styles', function () {
            assert.deepEqual(new Uint8Array([ ...INIT, ...spaces(18), 27, 69, 1, ...CODEPAGE, ...HELLO, 27, 69, 0, ...NL ]), result);
        });
    });

    describe('initialize().line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.initialize().line('hello').encode();

        it('should produce the same bytes as before, without a line feed after initialize', function () {
            assert.deepEqual(new Uint8Array([ ...INIT, ...CODEPAGE, ...HELLO, ...NL ]), result);
        });
    });

    describe('initialize().align(center).line(hello) on star-prnt', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.initialize().align('center').line('hello').encode();

        it('should send the initialize command before the alignment spaces', function () {
            assert.deepEqual(new Uint8Array([ 27, 64, 24, 27, 29, 116, 0, ...spaces(21), ...HELLO, ...NL ]), result);
        });
    });
});
