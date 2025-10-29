# Device Analytics API Documentation

## Overview
This document describes the device analytics endpoints for tracking device counts and monthly device registration trends.

---

## Endpoints

### 1. Get Device Overview
**Endpoint:** `GET /analytics/device-overview`

**Description:** Returns total counts of all devices, inverters, and batteries for the authenticated user and their sub-users.

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response Example:**
```json
{
  "status": "success",
  "message": "Device overview fetched successfully",
  "data": {
    "totalDevices": 465,
    "totalInverters": 365,
    "totalBatteries": 50
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid or missing token)
- `500` - Internal server error

---

### 2. Get Device Monthly Graph
**Endpoint:** `GET /analytics/device-monthly-graph`

**Description:** Returns month-wise device registration data for the specified year, showing how many new devices were added each month, broken down by device type (inverters and batteries).

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Query Parameters:**
| Parameter | Type   | Required | Default       | Description                    |
|-----------|--------|----------|---------------|--------------------------------|
| `year`    | number | No       | Current year  | Year to fetch data for (2000-2100) |

**Request Example:**
```
GET /analytics/device-monthly-graph?year=2024
```

**Response Example:**
```json
{
  "status": "success",
  "message": "Device monthly graph fetched successfully",
  "data": {
    "year": 2024,
    "chartData": [
      {
        "month": "Jan",
        "inverters": 42,
        "batteries": 27,
        "total": 69
      },
      {
        "month": "Feb",
        "inverters": 33,
        "batteries": 17,
        "total": 50
      },
      {
        "month": "Mar",
        "inverters": 15,
        "batteries": 17,
        "total": 32
      },
      {
        "month": "Apr",
        "inverters": 62,
        "batteries": 20,
        "total": 82
      },
      {
        "month": "May",
        "inverters": 55,
        "batteries": 15,
        "total": 70
      },
      {
        "month": "Jun",
        "inverters": 84,
        "batteries": 15,
        "total": 99
      },
      {
        "month": "Jul",
        "inverters": 36,
        "batteries": 57,
        "total": 93
      },
      {
        "month": "Aug",
        "inverters": 25,
        "batteries": 15,
        "total": 40
      },
      {
        "month": "Sep",
        "inverters": 76,
        "batteries": 18,
        "total": 94
      },
      {
        "month": "Oct",
        "inverters": 82,
        "batteries": 12,
        "total": 94
      },
      {
        "month": "Nov",
        "inverters": 38,
        "batteries": 54,
        "total": 92
      },
      {
        "month": "Dec",
        "inverters": 30,
        "batteries": 12,
        "total": 42
      }
    ],
    "summary": {
      "totalInverters": 87,
      "totalBatteries": 42,
      "totalDevices": 465
    }
  }
}
```

**Response Fields:**
- `year` - The year for which data is returned
- `chartData` - Array of monthly data points
  - `month` - Month abbreviation (Jan, Feb, etc.)
  - `inverters` - Number of NEW inverters added in this specific month
  - `batteries` - Number of NEW batteries added in this specific month
  - `total` - Number of NEW devices added in this specific month
- `summary` - Total devices added throughout the year
  - `totalInverters` - Sum of all inverters added across all months
  - `totalBatteries` - Sum of all batteries added across all months
  - `totalDevices` - Sum of all devices added across all months

**Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid year parameter)
- `401` - Unauthorized (invalid or missing token)
- `500` - Internal server error

---

## Notes

### Data Calculation Logic
1. **Device Overview**: Counts all devices owned by the authenticated user and all their descendant users (recursive).

2. **Monthly Graph**: 
   - Shows **monthly additions** (new devices added each month)
   - Data is filtered by device `createdAt` date within the specified year
   - Only includes devices owned by the authenticated user and their descendant users
   - Each month shows only the devices added in that specific month
   - Summary totals show the sum of all monthly additions

### Chart Visualization
Based on the provided design, the monthly graph should:
- Use a **grouped bar chart** with 3 bars per month:
  - **Blue bar**: Total devices
  - **Green bar**: Inverters
  - **Orange bar**: Batteries
- Show all 12 months (Jan-Dec) on the X-axis
- Display cumulative counts on the Y-axis
- Include grid lines for better readability

### Access Control
- All endpoints require authentication via Bearer token
- Users can only see data for devices they own or devices owned by their sub-users
- The system automatically includes all descendant users in the hierarchy

---

## Example Integration

### JavaScript/TypeScript
```typescript
// Fetch device overview
const getDeviceOverview = async () => {
  const response = await fetch('/analytics/device-overview', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
};

// Fetch device monthly graph
const getDeviceMonthlyGraph = async (year: number = new Date().getFullYear()) => {
  const response = await fetch(`/analytics/device-monthly-graph?year=${year}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
};
```

### cURL
```bash
# Get device overview
curl -X GET "http://localhost:3000/analytics/device-overview" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get device monthly graph for 2024
curl -X GET "http://localhost:3000/analytics/device-monthly-graph?year=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid year. Must be between 2000 and 2100"
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized. Please provide a valid token."
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "An error occurred while processing your request"
}
```

