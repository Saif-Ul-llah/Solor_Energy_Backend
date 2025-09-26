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
}

export default AuthRepo;
