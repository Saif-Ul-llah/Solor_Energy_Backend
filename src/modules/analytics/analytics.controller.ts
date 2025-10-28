import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  HttpError,
} from "../../imports";

import AnalyticsServices from "./analytics.services";

class AnalyticsController {
  /*===========================  Get Activity Over Time   =========================== */
  public static getActivityOverTime = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const { period = "MONTHLY", startDate, endDate } = req.query;

      // Validate period
      const validPeriods = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
      if (!validPeriods.includes(period as string)) {
        return next(
          HttpError.badRequest(
            "Invalid period. Must be one of: DAILY, WEEKLY, MONTHLY, YEARLY"
          )
        );
      }

      const data = await AnalyticsServices.getActivityOverTimeService({
        userId,
        period: period as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return sendResponse(
        res,
        200,
        "Activity over time fetched successfully",
        data,
        "success"
      );
    }
  );

  /*===========================  Get Activity by Log Type (Pie Chart)   =========================== */
  public static getActivityByLogType = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const data = await AnalyticsServices.getActivityByLogTypeService({
        userId,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return sendResponse(
        res,
        200,
        "Activity by log type fetched successfully",
        data,
        "success"
      );
    }
  );
}

export default AnalyticsController;

