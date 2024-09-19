# ReceiptPrinterEncoder
**Formally known as EscPosEncoder, StarPrntEncoder and ThermalPrinterEncoder**

<br>

Create a set of commands that can be send to any receipt printer that supports ESC/POS, StarLine or StarPRNT.

- [About ReceiptPrinterEncoder](../README.md)
- [Usage and installation](usage.md)
- [Configuration options](configuration.md)
- [Handling text](text.md)
  - [Printer support](#printer-support)
  - [Code page mappings](#code-page-mappings)
  - [Auto encoding](#auto-encoding)
  - [Advanced text compositing](#advanced-text-compositing)
- [Commands for creating receipts](commands.md)
- [Printing receipts](printing.md)
- [Migrating from version 2 to version 3](changes.md)

<br>

## Handling text

Receipt printers are based on technology from a long time ago. They don't support UTF-8 or any other unicode encoding, instead the rely on legacy code pages. Using code pages the printer can switch between different sets (or pages) of characters.

You can switch manually between code pages using the `codepage()` command. See [the next chapter](commands.md#codepage) for detailed information. 

This library will support encoding text in most - if not all - of the code pages that your printer supports. 

This is a complete list of standardized code pages:

`ascii`, `cp437`, `cp720`, `cp737`, `cp771`, `cp772`, `cp774`, `cp775`, `cp850`, `cp851`, `cp852`, `cp853`, `cp855`, `cp857`, `cp858`, `cp860`, `cp861`, `cp862`, `cp863`, `cp864`, `cp865`, `cp866`, `cp869`, `cp874`, `cp1001`, `cp1098`, `cp1125`, `cp3001`, `cp3002`, `cp3011`, `cp3012`, `cp3021`, `cp3041`, `cp3840`, `cp3841`, `cp3843`, `cp3844`, `cp3845`, `cp3846`, `cp3847`, `cp3848`, `iso8859-1`, `iso8859-2`, `iso8859-7`, `iso8859-15`, `windows1250`, `windows1251`, `windows1252`, `windows1253`, `windows1254`, `windows1255`, `windows1256`, `windows1257`, `windows1258`, `rk1048`, `thai11`, `thai13`, `thai14`, `thai16`, `thai18`, `thai42`, `tcvn3`, `tcvn3capitals`, `viscii`, `khmer`, `latvian`

And additionally there are also the following printer specific code pages:

`epson/katakana`, `epson/iso8859-2`, `star/standard`, `star/katakana`, `star/cp874`, `star/cp928`, `bixolon/cp866`, `bixolon/hebrew`, `xprinter/hebrew`, `pos8360/hebrew`

But...

<br>

### Printer support

Support for one specific code pages is not only dependant on this library, even more important is that the printer understands it. And support for code pages depend on manufacturer and model. Some only support a few, some support most of these. There are probably no printers that support all of them. 

Before choosing a code page, check the technical manual of your printer which code pages are supported. If your printer does not support a code page that you need, you are out of luck and nothing this library does can help you solve this problem. 

<br>

### Code page mappings

For the printer to understand which code page you want to use, there needs to be a mapping between the name of the code page and the internal numbering used by the printer. 

The code page mapping tells us which code pages the printer support and which internal id the printer uses for which code page. Not all printers support the same code pages, and even it they do, it is common for manufacturers to use a different mapping. That means that even though the printer supports the code page, the way to activate it is different for that printer. 

This library does support a number of code page mappings for common manufacturers, such as `bixolon`, `bixolon-legacy` `citizen`, `epson-legacy`, `epson`, `fujitsu`, `hp`, `metapace`, `mpt`, `pos-5890`, `pos-8360`, `xprinter`, `youku` and `star` (in ESC/POS emulation mode).

When using the ESC/POS language this library uses the Epson code page mappings and Epson printers will support most of the code pages out of the box. 

> [!NOTE]
> If you are specifying a `printerModel` in the configuration options, the correct code page mapping will automatically be used and you do not need to manually configure it.

You can manually activate these alternative mappings with a parameter when the library is instantiated:

```js
let encoder = new ReceiptPrinterEncoder({ 
    codepageMapping: 'bixolon' 
});
```

If you want to use a code page mapping that is specific to your printer, you can also specify an object with the correct mappings:

```js
let encoder = new ReceiptPrinterEncoder({ 
    codepageMapping: {
        'cp437': 0x00,
        'cp850': 0x02,
        'cp860': 0x03,
        'cp863': 0x04,
        'cp865': 0x05,
        'cp851': 0x0b,
        'cp858': 0x13,
    } 
});
```

Each property name must be one of the code pages supported by this library and the value is the number which is used for that code page on your printer. 

If you use the StarPRNT language, you do not need to specify a `codepageMapping`.

<br>

### Auto encoding

It is also possible to enable auto encoding of code pages. The library will then automatically switch between code pages depending on the text that you want to print. 

```js
let result = encoder
    .codepage('auto')
    .text('Iñtërnâtiônàlizætiøn')
    .text('διεθνοποίηση')
    .text('интернационализация')
    .encode()
```

Or even mix code pages within the same text:

```js
let result = encoder
    .codepage('auto')
    .text('You can mix ελληνική γλώσσα and русский язык')
    .encode()

```

By default the library will try to use all of the code pages that are available for your printer. If you only want use a subset of these code pages you can. You can customize the candidate code pages by setting an option during instantiation of the library:

```js
let encoder = new ReceiptPrinterEncoder({ 
    codepageCandidates: [
        'cp437', 'cp858', 'cp860', 'cp861', 'cp863', 'cp865',
        'cp852', 'cp857', 'cp855', 'cp866', 'cp869',
    ]
});
```

<br>

### Advanced text compositing

For some languages it might even be better to print text as an image, because receipt printers do not support advanced text compositing required by some languages, such as Arabic. You can do this by creating a Canvas and drawing your text on there. When finished, you can then use the canvas as a parameter of the `.image()` method to send it to the printer. There is an example of advanced text compositing in the `examples` directory.
