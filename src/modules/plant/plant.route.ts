import { Router } from "express";
import { checkToken } from "../../imports";
import PlantController from "./plant.controller";

const router = Router();

// router.post("/reset-password", checkToken, AuthController.resetPassword);
// router.post("/change-password", checkToken, AuthController.changePassword);

export default router;
