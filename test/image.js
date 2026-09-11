import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import ImageData from '@canvas/image-data';
import { assert } from 'chai';

/* Column mode images are printed in strips of 24 dots. The line spacing between
   the strips is set in motion units, which are half a dot on Epson printers and
   one dot on many others. When the resolution of the printer is known, the
   motion unit is set to one dot explicitly, see #47 */

describe('Column mode images', function() {
    const LINE_SPACING_24 = [ 27, 51, 24 ];
    const LINE_SPACING_DEFAULT = [ 27, 50 ];
    const MOTION_UNIT = (dpi) => [ 29, 80, dpi, dpi ];
    const MOTION_UNIT_DEFAULT = [ 29, 80, 0, 0 ];
    const STRIP = [ 27, 42, 33, 8, 0, ...new Array(24).fill(0), 10 ];
    const NL = [ 10, 13 ];

    const image = (height) => {
        const data = new ImageData(8, height);
        data.data.fill(255);
        return data;
    };

    describe('image(8 x 48) without a printer model', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'column' });
        let result = encoder.image(image(48), 8, 48).encode();

        it('should use 24 units of line spacing for two strips, without changing the motion unit', function () {
            assert.deepEqual(new Uint8Array([ ...LINE_SPACING_24, ...STRIP, ...STRIP, ...LINE_SPACING_DEFAULT, ...NL ]), result);
        });
    });

    describe('image(8 x 8) without a printer model', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', imageMode: 'column' });
        let result = encoder.image(image(8), 8, 8).encode();

        it('should pad a partial strip to 24 dots', function () {
            assert.deepEqual(new Uint8Array([ ...LINE_SPACING_24, ...STRIP, ...LINE_SPACING_DEFAULT, ...NL ]), result);
        });
    });

    describe('image(8 x 48) on an Epson TM-T88V, 180 dpi', function () {
        let encoder = new ReceiptPrinterEncoder({ printerModel: 'epson-tm-t88v', imageMode: 'column' });
        let result = encoder.image(image(48), 8, 48).encode();

        it('should set the motion unit to one dot around the image and restore it', function () {
            assert.deepEqual(new Uint8Array([
                ...MOTION_UNIT(180), ...LINE_SPACING_24, ...STRIP, ...STRIP, ...LINE_SPACING_DEFAULT, ...MOTION_UNIT_DEFAULT, ...NL,
            ]), result);
        });
    });

    describe('image(8 x 24) on an Xprinter XP-T80Q, 203 dpi', function () {
        let encoder = new ReceiptPrinterEncoder({ printerModel: 'xprinter-xp-t80q', imageMode: 'column' });
        let result = encoder.image(image(24), 8, 24).encode();

        it('should use the resolution of the printer as the motion unit', function () {
            assert.deepEqual(new Uint8Array([
                ...MOTION_UNIT(203), ...LINE_SPACING_24, ...STRIP, ...LINE_SPACING_DEFAULT, ...MOTION_UNIT_DEFAULT, ...NL,
            ]), result);
        });
    });

    describe('image(8 x 8) on an Epson TM-T70, raster mode by profile', function () {
        let encoder = new ReceiptPrinterEncoder({ printerModel: 'epson-tm-t70' });
        let result = encoder.image(image(8), 8, 8).encode();

        it('should not touch the motion unit in raster mode', function () {
            assert.deepEqual(new Uint8Array([ 29, 118, 48, 0, 1, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...NL ]), result);
        });
    });
});
