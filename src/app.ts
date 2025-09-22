import { appConfig, allRoutes, errorHandler, Server } from "./imports";
import { createServer } from "http";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";

export const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer);

app.use(express.json({ limit: "50mb" }));

// const corsOptions = {
//   origin: ["http://217.65.145.67", "http://localhost:5000"],
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };
// app.use(cors(corsOptions));
app.use(cors());

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("<h1><U><I><B>Server is running...</U></I></B></h1>");
});

app.use("/", (req: Request, res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

app.use("/api", allRoutes);

app.use(errorHandler);

httpServer.listen(appConfig.port, () => {
  console.log(
    `Server is running on: ${appConfig.appUrl || "http://localhost:5000"}`
  );
});
