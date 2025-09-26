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
}

export default AuthRepo;
