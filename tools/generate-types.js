import fs from "node:fs";
import path from "node:path";

function generatePrinterTypes() {
  const output = [];
  output.push("export type PrinterModel = {");
  output.push("    id: string;");
  output.push("    name: string;");
  output.push("    vendor: string;");
  output.push("    description?: string;");
  output.push("    features?: string[];");
  output.push("    codepages?: string[];");
  output.push("};");
  output.push("");
  output.push("export const printerModels: Record<string, PrinterModel> = {");

  try {
    const printerDataPath = path.join(
      process.cwd(),
      "generated",
      "printers.js"
    );
    const printerData = fs.readFileSync(printerDataPath, "utf8");

    const printerMatch = printerData.match(
      /const printerDefinitions = ({[\s\S]*?});/
    );
    if (printerMatch) {
      const printers = eval(`(${printerMatch[1]})`);
      for (const [name, printer] of Object.entries(printers)) {
        output.push(`    '${name}': ${JSON.stringify(printer, null, 8)},`);
      }
    } else {
      console.error("Could not find printer definitions in the file");
    }
  } catch (err) {
    console.error("Error generating printer types:", err);
  }

  output.push("};");
  const outputPath = path.join(
    process.cwd(),
    "src",
    "types",
    "printer-models.d.ts"
  );
  fs.writeFileSync(outputPath, output.join("\n"), "utf8");
}

function generateCodePageTypes() {
  const output = [];

  try {
    const mappingDataPath = path.join(process.cwd(), "generated", "mapping.js");
    const mappingData = fs.readFileSync(mappingDataPath, "utf8");

    const codePageMatch = mappingData.match(
      /const codepageMappings = ({[\s\S]*?});/
    );
    if (codePageMatch) {
      const mappings = eval(`(${codePageMatch[1]})`);
      const codePages = new Set();

      for (const languageMappings of Object.values(mappings)) {
        for (const mapping of Object.values(languageMappings)) {
          for (const codePage of Object.values(mapping)) {
            codePages.add(codePage);
          }
        }
      }

      const codePageValues = Array.from(codePages).sort();
      output.push("export type CodePage =");
      output.push(
        "  | " + codePageValues.map((cp) => `"${cp}"`).join("\n  | ")
      );
      output.push(";");
      output.push("");
      output.push("export const codePages: Record<string, CodePage> = {");

      for (const codePage of codePageValues) {
        output.push(`    '${codePage}': '${codePage}',`);
      }
    } else {
      console.error("Could not find codepage mappings in the file");
    }
  } catch (err) {
    console.error("Error generating codepage types:", err);
  }

  output.push("};");
  const outputPath = path.join(process.cwd(), "src", "types", "codepages.d.ts");
  fs.writeFileSync(outputPath, output.join("\n"), "utf8");
}

function generateCodePageMappingTypes() {
  const output = [];
  output.push("export type CodePageMapping = {");
  output.push("    [key: string]: string[];");
  output.push("};");
  output.push("");
  output.push(
    "export const codePageMappings: Record<string, CodePageMapping> = {"
  );

  try {
    const mappingDataPath = path.join(process.cwd(), "generated", "mapping.js");
    const mappingData = fs.readFileSync(mappingDataPath, "utf8");

    const mappingMatch = mappingData.match(
      /const codepageMappings = ({[\s\S]*?});/
    );
    if (mappingMatch) {
      const mappings = eval(`(${mappingMatch[1]})`);
      for (const [language, mapping] of Object.entries(mappings)) {
        output.push(`    '${language}': {`);
        for (const [name, value] of Object.entries(mapping)) {
          output.push(`        '${name}': ${JSON.stringify(value)},`);
        }
        output.push("    },");
      }
    } else {
      console.error("Could not find codepage mappings in the file");
    }
  } catch (err) {
    console.error("Error generating codepage mapping types:", err);
  }

  output.push("};");
  const outputPath = path.join(
    process.cwd(),
    "src",
    "types",
    "codepage-mappings.d.ts"
  );
  fs.writeFileSync(outputPath, output.join("\n"), "utf8");
}

const typesDir = path.join(process.cwd(), "src", "types");
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
}

generatePrinterTypes();
generateCodePageTypes();
generateCodePageMappingTypes();
