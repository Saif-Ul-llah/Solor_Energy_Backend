import { Role, User } from "@prisma/client";
import {
  logger,
  LogsInterface,
  prisma,
  registerInterface,
} from "../../imports";

class AuthRepo {
  /**==============================  Register New User  ============================== */
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

  /**==============================  Find User By Email  ============================== */
  public static checkEmailExists = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    return user;
  };

  /**==============================  Find User By Email  ============================== */
  public static findByEmail = async (email: string) => {
    return prisma.user.findUnique({
      where: { email },
      include: { verification: true },
    });
  };

  /**==============================  Update Refresh Token  ============================== */
  public static updateRefreshToken = async (
    userId: string,
    refreshToken: string
  ) => {
    return prisma.userVerification.upsert({
      where: { userId },
      update: { refreshToken: { push: refreshToken } },
      create: { userId, refreshToken: [refreshToken] },
    });
  };

  /**==============================  Save Reset Otp  ============================== */
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

  /**==============================  Verify Otp  ============================== */
  public static verifyOtp = async (userId: string, otp: number) => {
    return prisma.userVerification.findFirst({
      where: { userId, resetOtp: otp, resetOtpExpiresAt: { gt: new Date() } },
    });
  };

  /**==============================  Reset Password  ============================== */
  public static resetPassword = async (userId: string, newPassword: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  };

  /**==============================  Changed Password   ============================== */
  public static changePassword = async (
    userId: string,
    newPassword: string
  ) => {
    return prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  };

  /**==============================  Get User By Id   ============================== */
  public static findById = async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { parent: true },
    });
  };

  /**==============================  Refresh Token  ============================== */
  public static findByRefreshToken = async (refreshToken: string) => {
    return prisma.user.findFirst({
      where: { verification: { refreshToken: { has: refreshToken } } },
    });
  };

  /**==============================  Update User  ============================== */
  public static updateUser = async (data: any) => {
    const { userId, ...rest } = data;

    // Filter out undefined and null values
    const cleanData = Object.fromEntries(
      Object.entries(rest).filter(
        ([_, value]) => value !== null && value !== undefined && value !== ""
      )
    );

    return prisma.user.update({
      where: { id: userId },
      data: cleanData,
    });
  };

  /*===========================================================================================
                                User Management 
  ===========================================================================================*/

  /*===========================  Get Children Recursively   =========================== */
  public static async getChildrenRecursively(
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

  /*===========================  Get User List   =========================== */
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

  /*=========================== Recursively Get User List with Pagination   =========================== */
  private static async getChildrenRecursivelyAllLIST(
    userId: string,
    role?: Role,
    latitude?: number,
    longitude?: number
  ): Promise<any[]> {
    const latRange = 0.1;
    const lonRange = 0.1;
    // Fetch all direct children (no pagination here)
    const children = await prisma.user.findMany({
      where: {
        parentId: userId,
        location: {
          ...(latitude && longitude
            ? {
                latitude: {
                  gte: latitude - latRange,
                  lte: latitude + latRange,
                },
                longitude: {
                  gte: longitude - lonRange,
                  lte: longitude + lonRange,
                },
              }
            : {}),
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        imageUrl: true,
        IsActive: true,
        location: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
        parent: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
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

  /*===========================  Get User List with Pagination   =========================== */
  public static async userListFlow(payload: any): Promise<any> {
    const {
      role,
      userId,
      page,
      pageSize,
      search,
      user,
      latitude,
      longitude,
      IsActive,
    } = payload;
    let forCount = await this.getChildrenRecursivelyAllLIST(userId, undefined);

    // Get all descendants (unpaginated)
    let allChildren = await this.getChildrenRecursivelyAllLIST(
      userId,
      role ?? undefined,
      latitude,
      longitude
    );

    // logger("allChildren", "info", allChildren);
    if (IsActive !== undefined) {
      allChildren = allChildren.filter(
        (user: any) => user.IsActive === IsActive
      );
    }

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
        Active : forCount.filter((user: any) => user.IsActive === true).length,
        InActive : forCount.filter((user: any) => user.IsActive === false).length,
    };
  }

  /*===========================  Get Activity Log   =========================== */
  public static async getActivityLogRepo(payload: any): Promise<any> {
    const {
      page = 1,
      pageSize = 10,
      date,
      startDate,
      endDate,
      search,
      role,
      userId,
    } = payload;
    const skip = (Math.max(page, 1) - 1) * pageSize;
    let child = await this.getChildrenRecursivelyAllLIST(userId);
    let ids = child.map((c) => c.id);
    ids = [...ids, userId];

    const where: any = { userId: { in: ids } };

    // 🕓 Handle date filtering
    if (date || (startDate && endDate)) {
      const start = new Date(startDate || date);
      const end = new Date(endDate || date);
      end.setDate(end.getDate() + 1); // include end date
      where.createdAt = { gte: start, lt: end };
    }

    // 🔍 Handle user search and role filters
    if (search || role) {
      where.user = {
        ...(search && { fullName: { contains: search, mode: "insensitive" } }),
        ...(role && { role }),
      };
    }

    // 📦 Fetch data and count in parallel for better performance
    const [activityLogs, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // 🧭 Return formatted result
    const logs = activityLogs.map((log) => ({
      id: log.id,
      action: log.action,
      description: log.description,
      createdAt: log.createdAt,
      userId: log.user?.id,
      email: log.user?.email,
      fullName: log.user?.fullName,
      role: log.user?.role,
      imageUrl: log.user?.imageUrl,
    }));

    return {
      logs,
      currentPage: page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /*===========================  Get FCM Token By User ID   =========================== */
  public static async getFcmTokenByUserId(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    return user?.fcmToken || "";
  }

  /*===========================  Logout All Devices   =========================== */
  public static async logoutAllDevices(userId: string) {
    // Clear the refresh token for the user
    return prisma.userVerification.update({
      where: { userId },
      data: { refreshToken: [] },
    });
  }

  /*===========================  Get Active Sessions   =========================== */
  public static async getActiveSessions(userId: string) {
    const userVerification = await prisma.userVerification.findUnique({
      where: { userId },
      select: { refreshToken: true },
    });

    if (!userVerification || !userVerification.refreshToken.length) {
      return [];
    }

    // Get user's recent login activity from activity logs
    const recentLogins = await prisma.activityLog.findMany({
      where: {
        userId,
        action: "Login",
      },
      orderBy: { createdAt: "desc" },
      take: userVerification.refreshToken.length,
    });

    // Create session objects with device information parsed from activity logs
    const sessions = userVerification.refreshToken.map((_, index) => {
      const login = recentLogins[index] || recentLogins[recentLogins.length - 1];
      
      // Parse device information from login description
      let deviceInfo = "Unknown Device";
      let location = "Unknown Location";
      let userAgent = "Unknown Browser";
      
      if (login?.description) {
        // Extract device info from description like "User logged in from Chrome on Windows (192.168.1.1) - Mozilla/5.0..."
        const description = login.description;
        const deviceMatch = description.match(/from (.+?) \(/);
        if (deviceMatch) {
          deviceInfo = deviceMatch[1];
        }
        
        // Extract IP from description
        const ipMatch = description.match(/\(([^)]+)\)/);
        if (ipMatch) {
          location = ipMatch[1]; // Using IP as location for now
        }
        
        // Extract user agent from description (after the dash)
        const userAgentMatch = description.match(/ - (.+)$/);
        if (userAgentMatch) {
          userAgent = userAgentMatch[1];
        }
      }
      
      return {
        sessionId: `session_${index + 1}`,
        deviceInfo,
        location,
        lastActive: login?.createdAt || new Date(),
        userAgent,
      };
    });

    return sessions;
  }

  //push data to server data table
  public static async pushDataToServerData(data: any) {
    return prisma.thirdPartyUserData.create({
      data,
      
    });
  }
}

export default AuthRepo;
