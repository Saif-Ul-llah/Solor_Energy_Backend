import { Role, User } from "@prisma/client";
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
  updateUserValidation,
  getUserData,
  logger,
} from "../../imports";

import AuthServices from "./auth.services";

class AuthController {
  /**==============================  Register New User  ============================== */
  public static register = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = registerValidation.validate({
        ...req.body,
      });
      let reqUser = req.user;

      if (error) {
        return next(HttpError.validationError(error.details[0].message));
      }

      const user = await AuthServices.registerService(
        value as registerInterface,
        reqUser
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
      const result: any = await AuthServices.verifyOtpService(email, otp, TFA);
      return sendResponse(
        res,
        200,
        result.message,
        result.data || [],
        "success"
      );
    }
  );

  /**==============================  Reset Password  ============================== */

  public static resetPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { userId } = req.body;
      const { error, value } = resetPasswordValidation.validate({
        ...req.body,
        userId: userId || user.id,
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

  /**==============================  Get User By Id   ============================== */

  public static getUserById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.query.userId as string;
      if (!userId) {
        return next(HttpError.validationError("User ID is required"));
      }
      const user = await AuthServices.getUserByIdService(userId);
      return sendResponse(
        res,
        200,
        "User fetched successfully",
        user,
        "success"
      );
    }
  );

  /*=========================== Refresh Token =========================== */
  public static refreshToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { refreshToken } = req.body;
      if (!refreshToken)
        next(HttpError.validationError("Refresh Token is required"));
      const result: String = await AuthServices.refreshTokenService(
        refreshToken
      );
      return sendResponse(
        res,
        200,
        "Token refreshed successfully",
        result,
        "success"
      );
    }
  );

  /*=========================== Update User =========================== */
  public static updateUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = updateUserValidation.validate({
        ...req.body,
      });

      logger("data", value);

      if (error) {
        return next(HttpError.validationError(error.details[0].message));
      }
      const user = await AuthServices.updateUserService(value);
      return sendResponse(
        res,
        200,
        "User updated successfully",
        getUserData(user),
        "success"
      );
    }
  );

  /*===========================================================================================
                                User Management 
  ===========================================================================================*/

  public static userList = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      let { role = null } = req.query;
      const users = await AuthServices.userListService(role as Role, user);
      return sendResponse(
        res,
        200,
        "User list fetched successfully",
        users,
        "success"
      );
    }
  );

  public static getAllUsers = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      let {
        role = null,
        userId,
        page = 1,
        pageSize = 10,
        search = "",
        latitude,
        longitude,
        IsActive,
      } = req.query;
      if (!userId) {
        return next(HttpError.validationError("User ID is required"));
      }
      if (role == "All") role = null;
      const users = await AuthServices.userListFlowService({
        role: role as Role,
        userId: userId as string,
        page: Number(page),
        pageSize: Number(pageSize),
        search: search as string,
        user: req.user as User,
        latitude: Number(latitude),
        longitude: Number(longitude),
        IsActive,
      });
      return sendResponse(
        res,
        200,
        "User list fetched successfully",
        users,
        "success"
      );
    }
  );

  public static getActivityLog = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { page, pageSize, search, date, startDate, endDate, role } =
        req.query;
      let user = req.user;
      const activityLog = await AuthServices.getActivityLogService({
        userId: user.id,
        page: Number(page),
        pageSize: Number(pageSize),
        search,
        date,
        startDate,
        endDate,
        role,
      });
      return sendResponse(
        res,
        200,
        "Activity Log fetched successfully",
        activityLog,
        "success"
      );
    }
  );

  public static getDashboardCount = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;

      const stats = await AuthServices.getDashboardCountService({
        userId,
      });
      return sendResponse(
        res,
        200,
        "Dashboard Count fetched successfully",
        stats,
        "success"
      );
    }
  );

  public static deleteUserById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.query;
      if (!userId) return next(HttpError.badRequest("User ID is required"));
      const user = await AuthServices.updateUserService({
        userId,
        IsActive: false,
      });
      return sendResponse(
        res,
        200,
        "User deleted successfully",
        user,
        "success"
      );
    }
  );
  
}
export default AuthController;
