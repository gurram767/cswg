import { DataReader, UserCredentials, ReportFilter, DataSource } from './dataReader';

/**
 * Loads test data (users and report filters) from the configured source
 * and exposes simple lookups. Credentials are never logged.
 */
export class TestDataHelper {
  private readonly dataSource: DataSource;
  private allUsers: UserCredentials[] = [];
  private adminUser: UserCredentials | null = null;
  private reportFilters: ReportFilter[] = [];

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.loadData();
  }

  private loadData(): void {
    this.allUsers = DataReader.getCredentials(this.dataSource);
    this.adminUser = DataReader.getUserByRole('admin', this.dataSource);

    try {
      this.reportFilters = DataReader.getReportFilters(this.dataSource);
    } catch {
      this.reportFilters = [];
    }
  }

  getAllUsers(): UserCredentials[] {
    return this.allUsers;
  }

  getAdminUser(): UserCredentials {
    if (!this.adminUser) {
      throw new Error('Admin user not found in test data');
    }
    return this.adminUser;
  }

  getUserByRole(role: string): UserCredentials {
    const user = this.allUsers.find((u) => u.role?.toLowerCase() === role.toLowerCase());
    if (!user) {
      throw new Error(`User with role "${role}" not found in test data`);
    }
    return user;
  }

  getReportFilters(): ReportFilter[] {
    return this.reportFilters;
  }

  getDataSource(): string {
    return this.dataSource.toUpperCase();
  }
}
