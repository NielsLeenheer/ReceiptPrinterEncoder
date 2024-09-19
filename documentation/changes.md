# ReceiptPrinterEncoder
**Formally known as EscPosEncoder, StarPrntEncoder and ThermalPrinterEncoder**

<br>

Create a set of commands that can be send to any receipt printer that supports ESC/POS, StarLine or StarPRNT.

- [About ReceiptPrinterEncoder](../README.md)
- [Usage and installation](usage.md)
- [Configuration options](configuration.md)
- [Handling text](text.md)
- [Commands for creating receipts](commands.md)
- [Printing receipts](printing.md)
- [Migrating from version 2 to version 3](changes.md)
  - [New name](#new-name)
  - [Standalone](#standalone)
  - [Default language](#default-language)
  - [Dependency on canvas removed](#dependency-on-canvas-removed)
  - [Wrap parameter for text() and line() removed](#wrap-parameter-for-text-and-line-removed)
  - [Width parameter renamed to columns and now has a default value](#width-parameter-renamed-to-columns-and-now-has-a-default-value)
  - [Alignment now uses spaces](#alignment-now-uses-spaces)
  - [Size() changed functionality](#size-changed-functionality)
  - [Qrcode() now uses a configuration object](#qrcode-now-uses-a-configuration-object)
  - [Some code page mappings have been renamed](#some-code-page-mappings-have-been-renamed)
  - [Automatic encoding of codepages](#automatic-encoding-of-codepages)

<br>

## Migrating from version 2 to version 3

ReceiptPrinterEncoder has been completely rewritten in version 3, but we've attempted to keep the API backwards compatible. And for the most part that is true, except when dealing with images in Node. See below for the details.

<br>

### New name

ReceiptPrinterEncoder was previously named ThermalPrinterEncoder. This name was changed to be more consistant with its sister libraries. Also we're now moving to a single scope for all Point-Of-Sale related libraries.

Version 2:

    npm i thermal-printer-encoder

Version 3:

    npm i @point-of-sale/receipt-printer-encoder

<br>

### Standalone

Previously this library had a dependancy on EscPosEncoder and StarPrntEncoder. That is no longer the case, as this library can now encode both ESC/POS, StarLine and StarPRNT by itself. That means there is less duplicated code and our bundle size can be quite a bit smaller.

If you are still using EscPosEncoder or StarPrntEncoder, the dependancy is now the other way around. EscPosEncoder and StarPrntEncoder have been updated to use ReceiptPrinterEncoder as a dependency and it is advised to use ReceiptPrinterEncoder instead.

<br>

### Default language

In previous versions of this library you had to specify a language, such as `esc-pos` or `star-prnt`. If you did not specify the language, you would get an exception. In the latest version the langauge will default to `esc-pos`.

<br>

### Dependency on canvas removed

When using Node, this library previously had a dependency on the `canvas` package for dealing with images. In version 3 we've made this library more lightweight and flexible by removing this dependency, allowing you to use other libraries as well. 

However, if you want to continue using the `canvas` package for images, you now have to handle the dependency yourself. 

This only applies if you provide the image as an `Image` object. If you make your own image and provide a `Canvas` object, you do not need to make any modifications.

Version 2:

```js
import { loadImage } from 'canvas';
import ThermalPrinterEncoder from 'thermal-printer-encoder';

let image = await loadImage('image.png');

let encoder = new ThermalPrinterEncoder();

encoder.image(image, ...)
```

Version 3:

```js
import { createCanvas, loadImage } from 'canvas';
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

let image = await loadImage('image.png');

let encoder = new ReceiptPrinterEncoder({ 
    createCanvas 
});

encoder.image(image, ...)
```

If all you want to do is print already existing image files, you might even want to move away from `canvas` altogether to a more lightweight image library. There are examples on how to use various libraries in the `examples` directory.

<br>

### Wrap parameter for text() and line() removed

It is no longer possible to specify the number of columns after which to wrap when using the `text()` or `line()` command. Instead you could use the `box()` function with a border style of `none`.

Version 2:

```js
encoder
    .text('... a long block of text ...', 30)
```

Version 3:
```js
encoder
    .box(
        { width: 30, style: 'none' }, 
        '... a long block of text ...'
    )
```

<br>

### Width parameter renamed to columns and now has a default value

The `width` parameter has now been changed to the `columns` parameter. The `width` parameter still works, but is deprecated and will be removed in future releases. 
In previous versions this parameter did not have a default value, but that is now set to 42 characters.

<br>

### Alignment now uses spaces

In previous version of this library, we used the build-in alignment functionality of the printer to create right aligned or centered text. This has been changed in version 3. From now on we always use left aligned text and align the text ourselves inserting spaces before the text. This allows us to control word wrapping better and also works in tables and boxes.

Images and barcodes still use the build-in alignment of the printer.

<br>

### Size() changed functionality

In version 2 you could call `size()` with the parameter `normal` or `small` to change the font size. This functionality has now been moved to the `font()` function. 

Version 2:

```js
encoder
    .size('small')
    .text('This is small text')
```

Version 3:

```js
encoder
    .font('B')
    .text('This is small text')
```

In addition to this, the `size()` function is now a shortcut for the `width()` and `height()` functions allowing you to change the width and height with just one command.

Version 2:

```js
encoder
    .width(2)
    .height(2)
    .text('This is big text')
```

Version 3:

```js
encoder
    .size(2)
    .text('This is big text')
```

The old way of using the `size()` function still works, but it has been deprecated and will be removed in a future version.

<br>

### Qrcode() now uses a configuration object

Instead of seperate parameters for model, size and errorlevel, the `qrcode()` function now uses a configuration object to set the model, size and errorlevel.

Version 2: 

```js
let result = encoder
    .qrcode('https://nielsleenheer.com', 1, 8, 'h')
    .encode()
```

Version 3: 

```js
let result = encoder
    .qrcode('https://nielsleenheer.com', { model: 1, size: 8, errorlevel: 'h' })
    .encode()
```

The old way of using the `qrcode()` function still works, but it has been deprecated and will be removed in a future version.

<br>

### Some code page mappings have been renamed

The previous version of this library had an optional code page mapping with the name of `zijang`. This has been renamed to `pos-5890` to match the model number of this device. 

<br>

### Automatic encoding of codepages

In previous versions of this library it supported automatic encoding of codepages using a limited set of codepages:

`cp437`, `cp858`, `cp860`, `cp861`, `cp863`, `cp865`, `cp852`, `cp857`, `cp855`, `cp866`, `cp869`

The current version still supports automatic encoding, except that it no longer uses a fixed set of codepages, unless you manually specify one using the `codepageCandidates` property. Instead it will now use all codepages supported by the printer to encode characters from.
