# ReceiptPrinterEncoder

Create a set of commands that can be send to any receipt printer that supports ESC/POS, StarLine or StarPRNT.

- [About ReceiptPrinterEncoder](../README.md)
- [Usage and installation](usage.md)
  - [Using in the browser](#direct-use-in-the-browser)
  - [Using with Node](#using-with-node)
  - [Using with Deno](#using-with-deno)
- [Configuration options](configuration.md)
- [Handling text](text.md)
- [Commands for creating receipts](commands.md)
- [Printing receipts](printing.md)
- [Migrating from version 2 to version 3](changes.md)

## Usage and installation

This package is compatible with browsers and Node. It provides bundled versions for direct use in the browser and can also be used as an input for your own bundler. And of course there are ES6 modules and CommonJS versions for use in Node and Deno.

## Using in the browser

The `dist` folder contains bundles that can be directly used in the browser. We both have a modern ES6 module, or a legacy UMD bundle.

Import `ReceiptPrinterEncoder` from the `receipt-printer-encoder.esm.js` file located in the `dist` folder.

```js
import ReceiptPrinterEncoder from 'receipt-printer-encoder.esm.js';

let encoder = new ReceiptPrinterEncoder();

let result = encoder
    .initialize()
    .text('The quick brown fox jumps over the lazy dog')
    .newline()
    .qrcode('https://nielsleenheer.com')
    .encode();
```

Alternatively you can load the `receipt-printer-encoder.umd.js` file located in the `dist` folder and instantiate a `ReceiptPrinterEncoder` object. 

```html
<script src='dist/receipt-printer-encoder.umd.js'></script>

<script>

    let encoder = new ReceiptPrinterEncoder();

</script>
```
Or if you prefer a loader like RequireJS, you could use this:

```js
requirejs([ 'dist/receipt-printer-encoder.umd' ], ReceiptPrinterEncoder => {
    let encoder = new ReceiptPrinterEncoder();
});
```

## Using with Node

If you want to use this libary, first install the package using npm:

    npm install @point-of-sale/receipt-printer-encoder --save

If you prefer ES6 modules, then import `ReceiptPrinterEncoder` from `@point-of-sale/receipt-printer-encoder` and use it like so:

```js
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

let encoder = new ReceiptPrinterEncoder();

let result = encoder
    .initialize()
    .text('The quick brown fox jumps over the lazy dog')
    .newline()
    .qrcode('https://nielsleenheer.com')
    .encode();
```

Alternatively you could use the CommonJS way of doing things and require the package:

```js
let ReceiptPrinterEncoder = require('@point-of-sale/receipt-printer-encoder');

let encoder = new ReceiptPrinterEncoder();
```

## Using with Deno

This library does not have a dedicated package on `deno.land/x`, but you can directly import the NPM package. It is fully compatible with Deno.

```js
import ReceiptPrinterEncoder from 'npm:@point-of-sale/receipt-printer-encoder';

let encoder = new ReceiptPrinterEncoder();
```