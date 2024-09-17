# ReceiptPrinterEncoder

Create a set of commands that can be send to any receipt printer that supports ESC/POS, StarLine or StarPRNT.

- [About ReceiptPrinterEncoder](README.md)
- [Usage and installation](documentation/usage.md)
- [Configuration options](documentation/configuration.md)
- [Handling text](documentation/text.md)
- [Commands for creating receipts](documentation/commands.md)
- [Printing receipts](documentation/printing.md)
- [Changes from version 2 to version 3](documentation/changes.md)


## About ReceiptPrinterEncoder

This library allows you to run commands to add content, such as text, images and barcodes to a receipt and encode that content to ESC/POS, StarLine and StarPRNT commands. 

```js
let encoder = new ReceiptPrinterEncoder();

let result = encoder
    .line('The is the first line')
    .line('And this is the second')
    .encode()

/* To do: send result to the printer */
```

Once you have the encoded commands you need a method to send those commands to the receipt printer - to actually print the receipt. And for that we have a list of sister libraries.

> [!NOTE]
> **Formally known as EscPosEncoder, StarPrntEncoder and ThermalPrinterEncoder**
>
> This library was previously available as seperate encoders for ESC/POS and StarPRNT. Or as a combined encoder under the name ThermalPrinterEncoder. This is a complete rewrite under a new name: `ReceiptPrinterEncoder`.


This library has been created by Niels Leenheer under the [MIT license](LICENSE). Feel free to use it in your products. The  development of this library is sponsored by Salonhub.

<a href="https://salohub.nl"><img src="https://salonhub.nl/assets/images/salonhub.svg" width=100></a>
