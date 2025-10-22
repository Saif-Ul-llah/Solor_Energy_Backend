import express from "express";
import authRouter from "../modules/auth/auth.route";
import PlantRouter from "../modules/plant/plant.route";
import DeviceRouter from "../modules/device/device.route";
import NotificationRouter from "../modules/notification/notification.route";

const router = express.Router();

router.use(authRouter);
router.use(PlantRouter);
router.use(DeviceRouter);  
router.use(NotificationRouter);  

export { router as allRoutes };
