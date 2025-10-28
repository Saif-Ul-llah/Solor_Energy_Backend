import { LogType, Role } from "@prisma/client";

export interface ActivityOverTimePayload {
  userId: string;
  period?: "daily" | "monthly" | "yearly";
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface ActivityOverTimeResponse {
  period: string;
  year?: number;
  data: Array<{
    month?: string;
    day?: number;
    count: number;
  }>;
  total: number;
}

export interface StatesActivityPayload {
  userId: string;
  startDate?: string;
  endDate?: string;
}

export interface StatesActivityResponse {
  totalUserActions: number;
  devicesAdded: number;
  configChanges: number;
  firmwareUpdated: number;
  percentages: {
    devicesAdded: number;
    configChanges: number;
    firmwareUpdated: number;
  };
  chartData: Array<{
    label: string;
    value: number;
    percentage: number;
    color: string;
  }>;
}

export interface ActivityBreakdownPayload {
  userId: string;
  startDate?: string;
  endDate?: string;
}

export interface ActivityBreakdownResponse {
  total: number;
  breakdown: Array<{
    type: LogType;
    count: number;
    percentage: number;
  }>;
}

export interface UserActivityTrendsPayload {
  userId: string;
  period?: "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
}

export interface UserActivityTrendsResponse {
  period: string;
  data: Array<{
    date: string;
    total: number;
    byType: Record<string, number>;
    byRole: Record<string, number>;
  }>;
  total: number;
}

export interface DeviceStatisticsPayload {
  userId: string;
}

export interface DeviceStatisticsResponse {
  totalDevices: number;
  devicesByType: Array<{
    type: string;
    count: number;
  }>;
  recentDevices: number;
}

export interface DashboardAnalyticsSummaryPayload {
  userId: string;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface DashboardAnalyticsSummaryResponse {
  activityOverTime: ActivityOverTimeResponse;
  statesActivity: StatesActivityResponse;
  deviceStatistics: DeviceStatisticsResponse;
  summary: {
    totalActivities: number;
    totalDevices: number;
    recentDevices: number;
  };
}

// User Logs Filter Interface (already exists in ActivityLog but duplicated for clarity)
export interface UserLogsPayload {
  userId: string;
  page?: number;
  pageSize?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  role?: Role;
  action?: string;
  logType?: LogType;
}

export interface UserLogsResponse {
  logs: Array<{
    id: string;
    action: string;
    description: string | null;
    createdAt: Date;
    userId: string | null;
    email: string | null;
    fullName: string | null;
    role: Role | null;
    imageUrl: string | null;
    logType: LogType;
  }>;
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
}


