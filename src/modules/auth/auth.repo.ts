import { Role, User } from "@prisma/client";
import { prisma, registerInterface } from "../../imports";

class AuthRepo {
  public static registerRepo = async (payload: registerInterface) => {
    const { parentId, ...rest } = payload;
    if (payload.role === "ADMIN") {
      const users = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
      if (users) throw new Error("Only one ADMIN user is allowed");
    }
    if (payload.role !== "ADMIN") {
      const parentUser = await prisma.user.findUnique({
        where: { id: parentId },
      });
      if (!parentUser) throw new Error("Parent user not found");
      // if(parentUser.role === 'CUSTOMER' || parentUser.role === 'INSTALLER') throw new Error('Parent user must be ADMIN, SUB_ADMIN or DISTRIBUTOR');
      // if(parentUser.role === 'DISTRIBUTOR' && (payload.role === 'ADMIN' || payload.role === 'SUB_ADMIN')) throw new Error('DISTRIBUTOR cannot create ADMIN or SUB_ADMIN');
      // if(parentUser.role === 'SUB_ADMIN' && (payload.role === 'ADMIN' || payload.role === 'SUB_ADMIN' || payload.role === 'DISTRIBUTOR')) throw new Error('SUB_ADMIN cannot create ADMIN, SUB_ADMIN or DISTRIBUTOR');
      // if(parentUser.role === 'INSTALLER' && payload.role !== 'CUSTOMER') throw new Error('INSTALLER can only create CUSTOMER');
    }
    const user = await prisma.user.create({
      data: { ...rest, parentId: payload.role === "ADMIN" ? null : parentId },
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

  // ================ User Management =================
  private static async getChildrenRecursively(
    userId: string,
    role?: Role
  ): Promise<User[]> {
    const whereClause = role
      ? { role, parentId: userId }
      : { parentId: userId };

    const children = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    let allChildren: any = [...children];

    // Recursively fetch children's children
    for (const child of children) {
      const childDescendants = await this.getChildrenRecursively(
        child.id,
        role
      );
      allChildren = [...allChildren, ...childDescendants];
    }

    return allChildren;
  }

  // Public function to get all descendants of a user
  public static async userList(role: Role | null, user: User): Promise<User[]> {
    return this.getChildrenRecursively(user.id, role ?? undefined);
  }
}

export default AuthRepo;
