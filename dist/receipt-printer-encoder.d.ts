import { Codepage } from '@point-of-sale/codepage-encoder';

type PrinterModel = 'bixolon-srp350' | 'bixolon-srp350iii' | 'citizen-ct-s310ii' | 'epson-tm-m30ii' | 'epson-tm-m30iii' | 'epson-tm-p20ii' | 'epson-tm-t20ii' | 'epson-tm-t20iii' | 'epson-tm-t20iv' | 'epson-tm-t70' | 'epson-tm-t70ii' | 'epson-tm-t88ii' | 'epson-tm-t88iii' | 'epson-tm-t88iv' | 'epson-tm-t88v' | 'epson-tm-t88vi' | 'epson-tm-t88vii' | 'fujitsu-fp1000' | 'hp-a779' | 'metapace-t1' | 'mpt-ii' | 'pos-5890' | 'pos-8360' | 'star-mc-print2' | 'star-mpop' | 'star-sm-l200' | 'star-tsp100iii' | 'star-tsp100iv' | 'star-tsp650' | 'star-tsp650ii' | 'xprinter-xp-n160ii' | 'xprinter-xp-t80q' | 'youku-58t';
type CodepageMappingName = 'bixolon' | 'bixolon/legacy' | 'citizen' | 'epson' | 'epson/legacy' | 'fujitsu' | 'hp' | 'metapace' | 'mpt' | 'pos-5890' | 'pos-8360' | 'star' | 'xprinter' | 'youku';

type Language = 'esc-pos' | 'star-prnt' | 'star-line';
type Alignment = 'left' | 'center' | 'right';
type DitherAlgorithm = 'threshold' | 'bayer' | 'floydsteinberg' | 'atkinson';
type ErrorLevel = 'relaxed' | 'strict';
type TextSize = 'small' | 'normal';
type CutType = 'full' | 'partial';
type BarcodeSymbology = 'upca' | 'upce' | 'ean13' | 'ean8' | 'code39' | 'itf' | 'codabar' | 'code93' | 'code128' | 'code128-auto' | 'gs1-128' | 'gs1-databar-omni' | 'gs1-databar-truncated' | 'gs1-databar-limited' | 'gs1-databar-expanded';
interface ReceiptPrinterEncoderOptions {
    columns?: number;
    language?: Language;
    imageMode?: 'column' | 'raster';
    feedBeforeCut?: number;
    newline?: '\n\r' | '\n';
    codepageMapping?: CodepageMappingName | Record<string, number>;
    codepageCandidates?: Codepage[];
    errors?: ErrorLevel;
    printerModel?: PrinterModel;
    debug?: boolean;
    embedded?: boolean;
    createCanvas?: ((width: number, height: number) => HTMLCanvasElement) | null;
    width?: number;
    autoFlush?: boolean;
}
interface TableColumn {
    width: number;
    align?: Alignment;
    verticalAlign?: 'top' | 'bottom';
    marginLeft?: number;
    marginRight?: number;
}
interface RuleOptions {
    style?: 'single' | 'double';
    width?: number;
}
interface BoxOptions {
    style?: 'single' | 'double' | 'none';
    width?: number;
    align?: Alignment;
    marginLeft?: number;
    marginRight?: number;
    paddingLeft?: number;
    paddingRight?: number;
}
interface BarcodeOptions {
    height?: number;
    width?: number;
    text?: boolean;
}
interface QRCodeOptions {
    model?: 1 | 2;
    size?: number;
    errorlevel?: 'l' | 'm' | 'q' | 'h';
}
interface PDF417Options {
    width?: number;
    height?: number;
    columns?: number;
    rows?: number;
    errorlevel?: number;
    truncated?: boolean;
}
interface PrinterModelInfo {
    id: string;
    name: string;
}
type TableCellContent = string | ((encoder: ReceiptPrinterEncoder) => void);
type BoxContent = string | ((encoder: ReceiptPrinterEncoder) => void);
declare class ReceiptPrinterEncoder {
    constructor(options?: ReceiptPrinterEncoderOptions);
    initialize(): ReceiptPrinterEncoder;
    codepage(codepage: Codepage | 'auto'): ReceiptPrinterEncoder;
    text(value: string): ReceiptPrinterEncoder;
    newline(value?: number): ReceiptPrinterEncoder;
    line(value: string): ReceiptPrinterEncoder;
    underline(value?: boolean | number): ReceiptPrinterEncoder;
    italic(value?: boolean): ReceiptPrinterEncoder;
    bold(value?: boolean): ReceiptPrinterEncoder;
    invert(value?: boolean): ReceiptPrinterEncoder;
    width(width?: number): ReceiptPrinterEncoder;
    height(height?: number): ReceiptPrinterEncoder;
    size(width: number, height?: number): ReceiptPrinterEncoder;
    size(value: TextSize): ReceiptPrinterEncoder;
    font(value: string): ReceiptPrinterEncoder;
    align(value: Alignment): ReceiptPrinterEncoder;
    table(columns: TableColumn[], data: TableCellContent[][]): ReceiptPrinterEncoder;
    rule(options?: RuleOptions): ReceiptPrinterEncoder;
    box(options: BoxOptions, contents: BoxContent): ReceiptPrinterEncoder;
    barcode(value: string, symbology: BarcodeSymbology | number, height?: number | BarcodeOptions): ReceiptPrinterEncoder;
    qrcode(value: string, model?: number | QRCodeOptions, size?: number, errorlevel?: string): ReceiptPrinterEncoder;
    pdf417(value: string, options?: PDF417Options): ReceiptPrinterEncoder;
    image(input: ImageData | HTMLImageElement | HTMLCanvasElement | object, width: number, height: number, algorithm?: DitherAlgorithm, threshold?: number): ReceiptPrinterEncoder;
    cut(value?: CutType): ReceiptPrinterEncoder;
    pulse(device?: number, on?: number, off?: number): ReceiptPrinterEncoder;
    raw(data: number[] | Uint8Array): ReceiptPrinterEncoder;
    commands(): {
        commands: object[];
        height: number;
    }[];
    encode(format?: 'commands'): {
        commands: object[];
        height: number;
    }[];
    encode(format?: 'lines'): object[][];
    encode(format?: string): Uint8Array;
    get columns(): number;
    get language(): string;
    get printerCapabilities(): object;
    static get printerModels(): PrinterModelInfo[];
}

export { ReceiptPrinterEncoder as default };
export type { Alignment, BarcodeOptions, BarcodeSymbology, BoxOptions, CutType, DitherAlgorithm, ErrorLevel, Language, PDF417Options, PrinterModelInfo, QRCodeOptions, ReceiptPrinterEncoderOptions, RuleOptions, TableColumn, TextSize };
