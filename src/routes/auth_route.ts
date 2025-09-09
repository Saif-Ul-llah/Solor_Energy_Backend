import { Router } from "express";
import {
  changePassword,
  checkToken,
  forgotPassword,
  register,
  resetPassword,
  verifyOTP,
  login,
  googleLogin,
  appleLogin,
} from "../imports";

const router = Router();

router.post("/login", login);
router.post("/apple-login", appleLogin);
router.post("/google-login", googleLogin);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", checkToken, resetPassword);
router.post("/change-password", checkToken, changePassword);

export { router as authRouter };
