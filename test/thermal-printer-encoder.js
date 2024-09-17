import ThermalPrinterEncoder from '../src/thermal-printer-encoder.js';
import { assert, expect } from 'chai';

describe('ThermalPrinterEncoder', function() {

    describe('ThermalPrinterEncoder({ language: unknown })', function () {
        it('should throw an "Language not supported" error', function () {
            expect(function(){
                new ThermalPrinterEncoder({ language: 'unknown' });
            }).to.throw('The specified language is not supported');
        });
    });

    
    let escposencoder = new ThermalPrinterEncoder({ language: 'esc-pos' });

    describe('ThermalPrinterEncoder({ language: esc-pos })', function () {
        it('should be .language == esc-pos', function () {
            assert.deepEqual('esc-pos', escposencoder.language);
        });
    });


    let starprntencoder = new ThermalPrinterEncoder({ language: 'star-prnt' });

    describe('ThermalPrinterEncoder({ language: star-prnt })', function () {
        it('should be .language == star-prnt', function () {
            assert.deepEqual('star-prnt', starprntencoder.language);
        });
    });
});
