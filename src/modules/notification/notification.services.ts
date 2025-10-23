import { User } from "@prisma/client";
import { HttpError, logger, dotenv, plantsAlertById } from "../../imports";
import NotificationRepo from "./notification.repo";
import PlantServices from "./../plant/plant.services";
import { sendPushNotification } from "../../utils/notification";
import AuthRepo from "../auth/auth.repo";
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

    const alerts = await Promise.all(
      plantsList.plants.map(async (plant: any) => {
        let plantAlert = await plantsAlertById(
          // plant.AutoID,
          // plant.CustomerEmail
          "240260",
          "progziel01"
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
    if (search && alerts.length > 0) {
      // filter alerts based on search term in plantName or infoerror messages
      return alerts.filter((alert) =>
        alert.infoerror.some(
          (a: any) =>
            a.plantName.toLowerCase().includes(search.toLowerCase()) ||
            a.ModelName.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
    // Calculate sum of total_error_num
    const total_error_num = alerts.reduce(
      (sum, alert) => sum + alert.total_error_num,
      0
    );

    // Calculate sum of all infoerror lengths (total number of errors)
    const infoerror = alerts
      .flatMap((alert) => alert.infoerror)
      .filter(Boolean);
    return { total_error_num, infoerror };

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
    return updatedPreferences;
  }
}
export default NotificationService;
