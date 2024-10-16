type PrinterModel =
  | "bixolon-srp350"
  | "bixolon-srp350iii"
  | "citizen-ct-s310ii"
  | "epson-tm-p20ii"
  | "epson-tm-t20iii"
  | "epson-tm-t70"
  | "epson-tm-t70ii"
  | "epson-tm-t88ii"
  | "epson-tm-t88iii"
  | "epson-tm-t88iv"
  | "epson-tm-t88v"
  | "epson-tm-t88vi"
  | "epson-tm-t88vii"
  | "fujitsu-fp1000"
  | "hp-a779"
  | "metapace-t1"
  | "mpt-ii"
  | "pos-5890"
  | "pos-8360"
  | "star-mc-print2"
  | "star-mpop"
  | "star-sm-l200"
  | "star-tsp100iii"
  | "star-tsp100iv"
  | "star-tsp650"
  | "star-tsp650ii"
  | "xprinter-xp-n160ii"
  | "xprinter-xp-t80q"
  | "youku-58t";

type CodePageMapping =
  | "cp437"
  | "cp737"
  | "cp850"
  | "cp775"
  | "cp852"
  | "cp855"
  | "cp857"
  | "cp858"
  | "cp860"
  | "cp861"
  | "cp862"
  | "cp863"
  | "cp864"
  | "cp865"
  | "cp866"
  | "cp869"
  | "cp936"
  | "cp949"
  | "cp950"
  | "cp1252"
  | "iso88596"
  | "shiftjis"
  | "windows1250"
  | "windows1251"
  | "windows1252"
  | "windows1253"
  | "windows1254"
  | "windows1255"
  | "windows1256"
  | "windows1257"
  | "windows1258";

type Language = "esc-pos" | "star-prnt" | "star-line";

type ImageMode = "column" | "raster";

type ImageAlgorithm = "threshold" | "bayer" | "floydsteinberg" | "atkinson";

type CodePage =
  | "auto"
  | "cp437"
  | "cp737"
  | "cp850"
  | "cp775"
  | "cp852"
  | "cp855"
  | "cp857"
  | "cp858"
  | "cp860"
  | "cp861"
  | "cp862"
  | "cp863"
  | "cp864"
  | "cp865"
  | "cp866"
  | "cp869"
  | "cp936"
  | "cp949"
  | "cp950"
  | "cp1252"
  | "iso88596"
  | "shiftjis"
  | "windows1250"
  | "windows1251"
  | "windows1252"
  | "windows1253"
  | "windows1254"
  | "windows1255"
  | "windows1256"
  | "windows1257"
  | "windows1258";

interface ReceiptPrinterOptions {
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
    columns: ReadonlyArray<{
      width?: number;
      marginLeft?: number;
      marginRight?: number;
      align?: "left" | "right";
      verticalAlign?: "top" | "bottom";
    }>,
    data: ReadonlyArray<
      ReadonlyArray<
        string | ((encoder: ReceiptPrinterEncoder) => ReceiptPrinterEncoder)
      >
    >
  ): ReceiptPrinterEncoder;

  rule(options?: {
    style?: "none" | "single" | "double";
    width?: number;
  }): ReceiptPrinterEncoder;

  box(
    options: {
      style?: "none" | "single" | "double";
      width?: number;
      marginLeft?: number;
      marginRight?: number;
      paddingLeft?: number;
      paddingRight?: number;
      align: "left" | "right";
    },
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

  qrcode(
    value: string,
    options: {
      model?: 1 | 2;
      size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      errorlevel?: "l" | "m" | "q" | "h";
    }
  ): ReceiptPrinterEncoder;

  pdf417(
    value: string,
    options?: {
      width?: number;
      height?: number;
      columns?: number;
      rows?: number;
      errorlevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      truncated?: boolean;
    }
  ): ReceiptPrinterEncoder;

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
