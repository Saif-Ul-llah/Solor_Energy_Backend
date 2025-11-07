import { DeviceType } from "@prisma/client";
import {
  asyncHandler,
  NextFunction,
  Request,
  Response,
  sendResponse,
  HttpError,
  logger,
  validateFirmwareUpload,
} from "../../imports";
import ExcelJS from "exceljs";
import { stringify } from "csv-stringify/sync";

import DeviceServices from "./device.services";

class DeviceController {
  // Add New Device
  public static addDevice = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { deviceType, sn, plantId } = req.body;
      let user = req.user;
      if (!deviceType || !sn || !plantId)
        return next(HttpError.missingParameters("All fields are required! "));
      const device :any = await DeviceServices.addDeviceService(
        deviceType,
        sn,
        plantId,
        user
      );
      if (device) {
        return sendResponse(
          res,
          201,
          "Device added successfully",
          device,
          "success"
        );
      }
      return sendResponse(res, 200, "Failed to bind device to plant on cloud platform", [], "failed");
    }
  );
  // Get Device By Sn
  public static checkDevice = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { sn } = req.query;
      if (!sn)
        return next(HttpError.missingParameters("Serial Number is required! "));
      const device = await DeviceServices.checkDeviceService(sn);
      if (device) {
        return sendResponse(
          res,
          200,
          "Device Already Exists",
          { data: [] },
          "success"
        );
      }
      return sendResponse(
        res,
        200,
        "Device not found",
        { data: [] },
        "success"
      );
    }
  );
  // Get All Devices for home page
  public static getAllDeviceList = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // const user = req.user;
      const {
        deviceType = "All",
        status,
        page = 1,
        pageSize = 10,
        userId,
        search = "",
      } = req.query;
      if (!userId)
        return next(HttpError.missingParameters("User Id is required! "));
      const device: any = await DeviceServices.getAllDeviceListService(
        userId as string,
        deviceType as DeviceType | "All",
        status as string,
        Number(page),
        Number(pageSize),
        search as string
      );
      if (device) {
        return sendResponse(res, 200, "Device List", device, "success");
      }
    }
  );
  // Get device by Id
  public static getDeviceBySn = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn } = req.query;

      const device: any = await DeviceServices.getDeviceBySnService(
        user,
        sn as string
      );
      const deviceOverview: any = await DeviceServices.deviceOverviewService(
        sn as string
      );
      if (device) {
        return sendResponse(
          res,
          200,
          "Device List",
          { ...device, deviceOverview },
          "success"
        );
      }
    }
  );
  // Get Device Details
  public static getDeviceDetail = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn } = req.query;
      if (!sn)
        return next(HttpError.missingParameters("Serial Number is required! "));
      const device: any = await DeviceServices.getFlowDiagramService(
        user,
        sn as string
      );

      if (device) {
        return sendResponse(res, 200, "Device data", device, "success");
      }
      return sendResponse(res, 200, "Device data", [], "success");
    }
  );
  // Get Flow Diagram
  public static getFlowDiagram = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn } = req.query;
      if (!sn)
        return next(HttpError.missingParameters("Serial Number is required! "));
      const device: any = await DeviceServices.getFlowDiagramService(
        user,
        sn as string
      );
      let type = device.deviceType;
      delete device.deviceType;

      if (device) {
        let data = {
          id: sn,
          deviceType: type,
          children: Object.entries(device).map(([key, value]) => ({
            value: value,
            id: Math.random().toString(36).substring(2, 15),
            // [key]:value,
            deviceType: key,
          })),
        };
        return sendResponse(res, 200, "Flow Diagram data", data, "success");
      }
      return sendResponse(res, 200, "Flow Diagram data", [], "success");
    }
  );

  // Upload Firmware
  public static uploadFirmware = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const { error, value } = validateFirmwareUpload.validate(req.body);
      if (error) {
        return next(HttpError.badRequest(error.details[0].message));
      }
      const device: any = await DeviceServices.uploadFirmwareService({
        ...value,
        userId,
      });
      if (device) {
        return sendResponse(res, 200, "Firmware uploaded", device, "success");
      }
    }
  );

  // Get Firmware List
  public static getFirmwareList = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const firmwareList: any = await DeviceServices.getFirmwareListService(
        userId
      );
      if (firmwareList) {
        return sendResponse(res, 200, "Firmware List", firmwareList, "success");
      }
      return sendResponse(res, 200, "No Firmware Found", [], "success");
    }
  );

  // Delete device
  public static deleteDevice = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const { sn } = req.query;
      if (!sn)
        return next(HttpError.missingParameters("Serial Number is required! "));
      const device: any = await DeviceServices.deleteDeviceService(
        userId,
        sn as string
      );
      if (device) {
        return sendResponse(res, 200, "Device deleted", device, "success");
      }
    }
  );

  // Read Modbus Registers from Inverter
  public static readModbusRegisters = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn, memberId } = req.params;
      const { registers } = req.query; // Optional: comma-separated list of specific registers

      if (!sn) {
        return next(HttpError.missingParameters("Serial Number is required!"));
      }

      // Parse custom register list if provided
      const registerList = registers
        ? (registers as string).split(",").map((r) => r.trim())
        : undefined;

      const data = await DeviceServices.readModbusRegistersService(
        sn,
        memberId as string,
        registerList
      );

      if (data) {
        return sendResponse(
          res,
          200,
          "Modbus registers read successfully",
          data,
          "success"
        );
      }

      return sendResponse(
        res,
        200,
        "Failed to read Modbus registers",
        {},
        "failed"
      );
    }
  );

  // Write Modbus Registers to Inverter
  public static writeModbusRegisters = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn, memberId } = req.params;
      const { registers } = req.body; // Object with register: value pairs

      if (!sn) {
        return next(HttpError.missingParameters("Serial Number is required!"));
      }

      if (!registers || typeof registers !== "object") {
        return next(
          HttpError.badRequest(
            "Registers object is required with format { register: value }"
          )
        );
      }

      const data = await DeviceServices.writeModbusRegistersService(
        sn,
        memberId as string,
        registers,
        user
      );

      if (data) {
        return sendResponse(
          res,
          200,
          "Modbus registers written successfully",
          data,
          "success"
        );
      }

      return sendResponse(
        res,
        200,
        "Failed to write Modbus registers",
        {},
        "failed"
      );
    }
  );

  // Get Available Modbus Register Map
  public static getModbusRegisterMap = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const registerMap = await DeviceServices.getModbusRegisterMapService();

      return sendResponse(
        res,
        200,
        "Modbus register map retrieved successfully",
        registerMap,
        "success"
      );
    }
  );

  // Callback endpoint for write operation results
  public static modbusWriteCallback = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { GoodsID, operate, modbusInfo, SystemTime } = req.body;

      logger("📨 Modbus Write Callback Received:", {
        GoodsID,
        operate,
        modbusInfo,
        SystemTime,
        fullBody: req.body,
      });

      // Process the callback result
      await DeviceServices.processModbusWriteCallbackService({
        serialNumber: GoodsID,
        operation: operate,
        modbusData: modbusInfo,
        timestamp: SystemTime,
      });

      // IMPORTANT: Vendor requires lowercase "success" string response
      res.status(200).send("success");
    }
  );

  // Get SN List
  public static getSnList = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const snList: any = await DeviceServices.getSnListService(userId);
      if (snList) {
        return sendResponse(res, 200, "SN List Of Devices", snList, "success");
      }
    }
  );

  // Device Report
  public static deviceReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn, type, date } = req.body;
      if (!sn || !type || !date)
        return HttpError.missingParameters("All fields are required! ");
      const deviceReport: any = await DeviceServices.deviceReportService(
        sn,
        type,
        date,
        user
      );
      if (deviceReport) {
        return sendResponse(res, 200, "Device Report", deviceReport, "success");
      }
    }
  );

  // Device Report Export (CSV/Excel)
  public static deviceReportExport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      logger("\x1b[32m Device Report Export\x1b[0m");
      const user = req.user;
      const { sn, type, date } = req.query;
      const format = (req.query.format as string) || "csv"; // csv or excel

      if (!sn || !type || !date) {
        return next(HttpError.missingParameters("All fields are required! "));
      }

      if (!["csv", "excel"].includes(format.toLowerCase())) {
        return next(
          HttpError.badRequest("Format must be either 'csv' or 'excel'")
        );
      }

      try {
        const deviceReport: any = await DeviceServices.deviceReportService(
          sn as string,
          type as string,
          date as string,
          user
        );

        if (!deviceReport || !Array.isArray(deviceReport) || deviceReport.length === 0) {
          return next(HttpError.notFound("No report data found"));
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
        const filename = `device-report-${sn}-${timestamp}`;

        if (format.toLowerCase() === "csv") {
          // Generate CSV
          const headers = Object.keys(deviceReport[0]);
          const rows = deviceReport.map((row: any) =>
            headers.map((header) => {
              const value = row[header];
              // Handle null, undefined, and objects
              if (value === null || value === undefined) return "";
              if (typeof value === "object") return JSON.stringify(value);
              return String(value);
            })
          );

          const csvData = stringify([headers, ...rows], {
            header: false,
            quoted: true,
          });

          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.csv"`
          );
          return res.send(csvData);
        } else {
          // Generate Excel
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet("Device Report");

          // Get headers from first row
          const headers = Object.keys(deviceReport[0]);
          
          // Format headers with proper capitalization
          const formattedHeaders = headers.map((header) => {
            return header
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())
              .trim();
          });

          // Add headers row
          worksheet.addRow(formattedHeaders);

          // Style the header row
          const headerRow = worksheet.getRow(1);
          headerRow.font = { bold: true, size: 12 };
          headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E0E0" },
          };
          headerRow.alignment = { vertical: "middle", horizontal: "center" };

          // Add data rows
          deviceReport.forEach((row: any) => {
            const rowData = headers.map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return "";
              if (typeof value === "object") return JSON.stringify(value);
              return value;
            });
            worksheet.addRow(rowData);
          });

          // Auto-fit columns
          worksheet.columns.forEach((column: any) => {
            if (column.header) {
              let maxLength = 0;
              column.eachCell({ includeEmpty: true }, (cell: any) => {
                const columnLength = cell.value
                  ? cell.value.toString().length
                  : 10;
                if (columnLength > maxLength) {
                  maxLength = columnLength;
                }
              });
              column.width = Math.min(Math.max(maxLength + 2, 10), 50);
            }
          });

          // Set response headers
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.xlsx"`
          );

          // Write to response
          await workbook.xlsx.write(res);
          return res.end();
        }
      } catch (error: any) {
        logger("Error exporting device report:", error);
        return next(
          HttpError.internalServerError(
            error.message || "Failed to export device report"
          )
        );
      }
    }
  );

  // get device overview
  public static deviceOverview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { sn } = req.query;
      if (!sn)
        return next(HttpError.missingParameters("Serial Number is required! "));
      const device: any = await DeviceServices.deviceOverviewService(
        sn as string
      );
      if (device) {
        return sendResponse(res, 200, "Device Overview", device, "success");
      }
      return sendResponse(res, 200, "Device Overview", [], "success");
    }
  );
}
export default DeviceController;
