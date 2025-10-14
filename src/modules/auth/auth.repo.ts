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
        imageUrl: true,
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

  public static findById = async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  };

  public static findByRefreshToken = async (refreshToken: string) => {
    return prisma.user.findFirst({
      where: { verification: { refreshToken } },
    });
  };

public static updateUser = async (data: any) => {
  const { userId, ...rest } = data;

  // Filter out undefined and null values
  const cleanData = Object.fromEntries(
    Object.entries(rest).filter(([_, value]) => value !== null && value !== undefined)
  );

  return prisma.user.update({
    where: { id: userId },
    data: cleanData,
  });
};

  // ================ User Management =================
  private static async getChildrenRecursively(
    userId: string,
    role?: Role
  ): Promise<User[]> {
    // always fetch all children regardless of role
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    let allChildren: any[] = [];

    for (const child of children) {
      // if child matches the role, add it
      if (!role || child.role === role) {
        allChildren.push(child);
      }

      // recurse for deeper levels
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
