import { DeviceType } from "@prisma/client";
import { prisma } from "../../imports";

class DeviceRepo {
  public static async checkDeviceRepo(sn: string) {
    const device = await prisma.device.findUnique({
      where: { sn },
    });
    return device;
  }

  public static async addDeviceRepo(
    deviceType: DeviceType,
    sn: string,
    plantId: string,
    customerId: string
  ) {
    const device = await prisma.device.create({
      data: { deviceType, sn, plantId, customerId },
    });
    return device;
  }

  public static async getPlantByIdRepo(id: string) {
    const plant = await prisma.plant.findUnique({
      where: { id },
      include: {
        customer: true,
        installer: true,
      },
    });
    return plant;
  }
}

export default DeviceRepo;
