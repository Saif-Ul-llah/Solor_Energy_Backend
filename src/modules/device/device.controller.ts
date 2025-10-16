import { DeviceType } from "@prisma/client";
import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  HttpError,
  logger,
} from "../../imports";

import DeviceServices from "./device.services";

class DeviceController {
  // public static createPlant = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     let user = req.user;
  //     const { error, value } = plantValidation.validate({
  //       ...req.body,
  //     });
  //     if (error) {
  //       return next(HttpError.validationError(error.details[0].message));
  //     }
  //     const plant = await PlantServices.createPlant(
  //       value as PlantInterface,
  //       user as User
  //     );
  //     if (plant) {
  //       return sendResponse(
  //         res,
  //         201,
  //         "Plant created successfully",
  //         plant,
  //         "success"
  //       );
  //     }
  //   }
  // );

  public static addDevice = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { deviceType, sn, plantId } = req.body;
      if (!deviceType || !sn || !plantId)
        return next(HttpError.missingParameters("All fields are required! "));
      const device = await DeviceServices.addDeviceService(
        deviceType,
        sn,
        plantId
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
      const user = req.user;
      const {
        deviceType = "BATTERY",
        status,
        page = 1,
        pageSize = 10,
      } = req.query;
      const device: any = await DeviceServices.getAllDeviceListService(
        user,
        deviceType as DeviceType,
        status as string,
        Number(page),
        Number(pageSize)
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
      if (device) {
        return sendResponse(res, 200, "Device List", device, "success");
      }
    }
  );
  
}
export default DeviceController;
