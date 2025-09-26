import { prisma, registerInterface } from "../../imports";

class AuthRepo {
  public static registerRepo = async (payload: registerInterface) => {
    const user = await prisma.user.create({
      data: payload,
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        phoneNumber: true,
      },
    });
    return user;
  };

  public static checkEmailExists = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  };
  public static findByEmail = async (email: string) => {
    return prisma.user.findUnique({
      where: { email },
      include: { verification: true },
    });
  };

  public static updateRefreshToken = async (
    userId: string,
    refreshToken: string
  ) => {
    return prisma.userVerification.upsert({
      where: { userId },
      update: { refreshToken },
      create: { userId, refreshToken },
    });
  };

  public static saveResetOtp = async (
    userId: string,
    otp: number,
    expiresAt: Date
  ) => {
    return prisma.userVerification.upsert({
      where: { userId },
      update: { resetOtp: otp, resetOtpExpiresAt: expiresAt },
      create: { userId, resetOtp: otp, resetOtpExpiresAt: expiresAt },
    });
  };

  public static verifyOtp = async (userId: string, otp: number) => {
    return prisma.userVerification.findFirst({
      where: { userId, resetOtp: otp, resetOtpExpiresAt: { gt: new Date() } },
    });
  };

  public static resetPassword = async (userId: string, newPassword: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  };

  public static changePassword = async (
    userId: string,
    newPassword: string
  ) => {
    return prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  };
}

export default AuthRepo;
