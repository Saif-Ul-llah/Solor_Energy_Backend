import { Router } from "express";
import {
  getV1000Line,
  Response,
  Request,
  plantsAlertById,
  getHybridLine,
  getBatteryDeviceData,
} from "../imports";

const router = Router();

router.post(
  "/redirection/getV1000Line",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const response = await getV1000Line(
        req.body.MemberID,
        req.body.GroupAutoID,
        req.body.Type,
        req.body.date
      );
      return res.status(200).json(response);
    } catch (error: any) {
      console.error("Error fetching V1000 Line data:", error);
      return res.status(500).json(error.message);
    }
  }
);

router.post(
  "/redirection/getLogInfo",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const response = await plantsAlertById(
        req.body.GoodsID,
        req.body.MemberID
      );
      return res.status(200).json(response);
    } catch (error: any) {
      console.error("Error fetching Log Info:", error);
      return res.status(500).json(error.message);
    }
  }
);

router.post(
  "/redirection/getHybridLine",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const response = await getHybridLine(
        req.body.GoodsID,
        req.body.MemberID,
        req.body.Type,
        req.body.date
      );
      return res.status(200).json(response);
    } catch (error: any) {
      console.error("Error fetching Hybrid Line:", error);
      return res.status(500).json(error.message);
    }
  }
);

router.post(
  "/redirection/getBatteryDeviceData",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const response = await getBatteryDeviceData(req.body.sn, req.body.date);

      return res.status(200).json(response);
    } catch (error: any) {
      console.error("Error fetching Battery Device Data:", error);
      return res.status(500).json(error.message);
    }
  }
);

export default router;
