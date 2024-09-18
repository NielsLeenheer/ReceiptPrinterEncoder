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
  - [Printing in the browser](#printing-in-the-browser)
  - [Printing from Node](#printing-from-node)
- [Migrating from version 2 to version 3](changes.md)

<br>

## Printing receipts

The first thing to mention is that this library does in fact not have any method to send the encoded data to the printer. This library is only intended for encoding the data, which allows you to use various libraries to send data to the printer, making it extremely flexible and to be used in many environments.

But we do have a number of sister libraries which will help you print your receipt in the browser or in Node.

### Printing in the browser

If you use a Chromium-based browser that supports APIs such as WebUSB, WebSerial or WebBluetooth you can send data directly to the printer from a web application. 

Look at the following libraries:

- [WebBluetoothReceiptPrinter](https://github.com/NielsLeenheer/WebBluetoothReceiptPrinter)
- [WebSerialReceiptPrinter](https://github.com/NielsLeenheer/WebSerialReceiptPrinter)
- [WebUSBReceiptPrinter](https://github.com/NielsLeenheer/WebUSBReceiptPrinter)

### Printing from Node

If you use Node we have created the following libraries to send data to you receipt printer:

- [NetworkReceiptPrinter](https://github.com/NielsLeenheer/NetworkReceiptPrinter) – use this if you want to print directly to a network printer.
- [SystemReceiptPrinter](https://github.com/NielsLeenheer/SystemReceiptPrinter) – use this if you want to print to a printer that has been installed on your system.
