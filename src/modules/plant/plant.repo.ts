import { prisma, registerInterface } from "../../imports";

class PlantRepo {
  // public static registerRepo = async (payload: registerInterface) => {
  //   const user = await prisma.user.create({
  //     data: payload,
  //     select: {
  //       id: true,
  //       email: true,
  //       role: true,
  //       fullName: true,
  //       phoneNumber: true,
  //     },
  //   });
  //   return user;
  // };

  public static createPlant = async (payload: any) => {
    const plant = await prisma.plant.create({
      data: payload,
    });
    return plant;
  };
}

export default PlantRepo;
