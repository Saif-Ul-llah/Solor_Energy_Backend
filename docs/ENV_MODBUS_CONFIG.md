# Environment Variables for Modbus Integration

## Add to your `.env` file:

```bash
# ==================== MODBUS CONFIGURATION ====================

# Modbus Write Callback URL (REQUIRED for write operations)
# This URL will receive the write operation results from the vendor
# Must be publicly accessible (use ngrok for local development)
MODBUS_CALLBACK_URL=https://your-domain.com/api/device/modbus/callback/write-result

# For local development with ngrok:
# MODBUS_CALLBACK_URL=https://abc123.ngrok.io/api/device/modbus/callback/write-result
```

---

## 🔧 Setup Instructions

### For Production:
```bash
# Use your actual domain
MODBUS_CALLBACK_URL=https://api.yourcompany.com/api/device/modbus/callback/write-result
```

### For Development (using ngrok):

**Step 1:** Install ngrok
```bash
npm install -g ngrok
```

**Step 2:** Start your server
```bash
npm run dev
# Server running on http://localhost:5000
```

**Step 3:** Expose with ngrok
```bash
ngrok http 5000
```

**Step 4:** Copy the ngrok URL
```
Forwarding: https://abc123.ngrok.io -> http://localhost:5000
```

**Step 5:** Update `.env`
```bash
MODBUS_CALLBACK_URL=https://abc123.ngrok.io/api/device/modbus/callback/write-result
```

**Step 6:** Restart your server
```bash
# Ctrl+C to stop
npm run dev
```

---

## 🧪 Testing Callback URL

### Test 1: Verify URL is Accessible
```bash
curl -X POST "https://your-domain.com/api/device/modbus/callback/write-result" \
  -H "Content-Type: application/json" \
  -d '{
    "GoodsID": "TEST123",
    "operate": "write",
    "modbusInfo": "{\"5000\":\"1\"}",
    "SystemTime": "2023-10-01 12:00:00"
  }'

# Expected response: "success"
```

### Test 2: Monitor Callback in Logs
```bash
# Watch your server logs
# You should see:
# 📨 Modbus Write Callback Received: {...}
# 📥 Processing Modbus Write Callback: {...}
# ✅ Modbus Write Results: {...}
```

---

## 🌐 Alternative: Use Existing Domain

If you already have the backend deployed:

```bash
# Production
MODBUS_CALLBACK_URL=https://api.yourcompany.com/api/device/modbus/callback/write-result

# Staging
MODBUS_CALLBACK_URL=https://staging-api.yourcompany.com/api/device/modbus/callback/write-result
```

---

## ⚠️ Important Notes

1. **URL must be HTTPS** (most vendors require secure callbacks)
2. **URL must be publicly accessible** (vendor servers need to reach it)
3. **No authentication on callback** (vendor doesn't send auth headers)
4. **Response must be exact string** `"success"` (lowercase, no JSON)
5. **Callback can retry** for up to 600 seconds if no success response

---

## 🔒 Security Recommendations

### Option 1: IP Whitelisting
```typescript
// In modbusWriteCallback controller
const allowedIPs = [
  '1.2.3.4',     // Vendor IP 1
  '5.6.7.8',     // Vendor IP 2
];

const clientIP = req.ip || req.connection.remoteAddress;
if (!allowedIPs.includes(clientIP)) {
  return res.status(403).send('Forbidden');
}
```

### Option 2: Request Signing (if vendor supports)
```typescript
// Verify signature in callback
const expectedSign = crypto
  .createHash('md5')
  .update(`${GoodsID}${operate}${SECRET_KEY}`)
  .digest('hex');

if (req.body.Sign !== expectedSign) {
  return res.status(403).send('Invalid signature');
}
```

### Option 3: Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const callbackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Max 100 callbacks per minute
});

router.post('/modbus/callback/write-result', callbackLimiter, ...);
```

---

## 📊 Monitoring Callbacks

### Create Dashboard Query
```typescript
// Get recent Modbus write operations
const getRecentModbusWrites = async (serialNumber?: string) => {
  const logs = await prisma.logs.findMany({
    where: {
      action: 'MODBUS_WRITE_RESULT',
      ...(serialNumber && {
        description: {
          contains: serialNumber
        }
      })
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  
  return logs;
};
```

---

## 🎯 Complete .env Example

```bash
# Your existing variables
CLOUD_BASEURL=https://eu.uzenergy-portal.com
SERVICE_ACCOUNT_ID=your_service_account
SERVICE_ACCOUNT_PASS=your_service_password
MONITOR_ACCOUNT_PASSWORD=monitor_password

# NEW: Modbus callback configuration
MODBUS_CALLBACK_URL=https://your-domain.com/api/device/modbus/callback/write-result

# For local dev with ngrok:
# MODBUS_CALLBACK_URL=https://abc123.ngrok.io/api/device/modbus/callback/write-result
```

---

## ✅ Verification Checklist

- [ ] MODBUS_CALLBACK_URL added to `.env`
- [ ] URL is publicly accessible
- [ ] Callback endpoint exists at the URL
- [ ] Callback responds with `"success"` string
- [ ] Server logs show callback received
- [ ] Test with manual curl command
- [ ] Test end-to-end write operation
- [ ] Monitor logs for 10 minutes after write
- [ ] Verify writes are actually applied to inverter

---

**Ready to test!** 🚀

Set up ngrok, update your `.env`, and try writing some registers!

