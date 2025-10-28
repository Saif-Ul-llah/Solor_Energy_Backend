# Analytics Module

Simple analytics API for dashboard graphs.

## Overview

Two main endpoints for dashboard visualizations:
1. **Activity Over Time** - 4 period filters (DAILY, WEEKLY, MONTHLY, YEARLY)
2. **Activity by Log Type** - Pie chart data

## Structure

```
analytics/
├── analytics.repo.ts       # Database queries
├── analytics.services.ts   # Data processing
├── analytics.controller.ts # Request handlers
├── analytics.route.ts      # Route definitions
├── index.ts               # Module exports
└── README.md             # This file
```

## Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /analytics/activity-over-time` | Activity over time with 4 period filters |
| `GET /analytics/activity-by-log-type` | Activity distribution by log type (pie chart) |

## Quick Usage

### 1. Activity Over Time

```bash
# Monthly view (default - current year)
curl -X GET "http://localhost:3000/api/analytics/activity-over-time?period=MONTHLY" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Daily view (last 30 days)
curl -X GET "http://localhost:3000/api/analytics/activity-over-time?period=DAILY" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Weekly view (last 6 months)
curl -X GET "http://localhost:3000/api/analytics/activity-over-time?period=WEEKLY" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Yearly view (last 5 years)
curl -X GET "http://localhost:3000/api/analytics/activity-over-time?period=YEARLY" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Activity by Log Type

```bash
# Pie chart data
curl -X GET "http://localhost:3000/api/analytics/activity-by-log-type" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Response Examples

### Activity Over Time (MONTHLY)
```json
{
  "status": "success",
  "data": {
    "period": "MONTHLY",
    "total": 1234,
    "data": [
      { "label": "Jan", "count": 250 },
      { "label": "Feb", "count": 890 },
      // ... all 12 months
    ]
  }
}
```

### Activity by Log Type
```json
{
  "status": "success",
  "data": {
    "totalLogsCount": 483,
    "totalUserActionsCount": 223,
    "deviceActionsCount": 125,
    "firmwareCount": 25,
    "chartData": [
      { "label": "Total User Actions", "value": 223, "percentage": 46, "color": "#4CAF50" },
      { "label": "Device Actions", "value": 125, "percentage": 26, "color": "#FFA726" },
      { "label": "Firmware", "value": 25, "percentage": 5, "color": "#42A5F5" }
    ]
  }
}
```

## Chart Integration

```javascript
// Fetch and display activity over time
const res = await fetch('/api/analytics/activity-over-time?period=MONTHLY', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await res.json();

// Use with Chart.js
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: data.data.data.map(d => d.label),
    datasets: [{ data: data.data.data.map(d => d.count) }]
  }
});
```

## Features

- ✅ 4 time period filters (DAILY, WEEKLY, MONTHLY, YEARLY)
- ✅ Log type breakdown (USER, DEVICE, FIRMWARE)
- ✅ User hierarchy support (includes subordinates)
- ✅ Date range filtering (optional)
- ✅ Chart-ready data format
- ✅ Pre-calculated percentages and colors

## Documentation

Full API documentation: `/docs/ANALYTICS_API.md`

## Authentication

All endpoints require JWT token in Authorization header.

## Data Source

Uses `ActivityLog` table with `logType` field:
- USER
- DEVICE
- FIRMWARE
- MODBUS_WRITE_REGISTERS
- PLANT
- NOTIFICATION

