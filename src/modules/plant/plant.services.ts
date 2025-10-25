import { User } from "@prisma/client";
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

  private static getBatteriesOfPlant = async (
    email: string,
    plantId: string
  ) => {
    const BatteryList: any = await PlantRepo.BatteriesOfPlant(email, plantId);
    // const deviceList = Promise.all(
    //   BatteryList.map(async (device: any) => {
    //     const sn = "BZ2010302306020133";
    //     const date = "2024-06-21";
    //     const deviceData = await getBatteryDeviceData(sn, date);
    //     return deviceData;
    //   })
    // );
    // const filtered = (await deviceList).map((device: any) =>

    // )

    return BatteryList;
  };

  // Get Device List of Plant
  public static getDeviceListOfPlantService = async (
    plantId: string,
    type: string,
    email: string
  ) => {
    return type === "INVERTER"
      ? await this.getInvertersOfPlant(email, plantId)
      : [];
    // : await this.getBatteriesOfPlant(email, plantId);
  };

  // Modify Plant
  public static updatePlantService = async (data: any) => {
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
    CustomerEmail: string
  ) => {
    let del = await deletePlantThirdParty(CustomerEmail, AutoID);
    if (del.status) {
      const plant = await PlantRepo.deletePlantRepo(AutoID, CustomerEmail);
      return plant;
    }
    return { message: "Failed to delete plant" };
  };
}

export default PlantService;
