import AnalyticsRepo from "./analytics.repo";

class AnalyticsServices {
  /*===========================  Get Activity Over Time   =========================== */
  public static async getActivityOverTimeService(payload: any): Promise<any> {
    const { period = "MONTHLY" } = payload;
    
    // Get raw activity data
    const activityLogs = await AnalyticsRepo.getActivityOverTimeRepo(payload);

    // Process data based on period
    if (period === "DAILY") {
      // Group by day (last 30 days)
      const dailyData: any = {};
      
      activityLogs.forEach((log: any) => {
        const date = new Date(log.createdAt).toISOString().split("T")[0];
        dailyData[date] = (dailyData[date] || 0) + 1;
      });

      const chartData = Object.keys(dailyData).map((date) => ({
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date,
        count: dailyData[date],
      })).sort((a, b) => a.date.localeCompare(b.date));

      return {
        period: "DAILY",
        data: chartData,
        total: activityLogs.length,
      };
    } else if (period === "WEEKLY") {
      // Group by week (last 6 months)
      const weeklyData: any = {};
      
      activityLogs.forEach((log: any) => {
        const date = new Date(log.createdAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split("T")[0];
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
      });

      const chartData = Object.keys(weeklyData).map((week) => ({
        label: `Week of ${new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        week,
        count: weeklyData[week],
      })).sort((a, b) => a.week.localeCompare(b.week));

      return {
        period: "WEEKLY",
        data: chartData,
        total: activityLogs.length,
      };
    } else if (period === "MONTHLY") {
      // Group by month (current year)
      const monthlyData: any = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      months.forEach((month) => {
        monthlyData[month] = 0;
      });

      activityLogs.forEach((log: any) => {
        const month = months[new Date(log.createdAt).getMonth()];
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      const chartData = months.map((month) => ({
        label: month,
        count: monthlyData[month],
      }));

      return {
        period: "MONTHLY",
        data: chartData,
        total: activityLogs.length,
      };
    } else if (period === "YEARLY") {
      // Group by year (last 5 years)
      const yearlyData: any = {};
      
      activityLogs.forEach((log: any) => {
        const year = new Date(log.createdAt).getFullYear();
        yearlyData[year] = (yearlyData[year] || 0) + 1;
      });

      const chartData = Object.keys(yearlyData).map((year) => ({
        label: year,
        count: yearlyData[year],
      })).sort((a, b) => parseInt(a.label) - parseInt(b.label));

      return {
        period: "YEARLY",
        data: chartData,
        total: activityLogs.length,
      };
    }

    return {
      period,
      data: [],
      total: 0,
    };
  }

  /*===========================  Get Activity by Log Type (Pie Chart)   =========================== */
  public static async getActivityByLogTypeService(payload: any): Promise<any> {
    const stats = await AnalyticsRepo.getActivityByLogTypeRepo(payload);

    const total = stats.totalLogsCount;

    // Calculate raw percentages (with decimals for accuracy)
    const rawPercentages = {
      userActionsCount: total > 0 ? (stats.userActionsCount / total) * 100 : 0,
      deviceActionsCount: total > 0 ? (stats.deviceActionsCount / total) * 100 : 0,
      firmwareCount: total > 0 ? (stats.firmwareCount / total) * 100 : 0,
      plantActionsCount: total > 0 ? (stats.plantActionsCount / total) * 100 : 0,
      notificationCount: total > 0 ? (stats.notificationCount / total) * 100 : 0,
      modbusWriteCount: total > 0 ? (stats.modbusWriteCount / total) * 100 : 0,
    };

    // Round percentages
    let percentages = {
      userActionsCount: Math.round(rawPercentages.userActionsCount),
      deviceActionsCount: Math.round(rawPercentages.deviceActionsCount),
      firmwareCount: Math.round(rawPercentages.firmwareCount),
      plantActionsCount: Math.round(rawPercentages.plantActionsCount),
      notificationCount: Math.round(rawPercentages.notificationCount),
      modbusWriteCount: Math.round(rawPercentages.modbusWriteCount),
    };

    // Adjust percentages to ensure they sum to 100%
    const percentageSum = Object.values(percentages).reduce((sum, val) => sum + val, 0);
    if (percentageSum !== 100 && total > 0) {
      // Find the largest percentage and adjust it
      const keys = Object.keys(rawPercentages) as Array<keyof typeof rawPercentages>;
      const largestKey = keys.reduce((a, b) => rawPercentages[a] > rawPercentages[b] ? a : b);
      percentages[largestKey] += (100 - percentageSum);
    }

    // Format for pie chart
    const chartData = [
      {
        label: "User Actions",
        value: stats.userActionsCount,
        percentage: percentages.userActionsCount,
        color: "#4CAF50", // Green
      },
      {
        label: "Device Actions",
        value: stats.deviceActionsCount,
        percentage: percentages.deviceActionsCount,
        color: "#FFA726", // Orange
      },
      {
        label: "Plant Actions",
        value: stats.plantActionsCount,
        percentage: percentages.plantActionsCount,
        color: "#9C27B0", // Purple
      },
      {
        label: "Modbus Write",
        value: stats.modbusWriteCount,
        percentage: percentages.modbusWriteCount,
        color: "#00BCD4", // Cyan
      },
      {
        label: "Notifications",
        value: stats.notificationCount,
        percentage: percentages.notificationCount,
        color: "#FF5722", // Deep Orange
      },
      {
        label: "Firmware",
        value: stats.firmwareCount,
        percentage: percentages.firmwareCount,
        color: "#42A5F5", // Blue
      },
    ];

    return {
      totalLogsCount: stats.totalLogsCount,
      userActionsCount: stats.userActionsCount,
      deviceActionsCount: stats.deviceActionsCount,
      firmwareCount: stats.firmwareCount,
      plantActionsCount: stats.plantActionsCount,
      notificationCount: stats.notificationCount,
      modbusWriteCount: stats.modbusWriteCount,
      percentages,
      chartData,
    };
  }

  /*===========================  Get Device Overview   =========================== */
  public static async getDeviceOverviewService(payload: any): Promise<any> {
    const stats = await AnalyticsRepo.getDeviceOverviewRepo(payload);

    return {
      totalDevices: stats.totalDevices,
      totalInverters: stats.totalInverters,
      totalBatteries: stats.totalBatteries,
    };
  }

  /*===========================  Get Device Monthly Graph   =========================== */
  public static async getDeviceMonthlyGraphService(payload: any): Promise<any> {
    const devices = await AnalyticsRepo.getDeviceMonthlyGraphRepo(payload);

    // Initialize monthly data structure
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const monthlyData: any = {};
    months.forEach((month) => {
      monthlyData[month] = {
        inverters: 0,
        batteries: 0,
        total: 0,
      };
    });

    // Group devices by month - count NEW devices added each month
    devices.forEach((device: any) => {
      const month = months[new Date(device.createdAt).getMonth()];
      if (device.deviceType === "INVERTER") {
        monthlyData[month].inverters += 1;
      } else if (device.deviceType === "BATTERY") {
        monthlyData[month].batteries += 1;
      }
      monthlyData[month].total += 1;
    });

    // Calculate total for the year
    let totalInverters = 0;
    let totalBatteries = 0;
    let totalDevices = 0;

    months.forEach((month) => {
      totalInverters += monthlyData[month].inverters;
      totalBatteries += monthlyData[month].batteries;
      totalDevices += monthlyData[month].total;
    });

    // Format for chart - showing monthly additions (not cumulative)
    const chartData = months.map((month) => ({
      month,
      inverters: monthlyData[month].inverters,
      batteries: monthlyData[month].batteries,
      total: monthlyData[month].total,
    }));

    return {
      year: payload.year,
      chartData,
      summary: {
        totalInverters,
        totalBatteries,
        totalDevices,
      },
    };
  }
}

export default AnalyticsServices;

