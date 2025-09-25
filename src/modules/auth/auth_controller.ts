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
} from "../../imports";
import * as jwt from "jsonwebtoken";
import AuthServices from "./auth_services";
class AuthController {
  public static register = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {}
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
