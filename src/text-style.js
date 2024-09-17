
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

export default TextStyle;
