"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = exports.calculateDistance = exports.getCurrentTime = exports.getCurrentDate = exports.trim = exports.sendResponse = void 0;
exports.encryptpass = encryptpass;
exports.comparepassword = comparepassword;
exports.generateToken = generateToken;
exports.decryptToken = decryptToken;
exports.parseInt = parseInt;
exports.generateOTP = generateOTP;
exports.getSignUpHtml = getSignUpHtml;
exports.getEmailVerificationHtml = getEmailVerificationHtml;
const jwt = __importStar(require("jsonwebtoken"));
const bcrypt = __importStar(require("bcrypt"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const imports_1 = require("../imports");
async function encryptpass(password) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    return hashPassword;
}
async function comparepassword(password, hashPassword) {
    if (hashPassword === null) {
        console.error("No password found");
        return false;
    }
    let isPasswordValid = await bcrypt.compare(password, hashPassword);
    return isPasswordValid;
}
async function generateToken(payload) {
    return jwt.sign(payload, imports_1.appConfig.jwtSecret, { expiresIn: "30d" });
}
const sendResponse = (res, statusCode, message, data = {}) => {
    const response = {
        data,
        message,
        statusCode,
    };
    return res.status(statusCode).json(response);
};
exports.sendResponse = sendResponse;
function decryptToken(token) {
    try {
        let decoded = jwt.verify(token, imports_1.appConfig.jwtSecret);
        return decoded;
    }
    catch (error) {
        console.error("Error verifying token:", error);
        return null;
    }
}
function parseInt(id) {
    let intId = parseInt(id);
    return intId;
}
const trim = (str) => {
    return str.replace(/\s+/g, "");
};
exports.trim = trim;
const getCurrentDate = () => {
    let date = new Date();
    return date;
};
exports.getCurrentDate = getCurrentDate;
const getCurrentTime = () => {
    let time = new Date();
    return time;
};
exports.getCurrentTime = getCurrentTime;
async function generateOTP() {
    let OTP = Math.floor(100000 + Math.random() * 900000);
    return OTP;
}
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = (degree) => degree * (Math.PI / 180);
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
};
exports.calculateDistance = calculateDistance;
class File {
}
exports.File = File;
_a = File;
File.getFileName = async (file) => {
    const { name, ext } = path_1.default.parse(file);
    const fileName = `${name}${ext}`;
    return fileName;
};
File.getFilePath = async (fileName) => {
    const __dirname = path_1.default.dirname(path_1.default.dirname(path_1.default.dirname(fileName)));
    const filePath = path_1.default.resolve(__dirname, "src", "public", "uploads", "files", fileName);
    return filePath;
};
File.removeFileFromFs = async (params) => {
    try {
        const fileName = await _a.getFileName(params);
        if (!fileName) {
            throw new Error("File Name is Invalid");
        }
        const filePath = await _a.getFilePath(fileName);
        await fs_1.default.promises.access(filePath, fs_1.default.constants.F_OK);
        await fs_1.default.promises.unlink(filePath);
        return { status: "Success", message: "File deleted successfully" };
    }
    catch (err) {
        if (err.code === "ENOENT") {
            return { status: "error", message: "File not found" };
        }
        else {
            return { status: "error", message: `Error: ${err.message}` };
        }
    }
};
function getSignUpHtml(fullName, otp) {
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
function getEmailVerificationHtml(fullName, otp) {
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
