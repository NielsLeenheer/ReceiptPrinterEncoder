import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

/**
 * Create a byte stream based on commands for StarPRNT or Star Line printers
 */
class ThermalPrinterEncoder extends ReceiptPrinterEncoder {
  /**
     * Create a new object
     *
     * @param  {object}   options   Object containing configuration options
    */
  constructor(options) {
    super(options || {});
  }
}

export { ThermalPrinterEncoder as default };
