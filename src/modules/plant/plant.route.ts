import { Router } from "express";
import { checkToken, upload } from "../../imports";
import PlantController from "./plant.controller";
import UploadController from "../../middlewares/fileUpload";

const router = Router();

router.post("/upload_files", upload.any(), UploadController.UploadFiles);
router.post("/createPlant", checkToken, PlantController.createPlant);
router.get("/getAllPlants", checkToken, PlantController.getAllPlants);
// router.get("/getPlantById/:id", checkToken, PlantController.getPlantById);
// router.patch("/updatePlant/:id", checkToken, PlantController.updatePlant);
// router.delete("/deletePlant/:id", checkToken, PlantController.deletePlant);
export default router;
