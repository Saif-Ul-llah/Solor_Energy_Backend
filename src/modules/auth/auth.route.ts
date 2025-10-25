import { Router } from "express";
import { checkToken } from "../../imports";
import AuthController from "./auth.controller";

const router = Router();

router.post("/login", AuthController.login);
router.post("/AddAdmin", AuthController.register);
router.post("/register", checkToken, AuthController.register);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-otp", AuthController.verifyOTP);
router.post("/reset-password", checkToken, AuthController.resetPassword);
router.post("/change-password", checkToken, AuthController.changePassword);
router.post("/refreshToken", AuthController.refreshToken);

// ======================== User Management ========================
router.get("/user_list", checkToken, AuthController.userList);
router.get("/getUserById", checkToken, AuthController.getUserById);
router.put("/update_user", checkToken, AuthController.updateUser);
router.get("/getAllUsers", checkToken, AuthController.getAllUsers);
router.get("/activityLog", checkToken, AuthController.getActivityLog);
router.get("/getDashboardCount", checkToken, AuthController.getDashboardCount);
router.delete("/deleteUserById", checkToken, AuthController.deleteUserById);

export default router;
