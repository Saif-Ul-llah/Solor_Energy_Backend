import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  HttpError,
} from "../../imports";

import AuthServices from "./plant.services";

class PlantController {
  // public static register = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const { error, value } = registerValidation.validate({
  //       ...req.body,
  //     });
  //     if (error) {
  //       return next(HttpError.validationError(error.details[0].message));
  //     }
  //     const user = await AuthServices.registerService(
  //       value as registerInterface
  //     );
  //     return sendResponse(
  //       res,
  //       201,
  //       "User registered successfully",
  //       user,
  //       "success"
  //     );
  //   }
  // );
}
export default PlantController;
