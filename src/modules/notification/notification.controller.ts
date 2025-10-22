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

class NotificationController {

  public static getPlantsAlerts = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let user = req.user;
      const alerts = await NotificationServices.getPlantsAlerts(user);
      return sendResponse(res, 200, "Plants alerts", alerts, "success");
    }
  );
}
export default NotificationController;
