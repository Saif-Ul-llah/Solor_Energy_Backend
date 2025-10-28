# Modbus API Troubleshooting Guide

## 🔍 Issue: All Register Values Return NULL

### Your Current Response:
```json
{
  "raw": {
    "": null
  }
}
```

This indicates the vendor API is not returning any register data.

---

## 🎯 Debugging Steps

### Step 1: Check Server Logs

After calling the API, check your server console for these debug messages:
```
📡 Modbus API Response: [...]
📊 Rows received: X
🗺️ Raw register map: {...}
```

**What to look for:**
- If `Rows received: 0` → Vendor returned empty array
- If raw map is empty `{}` → No registers were parsed
- If you see actual data → Parsing issue

---

### Step 2: Verify Inverter Status

```bash
# Check if device exists in your system
GET /api/device/getDeviceBySn?sn=2342-23820000PH

# Check if device exists in vendor system
GET /api/device/getDeviceDetails?sn=2342-23820000PH
```

**Expected Response:**
```json
{
  "GoodsID": "2342-23820000PH",
  "Status": 1,  // 1 = Online, 0 = Offline
  "OnlineStatus": "Online"
}
```

If `Status: 0` or `OnlineStatus: "Offline"` → **Inverter is offline**

---

### Step 3: Check Vendor API Response Format

The vendor API might return data in different formats:

**Option A:** Array of objects
```json
[
  { "Modbus": "5002", "Value": "5150" },
  { "Modbus": "5004", "Value": "2640" }
]
```

**Option B:** Nested object
```json
{
  "status": true,
  "data": [
    { "modbus": "5002", "value": "5150" }
  ]
}
```

**Option C:** Direct object
```json
{
  "5002": "5150",
  "5004": "2640"
}
```

---

### Step 4: Add More Debug Logging

Update your `readInverterModbusRegisters` function temporarily:

```typescript
try {
  console.log("🔧 Request Config:", {
    url: config.url,
    GoodsID,
    MemberID,
    RegisterCount: regsToRead.length
  });

  const response: AxiosResponse<any[]> = await axios.request(config);
  
  console.log("✅ Response Status:", response.status);
  console.log("📦 Response Data Type:", typeof response.data);
  console.log("📦 Response Data:", JSON.stringify(response.data, null, 2));
  
  const rows = response.data || [];
  console.log("📊 Parsed Rows:", rows);
```

---

### Step 5: Test with Known Working Device

Try with a device that you know is online and has data:

```bash
# List all your devices first
GET /api/device/getAllDeviceList?userId=XXX

# Pick one that shows "Online" status
# Then test Modbus read on that one
GET /api/device/modbus/{ONLINE_SN}/{MEMBER_ID}/read?registers=2110
```

---

## 🔧 Common Fixes

### Fix 1: Response Data Structure Issue

If vendor returns nested data, update the parsing:

```typescript
// In readInverterModbusRegisters(), change:
const rows = response.data || [];

// To:
const rows = Array.isArray(response.data) 
  ? response.data 
  : response.data?.data || response.data?.result || [];
```

### Fix 2: Check Response Property Names

The vendor might use different property names:

```typescript
// Current code checks multiple variants:
const key = String(r.Modbus ?? r.modbus ?? r.address ?? "")
const value = r.Value ?? r.value ?? null

// Add more variants if needed:
const key = String(
  r.Modbus ?? r.modbus ?? r.address ?? r.Address ?? r.register ?? ""
)
const value = r.Value ?? r.value ?? r.val ?? r.data ?? null
```

### Fix 3: Verify API Endpoint

Double-check the endpoint is correct:

```typescript
// Current:
url: `${CLOUD_BASEURL}/OpenAPI/v1/Openapi/getInverterSeting`

// Verify it's not:
// getInverterSettings (with 's')
// getInverterConfig
// getModbusRegisters
```

---

## 🧪 Manual Test with Vendor API

Test the vendor API directly to see raw response:

```bash
# Using curl or Postman
POST https://your-vendor-domain/OpenAPI/v1/Openapi/getInverterSeting
Content-Type: multipart/form-data

GoodsID: 2342-23820000PH
MemberID: your-member-id
ModbusArr: ["2110","21B6","5002"]
Sign: your-sign-value
```

**Expected Response from Vendor:**
```json
[
  { "Modbus": "2110", "Value": "1" },
  { "Modbus": "21B6", "Value": "200" },
  { "Modbus": "5002", "Value": "5150" }
]
```

---

## 📋 Verification Checklist

- [ ] Inverter is powered on and online
- [ ] Inverter is connected to network/internet
- [ ] Serial number is correct (check spelling/case)
- [ ] MemberId (customer email) is correct
- [ ] Sign/authentication is valid
- [ ] Vendor API endpoint is correct
- [ ] Check server logs for actual vendor response
- [ ] Test with a different inverter (if available)
- [ ] Verify in vendor's web portal that settings are visible

---

## 🔍 Next Debugging Steps

### 1. Check What the Vendor Actually Returns

Add this to see the exact vendor response:

```typescript
// In readInverterModbusRegisters(), right after axios.request():
const response: AxiosResponse<any> = await axios.request(config);

// Log everything
console.log("=== VENDOR API DEBUG ===");
console.log("Status:", response.status);
console.log("Headers:", response.headers);
console.log("Full Response:", JSON.stringify(response.data, null, 2));
console.log("Data Type:", typeof response.data);
console.log("Is Array?:", Array.isArray(response.data));
console.log("========================");
```

### 2. Test Individual Registers

Try reading just one register at a time:

```bash
# Test battery type only
GET /api/device/modbus/2342-23820000PH/your-member-id/read?registers=2110
```

### 3. Compare with Working API

Call the `getDeviceBySN` function (which you know works) and compare the response format:

```typescript
// In your test:
const deviceInfo = await getDeviceBySN("2342-23820000PH", memberId);
console.log("Device Info Response:", deviceInfo);

// Then call modbus
const modbusData = await readInverterModbusRegisters("2342-23820000PH", memberId);
console.log("Modbus Response:", modbusData);
```

---

## 🎯 Most Likely Solutions

### Solution 1: Inverter is Offline
**Action:** Wait for inverter to come online, or test with an online device

### Solution 2: Vendor API Returns Different Format
**Action:** Check server logs and adjust parsing logic accordingly

### Solution 3: These Registers Don't Exist on This Model
**Action:** Try different register addresses from the protocol document

---

## 🚀 Quick Test Script

Create a test file to debug:

```typescript
// test-modbus.ts
import { readInverterModbusRegisters } from './src/helpers/thirdParty';

async function testModbus() {
  try {
    console.log("🧪 Testing Modbus Read...");
    
    const result = await readInverterModbusRegisters(
      "2342-23820000PH",
      "your-member-id@email.com",
      ["2110", "21B6"] // Just test 2 registers
    );
    
    console.log("✅ Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testModbus();
```

Run: `ts-node test-modbus.ts`

---

## 📞 When to Contact Vendor Support

Contact Senergy support if:

1. ✅ Inverter is confirmed online
2. ✅ Serial number is correct
3. ✅ Authentication is working (other APIs work)
4. ❌ But Modbus registers still return empty

**Questions to ask:**
- What is the correct endpoint for reading Modbus registers?
- What format does `getInverterSeting` API return?
- Do these register addresses work with model: 2342-23820000PH?
- Are there any special permissions needed for Modbus access?

---

## ✨ Your API Structure is Perfect!

The good news is your API structure and response format are **exactly correct**. Once you get actual data from the vendor API, your response will look like:

```json
{
  "data": {
    "Battery Setting": {
      "Battery type": {
        "value": 1,           // ← Actual value
        "unit": "enum",
        "reg": "2110",
        "rw": "RW",
        "raw": "1"
      },
      "Battery capacity": {
        "value": 200,         // ← Actual value (200 Ah)
        "unit": "Ah",
        "reg": "21B6",
        "rw": "RW",
        "raw": "200"
      }
    },
    "Grid Settings": {
      "Frequency High Loss Level_1(Hz)": {
        "value": 51.5,        // ← Decoded from 5150
        "unit": "Hz",
        "reg": "5002",
        "rw": "RW",
        "raw": "5150"
      }
    }
  }
}
```

---

## 🎉 Next Steps

1. **Check server logs** for the debug output I added
2. **Verify inverter is online** using other API endpoints
3. **Test with a known-good device** if available
4. **Review vendor API documentation** for the exact response format
5. **Contact me with the debug logs** and I can help adjust the parsing

Your implementation is solid - we just need to see what the vendor is actually returning! 🚀

