"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const imports_1 = require("./imports");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
exports.app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(exports.app);
exports.io = new imports_1.Server(httpServer);
exports.app.use(express_1.default.json({ limit: "50mb" }));
// const corsOptions = {
//   origin: ["http://217.65.145.67", "http://localhost:5000"],
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };
// app.use(cors(corsOptions));
exports.app.use((0, cors_1.default)());
exports.app.get("/", (req, res, next) => {
    res.send(`
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Product Management Animation</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f0f0f0;
    }
    svg {
      width: 512px;
      height: 512px;
    }
  </style>
</head>
<body>
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect x="0" y="0" width="512" height="512" fill="#ffffff"/>

    <!-- First "+" Shape (Clockwise Rotation) -->
    <g transform="translate(82, 397)">
      <animateTransform
        attributeName="transform"
        additive="sum"
        type="rotate"
        from="0 0 0"
        to="360 0 0"
        dur="5s"
        repeatCount="indefinite"/>
      <path d="M0 -12 L0 12" stroke="#263235" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-12 0 L12 0" stroke="#263235" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <!-- Second "+" Shape (Counterclockwise Rotation) -->
    <g transform="translate(124, 358)">
      <animateTransform
        attributeName="transform"
        additive="sum"
        type="rotate"
        from="0 0 0"
        to="-360 0 0"
        dur="5s"
        repeatCount="indefinite"/>
      <path d="M0 -12 L0 12" stroke="#263235" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-12 0 L12 0" stroke="#263235" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <!-- Dashed Line with Animated Offset (Group 5) -->
    <path d="M335.092 160 L426.094 160" stroke="#263235" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60 30">
      <animate
        attributeName="stroke-dashoffset"
        from="0"
        to="-270"
        dur="5s"
        repeatCount="indefinite"/>
    </path>

    <!-- Small Line (Group 6) -->
    <path d="M317.092 160 L323.092 160" stroke="#263235" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Another Dashed Line (Group 7) -->
    <path d="M312.34 148 L407.092 148" stroke="#263235" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="90 48">
      <animate
        attributeName="stroke-dashoffset"
        from="0"
        to="-276"
        dur="5s"
        repeatCount="indefinite"/>
    </path>

    <!-- Small Line (Group 8) -->
    <path d="M412.724 148 L418.724 148" stroke="#263235" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>

  </svg>
</body>
</html>
  `);
});
exports.app.use("/", (req, res, next) => {
    req.io = exports.io;
    next();
});
exports.app.use("/api/auth", imports_1.authRouter);
exports.app.use(imports_1.errorHandler);
httpServer.listen(imports_1.appConfig.port, () => {
    console.log(`Server is running on: ${imports_1.appConfig.appUrl || "http://localhost:5000"}`);
});
