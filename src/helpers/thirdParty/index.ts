import axios, { AxiosResponse } from "axios";
import crypto from "crypto";
import qs from "qs";
import FormData from "form-data";
import dotenv from "dotenv";
import { logger } from "../../utils";
import fs from "fs";
dotenv.config();

interface ApiResponse {
  [key: string]: any;
}
const CLOUD_BASEURL = process.env.CLOUD_BASEURL as string;

// Function to get operation signature
export const getOperationSignature = async (
  MemberID: string,
  Password: string
): Promise<ApiResponse> => {
  const data = qs.stringify({
    MemberID: MemberID,
    Password: Password,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getOperationSign`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };
  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error fetching operation signature:", error);
    throw error; // Re-throw the error to allow for handling upstream
  }
};

// New function to register monitor user
export const registerMonitorUser = async (
  MemberID: string,
  Password: string,
  Confirm: string
): Promise<ApiResponse> => {
  // First, get the operation signature
  const signatureResponse = await getOperationSignature(
    process.env.SERVICE_ACCOUNT_ID as string,
    process.env.SERVICE_ACCOUNT_PASS as string
  );
  const data = new FormData();
  data.append("OSSMemberID", process.env.SERVICE_ACCOUNT_ID as string);
  data.append("Sign", signatureResponse);
  data.append("MemberID", MemberID);
  data.append("Password", Password);
  data.append("Confirm", Confirm);

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/registerMemberInfo`,
    headers: {
      ...data.getHeaders(), // Add the necessary FormData headers
    },
    data: data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error registering monitor user:", error);
    throw error; // Re-throw the error to allow for handling upstream
  }
};

export const getEndUserInfo = async (): Promise<ApiResponse> => {
  const signatureResponse = await getOperationSignature(
    process.env.SERVICE_ACCOUNT_ID as string,
    process.env.SERVICE_ACCOUNT_PASS as string
  );

  const data = qs.stringify({
    MemberID: process.env.SERVICE_ACCOUNT_ID as string,
    Sign: signatureResponse,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getEndUserInfo`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error fetching end user info:", error);
    throw error;
  }
};

// Get plant List of a User
export const getGroupList = async (
  MemberID: string,
  Sign: string,
  inputValue: string = "" // optional or empty string by default
): Promise<ApiResponse> => {
  const data = qs.stringify({
    inputValue: inputValue,
    MemberID: MemberID,
    Sign: Sign,
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getGroupList`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error fetching group list:", error);
    throw error;
  }
};

// Function to insert group info
export const insertGroupInfo = async (
  MemberID: string,
  GroupName: string,
  StartDate: string,
  PlantType: string,
  Kwp: string,
  Price: string,
  Lng: string,
  Lat: string,
  CurrencyUnit: string,
  Sign: string
): Promise<ApiResponse> => {
  const data = qs.stringify({
    MemberID,
    GroupName,
    StartDate,
    PlantType,
    Kwp,
    Price,
    Lng,
    Lat,
    CurrencyUnit,
    Sign,
  });

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/insertGroupInfo`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error inserting group info:", error);
    throw error;
  }
};

// Get monitor user signature

// Function to get Sign (authentication signature)
export const getSign = async (
  MemberID: string,
  Password: string
): Promise<ApiResponse> => {
  const data = qs.stringify({
    MemberID,
    Password,
  });

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getSign`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error fetching sign:", error);
    throw error;
  }
};

// Get Inverter List of a Plant
// Function to get group detail list
export const inverterListOfPlant = async (
  MemberID: string,
  GroupAutoID: string,
  Sign: string
): Promise<ApiResponse> => {
  const data = new FormData();
  data.append("MemberID", MemberID);
  data.append("GroupAutoID", GroupAutoID);
  data.append("Sign", Sign);

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getGroupDetailList`,
    headers: {
      ...data.getHeaders(),
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error fetching group detail list:", error);
    throw error;
  }
};

// Get Inverter List of a Plant
// Function to get group detail list (using multipart/form-data)
export const InvertersOfPlant = async (
  MemberID: string,
  GroupAutoID: string
): Promise<ApiResponse> => {
  const Sign = await getSign(
    // "progziel01",
    // "123456"
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
  );

  // logger("Sign", Sign);
  const data = new FormData();
  data.append("MemberID", MemberID);
  data.append("GroupAutoID", GroupAutoID);
  data.append("Sign", Sign);

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getGroupDetailList`,
    headers: {
      ...data.getHeaders(),
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error fetching group detail list:", error);
    throw error;
  }
};

// Modify Plant Details
// Function to update group info
export const ModifyPlant = async (
  GroupName: string,
  MemberID: string,
  PlantType: string,
  Price: string,
  CurrencyUnit: string,
  Kwp: string,
  GroupAutoID: string,
  Lng: string,
  Lat: string
): Promise<ApiResponse> => {
  const Sign = await getSign(
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
  );
  // logger("Sign", Sign);

  const data = new FormData();
  data.append("GroupName", GroupName);
  data.append("MemberID", MemberID);
  data.append("PlantType", PlantType);
  data.append("Price", Price);
  data.append("CurrencyUnit", CurrencyUnit);
  data.append("Kwp", Kwp);
  data.append("Sign", Sign);
  data.append("GroupAutoID", GroupAutoID);
  data.append("Lng", Lng);
  data.append("Lat", Lat);

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/updateGroupInfo`,
    headers: {
      "Content-Type": "multipart/form-data",
      ...data.getHeaders(),
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error updating group info:", error);
    throw error;
  }
};

// Add device in to Plant
// Function to insert inverter info
export const insertInverterInfo = async (
  MemberID: string,
  GroupAutoID: string,
  GoodsID: string
): Promise<ApiResponse> => {
  logger("\n\n\ncheck they are hilting Add device api \n\n");
  const Sign = await getSign(
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
  );
  // logger("Sign", Sign);

  const data = new FormData();
  data.append("MemberID", MemberID);
  data.append("GroupAutoID", GroupAutoID);
  data.append("GoodsID", GoodsID);
  data.append("Sign", Sign);

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/insertInverterInfo`,
    headers: {
      "Content-Type": "multipart/form-data",
      ...data.getHeaders(),
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    // logger("response", response);
    return response.data;
  } catch (error) {
    console.error("Error inserting inverter info:", error);
    throw error;
  }
};

// Get Device By Sn
// Function to get inverter detail
export const getDeviceBySN = async (
  GoodsID: string,
  MemberID: string
): Promise<ApiResponse> => {
  const Sign = await getSign(
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
  );

  const data = new FormData();
  data.append("GoodsID", GoodsID);
  data.append("MemberID", MemberID);
  data.append("Sign", Sign);
  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getInverterDetail`,
    headers: {
      "Content-Type": "multipart/form-data",
      ...data.getHeaders(),
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error fetching inverter detail:", error);
    throw error;
  }
};

// Function to get hybrid detail info
export const getDataForGraph = async (
  GoodsID: string,
  MemberID: string
): Promise<ApiResponse> => {
  const Sign = await getSign(
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
    // MemberID,
    // process.env.MONITOR_ACCOUNT_PASSWORD as string
  );

  const data = new FormData();
  data.append("GoodsID", GoodsID);
  data.append("MemberID", MemberID);
  data.append("Sign", Sign);

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/hybridDetailInfo`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    // logger("response.data", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching hybrid detail info:", error);
    throw error;
  }
};

// Get Alarms or Alerts  of a inverter
// Function to get log info
export const plantsAlertById = async (
  GroupAutoID: string,
  MemberID: string
): Promise<ApiResponse> => {
  const Sign = await getSign(
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
  );
logger("data \n", {GroupAutoID,MemberID,Sign});
  const data = new FormData();
  data.append("GroupAutoID", GroupAutoID);
  data.append("MemberID", MemberID);
  data.append("selectType", 1);
  data.append("Sign", Sign);

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getLogInfo`,
    headers: {
      "Content-Type": "multipart/form-data",
      ...data.getHeaders(),
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error fetching log info:", error);
    throw error;
  }
};

// ✅ Config
const BASE_URL = "https://eu.uzenergy-portal.com"; // or https://www.uzenergy-portal.com

export async function getBatteryDeviceData(
  sn: string,
  date: string,
  pageNo = 1,
  pageSize = 10
) {
  const sign =
    "rGBk7HcF//MkjqLLwFR3Xn0hLloQaSeqxJVN6JJzqCpTcr4kI30lGcoZVVrTMPQ7fWo9WN68wBTXTc8W5LWlBYJ8hTT99HDMzM9HIqyBZQLVaY8ICpBATj99bR7nQ6eUDUMLv4UCbvB9D3LOWkamPve62yW2qvqCXSS1Ib7rTsaCAAkgXP+TtMpfoFufqCA+fp0xmRCxU9ksU61puMFZACpb7BQRlS7lnG+xARGJGIUwB9Eu59eNz1ZQQ1lsDfR6TJbXiaLUwZ8dEDZuSGzpmAmEvqwznEvclRB+1GR9BKhKmJhZhHDGZM+AzQaykmNffiEW8/HyT5+/wK/ZwzJKyA==";

  const headers = {
    "Content-Type": "application/json",
    "X-Uz-Sign": sign,
  };

  const url = `${BASE_URL}/boot/want/ots/search/${sn}/${date}?pageNo=${pageNo}&pageSize=${pageSize}`;

  try {
    const response = await axios.get(url, { headers });
    // console.log("✅ Success:", response.data);
    return response.data;
  } catch (error: any) {
    logger(
      "❌ Error fetching battery data:",
      error.response?.data || error.message
    );
  }
}

// Function to delete group info
export const deletePlantThirdParty = async (
  MemberID: string,
  GroupAutoID: string
): Promise<ApiResponse> => {
  const Sign = await getSign(
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
  );
  const data = new FormData();
  data.append("MemberID", MemberID);
  data.append("GroupAutoID", GroupAutoID);
  data.append("Sign", Sign);

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/deleteGroupInfo`,
    headers: {
      "Content-Type": "multipart/form-data",
      ...data.getHeaders(),
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error deleting group info:", error);
    throw error;
  }
};

/** ==================== MODBUS REGISTER READING ==================== */

/** Helper functions for value decoding */
const mul = (k: number) => (v: number | string | null) =>
  v == null ? null : Math.round(Number(v) * k);

const div = (k: number) => (v: number | string | null) =>
  v == null ? null : Number(v) / k;

const fHz = div(100); // 0.01 Hz → Hz
const fV = div(10); // 0.1 V → V

/** Modbus Register Map Interface */
interface ModbusRegisterMap {
  reg: string;
  section: string;
  field: string;
  decode?: (v: number | string | null) => number | string | null;
  unit?: string;
  rw?: "R" | "RW";
}

/**
 * MODBUS REGISTER MAP
 * Maps register addresses to their corresponding fields with decoding functions
 */
export const MODBUS_REGISTER_MAP: ModbusRegisterMap[] = [
  // Runtime Data (usually always available when inverter is online)
  {
    reg: "0001",
    section: "Runtime Data",
    field: "PV1 Voltage",
    decode: fV,
    unit: "V",
    rw: "R",
  },
  {
    reg: "0002",
    section: "Runtime Data",
    field: "PV1 Current",
    decode: div(10),
    unit: "A",
    rw: "R",
  },
  {
    reg: "0003",
    section: "Runtime Data",
    field: "PV1 Power",
    unit: "W",
    rw: "R",
  },
  {
    reg: "0005",
    section: "Runtime Data",
    field: "PV2 Voltage",
    decode: fV,
    unit: "V",
    rw: "R",
  },
  {
    reg: "0006",
    section: "Runtime Data",
    field: "PV2 Current",
    decode: div(10),
    unit: "A",
    rw: "R",
  },
  {
    reg: "0007",
    section: "Runtime Data",
    field: "PV2 Power",
    unit: "W",
    rw: "R",
  },
  {
    reg: "000F",
    section: "Runtime Data",
    field: "Grid Voltage",
    decode: fV,
    unit: "V",
    rw: "R",
  },
  {
    reg: "0010",
    section: "Runtime Data",
    field: "Grid Current",
    decode: div(10),
    unit: "A",
    rw: "R",
  },
  {
    reg: "0011",
    section: "Runtime Data",
    field: "Grid Frequency",
    decode: fHz,
    unit: "Hz",
    rw: "R",
  },
  {
    reg: "0013",
    section: "Runtime Data",
    field: "Grid Power",
    unit: "W",
    rw: "R",
  },
  {
    reg: "001B",
    section: "Runtime Data",
    field: "Battery Voltage",
    decode: fV,
    unit: "V",
    rw: "R",
  },
  {
    reg: "001C",
    section: "Runtime Data",
    field: "Battery Current",
    decode: div(10),
    unit: "A",
    rw: "R",
  },
  {
    reg: "001D",
    section: "Runtime Data",
    field: "Battery Power",
    unit: "W",
    rw: "R",
  },
  {
    reg: "001E",
    section: "Runtime Data",
    field: "Battery SOC",
    unit: "%",
    rw: "R",
  },
  {
    reg: "0025",
    section: "Runtime Data",
    field: "Load Power",
    unit: "W",
    rw: "R",
  },
  {
    reg: "003D",
    section: "Runtime Data",
    field: "Inverter Temperature",
    decode: div(10),
    unit: "°C",
    rw: "R",
  },
  {
    reg: "0054",
    section: "Runtime Data",
    field: "Total Energy (Today)",
    decode: div(100),
    unit: "kWh",
    rw: "R",
  },
  {
    reg: "0056",
    section: "Runtime Data",
    field: "Total Energy (Lifetime)",
    decode: div(10),
    unit: "kWh",
    rw: "R",
  },

  // Battery Settings
  {
    reg: "2110",
    section: "Battery Setting",
    field: "Battery type",
    unit: "enum",
    rw: "RW",
  },
  {
    reg: "21B6",
    section: "Battery Setting",
    field: "Battery capacity",
    unit: "Ah",
    rw: "RW",
  },
  {
    reg: "21B4",
    section: "Battery Setting",
    field: "Batt charge efficiency",
    unit: "%",
    rw: "RW",
  },
  {
    reg: "21BD",
    section: "Battery Setting",
    field: "Tempco",
    unit: "mV/°C",
    rw: "RW",
  },

  // Network Settings
  {
    reg: "3060",
    section: "Network Setting",
    field: "SSID",
    unit: "string",
    rw: "RW",
  },
  {
    reg: "3070",
    section: "Network Setting",
    field: "Wi-Fi password",
    unit: "string",
    rw: "RW",
  },

  // Grid Settings / Protection
  {
    reg: "5101",
    section: "Grid Settings",
    field: "Standard Code",
    unit: "enum",
    rw: "RW",
  },
  {
    reg: "5000",
    section: "Grid Settings",
    field: "First Connect Delay Time(s)",
    unit: "s",
    rw: "RW",
  },
  {
    reg: "5001",
    section: "Grid Settings",
    field: "Reconnect Delay Time (s)",
    unit: "s",
    rw: "RW",
  },
  {
    reg: "502E",
    section: "Grid Settings",
    field: "First Connect Power Gradient(%/min)",
    unit: "s (ramp)",
    rw: "RW",
  },
  {
    reg: "5019",
    section: "Grid Settings",
    field: "Reconnect Power Gradient(%/min)",
    unit: "%/min",
    rw: "RW",
  },

  // Level 1 Protection
  {
    reg: "5002",
    section: "Grid Settings",
    field: "Frequency High Loss Level_1(Hz)",
    decode: fHz,
    unit: "Hz",
    rw: "RW",
  },
  {
    reg: "5003",
    section: "Grid Settings",
    field: "Frequency Low Loss Level_1(Hz)",
    decode: fHz,
    unit: "Hz",
    rw: "RW",
  },
  {
    reg: "5004",
    section: "Grid Settings",
    field: "Voltage High Loss Level_1(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },
  {
    reg: "5005",
    section: "Grid Settings",
    field: "Voltage Low Loss Level_1(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },
  {
    reg: "5006",
    section: "Grid Settings",
    field: "Frequency High Loss Time Level_1(ms)",
    unit: "ms",
    rw: "RW",
  },
  {
    reg: "5007",
    section: "Grid Settings",
    field: "Frequency Low Loss Time Level_1(ms)",
    unit: "ms",
    rw: "RW",
  },
  {
    reg: "5008",
    section: "Grid Settings",
    field: "Voltage High Loss Time Level_1(ms)",
    unit: "ms",
    rw: "RW",
  },
  {
    reg: "5009",
    section: "Grid Settings",
    field: "Voltage Low Loss Time Level_1(ms)",
    unit: "ms",
    rw: "RW",
  },

  // Level 2 Protection
  {
    reg: "500A",
    section: "Grid Settings",
    field: "Frequency High Loss Level_2(Hz)",
    decode: fHz,
    unit: "Hz",
    rw: "RW",
  },
  {
    reg: "500B",
    section: "Grid Settings",
    field: "Frequency Low Loss Level_2(Hz)",
    decode: fHz,
    unit: "Hz",
    rw: "RW",
  },
  {
    reg: "500C",
    section: "Grid Settings",
    field: "Voltage High Loss Level_2(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },
  {
    reg: "500D",
    section: "Grid Settings",
    field: "Voltage Low Loss Level_2(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },
  {
    reg: "500E",
    section: "Grid Settings",
    field: "Frequency High Loss Time Level_2(ms)",
    unit: "ms",
    rw: "RW",
  },
  {
    reg: "500F",
    section: "Grid Settings",
    field: "Frequency Low Loss Time Level_2(ms)",
    unit: "ms",
    rw: "RW",
  },
  {
    reg: "5010",
    section: "Grid Settings",
    field: "Voltage High Loss Time Level_2(ms)",
    unit: "ms",
    rw: "RW",
  },
  {
    reg: "5011",
    section: "Grid Settings",
    field: "Voltage Low Loss Time Level_2(ms)",
    unit: "ms",
    rw: "RW",
  },

  // Grid Connection Limits
  {
    reg: "507B",
    section: "Grid Settings",
    field: "Grid First Connection Voltage Low Limit(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },
  {
    reg: "507A",
    section: "Grid Settings",
    field: "Grid First Connection Voltage High Limit(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },
  {
    reg: "5013",
    section: "Grid Settings",
    field: "Grid First Connection Frequency Low Limit(Hz)",
    decode: fHz,
    unit: "Hz",
    rw: "RW",
  },
  {
    reg: "5012",
    section: "Grid Settings",
    field: "Grid First Connection Frequency High Limit(Hz)",
    decode: fHz,
    unit: "Hz",
    rw: "RW",
  },
  {
    reg: "5028",
    section: "Grid Settings",
    field: "Grid Reconnection Voltage Low Limit(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },
  {
    reg: "5027",
    section: "Grid Settings",
    field: "Grid Reconnection Voltage High Limit(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },

  // Derating Toggles
  {
    reg: "5080",
    section: "Grid Settings",
    field: "Under Frequency Derating (toggle)",
    unit: "bool",
    rw: "RW",
  },
  {
    reg: "501E",
    section: "Grid Settings",
    field: "Over Voltage Derating (toggle)",
    unit: "V-derate point",
    rw: "RW",
    decode: fV,
  },

  // Feature Settings
  {
    reg: "5064",
    section: "Feature Setting",
    field: "HVRT Triggering Threshold(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },
  {
    reg: "5063",
    section: "Feature Setting",
    field: "LVRT Triggering Threshold(V)",
    decode: fV,
    unit: "V",
    rw: "RW",
  },
  {
    reg: "5104",
    section: "Feature Setting",
    field: "Derated Power(%)",
    unit: "%",
    rw: "RW",
  },
  {
    reg: "510E",
    section: "Feature Setting",
    field: "Island Detection (toggle)",
    unit: "bool",
    rw: "RW",
  },
  {
    reg: "5115",
    section: "Feature Setting",
    field: "Terminal Resistor (toggle)",
    unit: "bool",
    rw: "RW",
  },

  // Advanced Settings
  {
    reg: "3005",
    section: "Advance Setting",
    field: "Power control",
    unit: "W derate set",
    rw: "RW",
  },
  {
    reg: "30B5",
    section: "Advance Setting",
    field: "Meter location",
    unit: "enum",
    rw: "RW",
  },
  {
    reg: "30B9",
    section: "Advance Setting",
    field: "Maximum feed in grid power(W)",
    unit: "W (U32)",
    rw: "RW",
  },
  {
    reg: "5033",
    section: "Advance Setting",
    field: "Reactive power control setting time (s)",
    unit: "s",
    rw: "RW",
  },
  {
    reg: "5030",
    section: "Advance Setting",
    field: "Reactive power control mode",
    unit: "enum",
    rw: "RW",
  },
  {
    reg: "5031",
    section: "Advance Setting",
    field: "cosφ",
    unit: "×1000",
    rw: "RW",
    decode: div(1000),
  },
  {
    reg: "2100",
    section: "Advance Setting",
    field: "Hybrid work mode",
    unit: "enum",
    rw: "RW",
  },
  {
    reg: "1A44",
    section: "Advance Setting",
    field: "Grid Voltage type (Nominal Voltage)",
    unit: "V",
    rw: "R",
    decode: fV,
  },
];

/** Get unique list of all register addresses */
const getRegisterList = (): string[] => {
  return [...new Set(MODBUS_REGISTER_MAP.map((m) => m.reg))];
};

/**
 * Read Modbus registers from inverter
 * @param GoodsID - Serial number of the inverter
 * @param MemberID - Member ID for authentication
 * @param registerList - Optional custom list of registers to read (default: all from MAP)
 * @returns Grouped register data with decoded values
 */
export const readInverterModbusRegisters = async (
  GoodsID: string,
  MemberID: string,
  registerList?: string[]
): Promise<ApiResponse> => {
  const Sign = await getSign(
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
  );

  const regsToRead = registerList || getRegisterList();

  const data = new FormData();
  data.append("GoodsID", GoodsID);
  data.append("MemberID", MemberID);
  data.append("ModbusArr", JSON.stringify(regsToRead));
  data.append("Sign", Sign);

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getInverterSeting`,
    headers: {
      ...data.getHeaders(),
    },
    data,
    timeout: 30000,
  };

  try {
    const response: AxiosResponse<any[]> = await axios.request(config);
    const rows = response.data || [];

    // Debug logging - remove after testing
    // console.log(
    //   "📡 Modbus API Response:",
    //   JSON.stringify(response.data, null, 2)
    // );
    // console.log("📊 Rows received:", rows.length);

    // Build raw register map from response
    const rawMap: Record<string, number | string | null> = {};

    for (const r of rows) {
      // Check if response format is { "Modbus": "5002", "Value": "5150" }
      if (r.Modbus || r.modbus) {
        const key = String(r.Modbus ?? r.modbus ?? "")
          .replace(/^0x/i, "")
          .toUpperCase();
        rawMap[key] = r.Value ?? r.value ?? null;
      }
      // Check if response format is { "5002": "5150", "5004": "2640" }
      else {
        for (const [regKey, regValue] of Object.entries(r)) {
          const normalizedKey = regKey.replace(/^0x/i, "").toUpperCase();
          rawMap[normalizedKey] = regValue as any;
        }
      }
    }

    // console.log("🗺️ Raw register map:", rawMap);

    // Build grouped and normalized payload
    const grouped: Record<string, any> = {};
    for (const m of MODBUS_REGISTER_MAP) {
      const rawVal = rawMap[m.reg.toUpperCase()] ?? null;
      const pretty = m.decode
        ? m.decode(Number(rawVal))
        : rawVal === null
        ? null
        : Number(rawVal);

      if (!grouped[m.section]) {
        grouped[m.section] = {};
      }

      grouped[m.section][m.field] = {
        value: pretty,
        unit: m.unit ?? "",
        reg: m.reg,
        rw: m.rw ?? "RW",
        raw: rawVal,
      };
    }

    return {
      serial: GoodsID,
      // registersRequested: regsToRead,
      data: grouped,
      // raw: rawMap,
    };
  } catch (error: any) {
    console.error(
      "Error reading inverter Modbus registers:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Write Modbus registers to inverter
 * @param GoodsID - Serial number of the inverter
 * @param MemberID - Member ID for authentication
 * @param registerValues - Object with register addresses as keys and values to write
 * @param callbackUrl - Optional callback URL for command result (defaults to configured URL)
 * @returns API response (command is sent, result comes via callback)
 */
export const writeInverterModbusRegisters = async (
  GoodsID: string,
  MemberID: string,
  registerValues: Record<string, string | number>,
  callbackUrl?: string
): Promise<ApiResponse> => {
  const Sign = await getSign(
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
  );

  // Use configured callback URL or provided one
  const url =
    callbackUrl ||
    process.env.MODBUS_CALLBACK_URL ||
    `http://192.168.18.40:5000/api/modbus/callback/write-result`;

  const data = new FormData();
  data.append("GoodsID", GoodsID);
  data.append("MemberID", MemberID);
  data.append("ModbusArr", JSON.stringify(registerValues));
  data.append("url", url);
  data.append("Sign", Sign);

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/setRemoteSetting`,
    headers: {
      ...data.getHeaders(),
    },
    data,
    timeout: 30000,
  };

  try {
    // logger("📝 Writing Modbus registers:", registerValues);
    // logger("🔗 Callback URL:", url);

    const response: AxiosResponse<ApiResponse> = await axios.request(config);

    // logger("✅ Write command sent. Status:", response?.data?.status);
    // logger("⏳ Result will be sent to callback URL within 60-600 seconds");

    return {
      status: response?.data?.status,
      message:
        "Write command sent successfully. Result will be sent to callback URL.",
      callbackUrl: url,
      registersWritten: Object.keys(registerValues),
    };
  } catch (error: any) {
    logger(
      "❌ Error writing inverter Modbus registers:",
      error?.response?.data || error?.message
    );
    throw error;
  }
};

// Function to get V1000 Line data
export const getV1000Line = async (
  MemberID: string,
  GroupAutoID: string,
  Type: string,
  date: string
): Promise<ApiResponse> => {
  const Sign = await getSign(
    MemberID,
    process.env.MONITOR_ACCOUNT_PASSWORD as string
  );

  const data = qs.stringify({
    MemberID,
    GroupAutoID,
    Type,
    date,
    Sign,
  });

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getV1000Line`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data,
  };

  try {
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error("Error fetching V1000 Line data:", error);
    throw error;
  }
};

export const getHybridLine = async (
  GoodsID: string,
  MemberID: string,
  Type: string,
  date: string
): Promise<ApiResponse> => {
  try {
    const Sign = await getSign(
      MemberID,
      process.env.MONITOR_ACCOUNT_PASSWORD as string
    );
    const data = new FormData();
    data.append("GoodsID", GoodsID);
    data.append("Type", Type);
    data.append("MemberID", MemberID);
    data.append("date", date);
    data.append("Sign", Sign);

    const config = {
      method: "post" as const,
      maxBodyLength: Infinity,
      url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getHybridLine`,
      headers: {
        "Content-Type": "multipart/form-data",
        ...data.getHeaders(),
      },
      data,
    };
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching Hybrid Line data:", error);
    throw error;
  }
};

export const getEndUserSummaryInfo = async (Page: string = "1"): Promise<ApiResponse> => {
  try {
    const Sign = await getOperationSignature(
      process.env.SERVICE_ACCOUNT_ID as string,
      process.env.SERVICE_ACCOUNT_PASS as string
    );

   
    const data = new FormData();
    data.append("MemberID", process.env.SERVICE_ACCOUNT_ID as string);
    data.append("Page", Page);
    data.append("Sign", Sign);

    const config = {
      method: "post" as const,
      maxBodyLength: Infinity,
      url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getEndUserSummaryInfo`,
      headers: {
        "Content-Type": "multipart/form-data",
        ...data.getHeaders(),
      },
      data,
    };
    const response: AxiosResponse<ApiResponse> = await axios.request(config);

    return response?.data;
  } catch (error: any) {
    logger("Error:", error?.message || error);
    throw error;
  }
};

// Get Plant Count by Id
export const getGroupDetail = async (MemberID: string, GroupAutoID: string) => {
  try {
    const Sign = await getSign(
      MemberID,
      process.env.MONITOR_ACCOUNT_PASSWORD as string
    );
    const data = new FormData();
    data.append("MemberID", MemberID);
    data.append("GroupAutoID", GroupAutoID);
    data.append("Sign", Sign);

    const config = {
      method: "post" as const,
      maxBodyLength: Infinity,
      url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getGroupDetail`,
      headers: {
        "Content-Type": "multipart/form-data",
        ...data.getHeaders(),
      },
      data,
    };
    const response: AxiosResponse<ApiResponse> = await axios.request(config);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching Group Detail:", error);
    throw error;
  }
};