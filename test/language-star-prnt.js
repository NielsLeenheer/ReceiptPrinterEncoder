import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { createCanvas } from 'canvas';
import { assert, expect } from 'chai';


describe('LanguageStarPrnt', function() {
    describe('text(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.text('hello').encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('text(hello).newline()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.text('hello').newline().encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('text(hello).newline().newline()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.text('hello').newline().newline().encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13, 10, 13 ]), result);
        });
    });

    describe('line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.line('hello').encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('text(héllo) - é -> 176', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.text('héllo').encode();
        
        it('should be [ 104, 176, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 176, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('codepage(star/katakana).text(héllo) - é -> ?', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.codepage('star/katakana').text('héllo').encode();
        
        it('should be [ 27, 29, 116, 2, 104, 63, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 29, 116, 2, 104, 63, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('codepage(cp437).text(héllo) - é -> 130', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.codepage('cp437').text('héllo').encode();
        
        it('should be [27, 29, 116, 1, 104, 130, 108, 108, 111, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 29, 116, 1, 104, 130, 108, 108, 111, 10, 13]), result);
        });
    });

    describe('codepage(star/cp874).text(กำลังทดสอบ) - thai', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.codepage('star/cp874').text('กำลังทดสอบ').encode();
        
        it('should be [27, 29, 116, 21, 161, 211, 197, 209, 167, 183, 180, 202, 205, 186, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 29, 116, 21, 161, 211, 197, 209, 167, 183, 180, 202, 205, 186, 10, 13]), result);
        });
    });

    describe('codepage(windows1252).text(héllo) - é -> 233', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.codepage('windows1252').text('héllo').encode();
        
        it('should be [27, 29, 116, 32, 104, 233, 108, 108, 111, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 29, 116, 32, 104, 233, 108, 108, 111, 10, 13]), result);
        });
    });

    describe('codepage(unknown).text(héllo)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });

        it('should throw an "Unknown codepage" error', function () {
            expect(function(){
                let result = encoder.codepage('unknown').text('héllo').encode();
            }).to.throw('Unknown codepage');
        });
    });

    describe('bold(true).text(hello).bold(false)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.bold(true).text('hello').bold(false).encode();
        
        it('should be [ 27, 69, ..., 27, 70, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 104, 101, 108, 108, 111, 27, 70, 10, 13 ]), result);
        });
    });

    describe('bold().text(hello).bold()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.bold().text('hello').bold().encode();
        
        it('should be [ 27, 69, ..., 27, 70, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 104, 101, 108, 108, 111, 27, 70, 10, 13 ]), result);
        });
    });

    describe('italic().text(hello).italic()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.italic().text('hello').italic().encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('underline(true).text(hello).underline(false)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.underline(true).text('hello').underline(false).encode();
        
        it('should be [ 27, 45, 1, ..., 27, 45, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 45, 1, 104, 101, 108, 108, 111, 27, 45, 0, 10, 13 ]), result);
        });
    });

    describe('underline().text(hello).underline()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.underline().text('hello').underline().encode();
        
        it('should be [ 27, 45, 1, ..., 27, 45, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 45, 1, 104, 101, 108, 108, 111, 27, 45, 0, 10, 13 ]), result);
        });
    });

    describe('align(left).line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false, width: 10, embedded: true });
        let result = encoder.align('left').line('hello').encode();
        
        it('should be [ ..., 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([104, 101, 108, 108, 111, 32, 32, 32, 32, 32, 10, 13]), result);
        });
    });

    describe('align(center).line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false, width: 10, embedded: true });
        let result = encoder.align('center').line('hello').encode();
        
        it('should be [ 32, 32, ..., 32, 32, 32, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([32, 32, 104, 101, 108, 108, 111, 32, 32, 32, 10, 13]), result);
        });
    });

    describe('align(right).line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false, width: 10, embedded: true });
        let result = encoder.align('right').line('hello').encode();
        
        it('should be [ 32, 32, 32, 32, 32, ..., 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([32, 32, 32, 32, 32, 104, 101, 108, 108, 111, 10, 13]), result);
        });
    });

    describe('qrcode(https://nielsleenheer.com)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.qrcode('https://nielsleenheer.com').encode();
        
        it('should be [ 27, 29, 121, 83, 48, 2, 27, 29, 121, 83, 50, 6, ... ]', function () {
            assert.deepEqual(new Uint8Array([27, 29, 121, 83, 48, 2, 27, 29, 121, 83, 50, 6, 27, 29, 121, 83, 49, 1, 27, 29, 121, 68, 49, 0, 25, 0, 104, 116, 116, 112, 115, 58, 47, 47, 110, 105, 101, 108, 115, 108, 101, 101, 110, 104, 101, 101, 114, 46, 99, 111, 109, 27, 29, 121, 80, 10, 13]), result);
        });
    });

    describe('qrcode(https://nielsleenheer.com, 1, 8, h)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.qrcode('https://nielsleenheer.com', 1, 8, 'h').encode();
        
        it('should be [ 27, 29, 121, 83, 48, 1, 27, 29, 121, 83, 50, 8, ... ]', function () {
            assert.deepEqual(new Uint8Array([27, 29, 121, 83, 48, 1, 27, 29, 121, 83, 50, 8, 27, 29, 121, 83, 49, 3, 27, 29, 121, 68, 49, 0, 25, 0, 104, 116, 116, 112, 115, 58, 47, 47, 110, 105, 101, 108, 115, 108, 101, 101, 110, 104, 101, 101, 114, 46, 99, 111, 109, 27, 29, 121, 80, 10, 13]), result);
        });
    });

    describe('barcode(3130630574613, ean13, 60)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.barcode('3130630574613', 'ean13', 60).encode();
        
        it('should be [27, 98, 3, 1, 3, 60, 51, 49, 51, 48, 54, 51, 48, 53, 55, 52, 54, 49, 51, 30, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 98, 3, 1, 3, 60, 51, 49, 51, 48, 54, 51, 48, 53, 55, 52, 54, 49, 51, 30, 10, 13]), result);
        });
    });

    describe('barcode(CODE128, code128, 60)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.barcode('CODE128', 'code128', 60).encode();
        
        it('should be [27, 98, 6, 1, 3, 60, 67, 79, 68, 69, 49, 50, 56, 30, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 98, 6, 1, 3, 60, 67, 79, 68, 69, 49, 50, 56, 30, 10, 13]), result);
        });
    });

    describe('barcode({ACODE128, code128, 60)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.barcode('{ACODE128', 'code128', 60).encode();
        
        it('should be [27, 98, 6, 1, 3, 60, 123, 65, 67, 79, 68, 69, 49, 50, 56, 30, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 98, 6, 1, 3, 60, 123, 65, 67, 79, 68, 69, 49, 50, 56, 30, 10, 13]), result);
        });
    });

    describe('barcode({BCODE128, code128, 60)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.barcode('{BCODE128', 'code128', 60).encode();
        
        it('should be [27, 98, 6, 1, 3, 60, 123, 66, 67, 79, 68, 69, 49, 50, 56, 30, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 98, 6, 1, 3, 60, 123, 66, 67, 79, 68, 69, 49, 50, 56, 30, 10, 13]), result);
        });
    });

    describe('barcode({C2Uc#, code128, 60)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.barcode('{C2Uc#', 'code128', 60).encode();
        
        it('should be [27, 98, 6, 1, 3, 60, 123, 67, 50, 85, 99, 35, 30, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 98, 6, 1, 3, 60, 123, 67, 50, 85, 99, 35, 30, 10, 13]), result);
        });
    });

    describe('image(canvas, 8, 24) - with a black pixel at 0,0', function () {
        let canvas = createCanvas(8, 24);
        let context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0, 0, 0, 1)';
        context.fillRect( 0, 0, 1, 1 );

        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false, createCanvas });
        let result = encoder.image(canvas, 8, 24).encode();
                
        it('should be [27, 48, 27, 88, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 13, 27, 122, 1, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 48, 27, 88, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 13, 27, 122, 1, 10, 13]), result);
        });
    });

    describe('pulse()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.pulse().encode();
        
        it('should be [ 27, 7, 20, 20, 7, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 7, 20, 20, 7, 10, 13 ]), result);
        });
    });

    describe('cut()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.cut().encode();
        
        it('should be [ 27, 100, 00, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 100, 0, 10, 13 ]), result);
        });
    });

    describe('cut(full)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.cut('full').encode();
        
        it('should be [ 27, 100, 00, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 100, 0, 10, 13 ]), result);
        });
    });

    describe('cut(partial)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.cut('partial').encode();
        
        it('should be [ 27, 100, 01, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 100, 1, 10, 13 ]), result);
        });
    });

    describe('raw([ 0x1c, 0x2e ])', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.raw([ 0x1c, 0x2e ]).encode();
        
        it('should be [ 28, 46, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 28, 46, 10, 13 ]), result);
        });
    });

    describe('codepage(auto).text(héψжł)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
        let result = encoder.codepage('auto').text('héψжł').encode();
        
        it('should be [27, 29, 116, 0, 104, 176, 27, 29, 116, 15, 175, 27, 29, 116, 10, 166, 27, 29, 116, 5, 136, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 29, 116, 0, 104, 176, 27, 29, 116, 15, 175, 27, 29, 116, 10, 166, 27, 29, 116, 5, 136, 10, 13]), result);
        });
    });
});
