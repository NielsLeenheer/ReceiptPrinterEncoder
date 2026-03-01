import { PrinterModel, CodepageMappingName } from '../generated/types.js';
import { Codepage } from '@point-of-sale/codepage-encoder';

export type Language = 'esc-pos' | 'star-prnt' | 'star-line';

export type Alignment = 'left' | 'center' | 'right';

export type DitherAlgorithm = 'threshold' | 'bayer' | 'floydsteinberg' | 'atkinson';

export type ErrorLevel = 'relaxed' | 'strict';

export type TextSize = 'small' | 'normal';

export type CutType = 'full' | 'partial';

export type BarcodeSymbology =
	| 'upca'
	| 'upce'
	| 'ean13'
	| 'ean8'
	| 'code39'
	| 'itf'
	| 'codabar'
	| 'code93'
	| 'code128'
	| 'code128-auto'
	| 'gs1-128'
	| 'gs1-databar-omni'
	| 'gs1-databar-truncated'
	| 'gs1-databar-limited'
	| 'gs1-databar-expanded';

export interface ReceiptPrinterEncoderOptions {
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

export interface TableColumn {
	width: number;
	align?: Alignment;
	verticalAlign?: 'top' | 'bottom';
	marginLeft?: number;
	marginRight?: number;
}

export interface RuleOptions {
	style?: 'single' | 'double';
	width?: number;
}

export interface BoxOptions {
	style?: 'single' | 'double' | 'none';
	width?: number;
	align?: Alignment;
	marginLeft?: number;
	marginRight?: number;
	paddingLeft?: number;
	paddingRight?: number;
}

export interface BarcodeOptions {
	height?: number;
	width?: number;
	text?: boolean;
}

export interface QRCodeOptions {
	model?: 1 | 2;
	size?: number;
	errorlevel?: 'l' | 'm' | 'q' | 'h';
}

export interface PDF417Options {
	width?: number;
	height?: number;
	columns?: number;
	rows?: number;
	errorlevel?: number;
	truncated?: boolean;
}

export interface SharpInput {
	data: Uint8Array;
	info: { width: number; height: number };
}

export interface NdarrayInput {
	data: Uint8Array;
	shape: number[];
}

export interface ReadImageInput {
	width: number;
	height: number;
	frames: { data: Uint8Array }[];
}

export interface PrinterModelInfo {
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

	image(input: ImageData | HTMLImageElement | HTMLCanvasElement | SharpInput | NdarrayInput | ReadImageInput, width: number, height: number, algorithm?: DitherAlgorithm, threshold?: number): ReceiptPrinterEncoder;

	cut(value?: CutType): ReceiptPrinterEncoder;

	pulse(device?: number, on?: number, off?: number): ReceiptPrinterEncoder;

	raw(data: number[] | Uint8Array): ReceiptPrinterEncoder;

	commands(): { commands: object[]; height: number }[];

	encode(format?: 'commands'): { commands: object[]; height: number }[];
	encode(format?: 'lines'): object[][];
	encode(format?: string): Uint8Array;

	get columns(): number;

	get language(): string;

	get printerCapabilities(): object;

	static get printerModels(): PrinterModelInfo[];
}

export default ReceiptPrinterEncoder;
