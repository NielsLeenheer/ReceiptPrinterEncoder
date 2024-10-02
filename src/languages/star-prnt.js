import CodepageEncoder from '@point-of-sale/codepage-encoder';

/**
 * StarPRNT Language commands
 */
class LanguageStarPrnt {
  /**
     * Initialize the printer
     * @return {Array}         Array of bytes to send to the printer
     */
  initialize() {
    return [
      {
        type: 'initialize',
        payload: [0x1b, 0x40, 0x18],
      },
    ];
  }

  /**
     * Change the font
     * @param {string} value     Font type ('A', 'B' or 'C')
     * @return {Array}         Array of bytes to send to the printer
     */
  font(value) {
    let type = 0x00;

    if (value === 'B') {
      type = 0x01;
    }

    if (value === 'C') {
      type = 0x02;
    }

    return [
      {
        type: 'font',
        value,
        payload: [0x1b, 0x1e, 0x46, type],
      },
    ];
  }

  /**
     * Change the alignment
     * @param {string} value    Alignment value ('left', 'center', 'right')
     * @return {Array}         Array of bytes to send to the printer
     */
  align(value) {
    let align = 0x00;

    if (value === 'center') {
      align = 0x01;
    } else if (value === 'right') {
      align = 0x02;
    }

    return [
      {
        type: 'align',
        value,
        payload: [0x1b, 0x1d, 0x61, align],
      },
    ];
  }

  /**
     * Generate a barcode
     * @param {string} value        Value to encode
     * @param {string|number} symbology    Barcode symbology
     * @param {object} options      Configuration object
     * @return {Array}             Array of bytes to send to the printer
     */
  barcode(value, symbology, options) {
    const result = [];

    const symbologies = {
      'upce': 0x00,
      'upca': 0x01,
      'ean8': 0x02,
      'ean13': 0x03,
      'code39': 0x04,
      'itf': 0x05,
      'interleaved-2-of-5': 0x05,
      'code128': 0x06,
      'code93': 0x07,
      'nw-7': 0x08,
      'codabar': 0x08,
      'gs1-128': 0x09,
      'gs1-databar-omni': 0x0a,
      'gs1-databar-truncated': 0x0b,
      'gs1-databar-limited': 0x0c,
      'gs1-databar-expanded': 0x0d,
    };

    if (typeof symbology === 'string' && typeof symbologies[symbology] === 'undefined') {
      throw new Error(`Symbology '${symbology}' not supported by language`);
    }

    if (options.width < 1 || options.width > 3) {
      throw new Error('Width must be between 1 and 3');
    }

    /* Selecting mode A, B or C for Code128 is not supported for StarPRNT, so ignore it and let the printer choose */

    if (symbology === 'code128' && value.startsWith('{')) {
      value = value.slice(2);
    }

    /* Encode the barcode value */

    const bytes = CodepageEncoder.encode(value, 'ascii');

    const identifier = typeof symbology === 'string' ? symbologies[symbology] : symbology;

    result.push(
        {
          type: 'barcode',
          value: {symbology: symbology, data: value, width: options.width, height: options.height, text: options.text},
          payload: [
            0x1b, 0x62,
            identifier,
            options.text ? 0x02 : 0x01,
            options.width,
            options.height,
            ...bytes, 0x1e,
          ],
        },
    );

    return result;
  }

  /**
     * Generate a QR code
     * @param {string} value        Value to encode
     * @param {object} options      Configuration object
     * @return {Array}             Array of bytes to send to the printer
     */
  qrcode(value, options) {
    const result = [];

    /* Model */

    const models = {
      1: 0x01,
      2: 0x02,
    };

    if (options.model in models) {
      result.push(
          {
            type: 'qrcode',
            property: 'model',
            value: options.model,
            payload: [0x1b, 0x1d, 0x79, 0x53, 0x30, models[options.model]],
          },
      );
    } else {
      throw new Error('Model must be 1 or 2');
    }

    /* Size */

    if (typeof options.size !== 'number') {
      throw new Error('Size must be a number');
    }

    if (options.size < 1 || options.size > 8) {
      throw new Error('Size must be between 1 and 8');
    }

    result.push(
        {
          type: 'qrcode',
          property: 'size',
          value: options.size,
          payload: [0x1b, 0x1d, 0x79, 0x53, 0x32, options.size],
        },
    );

    /* Error level */

    const errorlevels = {
      'l': 0x00,
      'm': 0x01,
      'q': 0x02,
      'h': 0x03,
    };

    if (options.errorlevel in errorlevels) {
      result.push(
          {
            type: 'qrcode',
            property: 'errorlevel',
            value: options.errorlevel,
            payload: [0x1b, 0x1d, 0x79, 0x53, 0x31, errorlevels[options.errorlevel]],
          },
      );
    } else {
      throw new Error('Error level must be l, m, q or h');
    }

    /* Data */

    const bytes = CodepageEncoder.encode(value, 'iso8859-1');
    const length = bytes.length;

    result.push(
        {
          type: 'qrcode',
          property: 'data',
          value,
          payload: [
            0x1b, 0x1d, 0x79, 0x44, 0x31, 0x00,
            length & 0xff, (length >> 8) & 0xff,
            ...bytes,
          ],
        },
    );

    /* Print QR code */

    result.push(
        {
          type: 'qrcode',
          command: 'print',
          payload: [0x1b, 0x1d, 0x79, 0x50],
        },
    );

    return result;
  }

  /**
     * Generate a PDF417 code
     * @param {string} value        Value to encode
     * @param {object} options      Configuration object
     * @return {Array}             Array of bytes to send to the printer
     */
  pdf417(value, options) {
    const result = [];

    /* Columns and Rows */

    if (typeof options.columns !== 'number') {
      throw new Error('Columns must be a number');
    }

    if (options.columns !== 0 && (options.columns < 1 || options.columns > 30)) {
      throw new Error('Columns must be 0, or between 1 and 30');
    }

    if (typeof options.rows !== 'number') {
      throw new Error('Rows must be a number');
    }

    if (options.rows !== 0 && (options.rows < 3 || options.rows > 90)) {
      throw new Error('Rows must be 0, or between 3 and 90');
    }

    result.push(
        {
          type: 'pdf417',
          value: `rows: ${options.rows}, columns: ${options.columns}`,
          payload: [0x1b, 0x1d, 0x78, 0x53, 0x30, 0x01, options.rows, options.columns],
        },
    );

    /* Width */

    if (typeof options.width !== 'number') {
      throw new Error('Width must be a number');
    }

    if (options.width < 2 || options.width > 8) {
      throw new Error('Width must be between 2 and 8');
    }

    result.push(
        {
          type: 'pdf417',
          property: 'width',
          value: options.width,
          payload: [0x1b, 0x1d, 0x78, 0x53, 0x32, options.width],
        },
    );

    /* Height */

    if (typeof options.height !== 'number') {
      throw new Error('Height must be a number');
    }

    if (options.height < 2 || options.height > 8) {
      throw new Error('Height must be between 2 and 8');
    }

    result.push(
        {
          type: 'pdf417',
          property: 'height',
          value: options.height,
          payload: [0x1b, 0x1d, 0x78, 0x53, 0x33, options.height],
        },
    );

    /* Error level */

    if (typeof options.errorlevel !== 'number') {
      throw new Error('Errorlevel must be a number');
    }

    if (options.errorlevel < 0 || options.errorlevel > 8) {
      throw new Error('Errorlevel must be between 0 and 8');
    }

    result.push(
        {
          type: 'pdf417',
          property: 'errorlevel',
          value: options.errorlevel,
          payload: [0x1b, 0x1d, 0x78, 0x53, 0x31, options.errorlevel],
        },
    );

    /* Data */

    const bytes = CodepageEncoder.encode(value, 'ascii');
    const length = bytes.length;

    result.push(
        {
          type: 'pdf417',
          property: 'data',
          value,
          payload: [
            0x1b, 0x1d, 0x78, 0x44,
            length & 0xff, (length >> 8) & 0xff,
            ...bytes,
          ],
        },
    );

    /* Print PDF417 code */

    result.push(
        {
          type: 'pdf417',
          command: 'print',
          payload: [0x1b, 0x1d, 0x78, 0x50],
        },
    );

    return result;
  }

  /**
     * Encode an image
     * @param {ImageData} image     ImageData object
     * @param {number} width        Width of the image
     * @param {number} height       Height of the image
     * @param {string} mode         Image encoding mode (value is ignored)
     * @return {Array}             Array of bytes to send to the printer
     */
  image(image, width, height, mode) {
    const result = [];

    const getPixel = (x, y) => typeof image.data[((width * y) + x) * 4] === 'undefined' ||
                                      image.data[((width * y) + x) * 4] > 0 ? 0 : 1;

    result.push(
        {
          type: 'line-spacing',
          value: '24 dots',
          payload: [0x1b, 0x30],
        },
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
          {
            type: 'image',
            property: 'data',
            value: 'column',
            width,
            height: 24,
            payload: [
              0x1b, 0x58,
              width & 0xff, (width >> 8) & 0xff,
              ...bytes,
              0x0a, 0x0d,
            ],
          },
      );
    }

    result.push(
        {
          type: 'line-spacing',
          value: 'default',
          payload: [0x1b, 0x7a, 0x01],
        },
    );

    return result;
  }

  /**
     * Cut the paper
     * @param {string} value    Cut type ('full' or 'partial')
     * @return {Array}         Array of bytes to send to the printer
     */
  cut(value) {
    let data = 0x00;

    if (value == 'partial') {
      data = 0x01;
    }

    return [
      {
        type: 'cut',
        payload: [0x1b, 0x64, data],
      },
    ];
  }

  /**
     * Send a pulse to the cash drawer
     * @param {number} device   Device number
     * @param {number} on       Pulse ON time
     * @param {number} off      Pulse OFF time
     * @return {Array}         Array of bytes to send to the printer
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
      {
        type: 'pulse',
        payload: [0x1b, 0x07, on & 0xff, off & 0xff, device ? 0x1a : 0x07],
      },
    ];
  }

  /**
     * Enable or disable bold text
     * @param {boolean} value   Enable or disable bold text, optional, default toggles between states
     * @return {Array}         Array of bytes to send to the printer
     */
  bold(value) {
    let data = 0x46;

    if (value) {
      data = 0x45;
    }

    return [
      0x1b, data,
    ];
  }

  /**
     * Enable or disable underline text
     * @param {boolean} value   Enable or disable underline text, optional, default toggles between states
     * @return {Array}         Array of bytes to send to the printer
     */
  underline(value) {
    let data = 0x00;

    if (value) {
      data = 0x01;
    }

    return [
      0x1b, 0x2d, data,
    ];
  }

  /**
     * Enable or disable italic text
     * @param {boolean} value   Enable or disable italic text, optional, default toggles between states
     * @return {Array}         Array of bytes to send to the printer
     */
  italic(value) {
    return [];
  }

  /**
     * Enable or disable inverted text
     * @param {boolean} value   Enable or disable inverted text, optional, default toggles between states
     * @return {Array}         Array of bytes to send to the printer
     */
  invert(value) {
    let data = 0x35;

    if (value) {
      data = 0x34;
    }

    return [
      0x1b, data,
    ];
  }

  /**
     * Change text size
     * @param {number} width    Width of the text (1-8)
     * @param {number} height   Height of the text (1-8)
     * @return {Array}         Array of bytes to send to the printer
     */
  size(width, height) {
    return [
      0x1b, 0x69, height - 1, width - 1,
    ];
  }

  /**
     * Change the codepage
     * @param {number} value    Codepage value
     * @return {Array}         Array of bytes to send to the printer
     */
  codepage(value) {
    return [
      0x1b, 0x1d, 0x74, value,
    ];
  }

  /**
     * Flush the printers line buffer
     * @return {Array}         Array of bytes to send to the printer
     */
  flush() {
    return [
      {
        type: 'print-mode',
        value: 'page',
        payload: [0x1b, 0x1d, 0x50, 0x30],
      },
      {
        type: 'print-mode',
        value: 'line',
        payload: [0x1b, 0x1d, 0x50, 0x31],
      },
    ];
  }
}

export default LanguageStarPrnt;
