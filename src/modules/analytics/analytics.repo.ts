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

    // Total USER actions count
    const totalUserActionsCount = await prisma.activityLog.count({
      where: { ...where, logType: LogType.USER },
    });

    // Total DEVICE actions count
    const deviceActionsCount = await prisma.activityLog.count({
      where: { ...where, logType: LogType.DEVICE },
    });

    // Total FIRMWARE count
    const firmwareCount = await prisma.activityLog.count({
      where: { ...where, logType: LogType.FIRMWARE },
    });

    return {
      totalLogsCount,
      totalUserActionsCount,
      deviceActionsCount,
      firmwareCount,
    };
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

