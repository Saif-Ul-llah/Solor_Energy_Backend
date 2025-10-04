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

class PlantController {

  public static createPlant = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = plantValidation.validate({
        ...req.body,
      });
      if (error) {
        return next(HttpError.validationError(error.details[0].message));
      }
      const plant = await PlantServices.createPlant(value as PlantInterface);
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

  public  static getAllPlants = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user
     const plants = await PlantServices.getAllPlants(user as User);
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
