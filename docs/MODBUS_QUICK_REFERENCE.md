# Modbus API - Quick Reference Card

## 🚀 Quick Start

### 1️⃣ Get Available Registers
```bash
GET /api/device/modbus/register-map
Authorization: Bearer <token>
```

### 2️⃣ Read All Settings
```bash
GET /api/device/modbus/{SERIAL_NUMBER}/read
Authorization: Bearer <token>
```

### 3️⃣ Read Specific Registers
```bash
GET /api/device/modbus/{SERIAL_NUMBER}/read?registers=2110,21B6,5002
Authorization: Bearer <token>
```

### 4️⃣ Write Settings
```bash
POST /api/device/modbus/{SERIAL_NUMBER}/write
Authorization: Bearer <token>
Content-Type: application/json

{
  "registers": {
    "5002": 5200,
    "5004": 2640
  }
}
```

---

## 📋 Common Register Quick List

### Battery
| Reg | Field | Unit | Value Range |
|-----|-------|------|-------------|
| 2110 | Battery type | enum | 0-3 |
| 21B6 | Capacity | Ah | 50-500 |
| 21B4 | Charge efficiency | % | 80-100 |

### Grid Protection (Level 1)
| Reg | Field | Format | Example |
|-----|-------|--------|---------|
| 5002 | Freq High | Hz×100 | 5150 = 51.5Hz |
| 5003 | Freq Low | Hz×100 | 4850 = 48.5Hz |
| 5004 | Volt High | V×10 | 2640 = 264V |
| 5005 | Volt Low | V×10 | 1950 = 195V |
| 5006 | Time High (freq) | ms | 200 |
| 5007 | Time Low (freq) | ms | 200 |
| 5008 | Time High (volt) | ms | 1000 |
| 5009 | Time Low (volt) | ms | 2000 |

### Connection Settings
| Reg | Field | Unit |
|-----|-------|------|
| 5000 | First connect delay | s |
| 5001 | Reconnect delay | s |
| 502E | Power gradient (1st) | %/min |
| 5019 | Power gradient (re) | %/min |

### Advanced
| Reg | Field | Unit |
|-----|-------|------|
| 3005 | Power control | W |
| 30B9 | Max feed-in | W |
| 5030 | Reactive mode | enum |
| 5031 | cosφ | ×1000 |
| 2100 | Work mode | enum |

---

## 🔢 Value Conversions

### Frequency
```
Display: 50.5 Hz
Raw:     5050
Formula: value × 100
```

### Voltage  
```
Display: 230.5 V
Raw:     2305
Formula: value × 10
```

### Power Factor
```
Display: 0.95
Raw:     950
Formula: value × 1000
```

---

## 📝 Response Format

### Read Response
```json
{
  "status": "success",
  "message": "Modbus registers read successfully",
  "data": {
    "serial": "ES6G12345678",
    "registersRequested": ["2110", "5002"],
    "data": {
      "Battery Setting": {
        "Battery type": {
          "value": 1,
          "unit": "enum",
          "reg": "2110",
          "rw": "RW",
          "raw": "1"
        }
      }
    },
    "raw": {
      "2110": "1",
      "5002": "5150"
    }
  }
}
```

---

## ⚡ Quick Copy-Paste Examples

### Read Battery Settings
```bash
curl -X GET "http://localhost:3000/api/device/modbus/ES6G12345678/read?registers=2110,21B6,21B4,21BD" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Grid Frequency Limits
```bash
curl -X POST "http://localhost:3000/api/device/modbus/ES6G12345678/write" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registers": {
      "5002": 5200,
      "5003": 4800
    }
  }'
```

### Configure WiFi
```bash
curl -X POST "http://localhost:3000/api/device/modbus/ES6G12345678/write" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registers": {
      "3060": "MyWiFi",
      "3070": "password123"
    }
  }'
```

---

## 🎨 TypeScript Quick Functions

### Read Function
```typescript
const readModbus = async (sn: string, registers?: string[]) => {
  const query = registers ? `?registers=${registers.join(',')}` : '';
  const res = await fetch(`/api/device/modbus/${sn}/read${query}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};
```

### Write Function
```typescript
const writeModbus = async (
  sn: string,
  values: Record<string, number | string>
) => {
  const res = await fetch(`/api/device/modbus/${sn}/write`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ registers: values })
  });
  return res.json();
};
```

---

## ⚠️ Important Notes

1. **Always authenticate** - All endpoints require valid JWT
2. **Check connectivity** - Inverter must be online
3. **Validate values** - Ensure values are within acceptable ranges
4. **Read before write** - Check current values first
5. **Use raw format for writes** - Values must be encoded (Hz×100, V×10)
6. **Response includes decoded values** - Easier to read

---

## 🔗 Related Files

- `src/helpers/thirdParty/index.ts` - Core implementation
- `src/modules/device/device.controller.ts` - Controllers
- `src/modules/device/device.services.ts` - Services
- `src/modules/device/device.route.ts` - Routes
- `MODBUS_API_DOCUMENTATION.md` - Full documentation
- `MODBUS_USAGE_EXAMPLES.md` - Code examples

---

## 🎯 Testing Checklist

- [ ] Get register map
- [ ] Read all registers from test inverter
- [ ] Read specific battery registers
- [ ] Read grid protection settings
- [ ] Write test value (non-critical register)
- [ ] Verify write by reading back
- [ ] Test error handling (invalid SN)
- [ ] Test with offline inverter
- [ ] Monitor logs for issues

---

## 💡 Pro Tips

1. **Cache the register map** - It doesn't change often
2. **Group related reads** - Read multiple registers in one call
3. **Implement retry logic** - Network issues happen
4. **Log all writes** - For audit trail and debugging
5. **Use TypeScript types** - Better IDE autocomplete
6. **Test on staging first** - Don't modify production inverters blindly

---

**Need more help?** Check the full documentation files or the Senergy Modbus Protocol PDF!

