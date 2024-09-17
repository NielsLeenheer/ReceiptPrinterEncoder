import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [

	// Browser-friendly UMD build
	{
		input: 'src/thermal-printer-encoder.js',
		output: {
			name: 'ThermalPrinterEncoder',
			file: 'dist/thermal-printer-encoder.umd.js',
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
		input: 'src/thermal-printer-encoder.js',
		output: { 
			file: 'dist/thermal-printer-encoder.esm.js', 
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
		input: 'src/thermal-printer-encoder.js',
		external: ['@point-of-sale/receipt-printer-encoder'],
		output: [
			{ file: 'dist/thermal-printer-encoder.cjs', format: 'cjs' },
			{ file: 'dist/thermal-printer-encoder.mjs', format: 'es' }
		]
	}
];
