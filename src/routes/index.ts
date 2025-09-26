import express from "express";
import authRouter from "../modules/auth/auth_route";

const router = express.Router();

router.use(authRouter);

export { router as allRoutes };
