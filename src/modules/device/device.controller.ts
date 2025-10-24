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
      const device: any = await DeviceServices.uploadFirmwareService({...value,userId});
      if (device) {
        return sendResponse(res, 200, "Firmware uploaded", device, "success");
      }
    }
  );
}
export default DeviceController;
