import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ReportsPage } from '../pages/ReportsPage';
import { TestDataHelper } from '../utils/TestDataHelper';
import { ReportFilter, UserCredentials } from '../utils/dataReader';
import { downloadFile, assertFileExists } from '../utils/downloadHelper';
import { verifyExcelContains, verifyPDFContains } from '../utils/fileVerifier';
import { AppConfig } from '../utils/AppConfig';

let testData: TestDataHelper;
let adminUser: UserCredentials;
let reportFilter: ReportFilter;

test.describe('Ad Reports - Filters and Export', () => {
  test.beforeAll(() => {
    testData = new TestDataHelper(AppConfig.DATA_SOURCE);
    adminUser = testData.getAdminUser();

    const filters = testData.getReportFilters();
    if (!filters || filters.length === 0) {
      throw new Error('No report filters available in test data');
    }
    reportFilter = filters[0];
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(adminUser.username, adminUser.password);
    expect(await loginPage.isLoggedIn()).toBeTruthy();
  });

  test('Apply filters and download PDF/Excel', async ({ page }) => {
    const reports = new ReportsPage(page);
    await reports.navigateToReports();

    const { department, adType, adPlacement, fromDate, toDate } = reportFilter;
    await reports.setDateRange(fromDate, toDate);
    await reports.selectDepartment(department);
    await reports.selectAdType(adType);
    await reports.selectAdPlacement(adPlacement);
    //await reports.clickSearch();

    expect(await reports.getResultCount()).toBeGreaterThan(0);

    const excelPath = await downloadFile(page, reports.downloadButton, 'Excel', AppConfig.DOWNLOAD_DIR);
    expect(assertFileExists(excelPath)).toBeTruthy();
    expect(verifyExcelContains(excelPath, [department, adType])).toBeTruthy();

    const pdfPath = await downloadFile(page, reports.downloadButton, 'PDF', AppConfig.DOWNLOAD_DIR);
    expect(assertFileExists(pdfPath)).toBeTruthy();
    expect(await verifyPDFContains(pdfPath, [department, adType])).toBeTruthy();
  });
});
