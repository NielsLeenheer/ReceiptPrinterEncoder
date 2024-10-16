import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import copy from "rollup-plugin-copy";

export default [
  // Browser-friendly UMD build
  {
    input: "src/receipt-printer-encoder.js",
    output: {
      name: "ReceiptPrinterEncoder",
      file: "dist/receipt-printer-encoder.umd.js",
      sourcemap: true,
      format: "umd",
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      terser(),
      copy({
        targets: [
          { src: "src/types/receipt-printer-encoder.d.ts", dest: "dist/types" },
        ],
      }),
    ],
  },

  // Browser-friendly ES module build
  {
    input: "src/receipt-printer-encoder.js",
    output: {
      file: "dist/receipt-printer-encoder.esm.js",
      sourcemap: true,
      format: "es",
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      terser(),
      copy({
        targets: [
          { src: "src/types/receipt-printer-encoder.d.ts", dest: "dist/types" },
        ],
      }),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build
  {
    input: "src/receipt-printer-encoder.js",
    external: [
      "@canvas/image-data",
      "canvas-dither",
      "canvas-flatten",
      "resize-image-data",
      "@point-of-sale/codepage-encoder",
    ],
    output: [
      { file: "dist/receipt-printer-encoder.cjs", format: "cjs" },
      { file: "dist/receipt-printer-encoder.mjs", format: "es" },
    ],
    plugins: [
      copy({
        targets: [
          { src: "src/types/receipt-printer-encoder.d.ts", dest: "dist/types" },
        ],
      }),
    ],
  },
];
