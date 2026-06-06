import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { AppConfig } from '../utils/AppConfig';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByPlaceholder('Enter User Name');
    this.passwordInput = page.getByPlaceholder('Enter Password');
    this.loginButton = page.getByRole('button', { name: /login/i });
    this.errorMessage = page.locator('[class*="error"], [class*="alert"], mat-error, .snack-bar-container');
  }

  async navigate(): Promise<void> {
    await this.navigateToLogin();
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillText(this.usernameInput, username);
    await this.fillText(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async verifyPageLoaded(): Promise<void> {
    await this.assertElementVisible(this.usernameInput);
    await this.assertElementVisible(this.passwordInput);
    await this.assertElementVisible(this.loginButton);
    await this.assertElementEnabled(this.loginButton);
  }

  async verifyErrorDisplayed(partialMessage?: string): Promise<void> {
    await this.waitForElement(this.errorMessage.first(), AppConfig.ELEMENT_WAIT_TIMEOUT);
    if (partialMessage) {
      await this.assertElementContainsText(this.errorMessage.first(), partialMessage);
    }
  }

  /**
   * Returns true once the app navigates away from the login page.
   * Waits for a URL that no longer contains "login" rather than matching instantly.
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.waitForURL((url) => !/login/i.test(url.toString()), AppConfig.ACTION_TIMEOUT);
      return true;
    } catch {
      return false;
    }
  }
}
