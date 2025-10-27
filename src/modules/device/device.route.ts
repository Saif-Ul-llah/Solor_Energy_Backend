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
router.post("/uploadFirmware", checkToken, DeviceController.uploadFirmware);
router.get("/getFirmwareList", checkToken, DeviceController.getFirmwareList);
router.delete("/deleteDevice", checkToken, DeviceController.deleteDevice);

// Modbus Register Routes
router.get("/modbus/register-map", checkToken, DeviceController.getModbusRegisterMap);
router.get("/modbus/:sn/:memberId/read", checkToken, DeviceController.readModbusRegisters);
router.post("/modbus/:sn/:memberId/write", checkToken, DeviceController.writeModbusRegisters);

export default router;
