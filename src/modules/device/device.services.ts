import { DeviceType, LogType, User } from "@prisma/client";
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
  getHybridLine,
  getBatteryDeviceData,
} from "../../imports";
import DeviceRepo from "./device.repo";
import PlantRepo from "../plant/plant.repo";
import PlantServices from "../plant/plant.services";
import AuthRepo from "../auth/auth.repo";
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
        logType: LogType.DEVICE,
        logData: {
          deviceType: deviceType,
          sn: sn,
          plantId: plantId,
          customerId: customerId,
        },
        description:
          "Device SN: " +
          sn +
          " added to Plant: " +
          plant.name +
          " by " +
          user.email,
      });
      return {
        ...add,
        customerEmail: plant.customer.email,
        // GoodsID: deviceDetails.GoodsID,
      };
    }
    return null;
  };

  // Helper function to fetch BATTERY devices
  private static fetchBatteryDevices = async (userIdsList: any[]) => {
    let deviceList = await DeviceRepo.getDeviceListByUserIdRepo(
      userIdsList.map((child: any) => child.id)
    );
    let deviceData = await PlantServices.getBatteriesOfPlant(
      "",
      deviceList.map((device: any) => device.plant.AutoId)
    );
    return deviceData;
  };

  // Helper function to fetch INVERTER devices
  private static fetchInverterDevices = async (userIdsList: any[]) => {
    // Get all INVERTER devices from our database
    let dbDeviceList = await DeviceRepo.getDeviceListByUserIdAndTypeRepo(
      userIdsList.map((child: any) => child.id),
      "INVERTER"
    );

    // Group devices by plant AutoId and customer email to minimize API calls
    const plantDeviceMap = new Map<string, { devices: any[]; email: string }>();

    dbDeviceList.forEach((device: any) => {
      const key = `${device.plant.AutoId}_${device.customer.email}`;
      if (!plantDeviceMap.has(key)) {
        plantDeviceMap.set(key, {
          devices: [],
          email: device.customer.email,
        });
      }
      plantDeviceMap.get(key)!.devices.push(device);
    });

    // Fetch inverter data from third-party API for each unique plant
    let thirdPartyDataList = await Promise.all(
      Array.from(plantDeviceMap.entries()).map(
        async ([key, { devices, email }]) => {
          const plantAutoId = devices[0].plant.AutoId;
          const inverterData = await PlantServices.getDeviceListOfPlantService(
            plantAutoId,
            "INVERTER",
            email
          );
          return inverterData || [];
        }
      )
    );

    // Create a map of third-party data by GoodsID (SN) for quick lookup
    const thirdPartyDataMap = new Map<string, any>();
    thirdPartyDataList.flat().forEach((inv: any) => {
      if (inv.GoodsID) {
        thirdPartyDataMap.set(inv.GoodsID, inv);
      }
    });

    // Merge DB devices with third-party data
    // Include ALL devices from DB, enriching with third-party data where available
    return dbDeviceList.map((dbDevice: any) => {
      const thirdPartyData = thirdPartyDataMap.get(dbDevice.sn);
      if (thirdPartyData) {
        // Use third-party data if available
        return thirdPartyData;
      } else {
        // Fallback to DB device with default values if third-party data not available
        return {
          currentPower: 0,
          AutoID: dbDevice.plant?.AutoId || "",
          status: "OFFLINE",
          GoodsID: dbDevice.sn,
          ModelName: "",
          GoodsName: dbDevice.sn,
          todayYield: 0,
          totalYield: 0,
          generationTime: "",
          DataTime: "",
          capacity: 0,
          deviceType: "INVERTER",
          customerEmail: dbDevice.customer?.email || "",
          customerName: dbDevice.customer?.fullName || "",
          address: dbDevice.plant?.address || "",
        };
      }
    });
  };

  // Get All devices for home page
  public static getAllDeviceListService = async (
    userId: string,
    deviceType: DeviceType | "All",
    status: string,
    page: number,
    pageSize: number,
    search: string
  ) => {
    let getUser = await AuthRepo.findById(userId);
    if (!getUser) {
      throw HttpError.notFound("User not found");
    }
    //======================================= Get user list from recursive function =======================================
    // 1️ Get all child recursively
    let userIdsList: any = await PlantRepo.getChildrenRecursively(userId, "");
    userIdsList.push({
      id: getUser.id,
      email: getUser.email,
      role: getUser.role,
    });
    let flatDevicesList: any[] = [];
    let ForCount: any[] = [];

    // Handle different device types
    if (deviceType === "BATTERY") {
      // Fetch only BATTERY devices
      flatDevicesList = await this.fetchBatteryDevices(userIdsList);
      ForCount = flatDevicesList;
    } else if (deviceType === "INVERTER") {
      // Fetch only INVERTER devices
      flatDevicesList = await this.fetchInverterDevices(userIdsList);
      ForCount = flatDevicesList;
    } else if (deviceType === "All") {
      // Fetch both BATTERY and INVERTER devices
      const [batteryDevices, inverterDevices] = await Promise.all([
        this.fetchBatteryDevices(userIdsList),
        this.fetchInverterDevices(userIdsList),
      ]);

      // Combine both device types
      flatDevicesList = [...batteryDevices, ...inverterDevices];
      ForCount = flatDevicesList;
    } else {
      // Handle other device types (fallback to old method)
      //======================================= Get There customers list =======================================
      // 2 Build email list
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

      // ====================================== Get there device list for each plant From Third party =======================================
      let devicesList = await Promise.all(
        plantsWithDevices.map((plant: any) =>
          PlantServices.getDeviceListOfPlantService(
            plant.AutoId,
            deviceType,
            plant.customer.email
          )
        )
      );

      flatDevicesList = devicesList.flat();
      ForCount = devicesList.flat();
    }

    // Apply search filter if provided
    if (search) {
      flatDevicesList = flatDevicesList.filter((device: any) =>
        device.GoodsName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply status filter if provided
    const validStatuses = ["OFFLINE", "STANDBY", "FAULT", "ONLINE"];
    if (status && validStatuses.includes(status)) {
      flatDevicesList = flatDevicesList.filter(
        (device: any) => device.status === status
      );
    }

    // Calculate pagination
    const validPage = Math.max(page, 1);
    const skip = (validPage - 1) * pageSize;
    const total = flatDevicesList.length;
    const paginatedResults = flatDevicesList.slice(skip, skip + pageSize);

    // Return the response in the desired format
    return {
      devices: paginatedResults,
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

    if (device.deviceType === "BATTERY") {
      let batteryData = await getBatteryDeviceData(device.sn,new Date().toISOString().split("T")[0]);
      logger("batteryData", batteryData);
      
      // Extract the first record from the response
      const record = batteryData?.result?.records?.[0];
      
      // Map battery data based on whether it's Low Voltage or High Voltage battery
      const batteryPower = record?.power !== undefined 
        ? parseFloat(record.power) || 0  // High Voltage Battery
        : parseFloat(record?.POWER_1 || 0);  // Low Voltage Battery
      
      const dischargeEnergy = record?.batteryDischg !== undefined
        ? parseFloat(record.batteryDischg) || 0  // High Voltage Battery (cumulative)
        : parseFloat(record?.DH_TODAY || 0);  // Low Voltage Battery (today)
      
      const chargeEnergy = record?.batteryChg !== undefined
        ? parseFloat(record.batteryChg) || 0  // High Voltage Battery (cumulative)
        : parseFloat(record?.CH_TODAY || 0);  // Low Voltage Battery (today)
      
      const soc = record?.soc !== undefined
        ? parseFloat(record.soc) || 0  // High Voltage Battery
        : parseFloat(record?.SOC_1 || 0);  // Low Voltage Battery
      
      return {
        Battery: batteryPower,  // Current battery power (W)
        LoadConsumed: dischargeEnergy,  // Discharge energy
        ChargeEnergy: chargeEnergy,  // Charge energy (additional field)
        SOC: soc,  // State of Charge (%)
        deviceType: device?.deviceType,
      };
    }
    // Get Device From third party
    const deviceDetails = await getDataForGraph(
      device.sn,
      device.customer.email
    );
    
    // logger("deviceDetails", deviceDetails);

    // Check if Generator Port is enabled (Register 0x2122 / 8482)
    // Read register 2122 to check if generator is enabled
    let isGeneratorEnabled = false;
    try {
      const { readInverterModbusRegisters } = await import(
        "../../helpers/thirdParty"
      );
      const generatorPortData = await readInverterModbusRegisters(
        device.sn,
        device.customer.email,
        ["2122"] // 0x2122 = GEN Port register
      );
      
      // Check if Generator Port register value is 1 (Generator mode)
      // const genPortValue = generatorPortData?.data?.["Generator Setting"]?.["GEN Port"]?.value;
      const genPortValue = 1;
      isGeneratorEnabled = genPortValue === 1;
      
      logger(`🔌 Generator Port Check for ${device.sn}: ${isGeneratorEnabled ? 'ENABLED (value=1)' : 'DISABLED (value=' + genPortValue + ')'}`);
    } catch (error) {
      logger("⚠️ Could not read Generator Port register, assuming disabled");
      isGeneratorEnabled = false;
    }

    // Build energy flow object
    const energyFlow: any = {
      PV: parseFloat(deviceDetails?.ACDCInfo?.Pdc[0] || 0), // First value of Pdc for Solar input power
      Grid: parseFloat(deviceDetails?.gridCurrpac[1] || 0), // Grid power (currpac array)
      Battery: parseFloat(deviceDetails?.fromPbat || 0), // Power discharging from the battery
      LoadConsumed: parseFloat(deviceDetails?.loadCurrpac[1] || 0), // Load power consumption (currpac array)
      deviceType: device?.deviceType,
    };

    // Only include Generator if it's enabled (register 2122 = 1)
    if (isGeneratorEnabled) {
      energyFlow.Generator = parseFloat(deviceDetails?.genCurrpac[1] || 0);
    }

    // Return filtered and mapped data
    return energyFlow;
  };

  // Upload Firmware
  public static uploadFirmwareService = async (data: any) => {
    const upload = await DeviceRepo.uploadFirmwareRepo(data);

    // Log firmware upload
    await createLogs({
      userId: data.userId,
      action: "Upload Firmware",
      logType: LogType.FIRMWARE,
      description: `Firmware ${data.name} (v${data.version}) uploaded for ${data.deviceType}`,
      logData: {
        firmwareName: data.name,
        firmwareVersion: data.version,
        deviceType: data.deviceType,
        url: data.url,
      },
    });

    return upload;
  };

  // Get Firmware List
  public static getFirmwareListService = async (userId: string) => {
    const firmwareList = await DeviceRepo.getFirmwareListRepo(userId);
    return firmwareList;
  };

  // delete device
  public static deleteDeviceService = async (userId: string, sn: string) => {
    const checkDevice = await DeviceRepo.checkDeviceRepo(sn);
    if (!checkDevice) throw new HttpError("Device not found", "not found", 404);

    const device = await DeviceRepo.deleteDeviceRepo(userId, sn);

    // Log device deletion
    await createLogs({
      userId: userId,
      action: "Delete Device",
      logType: LogType.DEVICE,
      description: `Device ${sn} was deleted`,
      logData: {
        deviceSn: sn,
        deviceType: checkDevice.deviceType,
      },
    });

    return device;
  };

  // Read Modbus registers from inverter
  public static readModbusRegistersService = async (
    sn: string,
    memberId: string,
    registerList?: string[]
  ) => {
    try {
      const { readInverterModbusRegisters } = await import(
        "../../helpers/thirdParty"
      );
      const data = await readInverterModbusRegisters(
        sn,
        memberId,
        registerList
      );
      return data;
    } catch (error: any) {
      logger("Error reading Modbus registers:", error);
      throw new HttpError(
        error.message || "Failed to read Modbus registers",
        "internal-server-error",
        500
      );
    }
  };

  // Write Modbus registers to inverter
  public static writeModbusRegistersService = async (
    sn: string,
    memberId: string,
    registerValues: Record<string, string | number>,
    user: User
  ) => {
    try {
      const { writeInverterModbusRegisters } = await import(
        "../../helpers/thirdParty"
      );
      const data = await writeInverterModbusRegisters(
        sn,
        memberId,
        registerValues
      );
      await createLogs({
        userId: user.id,
        logType: LogType.MODBUS_WRITE_REGISTERS,
        logData: {
          sn: sn,
          memberId: memberId,
          registerValues: registerValues,
          user: user,
        },
        action: "MODBUS_WRITE_REGISTERS",
        description: `Modbus registers written to ${sn} by ${
          user.email
        } with values ${JSON.stringify(registerValues)}`,
      });
      return data;
    } catch (error: any) {
      logger("Error writing Modbus registers:", error);
      throw new HttpError(
        error.message || "Failed to write Modbus registers",
        "internal-server-error",
        500
      );
    }
  };

  // Get Modbus register map
  public static getModbusRegisterMapService = async () => {
    try {
      const { MODBUS_REGISTER_MAP } = await import("../../helpers/thirdParty");

      // Group registers by section
      const groupedMap: Record<string, any[]> = {};

      MODBUS_REGISTER_MAP.forEach((item) => {
        if (!groupedMap[item.section]) {
          groupedMap[item.section] = [];
        }
        groupedMap[item.section].push({
          register: item.reg,
          field: item.field,
          unit: item.unit,
          readWrite: item.rw,
          description: `${item.field} (${item.unit})`,
        });
      });

      return {
        totalRegisters: MODBUS_REGISTER_MAP.length,
        sections: groupedMap,
        // allRegisters: MODBUS_REGISTER_MAP.map((m) => m.reg),
      };
    } catch (error: any) {
      logger("Error getting Modbus register map:", error);
      throw new HttpError(
        "Failed to get Modbus register map",
        "internal-server-error",
        500
      );
    }
  };

  // Process Modbus write callback from vendor
  public static processModbusWriteCallbackService = async (data: {
    serialNumber: string;
    operation: string;
    modbusData: any;
    timestamp: string;
  }) => {
    try {
      logger("📥 Processing Modbus Write Callback:", data);

      // Parse the modbus data if it's a string
      const modbusInfo =
        typeof data.modbusData === "string"
          ? JSON.parse(data.modbusData)
          : data.modbusData;

      // Check if operation was successful
      // modbusInfo format: {"5000":"1","5001":"1"} where 1=success, 2=fail
      const results: Record<string, boolean> = {};
      for (const [reg, status] of Object.entries(modbusInfo)) {
        results[reg] = status === "1" || status === 1;
      }

      const allSuccess = Object.values(results).every((r) => r === true);
      const allFailed = Object.values(results).every((r) => r === false);

      // Log the result
      // await createLogs({
      //   userId: "6abbc6f1-40c3-4f6e-9903-bbc29c870788",
      //   action: "MODBUS_WRITE_RESULT",
      //   description: `Modbus write ${allSuccess ? "succeeded" : allFailed ? "failed" : "partially succeeded"} for ${data.serialNumber}. Registers: ${JSON.stringify(results)}`,
      // });

      logger(allSuccess ? "✅" : "⚠️", "Modbus Write Results:", {
        serialNumber: data.serialNumber,
        timestamp: data.timestamp,
        results,
        allSuccess,
      });

      // TODO: Emit socket event to notify frontend
      // io.emit('modbus:write:result', { serialNumber: data.serialNumber, results, timestamp: data.timestamp });

      return { success: allSuccess, results };
    } catch (error: any) {
      logger("❌ Error processing Modbus write callback:", error);
      // Don't throw - we still need to return "success" to vendor
      return { success: false, error: error.message };
    }
  };

  // Get Complete Generator Data (Settings + Runtime)
  public static getGeneratorStatusService = async (
    sn: string,
    memberId: string
  ) => {
    try {
      const { readInverterModbusRegisters } = await import(
        "../../helpers/thirdParty"
      );
      
      // Read all generator-related registers
      const generatorRegisters = [
        // Settings
        "2122", "2156", "2157", "2158", "2159", "215A", "215B", "215C", "215D", "215E",
        // Runtime Data
        "136A", "136B", "136D", "136F", "1370", "1372", "1374", "1375", "1377",
        "1379", "137A", "137C",
        // Summary Data
        "13C4", "13C6", "13C8", "13CA", "13CC", "13CE", "13D0", "13D2"
      ];
      
      const generatorData = await readInverterModbusRegisters(
        sn,
        memberId,
        generatorRegisters
      );

      const settings = generatorData?.data?.["Generator Setting"] || {};
      const runtime = generatorData?.data?.["Generator Runtime"] || {};
      const summary = generatorData?.data?.["Generator Summary"] || {};

      // Extract key values
      const genPort = settings?.["GEN Port"]?.value ?? 0;
      const genForce = settings?.["Generator Dry force ON/OFF"]?.value ?? 0;
      const startSOC = settings?.["Start When SOC Below"]?.value ?? 0;
      const stopSOC = settings?.["Stop When SOC Reaches"]?.value ?? 0;
      const powerOutput = settings?.["Power Output"]?.value ?? 0;
      const voltageOutput = settings?.["Voltage Output"]?.value ?? 0;
      const capacity = settings?.["Capacity"]?.value ?? 0;
      const frequency = settings?.["Frequency"]?.value ?? 0;

      const isPortGenerator = genPort === 1;
      const isNotForcedOff = genForce !== 2;
      const isEnabled = isPortGenerator && isNotForcedOff;

      return {
        enabled: isEnabled,
        basicInfo: {
          powerOutput: powerOutput,
          voltageOutput: voltageOutput,
          capacity: capacity,
          frequency: frequency,
          fuelType: "N/A", // Could be made configurable
        },
        socSetting: {
          startWhenSOCBelow: startSOC,
          stopWhenSOCReaches: stopSOC,
          startTime: settings?.["Start Time (Manual Mode)"]?.value ?? null,
          runDuration: settings?.["Run Duration (Manual Start)"]?.value ?? null,
        },
        genPort: {
          value: genPort,
          description: ["Disable", "Generator Input", "Smart Load", "Inverter Input"][genPort] || "Unknown",
        },
        genForce: {
          value: genForce,
          description: ["Auto", "On", "Off"][genForce] || "Unknown",
        },
        runtime: {
          frequency: runtime?.["Generator frequency"]?.value ?? 0,
          todayEnergy: runtime?.["Generator today energy"]?.value ?? 0,
          totalEnergy: runtime?.["Generator total energy"]?.value ?? 0,
          todayRuntime: "N/A", // This could be calculated from energy/power
          phases: {
            L1: {
              voltage: runtime?.["L1 phase voltage"]?.value ?? 0,
              current: runtime?.["L1 phase current"]?.value ?? 0,
              power: runtime?.["L1 phase power"]?.value ?? 0,
            },
            L2: {
              voltage: runtime?.["L2 phase voltage"]?.value ?? 0,
              current: runtime?.["L2 phase current"]?.value ?? 0,
              power: runtime?.["L2 phase power"]?.value ?? 0,
            },
            L3: {
              voltage: runtime?.["L3 phase voltage"]?.value ?? 0,
              current: runtime?.["L3 phase current"]?.value ?? 0,
              power: runtime?.["L3 phase power"]?.value ?? 0,
            },
          },
        },
        summary: {
          phaseL1WattSum: summary?.["Phase L1 watt sum"]?.value ?? 0,
          phaseL2WattSum: summary?.["Phase L2 watt sum"]?.value ?? 0,
          phaseL3WattSum: summary?.["Phase L3 watt sum"]?.value ?? 0,
          phaseL1ApparentPowerSum: summary?.["Phase L1 apparent power sum"]?.value ?? 0,
          phaseL2ApparentPowerSum: summary?.["Phase L2 apparent power sum"]?.value ?? 0,
          phaseL3ApparentPowerSum: summary?.["Phase L3 apparent power sum"]?.value ?? 0,
          todayEnergySum: summary?.["Generator today energy sum"]?.value ?? 0,
          totalEnergySum: summary?.["Generator total energy sum"]?.value ?? 0,
        },
        status: isEnabled 
          ? "Generator is ENABLED and operational" 
          : !isPortGenerator 
          ? `Generator port not configured (current: ${["Disable", "Generator Input", "Smart Load", "Inverter Input"][genPort]})` 
          : "Generator is forced OFF",
      };
    } catch (error: any) {
      logger("Error getting generator status:", error);
      throw new HttpError(
        "Failed to get generator status",
        "internal-server-error",
        500
      );
    }
  };

  // Control Generator
  public static controlGeneratorService = async (
    sn: string,
    memberId: string,
    mode: number, // 0: Auto, 1: On, 2: Off
    user: User
  ) => {
    try {
      const { writeInverterModbusRegisters } = await import(
        "../../helpers/thirdParty"
      );

      // Write to Generator Dry force ON/OFF register (2156)
      const result = await writeInverterModbusRegisters(
        sn,
        memberId,
        { "2156": mode }
      );

      // Log the action
      await createLogs({
        userId: user.id,
        action: "GENERATOR_CONTROL",
        logType: LogType.MODBUS_WRITE_REGISTERS,
        description: `Generator control set to ${["Auto", "On", "Off"][mode]} for device ${sn}`,
        logData: {
          sn,
          memberId,
          register: "2156",
          mode,
          modeDescription: ["Auto", "On", "Off"][mode],
        },
      });

      return {
        ...result,
        mode,
        modeDescription: ["Auto", "On", "Off"][mode],
        message: `Generator ${["Auto", "On", "Off"][mode]} command sent. Result will arrive via callback.`,
      };
    } catch (error: any) {
      logger("Error controlling generator:", error);
      throw new HttpError(
        "Failed to control generator",
        "internal-server-error",
        500
      );
    }
  };

  // Update Generator Settings (SOC, Power, etc.)
  public static updateGeneratorSettingsService = async (
    sn: string,
    memberId: string,
    settings: {
      startWhenSOCBelow?: number;
      stopWhenSOCReaches?: number;
      startTime?: string;
      runDuration?: number;
      powerOutput?: number;
      voltageOutput?: number;
      capacity?: number;
      frequency?: number;
    },
    user: User
  ) => {
    try {
      const { writeInverterModbusRegisters } = await import(
        "../../helpers/thirdParty"
      );

      // Build register values object
      const registerValues: Record<string, number | string> = {};

      if (settings.startWhenSOCBelow !== undefined) {
        registerValues["2157"] = settings.startWhenSOCBelow;
      }
      if (settings.stopWhenSOCReaches !== undefined) {
        registerValues["2158"] = settings.stopWhenSOCReaches;
      }
      if (settings.startTime !== undefined) {
        registerValues["2159"] = settings.startTime;
      }
      if (settings.runDuration !== undefined) {
        registerValues["215A"] = settings.runDuration;
      }
      if (settings.powerOutput !== undefined) {
        // Convert kW to raw (multiply by 10)
        registerValues["215B"] = Math.round(settings.powerOutput * 10);
      }
      if (settings.voltageOutput !== undefined) {
        // Convert V to raw (multiply by 10)
        registerValues["215C"] = Math.round(settings.voltageOutput * 10);
      }
      if (settings.capacity !== undefined) {
        // Convert kWh to raw (multiply by 10)
        registerValues["215D"] = Math.round(settings.capacity * 10);
      }
      if (settings.frequency !== undefined) {
        // Convert Hz to raw (multiply by 100)
        registerValues["215E"] = Math.round(settings.frequency * 100);
      }

      if (Object.keys(registerValues).length === 0) {
        throw new Error("No settings provided to update");
      }

      const result = await writeInverterModbusRegisters(
        sn,
        memberId,
        registerValues
      );

      // Log the action
      await createLogs({
        userId: user.id,
        action: "GENERATOR_SETTINGS_UPDATE",
        logType: LogType.MODBUS_WRITE_REGISTERS,
        description: `Generator settings updated for device ${sn}`,
        logData: {
          sn,
          memberId,
          settings,
          registers: registerValues,
        },
      });

      return {
        ...result,
        updatedSettings: settings,
        message: "Generator settings update command sent. Result will arrive via callback.",
      };
    } catch (error: any) {
      logger("Error updating generator settings:", error);
      throw new HttpError(
        "Failed to update generator settings",
        "internal-server-error",
        500
      );
    }
  };

  // Get SN List
  public static getSnListService = async (userId: string) => {
    let child = await AuthRepo.getChildrenRecursively(userId, "CUSTOMER");
    let customerIds = child.map((child: any) => child.id) || [];
    customerIds.push(userId);
    let Devices = await DeviceRepo.getSnListRepo(customerIds);
    return Devices;
  };

  // Device Report
  public static deviceReportService = async (
    sn: string,
    type: string,
    date: string,
    user: User
  ) => {
    let device = await DeviceRepo.getDeviceByIdRepo(sn);
    if (!device) throw new HttpError("Device not found", "not found", 404);
    let reportData = await getHybridLine(
      device.sn,
      device.customer.email,
      type,
      date
    );
    if (!reportData)
      throw new HttpError("No report data found", "not found", 404);
    return reportData.map((item: any) => ({
      ...item,
      sn: device.sn,
    }));
  };

  // get device overview
  public static deviceOverviewService = async (sn: string) => {
    let device = await DeviceRepo.getDeviceByIdRepo(sn);
    if (!device) throw new HttpError("Device not found", "not found", 404);

    // Get device details from third party
    let deviceDetails = await getDeviceBySN(device.sn, device.customer.email);

    // Fetch weather data if plant location is available
    let weatherData = null;
    if (device.plant?.location?.latitude && device.plant?.location?.longitude) {
      const { getCurrentWeather } = await import("../../helpers/weather");
      weatherData = await getCurrentWeather(
        device.plant.location.latitude,
        device.plant.location.longitude
      );
    }

    // Filter and format the response
    let filteredData = {
      deviceId: device.id,
      deviceName: deviceDetails.GoodsName || "",
      serialNumber: deviceDetails.GoodsID || device.sn,
      deviceType: device.deviceType,
      status: deviceDetails.Light || 0,
      currentPower: parseFloat(deviceDetails.CurrPac || "0"),
      todayGeneration: parseFloat(deviceDetails.EToday || "0"),
      totalGeneration: parseFloat(deviceDetails.ETotal || "0"),
      totalHours: parseFloat(deviceDetails.Htotal || "0"),
      lastUpdate: deviceDetails.DataTime || null,
      plant: {
        id: device.plant?.id,
        name: device.plant?.name,
        autoId: device.plant?.AutoId,
      },
      weather: weatherData || {},
    };

    return filteredData;
  };
}

export default DeviceService;
