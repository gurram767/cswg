import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Single source of truth for environment configuration and shared constants.
 * Values come from `.env` where applicable; never hard-code these elsewhere.
 */
export type DataSource = 'json' | 'excel';

function envBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

export class AppConfig {
  // Base URL & endpoints
  static readonly BASE_URL = process.env.BASE_URL || 'https://qacsconnect.cswg.com';
  static readonly LOGIN_ENDPOINT = '/customerportal/#/login';
  static readonly DASHBOARD_ENDPOINT = '/customerportal/#/dashboard';
  static readonly REPORTS_ENDPOINT = '/customerportal/#/reports/adreports';

  // Timeouts (milliseconds)
  static readonly DEFAULT_TIMEOUT = 10_000;
  static readonly ACTION_TIMEOUT = 15_000;
  static readonly NAVIGATION_TIMEOUT = 30_000;
  static readonly ELEMENT_WAIT_TIMEOUT = 8_000;

  // Test data source
  static readonly DATA_SOURCE: DataSource = (process.env.DATA_SOURCE as DataSource) || 'json';

  // Browser & viewport
  static readonly VIEWPORT_WIDTH = 1440;
  static readonly VIEWPORT_HEIGHT = 900;
  static readonly HEADLESS = envBool(process.env.HEADLESS, false);

  // Artifact output directories
  static readonly SCREENSHOT_DIR = 'screenshots';
  static readonly REPORT_DIR = 'playwright-report';
  static readonly DOWNLOAD_DIR = 'downloads';

  // CI / runner flags
  static readonly IS_CI = !!process.env.CI;
  static readonly RETRY_COUNT = AppConfig.IS_CI ? 2 : 1;
  static readonly WORKER_COUNT = 1;

  static getFullURL(endpoint: string): string {
    return `${AppConfig.BASE_URL}${endpoint}`;
  }

  static getLoginURL(): string {
    return AppConfig.getFullURL(AppConfig.LOGIN_ENDPOINT);
  }

  static getDashboardURL(): string {
    return AppConfig.getFullURL(AppConfig.DASHBOARD_ENDPOINT);
  }
}
