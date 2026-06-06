import fs from 'fs';
import path from 'path';
import { Download, Page, Locator } from '@playwright/test';

export async function saveDownload(download: Download, destDir = 'downloads'): Promise<string> {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const fileName = download.suggestedFilename();
  const filePath = path.join(destDir, fileName);
  await download.saveAs(filePath);
  return filePath;
}

export function assertFileExists(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

export async function downloadFile(
  page: Page,
  triggerButton: Locator,
  optionText: string,
  destDir = 'downloads'
): Promise<string> {
  await triggerButton.waitFor({ state: 'visible' });
  await triggerButton.click();

  const option = page.locator(`button:has-text("${optionText}"), a:has-text("${optionText}")`).first();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    option.click(),
  ]);

  return saveDownload(download, destDir);
}
