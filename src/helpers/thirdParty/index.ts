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
  logger("\n\n\ncheck they are hilting on type battery\n\n");
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
    "progziel01",
    "123456"
    // MemberID,
    // process.env.MONITOR_ACCOUNT_PASSWORD as string
  );

  const data = new FormData();
  data.append("GoodsID", GoodsID);
  data.append("MemberID", "progziel01");
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
const APP_KEY = "cdcfd318-lb04-4b40-8d3b-0e1f8aa8e39d";
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCzU+9VNiSBRMGj
EU68auMFPFJfcaafcuuToHFiHdNUE4ZFD2YRKAS1XJlIwFBRZ87GG5BmRFpZGXHL
5yHISUBcPLMvT67Y961OXJ369ZCMjkVI4vsGlczjj9+fiHIhHQDIihmr4Gc4I5BX
dmgnTU27VK38PymhUSvCslg/5tciLguQZKEzWkfpjpfp0iAinUE7ypRh5Z0q+o7p
s8QgZIU4FNDmXuZMBCN2n0soV5FJCZa11nahJ7yxo78xP46vkoCcsKG6AP57krOf
4NXH/ifDF/Ro0VHUh7m8gKX5EkylykwzfhD3dKQ0zm4XLS+Ss0Bex65D9pu1ZvK9
gAF5uby7AgMBAAECggEATUAzMboJL8a2w9CI4pIJChBaS9Nhu/59jTLopSPEDcv7
Y3Smu21J2fbx8W0nLGpToPPu2J9JbGiRpQ0EeItVtmZPqmnhIIZRmhg71ghDJMmE
/0kIamXNxZoM82SMBcfAtqMHPAuHa5+mZocThxq+CZ0I9kkfXebhuxWo/p4qvwXt
/CjwXel76J3JDAau0aq4mgTW0imEqm1seEo6yt6aij5AWbvNMF9iy+2zqiWIzuuY
jFf8lhkJopONmIF5XwG0hprHdTskkI59PWwAOnykAdlMu1pCzO0/o8HCJ4RRTxJM
3Uc8vIIG8oZvw5A55aZ7e7yC3bChrcT/icWxqDRzgQKBgQDKNj0jby/N/3RtQMgd
5A5jM0UhHZU6AL4kDqRHrISOnIh7JdynRJNSy96ZxyEhGdpF/6xDT+Vd7Mr/B3/E
HrHtBKO8OAIvfYduYqpPwRtK6Wev/o2a/vC8kN1j2SPBl2VACfPWCleojl+d3Qvr
UGsIcN/X0Stcan1vLaGvGmu2EwKBgQDjB2TSEfyKb1icK/q/yvwqz+OsqA5P+ml5
0e6YxS56HkLmLs6keikK41SujU6j8FLdlpq0UGkJknSkMpuTbgd/3BnTlwJGN6/j
RbBqQdGJ8uKNNHKXyzdD0SpZneDTRvHQwR14xTn36MKBgEcoDzWQoLigKsz+dGsG
gtYFWhlTuQKBgCAoG/Tkm5+Qvj0ZjjliqP8Rii7H+5EryREG2w0i3DmpnvKmhL58
40jJbu7ZgeU3rURwcj6KGBmlrGp+EM1pbDYbBMbLyV0wAzeErTzdoq95CqosOuyp
GjOCfhKA13TT1KAodQRWxLXjXkVGf7y+HydKe+5gLxsVPDlP8mRcOUDNAoGAZPq+
72ksqO6JvT0alQBWVTyOihdd9ljtXU/xDmZ2G78mBng/VY04gC1JVzJnDigw03rP
aPBzJ9zKoNYZuOOx1j8yBZkfW9gdFbvDkh+gcflkp2Xyqm2rMTDx41aDz7W4jR+4
WiVveUNAcJV8EOdi7edu917SO0PQ7t53D35Z0ZECgYAgN5Noe+7Wa7Hg/PfQTX0D
9UlnzUNsE+3W0HpESWM9zhpqXWvVeWjTOUXP/EqLWYWXx9NX7YlRHxBfnmFRP2FS
vfIguchzuFU4V5BtCTKIJ86aQQ0OPXR1xdDonbIVpb4p7aoOHSds5f1a8d9L+WY4
Oy/pc4CTa7aLmLDy8fX4Sw==
-----END PRIVATE KEY-----`;

/*==================== Generate RSA + MD5 signature identical to the web tool ============================ */

function generateSign(privateKey: string, input: string) {
  const signer = crypto.createSign("RSA-MD5");
  signer.update(input, "utf8");
  const signature = signer.sign(privateKey, "base64");
  return signature;
}

export async function getBatteryDeviceData(
  sn: string,
  date: string,
  pageNo = 1,
  pageSize = 10
) {
  const timestamp = Date.now().toString();

  const sign = await generateSign(PRIVATE_KEY, APP_KEY);
  logger(sign);
  const headers = {
    "Content-Type": "application/json",
    "X-Uz-Sign": sign,
  };

  const url = `${BASE_URL}/boot/want/ots/search/${sn}/${date}?pageNo=${pageNo}&pageSize=${pageSize}`;

  try {
    const response = await axios.get(url, { headers });
    console.log("✅ Success:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error fetching battery data:",
      error.response?.data || error.message
    );
  }
}
