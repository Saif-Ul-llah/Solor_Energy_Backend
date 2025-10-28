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

    // Calculate percentages
    const total = stats.totalLogsCount;
    const percentages = {
      totalUserActionsCount: total > 0 ? Math.round((stats.totalUserActionsCount / total) * 100) : 0,
      deviceActionsCount: total > 0 ? Math.round((stats.deviceActionsCount / total) * 100) : 0,
      firmwareCount: total > 0 ? Math.round((stats.firmwareCount / total) * 100) : 0,
    };

    // Format for pie chart
    const chartData = [
      {
        label: "Total User Actions",
        value: stats.totalUserActionsCount,
        percentage: percentages.totalUserActionsCount,
        color: "#4CAF50", // Green
      },
      {
        label: "Device Actions",
        value: stats.deviceActionsCount,
        percentage: percentages.deviceActionsCount,
        color: "#FFA726", // Orange
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
      totalUserActionsCount: stats.totalUserActionsCount,
      deviceActionsCount: stats.deviceActionsCount,
      firmwareCount: stats.firmwareCount,
      percentages,
      chartData,
    };
  }
}

export default AnalyticsServices;

