import express from "express";
import authRouter from "../modules/auth/auth.route";
import PlantRouter from "../modules/plant/plant.route";

const router = express.Router();

router.use(authRouter);
router.use(PlantRouter);

export { router as allRoutes };
