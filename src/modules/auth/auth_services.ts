import { encryptPass, registerInterface } from "../../imports";
import AuthRepo from "./auth_repo";

class AuthServices {
  public static registerService = async (payload: registerInterface) => {
    payload.password = await encryptPass(payload.password);
    const user = await AuthRepo.registerRepo(payload);
    return user;
  };
}

export default AuthServices;
