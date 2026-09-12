import TextStyle from './text-style.js';
import TextWrap from './text-wrap.js';

/* Item types that only change the state of the printer and print nothing */

const STATE_TYPES = [
  'style', 'align', 'font', 'initialize', 'character-mode', 'codepage', 'line-spacing', 'motion-unit', 'print-mode', 'raw',
];

/* Item types that must precede the alignment padding of a line when they are
   pending at its start, because they change how the padding is printed */

const LEADING_TYPES = ['font', 'codepage', 'character-mode', 'line-spacing', 'motion-unit', 'print-mode'];

/* Item types that a text style applies to */

const STYLED_TYPES = ['text', 'space', 'raw'];

/* Item types that print a block which advances the paper by itself */

const BLOCK_TYPES = ['image', 'barcode', 'qrcode', 'pdf417'];

/* Printed at the end of a line that is cut off, when overflow is 'ellipsis' */

const ELLIPSIS = '...';

/**
 * Compose lines of text and commands
 */
class LineComposer {
  #embedded;
  #columns;
  #align;
  #overflow;
  #callback;

  #cursor = 0;
  #trimmable = false;
  #clipped = false;
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
    this.#overflow = options.overflow || 'wrap';
    this.#callback = options.callback || (() => {});

    this.style = new TextStyle({
      defaults: options.style,
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
    if (this.#overflow !== 'wrap') {
      this.#textWithoutWrap(value, codepage);
      return;
    }

    const lines = TextWrap.wrap(value, {columns: this.#columns, width: this.style.width, indent: this.#cursor});

    for (let i = 0; i < lines.length; i++) {
      /* Add the line to the buffer */

      if (lines[i].length) {
        this.add({type: 'text', value: lines[i], codepage}, lines[i].length * this.style.width);
      }

      /* A newline in the text ends the current line, even if it is empty. Text
         after the last newline stays on the line, so that it can be continued
         by the next call, and an empty text does nothing at all */

      if (i < lines.length - 1) {
        this.flush({forceNewline: true});
      }
    }
  }

  /**
     * Add text to the line without wrapping it. Text that does not fit is cut
     * off at the edge of the line, when overflow is 'ellipsis' the line ends
     * with an ellipsis instead. A newline in the text still ends the line, the
     * text after it is cut off in the same way.
     *
     * @param  {string}   value   Text to add to the line
     * @param  {number}   codepage   Codepage to use for the text
     */
  #textWithoutWrap(value, codepage) {
    const lines = String(value).split(/\r\n|\n/g);

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length && !this.#clipped) {
        this.#fit(lines[i], codepage);
      }

      if (i < lines.length - 1) {
        this.flush({forceNewline: true});
      }
    }
  }

  /**
     * Add as much of a single line of text as fits on the line
     *
     * @param  {string}   value   Text to add to the line, without newlines
     * @param  {number}   codepage   Codepage to use for the text
     */
  #fit(value, codepage) {
    const width = this.style.width;
    const remaining = this.#columns - this.#cursor;

    /* The text fits */

    if (value.length * width <= remaining) {
      this.add({type: 'text', value, codepage, width}, value.length * width);
      return;
    }

    /* The text does not fit, whatever is added after it is dropped */

    this.#clipped = true;

    if (this.#overflow === 'ellipsis') {
      const needed = ELLIPSIS.length * width;

      /* Make room for the ellipsis, if necessary by removing characters that were added before */

      if (remaining < needed) {
        this.#backtrack(needed - remaining);
      }

      const available = this.#columns - this.#cursor - needed;

      if (available >= 0) {
        const piece = value.slice(0, Math.floor(available / width)).trimEnd();

        if (piece.length) {
          this.add({type: 'text', value: piece, codepage, width}, piece.length * width);
        }

        this.add({type: 'text', value: ELLIPSIS, codepage, width}, needed);
        return;
      }

      /* There is no room for an ellipsis, for example in a column narrower than the ellipsis, so clip instead */
    }

    const piece = value.slice(0, Math.floor((this.#columns - this.#cursor) / width));

    if (piece.length) {
      this.add({type: 'text', value: piece, codepage, width}, piece.length * width);
    }
  }

  /**
     * Remove text and spaces from the end of the line buffer to free up a
     * number of columns. Items that only change the state of the printer are
     * kept. Stops at content that cannot be measured, such as nested tables.
     *
     * @param  {number}   columns   Number of columns to free up
     */
  #backtrack(columns) {
    let freed = 0;

    for (let i = this.#buffer.length - 1; i >= 0 && freed < columns; i--) {
      const item = this.#buffer[i];

      if (STATE_TYPES.includes(item.type)) {
        continue;
      }

      if (typeof item.width !== 'number' || (item.type !== 'text' && item.type !== 'space')) {
        break;
      }

      while (freed < columns && (item.type === 'text' ? item.value.length : item.size) > 0) {
        if (item.type === 'text') {
          item.value = item.value.slice(0, -1);
        } else {
          item.size--;
        }

        freed += item.width;
      }

      if ((item.type === 'text' ? item.value.length : item.size) === 0) {
        this.#buffer.splice(i, 1);
      }
    }

    this.#cursor -= freed;
  }

  /**
   * Add spaces to the line
   *
   * @param {number} size Number of spaces to add to the line
   */
  space(size) {
    /* Without wrapping, spaces are clipped at the edge of the line */

    if (this.#overflow !== 'wrap') {
      size = Math.min(size, Math.floor((this.#columns - this.#cursor) / this.style.width));

      if (size <= 0) {
        return;
      }
    }

    this.add({type: 'space', size, width: this.style.width}, size * this.style.width);
  }

  /**
     * Add raw bytes to to the line
     *
     * @param  {array}   value   Array of bytes to add to the line
     * @param  {number}  length  Length in characters of the value
     */
  raw(value, length) {
    this.add({type: 'raw', payload: value}, length || 0);
  }

  /**
     * Add an item to the line buffer, potentially flushing it
     *
     * @param  {object}   value   Item to add to the line buffer
     * @param  {number}   length  Length in characters of the value
     */
  add(value, length) {
    if (value instanceof Array) {
      for (const item of value) {
        this.add(item);
      }

      this.#cursor += length || 0;
      this.#trimmable = false;
      return;
    }

    length = length || 0;

    if (length + this.#cursor > this.#columns) {
      this.flush();
    }

    this.#cursor += length;
    this.#buffer = this.#buffer.concat(value);

    /* Only a trailing space of text added with text() can be trimmed for right
       alignment, the padding of table cells and boxes is part of the layout */

    this.#trimmable = value.type === 'text';
  }

  /**
     * Move the cursor to the end of the line, forcing a flush
     * with the next item to add to the line buffer
     */
  end() {
    this.#cursor = this.#columns;
  }

  /**
     * Determine if a list of items contains printable content, or only
     * commands that change the state of the printer, such as styles,
     * fonts or alignment. Raw commands are not considered content, if
     * they contain printable data the caller is responsible for the newline.
     *
     * @param  {object[]}   items   The items of a line
     * @return {boolean}            True if the line contains printable content
     */
  static hasContent(items) {
    return items.some((item) => !STATE_TYPES.includes(item.type));
  }

  /**
     * Determine if a line contains a block that advances the paper by itself,
     * such as an image, barcode, QR code or PDF417 code, and nothing else
     * that is printable
     *
     * @param  {object[]}   items   The items of a line
     * @return {boolean}            True if the line is a self advancing block
     */
  static isBlock(items) {
    return items.some((item) => BLOCK_TYPES.includes(item.type)) &&
      items.every((item) => STATE_TYPES.includes(item.type) || BLOCK_TYPES.includes(item.type));
  }

  /**
     * Fetch the contents of line buffer
     *
     * @param  {options}   options   Options for flushing the buffer
     * @return {array}               Array of items in the line buffer
     */
  fetch(options) {
    /* Unless forced keep style changes for the next line */

    if (this.#cursor === 0 && !options.forceNewline && !options.forceFlush) {
      return [];
    }

    /* Check the alignment of the current line */

    const align = {
      current: this.#align,
      next: null,
    };

    for (let i = 0; i < this.#buffer.length - 1; i++) {
      if (this.#buffer[i].type === 'align' && !this.#buffer[i].payload) {
        align.current = this.#buffer[i].value;
      }
    }

    /* Check the last item in the buffer, to see if it changes the alignment, then save it for the next line */

    if (this.#buffer.length) {
      const last = this.#buffer[this.#buffer.length - 1];

      if (last.type === 'align' && !last.payload) {
        align.next = last.value;
      }
    }

    this.#align = align.current;

    /* Create a clean buffer without alignment changes */

    const buffer = this.#buffer.filter((item) => item.type !== 'align' || item.payload);

    /* Fetch the contents of the line buffer */

    let result = [];

    const restore = this.style.restore();
    const store = this.style.store();

    /* Styles only apply to text, spaces and raw data. On a line without any of
       those, such as a cut, an image or only pending state changes, the style
       commands are left out. The style object carries the state to the next line */

    const styled = buffer.some((item) => STYLED_TYPES.includes(item.type));

    const before = styled ? this.#stored : [];
    const after = styled ? store : [];
    const items = styled ? buffer : buffer.filter((item) => item.type !== 'style');

    /* State commands that were pending before the line started, such as a font
       change, go before the alignment padding. A font change alters the width
       of the characters, so the printer must apply it before it prints the
       spaces, otherwise the line is padded in the width of the previous font */

    let lead = 0;

    while (lead < items.length && LEADING_TYPES.includes(items[lead].type)) {
      lead++;
    }

    const leading = items.slice(0, lead);
    const trailing = items.slice(lead);

    if (this.#cursor === 0 && (options.ignoreAlignment || !this.#embedded)) {
      result = this.#merge([
        ...before,
        ...items,
        ...after,
      ]);
    } else {
      if (this.#align === 'right') {
        let last;

        /* Find index of last text or space element */

        for (let i = buffer.length - 1; i >= 0; i--) {
          if (buffer[i].type === 'text' || buffer[i].type === 'space') {
            last = i;
            break;
          }
        }

        /* Remove a trailing space from text, so that it ends at the edge of the paper */

        if (typeof last === 'number' && this.#trimmable) {
          if (buffer[last].type === 'text' && buffer[last].value.endsWith(' ')) {
            buffer[last].value = buffer[last].value.slice(0, -1);
            this.#cursor -= this.style.width;
          }
        }

        result = this.#merge([
          ...leading,
          ...this.#padding(this.#columns - this.#cursor),
          ...before,
          ...trailing,
          ...after,
        ]);
      }

      if (this.#align === 'center') {
        const left = Math.max(0, this.#columns - this.#cursor) >> 1;

        result = this.#merge([
          ...leading,
          ...this.#padding(left),
          ...before,
          ...trailing,
          ...after,
          ...this.#padding(this.#embedded ? this.#columns - this.#cursor - left : 0),
        ]);
      }

      if (this.#align === 'left') {
        result = this.#merge([
          ...before,
          ...items,
          ...after,
          ...this.#padding(this.#embedded ? this.#columns - this.#cursor : 0),
        ]);
      }
    }

    this.#stored = restore;
    this.#buffer = [];
    this.#cursor = 0;
    this.#trimmable = false;
    this.#clipped = false;

    if (options.forceNewline && !LineComposer.hasContent(result)) {
      result.push({type: 'empty'});
    }

    if (align.next) {
      this.#align = align.next;
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
      forceFlush: false,
      ignoreAlignment: false,
    }, options || {});

    const result = this.fetch(options);

    if (result.length) {
      this.#callback(result);
    }
  }

  /**
     * Padding for a number of columns, in single width spaces. Padding is
     * printed in the default style of this composer, which is the style
     * inherited by a table cell or box. When that style has double width,
     * single width spaces need a temporary size change, otherwise an odd
     * number of columns could not be filled.
     *
     * @param  {number}   columns   Number of columns to fill
     * @return {array}              Array of items
     */
  #padding(columns) {
    return LineComposer.padding(columns, this.style.getDefault('size'));
  }

  /**
     * Padding for a number of columns, in single width spaces, see #padding()
     *
     * @param  {number}   columns   Number of columns to fill
     * @param  {object}   size      The size in which the padding is printed, with a width and height
     * @return {array}              Array of items
     */
  static padding(columns, size) {
    if (columns <= 0) {
      return [];
    }

    if (size.width === 1) {
      return [{type: 'space', size: columns}];
    }

    return [
      {type: 'style', property: 'size', value: {width: 1, height: size.height}},
      {type: 'space', size: columns},
      {type: 'style', property: 'size', value: {width: size.width, height: size.height}},
    ];
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
      if (item.type === 'space') {
        if (item.size === 0) {
          continue;
        }

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
      } else if (item.type === 'style') {
        /* Consecutive changes of the same property collapse into the last one */

        const allowMerge =
          last >= 0 &&
          result[last].type === 'style' &&
          result[last].property === item.property;

        if (allowMerge) {
          result[last] = item;
          continue;
        }

        result.push(item);
        last++;
      } else {
        result.push(item);
        last++;
      }
    }

    return this.#dedupe(result);
  }

  /**
     * Remove style commands that set a property to the value the printer
     * already has. Every line starts in the default style.
     *
     * @param  {array}   items   Array of items
     * @return {array}           Array of items without redundant style commands
     */
  #dedupe(items) {
    const result = [];
    const state = new Map();

    const equal = (a, b) => (typeof a === 'object' && a !== null) ?
      a.width === b.width && a.height === b.height :
      a === b;

    for (const item of items) {
      if (item.type === 'style') {
        const current = state.has(item.property) ? state.get(item.property) : this.style.getDefault(item.property);

        if (equal(current, item.value)) {
          continue;
        }

        state.set(item.property, item.value);
      }

      result.push(item);
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
   * Determine if nothing has been added to the line buffer yet
   *
   * @return {boolean}   True if the line buffer is empty
   */
  get empty() {
    return this.#buffer.length === 0 && this.#cursor === 0;
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

export default LineComposer;
