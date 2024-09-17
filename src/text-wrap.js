
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

export default TextWrap;
