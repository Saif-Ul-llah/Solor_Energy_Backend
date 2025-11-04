import cron from "node-cron";
import {
  getDeviceBySN,
  getEndUserSummaryInfo,
  logger,
  prisma,
} from "../imports";
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
cron.schedule("*/5 * * * *", async () => {
  logger(
    "=======================[CRON] Getting Plant Alarm and trigger notification to user ...=======================\n"
  );
  // get all devices from our database
  const deviceList = await prisma.device.findMany({
    include: { customer: true ,plant: { include: { installer: true } } },
  });
// get alarm of every device from third party
// if alarm is present and time is less than 4:59:59 minutes, then trigger notification to user

});