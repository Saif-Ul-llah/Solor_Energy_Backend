"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const imports_1 = require("./../imports");
imports_1.dotenv.config();
exports.appConfig = {
    port: parseInt(process.env.PORT || "5000", 10),
    dbUrl: process.env.DB_URL ||
        "postgresql://postgres:postgres@localhost:5432/four_ways",
    jwtSecret: process.env.JWT_SECRET || "secret",
    appUrl: process.env.APP_URL || "http://localhost:5000",
    postgresPassword: process.env.POSTGRES_PASSWORD || "postgres",
    emailUser: process.env.EMAIL_USER || "email",
    emailPassword: process.env.EMAIL_PASSWORD || "password",
    emailHost: process.env.EMAIL_HOST || "smtp.gmail.com",
    emailPort: parseInt(process.env.EMAIL_PORT || "465", 10),
    emailTo: process.env.EMAIL_TO || "fullstackwebsitedeveloper11@gmail.com",
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || "",
};
