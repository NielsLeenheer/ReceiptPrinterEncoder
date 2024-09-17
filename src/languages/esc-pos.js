import CodepageEncoder from 'codepage-encoder';

class LanguageEscPos {

    /**
     * Initialize the printer
     * @returns {Array}         Array of bytes to send to the printer
     */
    initialize() {        
        return [
            /* Initialize printer */
            0x1b, 0x40,

            /* Cancel Kanji mode */
            0x1c, 0x2e,

            /* Set the font to A */
            0x1b, 0x4d, 0x00
        ];
    }

    /**
     * Change the font
     * @param {string} type     Font type ('A', 'B', or more)
     * @returns {Array}         Array of bytes to send to the printer
     */
    font(type) {
        let value = type.charCodeAt(0) - 0x41;

        return [
            0x1b, 0x4d, value
        ];
    }

    /**
     * Change the alignment
     * @param {string} value    Alignment value ('left', 'center', 'right')
     * @returns {Array}         Array of bytes to send to the printer
     */
    align(value) {
        let align = 0x00;

        if (value === 'center') {
            align = 0x01;
        } else if (value === 'right') {
            align = 0x02;
        }

        return [
            0x1b, 0x61, align
        ];
    }

    /**
     * Generate a barcode
     * @param {string} value        Value to encode
     * @param {string} symbology    Barcode symbology
     * @param {number} height       Height of the barcode
     * @returns {Array}             Array of bytes to send to the printer
     */
    barcode(value, symbology, height) {
        let result = [];

        const symbologies = {
            'upca': 0x00,
            'upce': 0x01,
            'ean13': 0x02,
            'ean8': 0x03,
            'code39': 0x04,
            'coda39': 0x04, /* typo, leave here for backwards compatibility */
            'itf': 0x05,
            'codabar': 0x06,
            'code93': 0x48,
            'code128': 0x49,
            'gs1-128': 0x50,
            'gs1-databar-omni': 0x51,
            'gs1-databar-truncated': 0x52,
            'gs1-databar-limited': 0x53,
            'gs1-databar-expanded': 0x54,
            'code128-auto': 0x55,
        };
      
        if (typeof symbologies[symbology] === 'undefined') {
            throw new Error('Symbology not supported by printer');
        }

        const bytes = CodepageEncoder.encode(value, 'ascii');
      
        result.push(
            0x1d, 0x68, height,
            0x1d, 0x77, symbology === 'code39' ? 0x02 : 0x03,
        );
      
        
        if (symbology == 'code128' && bytes[0] !== 0x7b) {
            /* Not yet encodeded Code 128, assume data is Code B, which is similar to ASCII without control chars */
    
            result.push(
                0x1d, 0x6b, symbologies[symbology],
                bytes.length + 2,
                0x7b, 0x42,
                ...bytes
            );
        } else if (symbologies[symbology] > 0x40) {
            /* Function B symbologies */
    
            result.push(
                0x1d, 0x6b, symbologies[symbology],
                bytes.length,
                ...bytes
            );
        } else {
            /* Function A symbologies */
    
            result.push(
                0x1d, 0x6b, symbologies[symbology],
                ...bytes,
                0x00
            );
        }

        return result;
    }

    /**
     * Generate a QR code
     * @param {string} value        Value to encode
     * @param {number} model        QR Code model (1 or 2)
     * @param {number} size         QR Code size (1 to 8)
     * @param {string} errorlevel   Error correction level ('l', 'm', 'q', 'h')
     * @returns {Array}             Array of bytes to send to the printer
     */
    qrcode(value, model, size, errorlevel) {
        let result = [];

        /* Model */

        const models = {
            1: 0x31,
            2: 0x32,
        };
  
        if (typeof model === 'undefined') {
            model = 2;
        }
  
        if (model in models) {
            result.push(
                0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, models[model], 0x00
            );
        } else {
            throw new Error('Model must be 1 or 2');
        }
  
        /* Size */
  
        if (typeof size === 'undefined') {
            size = 6;
        }
  
        if (typeof size !== 'number') {
            throw new Error('Size must be a number');
        }
  
        if (size < 1 || size > 8) {
            throw new Error('Size must be between 1 and 8');
        }
  
        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size
        );
  
        /* Error level */
  
        const errorlevels = {
            'l': 0x30,
            'm': 0x31,
            'q': 0x32,
            'h': 0x33,
        };
  
        if (typeof errorlevel === 'undefined') {
            errorlevel = 'm';
        }
  
        if (errorlevel in errorlevels) {
            result.push(
                0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, errorlevels[errorlevel]
            );
        } else {
                throw new Error('Error level must be l, m, q or h');
        }
  
        /* Data */
  
        const bytes = CodepageEncoder.encode(value, 'iso8859-1');
        const length = bytes.length + 3;
  
        result.push(
            0x1d, 0x28, 0x6b,
            length & 0xff, (length >> 8) & 0xff,
            0x31, 0x50, 0x30, ...bytes
        );
  
        /* Print QR code */
  
        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30
        );
        
        return result;
    }

    /**
     * Encode an image
     * @param {ImageData} image     ImageData object
     * @param {number} width        Width of the image
     * @param {number} height       Height of the image
     * @param {string} mode         Image encoding mode ('column' or 'raster')
     * @returns {Array}             Array of bytes to send to the printer
     */
    image(image, width, height, mode) {
        let result = [];

        const getPixel = (x, y) => x < width && y < height ? (image.data[((width * y) + x) * 4] > 0 ? 0 : 1) : 0;

        const getColumnData = (width, height) => {
            const data = [];
    
            for (let s = 0; s < Math.ceil(height / 24); s++) {
                const bytes = new Uint8Array(width * 3);
    
                for (let x = 0; x < width; x++) {
                    for (let c = 0; c < 3; c++) {
                        for (let b = 0; b < 8; b++) {
                            bytes[(x * 3) + c] |= getPixel(x, (s * 24) + b + (8 * c)) << (7 - b);
                        }
                    }
                }
    
                data.push(bytes);
            }
    
            return data;
        };
    
        const getRowData = (width, height) => {
            const bytes = new Uint8Array((width * height) >> 3);
    
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x = x + 8) {
                    for (let b = 0; b < 8; b++) {
                        bytes[(y * (width >> 3)) + (x >> 3)] |= getPixel(x + b, y) << (7 - b);
                    }
                }
            }
    
            return bytes;
        };

        /* Encode images with ESC * */

        if (mode == 'column') {
            result.push(
                0x1b, 0x33, 0x24
            );
  
            getColumnData(width, height).forEach((bytes) => {
                result.push(
                    0x1b, 0x2a, 0x21,
                    width & 0xff, (width >> 8) & 0xff,
                    ...bytes,
                    0x0a
                );
            });
  
            result.push(
                0x1b, 0x32
            );
        }
  
        /* Encode images with GS v */
  
        if (mode == 'raster') {
            result.push(
                0x1d, 0x76, 0x30, 0x00,
                (width >> 3) & 0xff, (((width >> 3) >> 8) & 0xff),
                height & 0xff, ((height >> 8) & 0xff),
                ...getRowData(width, height)
            );
        }

        return result;
    }

    /**
     * Cut the paper
     * @param {string} value    Cut type ('full' or 'partial')
     * @returns {Array}         Array of bytes to send to the printer
     */
    cut(value) {
        let data = 0x00;

        if (value == 'partial') {
          data = 0x01;
        }
        
        return [
            0x1d, 0x56, data,
        ];
    }

    /**
     * Send a pulse to the cash drawer
     * @param {number} device   Device number
     * @param {number} on       Pulse ON time
     * @param {number} off      Pulse OFF time
     * @returns {Array}         Array of bytes to send to the printer
     */
    pulse(device, on, off) {
        if (typeof device === 'undefined') {
            device = 0;
        }
    
        if (typeof on === 'undefined') {
            on = 100;
        }
    
        if (typeof off === 'undefined') {
            off = 500;
        }
    
        on = Math.min(500, Math.round(on / 2));
        off = Math.min(500, Math.round(off / 2));
    
    
        return [
            0x1b, 0x70, device ? 1 : 0, on & 0xff, off & 0xff
        ];
    }

    /**
     * Enable or disable bold text
     * @param {boolean} value   Enable or disable bold text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    bold(value) {
        let data = 0x00;

        if (value) {
            data = 0x01;
        }

        return [
            0x1b, 0x45, data
        ];
    }

    /**
     * Enable or disable underline text
     * @param {boolean} value   Enable or disable underline text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    underline(value) {
        let data = 0x00;

        if (value) {
            data = 0x01;
        }

        return [
            0x1b, 0x2d, data
        ];
    }

    /**
     * Enable or disable italic text
     * @param {boolean} value   Enable or disable italic text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    italic(value) {
        let data = 0x00;

        if (value) {
            data = 0x01;
        }

        return [
            0x1b, 0x34, data
        ];
    }

    /**
     * Enable or disable inverted text
     * @param {boolean} value   Enable or disable inverted text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    invert(value) {
        let data = 0x00;

        if (value) {
            data = 0x01;
        }

        return [
            0x1d, 0x42, data
        ];
    }

    /**
     * Change text size
     * @param {number} width    Width of the text (1-8)
     * @param {number} height   Height of the text (1-8)
     * @returns {Array}         Array of bytes to send to the printer
     */
    size(width, height) {
        return [
            0x1d, 0x21, (height - 1) | (width - 1) << 4,
        ];
    }

    /**
     * Change the codepage
     * @param {number} value    Codepage value
     * @returns {Array}         Array of bytes to send to the printer
     */
    codepage(value) {
        return [
            0x1b, 0x74, value
        ];
    }

    /**
     * Flush the printers line buffer
     * @returns {Array}         Array of bytes to send to the printer
     */
    flush() {
        return [];
    }
}

export default LanguageEscPos;