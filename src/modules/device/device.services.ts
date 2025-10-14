import { DeviceType, User } from "@prisma/client";
import {
  getSign,
  HttpError,
  logger,
  dotenv,
  insertInverterInfo,
  getEndUserInfo,
  getGroupList,
} from "../../imports";
import DeviceRepo from "./device.repo";
import PlantRepo from "../plant/plant.repo";
import PlantServices from "../plant/plant.services";
dotenv.config();

class DeviceService {
  // Check if device exists
  public static checkDeviceService = async (sn: any) => {
    const device = await DeviceRepo.checkDeviceRepo(sn);
    return device;
  };

  // Add device
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
    const bind: any = await insertInverterInfo(
      plant.customer.email,
      plant.AutoId || "",
      sn
    );
    logger("bind", bind, plant.customer.email, plant.AutoId || "", sn);
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
    return null;
  };

  // Get All devices for home page
  public static getAllDeviceListService = async (
    user: User,
    deviceType: DeviceType,
    status: string,
    page: number,
    pageSize: number
  ) => {
    //======================================= Get user list from recursive function =======================================
    // 1️ Get all child installers recursively
    const userIdsList = await PlantRepo.getChildrenRecursively(user.id, "");
    //======================================= Get There customers list =======================================
    // 2 Build installer email list
    const memberIds = userIdsList.map((child: any) => child.email);

    // 3️ Fetch all monitoring users once
    const monitorUsers = await getEndUserInfo();
    // 4 Filter only users present in both lists
    const validMonitorUsers = monitorUsers.filter((u: any) =>
      memberIds.includes(u.MemberID)
    );
    //======================================= Get there plants list with their devices =======================================
    // 5 Get Our DB Plants lists
    let plantsWithDevices = await PlantRepo.getAllPlants(
      user,
      validMonitorUsers.map((u: any) => u.MemberID)
    );

    // ====================================== Get there device list for each plant =======================================
    let devicesList = await Promise.all(
      plantsWithDevices.map((plant: any) =>
        PlantServices.getDeviceListOfPlantService(
          plant.AutoId,
          deviceType,
          plant.customer.email
        )
      )
    );
    // const device = await DeviceRepo.getAllDeviceListRepo();
    // return device;
    let flatDevicesList = devicesList.flat();

    // return flatDevicesList;
    const validStatuses = ["OFFLINE", "STANDBY", "FAULT", "ONLINE"];

    if (status && validStatuses.includes(status)) {
      let newData = flatDevicesList.filter(
        (plant: any) => plant.status === status
      );
      // Ensure valid page number (minimum 1)
      const validPage = Math.max(page, 1);

      // Calculate skip and take for slicing the array
      const skip = (validPage - 1) * pageSize;
      const take = pageSize;

      // Get the total number of items in the array
      const total = newData.length;

      // Slice the array to get the paginated items
      const paginatedResults = newData.slice(skip, skip + take);

      // Return the response in the desired format
      return {
        devices: paginatedResults, // Paginated plant list
        currentPage: validPage,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const validPage = Math.max(page, 1);

    // Calculate skip and take for slicing the array
    const skip = (validPage - 1) * pageSize;
    const take = pageSize;

    // Get the total number of items in the array
    const total = flatDevicesList.length;

    // Slice the array to get the paginated items
    const paginatedResults = flatDevicesList.slice(skip, skip + take);

    // Return the response in the desired format
    return {
      devices: paginatedResults, // Paginated plant list
      currentPage: validPage,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  };
}

export default DeviceService;
