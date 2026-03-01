import { Codepage } from '@point-of-sale/codepage-encoder';
import ImageData from '@canvas/image-data';

type PrinterModel = 'bixolon-srp350' | 'bixolon-srp350iii' | 'citizen-ct-s310ii' | 'epson-tm-m30ii' | 'epson-tm-m30iii' | 'epson-tm-p20ii' | 'epson-tm-t20ii' | 'epson-tm-t20iii' | 'epson-tm-t20iv' | 'epson-tm-t70' | 'epson-tm-t70ii' | 'epson-tm-t88ii' | 'epson-tm-t88iii' | 'epson-tm-t88iv' | 'epson-tm-t88v' | 'epson-tm-t88vi' | 'epson-tm-t88vii' | 'fujitsu-fp1000' | 'hp-a779' | 'metapace-t1' | 'mpt-ii' | 'pos-5890' | 'pos-8360' | 'star-mc-print2' | 'star-mpop' | 'star-sm-l200' | 'star-tsp100iii' | 'star-tsp100iv' | 'star-tsp650' | 'star-tsp650ii' | 'xprinter-xp-n160ii' | 'xprinter-xp-t80q' | 'youku-58t';
type CodepageMappingName = 'bixolon' | 'bixolon/legacy' | 'citizen' | 'epson' | 'epson/legacy' | 'fujitsu' | 'hp' | 'metapace' | 'mpt' | 'pos-5890' | 'pos-8360' | 'star' | 'xprinter' | 'youku';

type Language = "esc-pos" | "star-prnt" | "star-line";
type Alignment = "left" | "center" | "right";
type DitherAlgorithm = "threshold" | "bayer" | "floydsteinberg" | "atkinson";
type ErrorLevel = "relaxed" | "strict";
type TextSize = "small" | "normal";
type CutType = "full" | "partial";
type BarcodeSymbology = "upca" | "upce" | "ean13" | "ean8" | "code39" | "itf" | "codabar" | "code93" | "code128" | "code128-auto" | "gs1-128" | "gs1-databar-omni" | "gs1-databar-truncated" | "gs1-databar-limited" | "gs1-databar-expanded";
type ReceiptPrinterEncoderOptions = {
    columns?: number | undefined;
    language?: Language | undefined;
    imageMode?: "column" | "raster" | undefined;
    feedBeforeCut?: number | undefined;
    newline?: "\n" | "\n\r" | undefined;
    codepageMapping?: Record<string, number> | CodepageMappingName | undefined;
    codepageCandidates?: Codepage[] | undefined;
    errors?: ErrorLevel | undefined;
    printerModel?: PrinterModel | undefined;
    debug?: boolean | undefined;
    embedded?: boolean | undefined;
    createCanvas?: ((width: number, height: number) => HTMLCanvasElement) | null | undefined;
    width?: number | undefined;
    autoFlush?: boolean | undefined;
};
type TableColumn = {
    width: number;
    align?: Alignment | undefined;
    verticalAlign?: "top" | "bottom" | undefined;
    marginLeft?: number | undefined;
    marginRight?: number | undefined;
};
type RuleOptions = {
    style?: "single" | "double" | undefined;
    width?: number | undefined;
};
type BoxOptions = {
    style?: "none" | "single" | "double" | undefined;
    width?: number | undefined;
    align?: Alignment | undefined;
    marginLeft?: number | undefined;
    marginRight?: number | undefined;
    paddingLeft?: number | undefined;
    paddingRight?: number | undefined;
};
type BarcodeOptions = {
    height?: number | undefined;
    width?: number | undefined;
    text?: boolean | undefined;
};
type QRCodeOptions = {
    model?: 2 | 1 | undefined;
    size?: number | undefined;
    errorlevel?: "q" | "l" | "m" | "h" | undefined;
};
type PDF417Options = {
    width?: number | undefined;
    height?: number | undefined;
    columns?: number | undefined;
    rows?: number | undefined;
    errorlevel?: number | undefined;
    truncated?: boolean | undefined;
};
type SharpInput = Object;
type NdarrayInput = Object;
type ReadImageInput = Object;
type PrinterModelInfo = {
    id: string;
    name: string;
};
type TableCellContent = string | ((encoder: ReceiptPrinterEncoder) => void);
type BoxContent = string | ((encoder: ReceiptPrinterEncoder) => void);
declare class ReceiptPrinterEncoder {
    static get printerModels(): PrinterModelInfo[];
    constructor(options?: ReceiptPrinterEncoderOptions);
    initialize(): ReceiptPrinterEncoder;
    codepage(codepage: Codepage | "auto"): ReceiptPrinterEncoder;
    text(value: string): ReceiptPrinterEncoder;
    newline(value?: number): ReceiptPrinterEncoder;
    line(value: string): ReceiptPrinterEncoder;
    underline(value?: boolean | number): ReceiptPrinterEncoder;
    italic(value?: boolean): ReceiptPrinterEncoder;
    bold(value?: boolean): ReceiptPrinterEncoder;
    invert(value?: boolean): ReceiptPrinterEncoder;
    width(width?: number): ReceiptPrinterEncoder;
    height(height?: number): ReceiptPrinterEncoder;
    size(width: number, height?: number | undefined): ReceiptPrinterEncoder;
    size(value: TextSize): ReceiptPrinterEncoder;
    font(value: string): ReceiptPrinterEncoder;
    align(value: Alignment): ReceiptPrinterEncoder;
    table(columns: TableColumn[], data: TableCellContent[][]): ReceiptPrinterEncoder;
    rule(options?: RuleOptions): ReceiptPrinterEncoder;
    box(options: BoxOptions, contents: BoxContent): ReceiptPrinterEncoder;
    barcode(value: string, symbology: BarcodeSymbology | number, height?: number | BarcodeOptions): ReceiptPrinterEncoder;
    qrcode(value: string, model?: number | QRCodeOptions, size?: number, errorlevel?: string): ReceiptPrinterEncoder;
    pdf417(value: string, options?: PDF417Options): ReceiptPrinterEncoder;
    image(input: ImageData | HTMLImageElement | HTMLCanvasElement | SharpInput | NdarrayInput | ReadImageInput, width: number, height: number, algorithm?: DitherAlgorithm, threshold?: number): ReceiptPrinterEncoder;
    cut(value?: CutType): ReceiptPrinterEncoder;
    pulse(device?: number, on?: number, off?: number): ReceiptPrinterEncoder;
    raw(data: number[] | Uint8Array): ReceiptPrinterEncoder;
    commands(): {
        commands: object[];
        height: number;
    }[];
    encode(format: "commands"): {
        commands: object[];
        height: number;
    }[];
    encode(format: "lines"): object[][];
    encode(format?: string | undefined): Uint8Array;
    get columns(): number;
    get language(): string;
    get printerCapabilities(): object;
    #private;
}

export { ReceiptPrinterEncoder as default };
export type { Alignment, BarcodeOptions, BarcodeSymbology, BoxContent, BoxOptions, CutType, DitherAlgorithm, ErrorLevel, Language, NdarrayInput, PDF417Options, PrinterModelInfo, QRCodeOptions, ReadImageInput, ReceiptPrinterEncoderOptions, RuleOptions, SharpInput, TableCellContent, TableColumn, TextSize };
