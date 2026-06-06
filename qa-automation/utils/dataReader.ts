import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

export interface UserCredentials {
  username: string;
  password: string;
  role?: string;
  description?: string;
  active?: boolean;
}

export interface ReportFilter {
  name?: string;
  department: string;
  adType: string;
  adPlacement: string;
  fromDate: string;
  toDate: string;
}

export type DataSource = 'json' | 'excel';

export class DataReader {
  private static resolvePath(filePath: string): string {
    // Try a few common resolution strategies so tests work regardless of CWD
    const candidates = [
      path.resolve(filePath),
      path.resolve(process.cwd(), filePath),
      path.resolve(__dirname, '..', filePath),
      path.resolve(__dirname, '../../', filePath),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    // default to the first resolved path (will cause original error)
    return path.resolve(filePath);
  }
  /**
   * Read credentials from a JSON file.
   * Supports both flat array [ {...}, {...} ] and { "users": [...] } shape.
   */
  static readFromJSON(filePath: string): UserCredentials[] {
    const absolutePath = DataReader.resolvePath(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`[DataReader] JSON file not found: ${absolutePath}`);
    }
    try {
      const raw = fs.readFileSync(absolutePath, 'utf-8');
      const parsed = JSON.parse(raw) as UserCredentials[] | { users: UserCredentials[] };
      const users = Array.isArray(parsed) ? parsed : parsed.users ?? [];

      // Validate users have required fields
      return users.filter((u) => u.username && u.password); // Must have username & password
    } catch (error) {
      throw new Error(
        `[DataReader] Error reading JSON file ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Read credentials from an Excel (.xlsx / .xls) file.
   * By default reads the first sheet; pass sheetName to target a specific tab.
   * Column headers in Excel must match: username, password, role, description, active
   */
  static readFromExcel(filePath: string, sheetName?: string): UserCredentials[] {
    const absolutePath = DataReader.resolvePath(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`[DataReader] Excel file not found: ${absolutePath}`);
    }

    try {
      const workbook = XLSX.readFile(absolutePath);
      const targetSheetName = sheetName ?? workbook.SheetNames[0];
      const targetSheet = workbook.Sheets[targetSheetName];

      if (!targetSheet) {
        throw new Error(
          `[DataReader] Sheet "${targetSheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`
        );
      }

      const rows = XLSX.utils.sheet_to_json<any>(targetSheet);

      // Validate and normalize rows
      return rows
        .filter((u) => u.username && u.password) // Must have username & password
        .map((u) => ({
          username: String(u.username).trim(),
          password: String(u.password).trim(),
          role: u.role ? String(u.role).trim() : undefined,
          description: u.description ? String(u.description).trim() : undefined,
          active: u.active,
        }));
    } catch (error) {
      throw new Error(
        `[DataReader] Error reading Excel file ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Main entry point — auto-selects JSON or Excel based on DATA_SOURCE env var.
   * Falls back to JSON if not set.
   */
  static getCredentials(source?: DataSource): UserCredentials[] {
    const resolvedSource: DataSource = source ?? ((process.env.DATA_SOURCE as DataSource) || 'json');

    const defaultJson = path.resolve(__dirname, '..', 'data', 'users.json');
    const defaultExcel = path.resolve(__dirname, '..', 'data', 'users.xlsx');

    if (resolvedSource === 'excel') {
      return DataReader.readFromExcel(defaultExcel);
    }
    return DataReader.readFromJSON(defaultJson);
  }

  /** Read report filters from JSON file. Supports array or { reports: [...] } shape. */
  static readReportFiltersFromJSON(filePath: string): ReportFilter[] {
    const absolutePath = DataReader.resolvePath(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`[DataReader] JSON file not found: ${absolutePath}`);
    }
    try {
      const raw = fs.readFileSync(absolutePath, 'utf-8');
      const parsed = JSON.parse(raw) as ReportFilter[] | { reports: ReportFilter[] };
      const reports = Array.isArray(parsed) ? parsed : parsed.reports ?? [];
      return reports.map((r) => ({
        name: r.name,
        department: String(r.department || '').trim(),
        adType: String(r.adType || '').trim(),
        adPlacement: String(r.adPlacement || '').trim(),
        fromDate: String(r.fromDate || '').trim(),
        toDate: String(r.toDate || '').trim(),
      }));
    } catch (error) {
      throw new Error(
        `[DataReader] Error reading JSON file ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /** Read report filters from Excel file (first sheet by default) */
  static readReportFiltersFromExcel(filePath: string, sheetName?: string): ReportFilter[] {
    const absolutePath = DataReader.resolvePath(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`[DataReader] Excel file not found: ${absolutePath}`);
    }
    try {
      const workbook = XLSX.readFile(absolutePath);
      const targetSheetName = sheetName ?? workbook.SheetNames[0];
      const targetSheet = workbook.Sheets[targetSheetName];
      if (!targetSheet) {
        throw new Error(
          `[DataReader] Sheet "${targetSheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`
        );
      }
      const rows = XLSX.utils.sheet_to_json<any>(targetSheet);
      return rows.map((r) => ({
        name: r.name ? String(r.name).trim() : undefined,
        department: String(r.department || '').trim(),
        adType: String(r.adType || '').trim(),
        adPlacement: String(r.adPlacement || '').trim(),
        fromDate: String(r.fromDate || '').trim(),
        toDate: String(r.toDate || '').trim(),
      }));
    } catch (error) {
      throw new Error(
        `[DataReader] Error reading Excel file ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /** Get report filters from either JSON or Excel in data/ */
  static getReportFilters(source?: DataSource): ReportFilter[] {
    const resolvedSource: DataSource = source ?? ((process.env.DATA_SOURCE as DataSource) || 'json');
    const defaultJson = path.resolve(__dirname, '..', 'data', 'reportFilters.json');
    const defaultExcel = path.resolve(__dirname, '..', 'data', 'reportFilters.xlsx');

    if (resolvedSource === 'excel') {
      return DataReader.readReportFiltersFromExcel(defaultExcel);
    }
    return DataReader.readReportFiltersFromJSON(defaultJson);
  }

  /** Convenience: get a single user by role */
  static getUserByRole(role: string, source?: DataSource): UserCredentials {
    const all = DataReader.getCredentials(source);
    const found = all.find((u) => u.role?.toLowerCase() === role.toLowerCase());
    if (!found) {
      const availableRoles = all.map((u) => u.role).filter(Boolean).join(', ');
      throw new Error(
        `[DataReader] No user with role "${role}" found. Available roles: ${availableRoles || 'none'}`
      );
    }
    return found;
  }
}
