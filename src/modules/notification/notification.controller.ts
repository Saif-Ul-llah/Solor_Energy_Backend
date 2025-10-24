import { User } from "@prisma/client";
import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  HttpError,
  logger,
} from "../../imports";
import NotificationServices from "./notification.services";
import { sendPushNotification } from "../../utils/notification";

class NotificationController {
  public static getPlantsAlerts = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let user = req.user;
      let search = req.query.search as string | undefined;
      const alerts = await NotificationServices.getPlantsAlerts(user, search);
      return sendResponse(res, 200, "Plants alerts", alerts, "success");
    }
  );

  public static sendNotification = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // const userId = req.user.id;
      const { title, body, userId } = req.body;
      if (!title || !body) {
      }
      await NotificationServices.sendPushNotificationService(
        title,
        body,
        userId
      );
      return sendResponse(res, 200, "Notification sent", {}, "success");
    }
  );

  public static getNotificationList = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { page = 1, pageSize = 10 } = req.query;

      const notifications =
        await NotificationServices.getNotificationListService(
          Number(page),
          Number(pageSize),
          req.user.id
        );
      if (notifications) {
        return sendResponse(
          res,
          200,
          "Notification list",
          notifications,
          "success"
        );
      }

      return sendResponse(res, 200, "Notification list", [], "success");
    }
  );

  public static getNotificationPreference = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.query.userId;
      if (!userId) {
        throw new HttpError("User ID is required", "missing-parameters", 400);
      }
      const preferences: any =
        await NotificationServices.getNotificationPreferenceService(
          userId as string
        );
      return sendResponse(
        res,
        200,
        "Notification preferences",
        preferences,
        "success"
      );
    }
  );
  public static updateNotificationPreference = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // const userId = req.user.id;
      const { allowDeviceAlerts, allowFirmwareAlerts, allowLoginAlerts ,userId} =
        req.body;
        if (!userId) {
          throw new HttpError("User ID is required", "missing-parameters", 400);
        }
      const updatedPreferences =
        await NotificationServices.updateNotificationPreferenceService(userId, {
          allowDeviceAlerts,
          allowFirmwareAlerts,
          allowLoginAlerts,
        });
      return sendResponse(
        res,
        200,
        "Notification preferences updated",
        updatedPreferences,
        "success"
      );
    }
  );
}
export default NotificationController;
