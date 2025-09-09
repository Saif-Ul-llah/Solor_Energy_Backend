import { dotenv } from "./../imports";
dotenv.config();

interface AppConfig {
  port: number;
  dbUrl: string;
  jwtSecret: string;
  appUrl: string;
  postgresPassword: string;
  googleMapsKey: string;
  emailUser: string;
  emailPassword: string;
  emailHost: string;
  emailPort: number;
  emailTo: string;
}

export const appConfig: AppConfig = {
  port: parseInt(process.env.PORT || "5000", 10),
  dbUrl:
    process.env.DB_URL ||
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
