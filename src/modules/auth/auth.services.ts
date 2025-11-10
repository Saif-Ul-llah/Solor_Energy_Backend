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
import { LogType, Role, User } from "@prisma/client";
import PlantRepo from "../plant/plant.repo";

dotenv.config();

// Helper function to extract device information from request headers
const getDeviceInfo = (req: any) => {
  const userAgent = req?.headers?.['user-agent'] || 'Unknown Browser';
  const ip = req?.ip || req?.connection?.remoteAddress || 'Unknown IP';
  
  // Parse user agent to get browser and OS info
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return {
    browser,
    os,
    userAgent,
    ip,
    deviceInfo: `${browser} on ${os}`,
    location: 'Unknown Location' // Could be enhanced with IP geolocation
  };
};

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
    
    // Create activity log for user registration
    if (reqUser) {
      await createLogs({
        userId: reqUser.id,
        action: "Create User",
        logType: LogType.USER,
        description: `Created new user ${payload.fullName} (${payload.email}) with role ${payload.role}`,
        logData: {
          newUserId: user.id,
          newUserEmail: user.email,
          newUserRole: user.role,
          createdBy: reqUser.email,
        },
      });
    }
    
    return user;
  };

  /**==============================  Login User  ============================== */
  public static loginService = async (payload: loginInterface, req?: any) => {
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
    
    // Extract device information from request
    const deviceInfo = req ? getDeviceInfo(req) : {
      deviceInfo: 'Unknown Device',
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      userAgent: 'Unknown User Agent',
      ip: 'Unknown IP',
      location: 'Unknown Location'
    };
    
    await createLogs({
      userId: user.id,
      action: "Login",
      logType: LogType.USER,
      description: `User logged in from ${deviceInfo.deviceInfo} (${deviceInfo.ip}) - ${deviceInfo.userAgent}`,
      logData: {
        deviceInfo: deviceInfo.deviceInfo,
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        location: deviceInfo.location,
      },
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
    await createLogs({
      userId: user.id,
      logType: LogType.USER,
      action: "Forgot Password",
      description: "Requested password reset OTP",
      logData: {
        email: email,
        expiresAt: expiresAt,
      },
    });
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

    // Log password reset
    await createLogs({
      userId: user.id,
      action: "Reset Password",
      logType: LogType.USER,
      description: `Password was reset successfully for ${user.email}`,
    });

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

    // Log password change
    await createLogs({
      userId: user.id,
      action: "Change Password",
      logType: LogType.USER,
      description: `Password was changed successfully`,
    });

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
    
    const updatedUser = await AuthRepo.updateUser(payload);
    
    // Log user update
    await createLogs({
      userId: payload.userId,
      action: "Update User",
      logType: LogType.USER,
      description: `User profile updated for ${user.email}`,
      logData: {
        updatedFields: Object.keys(payload).filter(key => key !== 'userId'),
        userId: payload.userId,
      },
    });
    
    return updatedUser;
  };

  /*===========================================================================================
                                User Management 
  ===========================================================================================*/

  /**==============================  User List   ============================== */
  public static userListService = async (role: Role, user: User) => {
    return await AuthRepo.userList(role, user);
  };

  /**==============================  User List with Pagination   ============================== */
  public static userListFlowService = async (payload: any) => {
    return await AuthRepo.userListFlow(payload);
  };

  /**==============================  Get Activity Log   ============================== */
  public static getActivityLogService = async (payload: any) => {
    return await AuthRepo.getActivityLogRepo(payload);
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
      subAdminCount: users.filter((user: any) => user.role === "SUB_ADMIN").length || 0,
      distributorCount: users.filter((user: any) => user.role === "DISTRIBUTOR").length || 0,
      installerCount: users.filter((user: any) => user.role === "INSTALLER").length || 0,
      customerCount: users.filter((user: any) => user.role === "CUSTOMER").length || 0,
    };
  };

  /**==============================  Logout All Devices  ============================== */
  public static logoutAllDevicesService = async (userId: string) => {
    await AuthRepo.logoutAllDevices(userId);
    
    // Create activity log
    await createLogs({
      userId,
      action: "Logout All Devices",
      logType: LogType.USER,
      description: "User logged out from all devices",
    });

    return { message: "Successfully logged out from all devices" };
  };

  /**==============================  Get Active Sessions  ============================== */
  public static getActiveSessionsService = async (userId: string) => {
    const sessions = await AuthRepo.getActiveSessions(userId);
    
    return {
      sessions,
      totalSessions: sessions.length,
      message: "Active sessions retrieved successfully"
    };
  };

  /**==============================  Logout Single Device  ============================== */
  public static logoutSingleDeviceService = async (
    userId: string, 
    refreshToken: string, 
    clearFcmToken: boolean = false,
    req?: any
  ) => {
    const result = await AuthRepo.logoutSingleDevice(userId, refreshToken, clearFcmToken);
    
    // Extract device information from request
    const deviceInfo = req ? getDeviceInfo(req) : {
      deviceInfo: 'Unknown Device',
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      userAgent: 'Unknown User Agent',
      ip: 'Unknown IP',
      location: 'Unknown Location'
    };
    
    // Create activity log
    await createLogs({
      userId,
      action: "Logout Single Device",
      logType: LogType.USER,
      description: `User logged out from ${deviceInfo.deviceInfo} (${deviceInfo.ip})${clearFcmToken ? ' - FCM Token Cleared' : ''}`,
      logData: {
        deviceInfo: deviceInfo.deviceInfo,
        ip: deviceInfo.ip,
        userAgent: deviceInfo.userAgent,
        clearFcmToken,
        remainingSessions: result.remainingSessions,
      },
    });

    return {
      message: result.message,
      remainingSessions: result.remainingSessions,
    };
  };
}

export default AuthServices;
