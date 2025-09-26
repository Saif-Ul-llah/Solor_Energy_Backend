import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import path from "path";
import fs, { stat } from "fs";
import { appConfig, Response } from "../imports";

interface ApiResponse {
  data: object;
  message: string;
  statusCode: number;
  status ?: string
}

export async function encryptPass(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  return hashPassword;
}

export async function comparePassword(
  password: string,
  hashPassword: string | null
): Promise<boolean> {
  if (hashPassword === null) {
    console.error("No password found");
    return false;
  }
  let isPasswordValid = await bcrypt.compare(password, hashPassword);
  return isPasswordValid;
}

export async function generateToken(payload: any) {
  return jwt.sign(payload, appConfig.jwtSecret, { expiresIn: "30d" });
}

export const sendResponse = (
  res: Response,
  statusCode: number,
  message: string,
  data: object = {},
  status ?: string
) => {
  const response: ApiResponse = {
    status,
    message,
    statusCode,
    data,
  };
  return res.status(statusCode).json(response);
};

export function decryptToken(token: string) {
  try {
    let decoded = jwt.verify(token, appConfig.jwtSecret);
    return decoded;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

export function parseInt(id: any): number {
  let intId = parseInt(id);
  return intId;
}

export const trim = (str: string) => {
  return str.replace(/\s+/g, "");
};

export const getCurrentDate = () => {
  let date = new Date();
  return date;
};

export const getCurrentTime = () => {
  let time = new Date();
  return time;
};

export async function generateOTP() {
  let OTP = Math.floor(100000 + Math.random() * 900000);
  return OTP;
}




export function getSignUpHtml(fullName: string, otp: string) {
  return `
              <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
              <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                  <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Grabby</a>
              </div>
              <p style="font-size:1.1em">Hi, ${fullName} </p>
              <p>Thank you for Joining 4Ways. Use the following OTP to complete your Sign Up procedures. OTP is valid for 15 minutes</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
              <p style="font-size:0.9em;">Regards,<br />4Ways</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                  <p>4Ways</p>
              </div>
              </div>
          </div>
       `;
}

export function getEmailVerificationHtml(fullName: string, otp: string) {
  return `
                    <div style="font-family: Helvetica, Arial, sans-serif; min-width: 1000px; overflow: auto; line-height: 1.6;">
                        <div style="margin: 50px auto; width: 70%; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                            <div style="border-bottom: 2px solid #00466a; padding-bottom: 10px; margin-bottom: 20px;">
                                <a href="" style="font-size: 1.6em; color: #00466a; text-decoration: none; font-weight: bold;">Graby App</a>
                            </div>
                            <p style="font-size: 1.2em; margin-bottom: 20px;">Dear ${fullName},</p>
                            <p style="font-size: 1.1em; margin-bottom: 20px;">Thank you for your interest in logging into 4Ways. To proceed, please verify your email address by using the OTP (One-Time Password) provided below. This step is necessary to complete your login process.</p>
                            <h2 style="background: #00466a; color: #fff; padding: 15px; border-radius: 4px; text-align: center; font-size: 1.5em; margin: 0;">
                                ${otp}
                            </h2>
                            <p style="font-size: 1em; margin-top: 20px;">Please note that this OTP is 
                            valid for 15 minutes. If you did not attempt to log in, you may disregard this email.</p>
                            <p style="font-size: 1em; margin-top: 20px;">If you have any questions or need further assistance, feel free to contact our support team.</p>
                            <p style="font-size: 1em; margin-top: 20px;">Best regards,<br />The Graby Team</p>
                            <hr style="border: none; border-top: 1px solid #ddd; margin-top: 20px;" />
                            <div style="float: right; padding: 8px 0; color: #aaa; font-size: 0.9em;">
                                <p>4Ways App</p>
                            </div>
                        </div>
                    </div>
                `;
}
