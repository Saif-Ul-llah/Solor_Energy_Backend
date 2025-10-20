import { Role, User } from "@prisma/client";
import {
  logger,
  LogsInterface,
  prisma,
  registerInterface,
} from "../../imports";

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
      include: { parent: true },
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
      Object.entries(rest).filter(
        ([_, value]) => value !== null && value !== undefined
      )
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
    let list: any = await this.getChildrenRecursively(
      user.id,
      role ?? undefined
    );
    if (role === user.role)
      list.push({
        id: user.id as string,
        email: user.email as string,
        fullName: user.fullName as string,
        role: user.role as Role,
      });
    return list;
  }
  private static async getChildrenRecursivelyAllLIST(
    userId: string,
    role?: Role
  ): Promise<any[]> {
    // Fetch all direct children (no pagination here)
    const children = await prisma.user.findMany({
      where: { parentId: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        imageUrl: true,
        IsActive: true,
        parent: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            imageUrl: true,
          },
        },
      },
    });

    let allChildren: any[] = [];

    for (const child of children) {
      // Include only matching roles
      if (!role || child.role === role) {
        allChildren.push(child);
      }

      // Recursively get descendants (no pagination)
      const childDescendants = await this.getChildrenRecursivelyAllLIST(
        child.id,
        role
      );

      allChildren = [...allChildren, ...childDescendants];
    }

    return allChildren;
  }

  public static async userListFlow(
    role: Role | null,
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    search: string,
    user: User
  ): Promise<any> {
    let forCount = await this.getChildrenRecursivelyAllLIST(userId, undefined);

    // Get all descendants (unpaginated)
    let allChildren = await this.getChildrenRecursivelyAllLIST(
      userId,
      role ?? undefined
    );
    if (search) {
      allChildren = allChildren.filter((user: any) =>
        user.fullName.toLowerCase().includes(search.toLowerCase())
      );
    }
    // Pagination applied here globally
    const total = allChildren.length;
    const totalPages = Math.ceil(total / pageSize);
    const validPage = Math.max(page, 1);
    const start = (validPage - 1) * pageSize;
    const paginatedChildren = allChildren.slice(start, start + pageSize);

    return {
      users: paginatedChildren,
      currentPage: validPage,
      pageSize,
      total,
      totalPages,
      recordsCount: forCount.length,
      ...(user.role === "ADMIN"
        ? {
            subAdmin: forCount.filter((user: any) => user.role === "SUB_ADMIN")
              .length,
          }
        : {}),
      ...(user.role === "ADMIN" || user.role === "SUB_ADMIN"
        ? {
            distributor: forCount.filter(
              (user: any) => user.role === "DISTRIBUTOR"
            ).length,
          }
        : {}),
      ...(user.role === "ADMIN" ||
      user.role === "SUB_ADMIN" ||
      user.role === "DISTRIBUTOR"
        ? {
            installer: forCount.filter((user: any) => user.role === "INSTALLER")
              .length,
          }
        : {}),
      ...(user.role === "ADMIN" ||
      user.role === "SUB_ADMIN" ||
      user.role === "DISTRIBUTOR" ||
      user.role === "INSTALLER"
        ? {
            customer: forCount.filter((user: any) => user.role === "CUSTOMER")
              .length,
          }
        : {}),
    };
  }

public static async getActivityLogRepo(payload: any): Promise<any> {
  const { page, pageSize } = payload;
  const validPage = Math.max(page, 1);
  const skip = (validPage - 1) * pageSize;

  const where: any = {
    userId: payload.userId,
  };

  // ✅ Add date range filter if payload.date is present
  if (payload.date) {
    const startOfDay = new Date(payload.date); // e.g. 2025-10-20T00:00:00.000Z
    const endOfDay = new Date(payload.date);
    endOfDay.setDate(endOfDay.getDate() + 1); // e.g. 2025-10-21T00:00:00.000Z

    where.createdAt = {
      gte: startOfDay,
      lt: endOfDay,
    };
  }

  // ✅ Add search filter if payload.search is present
  if (payload.search) {
    where.user = {
      fullName: {
        contains: payload.search,
        mode: "insensitive",
      },
    };
  }

  // ✅ Fetch paginated activity logs
  const activityLogs = await prisma.activityLog.findMany({
    skip: skip || 0,
    take: pageSize,
    where,
    select: {
      id: true,
      action: true,
      description: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          imageUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // ✅ Total count for pagination
  const total = await prisma.activityLog.count({ where });

  if (activityLogs.length > 0) {
    const result = activityLogs.map((log: any) => ({
      id: log.id,
      action: log.action,
      description: log.description,
      createdAt: log.createdAt,
      userId: log.user.id,
      email: log.user.email,
      fullName: log.user.fullName,
      role: log.user.role,
      imageUrl: log.user.imageUrl,
    }));

    return {
      logs: result,
      currentPage: page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  return [];
}

}

export default AuthRepo;
