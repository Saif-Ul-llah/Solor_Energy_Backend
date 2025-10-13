import { DeviceType } from "@prisma/client";
import {
  getSign,
  HttpError,
  logger,
  dotenv,
  insertInverterInfo,
} from "../../imports";
import DeviceRepo from "./device.repo";
dotenv.config();

class DeviceService {
  public static checkDeviceService = async (sn: any) => {
    const device = await DeviceRepo.checkDeviceRepo(sn);
    return device;
  };

  public static addDeviceService = async (
    deviceType: DeviceType,
    sn: string,
    plantId: string
  ) => {
    //check plant exists
    const plant = await DeviceRepo.getPlantByIdRepo(plantId);
    if (!plant) throw new HttpError("Plant does not exist", "not-found", 404);
    // check device exists
    const device = await DeviceRepo.checkDeviceRepo(sn);
    if (device) throw new HttpError("Device already exists", "conflict", 409);
    // bind device to plant on cloud platform
    const bind: any = insertInverterInfo(
      plant.customer.email,
      plant.AutoId || "",
      sn
    );
    if (bind.status) {
      const customerId = plant.customerId;
      const add = await DeviceRepo.addDeviceRepo(
        deviceType,
        sn,
        plantId,
        customerId
      );
      return add;
    }
    return { message: "Failed to add device" };
  };
}

export default DeviceService;
