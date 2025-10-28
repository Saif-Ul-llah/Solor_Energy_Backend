import { DeviceType } from "@prisma/client";
import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  HttpError,
  logger,
  validateFirmwareUpload,
} from "../../imports";

import DeviceServices from "./device.services";

class DeviceController {
  // Add New Device
  public static addDevice = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { deviceType, sn, plantId } = req.body;
      let user = req.user;
      if (!deviceType || !sn || !plantId)
        return next(HttpError.missingParameters("All fields are required! "));
      const device = await DeviceServices.addDeviceService(
        deviceType,
        sn,
        plantId,
        user
      );
      if (device) {
        return sendResponse(
          res,
          201,
          "Device added successfully",
          device,
          "success"
        );
      }
      return sendResponse(res, 200, "Failed to add device", [], "failed");
    }
  );
  // Get Device By Sn
  public static checkDevice = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { sn } = req.query;
      if (!sn)
        return next(HttpError.missingParameters("Serial Number is required! "));
      const device = await DeviceServices.checkDeviceService(sn);
      if (device) {
        return sendResponse(
          res,
          200,
          "Device Already Exists",
          { data: [] },
          "success"
        );
      }
      return sendResponse(
        res,
        200,
        "Device not found",
        { data: [] },
        "success"
      );
    }
  );
  // Get All Devices for home page
  public static getAllDeviceList = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // const user = req.user;
      const {
        deviceType = "INVERTER",
        status,
        page = 1,
        pageSize = 10,
        userId,
        search = "",
      } = req.query;
      if (!userId)
        return next(HttpError.missingParameters("User Id is required! "));
      const device: any = await DeviceServices.getAllDeviceListService(
        userId as string,
        "INVERTER" as DeviceType,
        status as string,
        Number(page),
        Number(pageSize),
        search as string
      );
      if (device) {
        return sendResponse(res, 200, "Device List", device, "success");
      }
    }
  );
  // Get device by Id
  public static getDeviceBySn = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn } = req.query;

      const device: any = await DeviceServices.getDeviceBySnService(
        user,
        sn as string
      );
      if (device) {
        return sendResponse(res, 200, "Device List", device, "success");
      }
    }
  );
  // Get Device Details
  public static getDeviceDetail = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn } = req.query;
      if (!sn)
        return next(HttpError.missingParameters("Serial Number is required! "));
      const device: any = await DeviceServices.getFlowDiagramService(
        user,
        sn as string
      );

      if (device) {
        return sendResponse(res, 200, "Device data", device, "success");
      }
      return sendResponse(res, 200, "Device data", [], "success");
    }
  );
  // Get Flow Diagram
  public static getFlowDiagram = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn } = req.query;
      if (!sn)
        return next(HttpError.missingParameters("Serial Number is required! "));
      const device: any = await DeviceServices.getFlowDiagramService(
        user,
        sn as string
      );
      let type = device.deviceType;
      delete device.deviceType;

      if (device) {
        let data = {
          id: sn,
          deviceType: type,
          children: Object.entries(device).map(([key, value]) => ({
            value: value,
            // [key]:value,
            deviceType: key,
          })),
        };
        return sendResponse(res, 200, "Flow Diagram data", data, "success");
      }
      return sendResponse(res, 200, "Flow Diagram data", [], "success");
    }
  );

  // Upload Firmware
  public static uploadFirmware = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const { error, value } = validateFirmwareUpload.validate(req.body);
      if (error) {
        return next(HttpError.badRequest(error.details[0].message));
      }
      const device: any = await DeviceServices.uploadFirmwareService({
        ...value,
        userId,
      });
      if (device) {
        return sendResponse(res, 200, "Firmware uploaded", device, "success");
      }
    }
  );

  // Get Firmware List
  public static getFirmwareList = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const firmwareList: any = await DeviceServices.getFirmwareListService(
        userId
      );
      if (firmwareList) {
        return sendResponse(res, 200, "Firmware List", firmwareList, "success");
      }
      return sendResponse(res, 200, "No Firmware Found", [], "success");
    }
  );

  // Delete device
  public static deleteDevice = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const { sn } = req.query;
      if (!sn)
        return next(HttpError.missingParameters("Serial Number is required! "));
      const device: any = await DeviceServices.deleteDeviceService(
        userId,
        sn as string
      );
      if (device) {
        return sendResponse(res, 200, "Device deleted", device, "success");
      }
    }
  );

  // Read Modbus Registers from Inverter
  public static readModbusRegisters = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn, memberId } = req.params;
      const { registers } = req.query; // Optional: comma-separated list of specific registers

      if (!sn) {
        return next(HttpError.missingParameters("Serial Number is required!"));
      }

      // Parse custom register list if provided
      const registerList = registers
        ? (registers as string).split(",").map((r) => r.trim())
        : undefined;

      const data = await DeviceServices.readModbusRegistersService(
        sn,
        memberId as string,
        registerList
      );

      if (data) {
        return sendResponse(
          res,
          200,
          "Modbus registers read successfully",
          data,
          "success"
        );
      }

      return sendResponse(
        res,
        200,
        "Failed to read Modbus registers",
        {},
        "failed"
      );
    }
  );

  // Write Modbus Registers to Inverter
  public static writeModbusRegisters = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn, memberId } = req.params;
      const { registers } = req.body; // Object with register: value pairs

      if (!sn) {
        return next(HttpError.missingParameters("Serial Number is required!"));
      }

      if (!registers || typeof registers !== "object") {
        return next(
          HttpError.badRequest(
            "Registers object is required with format { register: value }"
          )
        );
      }

      const data = await DeviceServices.writeModbusRegistersService(
        sn,
        memberId as string,
        registers,
        user
      );

      if (data) {
        return sendResponse(
          res,
          200,
          "Modbus registers written successfully",
          data,
          "success"
        );
      }

      return sendResponse(
        res,
        200,
        "Failed to write Modbus registers",
        {},
        "failed"
      );
    }
  );

  // Get Available Modbus Register Map
  public static getModbusRegisterMap = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const registerMap = await DeviceServices.getModbusRegisterMapService();
      
      return sendResponse(
        res,
        200,
        "Modbus register map retrieved successfully",
        registerMap,
        "success"
      );
    }
  );

  // Callback endpoint for write operation results
  public static modbusWriteCallback = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { GoodsID, operate, modbusInfo, SystemTime } = req.body;

      logger("📨 Modbus Write Callback Received:", {
        GoodsID,
        operate,
        modbusInfo,
        SystemTime,
        fullBody: req.body,
      });

      // Process the callback result
      await DeviceServices.processModbusWriteCallbackService({
        serialNumber: GoodsID,
        operation: operate,
        modbusData: modbusInfo,
        timestamp: SystemTime,
      });

      // IMPORTANT: Vendor requires lowercase "success" string response
      res.status(200).send("success");
    }
  );
}
export default DeviceController;
