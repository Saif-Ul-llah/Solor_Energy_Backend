import { LogType, User } from "@prisma/client";
import {
  getEndUserInfo,
  getGroupList,
  getSign,
  HttpError,
  insertGroupInfo,
  logger,
  PlantInterface,
  sendMail,
  dotenv,
  getUserData,
  InvertersOfPlant,
  ModifyPlant,
  getBatteryDeviceData,
  createLogs,
  deletePlantThirdParty,
  getGroupDetail,
} from "../../imports";
import PlantRepo from "./plant.repo";
import AuthRepo from "./../auth/auth.repo";
dotenv.config();

class PlantService {
  public static createPlant = async (payload: PlantInterface, user: User) => {
    if (user && user.allowPlantCreation === false) {
      throw HttpError.forbidden("You don't have permission to create plant");
    }
    const checkPlantExists = await PlantRepo.isPlantExists(payload.name);
    if (checkPlantExists)
      throw HttpError.badRequest("Plant with this name already exists");

    const getCustomer: any = await AuthRepo.findById(payload.customerId);
    if (!getCustomer) throw HttpError.notFound("Customer not found");

    const getMonitorUserSignature: any = await getSign(
      getCustomer.email,
      process.env.MONITOR_ACCOUNT_PASSWORD as string
    );
    logger("getMonitorUserSignature", getMonitorUserSignature);

    // Create New Plant to Inverter Cloud Platform
    const createPlantResponse: any = await insertGroupInfo(
      /* MemberID */ getCustomer.email,
      /* GroupName */ payload.name,
      /* StartDate */ new Date().toISOString().split("T")[0],
      /* PlantType */ payload.plantType == "Grid"
        ? "1"
        : payload.plantType == "Grid_Meter"
        ? "2"
        : payload.plantType == "Hybrid"
        ? "4"
        : payload.plantType,
      /* Kwp */ payload.capacity.toString(),
      /* Price */ payload.tariff.toString(),
      /* Lng */ payload.longitude?.toString() || "0",
      /* Lat */ payload.latitude?.toString() || "0",
      /* CurrencyUnit */ payload.currency || "USD",
      /* Sign */ getMonitorUserSignature
    );
    logger("createPlantResponse", createPlantResponse);

    const plantList = await getGroupList(
      getCustomer.email,
      getMonitorUserSignature
    );

    let getPlant = await plantList.AllGroupList.find(
      (data: any) => data.GoodsTypeName == payload.name
    );

    logger("For AutoID :", plantList.AutoID);
    // return plantList;

    const plant = await PlantRepo.createPlant({
      ...payload,
      AutoID: getPlant.AutoID,
    });
    await createLogs({
      userId: user.id,
      action: "Add New Plant",
      logType: LogType.PLANT,
      logData: {
        plantName: payload.name,
        customerId: user.id,
        customerEmail: user.email,
        plantId: plant.id,
      },
      description: `Plant: ${payload.name} created by ${user.email}`,
    });
    return plant;
  };

  public static getAllPlants = async (
    userId: string,
    status?: string,
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    startCapacity: number = 0,
    endCapacity: number = 0,
    latitude: number = 0,
    longitude: number = 0
  ) => {
    // 1️ Get all child installers recursively
    const userIdsList = await PlantRepo.getChildrenRecursively(
      userId,
      "INSTALLER"
    );

    // 2 Build installer email list
    const memberIds = userIdsList.map((child: any) => child.email);
    // memberIds.push("progziel01");

    // 3️ Fetch all monitoring users once
    const monitorUsers = await getEndUserInfo();

    // 4 Filter only users present in both lists
    const validMonitorUsers = monitorUsers.filter((u: any) =>
      memberIds.includes(u.MemberID)
    );

    // 5 Fetch all plant lists concurrently
    const groupPromises = validMonitorUsers.map((user: any) =>
      getGroupList(user.MemberID, user.Sign)
    );

    // ⚡ Run all at once
    const usersPlantLists = await Promise.allSettled(groupPromises);

    // 6 Extract successful results and flatten
    const plantList = usersPlantLists
      .filter(
        (res: any) =>
          res.status === "fulfilled" && res.value?.AllGroupList?.length
      )
      .flatMap((res: any) => res.value.AllGroupList);

    // logger("plantList", plantList);
    // 7 Our DB Plants lists
    let plants = await PlantRepo.getAllPlants(
      userId,
      validMonitorUsers.map((u: any) => u.MemberID),
      startCapacity,
      endCapacity,
      latitude,
      longitude
    );

    const getCommonPlants: any = plantList
      .map((plant: any) => {
        const matchingPlant = plants.find(
          (p: any) => p.name === plant.GoodsTypeName
        );
        return matchingPlant ? { ...plant, ...matchingPlant } : null;
      })
      .filter((plant: any) => plant !== null);
    const list = getCommonPlants.map((plant: any) => {
      return {
        id: plant?.id,
        plantProfile: plant?.plantProfile || "",
        name: plant?.name || "",
        todayYield: plant?.EToday || 0,
        totalYield: plant?.ETotal || 0,
        capacity: plant?.GoodsKWP || 0,
        address: plant?.address || "",
        currentPower: plant?.CurrPac || 0,
        AutoID: plant?.AutoID || "0",
        CustomerEmail: plant?.customer.email || "",
        status:
          plant?.Light === 1
            ? "ONLINE"
            : plant?.Light == 2
            ? "FAULT"
            : plant?.Light == 3
            ? "STANDBY"
            : plant?.Light == 4
            ? "OFFLINE"
            : "UNKNOWN",
      };
    });
    // Sort And Filter the Plants
    let plantListWithDbInfo = list;

    if (search && search.trim() !== "") {
      plantListWithDbInfo = plantListWithDbInfo.filter(
        (plant: any) =>
          plant.name && plant.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const validStatuses = ["OFFLINE", "STANDBY", "FAULT", "ONLINE"];

    if (status && validStatuses.includes(status)) {
      let newData = plantListWithDbInfo.filter(
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
        plants: paginatedResults, // Paginated plant list
        currentPage: validPage,
        pageSize,
        total,
        recordsCount: list.length,
        totalPages: Math.ceil(total / pageSize),
        online: list.filter((plant: any) => plant.status === "ONLINE").length,
        offline: list.filter((plant: any) => plant.status === "OFFLINE").length,
        standby: list.filter((plant: any) => plant.status === "STANDBY").length,
        fault: list.filter((plant: any) => plant.status === "FAULT").length,
      };
    }

    // Ensure valid page number (minimum 1)
    const validPage = Math.max(page, 1);

    // Calculate skip and take for slicing the array
    const skip = (validPage - 1) * pageSize;
    const take = pageSize;

    // Get the total number of items in the array
    const total = plantListWithDbInfo.length;

    // Slice the array to get the paginated items
    const paginatedResults = plantListWithDbInfo.slice(skip, skip + take);

    // Return the response in the desired format
    return {
      plants: paginatedResults, // Paginated plant list
      currentPage: validPage,
      pageSize,
      total,
      recordsCount: list.length,
      totalPages: Math.ceil(total / pageSize),
      online: list.filter((plant: any) => plant.status === "ONLINE").length,
      offline: list.filter((plant: any) => plant.status === "OFFLINE").length,
      standby: list.filter((plant: any) => plant.status === "STANDBY").length,
      fault: list.filter((plant: any) => plant.status === "FAULT").length,
    };
    // return plantListWithDbInfo;
  };

  // Get Plant By Id
  public static getPlantByIdService = async (id: string) => {
    const plant: any = await PlantRepo.getPlantByIdRepo(id);
    if (!plant) throw HttpError.notFound("Plant not found");

    const filteredData = {
      ...plant,
      address: plant.address || "",
      latitude: plant.location.latitude || "",
      longitude: plant.location.longitude || "",
      plantImage:
        plant.plantImage.map((image: any) => image.file_url).filter(Boolean) ||
        [],
      customer: getUserData(plant.customer),
      installer: getUserData(plant.installer),
    };

    delete filteredData.location;
    delete filteredData.customerId;
    delete filteredData.installerId;
    delete filteredData.locationId;

    return filteredData;
  };

  private static getInvertersOfPlant = async (
    email: string,
    plantId: string
  ) => {
    const InverterList: any = await InvertersOfPlant(email, plantId);
    if (
      !InverterList ||
      !InverterList.AllInverterList ||
      InverterList.AllInverterList.length === 0
    ) {
      return [];
    }
    let filtered = InverterList.AllInverterList.map((device: any) => ({
      currentPower: device?.CurrPac || 0,
      AutoID: device?.AutoID || "0",
      status:
        device?.Light === 1
          ? "ONLINE"
          : device?.Light == 2
          ? "FAULT"
          : device?.Light == 3
          ? "STANDBY"
          : device?.Light == 4
          ? "OFFLINE"
          : "UNKNOWN",
      GoodsID: device?.GoodsID || "",
      ModelName: device?.ModelName || "",
      GoodsName: device?.GoodsName || "",
      todayYield: device?.EToday || 0,
      totalYield: device?.ETotal || 0,
      generationTime: device?.Htotal || "",
      DataTime: device?.DataTime || "",
      capacity: device?.Capacity || 0,
      deviceType: device?.DeviceType || "GRID",
      customerEmail: email,
    }));

    return filtered;
  };

  public static getBatteriesOfPlant = async (
    email: string,
    plantId: string[]
  ) => {
    const BatteryList: any = await PlantRepo.BatteriesOfPlant(email, plantId);

    const deviceList = await Promise.all(
      BatteryList.map(async (item: any) => {
        const sn = item.sn;
        const date = new Date().toISOString().split("T")[0];
        const deviceData = await getBatteryDeviceData(sn, date);
        return { ...deviceData, sn };
      })
    );

    const filtered = deviceList
      // .filter((device: any) => device && device.result && device.result.records && device.result.records.length > 0)
      .map((device: any) => {
        const record = device?.result?.records[0];

        // Determine status based on battery type (Low Voltage or High Voltage)
        let status = "UNKNOWN";

        // Check if it's a Low Voltage Battery (has M_STATUS_1 field)
        if (record?.M_STATUS_1 !== undefined) {
          const mStatus = parseInt(record.M_STATUS_1) || 0;
          // Check for faults first (FAULT_1 through FAULT_6)
          const hasFault =
            (parseInt(record.FAULT_1) || 0) !== 0 ||
            (parseInt(record.FAULT_2) || 0) !== 0 ||
            (parseInt(record.FAULT_3) || 0) !== 0 ||
            (parseInt(record.FAULT_4) || 0) !== 0 ||
            (parseInt(record.FAULT_5) || 0) !== 0 ||
            (parseInt(record.FAULT_6) || 0) !== 0;

          if (hasFault) {
            status = "FAULT";
          } else {
            status =
              mStatus === 1
                ? "ONLINE"
                : mStatus === 2
                ? "FAULT"
                : mStatus === 3
                ? "STANDBY"
                : mStatus === 4
                ? "OFFLINE"
                : "UNKNOWN";
          }
        }
        // Check if it's a High Voltage Battery (has faultStatus field)
        else if (record?.faultStatus !== undefined) {
          const faultStatus = parseInt(record?.faultStatus) || -1;
          // For High Voltage: 0 = normal (ONLINE), other = fault
          status = faultStatus === 0 ? "ONLINE" : "FAULT";
        }

        // Extract power - Low Voltage uses POWER_1, High Voltage uses power
        const currentPower =
          parseFloat(record?.POWER_1 || record?.power || "0") || 0;

        // Extract capacity - Low Voltage uses CAP_1, High Voltage might not have direct capacity
        const capacity = parseFloat(record?.CAP_1 || "0") || 0;

        // Extract today yield - Low Voltage uses CH_TODAY (charge) and DH_TODAY (discharge), High Voltage uses batteryChg and batteryDischg
        const todayYield =
          parseFloat(record?.CH_TODAY || record?.batteryChg || "0") || 0;

        // Extract total yield - cumulative values
        const totalYield =
          parseFloat(record?.M_A_TOTAL_1 || record?.batteryChg || "0") || 0;

        // Extract SOC - Low Voltage uses SOC_1, High Voltage uses soc
        const soc = parseFloat(record?.SOC_1 || record?.soc || "0") || 0;

        return {
          currentPower,
          AutoID: device?.sn || "",
          status,
          GoodsID: device?.sn || "0",
          ModelName: device?.ModelName || "",
          GoodsName: device?.GoodsName || "",
          todayYield,
          totalYield,
          generationTime: record?.time || "",
          DataTime: record?.time || "",
          capacity,
          deviceType: record?.deviceType !== undefined ? "BATTERY" : "BATTERY",
          customerEmail: email,
          soc,
        };
      });

    return filtered;
  };

  // Get Device List of Plant
  public static getDeviceListOfPlantService = async (
    plantId: string,
    type: string,
    email: string
  ) => {
    return type === "INVERTER"
      ? await this.getInvertersOfPlant(email, plantId)
      // : await this.getBatteriesOfPlant(email, [plantId]);
    : [];
  };

  // Modify Plant
  public static updatePlantService = async (data: any, user?: User) => {
    //Get plant and Customer of that plant

    const getPlantByAutoId: any = await PlantRepo.getPlantByAutoIdRepo(
      data.AutoID
    );
    // logger("getPlantByAutoId", getPlantByAutoId);
    if (!getPlantByAutoId) throw HttpError.notFound("Plant not found");
    // Modify on third party api
    const result = await ModifyPlant(
      /*GroupName:*/ data.name,
      /*MemberID:*/ getPlantByAutoId.customer.email,
      /*PlantType:*/ data.plantType == "Grid"
        ? "1"
        : data.plantType == "Grid_Meter"
        ? "2"
        : data.plantType == "Hybrid"
        ? "4"
        : data.plantType,
      /*Price:*/ data.tariff,
      /*CurrencyUnit:*/ data.currency,
      /*Kwp:*/ data.capacity,
      /*GroupAutoID:*/ data.AutoID,
      /*Lng:*/ data.longitude,
      /*Lat:*/ data.latitude
    );
    if (result.status) {
      // Modify on DB
      const plant = await PlantRepo.updatePlantRepo(data);

      // Log plant update
      if (user) {
        await createLogs({
          userId: user.id,
          action: "Update Plant",
          logType: LogType.PLANT,
          description: `Plant ${plant.name} (ID: ${plant.id}) was updated`,
          logData: {
            plantId: plant.id,
            plantName: plant.name,
            AutoID: data.AutoID,
            updatedBy: user.email,
          },
        });
      }

      return plant;
    }
    return { message: "Failed to update plant" };
  };

  // Get Data For Flow Diagram
  public static getPlantFlowDiagramService = async (plantId: string) => {
    // Get device list of plant
    const deviceList = await PlantRepo.getDevicesForFlowDiagram(plantId);
    return deviceList;
  };
  // Delete Plant
  public static deletePlantService = async (
    AutoID: string,
    CustomerEmail: string,
    user?: User
  ) => {
    // Get plant info before deletion for logging
    const plantInfo: any = await PlantRepo.getPlantByAutoIdRepo(AutoID);

    let del = await deletePlantThirdParty(CustomerEmail, AutoID);
    if (del.status) {
      const plant = await PlantRepo.deletePlantRepo(AutoID, CustomerEmail);

      // Log plant deletion
      if (user && plantInfo) {
        await createLogs({
          userId: user.id,
          action: "Delete Plant",
          logType: LogType.PLANT,
          description: `Plant ${plantInfo.name} (ID: ${plantInfo.id}) was deleted`,
          logData: {
            plantId: plantInfo.id,
            plantName: plantInfo.name,
            AutoID,
            CustomerEmail,
            deletedBy: user.email,
          },
        });
      }

      return plant;
    }
    return { message: "Failed to delete plant" };
  };

  // Get Analytics Count
  public static getAnalyticsCountService = async (userId: string) => {
    // Get under Users List
    const usersList = await AuthRepo.getChildrenRecursively(userId, "CUSTOMER");
    const emails = usersList.map((user: any) => user.email);
    // Get Analytics From third Party user table
    let thirdPartyData = await PlantRepo.getAnalyticsFromThirdParty(emails);

    // Calculate cumulative values
    const analytics = thirdPartyData.reduce(
      (acc, record) => {
        acc.currentPower += record.currentPower || 0;
        acc.totalGeneration += record.totalGeneration || 0;
        acc.todayGeneration += record.todayGeneration || 0;
        acc.totalKwp += record.Kwp || 0;
        return acc;
      },
      {
        currentPower: 0,
        totalGeneration: 0,
        todayGeneration: 0,
        totalKwp: 0,
      }
    );

    return analytics;
  };

  // get plant count by id
  public static plantCountByIdService = async (plantId: string) => {
    const plant: any = await PlantRepo.getPlantById(plantId);
    if (!plant) throw HttpError.notFound("Plant not found");
    const plantCount = await getGroupDetail(plant.customer.email, plant.AutoId);

    // Fetch weather data if location is available
    let weatherData = null;
    if (plant.location && plant.location.latitude && plant.location.longitude) {
      const { getCurrentWeather } = await import("../../helpers/weather");
      weatherData = await getCurrentWeather(
        plant.location.latitude,
        plant.location.longitude
      );
    }

    let filteredData = {
      powerGeneration: plantCount.ETotal || 0,
      revenue: plantCount.IncomeTotal || 0,
      todayGeneration: plantCount.EToday || 0,
      kwp: plantCount.GoodsKWP || 0,
      unit: plantCount.unit || "",
      installationDate: plantCount.CreateDate || "",
      weather: weatherData || {},
    };
    return filteredData;
  };
}

export default PlantService;
