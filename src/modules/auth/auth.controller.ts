import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  registerValidation,
  HttpError,
  registerInterface,
  loginValidation,
  resetPasswordValidation,
} from "../../imports";

import AuthServices from "./auth.services";

class AuthController {
  /**==============================  Register New User  ============================== */
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

      return sendResponse(
        res,
        201,
        "User registered successfully",
        user,
        "success"
      );
    }
  );

  /**==============================  Login User  ============================== */

  public static login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = loginValidation.validate({
        ...req.body,
      });

      if (error) {
        return next(HttpError.validationError(error.details[0].message));
      }
      const result = await AuthServices.loginService(value);
      return sendResponse(res, 200, "Login successful", result, "success");
    }
  );

  /**==============================  Forget Password  ============================== */

  public static forgotPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;
      if (!email) {
        return next(HttpError.validationError("Email is required"));
      }
      const result = await AuthServices.forgotPasswordService(email);
      return sendResponse(res, 200, "OTP sent successfully", result, "success");
    }
  );

  /**==============================  Verify OTP  ============================== */

  public static verifyOTP = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, otp, TFA = false } = req.body;
      if (!email || !otp) {
        return next(HttpError.validationError("Email and OTP are required"));
      }
      const result = await AuthServices.verifyOtpService(email, otp, TFA);
      return sendResponse(res, 200, result.message, [], "success");
    }
  );

  /**==============================  Reset Password  ============================== */

  public static resetPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { error, value } = resetPasswordValidation.validate({
        ...req.body,
        email: user.email,
      });
      if (error) {
        return next(HttpError.validationError(error.details[0].message));
      }
      const result = await AuthServices.resetPasswordService(value);
      return sendResponse(res, 200, result.message, [], "success");
    }
  );

  /**==============================  Changed Password   ============================== */

  public static changePassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = (req as any).user.id; // populated by checkToken
      const { oldPassword, newPassword } = req.body;
      const result = await AuthServices.changePasswordService(
        userId,
        oldPassword,
        newPassword
      );
      return sendResponse(res, 200, result.message, [], "success");
    }
  );
  /*===========================================================================================
                                User Management 
===========================================================================================*/



}
export default AuthController;
