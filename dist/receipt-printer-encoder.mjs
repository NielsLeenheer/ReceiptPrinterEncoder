import Dither from 'canvas-dither';
import Flatten from 'canvas-flatten';
import CodepageEncoder from '@point-of-sale/codepage-encoder';
import ImageData from '@canvas/image-data';
import resizeImageData from 'resize-image-data';

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
     * Generate a PDF417 code
     * @param {string} value        Value to encode
     * @param {object} options      Configuration object
     * @returns {Array}             Array of bytes to send to the printer
     */
    pdf417(value, options) {
        let result = [];

        /* Columns */
  
        if (typeof options.columns !== 'number') {
            throw new Error('Columns must be a number');
        }
  
        if (options.columns !== 0 && (options.columns < 1 || options.columns > 30)) {
            throw new Error('Columns must be 0, or between 1 and 30');
        }
  
        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x41, options.columns
        );
  
        /* Rows */
  
        if (typeof options.rows !== 'number') {
            throw new Error('Rows must be a number');
        }
  
        if (options.rows !== 0 && (options.rows < 3 || options.rows > 90)) {
            throw new Error('Rows must be 0, or between 3 and 90');
        }
  
        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x42, options.rows
        );
  
        /* Width */

        if (typeof options.width !== 'number') {
            throw new Error('Width must be a number');
        }

        if (options.width < 2 || options.width > 8) {
            throw new Error('Width must be between 2 and 8');
        }

        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x43, options.width
        );

        /* Height */

        if (typeof options.height !== 'number') {
            throw new Error('Height must be a number');
        }

        if (options.height < 2 || options.height > 8) {
            throw new Error('Height must be between 2 and 8');
        }

        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x44, options.height
        );

        /* Error level */
  
        if (typeof options.errorlevel !== 'number') {
            throw new Error('Errorlevel must be a number');
        }

        if (options.errorlevel < 0 || options.errorlevel > 8) {
            throw new Error('Errorlevel must be between 0 and 8');
        }
  
        result.push(
            0x1d, 0x28, 0x6b, 0x04, 0x00, 0x30, 0x45, 0x30, options.errorlevel + 0x30
        );
  
        /* Model: standard or truncated */

        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x46, options.truncated ? 0x01 : 0x00
        );

        /* Data */
  
        const bytes = CodepageEncoder.encode(value, 'ascii');
        const length = bytes.length + 3;
  
        result.push(
            0x1d, 0x28, 0x6b,
            length & 0xff, (length >> 8) & 0xff,
            0x30, 0x50, 0x30, ...bytes
        );
  
        /* Print PDF417 code */
  
        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x51, 0x30
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

class LanguageStarPrnt {

    /**
     * Initialize the printer
     * @returns {Array}         Array of bytes to send to the printer
     */
    initialize() {        
        return [
            /* Initialize printer */
            0x1b, 0x40, 0x18
        ];
    }

    /**
     * Change the font
     * @param {string} type     Font type ('A', 'B' or 'C')
     * @returns {Array}         Array of bytes to send to the printer
     */
    font(type) {
        let value = 0x00;

        if (type === 'B') {
            value = 0x01;
        }

        if (type === 'C') {
            value = 0x02;
        }

        return [
            0x1b, 0x1e, 0x46, value
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
            0x1b, 0x1d, 0x61, align
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
            'upce': 0x00,
            'upca': 0x01,
            'ean8': 0x02,
            'ean13': 0x03,
            'code39': 0x04,
            'itf': 0x05,
            'code128': 0x06,
            'code93': 0x07,
            'nw-7': 0x08,
            'gs1-128': 0x09,
            'gs1-databar-omni': 0x0a,
            'gs1-databar-truncated': 0x0b,
            'gs1-databar-limited': 0x0c,
            'gs1-databar-expanded': 0x0d,      
        };
      
        if (typeof symbologies[symbology] === 'undefined') {
            throw new Error('Symbology not supported by printer');
        }


        const bytes = CodepageEncoder.encode(value, 'ascii');
      
        result.push(
            0x1b, 0x62,
            symbologies[symbology], 0x01, 0x03, height,
            ...bytes, 0x1e
        );
    
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
            1: 0x01,
            2: 0x02,
        };
  
        if (typeof model === 'undefined') {
            model = 2;
        }
  
        if (model in models) {
            result.push(
                0x1b, 0x1d, 0x79, 0x53, 0x30, models[model],
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
            0x1b, 0x1d, 0x79, 0x53, 0x32, size,
        );
  
        /* Error level */
  
        const errorlevels = {
            'l': 0x00,
            'm': 0x01,
            'q': 0x02,
            'h': 0x03,
        };
  
        if (typeof errorlevel === 'undefined') {
            errorlevel = 'm';
        }
  
        if (errorlevel in errorlevels) {
            result.push(
                0x1b, 0x1d, 0x79, 0x53, 0x31, errorlevels[errorlevel]
            );
        } else {
            throw new Error('Error level must be l, m, q or h');
        }
  
        /* Data */
  
        const bytes = CodepageEncoder.encode(value, 'iso8859-1');
        const length = bytes.length;
  
        result.push(
            0x1b, 0x1d, 0x79, 0x44, 0x31, 0x00, 
            length & 0xff, (length >> 8) & 0xff, 
            ...bytes
        );
  
        /* Print QR code */
  
        result.push(
            0x1b, 0x1d, 0x79, 0x50
        );
        
        return result;
    }

    /**
     * Generate a PDF417 code
     * @param {string} value        Value to encode
     * @param {object} options      Configuration object
     * @returns {Array}             Array of bytes to send to the printer
     */
    pdf417(value, options) {
        let result = [];
    
        /* Columns */
    
        if (typeof options.columns !== 'number') {
            throw new Error('Columns must be a number');
        }
    
        if (options.columns !== 0 && (options.columns < 1 || options.columns > 30)) {
            throw new Error('Columns must be 0, or between 1 and 30');
        }
    
        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x41, options.columns
        );
    
        /* Rows */
    
        if (typeof options.rows !== 'number') {
            throw new Error('Rows must be a number');
        }
    
        if (options.rows !== 0 && (options.rows < 3 || options.rows > 90)) {
            throw new Error('Rows must be 0, or between 3 and 90');
        }
    
        result.push(
            0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x42, options.rows
        );
    
        /* Width */

        if (typeof options.width !== 'number') {
            throw new Error('Width must be a number');
        }

        if (options.width < 2 || options.width > 8) {
            throw new Error('Width must be between 2 and 8');
        }

        result.push(
            0x1b, 0x1d, 0x78, 0x53, 0x32, options.width
        );

        /* Height */

        if (typeof options.height !== 'number') {
            throw new Error('Height must be a number');
        }

        if (options.height < 2 || options.height > 8) {
            throw new Error('Height must be between 2 and 8');
        }

        result.push(
            0x1b, 0x1d, 0x78, 0x53, 0x33, options.height
        );

        /* Error level */
    
        if (typeof options.errorlevel !== 'number') {
            throw new Error('Errorlevel must be a number');
        }

        if (options.errorlevel < 0 || options.errorlevel > 8) {
            throw new Error('Errorlevel must be between 0 and 8');
        }
    
        result.push(
            0x1b, 0x1d, 0x78, 0x53, 0x31, options.errorlevel
        );
    
        /* Data */
    
        const bytes = CodepageEncoder.encode(value, 'ascii');
        const length = bytes.length + 3;
    
        result.push(
            0x1b, 0x1d, 0x78, 0x44,
            length & 0xff, (length >> 8) & 0xff,
            ...bytes
        );
    
        /* Print PDF417 code */
    
        result.push(
            0x1b, 0x1d, 0x78, 0x50
        );
        
        return result;
    }
    
    /**
     * Encode an image
     * @param {ImageData} image     ImageData object
     * @param {number} width        Width of the image
     * @param {number} height       Height of the image
     * @param {string} mode         Image encoding mode (value is ignored)
     * @returns {Array}             Array of bytes to send to the printer
     */
    image(image, width, height, mode) {
        let result = [];

        const getPixel = (x, y) => typeof image.data[((width * y) + x) * 4] === 'undefined' || 
                                   image.data[((width * y) + x) * 4] > 0 ? 0 : 1;

        result.push(
            0x1b, 0x30
        );
      
        for (let s = 0; s < height / 24; s++) {
            const y = s * 24;
            const bytes = new Uint8Array(width * 3);
        
            for (let x = 0; x < width; x++) {
                const i = x * 3;
        
                bytes[i] =
                    getPixel(x, y + 0) << 7 |
                    getPixel(x, y + 1) << 6 |
                    getPixel(x, y + 2) << 5 |
                    getPixel(x, y + 3) << 4 |
                    getPixel(x, y + 4) << 3 |
                    getPixel(x, y + 5) << 2 |
                    getPixel(x, y + 6) << 1 |
                    getPixel(x, y + 7);
        
                bytes[i + 1] =
                    getPixel(x, y + 8) << 7 |
                    getPixel(x, y + 9) << 6 |
                    getPixel(x, y + 10) << 5 |
                    getPixel(x, y + 11) << 4 |
                    getPixel(x, y + 12) << 3 |
                    getPixel(x, y + 13) << 2 |
                    getPixel(x, y + 14) << 1 |
                    getPixel(x, y + 15);
        
                bytes[i + 2] =
                    getPixel(x, y + 16) << 7 |
                    getPixel(x, y + 17) << 6 |
                    getPixel(x, y + 18) << 5 |
                    getPixel(x, y + 19) << 4 |
                    getPixel(x, y + 20) << 3 |
                    getPixel(x, y + 21) << 2 |
                    getPixel(x, y + 22) << 1 |
                    getPixel(x, y + 23);
            }
      
            result.push(
                0x1b, 0x58,
                width & 0xff, (width >> 8) & 0xff,
                ...bytes,
                0x0a, 0x0d
            );
        }
      
        result.push(
            0x1b, 0x7a, 0x01
        );

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
            0x1b, 0x64, data,
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
            on = 200;
        }
    
        if (typeof off === 'undefined') {
            off = 200;
        }
    
        on = Math.min(127, Math.round(on / 10));
        off = Math.min(127, Math.round(off / 10));        
    
        return [
            0x1b, 0x07, on & 0xff, off & 0xff,
            device ? 0x1a : 0x07
        ];
    }

    /**
     * Enable or disable bold text
     * @param {boolean} value   Enable or disable bold text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    bold(value) {
        let data = 0x46;

        if (value) {
            data = 0x45;
        }

        return [
            0x1b, data
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
        return [];
    }

    /**
     * Enable or disable inverted text
     * @param {boolean} value   Enable or disable inverted text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    invert(value) {
        let data = 0x35;

        if (value) {
            data = 0x34;
        }

        return [
            0x1b, data
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
            0x1b, 0x69, height - 1, width - 1
        ];
    }

    /**
     * Change the codepage
     * @param {number} value    Codepage value
     * @returns {Array}         Array of bytes to send to the printer
     */
    codepage(value) {
        return [
            0x1b, 0x1d, 0x74, value
        ];
    }

    /**
     * Flush the printers line buffer
     * @returns {Array}         Array of bytes to send to the printer
     */
    flush() {
        return [
            0x1b, 0x1d, 0x50, 0x30, 0x1b, 0x1d, 0x50, 0x31
        ]
    }
}

/**
 * Store and manage text styles
 */
class TextStyle {
  #default = {
    bold: false,
    italic: false,
    underline: false,
    invert: false,
    width: 1,
    height: 1,
  };

  #current;
  #callback;

  /**
     * Create a new TextStyle object
     *
     * @param  {object}   options   Object containing configuration options
     */
  constructor(options) {
    this.#current = structuredClone(this.#default);
    this.#callback = options.callback || (() => {});
  }

  /**
     * Return commands to get to the default style from the current style
     *
     * @return {array}   Array of modified properties
     */
  store() {
    const result = [];

    const properties = new Map();

    for (const property in this.#current) {
      if (this.#current[property] !== this.#default[property]) {
        if (property === 'width' || property === 'height') {
          properties.set('size', {width: this.#default.width, height: this.#default.height});
        } else {
          properties.set(property, this.#default[property]);
        }
      }
    }

    for (const property of properties) {
      result.push({
        type: 'style',
        property: property[0],
        value: property[1],
      });
    }

    return result;
  }

  /**
     * Return commands to get to the current style from the default style
     *
     * @return {array}   Array of modified properties
     */
  restore() {
    const result = [];

    const properties = new Map();

    for (const property in this.#current) {
      if (this.#current[property] !== this.#default[property]) {
        if (property === 'width' || property === 'height') {
          properties.set('size', {width: this.#current.width, height: this.#current.height});
        } else {
          properties.set(property, this.#current[property]);
        }
      }
    }

    for (const property of properties) {
      result.push({
        type: 'style',
        property: property[0],
        value: property[1],
      });
    }

    return result;
  }

  /**
     * Set the bold property
     *
     * @param  {boolean}   value   Is bold enabled, or not?
     */
  set bold(value) {
    if (value !== this.#current.bold) {
      this.#current.bold = value;

      this.#callback({
        type: 'style',
        property: 'bold',
        value,
      });
    }
  }

  /**
     * Get the bold property
     *
     * @return {boolean}   Is bold enabled, or not?
     */
  get bold() {
    return this.#current.bold;
  }

  /**
     * Set the italic property
     *
     * @param  {boolean}   value   Is italic enabled, or not?
     */
  set italic(value) {
    if (value !== this.#current.italic) {
      this.#current.italic = value;

      this.#callback({
        type: 'style',
        property: 'italic',
        value,
      });
    }
  }

  /**
     * Get the italic property
     *
     * @return {boolean}   Is italic enabled, or not?
     */
  get italic() {
    return this.#current.italic;
  }

  /**
     * Set the underline property
     *
     * @param  {boolean}   value   Is underline enabled, or not?
     */
  set underline(value) {
    if (value !== this.#current.underline) {
      this.#current.underline = value;

      this.#callback({
        type: 'style',
        property: 'underline',
        value,
      });
    }
  }

  /**
     * Get the underline property
     *
     * @return {boolean}   Is underline enabled, or not?
     */
  get underline() {
    return this.#current.underline;
  }

  /**
     * Set the invert property
     *
     * @param  {boolean}   value   Is invert enabled, or not?
     */
  set invert(value) {
    if (value !== this.#current.invert) {
      this.#current.invert = value;

      this.#callback({
        type: 'style',
        property: 'invert',
        value,
      });
    }
  }

  /**
     * Get the invert property
     *
     * @return {boolean}   Is invert enabled, or not?
     */
  get invert() {
    return this.#current.invert;
  }

  /**
    * Set the width property
    *
    * @param  {number}   value   The width of a character
    */
  set width(value) {
    if (value !== this.#current.width) {
      this.#current.width = value;

      this.#callback({
        type: 'style',
        property: 'size',
        value: {width: this.#current.width, height: this.#current.height},
      });
    }
  }

  /**
   * Get the width property
   *
   * @return {number}   The width of a character
   */
  get width() {
    return this.#current.width;
  }

  /**
    * Set the height property
    *
    * @param  {number}   value   The height of a character
    */
  set height(value) {
    if (value !== this.#current.height) {
      this.#current.height = value;

      this.#callback({
        type: 'style',
        property: 'size',
        value: {width: this.#current.width, height: this.#current.height},
      });
    }
  }

  /**
   * Get the height property
   *
   * @return {number}   The height of a character
   */
  get height() {
    return this.#current.height;
  }
}

/**
 * Wrap text into lines of a specified width.
 */
class TextWrap {
  /**
     * Static function to wrap text into lines of a specified width.
     *
     * @param  {string}   value     Text to wrap
     * @param  {object}   options   Object containing configuration options
     * @return {array}              Array of lines
     */
  static wrap(value, options) {
    const result = [];
    let line = [];
    let length = options.indent || 0;
    const width = options.width || 1;
    const columns = options.columns || 42;

    const lines = String(value).split(/\r\n|\n/g);

    for (const value of lines) {
      const chunks = value.match(/[^\s-]+?-\b|\S+|\s+|\r\n?|\n/g) || ['~~empty~~'];

      for (const chunk of chunks) {
        if (chunk === '~~empty~~') {
          result.push(line);
          line = [];
          length = 0;
          continue;
        }

        /* The word does not fit on the line */

        if (length + (chunk.length * width) > columns) {
          /* The word is longer than the line */

          if (chunk.length * width > columns) {
            /* Calculate the remaining space on the line */

            const remaining = columns - length;

            /* Split the word into pieces */

            const letters = chunk.split('');
            let piece;
            const pieces = [];

            /* If there are at least 8 position remaining, break early  */

            if (remaining > 8 * width) {
              piece = letters.splice(0, Math.floor(remaining / width)).join('');

              line.push(piece);
              result.push(line);

              line = [];
              length = 0;
            }

            /* The remaining letters can be split into pieces the size of the width */

            while ((piece = letters.splice(0, Math.floor(columns / width))).length) {
              pieces.push(piece.join(''));
            }

            for (const piece of pieces) {
              if (length + (piece.length * width) >= columns) {
                result.push(line);
                line = [];
                length = 0;
              }

              line.push(piece);
              length += piece.length * width;
            }

            continue;
          }

          /* Word fits on the next line */
          result.push(line);
          line = [];
          length = 0;
        }

        /* Check if we are whitespace */

        if (chunk.match(/\s+/) && length == 0) {
          continue;
        }

        line.push(chunk);
        length += chunk.length * width;
      }

      if (line.length > 0) {
        result.push(line);
        line = [];
        length = 0;
      }
    }

    for (let i = 0; i < result.length; i++) {
      result[i] = result[i].join('');

      if (i < result.length - 1) {
        result[i] = result[i].trimEnd();
      }
    }

    return result;
  }
}

/**
 * Compose lines of text and commands
 */
class LineComposer {
  #embedded;
  #columns;
  #align;
  #callback;

  #cursor = 0;
  #stored;
  #buffer = [];


  /**
     * Create a new LineComposer object
     *
     * @param  {object}   options   Object containing configuration options
     */
  constructor(options) {
    this.#embedded = options.embedded || false;
    this.#columns = options.columns || 42;
    this.#align = options.align || 'left';
    this.#callback = options.callback || (() => {});

    this.style = new TextStyle({
      callback: (value) => {
        this.add(value, 0);
      },
    });

    this.#stored = this.style.store();
  }

  /**
     * Add text to the line, potentially wrapping it
     *
     * @param  {string}   value   Text to add to the line
     * @param  {number}   codepage   Codepage to use for the text
     */
  text(value, codepage) {
    const lines = TextWrap.wrap(value, {columns: this.#columns, width: this.style.width, indent: this.#cursor});

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length) {
        /* Add the line to the buffer */
        this.add({type: 'text', value: lines[i], codepage}, lines[i].length * this.style.width);

        /* If it is not the last line, flush the buffer */
        if (i < lines.length - 1) {
          this.flush();
        }
      } else {
        /* In case the line is empty, flush the buffer */
        this.flush({forceNewline: true});
      }
    }
  }

  /**
   * Add spaces to the line
   *
   * @param {number} size Number of spaces to add to the line
   */
  space(size) {
    this.add({type: 'space', size}, size);
  }

  /**
     * Add raw bytes to to the line
     *
     * @param  {array}   value   Array of bytes to add to the line
     * @param  {number}  length  Length in characters of the value
     */
  raw(value, length) {
    if (value instanceof Array) {
      value = value.flat();
    }

    this.add({type: 'raw', value}, length || 0);
  }

  /**
     * Add an item to the line buffer, potentially flushing it
     *
     * @param  {object}   value   Item to add to the line buffer
     * @param  {number}   length  Length in characters of the value
     */
  add(value, length) {
    if (length + this.#cursor > this.#columns) {
      this.flush();
    }

    this.#cursor += length;
    this.#buffer = this.#buffer.concat(value);
  }

  /**
     * Move the cursor to the end of the line, forcing a flush
     * with the next item to add to the line buffer
     */
  end() {
    this.#cursor = this.#columns;
  }

  /**
     * Fetch the contents of line buffer
     *
     * @param  {options}   options   Options for flushing the buffer
     * @return {array}               Array of items in the line buffer
     */
  fetch(options) {
    if (this.#cursor === 0 && !options.forceNewline) {
      /* If the buffer is empty, return an empty array */

      if (!this.#buffer.length) {
        return [];
      }

      /* Otherwise return the buffer without any modifications */

      const result = this.#merge([...this.#buffer]);
      this.#buffer = [];
      return result;
    }

    let result = [];

    const restore = this.style.restore();
    const store = this.style.store();

    if (this.#align === 'right') {
      let last;

      /* Find index of last text or space element */

      for (let i = this.#buffer.length - 1; i >= 0; i--) {
        if (this.#buffer[i].type === 'text' || this.#buffer[i].type === 'space') {
          last = i;
          break;
        }
      }

      /* Remove trailing spaces from lines */

      if (typeof last === 'number') {
        if (this.#buffer[last].type === 'space' && this.#buffer[last].size > this.style.width) {
          this.#buffer[last].size -= this.style.width;
          this.#cursor -= this.style.width;
        }

        if (this.#buffer[last].type === 'text' && this.#buffer[last].value.endsWith(' ')) {
          this.#buffer[last].value = this.#buffer[last].value.slice(0, -1);
          this.#cursor -= this.style.width;
        }
      }

      result = this.#merge([
        {type: 'space', size: this.#columns - this.#cursor},
        ...this.#stored,
        ...this.#buffer,
        ...store,
      ]);
    }

    if (this.#align === 'center') {
      const left = (this.#columns - this.#cursor) >> 1;

      result = this.#merge([
        {type: 'space', size: left},
        ...this.#stored,
        ...this.#buffer,
        ...store,
        {type: 'space', size: this.#embedded ? this.#columns - this.#cursor - left : 0},
      ]);
    }

    if (this.#align === 'left') {
      result = this.#merge([
        ...this.#stored,
        ...this.#buffer,
        ...store,
        {type: 'space', size: this.#embedded ? this.#columns - this.#cursor : 0},
      ]);
    }

    this.#stored = restore;
    this.#buffer = [];
    this.#cursor = 0;

    if (result.length === 0 && options.forceNewline) {
      result.push({type: 'empty'});
    }

    return result;
  }

  /**
     * Flush the contents of the line buffer
     *
     * @param  {options}   options   Options for flushing the buffer
     */
  flush(options) {
    options = Object.assign({
      forceNewline: false,
    }, options || {});

    const align = {
      current: this.#align,
      next: null,
    };

    for (let i = 0; i < this.#buffer.length - 1; i++) {
      if (this.#buffer[i].type === 'align') {
        align.current = this.#buffer[i].value;
      }
    }

    /* Check the last item in the buffer, to see if it changes the alignment, then save it for the next line */

    if (this.#buffer.length) {
      const last = this.#buffer[this.#buffer.length - 1];

      if (last.type === 'align') {
        align.next = last.value;
      }
    }


    /* Fetch the contents of the line buffer */

    this.#align = align.current;

    const result = this.fetch(options);

    if (result.length) {
      this.#callback(result);
    }

    if (align.next) {
      this.#align = align.next;
    }
  }

  /**
     * Merge text items and spaces in the line buffer
     *
     * @param  {array}   items   Array of items
     * @return {array}           Array of merged items
     */
  #merge(items) {
    const result = [];
    let last = -1;

    for (let item of items) {
      if (item.type === 'space' && item.size > 0) {
        item = {type: 'text', value: ' '.repeat(item.size), codepage: null};
      }

      if (item.type === 'text') {
        /* Check if we can merge the text with the last item */

        const allowMerge =
            last >= 0 &&
            result[last].type === 'text' &&
            (
              result[last].codepage === item.codepage ||
              result[last].codepage === null ||
              item.codepage === null
            );

        if (allowMerge) {
          result[last].value += item.value;
          result[last].codepage = result[last].codepage || item.codepage;
          continue;
        }

        result.push(item);
        last++;
      }

      if (item.type === 'style' || item.type === 'raw') {
        result.push(item);
        last++;
      }
    }

    return result;
  }

  /**
   * Get the current position of the cursor
   *
   * @return {number}   Current position of the cursor
   */
  get cursor() {
    return this.#cursor;
  }

  /**
   * Set the alignment of the current line
   *
   * @param  {string}   value   Text alignment, can be 'left', 'center', or 'right'
   */
  set align(value) {
    this.add({type: 'align', value}, 0);
  }

  /**
   * Get the alignment of the current line
   *
   * @return {string}   Text alignment, can be 'left', 'center', or 'right'
   */
  get align() {
    let align = this.#align;

    for (let i = 0; i < this.#buffer.length; i++) {
      if (this.#buffer[i].type === 'align') {
        align = this.#buffer[i].value;
      }
    }

    return align;
  }

  /**
   * Set the number of columns of the current line
   *
   * @param  {number}   value   columns of the line
   */
  set columns(value) {
    this.#columns = value;
  }

  /**
   * Get the number of columns of the current line
   *
   * @return {number}   columns of the line
   */
  get columns() {
    return this.#columns;
  }
}

const codepageMappings = {
	'esc-pos': {
		'bixolon/legacy': ['cp437','epson/katakana','cp850','cp860','cp863','cp865',,,,,,,,,,,,,,'cp858'],
		'bixolon': ['cp437','epson/katakana','cp850','cp860','cp863','cp865',,,,,,,,,,,'windows1252','cp866','cp852','cp858',,'cp862','cp864','thai42','windows1253','windows1254','windows1257',,'windows1251','cp737','cp775','thai14','bixolon/hebrew','windows1255','thai11','thai18','cp885','cp857','iso8859-7','thai16','windows1256','windows1258','khmer',,,,'bixolon/cp866','windows1250',,'tcvn3','tcvn3capitals','viscii'],
		'citizen': ['cp437','epson/katakana','cp858','cp860','cp863','cp865','cp852','cp866','cp857',,,,,,,,'windows1252',,,,,'thai11',,,,,'thai13',,,,'tcvn3','tcvn3capitals','windows1258',,,,,,,,'cp864'],
		'epson/legacy': ['cp437','epson/katakana','cp850','cp860','cp863','cp865',,,,,,,,,,,'windows1252','cp866','cp852','cp858'],
		'epson': ['cp437','epson/katakana','cp850','cp860','cp863','cp865',,,,,,'cp851','cp853','cp857','cp737','iso8859-7','windows1252','cp866','cp852','cp858','thai42','thai11',,,,,'thai13',,,,'tcvn3','tcvn3capitals','cp720','cp775','cp855','cp861','cp862','cp864','cp869','epson/iso8859-2','iso8859-15','cp1098','cp774','cp772','cp1125','windows1250','windows1251','windows1253','windows1254','windows1255','windows1256','windows1257','windows1258','rk1048'],
		'fujitsu': ['cp437','epson/katakana','cp850','cp860','cp863','cp865',,,'cp857',,,,,,,,'windows1252','cp866','cp852','cp858',,,,,,,'thai13',,,,,,,,,,,,,,'cp864'],
		'hp': ['cp437','cp850','cp852','cp860','cp863','cp865','cp858','cp866','windows1252','cp862','cp737','cp874','cp857','windows1251','windows1255','rk1048'],
		'metapace': ['cp437','epson/katakana','cp850','cp860','cp863','cp865',,,,,,,,,,,,,,'cp858'],
		'mpt': ['cp437',,'cp850','cp860','cp863','cp865','windows1251','cp866','cp3021','cp3012'],
		'pos-5890': ['cp437','epson/katakana','cp850','cp860','cp863','cp865','iso8859-1',,'cp862',,,,,,,,'windows1252','cp866','cp852','cp858',,,,'windows1251','cp737','windows1257',,'windows1258','cp864',,,,'windows1255',,,,,,,,,,,,,,,,,,,,,,,,'cp861',,,,'cp855','cp857',,,,'cp851','cp869',,'cp772','cp774',,,'windows1250',,'cp3840',,'cp3843','cp3844','cp3845','cp3846','cp3847','cp3848',,'cp771','cp3001','cp3002','cp3011','cp3012',,'cp3041','windows1253','windows1254','windows1256','cp720',,'cp775'],
		'pos-8360': ['cp437','epson/katakana','cp850','cp860','cp863','cp865','iso8859-1','windows1253','cp862',,,,,,,,'windows1252','cp866','cp852','cp858',,'latvian',,'windows1251','cp737','windows1257',,'windows1258','cp864',,,'pos8360/hebrew','windows1255',,,,,,,,,,,,,,,,,,,,,,,,'cp861',,,,'cp855','cp857',,,,'cp851','cp869',,'cp772','cp774',,,'windows1250',,'cp3840',,'cp3843','cp3844','cp3845','cp3846','cp3847','cp3848',,'cp771','cp3001','cp3002','cp3011','cp3012',,,,'windows1254','windows1256','cp720',,'cp775'],
		'star': ['cp437','star/katakana','cp850','cp860','cp863','cp865',,,,,,,,,,,'windows1252','cp866','cp852','cp858','thai42','thai11','thai13','thai14','thai16',,'thai18'],
		'xprinter': ['cp437','epson/katakana','cp850','cp860','cp863','cp865','iso8859-1','windows1253','xprinter/hebrew','cp3012',,'windows1255',,,,,'windows1252','cp866','cp852','cp858',,'latvian','cp864','windows1251','cp737','windows1257',,,,,,,,'windows1256'],
		'youku': ['cp437','epson/katakana','cp850','cp860','cp863','cp865','windows1251','cp866','cp3021','cp3012',,,,,,'cp862','windows1252',,'cp852','cp858',,,'cp864','iso8859-1','cp737','windows1257',,,'cp855','cp857','windows1250','cp775','windows1254','windows1255','windows1256','windows1258',,,'iso8859-1',,,,,,'iso8859-15',,,'cp874'],
	},
	'star-prnt': {
		'star': ['star/standard','cp437','star/katakana',,'cp858','cp852','cp860','cp861','cp863','cp865','cp866','cp855','cp857','cp862','cp864','cp737','cp851','cp869','star/cp928','cp772','cp774','star/cp874',,,,,,,,,,,'windows1252','windows1250','windows1251',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,'cp3840','cp3841','cp3843','cp3844','cp3845','cp3846','cp3847','cp3848','cp1001','cp771','cp3001','cp3002','cp3011','cp3012','cp3021','cp3041'],
	}
};

codepageMappings['star-line'] = codepageMappings['star-prnt'];
codepageMappings['esc-pos']['zijang'] = codepageMappings['esc-pos']['pos-5890'];

const printerDefinitions = {
	'bixolon-srp350': {vendor:'Bixolon',model:'SRP-350',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'bixolon/legacy',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{cutter:{feed:4}}},
	'bixolon-srp350iii': {vendor:'Bixolon',model:'SRP-350III',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'bixolon',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56},C:{size:'9x24',columns:56}}},features:{cutter:{feed:4}}},
	'citizen-ct-s310ii': {vendor:'Citizen',model:'CT-S310II',media:{dpi:203,width:80},capabilities:{language:'esc-pos',codepages:'citizen',fonts:{A:{size:'12x24',columns:48},B:{size:'9x24',columns:64},C:{size:'8x16',columns:72}}},features:{cutter:{feed:3}}},
	'epson-tm-p20ii': {vendor:'Epson',model:'TM-P20II',media:{dpi:203,width:58},capabilities:{language:'esc-pos',codepages:'epson',fonts:{A:{size:'12x24',columns:32},B:{size:'9x24',columns:42},C:{size:'9x17',columns:42},D:{size:'10x24',columns:38},E:{size:'8x16',columns:48}}},features:{images:{mode:'raster'},cutter:{feed:3}}},
	'epson-tm-t20iii': {vendor:'Epson',model:'TM-T20III',interfaces:{usb:{productName:'TM-T20III'}},media:{dpi:203,width:80},capabilities:{language:'esc-pos',codepages:'epson',fonts:{A:{size:'12x24',columns:48},B:{size:'9x17',columns:64}}},features:{cutter:{feed:4}}},
	'epson-tm-t70': {vendor:'Epson',model:'TM-T70',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'epson/legacy',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{images:{mode:'raster'},cutter:{feed:4}}},
	'epson-tm-t70ii': {vendor:'Epson',model:'TM-T70II','interface':{usb:{productName:'TM-T70II'}},media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'epson',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{images:{mode:'raster'},cutter:{feed:4}}},
	'epson-tm-t88ii': {vendor:'Epson',model:'TM-T88II',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'epson/legacy',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{cutter:{feed:4}}},
	'epson-tm-t88iii': {vendor:'Epson',model:'TM-T88III',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'epson/legacy',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{cutter:{feed:4}}},
	'epson-tm-t88iv': {vendor:'Epson',model:'TM-T88IV',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'epson/legacy',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{cutter:{feed:4}}},
	'epson-tm-t88v': {vendor:'Epson',model:'TM-T88V',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'epson',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{cutter:{feed:4}}},
	'epson-tm-t88vi': {vendor:'Epson',model:'TM-T88VI',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'epson',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{cutter:{feed:4}}},
	'epson-tm-t88vii': {vendor:'Epson',model:'TM-T88VII',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'epson',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{cutter:{feed:4}}},
	'fujitsu-fp1000': {vendor:'Fujitsu',model:'FP-1000',media:{dpi:203,width:80},capabilities:{language:'esc-pos',codepages:'fujitsu',fonts:{A:{size:'12x24',columns:48},B:{size:'9x24',columns:56},C:{size:'8x16',columns:64}}},features:{cutter:{feed:4}}},
	'hp-a779': {vendor:'HP',model:'A779',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'hp',newline:'\n',fonts:{A:{size:'12x24',columns:44}}},features:{cutter:{feed:4}}},
	'metapace-t1': {vendor:'Metapace',model:'T-1',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'metapace',fonts:{A:{size:'12x24',columns:42},B:{size:'9x17',columns:56}}},features:{cutter:{feed:4}}},
	'mpt-ii': {vendor:'',model:'MPT-II',media:{dpi:180,width:80},capabilities:{language:'esc-pos',codepages:'mpt',fonts:{A:{size:'12x24',columns:48},B:{size:'9x17',columns:64},C:{size:'0x0',columns:64}}}},
	'pos-5890': {vendor:'',model:'POS-5890',media:{dpi:203,width:58},capabilities:{language:'esc-pos',codepages:'pos-5890',fonts:{A:{size:'12x24',columns:32},B:{size:'9x17',columns:42}}},features:{images:{mode:'raster'},cutter:{feed:1}}},
	'pos-8360': {vendor:'',model:'POS-8360',media:{dpi:203,width:80},capabilities:{language:'esc-pos',codepages:'pos-8360',fonts:{A:{size:'12x24',columns:32},B:{size:'9x17',columns:42}}},features:{images:{mode:'raster'},cutter:{feed:4}}},
	'star-mc-print2': {vendor:'Star',model:'mC-Print2',interfaces:{usb:{productName:'mC-Print2'}},media:{dpi:203,width:58},capabilities:{language:'star-prnt',codepages:'star',fonts:{A:{size:'12x24',columns:32},B:{size:'9x24',columns:42}}},features:{cutter:{feed:3}}},
	'star-mpop': {vendor:'Star',model:'mPOP',interfaces:{usb:{productName:'mPOP'}},media:{dpi:203,width:58},capabilities:{language:'star-prnt',codepages:'star',fonts:{A:{size:'12x24',columns:32},B:{size:'9x24',columns:42}}},features:{cutter:{feed:3}}},
	'star-sm-l200': {vendor:'Star',model:'SM-L200',media:{dpi:203,width:58},capabilities:{language:'star-prnt',codepages:'star',fonts:{A:{size:'12x24',columns:32},B:{size:'9x24',columns:42},C:{size:'9x17',columns:42}}}},
	'star-tsp100iv': {vendor:'Star',model:'TSP100IV',media:{dpi:203,width:80},capabilities:{language:'star-prnt',codepages:'star',fonts:{A:{size:'12x24',columns:48},B:{size:'9x24',columns:64}}},features:{cutter:{feed:3}}},
	'star-tsp650ii': {vendor:'Star',model:'TSP650II',media:{dpi:203,width:80},capabilities:{language:'star-line',codepages:'star',fonts:{A:{size:'12x24',columns:48},B:{size:'9x24',columns:64}}},features:{cutter:{feed:3}}},
	'xprinter-xp-n160ii': {vendor:'Xprinter',model:'XP-N160II',interfaces:{usb:{productName:'Printer-80\u0000'}},media:{dpi:203,width:80},capabilities:{language:'esc-pos',codepages:'xprinter',fonts:{A:{size:'12x24',columns:48},B:{size:'9x17',columns:64}}},features:{cutter:{feed:4}}},
	'xprinter-xp-t80q': {vendor:'Xprinter',model:'XP-T80Q',media:{dpi:203,width:80},capabilities:{language:'esc-pos',codepages:'xprinter',fonts:{A:{size:'12x24',columns:48},B:{size:'9x17',columns:64}}},features:{cutter:{feed:4}}},
	'youku-58t': {vendor:'Youku',model:'58T',media:{dpi:203,width:58},capabilities:{language:'esc-pos',codepages:'youku',fonts:{A:{size:'12x24',columns:32},B:{size:'9x24',columns:42}}}},
};

/**
 * Create a byte stream based on commands for receipt printers
 */
class ReceiptPrinterEncoder {
  #options = {};
  #queue = [];

  #language;
  #composer;

  #fontMapping = {
    'A': {size: '12x24', columns: 42},
    'B': {size: '9x24', columns: 56},
  };

  #codepageMapping = {};
  #codepageCandidates = [];
  #codepage = 'cp437';

  #state = {
    'codepage': 0,
    'font': 'A',
  };


  /**
     * Create a new object
     *
     * @param  {object}   options   Object containing configuration options
    */
  constructor(options) {
    options = options || {};

    const defaults = {
      columns: 42,
      language: 'esc-pos',
      imageMode: 'column',
      feedBeforeCut: 0,
      newline: '\n\r',
      codepageMapping: 'epson',
      codepageCandidates: null,
    };

    /* Determine default settings based on the printer language */

    if (typeof options.language === 'string') {
      defaults.columns = options.language === 'esc-pos' ? 42 : 48;
      defaults.codepageMapping = options.language === 'esc-pos' ? 'epson' : 'star';
    }

    /* Determine default settings based on the printer model */

    if (typeof options.printerModel === 'string') {
      if (typeof printerDefinitions[options.printerModel] === 'undefined') {
        throw new Error('Unknown printer model');
      }

      const printerDefinition = printerDefinitions[options.printerModel];

      /* Apply the printer definition to the defaults */

      defaults.columns = printerDefinition.capabilities.fonts['A'].columns;
      defaults.language = printerDefinition.capabilities.language;
      defaults.codepageMapping = printerDefinition.capabilities.codepages;
      defaults.newline = printerDefinition.capabilities?.newline || defaults.newline;
      defaults.feedBeforeCut = printerDefinition.features?.cutter?.feed || defaults.feedBeforeCut;
      defaults.imageMode = printerDefinition.features?.images?.mode || defaults.imageMode;

      /* Apply the font mapping */

      this.#fontMapping = printerDefinition.capabilities.fonts;
    }

    /* Merge options */

    if (options) {
      this.#options = Object.assign(defaults, {
        debug: false,
        embedded: false,
        createCanvas: null,
      }, options);
    }

    /* Backwards compatibility for the width option */

    if (this.#options.width) {
      this.#options.columns = this.#options.width;
    }

    /* Get the printer language */

    if (this.#options.language === 'esc-pos') {
      this.#language = new LanguageEscPos();
    } else if (this.#options.language === 'star-prnt' || this.#options.language === 'star-line') {
      this.#language = new LanguageStarPrnt();
    } else {
      throw new Error('The specified language is not supported');
    }

    /* Determine autoflush settings */
    /*

        StarPRNT printers are set up to have print start control set to page units.
        That means the printer will only print after it has received a cut or ff command.
        This is not ideal, so we set autoFlush to true by default, which will force
        the printer to print after each encode().

        One problem, we do not want to do this for embedded content. Only the top level
        encoder should flush the buffer.

        ESC/POS and Star Line Mode printers are set up to have print start control set to
        line units, which means the printer will print after each line feed command.
        We do not need to flush the buffer for these printers.

    */

    if (typeof this.#options.autoFlush === 'undefined') {
      this.#options.autoFlush = ! this.#options.embedded && this.#options.language == 'star-prnt';
    }

    /* Check column width */

    if (![32, 35, 42, 44, 48].includes(this.#options.columns) && !this.#options.embedded) {
      throw new Error('The width of the paper must me either 32, 35, 42, 44 or 48 columns');
    }

    /* Determine codepage mapping and candidates */

    if (typeof this.#options.codepageMapping === 'string') {
      if (typeof codepageMappings[this.#options.language][this.#options.codepageMapping] === 'undefined') {
        throw new Error('Unknown codepage mapping');
      }

      this.#codepageMapping = Object.fromEntries(codepageMappings[this.#options.language][this.#options.codepageMapping]
          .map((v, i) => [v, i])
          .filter((i) => i));
    } else {
      this.#codepageMapping = this.#options.codepageMapping;
    }

    if (this.#options.codepageCandidates) {
      this.#codepageCandidates = this.#options.codepageCandidates;
    } else {
      this.#codepageCandidates = Object.keys(this.#codepageMapping);
    }

    /* Create our line composer */

    this.#composer = new LineComposer({
      embedded: this.#options.embedded,
      columns: this.#options.columns,
      align: 'left',
      size: 1,

      callback: (value) => this.#queue.push(value),
    });

    this.#reset();
  }

  /**
    * Reset the state of the object
    */
  #reset() {
    this.#queue = [];
    this.#codepage = this.#options.language == 'esc-pos' ? 'cp437' : 'star/standard';
    this.#state.codepage = 0;
    this.#state.font = 'A';
  }

  /**
     * Initialize the printer
     *
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  initialize() {
    if (this.#options.embedded) {
      throw new Error('Initialize is not supported in table cells or boxes');
    }

    this.#composer.raw(
        this.#language.initialize(),
    );

    return this;
  }

  /**
     * Change the code page
     *
     * @param  {string}   codepage  The codepage that we set the printer to
     * @return {object}             Return the object, for easy chaining commands
     *
     */
  codepage(codepage) {
    if (codepage === 'auto') {
      this.#codepage = codepage;
      return this;
    }

    if (!CodepageEncoder.supports(codepage)) {
      throw new Error('Unknown codepage');
    }

    if (typeof this.#codepageMapping[codepage] !== 'undefined') {
      this.#codepage = codepage;
    } else {
      throw new Error('Codepage not supported by printer');
    }

    return this;
  }

  /**
     * Print text
     *
     * @param  {string}   value  Text that needs to be printed
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  text(value) {
    this.#composer.text(value, this.#codepage);

    return this;
  }

  /**
     * Print a newline
     *
     * @param  {string}   value  The number of newlines that need to be printed, defaults to 1
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  newline(value) {
    value = parseInt(value, 10) || 1;

    for (let i = 0; i < value; i++) {
      this.#composer.flush({forceNewline: true});
    }

    return this;
  }

  /**
     * Print text, followed by a newline
     *
     * @param  {string}   value  Text that needs to be printed
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  line(value) {
    this.text(value);
    this.newline();

    return this;
  }

  /**
     * Underline text
     *
     * @param  {boolean|number}   value  true to turn on underline, false to turn off, or 2 for double underline
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  underline(value) {
    if (typeof value === 'undefined') {
      this.#composer.style.underline = ! this.#composer.style.underline;
    } else {
      this.#composer.style.underline = value;
    }

    return this;
  }

  /**
     * Italic text
     *
     * @param  {boolean}          value  true to turn on italic, false to turn off
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  italic(value) {
    if (typeof value === 'undefined') {
      this.#composer.style.italic = ! this.#composer.style.italic;
    } else {
      this.#composer.style.italic = value;
    }

    return this;
  }

  /**
     * Bold text
     *
     * @param  {boolean}          value  true to turn on bold, false to turn off
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  bold(value) {
    if (typeof value === 'undefined') {
      this.#composer.style.bold = ! this.#composer.style.bold;
    } else {
      this.#composer.style.bold = value;
    }

    return this;
  }

  /**
     * Invert text
     *
     * @param  {boolean}          value  true to turn on white text on black, false to turn off
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  invert(value) {
    if (typeof value === 'undefined') {
      this.#composer.style.invert = ! this.#composer.style.invert;
    } else {
      this.#composer.style.invert = value;
    }

    return this;
  }

  /**
     * Change width of text
     *
     * @param  {number}          width    The width of the text, 1 - 8
     * @return {object}                   Return the object, for easy chaining commands
     *
     */
  width(width) {
    if (typeof width === 'undefined') {
      width = 1;
    }

    if (typeof width !== 'number') {
      throw new Error('Width must be a number');
    }

    if (width < 1 || width > 8) {
      throw new Error('Width must be between 1 and 8');
    }

    this.#composer.style.width = width;

    return this;
  }

  /**
     * Change height of text
     *
     * @param  {number}          height  The height of the text, 1 - 8
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  height(height) {
    if (typeof height === 'undefined') {
      height = 1;
    }

    if (typeof height !== 'number') {
      throw new Error('Height must be a number');
    }

    if (height < 1 || height > 8) {
      throw new Error('Height must be between 1 and 8');
    }

    this.#composer.style.height = height;

    return this;
  }

  /**
     * Change text size
     *
     * @param  {Number|string}   width   The width of the text, 1 - 8
     * @param  {Number}          height  The height of the text, 1 - 8
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  size(width, height) {
    /* Backwards compatiblity for changing the font */
    if (typeof width === 'string') {
      return this.font(width === 'small' ? 'B' : 'A');
    }

    if (typeof height === 'undefined') {
      height = width;
    }

    this.width(width);
    this.height(height);

    return this;
  }

  /**
     * Choose different font
     *
     * @param  {string}          value   'A', 'B' or others
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  font(value) {
    if (this.#options.embedded) {
      throw new Error('Changing fonts is not supported in table cells or boxes');
    }

    if (this.#composer.cursor > 0) {
      throw new Error('Changing fonts is not supported in the middle of a line');
    }

    /* If size is specified, find the matching font */

    const matches = value.match(/^[0-9]+x[0-9]+$/);
    if (matches) {
      value = Object.entries(this.#fontMapping).find((i) => i[1].size == matches[0])[0];
    }

    /* Make sure the font name is uppercase */

    value = value.toUpperCase();

    /* Check if the font is supported */

    if (typeof this.#fontMapping[value] === 'undefined') {
      throw new Error('Unsuppored font');
    }

    /* Change the font */

    this.#composer.raw(
        this.#language.font(value),
    );

    this.#state.font = value;

    /* Change the width of the composer */

    if (value === 'A') {
      this.#composer.columns = this.#options.columns;
    } else {
      this.#composer.columns =
        (this.#options.columns / this.#fontMapping['A'].columns) * this.#fontMapping[value].columns;
    }

    return this;
  }

  /**
     * Change text alignment
     *
     * @param  {string}          value   left, center or right
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  align(value) {
    const alignments = ['left', 'center', 'right'];

    if (!alignments.includes(value)) {
      throw new Error('Unknown alignment');
    }

    this.#composer.align = value;

    return this;
  }

  /**
     * Insert a table
     *
     * @param  {array}           columns  The column definitions
     * @param  {array}           data     Array containing rows. Each row is an array containing cells.
     *                                    Each cell can be a string value, or a callback function.
     *                                    The first parameter of the callback is the encoder object on
     *                                    which the function can call its methods.
     * @return {object}                   Return the object, for easy chaining commands
     *
     */
  table(columns, data) {
    this.#composer.flush();

    /* Process all lines */

    for (let r = 0; r < data.length; r++) {
      const lines = [];
      let maxLines = 0;

      /* Render all columns */

      for (let c = 0; c < columns.length; c++) {
        const columnEncoder = new ReceiptPrinterEncoder(Object.assign({}, this.#options, {
          width: columns[c].width,
          embedded: true,
        }));

        columnEncoder._codepage = this.#codepage;
        columnEncoder.align(columns[c].align);

        if (typeof data[r][c] === 'string') {
          columnEncoder.text(data[r][c]);
        }

        if (typeof data[r][c] === 'function') {
          data[r][c](columnEncoder);
        }

        const cell = columnEncoder.commands();

        /* Determine the height in lines of the row */

        maxLines = Math.max(maxLines, cell.length);

        lines[c] = cell;
      }

      /* Pad the cells in this line to the same height */

      for (let c = 0; c < columns.length; c++) {
        if (lines[c].length >= maxLines) {
          continue;
        }

        for (let p = lines[c].length; p < maxLines; p++) {
          let verticalAlign = 'top';
          if (typeof columns[c].verticalAlign !== 'undefined') {
            verticalAlign = columns[c].verticalAlign;
          }

          const line = {commands: [{type: 'space', size: columns[c].width}], height: 1};

          if (verticalAlign == 'bottom') {
            lines[c].unshift(line);
          } else {
            lines[c].push(line);
          }
        }
      }

      /* Add the lines to the composer */

      for (let l = 0; l < maxLines; l++) {
        for (let c = 0; c < columns.length; c++) {
          if (typeof columns[c].marginLeft !== 'undefined') {
            this.#composer.space(columns[c].marginLeft);
          }

          this.#composer.add(lines[c][l].commands, columns[c].width);

          if (typeof columns[c].marginRight !== 'undefined') {
            this.#composer.space(columns[c].marginRight);
          }
        }

        this.#composer.flush();
      }
    }

    return this;
  }

  /**
     * Insert a horizontal rule
     *
     * @param  {object}          options  And object with the following properties:
     *                                    - style: The style of the line, either single or double
     *                                    - width: The width of the line, by default the width of the paper
     * @return {object}                   Return the object, for easy chaining commands
     *
     */
  rule(options) {
    options = Object.assign({
      style: 'single',
      width: this.#options.columns || 10,
    }, options || {});

    this.#composer.flush();

    this.#composer.text((options.style === 'double' ? '═' : '─').repeat(options.width), 'cp437');
    this.#composer.flush();

    return this;
  }

  /**
     * Insert a box
     *
     * @param  {object}           options   And object with the following properties:
     *                                      - style: The style of the border, either single or double
     *                                      - width: The width of the box, by default the width of the paper
     *                                      - marginLeft: Space between the left border and the left edge
     *                                      - marginRight: Space between the right border and the right edge
     *                                      - paddingLeft: Space between the contents and the left border of the box
     *                                      - paddingRight: Space between the contents and the right border of the box
     * @param  {string|function}  contents  A string value, or a callback function.
     *                                      The first parameter of the callback is the encoder object on
     *                                      which the function can call its methods.
     * @return {object}                     Return the object, for easy chaining commands
     *
     */
  box(options, contents) {
    options = Object.assign({
      style: 'single',
      width: this.#options.columns,
      marginLeft: 0,
      marginRight: 0,
      paddingLeft: 0,
      paddingRight: 0,
    }, options || {});

    if (options.width + options.marginLeft + options.marginRight > this.#options.columns) {
      throw new Error('Box is too wide');
    }

    let elements;

    if (options.style == 'single') {
      elements = ['┌', '┐', '└', '┘', '─', '│'];
    } else if (options.style == 'double') {
      elements = ['╔', '╗', '╚', '╝', '═', '║'];
    }

    /* Render the contents of the box */

    const columnEncoder = new ReceiptPrinterEncoder(Object.assign({}, this.#options, {
      width: options.width - (options.style == 'none' ? 0 : 2) - options.paddingLeft - options.paddingRight,
      embedded: true,
    }));

    columnEncoder.codepage(this.#codepage);
    columnEncoder.align(options.align);

    if (typeof contents === 'function') {
      contents(columnEncoder);
    }

    if (typeof contents === 'string') {
      columnEncoder.text(contents);
    }

    const lines = columnEncoder.commands();

    /* Header */

    this.#composer.flush();

    if (options.style != 'none') {
      this.#composer.space(options.marginLeft);
      this.#composer.text(elements[0], 'cp437');
      this.#composer.text(elements[4].repeat(options.width - 2), 'cp437');
      this.#composer.text(elements[1], 'cp437');
      this.#composer.space(options.marginRight);
      this.#composer.flush();
    }

    /* Content */

    for (let i = 0; i < lines.length; i++) {
      this.#composer.space(options.marginLeft);

      if (options.style != 'none') {
        this.#composer.style.height = lines[i].height;
        this.#composer.text(elements[5], 'cp437');
        this.#composer.style.height = 1;
      }

      this.#composer.space(options.paddingLeft);
      this.#composer.add(lines[i].commands,
          options.width - (options.style == 'none' ? 0 : 2) - options.paddingLeft - options.paddingRight);
      this.#composer.space(options.paddingRight);

      if (options.style != 'none') {
        this.#composer.style.height = lines[i].height;
        this.#composer.text(elements[5], 'cp437');
        this.#composer.style.height = 1;
      }

      this.#composer.space(options.marginRight);
      this.#composer.flush();
    }

    /* Footer */

    if (options.style != 'none') {
      this.#composer.space(options.marginLeft);
      this.#composer.text(elements[2], 'cp437');
      this.#composer.text(elements[4].repeat(options.width - 2), 'cp437');
      this.#composer.text(elements[3], 'cp437');
      this.#composer.space(options.marginRight);
      this.#composer.flush();
    }

    return this;
  }

  /**
     * Barcode
     *
     * @param  {string}           value  the value of the barcode
     * @param  {string}           symbology  the type of the barcode
     * @param  {number}           height  height of the barcode
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  barcode(value, symbology, height) {
    if (this.#options.embedded) {
      throw new Error('Barcodes are not supported in table cells or boxes');
    }

    this.#composer.flush();

    /* Set alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.raw(this.#language.align(this.#composer.align));
    }

    /* Barcode */

    this.#composer.raw(
        this.#language.barcode(value, symbology, height),
    );

    /* Reset alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.raw(this.#language.align('left'));
    }

    this.#composer.flush();

    return this;
  }

  /**
     * QR code
     *
     * @param  {string}           value  the value of the qr code
     * @param  {number}           model  model of the qrcode, either 1 or 2
     * @param  {number}           size   size of the qrcode, a value between 1 and 8
     * @param  {string}           errorlevel  the amount of error correction used, either 'l', 'm', 'q', 'h'
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  qrcode(value, model, size, errorlevel) {
    if (this.#options.embedded) {
      throw new Error('QR codes are not supported in table cells or boxes');
    }

    /* Force printing the print buffer and moving to a new line */

    this.#composer.flush();

    /* Set alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.raw(this.#language.align(this.#composer.align));
    }

    /* QR code */

    this.#composer.raw(
        this.#language.qrcode(value, model, size, errorlevel),
    );

    /* Reset alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.raw(this.#language.align('left'));
    }

    this.#composer.flush();

    return this;
  }


  /**
     * PDF417 code
     *
     * @param  {string}           value     The value of the qr code
     * @param  {object}           options   Configuration object
     * @return {object}                     Return the object, for easy chaining commands
     *
     */
  pdf417(value, options) {
    options = Object.assign({
      width: 3,
      height: 3,
      columns: 0,
      rows: 0,
      errorlevel: 1,
      truncated: false,
    }, options || {});

    if (this.#options.embedded) {
      throw new Error('PDF417 codes are not supported in table cells or boxes');
    }

    /* Force printing the print buffer and moving to a new line */

    this.#composer.flush();

    /* Set alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.raw(this.#language.align(this.#composer.align));
    }

    /* PDF417 code */

    this.#composer.raw(
        this.#language.pdf417(value, options),
    );

    /* Reset alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.raw(this.#language.align('left'));
    }

    this.#composer.flush();

    return this;
  }


  /**
     * Image
     *
     * @param  {object}         input  an element, like a canvas or image that needs to be printed
     * @param  {number}         width  width of the image on the printer
     * @param  {number}         height  height of the image on the printer
     * @param  {string}         algorithm  the dithering algorithm for making the image black and white
     * @param  {number}         threshold  threshold for the dithering algorithm
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  image(input, width, height, algorithm, threshold) {
    if (this.#options.embedded) {
      throw new Error('Images are not supported in table cells or boxes');
    }

    if (width % 8 !== 0) {
      throw new Error('Width must be a multiple of 8');
    }

    if (height % 8 !== 0) {
      throw new Error('Height must be a multiple of 8');
    }

    if (typeof algorithm === 'undefined') {
      algorithm = 'threshold';
    }

    if (typeof threshold === 'undefined') {
      threshold = 128;
    }

    /* Determine the type of the input */

    const name = input.constructor.name;
    let type;

    name.endsWith('Element') ? type = 'element' : null;
    name == 'ImageData' ? type = 'imagedata' : null;
    name == 'Canvas' && typeof input.getContext !== 'undefined' ? type = 'node-canvas' : null;
    name == 'Image' ? type = 'node-canvas-image' : null;
    name == 'Image' && typeof input.frames !== 'undefined' ? type = 'node-read-image' : null;
    name == 'Object' && input.data && input.info ? type = 'node-sharp' : null;
    name == 'View3duint8' && input.data && input.shape ? type = 'ndarray' : null;
    name == 'Object' && input.data && input.width && input.height ? type = 'object' : null;

    if (!type) {
      throw new Error('Could not determine the type of image input');
    }

    /* Turn provided data into an ImageData object */

    let image;

    if (type == 'element') {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.drawImage(input, 0, 0, width, height);
      image = context.getImageData(0, 0, width, height);
    }

    if (type == 'node-canvas') {
      const context = input.getContext('2d');
      image = context.getImageData(0, 0, input.width, input.height);
    }

    if (type == 'node-canvas-image') {
      if (typeof this.#options.createCanvas !== 'function') {
        throw new Error('Canvas is not supported in this environment, specify a createCanvas function in the options');
      }

      const canvas = this.#options.createCanvas(width, height);
      const context = canvas.getContext('2d');
      context.drawImage(input, 0, 0, width, height);
      image = context.getImageData(0, 0, width, height);
    }

    if (type == 'node-read-image') {
      image = new ImageData(input.width, input.height);
      image.data.set(input.frames[0].data);
    }

    if (type == 'node-sharp') {
      image = new ImageData(input.info.width, input.info.height);
      image.data.set(input.data);
    }

    if (type == 'ndarray') {
      image = new ImageData(input.shape[0], input.shape[1]);
      image.data.set(input.data);
    }

    if (type == 'object') {
      image = new ImageData(input.width, input.height);
      image.data.set(input.data);
    }

    if (type == 'imagedata') {
      image = input;
    }

    if (!image) {
      throw new Error('Image could not be loaded');
    }

    /* Resize image */

    if (width !== image.width || height !== image.height) {
      image = resizeImageData(image, width, height, 'bilinear-interpolation');
    }

    /* Check if the image has the correct dimensions */

    if (width !== image.width || height !== image.height) {
      throw new Error('Image could not be resized');
    }

    /* Flatten the image and dither it */

    image = Flatten.flatten(image, [0xff, 0xff, 0xff]);

    switch (algorithm) {
      case 'threshold': image = Dither.threshold(image, threshold); break;
      case 'bayer': image = Dither.bayer(image, threshold); break;
      case 'floydsteinberg': image = Dither.floydsteinberg(image); break;
      case 'atkinson': image = Dither.atkinson(image); break;
    }


    this.#composer.flush();

    /* Set alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.raw(this.#language.align(this.#composer.align));
    }

    /* Encode the image data */

    this.#composer.raw(
        this.#language.image(image, width, height, this.#options.imageMode),
    );

    /* Reset alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.raw(this.#language.align('left'));
    }

    this.#composer.flush();

    return this;
  }

  /**
     * Cut paper
     *
     * @param  {string}          value   full or partial. When not specified a full cut will be assumed
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  cut(value) {
    if (this.#options.embedded) {
      throw new Error('Cut is not supported in table cells or boxes');
    }

    this.#composer.flush();

    for (let i = 0; i < this.#options.feedBeforeCut; i++) {
      this.#composer.flush({forceNewline: true});
    }

    this.#composer.raw(
        this.#language.cut(value),
    );

    this.#composer.flush();

    return this;
  }

  /**
     * Pulse
     *
     * @param  {number}          device  0 or 1 for on which pin the device is connected, default of 0
     * @param  {number}          on      Time the pulse is on in milliseconds, default of 100
     * @param  {number}          off     Time the pulse is off in milliseconds, default of 500
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  pulse(device, on, off) {
    if (this.#options.embedded) {
      throw new Error('Pulse is not supported in table cells or boxes');
    }

    this.#composer.flush();

    this.#composer.raw(
        this.#language.pulse(device, on, off),
    );

    this.#composer.flush();

    return this;
  }

  /**
     * Add raw printer commands
     *
     * @param  {array}           data   raw bytes to be included
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  raw(data) {
    this.#composer.raw(data);

    return this;
  }

  /**
   * Internal function for encoding style changes
   * @param  {string}          property  The property that needs to be changed
   * @param  {boolean}         value     Is the property enabled or disabled
   * @return {array}                     Return the encoded bytes
   */
  #encodeStyle(property, value) {
    if (property === 'bold') {
      return this.#language.bold(value);
    }

    if (property === 'underline') {
      return this.#language.underline(value);
    }

    if (property === 'italic') {
      return this.#language.italic(value);
    }

    if (property === 'invert') {
      return this.#language.invert(value);
    }

    if (property === 'size') {
      return this.#language.size(value.width, value.height);
    }
  }

  /**
   * Internal function for encoding text in the correct codepage
   * @param  {string}          value  The text that needs to be encoded
   * @param  {string}          codepage  The codepage that needs to be used
   * @return {array}                   Return the encoded bytes
   */
  #encodeText(value, codepage) {
    if (codepage !== 'auto') {
      const fragment = CodepageEncoder.encode(value, codepage);

      if (this.#state.codepage != this.#codepageMapping[codepage]) {
        this.#state.codepage = this.#codepageMapping[codepage];

        return [
          ...this.#language.codepage(this.#codepageMapping[codepage]),
          ...fragment,
        ];
      }

      return [...fragment];
    }

    const fragments = CodepageEncoder.autoEncode(value, this.#codepageCandidates);
    const buffer = [];

    for (const fragment of fragments) {
      this.#state.codepage = this.#codepageMapping[fragment.codepage];
      buffer.push(
          ...this.#language.codepage(this.#codepageMapping[fragment.codepage]),
          ...fragment.bytes,
      );
    }

    return buffer;
  }

  /**
   * Get all the commands
   *
   * @return {array}         All the commands currently in the queue
   */
  commands() {
    const result = [];

    const remaining = this.#composer.fetch(true);

    if (remaining.length) {
      this.#queue.push(remaining);
    }

    /* Flush the printer line buffer if needed */

    if (this.#options.autoFlush && !this.#options.embedded) {
      this.#queue.push(this.#language.flush());
    }

    /* Process all lines in the queue */

    while (this.#queue.length) {
      const line = this.#queue.shift();
      const height = line
          .filter((i) => i.type === 'style' && i.property === 'size')
          .map((i) => i.value.height)
          .reduce((a, b) => Math.max(a, b), 1);

      if (this.#options.debug) {
        console.log('|' + line.filter((i) => i.type === 'text').map((i) => i.value).join('') + '|', height);
      }

      result.push({
        commands: line,
        height: height,
      });
    }

    this.#reset();

    return result;
  }

  /**
     * Encode all previous commands
     *
     * @return {Uint8Array}         Return the encoded bytes
     */
  encode() {
    const commands = this.commands();
    const result = [];

    for (const line of commands) {
      for (const item of line.commands) {
        if (item.type === 'raw') {
          result.push(item.value);
        }

        if (item.type === 'text') {
          result.push(this.#encodeText(item.value, item.codepage));
        }

        if (item.type === 'style') {
          result.push(this.#encodeStyle(item.property, item.value));
        }
      }

      if (this.#options.newline === '\n\r') {
        result.push([0x0a, 0x0d]);
      }

      if (this.#options.newline === '\n') {
        result.push([0x0a]);
      }
    }

    return Uint8Array.from(result.flat());
  }

  /**
   * Get all supported printer models
   *
   * @return {object}         An object with all supported printer models
   */
  static get printerModels() {
    return Object.fromEntries(Object.entries(printerDefinitions).map((i) => [i[0], i[1].vendor + ' ' + i[1].model]));
  }

  /**
   * Get the current column width
   *
   * @return {number}         The column width in characters
   */
  get columns() {
    return this.#composer.columns;
  }

  /**
   * Get the current language
   * @return {string}         The language that is currently used
   */
  get language() {
    return this.#options.language;
  }
}

export { ReceiptPrinterEncoder as default };
