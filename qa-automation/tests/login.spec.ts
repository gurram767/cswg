import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TestDataHelper } from '../utils/TestDataHelper';
import { AppConfig } from '../utils/AppConfig';

// Data source is driven by the DATA_SOURCE env var (see .env), defaulting to JSON.
const testData = new TestDataHelper(AppConfig.DATA_SOURCE);
const allUsers = testData.getAllUsers();
const adminUser = testData.getAdminUser();

test.describe(`CSW Connect Login Tests (data source: ${testData.getDataSource()})`, () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.verifyPageLoaded();
  });

  // Verifies the login page renders username, password, and login controls.
  /* test('TC-001: Login page displays all required fields', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await expect(page).toHaveURL(/.*login/);
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
  }); */

  // Verifies the password field masks its input.
  /* test('TC-002: Password field masks the input', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.passwordInput.fill('MySecretPassword123');
    const inputType = await loginPage.passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  }); */

  // Verifies form validation when submitting with empty fields.
  /* test('TC-003: Form validation when fields are empty', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.loginButton.click();
    await expect(loginPage.usernameInput).toBeFocused();
  }); */

  // Verifies the admin user from the data source can log in.
  test('TC-001: Admin user can log in successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(adminUser.username, adminUser.password);

    expect(await loginPage.isLoggedIn()).toBeTruthy();
  });

  /* // Data-driven: every user in the data source should be able to log in.
   test.describe('TC-002: Data-driven login for all users', () => {
    for (const user of allUsers) {
      test(`Login as ${user.role || 'unknown'} (${user.username})`, async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.login(user.username, user.password);

        expect(
          await loginPage.isLoggedIn(),
          `Failed to login as ${user.username}`
        ).toBeTruthy();
      });
    } 
  }); */

  // Verifies looking up a user by role and logging in with it.
  /* test('TC-006: Get user by role lookup', async ({ page }) => {
    const loginPage = new LoginPage(page);

    const storeUser = testData.getUserByRole('store user');
    await loginPage.login(storeUser.username, storeUser.password);

    expect(await loginPage.isLoggedIn()).toBeTruthy();
  }); */
});
