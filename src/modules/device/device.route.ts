import { Router } from "express";
import { checkToken, upload } from "../../imports";
import DeviceController from "./device.controller";

const router = Router();


router.post("/addDevice", checkToken, DeviceController.addDevice);
router.get("/checkDevice", checkToken, DeviceController.checkDevice);

export default router;
