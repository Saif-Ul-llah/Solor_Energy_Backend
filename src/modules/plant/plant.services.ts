import { HttpError, PlantInterface, sendMail } from "../../imports";
import PlantRepo from "./plant.repo";

class PlantService {
  public static createPlant = async (payload: PlantInterface) => {
    const plant = await PlantRepo.createPlant(payload);
    return plant;
  };
}

export default PlantService;
