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
}
export default PlantController;
