import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [

	// Browser-friendly UMD build
	{
		input: 'src/receipt-printer-encoder.js',
		output: {
			name: 'ReceiptPrinterEncoder',
			file: 'dist/receipt-printer-encoder.umd.js',
			sourcemap: true,
			format: 'umd'
		},
		plugins: [
			resolve({ browser: true }), 
			commonjs(),
            terser()
		]
	},

	// Browser-friendly ES module build
	{
		input: 'src/receipt-printer-encoder.js',
		output: { 
			file: 'dist/receipt-printer-encoder.esm.js', 
			sourcemap: true,
			format: 'es' 
		},
		plugins: [
			resolve({ browser: true }), 
			commonjs(),
            terser()
		]
	},

    // CommonJS (for Node) and ES module (for bundlers) build
    {
		input: 'src/receipt-printer-encoder.js',
		external: ['@canvas/image-data', 'canvas-dither', 'canvas-flatten', 'resize-image-data', 'codepage-encoder'],
		output: [
			{ file: 'dist/receipt-printer-encoder.cjs', format: 'cjs' },
			{ file: 'dist/receipt-printer-encoder.mjs', format: 'es' }
		]
	}
];
