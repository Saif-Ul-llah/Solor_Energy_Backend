import { Router } from "express";
import { checkToken, upload } from "../../imports";
import PlantController from "./plant.controller";
import UploadController from "../../middlewares/fileUpload";

const router = Router();

router.post("/upload_files", upload.any(), UploadController.UploadFiles);

router.post("/createPlant", checkToken, PlantController.createPlant);
router.get("/getAllPlants", checkToken, PlantController.getAllPlants);
router.get("/getPlantById", checkToken, PlantController.getPlantById);
router.get("/getDeviceListOfPlant", checkToken, PlantController.getDeviceListOfPlant);
router.put("/updatePlant", checkToken, PlantController.updatePlant);
router.get("/getPlantFlowDiagram", checkToken, PlantController.getPlantFlowDiagram);
router.delete("/deletePlant", checkToken, PlantController.deletePlant);
router.get("/getAnalyticsCount", checkToken, PlantController.getAnalyticsCount);

export default router;
