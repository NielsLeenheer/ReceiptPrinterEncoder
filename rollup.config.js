import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';

export default [

	// Browser-friendly UMD build
	{
		input: 'src/thermal-printer-encoder.js',
		output: {
			name: 'ThermalPrinterEncoder',
			file: 'dist/thermal-printer-encoder.umd.js',
			format: 'umd'
		},
		plugins: [

            /* Make sure we force the browser version of canvas */
            alias({
                entries: [
                    { find: 'canvas', replacement: 'node_modules/canvas/browser.js' },
                ]
            }),

			resolve(), 
			commonjs(),
            terser()
		]
	},

	// Browser-friendly ES module build
	{
		input: 'src/thermal-printer-encoder.js',
		output: { 
			file: 'dist/thermal-printer-encoder.esm.js', 
			format: 'es' 
		},
		plugins: [

            /* Make sure we force the browser version of canvas */
			alias({
                entries: [
                    { find: 'canvas', replacement: 'node_modules/canvas/browser.js' },
                ]
            }),
            
			resolve(), 
			commonjs(),
            terser()
		]
	},

    // CommonJS (for Node) and ES module (for bundlers) build
    {
		input: 'src/thermal-printer-encoder.js',
		external: ['esc-pos-encoder', 'star-prnt-encoder'],
		output: [
			{ file: 'dist/thermal-printer-encoder.cjs', format: 'cjs' },
			{ file: 'dist/thermal-printer-encoder.mjs', format: 'es' }
		]
	}
];
