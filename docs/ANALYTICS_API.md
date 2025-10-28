# Analytics API Documentation

Simple analytics API for dashboard graphs.

## Overview

Two main endpoints:
1. **Activity Over Time** - Line/Bar chart with 4 period filters
2. **Activity by Log Type** - Pie chart showing log type distribution

---

## 1. Activity Over Time

Returns activity data grouped by time period.

### Endpoint
```
GET /api/analytics/activity-over-time
```

### Query Parameters

| Parameter | Type | Required | Options | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY` | Time grouping (default: `MONTHLY`) |
| `startDate` | string | No | ISO date | Start date filter |
| `endDate` | string | No | ISO date | End date filter |

### Period Descriptions

- **DAILY**: Last 30 days, grouped by day
- **WEEKLY**: Last 6 months, grouped by week  
- **MONTHLY**: Current year, grouped by month (Jan-Dec)
- **YEARLY**: Last 5 years, grouped by year

### Response Example - MONTHLY

```json
{
  "status": "success",
  "message": "Activity over time fetched successfully",
  "data": {
    "period": "MONTHLY",
    "total": 1234,
    "data": [
      { "label": "Jan", "count": 250 },
      { "label": "Feb", "count": 890 },
      { "label": "Mar", "count": 450 },
      { "label": "Apr", "count": 1020 },
      { "label": "May", "count": 180 },
      { "label": "Jun", "count": 600 },
      { "label": "Jul", "count": 320 },
      { "label": "Aug", "count": 780 },
      { "label": "Sep", "count": 450 },
      { "label": "Oct", "count": 1050 },
      { "label": "Nov", "count": 120 },
      { "label": "Dec", "count": 680 }
    ]
  }
}
```

### Response Example - DAILY

```json
{
  "status": "success",
  "message": "Activity over time fetched successfully",
  "data": {
    "period": "DAILY",
    "total": 456,
    "data": [
      { "label": "Oct 1", "date": "2025-10-01", "count": 15 },
      { "label": "Oct 2", "date": "2025-10-02", "count": 23 },
      { "label": "Oct 3", "date": "2025-10-03", "count": 18 }
      // ... more days
    ]
  }
}
```

### Response Example - WEEKLY

```json
{
  "status": "success",
  "message": "Activity over time fetched successfully",
  "data": {
    "period": "WEEKLY",
    "total": 890,
    "data": [
      { "label": "Week of May 1", "week": "2025-05-01", "count": 120 },
      { "label": "Week of May 8", "week": "2025-05-08", "count": 156 },
      { "label": "Week of May 15", "week": "2025-05-15", "count": 98 }
      // ... more weeks
    ]
  }
}
```

### Response Example - YEARLY

```json
{
  "status": "success",
  "message": "Activity over time fetched successfully",
  "data": {
    "period": "YEARLY",
    "total": 12450,
    "data": [
      { "label": "2021", "count": 1200 },
      { "label": "2022", "count": 2300 },
      { "label": "2023", "count": 3400 },
      { "label": "2024", "count": 2900 },
      { "label": "2025", "count": 2650 }
    ]
  }
}
```

### Usage Examples

```bash
# Monthly view (default)
curl -X GET "http://localhost:3000/api/analytics/activity-over-time" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Daily view
curl -X GET "http://localhost:3000/api/analytics/activity-over-time?period=DAILY" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Weekly view
curl -X GET "http://localhost:3000/api/analytics/activity-over-time?period=WEEKLY" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Yearly view
curl -X GET "http://localhost:3000/api/analytics/activity-over-time?period=YEARLY" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With custom date range
curl -X GET "http://localhost:3000/api/analytics/activity-over-time?period=MONTHLY&startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 2. Activity by Log Type (Pie Chart)

Returns activity distribution by log type.

### Endpoint
```
GET /api/analytics/activity-by-log-type
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | Start date filter (ISO format) |
| `endDate` | string | No | End date filter (ISO format) |

### Log Types Tracked

Based on your schema:
- **USER** - User-related actions (login, create, update, etc.)
- **DEVICE** - Device-related actions
- **FIRMWARE** - Firmware-related actions
- **MODBUS_WRITE_REGISTERS** - Modbus operations
- **PLANT** - Plant-related actions
- **NOTIFICATION** - Notification actions

### Response Example

```json
{
  "status": "success",
  "message": "Activity by log type fetched successfully",
  "data": {
    "totalLogsCount": 483,
    "totalUserActionsCount": 223,
    "deviceActionsCount": 125,
    "firmwareCount": 25,
    "percentages": {
      "totalUserActionsCount": 46,
      "deviceActionsCount": 26,
      "firmwareCount": 5
    },
    "chartData": [
      {
        "label": "Total User Actions",
        "value": 223,
        "percentage": 46,
        "color": "#4CAF50"
      },
      {
        "label": "Device Actions",
        "value": 125,
        "percentage": 26,
        "color": "#FFA726"
      },
      {
        "label": "Firmware",
        "value": 25,
        "percentage": 5,
        "color": "#42A5F5"
      }
    ]
  }
}
```

### Usage Examples

```bash
# All time data
curl -X GET "http://localhost:3000/api/analytics/activity-by-log-type" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With date range filter
curl -X GET "http://localhost:3000/api/analytics/activity-by-log-type?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Chart Integration

### Chart.js Example - Activity Over Time (Bar Chart)

```javascript
// Fetch data
const response = await fetch('/api/analytics/activity-over-time?period=MONTHLY', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const result = await response.json();

// Create chart
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: result.data.data.map(d => d.label),
    datasets: [{
      label: 'Activities',
      data: result.data.data.map(d => d.count),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
```

### Chart.js Example - Activity by Log Type (Pie Chart)

```javascript
// Fetch data
const response = await fetch('/api/analytics/activity-by-log-type', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const result = await response.json();

// Create chart
new Chart(ctx, {
  type: 'pie',
  data: {
    labels: result.data.chartData.map(d => d.label),
    datasets: [{
      data: result.data.chartData.map(d => d.value),
      backgroundColor: result.data.chartData.map(d => d.color),
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'right'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const item = result.data.chartData[context.dataIndex];
            return `${item.label}: ${item.value} (${item.percentage}%)`;
          }
        }
      }
    }
  }
});
```

---

## Complete React Component Example

```jsx
import { useEffect, useState } from 'react';
import Chart from 'chart.js/auto';

function AnalyticsDashboard() {
  const [period, setPeriod] = useState('MONTHLY');
  const [activityData, setActivityData] = useState(null);
  const [pieData, setPieData] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    // Fetch Activity Over Time
    const activityRes = await fetch(
      `/api/analytics/activity-over-time?period=${period}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const activityResult = await activityRes.json();
    setActivityData(activityResult.data);

    // Fetch Activity by Log Type
    const pieRes = await fetch('/api/analytics/activity-by-log-type', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const pieResult = await pieRes.json();
    setPieData(pieResult.data);

    // Render charts
    renderCharts(activityResult.data, pieResult.data);
  };

  const renderCharts = (activity, pie) => {
    // Activity Chart
    const activityCtx = document.getElementById('activityChart');
    new Chart(activityCtx, {
      type: 'bar',
      data: {
        labels: activity.data.map(d => d.label),
        datasets: [{
          label: 'Activities',
          data: activity.data.map(d => d.count),
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      }
    });

    // Pie Chart
    const pieCtx = document.getElementById('pieChart');
    new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: pie.chartData.map(d => d.label),
        datasets: [{
          data: pie.chartData.map(d => d.value),
          backgroundColor: pie.chartData.map(d => d.color)
        }]
      }
    });
  };

  return (
    <div>
      {/* Period Selector */}
      <div className="period-selector">
        <button onClick={() => setPeriod('DAILY')}>Daily</button>
        <button onClick={() => setPeriod('WEEKLY')}>Weekly</button>
        <button onClick={() => setPeriod('MONTHLY')}>Monthly</button>
        <button onClick={() => setPeriod('YEARLY')}>Yearly</button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="card">
          <h3>Total Logs</h3>
          <p>{pieData?.totalLogsCount || 0}</p>
        </div>
        <div className="card">
          <h3>User Actions</h3>
          <p>{pieData?.totalUserActionsCount || 0}</p>
        </div>
        <div className="card">
          <h3>Device Actions</h3>
          <p>{pieData?.deviceActionsCount || 0}</p>
        </div>
        <div className="card">
          <h3>Firmware</h3>
          <p>{pieData?.firmwareCount || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-container">
        <div className="chart">
          <h2>Activity Over Time ({activityData?.period})</h2>
          <canvas id="activityChart"></canvas>
        </div>
        <div className="chart">
          <h2>Activity by Log Type</h2>
          <canvas id="pieChart"></canvas>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
```

---

## Authentication

All endpoints require JWT token:

```javascript
headers: {
  'Authorization': `Bearer ${your_jwt_token}`
}
```

---

## Error Responses

### Invalid Period
```json
{
  "status": "error",
  "message": "Invalid period. Must be one of: DAILY, WEEKLY, MONTHLY, YEARLY"
}
```

### Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

---

## Testing

```bash
# Test MONTHLY view
curl -X GET "http://localhost:3000/api/analytics/activity-over-time?period=MONTHLY" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test pie chart
curl -X GET "http://localhost:3000/api/analytics/activity-by-log-type" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

1. **User Hierarchy**: Data includes user + all subordinates
2. **Default Ranges**:
   - DAILY: Last 30 days
   - WEEKLY: Last 6 months
   - MONTHLY: Current year
   - YEARLY: Last 5 years
3. **Custom Ranges**: Use `startDate` and `endDate` to override defaults
4. **Percentages**: Rounded to whole numbers
5. **Colors**: Pre-defined for consistency

