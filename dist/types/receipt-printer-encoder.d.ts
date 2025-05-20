import type { PrinterModel } from "./printer-models";
import type { CodePageMapping } from "./codepage-mappings";
import type { CodePage } from "./codepages";

export type { CodePage };

export type Language = "esc-pos" | "star-prnt" | "star-line";

export type ImageMode = "column" | "raster";

export type ImageAlgorithm =
  | "threshold"
  | "bayer"
  | "floydsteinberg"
  | "atkinson";

export interface ReceiptPrinterOptions {
  columns?: number;
  /**
   * @deprecated The width parameter has now been changed to the columns parameter.
   */
  width?: number;
  language?: Language;
  imageMode?: ImageMode;
  feedBeforeCut?: number;
  newline?: string;
  codepageMapping?: CodePageMapping | Record<string, number>;
  codepageCandidates?: CodePageMapping[];
  debug?: boolean;
  embedded?: boolean;
  createCanvas?: (width: number, height: number) => HTMLCanvasElement;
  autoFlush?: boolean;
  printerModel?: PrinterModel;
}

export interface TableColumn {
  width?: number;
  marginLeft?: number;
  marginRight?: number;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "bottom";
}

export interface BoxOptions {
  style?: "none" | "single" | "double";
  width?: number;
  marginLeft?: number;
  marginRight?: number;
  paddingLeft?: number;
  paddingRight?: number;
  align: "left" | "center" | "right";
}

export interface QRCodeOptions {
  model?: 1 | 2;
  size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  errorlevel?: "l" | "m" | "q" | "h";
}

export interface PDF417Options {
  width?: number;
  height?: number;
  columns?: number;
  rows?: number;
  errorlevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  truncated?: boolean;
}

export interface RuleOptions {
  style?: "none" | "single" | "double";
  width?: number;
}

export default class ReceiptPrinterEncoder {
  constructor(options?: ReceiptPrinterOptions);

  initialize(): ReceiptPrinterEncoder;

  codepage(codepage: CodePage): ReceiptPrinterEncoder;

  text(value: string): ReceiptPrinterEncoder;

  newline(count?: number): ReceiptPrinterEncoder;

  line(value: string): ReceiptPrinterEncoder;

  underline(value?: boolean | number): ReceiptPrinterEncoder;

  italic(value?: boolean): ReceiptPrinterEncoder;

  bold(value?: boolean): ReceiptPrinterEncoder;

  invert(value?: boolean): ReceiptPrinterEncoder;

  width(width: number): ReceiptPrinterEncoder;

  height(height: number): ReceiptPrinterEncoder;

  size(width: number | string, height?: number): ReceiptPrinterEncoder;

  font(value: "A" | "B"): ReceiptPrinterEncoder;

  align(value: "left" | "center" | "right"): ReceiptPrinterEncoder;

  table(
    columns: ReadonlyArray<TableColumn>,
    data: ReadonlyArray<
      ReadonlyArray<
        string | ((encoder: ReceiptPrinterEncoder) => ReceiptPrinterEncoder)
      >
    >
  ): ReceiptPrinterEncoder;

  rule(options?: RuleOptions): ReceiptPrinterEncoder;

  box(
    options: BoxOptions,
    value: string | ((encoder: ReceiptPrinterEncoder) => void)
  ): ReceiptPrinterEncoder;

  barcode(
    value: string,
    symbology:
      | "upca"
      | "upce"
      | "ean13"
      | "ean8"
      | "coda39"
      | "itf"
      | "codabar",
    height?: number | object
  ): ReceiptPrinterEncoder;

  qrcode(value: string, options?: QRCodeOptions): ReceiptPrinterEncoder;

  pdf417(value: string, options?: PDF417Options): ReceiptPrinterEncoder;

  image(
    input: HTMLCanvasElement | ImageData | object,
    width: number,
    height: number,
    algorithm?: ImageAlgorithm,
    threshold?: number
  ): ReceiptPrinterEncoder;

  pulse(device?: "0" | "1", on?: number, off?: number): ReceiptPrinterEncoder;

  cut(value?: "full" | "partial"): ReceiptPrinterEncoder;

  raw(data: Uint8Array): ReceiptPrinterEncoder;

  encode(): Uint8Array;

  commands(): any[];

  static get printerModels(): { id: string; name: string }[];

  get columns(): number;

  get language(): string;
}
