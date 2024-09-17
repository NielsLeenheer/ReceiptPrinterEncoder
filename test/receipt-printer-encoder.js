import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { assert, expect } from 'chai';

describe('ReceiptPrinterEncoder', function() {

    describe('ReceiptPrinterEncoder({ language: unknown })', function () {
        it('should throw an "Language not supported" error', function () {
            expect(function(){
                new ReceiptPrinterEncoder({ language: 'unknown' });
            }).to.throw('The specified language is not supported');
        });
    });

    
    let escposencoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });

    describe('ReceiptPrinterEncoder({ language: esc-pos })', function () {
        it('should be .language == esc-pos', function () {
            assert.deepEqual('esc-pos', escposencoder.language);
        });
    });


    let starprntencoder = new ReceiptPrinterEncoder({ language: 'star-prnt' });

    describe('ReceiptPrinterEncoder({ language: star-prnt })', function () {
        it('should be .language == star-prnt', function () {
            assert.deepEqual('star-prnt', starprntencoder.language);
        });
    });
});
