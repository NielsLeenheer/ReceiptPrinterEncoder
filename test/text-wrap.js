import ReceiptPrinterEncoder from '../src/receipt-printer-encoder.js';
import TextWrap from '../src/text-wrap.js';
import { assert } from 'chai';

/* Whitespace between words is a separator that becomes the newline when the
   line wraps, whitespace before or after the words is literal, see #65 */

describe('TextWrap', function() {
    const wrap = (value, options) => TextWrap.wrap(value, Object.assign({ columns: 7 }, options));

    describe('separators', function () {
        it('should drop the separator that becomes the newline', function () {
            assert.deepEqual(wrap('One Two Three Four'), [ 'One Two', 'Three', 'Four' ]);
        });

        it('should drop the whole separator, however wide', function () {
            assert.deepEqual(wrap('One   Two   Three'), [ 'One', 'Two', 'Three' ]);
        });

        it('should print separators that do not cause a wrap', function () {
            assert.deepEqual(wrap('a   b'), [ 'a   b' ]);
        });

        it('should print aligned columns when the line fits', function () {
            assert.deepEqual(wrap('Item      1.00', { columns: 14 }), [ 'Item      1.00' ]);
        });

        it('should take the character width into account', function () {
            assert.deepEqual(wrap('One Two Three', { columns: 14, width: 2 }), [ 'One Two', 'Three' ]);
        });
    });

    describe('literal whitespace', function () {
        it('should keep whitespace at the start of the text', function () {
            assert.deepEqual(wrap('  One Two'), [ '  One', 'Two' ]);
        });

        it('should keep whitespace at the start of an explicit line', function () {
            assert.deepEqual(wrap('One\n  Two'), [ 'One', '  Two' ]);
        });

        it('should keep whitespace at the end of the text', function () {
            assert.deepEqual(wrap('One '), [ 'One ' ]);
        });

        it('should keep whitespace at the end of an explicit line', function () {
            assert.deepEqual(wrap('One \nTwo'), [ 'One ', 'Two' ]);
        });

        it('should clip trailing whitespace at the edge of the line', function () {
            assert.deepEqual(wrap('One Two   '), [ 'One Two' ]);
        });

        it('should clip leading whitespace at the edge of the line', function () {
            assert.deepEqual(wrap('          One'), [ '       ', 'One' ]);
        });

        it('should keep a line of only whitespace', function () {
            assert.deepEqual(wrap('   '), [ '   ' ]);
        });
    });

    describe('continuing an existing line', function () {
        it('should treat leading whitespace as a separator when the word fits', function () {
            assert.deepEqual(wrap('   b', { columns: 5, indent: 1 }), [ '   b' ]);
        });

        it('should drop leading whitespace as a separator when the word wraps', function () {
            assert.deepEqual(wrap('   b', { columns: 4, indent: 1 }), [ '', 'b' ]);
        });

        it('should keep leading whitespace without a word, clipped', function () {
            assert.deepEqual(wrap('     ', { columns: 4, indent: 1 }), [ '   ' ]);
        });

        it('should only apply the indent to the first line', function () {
            assert.deepEqual(wrap('b\n  c', { columns: 4, indent: 1 }), [ 'b', '  c' ]);
        });
    });

    describe('non-breaking spaces', function () {
        it('should keep non-breaking spaces at the start of the text', function () {
            assert.deepEqual(wrap('  One'), [ '  One' ]);
        });

        it('should not wrap at a non-breaking space', function () {
            assert.deepEqual(wrap('One Two Three'), [ 'One Two', 'Three' ]);
        });

        it('should keep non-breaking spaces at the end of a line', function () {
            assert.deepEqual(wrap('One \nTwo'), [ 'One ', 'Two' ]);
        });
    });

    describe('other behaviour', function () {
        it('should return a single empty line for an empty string', function () {
            assert.deepEqual(wrap(''), [ '' ]);
        });

        it('should keep explicit empty lines', function () {
            assert.deepEqual(wrap('a\n\nb'), [ 'a', '', 'b' ]);
        });

        it('should split words longer than the line', function () {
            assert.deepEqual(wrap('abcdefghijklmnop'), [ 'abcdefg', 'hijklmn', 'op' ]);
        });

        it('should start a long word on the current line when enough space remains', function () {
            assert.deepEqual(wrap('ab abcdefghijklmnopqrstuvwxyz', { columns: 20 }), [ 'ab abcdefghijklmnopq', 'rstuvwxyz' ]);
        });

        it('should allow a break after a hyphen', function () {
            assert.deepEqual(wrap('One Two-Three'), [ 'One', 'Two-', 'Three' ]);
            assert.deepEqual(wrap('Two-Three', { columns: 9 }), [ 'Two-Three' ]);
        });
    });
});

describe('Whitespace in text() and line()', function() {
    const CODEPAGE = [ 27, 116, 0 ];
    const NL = [ 10, 13 ];
    const spaces = (n) => new Array(n).fill(32);

    describe('line("    Left padded")', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.line('    Left padded').encode();

        it('should print the leading spaces, see #65', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...spaces(4), 76, 101, 102, 116, 32, 112, 97, 100, 100, 101, 100, ...NL ]), result);
        });
    });

    describe('codepage(windows1252).line("\\u00a0\\u00a0Left padded")', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
        let result = encoder.codepage('windows1252').line('  Left padded').encode();

        it('should print the leading non-breaking spaces, see #65', function () {
            assert.deepEqual(new Uint8Array([ 27, 116, 16, 160, 160, 76, 101, 102, 116, 32, 112, 97, 100, 100, 101, 100, ...NL ]), result);
        });
    });

    describe('text(a).text("   b") on a 32 column line that wraps', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
        let result = encoder.text('a'.repeat(30)).text('   b').encode();

        it('should drop the separator and wrap the word', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...new Array(30).fill(97), ...NL, 98, ...NL ]), result);
        });
    });

    describe('text("a   ").text(b) on a 32 column line that wraps', function () {
        let encoder = new ReceiptPrinterEncoder({ language: 'esc-pos', columns: 32 });
        let result = encoder.text('a'.repeat(30) + '   ').text('b').encode();

        it('should keep the trailing whitespace, clipped, and wrap the word', function () {
            assert.deepEqual(new Uint8Array([ ...CODEPAGE, ...new Array(30).fill(97), 32, 32, ...NL, 98, ...NL ]), result);
        });
    });
});
