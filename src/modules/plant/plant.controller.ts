import { User } from "@prisma/client";
import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  HttpError,
  plantValidation,
  PlantInterface,
  updatePlantValidation,
} from "../../imports";

import PlantServices from "./plant.services";

class PlantController {
  public static createPlant = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let user = req.user;
      const { error, value } = plantValidation.validate({
        ...req.body,
      });
      if (error) {
        return next(HttpError.validationError(error.details[0].message));
      }
      const plant = await PlantServices.createPlant(
        value as PlantInterface,
        user as User
      );
      if (plant) {
        return sendResponse(
          res,
          201,
          "Plant created successfully",
          plant,
          "success"
        );
      }
    }
  );

  public static getAllPlants = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // const user = req.user;
      const {
        status = "",
        page = 1,
        pageSize = 10,
        userId,
        search = "",
        startCapacity = 0,
        endCapacity = 0,
        latitude = 0,
        longitude = 0,
      } = req.query;

      const plants = await PlantServices.getAllPlants(
        userId as string,
        status as string,
        Number(page),
        Number(pageSize),
        search as string,
        Number(startCapacity),
        Number(endCapacity),
        Number(latitude),
        Number(longitude)
      );
      if (plants) {
        return sendResponse(
          res,
          200,
          "Plants fetched successfully",
          plants,
          "success"
        );
      }
    }
  );

  public static getPlantById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.query;
      if (!id) return next(HttpError.badRequest("Plant ID is required"));
      const plant = await PlantServices.getPlantByIdService(id as string);
      if (plant) {
        return sendResponse(
          res,
          200,
          "Plant fetched successfully",
          plant,
          "success"
        );
      }
    }
  );

  // Get Device List of Plant
  public static getDeviceListOfPlant = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { AutoID, type = "INVERTER", email } = req.query;

      if (!AutoID || !email)
        return next(HttpError.badRequest("Plant ID or Email is required"));
      const device = await PlantServices.getDeviceListOfPlantService(
        AutoID as string,
        type as string,
        email as string
      );
      if (device) {
        return sendResponse(
          res,
          200,
          "Device List fetched successfully",
          device,
          "success"
        );
      }
    }
  );

  // Update Plant Details
  public static updatePlant = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = updatePlantValidation.validate({
        ...req.body,
      });
      if (error) {
        return next(HttpError.validationError(error.details[0].message));
      }
      const plant = await PlantServices.updatePlantService(value);
      if (plant) {
        return sendResponse(
          res,
          200,
          "Plant updated successfully",
          plant,
          "success"
        );
      }
    }
  );

  // Get Plant Flow Diagram data
  public static getPlantFlowDiagram = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { plantId } = req.query;
      if (!plantId) return next(HttpError.badRequest("Plant ID is required"));
      const device: any = await PlantServices.getPlantFlowDiagramService(
        plantId as string
      );
      if (device) {
        return sendResponse(
          res,
          200,
          "Device List fetched successfully",
          device,
          "success"
        );
      }
    }
  );
}
export default PlantController;
