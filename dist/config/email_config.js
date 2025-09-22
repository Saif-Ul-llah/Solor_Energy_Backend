"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const app_config_1 = require("./app_config");
const port = app_config_1.appConfig.emailPort ? app_config_1.appConfig.emailPort : 465;
exports.transporter = nodemailer_1.default.createTransport({
    host: app_config_1.appConfig.emailHost || "smtp.gmail.com",
    port: port,
    secure: false,
    auth: {
        user: app_config_1.appConfig.emailUser,
        pass: app_config_1.appConfig.emailPassword,
    },
});
