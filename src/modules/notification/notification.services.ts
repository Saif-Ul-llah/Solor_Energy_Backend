import { LogType, User } from "@prisma/client";
import { HttpError, logger, dotenv, prisma, plantsAlertById } from "../../imports";
import NotificationRepo from "./notification.repo";
import PlantServices from "./../plant/plant.services";
import { sendPushNotification } from "../../utils/notification";
import AuthRepo from "../auth/auth.repo";
import { createLogs } from "../../utils/helpers";
import PlantRepo from "../plant/plant.repo";
dotenv.config();

class NotificationService {
  public static async getPlantsAlerts(
    user: User,
    search: string | undefined
  ): Promise<any> {
    // get Plant list of a user
    const plantsList: any = await PlantServices.getAllPlants(
      user.id,
      "",
      1,
      1000
    );

    const alerts: any = await Promise.all(
      plantsList.plants.map(async (plant: any) => {
        let plantAlert = await plantsAlertById(
          plant.AutoID,
          plant.CustomerEmail
          // "240260",
          // "progziel01"
        );
        if (
          plantAlert &&
          plantAlert.infoerror &&
          plantAlert.infoerror.length > 0
        ) {
          plantAlert.infoerror = plantAlert.infoerror.map((alert: any) => ({
            ...alert,
            plantName: plant.name,
            plantId: plant.id,
            plantProfile: plant.plantProfile,
          }));
          return plantAlert;
        }
        return plantAlert;
      })
    );
// logger("Alerts:", alerts);

let totalCriticalNum = alerts.flatMap((a: any) => a.infoerror)
  .filter((e: any) => e?.status == "1").length;

let totalResolvedNum = alerts.flatMap(( a: any)=> a.infoerror)
  .filter(( e: any) => e?.status != "1").length;

  let total_error_num = alerts.reduce(
    (sum: number, alert: any) => sum + alert?.total_error_num,
    0
  );

    if (search && alerts.length > 0) {
      // filter alerts based on search term in plantName or infoerror messages
      const data = alerts.filter((alert: any) =>
        alert?.infoerror.some(
          (a: any) =>
            a.plantName.toLowerCase().includes(search.toLowerCase()) ||
            a.ModelName.toLowerCase().includes(search.toLowerCase())
        )
      );
      return {
         totalResolvedNum,
      totalCriticalNum,
      total_error_num,
      infoerror: data.flatMap((alert: any) => alert.infoerror).filter(Boolean),
      }
    }
    // Calculate sum of all infoerror lengths (total number of errors)
    const infoerror = alerts
      .flatMap((alert: any) => alert?.infoerror)
      .filter(Boolean);

    return {
      totalResolvedNum,
      totalCriticalNum,
      total_error_num,
      infoerror,
    };

    // const alerts = await plantsAlertById("240260", "progziel01");
    // return alerts;
  }

  public static async sendPushNotificationService(
    title: string,
    body: string,
    userId: string
  ) {
    // fetch fcmToken from db
    const fcmToken = await AuthRepo.getFcmTokenByUserId(userId);
    logger("FCM Token:", fcmToken);
    // send notification
    await sendPushNotification(fcmToken, title, body);
    await NotificationRepo.createNotificationRepo({
      title,
      message: body,
      userId,
    });
    
    // Log notification sent
    await createLogs({
      userId: userId,
      action: "Send Notification",
      logType: LogType.NOTIFICATION,
      description: `Push notification sent: ${title}`,
      logData: {
        title,
        body,
        recipientUserId: userId,
      },
    });
    
    return;
  }

  public static async getNotificationListService(
    page: number,
    pageSize: number,
    userId: string
  ) {
    // get user list under user id
    let userIds: any = await AuthRepo.getChildrenRecursively(userId);
    userIds = userIds.map((user: any) => user.id);
    userIds.push(userId); // include self userId
    const notifications = await NotificationRepo.getNotificationListRepo(
      page,
      pageSize,
      userIds
    );
    return notifications;
  }

  public static async getNotificationPreferenceService(userId: string) {
    const preferences = await NotificationRepo.getNotificationPreferenceRepo(
      userId
    );
    return preferences;
  }
  public static async updateNotificationPreferenceService(
    userId: string,
    preferences: {
      allowDeviceAlerts: boolean;
      allowFirmwareAlerts: boolean;
      allowLoginAlerts: boolean;
    }
  ) {
    const updatedPreferences =
      await NotificationRepo.updateNotificationPreferenceRepo(
        userId,
        preferences
      );
    
    // Log notification preference update
    await createLogs({
      userId: userId,
      action: "Update Notification Preferences",
      logType: LogType.USER,
      description: `Notification preferences updated`,
      logData: {
        preferences,
      },
    });
    
    return updatedPreferences;
  }

  // Get Alerts Summary for Inverters and Batteries
  public static async getAlertsSummaryService(
    userId: string,
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly"
  ): Promise<any> {
    try {
      // Get all child users recursively
      const userIdsList: any = await PlantRepo.getChildrenRecursively(userId, "");
      const userIds = userIdsList.map((child: any) => child.id);
      userIds.push(userId); // Include self

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case "daily":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          startDate.setDate(now.getDate() - 7);
          break;
        case "monthly":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "yearly":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Count notifications from Notification table
      // Battery notifications: "Battery Fault Alert"
      // Inverter notifications: "Device Alarm Notification"

      const [batteryCount, inverterCount] = await Promise.all([
        // Count Battery Fault Alert notifications
        prisma.notification.count({
          where: {
            userId: { in: userIds },
            title: "Battery Fault Alert",
            createdAt: {
              gte: startDate,
              lte: now,
            },
          },
        }),
        // Count Device Alarm Notification notifications (inverters)
        prisma.notification.count({
          where: {
            userId: { in: userIds },
            title: "Device Alarm Notification",
            createdAt: {
              gte: startDate,
              lte: now,
            },
          },
        }),
      ]);

      const total = batteryCount + inverterCount;

      return {
        BATTERY: batteryCount,
        INVERTER: inverterCount,
        total: total,
      };
    } catch (error: any) {
      logger("[Alerts Summary] Error:", error?.message || error);
      throw new HttpError(
        "Failed to fetch alerts summary",
        "internal-server-error",
        500
      );
    }
  }
}
export default NotificationService;
