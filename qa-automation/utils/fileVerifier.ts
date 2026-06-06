import * as XLSX from 'xlsx';
import fs from 'fs';

// pdf-parse does not ship TypeScript declarations by default, so require it as any.
// This keeps the helper simple and avoids extra type setup for beginners.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: any = require('pdf-parse');

export function verifyExcelContains(filePath: string, expected: string[]): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const workbook = XLSX.readFile(filePath);
  const text = workbook.SheetNames
    .map((sheetName) => XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]))
    .join('\n');

  return expected.every((value) => text.includes(value));
}

export async function verifyPDFContains(filePath: string, expected: string[]): Promise<boolean> {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const data = fs.readFileSync(filePath);
  const result = await pdfParse(data);
  const text = result.text || '';
  return expected.every((value) => text.includes(value));
}
