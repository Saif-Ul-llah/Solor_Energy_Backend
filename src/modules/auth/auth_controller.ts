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
}
export default AuthController;

// export const register = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     //   const { email, password, fullName, phoneNumber } = req.body;
//     //   const existingUser = await prisma.user.findUnique({ where: { email } });
//     //   if (existingUser) {
//     //     return sendResponse(res, 400, "User already exists.");
//     //   }
//     //   const hashedPassword = await bcrypt.hash(password, 10);
//     //   const user = await prisma.user.create({
//     //     data: {
//     //       email,
//     //       password: hashedPassword,
//     //       fullName,
//     //       phoneNumber,
//     //     },
//     //   });
//     //   const otp = await generateOTP();
//     //   const otpExpiry = new Date();
//     //   otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
//     //   await prisma.userVerification.create({
//     //     data: {
//     //       userId: user.id,
//     //       resetOtp: otp,
//     //       resetOtpExpiresAt: otpExpiry,
//     //     },
//     //   });
//     //   const mailOptions = {
//     //     from: appConfig.emailUser,
//     //     // to: email,
//     //     to: appConfig.emailTo,
//     //     html: getSignUpHtml(fullName, otp.toString()),
//     //     subject: "Verify your account",
//     //     text: `Your OTP is ${otp}. It is valid for 15 minutes.`,
//     //   };
//     //   await transporter.sendMail(mailOptions);
//     //   return sendResponse(
//     //     res,
//     //     201,
//     //     "Registration successful. Please check your email for verification."
//     //   );
//   }
// );

// export const login = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     //   const { email, password } = req.body;
//     //   const user = await prisma.user.findUnique({ where: { email } });
//     //   if (!user) {
//     //     return sendResponse(res, 404, "User not found.");
//     //   }
//     //   const isPasswordValid = await comparePassword(password, user.password);
//     //   if (!isPasswordValid) {
//     //     return sendResponse(res, 401, "Invalid credentials.");
//     //   }
//     //   const token = await generateToken({ id: user.id, email: user.email });
//     //   return sendResponse(res, 200, "Login successful.", { user, token });
//   }
// );

export const appleLogin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    //   const { appleToken } = req.body;
    //   const payload: any = await decodeSocialToken("APPLE", appleToken);
    //   if (!payload) {
    //     return sendResponse(res, 400, "Invalid Apple token.");
    //   }
    //   let user = await prisma.user.findUnique({
    //     where: { email: payload.email },
    //   });
    //   if (!user) {
    //     user = await prisma.user.create({
    //       data: {
    //         email: payload.email,
    //         fullName: payload.fullName,
    //         url: payload.picture,
    //         provider: "APPLE",
    //       },
    //     });
    //   }
    //   const token = await generateToken({ id: user.id, email: user.email });
    //   return sendResponse(res, 200, "Apple Login successful", { user, token });
  }
);

export const googleLogin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // const { googleToken } = req.body;
    // const payload: any = await decodeSocialToken("GOOGLE", googleToken);
    // if (!payload) {
    //   return sendResponse(res, 400, "Invalid Google token.");
    // }
    // let user = await prisma.user.findUnique({
    //   where: { email: payload.email },
    // });
    // if (!user) {
    //   user = await prisma.user.create({
    //     data: {
    //       email: payload.email,
    //       fullName: payload.fullName,
    //       url: payload.picture,
    //       provider: "GOOGLE",
    //     },
    //   });
    // }
    // const token = await generateToken({ id: user.id, email: user.email });
    // return sendResponse(res, 200, "Google Login successful", { user, token });
  }
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // const { email } = req.body;
    // const user = await prisma.user.findUnique({ where: { email } });
    // if (!user) {
    //   return sendResponse(res, 404, "User not found.");
    // }
    // const otp = await generateOTP();
    // const otpExpiry = new Date();
    // otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
    // await prisma.userVerification.update({
    //   where: { userId: user.id },
    //   data: { resetOtp: otp, resetOtpExpiresAt: otpExpiry },
    // });
    // const mailOptions = {
    //   from: appConfig.emailUser,
    //   // to: email,
    //   html: getEmailVerificationHtml(user.fullName ?? "", otp.toString()),
    //   to: appConfig.emailTo,
    //   subject: "Reset your password",
    //   text: `Your OTP is ${otp}. It is valid for 15 minutes.`,
    // };
    // await transporter.sendMail(mailOptions);
    // return sendResponse(res, 200, "OTP sent to email.");
  }
);

export const verifyOTP = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    //   const { email, otp } = req.body;
    //   const user = await prisma.user.findUnique({ where: { email } });
    //   if (!user) {
    //     return sendResponse(res, 404, "User not found.");
    //   }
    //   const userVerification = await prisma.userVerification.findUnique({
    //     where: { userId: user.id },
    //   });
    //   if (!userVerification || userVerification.resetOtp !== parseInt(otp)) {
    //     return sendResponse(res, 400, "Invalid OTP.");
    //   }
    //   if (
    //     userVerification.resetOtpExpiresAt == null ||
    //     userVerification.resetOtpExpiresAt < new Date()
    //   ) {
    //     return sendResponse(res, 400, "OTP has expired.");
    //   }
    //   await prisma.userVerification.update({
    //     where: { userId: user.id },
    //     data: {
    //       isEmailVerified: "VERIFIED",
    //       resetOtp: null,
    //       resetOtpExpiresAt: null,
    //     },
    //   });
    //   const token = await generateToken({ id: user.id, email: user.email });
    //   return sendResponse(res, 200, "OTP verified successfully.", { token });
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { newPassword } = req.body;
    // const email = req.user.email;

    // const user = await prisma.user.findUnique({ where: { email } });
    // if (!user) {
    //   return sendResponse(res, 404, "User not found.");
    // }

    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    // await prisma.user.update({
    //   where: { email },
    //   data: { password: hashedPassword },
    // });

    // return sendResponse(res, 200, "Password reset successfully.");
  }
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // const { oldPassword, newPassword } = req.body;
    // const email = req.user.email;
    // const user = await prisma.user.findUnique({ where: { email } });
    // if (!user) {
    //   return sendResponse(res, 404, "User not found.");
    // }
    // const isPasswordValid = await comparePassword(oldPassword, user.password);
    // if (!isPasswordValid) {
    //   return sendResponse(res, 401, "Old password is incorrect.");
    // }
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    // await prisma.user.update({
    //   where: { email },
    //   data: { password: hashedPassword },
    // });
    // return sendResponse(res, 200, "Password changed successfully.");
  }
);

async function decodeSocialToken(
  provider: string,
  token: string
): Promise<{
  email: string;
  fullName: string;
  profileUrl?: string;
  phone?: string;
} | null> {
  if (provider === "GOOGLE") {
    const googleData = await verifyGoogleToken(token);
    return googleData
      ? {
          email: googleData.email,
          fullName: googleData.name,
          profileUrl: googleData.picture,
        }
      : null;
  } else if (provider === "APPLE") {
    const appleData = await verifyAppleToken(token);
    return appleData
      ? {
          email: appleData.email,
          fullName: appleData.name,
          profileUrl: appleData.picture,
        }
      : null;
  }
  return null;
}

async function verifyGoogleToken(token: string): Promise<{
  email: string;
  name: string;
  picture?: string;
} | null> {
  const payload: any = jwt.decode(token);
  if (!payload) return null;

  console.log(`Google Payload: ${JSON.stringify(payload)}`);
  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

async function verifyAppleToken(token: string): Promise<{
  email: string;
  name: string;
  picture?: string;
} | null> {
  const payload: any = jwt.decode(token);
  if (!payload) return null;
  console.log(`Apple Payload: ${JSON.stringify(payload)}`);
  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}
