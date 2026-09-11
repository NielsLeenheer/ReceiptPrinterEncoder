import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert, expect } from 'chai';

/* The initialize command resets both the printer and the encoder to a clean
   slate: no code page, no styles, default font and alignment. It marks the
   start of a receipt, so it is only allowed as the first command, or right
   after an encode(). Calling encode() drains the buffer, but keeps the state
   for the next chunk of the receipt */

describe('initialize()', function() {
    const NL = [ 10, 13 ];
    const INITIALIZE = [ 27, 64, 28, 46, 27, 77, 0 ];
    const CODEPAGE = [ 27, 116, 0 ];

    describe('initialize() as the first command', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.initialize().text('a').encode();

        it('should send the initialize commands before the text', function () {
            assert.deepEqual(new Uint8Array([ ...INITIALIZE, ...CODEPAGE, 97, ...NL ]), result);
        });
    });

    describe('codepage().initialize()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.codepage('cp866').initialize().text('a').encode();

        it('should be allowed, the code page is reset by initialize', function () {
            assert.deepEqual(new Uint8Array([ ...INITIALIZE, ...CODEPAGE, 97, ...NL ]), result);
        });
    });

    describe('text().initialize()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });

        it('should throw', function () {
            expect(() => encoder.text('a').initialize()).to.throw('Initialize must be the first command');
        });
    });

    describe('line().initialize()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });

        it('should throw', function () {
            expect(() => encoder.line('a').initialize()).to.throw('Initialize must be the first command');
        });
    });

    describe('font().initialize()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });

        it('should throw', function () {
            expect(() => encoder.font('B').initialize()).to.throw('Initialize must be the first command');
        });
    });

    describe('bold().initialize()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });

        it('should throw', function () {
            expect(() => encoder.bold(true).initialize()).to.throw('Initialize must be the first command');
        });
    });

    describe('initialize().initialize()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });

        it('should throw', function () {
            expect(() => encoder.initialize().initialize()).to.throw('Initialize must be the first command');
        });
    });

    describe('initialize() after a previous encode()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        encoder.text('a').encode();
        let result = encoder.initialize().text('b').encode();

        it('should be allowed and start a new receipt from a clean slate', function () {
            assert.deepEqual(new Uint8Array([ ...INITIALIZE, ...CODEPAGE, 98, ...NL ]), result);
        });
    });

    describe('initialize() after a previous encode() resets the styles', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        encoder.bold(true).line('a').encode();
        let result = encoder.initialize().line('b').encode();

        it('should not keep the style for the next receipt', function () {
            assert.deepEqual(new Uint8Array([ ...INITIALIZE, ...CODEPAGE, 98, ...NL ]), result);
        });
    });

    describe('encode() keeps the state for the next chunk', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let first = encoder.codepage('cp866').text('a').encode();
        let second = encoder.text('b').encode();

        it('should not send the code page again for the second chunk', function () {
            assert.deepEqual(new Uint8Array([ 27, 116, 17, 97, ...NL ]), first);
            assert.deepEqual(new Uint8Array([ 98, ...NL ]), second);
        });
    });

    describe('initialize() on star-prnt as the first command', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.initialize().text('a').encode();

        it('should send the initialize command before the text', function () {
            assert.deepEqual(new Uint8Array([ 27, 64, 24, 27, 29, 116, 0, 97, ...NL ]), result);
        });
    });
});
