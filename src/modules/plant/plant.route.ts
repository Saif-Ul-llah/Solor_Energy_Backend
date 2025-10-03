import { Router } from "express";
import { checkToken } from "../../imports";
import PlantController from "./plant.controller";

const router = Router();

// router.post("/reset-password", checkToken, AuthController.resetPassword);
// router.post("/change-password", checkToken, AuthController.changePassword);

router.post("/createPlant", checkToken, PlantController.createPlant);
// router.get("/getAllPlants", checkToken, PlantController.getAllPlants);
// router.get("/getPlantById/:id", checkToken, PlantController.getPlantById);
// router.patch("/updatePlant/:id", checkToken, PlantController.updatePlant);
// router.delete("/deletePlant/:id", checkToken, PlantController.deletePlant);
export default router;
