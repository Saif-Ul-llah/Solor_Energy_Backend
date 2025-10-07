import { Router } from "express";
import { checkToken } from "../../imports";
import AuthController from "./auth.controller";

const router = Router();

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-otp", AuthController.verifyOTP);
router.post("/reset-password", checkToken, AuthController.resetPassword);
router.post("/change-password", checkToken, AuthController.changePassword);

// ======================== User Management ========================
router.get("/user_list" , checkToken, AuthController.userList);
router.get("/getUserById" , checkToken, AuthController.getUserById);
// router.put("/update_user/:id" , checkToken, AuthController.updateUser);
// router.delete("/delete_user/:id" , checkToken, AuthController.deleteUser);

export default router;
