import {
  encryptPass,
  comparePass,
  HttpError,
  registerInterface,
  loginInterface,
  resetPassInterface,
  sendMail,
  registerMonitorUser,
  dotenv,
  getUserData,
  verifyRefreshToken,
  logger,
} from "../../imports";
import AuthRepo from "./auth.repo";
import {
  createLogs,
  generateAccessToken,
  generateRefreshToken,
  getEmailVerificationHtml,
} from "../../utils/helpers";
import { Role, User } from "@prisma/client";
import PlantRepo from "../plant/plant.repo";

dotenv.config();
class AuthServices {
  /**==============================  Register New User  ============================== */
  public static registerService = async (
    payload: registerInterface,
    reqUser: any
  ) => {
    let alreadyExists = await AuthRepo.checkEmailExists(payload.email);
    if (alreadyExists) throw HttpError.alreadyExists("Email");
    if (reqUser && reqUser.allowUserCreation === false) {
      throw HttpError.forbidden("You don't have permission to create user");
    }
    // Create new Monitor User on CloudInverters Platform
    if (payload.role == "CUSTOMER") {
      logger(
        "\n\n==== Registering monitor user on CloudInverters platform ====\n\n"
      );

      const registrationResponse = await registerMonitorUser(
        payload.email,
        process.env.MONITOR_ACCOUNT_PASSWORD as string,
        process.env.MONITOR_ACCOUNT_PASSWORD as string
      );
      // logger("registrationResponse", registrationResponse);

      if (!registrationResponse.status) {
        throw HttpError.internalServerError(
          registrationResponse.message || "Failed to register monitor user"
        );
      }
    }

    payload.password = await encryptPass(payload.password);
    const user = await AuthRepo.registerRepo(payload);
    return user;
  };

  /**==============================  Login User  ============================== */
  public static loginService = async (payload: loginInterface) => {
    const user = await AuthRepo.findByEmail(payload.email);
    if (!user || !user.password) throw HttpError.notFound("User not found");

    const isMatch = await comparePass(payload.password, user.password);
    if (!isMatch) throw HttpError.unauthorized("Invalid credentials");

    if (user.TFA_enabled) {
      const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await AuthRepo.saveResetOtp(user.id, otp, expiresAt);
      let template = await getEmailVerificationHtml({
        otp: `${otp}`,
        email: user.email,
        validMinutes: 10,
        userName: user.fullName,
      });
      console.log("OTP is :", otp);
      await sendMail({
        email: user.email,
        subject: "Two-Factor Authentication OTP",
        html: template,
      });

      return { status: 401, message: "TFA enabled, OTP sent to email" };
    }
    const data = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(data);
    const refreshToken = generateRefreshToken(data);

    await AuthRepo.updateRefreshToken(user.id, refreshToken);
    let abstract = getUserData(user);
    await createLogs({
      userId: user.id,
      action: "Login",
      description: "User logged in",
    });
    return { accessToken, refreshToken, ...abstract };
  };

  /**==============================  Forget Password  ============================== */
  public static forgotPasswordService = async (email: string) => {
    const user = await AuthRepo.findByEmail(email);
    if (!user) throw HttpError.notFound("User not found");

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await AuthRepo.saveResetOtp(user.id, otp, expiresAt);
    let template = await getEmailVerificationHtml({
      otp: `${otp}`,
      email: user.email,
      validMinutes: 10,
      userName: user.fullName,
    });
    console.log("OTP is :", otp);
    await sendMail({ email, subject: "Password Reset OTP", html: template });

    return [];
  };

  /**==============================  Verify OTP  ============================== */
  public static verifyOtpService = async (
    email: string,
    otp: number,
    TFA: boolean
  ) => {
    const user = await AuthRepo.findByEmail(email);
    if (!user) throw HttpError.notFound("User not found");

    const record = await AuthRepo.verifyOtp(user.id, otp);
    if (!record) throw HttpError.badRequest("Invalid or expired OTP");
    // if (TFA) {
    const data = { id: user.id, role: user.role };
    let abstract = getUserData(user);

    const accessToken = generateAccessToken(data);
    const refreshToken = generateRefreshToken(data);
    return {
      message: "OTP verified successfully test",
      data: { accessToken, refreshToken, ...abstract },
    };
    // }
    // return { message: "OTP verified successfully", data: [] };
  };

  /**==============================  Reset Password  ============================== */
  public static resetPasswordService = async (payload: resetPassInterface) => {
    let { email, newPassword, userId } = payload;
    const user = await AuthRepo.findById(userId);
    if (!user) throw HttpError.notFound("User not found");

    // const record = await AuthRepo.verifyOtp(user.id, otp);
    // if (!record) throw HttpError.badRequest("Invalid or expired OTP");

    const hashed = await encryptPass(newPassword);
    await AuthRepo.resetPassword(user.id, hashed);

    return { message: "Password reset successful" };
  };

  /**==============================  Changed Password   ============================== */
  public static changePasswordService = async (
    userId: string,
    oldPassword: string,
    newPassword: string
  ) => {
    const user = await AuthRepo.findByEmail(userId);
    if (!user || !user.password) throw HttpError.notFound("User not found");

    const isMatch = await comparePass(oldPassword, user.password);
    if (!isMatch) throw HttpError.unauthorized("Invalid old password");

    const hashed = await encryptPass(newPassword);
    await AuthRepo.changePassword(user.id, hashed);

    return { message: "Password changed successfully" };
  };

  /**==============================  Get User By Id   ============================== */
  public static getUserByIdService = async (userId: string) => {
    const user = await AuthRepo.findById(userId);
    // logger("user", user);
    if (!user) throw HttpError.notFound("User not found");
    return getUserData(user);
  };

  /**==============================  Refresh Token  ============================== */
  public static refreshTokenService = async (refreshToken: string) => {
    const user = await AuthRepo.findByRefreshToken(refreshToken);
    if (!user) throw HttpError.unauthorized("Invalid refresh token");

    const checkExpiry = verifyRefreshToken(refreshToken);
    if (!checkExpiry) throw HttpError.unauthorized("Refresh token expired");

    const data = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(data);

    return accessToken;
  };

  /**==============================  Update User  ============================== */
  public static updateUserService = async (payload: any) => {
    const user = await AuthRepo.findById(payload.userId);
    if (!user) throw HttpError.notFound("User not found");
    return await AuthRepo.updateUser(payload);
  };

  /*===========================================================================================
                                User Management 
  ===========================================================================================*/
  
  /**==============================  User List   ============================== */
  public static userListService = async (role: Role, user: User) => {
    const users = await AuthRepo.userList(role, user);
    return users;
  };

  /**==============================  User List with Pagination   ============================== */
  public static userListFlowService = async (
    role: Role,
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    search: string,
    user: User
  ) => {
    const users = await AuthRepo.userListFlow(
      role,
      userId,
      page,
      pageSize,
      search,
      user
    );
    return users;
  };

  /**==============================  Get Activity Log   ============================== */
  public static getActivityLogService = async (payload: any) => {
    const activityLog = await AuthRepo.getActivityLogRepo(payload);
    return activityLog;
  };

  /**==============================  Get Dashboard Count   ============================== */
  public static getDashboardCountService = async (payload: any) => {
    // total user
    let users = await AuthRepo.getChildrenRecursively(payload.userId);
    let ids: any = users
      .map((u) => u.role == "CUSTOMER" && u.email)
      .filter(Boolean);

    // total plant
    let plantList = await PlantRepo.getAllPlants("", ids);

    // total capacity
    let plantsCapacity = plantList
      .map((p) => p.capacity)
      .reduce((a, b) => a + b, 0);
    // total device
    let deviceCount = plantList.map((p: any) => p.device).length;
    return {
      usersCount: users.length || 0,
      totalCapacity: plantsCapacity || 0,
      totalDevice: deviceCount || 0,
      totalPlant: plantList.length || 0,
    };
  };
}

export default AuthServices;
