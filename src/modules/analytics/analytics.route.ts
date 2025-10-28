import { Router } from "express";
import { checkToken } from "../../imports";
import AnalyticsController from "./analytics.controller";

const router = Router();

// ======================== Analytics Routes ========================

// Activity Over Time with period filters (DAILY, WEEKLY, MONTHLY, YEARLY)
router.get(
  "/analytics/activity-over-time",
  checkToken,
  AnalyticsController.getActivityOverTime
);

// Activity by Log Type for Pie Chart
router.get(
  "/analytics/activity-by-log-type",
  checkToken,
  AnalyticsController.getActivityByLogType
);

export default router;

