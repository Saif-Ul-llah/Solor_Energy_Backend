"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.verifyOTP = exports.forgotPassword = exports.googleLogin = exports.appleLogin = exports.login = exports.register = void 0;
const imports_1 = require("../../imports");
const jwt = __importStar(require("jsonwebtoken"));
exports.register = (0, imports_1.asyncHandler)(async (req, res, next) => {
    //   const { email, password, fullName, phoneNumber } = req.body;
    //   const existingUser = await prisma.user.findUnique({ where: { email } });
    //   if (existingUser) {
    //     return sendResponse(res, 400, "User already exists.");
    //   }
    //   const hashedPassword = await bcrypt.hash(password, 10);
    //   const user = await prisma.user.create({
    //     data: {
    //       email,
    //       password: hashedPassword,
    //       fullName,
    //       phoneNumber,
    //     },
    //   });
    //   const otp = await generateOTP();
    //   const otpExpiry = new Date();
    //   otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);
    //   await prisma.userVerification.create({
    //     data: {
    //       userId: user.id,
    //       resetOtp: otp,
    //       resetOtpExpiresAt: otpExpiry,
    //     },
    //   });
    //   const mailOptions = {
    //     from: appConfig.emailUser,
    //     // to: email,
    //     to: appConfig.emailTo,
    //     html: getSignUpHtml(fullName, otp.toString()),
    //     subject: "Verify your account",
    //     text: `Your OTP is ${otp}. It is valid for 15 minutes.`,
    //   };
    //   await transporter.sendMail(mailOptions);
    //   return sendResponse(
    //     res,
    //     201,
    //     "Registration successful. Please check your email for verification."
    //   );
});
exports.login = (0, imports_1.asyncHandler)(async (req, res, next) => {
    //   const { email, password } = req.body;
    //   const user = await prisma.user.findUnique({ where: { email } });
    //   if (!user) {
    //     return sendResponse(res, 404, "User not found.");
    //   }
    //   const isPasswordValid = await comparepassword(password, user.password);
    //   if (!isPasswordValid) {
    //     return sendResponse(res, 401, "Invalid credentials.");
    //   }
    //   const token = await generateToken({ id: user.id, email: user.email });
    //   return sendResponse(res, 200, "Login successful.", { user, token });
});
exports.appleLogin = (0, imports_1.asyncHandler)(async (req, res, next) => {
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
});
exports.googleLogin = (0, imports_1.asyncHandler)(async (req, res, next) => {
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
});
exports.forgotPassword = (0, imports_1.asyncHandler)(async (req, res, next) => {
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
});
exports.verifyOTP = (0, imports_1.asyncHandler)(async (req, res, next) => {
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
});
exports.resetPassword = (0, imports_1.asyncHandler)(async (req, res, next) => {
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
});
exports.changePassword = (0, imports_1.asyncHandler)(async (req, res, next) => {
    // const { oldPassword, newPassword } = req.body;
    // const email = req.user.email;
    // const user = await prisma.user.findUnique({ where: { email } });
    // if (!user) {
    //   return sendResponse(res, 404, "User not found.");
    // }
    // const isPasswordValid = await comparepassword(oldPassword, user.password);
    // if (!isPasswordValid) {
    //   return sendResponse(res, 401, "Old password is incorrect.");
    // }
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    // await prisma.user.update({
    //   where: { email },
    //   data: { password: hashedPassword },
    // });
    // return sendResponse(res, 200, "Password changed successfully.");
});
async function decodeSocialToken(provider, token) {
    if (provider === "GOOGLE") {
        const googleData = await verifyGoogleToken(token);
        return googleData
            ? {
                email: googleData.email,
                fullName: googleData.name,
                profileUrl: googleData.picture,
            }
            : null;
    }
    else if (provider === "APPLE") {
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
async function verifyGoogleToken(token) {
    const payload = jwt.decode(token);
    if (!payload)
        return null;
    console.log(`Google Payload: ${JSON.stringify(payload)}`);
    return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
    };
}
async function verifyAppleToken(token) {
    const payload = jwt.decode(token);
    if (!payload)
        return null;
    console.log(`Apple Payload: ${JSON.stringify(payload)}`);
    return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
    };
}
