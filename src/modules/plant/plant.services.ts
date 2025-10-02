import { HttpError, sendMail } from "../../imports";
import PlantRepo from "./plant.repo";

class PlantService {
  // public static registerService = async (payload: registerInterface) => {
  //   let alreadyExists = await AuthRepo.checkEmailExists(payload.email);
  //   if (alreadyExists) throw HttpError.alreadyExists("Email");
  //   payload.password = await encryptPass(payload.password);
  //   const user = await AuthRepo.registerRepo(payload);
  //   return user;
  // };
}

export default PlantService;
