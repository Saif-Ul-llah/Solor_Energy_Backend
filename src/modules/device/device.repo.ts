import { DeviceType } from "@prisma/client";
import { prisma } from "../../imports";

class DeviceRepo {
  public static async checkDeviceRepo(sn: string) {
    const device = await prisma.device.findUnique({
      where: { sn },
      include: {
        customer: true,
        plant: true,
      },
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
          include: { installer: true, location: true },
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

  // Get Firmware List Repo
  public static async getFirmwareListRepo(userId: string) {
    const firmwareList = await prisma.firmware.findMany({
      where: { userId },
      orderBy: { releaseDate: "desc" },
      select: {
        id: true,
        name: true,
        version: true,
        releaseDate: true,
        releaseNote: true,
        deviceType: true,
        url: true,
        user: {
          select: {
            id: true,
            fullName: true,
            imageUrl: true,
            role: true,
          },
        },
      },
    });
    if (!firmwareList || firmwareList.length === 0) return [];

    return firmwareList.map((firmware) => ({
      id: firmware.id,
      name: firmware.name,
      version: firmware.version,
      releaseDate: firmware.releaseDate,
      releaseNote: firmware.releaseNote,
      deviceType: firmware.deviceType,
      url: firmware.url,
      fullName: firmware.user.fullName,
      imageUrl: firmware.user.imageUrl,
      role: firmware.user.role,
      userId: firmware.user.id,
    }));
  }

  // Delete Device Repo
  public static async deleteDeviceRepo(userId: string, sn: string) {
    const device = await prisma.device.delete({
      where: { sn },
    });
    return device;
  }

  // Get SN List Repo
  public static async getSnListRepo(customerIds: string[]) {
    const snList = await prisma.device.findMany({
      where: { customerId: { in: customerIds } },
      select: {
        sn: true,
      },
      distinct: ["sn"],
    });
    return snList.map((it: any) => it.sn) || [];
  }

  // Get Device List By userId
  public static async getDeviceListByUserIdRepo(userIds: string[]) {
    const deviceList = await prisma.device.findMany({
      where: { customerId: { in: userIds } ,deviceType: "BATTERY"},
      include: {
        plant: true,
      },
    });
    return deviceList;
  }

  // Get Device List By userId and DeviceType
  public static async getDeviceListByUserIdAndTypeRepo(
    userIds: string[],
    deviceType: DeviceType
  ) {
    const deviceList = await prisma.device.findMany({
      where: { 
        customerId: { in: userIds },
        deviceType: deviceType
      },
      include: {
        plant: true,
        customer: true,
      },
    });
    return deviceList;
  }
}

export default DeviceRepo;
