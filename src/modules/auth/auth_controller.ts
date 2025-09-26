import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  registerValidation,
  HttpError,
  registerInterface,
} from "../../imports";

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

  // public static login = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {}
  // );
  // public static forgotPassword = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {}
  // );
  // public static verifyOTP = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {}
  // );
  // public static resetPassword = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {}
  // );
  // public static changePassword = asyncHandler(
  //   async (req: Request, res: Response, next: NextFunction) => {}
  // );

  
  public static login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const result = await AuthServices.loginService(email, password);
    return sendResponse(res, 200, "Login successful", result);
  });

  public static forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const result = await AuthServices.forgotPasswordService(email);
    return sendResponse(res, 200, "OTP sent successfully", result);
  });

  public static verifyOTP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const result = await AuthServices.verifyOtpService(email, otp);
    return sendResponse(res, 200, result.message, []);
  });

  public static resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, newPassword } = req.body;
    const result = await AuthServices.resetPasswordService(
      email,
      otp,
      newPassword
    );
    return sendResponse(res, 200, result.message, []);
  });

  public static changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id; // populated by checkToken
    const { oldPassword, newPassword } = req.body;
    const result = await AuthServices.changePasswordService(
      userId,
      oldPassword,
      newPassword
    );
    return sendResponse(res, 200, result.message, []);
  });
}
export default AuthController;
