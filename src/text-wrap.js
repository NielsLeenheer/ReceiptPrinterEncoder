/**
 * Wrap text into lines of a specified width.
 *
 * Whitespace is handled by the following rules:
 *
 * - Whitespace between two words is a separator. When the second word fits on
 *   the line, the separator is printed. When the second word wraps, the
 *   separator becomes the newline and is not printed.
 * - Whitespace before the first word of a line is literal and printed as
 *   indentation, unless the line continues an existing line on the printer,
 *   in which case it is a separator between the existing content and the word.
 * - Whitespace after the last word of a line is literal and printed.
 * - Literal whitespace never causes a wrap, it is clipped at the edge of the line.
 * - Non-breaking spaces are part of words.
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
    const width = options.width || 1;
    const columns = options.columns || 42;
    const indent = options.indent || 0;

    const lines = String(value).split(/\r\n|\n/g);

    for (let l = 0; l < lines.length; l++) {
      let line = [];

      /* Only the first line can continue an existing line on the printer */

      let length = l === 0 ? indent : 0;

      /* Whitespace that is waiting for the next word, to decide if it is printed */

      let separator = null;

      /* Split the line into words and whitespace, a non-breaking space is part of a word */

      const tokens = lines[l].match(/[^ \t\f\v-]+?-\b|[^ \t\f\v]+|[ \t\f\v]+/g) || [];

      /* Add literal whitespace to the line, clipped at the edge of the line */

      const literal = (whitespace) => {
        const fit = Math.floor((columns - length) / width);

        if (fit > 0) {
          line.push(whitespace.slice(0, fit));
          length += Math.min(fit, whitespace.length) * width;
        }
      };

      for (const token of tokens) {
        /* Whitespace */

        if (/^[ \t\f\v]+$/.test(token)) {
          if (line.length === 0 && length === 0) {
            literal(token);
          } else {
            separator = token;
          }

          continue;
        }

        /* The word fits on the line, including the separator before it */

        const separatorLength = separator ? separator.length * width : 0;

        if (length + separatorLength + (token.length * width) <= columns) {
          if (separator) {
            line.push(separator);
            length += separatorLength;
            separator = null;
          }

          line.push(token);
          length += token.length * width;

          continue;
        }

        /* The word is longer than the line */

        if (token.length * width > columns) {
          const letters = token.split('');
          let piece;
          const pieces = [];

          /* If there are at least 8 positions remaining, break early */

          const remaining = columns - length - separatorLength;

          if (remaining > 8 * width) {
            if (separator) {
              line.push(separator);
              length += separatorLength;
            }

            piece = letters.splice(0, Math.floor(remaining / width)).join('');

            line.push(piece);
            result.push(line);

            line = [];
            length = 0;
          }

          separator = null;

          /* The remaining letters can be split into pieces the size of the width */

          while ((piece = letters.splice(0, Math.floor(columns / width))).length) {
            pieces.push(piece.join(''));
          }

          for (const piece of pieces) {
            if (length + (piece.length * width) > columns) {
              result.push(line);
              line = [];
              length = 0;
            }

            line.push(piece);
            length += piece.length * width;
          }

          continue;
        }

        /* The word fits on the next line, the separator becomes the newline */

        separator = null;

        result.push(line);
        line = [];
        length = 0;

        line.push(token);
        length += token.length * width;
      }

      /* Whitespace after the last word is literal */

      if (separator) {
        literal(separator);
      }

      result.push(line);
    }

    return result.map((line) => line.join(''));
  }
}

export default TextWrap;
