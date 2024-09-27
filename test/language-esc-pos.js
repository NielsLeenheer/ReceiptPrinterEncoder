import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import { createCanvas } from 'canvas';
import { assert, expect } from 'chai';


describe('LanguageEscPos', function() {
    describe('text(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.text('hello').encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('text(hello).newline()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.text('hello').newline().encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('text(hello).newline().newline()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.text('hello').newline().newline().encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13, 10, 13 ]), result);
        });
    });

    describe('text(hello).newline(4)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.text('hello').newline(4).encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13, 10, 13, 10, 13, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13, 10, 13, 10, 13, 10, 13 ]), result);
        });
    });

    describe('line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.line('hello').encode();
        
        it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('text(héllo) - é -> ?', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.text('héllo').encode();
        
        it('should be [ 104, 63, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 130, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('codepage(epson/katakana).text(héllo) - é -> ?', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.codepage('epson/katakana').text('héllo').encode();
        
        it('should be [ 27, 116, 1, 104, 63, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 116, 1, 104, 63, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('codepage(cp437).text(héllo) - é -> 130', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.codepage('cp437').text('héllo').encode();
        
        it('should be [ 104, 130, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 130, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('codepage(windows1252).text(héllo) - é -> 233', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.codepage('windows1252').text('héllo').encode();
        
        it('should be [ 27, 116, 16, 104, 233, 108, 108, 111, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 116, 16, 104, 233, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('codepage(unknown).text(héllo)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });

        it('should throw an "Unknown codepage" error', function () {
            expect(function(){
                let result = encoder.codepage('unknown').text('héllo').encode();
            }).to.throw('Unknown codepage');
        });
    });

    describe('bold(true).text(hello).bold(false)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.bold(true).text('hello').bold(false).encode();
        
        it('should be [ 27, 69, 1, ..., 27, 69, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 1, 104, 101, 108, 108, 111, 27, 69, 0, 10, 13 ]), result);
        });
    });

    describe('bold().text(hello).bold()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.bold().text('hello').bold().encode();
        
        it('should be [ 27, 69, 1, ..., 27, 69, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 69, 1, 104, 101, 108, 108, 111, 27, 69, 0, 10, 13 ]), result);
        });
    });

    describe('italic().text(hello).italic()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.italic().text('hello').italic().encode();
        
        it('should be [ 27, 69, 1, ..., 27, 69, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 52, 1, 104, 101, 108, 108, 111, 27, 52, 0, 10, 13 ]), result);
        });
    });

    describe('underline(true).text(hello).underline(false)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.underline(true).text('hello').underline(false).encode();
        
        it('should be [ 27, 45, 1, ..., 27, 45, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 45, 1, 104, 101, 108, 108, 111, 27, 45, 0, 10, 13 ]), result);
        });
    });

    describe('underline().text(hello).underline()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.underline().text('hello').underline().encode();
        
        it('should be [ 27, 45, 1, ..., 27, 45, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 45, 1, 104, 101, 108, 108, 111, 27, 45, 0, 10, 13 ]), result);
        });
    });

    describe('invert().text(hello).invert()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.invert().text('hello').invert().encode();
        
        it('should be [ 29, 66, 1, ..., 29, 66, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 66, 1, 104, 101, 108, 108, 111, 29, 66, 0, 10, 13 ]), result);
        });
    });

    describe('width(2).text(hello).width(1)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.width(2).text('hello').width(1).encode();
        
        it('should be [ 29, 33, 16, ..., 29, 33, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 33, 16, 104, 101, 108, 108, 111, 29, 33, 0, 10, 13 ]), result);
        });
    });

    describe('height(2).text(hello).height(1)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.height(2).text('hello').height(1).encode();
        
        it('should be [ 29, 33, 1, ..., 29, 33, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 33, 1, 104, 101, 108, 108, 111, 29, 33, 0, 10, 13 ]), result);
        });
    });

    describe('width(2).height(2).text(hello).width(1).height(1)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.width(2).height(2).text('hello').width(1).height(1).encode();
        
        it('should be [ 29, 33, 17, ..., 29, 33, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 33, 17, 104, 101, 108, 108, 111, 29, 33, 0, 10, 13 ]), result);
        });
    });

    describe('align(left).line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', width: 10, embedded: true });
        let result = encoder.align('left').line('hello').encode();
        
        it('should be [ ..., 32, 32, 32, 32, 32, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 104, 101, 108, 108, 111, 32, 32, 32, 32, 32, 10, 13 ]), result);
        });
    });

    describe('align(center).line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', width: 10, embedded: true });
        let result = encoder.align('center').line('hello').encode();
        
        it('should be [ 32, 32, ..., 32, 32, 32, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 32, 32, 104, 101, 108, 108, 111, 32, 32, 32, 10, 13 ]), result);
        });
    });

    describe('align(right).line(hello)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', width: 10, embedded: true });
        let result = encoder.align('right').line('hello').encode();
        
        it('should be [ 32, 32, 32, 32, 32, ..., 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 32, 32, 32, 32, 32, 104, 101, 108, 108, 111, 10, 13 ]), result);
        });
    });

    describe('qrcode(https://nielsleenheer.com)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.qrcode('https://nielsleenheer.com').encode();
        
        it('should be [ 29, 40, 107, 4, 0, 49, 65, 50, 0, 29, 40, 107, 3, 0, ... ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 40, 107, 4, 0, 49, 65, 50, 0, 29, 40, 107, 3, 0, 49, 67, 6, 29, 40, 107, 3, 0, 49, 69, 49, 29, 40, 107, 28, 0, 49, 80, 48, 104, 116, 116, 112, 115, 58, 47, 47, 110, 105, 101, 108, 115, 108, 101, 101, 110, 104, 101, 101, 114, 46, 99, 111, 109, 29, 40, 107, 3, 0, 49, 81, 48, 10, 13 ]), result);
        });
    });

    describe('qrcode(https://nielsleenheer.com, 1, 8, h)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.qrcode('https://nielsleenheer.com', 1, 8, 'h').encode();
        
        it('should be [ 29, 40, 107, 4, 0, 49, 65, 49, 0, 29, 40, 107, 3, 0, ... ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 40, 107, 4, 0, 49, 65, 49, 0, 29, 40, 107, 3, 0, 49, 67, 8, 29, 40, 107, 3, 0, 49, 69, 51, 29, 40, 107, 28, 0, 49, 80, 48, 104, 116, 116, 112, 115, 58, 47, 47, 110, 105, 101, 108, 115, 108, 101, 101, 110, 104, 101, 101, 114, 46, 99, 111, 109, 29, 40, 107, 3, 0, 49, 81, 48, 10, 13 ]), result);
        });
    });

    describe('barcode(3130630574613, ean13, 60)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.barcode('3130630574613', 'ean13', 60).encode();
        
        it('should be [ 29, 104, 60, 29, 119, 3, 29, 107, 2, ... ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 104, 60, 29, 119, 3, 29, 72, 0, 29, 107, 2, 51, 49, 51, 48, 54, 51, 48, 53, 55, 52, 54, 49, 51, 0, 10, 13 ]), result);
        });
    });

    describe('barcode(CODE128, code128, 60)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.barcode('CODE128', 'code128', 60).encode();
        
        it('should be [ 29, 104, 60, 29, 119, 3, 29, 107, 73, ... ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 104, 60, 29, 119, 3, 29, 72, 0, 29, 107, 73, 9, 123, 66, 67, 79, 68, 69, 49, 50, 56, 10, 13 ]), result);
        });
    });

    describe('image(canvas, 8, 8) - with a black pixel at 0,0 (legacy)', function () {
        let canvas = createCanvas(8, 8);
        let context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0, 0, 0, 1)';
        context.fillRect( 0, 0, 1, 1 );

        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'raster', createCanvas });
        let result = encoder.image(canvas, 8, 8).encode();
                
        it('should be [ 29, 118, 48, 0, 1, 0, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0, 10, 13 ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 118, 48, 0, 1, 0, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0, 10, 13 ]), result);
        });
    });

    describe('image(canvas, 8, 8) - with a black pixel at 0,0', function () {
        let canvas = createCanvas(8, 8);
        let context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0, 0, 0, 1)';
        context.fillRect( 0, 0, 1, 1 );

        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', createCanvas });
        let result = encoder.image(canvas, 8, 8).encode();
                
        it('should be [ 27, 51, 36, 27, 42, 33, 8, 0, 128, 0, 0, 0, 0, ... ]', function () {
            assert.deepEqual(new Uint8Array([27, 51, 36, 27, 42, 33, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 27, 50, 10, 13]), result);
        });
    });

    describe('pulse()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.pulse().encode();
        
        it('should be [ 27, 112, 0, 50, 250 ]', function () {
            assert.deepEqual(new Uint8Array([ 27, 112, 0, 50, 250, 10, 13 ]), result);
        });
    });

    describe('cut()', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.cut().encode();
        
        it('should be [ 29, 86, 00 ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 86, 0, 10, 13 ]), result);
        });
    });

    describe('cut(full)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.cut('full').encode();
        
        it('should be [ 29, 86, 00 ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 86, 0, 10, 13 ]), result);
        });
    });

    describe('cut(partial)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.cut('partial').encode();
        
        it('should be [ 29, 86, 01 ]', function () {
            assert.deepEqual(new Uint8Array([ 29, 86, 1, 10, 13 ]), result);
        });
    });

    describe('raw([ 0x1c, 0x2e ])', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.raw([ 0x1c, 0x2e ]).encode();
        
        it('should be [ 28, 46 ]', function () {
            assert.deepEqual(new Uint8Array([ 28, 46, 10, 13 ]), result);
        });
    });

    describe('codepage(auto).text(héψжł)', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.codepage('auto').text('héψжł').encode();
        
        it('should be [27, 116, 0, 104, 130, 27, 116, 11, 246, 27, 116, 17, 166, 27, 116, 18, 136, 10, 13]', function () {
            assert.deepEqual(new Uint8Array([27, 116, 0, 104, 130, 27, 116, 11, 246, 27, 116, 17, 166, 27, 116, 18, 136, 10, 13]), result);
        });
    });
});
