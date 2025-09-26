import { encryptPass, HttpError, registerInterface } from "../../imports";
import AuthRepo from "./auth_repo";

class AuthServices {
  public static registerService = async (payload: registerInterface) => {
    let alreadyExists = await AuthRepo.checkEmailExists(payload.email);
    if (alreadyExists) throw HttpError.alreadyExists("Email");
    payload.password = await encryptPass(payload.password);
    const user = await AuthRepo.registerRepo(payload);
    return user;
  };
}

export default AuthServices;
