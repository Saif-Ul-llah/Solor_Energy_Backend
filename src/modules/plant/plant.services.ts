import { User } from "@prisma/client";
import { HttpError, PlantInterface, sendMail } from "../../imports";
import PlantRepo from "./plant.repo";

class PlantService {
  public static createPlant = async (payload: PlantInterface) => {
    const plant = await PlantRepo.createPlant(payload);
    return plant;
  };

  public static getAllPlants = async (user: User) => {
    return await PlantRepo.getAllPlants(user);
  };
}

export default PlantService;
