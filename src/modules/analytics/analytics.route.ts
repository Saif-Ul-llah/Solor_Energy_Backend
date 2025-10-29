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

// Device Overview - Total counts for devices, inverters, and batteries
router.get(
  "/analytics/device-overview",
  checkToken,
  AnalyticsController.getDeviceOverview
);

// Device Monthly Graph - Yearly view with month-wise breakdown
router.get(
  "/analytics/device-monthly-graph",
  checkToken,
  AnalyticsController.getDeviceMonthlyGraph
);

export default router;
