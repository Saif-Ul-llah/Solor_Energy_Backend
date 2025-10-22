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
      const alerts = await NotificationServices.getPlantsAlerts(user);
      return sendResponse(res, 200, "Plants alerts", alerts, "success");
    }
  );

  public static sendNotification = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const { title, body } = req.body;
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
}
export default NotificationController;
