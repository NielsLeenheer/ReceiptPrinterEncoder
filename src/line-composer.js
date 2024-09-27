import TextStyle from './text-style.js';
import TextWrap from './text-wrap.js';

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
    if (value.length && value[0] instanceof Array) {
      for (let i = 0; i < value.length; i++) {
        this.add({type: 'raw', value: value[i]}, length || 0);
      }
    } else {
      this.add({type: 'raw', value}, length || 0);
    }
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

    this.#align = align.current;

    /* Fetch the contents of the line buffer */

    let result = [];

    const restore = this.style.restore();
    const store = this.style.store();

    if (this.#cursor === 0 && options.ignoreAlignment) {
      result = this.#merge([
        ...this.#stored,
        ...this.#buffer,
        ...store,
      ]);
    } else {
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
    }

    this.#stored = restore;
    this.#buffer = [];
    this.#cursor = 0;

    if (result.length === 0 && options.forceNewline) {
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
      } else if (item.type === 'style' && item.property === 'size') {
        const allowMerge =
          last >= 0 &&
          result[last].type === 'style' &&
          result[last].property === 'size';

        if (allowMerge) {
          result[last].value = item.value;
          continue;
        }

        result.push(item);
        last++;
      } else if (item.type === 'style' || item.type === 'raw') {
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

export default LineComposer;
