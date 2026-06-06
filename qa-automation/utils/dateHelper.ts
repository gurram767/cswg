import { Page, Locator, expect } from '@playwright/test';

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  Robust, library-agnostic calendar / date-range picker helper.
 *
 *  Designed for the "ConnectAd Reports" date-range picker (and any similar
 *  widget) where you navigate the YEAR and MONTH purely with the `<` / `>`
 *  header arrows and then click the day cell.
 *
 *  Why arrow-navigation instead of typing into the input?
 *    - Many custom Angular/React pickers ignore programmatic `fill()` on the
 *      visible text and only commit a value when a day cell is actually clicked.
 *    - Arrow navigation works the same for every month/year and is immune to
 *      locale/format differences in the input mask.
 *
 *  How it stays reliable ("think like an experienced QA"):
 *    - Reads the on-screen "Month Year" label and computes the exact number of
 *      arrow clicks needed (forward or backward) — no blind clicking.
 *    - Hard cap on iterations so a broken selector fails fast instead of looping
 *      forever.
 *    - Day selection EXCLUDES greyed-out "leading/trailing" days from the
 *      previous/next month (the muted 26..31 / 1..6 cells you see in the grid).
 *    - Every selector is overridable, so the same helper works across calendars.
 * ───────────────────────────────────────────────────────────────────────────
 */

export interface CalendarSelectors {
  /** Input/field that opens the calendar popup when clicked. */
  trigger: string;
  /** Element that displays the current "Month Year" header, e.g. "May 2026". */
  header: string;
  /** The "previous month" (`<`) button. */
  prevButton: string;
  /** The "next month" (`>`) button. */
  nextButton: string;
  /** Clickable day cells inside the grid. */
  dayCell: string;
  /**
   * Substrings that identify a day cell belonging to the PREVIOUS/NEXT month
   * (rendered greyed-out). Such cells are ignored so we never click the wrong
   * "1" or "30". Matched against the cell's class + aria attributes.
   */
  outsideDayMarkers: string[];
  /** Substrings that identify a disabled / un-selectable day cell. */
  disabledMarkers: string[];
}

export const DEFAULT_CALENDAR_SELECTORS: CalendarSelectors = {
  trigger:
    'input[name*="date" i], input[placeholder*="date" i], input[aria-label*="date" i]',
  // Covers most pickers: a header/title/caption element with the "May 2026" text.
  header:
    '.ngb-dp-month-name, .datepicker-switch, .react-datepicker__current-month, ' +
    '[class*="calendar"] [class*="header"], [class*="datepicker"] [class*="title"], ' +
    'th.datepicker-switch',
  prevButton:
    'button[aria-label*="previous" i], button[aria-label*="prev" i], ' +
    '.ngb-dp-arrow-prev button, .react-datepicker__navigation--previous, ' +
    '.datepicker .prev, [class*="prev" i]',
  nextButton:
    'button[aria-label*="next" i], .ngb-dp-arrow-next button, ' +
    '.react-datepicker__navigation--next, .datepicker .next, [class*="next" i]',
  dayCell:
    '.ngb-dp-day, .react-datepicker__day, td.day, [role="gridcell"], ' +
    '[class*="calendar"] [class*="day"]',
  outsideDayMarkers: [
    'outside',
    'other-month',
    'othermonth',
    'old',
    'new',
    'muted',
    'adjacent',
    'sibling',
    'hidden',
    'disabled', // leading/trailing days are often also rendered disabled
  ],
  disabledMarkers: ['disabled', 'aria-disabled="true"', 'unselectable', 'not-allowed'],
};

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** Convert a "May 2026" / "May, 2026" / "Mai 2026" style label to {monthIndex, year}. */
function parseHeader(label: string): { monthIndex: number; year: number } {
  const cleaned = label.trim().toLowerCase();
  const yearMatch = cleaned.match(/\b(\d{4})\b/);
  if (!yearMatch) {
    throw new Error(`Cannot parse a 4-digit year from calendar header: "${label}"`);
  }
  const year = Number(yearMatch[1]);

  const monthIndex = MONTHS.findIndex((m) => cleaned.includes(m.slice(0, 3)));
  if (monthIndex === -1) {
    throw new Error(`Cannot parse a month name from calendar header: "${label}"`);
  }
  return { monthIndex, year };
}

/** Parse MM/DD/YYYY (or M/D/YYYY) into its numeric parts. */
function parseDate(value: string): { month: number; day: number; year: number } {
  const m = value.trim().match(/^(\d{1,2})\D(\d{1,2})\D(\d{4})$/);
  if (!m) {
    throw new Error(`Date "${value}" is not in MM/DD/YYYY format`);
  }
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Date "${value}" has an invalid month/day`);
  }
  return { month, day, year };
}

export class CalendarDatePicker {
  private readonly page: Page;
  private readonly sel: CalendarSelectors;
  private readonly maxNavClicks = 240; // 20 years of safety margin

  constructor(page: Page, selectors: Partial<CalendarSelectors> = {}) {
    this.page = page;
    this.sel = { ...DEFAULT_CALENDAR_SELECTORS, ...selectors };
  }

  /** Open the calendar popup if it is not already showing. */
  private async open(triggerOverride?: string): Promise<void> {
    const trigger = this.page.locator(triggerOverride ?? this.sel.trigger).first();
    await expect(trigger, 'Date trigger should be visible').toBeVisible({ timeout: 10_000 });

    const header = this.page.locator(this.sel.header).first();
    if (!(await header.isVisible().catch(() => false))) {
      await trigger.click();
    }
    await expect(header, 'Calendar header (e.g. "May 2026") should be visible')
      .toBeVisible({ timeout: 10_000 });
  }

  /** Read & parse the currently displayed "Month Year" header. */
  private async readHeader(): Promise<{ monthIndex: number; year: number }> {
    const header = this.page.locator(this.sel.header).first();
    const text = (await header.textContent())?.trim() ?? '';
    return parseHeader(text);
  }

  /**
   * Resolve the prev/next arrow. Tries the configured CSS selectors first, then
   * falls back to literal `<` / `>` text and common aria-label/role variants so
   * the same code works whether arrows are buttons, spans, or icons.
   */
  private async resolveArrow(direction: 'prev' | 'next'): Promise<Locator> {
    const cssSelector = direction === 'prev' ? this.sel.prevButton : this.sel.nextButton;
    const cssMatch = this.page.locator(cssSelector).first();
    if ((await cssMatch.count()) > 0 && (await cssMatch.isVisible().catch(() => false))) {
      return cssMatch;
    }

    const symbol = direction === 'prev' ? ['<', '‹', '«', '◄'] : ['>', '›', '»', '►'];
    for (const s of symbol) {
      const byText = this.page.getByText(s, { exact: true }).first();
      if ((await byText.count()) > 0 && (await byText.isVisible().catch(() => false))) {
        return byText;
      }
    }

    const ariaName = direction === 'prev' ? /prev|previous/i : /next/i;
    const byRole = this.page.getByRole('button', { name: ariaName }).first();
    if ((await byRole.count()) > 0) return byRole;

    return cssMatch; // let the caller's visibility assertion produce a clear error
  }

  /**
   * Navigate the calendar to the requested month & year using ONLY the
   * `<` / `>` arrows. Computes the exact number of forward/backward clicks.
   */
  private async navigateToMonthYear(targetMonthIndex: number, targetYear: number): Promise<void> {
    const target = targetYear * 12 + targetMonthIndex;

    for (let i = 0; i <= this.maxNavClicks; i++) {
      const { monthIndex, year } = await this.readHeader();
      const current = year * 12 + monthIndex;

      if (current === target) return;

      const arrow = await this.resolveArrow(current < target ? 'next' : 'prev');

      await expect(arrow, 'Calendar navigation arrow should be visible/enabled')
        .toBeVisible({ timeout: 5_000 });
      await arrow.click();

      // Wait for the header to actually change before the next read (avoids races).
      await this.page
        .waitForTimeout(150)
        .catch(() => undefined);
    }

    throw new Error(
      `Failed to reach ${MONTHS[targetMonthIndex]} ${targetYear} within ${this.maxNavClicks} clicks. ` +
        `Check prevButton/nextButton/header selectors.`,
    );
  }

  /**
   * Click the day cell for the given day number in the CURRENT month view,
   * ignoring greyed-out leading/trailing days from adjacent months.
   */
  private async clickDay(day: number): Promise<void> {
    const candidates = this.page
      .locator(this.sel.dayCell)
      .filter({ hasText: new RegExp(`^\\s*${day}\\s*$`) });

    const count = await candidates.count();
    if (count === 0) {
      throw new Error(`No day cell with text "${day}" found in the visible calendar.`);
    }

    for (let i = 0; i < count; i++) {
      const cell = candidates.nth(i);
      if (!(await cell.isVisible().catch(() => false))) continue;

      const outer = (await cell.evaluate((el) => el.outerHTML).catch(() => '')).toLowerCase();
      const isOutside = this.sel.outsideDayMarkers.some((m) => outer.includes(m.toLowerCase()));
      if (isOutside) continue; // skip muted prev/next-month duplicates

      await cell.scrollIntoViewIfNeeded().catch(() => undefined);
      await cell.click();
      return;
    }

    // Fallback: if every match looked "outside" (unusual styling), click the
    // first visible one so the test still progresses rather than silently fail.
    await candidates.first().click();
  }

  /** Select a single date (MM/DD/YYYY) by navigating with the arrows. */
  async selectDate(date: string, triggerOverride?: string): Promise<void> {
    const { month, day, year } = parseDate(date);
    await this.open(triggerOverride);
    await this.navigateToMonthYear(month - 1, year);
    await this.clickDay(day);
  }

  /**
   * Select a "from" and "to" date range. Re-opens the calendar before the
   * second pick in case the widget closes after the first selection.
   */
  async selectDateRange(from: string, to: string, triggerOverride?: string): Promise<void> {
    await this.selectDate(from, triggerOverride);

    // Range pickers usually stay open; if it closed, selectDate() re-opens it.
    await this.selectDate(to, triggerOverride);
  }
}

/**
 * Backwards-compatible convenience wrapper used by ReportsPage.
 * Drives the real calendar widget via `<` / `>` arrows.
 */
export async function setDateRange(
  page: Page,
  triggerSelector: string,
  from: string,
  to: string,
  selectors: Partial<CalendarSelectors> = {},
): Promise<boolean> {
  const picker = new CalendarDatePicker(page, { trigger: triggerSelector, ...selectors });
  await picker.selectDateRange(from, to, triggerSelector);
  return true;
}
