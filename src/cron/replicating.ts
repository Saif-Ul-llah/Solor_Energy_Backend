import cron from "node-cron";
import {
  getBatteryDeviceData,
  getDeviceBySN,
  getEndUserSummaryInfo,
  logger,
  plantsAlertById,
  prisma,
} from "../imports";
import NotificationServices from "../modules/notification/notification.services";
import AuthRepo from "../modules/auth/auth.repo";

// for running on every minute
// cron.schedule("* * * * *", async () => { }

// Runs every 5 minutes (server time)
// cron.schedule("*/5 * * * *", async () => {

// Runs every day at midnight (server time)
cron.schedule("0 0 * * *", async () => {
  // cron.schedule("* * * * *", async () => {
  logger(
    "=======================[CRON] Pulling data from third party...=======================\n"
  );

  try {
    const endUserSummaryInfo = await getEndUserSummaryInfo();

    if (!endUserSummaryInfo?.length) {
      logger("[CRON] No data received");
      return;
    }

    // Process all items in parallel for speed
    const results = await Promise.allSettled(
      endUserSummaryInfo.map(async (item: any) => {
        // Skip invalid items
        if (!item?.MemberID || !item?.Sign) return;

        const getUser = await AuthRepo.findByEmail(item.MemberID);
        if (!getUser) {
          logger(`[CRON] User not found: ${item.MemberID}`);
          return;
        }

        const payload = {
          MemberStateCount: Array.isArray(item.MemberStateCount)
            ? item.MemberStateCount
            : JSON.parse(item.MemberStateCount),
          currentPower: item.CurrentPac ?? 0,
          todayGeneration: item.EToday ?? 0,
          totalGeneration: item.ETotal ?? 0,
          Kwp: item.Kwp ?? null,
          CreateTime: item.CreateTime ? new Date(item.CreateTime) : null,
          Sign: item.Sign,
        };

        return prisma.thirdPartyUserData.create({
          data: { MemberID: getUser.email, ...payload },
        });
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    logger(`[CRON] Completed: ${succeeded} succeeded, ${failed} failed`);
  } catch (err) {
    logger("[CRON] Error replicating data:", err);
  }
});

// for running on every minute
cron.schedule("0 0 * * *", async () => {
  logger(
    "=======================[CRON] Pulling data from third party...=======================\n"
  );

  // get Device List from our database
  const deviceList = await prisma.device.findMany({
    include: { customer: true },
  });

  // Use Promise.all to await all device detail fetches and insertions
  const insertResults = await Promise.allSettled(
    deviceList.map(async (device: any) => {
      try {
        // Defensive: Ensure device.sn and device.customer exist before proceeding
        if (!device?.sn || !device?.customer?.email) {
          logger("Device or customer data missing, skipping.", { device });
          return;
        }
        const deviceDetails = await getDeviceBySN(
          device.sn,
          device.customer.email
        );
        // logger("Device Details:", deviceDetails);

        // Defensive: Ensure deviceDetails and deviceDetails.sn exist before inserting
        if (!deviceDetails?.GoodsID) {
          logger("No sn found in deviceDetails, skipping DB insert.", {
            deviceDetails,
          });
          return;
        }

        // Safely parse fields or fallback to 0 if not a valid number
        const safeParse = (num: any) => {
          const parsed = parseFloat(num);
          return isNaN(parsed) ? 0 : parsed;
        };

        await prisma.thirdPartyDeviceData.create({
          data: {
            AutoID: deviceDetails?.AutoID ?? "0",
            sn: deviceDetails.GoodsID,
            status:
              deviceDetails?.Light === 1
                ? "ONLINE"
                : deviceDetails?.Light === 2
                ? "FAULT"
                : deviceDetails?.Light === 3
                ? "STANDBY"
                : deviceDetails?.Light === 4
                ? "OFFLINE"
                : "UNKNOWN",
            currentPower: safeParse(deviceDetails.CurrPac),
            todayGeneration: safeParse(deviceDetails.EToday),
            totalGeneration: safeParse(deviceDetails.ETotal),
            generationTime: safeParse(deviceDetails.Htotal),
            DataTime: deviceDetails.DataTime
              ? new Date(deviceDetails.DataTime)
              : new Date(),
          },
        });
      } catch (err: any) {
        logger("[CRON] Error processing device for thirdPartyDeviceData:", {
          device,
          error: err?.message || err,
        });
      }
    })
  );

  const succeeded = insertResults.filter(
    (r) => r.status === "fulfilled"
  ).length;
  const failed = insertResults.filter((r) => r.status === "rejected").length;
  logger(
    `[CRON] thirdPartyDeviceData insert: ${succeeded} succeeded, ${failed} failed`
  );
});

//  for running on every 5 minutes
cron.schedule("* * * * *", async () => {
  logger(
    "=======================[CRON] Checking Plant Alarms =======================\n"
  );

  //Get all Plants
  const Plants = await prisma.plant.findMany({
    include: { customer: true, installer: true },
  });

  if (!Plants.length) {
    logger("No plants found in the database.");
    return;
  }
  // Get all Plants Alarms from third party
  let alarms = await Promise.all(
    Plants.map(async (plant: any) => {
      const alarmsOfPlant = await plantsAlertById(
        plant.AutoId,
        plant.customer?.email
      );

      return alarmsOfPlant?.total_error_num > 0
        ? alarmsOfPlant.infoerror
        : null;
    })
  );

  alarms = alarms.filter(Boolean).flat();

  // TEST ONLY — REMOVE LATER
  alarms.push({
    ModelName: "SE 10KHB-210-T2",
    GoodsName: "SE 10KHB-210-T2 2342-23820000PH",
    MemberID: "customer@gmail.com",
    GoodsID: "2342-23820000PH",
    Time: "2025-11-05 01:00:23",
    ErrorCode: "50",
    status: "0",
  });

  // logger("alarmsOfPlant:", alarms);

  // Check if alarm is within 5 minutes then trigger notification
  for (const alarm of alarms) {
    const alarmTime = new Date(`${alarm.Time.replace(" ", "T")}`);
    const now = new Date();
    const diffSeconds = (now.getTime() - alarmTime.getTime()) / 1000;
    // logger("diffSeconds:", diffSeconds, "\nAlarmTime", alarmTime, "\nNow", now);
    if (diffSeconds >= 0 && diffSeconds <= 5 * 60) {
      logger("Triggering notification for alarm:", alarm);

      const user = await AuthRepo.findByEmail(alarm.MemberID); // Ensure MemberID is email

      if (user) {
        await NotificationServices.sendPushNotificationService(
          "Device Alarm Notification",
          "Your device has triggered an alarm. Please check for more details.",
          user.id
        );
      }
    }
  }
});

// Same For Battery Status
cron.schedule("* * * * *", async () => {
  try {
    logger(
      "=======================[CRON] Checking Battery Status =======================\n"
    );
    
    // Get all batteries from our database
    const batteries = await prisma.device.findMany({
      where: { deviceType: "BATTERY" },
      include: { 
        customer: true,
        plant: {
          include: {
            installer: true
          }
        }
      },
    });
    
    if (!batteries.length) {
      logger("No batteries found in the database.");
      return;
    }

    // Get battery status from third party for all batteries
    const batteryStatusResults = await Promise.allSettled(
      batteries.map(async (battery: any) => {
        try {
          if (!battery?.sn || !battery?.customer?.email) {
            logger(`[CRON] Battery data incomplete, skipping. SN: ${battery?.sn}`);
            return null;
          }

          const batteryData = await getBatteryDeviceData(
            battery.sn,
            new Date().toISOString().split("T")[0],
            1,
            10
          );

          if (!batteryData || !batteryData.result || !batteryData.result.records || batteryData.result.records.length === 0) {
            logger(`[CRON] No battery data received for SN: ${battery.sn}`);
            return null;
          }

          const record = batteryData.result.records[0];
          
          // Determine status and check for faults
          let status = "UNKNOWN";
          let hasFault = false;
          let faultTime = null;

          // Check if it's a Low Voltage Battery (has M_STATUS_1 field)
          if (record?.M_STATUS_1 !== undefined) {
            const mStatus = parseInt(record.M_STATUS_1) || 0;
            
            // Check for faults first (FAULT_1 through FAULT_6)
            hasFault =
              (parseInt(record.FAULT_1) || 0) !== 0 ||
              (parseInt(record.FAULT_2) || 0) !== 0 ||
              (parseInt(record.FAULT_3) || 0) !== 0 ||
              (parseInt(record.FAULT_4) || 0) !== 0 ||
              (parseInt(record.FAULT_5) || 0) !== 0 ||
              (parseInt(record.FAULT_6) || 0) !== 0;

            if (hasFault) {
              status = "FAULT";
            } else {
              status =
                mStatus === 1
                  ? "ONLINE"
                  : mStatus === 2
                  ? "FAULT"
                  : mStatus === 3
                  ? "STANDBY"
                  : mStatus === 4
                  ? "OFFLINE"
                  : "UNKNOWN";
              hasFault = mStatus === 2;
            }
          }
          // Check if it's a High Voltage Battery (has faultStatus field)
          else if (record?.faultStatus !== undefined) {
            const faultStatus = parseInt(record?.faultStatus) || -1;
            hasFault = faultStatus !== 0;
            status = hasFault ? "FAULT" : "ONLINE";
          }

          // Extract timestamp from record
          if (record?.time) {
            try {
              faultTime = new Date(record.time.replace(" ", "T"));
            } catch (e) {
              logger(`[CRON] Error parsing time for battery ${battery.sn}:`, e);
            }
          }

          return {
            battery,
            status,
            hasFault,
            faultTime,
            record,
            sn: battery.sn,
          };
        } catch (error: any) {
          logger(`[CRON] Error processing battery ${battery?.sn}:`, error?.message || error);
          return null;
        }
      })
    );

    // Filter successful results and check for faults within last 5 minutes
    const now = new Date();
    const faultBatteries = batteryStatusResults
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value)
      .filter((batteryStatus: any) => {
        if (!batteryStatus.hasFault) {
          return false;
        }

        // If faultTime is available, check if it's within last 5 minutes
        if (batteryStatus.faultTime) {
          const diffSeconds = (now.getTime() - batteryStatus.faultTime.getTime()) / 1000;
          return diffSeconds >= 0 && diffSeconds <= 5 * 60;
        }

        // If no timestamp, assume current fault (within 5 minutes)
        return true;
      });

    logger(`[CRON] Found ${faultBatteries.length} battery(ies) with faults in the last 5 minutes.`);

    // Send notifications for each battery with fault
    for (const faultBattery of faultBatteries) {
      try {
        const { battery } = faultBattery;
        
        if (!battery?.customer?.id) {
          logger(`[CRON] No customer ID found for battery ${battery?.sn}, skipping notification.`);
          continue;
        }

        // Send notification to customer
        await NotificationServices.sendPushNotificationService(
          "Battery Fault Alert",
          `Battery ${battery.sn} has detected a fault. Please check the device immediately.`,
          battery.customer.id
        );

        logger(`[CRON] Notification sent to customer ${battery.customer.email} for battery ${battery.sn}`);

        // Optionally send notification to installer if available
        if (battery.plant?.installer?.id) {
          await NotificationServices.sendPushNotificationService(
            "Battery Fault Alert",
            `Battery ${battery.sn} at plant ${battery.plant?.name || "Unknown"} has detected a fault.`,
            battery.plant.installer.id
          );
          logger(`[CRON] Notification sent to installer ${battery.plant.installer.email} for battery ${battery.sn}`);
        }
      } catch (error: any) {
        logger(`[CRON] Error sending notification for battery ${faultBattery?.sn}:`, error?.message || error);
      }
    }

    logger(`[CRON] Battery status check completed.`);
  } catch (error: any) {
    logger(`[CRON] Error in battery status check:`, error?.message || error);
  }
});