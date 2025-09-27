import {
  encryptPass,
  comparePass,
  HttpError,
  registerInterface,
  loginInterface,
  resetPassInterface,
} from "../../imports";
import AuthRepo from "./auth_repo";
import { generateAccessToken, generateRefreshToken } from "../../utils/helpers";

class AuthServices {
  public static registerService = async (payload: registerInterface) => {
    let alreadyExists = await AuthRepo.checkEmailExists(payload.email);
    if (alreadyExists) throw HttpError.alreadyExists("Email");
    payload.password = await encryptPass(payload.password);
    const user = await AuthRepo.registerRepo(payload);
    return user;
  };

  public static loginService = async (payload: loginInterface) => {
    const user = await AuthRepo.findByEmail(payload.email);
    if (!user || !user.password) throw HttpError.notFound("User not found");

    const isMatch = await comparePass(payload.password, user.password);
    if (!isMatch) throw HttpError.unauthorized("Invalid credentials");

    const data = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(data);
    const refreshToken = generateRefreshToken(data);

    await AuthRepo.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  };

  public static forgotPasswordService = async (email: string) => {
    const user = await AuthRepo.findByEmail(email);
    if (!user) throw HttpError.notFound("User not found");

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await AuthRepo.saveResetOtp(user.id, otp, expiresAt);

    // TODO: send OTP via email/SMS
    return { otp }; // remove in prod
  };

  public static verifyOtpService = async (email: string, otp: number) => {
    const user = await AuthRepo.findByEmail(email);
    if (!user) throw HttpError.notFound("User not found");

    const record = await AuthRepo.verifyOtp(user.id, otp);
    if (!record) throw HttpError.badRequest("Invalid or expired OTP");

    return { message: "OTP verified successfully" };
  };

  public static resetPasswordService = async (payload: resetPassInterface) => {
    let { email, newPassword } = payload;
    const user = await AuthRepo.findByEmail(email);
    if (!user) throw HttpError.notFound("User not found");

    // const record = await AuthRepo.verifyOtp(user.id, otp);
    // if (!record) throw HttpError.badRequest("Invalid or expired OTP");

    const hashed = await encryptPass(newPassword);
    await AuthRepo.resetPassword(user.id, hashed);

    return { message: "Password reset successful" };
  };

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
}

export default AuthServices;
