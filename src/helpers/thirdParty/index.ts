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
  Password: string,

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
  Confirm: string,

): Promise<ApiResponse> => {
  // First, get the operation signature
  const signatureResponse = await getOperationSignature(
    process.env.SERVICE_ACCOUNT_ID as string,
    process.env.SERVICE_ACCOUNT_PASS as string,

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
