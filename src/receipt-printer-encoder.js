import Dither from 'canvas-dither';
import Flatten from 'canvas-flatten';
import CodepageEncoder from '@point-of-sale/codepage-encoder';
import ImageData from '@canvas/image-data';
import resizeImageData from 'resize-image-data';

/* Import local dependencies */

import LanguageEscPos from './languages/esc-pos.js';
import LanguageStarPrnt from './languages/star-prnt.js';
import LineComposer from './line-composer.js';

/* Import generated data */

import codepageMappings from '../generated/mapping.js';
import printerDefinitions from '../generated/printers.js';


/* Type definitions */

/** @import { PrinterModel, CodepageMappingName } from '../generated/types.js' */
/** @import { Codepage } from '@point-of-sale/codepage-encoder' */

/** @typedef {'esc-pos' | 'star-prnt' | 'star-line'} Language */
/** @typedef {'left' | 'center' | 'right'} Alignment */
/** @typedef {'threshold' | 'bayer' | 'floydsteinberg' | 'atkinson'} DitherAlgorithm */
/** @typedef {'relaxed' | 'strict'} ErrorLevel */
/** @typedef {'small' | 'normal'} TextSize */
/** @typedef {'full' | 'partial'} CutType */
/** @typedef {'upca' | 'upce' | 'ean13' | 'ean8' | 'code39' | 'itf' | 'codabar' | 'code93' | 'code128' | 'code128-auto' | 'gs1-128' | 'gs1-databar-omni' | 'gs1-databar-truncated' | 'gs1-databar-limited' | 'gs1-databar-expanded'} BarcodeSymbology */

/**
 * @typedef {Object} ReceiptPrinterEncoderOptions
 * @property {number} [columns]
 * @property {Language} [language]
 * @property {'column' | 'raster'} [imageMode]
 * @property {number} [feedBeforeCut]
 * @property {boolean} [feedAfterBlock]
 * @property {'\n\r' | '\n'} [newline]
 * @property {CodepageMappingName | Record<string, number>} [codepageMapping]
 * @property {Codepage[]} [codepageCandidates]
 * @property {ErrorLevel} [errors]
 * @property {PrinterModel} [printerModel]
 * @property {boolean} [debug]
 * @property {boolean} [embedded]
 * @property {((width: number, height: number) => HTMLCanvasElement) | null} [createCanvas]
 * @property {number} [width]
 * @property {boolean} [autoFlush]
 */

/**
 * @typedef {Object} TableColumn
 * @property {number | 'auto'} [width]
 * @property {Alignment} [align]
 * @property {'top' | 'bottom'} [verticalAlign]
 * @property {'wrap' | 'clip' | 'ellipsis'} [overflow]
 * @property {number} [marginLeft]
 * @property {number} [marginRight]
 */

/**
 * @typedef {Object} RuleOptions
 * @property {'single' | 'double'} [style]
 * @property {number} [width]
 */

/**
 * @typedef {Object} BoxOptions
 * @property {'single' | 'double' | 'none'} [style]
 * @property {number} [width]
 * @property {Alignment} [align]
 * @property {number} [marginLeft]
 * @property {number} [marginRight]
 * @property {number} [paddingLeft]
 * @property {number} [paddingRight]
 */

/**
 * @typedef {Object} BarcodeOptions
 * @property {number} [height]
 * @property {number} [width]
 * @property {boolean} [text]
 */

/**
 * @typedef {Object} QRCodeOptions
 * @property {1 | 2} [model]
 * @property {number} [size]
 * @property {'l' | 'm' | 'q' | 'h'} [errorlevel]
 */

/**
 * @typedef {Object} PDF417Options
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [columns]
 * @property {number} [rows]
 * @property {number} [errorlevel]
 * @property {boolean} [truncated]
 */

/** @typedef {Object} SharpInput */
/** @typedef {Object} NdarrayInput */
/** @typedef {Object} ReadImageInput */

/**
 * @typedef {Object} PrinterModelInfo
 * @property {string} id
 * @property {string} name
 */

/** @typedef {string | ((encoder: ReceiptPrinterEncoder) => void)} TableCellContent */
/** @typedef {string | ((encoder: ReceiptPrinterEncoder) => void)} BoxContent */


/**
 * Create a byte stream based on commands for receipt printers
 */
class ReceiptPrinterEncoder {
  #options = {};
  #queue = [];

  #language;
  #composer;

  #printerResolution = null;

  #printerCapabilities = {
    'fonts': {
      'A': {size: '12x24', columns: 42},
      'B': {size: '9x24', columns: 56},
    },
    'barcodes': {
      'supported': true,
      'symbologies': [
        'upca', 'upce', 'ean13', 'ean8', 'code39', 'itf', 'codabar', 'code93',
        'code128', 'gs1-128', 'gs1-databar-omni', 'gs1-databar-truncated',
        'gs1-databar-limited', 'gs1-databar-expanded',
      ],
    },
    'qrcode': {
      'supported': true,
      'models': ['1', '2'],
    },
    'pdf417': {
      'supported': true,
    },
  };

  #codepageMapping = {};
  #codepageCandidates = [];
  #codepage = 'cp437';

  #state = {
    'codepage': -1,
    'font': 'A',
  };


  /**
     * Create a new object
     *
     * @param  {ReceiptPrinterEncoderOptions}   [options]   Object containing configuration options
    */
  constructor(options) {
    options = options || {};

    const defaults = {
      columns: 42,
      language: 'esc-pos',
      imageMode: 'column',
      feedBeforeCut: 0,
      feedAfterBlock: true,
      newline: '\n\r',
      codepageMapping: 'epson',
      codepageCandidates: null,
      errors: 'relaxed',
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

      this.#printerCapabilities = printerDefinitions[options.printerModel].capabilities;
      this.#printerResolution = printerDefinitions[options.printerModel].media?.dpi || null;

      /* Apply the printer definition to the defaults */

      defaults.columns = this.#printerCapabilities.fonts['A'].columns;
      defaults.language = this.#printerCapabilities.language;
      defaults.codepageMapping = this.#printerCapabilities.codepages;
      defaults.newline = this.#printerCapabilities?.newline || defaults.newline;
      defaults.feedBeforeCut = this.#printerCapabilities?.cutter?.feed || defaults.feedBeforeCut;
      defaults.imageMode = this.#printerCapabilities?.images?.mode || defaults.imageMode;
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

    /* Set the default codepage for the printer language */

    this.#codepage = this.#options.language == 'esc-pos' ? 'cp437' : 'star/standard';

    /* Create our line composer */

    this.#createComposer();

    this.#reset();
  }

  /**
     * Create a fresh line composer, with default styles, alignment and columns
     */
  #createComposer() {
    this.#composer = new LineComposer({
      embedded: this.#options.embedded,
      columns: this.#options.columns,
      align: 'left',
      size: 1,
      style: this.#options.style,
      overflow: this.#options.overflow,

      callback: (value) => this.#queue.push(value),
    });
  }

  /**
     * Reset the output queue, but keep the state of the encoder, such as the
     * code page and text styles, for the next chunk of the receipt
     */
  #reset() {
    this.#queue = [];
  }

  /**
     * Initialize the printer
     *
     * @return {ReceiptPrinterEncoder}          Return the object, for easy chaining commands
     *
     */
  initialize() {
    if (this.#options.embedded) {
      throw new Error('Initialize is not supported in table cells or boxes');
    }

    /* The initialize command resets both the printer and the encoder to a clean
       slate: no code page, no styles, default font and alignment. It marks the
       start of a receipt, so it is only allowed as the first command, or right
       after an encode(). If there is anything left in the buffer, it throws */

    if (this.#queue.length > 0 || !this.#composer.empty) {
      throw new Error('Initialize must be the first command, or come right after an encode()');
    }

    /* Reset the state of the encoder */

    this.#codepage = this.#options.language == 'esc-pos' ? 'cp437' : 'star/standard';
    this.#state.codepage = -1;
    this.#state.font = 'A';

    this.#createComposer();

    /* Reset the printer */

    this.#composer.add(
        this.#language.initialize(),
    );

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    return this;
  }

  /**
     * Change the code page
     *
     * @param  {Codepage | 'auto'}   codepage  The codepage that we set the printer to
     * @return {ReceiptPrinterEncoder}             Return the object, for easy chaining commands
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
     * @return {ReceiptPrinterEncoder}          Return the object, for easy chaining commands
     *
     */
  text(value) {
    this.#composer.text(value, this.#codepage);

    return this;
  }

  /**
     * Print a newline
     *
     * @param  {number}   [value]  The number of newlines that need to be printed, defaults to 1
     * @return {ReceiptPrinterEncoder}          Return the object, for easy chaining commands
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
     * @return {ReceiptPrinterEncoder}          Return the object, for easy chaining commands
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
     * @param  {boolean}          [value]  true to turn on underline, false to turn off
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
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
     * @param  {boolean}          [value]  true to turn on italic, false to turn off
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
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
     * @param  {boolean}          [value]  true to turn on bold, false to turn off
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
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
     * @param  {boolean}          [value]  true to turn on white text on black, false to turn off
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
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
     * @param  {number}          [width]    The width of the text, 1 - 8
     * @return {ReceiptPrinterEncoder}                   Return the object, for easy chaining commands
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
     * @param  {number}          [height]  The height of the text, 1 - 8
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
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

  // eslint-disable-next-line valid-jsdoc
  /**
     * Change text size
     *
     * @overload
     * @param {number} width   The width of the text, 1 - 8
     * @param {number} [height]  The height of the text, 1 - 8
     * @return {ReceiptPrinterEncoder}
     */
  // eslint-disable-next-line valid-jsdoc
  /**
     * @overload
     * @param {TextSize} value  The text size preset
     * @return {ReceiptPrinterEncoder}
     */
  /**
     * @param {number|TextSize} width
     * @param {number} [height]
     * @return {ReceiptPrinterEncoder}
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
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
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
      const font = Object.entries(this.#printerCapabilities.fonts).find((i) => i[1].size == matches[0]);

      if (font) {
        value = font[0];
      }
    }

    /* Make sure the font name is uppercase */

    value = value.toUpperCase();

    /* Check if the font is supported */

    if (typeof this.#printerCapabilities.fonts[value] === 'undefined') {
      return this.#error('This font is not supported by this printer', 'relaxed');
    }

    /* Change the font */

    this.#composer.add(
        this.#language.font(value),
    );

    this.#state.font = value;

    /* Change the width of the composer */

    if (value === 'A') {
      this.#composer.columns = this.#options.columns;
    } else {
      this.#composer.columns =
        (this.#options.columns / this.#printerCapabilities.fonts['A'].columns) *
        this.#printerCapabilities.fonts[value].columns;
    }

    return this;
  }

  /**
     * Change text alignment
     *
     * @param  {Alignment}          value   left, center or right
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
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

  // eslint-disable-next-line valid-jsdoc
  /**
     * Insert a table
     *
     * @param  {TableColumn[]}           columns  The column definitions
     * @param  {TableCellContent[][]}    data     Array containing rows. Each row is an array containing cells.
     *                                            Each cell can be a string value, or a callback function.
     *                                            The first parameter of the callback is the encoder object on
     *                                            which the function can call its methods.
     * @return {ReceiptPrinterEncoder}                   Return the object, for easy chaining commands
     *
     */
  table(columns, data) {
    columns = this.#resolveColumns(columns);

    this.#composer.flush();

    /* Process all lines */

    for (let r = 0; r < data.length; r++) {
      const lines = [];
      let maxLines = 0;

      /* Render all columns */

      for (let c = 0; c < columns.length; c++) {
        const columnEncoder = new ReceiptPrinterEncoder(Object.assign({}, this.#options, {
          width: columns[c].width * this.#composer.style.width,
          embedded: true,
          style: this.#inheritedStyle(),
          overflow: columns[c].overflow,
        }));

        columnEncoder.codepage(this.#codepage);

        if (typeof columns[c].align !== 'undefined') {
          columnEncoder.align(columns[c].align);
        }

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

          const line = {
            commands: LineComposer.padding(
                columns[c].width * this.#composer.style.width,
                {width: this.#composer.style.width, height: this.#composer.style.height},
            ),
            height: 1,
          };

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

          this.#composer.add(lines[c][l].commands, columns[c].width * this.#composer.style.width);

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
     * Resolve the widths of the columns of a table. A column without a width,
     * or with a width of 'auto', is a fill column: it takes the space that is
     * left after the fixed columns and all margins. If there are multiple fill
     * columns, the remaining space is divided evenly between them, the first
     * ones get any remainder. Widths are in characters of the current size.
     *
     * @param  {TableColumn[]}   columns   The column definitions
     * @return {TableColumn[]}             The column definitions with numeric widths
     */
  #resolveColumns(columns) {
    if (!Array.isArray(columns) || columns.length === 0) {
      throw new Error('A table needs at least one column');
    }

    const fill = [];
    let fixed = 0;

    for (const column of columns) {
      if (typeof column.overflow !== 'undefined' && !['wrap', 'clip', 'ellipsis'].includes(column.overflow)) {
        throw new Error('Column overflow must be wrap, clip or ellipsis');
      }

      if (typeof column.width === 'undefined' || column.width === 'auto') {
        fill.push(column);
      } else if (!Number.isInteger(column.width) || column.width < 1) {
        throw new Error('Column width must be a positive integer, or auto');
      } else {
        fixed += column.width;
      }

      fixed += (column.marginLeft || 0) + (column.marginRight || 0);
    }

    /* The available width is the width of the line in characters of the current size */

    const available = Math.floor(this.#composer.columns / this.#composer.style.width);
    const remaining = available - fixed;

    /* Without fill columns the table must simply fit, with fill columns each of them needs at least one character */

    if (remaining < 0 || (fill.length > 0 && remaining < fill.length)) {
      throw new Error('Table is too wide');
    }

    const widths = new Map();

    fill.forEach((column, i) => {
      widths.set(column, Math.floor(remaining / fill.length) + (i < remaining % fill.length ? 1 : 0));
    });

    return columns.map((column) =>
      widths.has(column) ? Object.assign({}, column, {width: widths.get(column)}) : column);
  }

  /**
     * Get the styles that embedded content, such as table cells and boxes,
     * inherits from the current style. The widths of columns and boxes are
     * in characters of the current size, so the embedded content is measured
     * in columns of the paper.
     *
     * @return {object}   The inherited style properties
     */
  #inheritedStyle() {
    return {
      bold: this.#composer.style.bold,
      italic: this.#composer.style.italic,
      underline: this.#composer.style.underline,
      invert: this.#composer.style.invert,
      width: this.#composer.style.width,
      height: this.#composer.style.height,
    };
  }

  /**
     * Insert a horizontal rule
     *
     * @param  {RuleOptions}     [options]  And object with the following properties:
     *                                      - style: The style of the line, either single or double
     *                                      - width: The width of the line, by default the width of the paper
     * @return {ReceiptPrinterEncoder}                   Return the object, for easy chaining commands
     *
     */
  rule(options) {
    options = Object.assign({
      style: 'single',
      width: this.#options.columns || 10,
    }, options || {});

    this.#composer.flush();

    this.#composer.text(
        (options.style === 'double' ? '═' : '─').repeat(
            Math.floor(options.width / this.#composer.style.width),
        ),
        'cp437',
    );
    this.#composer.flush({forceNewline: true});

    return this;
  }

  /**
     * Insert a box
     *
     * @param  {BoxOptions}       options   And object with the following properties:
     *                                      - style: The style of the border, either single or double
     *                                      - width: The width of the box, by default the width of the paper
     *                                      - marginLeft: Space between the left border and the left edge
     *                                      - marginRight: Space between the right border and the right edge
     *                                      - paddingLeft: Space between the contents and the left border of the box
     *                                      - paddingRight: Space between the contents and the right border of the box
     * @param  {BoxContent}       contents  A string value, or a callback function.
     *                                      The first parameter of the callback is the encoder object on
     *                                      which the function can call its methods.
     * @return {ReceiptPrinterEncoder}                     Return the object, for easy chaining commands
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

    if (!Number.isInteger(options.width) || options.width < 1) {
      throw new Error('Box width must be a positive integer');
    }

    const boxWidth = (options.width + options.marginLeft + options.marginRight) * this.#composer.style.width;

    if (boxWidth > this.#options.columns) {
      throw new Error('Box is too wide');
    }

    let elements;

    if (options.style == 'single') {
      elements = ['┌', '┐', '└', '┘', '─', '│'];
    } else if (options.style == 'double') {
      elements = ['╔', '╗', '╚', '╝', '═', '║'];
    }

    /* Render the contents of the box */

    const innerWidth = options.width - (options.style == 'none' ? 0 : 2) - options.paddingLeft - options.paddingRight;

    if (innerWidth < 0) {
      throw new Error('Box is too narrow');
    }

    const columnEncoder = new ReceiptPrinterEncoder(Object.assign({}, this.#options, {
      width: innerWidth * this.#composer.style.width,
      embedded: true,
      style: this.#inheritedStyle(),
    }));

    columnEncoder.codepage(this.#codepage);

    if (typeof options.align !== 'undefined') {
      columnEncoder.align(options.align);
    }

    if (typeof contents === 'function') {
      contents(columnEncoder);
    }

    if (typeof contents === 'string') {
      columnEncoder.text(contents);
    }

    const lines = columnEncoder.commands();

    /* The vertical borders are as tall as the line, the current height is restored after them */

    const height = this.#composer.style.height;

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
        this.#composer.style.height = Math.max(height, lines[i].height);
        this.#composer.text(elements[5], 'cp437');
        this.#composer.style.height = height;
      }

      this.#composer.space(options.paddingLeft);
      this.#composer.add(lines[i].commands, innerWidth * this.#composer.style.width);
      this.#composer.space(options.paddingRight);

      if (options.style != 'none') {
        this.#composer.style.height = Math.max(height, lines[i].height);
        this.#composer.text(elements[5], 'cp437');
        this.#composer.style.height = height;
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
     * @param  {string}                       value  the value of the barcode
     * @param  {BarcodeSymbology|number}      symbology  the type of the barcode
     * @param  {number|BarcodeOptions}        [height]  Either the configuration object, or backwards compatible height of the barcode
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
     *
     */
  barcode(value, symbology, height) {
    let options = {
      height: 60,
      width: 2,
      text: false,
    };

    if (typeof height === 'object') {
      options = Object.assign(options, height);
    }

    if (typeof height === 'number') {
      options.height = height;
    }

    if (this.#options.embedded) {
      throw new Error('Barcodes are not supported in table cells or boxes');
    }

    if (this.#printerCapabilities.barcodes.supported === false) {
      return this.#error('Barcodes are not supported by this printer', 'relaxed');
    }

    if (typeof symbology === 'string' && !this.#printerCapabilities.barcodes.symbologies.includes(symbology)) {
      return this.#error(`Symbology '${symbology}' not supported by this printer`, 'relaxed');
    }

    /* Force printing the print buffer and moving to a new line */

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    /* Set alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.add(this.#language.align(this.#composer.align));
    }

    /* Barcode */

    this.#composer.add(
        this.#language.barcode(value, symbology, options),
    );

    /* Reset alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.add(this.#language.align('left'));
    }

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    return this;
  }

  /**
     * QR code
     *
     * @param  {string}              value       The value of the qr code
     * @param  {number|QRCodeOptions}    [model]       Either the configuration object, or
     *                                            backwards compatible model of the qrcode, either 1 or 2
     * @param  {number}              [size]        Backwards compatible size of the qrcode, a value between 1 and 8
     * @param  {string}              [errorlevel]  Backwards compatible the amount of error correction used,
     *                                            either 'l', 'm', 'q', 'h'
     * @return {ReceiptPrinterEncoder}                       Return the object, for easy chaining commands
     */
  qrcode(value, model, size, errorlevel) {
    let options = {
      model: 2,
      size: 6,
      errorlevel: 'm',
    };

    if (typeof model === 'object') {
      options = Object.assign(options, model);
    }

    if (typeof model === 'number') {
      options.model = model;
    }

    if (typeof size === 'number') {
      options.size = size;
    }

    if (typeof errorlevel === 'string') {
      options.errorlevel = errorlevel;
    }

    if (this.#options.embedded) {
      throw new Error('QR codes are not supported in table cells or boxes');
    }

    if (this.#printerCapabilities.qrcode.supported === false) {
      return this.#error('QR codes are not supported by this printer', 'relaxed');
    }

    if (options.model && !this.#printerCapabilities.qrcode.models.includes(String(options.model))) {
      return this.#error('QR code model is not supported by this printer', 'relaxed');
    }

    /* Force printing the print buffer and moving to a new line */

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    /* Set alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.add(this.#language.align(this.#composer.align));
    }

    /* QR code */

    this.#composer.add(
        this.#language.qrcode(value, options),
    );

    /* Reset alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.add(this.#language.align('left'));
    }

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    return this;
  }


  /**
     * PDF417 code
     *
     * @param  {string}           value     The value of the pdf417 code
     * @param  {PDF417Options}    [options]   Configuration object
     * @return {ReceiptPrinterEncoder}                     Return the object, for easy chaining commands
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

    if (this.#printerCapabilities.pdf417.supported === false) {
      /* If possible, fallback to a barcode with symbology */

      if (typeof this.#printerCapabilities.pdf417.fallback === 'object') {
        return this.barcode(value, this.#printerCapabilities.pdf417.fallback.symbology);
      }

      return this.#error('PDF417 codes are not supported by this printer', 'relaxed');
    }

    /* Force printing the print buffer and moving to a new line */

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    /* Set alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.add(this.#language.align(this.#composer.align));
    }

    /* PDF417 code */

    this.#composer.add(
        this.#language.pdf417(value, options),
    );

    /* Reset alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.add(this.#language.align('left'));
    }

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    return this;
  }


  /**
     * Image
     *
     * @param  {ImageData|HTMLImageElement|HTMLCanvasElement|SharpInput|NdarrayInput|ReadImageInput}  input  an element, like a canvas or image that needs to be printed
     * @param  {number}         width  width of the image on the printer
     * @param  {number}         height  height of the image on the printer
     * @param  {DitherAlgorithm}  [algorithm]  the dithering algorithm for making the image black and white
     * @param  {number}         [threshold]  threshold for the dithering algorithm
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
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


    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    /* Set alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.add(this.#language.align(this.#composer.align));
    }

    /* Encode the image data */

    this.#composer.add(
        this.#language.image(image, width, height, this.#options.imageMode, this.#printerResolution),
    );

    /* Reset alignment */

    if (this.#composer.align !== 'left') {
      this.#composer.add(this.#language.align('left'));
    }

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    return this;
  }

  /**
     * Cut paper
     *
     * @param  {CutType}          [value]   full or partial. When not specified a full cut will be assumed
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
     *
     */
  cut(value) {
    if (this.#options.embedded) {
      throw new Error('Cut is not supported in table cells or boxes');
    }

    for (let i = 0; i < this.#options.feedBeforeCut; i++) {
      this.#composer.flush({forceNewline: true});
    }

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    this.#composer.add(
        this.#language.cut(value),
    );

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    return this;
  }

  /**
     * Pulse
     *
     * @param  {number}          [device]  0 or 1 for on which pin the device is connected, default of 0
     * @param  {number}          [on]      Time the pulse is on in milliseconds, default of 100 on ESC/POS, 200 on StarPRNT
     * @param  {number}          [off]     Time the pulse is off in milliseconds, default of 500 on ESC/POS, 200 on StarPRNT
     * @return {ReceiptPrinterEncoder}                  Return the object, for easy chaining commands
     *
     */
  pulse(device, on, off) {
    if (this.#options.embedded) {
      throw new Error('Pulse is not supported in table cells or boxes');
    }

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    this.#composer.add(
        this.#language.pulse(device, on, off),
    );

    this.#composer.flush({forceFlush: true, ignoreAlignment: true});

    return this;
  }

  /**
     * Add raw printer commands
     *
     * @param  {number[]|Uint8Array}           data   raw bytes to be included
     * @return {ReceiptPrinterEncoder}          Return the object, for easy chaining commands
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
    if (codepage === null) {
      const fragment = CodepageEncoder.encode(value, 'ascii');

      return [
        {type: 'text', payload: [...fragment]},
      ];
    }

    if (codepage !== 'auto') {
      const fragment = CodepageEncoder.encode(value, codepage);

      if (this.#state.codepage != this.#codepageMapping[codepage]) {
        this.#state.codepage = this.#codepageMapping[codepage];

        return [
          {type: 'codepage', payload: this.#language.codepage(this.#codepageMapping[codepage])},
          {type: 'text', payload: [...fragment]},
        ];
      }

      return [
        {type: 'text', payload: [...fragment]},
      ];
    }

    const fragments = CodepageEncoder.autoEncode(value, this.#codepageCandidates);
    const buffer = [];

    for (const fragment of fragments) {
      this.#state.codepage = this.#codepageMapping[fragment.codepage];
      buffer.push(
          {type: 'codepage', payload: this.#language.codepage(this.#codepageMapping[fragment.codepage])},
          {type: 'text', payload: [...fragment.bytes]},
      );
    }

    return buffer;
  }

  /**
   * Get all the commands
   *
   * @return {{ commands: object[], height: number }[]}         All the commands currently in the queue
   */
  commands() {
    let requiresFlush = true;

    /* Determine if the last command is a pulse or cut, the we do not need a flush */

    const lastLine = this.#queue[this.#queue.length - 1];

    if (lastLine) {
      const lastCommand = lastLine[lastLine.length - 1];

      if (lastCommand && ['pulse', 'cut'].includes(lastCommand.type)) {
        requiresFlush = false;
      }
    }

    /* Flush the printer line buffer if needed */

    if (requiresFlush && this.#options.autoFlush && !this.#options.embedded) {
      this.#composer.add(
          this.#language.flush(),
      );
    }

    /* Get the remaining from the composer */

    const result = [];

    const remaining = this.#composer.fetch({forceFlush: true, ignoreAlignment: true});

    if (remaining.length) {
      this.#queue.push(remaining);
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

    if (this.#options.debug) {
      console.log('commands', result);
    }

    this.#reset();

    return result;
  }

  // eslint-disable-next-line valid-jsdoc
  /**
     * Encode all previous commands
     *
     * @overload
     * @param {'commands'} format
     * @return {{ commands: object[], height: number }[]}
     */
  // eslint-disable-next-line valid-jsdoc
  /**
     * @overload
     * @param {'lines'} format
     * @return {object[][]}
     */
  // eslint-disable-next-line valid-jsdoc
  /**
     * @overload
     * @param {string} [format]
     * @return {Uint8Array}
     */
  // eslint-disable-next-line valid-jsdoc
  /**
     * @param {string} [format]  The format of the output, either 'commands',
     *                           'lines' or 'array', defaults to 'array'
     * @return {Uint8Array|{ commands: object[], height: number }[]|object[][]}
     */
  encode(format) {
    /* Get the commands */

    const commands = this.commands();

    if (format === 'commands') {
      return commands;
    }

    /* Build the lines */

    const lines = [];

    for (const line of commands) {
      const buffer = [];

      for (const item of line.commands) {
        if (item.type === 'text') {
          buffer.push(...this.#encodeText(item.value, item.codepage));
        } else if (item.type === 'style') {
          buffer.push(Object.assign(item, {payload: this.#encodeStyle(item.property, item.value)}));
        } else if (item.value || item.payload) {
          buffer.push(item);
        }
      }

      lines.push(buffer);
    }

    if (format === 'lines') {
      return lines;
    }

    /* Build the array */

    let result = [];
    let last = null;

    for (let i = 0; i < lines.length; i++) {
      for (const item of lines[i]) {
        result.push(...item.payload);
        last = item;
      }

      /* Only feed the paper when the line contains printable content, a line
         consisting of nothing but state changes, such as style, font or alignment
         commands, would otherwise be printed as an empty line */

      if (!LineComposer.hasContent(commands[i].commands)) {
        continue;
      }

      /* Images, barcodes and QR codes advance the paper by themselves, the
         line feed after them can be disabled with the feedAfterBlock option */

      if (!this.#options.feedAfterBlock && LineComposer.isBlock(commands[i].commands)) {
        continue;
      }

      if (this.#options.newline === '\n\r') {
        result.push(0x0a, 0x0d);
      }

      if (this.#options.newline === '\n') {
        result.push(0x0a);
      }
    }

    /* If the last command is a pulse, do not feed */

    if (last && last.type === 'pulse') {
      result = result.slice(0, 0 - this.#options.newline.length);
    }

    return Uint8Array.from(result);
  }

  /**
   * Throw an error
   *
   * @param  {string}          message  The error message
   * @param  {string}          level    The error level, if level is strict,
   *                                    an error will be thrown, if level is relaxed,
   *                                    a warning will be logged
   * @return {ReceiptPrinterEncoder}          Return the object, for easy chaining commands
   */
  #error(message, level) {
    if (level === 'strict' || this.#options.errors === 'strict') {
      throw new Error(message);
    }

    console.warn(message);

    return this;
  }

  /**
   * Get all supported printer models
   *
   * @return {PrinterModelInfo[]}         An object with all supported printer models
   */
  static get printerModels() {
    return Object.entries(printerDefinitions).map((i) => ({id: i[0], name: i[1].vendor + ' ' + i[1].model}));
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

  /**
   * Get the capabilities of the printer
   * @return {object}         The capabilities of the printer
   */
  get printerCapabilities() {
    return this.#printerCapabilities;
  }
}

export default ReceiptPrinterEncoder;
