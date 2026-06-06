import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { AppConfig } from '../utils/AppConfig';
import { CalendarDatePicker, CalendarSelectors } from '../utils/dateHelper';

export class ReportsPage extends BasePage {
  /** Field that opens the date-range calendar (e.g. "05/30/2026 - 06/05/2026"). */
  private static readonly DATE_RANGE_SELECTOR =
    'input[name*="date" i], input[placeholder*="date" i], input[aria-label*="date" i]';

  /**
   * Selectors tuned to the Ad Reports calendar shown in the UI: a single-month
   * popup with a "May 2026" header and `<` / `>` arrows to change month/year.
   * Override here if the DOM differs.
   */
  private static readonly CALENDAR_SELECTORS: Partial<CalendarSelectors> = {
    trigger: ReportsPage.DATE_RANGE_SELECTOR,
  };

  private readonly calendar: CalendarDatePicker;

  readonly reportsHeader: Locator;
  readonly adReports: Locator;
  readonly departmentSelect: Locator;
  readonly adTypeSelect: Locator;
  readonly adPlacementSelect: Locator;
  readonly dateRangeInput: Locator;
 
  readonly downloadButton: Locator;
  readonly resultsRows: Locator;

  constructor(page: Page) {
    super(page);

    this.calendar = new CalendarDatePicker(page, ReportsPage.CALENDAR_SELECTORS);

    this.reportsHeader = page.getByRole('button', { name: /Reports/i });

    this.adReports = page.getByRole('link', { name: 'Ad Reports' });

    this.departmentSelect = page.locator(
      'select[name="department"], select[aria-label="Department"], [data-test="department"]'
    );
    this.adTypeSelect = page.locator(
      'select[name="adType"], select[aria-label="Ad Type"], [data-test="adType"]'
    );
    this.adPlacementSelect = page.locator(
      'select[name="adPlacement"], select[aria-label="Ad Placement"], [data-test="adPlacement"]'
    );
    this.dateRangeInput = page.locator(ReportsPage.DATE_RANGE_SELECTOR);
    //this.searchButton = page.getByRole('button', { name: /search/i }).first();
    this.downloadButton = page.locator('button:has-text("Download"), [data-test="download"], .download');
    this.resultsRows = page.locator('table tbody tr');
  }

  async navigateToReports(): Promise<void> {
    await this.waitForElement(this.reportsHeader);
    await this.click(this.reportsHeader);
    await this.waitForElement(this.adReports);
    await this.click(this.adReports);
    await this.waitForLoadState('networkidle');
    
  }

  private async selectDropdownValue(locator: Locator, value: string): Promise<void> {
    await this.waitForElement(locator);
    try {
      await locator.selectOption({ label: value });
    } catch {
      await locator.fill(value);
      await locator.press('Enter');
    }
  }

  async selectDepartment(department: string): Promise<void> {
    await this.selectDropdownValue(this.departmentSelect, department);
  }

  async selectAdType(adType: string): Promise<void> {
    await this.selectDropdownValue(this.adTypeSelect, adType);
  }

  async selectAdPlacement(adPlacement: string): Promise<void> {
    await this.selectDropdownValue(this.adPlacementSelect, adPlacement);
  }

  /**
   * Select the report date range using the calendar widget. Navigates the
   * month/year with the `<` / `>` arrows and clicks the day cells.
   *
   * @param fromDate "from" date in MM/DD/YYYY (e.g. "05/30/2026")
   * @param toDate   "to" date in MM/DD/YYYY (e.g. "06/05/2026")
   */
  async setDateRange(fromDate: string, toDate: string): Promise<void> {
    await this.waitForElement(this.dateRangeInput);
    await this.calendar.selectDateRange(fromDate, toDate);
    await this.waitForLoadState('networkidle');
  }

  /** Select only the "from" (start) date via the calendar. */
  async selectFromDate(fromDate: string): Promise<void> {
    await this.waitForElement(this.dateRangeInput);
    await this.calendar.selectDate(fromDate);
  }

  /** Select only the "to" (end) date via the calendar. */
  async selectToDate(toDate: string): Promise<void> {
    await this.waitForElement(this.dateRangeInput);
    await this.calendar.selectDate(toDate);
  }

  /* async clickSearch(): Promise<void> {
    await this.click(this.searchButton);
    await this.waitForLoadState('networkidle');
  }
 */
  async getResultCount(): Promise<number> {
    return await this.getElementCount(this.resultsRows);
  }
}
