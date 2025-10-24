import { Router } from "express";
import { checkToken } from "../../imports";
import NotificationController from "./notification.controller";

const router = Router();

router.get("/getPlantsAlerts", checkToken, NotificationController.getPlantsAlerts);
router.post("/sendNotification", checkToken, NotificationController.sendNotification);
router.get("/notificationList", checkToken, NotificationController.getNotificationList);
router.get("/getNotificationPreference", checkToken, NotificationController.getNotificationPreference);
router.post("/updateNotificationPreference", checkToken, NotificationController.updateNotificationPreference);

export default router;
