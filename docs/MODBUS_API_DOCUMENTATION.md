# Modbus Register API Documentation

## Overview
This API allows you to read and write Modbus registers from Senergy solar inverters. The registers control various settings including battery configuration, grid protection, network settings, and advanced features.

## Base URL
```
/api/device/modbus
```

---

## 📋 API Endpoints

### 1. Get Modbus Register Map
**GET** `/modbus/register-map`

Returns a complete map of all available Modbus registers grouped by section.

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
  "message": "Modbus register map retrieved successfully",
  "data": {
    "totalRegisters": 50,
    "sections": {
      "Battery Setting": [
        {
          "register": "2110",
          "field": "Battery type",
          "unit": "enum",
          "readWrite": "RW",
          "description": "Battery type (enum)"
        }
      ],
      "Grid Settings": [
        {
          "register": "5002",
          "field": "Frequency High Loss Level_1(Hz)",
          "unit": "Hz",
          "readWrite": "RW",
          "description": "Frequency High Loss Level_1(Hz) (Hz)"
        }
      ]
    },
    "allRegisters": ["2110", "21B6", "5000", ...]
  }
}
```

---

### 2. Read Modbus Registers
**GET** `/modbus/:sn/read`

Read register values from a specific inverter.

**URL Parameters:**
- `sn` - Serial number of the inverter (e.g., `ES6G12345678`)

**Query Parameters (Optional):**
- `registers` - Comma-separated list of specific registers to read
  - Example: `?registers=5002,5003,5004`
  - If not provided, reads ALL registers from the map

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
  "message": "Modbus registers read successfully",
  "data": {
    "serial": "ES6G12345678",
    "registersRequested": ["5002", "5003", "5004", ...],
    "data": {
      "Battery Setting": {
        "Battery type": {
          "value": 1,
          "unit": "enum",
          "reg": "2110",
          "rw": "RW",
          "raw": "1"
        },
        "Battery capacity": {
          "value": 200,
          "unit": "Ah",
          "reg": "21B6",
          "rw": "RW",
          "raw": "200"
        }
      },
      "Grid Settings": {
        "Frequency High Loss Level_1(Hz)": {
          "value": 51.5,
          "unit": "Hz",
          "reg": "5002",
          "rw": "RW",
          "raw": "5150"
        },
        "Voltage High Loss Level_1(V)": {
          "value": 264.5,
          "unit": "V",
          "reg": "5004",
          "rw": "RW",
          "raw": "2645"
        }
      }
    },
    "raw": {
      "2110": "1",
      "21B6": "200",
      "5002": "5150",
      "5004": "2645"
    }
  }
}
```

**Examples:**

1. **Read all registers:**
```bash
GET /api/device/modbus/ES6G12345678/read
```

2. **Read specific registers:**
```bash
GET /api/device/modbus/ES6G12345678/read?registers=5002,5003,5004,5005
```

---

### 3. Write Modbus Registers
**POST** `/modbus/:sn/write`

Write values to specific registers on an inverter.

**URL Parameters:**
- `sn` - Serial number of the inverter

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "registers": {
    "5002": 5200,
    "5004": 2650,
    "2110": 1
  }
}
```

**Response Example:**
```json
{
  "status": "success",
  "message": "Modbus registers written successfully",
  "data": {
    "status": true,
    "message": "Settings updated successfully"
  }
}
```

**Important Notes for Writing:**
- Values should be in **RAW format** (not decoded)
  - For frequency (Hz): multiply by 100 (e.g., 52 Hz → 5200)
  - For voltage (V): multiply by 10 (e.g., 265 V → 2650)
- Only write to registers marked as "RW" (Read/Write)
- Validate values according to inverter specifications

---

## 📊 Register Sections & Common Use Cases

### Battery Settings
```json
{
  "2110": 1,        // Battery type (0=Lead-Acid, 1=Lithium, etc.)
  "21B6": 200,      // Battery capacity (Ah)
  "21B4": 95,       // Battery charge efficiency (%)
  "21BD": 5         // Temperature compensation (mV/°C)
}
```

### Grid Protection (Level 1)
```json
{
  "5002": 5150,     // Frequency High Loss (51.5 Hz → 5150)
  "5003": 4850,     // Frequency Low Loss (48.5 Hz → 4850)
  "5004": 2645,     // Voltage High Loss (264.5 V → 2645)
  "5005": 1950,     // Voltage Low Loss (195.0 V → 1950)
  "5006": 200,      // Freq High Loss Time (ms)
  "5007": 200,      // Freq Low Loss Time (ms)
  "5008": 1000,     // Volt High Loss Time (ms)
  "5009": 2000      // Volt Low Loss Time (ms)
}
```

### Grid Connection Settings
```json
{
  "5000": 300,      // First connect delay (seconds)
  "5001": 300,      // Reconnect delay (seconds)
  "502E": 10,       // First connect power gradient (%/min)
  "5019": 20        // Reconnect power gradient (%/min)
}
```

### Network Settings
```json
{
  "3060": "MyWiFi",      // SSID (string)
  "3070": "password123"  // WiFi password (string)
}
```

### Advanced Settings
```json
{
  "3005": 5000,     // Power control (W)
  "30B5": 1,        // Meter location (0=CT, 1=Grid)
  "30B9": 10000,    // Max feed-in power (W)
  "5030": 0,        // Reactive power mode (0=Off, 1=On)
  "5031": 1000,     // cosφ (value × 1000)
  "2100": 1         // Hybrid work mode (enum)
}
```

---

## 🔧 Value Encoding/Decoding

### Frequency (Hz)
- **Stored as:** value × 100
- **Example:** 50.5 Hz → 5050
```javascript
const rawValue = 5050;
const hz = rawValue / 100;  // 50.5 Hz
```

### Voltage (V)
- **Stored as:** value × 10
- **Example:** 230.5 V → 2305
```javascript
const rawValue = 2305;
const volts = rawValue / 10;  // 230.5 V
```

### cosφ (Power Factor)
- **Stored as:** value × 1000
- **Example:** 0.95 → 950
```javascript
const rawValue = 950;
const cosPhi = rawValue / 1000;  // 0.95
```

---

## 🎯 Common Use Cases

### Example 1: Update Grid Protection Thresholds
```bash
POST /api/device/modbus/ES6G12345678/write
Content-Type: application/json

{
  "registers": {
    "5002": 5200,    // High freq: 52 Hz
    "5003": 4800,    // Low freq: 48 Hz
    "5004": 2640,    // High voltage: 264 V
    "5005": 1950     // Low voltage: 195 V
  }
}
```

### Example 2: Read Only Battery Settings
```bash
GET /api/device/modbus/ES6G12345678/read?registers=2110,21B6,21B4,21BD
```

### Example 3: Configure WiFi
```bash
POST /api/device/modbus/ES6G12345678/write

{
  "registers": {
    "3060": "HomeNetwork",
    "3070": "SecurePassword123"
  }
}
```

### Example 4: Set Power Limit
```bash
POST /api/device/modbus/ES6G12345678/write

{
  "registers": {
    "3005": 4000,     // Limit to 4000W
    "30B9": 8000      // Max feed-in: 8000W
  }
}
```

---

## ⚠️ Important Considerations

### Safety & Validation
1. **Always read current values first** before writing
2. **Validate ranges** according to grid standards
3. **Test on non-production devices** first
4. **Check inverter model compatibility**
5. **Monitor inverter logs** after changes

### Rate Limiting
- The vendor API may have rate limits
- Implement caching for frequently read registers
- Batch read operations when possible

### Error Handling
```json
{
  "status": "failed",
  "message": "Failed to read Modbus registers",
  "data": {}
}
```

Common errors:
- Invalid serial number
- Timeout (inverter offline)
- Invalid register address
- Write to read-only register
- Authentication failure

---

## 🔐 Authentication

All endpoints require a valid JWT token with:
- Valid user authentication
- Associated `memberId` (customer email)

The `memberId` is automatically extracted from `req.user.memberId`.

---

## 🚀 Integration Example (JavaScript/TypeScript)

```typescript
// Read all registers
const readAllRegisters = async (serialNumber: string, token: string) => {
  const response = await fetch(
    `${API_BASE}/device/modbus/${serialNumber}/read`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};

// Read specific registers
const readBatterySettings = async (serialNumber: string, token: string) => {
  const registers = ['2110', '21B6', '21B4', '21BD'].join(',');
  const response = await fetch(
    `${API_BASE}/device/modbus/${serialNumber}/read?registers=${registers}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};

// Write registers
const updateGridProtection = async (
  serialNumber: string,
  token: string,
  values: Record<string, number>
) => {
  const response = await fetch(
    `${API_BASE}/device/modbus/${serialNumber}/write`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ registers: values })
    }
  );
  return response.json();
};

// Usage
const token = 'your-jwt-token';
const sn = 'ES6G12345678';

// Read current settings
const currentSettings = await readAllRegisters(sn, token);
console.log(currentSettings.data['Grid Settings']);

// Update frequency thresholds
await updateGridProtection(sn, token, {
  '5002': 5200,  // 52 Hz
  '5003': 4800   // 48 Hz
});
```

---

## 📚 Additional Resources

- **Senergy Modbus Protocol Documentation**: Reference the PDF for detailed register descriptions
- **Grid Standards**: Consult local grid codes before modifying protection settings
- **Inverter Manual**: Check model-specific limitations

---

## 🆘 Support & Troubleshooting

### Common Issues

1. **Register returns null**
   - Register not supported by inverter model
   - Inverter offline or communication error

2. **Write operation fails**
   - Register is read-only
   - Value out of acceptable range
   - Insufficient permissions

3. **Timeout errors**
   - Inverter offline
   - Network connectivity issues
   - Vendor API rate limiting

### Debug Tips
```bash
# Check register map first
GET /api/device/modbus/register-map

# Test with a single register
GET /api/device/modbus/SERIAL/read?registers=2110

# Verify device connectivity
GET /api/device/getDeviceBySn?sn=SERIAL
```

---

## 📝 Change Log

### Version 1.0.0
- Initial implementation
- Support for 50+ Modbus registers
- Read/Write operations
- Automatic value encoding/decoding
- Grouped register responses

