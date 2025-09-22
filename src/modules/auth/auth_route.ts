import { Router } from "express";
import {
  changePassword,
  checkToken,
  forgotPassword,
  
  resetPassword,
  verifyOTP,
  // login,
  googleLogin,
  appleLogin,

} from "../../imports";
import AuthController from "./auth_controller";

const router = Router();

router.post("/login", AuthController.login);
router.post("/apple-login", appleLogin);
router.post("/google-login", googleLogin);
router.post("/register", AuthController.register);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", checkToken, resetPassword);
router.post("/change-password", checkToken, changePassword);

export default router;
