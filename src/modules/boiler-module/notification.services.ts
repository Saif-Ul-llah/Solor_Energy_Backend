import { User } from "@prisma/client";
import { HttpError, logger, dotenv } from "../../imports";
import NotificationRepo from "./notification.repo";
dotenv.config();

class NotificationService {
  // public static async getPlantById(id: string): Promise<Plant | null> {
  //   const plant = await NotificationRepo.getPlantByIdRepo(id);
  //   return plant;
  // }
}

export default NotificationService;
