# Modbus Write Callback Mechanism

## 🔄 How Write Operations Work

The vendor's Modbus write API uses an **asynchronous callback pattern**:

```
1. Your API sends write command → Vendor API
2. Vendor API responds immediately: { "status": "pending" }
3. Vendor processes command (can take 60-600 seconds)
4. Vendor calls YOUR callback URL with result
5. Your callback endpoint must respond with "success"
```

---

## 📡 Callback Flow Diagram

```
┌─────────────┐         POST /setRemoteSetting          ┌──────────────┐
│   Your API  │ ──────────────────────────────────────> │  Vendor API  │
│             │         (write command)                  │              │
└─────────────┘                                          └──────────────┘
       │                                                        │
       │                { status: "..." }                       │
       │ <──────────────────────────────────────────────────── │
       │                                                        │
       │                                                        ▼
       │                                                  Processing...
       │                                                  (60-600s)
       │                                                        │
       ▼                                                        │
┌─────────────┐         POST /callback/write-result     ┌──────────────┐
│  Callback   │ <────────────────────────────────────── │  Vendor API  │
│  Endpoint   │         (result data)                    │              │
│             │                                          └──────────────┘
│             │ ──────────────────────────────────────>
│             │         Response: "success"
└─────────────┘
```

---

## 🎯 Callback Endpoint

### URL
```
POST /api/device/modbus/callback/write-result
```

**IMPORTANT:** This endpoint has **NO authentication** (vendor won't send auth token)

### Request from Vendor
```json
{
  "GoodsID": "ES6G12345678",
  "operate": "write",
  "modbusInfo": "{\"5000\":\"1\",\"5001\":\"1\"}",
  "SystemTime": "2023-10-01 00:00:00"
}
```

### Response Required
```
"success"
```
**Must be lowercase string "success"** - NOT JSON!

---

## 📊 Callback Data Format

### modbusInfo Values
- `"1"` = Success ✅
- `"2"` = Failed ❌

**Example:**
```json
{
  "modbusInfo": {
    "5000": "1",  // ✅ Register 5000 written successfully
    "5001": "1",  // ✅ Register 5001 written successfully
    "5002": "2"   // ❌ Register 5002 failed
  }
}
```

---

## ⚙️ Configuration

### Add to `.env` file:
```bash
# Modbus Write Callback URL (publicly accessible)
MODBUS_CALLBACK_URL=https://your-domain.com/api/device/modbus/callback/write-result
```

**Requirements for Callback URL:**
1. Must be **publicly accessible** (vendor can reach it)
2. Must accept POST requests
3. Must respond with `"success"` string
4. Should process within 30 seconds

**For Development/Testing:**
- Use **ngrok** or **localtunnel** to expose localhost
- Example: `https://abc123.ngrok.io/api/device/modbus/callback/write-result`

---

## 🔧 Setting Up ngrok for Testing

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 5000

# ngrok will give you a URL like:
# https://abc123.ngrok.io

# Set in .env:
MODBUS_CALLBACK_URL=https://abc123.ngrok.io/api/device/modbus/callback/write-result

# Now vendor can call your local callback!
```

---

## 📝 What Happens When You Call Write

### Step 1: Send Write Request
```bash
POST /api/device/modbus/ES6G12345678/progziel01/write

{
  "registers": {
    "5000": 300,
    "5001": 300
  }
}
```

### Step 2: Immediate Response
```json
{
  "status": "success",
  "message": "Write command sent successfully. Result will be sent to callback URL.",
  "callbackUrl": "https://your-domain.com/api/device/modbus/callback/write-result",
  "registersWritten": ["5000", "5001"]
}
```

### Step 3: Wait 60-600 seconds...

Vendor processes the command and attempts to write to the inverter.

### Step 4: Callback Received
Your server receives:
```json
{
  "GoodsID": "ES6G12345678",
  "operate": "write",
  "modbusInfo": "{\"5000\":\"1\",\"5001\":\"1\"}",
  "SystemTime": "2023-10-01 12:30:45"
}
```

### Step 5: Your Callback Processes & Responds

**Your server logs:**
```
📨 Modbus Write Callback Received: {...}
📥 Processing Modbus Write Callback: {...}
✅ Modbus Write Results: {
  serialNumber: "ES6G12345678",
  timestamp: "2023-10-01 12:30:45",
  results: {
    "5000": true,
    "5001": true
  },
  allSuccess: true
}
```

**Your server responds:**
```
"success"
```

---

## 🎨 Callback Endpoint Code

Already implemented in `device.controller.ts`:

```typescript
public static modbusWriteCallback = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { GoodsID, operate, modbusInfo, SystemTime } = req.body;

    logger("📨 Modbus Write Callback Received:", {
      GoodsID,
      operate,
      modbusInfo,
      SystemTime,
    });

    // Process the callback
    await DeviceServices.processModbusWriteCallbackService({
      serialNumber: GoodsID,
      operation: operate,
      modbusData: modbusInfo,
      timestamp: SystemTime,
    });

    // CRITICAL: Must return lowercase "success" string
    res.status(200).send("success");
  }
);
```

---

## 🔔 Real-time Notifications (Optional Enhancement)

### Option 1: WebSocket / Socket.io

Add to callback processor:
```typescript
// In processModbusWriteCallbackService
import { io } from "../../services/socket_service/app_socket";

// Emit event to connected clients
io.emit("modbus:write:complete", {
  serialNumber: data.serialNumber,
  results,
  timestamp: data.timestamp,
  success: allSuccess,
});
```

### Option 2: Database Storage

Store results in database for later retrieval:
```typescript
// Create ModbusWriteLog table
await prisma.modbusWriteLog.create({
  data: {
    serialNumber: data.serialNumber,
    operation: data.operation,
    modbusData: JSON.stringify(modbusInfo),
    results: JSON.stringify(results),
    success: allSuccess,
    timestamp: new Date(data.timestamp),
  }
});
```

### Option 3: Polling Endpoint

Create endpoint to check write status:
```typescript
GET /api/device/modbus/write-status/:jobId
```

---

## ⚠️ Important Considerations

### 1. Callback Retry Logic
- Vendor retries callback if you don't respond with `"success"`
- Retries for up to **600 seconds (10 minutes)**
- Make sure your callback is **idempotent** (can handle duplicate calls)

### 2. Security
- Callback endpoint has **no authentication**
- Consider adding **IP whitelisting** for vendor IPs
- Or implement **signature verification** if vendor provides it

### 3. Timeout
- Vendor waits for callback response
- Process quickly (< 30 seconds)
- Don't do heavy operations in callback

### 4. Failure Handling
- Log all callbacks (successful or failed)
- Alert if registers fail to write
- Implement retry mechanism for failed writes

---

## 🧪 Testing the Callback

### Test 1: Manual Callback Test
```bash
# Simulate vendor calling your callback
curl -X POST "http://localhost:5000/api/device/modbus/callback/write-result" \
  -H "Content-Type: application/json" \
  -d '{
    "GoodsID": "ES6G12345678",
    "operate": "write",
    "modbusInfo": "{\"5000\":\"1\",\"5001\":\"1\"}",
    "SystemTime": "2023-10-01 12:30:45"
  }'

# Expected response: "success"
```

### Test 2: End-to-End Test
```bash
# 1. Send write command
POST /api/device/modbus/ES6G12345678/progziel01/write
{
  "registers": {
    "5000": 300,
    "5001": 300
  }
}

# 2. Check server logs for:
# - "📝 Writing Modbus registers"
# - "✅ Write command sent"
# - "⏳ Result will be sent to callback"

# 3. Wait 60-600 seconds

# 4. Check logs for:
# - "📨 Modbus Write Callback Received"
# - "📥 Processing Modbus Write Callback"
# - "✅ Modbus Write Results"
```

---

## 📚 Vendor API Notes

From documentation:
- **Endpoint:** `/OpenAPI/v1/Openapi/setRemoteSetting`
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Callback window:** 60-600 seconds
- **Retry:** Until "success" received or 600s timeout
- **ESP32 Module:** Requires version 07+

---

## 💡 Pro Tips

1. **Use ngrok for local testing** - Expose your localhost to receive callbacks
2. **Log everything** - You need to debug async operations
3. **Store write requests** - Track what was sent vs what succeeded
4. **Implement status endpoint** - Let users check if write completed
5. **Add notifications** - Alert users when settings are applied

---

## 🎯 Complete Write Example with Callback

```typescript
// 1. Send write command
const writeSettings = async () => {
  const response = await fetch(
    '/api/device/modbus/ES6G12345678/progziel01/write',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registers: {
          '5000': 300,
          '5001': 300
        }
      })
    }
  );
  
  const data = await response.json();
  console.log('✅ Command sent:', data.message);
  console.log('⏳ Waiting for callback...');
};

// 2. Listen for result (via WebSocket)
socket.on('modbus:write:complete', (data) => {
  console.log('📨 Write completed!');
  console.log('Results:', data.results);
  
  if (data.success) {
    alert('✅ Settings updated successfully!');
  } else {
    alert('❌ Some settings failed to update');
  }
});
```

---

## 🚨 Troubleshooting

### Callback Not Received
- ✅ Check callback URL is publicly accessible
- ✅ Verify URL in `.env` is correct
- ✅ Check firewall allows inbound POST requests
- ✅ Test callback manually with curl
- ✅ Check vendor API logs/status

### "success" Response Not Working
- Must be lowercase `"success"` string
- NOT: `{ "status": "success" }`
- NOT: `"Success"` or `"SUCCESS"`
- Just: `"success"`

---

Your write functionality is now **complete with full callback support**! 🎉

