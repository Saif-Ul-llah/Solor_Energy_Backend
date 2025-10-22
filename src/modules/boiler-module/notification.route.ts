import { Router } from "express";
import { checkToken, upload } from "../../imports";
import NotificationController from "./notification.controller";

const router = Router();


// router.post("/createPlant", checkToken, NotificationController.createPlant);
export default router;
