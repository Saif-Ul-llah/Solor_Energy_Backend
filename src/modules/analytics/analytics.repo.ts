import { LogType, Role } from "@prisma/client";
import { prisma } from "../../imports";

class AnalyticsRepo {
  /*===========================  Get Activity Over Time   =========================== */
  public static async getActivityOverTimeRepo(payload: any): Promise<any> {
    const { userId, period = "MONTHLY", startDate, endDate } = payload;

    // Get all children users recursively
    let child = await this.getChildrenRecursively(userId);
    let ids = child.map((c: any) => c.id);
    ids = [...ids, userId];

    // Determine date range
    let dateRange: any = {};
    if (startDate && endDate) {
      dateRange.gte = new Date(startDate);
      dateRange.lt = new Date(endDate);
    } else {
      // Default ranges based on period
      const now = new Date();
      if (period === "DAILY") {
        dateRange.gte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      } else if (period === "WEEKLY") {
        dateRange.gte = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      } else if (period === "MONTHLY") {
        dateRange.gte = new Date(now.getFullYear(), 0, 1);
      } else if (period === "YEARLY") {
        dateRange.gte = new Date(now.getFullYear() - 5, 0, 1);
      }
      dateRange.lt = new Date();
    }

    // Fetch activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        userId: { in: ids },
        createdAt: dateRange,
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return activityLogs;
  }

  /*===========================  Get Activity by Log Type (Pie Chart)   =========================== */
  public static async getActivityByLogTypeRepo(payload: any): Promise<any> {
    const { userId, startDate, endDate } = payload;

    // Get all children users recursively
    let child = await this.getChildrenRecursively(userId);
    let ids = child.map((c: any) => c.id);
    ids = [...ids, userId];

    // Determine date range
    let dateRange: any = {};
    if (startDate && endDate) {
      dateRange.gte = new Date(startDate);
      dateRange.lt = new Date(endDate);
    }

    const where = {
      userId: { in: ids },
      ...(Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {}),
    };

    // Total logs count
    const totalLogsCount = await prisma.activityLog.count({ where });

    // Count by each log type
    const userActionsCount = await prisma.activityLog.count({
      where: { ...where, logType: LogType.USER },
    });

    const deviceActionsCount = await prisma.activityLog.count({
      where: { ...where, logType: LogType.DEVICE },
    });

    const firmwareCount = await prisma.activityLog.count({
      where: { ...where, logType: LogType.FIRMWARE },
    });

    const plantActionsCount = await prisma.activityLog.count({
      where: { ...where, logType: LogType.PLANT },
    });

    const notificationCount = await prisma.activityLog.count({
      where: { ...where, logType: LogType.NOTIFICATION },
    });

    const modbusWriteCount = await prisma.activityLog.count({
      where: { ...where, logType: LogType.MODBUS_WRITE_REGISTERS },
    });

    return {
      totalLogsCount,
      userActionsCount,
      deviceActionsCount,
      firmwareCount,
      plantActionsCount,
      notificationCount,
      modbusWriteCount,
    };
  }

  /*===========================  Get Device Overview (Total Counts)   =========================== */
  public static async getDeviceOverviewRepo(payload: any): Promise<any> {
    const { userId } = payload;

    // Get all children users recursively
    let child = await this.getChildrenRecursively(userId);
    let ids = child.map((c: any) => c.id);
    ids = [...ids, userId];

    // Total devices count
    const totalDevices = await prisma.device.count({
      where: { customerId: { in: ids } },
    });

    // Total inverters count
    const totalInverters = await prisma.device.count({
      where: {
        customerId: { in: ids },
        deviceType: "INVERTER",
      },
    });

    // Total batteries count
    const totalBatteries = await prisma.device.count({
      where: {
        customerId: { in: ids },
        deviceType: "BATTERY",
      },
    });

    return {
      totalDevices,
      totalInverters,
      totalBatteries,
    };
  }

  /*===========================  Get Device Monthly Graph (Yearly View)   =========================== */
  public static async getDeviceMonthlyGraphRepo(payload: any): Promise<any> {
    const { userId, year } = payload;

    // Get all children users recursively
    let child = await this.getChildrenRecursively(userId);
    let ids = child.map((c: any) => c.id);
    ids = [...ids, userId];

    // Set year range
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st

    // Fetch all devices within the year for the users
    const devices = await prisma.device.findMany({
      where: {
        customerId: { in: ids },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        deviceType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return devices;
  }

  /*===========================  Helper: Get Children Recursively   =========================== */
  private static async getChildrenRecursively(
    userId: string,
    role?: Role
  ): Promise<any[]> {
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    let allChildren: any[] = [];

    for (const child of children) {
      if (!role || child.role === role) {
        allChildren.push(child);
      }

      const childDescendants = await this.getChildrenRecursively(
        child.id,
        role
      );
      allChildren = [...allChildren, ...childDescendants];
    }

    return allChildren;
  }
}

export default AnalyticsRepo;

