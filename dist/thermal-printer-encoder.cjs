'use strict';

var EscPosEncoder = require('esc-pos-encoder');
var StarPrntEncoder = require('star-prnt-encoder');

/**
 * Create a byte stream based on commands for ESC/POS or StarPRNT printers
 */
class ThermalPrinterEncoder {
  /**
     * Create a new object
     *
     * @param  {object}   options   Object containing configuration options
     */
  constructor(options) {
    const languages = {
      'esc-pos': EscPosEncoder,
      'star-prnt': StarPrntEncoder,
    };

    if (typeof options === 'undefined' || typeof options.language === 'undefined') {
      throw new Error('You need to specify the language of the thermal printer');
    }

    if (typeof languages[options.language] === 'undefined') {
      throw new Error('Language not supported by this library');
    }

    this.language = options.language;

    const source = languages[this.language].prototype;
    const props = Object.getOwnPropertyNames(source);
    props.forEach((prop) => {
      this[prop] = source[prop];
    });

    this._reset(options);
  }
}

module.exports = ThermalPrinterEncoder;
