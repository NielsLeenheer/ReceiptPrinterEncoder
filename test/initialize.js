import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert, expect } from 'chai';

/* The initialize command resets the printer, but the encoder does not re-send
   the code page or font afterwards. It is therefore only allowed as the first
   command of an encoder, and only once. Resetting the printer for another
   receipt needs a new encoder */

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

        it('should be allowed, the code page is sent after initialize', function () {
            assert.deepEqual(new Uint8Array([ ...INITIALIZE, 27, 116, 17, 97, ...NL ]), result);
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

        it('should throw', function () {
            expect(() => encoder.initialize()).to.throw('Initialize must be the first command');
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
