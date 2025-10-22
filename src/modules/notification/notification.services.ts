import { User } from "@prisma/client";
import { HttpError, logger, dotenv, plantsAlertById } from "../../imports";
import NotificationRepo from "./notification.repo";
import PlantServices from "./../plant/plant.services";
import { sendPushNotification } from "../../utils/notification";
import AuthRepo from "../auth/auth.repo";
dotenv.config();

class NotificationService {
  public static async getPlantsAlerts(user: User): Promise<any> {
    // get Plant list of a user
    const plantsList: any = await PlantServices.getAllPlants(
      user.id,
      "",
      1,
      1000
    );

    const alerts = await Promise.all(
      plantsList.plants.map(async (plant: any) => {
        const plantAlert = await plantsAlertById(
          // plant.AutoID,
          // plant.CustomerEmail
          "240260",
          "progziel01"
        );
        return plantAlert;
      })
    );

    // Calculate sum of total_error_num
    const totalErrorNumSum = alerts.reduce(
      (sum, alert) => sum + alert.total_error_num,
      0
    );

    // Calculate sum of all infoerror lengths (total number of errors)
    const flatAlerts = alerts
      .flatMap((alert) => alert.infoerror)
      .filter(Boolean);

    return { totalErrorNumSum, flatAlerts };
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
}
export default NotificationService;
