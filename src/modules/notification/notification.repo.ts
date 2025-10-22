import { HttpError, logger, prisma } from "../../imports";

class NotificationRepo {

  // public static async isPlantExists(name: string): Promise<boolean> {
  //   const plant = await prisma.plant.findUnique({
  //     where: { name },
  //   });
  //   return !!plant;
  // }
  
  public static async getNotificationListRepo(page: number, pageSize: number, userIds: string[]) {
    const notifications = await prisma.notification.findMany({
      where: { userId: { in: userIds } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return notifications;
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
}

export default NotificationRepo;
