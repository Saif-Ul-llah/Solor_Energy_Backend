import { Router } from "express";
import { checkToken } from "../../imports";
import NotificationController from "./notification.controller";

const router = Router();

// router.post("/createPlant", checkToken, NotificationController.createPlant);
router.get("/getPlantsAlerts", checkToken, NotificationController.getPlantsAlerts);

export default router;
