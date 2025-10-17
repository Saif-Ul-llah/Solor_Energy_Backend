import { Router } from "express";
import { checkToken, upload } from "../../imports";
import DeviceController from "./device.controller";

const router = Router();

router.post("/addDevice", checkToken, DeviceController.addDevice);
router.get("/checkDevice", checkToken, DeviceController.checkDevice);
router.get("/getAllDeviceList", checkToken, DeviceController.getAllDeviceList);
router.get("/getDeviceBySn", checkToken, DeviceController.getDeviceBySn);
router.get("/getDeviceDetails", checkToken, DeviceController.getDeviceDetail);
router.get("/getDeviceFlowDiagram", checkToken, DeviceController.getFlowDiagram);

export default router;
