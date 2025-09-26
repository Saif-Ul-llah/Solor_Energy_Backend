import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  prisma,
  generateOTP,
  comparePassword,
  generateToken,
  appConfig,
  sendResponse,
  transporter,
  bcrypt,
  getSignUpHtml,
  getEmailVerificationHtml,
  Roles,
  registerValidation,
  HttpError,
  registerInterface,
} from "../../imports";
import * as jwt from "jsonwebtoken";
import AuthServices from "./auth_services";
class AuthController {
  public static register = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = registerValidation.validate({
        ...req.body,
      });

      if (error) {
        return next(HttpError.validationError(error.details[0].message));
      }

      const user = await AuthServices.registerService(
        value as registerInterface
      );

      return sendResponse(res, 201, "User registered successfully", user);
    }
  );

  public static login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
  public static forgotPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
  public static verifyOTP = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
  public static resetPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
  public static changePassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
  );
}
export default AuthController;
