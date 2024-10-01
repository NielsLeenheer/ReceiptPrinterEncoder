import CodepageEncoder from '@point-of-sale/codepage-encoder';

/**
 * ESC/POS Language commands
 */
class LanguageEscPos {
  /**
     * Initialize the printer
     * @return {Array}         Array of bytes to send to the printer
     */
  initialize() {
    return [
      {
        type: 'initialize',
        payload: [0x1b, 0x40],
      },
      {
        type: 'character-mode',
        value: 'single byte',
        payload: [0x1c, 0x2e],
      },
      {
        type: 'font',
        value: 'A',
        payload: [0x1b, 0x4d, 0x00],
      },
    ];
  }

  /**
     * Change the font
     * @param {string} value    Font type ('A', 'B', or more)
     * @return {Array}         Array of bytes to send to the printer
     */
  font(value) {
    const type = value.charCodeAt(0) - 0x41;

    return [
      {
        type: 'font',
        value,
        payload: [0x1b, 0x4d, type],
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
        payload: [0x1b, 0x61, align],
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
      'upca': 0x00,
      'upce': 0x01,
      'ean13': 0x02,
      'ean8': 0x03,
      'code39': 0x04,
      'coda39': 0x04, /* typo, leave here for backwards compatibility */
      'itf': 0x05,
      'interleaved-2-of-5': 0x05,
      'nw-7': 0x06,
      'codabar': 0x06,
      'code93': 0x48,
      'code128': 0x49,
      'gs1-128': 0x48,
      'gs1-databar-omni': 0x4b,
      'gs1-databar-truncated': 0x4c,
      'gs1-databar-limited': 0x4d,
      'gs1-databar-expanded': 0x4e,
      'code128-auto': 0x4f,
    };

    if (typeof symbology === 'string' && typeof symbologies[symbology] === 'undefined') {
      throw new Error(`Symbology '${symbology}' not supported by language`);
    }

    /* Calculate segment width */

    if (options.width < 1 || options.width > 3) {
      throw new Error('Width must be between 1 and 3');
    }

    let width = options.width + 1;

    if (symbology === 'itf') {
      width = options.width * 2;
    }

    if (symbology === 'gs1-128' || symbology === 'gs1-databar-omni' ||
        symbology === 'gs1-databar-truncated' || symbology === 'gs1-databar-limited' ||
        symbology === 'gs1-databar-expanded') {
      width = options.width;
    }

    /* Set barcode options */

    result.push(
        {
          type: 'barcode',
          property: 'height',
          value: options.height,
          payload: [0x1d, 0x68, options.height],
        },
        {
          type: 'barcode',
          property: 'width',
          value: options.width,
          payload: [0x1d, 0x77, width],
        },
        {
          type: 'barcode',
          property: 'text',
          value: options.text,
          payload: [0x1d, 0x48, options.text ? 0x02 : 0x00],
        },
    );


    /* Encode barcode */

    if (symbology == 'code128' && !value.startsWith('{')) {
      value = '{B' + value;
    }

    if (symbology == 'gs1-128') {
      value = value.replace(/[()*]/g, '');
    }

    const bytes = CodepageEncoder.encode(value, 'ascii');

    const identifier = typeof symbology === 'string' ? symbologies[symbology] : symbology;

    if (identifier > 0x40) {
      /* Function B symbologies */

      result.push(
          {
            type: 'barcode',
            value: {symbology: symbology, data: value},
            payload: [0x1d, 0x6b, identifier, bytes.length, ...bytes],
          },
      );
    } else {
      /* Function A symbologies */

      result.push(
          {
            type: 'barcode',
            value: {symbology: symbology, data: value},
            payload: [0x1d, 0x6b, identifier, ...bytes, 0x00],
          },
      );
    }

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

    if (typeof options.model === 'number') {
      const models = {
        1: 0x31,
        2: 0x32,
      };

      if (options.model in models) {
        result.push(
            {
              type: 'qrcode',
              property: 'model',
              value: options.model,
              payload: [0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, models[options.model], 0x00],
            },
        );
      } else {
        throw new Error('Model must be 1 or 2');
      }
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
          payload: [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, options.size],
        },
    );

    /* Error level */

    const errorlevels = {
      'l': 0x30,
      'm': 0x31,
      'q': 0x32,
      'h': 0x33,
    };

    if (options.errorlevel in errorlevels) {
      result.push(
          {
            type: 'qrcode',
            property: 'errorlevel',
            value: options.errorlevel,
            payload: [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, errorlevels[options.errorlevel]],
          },
      );
    } else {
      throw new Error('Error level must be l, m, q or h');
    }

    /* Data */

    const bytes = CodepageEncoder.encode(value, 'iso8859-1');
    const length = bytes.length + 3;

    result.push(
        {
          type: 'qrcode',
          property: 'data',
          value,
          payload: [0x1d, 0x28, 0x6b, length & 0xff, (length >> 8) & 0xff, 0x31, 0x50, 0x30, ...bytes],
        },
    );

    /* Print QR code */

    result.push(
        {
          type: 'qrcode',
          command: 'print',
          payload: [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30],
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

    /* Columns */

    if (typeof options.columns !== 'number') {
      throw new Error('Columns must be a number');
    }

    if (options.columns !== 0 && (options.columns < 1 || options.columns > 30)) {
      throw new Error('Columns must be 0, or between 1 and 30');
    }

    result.push(
        {
          type: 'pdf417',
          property: 'columns',
          value: options.columns,
          payload: [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x41, options.columns],
        },
    );

    /* Rows */

    if (typeof options.rows !== 'number') {
      throw new Error('Rows must be a number');
    }

    if (options.rows !== 0 && (options.rows < 3 || options.rows > 90)) {
      throw new Error('Rows must be 0, or between 3 and 90');
    }

    result.push(
        {
          type: 'pdf417',
          property: 'rows',
          value: options.rows,
          payload: [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x42, options.rows],
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
          payload: [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x43, options.width],
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
          payload: [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x44, options.height],
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
          payload: [0x1d, 0x28, 0x6b, 0x04, 0x00, 0x30, 0x45, 0x30, options.errorlevel + 0x30],
        },
    );

    /* Model: standard or truncated */

    result.push(
        {
          type: 'pdf417',
          property: 'truncated',
          value: !!options.truncated,
          payload: [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x46, options.truncated ? 0x01 : 0x00],
        },
    );

    /* Data */

    const bytes = CodepageEncoder.encode(value, 'ascii');
    const length = bytes.length + 3;

    result.push(
        {
          type: 'pdf417',
          property: 'data',
          value,
          payload: [0x1d, 0x28, 0x6b, length & 0xff, (length >> 8) & 0xff, 0x30, 0x50, 0x30, ...bytes],
        },
    );

    /* Print PDF417 code */

    result.push(
        {
          type: 'pdf417',
          command: 'print',
          payload: [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x51, 0x30],
        },
    );

    return result;
  }

  /**
     * Encode an image
     * @param {ImageData} image     ImageData object
     * @param {number} width        Width of the image
     * @param {number} height       Height of the image
     * @param {string} mode         Image encoding mode ('column' or 'raster')
     * @return {Array}             Array of bytes to send to the printer
     */
  image(image, width, height, mode) {
    const result = [];

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
          {
            type: 'line-spacing',
            value: '24 dots',
            payload: [0x1b, 0x33, 0x24],
          },
      );

      getColumnData(width, height).forEach((bytes) => {
        result.push(
            {
              type: 'image',
              property: 'data',
              value: 'column',
              width,
              height: 24,
              payload: [0x1b, 0x2a, 0x21, width & 0xff, (width >> 8) & 0xff, ...bytes, 0x0a],
            },
        );
      });

      result.push(
          {
            type: 'line-spacing',
            value: 'default',
            payload: [0x1b, 0x32],
          },
      );
    }

    /* Encode images with GS v */

    if (mode == 'raster') {
      result.push(
          {
            type: 'image',
            command: 'data',
            value: 'raster',
            width,
            height,
            payload: [
              0x1d, 0x76, 0x30, 0x00,
              (width >> 3) & 0xff, (((width >> 3) >> 8) & 0xff),
              height & 0xff, ((height >> 8) & 0xff),
              ...getRowData(width, height),
            ],
          },
      );
    }

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
        payload: [0x1d, 0x56, data],
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
      on = 100;
    }

    if (typeof off === 'undefined') {
      off = 500;
    }

    on = Math.min(500, Math.round(on / 2));
    off = Math.min(500, Math.round(off / 2));


    return [
      {
        type: 'pulse',
        payload: [0x1b, 0x70, device ? 1 : 0, on & 0xff, off & 0xff],
      },
    ];
  }

  /**
     * Enable or disable bold text
     * @param {boolean} value   Enable or disable bold text, optional, default toggles between states
     * @return {Array}         Array of bytes to send to the printer
     */
  bold(value) {
    let data = 0x00;

    if (value) {
      data = 0x01;
    }

    return [
      0x1b, 0x45, data,
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
    let data = 0x00;

    if (value) {
      data = 0x01;
    }

    return [
      0x1b, 0x34, data,
    ];
  }

  /**
     * Enable or disable inverted text
     * @param {boolean} value   Enable or disable inverted text, optional, default toggles between states
     * @return {Array}         Array of bytes to send to the printer
     */
  invert(value) {
    let data = 0x00;

    if (value) {
      data = 0x01;
    }

    return [
      0x1d, 0x42, data,
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
      0x1d, 0x21, (height - 1) | (width - 1) << 4,
    ];
  }

  /**
     * Change the codepage
     * @param {number} value    Codepage value
     * @return {Array}         Array of bytes to send to the printer
     */
  codepage(value) {
    return [
      0x1b, 0x74, value,
    ];
  }

  /**
     * Flush the printers line buffer
     * @return {Array}         Array of bytes to send to the printer
     */
  flush() {
    return [];
  }
}

export default LanguageEscPos;
