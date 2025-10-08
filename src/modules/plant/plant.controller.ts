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
} from "../../imports";

import PlantServices from "./plant.services";
import { stat } from "fs";

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
      const user = req.user;
      const { status = "", page = 1, pageSize = 10 } = req.query;
      
      const plants = await PlantServices.getAllPlants(
        user as User,
        status as string,
        Number(page),
        Number(pageSize) 
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
}
export default PlantController;
