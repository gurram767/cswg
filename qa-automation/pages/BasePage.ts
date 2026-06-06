import { Page, Locator, expect } from '@playwright/test';
import { AppConfig } from '../utils/AppConfig';

export class BasePage {
  protected page: Page;
  protected baseURL: string;
  protected defaultTimeout: number = AppConfig.DEFAULT_TIMEOUT;
  protected actionTimeout: number = AppConfig.ACTION_TIMEOUT;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = AppConfig.BASE_URL;
  }

  /**
   * ────────────────────────────────────────────────────────────
   * NAVIGATION METHODS
   * ────────────────────────────────────────────────────────────
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(`${this.baseURL}${path}`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToLogin(): Promise<void> {
    await this.goto(AppConfig.LOGIN_ENDPOINT);
  }

  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * ────────────────────────────────────────────────────────────
   * WAIT & VISIBILITY METHODS
   * ────────────────────────────────────────────────────────────
   */
  async waitForElement(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: timeout || this.defaultTimeout });
  }

  async waitForURL(
    urlPattern: string | RegExp | ((url: URL) => boolean),
    timeout?: number
  ): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: timeout || this.actionTimeout });
  }

  async waitForLoadState(state: 'domcontentloaded' | 'load' | 'networkidle' = 'networkidle'): Promise<void> {
    await this.page.waitForLoadState(state);
  }

  async isElementVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible().catch(() => false);
  }

  async isElementEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled().catch(() => false);
  }

  /**
   * ────────────────────────────────────────────────────────────
   * INPUT METHODS
   * ────────────────────────────────────────────────────────────
   */
  async fillText(locator: Locator, text: string): Promise<void> {
    await this.waitForElement(locator);
    await locator.fill(text);
  }

  async clearField(locator: Locator): Promise<void> {
    await this.waitForElement(locator);
    await locator.clear();
  }

  async clearAndFill(locator: Locator, text: string): Promise<void> {
    await this.clearField(locator);
    await this.fillText(locator, text);
  }

  async typeText(locator: Locator, text: string, delayMs: number = 100): Promise<void> {
    await this.waitForElement(locator);
    await locator.pressSequentially(text, { delay: delayMs });
  }

  /**
   * ────────────────────────────────────────────────────────────
   * CLICK & INTERACTION METHODS
   * ────────────────────────────────────────────────────────────
   */
  async click(locator: Locator): Promise<void> {
    await this.waitForElement(locator);
    await locator.click();
  }

  async clickIfVisible(locator: Locator): Promise<boolean> {
    const isVisible = await this.isElementVisible(locator);
    if (isVisible) {
      await this.click(locator);
      return true;
    }
    return false;
  }

  async check(locator: Locator): Promise<void> {
    await this.waitForElement(locator);
    await locator.check();
  }

  async uncheck(locator: Locator): Promise<void> {
    await this.waitForElement(locator);
    await locator.uncheck();
  }

  async isChecked(locator: Locator): Promise<boolean> {
    return locator.isChecked();
  }

  /**
   * ────────────────────────────────────────────────────────────
   * ASSERTION METHODS
   * ────────────────────────────────────────────────────────────
   */
  async assertElementVisible(locator: Locator, message?: string): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async assertElementHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  async assertElementEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
  }

  async assertElementDisabled(locator: Locator): Promise<void> {
    await expect(locator).toBeDisabled();
  }

  async assertElementContainsText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text);
  }

  async assertElementHasText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toHaveText(text);
  }

  async assertPageURL(urlPattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(urlPattern);
  }

  async assertPageTitle(title: string): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  async assertElementValue(locator: Locator, value: string): Promise<void> {
    await expect(locator).toHaveValue(value);
  }

  /**
   * ────────────────────────────────────────────────────────────
   * GET/RETRIEVE METHODS
   * ────────────────────────────────────────────────────────────
   */
  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }

  async getValue(locator: Locator): Promise<string> {
    return (await locator.inputValue()) || '';
  }

  async getAttribute(locator: Locator, attribute: string): Promise<string | null> {
    return locator.getAttribute(attribute);
  }

  async getElementCount(locator: Locator): Promise<number> {
    return locator.count();
  }

  /**
   * ────────────────────────────────────────────────────────────
   * SCREENSHOT & DEBUG METHODS
   * ────────────────────────────────────────────────────────────
   */
  async takeScreenshot(fileName: string): Promise<void> {
    await this.page.screenshot({ path: `${AppConfig.SCREENSHOT_DIR}/${fileName}.png` });
  }

  async takeElementScreenshot(locator: Locator, fileName: string): Promise<void> {
    await locator.screenshot({ path: `${AppConfig.SCREENSHOT_DIR}/${fileName}.png` });
  }

  /**
   * ────────────────────────────────────────────────────────────
   * UTILITY METHODS
   * ────────────────────────────────────────────────────────────
   */
  async pause(milliseconds: number = 1000): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  async goForward(): Promise<void> {
    await this.page.goForward();
  }

  /**
   * ────────────────────────────────────────────────────────────
   * CONFIGURATION GETTERS
   * ────────────────────────────────────────────────────────────
   */
  getPage(): Page {
    return this.page;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  getDefaultTimeout(): number {
    return this.defaultTimeout;
  }

  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }
}
