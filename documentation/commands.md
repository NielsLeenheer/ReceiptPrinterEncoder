# ReceiptPrinterEncoder

Create a set of commands that can be send to any receipt printer that supports ESC/POS, StarLine or StarPRNT.

- [About ReceiptPrinterEncoder](../README.md)
- [Usage and installation](usage.md)
- [Configuration options](configuration.md)
- [Handling text](text.md)
- [Commands for creating receipts](commands.md)
  - [Initialize](#initialize)
  - [Codepage](#codepage)
  - [Text](#text)
  - [Newline](#newline)
  - [Line](#line)
  - [Underline](#underline)
  - [Bold](#bold)
  - [Italic](#italic)
  - [Invert](#invert)
  - [Align](#align)
  - [Font](#font)
  - [Width](#width)
  - [Height](#height)
  - [Size](#size)
  - [Table](#table)
  - [Box](#box)
  - [Rule](#rule)
  - [Box](#box)
  - [Barcode](#barcode)
  - [Qrcode](#qrcode)
  - [Image](#image)
  - [Pulse](#pulse)
  - [Cut](#cut)
  - [Raw](#raw)
- [Printing receipts](printing.md)
- [Migrating from version 2 to version 3](changes.md)

## Commands for creating receipts

Once you have instantiated your `ReceiptPrinterEncoder` object, you can use it to queue commands for adding content, styling the text, inserting barcodes, images and qrcodes and more. 

When you are done, you can use the `encode()` command to get back your encoded receipt, ready to be send to the printer.

You can reuse the instantiated `ReceiptPrinterEncoder` class to generate multiple commands or sets of commands for the same printer. It will remember settings like code page, so you don't have to specify that on subsequent use. That does rely on that previous commands were actually send to the printer. 

All commands can be chained, except for `encode()` which will return the result as an Uint8Array which contains all the bytes that need to be send to the printer.

The following commands are available:

---

### Initialize

Properly initialize the printer, which means text mode is enabled and settings like code page are set to default.

```js
let result = encoder
    .initialize()
    .encode()
```

### Codepage

Set the code page of the printer. 

If you specify the code page, it will send a command to the printer to enable that particular code page and from then on it will automatically encode all text string to that code page. 

```js
let result = encoder
    .codepage('cp850')
    .text('Iñtërnâtiônàlizætiøn')
    .codepage('cp851')
    .text('διεθνοποίηση')
    .codepage('cp866')
    .text('интернационализация')
    .encode()
```

Alternatively you can specify `auto` to let this library automatically handle the code page encoding. This functionality depends on having the right `printerModel` or `codepageMapping` set in the configuration options.

```js
let result = encoder
    .codepage('auto')
    .text('Iñtërnâtiônàlizætiøn')
    .text('διεθνοποίηση')
    .text('интернационализация')
    .encode()
```

See the chapter [Handling text](text.md) for more information about code pages.

### Text

Print a string of text. Word are wrapped automatically at the width specified by the `columns` property set at initialisation. 

```js
let result = encoder
    .text('The quick brown fox jumps over the lazy dog')
    .encode()
```

### Newline

Move to the beginning of the next line.

```js
let result = encoder
    .newline()
    .encode()
```

Optionally you can provide the number of lines you want to insert. The default is one line.

```js
let result = encoder
    .newline(4)
    .encode()
```

### Line

Print a line of text. This is similar to the `text()` command, except it will automatically add a `newline()` command.

```js
let result = encoder
    .line('The is the first line')
    .line('And this is the second')
    .encode()
```

This would be equal to:

```js
let result = encoder
    .text('The is the first line')
    .newline()
    .text('And this is the second')
    .newline()
    .encode()
```

### Underline

Change the text style to underline. 

```js
let result = encoder
    .text('This is ')
    .underline()
    .text('underlined')
    .underline()
    .encode()
```

It will try to remember the current state of the text style. But you can also provide and additional parameter to force the text style to turn on and off.

```js
let result = encoder
    .text('This is ')
    .underline(true)
    .text('bold')
    .underline(false)
    .encode()
```

### Bold

Change the text style to bold. 

```js
let result = encoder
    .text('This is ')
    .bold()
    .text('bold')
    .bold()
    .encode()
```

It will try to remember the current state of the text style. But you can also provide and additional parameter to force the text style to turn on and off.

```js
let result = encoder
    .text('This is ')
    .bold(true)
    .text('bold')
    .bold(false)
    .encode()
```

### Italic

Change the text style to italic. 

```js
let result = encoder
    .text('This is ')
    .italic()
    .text('italic')
    .italic()
    .encode()
```

It will try to remember the current state of the text style. But you can also provide and additional parameter to force the text style to turn on and off.

```js
let result = encoder
    .text('This is ')
    .italic(true)
    .text('italic')
    .italic(false)
    .encode()
```

Note: this text style is not supported by most ESC/POS receipt printers and not at all by StarPRNT receipt printers.

### Invert

Change the style to white text on a black background. 

```js
let result = encoder
    .text('This is ')
    .invert()
    .text('white text on black')
    .invert()
    .encode()
```

It will try to remember the current state of the text style. But you can also provide and additional parameter to force the text style to turn on and off.

```js
let result = encoder
    .text('This is ')
    .invert(true)
    .text('white text on black')
    .invert(false)
    .encode()
```

### Align

Change the alignment of the text. You can specify the alignment using a parameter which can be either "left", "center" or "right".

```js
let result = encoder
    .align('right')
    .line('This line is aligned to the right')
    .align('center')
    .line('This line is centered')
    .align('left')
    .line('This line is aligned to the left')
    .encode()
```

### Font

Change the printer font. You can specify the font using the name of the font, such as "A", or "B". Or if the
printer supports more: "C", "D" and so on.

```js
let result = encoder
    .font('B')
    .line('Small text)
    .font('A')
    .line('Normal text)
    .encode()
```

Alternatively you can specify the font by using the dimensions of the font, for example:

```js
let result = encoder
    .font('9x17')
    .line('Small text)
    .font('12x24')
    .line('Normal text)
    .encode()
```

Please keep in mind that not all printers support all sizes. Please take a look at the specifications of your printer to see which fonts are supported. Additionally, not all printers use the same name for the same sizes. On some printers font "B" can be 9x17 pixels, on some other printers it can be 9x24 pixels. But generally font "A" is the larger default, and font "B" is the smaller optional one.


### Width

Change the text width. You can specify the width using a parameter which can be a number from 1 to 6 for StarPRNT or 1 to 8 for ESC/POS.

```js
let result = encoder
    .width(2)
    .line('A line of text twice as wide')
    .width(3)
    .line('A line of text three times as wide')
    .width(1)
    .line('A line of text with normal width')
    .encode()
```

Not all printers support all widths, it is probably best to not go over 4x at the most just to be safe.

### Height

Change the text height. You can specify the height using a parameter which can be a number from 1 to 6 for StarPRNT or 1 to 8 for ESC/POS.

```js
let result = encoder
    .height(2)
    .line('A line of text twice as high')
    .height(3)
    .line('A line of text three times as high')
    .height(1)
    .line('A line of text with normal height')
    .encode()
```

Not all printers support all heights, it is probably best to not go over 4x at the most just to be safe.

### Size

It is also possible to change the width and height at the same time with one command. The first parameter will be the width, the second parameter will be the height.

```js
let result = encoder
    .size(2, 2)
    .line('This text is twice as large as normal text')
    .size(1, 1)
    .encode()
```

If you want to change the width and height to the same value, you call this function with just one parameter to change both at the same time.

```js
let result = encoder
    .size(2)
    .line('This text is twice as large as normal text')
    .size(1)
    .encode()
```

### Table

Insert a table with multiple columns. The contents of each cell can be a string, or a callback function.

```js
let result = encoder
    .table(
        [
            { width: 36, marginRight: 2, align: 'left' },
            { width: 10, align: 'right' }
        ], 
        [
            [ 'Item 1', '€ 10,00' ],
            [ 'Item 2', '15,00' ],
            [ 'Item 3', '9,95' ],
            [ 'Item 4', '4,75' ],
            [ 'Item 5', '211,05' ],
            [ '', '='.repeat(10) ],
            [ 'Total', (encoder) => encoder.bold().text('€ 250,75').bold() ],
        ]
    )	
    .encode()
```

The table function takes two parameters. 

The first parameter is an array of column definitions. Each column can have the folowing properties:

- `width`:  determines the width of the column. 
- `marginLeft` and `marginRight`: set a margin to the left and right of the column. 
- `align`: sets the horizontal alignment of the text in the column and can either be `left` or `right`.
- `verticalAlign`: sets the vertical alignment of the text in the column and can either be `top` or `bottom`.

The second parameter contains the data and is an array that contains each row. There can be as many rows as you would like.

Each row is an array with a value for each cell. The number of cells in each row should be equal to the number of columns you defined previously.

```js
[
    /* Row one, with two columns */
    [ 'Cell one', 'Cell two' ],

    /* Row two, with two columns */
    [ 'Cell three', 'Cell four' ]
]
```

The value can either be a string or a callback function. 

If you want to style text inside of a cell, can use the callback function instead. The first parameter of the called function contains the encoder object which you can use to chain additional commands.

```js
[
    /* Row one, with two columns */
    [ 
        'Cell one',
        (encoder) => encoder.bold().text('Cell two').bold()
    ],
]
```


### Box

Insert a bordered box. 

The first parameter is an object with additional configuration options.

- `style`: The style of the border, either `none`, `single` or `double`
- `width`: The width of the box including the border, by default the width of the paper
- `marginLeft`: Space between the left border and the left edge
- `marginRight`: Space between the right border and the right edge
- `paddingLeft`: Space between the contents and the left border of the box
- `paddingRight`: Space between the contents and the right border of the box
- `align`: The alignment of the text within the box, can be `left` or `right`.

The second parameter is the content of the box and it can be a string, or a callback function.

For example:

```js
let result = encoder
    .box(
        { width: 30, align: 'right', style: 'double', marginLeft: 10 }, 
        'The quick brown fox jumps over the lazy dog';o50[p49]
    )
    .encode()
```

### Rule

Insert a horizontal rule.

The first parameters is an object with additional styling options:

- `style`: The style of the line, either `single` or `double`
- `width`: The width of the line, by default the width of the paper

For example:

```js
let result = encoder
    .rule({ style: 'double' })  
    .encode()
```     

### Barcode

Print a barcode of a certain symbology. The first parameter is the value of the barcode as a string, the second is the symbology and finally the height of the barcode.

The following symbologies can be used for both ESC/POS and StarPRNT: `upca`, `ean13`, `ean8`, `code39`, `itf`, `code93`, `code128`, `gs1-128`, `gs1-databar-omni`, `gs1-databar-truncated`, `gs1-databar-limited`, `gs1-databar-expanded`, `code128-auto`.

The following symbologies can be used for ESC/POS: `codabar`

The following symbologies can be used for StarPRNT: `upce`, `nw-7`

> [!NOTE]
> Just because the symbology is suppored by this library does not mean that the printer will actually support it. If the symbology is not supported, the barcode will simply not be printed, or the raw data will be printed instead, depending on the model and manufacturer of the printer.

In general the printer will automatically calculate the checksum if one is not provided. If one is provided in the data, it will not check the checksum. If you provide the checksum yourself and it is not correctly calculated, the behaviour is not defined. It may calculate the correct checksum use that instead or print an invalid barcode. 

For example with the checksum provided in the data:

```js
let result = encoder
    .barcode('3130630574613', 'ean13', 60)
    .encode()
```

Or without a checksum:

```js
let result = encoder
    .barcode('313063057461', 'ean13', 60)
    .encode()
```

Both examples above should result in the same barcode being printed.

Furthermore, depending on the symbology the data must be handled differently:

| Symbology | Length | Characters |
|-|-|-|
| upca | 11 - 12 | 0 - 9 |
| ean8 | 7 - 8 | 0 - 9 |
| ean13 | 12 - 13 | 0 - 9 |
| code39 | >= 1 | 0 - 9, A - Z, space, or $ % * + - . / |
| itf | >= 2 (even) | 0 - 9 |
| codabar | >= 2 | 0 - 9, A - D, a - d, or $ + − . / : |
| code93 | 1 - 255 | ASCII character (0 - 127) |
| code128 | 1 - 253 | ASCII character (32 - 127) |

The Code 128 symbology specifies three different code sets which contain different characters. For example: CODE A contains ASCII control characters, special characters, digits and uppercase letters. CODE B contains special characters, digits, uppercase letters and lowercase letters. CODE C prints 2 digits numbers that correspond to the ASCII value of the letter.  

By default Code 128 uses CODE B. It is possible to use a different code set, by using the code set selector character { followed by the uppercase letter of the character set.

For example with the default CODE B set: 

```js
let result = encoder
    .barcode('CODE128 test', 'code128', 60)
    .encode()
```

Is equivalent to manually selecting CODE B:

```js
let result = encoder
    .barcode('{B' + 'CODE128 test', 'code128', 60)
    .encode()
```

And Code C only supports numbers, but you must encode it as a string:

```js
let result = encoder
    .barcode('{C' + '2Uc#', 'code128', 60)
    .encode()
```

If you look up the value of the characters in an ASCII table, you will see that 2 = 50, U = 85, c = 99 and # = 35.

The printed barcode will be `50859935`.

All of the other symbologies require even more complicated encoding specified in the Espon ESC/POS printer language specification. To use these other symbologies you need to encode these barcodes yourself.



### Qrcode

Print a QR code. The first parameter is the data of the QR code.

```js
let result = encoder
    .qrcode('https://nielsleenheer.com')
    .encode()
```

The qrcode function accepts the following additional parameters:

- *model* - a number that can be 1 for Model 1 and 2 for Model 2
- *size* - a number that can be between 1 and 8 for determining the size of the QR code
- *errorlevel* - a string that can be either 'l', 'm', 'q' or 'h'.

For example:

```js
let result = encoder
    .qrcode('https://nielsleenheer.com', 1, 8, 'h')
    .encode()
```

Not all printers support printing QR codes. If the printer does not support it, the QR code will simply not be printed, or the raw data will be printed instead, depending on the model and manufacturer of the printer.


### PDF417 code

Print a PDF417 code. The first parameter is the data of the PDF417 code.

```js
let result = encoder
    .pdf417('https://nielsleenheer.com')
    .encode()
```

This function accepts an object as a second parameter for extra configuration options:

- *width* - the width of a module in pixels, this 3 by default
- *height* - the height of the module compared to the width, this is 3 by default, making the module 9 pixels high by default
- *columns* - the number of codewords on the horizontal axis, 0 = auto, otherwise between 1 and 30.
- *rows* - the number of codewords on the vertical axis, 0 = auto, otherwise between 3 and 90.
- *errorlevel* - a number between 0 and 8.
- *truncated* - a boolean, if set to true the stop pattern is not printed.

For example:

```js
let result = encoder
    .pdf417('https://nielsleenheer.com', { width: 4, height: 4, errorlevel: 8 })
    .encode()
```

Not all printers support printing PDF417 codes. If the printer does not support it, the PDF417 code will simply not be printed, or the raw data will be printed instead, depending on the model and manufacturer of the printer.



### Image

Print an image. The image is automatically converted to black and white and can optionally be dithered using different algorithms.

The first parameter is the image itself. 

When running in the browser it can be an `ImageData` object, or any element that can be drawn onto a canvas, like an `<img>`, `<svg>`, `<canvas>` or `<video>` element. 

When using Node you have multiple options:

- First of all, you can provide an `ImageData` object, which many libraries can export, such as `@canvas/image`, `canvas` and `image-pixels`.

- You can also provide raw pixel data provided by other common libraries, such as `readimage`, `sharp` and `get-pixels`.

- And finally you can provide a `Canvas` or `Image` object used by the `canvas` library. However, if you provide an `Image` object the library needs to convert it to a canvas and for that you need to provide a `createCanvas` function when instantiating the encoder (In previous versions you did not need to do this, because the `canvas` library was a dependency, but in recent versions this has become an optional dependency).

The second parameter is the width of the image on the paper receipt in pixels. It must be a multiple of 8. The provided image will be resized to the width specified here. 

The third parameter is the height of the image on the paper receipt in pixels. It must be a multiple of 8. The provided image will be resized to the height specified here. 

The fourth parameter is the dithering algorithm that is used to turn colour and grayscale images into black and white. The follow algorithms are supported: threshold, bayer, floydsteinberg, atkinson. If not supplied, it will default to a simple threshold.

The fifth paramter is the threshold that will be used by the threshold and bayer dithering algorithm. It is ignored by the other algorithms. It is set to a default of 128.

For example on the web:

```js
let encoder = new ReceiptPrinterEncoder();

let img = new Image();
img.src = 'https://...';

img.onload = function() {
    let result = encoder
        .image(img, 64, 64, 'atkinson')
        .encode()
}
```

Or in Node using `sharp`:

```js
import sharp from "sharp";

let buffer = await sharp('image.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

let encoder = new ReceiptPrinterEncoder();

let result = encoder
    .image(buffer, 64, 64, 'atkinson')
    .encode();
```

Or in Node using `canvas`:

```js
import { createCanvas, loadImage } from 'canvas';

let image = await loadImage('image.png');

let encoder = new ReceiptPrinterEncoder({
    createCanvas
});

let result = encoder
    .image(image, 64, 64, 'atkinson')
    .encode();
```

You can find examples for many types of image reading libraries in the `examples` directory.

> [!NOTE]
> If you are trying to print an image on an ESC/POS printer and it does not work properly, you can try changing the image mode in the [configuration settings](configuration.md#image-mode). Some printers only support `raster` mode, other printers only support `column` mode.


### Pulse

Send a pulse to an external device, such as a beeper or cash drawer. 

```js
let result = encoder
    .pulse()
    .encode()
```

The first parameter is the device where you want to send the pulse. This can be 0 or 1 depending how the device is connected. This parameter is optional an by default it will be send to device 0.

The second parameter is how long the pulse should be active in milliseconds, with a default of 100 milliseconds

The third parameter is how long there should be a delay after the pulse has been send in milliseconds, with a default of 500 milliseconds.

```js
let result = encoder
    .pulse(0, 100, 500)
    .encode()
```

### Cut

Cut the paper. Optionally a parameter can be specified which can be either be "partial" or "full". If not specified, a full cut will be used. 

```js
let result = encoder
    .cut('partial')
    .encode()
```

Not all printer models support cutting paper. And even if they do, they might not support both types of cuts.


> [!NOTE]
> If the location of your printers cutter is higher than the last line of printed text, you may need to feed the paper some extra lines. You can use [the `feedBeforeCut` configuration option](configuration.md#feed-before-cut) to do this automatically.


### Raw

Add raw printer commands, in case you want to send a command that this library does not support natively. For example the following command is to turn of Hanzi character mode on ESC/POS printers

```js
let result = encoder
    .raw([ 0x1c, 0x2e ])
    .encode()
```     

Please be aware that raw printer commands are language specific. Depending on the language your printer supports you may need to send different commands.
