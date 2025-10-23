import { DeviceType, User } from "@prisma/client";
import {
  getSign,
  HttpError,
  logger,
  dotenv,
  insertInverterInfo,
  getEndUserInfo,
  getGroupList,
  getDeviceBySN,
  deviceDetailFilter,
  getDataForGraph,
  createLogs,
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
    plantId: string,
    user: User
  ) => {
    if (user && user.allowDeviceCreation === false) {
      throw HttpError.forbidden("You don't have permission to create device");
    }
    //check plant exists
    const plant = await DeviceRepo.getPlantByIdRepo(plantId);
    if (!plant) throw new HttpError("Plant does not exist", "not-found", 404);
    // check device exists
    const device = await DeviceRepo.checkDeviceRepo(sn);
    if (device) throw new HttpError("Device already exists", "conflict", 409);
    // bind device to plant on cloud platform
    const bind: any =
      deviceType !== "BATTERY" &&
      (await insertInverterInfo(plant.customer.email, plant.AutoId || "", sn));
    // const deviceDetails = await getDeviceBySN(sn, plant.customer.email);
    // logger("bind", bind, plant.customer.email, plant.AutoId || "", sn);
    if (bind.status || deviceType === "BATTERY") {
      const customerId = plant.customerId;
      const add = await DeviceRepo.addDeviceRepo(
        deviceType,
        sn,
        plantId,
        customerId
      );
       await createLogs({
            userId: user.id,
            action: "Add New Device",
            description: "Device SN: " + sn + " added to Plant: " + plant.name + " by " + user.email,
          });
      return {
        ...add,
        customerEmail: plant.customer.email,
        // GoodsID: deviceDetails.GoodsID,
      };
    }
    return null;
  };

  // Get All devices for home page
  public static getAllDeviceListService = async (
    userId: string,
    deviceType: DeviceType,
    status: string,
    page: number,
    pageSize: number,
    search: string
  ) => {
    //======================================= Get user list from recursive function =======================================
    // 1️ Get all child installers recursively
    const userIdsList = await PlantRepo.getChildrenRecursively(userId, "");
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
      "",
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

    let flatDevicesList = devicesList.flat();
    let ForCount = devicesList.flat();
    // console.log(flatDevicesList);

    if (search) {
      flatDevicesList = flatDevicesList.filter((device: any) =>
        device.GoodsName.toLowerCase().includes(search.toLowerCase())
      );
    }

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
        recordsCount: ForCount.length,
        totalPages: Math.ceil(total / pageSize),
        online: ForCount.filter((device: any) => device.status === "ONLINE")
          .length,
        offline: ForCount.filter((device: any) => device.status === "OFFLINE")
          .length,
        fault: ForCount.filter((device: any) => device.status === "FAULT")
          .length,
        standby: ForCount.filter((device: any) => device.status === "STANDBY")
          .length,
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
      recordsCount: ForCount.length,
      totalPages: Math.ceil(total / pageSize),
      online: ForCount.filter((device: any) => device.status === "ONLINE")
        .length,
      offline: ForCount.filter((device: any) => device.status === "OFFLINE")
        .length,
      fault: ForCount.filter((device: any) => device.status === "FAULT").length,
      standby: ForCount.filter((device: any) => device.status === "STANDBY")
        .length,
    };
  };

  // Get Device By Id
  public static getDeviceBySnService = async (user: any, sn: string) => {
    const device: any = await DeviceRepo.getDeviceByIdRepo(sn);
    if (!device) throw new HttpError("Device not found", "not found", 404);
    // Get Device From third party
    const deviceDetails = await getDeviceBySN(device.sn, device.customer.email);

    return deviceDetailFilter({ ...device, ...deviceDetails });
  };

  // Get Flow Diagram By Sn
  public static getFlowDiagramService = async (user: any, sn: string) => {
    const device: any = await DeviceRepo.getDeviceByIdRepo(sn);
    if (!device) throw new HttpError("Device not found", "not found", 404);
    // Get Device From third party
    const deviceDetails = await getDataForGraph(
      device.sn,
      device.customer.email
    );
    // logger("deviceDetails", deviceDetails);
    const energyFlow = {
      PV: deviceDetails.ACDCInfo.Pdc[0] || 0, // First value of Pdc for Solar input power
      Grid: deviceDetails.gridCurrpac[1] || 0, // Grid power (currpac array)
      Battery: deviceDetails.fromPbat || 0, // Power discharging from the battery
      Generator: deviceDetails.genCurrpac[1] || 0, // Generator power (currpac array)
      LoadConsumed: deviceDetails.loadCurrpac[1] || 0, // Load power consumption (currpac array)
      deviceType: device.deviceType,
    };

    // Return filtered and mapped data
    return energyFlow;
  };
}

export default DeviceService;
