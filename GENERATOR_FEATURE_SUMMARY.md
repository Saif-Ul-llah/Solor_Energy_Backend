# Generator Feature - Complete Implementation Summary

## ✅ What Was Implemented

### 🎯 Smart Generator Detection

Your energy flow API now **automatically** includes/excludes the Generator field based on two Modbus registers:

1. **Register 2122 (0x2122)** - GEN Port Configuration
   - Must be `1` (Generator Input)

2. **Register 2156 (0x2156)** - Generator Dry Force ON/OFF
   - Must NOT be `2` (Forced OFF)

---

## 📊 Decision Logic

```
Generator Appears in Flow When:
  ✅ GEN Port = 1 (Generator Input)
  AND
  ✅ Gen Force ≠ 2 (Not forced OFF)

Otherwise:
  ❌ Generator field is excluded from response
```

---

## 🚀 New API Endpoints

### 1. Get Generator Status
```bash
GET /api/device/generator/:sn/:memberId/status
```

Returns:
```json
{
  "enabled": true,
  "genPort": {
    "value": 1,
    "description": "Generator Input"
  },
  "genForce": {
    "value": 0,
    "description": "Auto"
  },
  "status": "Generator is ENABLED and operational"
}
```

### 2. Control Generator
```bash
POST /api/device/generator/:sn/:memberId/control
Body: { "mode": 0 }  // 0=Auto, 1=On, 2=Off
```

### 3. Enhanced Flow Diagram
```bash
GET /api/device/getDeviceDetails?sn=XXX
```

**Before (always included):**
```json
{
  "PV": 2500,
  "Grid": 1200,
  "Battery": 800,
  "Generator": 0,  // ← Always present, even if not configured
  "LoadConsumed": 4500
}
```

**After (conditionally included):**
```json
{
  "PV": 2500,
  "Grid": 1200,
  "Battery": 800,
  "Generator": 3000,  // ← Only present when configured AND enabled
  "LoadConsumed": 7500,
  "generatorStatus": {
    "genPort": 1,
    "genForce": 0,
    "enabled": true,
    "reason": "Generator enabled (Port=1, Force=0)"
  }
}
```

---

## 🔧 Register Details

### Register 2122 - GEN Port

| Value | Mode | When to Use |
|-------|------|-------------|
| 0 | Disable | No device connected to GEN port |
| 1 | **Generator Input** | Backup generator connected |
| 2 | Smart Load | Smart load device connected |
| 3 | Inverter Input | Another inverter connected |

### Register 2156 - Generator Force Control

| Value | Mode | Behavior |
|-------|------|----------|
| 0 | **Auto** | System controls generator automatically |
| 1 | **Force ON** | Generator runs continuously |
| 2 | **Force OFF** | Generator is disabled |

---

## 📝 Complete Usage Example

```typescript
// 1. Check if generator is configured
const status = await fetch(
  '/api/device/generator/ES6G12345678/progziel01/status'
).then(r => r.json());

console.log('Generator enabled?', status.data.enabled);

// 2. If not configured, configure it
if (status.data.genPort.value !== 1) {
  // Set GEN Port to Generator
  await fetch('/api/device/modbus/ES6G12345678/progziel01/write', {
    method: 'POST',
    body: JSON.stringify({
      registers: { '2122': 1 }
    })
  });
}

// 3. Control generator
await fetch('/api/device/generator/ES6G12345678/progziel01/control', {
  method: 'POST',
  body: JSON.stringify({ mode: 1 }) // Turn ON
});

// 4. Wait for callback (60-600s)
setTimeout(async () => {
  // 5. Check flow diagram
  const flow = await fetch(
    '/api/device/getDeviceDetails?sn=ES6G12345678'
  ).then(r => r.json());
  
  if (flow.data.Generator !== undefined) {
    console.log('✅ Generator is active!');
    console.log('Power:', flow.data.Generator, 'W');
  }
}, 90000); // Wait 90 seconds
```

---

## 🎨 Frontend Rendering Logic

```typescript
// Simple: Just check if field exists
const EnergyFlow = ({ data }: { data: EnergyFlowData }) => {
  return (
    <div>
      <Source icon="☀️" value={data.PV} label="Solar" />
      <Source icon="⚡" value={data.Grid} label="Grid" />
      <Source icon="🔋" value={data.Battery} label="Battery" />
      
      {/* Generator only appears if enabled */}
      {data.Generator !== undefined && (
        <Source icon="⛽" value={data.Generator} label="Generator" />
      )}
      
      <Load value={data.LoadConsumed} label="Load" />
    </div>
  );
};
```

---

## 🔍 Debugging

### Check Register Values
```bash
# Read both generator registers
GET /api/device/modbus/SN/MEMBER/read?registers=2122,2156

# Response shows current values
{
  "data": {
    "Generator Setting": {
      "GEN Port": {
        "value": 1,
        "description": "0=Disable, 1=Generator, 2=Smart Load, 3=Inverter"
      },
      "Generator Dry force ON/OFF": {
        "value": 0,
        "description": "0=Auto, 1=On, 2=Off"
      }
    }
  }
}
```

### Monitor Server Logs
```bash
# When getDeviceDetails is called, you'll see:
🔌 Generator Status for ES6G12345678: {
  genPort: 1,
  genForce: 0,
  enabled: true,
  reason: 'Generator enabled (Port=1, Force=0)'
}
```

---

## 📋 API Quick Reference

| Action | Endpoint | Body |
|--------|----------|------|
| **Check Status** | `GET /generator/:sn/:memberId/status` | - |
| **Set Auto** | `POST /generator/:sn/:memberId/control` | `{"mode": 0}` |
| **Force ON** | `POST /generator/:sn/:memberId/control` | `{"mode": 1}` |
| **Force OFF** | `POST /generator/:sn/:memberId/control` | `{"mode": 2}` |
| **Configure Port** | `POST /modbus/:sn/:memberId/write` | `{"registers": {"2122": 1}}` |
| **Get Flow** | `GET /getDeviceDetails?sn=:sn` | - |

---

## 💡 Best Practices

1. **Check status before controlling** - Know current state before changing
2. **Wait for callbacks** - Changes take 60-600 seconds to apply
3. **Refresh UI** - Poll status after control commands
4. **Log all actions** - Automatically logged for audit trail
5. **Handle gracefully** - Generator field may be absent, check before rendering

---

## 🎉 Summary

Your Generator feature is now:

✅ **Intelligent** - Auto-detects configuration  
✅ **Dynamic** - Field appears/disappears based on settings  
✅ **Controllable** - Dedicated ON/OFF/Auto endpoints  
✅ **Monitored** - Status endpoint shows full configuration  
✅ **Logged** - All actions tracked in system logs  
✅ **Frontend-ready** - Clean, predictable API responses  

The Generator will automatically show up in your energy flow diagram only when it's actually configured and enabled! 🚀

