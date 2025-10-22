import { User } from "@prisma/client";
import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  HttpError,
  logger,
} from "../../imports";

import NotificationServices from "./notification.services";

class NotificationController {
  
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

}
export default NotificationController;
