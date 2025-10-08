import axios, { AxiosResponse } from "axios";
import qs from "qs";
import FormData from "form-data";
import dotenv from "dotenv";
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
