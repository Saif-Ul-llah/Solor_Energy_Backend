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

  // Get Device By Id
  public static async getDeviceByIdRepo(sn: string) {
    const device = await prisma.device.findUnique({
      where: { sn },
      include: {
        customer: true,
        plant: {
          include: { installer: true,location: true },
        },
      },
    });
    return device;
  }
  // Upload Firmware Repo
  public static async uploadFirmwareRepo(data: any) {
    const firmware = await prisma.firmware.create({
      data,
    });
    return firmware;
  }
}

export default DeviceRepo;
