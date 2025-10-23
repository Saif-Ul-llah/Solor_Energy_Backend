import { HttpError, logger, prisma } from "../../imports";

class NotificationRepo {
  // public static async isPlantExists(name: string): Promise<boolean> {
  //   const plant = await prisma.plant.findUnique({
  //     where: { name },
  //   });
  //   return !!plant;
  // }

  public static async getNotificationListRepo(
    page: number,
    pageSize: number,
    userIds: string[]
  ) {
    // Sanitize input
    const validPage = Math.max(page, 1);
    const skip = (validPage - 1) * pageSize;

    // Run count and data queries in parallel for better performance
    const [total, notifications] = await Promise.all([
      prisma.notification.count({
        where: { userId: { in: userIds } },
      }),
      prisma.notification.findMany({
        where: { userId: { in: userIds } },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          message: true,
          createdAt: true,
          user: { select: { imageUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Map notifications efficiently
    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      imageUrl: n.user?.imageUrl ?? null,
    }));

    // Calculate pagination details
    const totalPages = Math.ceil(total / pageSize);

    return {
      notifications: formattedNotifications,
      currentPage: validPage,
      pageSize,
      total,
      totalPages,
    };
  }

  public static async createNotificationRepo(data: {
    title: string;
    message: string;
    userId: string;
  }) {
    const notification = await prisma.notification.create({
      data,
    });
    return notification;
  }

  public static async getNotificationPreferenceRepo(userId: string) {
    const preferences = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        allowDeviceAlerts: true,
        allowFirmwareAlerts: true,
        allowLoginAlerts: true,
      },
    });
    return preferences;
  }

  public static async updateNotificationPreferenceRepo(
    userId: string,
    preferences: {
      allowDeviceAlerts: boolean;
      allowFirmwareAlerts: boolean;
      allowLoginAlerts: boolean;
    }
  ) {
    const updatedPreferences = await prisma.user.update({
      where: { id: userId },
      data: preferences,
    });
    return updatedPreferences;
  }
}

export default NotificationRepo;
